/* firing */
function fireGun(i, l) {
  if (B.length >= MAXB) return;
  const p = l.clone().applyQuaternion(q).add(pos),
    d = pos.clone().addScaledVector(fwd, 350).sub(p).normalize();
  d.x += (Math.random() - 0.5) * 0.004;
  d.y += (Math.random() - 0.5) * 0.004;
  B.push({ p, v: d.multiplyScalar(880).add(vel), t: 0 });
}
function worldOf(m) {
  return m.getWorldPosition(new V());
}
const RK_GEO = new THREE.CylinderGeometry(0.15, 0.15, 3.4, 8).rotateX(Math.PI / 2),
  RK_MAT = new THREE.MeshBasicMaterial({ color: 0xe6e6d0 }),
  FL_MAT = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffa040,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }),
  BM_GEO = new THREE.SphereGeometry(0.3, 12, 8);
function fireRocket() {
  if (!started || crashed || paused || rkN >= 6) return;
  const m = rkMesh[ORD[rkN++]];
  m.visible = false;
  const p = worldOf(m),
    v = vel.clone().addScaledVector(fwd, 60),
    d0 = fwd.clone();
  const r = new THREE.Mesh(RK_GEO, RK_MAT);
  const f = new THREE.Sprite(FL_MAT);
  f.scale.set(10, 10, 1);
  f.position.z = 2.4;
  r.add(f);
  r.position.copy(p);
  scene.add(r);
  RK.push({ m: r, p, v, d: d0, t: 0, tr: 0 });
  SND.rocket();
}
function dropBomb() {
  if (!started || crashed || paused || bmN >= 2) return;
  const m = bmMesh[bmN++];
  m.visible = false;
  const p = worldOf(m);
  const b = new THREE.Mesh(BM_GEO, m.material);
  b.scale.set(1, 1, 3.2);
  b.position.copy(p);
  scene.add(b);
  BM.push({ m: b, p, v: vel.clone(), t: 0 });
  SND.bomb();
}
function ammoTot() {
  return Math.round(ammo.reduce((a, b) => a + b, 0));
}
function updWeapons(dt) {
  plane.updateMatrixWorld(true);
  const firing = (kb('guns') || pad.fire) && !crashed && started;
  let any = false;
  gunLoc.forEach((l, i) => {
    if (firing && ammo[i] > 0) {
      gunT[i] += dt;
      while (gunT[i] >= 0.075 && ammo[i] > 0) {
        gunT[i] -= 0.075;
        ammo[i]--;
        fireGun(i, l);
        any = true;
      }
    } else gunT[i] = 0.075 - i * 0.0125;
    flashS[i].visible = !!(firing && ammo[i] > 0 && Math.random() < 0.6);
  });
  SND.guns(any);
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i],
      a = b.p.clone();
    b.t += dt;
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    let dead = b.t > 1.8;
    if (!dead && b.p.y < H(b.p.x, b.p.z)) {
      dead = true;
      if (Math.random() < 0.3) spark(b.p);
    }
    if (!dead)
      for (const t of T) {
        if (t.dead || a.distanceToSquared(t.c) > (t.r + 40) ** 2) continue;
        if (segHit(a, b.p, t.c, t.r)) {
          damage(t, 1);
          dead = true;
          if (Math.random() < 0.35) spark(b.p);
          break;
        }
      }
    if (!dead)
      for (const e of EN) {
        if (e.dying || a.distanceToSquared(e.p) > 3600) continue;
        if (segHit(a, b.p, e.p, 6.5)) {
          damageE(e, 1);
          dead = true;
          if (Math.random() < 0.5) spark(b.p);
          break;
        }
      }
    if (!dead && typeof AIRSUP !== 'undefined')
      for (const u of AIRSUP.L) {
        /* the air-support fighters of either side (a P-51 of ours hit is the player's own doing) */
        if (u.down || !u.up || a.distanceToSquared(u.p) > 3600) continue;
        if (segHit(a, b.p, u.p, 6.5)) {
          AIRSUP.hurt(u, 0.25);
          dead = true;
          if (Math.random() < 0.5) spark(b.p);
          break;
        }
      }
    if (dead) B.splice(i, 1);
  }
  for (let i = 0; i < B.length; i++) {
    const b = B[i],
      o = i * 6;
    bpos[o] = b.p.x;
    bpos[o + 1] = b.p.y;
    bpos[o + 2] = b.p.z;
    bpos[o + 3] = b.p.x - b.v.x * 0.022;
    bpos[o + 4] = b.p.y - b.v.y * 0.022;
    bpos[o + 5] = b.p.z - b.v.z * 0.022;
  }
  bgeo.setDrawRange(0, B.length * 2);
  bgeo.attributes.position.needsUpdate = true;
  for (let i = RK.length - 1; i >= 0; i--) {
    const r = RK[i],
      a = r.p.clone();
    r.t += dt;
    if (r.t < 1.2) r.v.addScaledVector(r.d, 300 * dt);
    r.v.y -= 9.8 * dt * (r.t > 0.5 ? 1 : 0.3);
    r.p.addScaledVector(r.v, dt);
    r.m.position.copy(r.p);
    r.m.quaternion.setFromUnitVectors(new V(0, 0, -1), r.v.clone().normalize());
    r.tr += dt;
    if (r.tr > 0.025) {
      r.tr = 0;
      fxAdd(r.p, 0xf2f2f2, 3.5, 13, 2.2, 1, false);
    }
    let hit = r.p.y < H(r.p.x, r.p.z) || r.t > 15;
    if (!hit)
      for (const t of T) {
        if (!t.dead && segHit(a, r.p, t.c, t.r + 1.5)) {
          hit = true;
          break;
        }
      }
    if (!hit)
      for (const e of EN) {
        if (!e.dying && segHit(a, r.p, e.p, 9)) {
          hit = true;
          break;
        }
      }
    if (hit) {
      explode(r.p.clone(), 10);
      blast(r.p, 22, 60);
      if (r.p.y < H(r.p.x, r.p.z) + 1 && !RPL.busy) AF.crater(r.p, 2.6);
      scene.remove(r.m);
      RK.splice(i, 1);
    }
  }
  for (let i = BM.length - 1; i >= 0; i--) {
    const b = BM[i];
    b.t += dt;
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    b.m.position.copy(b.p);
    b.m.quaternion.setFromUnitVectors(new V(0, 0, -1), b.v.clone().normalize());
    if (b.p.y < H(b.p.x, b.p.z) || b.t > 60) {
      explode(b.p.clone(), 28);
      blast(b.p, 75, 500);
      if (!RPL.busy) AF.crater(b.p, 9);
      scene.remove(b.m);
      BM.splice(i, 1);
    }
  }
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i];
    f.t += dt;
    const k = f.t / f.life;
    if (k >= 1) {
      scene.remove(f.s);
      f.s.material.dispose();
      FX.splice(i, 1);
      continue;
    }
    const s = f.s0 + (f.s1 - f.s0) * k;
    f.s.scale.set(s, s, 1);
    f.s.material.opacity = 1 - k;
    f.s.position.y += f.vy * dt;
  }
}
function resetWeapons() {
  ammo = AMMO0.slice();
  rkN = 0;
  bmN = 0;
  killed = 0;
  rkMesh.forEach((m) => (m.visible = true));
  bmMesh.forEach((m) => (m.visible = true));
  B.length = 0;
  [...RK, ...BM].forEach((o) => scene.remove(o.m));
  RK.length = 0;
  BM.length = 0;
  FX.forEach((f) => scene.remove(f.s));
  FX.length = 0;
  try {
    AF.clear();
  } catch (e) {}
  try {
    AA.bl.length = 0; /* shells in flight, and the gun crews start fresh */
    AA.gun.forEach((g) => ((g.acq = 0), (g.mag = 30), (g.rl = 0)));
  } catch (e) {}
  T.forEach((t) => {
    t.dead = false;
    t.hp = t.hp0;
    if (t.sunk) ((t.sunk = false), (t.m.visible = true)); /* a sunk ship afloat again */
    t.m.scale.y = 1;
    t.m.position.y = t.type === 'ship' && t.k0 !== undefined ? SEA.WL + t.k0 + t.s1 / 2 : t.y0 !== undefined ? t.y0 : H(t.c.x, t.c.z) + t.s1 / 2; /* a ship back on her waterline, anything else where it was set down */
    if (t.type === 'ship') t.m.rotation.z = 0;
    t.m.traverse((o) => {
      if (o.userData.wake) o.visible = true;
      else if (o.userData.c0 !== undefined) o.material.color.set(o.userData.c0);
    });
  });
  clearEnemies();
  php = 100;
  airKills = 0;
  hitF = 0;
}

