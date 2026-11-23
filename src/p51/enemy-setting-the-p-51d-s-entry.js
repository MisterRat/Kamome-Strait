/* ENEMY, the P-51D's entry (the menu and its workings are shared: ENEMY): saved as 'enemyP51'. Before the menu the fighters always came
   and the Ground fire checkbox brought the guns and the ships, so the first default follows that checkbox: All with it on, Planes without */
ENEMY.sims.p51 = {
  key: 'enemyP51',
  def: () => (store.get('aa', false) === true ? 'all' : 'planes'),
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
