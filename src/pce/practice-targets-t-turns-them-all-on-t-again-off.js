/* PRACTICE TARGETS (T turns them all on, T again off). Laid out round the ship where she is when they go on:
   for the 3"/50, three battle-practice target rafts on the surface at 2,000, 4,000 and 6,000 yd; for the 40 mm, a sleeve towed
   by a target tug circling at 1,600 m, 400 m up, 140 knots; for the 20 mm, a sleeve circling at 800 m, 150 m up, 110 knots.
   The sleeves trail 450 m of cable behind their tugs. A hit is a shell through the target (the 3"/50's VT fuze counts within its
   burst radius); hitting a tug is reported. */
const PT = {
  on: false,
  L: [] /* targets: { kind: 'raft' | 'sleeve' | 'tug', p (world), r (hit radius), m (mesh), hits, ... } */,
  g: null,
  c: new THREE.Vector3(),
  hits: { raft: 0, sleeve: 0 },
};
