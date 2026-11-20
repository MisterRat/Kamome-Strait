/* half-width of the skin at height y */
function fusX(z, y) {
  const s = fusSec(z),
    f = Math.min(0.999, Math.abs((y - s.yc) / s.hh)),
    sn = f ** (s.n / 2);
  return s.a * Math.sqrt(1 - sn * sn) ** (2 / s.n);
}
