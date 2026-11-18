/* ENEMY (Settings): which enemies the game sends against her. Saved; none by default. Planes: the air raids (THE AIR RAIDS).
   Shore: the P-51 world's ground fire (AA.on: the 25 mm guns and searchlights, laid on the ship) and THE COAST BATTERIES.
   Ships and subs come into the game as each enemy is built. */
const ENEMY = {
  mode: store.get('pce842enemy', 'none'),
  has(k) {
    return this.mode === 'all' || this.mode === k;
  },
};
function enemySync() {
  $$('enMode').value = ENEMY.mode;
  AA.on = ENEMY.has('shore');
  store.set('pce842aa', AA.on);
  AA.apply();
  $$('aaOn').checked = AA.on;
  $$('enNote').textContent =
    ENEMY.mode === 'none'
      ? 'No enemies: patrol and practice in peace.'
      : (ENEMY.has('planes') ? 'Planes: Ki-84 Hayates from the enemy airfield strafe her, two at a time, every few minutes (the first about 90 s after you sail). ' : '') +
        (ENEMY.has('shore') ? 'Shore: the ports\' 12 cm coast guns open fire inside about 14 km, and the 25 mm guns at the ports, airfields and on the escort inside 2.5 km. ' : '') +
        (ENEMY.has('ships') || ENEMY.has('subs') ? 'Still being built: the Ukuru-class escort as an enemy (ships) and the submarines (subs).' : '');
}
$$('enMode').onchange = (e) => {
  ENEMY.mode = e.target.value;
  store.set('pce842enemy', ENEMY.mode);
  enemySync();
  note('ENEMY: ' + $$('enMode').selectedOptions[0].textContent.toUpperCase());
};
enemySync();
$$('aaOn').checked = AA.on;
$$('aaOn').onchange = (e) => {
  AA.on = e.target.checked;
  store.set('pce842aa', AA.on);
  AA.apply();
  note('GROUND FIRE ' + (AA.on ? 'ON' : 'OFF'));
};
$$('pmBail').onclick = () => {
  pauseMenu(false);
  bailOut();
};
$$('sndOn').checked = SND.on;
$$('sndVol').value = Math.round(SND.vol * 100);
$$('sndVolV').textContent = Math.round(SND.vol * 100) + '%';
$$('sndOn').onchange = (e) => {
  SND.setOn(e.target.checked);
  if (SND.on) SND.beep(660, 0.12);
};
$$('sndVol').oninput = (e) => {
  SND.setVol(e.target.value / 100);
  $$('sndVolV').textContent = e.target.value + '%';
};
$$('sndVol').onchange = () => SND.beep(660, 0.12);
$$('engVol').value = Math.round(SND.eng * 100);
$$('engVolV').textContent = Math.round(SND.eng * 100) + '%';
$$('engVol').oninput = (e) => {
  SND.setEng(e.target.value / 100);
  $$('engVolV').textContent = e.target.value + '%';
};
$$('pmAutoFs').checked = store.get('pce842fs', true);
$$('pmAutoFs').onchange = (e) => store.set('pce842fs', e.target.checked);
$$('pmAll').onclick = () => {
  UI.items.forEach((i) => {
    if (UI.applies(i)) UI.set(i.id, true);
  });
  pmBuild();
};
$$('pmClean').onclick = () => {
  UI.items.filter((i) => i.g === 'Instruments' && UI.applies(i)).forEach((i) => UI.set(i.id, false));
  pmBuild();
};
$$('pmGfx')
  .querySelectorAll('button')
  .forEach(
    (b) =>
      (b.onclick = () => {
        QL.mode = b.dataset.q;
        applyQuality();
        pmBuild();
      }),
  );
