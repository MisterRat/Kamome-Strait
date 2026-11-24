/* ENEMY, the P-51D's entry (the menu and its workings are shared: ENEMY): saved as 'enemyP51b' (a list; the old single choice,
   'enemyP51', is left behind so everyone starts at the new default). Planes only by default: its own kind (the user's, 2026-11-24) */
ENEMY.sims.p51 = {
  key: 'enemyP51b',
  def: () => ['planes'],
  none: 'No enemies: fly and practice in peace (the Dogfight and Bandit missions still bring their own Ki-84s).',
  note: () =>
    (ENEMY.has('planes')
      ? 'Planes: two Ki-84 Hayates take off from the nearest Japanese airfield and come for you when a Japanese ship, gun or base you attack calls for air support. '
      : '') +
    (ENEMY.has('shore')
      ? "Shore: the 25 mm guns and searchlights at the ports and airfields open fire inside 2.5 km, and the ports' 8 cm coast guns fire at aircraft too. "
      : '') +
    (ENEMY.has('ships') ? "Ships: the Ukuru-class escorts' 12 cm and 25 mm guns and the T-14 torpedo boats' 25 mm fire at you. " : '') +
    (ENEMY.has('subs') ? 'Subs: I-58 patrols in mid-strait; when she comes up to look she is a target for your guns and bombs.' : ''),
};
ENEMY.init();
