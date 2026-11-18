/* R at a gun: the 20 mm's loader changes the drum now (a part-used one comes off); the 40 mm's loaders feed clips all the time */
function gunReload() {
  const G = GUN.cur;
  if (!G || camMode != 1) return false;
  const s = G.s;
  if (s.mag) {
    if (G.rl > 0) return note('CHANGING DRUM'), true;
    if (G.rnd >= s.mag) return note('DRUM FULL'), true;
    G.rnd = 0;
    G.rl = s.reload * rldK();
    note('CHANGING DRUM');
  } else if (s.auto) note('THE LOADERS FEED CLIPS AS FAST AS THEY CAN');
  else note('THE LOADER RAMS EACH ROUND');
  return true;
}
