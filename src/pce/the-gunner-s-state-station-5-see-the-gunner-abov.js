/* the gunner's state (station 5; see THE GUNNER above the loop) */
const GUN = {
  M: [] /* the mounts */,
  cur: null /* the mount the player is on (station 5, first person) */,
  look: false /* looking up from the sight */,
  rng: 2000 /* the 3"/50's sight range, m */,
  rmb: false /* right mouse button held: fire */,
  B: [] /* shells in flight */,
  F: [] /* splashes, bursts, smoke */,
  geo: null,
  pos: null,
  col: null,
  V: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
  sp: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0),
};
