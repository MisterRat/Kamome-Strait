/* ENEMY (Settings): which enemies the game sends against her. Saved; none by default. Planes: the air raids (THE AIR RAIDS).
   Shore: the P-51 world's ground fire (AA.on: the 25 mm guns and searchlights, laid on the ship) and THE COAST BATTERIES.
   Ships and subs come into the game as each enemy is built. */
const ENEMY = {
  mode: store.get('enemy', 'none'),
  has(k) {
    return this.mode === 'all' || this.mode === k;
  },
};
function enemySync() {
  if (!SIMS.on('pce')) return; /* a page with several simulators: her enemies (and the ground fire they set) only while she is played */
  $$('enMode').value = ENEMY.mode;
  AA.on = ENEMY.has('shore');
  store.set('aa', AA.on);
  AA.apply();
  $$('aaOn').checked = AA.on;
  $$('enNote').textContent =
    ENEMY.mode === 'none'
      ? 'No enemies: patrol and practice in peace.'
      : (ENEMY.has('planes')
          ? 'Planes: Ki-84 Hayates from the enemy airfield strafe her, two at a time, every few minutes (the first about 90 s after you sail). '
          : '') +
        (ENEMY.has('shore')
          ? "Shore: the ports' 12 cm coast guns open fire inside about 14 km, and the 25 mm guns at the ports, airfields and on the escort inside 2.5 km. "
          : '') +
        (ENEMY.has('ships') || ENEMY.has('subs') ? 'Still being built: the Ukuru-class escort as an enemy (ships) and the submarines (subs).' : '');
}
if ($$('enMode'))
  $$('enMode').onchange = (e) => {
    ENEMY.mode = e.target.value;
    store.set('enemy', ENEMY.mode);
    enemySync();
    note('ENEMY: ' + $$('enMode').selectedOptions[0].textContent.toUpperCase());
  };
enemySync();
