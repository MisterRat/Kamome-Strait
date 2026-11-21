/* ---- OOD DRILL: MAN OVERBOARD. A man goes over the side while she steams at standard speed. The Williamson turn brings her
   back down her own track to him: the rudder full over toward the side he fell from, at once (it swings her stern, and her
   screws, away from him); when she has come 60 deg off her course, the rudder full the other way; steady on the reciprocal of the
   old course, and he is fine on the bow. Then slow, and stop with him close alongside (within 30 m, under 1.5 kn; Hardcore 20 m
   and 1 kn) for three seconds while the line is passed. Assessed on the rudder (how soon, and the right way), where the rudder was
   shifted, how close she steadied on the reciprocal, the time to recover him and the approach. Run him down and the drill fails.
   Normal: a marker ring stays on him; Hardcore: only the man in his kapok jacket ---- */
DRILLS.push({
  id: 'mob',
  stn: 1,
  title: 'Man overboard',
  what: 'A man goes over the side at standard speed. Williamson turn back down your track, then stop with him alongside.',
  start(D) {
    const fw = new THREE.Vector3(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)),
      rt = new THREE.Vector3(Math.cos(SHIP.hdg), 0, -Math.sin(SHIP.hdg));
    SHIP.tel = Math.max(SHIP.tel, 0.7);
    SHIP.u = Math.max(SHIP.u, 0.7 * SHIP.VMAX);
    ENG.ans = Math.max(ENG.ans, 0.7);
    D.side = Math.random() < 0.5 ? 1 : -1; /* 1 starboard */
    D.h0 = SHIP.hdg;
    D.man = pos.clone().addScaledVector(rt, D.side * 7).addScaledVector(fw, -18);
    /* the man: a head and shoulders in an orange kapok jacket */
    const g = new THREE.Group(),
      M = (c) => new THREE.MeshLambertMaterial({ color: c });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 10), M(0xe8742a)));
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M(0xc69070));
    hd.position.y = 0.36;
    g.add(hd);
    if (!D.hc) {
      const r = ptRingSprite();
      r.position.y = 1;
      g.add(r);
    }
    scene.add(g);
    D.g = g;
    D.ph = 'turn'; /* turn: putting the rudder over and swinging 60 deg; shift: swinging back to the reciprocal; app: the approach */
    D.dev = 0;
    D.maxDev = 0;
    drillSay('LOOKOUT', 'MAN OVERBOARD, ' + (D.side > 0 ? 'STARBOARD' : 'PORT') + ' SIDE! MAN OVERBOARD!');
  },
  stop(D) {
    if (D.g) scene.remove(D.g);
  },
  step(D, dt) {
    D.g.position.set(D.man.x, OCEAN.h(D.man.x, D.man.z, OCEAN.U.uTime.value) - 0.15, D.man.z);
    const dev = angW(SHIP.hdg - D.h0) * -1 /* + to starboard */,
      dx = D.man.x - pos.x,
      dz = D.man.z - pos.z,
      d = Math.hypot(dx, dz),
      kn = Math.abs(SHIP.u) / 0.5144;
    D.minD = Math.min(D.minD || 1e9, d);
    /* the rudder: the first time it is put well over, which way and how soon */
    if (D.rudT === undefined && Math.abs(SHIP.rud) > 0.5) ((D.rudT = D.t), (D.rudOK = Math.sign(SHIP.rud) === D.side));
    if (D.ph === 'turn') {
      if (Math.abs(dev) > D.maxDev) D.maxDev = Math.abs(dev);
      /* the shift: the rudder put the other way */
      if (D.rudT !== undefined && Math.sign(SHIP.rud) === -Math.sign(dev) && Math.abs(SHIP.rud) > 0.4 && Math.abs(dev) > 0.15) {
        D.shift = Math.abs(dev);
        D.ph = 'shift';
        note('RUDDER SHIFTED AT ' + Math.round((D.shift * 180) / Math.PI) + ' DEG OFF');
      }
    } else if (D.ph === 'shift') {
      /* steadied on (near) the reciprocal: the heading's error when the swing has all but stopped */
      const rec = Math.abs(angW(SHIP.hdg - (D.h0 + Math.PI)));
      if (rec < 0.6 && Math.abs(SHIP.r) < 0.02) {
        D.recErr = rec;
        D.ph = 'app';
        note('STEADY ON ' + String(Math.round(((((D.h0 + Math.PI) * -180) / Math.PI) % 360 + 360) % 360)).padStart(3, '0') + ' - THE RECIPROCAL');
      }
    }
    /* run him down: close aboard at speed */
    if (d < 7 && kn > 3) {
      drillSay('LOOKOUT', 'WE HAVE RUN HIM DOWN! HE WENT UNDER THE STERN!');
      return drillEnd(D, 0, ['<b style="color:#ff8a6a">YOU RAN HIM DOWN</b> (' + kn.toFixed(1) + ' KN, ' + Math.round(d) + ' M). SLOW WELL BEFORE YOU REACH HIM.']);
    }
    /* the pickup: alongside, slow, for three seconds */
    const near = D.hc ? 20 : 30,
      slow = D.hc ? 1 : 1.5;
    if (d < near && kn < slow) {
      D.hold = (D.hold || 0) + dt;
      if (D.hold > 3) {
        D.pick = { d, kn, t: D.t };
        drillSay('BOATSWAIN', 'LINE OVER - WE HAVE HIM. MAN RECOVERED!');
        return this.finish(D);
      }
    } else D.hold = 0;
    if (D.t > 900) return drillEnd(D, 10, ['<b style="color:#ff8a6a">FIFTEEN MINUTES AND HE IS STILL IN THE WATER.</b> THE WILLIAMSON TURN BRINGS HER BACK IN ABOUT FIVE.']);
  },
  finish(D) {
    const deg = (a) => (a * 180) / Math.PI,
      rT = D.rudT === undefined ? 99 : D.rudT,
      sh = D.shift === undefined ? 0 : deg(D.shift),
      rec = D.recErr === undefined ? 45 : deg(D.recErr),
      P = D.pick;
    let s = 0;
    s += D.rudOK ? drillMark(rT, 3, 15, 15) : 0;
    s += D.shift === undefined ? 0 : drillMark(Math.abs(sh - 60), 8, 35, 15);
    s += drillMark(rec, 3, 25, 15);
    s += drillMark(P.t, 300, 780, 35);
    s += drillMark(P.kn, 0.4, 1.5, 10) + drillMark(P.d, 10, 30, 10);
    drillEnd(D, s, [
      'RUDDER: ' + (D.rudOK ? 'THE RIGHT WAY, ' : '<b style="color:#ff8a6a">THE WRONG WAY</b> (TOWARD HIS SIDE FIRST), ') + rT.toFixed(1) + ' S AFTER THE CRY',
      'SHIFTED AT ' + (D.shift === undefined ? '<b style="color:#ff8a6a">NEVER</b>' : Math.round(sh) + '&deg; OFF (60&deg; IS RIGHT)') + ' &middot; STEADIED ' + (D.recErr === undefined ? '<b style="color:#ff8a6a">NOT ON THE RECIPROCAL</b>' : Math.round(rec) + '&deg; FROM THE RECIPROCAL'),
      'RECOVERED IN <b>' + fmtT(P.t) + '</b> &middot; ALONGSIDE AT ' + Math.round(P.d) + ' M, ' + P.kn.toFixed(1) + ' KN',
    ]);
  },
  box(D) {
    const dx = D.man.x - pos.x,
      dz = D.man.z - pos.z,
      d = Math.hypot(dx, dz),
      brg = raidBrg({ x: D.man.x, z: D.man.z }),
      dev = Math.round((angW(SHIP.hdg - D.h0) * -180) / Math.PI);
    const step =
      D.ph === 'turn'
        ? D.rudT === undefined
          ? 'RUDDER <b>FULL TOWARD HIS SIDE</b> (' + (D.side > 0 ? '<b>D</b> STARBOARD' : '<b>A</b> PORT') + '), NOW.'
          : 'SWINGING: <b>' + Math.abs(dev) + '&deg;</b> OFF. AT <b>60&deg;</b> PUT THE RUDDER FULL THE OTHER WAY.'
        : D.ph === 'shift'
          ? 'COME ROUND TO THE <b>RECIPROCAL</b> AND STEADY: ' + Math.abs(Math.round((angW(SHIP.hdg - (D.h0 + Math.PI)) * 180) / Math.PI)) + '&deg; TO GO.'
          : 'HE SHOULD BE FINE ON THE BOW. <b>SLOW</b> (W / S) AND STOP WITH HIM CLOSE ALONGSIDE: UNDER ' + (D.hc ? '1' : '1.5') + ' KN, WITHIN ' + (D.hc ? 20 : 30) + ' M.';
    return (
      '<b style="color:#ffd27a">MAN OVERBOARD, ' + (D.side > 0 ? 'STARBOARD' : 'PORT') + '</b> &middot; HE BEARS ' + brg + '&deg;, ' + Math.round(d) + ' M' +
      '<br>' + step
    );
  },
});
