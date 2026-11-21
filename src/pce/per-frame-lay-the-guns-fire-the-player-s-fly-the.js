/* per frame: lay the guns, fire the player's, fly the shells */
function gunUpdate(dt) {
  gunInit();
  if (!GUN.M.length) return;
  const on = camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn;
  if (GUN.cur && SHIP.stn !== 4) GUN.cur = null;
  if (document.pointerLockElement === cv && !(GUN.cur && on && started && !paused && !pmOpen && !docsOpen)) gunLock(false); /* the 3"/50 is laid by right-drag, with the pointer free */ /* off the gun, in a menu or paused: the pointer is free again */
  const G = on ? GUN.cur : null,
    play = started && !paused && !RPL.on;
  /* the player's gun: keys and stick lay it (the mouse lays it from the mousemove handler) */
  if (G && play) {
    /* the mouse lays the gun (in the mousemove handler); a controller lays it with the left stick */
    const k = G.s.free ? 0.9 : 1,
      dtr = -pad.lx * G.s.trR * k,
      del = -pad.ly * G.s.elR * k;
    if (dtr || del) gunLay(dtr * dt, del * dt);
    /* the 3"/50's sight: the gun is laid above the line of sight by the superelevation for the range set on the sight */
    if (G.s.sight === 'scope') {
      if (!FM.use('range')) {
        /* game mode: a rangefinder on the point of aim. Ten times a second the line of sight is followed out from the eye to whatever
           it meets first (a hillside, the beach, the water), so land targets range right and a small move of the sight near the
           horizon does not throw the range about; above the horizon (nothing met) the range is held. The sight-setter then
           cranks it on smoothly */
        if ((GUN.rfT = (GUN.rfT || 0) - dt) <= 0) {
          GUN.rfT = 0.1;
          const R = gunRangefind(G);
          if (R) GUN.rfR = R;
        }
        if (GUN.rfR) GUN.rng += (GUN.rfR - GUN.rng) * Math.min(1, dt * 2);
      }
      /* he cranks the new range on smoothly (the gun moves, the line of sight stays where the pointer holds it) */
      const se = gunSE(G.s, GUN.rng);
      G.se += Math.max(-0.02 * dt, Math.min(0.02 * dt, se - G.se));
    } else G.se = 0;
  }
  for (const g of GUN.M) {
    const s = g.s;
    if (g === G) {
      /* the pointer brings the line of sight round at the mount's rates; the gun lies the sight's superelevation above it */
      const step = (a, b, r) => a + Math.max(-r * dt, Math.min(r * dt, b - a));
      if (g.los === undefined) g.los = g.el - g.se;
      g.tr = step(g.tr, g.trT, s.trR);
      g.los = step(g.los, g.elT, s.elR);
      g.el = Math.max(s.elMin, Math.min(s.elMax, g.los + g.se));
    } else g.los = undefined;
    g.m.tr.rotation.y = g.tr;
    g.m.el.rotation.z = g.el;
    if (g.m.sg) g.m.sg.rotation.z = g.el - g.se;
    if (s.free) g.m.el.position.y = g.m.d.pivot[1] + 0.3 * Math.max(0, Math.sin(g.el)); /* the gunner cranks the column up for high angles */
    g.rec = Math.max(0, g.rec - dt * (s.rec * 4 + 0.05));
    g.m.el.position.x = g.m.d.pivot[0] - g.rec * Math.cos(g.el);
    g.m.pm.visible = !(g === G && on);
    [g.m.o, g.m.tr, g.m.el, g.m.pm, g.m.sg].forEach((o) => o && (o.matrixAutoUpdate = o !== g.m.o));
    if (g.flT > 0 && (g.flT -= dt) <= 0) g.fl.forEach((f) => (f.visible = false));
    /* the 40 mm loaders keep the autoloaders filled, a clip at a time */
    if (s.auto)
      for (let i = 0; i < 2; i++) {
        if (g.al[i] <= s.auto - 4) {
          g.feedT[i] += dt;
          if (g.feedT[i] >= s.feed * rldK() && MAG[g.id] > 0) {
            /* a clip from the magazine (MAG) */
            const n = Math.min(4, MAG[g.id]);
            g.feedT[i] = 0;
            g.al[i] += n;
            MAG[g.id] -= n;
          }
        } else g.feedT[i] = 0;
      }
    if (s.mag && g.rl > 0 && (g.rl -= dt) <= 0) {
      g.rl = 0;
      g.rnd = Math.min(s.mag, MAG[g.id]); /* a drum filled from the magazine (MAG) */
      MAG[g.id] -= g.rnd;
    }
  }
  SHIPM.mesh.updateMatrixWorld(true);
  if (G) G.cut = !gunClear(G);
  hwInd(false);
  /* fire */
  if (G && play) {
    const s = G.s,
      trig = kb('guns') || pad.fire || GUN.rmb;
    /* the shell cam: fire again and it cuts back to the gun; let go of the trigger with shells in the air and it starts */
    if (trig && SCAM.on) SCAM.on = false;
    if (!trig && GUN.trig0 && SCAM.want && GUN.B.some((b) => b.own)) scamStart();
    GUN.trig0 = trig;
    G.ft = Math.max(-0.001, G.ft - dt);
    const dry = MAG[G.id] <= 0 && (s.mag ? G.rnd <= 0 : s.auto ? G.al[0] + G.al[1] === 0 : true); /* her magazine empty and nothing ready */
    if (trig && (G.cut || dry || (s.mag && G.rl > 0) || (s.auto && G.al[0] + G.al[1] === 0)) && SHIP.t - (GUN.blkT || 0) > 1.5) {
      /* say why the gun is not firing */
      GUN.blkT = SHIP.t;
      note(
        G.cut
          ? 'CUTOUT - THE LINE OF FIRE IS ON THE SHIP'
          : dry
            ? 'MAGAZINE EMPTY - REARM AT A US BASE'
            : s.mag
              ? 'CHANGING DRUM'
              : 'LOADERS FILLING THE AUTOLOADERS',
      );
    }
    if (trig && !G.cut) {
      let n = 0;
      while (G.ft <= 0 && n++ < 6) {
        if (s.mag) {
          if (G.rnd <= 0) {
            if (!G.rl) G.rl = s.reload * rldK();
            break;
          }
          G.rnd--;
          gunFire(G, 0);
          if (G.rnd === 0) G.rl = s.reload * rldK();
        } else if (s.auto) {
          const b = G.al[G.bar] > 0 ? G.bar : G.al[1 - G.bar] > 0 ? 1 - G.bar : -1;
          if (b < 0) break;
          G.al[b]--;
          gunFire(G, b);
          G.bar = 1 - b;
          G.ft += s.dt / 2;
          continue;
        } else {
          if (MAG[G.id] <= 0) break; /* a round from the magazine for each shot (hand loaded) */
          MAG[G.id]--;
          gunFire(G, 0);
        }
        G.ft += s.dt * (s.hand ? rldK() : 1);
      }
    }
  }
  /* the shells */
  const B = GUN.B;
  let nl = 0;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i],
      s = b.s;
    b.a.copy(b.p);
    const sp = b.v.length(),
      r = s.k * Math.exp(-Math.max(0, b.p.y) / 9145) * sp;
    b.v.multiplyScalar(1 - r * dt);
    b.v.y -= 9.81 * dt;
    b.p.addScaledVector(b.v, dt);
    b.t += dt;
    b.r += sp * dt;
    let dead = b.t > s.life;
    /* the 40 mm's self-destruct, and the 3"/50's VT fuze near an aircraft */
    if (!dead && s.sd && b.r > s.sd) {
      gunBurst(b.p, s, true);
      dead = true;
    }
    if (!dead && ptHit(b.a, b.p, s)) dead = true;
    if (!dead && raidHit(b.a, b.p, s)) dead = true;
    /* the air-support fighters (AIRSUP, either side): a kill zone as the raiders' (the VT fuze's, or 6 m) */
    if (!dead)
      for (const u of AIRSUP.L)
        if (u.up && !u.down && b.a.distanceToSquared(u.p) < 90000 && segHit(b.a, b.p, u.p, s.vt || 6)) {
          gunBurst(b.p, s, true);
          AIRSUP.hurt(u, s.hit > 10 ? 4 : s.hit > 3 ? 2 : 1);
          dead = true;
          break;
        }
    if (!dead && s.vt)
      for (const e of EN)
        if (!e.dying && segHit(b.a, b.p, e.p, s.vt)) {
          gunBurst(b.p, s, true);
          damageE(e, s.hit * 2);
          dead = true;
          break;
        }
    if (!dead)
      for (const e of EN)
        if (!e.dying && segHit(b.a, b.p, e.p, 6.5)) {
          damageE(e, s.hit);
          if (s.blast) gunBurst(b.p, s, true);
          dead = true;
          break;
        }
    if (!dead)
      for (const t of T) {
        if (t.dead || b.a.distanceToSquared(t.c) > (t.r + 80) ** 2) continue;
        if (segHit(b.a, b.p, t.c, t.r)) {
          damage(t, s.hit);
          gunBurst(b.p, s, false);
          dead = true;
          break;
        }
      }
    if (!dead) {
      const hr = HR(b.p.x, b.p.z);
      if (hr < OCEAN.Y) {
        if (b.p.y < OCEAN.Y) {
          gunSplash(b.p, s);
          dead = true;
        }
      } else if (b.p.y < hr) {
        b.p.y = hr;
        gunBurst(b.p, s, false);
        dead = true;
      }
    }
    if (dead) {
      B.splice(i, 1);
      continue;
    }
    if (s.tracer && b.r < s.trOut && nl < 600) {
      const o = nl * 6,
        c = s.tracer,
        f = Math.min(1, (s.trOut - b.r) / 300);
      GUN.pos[o] = b.p.x;
      GUN.pos[o + 1] = b.p.y;
      GUN.pos[o + 2] = b.p.z;
      GUN.pos[o + 3] = b.p.x - b.v.x * 0.03;
      GUN.pos[o + 4] = b.p.y - b.v.y * 0.03;
      GUN.pos[o + 5] = b.p.z - b.v.z * 0.03;
      for (let j = 0; j < 2; j++) {
        GUN.col[o + j * 3] = c[0] * f;
        GUN.col[o + j * 3 + 1] = c[1] * f * (j ? 0.6 : 1);
        GUN.col[o + j * 3 + 2] = c[2] * f * (j ? 0.4 : 1);
      }
      nl++;
    }
  }
  GUN.geo.setDrawRange(0, nl * 2);
  GUN.geo.attributes.position.needsUpdate = true;
  GUN.geo.attributes.color.needsUpdate = true;
  /* splashes, bursts and smoke */
  for (let i = GUN.F.length - 1; i >= 0; i--) {
    const f = GUN.F[i];
    f.t += dt;
    const k = f.t / f.life;
    if (k >= 1) {
      scene.remove(f.s);
      f.s.material.dispose();
      GUN.F.splice(i, 1);
      continue;
    }
    const sz = f.s0 + (f.s1 - f.s0) * Math.sqrt(k);
    f.s.scale.set(sz, sz, 1);
    f.s.material.opacity = 1 - k * k;
    f.s.position.y += f.vy * dt;
    f.vy *= 1 - Math.min(1, dt * 0.8);
  }
}
