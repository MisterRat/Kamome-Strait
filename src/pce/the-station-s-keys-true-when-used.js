/* the station's keys: true when used */
function commsKey(code) {
  const st = PCEM.STN[3] && PCEM.STN[3][SHIP.sub];
  if (!st) return false;
  if (code === 'KeyT') return lesToggle(st.dev), true;
  const L = COMMS.les;
  if (code === 'Space' && L && L.st[L.i] && L.st[L.i].sp) return lesNext(), true;
  if (code === 'Space' && L && L.done) return true;
  if (st.dev === 'radar') {
    if (code === 'KeyR' || code === 'KeyF') return (keys[code] = true), true;
    if (code === 'Space') return radarReport(), true;
  } else if (st.dev === 'sonar') {
    if (code === 'Space') return sonarReport(), true;
    if (code === 'KeyZ') return sonarCut('L'), true;
    if (code === 'KeyX') return sonarCut('R'), true;
    if (code === 'KeyU' || code === 'KeyB' || code === 'KeyN') return sonarDopCall(code[3]), true;
  } else if (st.dev === 'radio') {
    if (code === 'Space') return radioAct(false), true;
    if (code === 'KeyB') return radioAct(true), true;
  }
  return false;
}
