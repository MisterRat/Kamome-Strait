/* ---------- engineering: the telegraph and the engine ---------- */
function engStep(dt) {
  /* a new order from the bridge rings the bell */
  const oi = telIdx(SHIP.tel);
  if (oi !== ENG.rung) {
    ENG.rung = oi;
    ENG.lagT = 0;
    if (started) {
      SND.tone(1650, 1640, 0.35, 0.09, 'triangle');
      SND.tone(1650, 1640, 0.35, 0.09, 'triangle', 0.45);
    }
  }
  /* the engineer answers in a second or two */
  ENG.lagT += dt;
  /* the player at the throttle (the Answer the Bells drill): the engines follow his lever, not the order */
  if (ENG.man != null) ENG.ans += Math.max(-0.5 * dt, Math.min(0.5 * dt, TELV[ENG.man] - ENG.ans));
  else if (ENG.lagT > 1.4) ENG.ans += Math.max(-0.5 * dt, Math.min(0.5 * dt, SHIP.tel - ENG.ans));
  const load = Math.abs(ENG.ans);
  ENG.heat += (0.3 + 0.7 * load - ENG.heat) * Math.min(1, dt / 60);
}
