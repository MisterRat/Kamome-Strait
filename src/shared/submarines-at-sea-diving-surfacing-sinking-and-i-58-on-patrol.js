/* =====================================================================================================================
   SUBMARINES AT SEA (the user's, 2026-11-21): USS Roncador (SS-301) and I-58 (Type B3, May 1945) in the water. Each boat
   (SUBS.make) is her model (MODELS us-roncador / jp-i58, with its distant form beyond 1.2 km) and her state:
     p      her middle at the depth she is at (y: the sea less d), v her velocity, yw her heading (bow along (cos yw, 0, -sin yw))
     d, dT  the depth of her waterline now and ordered: 0 surfaced, pd periscope depth (only the periscope above the water),
            deep below about 30 m (the model hidden); she dives at about 0.45 m/s and surfaces at 0.35, bow down or up a few degrees
     the periscope's feather when she runs at periscope depth, her wake when surfaced; sinking: down by the bow, the oil and the
     wreckage coming up
   I-58 ON PATROL (the role's subsOn: the PCE's Enemy setting Subs): she keeps a circle 2.5 km across in water at least 30 m deep, 6 to 20 km from the US
   base (patrolC), deep (clear of the bottom), coming to periscope depth every few minutes to look. Seeing the player's ship within about 5 km she
   closes and, within 3 km with her bow on, fires a fan of four Type 95s (49 kn, 9 km) on a collision course (her estimate of course and speed
   off as the T-14s' is), then goes deep and runs; charges going off near her drive her deep too. The PCE's sonar finds her and
   her weapons can kill her (pceSubs, subHit): a Hedgehog on her hull or a charge within 25 yd sinks her; two within 60 yd do too.
   Sunk, she comes again after a quarter of an hour.
   ===================================================================================================================== */
const SUBS = (() => {
  const V = THREE.Vector3,
    L = [],
    RUN = [] /* the Type 95s running */;
  const SPEC = {
    'us-roncador': { len: 95.0, pd: 13.4, scope: [10.4, 15.85] /* x, height of the periscope's head, surfaced */ },
    'jp-i58': { len: 108.7, pd: 11.6, scope: [2.65, 13.7] },
  };
  const geoms = {};
  const geo = (id, far) => {
    const k = id + (far ? ':far' : '');
    return geoms[k] || (geoms[k] = new GX.Acc().add(MODELS.get(id, far ? { far: true } : undefined)).geometry());
  };
  /* a boat: id the model, o: { side, d, name } */
  const make = (id, o) => {
    o = o || {};
    const m = new THREE.Mesh(geo(id), new THREE.MeshLambertMaterial({ vertexColors: true }));
    GX.far(m, 0, 1200, geo(id, true));
    const sp = SPEC[id],
      wk = typeof shipWakeMesh === 'function' ? shipWakeMesh(sp.len / 78, 0.1) : null;
    if (wk) m.add(wk);
    scene.add(m);
    const s = { id, m, wk, side: o.side || 'us', name: o.name || id, len: sp.len, pd: sp.pd, scope: sp.scope, p: new V(), v: new V(), yw: 0, d: o.d || 0, dT: o.d || 0, pitch: 0, on: true, fxT: 0, sunk: false, kind: 'sub' };
    L.push(s);
    return s;
  };
  /* each frame: her depth, trim, place, what shows of her */
  const pose = (s, dt) => {
    const rate = s.sinking ? 1.2 : s.dT > s.d ? 0.45 : 0.35,
      dd = Math.max(-rate * dt, Math.min(rate * dt, s.dT - s.d));
    s.d += dd;
    const want = s.sinking ? -0.3 : Math.abs(s.dT - s.d) > 1 ? (s.dT > s.d ? -0.07 : 0.06) : 0;
    s.pitch += (want - s.pitch) * Math.min(1, dt * 0.5);
    const sea = typeof coastSea === 'function' ? coastSea() : OCEAN.Y,
      bob = s.d < 1 ? OCEAN.h(s.p.x, s.p.z, OCEAN.U.uTime.value) - sea : 0;
    s.p.y = sea - s.d;
    s.m.position.set(s.p.x, sea - s.d + bob * 0.6, s.p.z);
    s.m.rotation.set(0, s.yw, s.pitch);
    if (s.ex) s.on = typeof PT !== 'undefined' && PT.on; /* the PCE's exercise boat: out with the practice targets */
    s.m.visible = s.on && s.d < 25 + (s.sinking ? 30 : 0);
    if (s.wk) s.wk.visible = s.m.visible && s.d < 1 && s.v.length() > 1;
    /* the feather of the periscope at periscope depth, under way */
    if (s.on && Math.abs(s.d - s.pd) < 1.5 && s.v.length() > 0.8 && (s.fxT -= dt) <= 0) {
      s.fxT = 0.08;
      const x = s.p.x + Math.cos(s.yw) * s.scope[0],
        z = s.p.z - Math.sin(s.yw) * s.scope[0],
        j = () => (Math.random() - 0.5) * 0.8;
      fxAdd(new V(x + j(), sea + 0.15, z + j()), 0xf4f7f8, 0.5, 2.6 + Math.random(), 0.9, 0.25, false); /* the feather: a short plume that spreads and fades */
    }
    /* sinking: the oil and the wreckage coming up where she went down */
    if (s.sinking && (s.fxT -= dt) <= 0 && s.slickT > 0) {
      s.fxT = 0.35;
      fxAdd(new V(s.wx + (Math.random() - 0.5) * 30, sea + 0.15, s.wz + (Math.random() - 0.5) * 30), 0x2a2622, 6, 20, 25, 0, false);
    }
    if (s.slickT > 0) s.slickT -= dt;
  };
  /* she is sunk: down by the bow, oil and wreckage over the spot */
  const sink = (s) => {
    if (s.sunk) return;
    s.sunk = s.sinking = true;
    s.dT = 200;
    s.slickT = 60;
    s.wx = s.p.x;
    s.wz = s.p.z;
    s.back = 900;
    if (s.side === 'jp') {
      note('ENEMY SUBMARINE SUNK');
      if (typeof RADIO !== 'undefined') RADIO.add('LOOKOUT', 'OIL AND WRECKAGE COMING UP ASTERN! A BIG SLICK. WE GOT HIM!', { own: true });
    }
  };
  /* ---- I-58's patrol and attacks ---- */
  let I58 = null;
  /* her patrol circle: 2.5 km across water at least 30 m deep all round (the strait is mostly 20 to 60 m; the middle, between the
     bases, is the island), in the waters the PCE works, 6 to 20 km from the US base and clear of the enemy sites' guns; her depth there clears the bottom */
  const patrolC = () => {
    const us = FS.nav.find((n) => n.navy === 'us'),
      B = us ? us.O : { x: 0, z: 0 },
      sea = coastSea(),
      W = typeof ROE !== 'undefined' ? ROE.reach() : [];
    let best = null,
      bs = -1e9;
    for (let x = B.x - 20000; x <= B.x + 20000; x += 1500)
      for (let z = B.z - 20000; z <= B.z + 20000; z += 1500) {
        const dB = Math.hypot(x - B.x, z - B.z);
        if (dB < 6000) continue;
        /* clear of every enemy gun's reach (ROE.reach) by his circle's 2.5 km and 1 km more, so the PCE can hunt him without coming
           under them (the user's, 2026-11-22: PT Base Halsey moved so that she patrols out of their reach) */
        if (W.some(([wx, wz, r]) => Math.hypot(x - wx, z - wz) < r + 3500)) continue;
        let md = sea - HR(x, z);
        for (let k = 0; k < 16 && md >= 30; k++) md = Math.min(md, sea - HR(x + Math.cos(k * 0.3927) * 2500, z + Math.sin(k * 0.3927) * 2500));
        if (md < 30) continue;
        const sc = md - Math.abs(dB - 11000) / 400;
        if (sc > bs) ((bs = sc), (best = { c: new V(x, 0, z), md }));
      }
    return best || { c: new V(B.x, 0, B.z - 8000), md: 40 };
  };
  /* deep water all along a torpedo's track (a Type 95 runs at about 4 m: shoals in the way and it hits the bottom) */
  const clear = (x0, z0, x1, z1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 50);
    for (let i = 1; i < n; i++) if (HR(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n) > coastSea() - 6) return false;
    return true;
  };
  const gs = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5,
    aw = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const i58Step = (dt) => {
    const want = started && SIMS.cur.subsOn && SIMS.cur.subsOn();
    if (!want) {
      if (I58) I58.on = false;
      return;
    }
    if (!I58) {
      I58 = make('jp-i58', { side: 'jp', d: 25, name: 'I-58' });
      const pc = patrolC();
      Object.assign(I58, { c: pc.c, deep: Math.max(I58.pd + 6, Math.min(40, pc.md - 8)), R: 2500, a: Math.random() * 6.28, st: 'patrol', t: 0, upT: 120 + Math.random() * 120, rel: 0, fish: 19, hits: 0 });
    }
    const s = I58;
    s.on = true;
    if (s.sunk) {
      if ((s.back -= dt) <= 0) {
        scene.remove(s.m);
        L.splice(L.indexOf(s), 1);
        I58 = null;
      }
      return;
    }
    s.t += dt;
    s.rel = Math.max(0, s.rel - dt);
    const tgt = SIMS.cur.afloat ? pos : null,
      dx = tgt ? tgt.x - s.p.x : 1e9,
      dz = tgt ? tgt.z - s.p.z : 0,
      r = Math.hypot(dx, dz);
    let sp = 2.1 /* 4 kn */,
      yw = s.yw;
    if (s.st === 'patrol' || s.st === 'look') {
      s.a += (sp / s.R) * dt;
      const px = s.c.x + Math.cos(s.a) * s.R,
        pz = s.c.z - Math.sin(s.a) * s.R;
      yw = Math.atan2(-(pz - s.p.z), px - s.p.x);
      if (s.p.lengthSq() === 0) s.p.set(px, 0, pz);
      if (s.st === 'patrol' && (s.upT -= dt) <= 0) ((s.st = 'look'), (s.dT = s.pd), (s.upT = 90));
      else if (s.st === 'look') {
        if ((s.upT -= dt) <= 0) ((s.st = 'patrol'), (s.dT = s.deep), (s.upT = 180 + Math.random() * 180));
        else if (s.d < s.pd + 1 && r < 5000 && !s.rel) ((s.st = 'attack'), (s.dT = s.pd));
      }
    } else if (s.st === 'attack') {
      /* close her at 6 knots with the bow on; fire inside 3 km */
      sp = 3.1;
      yw = Math.atan2(-dz, dx);
      if (r > 7000) ((s.st = 'patrol'), (s.dT = s.deep));
      else if (r < 3000 && Math.abs(aw(yw - s.yw)) < 0.3 && s.fish >= 4 && clear(s.p.x, s.p.z, pos.x, pos.z)) {
        /* a collision course on her estimated course and speed (off as a periscope estimate is) */
        const est = vel.clone().multiplyScalar(1 + gs() * 0.2).applyAxisAngle(new V(0, 1, 0), gs() * 0.12),
          TS = 25.2;
        let t = r / TS;
        for (let k = 0; k < 4; k++) t = Math.hypot(dx + est.x * t, dz + est.z * t) / TS;
        const aim = Math.atan2(-(dz + est.z * t), dx + est.x * t),
          bx = s.p.x + Math.cos(s.yw) * s.len * 0.48,
          bz = s.p.z - Math.sin(s.yw) * s.len * 0.48;
        /* a fan of four, about 12 m apart at 3 km: she is covered whether she is end-on or broadside */
        for (const off of [-0.006, -0.002, 0.002, 0.006]) SITE.torps.fire(RUN, bx, bz, aim + off, { spd: TS, run: 9000 });
        s.fish -= 4;
        s.rel = 360;
        note('TORPEDO WAKES!');
        if (typeof RADIO !== 'undefined') RADIO.add('LOOKOUT', 'TORPEDO WAKES BEARING ' + (typeof raidBrg === 'function' ? raidBrg(s.p) : '') + '! FOUR OF THEM!', { own: true });
        ((s.st = 'evade'), (s.dT = s.deep), (s.upT = 240));
      }
    } else if (s.st === 'evade') {
      sp = 3.6;
      yw = Math.atan2(dz, -dx); /* away from her */
      if ((s.upT -= dt) <= 0) ((s.st = 'patrol'), (s.dT = s.deep), (s.upT = 200), (s.a = Math.atan2(-(s.p.z - s.c.z), s.p.x - s.c.x)));
    }
    if (s.fish < 4 && s.st !== 'evade') s.fish = 19; /* back to Kure and loaded again, as far as the strait is concerned */
    s.yw += Math.max(-0.04 * dt, Math.min(0.04 * dt, aw(yw - s.yw))); /* about 2.3 deg a second: a long boat turns slowly */
    s.v.set(Math.cos(s.yw) * sp, 0, -Math.sin(s.yw) * sp);
    s.p.addScaledVector(s.v, dt);
  };
  /* charges or bombs going off near a boat: how close (yards) and what it does to her */
  const burst = (p) => {
    for (const s of L) {
      if (s.side !== 'jp' || s.sunk || !s.on) continue;
      const yd = capsule(s, p) / 0.9144;
      if (yd < 25) sink(s);
      else if (yd < 60) {
        s.hits++;
        s.slickT = 20;
        s.wx = s.p.x;
        s.wz = s.p.z;
        if (s.hits >= 2) sink(s);
        else if (typeof RADIO !== 'undefined') RADIO.add('SONAR', 'CHARGE CLOSE TO THE CONTACT. OIL COMING UP. HE IS HURT.', { own: true });
      }
      if (yd < 330 && !s.sunk && s.st) ((s.st = 'evade'), (s.dT = s.deep), (s.upT = 240));
    }
  };
  /* the distance from a point to her hull (a capsule her length less 6 m, 3.3 m in radius) */
  const capsule = (s, p) => {
    const d = new V(Math.cos(s.yw), 0, -Math.sin(s.yw)),
      w = p.clone().sub(s.p),
      k = Math.max(-(s.len / 2 - 6), Math.min(s.len / 2 - 6, w.dot(d)));
    return Math.max(0, w.addScaledVector(d, -k).length() - 3.3);
  };
  return {
    L,
    make,
    sink,
    burst,
    capsule,
    i58: () => I58,
    step: (dt) => {
      i58Step(dt);
      for (const s of L) pose(s, dt);
      if (RUN.length && SITE.torps) SITE.torps.step(RUN, dt);
    },
    clear: () => {
      if (I58) (scene.remove(I58.m), L.splice(L.indexOf(I58), 1), (I58 = null));
      for (const t of RUN) scene.remove(t.o);
      RUN.length = 0;
    },
  };
})();
HOOKS.tick.push((dt) => SUBS.step(dt));
