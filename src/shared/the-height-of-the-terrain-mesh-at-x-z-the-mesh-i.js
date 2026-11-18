/* the height of the terrain MESH at x, z (the mesh is a 100 m grid of triangles, so on a crest it sits below the true height HR);
   trees and rocks stand on this so they do not float */
function HMESH(x, z) {
  if (x < -13000 || x > 13000 || z < -13000 || z > 13000) return WORLD.hm(x, z);
  const u = Math.max(0, Math.min(SEG - 1e-6, ((x + SZ / 2) / SZ) * SEG)),
    v = Math.max(0, Math.min(SEG - 1e-6, ((z + SZ / 2) / SZ) * SEG)),
    i = Math.floor(u),
    j = Math.floor(v),
    fx = u - i,
    fz = v - j,
    q = (a, b) => Math.max(HR((a / SEG - 0.5) * SZ, (b / SEG - 0.5) * SZ), SEA.PAINT),
    ha = q(i, j),
    hb = q(i, j + 1),
    hc = q(i + 1, j + 1),
    hd = q(i + 1, j);
  return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
}
const tg = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG);
tg.rotateX(-Math.PI / 2);
const terrU = { uTime: { value: 0 } };
