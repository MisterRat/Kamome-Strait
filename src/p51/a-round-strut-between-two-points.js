/* a round strut between two points */
const GV = new THREE.Vector3(),
  GY = new THREE.Vector3(0, 1, 0);
function gStrut(a, b, r0, r1, m, p) {
  GV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = GV.length(),
    o = add(new THREE.CylinderGeometry(r1, r0, L, 10), m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, p || gear);
  o.quaternion.setFromUnitVectors(GY, GV.normalize());
  return o;
}
const gearTop = (s) => [s * 1.42, wy(1.42) - 0.2, GEAR.mainZ],
  gearAxle = (s) => [s * (GEAR.mainX - 0.12), GEAR.mainY, GEAR.mainZ];
[-1, 1].forEach((s) => {
  gStrut(gearTop(s), gearAxle(s), 0.05, 0.075, metal2);
  const a = gearTop(s),
    b = gearAxle(s);
  const door = gStrut(
    [a[0] + s * 0.05, a[1], a[2]],
    [b[0] + s * 0.05, b[1] + 0.35, b[2]],
    0.0,
    0.0,
    metal,
  );
  door.geometry = new THREE.BoxGeometry(0.03, Math.hypot(b[0] - a[0], b[1] + 0.35 - a[1]) * 0.9, 0.34);
  add(
    new THREE.CylinderGeometry(GEAR.mainR, GEAR.mainR, 0.2, 22).rotateZ(Math.PI / 2),
    dark,
    s * GEAR.mainX,
    GEAR.mainY,
    GEAR.mainZ,
    gear,
  );
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 16).rotateZ(Math.PI / 2), metal2, s * GEAR.mainX, GEAR.mainY, GEAR.mainZ, gear);
});
add(new THREE.BoxGeometry(0.05, 0.3, 0.07), metal2, 0, -0.53, GEAR.tailZ - 0.02, gear);
add(new THREE.BoxGeometry(0.2, 0.08, 0.3), metal2, 0, -0.42, GEAR.tailZ, gear);
add(
  new THREE.CylinderGeometry(GEAR.tailR, GEAR.tailR, 0.1, 12).rotateZ(Math.PI / 2),
  dark,
  0,
  GEAR.tailY,
  GEAR.tailZ,
  gear,
);
