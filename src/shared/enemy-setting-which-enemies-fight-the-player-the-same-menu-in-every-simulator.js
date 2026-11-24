/* ENEMY (Settings > Enable enemy, the same menu in every simulator): which enemies the game sends against the player, one checkbox
   each (the user's, 2026-11-24: checkboxes, and each simulator starts with only its own kind on: Planes for the P-51, Ships for the
   PCE-842). Saved per simulator as a list. Planes: the Japanese fighters a base calls up when the player attacks it. Shore: the ground
   fire (AA.on: the 25 mm guns and searchlights) and THE COAST BATTERIES (the role's coastOn). Ships: the Ukuru escorts' guns and the
   T-14s' torpedo runs (shipsOn). Subs: I-58 on patrol (SUBS, subsOn). Each simulator registers its saved key, its default and its note
   text in ENEMY.sims. */
const ENEMY = {
  KINDS: ['planes', 'ships', 'shore', 'subs'],
  on: new Set(),
  sims: {},
  has(k) {
    return this.on.has(k);
  },
  /* the current simulator's entry */
  cur() {
    for (const k in this.sims) if (SIMS.on(k)) return this.sims[k];
    return null;
  },
};
function enemyBoxes() {
  return Array.from(document.querySelectorAll('#enBoxes input[data-en]'));
}
function enemySync() {
  const S = ENEMY.cur();
  if (!S || !$$('enBoxes')) return; /* a page with several simulators: the enemies (and the ground fire they set) of the one played */
  enemyBoxes().forEach((b) => (b.checked = ENEMY.has(b.dataset.en)));
  AA.on = ENEMY.has('shore');
  store.set('aa', AA.on);
  AA.apply();
  if ($$('aaOn')) $$('aaOn').checked = AA.on;
  if ($$('enNote')) $$('enNote').textContent = ENEMY.on.size ? S.note() : S.none;
}
/* each simulator's entry calls this once it has registered: the saved choice, the boxes' handlers, and the setting applied */
ENEMY.init = () => {
  const S = ENEMY.cur();
  if (!S) return;
  const v = store.get(S.key, S.def());
  ENEMY.on = new Set((Array.isArray(v) ? v : S.def()).filter((k) => ENEMY.KINDS.includes(k)));
  enemyBoxes().forEach(
    (b) =>
      (b.onchange = () => {
        if (b.checked) ENEMY.on.add(b.dataset.en);
        else ENEMY.on.delete(b.dataset.en);
        store.set(S.key, [...ENEMY.on]);
        enemySync();
        note('ENEMY ' + b.dataset.en.toUpperCase() + (b.checked ? ' ON' : ' OFF'));
      }),
  );
  enemySync();
};
