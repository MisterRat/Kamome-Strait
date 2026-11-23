/* reset the game: the shared part; each simulator places its own vehicle (role spawn) and readies it (role ready) */
function reset() {
  try {
    roamExit(true);
  } catch (e) {}
  for (const s of SIMS.list) if (s !== SIMS.cur) s.showSelf(false); /* a page with several simulators: only the one played is seen */
  SIMS.cur.resetBegin(); /* its own weapons and systems */
  if (typeof AIRSUP !== 'undefined') AIRSUP.clear(); /* no air support up or called */
  if (typeof SIGHT !== 'undefined') SIGHT.reset(); /* no sighting reports yet: the enemy has not seen her */
  if (typeof SUBS !== 'undefined') SUBS.clear(); /* the enemy submarine and her torpedoes gone (she comes again) */
  if (SITE.t14w)
    for (const g of SITE.t14w.groups || []) ((g.mag = g.mag0), g.B.forEach((b) => b.fish.set(2))); /* the torpedo boats' bases restocked, their tubes full */
  killed = 0;
  paused = false;
  invT = 0;
  blk = 0;
  engOut = false;
  FM.reset();
  DM.reset();
  buffet = 0;
  flapLvl = 0;
  fl = 0;
  SIMS.cur.spawn() /* the vehicle at its start */;
  vel.set(0, 0, 0);
  thr = 0;
  s = { p: 0, r: 0, y: 0 };
  trimGround();
  crashed = false;
  SIMS.cur.ready() /* gear, which model shows, where the chase camera starts */;
  $$('msg').style.display = 'none';
  convoyClear(); /* the world's enemy convoy back to its start */
  CV.st = 'idle';
  CV.tm = 8;
  SIMS.cur.resetEnd() /* its missions and trainers */;
}
