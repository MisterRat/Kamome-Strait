/* ---------- gamepad ---------- */
const pad = { p: 0, r: 0, y: 0, thr: 0, fire: false, brake: false, view: 0, lx: 0, ly: 0, trE: 0, trR: 0, trA: 0 };
let viewYaw = 0,
  viewPitch = 0,
  lb = 0;
let padPrev = [],
  trimPadUsed = false,
  padSeen = false,
  r3Down = 0; /* R3: a tap changes difficulty */
const dzf = (v, d = 0.14) => {
  v = v || 0;
  const n = Math.max(0, (Math.abs(v) - d) / (1 - d));
  return Math.sign(v) * (0.35 * n + 0.65 * n * n);
};
