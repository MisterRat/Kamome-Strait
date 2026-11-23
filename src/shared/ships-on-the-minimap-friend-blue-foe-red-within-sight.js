/* ---------- ships on the minimap: friend blue, foe red, within sight (the user's, 2026-11-23) ----------
   Every ship the player could see from where he is: by day a large ship out to 18 km and a small boat to 9 km, at night 5 km and 2.5 km,
   never past the weather's visibility (the fog's reach) or the horizon from his eye's height, and not behind a hill. A submarine shows
   only when she is on the surface. Each is a little hull pointing the way her bow points: blue for the Allies, red for the enemy.
   What can be seen is worked out once a second for each ship (the line of sight costs a few dozen height samples). */
const MMSHIP = (() => {
  const seen = new Map() /* the ship's mesh -> [visible, last checked (ms)] */,
    BOW = new THREE.Vector3(),
    big = (r) => r > 12;
  /* the player's eye: his aircraft, or a ship's bridge about 10 m above the sea */
  const eyeY = () => Math.max(pos.y, SEA.Y + 10);
  /* how far the player can see a ship of this size now */
  const reach = (large, hT) => {
    const night = (WX.lt || 0) > 0.35,
      eye = eyeY() - SEA.Y,
      horizon = 3570 * (Math.sqrt(eye) + Math.sqrt(hT)) /* metres, the geometric horizon for both heights */,
      fogR = scene.fog && scene.fog.far ? scene.fog.far * 1.2 : 1e9;
    return Math.min(large ? (night ? 5000 : 18000) : night ? 2500 : 9000, horizon, fogR);
  };
  /* no hill between the player's eye and her upperworks */
  const clear = (x, z, hT) => {
    const e0 = eyeY(),
      e1 = SEA.Y + hT,
      r = Math.hypot(x - pos.x, z - pos.z),
      n = Math.min(60, Math.max(2, Math.ceil(r / 300)));
    for (let i = 1; i < n; i++) {
      const f = i / n;
      if (H(pos.x + (x - pos.x) * f, pos.z + (z - pos.z) * f) > e0 + (e1 - e0) * f) return false;
    }
    return true;
  };
  const visible = (m, x, z, large) => {
    const hT = large ? 20 : 5,
      d = Math.hypot(x - pos.x, z - pos.z);
    if (d > reach(large, hT)) return false;
    const now = performance.now();
    let c = seen.get(m);
    if (!c || now - c[1] > 1000) seen.set(m, (c = [clear(x, z, hT), now]));
    return c[0];
  };
  const mark = (g, lw, x, z, bx, bz, large, us) => {
    const L = large ? 13 : 8,
      W = large ? 5 : 3.6;
    g.save();
    g.translate(x, z);
    g.rotate(Math.atan2(bx, -bz));
    g.scale(lw(1), lw(1));
    g.fillStyle = us ? '#3a8dff' : '#ff3b30';
    g.strokeStyle = 'rgba(0,0,0,.7)';
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(0, -L / 2 - 2); /* the bow */
    g.lineTo(W / 2, -L / 6);
    g.lineTo(W / 2, L / 2);
    g.lineTo(-W / 2, L / 2);
    g.lineTo(-W / 2, -L / 6);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  };
  HOOKS.mapDraw.push((g, lw) => {
    if (!started) return;
    const own = typeof SHIPM !== 'undefined' && SHIPM.mesh;
    for (const q of T) {
      if (q.type !== 'ship' || q.dead || !q.m || q.m === own) continue;
      const m = q.m;
      m.updateMatrixWorld();
      const x = m.matrixWorld.elements[12],
        z = m.matrixWorld.elements[14],
        large = big(q.r || 0);
      if (!visible(m, x, z, large)) continue;
      BOW.setFromMatrixColumn(m.matrixWorld, 0); /* the models are built bow along +x */
      mark(g, lw, x, z, BOW.x, BOW.z, large, q.side === 'us');
    }
    if (typeof SUBS !== 'undefined')
      for (const s of SUBS.L) {
        if (!s.on || s.sunk || s.d > 1.5) continue; /* only on the surface */
        if (!visible(s.m, s.p.x, s.p.z, true)) continue;
        mark(g, lw, s.p.x, s.p.z, Math.cos(s.yw), -Math.sin(s.yw), true, s.side === 'us');
      }
  });
  return { reach, seen };
})();
