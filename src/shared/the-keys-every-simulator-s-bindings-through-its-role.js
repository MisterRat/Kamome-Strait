/* the keys: menus, photo mode and the manual first, then the current simulator's own keys (its role's keyFirst, keyStation), then
   its bindings (uiAct, act through KEYID); also the audio context, started on the first key or click */
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    if (e.code == 'Escape') e.target.blur();
    return;
  }
  if (PHOTO.on) {
    photoKey(e);
    return;
  }
  if (SIMS.cur.keyFirst(e)) return; /* the simulator takes the key first (the PCE's shell camera) */
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Quote', 'Backspace'].includes(e.code)) e.preventDefault();
  if (KEYID[e.code] === 'manual') {
    if (!e.repeat) toggleDocs();
    return;
  }
  if (docsOpen) {
    if (e.code == 'Escape') toggleDocs();
    return;
  }
  if (UI.editing) {
    if ((e.code == 'KeyP' || e.code == 'Escape') && !e.repeat) editLayout(false);
    return;
  }
  if (pmOpen) {
    const infoScroll =
      INFO_TABS.includes(pmTab) &&
      (e.code == 'ArrowUp' || e.code == 'ArrowDown' || e.code == 'PageUp' || e.code == 'PageDown');
    if (e.repeat && !menuOpen && !infoScroll) return;
    if (infoScroll) {
      $$('pmBox').scrollTop += e.code == 'ArrowUp' ? -70 : e.code == 'ArrowDown' ? 70 : e.code == 'PageUp' ? -420 : 420;
      return;
    }
    if (e.code == 'KeyM') {
      toggleMenu();
      return;
    }
    if (e.code == 'Tab') {
      e.preventDefault();
      pmCycle(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.code == 'ArrowLeft' || e.code == 'ArrowRight') {
      pmCycle(e.code == 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (menuOpen) {
      if (e.code == 'ArrowUp') menuMove(-1);
      else if (e.code == 'ArrowDown') menuMove(1);
      else if (e.code == 'Enter') {
        e.preventDefault();
        menuPick(menuSel);
      } else if (e.code == 'Escape' || e.code == 'KeyP') pmShow(false);
      return;
    }
    if (e.code == 'KeyP' || e.code == 'Escape') pauseMenu(false);
    return;
  }
  if (SIMS.cur.keyStation(e)) return; /* a station's own keys (the PCE's comms) */
  const uid = KEYID[e.code];
  if (uid && SIMS.cur.uiAct[uid] && !e.repeat) {
    SIMS.cur.uiAct[uid]();
    return;
  }
  if (menuOpen) {
    if (e.code == 'ArrowUp') menuMove(-1);
    else if (e.code == 'ArrowDown') menuMove(1);
    else if (e.code == 'Enter') menuPick(menuSel);
    else if (e.code == 'Escape') toggleMenu();
    return;
  }
  if (e.repeat) return;
  keys[e.code] = true;
  if (KEYID[e.code] && SIMS.cur.act[KEYID[e.code]]) SIMS.cur.act[KEYID[e.code]]();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  orbDrag = false;
});
const spd = () => vel.length(),
  v0 = spd;

function audio() {
  if (SND.ctx) {
    if (SND.ctx.state === 'suspended') SND.ctx.resume().catch((e) => logWarn('audio resume', e));
    return;
  }
  try {
    SND.build(new (window.AudioContext || window.webkitAudioContext)());
  } catch (e) {
    SND.ctx = null;
    logWarn('audio unavailable', e);
  }
}
