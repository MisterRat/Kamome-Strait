/* the simulator's start screen: the way back to Kamome Strait's main menu (where the simulators are chosen) */
(() => {
  const row = $$('goRow');
  if (!row) return;
  const b = document.createElement('button');
  b.id = 'ksMenu';
  b.textContent = '\u25C0 Main menu';
  b.style.cssText = 'margin-top:10px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35)';
  b.onclick = () => (location.href = location.pathname);
  row.after(b);
})();
