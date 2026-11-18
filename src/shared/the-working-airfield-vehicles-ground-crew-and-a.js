/* ---------- the working airfield: vehicles, ground crew and a taxiing fighter that move about the apron ---------- */
const AFLD = {
  a: [],
  /* opt: { stops: seconds to stand at each waypoint, hose: [x, z offset] } - a truck that stops beside each aircraft and runs a fuel hose out to it */
  add(P, pts, sp, wait, kind, opt) {
    const a = new GX.Acc();
    a.add(P, GX.xf(0, 0, 0, 0));
    const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    const y0 = (opt && opt.y) || 0.12; /* height of the ground it stands on (the island airfield is higher) */
    m.position.set(pts[0][0], y0, pts[0][1]);
    scene.add(m);
    const o = { y0, m, pts, sp, wait, kind, i: 1, dir: 1, w: wait * Math.random(), v: 0, yaw: 0, x: pts[0][0], z: pts[0][1], init: false, opt, at: 0 };
    if (opt && opt.hose) {
      o.hs = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x1b1b1a }));
      o.hs.visible = false;
      scene.add(o.hs);
    }
    this.a.push(o);
  },
  /* the repair-test routine: a fighter taxis to the hangar, stops, a mechanic walks out and inspects it, walks back in, and the fighter
     taxis out to a run-up spot for a test before coming back. cfg: path (run-up spot first, hangar stand last), door, spot, stand heading */
  addRepair(PP, MP, cfg) {
    const mk = (P, x, z) => {
      const a = new GX.Acc();
      a.add(P, GX.xf(0, 0, 0, 0));
      const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
      m.position.set(x, 0.12, z);
      scene.add(m);
      return { m, ctl: true, init: false, v: 0, yaw: 0, x, z, pts: [[x, z]] };
    };
    const P0 = cfg.path[0],
      pl = mk(PP, P0[0], P0[1]),
      man = mk(MP, cfg.door[0], cfg.door[1]);
    pl.kind = 'plane';
    man.kind = 'walk';
    man.m.visible = false;
    this.a.push(pl, man);
    this.rp = { pl, man, cfg, ph: 6, t: 3, k: 1 };
  },
  /* one step of a scripted mover: turn toward the point, roll once lined up; true on arrival */
  mv(o, tx, tz, dt, sp, rate, walk) {
    const dx = tx - o.x,
      dz = tz - o.z,
      d = Math.hypot(dx, dz);
    if (d < 0.6) return true;
    let err = Math.atan2(-dz, dx) - o.yaw;
    err = Math.atan2(Math.sin(err), Math.cos(err));
    o.yaw += Math.max(-rate * dt, Math.min(rate * dt, err));
    const go = walk ? 1 : Math.max(0, 1 - Math.abs(err) / 0.7);
    o.v += (sp * go - o.v) * Math.min(1, 2.5 * dt);
    const st = Math.min(d, o.v * dt);
    o.x += (dx / d) * st;
    o.z += (dz / d) * st;
    o.m.position.set(o.x, 0.12 + (walk ? Math.abs(Math.sin(this_t(o))) * 0.05 : 0), o.z);
    o.m.rotation.y = o.yaw;
    return false;
  },
  repair(dt) {
    const R = this.rp;
    if (!R) return;
    const { pl, man, cfg } = R,
      path = cfg.path,
      last = path.length - 1;
    R.t += dt;
    const near = !crashed && pos.y < 20 && Math.hypot(pos.x - pl.x, pos.z - pl.z) < 40; /* give way to the player */
    if (R.ph === 0) {
      /* taxi in to the hangar stand */
      if (!near && this.mv(pl, path[R.k][0], path[R.k][1], dt, 5, 0.7)) {
        if (R.k === last) (R.ph = 1), (R.t = 0), (pl.v = 0);
        else R.k++;
      }
    } else if (R.ph === 1) {
      /* the engine stops; after a moment the mechanic comes out of the hangar */
      if (R.t > 2.5) {
        man.x = cfg.door[0];
        man.z = cfg.door[1];
        man.yaw = 0;
        man.m.visible = true;
        R.ph = 2;
      }
    } else if (R.ph === 2) {
      if (this.mv(man, cfg.spot[0], cfg.spot[1], dt, 1.4, 4, true)) (R.ph = 3), (R.t = 0), (man.yaw = cfg.face);
    } else if (R.ph === 3) {
      /* he looks the aircraft over */
      man.m.rotation.y = man.yaw;
      man.m.position.y = 0.12;
      if (R.t > 8) R.ph = 4;
    } else if (R.ph === 4) {
      if (this.mv(man, cfg.door[0], cfg.door[1], dt, 1.4, 4, true)) {
        man.m.visible = false;
        R.ph = 5;
        R.t = 0;
        R.k = last - 1;
      }
    } else if (R.ph === 5) {
      /* taxi out to the run-up spot */
      if (R.t > 2 && !near && this.mv(pl, path[R.k][0], path[R.k][1], dt, 5, 0.7)) {
        if (R.k === 0) (R.ph = 6), (R.t = 0), (pl.v = 0);
        else R.k--;
      }
    } else if (R.ph === 6) {
      /* a pause at the run-up spot (the engine test), then back in */
      if (R.t > 7) {
        R.ph = 0;
        R.k = 1;
      }
    }
  },
  /* a ship on a straight run of open water, found by searching rings around the airfield (deterministic) */
  addShip(P, L, r0, r1, sp, seed, yo, wy) {
    let k = seed * 7919 + 13;
    const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647),
      deep = (x, z) => HR(x, z) < -12;
    for (let tries = 0; tries < 500; tries++) {
      const a = rnd() * 6.2832,
        r = r0 + rnd() * (r1 - r0),
        d = rnd() * 3.1416,
        cx = Math.cos(a) * r,
        cz = 300 + Math.sin(a) * r,
        len = 1600 + rnd() * 1400,
        ux = Math.cos(d),
        uz = Math.sin(d);
      if (this.a.some((o) => o.kind === 'ship' && Math.hypot(o.pts[0][0] - cx, o.pts[0][1] - cz) < 1800)) continue;
      let ok = true;
      for (let i = 0; ok && i <= 13; i++) {
        const t = -len / 2 - 250 + (len + 500) * (i / 13),
          x = cx + ux * t,
          z = cz + uz * t;
        for (const l of [-250, 0, 250]) if (!deep(x - uz * l, z + ux * l)) ok = false;
      }
      if (!ok) continue;
      const pts = [
        [cx - ux * len * 0.5, cz - uz * len * 0.5],
        [cx + ux * len * 0.5, cz + uz * len * 0.5],
      ];
      const g = new GX.Acc();
      g.add(P, GX.xf(0, 0, 0, 0));
      const m = new THREE.Mesh(g.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
      const wk = shipWakeMesh(L / 78, wy === undefined ? -1.3 : wy); /* the same painted wake as the patrol boat, scaled to the ship (one shared texture) */
      m.add(wk);
      m.position.set(pts[0][0], yo === undefined ? -6.4 : yo, pts[0][1]);
      scene.add(m);
      this.a.push({ m, pts, sp, wait: 0, kind: 'ship', y0: yo, i: 1, dir: 1, w: 0, v: sp, yaw: Math.atan2(-uz, ux), x: pts[0][0], z: pts[0][1], init: false, ph: rnd() * 6, L });
      return true;
    }
    return false;
  },
  update(dt) {
    for (const o of this.a) {
      if (!o.init) {
        o.init = true;
        o.m.matrixAutoUpdate = true; /* the scenery's matrices were frozen when it was built */
        if (o.hs) o.hs.matrixAutoUpdate = true;
      }
      if (o.ctl) continue; /* the repair routine drives these */
      if (o.hs) {
        /* fuelling: while the truck stands at an aircraft a hose lies from its side to the wing root */
        const sp = o.pts[o.at],
          on = o.w > 0 && Math.hypot(sp[0] - o.x, sp[1] - o.z) < 1.5;
        o.hs.visible = on;
        if (on) {
          const ax = o.x + 1.3,
            az = o.z + 0.6,
            bx = o.opt.hose[0],
            bz = sp[1] + o.opt.hose[1],
            L = Math.hypot(bx - ax, bz - az);
          o.hs.position.set((ax + bx) / 2, 0.8, (az + bz) / 2);
          o.hs.scale.set(L, 1, 1);
          o.hs.rotation.y = Math.atan2(-(bz - az), bx - ax);
        }
      }
      const tg = o.pts[o.i],
        dx = tg[0] - o.x,
        dz = tg[1] - o.z,
        d = Math.hypot(dx, dz);
      let hold = o.w > 0;
      if (hold) o.w -= dt;
      /* give way to the player's aircraft, on the ground or just above it */
      if (o.kind !== 'ship' && !crashed && pos.y < 20 && Math.hypot(pos.x - o.x, pos.z - o.z) < (o.kind === 'plane' ? 40 : 26)) hold = true;
      if (d < (o.kind === 'ship' ? 60 : 0.6) && o.opt && o.opt.loop) {
        o.i = (o.i + 1) % o.pts.length; /* a patrol: round and round */
        continue;
      }
      if (d < (o.kind === 'ship' ? 60 : 0.6)) {
        if (o.opt) o.at = o.i; /* arrived at this waypoint */
        o.i += o.dir;
        if (o.i < 0 || o.i >= o.pts.length) {
          o.dir = -o.dir;
          o.i += 2 * o.dir;
          o.w = o.wait * (0.6 + 0.8 * Math.random());
        } else if (o.opt && o.opt.stops) o.w = o.opt.stops * (0.8 + 0.4 * Math.random());
        continue;
      }
      /* turn toward the next point, and only roll forward once roughly lined up */
      let want = Math.atan2(-dz, dx),
        err = want - o.yaw;
      err = Math.atan2(Math.sin(err), Math.cos(err));
      const rate = o.kind === 'ship' ? 0.07 : o.kind === 'walk' ? 4 : o.kind === 'plane' ? 0.7 : 1.4;
      o.yaw += Math.max(-rate * dt, Math.min(rate * dt, err));
      const go = hold ? 0 : o.kind === 'ship' ? 1 : Math.max(0, 1 - Math.abs(err) / 0.7);
      o.v += (o.sp * go - o.v) * Math.min(1, 2.5 * dt);
      const st = Math.min(d, o.v * dt);
      o.x += (dx / d) * st;
      o.z += (dz / d) * st;
      if (o.kind === 'ship') {
        /* she rides the ocean's waves (RIDE): the sample points from her length (0.43 x) and her sides 0.08 x it (0.45 of a beam about 0.18 of her length), roll period by size */
        if (!o.ride) {
          const L = o.L || 56;
          o.ride = RIDE.make(0.43 * L, 0.08 * L, L < 35 ? 4 : 8);
        }
        RIDE.step(o.ride, o.x, o.z, Math.cos(o.yaw), -Math.sin(o.yaw), dt, 0);
        o.m.position.set(o.x, (o.y0 === undefined ? -6.4 : o.y0) + o.ride.hv, o.z);
        o.m.rotation.set(o.ride.ro, o.yaw, o.ride.pi, 'YXZ');
        continue;
      }
      o.m.position.set(o.x, o.y0 + (o.kind === 'walk' ? Math.abs(Math.sin(this_t(o))) * 0.05 : 0), o.z);
      o.m.rotation.y = o.yaw;
    }
    this.repair(dt);
  },
};
let _afT = 0;
function this_t(o) {
  return o.x * 2.2 + o.z * 2.2 + _afT;
}
