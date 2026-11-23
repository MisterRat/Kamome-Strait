/* the player's ship and the practice targets (the towing PT boat, the sled) join collision avoidance the first time they exist (HOOKS.collJoin) */
HOOKS.collJoin.push((C) => {
  try {
    if (!C.pl && typeof SHIPM !== 'undefined' && SHIPM.mesh) {
      /* her place and heading straight from the ship's own state (pos, SHIP.hdg), not from a mesh that may be replaced (the user's,
         2026-11-23: a PT boat ran through her: her body had stayed where she started, so the others kept clear of empty sea) */
      const b = { sea: true, hl: 28.1, r: 5.2, mg: 6, x: pos.x, z: pos.z, yaw: SHIP.hdg + Math.PI / 2, v: 0 };
      b.get = () => {
        b.x = pos.x;
        b.z = pos.z;
        b.yaw = SHIP.hdg + Math.PI / 2; /* COLL's yaw heads along (cos, -sin); her heading along (-sin hdg, -cos hdg) */
        b.v = Math.abs(SHIP.u); /* her speed through the water (m/s), whatever the frame rate */
        b.on = SIMS.on('pce') && !(typeof SDM !== 'undefined' && SDM.lost);
      };
      C.pl = C.add(b);
    }
  } catch (e) {}
  try {
    if (typeof PT !== 'undefined' && PT.L)
      for (const t of PT.L)
        if (!t.cb && t.m && (t.kind === 'ptboat' || t.kind === 'sled')) {
          const big = t.kind === 'ptboat',
            b = { sea: true, hl: big ? 12.2 : 4.2, r: big ? 3.2 : 1.5, mg: 4, x: 0, z: 0, yaw: 0, v: 0 };
          b.get = () => ((b.x = t.m.position.x), (b.z = t.m.position.z), (b.yaw = t.m.rotation.y), (b.v = t.v && t.v.length ? t.v.length() : 0));
          t.cb = C.add(b);
        }
  } catch (e) {}
});
