/* where a rocket fired now would land: the same flight the rocket flies (launch speed + 60 m/s, 300 m/s2 motor for 1.2 s, then gravity) */
function rocketImpact() {
  const m = rkMesh[ORD[rkN]];
  if (!m) return null;
  const p = worldOf(m),
    v = vel.clone().addScaledVector(fwd, 60),
    d = fwd.clone(),
    h = 1 / 60;
  let t = 0;
  /* the motor burn, step by step like the rocket itself */
  while (t < 1.2) {
    t += h;
    if (t < 1.2) v.addScaledVector(d, 300 * h);
    v.y -= 9.8 * h * (t > 0.5 ? 1 : 0.3);
    p.addScaledVector(v, h);
    const g = H(p.x, p.z);
    if (p.y < g) return { x: p.x, y: g, z: p.z };
  }
  /* then a free fall: march along it until it meets the ground (a ridge in the way counts), and give up where the rocket would burn out in the air (15 s) */
  const hs = 0.2;
  while (t < 15) {
    const nx = p.x + v.x * hs,
      nz = p.z + v.z * hs,
      ny = p.y + v.y * hs - 4.9 * hs * hs;
    const g = H(nx, nz);
    if (ny < g) {
      let lo = 0,
        hi = hs;
      for (let k = 0; k < 6; k++) {
        const mid = (lo + hi) / 2,
          my = p.y + v.y * mid - 4.9 * mid * mid;
        if (my < H(p.x + v.x * mid, p.z + v.z * mid)) hi = mid;
        else lo = mid;
      }
      return { x: p.x + v.x * hi, y: H(p.x + v.x * hi, p.z + v.z * hi), z: p.z + v.z * hi };
    }
    v.y -= 9.8 * hs;
    p.set(nx, ny, nz);
    t += hs;
  }
  return null;
}
