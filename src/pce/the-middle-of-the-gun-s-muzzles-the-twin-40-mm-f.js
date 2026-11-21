/* the middle of the gun's muzzles (the twin 40 mm fires each barrel in turn) */
function gunMz(G, out) {
  const mz = G.m.d.muzzles;
  out.set(0, 0, 0);
  for (const m of mz) out.add(G.m.el.localToWorld(GUN.V[2].set(m[0], m[1], m[2])));
  return out.multiplyScalar(1 / mz.length);
}
function gunAim(G, tp, tv, out, at) {
  /* where to point the gun: fly a shell (the gun's own drag and gravity, the ship's motion added) at a guessed aim point, see where
     it passes the target's future position, move the aim point by the miss, and repeat. at(t, v3) gives the target's position t s
     ahead (a sleeve flies a circle); without it the target goes straight on at tv */
  const s = G.s,
    o = gunMz(G, new THREE.Vector3()),
    fut = (t, v) => (at ? at(t, v) : v.copy(tp).addScaledVector(tv, t)),
    q = out.copy(tp),
    sp = new THREE.Vector3(),
    sv = new THREE.Vector3(),
    tq = new THREE.Vector3(),
    miss = new THREE.Vector3();
  /* the first guess raised by the range table's elevation for that range: aimed flat at a ship 3 km off or more the first shell fell
     into the sea short of her and the solver gave up (every surface target beyond about 2.5 km showed OUT OF RANGE) */
  {
    const R = Math.hypot(tp.x - o.x, tp.z - o.z);
    if (R > 500) q.y += R * Math.tan(gunSE(s, R));
  }
  for (let it = 0; it < 10; it++) {
    sp.copy(o);
    sv.copy(q).sub(o).normalize().multiplyScalar(s.mv).add(vel);
    /* the miss is taken when the shell reaches the target's range (so it also corrects the lead, not just the line) */
    let best = -1,
      h = 0.01,
      f0 = -1; /* 1/100 s for the first 2 s, then 1/50 s: within ~10 m at the 3"/50's full range */
    const sp0 = GUN.V[0].copy(sp),
      tq0 = new THREE.Vector3();
    fut(0, tq0);
    for (let t = h; t < 70; t += h) {
      /* up to 70 s of flight: the 3"/50's longest shots (13.3 km at 43 deg) take about 63 s (30 s, the old limit, stopped the rings
         at about 10.2 km and called everything beyond it out of range) */
      h = t < 2 ? 0.01 : 0.02;
      sp0.copy(sp);
      const v = sv.length(),
        k = s.k * Math.exp(-Math.max(0, sp.y) / 9145) * v;
      sv.multiplyScalar(1 - k * h);
      sv.y -= 9.81 * h;
      sp.addScaledVector(sv, h);
      fut(t, tq);
      const f = sp.distanceTo(o) - tq.distanceTo(o);
      if (f >= 0) {
        /* between the last two steps, where the ranges were equal */
        const u = f0 < 0 ? -f0 / (f - f0) : 1;
        miss.copy(tq0).lerp(tq, u).sub(sp0.lerp(sp, u));
        best = miss.length();
        break;
      }
      f0 = f;
      tq0.copy(tq);
      if (sp.y < Math.min(OCEAN.Y, tq.y) - 80) break; /* a raft sits on the water: let the shell fly on a little below it to reach its range */
    }
    if (best < 0) return false;
    q.add(miss);
    if (best < 0.2) break;
  }
  return true;
}
