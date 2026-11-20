/* canopy structure, in the airframe's own frame (it is not part of the scaled cockpit group): sill rails, windscreen posts, bows */
const ckW = new THREE.Group(),
  railG = new THREE.Group(),
  wsG = new THREE.Group(),
  hoodG = new THREE.Group();
model.add(ckW);
ckW.add(railG, wsG, hoodG);
[-1, 1].forEach((sd) => {
  for (let z = CAN.z0; z < CAN.z1 - 0.01; z += 0.12) {
    const z2 = Math.min(CAN.z1, z + 0.12);
    bar(
      [sd * (sillX(z) - 0.014), sillY(z) + 0.006, z],
      [sd * (sillX(z2) - 0.014), sillY(z2) + 0.006, z2],
      0.034,
      dark,
      railG,
    );
  }
  add(new THREE.BoxGeometry(0.13, 0.3, 0.8), dark, sd * 0.43, 0.18, -0.5, ck);
}); /* sill rails, side consoles */
function arch(z, t, grp) {
  t = t || 0.026;
  const P = [];
  for (let i = 0; i <= 16; i++) P.push(canPt(z, (Math.PI * i) / 16, 0.01));
  for (let i = 0; i < 16; i++) bar(P[i], P[i + 1], t, dark, grp);
}
function rib(t0, za, zb, th, grp) {
  const n = Math.max(2, Math.round((zb - za) / 0.08));
  for (let i = 0; i < n; i++)
    bar(canPt(za + ((zb - za) * i) / n, t0, 0.01), canPt(za + ((zb - za) * (i + 1)) / n, t0, 0.01), th, dark, grp);
}
arch(fz(149), 0.03, wsG); /* windscreen top bow */
arch(CAN.z0 + 0.012, 0.034, wsG); /* windscreen front frame: closes the glass onto the cowl and joins the sill rails */
[1.15, Math.PI - 1.15].forEach((t0) => rib(t0, CAN.z0 + 0.012, fz(149), 0.026, wsG)); /* the posts either side of the flat centre panel */
arch(fz(152), 0.026, hoodG); /* hood front frame */
arch(fz(205), 0.03, hoodG); /* hood rear frame */
[wsG, hoodG, railG].forEach(mergeGroup);
const canBars = [hoodG]; /* these go with the canopy when the pilot bails out */

