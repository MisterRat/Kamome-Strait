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
  if (typeof modeSync === 'function') modeSync();
  note('HARDCORE SIMULATION: ' + (FM.on ? 'ON' : 'OFF'));
};
document.querySelectorAll('#hcList input').forEach((i) => {
  i.onchange = () => {
    FM.opt[i.dataset.hc] = i.checked;
    FM.save();
    if (typeof modeSync === 'function') modeSync();
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
  store.set('pce842dmg', DM.on);
  if (!DM.on) DM.reset();
  note('BATTLE DAMAGE ' + (DM.on ? 'ON' : 'OFF'));
};
