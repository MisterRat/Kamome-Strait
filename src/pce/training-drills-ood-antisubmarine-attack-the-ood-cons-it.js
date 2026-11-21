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
    for (const k of ['rack', 'port', 'stbd']) ((DC.dep[k] = D.depth), (DC.arm[k] = true));
    SHIP.tel = Math.max(SHIP.tel, 0.45);
    D.rep = 0;
    D.pat = null;
    drillSay('SONAR', 'BRIDGE, SONAR. CONTACT BEARING ' + raidBrg(sub.p) + ', RANGE ' + Math.round(sub.p.distanceTo(pos) / 0.9144 / 50) * 50 + ' YARDS. CLASSIFIED SUBMARINE. DEPTH ABOUT ' + D.depth + ' FEET.');
  },
  stop() {
    ASW.drill = false;
  },
  /* where he really is, relative to her: ahead (along her course) and across (to starboard), in yards */
  rel(D) {
    const fw = { x: -Math.sin(SHIP.hdg), z: -Math.cos(SHIP.hdg) },
      dx = D.sub.p.x - pos.x,
      dz = D.sub.p.z - pos.z;
    return { al: (dx * fw.x + dz * fw.z) / 0.9144, cr: (dx * -fw.z + dz * fw.x) / 0.9144 };
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
    /* the pattern the torpedomen roll: rack, starboard K-gun, port K-gun, rack */
    if (D.pat) {
      const t = D.t - D.pat.t0;
      for (const [k, at] of [
        ['rack', 0],
        ['stbd', 4],
        ['port', 8],
        ['rack', 14],
      ])
        if (t >= at && !D.pat[k + at]) ((D.pat[k + at] = 1), dcFire(k));
    }
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
      D.pat = { t0: D.t, rel: this.rel(D), best: (SHIP.u * (D.depth / 8) - 30) / 0.9144 };
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
    if (PT.on) ptToggle();
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
    /* the plot, ship's head up: her, the Hedgehog's landing ring 250 yd ahead, and where sonar last put him (Hardcore: nothing) */
    const cx = w / 2,
      cy = h * 0.8,
      sc = (h * 0.75) / 1400;
    g.strokeStyle = '#2c4250';
    for (const R of [250, 500, 1000]) {
      g.beginPath();
      g.arc(cx, cy, R * sc, Math.PI, 2 * Math.PI);
      g.stroke();
    }
    g.fillStyle = '#9fc3d6';
    g.fillRect(cx - 2, cy - 8, 4, 16);
    g.strokeStyle = 'rgba(255,210,122,.6)';
    g.beginPath();
    g.arc(cx, cy - 250 * sc, 13 * sc * 3, 0, Math.PI * 2);
    g.stroke();
    if (!D.hc && D.last) {
      const E = subEst();
      if (E) {
        const fw = { x: -Math.sin(SHIP.hdg), z: -Math.cos(SHIP.hdg) },
          dx = (E.p.x - pos.x) / 0.9144,
          dz = (E.p.z - pos.z) / 0.9144,
          al = dx * fw.x + dz * fw.z,
          cr = dx * -fw.z + dz * fw.x;
        g.fillStyle = '#ff8a6a';
        g.beginPath();
        g.arc(cx + cr * sc, cy - al * sc, 4, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = '#6a7a84';
    g.font = '10px monospace';
    g.fillText('250', cx + 3, cy - 250 * sc - 3);
    g.fillText('500', cx + 3, cy - 500 * sc - 3);
    g.fillText('1000 YD', cx + 3, cy - 1000 * sc - 3);
  },
});
