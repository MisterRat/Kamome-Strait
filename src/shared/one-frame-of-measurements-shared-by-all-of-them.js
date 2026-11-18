/* one frame of measurements shared by all of them */
function aeroTick(c, def) {
  const A = trn.a;
  const bank = Math.atan2(-right.y, up.y) * 57.3,
    hdg = Math.atan2(fwd.x, -fwd.z) * 57.3;
  if (!A.init) {
    A.init = true;
    A.pb = bank;
    A.ph = hdg;
    A.y0 = pos.y;
  }
  /* until the first real step the reference heading follows you, so the loop angle is measured along your own track */
  if (trn.step === 0) {
    const hl = Math.hypot(fwd.x, fwd.z) || 1;
    A.h0.set(fwd.x / hl, 0, fwd.z / hl);
    A.hdg0 = hdg;
    A.roll = 0;
    A.loop = 0;
    A.dh = 0;
    A.dir = 0;
    A.y0 = pos.y;
    A.entK = 0;
    A.gPk = 0;
    A.maxG = 0;
    A.minG = 9;
    A.minKmh = 1e9;
    A.maxKmh = 0;
    A.minAgl = 1e9;
    A.topKmh = 0;
  } else {
    const hv = fwd.x * A.h0.x + fwd.z * A.h0.z,
      ph = Math.atan2(fwd.y, hv) * 57.3;
    A.loop += wrap180(ph - A.pl);
    A.pl = ph;
    A.roll += wrap180(bank - A.pb);
    A.dh += wrap180(hdg - A.ph);
    A.maxG = Math.max(A.maxG, gF);
    A.minG = Math.min(A.minG, gF);
    A.minKmh = Math.min(A.minKmh, c.kmh);
    A.maxKmh = Math.max(A.maxKmh, c.kmh);
    A.minAgl = Math.min(A.minAgl, c.agl);
    if (A.loop > 60 || Math.abs(A.roll) > 60) A.topKmh = A.topKmh ? Math.min(A.topKmh, c.kmh) : c.kmh;
  }
  {
    const hv = fwd.x * A.h0.x + fwd.z * A.h0.z;
    if (trn.step === 0) A.pl = Math.atan2(fwd.y, hv) * 57.3;
  }
  if (trn.step === 1 && !A.entK) A.entK = c.kmh;
  if (trn.step >= 1 && A.loop < 60) A.gPk = Math.max(A.gPk || 0, gF);
  if (stalled && !A.wasSt && trn.step >= 1) {
    A.pm = true;
    A.pmT = 20;
    A.pmG = gF;
    A.pmThr = thr;
    A.pmTxt = aeroStallReport(c, A);
  }
  rpRecord(c, A);
  A.wasSt = stalled;
  if (A.pmT > 0) A.pmT -= c.dt;
  A.pb = bank;
  A.ph = hdg;
  A.bank = bank;
  A.hdg = hdg;
  if (!A.dir && Math.abs(A.roll) > 25) A.dir = Math.sign(A.roll);
}
