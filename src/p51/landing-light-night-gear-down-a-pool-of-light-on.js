/* landing light (night, gear down): a pool of light on the ground ahead of the nose, at the point the lamp's beam meets the ground */
const LLP = (() => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: GLOWT,
      color: 0xfff0c0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  m.visible = false;
  m.frustumCulled = false;
  scene.add(m);
  return m;
})();
function updLandingLight() {
  const on = started && !crashed && gearOn && (WX.lt || 0) > 0.3 && !BL.on;
  LLP.visible = on;
  if (!on) return;
  const dx = fwd.x - up.x * 0.12,
    dy = fwd.y - up.y * 0.12,
    dz = fwd.z - up.z * 0.12,
    dl = Math.hypot(dx, dy, dz);
  let t = 15,
    x = 0,
    y = 0,
    z = 0;
  for (; t < 600; t += 15) {
    x = pos.x + (dx / dl) * t;
    y = pos.y + (dy / dl) * t;
    z = pos.z + (dz / dl) * t;
    if (y <= H(x, z)) break;
  }
  if (t >= 600) {
    LLP.visible = false;
    return;
  }
  const sc = 7 + t * 0.09;
  LLP.position.set(x, H(x, z) + 0.35, z);
  LLP.scale.set(sc, 1, sc * 1.7);
  LLP.rotation.y = Math.atan2(fwd.x, fwd.z);
  LLP.material.opacity = Math.min(0.75, (WX.lt - 0.2) * 1.1) * (1 - t / 640);
}
