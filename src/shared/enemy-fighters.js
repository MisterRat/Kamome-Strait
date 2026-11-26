/* ---------- enemy fighters ---------- */
const EN = [],
  EB = [],
  MAXE = 300,
  epos = new Float32Array(MAXE * 6),
  egeo = new THREE.BufferGeometry(),
  m4 = new THREE.Matrix4(),
  UPV = new V(0, 1, 0);
const DIFFS = [
  { n: 'LOW', f: 0.4, kb: 0.1043, hp: 8, spread: 0.12, dmg: 0.5, cone: 0.9998, burst: 0.35, rng: 350 },
  { n: 'MEDIUM', f: 0.65, kb: 0.1117, hp: 15, spread: 0.05, dmg: 1, cone: 0.9993, burst: 0.7, rng: 500 },
  { n: 'HARD', f: 1, kb: 0.0212, hp: 35, spread: 0.022, dmg: 2, cone: 0.996, burst: 1.4, rng: 750 },
];
let DIFF = DIFFS[1];
function setDiff(i) {
  DIFF = DIFFS[i];
  document.querySelectorAll('#dl button').forEach((b) => b.classList.toggle('on', +b.dataset.d == i));
  if (started) note('DIFFICULTY: ' + DIFF.n + ' (' + Math.round(DIFF.f * 100) + '% of P-51)');
}
document.querySelectorAll('#dl button').forEach((b) => (b.onclick = () => setDiff(+b.dataset.d)));
setDiff(1);
const MAXEN = 1;
let php = 100,
  airKills = 0,
  hitF = 0,
  lastSpawn = 0;
egeo.setAttribute('position', new THREE.BufferAttribute(epos, 3));
egeo.setDrawRange(0, 0);
const elines = new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({ color: 0xff6a3a, fog: false }));
elines.frustumCulled = false;
scene.add(elines);

/* the bandits are solid (PHYS): one that flies into anything (a ship, a building, the player's aircraft) is destroyed there */
if (typeof PHYS !== 'undefined')
  PHYS.flyers({
    name: 'KI-84',
    list: () => EN,
    live: (e) => !e.dying,
    o: (e) => e.g,
    m: 3900,
    hit: (e, o, info) => {
      if (e.dying) return;
      damageE(e, 1e4);
      explode((info.p || e.p).clone(), 14);
    },
  });
