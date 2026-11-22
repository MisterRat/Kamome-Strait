/* the Hedgehog's 24 bombs on their spigots (four rows of six): drawn separately from the ship, so each one leaves its spigot as it
   is fired and appears as it is loaded. Each bomb: the warhead, its nose, the tail tube over the spigot and the ring fin */
function hhBombs() {
  if (!SHIPM.mesh) return;
  if (!HH.im) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x3f4a3a }),
      parts = [
        [new THREE.CylinderGeometry(0.09, 0.09, 0.42, 12), 0.1],
        [new THREE.SphereGeometry(0.09, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0.31],
        [new THREE.CylinderGeometry(0.036, 0.036, 0.42, 8), -0.31],
        [new THREE.TorusGeometry(0.07, 0.012, 5, 14).rotateX(Math.PI / 2), -0.5],
      ];
    HH.im = parts.map(([g, off]) => {
      const m = new THREE.InstancedMesh(g, mat, 24);
      m.userData.off = off;
      m.frustumCulled = false;
      SHIPM.mesh.add(m);
      return m;
    });
    HH.mask = '';
  }
  let mask = '';
  for (let k = 0; k < 24; k++) mask += k < HH.n || HH.q.some((q) => q.i === k) ? '1' : '0';
  if (mask === HH.mask) return;
  HH.mask = mask;
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    E = new THREE.Euler(),
    P = new THREE.Vector3(),
    S = new THREE.Vector3(),
    x0 = PCEM.XF(21.6),
    y0 = PCEM.hd(21.6) + 0.12;
  for (let k = 0; k < 24; k++) {
    const c = k & 3,
      r = k >> 2,
      tilt = 0.68 - c * 0.06,
      ax = Math.sin(tilt),
      ay = Math.cos(tilt),
      bx = x0 + 0.7 - c * 0.46 + 0.27,
      by = y0 + 1.02,
      z = -0.72 + r * 0.29;
    Q.setFromEuler(E.set(0, 0, -tilt));
    for (const m of HH.im) {
      const o = m.userData.off;
      P.set(bx + ax * o, by + ay * o, z);
      S.setScalar(mask[k] === '1' ? 1 : 0);
      m.setMatrixAt(k, M.compose(P, Q, S));
    }
  }
  HH.im.forEach((m) => (m.instanceMatrix.needsUpdate = true));
}
function hhStep(dt) {
  const V = THREE.Vector3;
  hhBombs();
  if (HH.q.length) {
    const m = SHIPM.mesh,
      fw = new V(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)),
      rt = new V(Math.cos(SHIP.hdg), 0, -Math.sin(SHIP.hdg));
    for (let k = HH.q.length - 1; k >= 0; k--) {
      const q = HH.q[k];
      q.t -= dt;
      if (q.t > 0) continue;
      HH.q.splice(k, 1);
      const r = q.i >> 2,
        c = q.i & 3,
        y0 = PCEM.hd(21.6) + 0.12 + 1.1,
        p0 = m.localToWorld(new V(tpXF(21.6) + 0.7 - c * 0.46 + 0.27, y0 - 0.08, -0.72 + (r % 6) * 0.29)),
        D = 200,
        T = Math.sqrt((2 * D) / 9.81),
        a = (q.i / 24) * Math.PI * 2,
        tg = p0
          .clone()
          .addScaledVector(fw, D + Math.cos(a) * 20)
          .addScaledVector(rt, Math.sin(a) * 20 + q.roll * D * 0.8)
          .addScaledVector(vel, T);
      const v = new V((tg.x - p0.x) / T, (OCEAN.Y - p0.y + 0.5 * 9.81 * T * T) / T, (tg.z - p0.z) / T);
      if (!HH.geo) {
        HH.geo = new THREE.CylinderGeometry(0.09, 0.09, 0.6, 8);
        HH.geo.rotateX(Math.PI / 2);
        HH.mat = new THREE.MeshLambertMaterial({ color: 0x3f4a3a });
      }
      const mesh = new THREE.Mesh(HH.geo, HH.mat);
      mesh.position.copy(p0);
      scene.add(mesh);
      HH.L.push({ m: mesh, p: p0, v, wet: false });
      SND.burst(700, 160, 0.12, 0.22, 0.5);
      if (FM.use('smoke')) gunFx(p0, 0xc8c8c0, 0.5, 2.5, 1.2, 0.4, false); /* a puff from the spigot (game mode: no smoke in the way) */
    }
  }
  const sub = PT.on ? PT.L.find((t) => t.kind === 'sub') : null;
  for (let i = HH.L.length - 1; i >= 0; i--) {
    const b = HH.L[i];
    if (!b.wet) {
      b.v.y -= 9.81 * dt;
      b.p.addScaledVector(b.v, dt);
      b.m.lookAt(b.p.x + b.v.x, b.p.y + b.v.y, b.p.z + b.v.z);
      if (b.p.y < OCEAN.Y) {
        b.wet = true;
        b.v.set(0, -7.0, 0); /* a Hedgehog bomb sinks at about 23 ft/s */
        aswEv('hh', b.p);
        gunSplash(b.p, { splash: 0.3, blast: null });
      }
    } else b.p.addScaledVector(b.v, dt);
    b.m.position.copy(b.p);
    /* the contact fuze: it goes off only if it strikes the hull (the sub as a capsule 64 m long, 3.3 m in radius) */
    let hit = false;
    if (b.wet && sub) {
      const d = sub.v.lengthSq() > 0.01 ? sub.v.clone().normalize() : new V(1, 0, 0),
        w = b.p.clone().sub(sub.p),
        s = Math.max(-32, Math.min(32, w.dot(d)));
      hit = w.addScaledVector(d, -s).length() < 3.3;
    }
    /* the enemy's boat (I-58): a bomb on her hull sinks her */
    let foe = null;
    if (b.wet && !hit) for (const s of SUBS.L) if (s.side === 'jp' && s.on && !s.sunk && SUBS.capsule(s, b.p) <= 0) foe = s;
    if (foe) ((hit = true), SUBS.sink(foe));
    if (hit || b.p.y < OCEAN.Y - 120 || b.p.y < HR(b.p.x, b.p.z) + 0.3) {
      scene.remove(b.m);
      HH.L.splice(i, 1);
      if (hit) {
        HH.hits++;
        aswEv('hit', b.p);
        if (ASW.ph === 'run' || ASW.drill) ASW.hh++;
        if (OODO.atk) OODO.atk.hits++; /* the OOD's attack in action */
        const top = new V(b.p.x, OCEAN.Y, b.p.z);
        for (let j = 0; j < 6; j++) gunFx(new V(b.p.x + (Math.random() - 0.5) * 5, OCEAN.Y + j * 2, b.p.z + (Math.random() - 0.5) * 5), 0xeef3f4, 4, 14, 3, 9 * (1 - j * 0.1), false);
        gunFx(top, 0xf6f8f8, 12, 30, 2.5, 0, false);
        const dd = top.distanceTo(cam.position);
        SND.burst(600, 40, 1.6, Math.min(1, 1.4 / (1 + dd / 200)), 0.6, 'lowpass', Math.min(2, dd / 1500));
        note('HEDGEHOG HIT!');
        if (ASW.ph === 'run' && ASW.hh === 1) RADIO.add('EXERCISE SUB', 'HEDGEHOG STRUCK MY HULL. YOU GOT ME.');
      }
    }
  }
}

