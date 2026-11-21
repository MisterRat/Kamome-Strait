/* air support for the PCE-842 (the P-51s are the shared display form, P51DISP, so every page that has her has it). She has no standing air cover. When
   the radar picks up enemy planes (a live raider inside DETECT), Comms reports them to the bridge; the OOD decides whether he wants
   air support. The OOD is the AI's for now (the player's OOD is on hold, like the other stations nobody mans): he asks for it. Comms radios Kamome Control, which scrambles two P-51s from Fletcher Field (the P-51's
   display form, P51DISP): they take off a minute later, fly out, go after the raiders and can shoot them down (their kills, not the
   ship's: RAID.kills is hers), and once the sky has been clear for a while they report and fly home. The fighters show on the minimap in blue. */
const CAP = (() => {
  const DETECT = 18000 /* the radar's reach for low aircraft, m */,
    FIELD = new THREE.Vector3(0, 0, 420) /* Fletcher Field, where they take off and land */,
    SCRAMBLE = 60 /* s from the call to wheels up */,
    R = 1800,
    ALT = 700,
    V_CAP = 125,
    V_ATK = 165,
    V_GO = 160 /* m/s */,
    TURN = 0.45 /* rad/s */,
    CLEAR = 45 /* s with no raider before they go home */,
    L = [];
  const S = { st: 'none' /* none, called, out, home */, t: 0, raid: false, clear: 0 };
  const up = new THREE.Vector3(0, 1, 0),
    w = new THREE.Vector3(),
    M = new THREE.Matrix4(),
    tgt = new THREE.Vector3();
  const brg = (p) => String(Math.round(((((Math.atan2(p.x - pos.x, -(p.z - pos.z)) * 180) / Math.PI) % 360) + 360) % 360) % 360).padStart(3, '0');
  const live = () => (typeof RAID !== 'undefined' ? RAID.L.filter((e) => e.st !== 'down') : []);
  /* the OOD's decision (the AI's for now: he asks for it) */
  const decide = () => {
    S.st = 'called';
    S.t = 0;
    S.who = 'PCE 842';
    RADIO.add('BRIDGE', 'COMMS, BRIDGE: REQUEST AIR SUPPORT FROM KAMOME CONTROL.', { own: true });
    note('OOD: REQUEST AIR SUPPORT');
  };
  const spawn = () => {
    for (let k = 0; k < 2; k++) {
      const D = P51DISP.make({ gear: false }),
        f = {
          g: D.g,
          prop: D.prop,
          a: Math.random() * 6.28,
          p: FIELD.clone().add(new THREE.Vector3(k * 30, 300, k * 30)),
          v: tgt.copy(pos).sub(FIELD).setY(0).normalize().multiplyScalar(V_GO).clone(),
          bank: 0,
          tgt: null,
          aim: 0,
          hp: 1 /* RULES OF ENGAGEMENT: home alone at half, down at none */,
          ammo: 8 /* attacks (bursts) before he is out of ammunition */,
          home: false,
          down: false,
          rt: Math.random(),
        };
      scene.add(f.g);
      L.push(f);
    }
  };
  /* turn the velocity toward dir at most TURN rad/s, toward speed sp; the bank follows the turn */
  const steer = (f, dir, sp, dt) => {
    const v0 = f.v.clone().normalize(),
      ang = Math.acos(Math.max(-1, Math.min(1, v0.dot(dir)))),
      k = ang > 1e-4 ? Math.min(1, (TURN * dt) / ang) : 1,
      v1 = v0.clone().lerp(dir, k).normalize(),
      side = Math.sign(v0.x * v1.z - v0.z * v1.x),
      rate = ang > 1e-4 ? Math.min(ang, TURN * dt) / dt : 0,
      s0 = f.v.length();
    f.bank += (Math.atan((sp * rate) / 9.81) * side - f.bank) * Math.min(1, dt * 2);
    f.v.copy(v1).multiplyScalar(s0 + (sp - s0) * Math.min(1, dt * 0.5));
  };
  const pose = (f) => {
    f.g.position.copy(f.p);
    const d = w.copy(f.v).normalize();
    M.lookAt(f.p, tgt.copy(f.p).add(d), up.clone().applyAxisAngle(d, -f.bank));
    f.g.quaternion.setFromRotationMatrix(M);
  };
  const fly = (f, dt, R0) => {
    if (f.down) {
      /* shot down: he falls into the sea */
      f.v.y -= 9.8 * dt;
      f.p.addScaledVector(f.v, dt);
      f.bank += dt * 2;
      pose(f);
      if (f.p.y < SEA.Y) {
        if (typeof fxAdd === 'function') fxAdd(f.p, 0xdddddd, 6, 20, 1.5, 3, false);
        scene.remove(f.g);
        f.gone = true;
      }
      return;
    }
    f.prop.rotation.z += dt * 60;
    /* RULES OF ENGAGEMENT, once a second: outgunned (under half the enemy's strength near him), he breaks off for home */
    if ((f.rt += dt) > 1) {
      f.rt = 0;
      if (!f.home && S.st === 'out' && typeof ROE !== 'undefined' && ROE.ratio('us', f.p) < 0.5) {
        f.home = true;
        RADIO.add('PONY FLIGHT', 'TOO MANY OF THEM. PONY ' + (L.indexOf(f) + 1) + ' BREAKING OFF.');
      }
    }
    if (S.st === 'home' || f.home) {
      tgt.copy(FIELD).setY(SEA.Y + 300);
      steer(f, w.copy(tgt).sub(f.p).normalize(), V_GO, dt);
    } else {
      if (f.tgt && (f.tgt.st === 'down' || !R0.includes(f.tgt))) f.tgt = null;
      if (!f.tgt && R0.length) f.tgt = R0.reduce((b, e) => (e.p.distanceTo(f.p) < b.p.distanceTo(f.p) ? e : b));
      if (f.tgt) {
        const e = f.tgt;
        tgt.copy(e.p).addScaledVector(e.v, Math.min(3, e.p.distanceTo(f.p) / 300));
        steer(f, w.copy(tgt).sub(f.p).normalize(), V_ATK, dt);
        const to = tgt.sub(f.p),
          dist = to.length();
        if (dist < 450 && to.normalize().dot(w.copy(f.v).normalize()) > 0.985) {
          f.aim += dt;
          if (f.aim >= 1) {
            f.aim = 0;
            if (--f.ammo <= 0) {
              f.home = true;
              RADIO.add('PONY FLIGHT', 'PONY ' + (L.indexOf(f) + 1) + ', WINCHESTER. OUT OF AMMUNITION, RETURNING TO BASE.');
            }
            if (Math.random() < 0.3) {
              e.st = 'down';
              e.sm = 0;
              note('THE P-51S SPLASH A FRANK');
              RADIO.add('PONY FLIGHT', 'SPLASH ONE FRANK!');
            }
          }
        } else f.aim = 0;
      } else if (f.p.distanceTo(pos) > R * 2.5) {
        /* on the way out: straight to her */
        tgt.copy(pos).setY(SEA.Y + ALT);
        steer(f, w.copy(tgt).sub(f.p).normalize(), V_GO, dt);
      } else {
        /* on station: a circle round her, a little ahead of our place on it */
        f.a += (V_CAP / R) * dt;
        tgt.set(pos.x + R * Math.cos(f.a + 0.35), SEA.Y + ALT, pos.z + R * Math.sin(f.a + 0.35));
        steer(f, w.copy(tgt).sub(f.p).normalize(), V_CAP, dt);
      }
    }
    f.p.addScaledVector(f.v, dt);
    f.p.y = Math.max(f.p.y, SEA.Y + 60);
    pose(f);
  };
  const tick = (dt) => {
    if (!SIMS.on('pce') || crashed) {
      for (const f of L) f.g.visible = false;
      return;
    }
    const R0 = live(),
      seen = R0.find((e) => e.p.distanceTo(pos) < DETECT);
    S.t += dt;
    /* a new raid on the radar: Comms reports it, the OOD decides */
    if (seen && !S.raid) {
      S.raid = true;
      RADIO.add(
        'RADAR',
        'BRIDGE, COMMS: RADAR CONTACT, ENEMY AIRCRAFT BEARING ' + brg(seen.p) + ', ' + (seen.p.distanceTo(pos) / 1852).toFixed(0) + ' MILES, CLOSING.',
        { own: true },
      );
      if (S.st === 'none') decide();
    }
    if (!R0.length) S.raid = false;
    /* the call goes out, Control answers, the fighters scramble */
    if (S.st === 'called' && S.t > 6 && !S.sent) {
      S.sent = true;
      RADIO.add(
        S.who,
        'KAMOME CONTROL, THIS IS ' +
          S.who +
          (S.who === 'PCE 842' ? '. ENEMY AIRCRAFT INBOUND, REQUEST AIR SUPPORT AT MY POSITION. OVER.' : '. UNDER AIR ATTACK, REQUEST AIR SUPPORT. OVER.'),
      );
    }
    if (S.st === 'called' && S.t > 14 && !S.ack) {
      S.ack = true;
      const eta = Math.round((SCRAMBLE + pos.distanceTo(FIELD) / V_GO) / 60);
      RADIO.add('KAMOME CONTROL', S.who + ', KAMOME CONTROL. PONY FLIGHT, TWO P-51S, SCRAMBLING FROM FLETCHER FIELD. ETA ' + eta + ' MINUTES. OUT.');
    }
    if (S.st === 'called' && S.t > 14 + SCRAMBLE) {
      S.st = 'out';
      S.clear = 0;
      if (!L.length) spawn();
      for (const f of L) f.g.visible = true;
    }
    if (S.st === 'out') {
      S.clear = R0.length ? 0 : S.clear + dt;
      if (S.clear > CLEAR && L.every((f) => f.gone || f.home || f.p.distanceTo(pos) < R * 3)) {
        S.st = 'home';
        RADIO.add('PONY FLIGHT', 'PCE 842, PONY FLIGHT. NO MORE BANDITS IN SIGHT. RETURNING TO BASE.');
      }
    }
    if (S.st === 'out' || S.st === 'home') for (const f of L) if (!f.gone) fly(f, dt, R0);
    /* one sent home on his own lands out of sight */
    for (const f of L)
      if (f.home && !f.gone && !f.down && f.p.distanceTo(tgt.copy(FIELD).setY(f.p.y)) < 600) {
        scene.remove(f.g);
        f.gone = true;
      }
    if (L.length && L.every((f) => f.gone)) {
      L.length = 0;
      Object.assign(S, { st: 'none', sent: false, ack: false });
    }
    if (S.st === 'home' && L.every((f) => f.gone || f.p.distanceTo(tgt.copy(FIELD).setY(f.p.y)) < 600)) {
      /* home: they land out of sight */
      for (const f of L) scene.remove(f.g);
      L.length = 0;
      Object.assign(S, { st: 'none', sent: false, ack: false });
    }
  };
  HOOKS.tick.push(tick);
  HOOKS.mapDraw.push((g, lw) => {
    if (!SIMS.on('pce')) return;
    g.fillStyle = '#5aa8ff';
    for (const f of L) {
      g.beginPath();
      g.arc(f.p.x, f.p.z, lw(4), 0, 2 * Math.PI);
      g.fill();
    }
  });
  /* a call from a naval base under fire (BASEAIR: PT Base Halsey, raiders shooting near it): the same flight, called by the base */
  const call = (who) => {
    if (S.st !== 'none' || !SIMS.on('pce')) return;
    Object.assign(S, { st: 'called', t: 0, who, sent: false, ack: false });
    note(who + ': REQUESTING AIR SUPPORT');
  };
  /* a hit on one of them (the Japanese guns, ROE.hitAlly): home alone at half, down at none */
  const hurt = (f) => {
    if (f.down) return;
    f.hp -= 0.25;
    if (f.hp <= 0) {
      f.down = true;
      f.home = true;
      note('A P-51 IS SHOT DOWN');
      RADIO.add('PONY FLIGHT', 'PONY ' + (L.indexOf(f) + 1) + ' IS HIT, GOING IN!');
    } else if (f.hp <= 0.5 && !f.home) {
      f.home = true;
      RADIO.add('PONY FLIGHT', 'PONY ' + (L.indexOf(f) + 1) + ' HIT, RETURNING TO BASE.');
    }
  };
  return { L, S, call, hurt };
})();
