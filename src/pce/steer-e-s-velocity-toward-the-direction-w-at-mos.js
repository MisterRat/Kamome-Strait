/* steer e's velocity toward the direction w, at most RAIDV.G g of turn; speed toward sp. Banks the model into the turn */
function raidSteer(e, w, sp, dt) {
  const v = e.v,
    s = v.length(),
    f = v.clone().divideScalar(s),
    ang = Math.acos(Math.max(-1, Math.min(1, f.dot(w)))),
    om = (RAIDV.G * 9.81) / Math.max(60, s),
    k = Math.min(1, (om * dt) / Math.max(1e-4, ang)),
    nf = f.clone().lerp(w, k).normalize(),
    turn = new THREE.Vector3().crossVectors(f, nf).y / Math.max(dt, 1e-4);
  const s2 = s + Math.max(-12 * dt, Math.min(8 * dt + Math.max(0, -nf.y) * 9.81 * dt, sp - s));
  v.copy(nf).multiplyScalar(s2);
  e.fwd.copy(nf);
  e.bank += (Math.max(-1.3, Math.min(1.3, Math.atan((turn * s2) / 9.81))) - e.bank) * Math.min(1, 3 * dt);
}
function raidPose(e) {
  const f = e.fwd,
    r = new THREE.Vector3().crossVectors(f, GUN.up);
  if (r.lengthSq() < 1e-6) r.set(1, 0, 0);
  r.normalize();
  const u = new THREE.Vector3().crossVectors(r, f);
  e.b.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -e.bank));
  e.b.g.position.copy(e.p);
}
