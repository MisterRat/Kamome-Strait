/* the best path is flown by the sim itself: a scripted pilot flies the same maneuver with the real flight model from YOUR starting
   position, speed and attitude, following the same green aim target the player sees. Nothing is drawn that the aircraft cannot do. */
function rpBotCtl(m, A2, hc) {
  const bank = Math.atan2(-right.y, up.y) * 57.3,
    pit = Math.asin(Math.max(-1, Math.min(1, fwd.y))) * 57.3,
    st = trn.step,
    cl = (x) => Math.max(-1, Math.min(1, x));
  let p = 0,
    r = 0,
    th = 1;
  const point = (gMax) => {
    const a = A2.aim;
    if (!a) return;
    const tb = a.dir.clone().applyQuaternion(q.clone().invert()),
      ang = Math.acos(Math.max(-1, Math.min(1, -tb.z))),
      err = Math.atan2(tb.x, tb.y);
    r = ang > 0.04 ? cl(err * 1.2) : cl(-bank * 0.02);
    p = cl(Math.min(1, ang * 3) * Math.max(0, Math.cos(err)));
    if (gF > gMax) p *= Math.max(0, 1 - (gF - gMax) * 0.5);
    if (buffet > 0.05) p *= 0.5;
  };
  if (m === 'immelmann') {
    const G = hc ? 5 : 4;
    if (st === 0) p = cl(-pit * 0.1);
    else if (st <= 2) p = cl(0.4 + 0.35 * (G - gF));
    else if (st === 3) (p = cl(0.2 + 0.3 * (1.5 - gF))), (r = bank > 0 ? -1 : 1);
    else (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
  } else if (m === 'splits') {
    const G = hc ? 4.5 : 3.5;
    th = st >= 3 ? 0.8 : 0;
    if (st === 0) (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
    else if (st === 1) (r = bank >= 0 ? 1 : -1), (p = 0.05);
    else if (st === 2) p = cl(0.5 + 0.3 * (G - gF));
    else (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
  } else if (m === 'barrel') {
    const sg = A2.sg || 1;
    if (st === 0) (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
    else if (st === 1) p = cl((22 - pit) * 0.1);
    else if (st === 2) (r = sg), (p = cl(0.25 + 0.15 * (1.2 - gF)));
    else (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
  } else if (m === 'wingover') {
    if (st === 0) (p = cl(-pit * 0.1)), (r = cl(-bank * 0.05));
    else point(4.2);
  } else {
    const T = A2.tgt;
    th = m === 'highyoyo' && T && T.d < 500 ? 0.6 : 1;
    point(4.5);
  }
  return { p, r, th };
}
function rpSim(m, A) {
  const rec0 = A.rec[0],
    last = A.rec[A.rec.length - 1],
    drone = !!AERO_DEF[m].drone,
    sv = {
      pos: pos.clone(),
      vel: vel.clone(),
      q: q.clone(),
      thr,
      s: Object.assign({}, s),
      pad: { p: pad.p, r: pad.r, y: pad.y },
      step: trn.step,
      a: trn.a,
      done: trn.done,
      sum: trn.sum,
      t: trn.t,
      title: trn.title,
      EN: EN.slice(),
      crashed,
      gF,
      stalled,
      buffet,
      onGround,
      eT: FM.eT,
      fuel: FM.fuel,
      wind: FM.opt.wind,
      turb: FM.opt.turb,
      trim: Object.assign({}, TRIM),
      paused,
    };
  const out = [];
  let ok = false;
  try {
    pos.copy(rec0.p);
    q.copy(rec0.q);
    vel.copy(A.rvel);
    thr = A.rthr;
    Object.assign(s, { p: 0, r: 0, y: 0 });
    FM.opt.wind = false;
    FM.opt.turb = false;
    crashed = false;
    onGround = false;
    const A2 = aeroNew(m);
    A2.hc = A.hc;
    A2.sg = A.rSide || 1;
    A2.dh = 0.001 * A2.sg;
    trn.a = A2;
    trn.step = 0;
    trn.done = false;
    trn.t = 0;
    let e2 = null;
    if (drone) {
      const dF = new V(0, 0, -1).applyQuaternion(rec0.dq);
      e2 = { drone: true, dying: false, p: rec0.d.clone(), q: rec0.dq.clone(), fwd: dF, v: dF.clone().multiplyScalar(A.rE.sp), sp: A.rE.sp, yaw: A.rE.yaw, alt: A.rE.alt };
      EN.length = 0;
      EN.push(e2);
    }
    const dt = 1 / 60;
    step(dt);
    for (let i = 0; i < 3000 && !trn.done; i++) {
      const c = { dt, kmh: (FM.ias || vel.length()) * 3.6, agl: pos.y - 2 - H(pos.x, pos.z), gnd: false, pitch: Math.asin(Math.max(-1, Math.min(1, fwd.y))) * 57.3, R: Math.round, T0: () => {}, name: '', footer: '', flapDeg: 0 };
      if (e2) {
        const om = (9.8 * Math.tan(0.6)) / Math.max(e2.sp, 30);
        e2.yaw += om * dt;
        e2.fwd.set(-Math.sin(e2.yaw), 0, -Math.cos(e2.yaw));
        e2.q.setFromAxisAngle(UPV, e2.yaw).multiply(new Q().setFromAxisAngle(new V(0, 0, 1), 0.6));
        e2.v.copy(e2.fwd).multiplyScalar(e2.sp);
        e2.p.addScaledVector(e2.v, dt);
        e2.p.y = e2.alt;
      }
      const ct = rpBotCtl(m, A2, A.hc);
      pad.p = ct.p;
      pad.r = ct.r;
      thr = ct.th;
      step(dt);
      FM.eT = 0;
      trn.t += dt;
      aeroRun(c, m);
      if (crashed) break;
      if (i % 6 === 0) out.push({ p: pos.clone(), f: fwd.clone(), u: up.clone(), t: i * dt, v: vel.length(), d: e2 ? e2.p.clone() : null });
    }
    RPL.dbg = { st: trn.step, t: trn.t, crashed, T: trn.a.tgt && { d: trn.a.tgt.d, dy: trn.a.tgt.dy, ata: trn.a.tgt.ata, cl: trn.a.tgt.closing }, k: (FM.ias || 0) * 3.6, n: out.length };
    ok = trn.done && !crashed;
    if (ok) out.push({ p: pos.clone(), f: fwd.clone(), u: up.clone(), t: trn.t, v: vel.length(), d: e2 ? e2.p.clone() : null });
  } catch (er) {
    ok = false;
    RPL.err = String(er && er.stack);
  }
  pos.copy(sv.pos);
  vel.copy(sv.vel);
  q.copy(sv.q);
  thr = sv.thr;
  Object.assign(s, sv.s);
  Object.assign(pad, sv.pad);
  trn.step = sv.step;
  trn.a = sv.a;
  trn.done = sv.done;
  trn.sum = sv.sum;
  trn.t = sv.t;
  trn.title = sv.title;
  EN.length = 0;
  sv.EN.forEach((e) => EN.push(e));
  crashed = sv.crashed;
  gF = sv.gF;
  stalled = sv.stalled;
  buffet = sv.buffet;
  onGround = sv.onGround;
  FM.eT = sv.eT;
  FM.fuel = sv.fuel;
  FM.opt.wind = sv.wind;
  FM.opt.turb = sv.turb;
  Object.assign(TRIM, sv.trim);
  paused = sv.paused;
  axes();
  A.rIdealG = m === 'immelmann' ? (A.hc ? 5 : 4) : m === 'splits' ? (A.hc ? 4.5 : 3.5) : 3;
  return ok && out.length > 5 ? out : null;
}
function rpSamp(arr, t, fn) {
  /* arr sorted by .t: returns interpolation info */
  let lo = 0,
    hi = arr.length - 1;
  if (t <= arr[0].t) return { a: arr[0], b: arr[0], k: 0 };
  if (t >= arr[hi].t) return { a: arr[hi], b: arr[hi], k: 0 };
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= t) lo = mid;
    else hi = mid;
  }
  return { a: arr[lo], b: arr[hi], k: (t - arr[lo].t) / Math.max(1e-6, arr[hi].t - arr[lo].t) };
}
function rpBuild(m, A) {
  const rec = A.rec;
  if (!rec || rec.length < 5) return false;
  /* the side chosen: the way you rolled / turned */
  const last = rec[rec.length - 1],
    rt = new V().crossVectors(A.rH, UPV).normalize();
  A.rSide = Math.sign(A.dir || A.dh || 1) || 1;
  const I = rpSim(m, A),
    R = RPL;
  R.gpl = null;
  if (!I) {
    R.rec = rec;
    R.ideal = null;
    R.A = A;
    R.m = m;
    R.T = last.t;
    R.gap = null;
    const pts = rec.map((s) => s.p),
      mn = new V(1e9, 1e9, 1e9),
      mx = new V(-1e9, -1e9, -1e9);
    pts.forEach((p) => (mn.min(p), mx.max(p)));
    R.ctr.copy(mn).add(mx).multiplyScalar(0.5);
    R.rad = Math.max(120, mn.distanceTo(mx) * 0.5);
    R.dist = R.rad * 1.75;
    R.H = A.rH.clone();
    R.rt = rt;
    R.tips = [
      'No best path is shown: the sim pilot could not complete this maneuver from your exact entry state (' + Math.round(rec[0].k) + ' km/h), so I will not draw a path the aircraft cannot fly.',
      'You took ' + last.t.toFixed(1) + ' s, slowest ' + Math.round(Math.min(...rec.map((s) => s.k))) + ' km/h, peak ' + Math.max(...rec.map((s) => s.g)).toFixed(1) + ' G.',
    ];
    return true;
  }
  R.rec = rec;
  R.ideal = I;
  R.A = A;
  R.m = m;
  R.T = Math.max(last.t, I[I.length - 1].t);
  /* the gap between the two paths */
  const iEnd = I[I.length - 1].t + 1,
    dev = rec.map((s) => {
    if (s.t > iEnd) return { d: 0, j: I.length - 1 };
    let b = 1e9,
      bj = 0;
    for (let j = 0; j < I.length; j++) {
      const d = s.p.distanceTo(I[j].p);
      if (d < b) (b = d), (bj = j);
    }
    return { d: b, j: bj };
  });
  R.dev = dev;
  let bi = 0;
  dev.forEach((d, i) => d.d > dev[bi].d && (bi = i));
  R.gap = { i: bi, d: dev[bi].d, j: dev[bi].j, pct: Math.round((100 * rec[bi].t) / Math.max(0.1, last.t)) };
  /* the camera frame: the middle of everything and how far away to stand */
  const pts = rec.map((s) => s.p).concat(I.map((o) => o.p));
  const mn = new V(1e9, 1e9, 1e9),
    mx = new V(-1e9, -1e9, -1e9);
  pts.forEach((p) => (mn.min(p), mx.max(p)));
  R.ctr.copy(mn).add(mx).multiplyScalar(0.5);
  R.rad = Math.max(120, mn.distanceTo(mx) * 0.5);
  R.dist = R.rad * 1.75;
  R.H = A.rH.clone();
  R.rt = rt;
  R.tips = rpTips(m, A, rec, I, R);
  return true;
}
function rpTips(m, A, rec, I, R) {
  const t = [],
    y0 = A.rp0.y,
    rt = R.rt,
    R0 = Math.round,
    gAvg = rec.reduce((a, s) => a + s.g, 0) / rec.length,
    yPk = Math.max(...rec.map((s) => s.p.y)) - y0,
    iPk = Math.max(...I.map((o) => o.p.y)) - y0,
    yMn = y0 - Math.min(...rec.map((s) => s.p.y)),
    iMn = y0 - Math.min(...I.map((o) => o.p.y)),
    lat = Math.max(...rec.map((s) => Math.abs(s.p.clone().sub(A.rp0).dot(rt)))),
    latS = rec.reduce((b, s) => (Math.abs(s.p.clone().sub(A.rp0).dot(rt)) > Math.abs(b) ? s.p.clone().sub(A.rp0).dot(rt) : b), 0),
    T = rec[rec.length - 1].t,
    iT = I[I.length - 1].t,
    len = rec.reduce((a, s, i) => (i ? a + s.p.distanceTo(rec[i - 1].p) : 0), 0),
    iLen = I.reduce((a, o, i) => (i ? a + o.p.distanceTo(I[i - 1].p) : 0), 0),
    ph = (x, d) => (x > 0 ? 'right' : 'left');
  t.push('Biggest gap from the best path: ' + R0(R.gap.d) + ' m, ' + R.gap.pct + '% of the way through (the red marker).');
  t.push('The best path is flown by the sim itself from your entry state: ' + iT.toFixed(1) + ' s against your ' + T.toFixed(1) + ' s.');
  if (m === 'immelmann' || m === 'splits') {
    const hgt = m === 'immelmann' ? yPk : yMn,
      ihgt = m === 'immelmann' ? iPk : iMn,
      word = m === 'immelmann' ? 'climbed' : 'dropped';
    if (hgt > ihgt * 1.2) t.push('Your loop ' + word + ' ' + R0(hgt) + ' m against about ' + R0(ihgt) + ' m for the best path: the loop was too wide. Average G ' + gAvg.toFixed(1) + ' against about ' + A.rIdealG + ': pull harder early and keep it up to the top.');
    else if (hgt < ihgt * 0.8) t.push('Your loop only ' + word + ' ' + R0(hgt) + ' m against about ' + R0(ihgt) + ' m for the best path: you cut it short or pulled very tight. Hold a steady pull all the way round.');
    else t.push('Loop size was good: ' + R0(hgt) + ' m against about ' + R0(ihgt) + ' m for the best path.');
    if (lat > 60) t.push('You drifted ' + R0(lat) + ' m to the ' + ph(latS) + ' of the loop plane. Keep the wings level while you pull' + (A.hc ? ' (in Hardcore, use rudder against torque)' : '') + '.');
    const ex = rec[rec.length - 1].k,
      ix = I[I.length - 1].v * 3.6 * 0 + 0;
    t.push('You started the pull at ' + R0(rec[0].k) + ' km/h and finished at ' + R0(ex) + ' km/h' + (m === 'immelmann' ? ' (slowest ' + R0(Math.min(...rec.map((s) => s.k))) + ').' : '.'));
  } else if (m === 'barrel') {
    const lr = lat,
      il = Math.max(...I.map((o) => Math.abs(o.p.clone().sub(A.rp0).dot(rt)))),
      ih = Math.max(...I.map((o) => o.p.y)) - y0;
    if (lr < il * 0.65) t.push('Your barrel was only ' + R0(lr) + ' m wide, the best path is about ' + R0(il) + ' m: keep a little pull while rolling so the nose circles round the green target instead of just rolling in place.');
    else if (lr > il * 1.5) t.push('Your barrel was ' + R0(lr) + ' m wide, the best path is about ' + R0(il) + ' m: use less pull while rolling.');
    else t.push('Barrel size was good: ' + R0(lr) + ' m wide against about ' + R0(il) + ' m for the best path.');
    t.push('You rose ' + R0(yPk) + ' m above the start (best path about ' + R0(ih) + ' m).');
    const endDy = rec[rec.length - 1].p.y - y0;
    t.push('You finished ' + R0(Math.abs(endDy)) + ' m ' + (endDy >= 0 ? 'above' : 'below') + ' where you started. Lowest G ' + Math.min(...rec.map((s) => s.g)).toFixed(1) + '.');
  } else if (m === 'wingover') {
    t.push('Your peak was ' + R0(yPk) + ' m above the start against about ' + R0(iPk) + ' m for the best path' + (yPk < iPk * 0.6 ? ': start the climbing turn harder and steeper.' : yPk > iPk * 1.5 ? ': too much climb, you lose speed.' : '.'));
    t.push('You took ' + T.toFixed(1) + ' s against about ' + iT.toFixed(1) + ' s, slowest speed ' + R0(Math.min(...rec.map((s) => s.k))) + ' km/h.');
  } else {
    const low = m === 'lowyoyo',
      dm = rec.map((s) => (s.d ? s.p.y - s.d.y : 0)),
      idm = I.map((o) => (o.d ? o.p.y - o.d.y : 0)),
      iext = low ? -Math.min(...idm) : Math.max(...idm),
      ext = low ? Math.min(...dm) : Math.max(...dm);
    t.push(low ? 'Your dive went ' + R0(-ext) + ' m below him; the best path dips about ' + R0(iext) + ' m.' : 'You climbed ' + R0(ext) + ' m above him; the best path climbs about ' + R0(iext) + ' m.');
    t.push('Your path was ' + R0(len) + ' m long against about ' + R0(iLen) + ' m for the best path' + (len > iLen * 1.25 ? ': you flew too wide, cut across his turn earlier.' : '.'));
    t.push('You took ' + T.toFixed(1) + ' s. Closest approach ' + R0(A.minRange) + ' m.');
  }
  return t;
}
