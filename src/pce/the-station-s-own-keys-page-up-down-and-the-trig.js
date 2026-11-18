/* the station's own keys: Page Up / Down and the trigger mean different things at each station */
function stnRange(d) {
  if (GUN.cur) return gunRange(d * 91.44);
  const st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub];
  if (camMode != 1 || !st) return;
  if (st.dev === 'radar') radarRange(d);
  else if (st.dev === 'sonar') sonarRange(d);
  else if (SHIP.stn === 6) dcDepth(d * 25);
}
