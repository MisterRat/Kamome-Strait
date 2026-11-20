/* ---------- mouse orbit camera: drag to circle the plane, wheel to zoom, Y returns to the normal view ---------- */
let orbitOn = false,
  orbYaw = 0,
  orbEl = 0.27,
  orbDist = SIMS.cur.orbitDist,
  orbDrag = false;
function orbReset() {
  orbitOn = false;
  orbYaw = 0;
  orbEl = 0.27;
  orbDist = SIMS.cur.orbitDist;
}
