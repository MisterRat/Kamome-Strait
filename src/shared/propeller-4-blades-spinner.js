/* propeller: 4 blades + spinner */
const prop = new THREE.Group();
prop.position.set(0, 0, fz(20.5));
model.add(prop);
const bladeGroups = [];
for (let k = 0; k < 4; k++) {
  const b = new THREE.Group();
  b.rotation.z = (k * Math.PI) / 2;
  prop.add(b);
  bladeGroups.push(b);
  const bl = add(new THREE.BoxGeometry(0.2, 1.5, 0.03), dark, 0, 0.2 + 0.75, -0.05, b);
  bl.rotation.y = 0.28;
  add(
    new THREE.BoxGeometry(0.2, 0.2, 0.032),
    new THREE.MeshLambertMaterial({ color: 0xe8c020 }),
    0,
    1.62,
    -0.05,
    b,
  ).rotation.y = 0.28;
}
{
  const sp = [
    [0, -0.52],
    [0.2, -0.39],
    [0.3, -0.27],
    [0.37, -0.09],
    [0.38, 0.165],
  ];
  add(
    new THREE.LatheGeometry(
      new THREE.SplineCurve(sp.map((p) => new THREE.Vector2(p[0], p[1])))
        .getPoints(30)
        .map((v) => new THREE.Vector2(Math.max(0, v.x), v.y)),
      24,
    ).rotateX(Math.PI / 2),
    red,
    0,
    0,
    0,
    prop,
  );
}
const ring = add(
  new THREE.CircleGeometry(1.7, 28),
  new THREE.MeshBasicMaterial({ color: 0x222, transparent: true, opacity: 0.14, side: 2, depthWrite: false }),
  0,
  0,
  -0.05,
  prop,
);
