/* ---------- PT-108 towing the sled ----------
   She runs an oval round the ship at 30 knots: 1,800 m out ahead and astern, 500 m abeam, centred on the ship and moving with
   her. The sled, 300 m astern on its tow line, follows exactly in her track, so it passes inside the 20 mm's 1,000 yards on each
   run down the ship's side and stays inside the 40 mm's 4,000 yards round the ends (a close pass about every four minutes).
   The oval is laid along the ship's heading when the exercise starts and stays fixed in direction. */
const PTOW = { A: 1800, B: 500, TOW: 300, KN: 30 };
function ptTowStart() {
  const boat = PTB.build('108') /* the tow boat: PT-108, a squadron mate of the fleet's PT-105 (PTRon 5, in service to November 1945) */,
    sl = PTB.sled(),
    ax = Math.atan2(-Math.cos(SHIP.hdg), -Math.sin(SHIP.hdg)) /* the ship's heading as an angle in x, z */,
    o = { th: -0.6, c: new THREE.Vector3(pos.x, 0, pos.z), u: new THREE.Vector3(Math.cos(ax), 0, Math.sin(ax)), trail: [], v: PTOW.KN * 0.5144 };
  o.w = new THREE.Vector3(-o.u.z, 0, o.u.x);
  scene.add(boat, sl);
  /* the sled's game-mode marker ring */
  sl.add(ptRingSprite());
  const tb = { kind: 'ptboat', p: new THREE.Vector3(), r: 6, m: boat, o, v: new THREE.Vector3() },
    ts = { kind: 'sled', p: new THREE.Vector3(), r: 4.5, m: sl, o, v: new THREE.Vector3(), gun: '20' };
  /* lay her track back along the oval so the sled starts 300 m astern of her, on it */
  const P = (th) => ptTowAt(o, th, new THREE.Vector3());
  let th = o.th,
    d = 0,
    prev = P(th);
  o.trail.unshift({ p: prev.clone(), d: 0 });
  while (d < PTOW.TOW + 40) {
    th -= 0.002;
    const q = P(th);
    d += q.distanceTo(prev);
    o.trail.push({ p: q.clone(), d });
    prev = q;
  }
  PT.L.push(tb, ts);
  RADIO.add('PT 105', 'ON STATION WITH THE SLED. THIRTY KNOTS, TOW 300 YARDS. COMMENCE FIRING WHEN READY. AIM AT THE SLED.');
}
