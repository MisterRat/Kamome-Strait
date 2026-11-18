/* ---- each frame ---- */
function commsUpdate(dt, here) {
  const st = PCEM.STN[3] && PCEM.STN[3][SHIP.sub],
    at3 = here && SHIP.stn === 3 && st,
    R = COMMS.rd;
  if (at3 && st.dev === 'radar') {
    const sc = RADAR.R[RADAR.ri] * 1852,
      f = keys.ShiftLeft || keys.ShiftRight ? 3 : 1;
    R.b = angW(R.b + (kb('sTrR') - kb('sTrL')) * 0.5 * f * dt);
    R.r = Math.max(100, Math.min(sc, R.r * Math.exp(((keys.KeyR ? 1 : 0) - (keys.KeyF ? 1 : 0)) * 0.55 * f * dt)));
  }
  /* radio: deadlines, the scheduled lesson traffic, the practice traffic */
  const W = FM.use('comms') ? 12 : 20;
  for (const m of COMMS.rq)
    if (m.st === 'open' && SHIP.t - m.t0 > W) {
      m.st = 'miss';
      note('RADIO: UNANSWERED - ' + m.from);
    }
  if (COMMS.rq.length > 20) COMMS.rq.splice(0, COMMS.rq.length - 20);
  for (let i = COMMS.sched.length - 1; i >= 0; i--)
    if (SHIP.t >= COMMS.sched[i].at) {
      const q = COMMS.sched.splice(i, 1)[0];
      RADIO.add(q.from, q.txt);
    }
  if (PT.on && started && !COMMS.les) {
    COMMS.gen -= dt;
    if (COMMS.gen <= 0) {
      COMMS.gen = 55 + Math.random() * 40;
      const g = RQ_GEN[Math.floor(Math.random() * RQ_GEN.length)];
      RADIO.add(g[0], g[1]);
    }
  }
  if (COMMS.les) lesStep(dt, at3);
}
