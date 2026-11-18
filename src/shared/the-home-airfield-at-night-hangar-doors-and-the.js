/* the home airfield at night: hangar doors and the control tower cab */
const AFL = (() => {
  const pos = [];
  for (let k = 0; k < 3; k++) for (let dz = -6; dz <= 6; dz += 3) pos.push(-190 + 12.6, 3, 150 + k * 70 + dz);
  for (const [dx, dz] of [
    [4.8, 0],
    [-4.8, 0],
    [0, 4.8],
    [0, -4.8],
    [3.4, 3.4],
    [-3.4, 3.4],
    [3.4, -3.4],
    [-3.4, -3.4],
  ])
    pos.push(-95 + dx, 16.4, -120 + dz);
  pos.push(-95, 19.6, -120); /* beacon on the roof */
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Points(g, BLDL);
  m.frustumCulled = false;
  m.visible = false;
  scene.add(m);
  return m;
})();
