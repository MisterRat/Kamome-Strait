/* what each binding does (the keys and buttons come from the role's bind table) */
SIMS.add({ id: 'p51', act: {
  gear: () => toggleGear(),
  camera: () => {
    if (ROAM.on) return roamExit();
    camMode ^= 1;
    if (camMode == 1) orbReset();
  },
  rocket: () => fireRocket(),
  bomb: () => dropBomb(),
  brake: () => {
    /* the brake key only brakes on the ground (see the physics); in the air it calls a bandit, and clears it if one is up */
    if (onGround) return;
    if (EN.some((x) => !x.dying)) clearEnemies();
    else spawnEnemy();
  },
  diff1: () => setDiff(0),
  diff2: () => setDiff(1),
  diff3: () => setDiff(2),
  clear: () => {
    /* Y: chase camera <-> roam camera */
    if (ROAM.on) roamExit();
    else roamEnter();
  },
  flapDn: () => {
    if (DM.on && DM.hyd) return note('HYDRAULICS - FLAPS JAMMED');
    flapLvl = Math.min(ANG.length - 1, flapLvl + 1);
    SND.flaps();
  },
  flapUp: () => {
    if (DM.on && DM.hyd) return note('HYDRAULICS - FLAPS JAMMED');
    flapLvl = Math.max(0, flapLvl - 1);
    SND.flaps();
  },
  trimC: () => {
    if (!FM.use('trim')) return note('TRIM WORKS IN HARDCORE MODE ONLY');
    TRIM.e = TRIM.r = TRIM.a = 0;
    note('TRIM CENTRED');
  },
  pause: () => pauseMenu(true),
  help: () => UI.toggle('help'),
  restart: () => reset(),
} });
SIMS.add({ id: 'p51', uiAct: {
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
  bail: () => bailPress(),
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
  guide: () => {
    if (trn.mode === 'free') {
      UI.toggle('adf');
      note(UI.vis('adf') ? 'ADF RADIO COMPASS ON' : 'ADF RADIO COMPASS OFF');
    } else {
      UI.set('guide', !guide.on);
      note(guide.on ? 'FLIGHT PATH GUIDE ON' : 'FLIGHT PATH GUIDE OFF');
    }
  },
} });
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    if (e.code == 'Escape') e.target.blur();
    return;
  }
  if (PHOTO.on) {
    photoKey(e);
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
