/* is this spot bare grass land: not sand or water, not steep, not on the runway, apron, roads or compounds? */
const RGRID = new Map();
for (const L of [RP2, RP3, RSPUR])
  for (let i = 0; i < L.length; i++) {
    const kx = Math.floor(L[i].x / 60),
      kz = Math.floor(L[i].z / 60),
      key = kx * 100003 + kz;
    if (!RGRID.has(key)) RGRID.set(key, []);
    RGRID.get(key).push(L[i]);
  }
function onEnemyRoad(x, z, d) {
  const kx = Math.floor(x / 60),
    kz = Math.floor(z / 60);
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) {
      const q = RGRID.get((kx + a) * 100003 + kz + b);
      if (q) for (const p of q) if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < d * d) return true;
    }
  return false;
}
function grassOK(x, z, h) {
  const air = Math.abs(x) < 400 && z > -2250 && z < 1050; /* the ground shader's sand line is lower on the airfield */
  if (h < (air ? -1.5 : 4.5) || h > 650) return false;
  if ((x < -13000 || x > 13000 || z < -13000 || z > 13000) && WORLD.onRoad(x, z)) return false;
  if (Math.abs(x) < 34 && z > RW.zN - 30 && z < RW.zS + 30) return false;
  if (x > -235 && x < -15 && z > 95 && z < 525) return false;
  if (SITE.inside(x, z, 20) || onEnemyRoad(x, z, 15) || FS.near(x, z, 6)) return false;
  if (x > 1400 && x < 5700 && z > -4700 && z < -3100 && (inCompound(x, z) || nearRoad(x, z, 11))) return false;
  const e = 2.5,
    sx = HMESH(x + e, z) - HMESH(x - e, z),
    sz = HMESH(x, z + e) - HMESH(x, z - e);
  return Math.hypot(sx, sz) < 2 * e * 0.5;
}
