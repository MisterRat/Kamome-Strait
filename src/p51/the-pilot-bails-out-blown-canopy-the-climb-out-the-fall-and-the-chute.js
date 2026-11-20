/* the pilot bails out: the canopy blown, the climb out, the fall and the chute (the P-51's own; floating chutists are shared) */
function bailOut() {
  if (!SIMS.cur.canBail) return; /* nobody bails out of a ship */
  if (!started || crashed || BL.on) return;
  if (onGround) {
    note('YOU ARE ON THE GROUND - NO NEED TO BAIL OUT');
    return;
  }
  clearEnemies(); /* the bandits break off */
  Object.assign(BL, {
    on: true,
    fin: false,
    gone: false,
    t: 0,
    tf: 0,
    ph: 0 /* 0 canopy blows, 1 climbing out, 2 free fall, 3 parachute */,
    open: 0,
    yaw: Math.atan2(fwd.x, -fwd.z),
    pitch: Math.asin(Math.max(-1, Math.min(1, fwd.y))),
    body: Math.atan2(fwd.x, -fwd.z),
    upK: 0,
    sway: 0,
    jolt: 0,
    head: new V().copy(pos),
    p: new V(),
    v: new V(),
    cm0: camMode,
    nochute: false,
    cdone: false,
  });
  camMode = 1;
  orbitOn = false;
  viewYaw = viewPitch = 0;
  thr = 0;
  note('BAILING OUT!');
}
function blowCanopy() {
  can.visible = false;
  canBars.forEach((b) => (b.visible = false));
  bailCanM = new THREE.Mesh(can.geometry, can.material);
  can.updateWorldMatrix(true, false);
  bailCanM.position.setFromMatrixPosition(can.matrixWorld);
  can.getWorldQuaternion(bailCanM.quaternion);
  bailCanM.scale.copy(can.scale);
  BL.canV = vel.clone().addScaledVector(up, 11).addScaledVector(fwd, -14);
  BL.canW = new V((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6);
  scene.add(bailCanM);
  SND.burst(2600, 320, 0.4, 0.55, 1, 'bandpass');
  SND.burst(900, 100, 0.8, 0.4, 0.8, 'lowpass', 0.05);
  BL.jolt = 1;
}
function bailEnd(msg) {
  BL.fin = true;
  BL.ph = 4;
  crashed = true;
  BL.v.set(0, 0, 0);
  bailCh.visible = false;
  const m = $$('msg');
  m.innerHTML =
    msg +
    '<br><small style="font-size:14px;color:#fff">' +
    (MOB
      ? 'Tap here to restart'
      : 'Drag the mouse to look around. Press Enter, or A / Start on the controller, to restart') +
    '</small>';
  m.style.display = 'block';
}
function bailReset() {
  if (BL.on) camMode = BL.cm0;
  BL.on = false;
  BL.fin = false;
  can.visible = true;
  canBars.forEach((b) => (b.visible = true));
  plPilot.visible = true;
  if (bailCanM) {
    scene.remove(bailCanM);
    bailCanM = null;
  }
  bailPil.visible = false;
  bailCh.visible = false;
  CH.forEach((c) => scene.remove(c.g));
  CH.length = 0;
}
function updBail(dt) {
  if (!BL.on || paused) return;
  BL.t += dt;
  const qUp = BLV.set(0, 1, 0).applyQuaternion(q);
  /* the abandoned aircraft flies on, nose dropping, until it hits the ground */
  if (!BL.gone) {
    vel.y -= 9.81 * dt;
    vel.multiplyScalar(1 - 0.03 * dt);
    pos.addScaledVector(vel, dt);
    q.multiply(SC.qa.setFromAxisAngle(SC.xax, -0.22 * dt)).multiply(SC.qa.setFromAxisAngle(SC.zax, 0.5 * dt));
    q.normalize();
    if (pos.y < H(pos.x, pos.z) + 2) {
      explode(pos.clone(), 26);
      model.visible = false;
      BL.gone = true;
    }
  }
  if (BL.t > 0.12 && !bailCanM && !BL.cdone) {
    BL.cdone = true;
    blowCanopy();
  }
  if (bailCanM) {
    BL.canV.y -= 9.81 * dt;
    bailCanM.position.addScaledVector(BL.canV, dt);
    bailCanM.rotation.x += BL.canW.x * dt;
    bailCanM.rotation.y += BL.canW.y * dt;
    bailCanM.rotation.z += BL.canW.z * dt;
    if (bailCanM.position.y < H(bailCanM.position.x, bailCanM.position.z) || BL.t > 8) {
      scene.remove(bailCanM);
      bailCanM = null;
    }
  }
  BL.jolt = Math.max(0, BL.jolt - dt * 1.6);
  if (BL.ph < 2) {
    const r = Math.max(0, Math.min(1, (BL.t - 0.9) / 1.1)),
      e = r * r * (3 - 2 * r);
    BL.ph = BL.t < 0.9 ? 0 : 1;
    BL.head
      .set(0, 1.17 + 1.2 * e, -0.55 + 0.5 * e)
      .applyQuaternion(q)
      .add(pos);
    if (BL.t >= 2.0) {
      /* out of the seat: into the slipstream */
      BL.ph = 2;
      BL.tf = 0;
      BL.p.copy(BL.head);
      BL.nochute = BL.p.y - H(BL.p.x, BL.p.z) < 100; /* too low: the parachute cannot open in time */
      BL.v.copy(vel).addScaledVector(qUp, 4);
      plPilot.visible = false;
      bailPil.visible = true;
      poseSit(bailPil);
      bailPil.rotation.set(0, -BL.body, 0);
    }
  } else if (BL.ph === 2 || BL.ph === 3) {
    BL.tf += dt;
    const gh = H(BL.p.x, BL.p.z),
      agl = BL.p.y - gh;
    if (BL.ph === 2) {
      const sp = BL.v.length();
      BL.v.y -= 9.81 * dt;
      BL.v.addScaledVector(BL.v, -0.0032 * sp * dt);
      bailPil.rotation.x = Math.min(0.9, BL.tf * 0.6);
      if (!BL.nochute && (BL.tf >= 1.8 || (agl < 300 && BL.tf >= 0.6))) {
        /* ripcord */
        BL.ph = 3;
        BL.open = 0;
        bailCh.visible = true;
        bailCh.scale.setScalar(0.06);
        poseHang(bailPil);
        bailPil.rotation.set(0, -BL.body, 0);
        BL.jolt = 1;
        SND.burst(1000, 120, 0.6, 0.45, 0.8, 'lowpass');
        note('PARACHUTE!');
      }
    } else {
      BL.open = Math.min(1, BL.open + dt / 1.3);
      chuteDrift(BLW, BL.t);
      const k = Math.min(1, 2.4 * BL.open * dt);
      BL.v.x += (BLW.x - BL.v.x) * k;
      BL.v.z += (BLW.z - BL.v.z) * k;
      BL.v.y += (-5.5 - BL.v.y) * k;
      bailCh.scale.setScalar(0.06 + 0.94 * BL.open * BL.open * (3 - 2 * BL.open));
      BL.sway = Math.sin(BL.t * 0.9) * 0.07 * BL.open;
      bailPil.rotation.z = BL.sway;
    }
    BL.p.addScaledVector(BL.v, dt);
    BL.head.copy(BL.p);
    bailPil.position.set(BL.p.x, BL.p.y - 0.66, BL.p.z);
    if (BL.p.y - 1.76 <= H(BL.p.x, BL.p.z)) {
      const vy = BL.v.y,
        sea = HR(BL.p.x, BL.p.z) < -7;
      BL.p.y = H(BL.p.x, BL.p.z) + 1.76;
      bailPil.position.set(BL.p.x, BL.p.y - 0.66, BL.p.z);
      BL.head.copy(BL.p);
      if (BL.ph === 2 || vy < -14) bailEnd('TOO LOW - THE PARACHUTE HAD NO TIME TO OPEN');
      else bailEnd(sea ? 'SPLASHDOWN - PILOT PICKED UP FROM THE SEA' : 'LANDED SAFELY - PILOT RECOVERED');
    }
  }
}
