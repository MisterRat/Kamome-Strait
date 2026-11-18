/* seat, armour plate, headrest */
add(new THREE.BoxGeometry(0.2, 0.55, 0.2), pmatD, 0, 0.066, -0.35, ck);
add(new THREE.BoxGeometry(0.46, 0.06, 0.46), pmatD, 0, 0.356, -0.45, ck);
add(new THREE.BoxGeometry(0.46, 0.55, 0.07), pmatD, 0, 0.656, -0.2, ck);
add(new THREE.BoxGeometry(0.28, 0.2, 0.06), pmatD, 0, 1.086, -0.2, ck);
const ckStick = new THREE.Group();
ckStick.position.set(0, 0.05, -0.82);
ck.add(ckStick);
add(
  new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10),
  PH(0xdfe2e2, 70, 0xffffff),
  0,
  0.25,
  0,
  ckStick,
); /* the long pale stick */
add(new THREE.SphereGeometry(0.04, 10, 8), dark, 0, 0.52, 0, ckStick);
const ckPed = {},
  ckPedU = {},
  ckLev = {}; /* animated console levers: flap, gear */
const ckThr = new THREE.Group();
ckThr.position.set(-0.43, 0.34, -0.45);
ck.add(ckThr);
add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), dark, 0, 0.1, 0, ckThr);
add(new THREE.SphereGeometry(0.03, 8, 6), red, 0, 0.21, 0, ckThr);
