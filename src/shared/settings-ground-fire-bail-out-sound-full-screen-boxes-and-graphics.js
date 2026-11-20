/* settings: ground fire, bail out, sound and engine volume, full screen, all / clean boxes, graphics quality (the pause menu's controls) */
$$('aaOn').checked = AA.on;
$$('aaOn').onchange = (e) => {
  AA.on = e.target.checked;
  store.set('aa', AA.on);
  AA.apply();
  note('GROUND FIRE ' + (AA.on ? 'ON' : 'OFF'));
};
$$('pmBail').onclick = () => {
  pauseMenu(false);
  SIMS.cur.bail();
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
$$('pmAutoFs').checked = store.get('fs', true);
$$('pmAutoFs').onchange = (e) => store.set('fs', e.target.checked);
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
