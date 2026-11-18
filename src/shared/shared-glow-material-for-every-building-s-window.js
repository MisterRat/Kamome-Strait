/* shared glow material for every building's windows (buildings are made at load, before the weather code) */
const BLDL = new THREE.PointsMaterial({
  map: GLOWT,
  size: 3.2,
  color: 0xffd98a,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
