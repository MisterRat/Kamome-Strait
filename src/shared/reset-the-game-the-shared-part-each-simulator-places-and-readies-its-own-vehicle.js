/* reset the game: the shared part; each simulator places its own vehicle (role spawn) and readies it (role ready) */
function reset() {
  try {
    roamExit(true);
  } catch (e) {}
  resetWeapons();
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
  bailReset();
  SIMS.cur.ready() /* gear, which model shows, where the chase camera starts */;
  $$('msg').style.display = 'none';
  trainerReset();
  PP.ix = 0;
  if (started && !RPL.busy && !RPL.keep && PRE_MODES[trn.mode] && PP.key !== ppKey()) rpPrefly();
}
