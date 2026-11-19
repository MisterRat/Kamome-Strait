/* PCE-842: the player takes the PCE-842 from the shared allied fleet (she is placed exactly where the P-51 game patrols her, then
   handed over: no longer an AI ship), with the stations' interiors added. */
HOOKS.claimShip.push((kind, num, o) => {
  if (kind !== 'pce' || num !== '842' || SHIPM.mesh) return false;
  AFLD.a.splice(AFLD.a.indexOf(o), 1);
  COLL.remove(o); /* she is the player's ship now: COLL knows her as that */
  o.m.add(PCEM.buildInterior()); /* the stations' rooms */
  SHIPM.mesh = o.m;
  SHIPM.wake = o.m.children[0];
  SHIPM.pts = o.pts;
  return true;
});
