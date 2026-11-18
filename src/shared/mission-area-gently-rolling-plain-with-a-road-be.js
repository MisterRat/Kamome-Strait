/* ---------- mission area: gently rolling plain with a road between a depot and a base ---------- */
const ROADC = new THREE.CatmullRomCurve3(
  [
    [3700, -2100],
    [4150, -2350],
    [4600, -2800],
    [4750, -3400],
    [4950, -3950],
    [5150, -4250],
    [5400, -4350],
  ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
  false,
  'catmullrom',
  0.5,
);
