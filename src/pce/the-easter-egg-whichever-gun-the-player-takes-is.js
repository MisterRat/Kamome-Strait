/* the easter egg: whichever gun the player takes is fully loaded at once (both modes) */
function gunFill(G) {
  const s = G.s;
  if (s.mag) (G.rnd = s.mag), (G.rl = 0);
  if (s.auto) (G.al = [s.auto, s.auto]), (G.feedT = [0, 0]);
  G.ft = 0;
}
function gunStation() {
  gunInit();
  const st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub];
  GUN.cur = SHIP.stn === 4 && st && st.gun ? gunOf(st.gun) : null;
  GUN.look = false;
  if (GUN.cur) {
    GUN.cur.trT = GUN.cur.tr;
    GUN.cur.elT = GUN.cur.s.sight === 'scope' && !GUN.cur.taken ? -0.002 /* first time on: the sight on the horizon */ : GUN.cur.el - GUN.cur.se;
    GUN.cur.taken = true;
    gunFill(GUN.cur);
    gunLock(true);
    SHIP.hold = SHIP.hdg; /* the helmsman steadies her on this heading */
  }
}
function angW(a) {
  return ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
}
