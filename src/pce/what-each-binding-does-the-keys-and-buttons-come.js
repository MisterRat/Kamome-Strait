/* what each binding does (the keys and buttons come from the role's bind table) */
SIMS.add({ id: 'pce', act: {
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
  st1: () => shipStation(1),
  st2: () => shipStation(2),
  st3: () => shipStation(3),
  st4: () => shipStation(4),
  st5: () => shipStation(5),
  st6: () => shipStation(6),
  tpJump: () => tpJump(),
  hhLoad: () => {
    if (gunReload()) return;
    if (camMode == 1 && SHIP.stn === 6 && HH.n < 24) (HH.loading = true), note('LOADING THE HEDGEHOG');
  },
  gSight: () => {
    if (SHIP.stn === 6 && camMode == 1) return tpArm();
    if (SHIP.stn === 1 && camMode == 1) {
      STN.bino = !STN.bino;
      note(STN.bino ? 'BINOCULARS' : 'BINOCULARS DOWN');
    } else gunSightToggle();
  },
  targets: () => ptToggle(),
  gRngUp: () => stnRange(1),
  gRngDn: () => stnRange(-1),
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
