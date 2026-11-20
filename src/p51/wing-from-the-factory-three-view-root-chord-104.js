/* ---------- wing, from the factory three-view: root chord 104 in, tip chord 50 in, 25% chord line at one fuselage station,
   trailing edge broken at the flap/aileron joint, 5 degrees of dihedral. Stations are inches from the spinner tip (1 in = 0.0254 m). */
const WR = -0.58, /* wing root centre height: its top sits just under the cockpit floor */
  WD = 0.5, /* rise from root to tip (5 degrees of dihedral) */
  WSEMI = 5.64,
  WZ_LE0 = -4.88 + 107.9 * 0.0254,
  WZ_LE1 = -4.88 + 121.4 * 0.0254,
  WZ_TE0 = -4.88 + 211.9 * 0.0254,
  WZ_TEK = -0.115,
  WZ_TE1 = -4.88 + 171.4 * 0.0254,
  WU_K = 0.59;
const wzle = (u) => WZ_LE0 + (WZ_LE1 - WZ_LE0) * Math.min(1, u); /* leading edge z at span fraction u */
const wzte = (u) => {
  u = Math.min(1, u);
  return u < WU_K ? WZ_TE0 + ((WZ_TEK - WZ_TE0) * u) / WU_K : WZ_TEK + ((WZ_TE1 - WZ_TEK) * (u - WU_K)) / (1 - WU_K);
}; /* trailing edge z, including the flap or aileron */
const wcf = (u) => {
  const a = u * WSEMI,
    ak = WU_K * WSEMI;
  /* measured on the plan drawing: the flap is about 0.55 m deep at the fuselage tapering to 0.43 m where it meets the aileron; the aileron tapers from 0.43 m to 0.19 m at the tip */
  if (a <= ak) return 0.55 - (0.55 - 0.43) * Math.max(0, (a - 0.575) / (ak - 0.575));
  return Math.max(0.19, 0.43 - (0.43 - 0.19) * ((a - ak) / (5.45 - ak)));
}; /* depth of the flap (inboard) and of the aileron (outboard) */
const wzh = (u) => wzte(u) - wcf(u); /* the hinge line: where the fixed wing ends */
const wmid = (u) => (wzle(u) + wzh(u)) / 2; /* middle of the fixed wing chord */
const wy = (x) => WR + (Math.abs(x) / WSEMI) * WD; /* wing centre-line height incl. dihedral */
function shp(pts) {
  const sh = new THREE.Shape();
  pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
  return sh;
}
function plate(pts, th) {
  const g = new THREE.ExtrudeGeometry(shp(pts), { depth: th, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(th / 2, 0, 0);
  return g;
} /* pts = [z,y] side profile */
function slab(pts, th) {
  const g = new THREE.ExtrudeGeometry(shp(pts), { depth: th, bevelEnabled: false });
  g.rotateX(Math.PI / 2);
  g.translate(0, th / 2, 0);
  return g;
} /* pts = [x,z] planform */
