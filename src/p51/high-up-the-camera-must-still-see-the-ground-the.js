/* high up the camera must still see the ground: the view distance and the open sea grow with the height (the old 40 km limit blanked the whole picture above ~40 km); photo and roam cameras both use it */
function highView() {
  const alt = Math.max(0, PHOTO.pos.y),
    far = Math.min(600000, Math.max(40000, alt * 3 + 40000)),
    nr = Math.max(0.3, alt * 0.004);
  if (Math.abs(cam.far - far) > far * 0.02 || Math.abs(cam.near - nr) > nr * 0.05) {
    cam.far = far;
    cam.near = nr;
    cam.updateProjectionMatrix();
  }
  if (SEAP) {
    const sc = Math.max(1, (alt * 4 + 60000) / 60000);
    SEAP.position.set(Math.round(PHOTO.pos.x / 2000) * 2000, -8.4, Math.round(PHOTO.pos.z / 2000) * 2000);
    SEAP.scale.set(sc, 1, sc);
    SEAP.updateMatrix();
  }
}
function photoCam(dt) {
  const k = keys,
    sp = PHOTO.spd * (k.ShiftLeft || k.ShiftRight ? 5 : 1) * dt,
    sy = Math.sin(PHOTO.yaw),
    cy = Math.cos(PHOTO.yaw),
    sx = Math.sin(PHOTO.pitch),
    cx = Math.cos(PHOTO.pitch),
    fw = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0),
    rt = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
    up2 = (k.KeyE ? 1 : 0) - (k.KeyQ ? 1 : 0);
  PHOTO.pos.x += (-sy * cx * fw + cy * rt) * sp;
  PHOTO.pos.y += (sx * fw + up2) * sp;
  PHOTO.pos.z += (-cy * cx * fw - sy * rt) * sp;
  PHOTO.roll += ((k.KeyC ? 1 : 0) - (k.KeyZ ? 1 : 0)) * dt * 0.8;
  highView();
  cam.position.copy(PHOTO.pos);
  cam.quaternion.setFromEuler(PHE.set(PHOTO.pitch, PHOTO.yaw, PHOTO.roll));
  if (Math.abs(cam.fov - PHOTO.fov) > 0.01) {
    cam.fov = PHOTO.fov;
    cam.updateProjectionMatrix();
  }
  plane.visible = PHOTO.showPlane;
}
