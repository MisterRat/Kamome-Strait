/* canopy: ONE lofted teardrop sitting on the fuselage's cockpit-opening edge (the sill). Table from the drawing:
   [z, top of the glass, squareness]. The windscreen is the part forward of CAN.zJ, the hood the part behind it. */
const CAN = {
  z0: fz(129),
  z1: fz(222),
  zJ: fz(150),
  tab: [
    [fz(129), 0.59, 3.4],
    [fz(134), 0.67, 3.2],
    [fz(140), 0.78, 3.0],
    [fz(146), 0.875, 2.8],
    [fz(150), 0.9, 2.6],
    [fz(158), 0.927, 2.5],
    [fz(170), 0.915, 2.5],
    [fz(180), 0.89, 2.5],
    [fz(190), 0.85, 2.5],
    [fz(200), 0.79, 2.5],
    [fz(210), 0.71, 2.4],
    [fz(216), 0.65, 2.4],
    [fz(222), 0.58, 2.4],
  ],
};
function canSec(z) {
  const yb = sillY(z),
    top = crm(CAN.tab, z, 1);
  return { xb: sillX(z), yb, h: Math.max(0.01, top - yb), e: 2 / crm(CAN.tab, z, 2) };
}
