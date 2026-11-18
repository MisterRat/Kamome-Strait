/* a gun's range table at sea level: [elevation, range] for 0 to 45 degrees (for the 3"/50's sight) */
function gunTable(s) {
  const T = [];
  for (let e = 0; e <= 45.01; e += 0.5) {
    let x = 0,
      y = 0,
      vx = s.mv * Math.cos(e * D2R),
      vy = s.mv * Math.sin(e * D2R);
    const h = 0.02;
    for (let i = 0; i < 6000; i++) {
      const v = Math.hypot(vx, vy),
        r = s.k * Math.exp(-y / 9145) * v;
      vx -= r * vx * h;
      vy -= (9.81 + r * vy) * h;
      x += vx * h;
      y += vy * h;
      if (y < 0) break;
    }
    T.push([e * D2R, x]);
  }
  return T;
}
