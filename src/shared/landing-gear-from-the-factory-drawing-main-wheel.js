/* landing gear, from the factory drawing: main wheel centres 142 in apart (71 in each side) at station 114, 27 in tyres, 76.5 in from the
   reference line to the ground, tail wheel at station 313, 26.5 in below the line. These numbers also decide the sitting attitude, the
   ground pitch limit and the ride height */
const GEAR = { mainR: 0.343, mainY: -1.6, mainZ: fz(114), mainX: 1.8, tailR: 0.17, tailY: -0.673, tailZ: fz(313) };
GEAR.mainBottom = GEAR.mainY - GEAR.mainR;
GEAR.tailBottom = GEAR.tailY - GEAR.tailR;
GEAR.h = -GEAR.mainBottom - 0.02; /* origin height above the terrain with the main wheels down: the model sits 0.17 m above the origin and the runway surface is 0.15 m above the terrain */
GEAR.sit = Math.atan2(
  GEAR.tailBottom - GEAR.mainBottom,
  GEAR.tailZ - GEAR.mainZ,
); /* nose-up angle at which the tail wheel touches too */
const gear = new THREE.Group();
model.add(gear);
