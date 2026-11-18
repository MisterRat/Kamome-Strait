/* ---- the Comms school: T at station 3 teaches the set you are at, one step at a time; the instructor waits for you ---- */
function lesToggle(dev) {
  if (COMMS.les) {
    if (COMMS.les.atk && ASW.ph !== 'idle' && ASW.ph !== 'done') (ASW.ph = 'idle'), (SHIP.hold = SHIP.hdg);
    COMMS.les = null;
    ASW.who = 'tp';
    return note('COMMS SCHOOL ENDED');
  }
  if (!PT.on) ptToggle();
  const st = LES[dev]();
  COMMS.les = { dev, st, i: -1, t: 0, t0: SHIP.t, sc: {}, done: false };
  lesNext();
}
function lesNext() {
  const L = COMMS.les;
  L.i++;
  L.t = 0;
  SND.tone(660, 990, 0.18, 0.12, 'sine');
  if (L.i >= L.st.length) {
    L.done = true;
    return;
  }
  const s = L.st[L.i];
  if (s.go) s.go(L);
}
function lesStep(dt, at3) {
  const L = COMMS.les;
  if (!L) return;
  /* leaving the Communications station ends the school */
  if (SHIP.stn !== 3 || camMode != 1) return lesToggle();
  if (L.done) return;
  L.t += dt;
  const s = L.st[L.i];
  if (s && s.ok && s.ok(L)) lesNext();
}
