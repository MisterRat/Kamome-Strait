/* the home airfield at night: hangar doors and the control tower cab */
const AFL = (() => {
  const pos = [];
  for (let k = 0; k < 3; k++) for (let dz = -9; dz <= 9; dz += 3) pos.push(-177.4, 3, 150 + k * 70 + dz); /* the Butler hangars' open doors */
  for (const [dx, dz] of [
    [2.1, 0],
    [-2.1, 0],
    [0, 2.1],
    [0, -2.1],
    [1.5, 1.5],
    [-1.5, 1.5],
    [1.5, -1.5],
    [-1.5, -1.5],
  ])
    pos.push(-95 + dx, 14, -120 + dz); /* the steel tower's glazed cab */
  pos.push(-95, 15.6, -120); /* beacon on the roof */
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Points(g, BLDL);
  m.frustumCulled = false;
  m.visible = false;
  scene.add(m);
  return m;
})();
