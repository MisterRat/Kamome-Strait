/* the green aim target: where the nose should point right now. Put the white reticle on it. */
function aeroAim(m, A) {
  const H = A.h0,
    rt = new V().crossVectors(H, UPV).normalize(),
    arc = (d) => H.clone().multiplyScalar(Math.cos(d / 57.3)).addScaledVector(UPV, Math.sin(d / 57.3)),
    turn = (psi, pit) =>
      H.clone().multiplyScalar(Math.cos(psi / 57.3)).addScaledVector(rt, Math.sin(psi / 57.3)).multiplyScalar(Math.cos(pit / 57.3)).addScaledVector(UPV, Math.sin(pit / 57.3)),
    st = trn.step,
    lev = arc(0);
  let dir = lev,
    lab = 'HOLD THE NOSE LEVEL';
  if (m === 'immelmann') {
    if (st === 0) lab = 'LEVEL, FULL POWER, GET THE SPEED';
    else if (st <= 2) (dir = arc(Math.min(180, Math.max(A.loop, 0) + 35))), (lab = 'PULL: FOLLOW THE GREEN TARGET ROUND');
    else (dir = arc(180)), (lab = 'ROLL UPRIGHT, NOSE TO THE HORIZON');
  } else if (m === 'splits') {
    if (st === 0) lab = 'LEVEL, THROTTLE CLOSED';
    else if (st === 1) lab = 'ROLL ONTO YOUR BACK';
    else if (st === 2) (dir = arc(Math.max(-180, A.loop - 35))), (lab = 'PULL: FOLLOW THE GREEN TARGET DOWN AND ROUND');
    else (dir = arc(-180)), (lab = 'LEVEL OUT HERE');
  } else if (m === 'barrel') {
    if (st === 0) lab = 'LEVEL, GET THE SPEED';
    else if (st === 1) (dir = arc(20)), (lab = 'NOSE UP TO HERE');
    else if (st === 2) {
      const f = ((A.roll + 55 * (A.dir || 1)) / 57.3),
        ctr = arc(8);
      dir = ctr.addScaledVector(rt, Math.sin(f) * 0.3).addScaledVector(UPV, Math.cos(f) * 0.3);
      lab = 'ROLL: KEEP THE NOSE ON THE TARGET AS IT CIRCLES';
    } else lab = 'ROLL OUT, NOSE LEVEL';
  } else if (m === 'wingover') {
    const sg = Math.sign(A.dh || A.bank || 1);
    if (st === 0) lab = 'LEVEL, FULL POWER';
    else if (st === 1) (dir = turn(40 * sg, 30)), (lab = 'CLIMBING TURN: NOSE HERE');
    else if (st === 2) (dir = turn(Math.min(180, Math.abs(A.dh) + 40) * sg, -8)), (lab = 'KEEP TURNING, LET THE NOSE FALL TO HERE');
    else (dir = turn(180 * sg, 0)), (lab = 'ROLL OUT ON THE REVERSE HEADING');
  } else {
    const T = A.tgt;
    if (!T) return null;
    const hf = new V(fwd.x, 0, fwd.z).normalize(),
      e = T.e,
      lead = e.p.clone().addScaledVector(e.v, T.d / Math.max(vel.length(), 100)),
      low = m === 'lowyoyo',
      toward = (pt) => pt.sub(pos).normalize();
    if (low) {
      if (st === 0) (dir = hf.clone().multiplyScalar(Math.cos(0.26)).addScaledVector(UPV, -Math.sin(0.26))), (lab = 'PUSH THE NOSE DOWN TO HERE');
      else if (st === 1) (dir = toward(lead.clone().add(new V(0, -120, 0)))), (lab = 'TURN TOWARD HIM: NOSE ON THE TARGET');
      else (dir = toward(lead)), (lab = 'PULL UP: PUT THE RETICLE ON THE TARGET');
    } else {
      if (st === 0) (dir = hf.clone().multiplyScalar(Math.cos(0.44)).addScaledVector(UPV, Math.sin(0.44))), (lab = 'PULL THE NOSE UP TO HERE');
      else if (st === 1) (dir = toward(lead.clone().add(new V(0, 170, 0)))), (lab = 'CLIMB TO HERE, ABOVE HIM');
      else (dir = toward(lead)), (lab = 'DROP ONTO HIM: PUT THE RETICLE ON THE TARGET');
    }
  }
  return { dir: dir.normalize(), lab };
}
const aimE = $$('aim'),
  aimT = $$('aimt');
function drawAim() {
  const A = trn.a,
    ok = A && A.aim && AERO[trn.mode] && !crashed && started && !trn.done && !paused;
  if (!ok) {
    aimE.style.display = aimT.style.display = 'none';
    return;
  }
  if (ringShown()) {
    /* the green ring is the guide now: only the step's label stays, under it */
    aimE.style.display = 'none';
    const ring = $$('fd');
    aimT.style.display = ring.style.display === 'block' ? 'block' : 'none';
    aimT.style.left = ring.style.left;
    aimT.style.top = parseFloat(ring.style.top) + 36 + 'px';
    aimT.textContent = A.aim.lab;
    return;
  }
  const d = A.aim.dir,
    pr = pos.clone().addScaledVector(d, 3000).project(cam),
    behind = pr.z > 1;
  let x = pr.x,
    y = pr.y;
  if (behind) {
    x = -x;
    y = -y;
  }
  const off = behind || Math.abs(x) > 0.9 || Math.abs(y) > 0.84;
  if (off) {
    const m = Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.84, 1e-3);
    x /= m;
    y /= m;
  }
  const px = (x * 0.5 + 0.5) * innerWidth,
    py = (1 - (y * 0.5 + 0.5)) * innerHeight,
    on = !off && fwd.dot(d) > 0.9986; /* within 3 degrees */
  aimE.style.display = aimT.style.display = 'block';
  aimE.className = off ? 'off' : on ? 'on' : '';
  aimE.style.left = aimT.style.left = px + 'px';
  aimE.style.top = aimT.style.top = py + 'px';
  aimE.style.transform = 'translate(-50%,-50%)' + (off ? ' rotate(' + Math.atan2(x, y) + 'rad)' : '');
  aimT.textContent = A.aim.lab + (on ? '  \u2713' : '');
}
function aeroRun(c, m) {
  const def = AERO_DEF[m],
    A = trn.a;
  if (!A || A.m !== m) return;
  aeroTick(c, def);
  if (def.drone) {
    A.tgt = aeroTgt();
    if (A.tgt) {
      A.minRange = Math.min(A.minRange, A.tgt.d);
      const T = A.tgt;
      A.hold = trn.step >= 2 && T.d < 450 && T.d > 120 && T.ata < 12 && Math.abs(T.dy) < 50 ? A.hold + c.dt : 0;
      if (trn.step < 2 && T.d < 110) A.minRange = Math.min(A.minRange, T.d);
    }
  }
  /* after a stall and recovery you are back in the Get set step until the speed is right again */
  if (m === 'immelmann' && trn.step === 1 && A.loop < 15 && !stalled && c.kmh < (A.hc ? 650 : 520) * 0.85) trn.step = 0;
  while (trn.step < def.steps.length && def.steps[trn.step].done(c, A)) trn.step++;
  if (trn.step >= def.steps.length) {
    if (A.rec) A.rec.push({ t: trn.t - A.rt0, p: pos.clone(), q: q.clone(), g: gF, k: c.kmh, d: A.tgt ? A.tgt.e.p.clone() : null, dq: A.tgt ? A.tgt.e.q.clone() : null });
    trn.done = true;
    trn.sum = def.finish(c, A);
    note(AERO[m].name + ' COMPLETE');
    return;
  }
  A.aim = aeroAim(m, A);
  const st = def.steps[trn.step],
    bad = def.fail(c, A);
  trn.title = 'Step ' + (trn.step + 1) + '/' + def.steps.length + ': ' + st.t;
  let [h, l] = st.hint(c, A);
  if (bad) {
    h = bad;
    l = 'bad';
  } else if (c.agl < 350 && trn.step > 0 && !c.gnd) {
    h = 'LOW: ' + c.R(c.agl) + ' m above the ground!';
    l = 'bad';
  }
  if (A.pm && A.pmT > 0) {
    c.T0(A.pmTxt, h, 'bad');
    return;
  }
  c.T0(st.txt(c, A) + (ringShown() ? '\nKeep the white marker in the green ring: it is the line the pilot flew.' : ''), h, l);
}
Object.keys(AERO_DEF).forEach((m) => {
  TRAINERS[m] = (c) => aeroRun(c, m);
});

