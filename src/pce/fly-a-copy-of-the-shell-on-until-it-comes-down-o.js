/* fly a copy of the shell on until it comes down (or bursts); on the way, find its closest pass to each airborne target (each one
   flown on along its own course too). Returns the landing point in out, and the nearest air pass { d, p (where), t (when), tg } */
function scamPredict(b, out, air) {
  const p = out.copy(b.p),
    v = GUN.V[3].copy(b.v),
    s = b.s,
    q = new THREE.Vector3();
  let r = b.r,
    best = null;
  for (let t = 0; t < 60; t += 0.05) {
    const sp = v.length(),
      k = s.k * Math.exp(-Math.max(0, p.y) / 9145) * sp;
    v.multiplyScalar(1 - k * 0.05);
    v.y -= 9.81 * 0.05;
    p.addScaledVector(v, 0.05);
    r += sp * 0.05;
    for (const a of air) {
      q.copy(a.p).addScaledVector(a.v, t);
      const d = q.distanceTo(p);
      if (!best || d < best.d) best = { d, p: p.clone(), t, tg: a };
    }
    if ((s.sd && r > s.sd) || p.y < Math.max(OCEAN.Y, HR(p.x, p.z))) break;
  }
  if (p.y < OCEAN.Y) p.y = OCEAN.Y;
  return best;
}
function scamStart() {
  const own = GUN.B.filter((b) => b.own);
  if (!own.length) return;
  /* airborne targets first: the sleeves (and any aircraft) with their velocities */
  const air = [];
  if (PT.on) for (const t of PT.L) if (t.kind === 'sleeve' && !(t.gone > 0)) air.push({ p: t.p, v: t.v || new THREE.Vector3() });
  for (const e of EN) if (!e.dying && e.p) air.push({ p: e.p, v: e.v || (e.fwd ? e.fwd.clone().multiplyScalar(e.sp || 0) : new THREE.Vector3()) });
  for (const e of RAID.L) if (e.st !== 'down') air.push({ p: e.p, v: e.v });
  const pass = scamPredict(own[own.length - 1], SCAM.L, air);
  let best = null,
    bd = 1500;
  SCAM.hold = 0;
  if (pass && pass.d < 250) {
    /* the shell passes close to an airborne target: watch it go by there */
    SCAM.L.copy(pass.p);
    best = pass.tg.p;
    bd = pass.d;
    SCAM.hold = pass.t + 2.5;
  } else {
    /* otherwise where it comes down, with the nearest surface target */
    for (const c of [...(PT.on ? PT.L.filter((t) => t.kind === 'raft' || t.kind === 'sled').map((t) => t.p) : []), ...T.filter((t) => t.type === 'ship' && !t.dead).map((t) => t.c)]) {
      const d = c.distanceTo(SCAM.L);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
  }
  SCAM.tg = best;
  SCAM.F.copy(SCAM.L);
  if (best) SCAM.F.lerp(best, 0.5);
  SCAM.D = Math.max(35, Math.min(400, (best ? bd : 0) * 1.3 + 35));
  /* the camera starts on the side of the fall of shot away from the ship, looking back across it in three-quarter view */
  const dx = SCAM.F.x - pos.x,
    dz = SCAM.F.z - pos.z;
  SCAM.a = Math.atan2(dx, dz) + 0.75;
  SCAM.on = true;
  SCAM.t = 0;
  SCAM.end = 0;
  SCAM.p0.copy(cam.position);
  SCAM.q0.copy(cam.quaternion);
  note('SHELL CAM');
}
function scamCam(dt) {
  if (!SCAM.on) return false;
  if (!(GUN.cur && camMode == 1) || PHOTO.on || ROAM.on || paused) {
    SCAM.on = false;
    return false;
  }
  SCAM.t += dt;
  if (!GUN.B.some((b) => b.own)) SCAM.end += dt;
  if (SCAM.end > 2.2 || SCAM.t > 25 || (SCAM.hold && SCAM.t > SCAM.hold)) {
    SCAM.on = false;
    return false;
  }
  if (SCAM.tg) SCAM.F.copy(SCAM.L).lerp(SCAM.tg, 0.5); /* a moving sleeve stays in the frame */
  SCAM.a += dt * 0.12; /* a slow drift round the scene */
  const D = SCAM.D * (1 - 0.15 * Math.min(1, SCAM.t / 4)) /* and a slow push in */,
    p = GUN.V[2].set(SCAM.F.x + Math.sin(SCAM.a) * D, Math.max(SCAM.F.y, OCEAN.Y) + D * 0.42 + 3, SCAM.F.z + Math.cos(SCAM.a) * D);
  const k = Math.min(1, SCAM.t / 0.45); /* a quick swoop out from the gun */
  cam.up.set(0, 1, 0);
  cam.position.copy(SCAM.p0).lerp(p, k * k * (3 - 2 * k));
  cam.lookAt(SCAM.F);
  if (k < 1) {
    const q1 = cam.quaternion.clone();
    cam.quaternion.copy(SCAM.q0).slerp(q1, k * k * (3 - 2 * k));
  }
  return true;
}
{
  const c = $$('scOn');
  c.checked = SCAM.want;
  c.onchange = () => {
    SCAM.want = c.checked;
    store.set('scam2', SCAM.want);
    if (!SCAM.want) SCAM.on = false;
  };
}
