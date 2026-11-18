/* the range along the gun's line of sight to the ground or the water (metres), or 0 if it meets nothing within 13 km. The line of
   sight is taken from the mount (the bore, less the sight's superelevation) and levelled, as a stabilised rangefinder would be: the
   ship's pitch and roll in a seaway do not swing the range */
function gunRangefind(G) {
  /* everything in the ship's own frame (the mount's matrices and the ship's from the same update, so they agree exactly), then
     turned to her heading only: near the horizon 0.1 milliradian is some 175 m of range at 3 km, so the levelling must be exact */
  const V3 = THREE.Vector3,
    Mi = new THREE.Matrix4().copy(SHIPM.mesh.matrixWorld).invert(),
    qL = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), SHIP.hdg).multiply(SHIP.QB),
    d = new V3(1, 0, 0).transformDirection(G.m.el.matrixWorld).transformDirection(Mi);
  if (G.se) d.applyAxisAngle(new V3(0, 0, 1).transformDirection(G.m.tr.matrixWorld).transformDirection(Mi), -G.se);
  d.applyQuaternion(qL);
  const o = G.m.tr
    .localToWorld(new V3(G.m.d.eye[0], G.m.d.eye[1], G.m.d.eye[2]))
    .applyMatrix4(Mi)
    .applyQuaternion(qL)
    .add(new V3(pos.x, SHIPM.Y, pos.z));
  /* game mode: the sight-setter ranges the target the pointer is engaging, the one nearest the line of sight within about 7 deg,
     to where she will be when the shell arrives (the line of sight is on the ring, well ahead of a moving target, so it does not
     pass over her). Ranged off the water a target riding the waves threw the range about wildly (the line of sight grazes the sea,
     so a bob of half a metre is hundreds of metres of range) and the sight's superelevation, and the ring with it, jumped */
  {
    let bt = null,
      bk = 0.12;
    const w = new V3(),
      zero = new V3(),
      chk = (t, tp) => {
        w.copy(tp).sub(o);
        const r = w.length();
        if (r < 60 || r > 13000) return;
        const ang = Math.acos(Math.max(-1, Math.min(1, w.dot(d) / r)));
        if (ang < bk) (bk = ang), (bt = t);
      };
    if (PT.on) for (const t of PT.L) if (t.p && !t.dead && !(t.gone > 0) && t.kind !== 'sub') chk(t, t.p);
    for (const e of EN) if (!e.dying && e.p) chk(e, e.p);
    for (const e of RAID.L) if (e.st !== 'down') chk(e, e.p);
    if (bt) {
      const q = new V3(),
        tv = bt.v || (bt.fwd ? bt.fwd.clone().multiplyScalar(bt.sp || 0) : zero);
      return gunAim(G, bt.p, tv, q, PT.L.includes(bt) && bt.kind !== 'raft' ? ptAt(bt) : null) ? Math.hypot(q.x - o.x, q.z - o.z) : bt.p.distanceTo(o);
    }
  }
  if (d.y > 0.02) return 0;
  const under = (t) => o.y + d.y * t <= H(o.x + d.x * t, o.z + d.z * t);
  let t = 0;
  while (t < 13000) {
    const st = t < 2000 ? 8 : 25;
    t += st;
    if (under(t)) {
      let lo = t - st,
        hi = t;
      for (let i = 0; i < 6; i++) {
        const m = (lo + hi) / 2;
        if (under(m)) hi = m;
        else lo = m;
      }
      return hi;
    }
  }
  return 0;
}
function gunLay(d, e) {
  const G = GUN.cur;
  if (!G) return;
  G.trT = Math.max(-G.s.trLim, Math.min(G.s.trLim, G.trT + d));
  G.elT = Math.max(G.s.elMin - G.se, Math.min(G.s.elMax - G.se, G.elT + e));
}
