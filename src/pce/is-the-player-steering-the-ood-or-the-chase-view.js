/* is the player steering (the OOD in the pilothouse, or the chase view)? elsewhere the helmsman holds her course */
const atHelm = () => camMode != 1 || SHIP.stn === 1;
function stnUpdate(dt) {
  stnInit();
  if (!STN.init) return;
  const here = camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn,
    st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub],
    play = started && !paused && !RPL.on;
  if (STN.bino && !(here && SHIP.stn === 1)) STN.bino = false;
  if (play) {
    sonarStep(dt, here && st && st.dev === 'sonar', kb('sTrR') - kb('sTrL'));
    dcStep(dt);
    /* the torpedoman: his trigger fires the weapon he is at; the Hedgehog; the OOD's attack run */
    const f = !!(kb('guns') || pad.fire);
    tpUpdate(dt, here, f);
    STN.fire0 = f;
    commsUpdate(dt, here);
    dcxLiveStep(dt);
  }
  drillStep(dt, here);
  if (STN.wheel) STN.wheel.rotation.x = SHIP.rud * Math.PI * 3; /* about three turns of the wheel, hard over to hard over */
  /* paint the station's faces about 15 times a second (the radar every frame); the radio only when there is news */
  STN.t += dt;
  const all = STN.t > 0.066;
  for (const id in STN.F) {
    const f = STN.F[id];
    if (!here || f.st !== SHIP.stn) continue;
    if (id === 'radar') stnDraw(f, dt);
    else if (id === 'radio') {
      if (RADIO.dirty) {
        RADIO.dirty = false;
        stnDraw(f);
      }
    } else if (all) stnDraw(f, STN.t);
  }
  if (all) STN.t = 0;
}
