/* ---------- physics ---------- */
let alpha = 0,
  CL = 0,
  stalled = false,
  gF = 1;
const fwd = new V(),
  up = new V(),
  right = new V(),
  tmp = new V();
function axes() {
  fwd.set(0, 0, -1).applyQuaternion(q);
  up.set(0, 1, 0).applyQuaternion(q);
  right.set(1, 0, 0).applyQuaternion(q);
}
