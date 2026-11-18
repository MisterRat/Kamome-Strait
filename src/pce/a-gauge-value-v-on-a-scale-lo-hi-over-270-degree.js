/* a gauge: value v on a scale lo..hi over 270 degrees */
function gauge(g, s, v, lo, hi, step, lab) {
  const A = (x) => -0.75 * Math.PI + (1.5 * Math.PI * (x - lo)) / (hi - lo),
    T = [];
  for (let x = lo; x <= hi + 1e-6; x += step / 2) {
    const big = Math.abs(((x - lo) / step) % 1) < 1e-6;
    T.push([A(x), big ? String(x) : '', big]);
  }
  dialFace(g, s, T, lab);
  needle(g, s, A(Math.max(lo, Math.min(hi, v))), '#111', 0.4);
}
