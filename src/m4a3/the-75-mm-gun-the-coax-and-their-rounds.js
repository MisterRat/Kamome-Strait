/* THE MAIN GUN AND THE COAXIAL MACHINE GUN (T3), GAME SETTINGS. Generic, playable values for now (the user's, 2026-11-26: generic
   settings first, the real figures later in one place): three kinds of round, AP, HE and SMOKE, each with a muzzle speed (mv, m/s), a
   drag factor (k: the same drag law the PCE's in-game guns and the coast in-game guns use) and what it does at the end of its flight; the ready rack
   and the floor bins; the loading times. Everything else (laying, firing, the flight, the sights' range lines, the loader, the drills)
   reads them from G75.R, so the real figures can replace these without touching the rest.
   The in-game gun is laid by the gunner (station 2) or stays where it was laid: the turret turns at up to 24 deg/s, the in-game gun elevates at up to
   5 deg/s, from -10 to +25 deg; the stabilizer (Z) holds the in-game gun's elevation in the world while the hull pitches. */
const G75 = {
  R: {
    AP: { name: 'AP', mv: 600, k: 1.1e-4, tracer: true, dmg: 1 } /* game setting */,
    HE: { name: 'HE', mv: 450, k: 0.9e-4, he: true, dmg: 1 } /* game setting */,
    SMK: { name: 'SMOKE', mv: 260, k: 1.1e-3, smoke: true, dmg: 0 } /* game setting */,
  },
  ORDER: ['AP', 'HE', 'SMK'],
  ready: { AP: 2, HE: 2, SMK: 0 } /* the turret's ready rack (4) */,
  floor: { AP: 30, HE: 62, SMK: 8 } /* the floor bins: 104 in all */,
  READY: 4,
  loaded: null /* the round in the in-game gun */,
  call: 'HE' /* the round called for next */,
  load: 0 /* time left loading */,
  loading: null,
  last: 0 /* time since the last shot */,
  idle: 0,
  rec: 0 /* the in-game gun's recoil, m */,
  trD: 0 /* the demanded bearing (turret on the hull, + left) */,
  elW: 0 /* the demanded elevation: in the world with the stabilizer on, else on the hull */,
  stab: true,
  shells: [],
  boards: [],
  hooks: [],
  coax: { n: 6750, on: false, t: 0 },
  playerLoads: false /* the player is the loader (station 3) */,
  hook(fn) {
    this.hooks.push(fn);
    return () => (this.hooks = this.hooks.filter((f) => f !== fn));
  },
};
const D2R_ = Math.PI / 180;
/* the hand-loading times: the ready rack and the floor bins (game mode half) */
const g75LoadT = (fromReady) => (fromReady ? 4 : 8) * (FM.use('load') ? 1 : 0.5);
/* the in-game gun's line in the world, and its muzzle */
function g75Dir(out) {
  const c = Math.cos(TANK.elev);
  return TANK.toW(out.set(c * Math.cos(TANK.trav), Math.sin(TANK.elev), -c * Math.sin(TANK.trav)));
}
function g75Muzzle(out) {
  TANK.mesh.updateMatrixWorld(true);
  return TANK.gun.localToWorld(out.set(3.007 - 0.95, 0, 0)) /* the muzzle: 2.06 m ahead of the trunnions */;
}
/* the flight of a round at elevation el from level ground: [range, time] where it comes back down to its own height; the reticle's
   range lines and the drills' firing tables come from this */
function gunFlight(R, el) {
  let x = 0,
    y = 0,
    vx = R.mv * Math.cos(el),
    vy = R.mv * Math.sin(el),
    t = 0;
  const h = 0.004;
  while (t < 60) {
    const v = Math.hypot(vx, vy),
      kk = R.k * Math.exp(-Math.max(0, y) / 9145) * v;
    vx -= kk * vx * h;
    vy -= (kk * vy + 9.81) * h;
    x += vx * h;
    y += vy * h;
    t += h;
    if (y < 0 && vy < 0) break;
  }
  return [x, t];
}
/* the elevation a round needs for a range on level ground (radians), from a table worked out once per round */
function gunRange(id, range) {
  const R = G75.R[id];
  if (!R.tab) {
    R.tab = [];
    for (let m = 0; m <= 160; m += 1) R.tab.push([gunFlight(R, m / 1018.6)[0], m / 1018.6]);
  }
  const T = R.tab;
  if (range <= 0) return 0;
  for (let i = 1; i < T.length; i++)
    if (T[i][0] >= range) {
      const [r0, e0] = T[i - 1],
        [r1, e1] = T[i];
      return e0 + ((e1 - e0) * (range - r0)) / (r1 - r0);
    }
  return T[T.length - 1][1];
}
/* lay the in-game gun toward its demand at the mount's rates; the stabilizer holds the elevation in the world */
function g75Lay(dt) {
  const tr = 24 * D2R_,
    er = 5 * D2R_;
  let d = ((G75.trD - TANK.trav + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  TANK.trav += Math.max(-tr * dt, Math.min(tr * dt, d * Math.min(1, dt * 8)));
  const want = Math.max(-12 * D2R_, Math.min(25 * D2R_, G75.stab ? G75.elW - DRV.pitch : G75.elW));
  TANK.elev += Math.max(-er * dt, Math.min(er * dt, want - TANK.elev));
}
/* the loader: the round called, from the ready rack if it has one, else from the floor; between shots he refills the ready rack */
function g75Loader(dt) {
  G75.last += dt;
  if (G75.loading) {
    if ((G75.load -= dt) <= 0) {
      G75.loaded = G75.loading;
      G75.loading = null;
      say75('LOADER', 'UP');
    }
    return;
  }
  if (G75.playerLoads) return;
  if (!G75.loaded && G75.last > 0.6) {
    const id = G75.call,
      fromReady = G75.ready[id] > 0;
    if (!fromReady && G75.floor[id] <= 0) return;
    if (fromReady) G75.ready[id]--;
    else G75.floor[id]--;
    G75.loading = id;
    G75.load = g75LoadT(fromReady);
    G75.idle = 0;
    return;
  }
  /* a lull: one round at a time from the floor to the ready rack, two of AP and two of HE */
  if ((G75.idle += dt) > 10) {
    for (const id of ['HE', 'AP'])
      if (G75.ready[id] < 2 && G75.floor[id] > 0 && G75.ready.AP + G75.ready.HE + G75.ready.SMK < G75.READY) {
        G75.floor[id]--;
        G75.ready[id]++;
        G75.idle = 4;
        break;
      }
  }
}
/* the interphone: what each man says (a note now; the interphone box comes with command, T4) */
const say75 = (who, txt) => note(who + ': ' + txt);
const V_ = () => new THREE.Vector3();
/* fire the 75 mm */
function g75Fire() {
  if (!G75.loaded) return note(G75.loading ? 'NOT UP YET - LOADING ' + G75.loading : 'NO ROUND IN THE GUN'), false;
  if (G75.last < 2.9) return false /* 20 rounds a minute at most */;
  const id = G75.loaded,
    R = G75.R[id],
    p = g75Muzzle(V_()),
    d = g75Dir(V_()),
    fw = TANK.toW(V_().set(1, 0, 0));
  G75.loaded = null;
  G75.last = 0;
  G75.idle = 0;
  G75.rec = 0.3;
  G75.shots = (G75.shots || 0) + 1;
  say75('GUNNER', 'ON THE WAY');
  const s = { id, R, p: p.clone(), v: d.clone().multiplyScalar(R.mv).addScaledVector(fw, DRV.v), t: 0, spr: null };
  if (R.tracer) {
    s.spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.spr.scale.set(1.4, 1.4, 1);
    s.spr.position.copy(p);
    scene.add(s.spr);
  }
  G75.shells.push(s);
  /* the flash, the blast's dust off the ground in front, the report */
  fxAdd(p.clone().addScaledVector(d, 1.2), 0xffc070, 1.4, 4.5, 0.12, 0, true);
  fxAdd(p.clone().addScaledVector(d, 3), 0x9a8a70, 2, 7, 1.4, 1.5, false);
  SND.boom(p, 1.6);
  return true;
}
/* the coax: about 500 rounds a minute while held; every fifth a tracer */
function g75Coax(dt, on) {
  const C = G75.coax;
  if (!on || C.n <= 0) return void (C.t = 0);
  C.t -= dt;
  while (C.t <= 0 && C.n > 0) {
    C.t += 60 / 500;
    C.n--;
    C.k = (C.k || 0) + 1;
    const p = g75Muzzle(V_()).add(TANK.toW(V_().set(-1.6, 0.05, -0.32))),
      d = g75Dir(V_());
    d.x += (Math.random() - 0.5) * 0.002;
    d.y += (Math.random() - 0.5) * 0.002;
    d.z += (Math.random() - 0.5) * 0.002;
    const s = { id: '30', R: { mv: 853, k: 8.65e-4, dmg: 0.25, bullet: true }, p, v: d.normalize().multiplyScalar(853), t: 0, spr: null };
    if (C.k % 5 === 0) {
      s.spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff9050, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.spr.scale.set(0.5, 0.5, 1);
      scene.add(s.spr);
    }
    if (G75.shells.length < 160) G75.shells.push(s);
  }
}
/* a board (a drill's): where segment a -> b passes through its panel, else null */
function g75Board(B, a, b) {
  const da = (a.x - B.c.x) * B.n.x + (a.y - B.c.y) * B.n.y + (a.z - B.c.z) * B.n.z,
    db = (b.x - B.c.x) * B.n.x + (b.y - B.c.y) * B.n.y + (b.z - B.c.z) * B.n.z;
  if (da * db > 0 || da === db) return null;
  const f = da / (da - db),
    p = a.clone().lerp(b, f),
    q = p.clone().sub(B.c),
    w = q.x * B.u.x + q.z * B.u.z;
  return Math.abs(w) <= B.w / 2 && Math.abs(q.y) <= B.h / 2 ? p : null;
}
/* the shells in flight: each step's segment against the boards, the targets and the ground */
function g75Shells(dt) {
  const h = 0.01,
    A = V_(),
    out = [];
  for (const s of G75.shells) {
    let left = dt,
      hit = null;
    while (left > 0 && !hit) {
      const st = Math.min(h, left);
      left -= st;
      A.copy(s.p);
      const v = s.v.length(),
        kk = s.R.k * Math.exp(-Math.max(0, s.p.y) / 9145) * v;
      s.v.multiplyScalar(1 - kk * st);
      s.v.y -= 9.81 * st;
      s.p.addScaledVector(s.v, st);
      s.t += st;
      for (const B of G75.boards) {
        const p = g75Board(B, A, s.p);
        if (p) {
          hit = { p, board: B };
          break;
        }
      }
      if (!hit)
        for (const t of T) {
          if (t.dead || !t.c) continue;
          const r = (t.s1 || 6) + 2;
          if (Math.abs(t.c.x - s.p.x) > r + 12 || Math.abs(t.c.z - s.p.z) > r + 12) continue;
          const p = PHYS.roundHits(t, A, s.p, r);
          if (p) {
            hit = { p: p.clone ? p.clone() : s.p.clone(), t };
            break;
          }
        }
      if (!hit) {
        const g = BA.GH(s.p.x, s.p.z);
        if (s.p.y <= g) {
          /* back along the step to the ground */
          let lo = 0,
            hi = 1;
          const P = V_();
          for (let i = 0; i < 10; i++) {
            const m = (lo + hi) / 2;
            P.copy(A).lerp(s.p, m);
            if (P.y > BA.GH(P.x, P.z)) lo = m;
            else hi = m;
          }
          P.copy(A).lerp(s.p, hi);
          hit = { p: P, ground: true };
        }
      }
    }
    if (s.spr) s.spr.position.copy(s.p);
    if (hit || s.t > 40) {
      if (s.spr) (scene.remove(s.spr), s.spr.material.dispose());
      if (hit) g75Impact(s, hit);
    } else out.push(s);
  }
  G75.shells = out;
}
function g75Impact(s, hit) {
  const R = s.R,
    p = hit.p;
  if (R.bullet) {
    if (hit.t) damage(hit.t, R.dmg);
    if (Math.random() < 0.5) fxAdd(p.clone(), hit.ground ? 0x8a7a60 : 0xffc060, 0.3, 1.2, 0.4, 0.5, !hit.ground);
  } else if (R.he) {
    explode(p.clone().setY(p.y + 0.5), 3.2);
    fxAdd(p.clone(), 0x5a4a38, 3, 10, 2.5, 2, false);
    for (const t of T) if (!t.dead && t.c && t.c.distanceTo(p) < 8) damage(t, R.dmg * (1 - t.c.distanceTo(p) / 8));
  } else if (R.smoke) {
    for (let i = 0; i < 6; i++) fxAdd(p.clone().add(V_().set((Math.random() - 0.5) * 8, 1 + Math.random() * 3, (Math.random() - 0.5) * 8)), 0xe8e8e2, 4, 16, 60, 0.15, false);
  } else {
    if (hit.t) damage(hit.t, R.dmg);
    spark(p.clone());
    fxAdd(p.clone(), hit.ground ? 0x8a7a60 : 0x555555, 1.5, 6, 1.5, 1.5, false);
    if (!hit.ground) SND.boom(p, 0.6);
  }
  if (!R.bullet || hit.board) for (const fn of G75.hooks) fn(s, hit);
}
/* each frame: lay the in-game gun, load, fire the coax if held, fly the rounds, recoil back */
function g75Step(dt) {
  if (!TANK.mesh) return;
  g75Lay(dt);
  g75Loader(dt);
  g75Coax(dt, G75.coax.on && started && !paused);
  g75Shells(dt);
  G75.rec = Math.max(0, G75.rec - dt * 0.9);
  TANK.gun.position.x = M4A3.G.gunX - G75.rec;
}
/* back to the start: the in-game gun fore and aft, empty, HE called, the racks full */
function g75Reset() {
  for (const s of G75.shells) if (s.spr) scene.remove(s.spr);
  Object.assign(G75, { ready: { AP: 2, HE: 2, SMK: 0 }, floor: { AP: 30, HE: 62, SMK: 8 }, loaded: null, call: 'HE', load: 0, loading: null, last: 9, idle: 0, rec: 0, trD: 0, elW: 0, stab: true, shells: [], coax: { n: 6750, on: false, t: 0 } });
  TANK.trav = TANK.elev = 0;
}
/* the round called next (Q / E at the commander's, the gunner's and the loader's stations) */
function g75Call(d) {
  const i = (G75.ORDER.indexOf(G75.call) + d + 3) % 3;
  G75.call = G75.ORDER[i];
  note('CALLED: ' + G75.R[G75.call].name);
}
/* the rounds left: [ready, floor] of one kind */
const g75Left = (id) => [G75.ready[id], G75.floor[id]];
