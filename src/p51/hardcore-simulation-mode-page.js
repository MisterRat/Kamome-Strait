/* hardcore simulation mode page */
function hcSync() {
  $$('hcOn').checked = FM.on;
  document.querySelectorAll('#hcList input').forEach((i) => {
    i.checked = FM.opt[i.dataset.hc];
    i.disabled = !FM.on;
    i.parentNode.style.opacity = FM.on ? 1 : 0.5;
  });
}
$$('hcOn').onchange = (e) => {
  FM.on = e.target.checked;
  FM.save();
  hcSync();
  note('HARDCORE SIMULATION: ' + (FM.on ? 'ON' : 'OFF'));
};
document.querySelectorAll('#hcList input').forEach((i) => {
  i.onchange = () => {
    FM.opt[i.dataset.hc] = i.checked;
    FM.save();
  };
});
hcSync();
$$('wxTime').value = WX.time;
$$('wxWx').value = WX.wx;
$$('wxFlow').checked = WX.flow;
$$('wxTime').onchange = (e) => WX.setTime(e.target.value);
$$('wxWx').onchange = (e) => WX.setWx(e.target.value);
$$('wxWd').value = WX.wd;
$$('wxWs').value = WX.ws;
$$('wxWd').onchange = (e) => WX.setWd(e.target.value);
$$('wxWs').onchange = (e) => WX.setWs(e.target.value);
$$('wxFlow').onchange = (e) => {
  WX.flow = e.target.checked;
  WX.save();
};
$$('dmgOn').checked = DM.on;
$$('dmgOn').onchange = (e) => {
  DM.on = e.target.checked;
  store.set('p51dmg', DM.on);
  if (!DM.on) DM.reset();
  note('BATTLE DAMAGE ' + (DM.on ? 'ON' : 'OFF'));
};
$$('aaOn').checked = AA.on;
$$('aaOn').onchange = (e) => {
  AA.on = e.target.checked;
  store.set('p51aa', AA.on);
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
$$('pmAutoFs').checked = store.get('p51fs', true);
$$('pmAutoFs').onchange = (e) => store.set('p51fs', e.target.checked);
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
