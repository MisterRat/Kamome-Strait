/* ---------- display options: choose what is on screen (pause menu); swipe instrument boxes away on a touch screen ---------- */
const UI = {
  items: [
    { id: 'hud', label: 'Ship readout', sel: '#hud', g: 'Instruments' },
    { id: 'cmp', label: 'Compass strip', sel: '#cmp', g: 'Instruments' },
    { id: 'mm', label: 'Minimap (O)', sel: '#mm', g: 'Instruments' },
    { id: 'hz', label: 'Artificial horizon', sel: '#hz', g: 'Instruments', sc: 'none' },
    { id: 'adf', label: 'ADF radio compass (free flight and the ADF trainer; click it to change station)', sel: '#adf', g: 'Instruments', sc: 'none' },
    { id: 'coach', label: 'Mission coach panel', sel: '#coach', g: 'Instruments', sc: 'none' },
    { id: 'tq', label: 'Engine order gauge', sel: '#tq', g: 'Instruments', sc: 'desk' },
    { id: 'help', label: 'Controls help (H)', sel: '#help', g: 'Instruments' },
    { id: 'gring', label: 'Sight rings at the guns: where to aim (game mode)', sel: '#gunRing', g: 'Aids' },
    { id: 'bandit', label: 'Bandit marker and lead ring', sel: '#bd,#bdt,#lead', g: 'Aids', sc: 'none' },
    { id: 'guide', label: 'Flight path guide in trainers (L); ADF radio compass on/off in free flight (L)', g: 'Aids', sc: 'none' },
    { id: 'cross', label: 'Guns', sel: '#cross', g: 'Sight rings', sc: 'none' },
    { id: 'rkring', label: 'Rockets', sel: '#rkip', g: 'Sight rings', sc: 'none' },
    { id: 'bmring', label: 'Bombs', sel: '#ccip', g: 'Sight rings', sc: 'none' },
    { id: 'tThr', label: 'Throttle slider', sel: '#tThr', g: 'Touch controls', sc: 'mob' },
    { id: 'tL', label: 'Gear, flap and brake buttons', sel: '#tL', g: 'Touch controls', sc: 'mob' },
    { id: 'trud', label: 'Rudder arrows', sel: '#tRL,#tRR', g: 'Touch controls', sc: 'mob' },
    { id: 'tweap', label: 'Fire, rocket and bomb buttons', sel: '#tFire,#tRkt,#tBmb', g: 'Touch controls', sc: 'mob' },
    {
      id: 'tbar',
      label: 'Top bar buttons (the pause button stays)',
      sel: '#tBar .tb:not(#tPause)',
      g: 'Touch controls',
      sc: 'mob',
    },
  ],
  hid: {},
  hint: false,
  load() {
    this.hid = store.get('ui', {}) || {};
    if (this.hid.adf === undefined) this.hid.adf = 1; if (this.hid.rkring === undefined) this.hid.rkring = 1; if (this.hid.bmring === undefined) this.hid.bmring = 1; /* rocket and bomb sight rings start off */ /* the ADF radio compass starts switched off in free flight (L turns it on) */
  },
  save() {
    store.set('ui', this.hid);
  },
  vis(id) {
    return !this.hid[id];
  },
  set(id, v) {
    if (v) {
      if (id === 'adf' || id === 'rkring' || id === 'bmring') this.hid[id] = 0; /* remembered as 'on' */
      else delete this.hid[id];
    } else this.hid[id] = 1;
    document.body.classList.toggle('hide-' + id, !v);
    if (id === 'guide') guide.on = v;
    this.save();
  },
  toggle(id) {
    this.set(id, !this.vis(id));
  },
  applies(i) {
    if (i.sc === 'none') return false; /* the P-51's boxes the ship does not use (artificial horizon, ADF, coach, bandit and sight aids) */
    return MOB ? i.sc !== 'desk' : i.sc !== 'mob';
  },
};
UI.load();
if (MOB && !UI.hid._mob) {
  UI.hid._mob = 1;
  UI.hid.cmp = 1;
  UI.save();
} /* first visit on a phone: no compass (bring it back in the pause menu) */
{
  const st = document.createElement('style');
  st.textContent = UI.items
    .filter((i) => i.sel)
    .map(
      (i) =>
        i.sel
          .split(',')
          .map((s) => 'body.hide-' + i.id + ' ' + s.trim())
          .join(',') + '{display:none!important}',
    )
    .join('\n');
  st.textContent += '\n' + UI.items.filter((i) => i.sc === 'none' && i.sel).map((i) => i.sel + '{display:none!important}').join('\n');
  document.head.appendChild(st);
  UI.items.forEach((i) => {
    if (UI.hid[i.id]) document.body.classList.add('hide-' + i.id);
  });
  if (UI.hid.guide) guide.on = false;
}
