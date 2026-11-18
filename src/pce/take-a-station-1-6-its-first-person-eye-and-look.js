/* take a station (1-6): its first-person eye and look; pressing the same key again steps to the station's next view */
function shipStation(n) {
  const list = PCEM.STN[n];
  if (!list) return;
  if (n === 6 && FM.use('walk') && camMode == 1 && SHIP.stn === 6) return note('HARDCORE: WALK THE DECK - W A S D, SHIFT RUNS');
  SHIP.sub = camMode == 1 && SHIP.stn === n ? (SHIP.sub + 1) % list.length : n === 6 ? list.length - 1 /* the torpedoman starts at the racks */ : 0;
  SHIP.stn = n;
  const st = list[SHIP.sub];
  SHIP.EYE.set(st.e[2], st.e[1], -st.e[0]); /* model (bow +x, starboard +z) to the player's frame (bow -z, starboard +x) */
  SHIP.look[0] = st.yaw;
  SHIP.look[1] = st.pitch;
  viewYaw = viewPitch = 0;
  camMode = 1;
  SHIP.hold = SHIP.hdg; /* away from the bridge the helmsman steadies her on this heading */
  STN.bino = false;
  if (n === 6) TPW.p.set(st.e[0], st.e[2]), (TPW.at = SHIP.sub), tpFill(SHIP.sub);
  gunStation();
  note(st.name);
}
function shipReset() {
  const P = SHIPM.pts;
  if (P) {
    pos.set(P[0][0], SHIPM.Y, P[0][1]);
    SHIP.hdg = Math.atan2(-(P[1][0] - P[0][0]), -(P[1][1] - P[0][1])); /* start on the PCE's own patrol line, heading along it */
  } else {
    pos.set(0, SHIPM.Y, -3000);
    SHIP.hdg = 0;
  }
  SHIP.u = SHIP.r = SHIP.tel = SHIP.rud = 0;
  if (typeof RAID === 'object' && RAID) (raidClear(), (RAID.next = 90), (RAID.hits = RAID.kills = 0)) /* var RAID: shipReset runs before THE AIR RAIDS block loads */;
  ENG.ans = 0;
  DC.rack = [8, 8];
  DC.kg = [2, 2];
  DC.kl = [1, 1, 1, 1];
  SHIP.dmgK = 1;
  SHIP.aground = false;
  {
    const st = PCEM.STN[SHIP.stn][SHIP.sub];
    SHIP.EYE.set(st.e[2], st.e[1], -st.e[0]);
    SHIP.look[0] = st.yaw;
    SHIP.look[1] = st.pitch;
  }
  if (SHIPM.hull) OCEAN.clearTrail(SHIPM.hull);
  SHIPW.hv = SHIPW.pi = SHIPW.ro = SHIPW.vr = 0;
  q.setFromAxisAngle(SHIP.YAX, SHIP.hdg);
}
function shipStep(dt) {
  SHIP.t += dt;
  /* W / S ring the engines and A / D put the rudder over from every station. Let go of the rudder away from the bridge (a gun, the
     engine room, comms, the fantail) and the helmsman steadies her on the heading she has then */
  const tp6 = SHIP.stn === 6 && (camMode == 1 || ASW.ph !== 'idle') /* the torpedoman cannot conn her: the OOD does */,
    engOK = !tp6 && (!FM.use('eng') || (camMode == 1 && (SHIP.stn === 2 || SHIP.stn === 4))) /* Hardcore: only the engine room and the pilothouse work the engines */,
    ord = engOK ? kb('thrUp') - kb('thrDn') + pad.thr : 0,
    hand = tp6 ? 0 : kb('rollR') - kb('rollL') + pad.y + TC.oR + TC.oY + (GUN.cur && camMode == 1 ? 0 : pad.r),
    atGun = (!atHelm() || ASW.ph !== 'idle') && !hand;
  if (ASW.ph !== 'idle') {
    /* the OOD cons the ship through the attack run */
    SHIP.tel = ASW.tel;
    SHIP.hold = ASW.hold;
  }
  if (hand && !atHelm()) SHIP.hold = SHIP.hdg;
  SHIP.tel = Math.min(1, Math.max(-0.5, SHIP.tel + ord * 0.4 * dt));
  if (!ord && Math.abs(SHIP.tel) < 0.02) SHIP.tel = 0;
  thr = Math.abs(ENG.ans); /* the engine sound follows the engines */
  const want = atGun
    ? Math.max(-1, Math.min(1, -3 * angW(SHIP.hold - SHIP.hdg) + 20 * SHIP.r))
    : Math.max(-1, Math.min(1, hand));
  SHIP.rud += Math.max(-0.5 * dt, Math.min(0.5 * dt, want - SHIP.rud)); /* the rudder swings at a steady rate */
  engStep(dt); /* the engine room answers the telegraph */
  const ea = ENG.ans /* the engines run at what the engine room answered */,
    tgt = (ea >= 0 ? ea * SHIP.VMAX : (ea / 0.5) * SHIP.VAST) * (SHIP.dmgK || 1) /* a shallow charge under her stern (Hardcore) cuts her speed */;
  SHIP.u += ((tgt - SHIP.u) * dt) / SHIP.TAU;
  SHIP.r += ((-SHIP.rud * SHIP.u) / SHIP.RMIN - SHIP.r) * Math.min(1, dt / 5); /* she answers the rudder with a few seconds' lag */
  SHIP.hdg += SHIP.r * dt;
  const fx = -Math.sin(SHIP.hdg),
    fz = -Math.cos(SHIP.hdg),
    d = SHIP.u * dt,
    end = Math.sign(SHIP.u) * 28; /* the end of the ship that leads */
  /* aground: the leading end would be in water shallower than her draft */
  const nx = pos.x + fx * (d + end),
    nz = pos.z + fz * (d + end),
    shoal = Math.abs(SHIP.u) > 0.01 && HR(nx, nz) > SHIPM.Y - 3.0; /* HR: the real seabed (H stops at the water) */
  if (shoal) {
    if (!SHIP.aground) note('AGROUND - BACK HER OFF');
    SHIP.aground = true;
    SHIP.u = 0;
    SHIP.r = 0;
  } else {
    if (Math.abs(SHIP.u) > 0.3) SHIP.aground = false;
    pos.x += fx * d;
    pos.z += fz * d;
  }
  vel.set(fx * SHIP.u, 0, fz * SHIP.u);
}
