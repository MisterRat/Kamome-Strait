/* the photo mode panel */
$$('pmPhoto').onclick = () => photoEnter();
$$('phShot').onclick = () => (PHOTO.shot = true);
$$('phExit').onclick = () => photoExit();
$$('phHud').onclick = () => {
  PHOTO.hud = !PHOTO.hud;
  photoSave();
  photoSync();
};
$$('phAc').onclick = () => {
  PHOTO.showPlane = !PHOTO.showPlane;
  photoSave();
  photoSync();
};
$$('phFz').onclick = () => {
  PHOTO.freeze = !PHOTO.freeze;
  paused = PHOTO.freeze;
  photoSync();
};
$$('phFov').oninput = (e) => photoFov(+e.target.value);
$$('phTime').onchange = (e) => {
  WX.time = e.target.value;
  WX.hour = WX.time === 'local' ? WX.localHour() : WX_HOUR[WX.time];
  WX.apply();
  photoSync();
};
$$('phHour').oninput = (e) => {
  WX.hour = +e.target.value;
  WX.paint();
  $$('phHourV').textContent = WX.clock();
};
$$('phWx').onchange = (e) => {
  WX.wx = e.target.value;
  WX.apply();
};
$$('phRes').onchange = (e) => {
  PHOTO.res = +e.target.value;
  photoSave();
};
$$('phQ').onchange = (e) => {
  PHOTO.q = +e.target.value;
  photoSave();
};
$$('phSpd').onchange = (e) => (PHOTO.spd = +e.target.value);
$$('phStamp').onchange = (e) => {
  PHOTO.stamp = e.target.checked;
  photoSave();
};
$$('phGrid').onchange = (e) => {
  PHOTO.grid = e.target.checked;
  photoSave();
  photoSync();
};
$$('ph')
  .querySelectorAll('button[data-s]')
  .forEach((b) => (b.onclick = () => photoSpot(b.dataset.s)));
$$('ph').addEventListener('change', () => {
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
});
$$('ph').addEventListener('pointerup', () => {
  if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
});
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  adaptRes(now - last);
  last = now;
  pollPad();
  touchUpdate();
  if ((orbDrag || (GUN.cur && GUN.look)) && camMode == 1 && !pad.lx && !pad.ly) {
    /* mouse is looking */
  } else if (pad.lx || pad.ly) {
    viewYaw += pad.lx * 3.2 * dt;
    viewPitch = Math.max(-1.2, Math.min(1.2, viewPitch - pad.ly * 1.8 * dt));
  } else {
    viewYaw += (((-viewYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, 6 * dt);
    viewPitch += (0 - viewPitch) * Math.min(1, 6 * dt);
  }
  viewYaw = ((((viewYaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  /* the frame's time is split into equal sub-steps of at most 1/120 s: physics stays accurate at any frame rate
     and the plane still moves exactly as far as the real time that passed, so there is no stutter */
  if (started && !paused && !crashed && !BL.on && !RPL.on) {
    const n = Math.max(1, Math.ceil(dt / PH_DT - 1e-6));
    for (let i = 0; i < n && !crashed; i++) shipStep(dt / n);
  }
  axes();
  plane.position.copy(pos);
  plane.quaternion.copy(q);
  plane.visible = false;
  if (SHIPM.mesh && !PHOTO.on) SHIPM.mesh.visible = true;
  shipPose(dt);
  if (started && !paused) ptUpdate(dt);
  if (started && !paused) raidUpdate(dt);
  gunUpdate(dt);
  stnUpdate(dt);
  if (started && !paused && !RPL.on) {
    /* the P-51's weapons, enemies, missions, guidance and ground fire stay switched off until the PCE has her own */
    updConvoy(dt);
    AF.update(dt);
    _afT += dt * 6;
    AFLD.update(dt);
    if (SITE.pat) SITE.pat(dt);
    /* Settings > Enable enemy: Shore runs the P-51 world's ground fire (the 25 mm guns and searchlights) at the ship, and the coast guns */
    if (AA.on) updAA(dt);
    coastUpdate(dt);
  } else if (RPL.on) {
    AA.hide();
    AF.hide();
  }
  gear.visible = gearOn;
  pa += dt * (8 + thr * 80);
  prop.rotation.z = pa;
  tiltV += ((onGround && !crashed ? GEAR.sit * (1 - Math.min(1, spd() / 42)) : 0) - tiltV) * Math.min(1, 4 * dt);
  model.rotation.x = tiltV;
  { /* the tail settles about the main wheels, so they stay on the ground */
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
  const lookOn = !!(pad.lx || pad.ly) || Math.abs(viewYaw) > 0.03 || Math.abs(viewPitch) > 0.03;
  lb += ((camMode == 1 || lookOn ? 1 : 0) - lb) * Math.min(1, 10 * dt);
  const cockPos = SC.cockPos.copy(SHIP.EYE).applyQuaternion(q).add(pos) /* the open flying bridge */,
    dv = tmp.copy(fwd).applyAxisAngle(up, -viewYaw - SHIP.look[0]),
    rt = SC.rt.crossVectors(dv, up).normalize();
  dv.applyAxisAngle(rt, viewPitch + SHIP.look[1]);
  let gfov = 65;
  if (GUN.cur) {
    /* at a gun: the eye and the line of sight come from the gun; looking up from the sight, the mouse turns the head */
    gfov = gunCam(cockPos, dv, GUN.up);
    if (GUN.look) {
      dv.applyAxisAngle(up, -viewYaw);
      dv.applyAxisAngle(rt.crossVectors(dv, up).normalize(), viewPitch);
    }
  }
  const cockT = SC.cockT.copy(dv).multiplyScalar(50).add(cockPos);
  if (camMode == 1) {
    cam.position.copy(cockPos);
    cam.up.copy(GUN.cur && !GUN.look ? GUN.up : up);
    cam.lookAt(cockT);
    cp.copy(cockPos);
  } else {
    cp.lerp(
      SC.chase
        .set(0, 18 * chaseZ, 75 * chaseZ)
        .applyAxisAngle(SHIP.YAX, SHIP.hdg)
        .add(pos),
      1 - Math.exp(-3 * dt),
    );
    cu.set(0, 1, 0); /* the chase camera stays level: it does not roll with the sea */
    const chaseT = SC.chaseT.copy(fwd).multiplyScalar(30).add(pos);
    chaseT.y = pos.y + 6;
    if (lb < 0.01) {
      cam.position.copy(cp);
      cam.up.copy(cu);
      cam.lookAt(chaseT);
    } else {
      cam.position.lerpVectors(cp, cockPos, lb);
      cam.up.lerpVectors(cu, up, lb).normalize();
      cam.lookAt(SC.aim.lerpVectors(chaseT, cockT, lb));
    }
  }
  if (orbitOn) {
    const ce = Math.cos(orbEl);
    cam.position
      .copy(pos)
      .add(
        SC.orb
          .set(orbDist * Math.sin(orbYaw) * ce, orbDist * Math.sin(orbEl), orbDist * Math.cos(orbYaw) * ce)
          .applyQuaternion(q),
      );
    cam.up.set(0, 1, 0);
    cam.lookAt(SC.aim.copy(pos).setY(pos.y + 5));
  }
  const scam = scamCam(dt);
  if (!PHOTO.on && !ROAM.on) {
    /* the gun's sight: the 3"/50's telescope narrows the view */
    const gun = camMode == 1 && GUN.cur && !orbitOn,
      st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub],
      f = scam ? 42 : gun ? gfov : camMode == 1 && STN.bino && !orbitOn ? 7.1 /* 7 x 50 binoculars */ : camMode == 1 && !orbitOn && st && st.fov ? st.fov /* leaning in to an instrument */ : 65;
    if (cam.fov !== f) {
      cam.fov = f;
      cam.updateProjectionMatrix();
    }
  }
  gunOverlay();
  gunRings();
  if (RPL.on) {
    rpUpdate(dt);
    rpCam();
  }
  if (BL.on) bailCam(dt);
  if (PHOTO.on) photoCam(dt);
  else if (ROAM.on) {
    if (BL.on || RPL.on) roamExit(true);
    else {
      roamCam();
      highView();
    }
  }
  {
    const gh = H(cam.position.x, cam.position.z) + (PHOTO.on || ROAM.on ? 0.3 : 1);
    if (cam.position.y < gh && !(camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn)) cam.position.y = gh; /* a station may be below the waterline (the engine room) */
  }
  sun.target.position.copy(pos);

  sky.position.copy(cam.position);
  terrU.uTime.value = now / 1000;
  OCEAN.U.uTime.value = now / 1000;
  {
    const nn = PHOTO.on || ROAM.on ? Math.max(0.3, Math.max(0, PHOTO.pos.y) * 0.004) : !orbitOn && (camMode == 1 || lb > 0.3) ? (GUN.cur && camMode == 1 ? 0.04 /* a gun's sight is close to the eye */ : 0.12) : 1;
    if (cam.near !== nn) {
      cam.near = nn;
      cam.updateProjectionMatrix();
    }
  }
  if (buffet > 0 && started && !paused && !crashed) {
    const b2 = Math.min(1, buffet) * 0.3;
    cam.position.x += (Math.random() - 0.5) * b2;
    cam.position.y += (Math.random() - 0.5) * b2;
    cam.position.z += (Math.random() - 0.5) * b2;
  }
  cam.updateMatrixWorld();
  updNearTrees(cam.position.x, cam.position.y, cam.position.z);
  updGrass(cam.position.x, cam.position.y, cam.position.z);
  updPlaneDetail(cam.position.distanceTo(plane.position));
  {
    const a = tmp.copy(fwd).multiplyScalar(350).add(pos).project(cam),
      cr = $$('cross');
    if (a.z < 1 && started && !crashed && !BL.on) {
      cr.style.display = 'block';
      cr.style.left = (a.x * 0.5 + 0.5) * innerWidth + 'px';
      cr.style.top = (1 - (a.y * 0.5 + 0.5)) * innerHeight + 'px';
    } else cr.style.display = 'none';
  }
  $$('cross').style.display = 'none';
  SHD.m.visible = false;
  driftClouds(dt);
  WORLD.update(dt);
  updWX(dt);
  shipHUD();
  drawMinimap();
  audioUpd();
  /* the engine room is sealed below the waterline: from in there the camera draws only the ship and the lights (layer 1). Nothing of
     the sea, the shore or the sky is drawn, so the sea surface, seen edge-on from just under it, cannot show through her walls as
     a line at the water level (it did on some GPUs, never in photo mode) */
  {
    const sealed = camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn && SHIP.stn === 2 && SHIPM.mesh;
    if (sealed) {
      SHIPM.mesh.traverse((o) => o.layers.enable(1));
      hemi.layers.enable(1);
      sun.layers.enable(1);
    }
    cam.layers.set(sealed ? 1 : 0);
  }
  R.render(scene, cam);
  if (PHOTO.shot) photoCapture();
}
requestAnimationFrame(frame);
