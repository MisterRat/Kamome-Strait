/* a point [x, y] on the right-hand skin at section angle ang (0 = widest, PI/2 = top, PI = left, 3PI/2 = belly), pushed out by off */
function fusPt(z, ang, off) {
  const s = fusSec(z),
    c = Math.cos(ang),
    n = Math.sin(ang),
    e = 2 / s.n;
  off = off || 0;
  return [
    s.a * Math.sign(c) * Math.abs(c) ** e + Math.sign(c) * off * Math.abs(c),
    s.yc + s.hh * Math.sign(n) * Math.abs(n) ** e + Math.sign(n) * off * Math.abs(n),
  ];
}
