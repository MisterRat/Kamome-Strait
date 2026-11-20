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
