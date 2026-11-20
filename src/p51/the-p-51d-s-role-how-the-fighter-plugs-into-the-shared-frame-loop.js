/* the P-51D's role: how the fighter plugs into the shared frame loop (the role contract is in the SIMS piece). It is registered first,
   right after SIMS: every hook only looks up the game's code when it is called, and the game resets itself while it loads */
SIMS.add({
  id: 'p51',
  name: 'P-51D Mustang',
  label: 'P-51 FS',
  fileTag: 'P51',
  word: 'Aircraft',
  orbitDist: 13.5,
  docsTab: 'about',
  canBail: true,
  bail: () => bailOut(),
  showSelf: (on) => (plane.visible = on),
  padMenu: true,
  touchUI: () => {
    $$('tGear').innerHTML = '<i>' + (gearOn ? '▼' : '▲') + '</i>GEAR ' + (gearOn ? 'DN' : 'UP');
    $$('tFlU').innerHTML = '<i>▲</i>FLAP ' + FL[flapLvl];
  },
  r3: () => setDiff((DIFFS.indexOf(DIFF) + 1) % 3) /* the enemy's skill, round the three */,
  canStep: () => !crashed && !BL.on,
  step: (h) => step(h),
  afterStep: (dt) => updBail(dt),
  pose: () => {
    plane.position.copy(pos);
    plane.quaternion.copy(q);
  },
  live: (dt) => {
    updWeapons(dt);
    updEnemies(dt);
    updChutists(dt);
    updService(dt);
    updTrainer(dt);
    updGuide(dt);
    updAA(dt);
  },
  /* the moving parts: gear, propeller, the tail settling on its wheels, controls, flaps, the cockpit */
  parts: (dt) => {
    gear.visible = gearOn;
    pa += dt * (8 + thr * 80);
    prop.rotation.z = pa;
    tiltV += ((onGround && !crashed ? GEAR.sit * (1 - Math.min(1, spd() / 42)) : 0) - tiltV) * Math.min(1, 4 * dt);
    model.rotation.x = tiltV;
    {
      /* the tail settles about the main wheels, so they stay on the ground */
      const ct = Math.cos(tiltV),
        st = Math.sin(tiltV),
        py = GEAR.mainBottom,
        pz = GEAR.mainZ;
      model.position.y = 0.17 + (py - (py * ct - pz * st));
      model.position.z = pz - (py * st + pz * ct);
    }
    ckStick.rotation.x = s.p * 0.35;
    ckStick.rotation.z = -s.r * 0.3;
    ckThr.rotation.x = 0.3 - thr * 0.9;
    /* control surfaces follow the smoothed inputs (so keys, pad, touch and every setting that scales them show up) */
    ailP.forEach((o) => {
      o[0].rotation.x = -o[1] * s.r * 0.45; /* right roll: right aileron up, left down */
      o[0].visible = !(DM.on && (o[1] < 0 ? DM.wl : DM.wr) > 0.6); /* a badly hit wing loses its aileron */
    });
    rudG.visible = !(DM.on && DM.tail > 0.8);
    elevG.rotation.x = -s.p * 0.5; /* pull back: trailing edge up */
    rudG.quaternion.setFromAxisAngle(RUD_AX, s.y * 0.45); /* right pedal: trailing edge to the right */
    {
      const tm = FM.use('trim') ? 1 : 0; /* the tabs only move in Hardcore mode */
      elevTabs.forEach((g) => (g.rotation.x = TRIM.e * TABK * tm)); /* nose-up trim: trailing edge down */
      rudTab.rotation.y = -TRIM.r * TABK * tm; /* right trim: the tab goes left */
      if (ailTab) ailTab.rotation.x = -TRIM.a * TABK * tm;
    }
    ckPed[1].position.z = -1.05 - s.y * 0.05; /* pushed pedal goes forward */
    ckPed[-1].position.z = -1.05 + s.y * 0.05;
    ckPedU[1].position.z = -1.3 - s.y * 0.05;
    ckPedU[-1].position.z = -1.3 + s.y * 0.05;
    if (ckLev.flap) ckLev.flap.rotation.x = 0.5 - (flapLvl / (ANG.length - 1)) * 1.0;
    if (ckLev.gear) ckLev.gear.rotation.x = gearOn ? 0.45 : -0.25;
    {
      const inCk = camMode == 1 || lb > 0.4;
      bladeGroups.forEach((g) => (g.visible = !inCk));
      plPilot.userData.head.visible = !inCk;
      if (plPilot.visible && !BL.on) pilotIK();
      ring.material.opacity = inCk ? 0.07 : 0.14;
      if ((camMode == 1 || lb > 0.05) && ++ckT % 3 == 0) drawPanel();
    }
    flapP.forEach((g) => (g.rotation.x = fl * 0.79));
  },
  /* the pilot's eye in the cockpit, turned by the head */
  eye: (P, D) => {
    P.set(0, 0.69, -0.43).applyEuler(model.rotation).add(model.position).applyQuaternion(q).add(pos);
    D.copy(fwd).applyAxisAngle(up, -viewYaw);
    D.applyAxisAngle(SC.rt.crossVectors(D, up).normalize(), viewPitch);
    return 65;
  },
  /* the chase camera rides behind and above the tail, rolling with the aircraft */
  chase: (dt, cp, cu, T) => {
    cp.lerp(SC.chase.set(0, 3.6 * chaseZ, 13 * chaseZ).applyQuaternion(q).add(pos), 1 - Math.exp(-7 * dt));
    cu.lerp(up, 1 - Math.exp(-3 * dt)).normalize();
    T.copy(fwd).multiplyScalar(18).add(pos);
  },
  replay: (dt) => {
    rpUpdate(dt);
    rpCam();
  },
  overCam: (dt) => {
    if (BL.on) bailCam(dt);
  },
  busy: () => BL.on,
  shake: () => (buffet > 0 && started && !paused && !crashed ? Math.min(1, buffet) * 0.3 : 0),
  hudEarly: (dt) => {
    updPlaneDetail(cam.position.distanceTo(plane.position));
    {
      /* the gun cross, 350 m ahead */
      const a = tmp.copy(fwd).multiplyScalar(350).add(pos).project(cam),
        cr = $$('cross');
      if (a.z < 1 && started && !crashed && !BL.on) {
        cr.style.display = 'block';
        cr.style.left = (a.x * 0.5 + 0.5) * innerWidth + 'px';
        cr.style.top = (1 - (a.y * 0.5 + 0.5)) * innerHeight + 'px';
      } else cr.style.display = 'none';
    }
    updBandit();
    drawGuide();
    updShadow();
    updLandingLight();
    updTrails(dt);
  },
  hud: (dt) => {
    updDamage(dt);
    updHUD();
  },
  hudLate: () => drawADF(),
  /* the start: on the runway's threshold, wings level, gear down */
  spawn: () => {
    pos.set(0, 2, 420);
    q.identity();
  },
  resetBegin: () => resetWeapons(),
  ready: () => {
    bailReset();
    gearOn = true;
    model.visible = true;
    cp.copy(pos).add(new V(0, 4, 14));
  },
  /* its trainers and the sim pilot's pre-flight of the mission's best path */
  resetEnd: () => {
    trainerReset();
    PP.ix = 0;
    if (started && !RPL.busy && !RPL.keep && PRE_MODES[trn.mode] && PP.key !== ppKey()) rpPrefly();
  },
  /* the world's guns lay on the aircraft; a round within 6.5 m of her strikes (held in the searchlights over 20 s: about twice as hard) */
  aimY: () => pos.y,
  hit: (a, b) => {
    if (a.distanceToSquared(pos) > 6400 || !segHit(a, b, pos, 6.5)) return false;
    playerHit(AA.litT > 20 ? 4 : 2, 0.4);
    return true;
  },
});
