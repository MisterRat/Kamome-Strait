/* runway lights: edges, centreline, green thresholds */
const RWL = (() => {
  const pos = [],
    col = [],
    add = (x, z, r, g, b) => {
      pos.push(x, 0.9, z);
      col.push(r, g, b);
    };
  for (let z = RW.zS - 10, n = 0; z > RW.zN + 10 && n < 59; z -= 45, n++) {
    add(-27, z, 1, 0.95, 0.8); /* on the edge-light fixtures */
    add(27, z, 1, 0.95, 0.8);
  }
  for (let z = RW.zS - 5; z > RW.zN + 5; z -= 30) add(0, z, 1, 1, 0.9);
  for (let x = -25; x <= 25; x += 5) {
    add(x, RW.zS - 1, 0.2, 1, 0.3);
    add(x, RW.zN + 1, 0.2, 1, 0.3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Points(
    g,
    new THREE.PointsMaterial({
      map: GLOWT,
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  m.frustumCulled = false;
  m.visible = false;
  scene.add(m);
  return m;
})();
