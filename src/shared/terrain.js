/* ---------- terrain ---------- */
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
/* the lattice's values, kept as they are worked out (the user's, 2026-11-22: loading was slow, most of it Math.sin in hash, asked
   again and again for the same lattice points by neighbouring samples): a direct-mapped table keyed by the point. A point not in it
   (or one whose key would not fit 32 bits) is worked out by hash as before, so every value is exactly what hash gives */
const HCN = 1 << 15,
  HCX = new Int32Array(HCN).fill(-2147483648),
  HCZ = new Int32Array(HCN),
  HCV = new Float64Array(HCN);
function hashL(ix, iz) {
  const k = (Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663)) & (HCN - 1);
  if (HCX[k] === ix && HCZ[k] === iz) return HCV[k];
  const v = hash(ix, iz);
  HCX[k] = ix;
  HCZ[k] = iz;
  HCV[k] = v;
  return v;
}
function vn(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz,
    u = fx * fx * (3 - 2 * fx),
    w = fz * fz * (3 - 2 * fz);
  const a = hashL(ix, iz),
    b = hashL(ix + 1, iz),
    c = hashL(ix, iz + 1),
    d = hashL(ix + 1, iz + 1);
  return (a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w) * 2 - 1;
}
function fbm(x, z) {
  let s = 0,
    a = 1,
    f = 1 / 3200;
  for (let i = 0; i < 5; i++) {
    s += vn(x * f, z * f) * a;
    a *= 0.5;
    f *= 2.1;
  }
  return s / 1.6;
}
const ss = (a, b, x) => {
  x = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const RW = { x: 40, zN: -1700, zS: 600 };
const PL = { cx: 3900, cz: -4400, R: 4300 };
