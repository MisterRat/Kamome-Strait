/* standard atmosphere for the advanced model: air density ratio (sig), speed of sound (a) and the Merlin's power ratio (ps)
   with its two-stage supercharger (power holds up to ~3,000 m, then falls to the ~12,800 m service ceiling). */
const ATM_PS = [
  [0, 1],
  [3000, 1],
  [5000, 0.98],
  [7600, 0.93],
  [9000, 0.9],
  [11000, 0.88],
  [12800, 0.8],
  [15000, 0.55],
  [20000, 0.15],
];
function atmos(h, o) {
  h = Math.max(0, h);
  const T = h < 11000 ? 288.15 - 0.0065 * h : 216.65;
  o.sig = h < 11000 ? Math.pow(T / 288.15, 4.256) : 0.2971 * Math.exp(-(h - 11000) / 6341.6);
  o.a = Math.sqrt(1.4 * 287.05 * T);
  let i = 1;
  while (i < ATM_PS.length - 1 && h > ATM_PS[i][0]) i++;
  const A = ATM_PS[i - 1],
    B = ATM_PS[i];
  o.ps = Math.max(0.02, A[1] + ((B[1] - A[1]) * (Math.min(h, B[0]) - A[0])) / (B[0] - A[0]));
  return o;
}
{
  const saved = store.get('hc', null);
  if (saved && typeof saved === 'object') {
    FM.on = saved.on === true;
    HC_KEYS.forEach((k) => {
      if (saved.opt && saved.opt[k] === false) FM.opt[k] = false;
    });
  }
}
const AT = { sig: 1, a: 340.3, ps: 1 }; /* the air around the player */
