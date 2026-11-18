/* which weapon is he at (an index into the station's positions), or -1 on the way between them */
function tpNear() {
  const x = TPW.p.x,
    z = TPW.p.y,
    f = tpFX(x);
  if (f > 79.5) return tpIdx('rack');
  if (Math.hypot(x - tpXF(24.6), z) < 2.5) return tpIdx('hh');
  for (const g of [64.6, 73.7])
    for (const s of [-1, 1]) if (Math.hypot(x - tpXF(g), z - s * 3.4) < 2.9) return tpIdx(s > 0 ? 'stbd' : 'port');
  return -1;
}
