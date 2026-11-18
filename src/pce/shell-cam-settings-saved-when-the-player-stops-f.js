/* SHELL CAM (Settings, saved): when the player stops firing with his shells still in the air, the camera cuts to a three-quarter view of
   where the last of them passes closest to an airborne target (if it comes within 250 m of one), or else where it comes down,
   framed with the nearest surface target, drifts slowly round it while they land, holds for the
   splashes, and cuts back to the gun. Firing again cuts back at once. */
const SCAM = { want: store.get('scam2', false) === true, on: false, t: 0, end: 0, hold: 0, F: new THREE.Vector3(), L: new THREE.Vector3(), tg: null, a: 0, D: 60, p0: new THREE.Vector3(), q0: new THREE.Quaternion() };
