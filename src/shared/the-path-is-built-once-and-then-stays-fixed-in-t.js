/* the path is built ONCE and then stays fixed in the world; it is only rebuilt when the target really moved, you flew past the end, or you are far off it */
function planGuide() {
  const F = finalLineFor();
  if (!F && PRE_MODES[trn.mode] && PP.pts && PP.key === ppKey() && !RPL.busy && !(trn.mode === 'convoy' && guide.cvRe)) {
    /* no planned route for this mission: the pilot's recorded flight stands in for it */
    guide.plan = null;
    guide.pts = PP.pts;
    guide.marks = [];
    guide.kind = 'pp';
    return;
  }
  if (!F) {
    guide.plan = null;
    guide.pts = [];
    guide.marks = [];
    guide.kind = '';
    return;
  }
  const P = guide.plan;
  if (P && P.kind === F.kind && P.tgt === guide.tgt) {
    let keep = true;
    if (
      F.kind === 'strafe' &&
      Math.hypot(F.A.x - P.F.A.x, F.A.z - P.F.A.z) > 650 &&
      Math.hypot(P.F.A.x - pos.x, P.F.A.z - pos.z) > 1300
    )
      keep = false;
    const [bi, dist] = closestIdx(P.pts);
    if (bi >= P.pts.length - 2 || dist > 1100) keep = false;
    if (keep) return;
  }
  const np = buildPlan(F);
  np.kind = F.kind;
  np.tgt = guide.tgt;
  guide.plan = np;
  guide.pts = np.pts;
  guide.marks = np.marks;
  guide.kind = F.kind;
  guide.F = np.F;
}
function pathAt(pts, s) {
  let lo = 0,
    hi = pts.length - 1;
  if (s <= pts[0].s) return { x: pts[0].x, y: pts[0].y, z: pts[0].z, s: pts[0].s };
  if (s >= pts[hi].s) return { x: pts[hi].x, y: pts[hi].y, z: pts[hi].z, s: pts[hi].s };
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pts[m].s <= s) lo = m;
    else hi = m;
  }
  const a = pts[lo],
    b = pts[hi],
    f = (s - a.s) / (b.s - a.s || 1);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, s };
}
function projectOnPath(pts) {
  const n = pts.length;
  let i0 = 0,
    i1 = n - 2;
  if (guide.prevI != null && guide.prevPlan === guide.plan) {
    i0 = Math.max(0, guide.prevI - 40);
    i1 = Math.min(n - 2, guide.prevI + 120);
  }
  let best = 1e18,
    bi = 0,
    bt = 0;
  for (let i = i0; i <= i1; i++) {
    const a = pts[i],
      b = pts[i + 1],
      dx = b.x - a.x,
      dz = b.z - a.z,
      l2 = dx * dx + dz * dz || 1;
    let u = ((pos.x - a.x) * dx + (pos.z - a.z) * dz) / l2;
    u = Math.max(0, Math.min(1, u));
    const d = (pos.x - a.x - dx * u) ** 2 + (pos.z - a.z - dz * u) ** 2;
    if (d < best) {
      best = d;
      bi = i;
      bt = u;
    }
  }
  guide.prevI = bi;
  guide.prevPlan = guide.plan;
  const a = pts[bi],
    b = pts[bi + 1];
  return {
    i: bi,
    s: a.s + (b.s - a.s) * bt,
    x: a.x + (b.x - a.x) * bt,
    y: a.y + (b.y - a.y) * bt,
    z: a.z + (b.z - a.z) * bt,
  };
}
guide.Ls = 400;
