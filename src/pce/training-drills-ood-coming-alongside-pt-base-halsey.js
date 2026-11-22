/* ---- OOD DRILL: COMING ALONGSIDE. She is put about 700 m off PT Base Halsey, heading in at about 5 kn; her berth is the outer end of
   her own pier (either side of it, 56 m alongside: the captain asks for starboard side to, on its east side, but port side to on its
   west side is taken too). Bring her in and stop alongside: parallel to the pier (within 8 deg), her middle abreast the berth's
   (within 20 m), close to it (her side within 6 m of the pier), stopped (under 0.5 kn) for five seconds while the lines go over. The
   box ticks off each of the four as she meets it (the user's, 2026-11-22: alongside, nothing said what was still wrong). Touch the pier faster than 2 kn, or put her aground, and the drill fails. Assessed on the time, the speed she met
   the pier with, how close and how square she lay, and where along the berth. Normal: markers on the berth's ends ---- */
const BERTH = { u: 75 + 4 + 5.04 + 1 /* the pier's east edge, her half beam, a metre of fenders */, uW: 75 - 4 - 5.04 - 1 /* its west side */, d0: 94, d1: 150 };
DRILLS.push({
  id: 'along',
  stn: 1,
  title: 'Coming alongside',
  what: 'Bring her in from 700 m off PT Base Halsey and stop alongside her pier: parallel, close, stopped. Gently.',
  start(D) {
    const F = FS.nav.find((s) => s.navy === 'us');
    D.F = F;
    /* her starting place, out to sea of the berth and a little to the east of its line; heading in (along -S) */
    const [x, z] = F.w(BERTH.u + 25, 700);
    pos.set(x, pos.y, z);
    SHIP.hdg = Math.atan2(F.S.x, F.S.z);
    SHIP.hold = SHIP.hdg;
    SHIP.u = 0.3 * SHIP.VMAX;
    SHIP.tel = 0.3;
    ENG.ans = 0.3;
    SHIP.r = SHIP.rud = 0;
    SHIP.aground = false;
    if (SHIPM.hull) OCEAN.clearTrail(SHIPM.hull);
    D.rings = [];
    if (!D.hc)
      for (const d of [BERTH.d0, BERTH.d1]) {
        const r = ptRingSprite(),
          [bx, bz] = F.w(BERTH.u, d);
        r.position.set(bx, SEA.WL + 3, bz);
        scene.add(r);
        D.rings.push(r);
      }
    D.vMax = 0;
    drillSay('CAPTAIN', 'TAKE HER IN. STARBOARD SIDE TO, THE OUTER END OF OUR PIER. GENTLY.');
  },
  stop(D) {
    for (const r of D.rings || []) scene.remove(r);
  },
  /* her middle in the base's frame: u along the coast, d out to sea; her heading against the pier's line */
  at(D) {
    const [u, d] = D.F.uv(pos.x, pos.z),
      fw = { x: -Math.sin(SHIP.hdg), z: -Math.cos(SHIP.hdg) },
      along = fw.x * -D.F.S.x + fw.z * -D.F.S.z /* 1: bow in */,
      ang = Math.acos(Math.min(1, Math.abs(along))) * (180 / Math.PI),
      east = u >= 75 /* which side of the pier she is on */,
      gap = east ? u - BERTH.u : BERTH.uW - u /* her side from where it should lie (0: against the fenders) */;
    return { u, d, ang, gap, east, kn: Math.abs(SHIP.u) / 0.5144, mid: d - (BERTH.d0 + BERTH.d1) / 2 };
  },
  /* the four conditions, each true when met */
  ok4(A) {
    return { par: A.ang < 8, close: A.gap < 6 && A.gap > -1, abreast: Math.abs(A.mid) < 20, stop: A.kn < 0.5 };
  },
  step(D, dt) {
    const A = this.at(D);
    /* touching: her side reaches the pier's edge alongside it (or her bow its end) */
    const touch = (A.gap < -0.6 && A.d < BERTH.d1 + 28 && A.d > 0) || SHIP.aground;
    if (touch) {
      D.vMax = Math.max(D.vMax, A.kn);
      if (A.kn > 2 || SHIP.aground) {
        drillSay('CAPTAIN', SHIP.aground ? 'YOU HAVE PUT HER AGROUND.' : 'YOU HAVE HIT THE PIER AT ' + A.kn.toFixed(1) + ' KNOTS. DAMAGE TO THE PIER AND TO HER BOW.');
        return drillEnd(D, 0, ['<b style="color:#ff8a6a">' + (SHIP.aground ? 'AGROUND' : 'STRUCK THE PIER AT ' + A.kn.toFixed(1) + ' KN') + '</b>: COME IN SLOWER, AND STOP HER WITH THE ENGINES ASTERN.']);
      }
      SHIP.u *= 0.5; /* the fenders take her way off */
    }
    const K = this.ok4(A),
      ok = K.par && K.close && K.abreast && K.stop;
    if (ok) {
      if ((D.hold = (D.hold || 0) + dt) > 5) {
        drillSay('BOATSWAIN', 'ALL LINES DOUBLED UP. SHE IS FAST ALONGSIDE.');
        D.fin = A;
        return this.finish(D);
      }
    } else D.hold = 0;
    if (D.t > 900) return drillEnd(D, 10, ['<b style="color:#ff8a6a">FIFTEEN MINUTES AND SHE IS NOT ALONGSIDE.</b>']);
  },
  finish(D) {
    const A = D.fin;
    const s = drillMark(D.t, 180, 600, 30) + drillMark(D.vMax, 0.3, 2, 20) + drillMark(Math.max(0, A.gap), 1, 6, 20) + drillMark(A.ang, 1.5, 8, 15) + drillMark(Math.abs(A.mid), 2, 20, 15);
    drillEnd(D, s, [
      'ALONGSIDE IN <b>' + fmtT(D.t) + '</b> &middot; MET THE PIER AT ' + (D.vMax ? D.vMax.toFixed(1) + ' KN' : 'NOTHING (STOPPED CLEAR OF IT)'),
      (A.east ? 'STARBOARD SIDE TO (AS ORDERED). ' : 'PORT SIDE TO, ON THE PIER\'S WEST SIDE. ') + 'LYING ' + Math.max(0, A.gap).toFixed(1) + ' M OFF THE FENDERS, ' + A.ang.toFixed(1) + '&deg; OFF PARALLEL, HER MIDDLE ' + Math.abs(A.mid).toFixed(0) + ' M ' + (A.mid > 0 ? 'SEAWARD OF' : 'INSHORE OF') + ' THE BERTH\'S',
    ]);
  },
  box(D) {
    const A = this.at(D),
      toGo = A.d - (BERTH.d0 + BERTH.d1) / 2,
      K = this.ok4(A),
      c = (ok, t) => '<b style="color:' + (ok ? '#8fe39a">&#10003; ' : '#ff8a6a">&#10007; ') + t + '</b>',
      near = A.d < 260 && Math.abs(A.gap) < 60;
    return (
      (near
        ? c(K.par, 'PARALLEL ' + Math.round(A.ang) + '&deg;') + ' &middot; ' +
          c(K.close, 'ALONGSIDE ' + (A.gap > -1 ? Math.max(0, A.gap).toFixed(1) + ' M OFF' : 'INSIDE THE PIER\'S LINE')) + ' &middot; ' +
          c(K.abreast, K.abreast ? 'ABREAST THE BERTH' : Math.round(Math.abs(A.mid)) + ' M ' + (A.mid > 0 ? 'SHORT OF' : 'PAST') + ' THE BERTH') + ' &middot; ' +
          c(K.stop, 'STOPPED ' + A.kn.toFixed(1) + ' KN') +
          (D.hold > 0 ? ' &middot; <b style="color:#ffd27a">LINES GOING OVER ' + Math.ceil(5 - D.hold) + '</b>' : '')
        : 'THE BERTH: <b>' + Math.max(0, Math.round(toGo)) + ' M</b> TO GO &middot; SPEED <b>' + A.kn.toFixed(1) + ' KN</b> &middot; ' + Math.round(A.ang) + '&deg; OFF PARALLEL') +
      '<br>STOP HER ALONGSIDE THE OUTER END OF THE PIER: SIDE WITHIN 6 M, PARALLEL, MIDDLE WITHIN 20 M OF THE BERTH\'S, UNDER 0.5 KN FOR 5 S (BACK HER: <b>S</b>). OVER 2 KN AGAINST THE PIER FAILS.'
    );
  },
  draw(D, g, w, h) {
    /* the berth plan from above: the shore on the right, the pier running out to the left, her outline (sideways x 2) */
    const k = (w - 20) / 340,
      k2 = k * 2,
      cy = h * 0.42,
      X = (d) => w - 10 - d * k,
      Y = (u) => cy + (u - BERTH.u) * k2;
    g.fillStyle = '#3d3424';
    g.fillRect(w - 10, 0, 10, h);
    g.fillStyle = '#7a6040';
    g.fillRect(X(150), Y(71), 150 * k, 8 * k2); /* the pier: 8 m wide, centred 75 m along the coast */
    g.strokeStyle = 'rgba(143,227,154,.7)';
    for (const bu of [BERTH.u, BERTH.uW]) g.strokeRect(X(BERTH.d1), Y(bu - 5.04), (BERTH.d1 - BERTH.d0) * k, 10.08 * k2);
    const A = this.at(D);
    if (A.d < 330 && Math.abs(A.gap) < 60) {
      const a = SHIP.hdg - Math.atan2(D.F.S.x, D.F.S.z);
      g.save();
      g.translate(X(A.d), Y(A.u));
      g.rotate(a);
      g.fillStyle = '#9fc3d6';
      g.beginPath();
      g.moveTo(28 * k, 0);
      g.lineTo(18 * k, -5 * k2);
      g.lineTo(-28 * k, -5 * k2);
      g.lineTo(-28 * k, 5 * k2);
      g.lineTo(18 * k, 5 * k2);
      g.closePath();
      g.fill();
      g.restore();
    } else {
      g.fillStyle = '#9aa';
      g.font = '12px monospace';
      g.fillText('THE PLAN SHOWS HER INSIDE 330 M', 20, h - 12);
    }
  },
});
