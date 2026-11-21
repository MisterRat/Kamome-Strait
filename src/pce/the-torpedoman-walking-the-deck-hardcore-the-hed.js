/* the torpedoman walking the deck (Hardcore), the Hedgehog, and the attack run the OOD cons (see THE TORPEDOMAN AT WORK) */
const TPW = { p: new THREE.Vector2() /* model x, z */, at: 3, bob: 0, ob: [] },
  HH = { n: 24, L: [], q: [], ld: 0, hits: 0 },
  ASW = { who: 'tp' /* who the attack is for: the torpedoman's run (5) or the sonar test (3) */, ph: 'idle', t: 0, O: [], f: {}, run: 0, tel: 0, hold: 0, depth: 100, best: 1e9, hh: 0, un: 0, bad: false, msg: '', deb: '', debT: 0 };
