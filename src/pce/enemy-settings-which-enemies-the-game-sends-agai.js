/* ENEMY (Settings): which enemies the game sends against her. Saved; none by default. Planes: the air raids (THE AIR RAIDS).
   Shore: the P-51 world's ground fire (AA.on: the 25 mm guns and searchlights, laid on the ship) and THE COAST BATTERIES.
   Ships: the Ukuru escorts' guns and the T-14s' torpedo runs (the role's shipsOn). Subs: I-58 on patrol (SUBS, the role's subsOn). */
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
        (ENEMY.has('ships')
          ? "Ships: the Ukuru-class escorts' 12 cm guns open fire inside about 12 km, and the T-14 torpedo boats make torpedo runs from about 3 km. "
          : '') +
        (ENEMY.has('subs') ? 'Subs: I-58 (a Type B3 with six kaiten) patrols deep in mid-strait, comes to periscope depth to look, and attacks with Type 95 torpedoes from 3 km; your sonar finds her, the Hedgehog and the charges kill her.' : '');
}
if ($$('enMode'))
  $$('enMode').onchange = (e) => {
    ENEMY.mode = e.target.value;
    store.set('enemy', ENEMY.mode);
    enemySync();
    note('ENEMY: ' + $$('enMode').selectedOptions[0].textContent.toUpperCase());
  };
enemySync();
