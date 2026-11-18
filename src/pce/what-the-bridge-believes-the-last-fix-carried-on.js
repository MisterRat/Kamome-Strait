/* what the bridge believes: the last fix carried on at his estimated speed; null with no contact */
function subEst() {
  const E = COMMS.est;
  if (!E) return null;
  const age = SHIP.t - E.t;
  return { p: E.p.clone().addScaledVector(E.v, Math.min(age, 60)), v: E.v, age, src: E.src };
}
function sonarReport() {
  const S = COMMS.sn,
    ping = (2 * SONAR.R[SONAR.ri] * 0.9144) / 1500 + 0.4,
    e = S.echo;
  if (!e || SHIP.t - e.t > ping * 2 + 0.5) {
    SND.tone(240, 200, 0.18, 0.12, 'square');
    return note('NO ECHO ON THIS BEARING TO REPORT');
  }
  const cuts = S.L != null && S.R != null && SHIP.t - S.tc < 30 && Math.abs(angW(S.R - S.L)) < 0.6,
    b = cuts ? S.L + angW(S.R - S.L) / 2 : SONAR.brg,
    r = e.r + (Math.random() - 0.5) * 10,
    p = cAt(b, r),
    E0 = COMMS.est;
  let v = new THREE.Vector3();
  if (E0 && E0.src === 'you' && SHIP.t - E0.t >= 8 && SHIP.t - E0.t < 60) {
    v.copy(p).sub(E0.p).multiplyScalar(1 / (SHIP.t - E0.t));
    if (E0.v) v.lerp(E0.v, 0.5);
    if (v.length() > 6) v.setLength(6);
  } else if (E0 && E0.v) v.copy(E0.v);
  COMMS.est = { p, v, t: SHIP.t, src: 'you' };
  const err = (Math.abs(angW(b - e.b)) * 180) / Math.PI;
  S.rep.push({ t: SHIP.t, err });
  if (err < 4) S.good++;
  const dop = e.dop > 0.8 ? 'UP DOPPLER' : e.dop < -0.8 ? 'DOWN DOPPLER' : 'NO DOPPLER',
    txt = 'CONTACT BEARING ' + c3(cTrue(b)) + ' RANGE ' + cYd(r) + ' YDS' + (cuts ? ' (CUTS)' : '') + (FM.use('comms') ? '' : ' ' + dop);
  SND.tone(880, 880, 0.08, 0.1, 'sine');
  RADIO.add('SONAR', txt, { own: true });
  note('SONAR: ' + txt);
  return err;
}
function sonarCut(side) {
  const S = COMMS.sn;
  S[side] = SONAR.brg;
  S.tc = SHIP.t;
  note((side === 'L' ? 'LEFT' : 'RIGHT') + ' CUT ' + c3(cTrue(SONAR.brg)) + (S.L != null && S.R != null && Math.abs(angW(S.R - S.L)) < 0.6 ? ' - CENTRE ' + c3(cTrue(S.L + angW(S.R - S.L) / 2)) : ''));
}
function sonarDopCall(c) {
  const e = COMMS.sn.echo;
  if (!e || SHIP.t - e.t > 8) return note('NO ECHO TO JUDGE');
  const a = e.dop > 0.8 ? 'U' : e.dop < -0.8 ? 'B' : 'N',
    name = { U: 'UP', B: 'DOWN', N: 'NO' };
  const ok = a === c;
  COMMS.sn.dc = { ok, t: SHIP.t };
  SND.tone(ok ? 880 : 240, ok ? 880 : 200, 0.12, 0.1, ok ? 'sine' : 'square');
  note(ok ? name[a] + ' DOPPLER - RIGHT' : 'NO - THAT WAS ' + name[a] + ' DOPPLER. LISTEN AGAIN');
}
