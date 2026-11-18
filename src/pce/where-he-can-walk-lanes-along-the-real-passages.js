/* where he can walk: lanes along the real passages (frame, z in metres), each a band about a metre wide. Forward round the Hedgehog,
   aft along the port side of the deckhouse and outboard of the whaleboat, in past the 40 mm directors to the centreline, between
   the twin 40 mm tubs and down the ladder at the break, then the main deck aft: round the K-guns either side to the racks */
const TPLANE = [
  [[24.0, 0], [25.0, -4.15]],
  [[24.0, 0], [25.0, 4.15]],
  [[25.0, 4.15], [43.6, 4.35]] /* the starboard side passage (the 20 mm tub closes it aft) */,
  [[25.0, -4.15], [43.9, -4.35]],
  [[43.9, -4.35], [57.4, -4.4]] /* outboard of the whaleboat */,
  [[57.4, -4.4], [57.6, -3.4]],
  [[57.6, -3.4], [58.2, -0.4]],
  [[58.2, -0.4], [62.4, 0]],
  [[62.4, 0], [63.7, 0]] /* the ladder */,
  [[63.7, 0], [68.3, 0]],
  [[68.3, 0], [69.0, -2.7]],
  [[69.0, -2.7], [73.0, -2.95]],
  [[73.0, -2.95], [76.0, -3.2]],
  [[76.0, -3.2], [79.5, -3.0]],
  [[68.3, 0], [67.4, 2.6]],
  [[67.4, 2.6], [68.5, 2.2]],
  [[68.5, 2.2], [71.0, 2.3]],
  [[71.0, 2.3], [73.0, 2.95]],
  [[73.0, 2.95], [76.0, 3.2]],
  [[76.0, 3.2], [79.5, 3.0]],
  [[79.5, -3.0], [79.8, 0]],
  [[79.5, 3.0], [79.8, 0]],
  [[79.8, 0], [83.6, 0]] /* between the racks */,
];
function tpFree(x, z) {
  const r = 0.5;
  for (const [[f0, z0], [f1, z1]] of TPLANE) {
    const ax = tpXF(f0),
      bx = tpXF(f1),
      dx = bx - ax,
      dz = z1 - z0,
      L2 = dx * dx + dz * dz,
      t = L2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - z0) * dz) / L2)) : 0,
      ex = x - (ax + dx * t),
      ez = z - (z0 + dz * t);
    if (ex * ex + ez * ez < r * r) return true;
  }
  return false;
}
