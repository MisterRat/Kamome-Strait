/* rearming (the user's, 2026-11-21: a return to any American naval base resupplies all ammunition): lying stopped within the US
   naval base or the US supply depot (under 1 1/2 knots inside its yard and 300 m off it), her magazines are filled again over about
   1 1/2 minutes (game mode: half), then her ready-use ammunition: the racks, the K-guns, the Hedgehog's spigots, the drum and the
   40 mm's autoloaders. The naval base issues it from its store (FS.nav .store, in full loads; the Liberty ship's every call brings one
   more, up to three); the supply depot has all it needs */
const REARM = { at: null, msgT: 0 };
function rearmStep(dt) {
  const sp = Math.hypot(vel.x, vel.z),
    B = sp < 0.75 && !crashed ? FS.nav.find((s) => (s.navy === 'us' || s.navy === 'usdep') && Math.hypot(pos.x - s.O.x, pos.z - s.O.z) < s.R + 300) : null;
  if (B !== REARM.at) {
    REARM.at = B;
    REARM.done = false;
  }
  if (!B || REARM.done) return;
  const K = Object.keys(MAG0),
    full = K.every((k) => MAG[k] >= MAG0[k]);
  if (!full) {
    if (B.store !== undefined && B.store <= 0) {
      if (performance.now() - REARM.msgT > 20000)
        ((REARM.msgT = performance.now()), note(B.title.toUpperCase() + ' IS OUT OF AMMUNITION - WAIT FOR THE SUPPLY SHIP'));
      return;
    }
    if (!REARM.on) ((REARM.on = true), note('ALONGSIDE ' + B.title.toUpperCase() + ' - REARMING'));
    const f = dt / (90 * rldK());
    let used = 0;
    for (const k of K) {
      const n = Math.min(MAG0[k] - MAG[k], Math.ceil(MAG0[k] * f));
      MAG[k] += n;
      used += n / MAG0[k] / K.length;
    }
    if (B.store !== undefined) B.store = Math.max(0, B.store - used);
    return;
  }
  /* the magazines full: the ready-use ammunition too */
  DC.rack = [8, 8];
  DC.kl = [1, 1, 1, 1];
  DC.kg = [2, 2];
  HH.n = 24;
  HH.loading = false;
  for (const g of GUN.M) {
    if (g.s.mag) ((g.rnd = g.s.mag), (g.rl = 0));
    if (g.s.auto) g.al = [g.s.auto, g.s.auto];
  }
  REARM.done = true;
  if (REARM.on) note('REARMED - MAGAZINES FULL');
  REARM.on = false;
}
if (SIMS.on('pce')) HOOKS.tick.push((dt) => rearmStep(dt));
