/* the player's ship state (see THE PLAYER'S SHIP above the loop for how it is used) */
const SHIP = {
  VMAX: 15.7 * 0.5144 /* full ahead, m/s (first-pass figure, Phase 3 replaces it with researched trials data) */,
  VAST: 6 * 0.5144 /* full astern */,
  TAU: 25 /* seconds to settle most of the way on a new speed */,
  RMIN: 180 /* turning radius at full rudder, m (first-pass figure) */,
  EYE: new THREE.Vector3(0, 11.3, -8.5) /* the current station's eye, from the waterline amidships (bow toward -z); set by her role's stationTake() */,
  look: [0, 0] /* the station's own look direction: yaw (+ to starboard), pitch */,
  YAX: new THREE.Vector3(0, 1, 0),
  QB: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2) /* the model's bow is +x, the player's is -z */,
  E: new THREE.Euler(0, 0, 0, 'YXZ'),
  hdg: 0 /* rad; 0 = north (-z), heading in degrees = -hdg */,
  u: 0 /* speed through the water, m/s */,
  r: 0 /* rate of turn, rad/s */,
  tel: 0 /* engine order: -0.5 full astern .. 0 stop .. 1 flank */,
  rud: 0 /* rudder, -1 full left .. +1 full right */,
  t: 0,
  hold: 0 /* the heading the helmsman holds while the player is at a gun */,
  aground: false,
};
/* returning to base (RETURN TO BASE): on while the helmsman takes her home or she lies at her berth; ph its stage */
const RTB = { on: false, ph: '', tel: 0, hold: 0 };
/* her magazines (the user's, 2026-11-21: the PCE resupplies like everyone else): the rounds below decks that the ready-use ammunition
   is filled from, shared by all her guns of a kind (only the manned mount of each fires). 3"/50: 1,400 (NavWeaps: 200 - 300 ready
   use and about 1,200 in the magazine a gun); 40 mm: 6,000 for her three twin mounts and 20 mm: 10,000 for her four guns (estimates,
   about 1,000 a barrel and 2,400 a gun, the escorts' allowance of the time); Hedgehog: 72 bombs besides the 24 on the spigots (three
   reloads, estimated); depth charges: 36 besides the 16 in the racks and the 4 in the K-guns (56 in all: the racks' 40, 20 each in
   HyperWar's figures, and 16 for the K-guns, estimated). Filled again alongside any American base (rearming) */
const MAG0 = { '3in': 1400, 40: 6000, 20: 10000, hh: 72, dc: 36 },
  MAG = Object.assign({}, MAG0);
/* her battle damage (BATTLE DAMAGE, the PCE-842): holes, flooding and fire 0..1 of their worst, the engines' damage, her loss; shaft:
   the speed a shallow charge under her stern leaves her */
const SDM = { holes: 0, flood: 0, fire: 0, eng: 0, lost: false, sink: 0, smokeT: 0, msgT: 0, shaft: 1, pump: 0 /* seconds of the player's pumps */, cf: 0 /* counter-flooded: how much of the list is taken off */ };
/* SHIP.stn (station 1-5, PCEM.STN) and SHIP.sub (which view there) are the shared STATION's (the stations piece): the same two numbers */
Object.defineProperties(SHIP, {
  stn: { get: () => STATION.stn, set: (v) => (STATION.stn = v), enumerable: true },
  sub: { get: () => STATION.sub, set: (v) => (STATION.sub = v), enumerable: true },
});
