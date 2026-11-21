/* the P-51's cockpit group (ck): part of the airframe (the canopy structure puts its sill parts in it); the P-51's own cockpit
   pieces fill it with the interior. Copies of the aircraft (P51DISP) leave it out. */
const ck = new THREE.Group();
ck.scale.set(0.8, 0.88, 1); /* the cockpit is built roomy; the blueprint says the real one is narrower and sits lower, so it is fitted to the fuselage here */
ck.position.y = -0.29;
model.add(ck);
/* a square bar from p1 to p2, t thick, in the cockpit group (or par) */
function bar(p1, p2, t, mat, par) {
  const a = new V(p1[0], p1[1], p1[2]),
    b = new V(p2[0], p2[1], p2[2]),
    m = new THREE.Mesh(new THREE.BoxGeometry(t, t, a.distanceTo(b)), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b);
  (par || ck).add(m);
  return m;
}
