/* capture the mouse pointer while the player is on a gun (so plain mouse movement lays it), release it otherwise */
function gunLock(on) {
  const has = document.pointerLockElement === cv;
  if (on && !has && cv.requestPointerLock) {
    try {
      const r = cv.requestPointerLock();
      if (r && r.catch) r.catch((e) => logWarn('pointer lock', e));
    } catch (e) {
      logWarn('pointer lock', e);
    }
  } else if (!on && has) document.exitPointerLock();
}
function gunSightToggle() {
  if (!GUN.cur) return;
  GUN.look = !GUN.look;
  note(GUN.look ? 'LOOKING ROUND - X FOR THE SIGHT' : 'ON THE SIGHT');
}
function gunRange(d) {
  if (!GUN.cur || GUN.cur.s.sight !== 'scope') return;
  if (!FM.use('range')) return note('THE SIGHT-SETTER RANGES FOR YOU (HARDCORE: YOU SET IT)');
  GUN.rng = Math.max(200, Math.min(13340, GUN.rng + d) /* the 3"/50's full range */);
}
/* the browser's first movements after it captures (or frees) the pointer can be huge and false: the gun spun wildly when first manned (the
   user's, 2026-11-22). For 150 ms after the capture changes the movements are ignored, and so is any single movement over 300 px
   (a real hand's come many to a second, each small) */
let gunLockT = -1e9;
document.addEventListener('pointerlockchange', () => (gunLockT = performance.now()));
const gunMoveOk = (e) => performance.now() - gunLockT > 150 && Math.abs(e.movementX) < 300 && Math.abs(e.movementY) < 300;
