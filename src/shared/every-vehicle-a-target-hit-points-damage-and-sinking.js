/* every vehicle a target (the user's, 2026-11-21: all vehicles should be targetable and take damage when hit; AI damage). Each moving
   or moored vehicle the world has that was not a target yet gets an entry in T, so every weapon that strikes T strikes it: the
   P-51's guns, bombs and rockets, the PCE's shells, the blasts, and the Japanese and Allied guns (RULES OF ENGAGEMENT). They are:
   the Allied fleet (PCEs, PT boats), the craft at anchor and moored (the PT boats at PT Base Halsey, the Japanese boats and lighters),
   the merchant ships' boats (a Daihatsu, an LCM), and the vehicles at work on the airfields and bases (trucks, jeeps, the taxiing
   fighter). t.side says whose it is ('us' or 'jp'): the Allied ones are not the player's kills and no Allied gun picks them (a stray
   round still hurts them). Hit points: a ship 1.6 a metre of her length (as the merchant ships), a vehicle 8 (as a truck).
   AI damage: a ship below 60% smokes and, if she is under way on her own (the fleet), slows with her damage; at none she sinks (she
   settles by the stern over half a minute and is gone); a vehicle burns where it stops (killT). A vehicle that is destroyed stops:
   its own mover sees t.dead (o.tgt). */
var VEH = (() => {
  let done = false;
  const sink = [];
  /* whose: by where it is (the Japanese hold everything but Fletcher Field, Kamome Field and the US Navy's bases) */
  const sideAt = (x, z) =>
    Math.hypot(x, z) < 4000 ||
    (typeof ISL !== 'undefined' && Math.hypot(x - ISL.F.x, z - ISL.F.z) < 6000) ||
    FS.nav.some((s) => s.navy !== 'jp' && Math.hypot(x - s.O.x, z - s.O.z) < s.R + 600)
      ? 'us'
      : 'jp';
  const add = (m, o, f) => {
    if (!m || T.some((q) => q.m === m)) return null;
    const bb = new THREE.Box3().setFromObject(m),
      L = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z),
      t = Object.assign(
        { m, lit: null, c: m.position, r: Math.max(1.5, L / 2), dead: false, s1: Math.max(1, bb.max.y - bb.min.y), col: 0x555555, y0: m.position.y, mov: true },
        f(L),
      );
    t.hp0 = t.hp;
    T.push(t);
    if (o) o.tgt = t;
    return t;
  };
  const init = () => {
    if (done || !SITE.civ) return;
    done = true;
    if (typeof AFLD !== 'undefined')
      for (const o of AFLD.a) {
        if (o.kind === 'ship')
          (add(o.m, o, () => ({ type: 'ship', kind: 'ally', rk: o.L > 40 ? 'pce' : 'pt', side: 'us', hp: o.L * 1.6, r: o.L * 0.3 })), (o.sp0 = o.sp), o.tgt && PHYS.vessel(o.tgt, o) /* under way: what she strikes stops her (her mover is her COLL body) */);
        else if (o.kind === 'veh' || o.kind === 'plane') {
          const s = sideAt(o.x, o.z);
          add(o.m, o, () => ({ type: o.kind === 'plane' ? 'plane' : 'veh', kind: 'veh', rk: 'veh', side: s, hp: o.kind === 'plane' ? 6 : 8 }));
        }
      }
    for (const o of SITE.anch || []) {
      const s = sideAt(o.m.position.x, o.m.position.z);
      add(o.m, o, (L) => ({ type: 'ship', kind: s === 'us' ? 'ally' : 'boat', rk: s === 'us' && L > 20 ? 'pt' : 'boat', side: s, hp: L * 1.6, r: L * 0.3 }));
    }
    for (const c of SITE.civ)
      if (c.bg) {
        const s = c.t ? c.t.side || 'jp' : 'us';
        add(c.bg.m, c.bg, (L) => ({ type: 'ship', kind: 'civ', rk: 'boat', side: s, hp: L * 1.6, r: L * 0.3 }));
      }
  };
  /* a ship's end: she sinks (killT hands her over) */
  const sinkStart = (t) => sink.push({ t, y: t.m.position.y, k: 0 });
  const tick = (dt) => {
    init();
    for (let i = sink.length - 1; i >= 0; i--) {
      const s = sink[i],
        t = s.t;
      if (!t.dead) {
        sink.splice(i, 1);
        continue;
      }
      s.k += dt / 30;
      t.m.position.y = s.y - (t.s1 + 3) * Math.min(1, s.k * s.k * 1.4);
      t.m.rotation.z = Math.min(0.35, s.k * 0.6) * (t.c.x % 2 > 1 ? 1 : -1);
      if (Math.random() < dt * 4 && s.k < 0.8) fxAdd(t.c.clone().setY(s.y + t.s1 * 0.5), 0x2a2826, 4, 16, 3, 2, false);
      if (s.k >= 1) {
        t.m.visible = false;
        t.sunk = true;
        sink.splice(i, 1);
      }
    }
    /* damaged ships smoke; the fleet's slow with their damage */
    VEH.sT = (VEH.sT || 0) + dt;
    if (VEH.sT > 0.3) {
      VEH.sT = 0;
      for (const t of T)
        if (!t.dead && t.type === 'ship' && t.hp0 && t.hp < 0.6 * t.hp0 && t.m.visible !== false && t.c.distanceTo(cam.position) < 6000)
          fxAdd(t.c.clone().setY(t.c.y + t.s1 * 0.6), 0x2f2d2b, 2, 10, 2.5, 2.5, false);
      if (typeof AFLD !== 'undefined') for (const o of AFLD.a) if (o.tgt && o.sp0) o.sp = o.sp0 * (0.35 + 0.65 * Math.max(0, o.tgt.hp / o.tgt.hp0));
    }
  };
  HOOKS.tick.push(tick);
  return { init, sideAt, sinkStart };
})();
