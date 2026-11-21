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
    if (typeof CAP !== 'undefined' && SIMS.on('pce'))
      for (const f of CAP.L)
        if (!f.down)
          L.push(
            unit(f, () => ({
              kind: 'fighter',
              air: true,
              p: f.p,
              r: 6,
              hurt: () => CAP.hurt(f),
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

  /* ----- the Allied ships' guns against enemy aircraft: tracers and rounds of their own ----- */
  const RND = [],
    MAXR = 240,
    tp = new Float32Array(MAXR * 6),
    tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const tl = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.9 }));
  tl.frustumCulled = false;
  scene.add(tl);
  /* a gun of each ship: [range, rounds a second, spread (rad), damage]: the PCE's 40 mm, a PT boat's 20 mm and .50s, a Liberty's 20 mm.
     They engage enemy aircraft first; with none in reach, an enemy vessel or shore gun (targets of opportunity) */
  const GUNS = {
    pce: [2500, 4, 0.006, 4],
    pt: [1500, 6, 0.008, 1.5],
    merchant: [1500, 3, 0.009, 1.5],
  }; /* damage as the PCE's own 40 mm and 20 mm (GSPEC hit) */
  const air = () => {
    const L = [];
    if (typeof EN !== 'undefined') for (const e of EN) if (!e.dying && !e.drone) L.push({ e, p: e.p, v: e.v || new V3(), en: true });
    if (typeof RAID !== 'undefined') for (const e of RAID.L) if (e.st !== 'down') L.push({ e, p: e.p, v: e.v, en: false });
    return L;
  };
  /* the enemy's vessels and shore guns, for the Allied guns */
  const surf = () => {
    const L = [];
    for (const q of T)
      if (!q.dead && q.side !== 'us' && (q.type === 'ship' || q.kind === 'aa') && q.m.visible !== false)
        L.push({ q, p: q.c, v: q.ringV || new V3(), sea: true });
    return L;
  };
  const tick = (dt) => {
    const A = started && !crashed ? air() : [],
      S = started && !crashed ? surf() : [];
    if (A.length || S.length)
      for (const u of alliesNow()) {
        const G = GUNS[u.kind];
        if (!G) continue;
        u.cd = (u.cd || 0) - dt;
        if (u.cd > 0) continue;
        let best = null,
          bd = G[0];
        for (const a of A) {
          const d = a.p.distanceTo(u.p);
          if (d < bd && a.p.y > u.p.y + 20) ((bd = d), (best = a));
        }
        if (!best)
          for (const a of S) {
            const d = a.p.distanceTo(u.p);
            if (d < bd * 0.8) ((bd = d), (best = a));
          }
        if (!best) continue;
        u.cd = 1 / G[1];
        const o = u.p.clone().add(new V3(0, 5, 0)),
          tof = bd / 850,
          aim = best.p.clone().addScaledVector(best.v, tof * 0.9);
        aim.y += 4.9 * tof * tof;
        const d = aim.sub(o).normalize(),
          gz = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2 * G[2];
        d.x += gz();
        d.y += gz();
        d.z += gz();
        if (RND.length < MAXR) RND.push({ p: o, v: d.normalize().multiplyScalar(850), t: 0, tg: best, dmg: G[3] });
        if (typeof fxAdd === 'function') fxAdd(o, 0xffd890, 1.1, 3, 0.07, 0, true);
      }
    let n = 0;
    for (let i = RND.length - 1; i >= 0; i--) {
      const b = RND[i],
        a = b.p.clone();
      b.t += dt;
      b.v.y -= 9.8 * dt;
      b.p.addScaledVector(b.v, dt);
      let dead = b.t > 3.5;
      const e = b.tg.e;
      if (!dead && b.tg.sea) {
        const q = b.tg.q;
        if (q.dead) dead = true;
        else {
          const ab = new V3().subVectors(b.p, a),
            l2 = ab.lengthSq(),
            k = Math.max(0, Math.min(1, new V3().subVectors(q.c, a).dot(ab) / l2)),
            c = a.clone().addScaledVector(ab, k);
          if (Math.hypot(c.x - q.c.x, c.z - q.c.z) < Math.min(q.r, 8) + 1 && c.y < q.c.y + q.s1 + 2) {
            dead = true;
            if (typeof fxAdd === 'function') fxAdd(c, 0xffd080, 1.5, 4, 0.2, 0, true);
            damage(q, b.dmg);
          } else if (b.p.y < SEA.WL) dead = true;
        }
      } else if (!dead && (b.tg.en ? !e.dying : e.st !== 'down')) {
        const ab = new V3().subVectors(b.p, a),
          l2 = ab.lengthSq(),
          t = Math.max(0, Math.min(1, new V3().subVectors(e.p, a).dot(ab) / l2));
        if (a.clone().addScaledVector(ab, t).distanceTo(e.p) < 7) {
          dead = true;
          if (typeof fxAdd === 'function') fxAdd(e.p, 0xffd080, 1.5, 4, 0.2, 0, true);
          if (b.tg.en) damageE(e, b.dmg);
          else if (++e.dmg >= 2) {
            e.st = 'down';
            e.sm = 0;
            note('A FRANK IS SHOT DOWN BY THE ESCORTS');
          }
        }
      }
      if (dead) {
        RND.splice(i, 1);
        continue;
      }
      if (n < MAXR) {
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
  return { STR, allies: alliesNow, enemy, ratio, pickAlly, hitAlly, reset: () => (RND.length = 0) };
})();
