/* the elevation that throws a shell r metres (the lower trajectory), and its time of flight */
function coastSolve(p0, r, out) {
  let lo = COAST.EL0,
    hi = COAST.EL1;
  const o = {};
  if (coastFly(p0, hi, 0, o) < r) return null;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (coastFly(p0, m, 0) < r) lo = m;
    else hi = m;
  }
  coastFly(p0, hi, 0, o);
  out.el = hi;
  out.t = o.t;
  return out;
}
const _cg = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
/* the shell effects: the PCE's own where the page has them, else the shared ones */
const coastFx = (p, col, s0, s1, life, vy, add) => (typeof gunFx === 'function' ? gunFx(p, col, s0, s1, life, vy, add) : fxAdd(p, col, s0, s1, life, vy, add));
/* the coast guns at work (shared: every page; the user's, 2026-11-21). They fire when the current simulator says the shore enemies
   are on (its role's coastOn: the PCE's Enemy setting, the P-51's Ground Fire). At the player's ship when she is afloat and in range,
   else at the nearest Allied ship they can see (targets of opportunity). Against aircraft they fire as ROE's posts (the '8cm' gun), when no ship is laid on; at ships the solution is laid by hand to +45 deg */
function coastUpdate(dt) {
  const on = SIMS.cur.coastOn() && started && !crashed && trn.mode === 'free';
  COAST.msgT = Math.max(0, COAST.msgT - dt);
  if (!on && !COAST.S.length) return;
  const night = WX.lt || 0,
    tgt = new THREE.Vector3(pos.x, coastSea() + 3, pos.z),
    sol = {};
  for (const g of COAST.G) {
    g.rec = Math.max(0, g.rec - dt * 1.5);
    g.bar.position.x = -0.45 * g.rec;
    /* a gun knocked out: said once, with what is left of its battery (the user's, 2026-11-22: the other gun firing on looked as if the
       battery he had hit still fired) */
    if (g.t.dead && !g.said) {
      g.said = true;
      const left = COAST.G.filter((q) => q.bat === g.bat && !q.t.dead).length,
        t = left ? 'SHORE GUN DESTROYED. ITS BATTERY HAS ' + left + ' MORE GUN' + (left > 1 ? 'S' : '') + ' FIRING.' : 'SHORE BATTERY SILENCED: NO GUN OF IT LEFT FIRING.';
      note(t);
      if (typeof RADIO !== 'undefined') RADIO.add('GUNNERY', t, { own: true });
    }
    if (g.t.dead || !on) continue;
    /* the target, once a second: the PCE if she is in range and in sight; else (targets of opportunity, RULES OF ENGAGEMENT) the
       nearest Allied ship it can see in range (a fleet PCE or PT boat, the Liberty) */
    const maxR = night > 0.35 ? 3000 : COAST.R;
    if ((g.vt = (g.vt || 0) - dt) <= 0) {
      g.vt = 1;
      const R0 = Math.hypot(pos.x - g.p.x, pos.z - g.p.z),
        was = g.tg;
      g.tg = null;
      g.sees = SIMS.cur.afloat && R0 <= maxR && R0 >= 60 && aaSees(g.p, tgt) && SIMS.cur.screen(g.p, tgt) < 0.75 /* her smoke hides her */;
      if (!g.sees && typeof ROE !== 'undefined') {
        const u = ROE.pickAlly(g.p, maxR, false);
        if (u && aaSees(g.p, new THREE.Vector3(u.p.x, coastSea() + 3, u.p.z))) ((g.tg = u), (g.sees = true));
      }
      if (g.tg !== was) g.n = 0; /* a new target: the layers start again */
    }
    if (!g.sees) {
      g.n = 0;
      /* no ship to lay on: the gun is a dual-purpose 8 cm, and its post (ROE) may be firing at an Allied aircraft: the mount follows it */
      const P = typeof ROE !== 'undefined' && ROE.postOf(g.grp),
        a = P && P.guns[0].tg;
      if (a && a.air) {
        const dx = a.p.x - g.p.x,
          dz = a.p.z - g.p.z,
          want = Math.atan2(-dz, dx) - g.home,
          dy = Math.atan2(Math.sin(want - g.yaw), Math.cos(want - g.yaw)),
          el = Math.min((75 * Math.PI) / 180, Math.atan2(a.p.y - g.p.y, Math.hypot(dx, dz)));
        g.yaw += Math.max(-0.15 * dt, Math.min(0.15 * dt, dy));
        g.el += Math.max(-0.15 * dt, Math.min(0.15 * dt, el - g.el));
        g.tur.rotation.y = g.yaw;
        g.bar.rotation.z = g.el;
        if (P.guns[0].cd > (1 / P.guns[0].s.rps) * 0.8) g.rec = Math.max(g.rec, 0.9); /* just fired: the recoil */
      }
      continue;
    }
    const tp = g.tg ? new THREE.Vector3(g.tg.p.x, coastSea() + 3, g.tg.p.z) : tgt,
      tv = g.tg ? g.tg.v : vel;
    /* lead her: where she will be when the shell comes down, from her course and speed now (two passes) */
    let aim = tp.clone(),
      ok = true;
    for (let it = 0; it < 2 && ok; it++) {
      const r = Math.hypot(aim.x - g.p.x, aim.z - g.p.z);
      ok = !!coastSolve(g.p, r, sol);
      if (ok) aim = tp.clone().addScaledVector(tv, sol.t);
    }
    if (!ok) continue;
    const r = Math.hypot(aim.x - g.p.x, aim.z - g.p.z),
      wy = Math.atan2(-(aim.z - g.p.z), aim.x - g.p.x); /* GX yaw: 0 = +x, + toward -z */
    /* the layers' error, applied to the aim: range (a fraction) and line (radians) */
    if (!g.n) {
      g.er = _cg() * 0.07;
      g.ed = _cg() * 0.012;
    }
    coastSolve(g.p, r * (1 + g.er), sol);
    const want = wy + g.ed - g.home,
      dy = Math.atan2(Math.sin(want - g.yaw), Math.cos(want - g.yaw));
    g.yaw += Math.max(-0.12 * dt, Math.min(0.12 * dt, dy)); /* hand training, about 7 deg a second */
    g.el += Math.max(-0.08 * dt, Math.min(0.08 * dt, sol.el - g.el));
    g.tur.rotation.y = g.yaw;
    g.bar.rotation.z = g.el;
    g.cd -= dt;
    if (g.cd <= 0 && Math.abs(dy) < 0.01 && Math.abs(sol.el - g.el) < 0.004) {
      g.cd = COAST.RLD * (0.9 + Math.random() * 0.25);
      g.n++;
      /* the round: out along the bore, plus the gun's own spread and the layers' (about 2 mils in elevation, 1.5 in line) */
      const az = g.home + g.yaw + _cg() * 0.0015,
        e2 = g.el + _cg() * 0.002,
        dir = new THREE.Vector3(Math.cos(az) * Math.cos(e2), Math.sin(e2), -Math.sin(az) * Math.cos(e2)),
        mz = g.p.clone().addScaledVector(dir, COAST.MZ);
      COAST.S.push({ p: mz.clone(), v: dir.multiplyScalar(COAST.MV * (1 + _cg() * 0.0015)), t: 0, g, aimR: r, tg: g.tg });
      g.rec = 1;
      coastFx(mz, 0xffc070, 4, 12, 0.18, 0, true);
      coastFx(mz, 0x9a9890, 4, 22, 3.5, 0.8, false);
      const d = mz.distanceTo(cam.position);
      SND.burst(900, 60, 0.7, Math.min(0.9, 2.2 / (1 + d / 400)), 0.8, 'lowpass', Math.min(8, d / 340));
      if (COAST.msgT <= 0 && !g.tg) {
        note('SHORE BATTERY FIRING!');
        if (typeof RADIO !== 'undefined') RADIO.add('LOOKOUT', 'GUN FLASHES ON THE BEACH, BEARING ' + raidBrg(g.p) + '!');
        COAST.msgT = 40;
      }
    }
  }
  /* the shells in flight; each splash is spotted from the battery and the next round corrected */
  const L = new THREE.Vector3(),
    a = new THREE.Vector3();
  for (let i = COAST.S.length - 1; i >= 0; i--) {
    const s = COAST.S[i];
    a.copy(s.p);
    const v = s.v.length(),
      k = COAST.K * Math.exp(-Math.max(0, s.p.y) / 9145) * v;
    s.v.multiplyScalar(1 - k * dt);
    s.v.y -= 9.81 * dt;
    s.p.addScaledVector(s.v, dt);
    s.t += dt;
    /* the whistle as it comes down near her */
    if (!s.wh && s.v.y < 0 && s.p.distanceTo(cam.position) < 900) {
      s.wh = true;
      SND.tone(1500, 420, 1.4, 0.25, 'sine');
    }
    /* through her hull or superstructure on this step? */
    let hit = false;
    for (let j = 1; j <= 6 && !hit && !s.tg; j++) {
      L.copy(a).lerp(s.p, j / 6);
      hit = SIMS.cur.afloat && SIMS.cur.struck(L);
    }
    let hitA = false;
    if (s.tg && ROE.hitAlly(s.tg, a, s.p, 30)) ((hitA = true), L.copy(s.p)); /* an Allied ship (counted on her) */
    const sea = s.p.y <= coastSea(),
      land = !sea && s.p.y < H(s.p.x, s.p.z);
    if (!hit && !hitA && !sea && !land && s.t < 90) continue;
    const g = s.g;
    if (hitA) {
      coastFx(L, 0xffa040, 6, 16, 0.5, 0, true);
      coastFx(L, 0x2a2826, 6, 26, 6, 1.5, false);
    } else if (hit) {
      COAST.hits++;
      SIMS.cur.shelled(76) /* an 8 cm shell */;
      coastFx(L, 0xffa040, 6, 16, 0.5, 0, true);
      coastFx(L, 0x2a2826, 6, 26, 6, 1.5, false);
      note('HIT BY A 12 CM SHELL! (' + COAST.hits + ')');
      SND.burst(700, 50, 1.2, 1, 0.7);
    } else if (sea) {
      if (typeof gunSplash === 'function') gunSplash(s.p, { splash: 1.5 });
      else fxAdd(s.p, 0xe8eef0, 4, 14, 1.2, 4, false);
      const md = Math.hypot(s.p.x - pos.x, s.p.z - pos.z);
      if (md < 40 && COAST.msgT < 30) note('NEAR MISS!');
    } else if (typeof gunBurst === 'function') gunBurst(s.p, { splash: 1.2, blast: null }, false);
    else explode(s.p.clone(), 6);
    /* spotting: the battery sees the splash short / over and left / right, and corrects half the error */
    if (g && !g.t.dead && !(!s.tg && SIMS.cur.screen(g.p, s.p) > 0.35) /* a splash in her smoke cannot be spotted */) {
      g.er *= 0.45 + Math.random() * 0.2;
      g.ed *= 0.45 + Math.random() * 0.2;
      if (Math.abs(g.er) < 0.012) g.er = _cg() * 0.012;
      if (Math.abs(g.ed) < 0.003) g.ed = _cg() * 0.003; /* the battery's own limit: rangefinding by eye and stadia, hand-cranked laying */
    }
    COAST.S.splice(i, 1);
  }
}

HOOKS.tick.push((dt) => coastUpdate(dt)); /* every page */
