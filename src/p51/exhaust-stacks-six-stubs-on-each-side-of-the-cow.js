/* exhaust stacks: six stubs on each side of the cowl */
[-1, 1].forEach((sd) => {
  for (let i = 0; i < 6; i++) {
    const z = fz(38 + 8 * i);
    add(new THREE.BoxGeometry(0.06, 0.1, 0.2), soot, sd * (fusX(z, 0.11) + 0.012), 0.11, z);
  }
});
