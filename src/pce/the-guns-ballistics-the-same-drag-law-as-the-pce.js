/* the guns' ballistics: the same drag law as the PCE's own guns (GSPEC), from the muzzle down to the sea */
function coastFly(p0, el, yaw, out) {
  let x = 0,
    y = p0.y,
    vx = COAST.MV * Math.cos(el),
    vy = COAST.MV * Math.sin(el),
    t = 0;
  const h = 0.05;
  while (t < 90) {
    const v = Math.hypot(vx, vy),
      k = COAST.K * Math.exp(-Math.max(0, y) / 9145) * v;
    vx *= 1 - k * h;
    vy *= 1 - k * h;
    vy -= 9.81 * h;
    x += vx * h;
    y += vy * h;
    t += h;
    if (y <= coastSea() + 2 && vy < 0) break;
  }
  if (out) (out.r = x), (out.t = t);
  return x;
}
