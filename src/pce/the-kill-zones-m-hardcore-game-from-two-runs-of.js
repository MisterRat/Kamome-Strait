/* the kill zones, m (Hardcore / game), from two runs of PCE-842_raid_calibration.py (3,000 rounds a gun each): smaller than the
   sleeves' because a strafing run comes almost straight at the guns, so the shells pass closer for the same rounds per kill */
const RAIDKR = { '3in': [0.25, 1.21], 20: [0.047, 0.23], 40: [0.069, 0.34] };
var RAID = {
  L: [] /* { b (buildEnemy), p, v, st, hp, runs, t, fire, ... } */,
  next: 90 /* seconds to the next raid */,
  hits: 0 /* rounds that struck the ship */,
  kills: 0,
  tr: [] /* the raiders' tracers in flight: { a, b, t } */,
  home: null,
};
{
  const n = 120,
    P = new Float32Array(n * 6),
    g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setDrawRange(0, 0);
  RAID.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffc070, fog: false, transparent: true, opacity: 0.85 }));
  RAID.lines.frustumCulled = false;
  RAID.trP = P;
  scene.add(RAID.lines);
}
const RAIDV = { CRU: 140 /* cruise, m/s (about 500 km/h) */, ATK: 175 /* in the dive */, ALT: 1500, G: 5 /* turn, g */, RNG: 9000 };
function raidClear() {
  for (const e of RAID.L) scene.remove(e.b.g);
  RAID.L.length = 0;
  RAID.tr.length = 0;
  RAID.lines.geometry.setDrawRange(0, 0);
}
