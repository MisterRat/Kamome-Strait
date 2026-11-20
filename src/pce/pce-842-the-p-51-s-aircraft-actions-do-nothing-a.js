/* PCE-842: the P-51's aircraft actions do nothing aboard the ship (their keys stay reserved until the ship's own systems use them) */
['gear', 'rocket', 'bomb', 'brake', 'flapDn', 'flapUp', 'trimC'].forEach((k) => (SIMS.get('pce').act[k] = () => {}));
SIMS.add({ id: 'pce', uiAct: {
  missions: () => toggleMenu(),
  coach: () => (coachMin = !coachMin),
  map: () => {
    UI.toggle('mm');
    mmT = 0;
  },
  mapOut: () => {
    mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ + 1));
    mmT = 0;
  },
  mapIn: () => {
    mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ - 1));
    mmT = 0;
  },
  photo: () => photoToggle(),
  mute: () => {
    SND.setOn(!SND.on);
    $$('sndOn').checked = SND.on;
    note('SOUND ' + (SND.on ? 'ON' : 'OFF'));
  },
  quality: () => {
    QL.mode = QMODES[(QMODES.indexOf(QL.mode) + 1) % QMODES.length];
    applyQuality();
    note('GRAPHICS: ' + QL.mode.toUpperCase());
  },
} });
['bail', 'guide', 'coach'].forEach((k) => (SIMS.get('pce').uiAct[k] = () => {})); /* PCE-842: no bail-out or path guide */
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    if (e.code == 'Escape') e.target.blur();
    return;
  }
  if (PHOTO.on) {
    photoKey(e);
    return;
  }
  /* the shell cam: any key cuts straight back to the gun (and does nothing else) */
  if (SCAM.on && started && !paused) {
    SCAM.on = false;
    e.preventDefault();
    return;
  }
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
  if (!e.repeat && started && !paused && camMode == 1 && SHIP.stn === 3 && commsKey(e.code)) {
    e.preventDefault();
    return;
  }
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
