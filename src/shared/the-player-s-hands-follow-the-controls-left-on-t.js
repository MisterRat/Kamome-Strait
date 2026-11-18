/* the player's hands follow the controls: left on the throttle knob, right on the stick grip (two-bone reach, elbows down and out) */
const IK = {
  v: new V(),
  d: new V(),
  pv: new V(),
  u: new V(),
  f: new V(),
  h: new V(),
  e: new V(),
  t: new V(),
  fw: new V(0, 0, -1),
  dn: new V(0, -1, 0),
  pole: new V(),
  qi: new THREE.Quaternion(),
};
function ikArm(a, el, T, sd) {
  const S = a.position,
    L1 = 0.3,
    L2 = 0.3;
  IK.v.copy(T).sub(S);
  const d = Math.min(Math.max(IK.v.length(), 0.12), L1 + L2 - 0.004);
  IK.d.copy(IK.v).normalize();
  IK.pole.set(sd * 0.6, -1, 0.4);
  IK.pv.copy(IK.pole).addScaledVector(IK.d, -IK.pole.dot(IK.d)).normalize();
  const ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d),
    sa = Math.sqrt(Math.max(0, 1 - ca * ca));
  IK.u.copy(IK.d).multiplyScalar(ca).addScaledVector(IK.pv, sa);
  a.quaternion.setFromUnitVectors(IK.fw, IK.u);
  IK.e.copy(S).addScaledVector(IK.u, L1);
  IK.h.copy(S).addScaledVector(IK.d, d);
  IK.f.copy(IK.h).sub(IK.e).normalize().applyQuaternion(IK.qi.copy(a.quaternion).invert());
  el.quaternion.setFromUnitVectors(IK.fw, IK.f);
}
function pilotIK() {
  const u = plPilot.userData;
  u.up.rotation.x = -0.08; /* sits upright against the seat back so the shoulder harness works */
  plPilot.updateWorldMatrix(true, true);
  ckStick.updateWorldMatrix(true, false);
  ckThr.updateWorldMatrix(true, false);
  IK.t.set(0, 0.4, 0);
  ckStick.localToWorld(IK.t);
  u.up.worldToLocal(IK.t);
  ikArm(u.arms[1], u.elbs[1], IK.t, 1);
  IK.t.set(-0.44, 0.57, -0.56); /* the left hand rests on the blue propeller lever */
  ck.localToWorld(IK.t);
  u.up.worldToLocal(IK.t);
  ikArm(u.arms[0], u.elbs[0], IK.t, -1);
  [-1, 1].forEach((sd, i) => {
    /* the feet rest on the rudder pedals (thigh 0.5 m, shin 0.5 m) */
    ckPed[sd].updateWorldMatrix(true, false);
    IK.t.set(0, 0.01, -0.12); /* heel on the floor plate, toes against the upright pedal */
    ckPed[sd].localToWorld(IK.t);
    plPilot.worldToLocal(IK.t);
    ikLeg(u.legs[i][0], u.legs[i][1], IK.t, sd);
  });
}
function ikLeg(l, k, T, sd) {
  const S = l.position,
    L1 = 0.5,
    L2 = 0.5;
  IK.v.copy(T).sub(S);
  const d = Math.min(Math.max(IK.v.length(), 0.2), L1 + L2 - 0.004);
  IK.d.copy(IK.v).normalize();
  IK.pole.set(sd * 0.25, 1, -0.2);
  IK.pv.copy(IK.pole).addScaledVector(IK.d, -IK.pole.dot(IK.d)).normalize();
  const ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d),
    sa = Math.sqrt(Math.max(0, 1 - ca * ca));
  IK.u.copy(IK.d).multiplyScalar(ca).addScaledVector(IK.pv, sa);
  l.quaternion.setFromUnitVectors(IK.fw, IK.u);
  IK.e.copy(S).addScaledVector(IK.u, L1);
  IK.h.copy(S).addScaledVector(IK.d, d);
  IK.f.copy(IK.h).sub(IK.e).normalize().applyQuaternion(IK.qi.copy(l.quaternion).invert());
  k.quaternion.setFromUnitVectors(IK.dn, IK.f);
}
