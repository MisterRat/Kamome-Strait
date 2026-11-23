/* ENEMY (Settings > Enemy, the same menu in every simulator): which enemies the game sends against the player. Saved per simulator.
   Planes: the Japanese fighters a base calls up when the player attacks it. Shore: the ground fire (AA.on: the 25 mm guns and
   searchlights) and THE COAST BATTERIES (the role's coastOn). Ships: the Ukuru escorts' guns and the T-14s' torpedo runs (shipsOn).
   Subs: I-58 on patrol (SUBS, subsOn). Each simulator registers its saved key, its default and its note text in ENEMY.sims. */
const ENEMY = {
  mode: 'none',
  sims: {},
  has(k) {
    return this.mode === 'all' || this.mode === k;
  },
  /* the current simulator's entry */
  cur() {
    for (const k in this.sims) if (SIMS.on(k)) return this.sims[k];
    return null;
  },
};
function enemySync() {
  const S = ENEMY.cur();
  if (!S || !$$('enMode')) return; /* a page with several simulators: the enemies (and the ground fire they set) of the one played */
  $$('enMode').value = ENEMY.mode;
  AA.on = ENEMY.has('shore');
  store.set('aa', AA.on);
  AA.apply();
  if ($$('aaOn')) $$('aaOn').checked = AA.on;
  if ($$('enNote')) $$('enNote').textContent = ENEMY.mode === 'none' ? S.none : S.note();
}
/* each simulator's entry calls this once it has registered: the saved choice, the menu's handler, and the setting applied */
ENEMY.init = () => {
  const S = ENEMY.cur();
  if (!S) return;
  ENEMY.mode = store.get(S.key, S.def());
  if ($$('enMode'))
    $$('enMode').onchange = (e) => {
      ENEMY.mode = e.target.value;
      store.set(S.key, ENEMY.mode);
      enemySync();
      note('ENEMY: ' + $$('enMode').selectedOptions[0].textContent.toUpperCase());
    };
  enemySync();
};
