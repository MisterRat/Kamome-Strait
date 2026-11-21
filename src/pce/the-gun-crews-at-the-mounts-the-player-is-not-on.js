/* the gun crews at the mounts the player is not on (RULES OF ENGAGEMENT, the user's, 2026-11-21: all military guns fire at targets
   of opportunity). Each crew picks its own target twice a second: an enemy aircraft in its reach first (with enemy planes on), else
   the nearest enemy warship or shore gun in its reach (with the shore enemies on): the 20 mm 1,400 m at aircraft and 1,000 m at the
   surface, the twin 40 mm 3,600 m, the 3"/50 7,000 m at aircraft and 12,000 m at the surface. It lays the mount on the point the shells
   will meet the target (gunAim, the guns' own ballistics) at the mount's rates and within its stops, with a layer's error of its own,
   and fires as the player's gun does: the 20 mm from its drum, the 40 mm from its autoloaders, the 3"/50 a round at a time, all from
   her magazines (MAG). Never at a mount whose line of fire is on the ship (the firing cutouts). */
const CREW = { t: 0, msgT: 0 };
function crewStep(dt) {
  if (!SIMS.on('pce') || !started || paused || crashed || (typeof RPL !== 'undefined' && RPL.on) || typeof ENEMY === 'undefined') return;
  gunInit();
  const planes = ENEMY.has('planes'),
    shore = ENEMY.has('shore');
  if (!planes && !shore) return;
  const V3 = THREE.Vector3,
    REACH = { 20: [1400, 1000], 40: [3600, 3600], '3in': [7000, 12000] },
    manned = camMode == 1 && SHIP.stn === 5 ? GUN.cur : null;
  for (const g of GUN.M) {
    if (g === manned) continue;
    const s = g.s,
      [rA, rS] = REACH[g.id] || [2000, 2000],
      mz = gunMz(g, new V3());
    /* the target, twice a second */
    if ((g.ct = (g.ct || 0) - dt) <= 0) {
      g.ct = 0.5;
      let best = null,
        bd = 1e9;
      if (planes)
        for (const e of RAID.L) if (e.st !== 'down' && e.p.distanceTo(mz) < Math.min(rA, bd)) ((bd = e.p.distanceTo(mz)), (best = { p: e.p, v: e.v, e }));
      if (!best && shore) {
        for (const t of T)
          if (!t.dead && t.side !== 'us' && t.type === 'ship' && t.kind !== 'civ' && t.m.visible !== false) {
            const d = t.c.distanceTo(mz);
            if (d < Math.min(rS, bd)) ((bd = d), (best = { p: t.c, t }));
          }
        for (const q of AA.gun)
          if (!q.t.dead && !q.ship) {
            const d = q.piv.distanceTo(mz);
            if (d < Math.min(rS * 0.66, bd)) ((bd = d), (best = { p: q.piv, t: q.t }));
          }
        for (const q of COAST.G)
          if (!q.t.dead) {
            const d = q.p.distanceTo(mz);
            if (d < Math.min(rS, bd)) ((bd = d), (best = { p: q.p, t: q.t }));
          }
      }
      if (best && (!g.tg || g.tg.p !== best.p))
        g.err = new V3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 2).multiplyScalar(bd * 0.004); /* the layers' error */
      g.tg = best;
      g.aimOk = false;
      if (best) {
        /* its motion: an aircraft's own; a ship's measured between looks */
        let tv = new V3();
        if (best.v) tv = best.v;
        else if (best.t) {
          const L0 = best.t.crewL;
          if (L0 && SHIP.t > L0.t)
            tv = best.p
              .clone()
              .sub(L0.p)
              .divideScalar(SHIP.t - L0.t);
          best.t.crewL = { p: best.p.clone(), t: SHIP.t };
        }
        const q = new V3();
        if (gunAim(g, best.p, tv, q, null)) {
          q.add(g.err || new V3());
          /* into the mount's own frame: train (about its vertical, from its rest bearing) and elevation */
          const d = q.sub(mz),
            Qi = new THREE.Quaternion();
          g.m.o.getWorldQuaternion(Qi).invert();
          d.applyQuaternion(Qi);
          const tr = Math.atan2(-d.z, d.x),
            el = Math.atan2(d.y, Math.hypot(d.x, d.z));
          if ((!s.trLim || Math.abs(tr) <= s.trLim) && el >= s.elMin && el <= s.elMax) ((g.aTr = tr), (g.aEl = el), (g.aimOk = true));
        }
      }
    }
    if (!g.aimOk) continue;
    /* lay the mount at its rates */
    const dTr = Math.atan2(Math.sin(g.aTr - g.tr), Math.cos(g.aTr - g.tr)),
      dEl = g.aEl - g.el;
    g.tr += Math.max(-s.trR * dt, Math.min(s.trR * dt, dTr));
    g.el += Math.max(-s.elR * dt, Math.min(s.elR * dt, dEl));
    g.trT = g.tr;
    g.elT = g.el;
    /* fire when laid, clear of the ship */
    g.ft = Math.max(-0.001, (g.ft || 0) - dt);
    if (Math.abs(dTr) > 0.01 || Math.abs(dEl) > 0.01 || g.ft > 0 || !gunClear(g)) continue;
    if (CREW.msgT <= 0) {
      CREW.msgT = 45;
      RADIO.add('GUNNERY', 'GUNS ENGAGING, ' + (g.tg.e ? 'AIRCRAFT' : 'SURFACE TARGET') + ' BEARING ' + raidBrg(g.tg.p) + '.', { own: true });
    }
    if (s.mag) {
      if (g.rl > 0) continue;
      if (g.rnd <= 0) {
        if (MAG[g.id] > 0) g.rl = s.reload * rldK();
        continue;
      }
      g.rnd--;
      gunFire(g, 0);
      if (g.rnd === 0 && MAG[g.id] > 0) g.rl = s.reload * rldK();
      g.ft += s.dt;
    } else if (s.auto) {
      const b = g.al[g.bar] > 0 ? g.bar : g.al[1 - g.bar] > 0 ? 1 - g.bar : -1;
      if (b < 0) continue;
      g.al[b]--;
      gunFire(g, b);
      g.bar = 1 - b;
      g.ft += s.dt / 2;
    } else {
      if (MAG[g.id] <= 0) continue;
      MAG[g.id]--;
      gunFire(g, 0);
      g.ft += s.dt * (s.hand ? rldK() : 1);
    }
  }
  CREW.msgT = Math.max(0, CREW.msgT - dt);
}
if (SIMS.on('pce')) HOOKS.tick.push((dt) => crewStep(dt));
