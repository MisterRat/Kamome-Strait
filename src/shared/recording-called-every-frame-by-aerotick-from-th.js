/* recording, called every frame by aeroTick from the first real step */
function rpRecord(c, A) {
  if ((trn.step < 1 && !AERO_DEF[trn.mode].drone) || trn.done) return;
  if (AERO_DEF[trn.mode].drone && !A.tgt) return;
  if (!A.rec) {
    A.rec = [];
    A.rp0 = pos.clone();
    A.rH = A.h0.clone();
    A.rv0 = vel.length();
    A.rvel = vel.clone();
    A.rthr = thr;
    {
      const e0 = A.tgt && A.tgt.e;
      if (e0) A.rE = { sp: e0.sp, alt: e0.alt, yaw: e0.yaw || 0 };
    }
    A.rt0 = trn.t;
    A.rAcc = 1;
  }
  A.rAcc += c.dt;
  if (A.rAcc < 0.1 || A.rec.length >= 1400) return;
  A.rAcc = 0;
  const e = A.tgt && A.tgt.e;
  A.rec.push({ t: trn.t - A.rt0, p: pos.clone(), q: q.clone(), g: gF, k: c.kmh, d: e ? e.p.clone() : null, dq: e ? e.q.clone() : null });
}
function rpQ(f, u) {
  const r = new V().crossVectors(f, u).normalize(),
    uu = new V().crossVectors(r, f).normalize();
  m4.makeBasis(r, uu, f.clone().negate());
  return new Q().setFromRotationMatrix(m4);
}
