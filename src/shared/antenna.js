/* antenna */
add(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6), dark, 0, 0.78, 1.5);
model.add(
  new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new V(0, 1.05, 1.5), new V(0, 1.72, 4.1)]),
    new THREE.LineBasicMaterial({ color: 0x222222 }),
  ),
);
