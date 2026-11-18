/* ---- radio ---- */
const RQ_BRIDGE = /CHECK FIRE|CEASE FIRE|COMMENCE|DIVED|DIVE |SURFAC|EXERCISE|PASS|TURNING|COURSE|CLOSE IN/;
function radioIn(from, txt) {
  const m = { from, txt, route: RQ_BRIDGE.test(txt), t0: SHIP.t, st: 'open' },
    st = PCEM.STN[3] && PCEM.STN[3][SHIP.sub],
    atRadio = camMode == 1 && SHIP.stn === 3 && st && st.dev === 'radio' && started;
  if (!atRadio) m.st = 'ai';
  else {
    COMMS.rq.push(m);
    SND.tone(1400, 1400, 0.05, 0.08, 'square');
    SND.tone(1400, 1400, 0.05, 0.08, 'square', 0.1);
  }
  return m;
}
function radioAct(route) {
  const m = COMMS.rq.find((q) => q.st === 'open');
  if (!m) {
    if (!route && COMMS.out) {
      RADIO.add('PCE 842', COMMS.out, { own: true });
      note('SENT: ' + COMMS.out);
      COMMS.out = null;
      COMMS.sent = (COMMS.sent || 0) + 1;
      return;
    }
    return note('NO TRAFFIC WAITING');
  }
  if (route) m.st = 'ok';
  else m.st = m.route ? 'wrong' : 'ok';
  SND.tone(m.st === 'ok' ? 880 : 240, m.st === 'ok' ? 880 : 200, 0.1, 0.1, m.st === 'ok' ? 'sine' : 'square');
  RADIO.add('PCE 842', (route ? 'ROGER, PASSED TO THE BRIDGE: ' : 'ROGER: ') + m.from, { own: true });
  note(m.st === 'wrong' ? 'THAT ONE WAS FOR THE BRIDGE - NOT PASSED ON' : route ? 'ROGER - PASSED TO THE BRIDGE' : 'ROGER');
}
