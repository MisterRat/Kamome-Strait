/* the start screen: a button for each other simulator; it remembers the choice and reloads the page with it */
(() => {
  const row = $$('goRow');
  if (!row) return;
  const box = document.createElement('div');
  box.id = 'ksSims';
  box.style.marginTop = '10px';
  for (const s of SIMS.list) {
    if (s === SIMS.cur) continue;
    const b = document.createElement('button');
    b.textContent = 'Switch to ' + s.label;
    b.style.cssText = 'background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35)';
    b.onclick = () => {
      try {
        localStorage.setItem('kamome.sim', s.id);
      } catch (e) {
        logWarn('remember the simulator', e);
      }
      location.search = '?sim=' + s.id;
    };
    box.appendChild(b);
  }
  row.after(box);
})();
