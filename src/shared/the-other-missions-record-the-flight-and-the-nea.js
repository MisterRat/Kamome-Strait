/* the other missions: record the flight (and the nearest bandit) and the point of the guide route you were nearest to */
function rpAvail() {
  const m = trn.mode,
    r = AERO[m] ? trn.a && trn.a.rec : trn.rec;
  if (RPL.busy) return false;
  if (!AERO[m] && RPL.mc && RPL.mc.m === m && !(r && r.length > 4) && trn.t < 10) return true; /* the mission was restarted: the last run can still be watched */
  return !!(r && r.length > 4 && m !== 'free');
}
function rpRecGen(dt, last) {
  if (!trn.rec) {
    trn.rec = [];
    trn.recAcc = 9;
    trn.rt0 = trn.t;
  }
  trn.recAcc += dt;
  if (!last && (trn.recAcc < 0.4 || trn.rec.length >= 1500)) return;
  trn.recAcc = 0;
  const e = EN.find((x) => !x.dying);
  let gp = null;
  if (guide.pts.length > 1) {
    try {
      const gs = guideState(),
        o = guide.pts[Math.min(guide.pts.length - 1, gs.bi)];
      gp = new V(o.x, o.y, o.z);
    } catch (er) {}
  }
  trn.rec.push({ t: trn.t - trn.rt0, p: pos.clone(), q: q.clone(), g: gF, k: (FM.ias || vel.length()) * 3.6, d: e ? e.p.clone() : null, dq: e ? e.q.clone() : null, gp });
}
function rpBuildGen(m) {
  const mc = RPL.mc;
  if (!mc || mc.m !== m || !mc.rec || mc.rec.length < 5) return false;
  const rec = mc.rec,
    I = mc.ideal,
    R = RPL,
    last = rec[rec.length - 1],
    R0 = Math.round;
  R.rec = rec;
  R.ideal = I;
  R.gpl = null;
  R.A = mc;
  R.m = m;
  R.T = Math.max(last.t, I ? I[I.length - 1].t : 0);
  R.gap = null;
  R.dev = null;
  if (I && (m === 'takeoff' || m === 'landing')) {
    /* same runway, same start: the gap between the two paths means something */
    const iEnd = I[I.length - 1].t + 1;
    let bi = -1,
      bd = 0,
      bj = 0;
    rec.forEach((sm, i) => {
      if (sm.t > iEnd) return;
      let b = 1e9,
        j0 = 0;
      for (let j = 0; j < I.length; j += 2) {
        const d = sm.p.distanceTo(I[j].p);
        if (d < b) (b = d), (j0 = j);
      }
      if (b > bd) (bd = b), (bi = i), (bj = j0);
    });
    if (bi >= 0) R.gap = { i: bi, d: bd, j: bj, pct: R0((100 * rec[bi].t) / Math.max(0.1, last.t)) };
  }
  const pts = rec.map((sm) => sm.p).concat(I ? I.map((o) => o.p) : []);
  const mn = new V(1e9, 1e9, 1e9),
    mx = new V(-1e9, -1e9, -1e9);
  pts.forEach((pp) => (mn.min(pp), mx.max(pp)));
  R.ctr.copy(mn).add(mx).multiplyScalar(0.5);
  R.rad = Math.max(150, mn.distanceTo(mx) * 0.5);
  R.dist = R.rad * 1.75;
  const f0 = new V(0, 0, -1).applyQuaternion(rec[0].q);
  f0.y = 0;
  if (f0.lengthSq() < 1e-4) f0.set(0, 0, -1);
  R.H = f0.normalize();
  R.rt = new V().crossVectors(R.H, UPV).normalize();
  const t = [],
    stat = (arr, kf, gf) => ({
      len: arr.reduce((a, o, i) => (i ? a + o.p.distanceTo(arr[i - 1].p) : 0), 0),
      mxk: Math.max(...arr.map(kf)),
      yMx: Math.max(...arr.map((o) => o.p.y)),
      gMx: Math.max(...arr.map(gf)),
      T: arr[arr.length - 1].t,
    }),
    me = stat(rec, (o) => o.k, (o) => o.g);
  t.push('You: ' + fmtT(me.T) + ', ' + (me.len / 1000).toFixed(1) + ' km, top speed ' + R0(me.mxk) + ' km/h, peak ' + me.gMx.toFixed(1) + ' G, highest ' + R0(me.yMx) + ' m.');
  if (mc.sum) t.push('Your result: ' + mc.sum.replace(/\n/g, ' '));
  if (I) {
    const si = stat(I, (o) => o.k, (o) => o.g);
    t.push('Best (the sim pilot, same aircraft and flight model, same mission): ' + fmtT(si.T) + ', ' + (si.len / 1000).toFixed(1) + ' km, top speed ' + R0(si.mxk) + ' km/h, peak ' + si.gMx.toFixed(1) + ' G.');
    if (mc.simSum) t.push('Best result: ' + mc.simSum.replace(/\n/g, ' '));
    if (m === 'takeoff') {
      const lift = (arr) => {
        for (const o of arr) if (o.p.y - 2 - H(o.p.x, o.p.z) > 1.5) return o;
        return null;
      };
      const a = lift(rec),
        b = lift(I);
      if (a && b) t.push('You left the ground after ' + a.t.toFixed(1) + ' s and ' + R0(420 - a.p.z) + ' m at ' + R0(a.k) + ' km/h; the sim pilot after ' + b.t.toFixed(1) + ' s and ' + R0(420 - b.p.z) + ' m at ' + R0(b.k) + ' km/h.');
    }
    if (R.gap) t.push('Biggest gap between the two paths: ' + R0(R.gap.d) + ' m, ' + R.gap.pct + '% of the way through (the red marker).');
    if (me.T > si.T * 1.25) t.push('Your run took ' + R0((100 * (me.T - si.T)) / si.T) + '% longer than the sim pilot\'s: look for slack in the set-up, not just the finish.');
    if (m === 'dogfight' || m === 'convoy' || m === 'bomb') t.push('Bandits, vehicles and wind are not identical in every run, so use the path for its shape: how the sim pilot positioned itself, not exact points.');
  } else {
    t.push('No best path is shown: ' + (mc.why || 'the sim pilot could not finish this mission') + ', so I will not draw a path the aircraft cannot fly. Orange is your flight' + (rec.some((o) => o.d) ? ', grey is the bandit.' : '.'));
  }
  R.tips = t;
  return true;
}
