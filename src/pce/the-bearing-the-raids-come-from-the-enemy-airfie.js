/* the bearing the raids come from: the enemy airfield (its parked fighters), or the north if it is not in the world */
function raidHome() {
  if (RAID.home) return RAID.home;
  const pl = T.filter((t) => t.type === 'plane');
  if (pl.length) {
    const c = new THREE.Vector3();
    for (const t of pl) c.add(t.c);
    RAID.home = c.divideScalar(pl.length);
  } else RAID.home = new THREE.Vector3(pos.x, 0, pos.z - 20000);
  return RAID.home;
}
function raidBrg(p) {
  return Math.round(((Math.atan2(p.x - pos.x, -(p.z - pos.z)) * 180) / Math.PI + 360) % 360)
    .toString()
    .padStart(3, '0');
}
function raidSpawn(from) {
  /* from: a point the section comes from (fighters an enemy base has scrambled from their airfield, BASEAIR); else the raid's own way */
  const h = from || raidHome(),
    d = new THREE.Vector3(h.x - pos.x, 0, h.z - pos.z);
  const rng = from ? d.length() : RAIDV.RNG;
  if (d.lengthSq() < 1) d.set(0, 0, -1);
  d.normalize();
  const side = new THREE.Vector3(-d.z, 0, d.x);
  for (let k = 0; k < 2; k++) {
    const b = buildEnemy(),
      p = new THREE.Vector3(pos.x, OCEAN.Y + RAIDV.ALT + k * 40, pos.z).addScaledVector(d, rng + k * 60).addScaledVector(side, k * 90);
    b.g.position.copy(p);
    scene.add(b.g);
    const e = { b, p, v: d.clone().multiplyScalar(-RAIDV.CRU), st: 'in', hp: 1, dmg: 0, runs: 0, t: 0, fire: 0, ft: 0, bank: 0, lag: k * 7, k };
    e.fwd = e.v.clone().normalize();
    RAID.L.push(e);
  }
  RADIO.add('LOOKOUT', 'TWO BOGIES BEARING ' + raidBrg(RAID.L[RAID.L.length - 1].p) + ', ANGELS FIVE, CLOSING. SINGLE ENGINE, LOOK LIKE FRANKS.');
  note('AIRCRAFT INBOUND - BEARING ' + raidBrg(RAID.L[RAID.L.length - 1].p));
  SND.tone(620, 620, 0.5, 0.35, 'square');
  SND.tone(620, 620, 0.5, 0.35, 'square', 0.7);
}
/* fighters an enemy base has scrambled (BASEAIR): a section from their airfield, as a raid (if enemy planes are on) */
SIMS.add({
  id: 'pce',
  scramble: (p) => {
    if (typeof ENEMY !== 'undefined' && ENEMY.has('planes') && !crashed) raidSpawn(p);
  },
});
