/* RULES OF ENGAGEMENT (the user's, 2026-11-21).
   Targets of opportunity: every armed unit on both sides engages any enemy in range that it can see: aircraft, ships, boats and
   shore guns. Merchant ships and their boats never fire (a Liberty's Naval Armed Guard does: her 20 mm).
   Stay and fight while the unit's side is at least half as strong as the enemy within 5 km (ROE.ratio: each unit's strength from its
   guns and torpedoes, scaled by its damage).
   Outgunned, break off and run (for home, or the nearest friendly guns): below half the enemy's strength; damaged past 50% (aircraft)
   or 40% (ships); out of ammunition or torpedoes.
   Exceptions: shore guns and bases never run; a T-14 makes one torpedo run, then withdraws; merchant ships run from any attack;
   fighters scrambled to defend a base fight until damaged or out of ammunition.
   This piece: the units and their strength (ROE.units, ROE.ratio), the Allied ships' guns against enemy aircraft (the fleet's PCEs
   and PT boats, the Liberty's 20 mm), with their tracers. The Japanese 25 mm guns and coast guns choose Allied units here too
   (ROE.allies, ROE.hitAlly). Each unit's own rules are in its own piece (raiders, bandits, T-14s, the merchant ships, the air
   support's P-51s, the PCE's gun crews). var: other pieces may ask before this one has run. */
var ROE = (() => {
  const STR = { fighter: 2, pce: 6, pt: 2, escort: 6, t14: 3, aa: 1, coast: 2, merchant: 0.5, veh: 0, boat: 0 };
  const V3 = THREE.Vector3;
  /* an Allied AI unit (the player's own vehicle is not one: the guns have their own ways at her) */
  const wrap = new WeakMap();
  const unit = (o, f) => {
    let u = wrap.get(o);
    if (!u) wrap.set(o, (u = Object.assign({ o, v: new V3(), hits: 0 }, f())));
    return u;
  };
  const allies = () => {
    if (typeof VEH !== 'undefined') VEH.init();
    const L = [];
    /* every Allied vehicle (VEH: the fleet, the boats at the PT base, the Liberty and her LCM, the vehicles at work) */
    for (const q of T)
      if (q.side === 'us' && !q.dead && q.m.visible !== false)
        L.push(
          unit(q, () => ({
            kind: q.rk || (q.kind === 'civ' ? 'merchant' : 'veh'),
            air: false,
            p: q.c,
            r: q.r,
            hurt: (d) => damage(q, d),
          })),
        );
    /* the American air support's fighters (AIRSUP) */
    if (typeof AIRSUP !== 'undefined')
      for (const f of AIRSUP.L)
        if (f.side === 'us' && f.up && !f.down)
          L.push(
            unit(f, () => ({
              kind: 'fighter',
              air: true,
              p: f.p,
              r: 6,
              hurt: (d) => AIRSUP.hurt(f, Math.min(d, 1.5)),
            })),
          );
    /* their velocity, measured frame to frame */
    const now = performance.now() / 1000;
    for (const u of L) {
      if (u.t0 !== undefined && now > u.t0 && now - u.t0 < 0.5) u.v.lerp(new V3().subVectors(u.p, u.p0).divideScalar(now - u.t0), 0.3);
      (u.p0 || (u.p0 = new V3())).copy(u.p);
      u.t0 = now;
    }
    return L;
  };
  let AL = [],
    alT = -1;
  const alliesNow = () => {
    const now = performance.now();
    if (now - alT > 100) ((AL = allies()), (alT = now));
    return AL;
  };
  /* the enemy's units (the Japanese) */
  const enemy = () => {
    const L = [];
    if (typeof EN !== 'undefined') for (const e of EN) if (!e.dying && !e.drone) L.push({ kind: 'fighter', air: true, p: e.p, k: e.hp0 ? e.hp / e.hp0 : 1 });
    if (typeof RAID !== 'undefined') for (const e of RAID.L) if (e.st !== 'down') L.push({ kind: 'fighter', air: true, p: e.p, k: e.dmg ? 0.5 : 1 });
    if (typeof AIRSUP !== 'undefined')
      for (const u of AIRSUP.L) if (u.side === 'jp' && u.up && !u.down) L.push({ kind: 'fighter', air: true, p: u.p, k: Math.max(0.1, u.hp / 4) });
    for (const t of T)
      if (!t.dead && t.side !== 'us' && t.type === 'ship' && t.kind !== 'civ' && t.kind !== 'boat' && t.m && t.m.visible !== false)
        L.push({ kind: t.r < 10 ? 't14' : 'escort', air: false, p: t.c, k: t.hp0 ? t.hp / t.hp0 : 1 });
    for (const g of AA.gun) if (!g.t.dead && !g.ship) L.push({ kind: 'aa', air: false, p: g.piv, k: 1 });
    if (typeof COAST !== 'undefined') for (const g of COAST.G) if (!g.t.dead) L.push({ kind: 'coast', air: false, p: g.p, k: 1 });
    return L;
  };
  /* the player's own vehicle, on our side */
  const me = () => {
    if (crashed || !started) return null;
    if (SIMS.cur.afloat) return { kind: 'pce', p: pos, k: typeof SDM !== 'undefined' ? Math.max(0.1, 1 - Math.max(SDM.holes, SDM.flood)) : 1 };
    return { kind: 'fighter', p: pos, k: typeof php !== 'undefined' ? Math.max(0.1, php / 100) : 1 };
  };
  const sum = (L, p, R) => L.reduce((s, u) => s + (Math.hypot(u.p.x - p.x, u.p.z - p.z) < R ? STR[u.kind] * (u.k === undefined ? 1 : u.k) : 0), 0);
  /* side ('us' or 'jp') at p: its strength within R over the enemy's (Infinity with no enemy) */
  const ratio = (side, p, R = 5000) => {
    const m = me(),
      us = sum(alliesNow(), p, R) + (m ? sum([m], p, R) : 0),
      jp = sum(enemy(), p, R);
    const own = side === 'us' ? us : jp,
      opp = side === 'us' ? jp : us;
    return opp > 0 ? own / opp : Infinity;
  };
  /* the nearest Allied AI unit to p within R (for the Japanese guns' targets of opportunity) */
  const pickAlly = (p, R, air) => {
    let best = null,
      bd = R;
    for (const u of alliesNow()) {
      if (air === false && (u.air || !u.o || u.o.type !== 'ship')) continue; /* air false: ships only (the coast guns) */
      const d = u.p.distanceTo(p);
      if (d < bd) ((bd = d), (best = u));
    }
    return best;
  };
  /* a round's segment a-b against an Allied unit: a hit counts on it */
  const hitAlly = (u, a, b, dmg = 1) => {
    if (!u || (u.o && u.o.down)) return false;
    const ab = new V3().subVectors(b, a),
      l2 = ab.lengthSq(),
      t = l2 ? Math.max(0, Math.min(1, new V3().subVectors(u.p, a).dot(ab) / l2)) : 0,
      c = a.clone().addScaledVector(ab, t);
    const dy = u.air ? 0 : Math.max(0, c.y - (u.p.y + 6)); /* a ship's hull and upperworks: about 6 m above her waterline */
    if (Math.hypot(c.x - u.p.x, (u.air ? c.y - u.p.y : dy) * 1, c.z - u.p.z) > (u.air ? u.r : Math.min(u.r, 8))) return false;
    u.hits++;
    u.hurt(dmg);
    if (typeof fxAdd === 'function') fxAdd(c, 0xffd080, 1.2, 3, 0.15, 0, true);
    return true;
  };

  /* ----- THE GUN POSTS: every crewed gun not laid by code of its own (the user's, 2026-11-21: all guns manned and able to fire; all
     vehicles and fixed guns fire on all targets of opportunity, the player's vehicle first). The Allied fleet's PCEs (all nine: the
     3"/50, three twin 40 mm, five 20 mm), the PT boats (two twin .50s and a 20 mm), the Liberty's Naval Armed Guard (a 5"/38 aft, a
     3"/50 forward, four 20 mm), the player's own PCE's six mounts she does not man herself (two twin 40 mm, four 20 mm: her AI crews,
     from her magazines), and the Ukuru escorts' three 12 cm guns. Each picks its own target twice a second: the Japanese take the
     player's vehicle first, then the Allied aircraft, then the Allied vessels and vehicles; the Allied take the enemy aircraft first,
     then the armed vessels and shore guns, then any other. Surface fire only with the shore enemies on (the role's coastOn: the PCE's
     Enemy setting, the P-51's Ground Fire). The rounds fly (gravity), tracers show, and each is tested against its own target; the
     big guns' shells burst near an aircraft (time and VT fuzes). The Japanese 25 mm guns and coast guns have their own code. ----- */
  const GT = {
    20: { air: 1400, surf: 1000, rps: 4, sp: 0.006, dmg: 1.5, mv: 830, kr: 0.047 },
    40: { air: 3600, surf: 3600, rps: 2, sp: 0.004, dmg: 4, mv: 880, kr: 0.069 },
    50: { air: 1300, surf: 900, rps: 6, sp: 0.007, dmg: 0.6, mv: 870, kr: 0.035 },
    '3in': { air: 5000, surf: 9000, rps: 0.3, sp: 0.0025, dmg: 14, mv: 823, prox: 15 },
    '5in': { air: 7000, surf: 14000, rps: 0.25, sp: 0.0025, dmg: 40, mv: 792, prox: 20 },
    '12cm': { air: 6000, surf: 12000, rps: 0.17, sp: 0.0025, dmg: 30, mv: 825, prox: 15, mm: 120 },
    /* the coast batteries' 8 cm/40s against aircraft (dual purpose: +75 deg, 7,200 m ceiling): their fire at ships is the batteries' own */
    '8cm': { air: 6000, surf: 0, rps: 0.17, sp: 0.003, dmg: 10, mv: 680, prox: 12, mm: 76 },
  };
  const FIT = {
    pt: [
      ['50', 1.5, 2.4, 1.1],
      ['50', 1.5, 2.4, -1.1],
      ['20', -9, 2.2, 0],
    ],
    liberty: [
      ['3in', 60, 11, 0],
      ['5in', -62, 9, 0],
      ['20', 22, 14, 7],
      ['20', 22, 14, -7],
      ['20', -30, 12, 7],
      ['20', -30, 12, -7],
    ],
    escort: [
      ['12cm', 26, 7, 0],
      ['12cm', -22, 7, 0],
      ['12cm', -30, 6, 0],
    ],
  };
  const war = () => started && !crashed && SIMS.cur.coastOn();
  /* the enemy warships fight (the role's shipsOn: the PCE's Ships setting, the P-51's Ground Fire) */
  const navy = () => started && !crashed && SIMS.cur.shipsOn();
  const post = new WeakMap();
  const mkGuns = (L) =>
    L.map((g) => (Array.isArray(g) ? { id: g[0], p: new V3(g[1], g[2], g[3]) } : g)).map((g) => ({
      ...g,
      s: GT[g.id],
      cd: Math.random(),
      ct: Math.random() * 0.5,
    }));
  /* the posts now (rebuilt once a second): { m: the mesh they ride, side, guns, mag (draws on the player's magazines), dead() } */
  let POSTS = [],
    pT = -1;
  const posts = () => {
    const now = performance.now();
    if (now - pT < 1000) return POSTS;
    pT = now;
    const L = [];
    const at = (m, side, kind, fit, dead, mag) => {
      let P = post.get(m);
      if (!P || P.kind !== kind) post.set(m, (P = { m, side, kind, guns: mkGuns(fit), dead, mag }));
      L.push(P);
    };
    for (const q of T) {
      if (q.dead || q.m.visible === false) continue;
      if (q.side === 'us' && q.rk === 'pce') at(q.m, 'us', 'pce', PCEM.guns(true), () => q.dead);
      else if (q.side === 'us' && q.rk === 'pt') at(q.m, 'us', 'pt', FIT.pt, () => q.dead);
      else if (q.side === 'us' && q.kind === 'civ' && q.r > 30) at(q.m, 'us', 'liberty', FIT.liberty, () => q.dead);
      else if (q.side !== 'us' && q.esc) at(q.m, 'jp', 'escort', FIT.escort, () => q.dead) /* the Ukurus (not the freighters and tankers at anchor) */;
    }
    /* each coast battery gun (an 8 cm/40, dual purpose) fires at Allied aircraft while it has no ship to lay on (the user's, 2026-11-22) */
    if (typeof COAST !== 'undefined')
      for (const g of COAST.G) if (!g.t.dead) at(g.grp, 'jp', 'coast', [['8cm', 0, COAST.PIV, 0]], () => g.t.dead || g.sees || !war());
    if (SIMS.on('pce') && typeof SHIPM !== 'undefined' && SHIPM.mesh) at(SHIPM.mesh, 'us', 'own', PCEM.guns(false), () => crashed || SIMS.cur.holdFire(), true);
    POSTS = L;
    return L;
  };
  /* the aircraft each side can engage */
  const aircraft = (side) => {
    const L = [];
    if (side === 'us') {
      if (typeof EN !== 'undefined')
        for (const e of EN) if (!e.dying && !e.drone) L.push({ k: 'en', e, p: e.p, v: e.v || e.fwd.clone().multiplyScalar(e.sp || 0) });
      if (typeof RAID !== 'undefined') for (const e of RAID.L) if (e.st !== 'down') L.push({ k: 'raid', e, p: e.p, v: e.v });
    }
    if (typeof AIRSUP !== 'undefined') for (const u of AIRSUP.L) if (!u.down && u.side !== side && u.up) L.push({ k: 'air', e: u, p: u.p, v: u.v });
    return L;
  };
  const armed = (q) => q.kind === 'aa' || (q.type === 'ship' && q.kind !== 'civ' && q.kind !== 'boat');
  /* what kind of enemy target q is, for a target priority (the PCE's OOD's order): 'escort' (a warship), 't14' (a torpedo boat),
     'cargo' (a freighter or tanker, not a small boat), 'coast' (a coast battery gun), 'aa' (an AA gun), or '' */
  const tkind = (q) =>
    q.type === 'coast12' ? 'coast' : q.kind === 'aa' ? 'aa' : q.type !== 'ship' ? '' : q.esc ? 'escort' : q.t14 ? 't14' : q.r > 10 ? 'cargo' : '';
  /* the nearest enemy of kind k within r of o (with the settings that let them fight: ships with Ships, the shore with Shore) */
  const nearestOf = (k, o, r) => {
    let best = null,
      bd = r;
    if (!(k === 'coast' || k === 'aa' ? war() : navy())) return null;
    for (const q of T) {
      if (q.dead || q.side === 'us' || q.m.visible === false || tkind(q) !== k) continue;
      const d = q.c.distanceTo(o);
      if (d < bd) ((bd = d), (best = { k: 't', q, p: q.c, v: q.ringV || new V3(), d }));
    }
    return best;
  };
  const pick = (P, g, o) => {
    const s = g.s;
    let best = null,
      bd = 1e9;
    if (P.kind === 'escort' && !navy()) return null; /* the escorts fight only with the Ships setting */
    /* her own guns: the OOD's target priority first (SIMS.cur.gunPri: '' or 'air' leaves the usual order) */
    if (P.kind === 'own') {
      const pk = SIMS.cur.gunPri();
      if (pk && pk !== 'air') {
        const b = nearestOf(pk, o, pk === 'aa' ? s.surf * 0.66 : s.surf);
        if (b) return b;
      }
    }
    /* the player's vehicle first (the Japanese) */
    if (P.side === 'jp' && started && !crashed) {
      const d = pos.distanceTo(o);
      if (SIMS.cur.afloat ? (P.kind === 'escort' ? navy() : war()) && d < s.surf : d < s.air && pos.y > H(pos.x, pos.z) + 20) return { k: 'player', p: pos, v: vel, air: !SIMS.cur.afloat };
    }
    for (const a of aircraft(P.side)) {
      const d = a.p.distanceTo(o);
      if (d < s.air && d < bd && a.p.y > o.y + 20) ((bd = d), (best = { ...a, air: true }));
    }
    if (best || !(war() || navy())) return best;
    for (const pass of [true, false])
      for (const q of T) {
        if (q.dead || q.m.visible === false || (P.side === 'us' ? q.side === 'us' : q.side !== 'us')) continue;
        if (pass !== armed(q) || (q.type !== 'ship' && s.dmg > 20 && q.kind !== 'aa')) continue;
        if (!(q.type === 'ship' && q.side !== 'us' ? navy() : war())) continue; /* the enemy's ships with Ships on, the rest with Shore */
        const d = q.c.distanceTo(o);
        if (d < s.surf && d < bd) ((bd = d), (best = { k: 't', q, p: q.c, v: q.ringV || new V3() }));
      }
    return best;
  };
  /* THE LAYERS' ERROR (the user's, 2026-11-21: the AI gunners were too accurate). A crew does not know its target's course and speed:
     it judges them by eye (or a rough plot), and its aim wanders as it tracks. Each gun keeps its own estimate, judged afresh every
     1.5 to 3 s: the speed off by about a quarter, the course by about 10 deg, and a tracking error of about 6 mrad against aircraft
     (4 against ships) of the range. US Navy 1944-45 figures for scale: some thousands of 20 mm rounds, and over a thousand 40 mm, for
     each aircraft brought down. aimErr(g, R, air, v) -> { v: the velocity the crew leads with, off: the aim's offset (world) } */
  const gs = () => Math.random() + Math.random() + Math.random() - 1.5;
  const aimErr = (g, R, air, v) => {
    const now = performance.now() / 1000;
    let e = g.ae;
    if (!e || now > e.t) {
      e = g.ae = e || { off: new V3(), v: new V3() };
      e.t = now + 1.5 + Math.random() * 1.5;
      e.k = 1 + gs() * 0.5 /* speed: about +-25% */;
      e.a = gs() * 0.35 /* course: about +-10 deg */;
      e.u = new V3(gs(), gs() * (air ? 1 : 0.15), gs()).multiplyScalar(2 * (air ? 0.006 : 0.004));
    }
    e.off.copy(e.u).multiplyScalar(R);
    e.v.copy(v).multiplyScalar(e.k).applyAxisAngle(UP, e.a);
    return e;
  };
  const UP = new V3(0, 1, 0);
  const RND = [],
    MAXR = 400,
    tp = new Float32Array(MAXR * 6),
    tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const tl = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.9 }));
  tl.frustumCulled = false;
  scene.add(tl);
  const o = new V3(),
    ab = new V3(),
    w = new V3();
  const segNear = (a, b, c) => {
    ab.subVectors(b, a);
    const l2 = ab.lengthSq(),
      k = l2 ? Math.max(0, Math.min(1, w.subVectors(c, a).dot(ab) / l2)) : 0;
    return a.clone().addScaledVector(ab, k);
  };
  const tick = (dt) => {
    if (!started || crashed) return;
    for (const P of posts()) {
      if (P.dead()) continue;
      P.m.updateMatrixWorld();
      for (const g of P.guns) {
        g.cd -= dt;
        if ((g.ct -= dt) <= 0) {
          g.ct = 0.5;
          o.copy(g.p).applyMatrix4(P.m.matrixWorld);
          g.tg = pick(P, g, o);
        }
        if (!g.tg || g.cd > 0) continue;
        if (P.mag && (MAG[g.id] || 0) <= 0) continue;
        const T0 = g.tg,
          s = g.s;
        if (T0.k === 'en' ? T0.e.dying : T0.k === 'raid' ? T0.e.st === 'down' : T0.k === 'air' ? T0.e.down : T0.k === 't' ? T0.q.dead : crashed) {
          g.tg = null;
          continue;
        }
        g.cd = (1 / s.rps) * (0.85 + Math.random() * 0.3);
        if (P.mag) MAG[g.id]--;
        o.copy(g.p).applyMatrix4(P.m.matrixWorld);
        const R = T0.p.distanceTo(o),
          tof = R / s.mv,
          air = T0.air || T0.k !== 'player' && T0.k !== 't',
          E = aimErr(g, R, air, T0.v),
          scr = T0.k === 'player' && !T0.air ? SIMS.cur.screen(o, T0.p) : 0 /* her smoke between them: they lay on glimpses */,
          aim = T0.p.clone().addScaledVector(E.v, tof * 0.95).addScaledVector(E.off, 1 + 5 * scr);
        if (scr > 0.75) {
          /* hidden in it: they cannot see her to lay on */
          if (P.mag) MAG[g.id]++;
          g.tg = null;
          continue;
        }
        if (T0.k === 'player' && !T0.air) aim.y = coastSea() + 2;
        aim.y += 4.9 * tof * tof;
        const d = aim.sub(o).normalize(),
          gz = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2 * s.sp * (1 + R / 3000);
        d.x += gz();
        d.y += gz() * (air ? 1 : 0.3) /* against a ship the scatter is mostly in range: a small error in elevation is a long one in range */;
        d.z += gz();
        if (RND.length < MAXR) RND.push({ p: o.clone(), v: d.normalize().multiplyScalar(s.mv), t: 0, life: (Math.max(s.air, s.surf) / s.mv) * 1.3, tg: T0, s });
        if (o.distanceTo(cam.position) < 4000) fxAdd(o, 0xffd890, s.dmg > 10 ? 2.5 : 1.1, s.dmg > 10 ? 6 : 3, 0.07, 0, true);
      }
    }
    let n = 0;
    for (let i = RND.length - 1; i >= 0; i--) {
      const b = RND[i],
        a = b.p.clone();
      b.t += dt;
      b.v.y -= 9.8 * dt;
      b.p.addScaledVector(b.v, dt);
      let dead = b.t > b.life || b.p.y < SEA.WL - 1 || b.p.y < H(b.p.x, b.p.z);
      const T0 = b.tg,
        s = b.s;
      if (!dead) {
        if (T0.k === 'player') {
          if (T0.air || s.dmg <= 4) {
            if (AA.hit(a, b.p)) dead = true;
          } else if (SIMS.cur.afloat && SIMS.cur.struck(b.p)) ((dead = true), SIMS.cur.shelled(b.s.mm || 120));
        } else if (T0.k === 't') {
          const q = T0.q;
          if (!q.dead) {
            const c = segNear(a, b.p, q.c);
            if (Math.hypot(c.x - q.c.x, c.z - q.c.z) < Math.min(q.r, 8) + 1 && c.y < q.c.y + q.s1 + 2) {
              dead = true;
              fxAdd(c, 0xffd080, s.dmg > 10 ? 4 : 1.5, s.dmg > 10 ? 12 : 4, 0.25, 0, true);
              damage(q, s.dmg);
            }
          }
        } else {
          const e = T0.e,
            c = segNear(a, b.p, e.p),
            dd = c.distanceTo(e.p);
          /* against an aircraft: a round within its kill zone (kr: the PCE's Hardcore zones, from the real rounds per kill: a hit
             was 7 m before, and the AI guns shot everything down: the user's, 2026-11-21), or a big gun's burst near it (time
             and VT fuzes: one in ten near enough to do it harm) */
          if (dd < (s.kr || 0) || (s.prox && dd < s.prox && Math.random() < 0.1)) {
            dead = true;
            fxAdd(c, s.prox ? 0x555555 : 0xffd080, s.prox ? 4 : 1.5, s.prox ? 10 : 4, s.prox ? 1 : 0.2, 0, !s.prox);
            if (T0.k === 'en') damageE(e, s.dmg);
            else if (T0.k === 'air') AIRSUP.hurt(e, s.dmg);
            else if (++e.dmg >= 2) {
              e.st = 'down';
              e.sm = 0;
              if (e.p.distanceTo(cam.position) < 8000) note('A FRANK IS SHOT DOWN');
            }
          }
        }
      }
      if (dead) {
        RND.splice(i, 1);
        continue;
      }
      if (n < MAXR && s.dmg <= 4) {
        const k = n++ * 6;
        tp[k] = b.p.x;
        tp[k + 1] = b.p.y;
        tp[k + 2] = b.p.z;
        tp[k + 3] = b.p.x - b.v.x * 0.05;
        tp[k + 4] = b.p.y - b.v.y * 0.05;
        tp[k + 5] = b.p.z - b.v.z * 0.05;
      }
    }
    tg.setDrawRange(0, n * 2);
    tg.attributes.position.needsUpdate = true;
  };
  HOOKS.tick.push(tick);
  /* where the enemy's guns reach on the sea: [x, z, r] for each coast battery gun (its 10.8 km), each armed Japanese post
     or ship (its longest gun's surface range) and each T-14 group's base (they run in on a ship within about 4 km of it). The PCE's start
     and I-58's patrol keep clear of them (the user's, 2026-11-22) */
  const reach = () => {
    const W = [];
    if (typeof COAST !== 'undefined') for (const g of COAST.G) if (!g.t.dead) W.push([g.p.x, g.p.z, COAST.REACH]);
    for (const P of posts())
      if (P.side === 'jp' && P.guns.length) {
        const q = P.m.getWorldPosition(new THREE.Vector3());
        if (P.kind !== 'coast') W.push([q.x, q.z, Math.max(...P.guns.map((g) => g.s.surf || 0))]); /* (the coast guns' reach at sea is their own, above) */
      }
    for (const G of (SITE.t14w && SITE.t14w.groups) || []) if (G.F) W.push([G.F.O.x, G.F.O.z, 4000]);
    return W;
  };
  return { STR, allies: alliesNow, enemy, ratio, pickAlly, hitAlly, posts, aimErr, reach, tkind, nearestOf, postOf: (m) => post.get(m), reset: () => (RND.length = 0) };
})();
