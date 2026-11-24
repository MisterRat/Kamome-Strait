/* take a station (1-5: OOD, Engineering, Communications, Gunner, Torpedoman): its first-person eye and look; pressing the same key again steps to the station's next view */
function shipStation(n) {
  const list = PCEM.STN[n];
  if (!list) return;
  if (n === 5 && FM.use('walk') && camMode == 1 && SHIP.stn === 5) return note('HARDCORE: WALK THE DECK - W A S D, SHIFT RUNS');
  SHIP.sub = camMode == 1 && SHIP.stn === n ? (SHIP.sub + 1) % list.length : n === 5 ? list.length - 1 /* the torpedoman starts at the racks */ : 0;
  SHIP.stn = n;
  const st = list[SHIP.sub];
  SHIP.EYE.set(st.e[2], st.e[1], -st.e[0]); /* model (bow +x, starboard +z) to the player's frame (bow -z, starboard +x) */
  SHIP.look[0] = st.yaw;
  SHIP.look[1] = st.pitch;
  viewYaw = viewPitch = 0;
  camMode = 1;
  SHIP.hold = SHIP.hdg; /* away from the bridge the helmsman steadies her on this heading */
  STN.bino = false;
  if (n === 5) TPW.p.set(st.e[0], st.e[2]), (TPW.at = SHIP.sub), tpFill(SHIP.sub);
  gunStation();
  note(st.name);
}
/* WHERE SHE STARTS (the user's, 2026-11-22: out of reach of every enemy base and ship): the open deep water nearest her patrol line that
   lies beyond each enemy gun's reach (ROE.reach: the coast batteries' 14 km, an armed post's or ship's longest gun, the T-14s' 4 km)
   and 3 km more.
   Heading away from the nearest of them. The far sites, if still being built after the page loaded, are finished first */
function pceStart(x0, z0) {
  if (SITE.farLeft && SITE.farLeft()) SITE.farAll();
  const W = ROE.reach().map(([x, z, r]) => [x, z, r + 3000]) /* every enemy gun's reach and 3 km more */;
  const clear = (x, z) => W.every(([wx, wz, r]) => Math.hypot(x - wx, z - wz) >= r),
    deep = (x, z) => {
      for (const [dx, dz] of [[0, 0], [400, 0], [-400, 0], [0, 400], [0, -400]]) if (HR(x + dx, z + dz) > coastSea() - 12) return false;
      return Math.max(Math.abs(x), Math.abs(z)) < 45000;
    };
  let at = null;
  if (clear(x0, z0) && deep(x0, z0)) at = [x0, z0];
  for (let r = 500; !at && r <= 40000; r += 500)
    for (let a = 0; a < 360; a += Math.max(2, 360 / ((2 * Math.PI * r) / 500))) {
      const x = x0 + Math.sin((a * Math.PI) / 180) * r,
        z = z0 + Math.cos((a * Math.PI) / 180) * r;
      if (clear(x, z) && deep(x, z)) {
        at = [x, z];
        break;
      }
    }
  if (!at) return null;
  /* away from the nearest threat */
  let n = null,
    nd = 1e12;
  for (const w of W) {
    const d = Math.hypot(at[0] - w[0], at[1] - w[1]) - w[2];
    if (d < nd) ((nd = d), (n = w));
  }
  let hdg = n ? Math.atan2(-(at[0] - n[0]), -(at[1] - n[1])) : null;
  /* she faces away from the nearest port or base within 10 km (the user's, 2026-11-23: she started heading toward PT Base Halsey),
     turned as little as needs be to have 3 km of deep water ahead */
  let pt = null,
    pd = 10000;
  for (const F of [...FS.list.filter((q) => q.kind === 'port'), ...(FS.nav || [])]) {
    const d = Math.hypot(F.O.x - at[0], F.O.z - at[1]);
    if (d < pd) ((pd = d), (pt = F.O));
  }
  if (pt) {
    const h0 = Math.atan2(-(pt.x - at[0]), -(pt.z - at[1])) + Math.PI,
      open = (h) => {
        for (let k = 1; k <= 12; k++) {
          const x = at[0] - Math.sin(h) * 250 * k,
            z = at[1] - Math.cos(h) * 250 * k;
          if (HR(x, z) > coastSea() - 12) return false;
        }
        return true;
      };
    hdg = h0;
    for (let k = 0; k <= 18; k++) {
      if (open(h0 + k * 0.0873)) {
        hdg = h0 + k * 0.0873;
        break;
      }
      if (open(h0 - k * 0.0873)) {
        hdg = h0 - k * 0.0873;
        break;
      }
    }
  }
  return { x: at[0], z: at[1], hdg };
}
function shipReset() {
  const P = SHIPM.pts;
  if (P) {
    pos.set(P[0][0], SHIPM.Y, P[0][1]);
    SHIP.hdg = Math.atan2(-(P[1][0] - P[0][0]), -(P[1][1] - P[0][1])); /* her own patrol line, heading along it */
    const S = pceStart(P[0][0], P[0][1]);
    if (S) {
      pos.set(S.x, SHIPM.Y, S.z);
      if (S.hdg !== null) SHIP.hdg = S.hdg;
    }
    SHIP.hold = SHIP.hdg; /* the helmsman holds the heading she starts on */
  } else {
    pos.set(0, SHIPM.Y, -3000);
    SHIP.hdg = 0;
  }
  SHIP.u = SHIP.r = SHIP.tel = SHIP.rud = 0;
  RTB.on = false; /* not returning to base */
  sdmReset(); /* her battle damage mended */
  if (typeof SMK === 'object' && SMK) engReset(); /* fuel, power, the strainer, the smoke (var SMK: before THE ENGINE ROOM ON PATROL loads) */
  if (typeof OODO === 'object' && OODO) ordReset(); /* the OOD's standing orders */
  if (SITE.civRestart) SITE.civRestart(); /* the Liberty back at anchor off PT Base Halsey */
  if (typeof RAID === 'object' && RAID) (raidClear(), (RAID.next = 90), (RAID.hits = RAID.kills = 0)) /* var RAID: shipReset runs before THE AIR RAIDS block loads */;
  ENG.ans = 0;
  DC.rack = [8, 8];
  DC.kg = [2, 2];
  DC.kl = [1, 1, 1, 1];
  SHIP.dmgK = 1;
  Object.assign(MAG, MAG0); /* her magazines full */
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
  const tp6 = SHIP.stn === 5 && (camMode == 1 || ASW.ph !== 'idle') /* the torpedoman cannot conn her: the OOD does */,
    engOK = !tp6 && (!FM.use('eng') || (camMode == 1 && (SHIP.stn === 2 || SHIP.stn === 1))) /* Hardcore: only the engine room and the pilothouse (the OOD) work the engines */,
    ord = engOK ? kb('thrUp') - kb('thrDn') + pad.thr : 0,
    hand = tp6 ? 0 : kb('rollR') - kb('rollL') + pad.y + TC.oY + (pceStickSteers() ? pad.r + TC.oR : 0) /* the stick lays a gun or trains Comms there */,
    rtb = rtbStep(dt, ord, hand) /* returning to base: the helmsman has her */;
  /* the player's route (WAYPOINT NAVIGATION): the helmsman steers for the waypoint; the player's own hand on the rudder takes her back */
  let navP = !rtb && ASW.ph === 'idle' ? NAV.aim() : null;
  if (navP && hand) (NAV.off('ROUTE DISENGAGED: THE OOD HAS THE HELM. ENTER AT THE CHART TABLE RE-ENGAGES IT.'), (navP = null));
  if (navP) SHIP.hold = Math.atan2(-(navP.x - pos.x), -(navP.z - pos.z));
  const atGun = ((!atHelm() || ASW.ph !== 'idle') && !hand) || rtb || !!navP;
  if (ASW.ph !== 'idle') {
    /* the OOD cons the ship through the attack run */
    SHIP.tel = ASW.tel;
    SHIP.hold = ASW.hold;
  }
  if (rtb) {
    SHIP.tel = RTB.tel;
    SHIP.hold = RTB.hold;
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
