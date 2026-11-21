/* RETURN TO BASE (the pause menu's Return to base; the AI cons her while the player's OOD is on hold): the helmsman takes her from
   wherever she is to a point 700 m off her pier at the US PT-boat base, in along the pier at a slowing speed, stops her alongside
   with a touch astern, and her lines take her in: made fast at her berth (the outer 56 m of the PCE's 8 m pier, her bow toward the
   shore). Any engine order or rudder from the player casts her off (or ends the run). RTB (the ship state piece): on, under way
   home or moored; ph, the stage. */
function rtbBerth() {
  const F = FS.nav[1] /* the US PT-boat base */,
    U = 84.6 /* her centreline: the pier's side (75 + 4), a fender's width and half her beam */,
    [bx, bz] = F.w(U, 122),
    [ax, az] = F.w(U, 700),
    [cx, cz] = F.w(U, 121);
  return { B: new V(bx, 0, bz), A: new V(ax, 0, az), hdg: Math.atan2(-(cx - bx), -(cz - bz)) /* bow toward the shore */ };
}
function rtbStart() {
  if (!SIMS.on('pce') || !started || crashed) return;
  Object.assign(RTB, { on: true, ph: 'run' });
  RADIO.add('BRIDGE', 'HELM, BRIDGE: RETURN TO BASE. BRING HER ALONGSIDE HER BERTH AT THE PT BASE.', { own: true });
  note('RETURN TO BASE: THE HELMSMAN HAS HER');
}
/* the bearing (as a heading) from her to p */
const rtbTo = (p) => Math.atan2(-(p.x - pos.x), -(p.z - pos.z));
/* each frame from shipStep: true while it has the conn (it sets RTB.tel and RTB.hold); ord / hand are the player's orders */
function rtbStep(dt, ord, hand) {
  if (!RTB.on) return false;
  if (ord || hand) {
    note(RTB.ph === 'moored' ? 'CAST OFF' : 'RETURN TO BASE ENDED: THE OOD HAS HER');
    RTB.on = false;
    return false;
  }
  const b = rtbBerth(),
    dA = Math.hypot(b.A.x - pos.x, b.A.z - pos.z),
    dB = Math.hypot(b.B.x - pos.x, b.B.z - pos.z);
  if (RTB.ph === 'run') {
    RTB.hold = rtbTo(b.A);
    RTB.tel = dA > 600 ? 1 : 0.5;
    if (dA < 150) RTB.ph = 'in';
  } else if (RTB.ph === 'in') {
    /* along the line in from A to her berth: aim 120 m ahead of her place on it */
    const L = b.B.clone().sub(b.A),
      len = L.length(),
      s = Math.max(0, Math.min(len, ((pos.x - b.A.x) * L.x + (pos.z - b.A.z) * L.z) / len)),
      aim = b.A.clone().addScaledVector(L, Math.min(len, s + 120) / len);
    RTB.hold = rtbTo(aim);
    RTB.tel = Math.max(0.1, Math.min(0.5, dB / 1200));
    if (dB < 45) RTB.ph = 'stop';
  } else if (RTB.ph === 'stop') {
    RTB.hold = b.hdg;
    RTB.tel = SHIP.u > 0.25 ? -0.2 : 0;
    if (SHIP.u <= 0.25) {
      RTB.ph = 'lines';
      RADIO.add('BRIDGE', 'ALL ENGINES STOP. SEND OVER THE LINES.', { own: true });
    }
  } else {
    /* her lines take her in to the berth (lines), then she lies there made fast (moored) */
    RTB.tel = 0;
    RTB.hold = b.hdg;
    SHIP.u = SHIP.r = SHIP.rud = 0;
    const k = RTB.ph === 'lines' ? Math.min(1, dt / 4) : 1;
    pos.x += (b.B.x - pos.x) * k;
    pos.z += (b.B.z - pos.z) * k;
    SHIP.hdg += angW(b.hdg - SHIP.hdg) * k;
    if (RTB.ph === 'lines' && dB < 0.3 && Math.abs(angW(b.hdg - SHIP.hdg)) < 0.005) {
      RTB.ph = 'moored';
      note('ALL FAST: MOORED AT HER BERTH');
      RADIO.add('BRIDGE', 'ALL FAST. FINISHED WITH ENGINES.', { own: true });
    }
  }
  return true;
}
/* the pause menu's button (her game only) */
if (SIMS.on('pce') && $$('pmRestart')) {
  const b = document.createElement('button');
  b.id = 'pmRtb';
  b.textContent = 'Return to base';
  b.title = 'The helmsman takes her home and alongside her berth at the PT base (any order of yours casts her off)';
  b.onclick = () => {
    pauseMenu(false);
    rtbStart();
  };
  $$('pmRestart').after(b);
}
