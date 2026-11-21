/* the position the torpedoman is at ('hh', 'port', 'stbd', 'rack') or null */
function tpTp() {
  if (camMode != 1 || SHIP.stn !== 5) return null;
  const i = tpAt();
  return i >= 0 && tpList()[i] ? tpList()[i].tp : null;
}
