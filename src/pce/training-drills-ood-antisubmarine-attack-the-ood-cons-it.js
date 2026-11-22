/* ---- OOD DRILL: ANTISUBMARINE ATTACK. The exercise submarine is about 1,400 yd ahead; sonar (the AI operator) reports him every
   few seconds: bearing, range and Doppler. The OOD cons the attack himself: steer to put him fine on the bow, slow to attack speed,
   and order the weapons; the torpedomen (AI) carry the orders out at the depth sonar gives.
     Space  FIRE HEDGEHOG: its 24 bombs land in a ring about 250 yd ahead of her: fire with him 200 to 300 yd ahead, dead on the bow
     R      FIRE THE PATTERN: the stern racks and both K-guns, over about 14 s: order it as her stern comes over him
   The pattern's best moment: the charges sink about 8 ft a second, so the first, off the stern, must go while he is still ahead by
   her run in that time. Sonar loses him inside about 150 yd (the beam passes over him): from there the OOD runs on his last bearing and his timing.
   Assessed on the result (a Hedgehog hit or a charge within 25 yd: a kill; within 60: damaged) and on the timing of each weapon.
   Normal: the plot shows where sonar puts him; Hardcore: the reports only ---- */
DRILLS.push({
  id: 'asw-ood',
  stn: 1,
  title: 'Antisubmarine attack',
  what: 'Con the attack on the exercise sub from sonar reports: steer, slow, fire the Hedgehog (Space) and the pattern (R) on time.',
  start(D) {
    if (!PT.on) ptToggle();
    const sub = PT.L.find((t) => t.kind === 'sub');
    D.sub = sub;
    aswPlace(sub, 1280);
    sub.o.d = [30.5, 45.7, 61][Math.floor(Math.random() * 3)];
    D.depth = Math.round(sub.o.d / 0.3048 / 25) * 25;
    COMMS.est = { p: sub.p.clone(), v: sub.v.clone(), t: SHIP.t, src: 'ai' };
    Object.assign(ASW, { drill: true, best: 1e9, hh: 0 });
    HH.n = 24;
    DC.rack = [8, 8];
    DC.kg = [2, 2];
    DC.kl = [1, 1, 1, 1];
    aswArm(D.depth);
    SHIP.tel = Math.max(SHIP.tel, 0.45);
    D.rep = 0;
    D.pat = null;
    drillSay('SONAR', 'BRIDGE, SONAR. CONTACT BEARING ' + raidBrg(sub.p) + ', RANGE ' + Math.round(sub.p.distanceTo(pos) / 0.9144 / 50) * 50 + ' YARDS. CLASSIFIED SUBMARINE. DEPTH ABOUT ' + D.depth + ' FEET.');
  },
  stop() {
    ASW.drill = false;
  },
  rel(D) {
    return aswRelTo(D.sub.p);
  },
  step(D, dt) {
    const sub = D.sub,
      r = Math.hypot(sub.p.x - pos.x, sub.p.z - pos.z) / 0.9144;
    /* sonar's reports: every 8 s while he is outside about 150 yd */
    if (r > 150 && (D.rep -= dt) <= 0) {
      D.rep = 8;
      /* Doppler: his own motion toward or away from her (the set takes out her own) */
      const close = sub.v.dot(new THREE.Vector3(pos.x - sub.p.x, 0, pos.z - sub.p.z).normalize()),
        dop = Math.abs(close) < 0.4 ? 'NO' : close > 0 ? 'UP' : 'DOWN';
      COMMS.est = { p: sub.p.clone(), v: sub.v.clone(), t: SHIP.t, src: 'ai' };
      D.last = { b: raidBrg(sub.p), r: Math.round(r / 25) * 25, dop, t: D.t };
      drillSay('SONAR', 'BEARING ' + D.last.b + ', RANGE ' + D.last.r + ', ' + dop + ' DOPPLER.');
    }
    if (r <= 150 && !D.lostSaid) ((D.lostSaid = true), drillSay('SONAR', 'LOST CONTACT, RANGE 150. HE IS UNDER THE BOW.'));
    /* the pattern the torpedomen roll */
    if (D.pat) aswPatStep(D.pat, D.t);
    /* done: both weapons fired and gone off, or he is well astern and nothing more will come, or ten minutes */
    const spent = D.hhT !== undefined && D.pat && D.t - D.pat.t0 > 32 && !HH.L.length && !HH.q.length && !DC.L.length,
      past = this.rel(D).al < -900;
    if (spent || past || D.t > 600) this.finish(D);
  },
  key(D, code, rep) {
    if (code !== 'Space' && code !== 'KeyR') return false;
    if (rep) return true;
    if (code === 'Space' && D.hhT === undefined) {
      if (hhFire()) ((D.hhT = D.t), (D.hhRel = this.rel(D)), drillSay('BRIDGE', 'FIRE HEDGEHOG!'));
    } else if (code === 'KeyR' && !D.pat) {
      /* the best moment: the first charge, off the stern (about 30 m abaft her middle), reaching his depth as she passes over:
         he should be ahead of her middle by her run in those seconds, less the stern's 30 m */
      D.pat = { t0: D.t, rel: this.rel(D), best: aswBest(D.depth) };
      drillSay('BRIDGE', 'FIRE THE PATTERN! SET ' + D.depth + ' FEET.');
    }
    return true;
  },
  finish(D) {
    const yd = ASW.best,
      v = ASW.hh > 0 || yd <= 25 ? 'KILL' : yd <= 60 ? 'DAMAGED' : 'MISSED',
      H = D.hhRel,
      Pt = D.pat && D.pat.rel;
    ASW.drill = false;
    let s = v === 'KILL' ? 60 : v === 'DAMAGED' ? 35 : 0;
    /* the Hedgehog: he 200 to 300 yd ahead and on the bow; the pattern: her stern (about 50 yd abaft the bridge) over him */
    if (H) s += drillMark(Math.abs(H.al - 250), 40, 200, 12) * (Math.abs(H.cr) < 40 ? 1 : 0.4) + 8;
    if (Pt) s += drillMark(Math.abs(Pt.al - D.pat.best), 25, 200, 12) * (Math.abs(Pt.cr) < 50 ? 1 : 0.4) + 8;
    drillSay('EXERCISE SUB', v === 'KILL' ? 'YOU GOT ME. SURFACING. EXERCISE COMPLETE.' : v === 'DAMAGED' ? 'CLOSE. I WOULD BE DAMAGED. SURFACING.' : 'YOU MISSED. SURFACING. EXERCISE COMPLETE.');
    drillEnd(D, s, [
      'RESULT: <b>' + v + '</b>' + (ASW.hh ? ' (' + ASW.hh + ' HEDGEHOG HITS)' : '') + (yd < 1e8 ? ' &middot; NEAREST CHARGE ' + yd + ' YD' : ''),
      'HEDGEHOG: ' + (H ? 'FIRED WITH HIM ' + Math.round(H.al) + ' YD AHEAD, ' + Math.round(Math.abs(H.cr)) + ' YD ' + (H.cr < 0 ? 'TO PORT' : 'TO STARBOARD') + ' (BEST: 250 AHEAD, DEAD ON THE BOW)' : '<b style="color:#ff8a6a">NOT FIRED</b>'),
      'PATTERN: ' + (Pt ? 'ORDERED WITH HIM ' + Math.round(Pt.al) + ' YD ' + (Pt.al >= 0 ? 'AHEAD' : 'ASTERN') + ' (BEST AT HER SPEED AND HIS DEPTH: ' + Math.round(D.pat.best) + ' ' + (D.pat.best >= 0 ? 'AHEAD' : 'ASTERN') + ')' : '<b style="color:#ff8a6a">NOT ORDERED</b>'),
    ]);
    D.sub.o.surfT = 150; /* Roncador surfaces */
  },
  box(D) {
    const L = D.last;
    return (
      'SONAR: ' + (L ? 'BEARING <b>' + L.b + '</b>, RANGE <b>' + L.r + '</b> YD, ' + L.dop + ' DOPPLER <span style="color:#9aa">(' + Math.round(D.t - L.t) + ' S AGO)</span>' : '...') +
      (D.lostSaid ? ' &middot; <b style="color:#ff8a6a">LOST: UNDER THE BOW</b>' : '') +
      '<br>DEPTH SET ' + D.depth + ' FT &middot; HEDGEHOG ' + (D.hhT === undefined ? '<b>Space</b>' : 'FIRED') + ' &middot; PATTERN ' + (D.pat ? 'ROLLING' : '<b>R</b>') + ' &middot; STEER <b>A / D</b>, SPEED <b>W / S</b> (ATTACK SPEED ABOUT 2/3)'
    );
  },
  draw(D, g, w, h) {
    /* the plot (Hardcore: no contact on it) */
    const E = !D.hc && D.last && subEst();
    aswHeadUp(g, w, h, E && E.p);
  },
});
