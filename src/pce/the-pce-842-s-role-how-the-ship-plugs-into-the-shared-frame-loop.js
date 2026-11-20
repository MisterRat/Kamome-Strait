/* the PCE-842's role: how the ship plugs into the shared frame loop (the role contract is in the SIMS piece). It is registered first,
   right after SIMS: every hook only looks up the game's code when it is called, and the game resets itself while it loads */
SIMS.add({
  id: 'pce',
  name: 'PCE-842',
  label: 'PCE-842',
  fileTag: 'PCE842',
  word: 'Ship',
  afloat: true,
  struck: (p) => shipStruck(p),
  orbitDist: 85,
  docsTab: 'ctl',
  /* photo mode: the P-51 is never shown; the toggle shows or hides the ship */
  showSelf: (on) => {
    if (SHIPM.mesh) SHIPM.mesh.visible = on;
  },
  look: () => !!(GUN.cur && GUN.look) /* looking up from a gun's sight, the mouse turns the head */,
  canStep: () => !crashed,
  step: (h) => shipStep(h),
  /* the ship on the waves and her stations, guns and practice targets */
  pose: (dt) => {
    if (SHIPM.mesh && !PHOTO.on) SHIPM.mesh.visible = true;
    shipPose(dt);
    if (started && !paused) ptUpdate(dt);
    if (started && !paused) raidUpdate(dt);
    gunUpdate(dt);
    stnUpdate(dt);
  },
  /* Settings > Enable enemy: Shore runs the world's ground fire (the 25 mm guns and searchlights) at the ship, and the coast guns.
     The P-51's weapons, enemies, missions and guidance stay off until the PCE has her own */
  liveLate: (dt) => {
    if (AA.on) updAA(dt);
    coastUpdate(dt);
  },
  /* the station's eye (SHIP.EYE), turned by the station's own look and the head; at a gun, the gun's sight */
  eye: (P, D) => {
    P.copy(SHIP.EYE).applyQuaternion(q).add(pos);
    D.copy(fwd).applyAxisAngle(up, -viewYaw - SHIP.look[0]);
    const rt = SC.rt.crossVectors(D, up).normalize();
    D.applyAxisAngle(rt, viewPitch + SHIP.look[1]);
    let gfov = 65;
    if (GUN.cur) {
      gfov = gunCam(P, D, GUN.up);
      if (GUN.look) {
        D.applyAxisAngle(up, -viewYaw);
        D.applyAxisAngle(rt.crossVectors(D, up).normalize(), viewPitch);
      }
    }
    return gfov;
  },
  eyeUp: () => (GUN.cur && !GUN.look ? GUN.up : up),
  /* the chase camera: high astern on her heading, level (it does not roll with the sea) */
  chase: (dt, cp, cu, T) => {
    cp.lerp(SC.chase.set(0, 18 * chaseZ, 75 * chaseZ).applyAxisAngle(SHIP.YAX, SHIP.hdg).add(pos), 1 - Math.exp(-3 * dt));
    cu.set(0, 1, 0);
    T.copy(fwd).multiplyScalar(30).add(pos);
    T.y = pos.y + 6;
  },
  orbitLift: 5,
  /* the field of view: the shell camera, a gun's sight (the 3"/50's telescope narrows it), binoculars, an instrument leaned in to */
  view: (dt, gfov) => {
    const scam = scamCam(dt);
    if (!PHOTO.on && !ROAM.on) {
      const gun = camMode == 1 && GUN.cur && !orbitOn,
        st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub],
        f = scam ? 42 : gun ? gfov : camMode == 1 && STN.bino && !orbitOn ? 7.1 /* 7 x 50 binoculars */ : camMode == 1 && !orbitOn && st && st.fov ? st.fov : 65;
      if (cam.fov !== f) {
        cam.fov = f;
        cam.updateProjectionMatrix();
      }
    }
    gunOverlay();
    gunRings();
  },
  below: () => true /* a station may be below the waterline (the engine room) */,
  near: () => (GUN.cur && camMode == 1 ? 0.04 /* a gun's sight is close to the eye */ : 0.12),
  hudEarly: () => {
    $$('cross').style.display = 'none';
  },
  hud: () => shipHUD(),
  /* the engine room is sealed below the waterline: from in there the camera draws only the ship and the lights (layer 1). Nothing of
     the sea, the shore or the sky is drawn, so the sea surface, seen edge-on from just under it, cannot show through her walls as
     a line at the water level (it did on some GPUs, never in photo mode) */
  preRender: () => {
    const sealed = camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn && SHIP.stn === 2 && SHIPM.mesh;
    if (sealed) {
      SHIPM.mesh.traverse((o) => o.layers.enable(1));
      hemi.layers.enable(1);
      sun.layers.enable(1);
    }
    cam.layers.set(sealed ? 1 : 0);
  },
  /* the start: on her patrol line, heading along it (shipReset) */
  spawn: () => shipReset(),
  ready: () => {
    onGround = false;
    cp.copy(pos).add(new V(0, 18, 75).applyQuaternion(q));
  },
});
