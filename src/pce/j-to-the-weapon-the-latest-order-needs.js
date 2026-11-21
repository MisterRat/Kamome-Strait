/* J: to the weapon the latest order needs */
function tpJump() {
  if (camMode != 1 || SHIP.stn !== 5) return;
  if (FM.use('walk')) return note('HARDCORE: WALK THERE - W A S D, SHIFT RUNS');
  const o = ASW.O.filter((o) => o.k && (o.st === 'open' || o.st === 'info')).pop();
  if (!o) return note('NO ORDERS');
  tpGo(tpIdx(o.k));
}
