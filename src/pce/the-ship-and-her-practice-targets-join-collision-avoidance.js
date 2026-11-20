/* the player's ship and the practice targets (the towing PT boat, the sled) join collision avoidance the first time they exist (HOOKS.collJoin) */
HOOKS.collJoin.push((C) => {
  try {
    if (!C.pl && typeof SHIPM !== 'undefined' && SHIPM.mesh) {
      const m = SHIPM.mesh,
        b = { sea: true, hl: 28.1, r: 5.2, mg: 6, x: m.position.x, z: m.position.z, yaw: m.rotation.y, v: 0 };
      b.get = () => {
        const nx = m.position.x,
          nz = m.position.z;
        b.v = b.px == null ? 0 : Math.hypot(nx - b.px, nz - b.pz) * 60;
        (b.px = nx), (b.pz = nz), (b.x = nx), (b.z = nz), (b.yaw = m.rotation.y);
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
