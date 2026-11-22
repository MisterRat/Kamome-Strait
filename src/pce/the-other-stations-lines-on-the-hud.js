/* the other stations' lines on the HUD */
function stnHUD() {
  const st = PCEM.STN[SHIP.stn][SHIP.sub],
    ans = ENG.ans === SHIP.tel || telIdx(ENG.ans) === telIdx(SHIP.tel);
  if (SHIP.stn === 2) return '<br>TELEGRAPH <b>' + TEL[telIdx(SHIP.tel)].replace('\n', ' ') + '</b><br>' + (ans ? 'ANSWERED' : '<span style="color:#ff8a6a">ANSWER THE BELL</span>') + ' &middot; <b>' + Math.round(Math.abs(ENG.ans) * 744) + '</b> rpm' + engHUD();
  if (SHIP.stn === 1) return '<br>GUNS <b>' + (OODO.hold ? 'HOLDING FIRE' : 'FREE') + '</b>' + (SMK.on ? ' &middot; <b>MAKING SMOKE</b>' : '') + ' &middot; FUEL <b>' + Math.round(ENG.fuel * 100) + '%</b>' + (ENG.pwr ? '' : ' &middot; <b style="color:#ff8a6a">NO POWER</b>') + '<br><b>G</b> orders';
  if (st && st.dev === 'radar') return '<br>RADAR <b>' + RADAR.R[RADAR.ri] + '</b> nm scale';
  if (st && st.dev === 'sonar') return '<br>SONAR TRAIN <b>' + String(Math.round(((((SONAR.brg * 180) / Math.PI) % 360) + 360) % 360)).padStart(3, '0') + '</b>&deg; rel &middot; <b>' + SONAR.R[SONAR.ri] + '</b> yd';
  if (SHIP.stn === 5) {
    const i = tpAt();
    const tc = i >= 0 && tpList()[i] ? tpList()[i].tp : null;
    return '<br><b>' + (tc ? TPNAME[tc] : 'ON DECK') + '</b><br>' + (DC.dep[tc] ? 'DEPTH <b>' + DC.dep[tc] + '</b> ft ' + (DC.arm[tc] ? 'ARMED' : 'SAFE') + '<br>' : '') + 'RACKS ' + DC.rack[0] + '/' + DC.rack[1] + ' &middot; K ' + DC.kg[0] + '/' + DC.kg[1] + '<br>HEDGEHOG ' + HH.n + '/24';
  }
  return '';
}
