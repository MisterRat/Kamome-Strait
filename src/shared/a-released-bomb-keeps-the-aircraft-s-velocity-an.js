/* a released bomb keeps the aircraft's velocity and falls under gravity (no drag): same maths as the bomb in updWeapons */
function bombImpact() {
  const vy = vel.y,
    y0 = pos.y - 0.45;
  let ix = pos.x,
    iz = pos.z,
    tt = 0,
    gh = H(pos.x, pos.z);
  for (let k = 0; k < 4; k++) {
    tt = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, y0 - gh))) / 9.8;
    ix = pos.x + vel.x * tt;
    iz = pos.z + vel.z * tt;
    gh = H(ix, iz);
  }
  return { x: ix, y: gh, z: iz, t: tt };
}
function liveRelease() {
  const tg = guide.tgt,
    pts = guide.pts;
  if (!tg || tg.dead || pts.length < 4) return null;
  const ht = H(tg.c.x, tg.c.z),
    v = Math.max(60, vel.length()),
    vo = Math.max(-150, Math.min(150, guide.vertErr || 0));
  let pf = null,
    pp = null;
  for (let k = Math.max(0, guide.prevI || 0); k < pts.length - 2; k++) {
    const a = pts[k],
      b = pts[k + 2],
      dx = b.x - a.x,
      dz = b.z - a.z,
      hz = Math.hypot(dx, dz) || 1,
      tn = (b.y - a.y) / hz,
      c = 1 / Math.sqrt(1 + tn * tn),
      y0 = a.y + 2 - 0.45 + vo;
    if (tn > -0.17) {
      pf = null;
      continue;
    }
    if (y0 <= ht + 25) return null;
    const vy = v * tn * c,
      tt = (vy + Math.sqrt(vy * vy + 19.6 * (y0 - ht))) / 9.8,
      f = v * c * tt - Math.hypot(a.x - tg.c.x, a.z - tg.c.z);
    if (f >= 0) {
      if (pf === null) return null;
      const u = -pf / (f - pf);
      return { x: pp.x + (a.x - pp.x) * u, y: pp.y + (a.y - pp.y) * u, z: pp.z + (a.z - pp.z) * u };
    }
    pf = f;
    pp = a;
  }
  return null;
}
