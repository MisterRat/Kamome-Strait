/* the player's ship state (see THE PLAYER'S SHIP above the loop for how it is used) */
const SHIP = {
  VMAX: 15.7 * 0.5144 /* full ahead, m/s (first-pass figure, Phase 3 replaces it with researched trials data) */,
  VAST: 6 * 0.5144 /* full astern */,
  TAU: 25 /* seconds to settle most of the way on a new speed */,
  RMIN: 180 /* turning radius at full rudder, m (first-pass figure) */,
  EYE: new THREE.Vector3(0, 11.3, -8.5) /* the current station's eye, from the waterline amidships (bow toward -z); set by shipStation() */,
  stn: 1 /* station 1-6 (PCEM.STN) */,
  sub: 0 /* which view at that station */,
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
/* her battle damage (BATTLE DAMAGE, the PCE-842): holes, flooding and fire 0..1 of their worst, the engines' damage, her loss; shaft:
   the speed a shallow charge under her stern leaves her */
const SDM = { holes: 0, flood: 0, fire: 0, eng: 0, lost: false, sink: 0, smokeT: 0, msgT: 0, shaft: 1 };
