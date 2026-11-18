/* ---------- photo mode: a free camera, HUD on / off, JPG snapshots ----------
   Pause menu > Photo mode (or F9). The scene is frozen by default. A photo is taken right after the frame renders (so the WebGL
   canvas can be read), the HUD boxes are painted over it by photoHud() when wanted, and the JPG is saved through a download link. */
const PHOTO = {
  on: false,
  hud: false,
  showPlane: true,
  freeze: true,
  stamp: false,
  grid: false,
  res: 0,
  q: 0.92,
  spd: 30,
  fov: 65,
  fov0: 65,
  yaw: 0,
  pitch: 0,
  roll: 0,
  pos: new THREE.Vector3(),
  drag: false,
  shot: false,
  fromMenu: false,
  prevPaused: false,
  panel: true,
  last: null,
  wx0: null,
};
{
  const c = store.get('p51ph', null);
  if (c && typeof c === 'object') {
    PHOTO.hud = c.hud === true;
    PHOTO.stamp = c.stamp === true;
    PHOTO.grid = c.grid === true;
    if (c.res === 0 || c.res === 1 || c.res === 2) PHOTO.res = c.res;
    if (typeof c.q === 'number') PHOTO.q = c.q;
    PHOTO.showPlane = c.showPlane !== false;
  }
}
const PHE = new THREE.Euler(0, 0, 0, 'YXZ'),
  PHV = new THREE.Vector3(),
  PHR = new THREE.Vector3(),
  PHT = new THREE.Vector3();
function photoSave() {
  store.set('p51ph', {
    hud: PHOTO.hud,
    stamp: PHOTO.stamp,
    grid: PHOTO.grid,
    res: PHOTO.res,
    q: PHOTO.q,
    showPlane: PHOTO.showPlane,
  });
}
function photoSync() {
  $$('phHud').textContent = 'HUD: ' + (PHOTO.hud ? 'on' : 'off');
  $$('phAc').textContent = 'Aircraft: ' + (PHOTO.showPlane ? 'on' : 'off');
  $$('phFz').textContent = 'Action: ' + (PHOTO.freeze ? 'frozen' : 'running');
  $$('phFov').value = Math.round(PHOTO.fov);
  $$('phFovV').textContent = Math.round(PHOTO.fov);
  $$('phTime').value = WX.time;
  $$('phWx').value = WX.wx;
  $$('phHour').value = WX.hour.toFixed(1);
  $$('phHourV').textContent = WX.clock();
  $$('phRes').value = PHOTO.res;
  $$('phQ').value = String(PHOTO.q);
  $$('phSpd').value = String(PHOTO.spd);
  $$('phStamp').checked = PHOTO.stamp;
  $$('phGrid').checked = PHOTO.grid;
  document.body.classList.toggle('phHide', PHOTO.on && !PHOTO.hud);
  $$('phGridV').style.display = PHOTO.on && PHOTO.grid ? 'block' : 'none';
  $$('ph').classList.toggle('min', !PHOTO.panel);
}
function photoFov(v) {
  PHOTO.fov = Math.max(10, Math.min(110, v));
  $$('phFov').value = Math.round(PHOTO.fov);
  $$('phFovV').textContent = Math.round(PHOTO.fov);
}
function photoLook(from, at) {
  PHOTO.pos.copy(from);
  PHV.copy(at).sub(from);
  PHOTO.yaw = Math.atan2(-PHV.x, -PHV.z);
  PHOTO.pitch = Math.asin(PHV.y / (PHV.length() || 1));
  PHOTO.roll = 0;
}
function photoSpot(k) {
  const loc = (x, y, z) => PHR.set(x, y, z).applyQuaternion(q).add(pos).clone();
  if (k === 'chase') photoLook(loc(0, 3.6, 13), PHT.copy(fwd).multiplyScalar(18).add(pos));
  else if (k === 'side') photoLook(loc(24, 2.5, -1), pos);
  else if (k === 'front') photoLook(loc(0, 2, -22), pos);
  else if (k === 'top') photoLook(loc(0, 26, 4), pos);
  else if (k === 'cockpit') photoLook(loc(0, 1.17, -0.55), PHT.copy(fwd).multiplyScalar(50).add(pos));
}
function photoEnter() {
  if (!started || PHOTO.on) return;
  roamExit(true);
  PHOTO.fromMenu = pmOpen;
  PHOTO.prevPaused = pmOpen ? pmPrev : paused;
  if (pmOpen) pmShow(false);
  PHOTO.on = true;
  PHOTO.fov0 = cam.fov;
  PHOTO.fov = cam.fov;
  PHOTO.wx0 = { time: WX.time, wx: WX.wx, hour: WX.hour };
  PHE.setFromQuaternion(cam.quaternion, 'YXZ');
  PHOTO.pos.copy(cam.position);
  PHOTO.yaw = PHE.y;
  PHOTO.pitch = PHE.x;
  PHOTO.roll = 0;
  paused = PHOTO.freeze;
  $$('ph').style.display = 'block';
  $$('phMsg').textContent = '';
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  photoSync();
}
function photoExit() {
  if (!PHOTO.on) return;
  PHOTO.on = false;
  cam.far = 40000;
  cam.near = 1;
  cam.updateProjectionMatrix();
  if (SEAP) {
    SEAP.position.set(0, SEA.PLANE, 0);
    SEAP.scale.set(1, 1, 1);
    SEAP.updateMatrix();
  }
  PHOTO.drag = false;
  PHOTO.shot = false;
  $$('ph').style.display = 'none';
  document.body.classList.remove('phHide');
  $$('phGridV').style.display = 'none';
  plane.visible = true;
  cam.fov = PHOTO.fov0;
  cam.updateProjectionMatrix();
  const w = PHOTO.wx0;
  if (w) {
    WX.time = w.time;
    WX.wx = w.wx;
    WX.hour = w.hour;
    WX.apply();
  }
  for (const k in keys) keys[k] = false;
  paused = PHOTO.prevPaused;
  if (PHOTO.fromMenu) pmShow(true, 'set');
}
function photoToggle() {
  if (PHOTO.on) photoExit();
  else photoEnter();
}
function photoKey(e) {
  const c = e.code;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(c)) e.preventDefault();
  if (e.repeat && ['Enter', 'Space', 'KeyH', 'KeyF', 'Escape', 'KeyP', 'F9'].includes(c)) return;
  if (c === 'Escape' || c === 'KeyP' || c === 'F9') photoExit();
  else if (c === 'Enter' || c === 'Space') PHOTO.shot = true;
  else if (c === 'KeyH') {
    PHOTO.hud = !PHOTO.hud;
    photoSave();
    photoSync();
  } else if (c === 'KeyF') {
    PHOTO.panel = !PHOTO.panel;
    photoSync();
  } else keys[c] = true;
}
const PHV1 = new V(),
  PHV2 = new V();
