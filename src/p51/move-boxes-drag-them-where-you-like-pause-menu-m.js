/* ---------- move boxes: drag them where you like (pause menu > Move boxes); a separate layout is kept for landscape and portrait ---------- */
UI.MV = [
  'hud',
  'cmp',
  'mm',
  'hz',
  'coach',
  'tq',
  'help',
  'tThr',
  'tL',
  'tRL',
  'tRR',
  'tFire',
  'tRkt',
  'tBmb',
  'tBar',
];
UI.editing = false;
UI.all = {};
UI.pos = {};
UI.key = () => (MOB ? (innerHeight > innerWidth ? 'p' : 'l') : 'd');
UI.loadPos = () => {
  UI.all = store.get('p51pos', {}) || {};
  UI.pos = UI.all[UI.key()] || (UI.all[UI.key()] = {});
};
UI.savePos = () => {
  store.set('p51pos', UI.all);
};
UI.off = (id) => UI.pos[id] || [0, 0];
UI.applyPos = (id) => {
  const p = UI.pos[id];
  $$(id).style.translate = p ? p[0] + 'px ' + p[1] + 'px' : '';
};
UI.applyAll = () => UI.MV.forEach(UI.applyPos);
UI.clamp = (id) => {
  const r = $$(id).getBoundingClientRect();
  if (!r.width || !r.height) return;
  const m = 46;
  let dx = 0,
    dy = 0; /* never lose a box off the edge of the screen */
  if (r.left > innerWidth - m) dx = innerWidth - m - r.left;
  else if (r.right < m) dx = m - r.right;
  if (r.top > innerHeight - m) dy = innerHeight - m - r.top;
  else if (r.bottom < m) dy = m - r.bottom;
  if (dx || dy) {
    const o = UI.off(id);
    UI.pos[id] = [Math.round(o[0] + dx), Math.round(o[1] + dy)];
    UI.applyPos(id);
  }
};
