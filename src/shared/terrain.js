/* ---------- terrain ---------- */
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vn(x, z) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz,
    u = fx * fx * (3 - 2 * fx),
    w = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz),
    b = hash(ix + 1, iz),
    c = hash(ix, iz + 1),
    d = hash(ix + 1, iz + 1);
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
