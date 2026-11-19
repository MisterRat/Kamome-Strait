/* ---------- collision avoidance: every ship, boat and vehicle that moves looks ahead along its course and gives way ----------
   A body is { x, z, yaw (three.js: it heads along (cos yaw, -sin yaw)), hl (half its length), r (half its beam), v (m/s), sea (a ship
   or boat: true; a vehicle or a man on land: false), fixed (anchored, moored, parked, a jetty: it never moves out of the way), prio
   (with two vehicles, the lower waits), get (optional: a function that refreshes x, z, yaw, v from its mesh, called once a frame) }.
   COLL.add(b) registers it (and returns it); COLL.remove(b).
   COLL.look(b, L): the nearest body in b's way within L metres of its bow: those whose outline (circles of radius r along its length)
     comes within r + b.r + b.mg (b's margin) of b's track line; { d: metres from b's bow to it, lat: how far it lies to b's
     starboard (m), o, head: it is coming straight at b } or null.
   COLL.steer(b, dt, L): the answer for a body on a fixed track (a patrol's racetrack, a route): it keeps b.off, the metres it stands to
     starboard of its track, and b.slow (0..1, a factor on its speed). Blocked: it moves its offset out to a clear lane (to port of
     anything to starboard and the other way; head-on, both to starboard, as at sea) at a gentle sideways speed, and slows, then
     stops, if the way stays shut close ahead; clear for a while: it eases back onto its track. b.dyaw is the small heading change
     its sideways drift makes (add it to the heading). Returns b.
   COLL.avoid(b, L): the answer for a body steering to a point (a waypoint): { turn: radians to add to its wanted heading (positive is
     to port), slow }. */
const COLL = (() => {
  const B = [];
  let frame = 0;
  const fresh = (o) => {
    if (o.get && o.fr !== frame) (o.fr = frame), o.get();
  };
  /* the nearest body in b's way, and how far across b's path it spreads: lo..hi, the starboard offsets of its outline's circles in the
     reach ahead (so b can pass the WHOLE of it, a long ship lying across her track as much as a buoy) */
  const look = (b, L, ex) => {
    if (b.get) fresh(b);
    const hx = Math.cos(b.yaw),
      hz = -Math.sin(b.yaw),
      nx = -hz,
      nz = hx,
      mg = b.mg == null ? 4 : b.mg;
    let best = null;
    for (const o of B) {
      if (o === b || o === ex || o === b.self || o.on === false || !!o.sea !== !!b.sea) continue;
      if (Math.abs(o.x - b.x) > L + b.hl + o.hl + 60 || Math.abs(o.z - b.z) > L + b.hl + o.hl + 60) continue;
      fresh(o);
      const n = Math.max(1, Math.round(o.hl / Math.max(o.r * 1.5, 1))),
        oc = Math.cos(o.yaw),
        os = -Math.sin(o.yaw),
        need = o.r + b.r + mg;
      let d = Infinity,
        lo = Infinity,
        hi = -Infinity;
      for (let i = -n; i <= n; i++) {
        const t = (o.hl * i) / n,
          rx = o.x + oc * t - b.x,
          rz = o.z + os * t - b.z,
          along = rx * hx + rz * hz - b.hl,
          lat = rx * nx + rz * nz;
        if (along < -o.r - 2 * b.hl || along > L) continue;
        lo = Math.min(lo, lat);
        hi = Math.max(hi, lat);
        if (along > -o.r - b.hl * 0.5 && Math.abs(lat) <= need) d = Math.min(d, along);
      }
      if (d === Infinity) continue;
      if (!best || d < best.d) best = { d: Math.max(0, d), lat: (lo + hi) / 2, lo, hi, o, need, head: !o.fixed && o.v > 0.5 && oc * hx + os * hz < -0.7 };
    }
    return best;
  };
  /* which way to pass it: head-on, both to starboard (as at sea); else the side that needs the smaller move, kept until it is past */
  const side = (b, q, L) => {
    if (b.passO === q.o) return b.passS;
    let s = q.head ? 1 : q.hi + q.need <= q.need - q.lo ? 1 : -1;
    if (!q.head) {
      /* is the lane on that side clear of anything else moored or anchored? if not, pass on the other side */
      const lane = (sd) => {
        const d = shift(q, sd),
          v = { x: b.x - Math.sin(b.yaw) * 0 + Math.sin(b.yaw) * d, z: b.z + Math.cos(b.yaw) * d, yaw: b.yaw, hl: b.hl, r: b.r, mg: b.mg, sea: b.sea, self: b };
        const r = look(v, L || 4 * b.hl, q.o);
        return !r || !r.o.fixed;
      };
      if (!lane(s) && lane(-s)) s = -s;
    }
    b.passO = q.o;
    b.passS = s;
    return s;
  };
  const shift = (q, s) => (s > 0 ? q.hi + q.need : -(q.need - q.lo)); /* the move to starboard that clears it */
  /* is anything abeam of b on side dir (+1 starboard, -1 port) within its clearance (alongside her, from her stern to her bow)? */
  const abeam = (b, dir) => {
    const hx = Math.cos(b.yaw),
      hz = -Math.sin(b.yaw),
      nx = -hz,
      nz = hx,
      mg = b.mg == null ? 4 : b.mg;
    for (const o of B) {
      if (o === b || o.on === false || !!o.sea !== !!b.sea) continue;
      if (Math.abs(o.x - b.x) > b.hl + o.hl + 200 || Math.abs(o.z - b.z) > b.hl + o.hl + 200) continue;
      fresh(o);
      const n = Math.max(1, Math.round(o.hl / Math.max(o.r * 1.5, 1))),
        oc = Math.cos(o.yaw),
        os = -Math.sin(o.yaw),
        need = o.r + b.r + mg;
      for (let i = -n; i <= n; i++) {
        const t = (o.hl * i) / n,
          rx = o.x + oc * t - b.x,
          rz = o.z + os * t - b.z,
          along = rx * hx + rz * hz,
          lat = (rx * nx + rz * nz) * dir;
        if (Math.abs(along) <= b.hl + o.r && lat > 0 && lat < need + 6) return true;
      }
    }
    return false;
  };
  const steer = (b, dt, L) => {
    const q = look(b, L),
      v = Math.max(0.5, b.v || 0),
      maxOff = b.maxOff == null ? 4 * b.hl + 60 : b.maxOff;
    if (b.off == null) (b.off = 0), (b.offT = 0), (b.slow = 1), (b.clr = 99);
    if (q) {
      b.clr = 0;
      b.offT = Math.max(-maxOff, Math.min(maxOff, b.off + shift(q, side(b, q, L))));
    } else if ((b.clr += dt) > (b.tclr || (2 * b.hl + 60) / v + 6)) (b.offT = 0), (b.passO = null);
    const rate = Math.max(0.8, 0.25 * v),
      d0 = b.off,
      dir = Math.sign(b.offT - b.off);
    if (!(dir && abeam(b, dir))) b.off += Math.max(-rate * dt, Math.min(rate * dt, b.offT - b.off)); /* never sideways into a ship alongside */
    b.dyaw = dt > 0 ? -Math.atan2((b.off - d0) / dt, v) : 0;
    /* slow, then stop, while the way is still shut close ahead */
    const stop = b.stopD == null ? b.hl + 15 : b.stopD;
    const want = q && q.lo < q.need && q.hi > -q.need ? Math.max(0, Math.min(1, (q.d - stop) / (stop * 2 + 30))) : 1;
    b.slow += (want - b.slow) * Math.min(1, dt * 2);
    return b;
  };
  const avoid = (b, L) => {
    const q = look(b, L);
    if (!q) {
      b.passO = null;
      return { turn: 0, slow: 1, q };
    }
    const s = side(b, q, L),
      gap = Math.abs(shift(q, s)),
      turn = -s * Math.min(0.9, Math.atan2(gap, Math.max(q.d, b.hl) + 5)),
      stop = b.stopD == null ? b.hl + 8 + q.o.r : b.stopD;
    return { turn, slow: Math.max(0, Math.min(1, (q.d - stop) / (stop * 2 + 20))), q };
  };
  return {
    B,
    add: (b) => (B.push(b), b),
    remove: (b) => {
      const i = B.indexOf(b);
      if (i >= 0) B.splice(i, 1);
    },
    /* once a frame; the player's own ship and the practice targets (the towing PT boat, the sled) join the first time they exist:
       the others keep clear of them (they do not steer for them) */
    tick() {
      frame++;
      try {
        if (!this.pl && typeof SHIPM !== 'undefined' && SHIPM.mesh) {
          const m = SHIPM.mesh,
            b = { sea: true, hl: 28.1, r: 5.2, mg: 6, x: m.position.x, z: m.position.z, yaw: m.rotation.y, v: 0 };
          b.get = () => {
            const nx = m.position.x,
              nz = m.position.z;
            b.v = b.px == null ? 0 : Math.hypot(nx - b.px, nz - b.pz) * 60;
            (b.px = nx), (b.pz = nz), (b.x = nx), (b.z = nz), (b.yaw = m.rotation.y);
          };
          this.pl = this.add(b);
        }
      } catch (e) {}
      try {
        if (typeof PT !== 'undefined' && PT.L)
          for (const t of PT.L)
            if (!t.cb && t.m && (t.kind === 'ptboat' || t.kind === 'sled')) {
              const big = t.kind === 'ptboat',
                b = { sea: true, hl: big ? 12.2 : 4.2, r: big ? 3.2 : 1.5, mg: 4, x: 0, z: 0, yaw: 0, v: 0 };
              b.get = () => ((b.x = t.m.position.x), (b.z = t.m.position.z), (b.yaw = t.m.rotation.y), (b.v = t.v && t.v.length ? t.v.length() : 0));
              t.cb = this.add(b);
            }
      } catch (e) {}
    },
    look,
    steer,
    avoid,
  };
})();
