/* wingtip and tail lights */
const NAVL = [
  [-5.5, wy(5.5) + 0.05, wzle(1) + 0.2, 0xff2a2a],
  [5.5, wy(5.5) + 0.05, wzle(1) + 0.2, 0x2aff55],
  [0, 1.82, 4.2, 0xffffff] /* top of the fixed fin, so it stays put when the rudder moves */,
].map((a) => {
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: GLOWT,
      color: a[3],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  sp.scale.set(0.8, 0.8, 1);
  sp.position.set(a[0], a[1], a[2]);
  sp.visible = false;
  model.add(sp);
  return sp;
});
HOOKS.nightLights.push(...NAVL); /* they fade in with the dusk (WX.paint) */
