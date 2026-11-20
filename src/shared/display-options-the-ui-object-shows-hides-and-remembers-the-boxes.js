/* ---------- display options: choose what is on screen (pause menu); swipe instrument boxes away on a touch screen. The boxes are
   the current simulator's (its role's uiItems); this piece shows, hides and remembers them ---------- */
const UI = {
  /* the current simulator's boxes (its role's uiItems) */
  get items() {
    return SIMS.cur.uiItems;
  },

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
    SIMS.cur.uiSet(id, v);
    this.save();
  },
  toggle(id) {
    this.set(id, !this.vis(id));
  },
  applies(i) {
    if (i.sc === 'none') return false; /* a box this simulator's page has but does not use */
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
}
SIMS.cur.uiInit();
