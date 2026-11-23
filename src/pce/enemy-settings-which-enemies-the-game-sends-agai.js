/* ENEMY, the PCE-842's entry (the menu and its workings are shared: ENEMY): saved as 'enemy', none by default */
ENEMY.sims.pce = {
  key: 'enemy',
  def: () => 'none',
  none: 'No enemies: patrol and practice in peace.',
  note: () =>
    (ENEMY.has('planes')
          ? 'Planes: Ki-84 Hayates strafe her, two at a time, when a Japanese ship, gun or base she fires on calls for air support: they take off from the nearest enemy airfield and fly out to her. '
          : '') +
        (ENEMY.has('shore')
          ? "Shore: the ports' 8 cm coast guns open fire inside about 10 km (and at Allied aircraft), and the 25 mm guns at the ports, airfields and on the escort inside 2.5 km. "
          : '') +
        (ENEMY.has('ships')
          ? "Ships: the Ukuru-class escorts' 12 cm guns open fire inside about 12 km, and the T-14 torpedo boats make torpedo runs from about 3 km. "
          : '') +
        (ENEMY.has('subs') ? 'Subs: I-58 (a Type B3 with six kaiten) patrols deep in mid-strait, comes to periscope depth to look, and attacks with Type 95 torpedoes from 3 km; your sonar finds her, the Hedgehog and the charges kill her.' : ''),
};
ENEMY.init();
