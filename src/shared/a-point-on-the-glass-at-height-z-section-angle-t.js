/* a point on the glass at height z, section angle t (0 = right sill, PI/2 = top, PI = left sill), pushed out by off */
function canPt(z, t, off) {
  const q = canSec(z),
    c = Math.cos(t),
    n = Math.sin(t);
  off = off || 0;
  return [
    q.xb * Math.sign(c) * Math.abs(c) ** q.e + Math.sign(c) * off * Math.abs(c),
    q.yb + q.h * Math.abs(n) ** q.e + off * Math.abs(n),
    z,
  ];
}
const canInside = (x, y, z) => {
  const q = canSec(z),
    f = (y - q.yb) / q.h;
  if (f < 0 || f > 1) return f < 0;
  const sn = f ** (1 / q.e);
  return Math.abs(x) <= q.xb * Math.sqrt(Math.max(0, 1 - sn * sn)) ** q.e;
};
function canLoft(za, zb, nz) {
  const nt = 32,
    P = [],
    I = [];
  for (let i = 0; i <= nz; i++)
    for (let j = 0; j <= nt; j++) P.push(...canPt(za + ((zb - za) * i) / nz, (Math.PI * j) / nt, 0));
  for (let i = 0; i < nz; i++)
    for (let j = 0; j < nt; j++) {
      const a = i * (nt + 1) + j,
        c = a + nt + 1;
      I.push(a, a + 1, c, a + 1, c + 1, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
add(canLoft(CAN.z0, CAN.zJ, 12), glass, 0, 0, 0); /* windscreen glass: stays when the hood is jettisoned */
const can = add(canLoft(CAN.zJ, CAN.z1, 40), glass, 0, 0, 0); /* the hood */
