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
  GUN.rng = Math.max(200, Math.min(13000, GUN.rng + d));
}
