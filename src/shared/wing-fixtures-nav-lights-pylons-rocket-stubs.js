/* wing fixtures: nav lights, pylons, rocket stubs */
add(
  new THREE.SphereGeometry(0.07, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
  -5.55,
  wy(5.55) + 0.03,
  wzle(1) + 0.2,
);
add(
  new THREE.SphereGeometry(0.07, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0x2aff5a }),
  5.55,
  wy(5.55) + 0.03,
  wzle(1) + 0.2,
);
[-1, 1].forEach((s) => {
  add(new THREE.BoxGeometry(0.09, 0.34, 0.55), metal2, s * 2.9, wy(2.9) - 0.2, wmid(2.9 / WSEMI));
  [3.7, 4.1, 4.5].forEach((x) => add(new THREE.BoxGeometry(0.05, 0.2, 0.35), metal2, s * x, wy(x) - 0.17, wmid(x / WSEMI)));
});
