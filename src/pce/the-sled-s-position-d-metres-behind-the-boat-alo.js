/* the sled's position d metres behind the boat along her track (d may be negative: ahead of the sled toward the boat) */
function ptTrail(o, d, v) {
  const T = o.trail;
  if (d <= 0) return v.copy(T[0].p);
  for (let i = 1; i < T.length; i++)
    if (T[i].d >= d) {
      const a = T[i - 1],
        b = T[i],
        f = (d - a.d) / Math.max(1e-6, b.d - a.d);
      return v.copy(a.p).lerp(b.p, f);
    }
  return v.copy(T[T.length - 1].p);
}
function ptTowStep(dt) {
  const tb = PT.L.find((t) => t.kind === 'ptboat'),
    ts = PT.L.find((t) => t.kind === 'sled');
  if (!tb) return;
  const o = tb.o;
  o.c.set(pos.x, 0, pos.z);
  /* along the oval at 30 knots (relative to the ship, whose motion the oval shares) */
  const dP = new THREE.Vector3().addScaledVector(o.u, -PTOW.A * Math.sin(o.th)).addScaledVector(o.w, PTOW.B * Math.cos(o.th)),
    k = o.v / Math.max(1, dP.length());
  o.th += k * dt;
  ptTowAt(o, o.th, tb.p);
  tb.v.copy(dP).multiplyScalar(k).add(vel);
  /* her track: the world positions she has passed through, newest first, with the distance back along it */
  const step = o.trail.length ? Math.hypot(tb.p.x - o.trail[0].p.x, tb.p.z - o.trail[0].p.z) : 0;
  if (step > 0) {
    for (const e of o.trail) e.d += step;
    o.trail.unshift({ p: tb.p.clone(), d: 0 });
    while (o.trail.length > 4 && o.trail[o.trail.length - 2].d > PTOW.TOW + 60) o.trail.pop();
  }
  /* the boat: planing, bow up about 3 degrees, heeled into the turn, riding the sea */
  const hd = Math.atan2(-tb.v.z, tb.v.x),
    turn = k * (PTOW.A * PTOW.B) / Math.max(1, dP.lengthSq()) /* rate of turn on the oval, rad/s */;
  /* she rides the sea (the shared RIDE: samples 9.5 m fore and aft, 2.8 m each side, a quick 3 s roll), lifted about half a metre
     as she planes, bow up about 3 degrees, heeled into the turn */
  const rd = tb.ride || (tb.ride = RIDE.make(9.5, 2.8, 3));
  RIDE.step(rd, tb.p.x, tb.p.z, Math.cos(hd), -Math.sin(hd), dt, 0);
  tb.p.y = OCEAN.Y + rd.hv + 0.5;
  tb.m.position.copy(tb.p);
  tb.m.rotation.set(rd.ro - turn * 1.5, hd, 0.05 + rd.pi, 'YXZ');
  OCEAN.place(tb.hull || (tb.hull = OCEAN.hull({ kind: 'pt', cut: 'deck' })), tb.p.x, tb.p.z, Math.cos(hd), -Math.sin(hd), o.v, tb.p.y, 0);
  tb.p.y += 1.5; /* the hit point: amidships, above the deck */
  /* the sled: on her track, 300 m astern, pointing up the track toward her */
  if (ts) {
    const s0 = ts.p.clone(),
      a = ptTrail(o, PTOW.TOW, new THREE.Vector3()),
      b = ptTrail(o, PTOW.TOW - 6, new THREE.Vector3());
    /* the sled rides the sea too (RIDE: a small raft, samples 3.5 m fore and aft and 1.2 m each side, a 2 s roll) */
    const sy = Math.atan2(-(b.z - a.z), b.x - a.x),
      sr = ts.ride || (ts.ride = RIDE.make(3.5, 1.2, 2));
    RIDE.step(sr, a.x, a.z, Math.cos(sy), -Math.sin(sy), dt, 0);
    a.y = OCEAN.Y + sr.hv + 1.6;
    ts.p.copy(a);
    ts.m.position.copy(a);
    ts.m.rotation.set(sr.ro, sy, 0.03 + sr.pi, 'YXZ');
    OCEAN.place(ts.hull || (ts.hull = OCEAN.hull({ kind: 'box', cut: 'deck' })), a.x, a.z, Math.cos(sy), -Math.sin(sy), o.v, a.y - 1.5, 0);
    if (s0.lengthSq() && dt > 0) ts.v.lerp(new THREE.Vector3().subVectors(ts.p, s0).divideScalar(dt).setY(0), Math.min(1, dt * 4));
  }
}

function ptMesh(kind) {
  const P = [],
    { part, bx, cyl } = GX;
  if (kind === 'raft') {
    /* a battle-practice target: a raft about 12 m long carrying a 10 x 7 m screen with a bull's-eye */
    P.push(part(bx(12, 0.8, 5), 0x7a6a50, 0, 0.2, 0));
    for (const x of [-4, 0, 4]) P.push(part(bx(0.2, 8, 0.2), 0x5a4a38, x, 4.2, 0));
    P.push(part(bx(10, 7, 0.08), 0xe2e2da, 0, 4.6, 0));
    P.push(part(bx(3, 3, 0.1), 0xc03020, 0, 4.6, 0));
  } else if (kind === 'sleeve') {
    /* a towed sleeve: about 9 m of orange cloth, white bands */
    P.push(part(cyl(0.7, 0.5, 9, 12), 0xf07020, 0, 0, 0, 0, 0, Math.PI / 2));
    for (const x of [-2.5, 1.5]) P.push(part(cyl(0.68, 0.64, 1, 12), 0xf4f4f0, x, 0, 0, 0, 0, Math.PI / 2));
  } else {
    P.push(part(cyl(0.7, 0.4, 10, 10), 0xc8c8b8, 0, 0, 0, 0, 0, Math.PI / 2));
    P.push(part(bx(2.2, 0.25, 14), 0xc8c8b8, 1, 0, 0));
    P.push(part(bx(1.2, 0.2, 4.4), 0xc8c8b8, -4.4, 0.2, 0));
    P.push(part(bx(1.2, 2, 0.2), 0xc8c8b8, -4.6, 1, 0));
    P.push(part(bx(0.8, 0.8, 1.4), 0xd0b020, 4.6, 0, 0));
  }
  const a = new GX.Acc();
  a.add(P, null);
  const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  m.material.userData.cs = 1;
  if (kind !== 'tug') {
    /* game mode: a marker ring that stays the same size on screen, so a target can be found at any range */
    if (!PT.ring) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      g.strokeStyle = '#ffb030';
      g.lineWidth = 5;
      g.beginPath();
      g.arc(32, 32, 26, 0, Math.PI * 2);
      g.stroke();
      PT.ring = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false, transparent: true });
    }
    const r = new THREE.Sprite(PT.ring);
    r.scale.set(0.045, 0.045, 1);
    r.position.y = kind === 'raft' ? 4 : 0;
    r.renderOrder = 5;
    r.userData.ptRing = true;
    m.add(r);
  }
  return m;
}
function ptToggle() {
  PT.on = !PT.on;
  PT.L.forEach((t) => {
    if (t.m) scene.remove(t.m);
    if (t.hull) OCEAN.unhull(t.hull);
  });
  if (PT.g) PT.g.visible = false;
  PT.L = [];
  PT.hits.raft = PT.hits.sleeve = PT.hits.sled = 0;
  if (!PT.on) return note('PRACTICE TARGETS OFF');
  PT.c.set(pos.x, 0, pos.z);
  const fx = -Math.sin(SHIP.hdg),
    fz = -Math.cos(SHIP.hdg);
  /* the rafts: 2,000, 4,000 and 6,000 yards for the 3"/50 (fine on the bow, the beam and the quarter), and two inside the
     20 mm's 1,000 yards (600 and 800 yards, off either bow), all in deep water */
  [
    [1829, 0.35, '3in'],
    [3658, 1.4, '3in'],
    [5486, -0.9, '3in'],
    [549, -0.5, '20'],
    [732, 0.8, '20'],
  ].forEach(([r, a, gun]) => {
    let x = 0,
      z = 0;
    for (let k = 0; k < 12; k++) {
      const b = a + k * 0.5;
      x = pos.x + (fx * Math.cos(b) - fz * Math.sin(b)) * r;
      z = pos.z + (fz * Math.cos(b) + fx * Math.sin(b)) * r;
      if (HR(x, z) < -15) break;
    }
    const m = ptMesh('raft');
    m.position.set(x, OCEAN.Y, z);
    m.rotation.y = Math.random() * 6;
    scene.add(m);
    PT.L.push({ kind: 'raft', p: m.position, r: 6, m, gun });
  });
  /* the tugs and their sleeves */
  /* the 40 mm's tug flies a wide circle round where the exercise began; the 20 mm's (the close-in AA) keeps station on the ship,
     circling her 450 m out at 120 m, so its sleeve passes about 470 m off: well inside the Oerlikon's 1,000 yd, wherever she steams */
  [
    [1600, 400, 140, 0, '40', false],
    [450, 120, 110, Math.PI, '20', true],
  ].forEach(([R, h, kn, a0, gun, fol]) => {
    const tug = ptMesh('tug'),
      sl = ptMesh('sleeve');
    scene.add(tug, sl);
    const o = { R, h, v: kn * 0.5144, a: a0, gun, fol, c: fol ? new THREE.Vector3(pos.x, 0, pos.z) : PT.c };
    PT.L.push({ kind: 'tug', p: tug.position, r: 6, m: tug, o });
    PT.L.push({ kind: 'sleeve', p: sl.position, r: 2, m: sl, o, gun });
  });
  /* the exercise submarine for the sonar and the depth charges: 30 m down, 4 knots, circling 1,500 m out (it is not seen) */
  PT.L.push({ kind: 'sub', p: new THREE.Vector3(), v: new THREE.Vector3(), o: { R: 1500, a: Math.random() * 6, w: (4 * 0.5144) / 1500, d: 30 } });
  ptTowStart();
  RADIO.add('TOW ONE', 'ON STATION WITH SLEEVE. COMMENCE FIRING WHEN READY. DO NOT SHOOT THE TUG.');
  RADIO.add('EXERCISE SUB', 'DIVED AND READY. 4 KNOTS, 100 FEET.');
  if (!PT.g) {
    PT.g = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3)), new THREE.LineBasicMaterial({ color: 0x333333 }));
    PT.g.frustumCulled = false;
    scene.add(PT.g);
  }
  PT.g.visible = true;
  note('PRACTICE TARGETS ON - RAFTS 600 TO 6,000 YARDS - SLEEVES OVERHEAD - PT 105 TOWING A SLED');
}
function ptUpdate(dt) {
  if (!PT.on) return;
  for (const t of PT.L) if (t.m) t.m.children.forEach((c) => c.userData.ptRing && (c.visible = !FM.use('rings')));
  const cp = PT.g.geometry.attributes.position.array;
  let n = 0;
  ptTowStep(dt);
  for (const t of PT.L) {
    if (t.kind === 'ptboat' || t.kind === 'sled') continue;
    if (t.kind === 'raft') {
      t.p.y = OCEAN.h(t.p.x, t.p.z, OCEAN.U.uTime.value) - 0.1;
      continue;
    }
    if (t.kind === 'sub') {
      const o = t.o;
      o.a += o.w * dt;
      const c = o.c || PT.c;
      t.p.set(c.x + Math.cos(o.a) * o.R, OCEAN.Y - o.d, c.z - Math.sin(o.a) * o.R);
      t.v.set(-Math.sin(o.a), 0, -Math.cos(o.a)).multiplyScalar(o.w * o.R);
      continue;
    }
    if (t.gone > 0 && (t.gone -= dt) <= 0) {
      t.m.visible = true;
      RADIO.add('TOW ' + (t.gun === '20' ? 'TWO' : 'ONE'), 'NEW SLEEVE STREAMED. COMMENCE FIRING.');
    }
    const o = t.o;
    if (t.kind === 'tug') {
      o.a += (o.v / o.R) * dt;
      if (o.fol) o.c.set(pos.x, 0, pos.z);
    }
    const a = t.kind === 'tug' ? o.a : o.a - 450 / o.R,
      y = OCEAN.Y + o.h - (t.kind === 'tug' ? 0 : 40);
    t.p.set(o.c.x + Math.cos(a) * o.R, y, o.c.z - Math.sin(a) * o.R);
    (t.v || (t.v = new THREE.Vector3())).set(-Math.sin(a), 0, -Math.cos(a)).multiplyScalar(o.v); /* its own velocity (the sleeve is 450 m round the circle behind the tug) */
    if (o.fol) t.v.x += vel.x, t.v.z += vel.z; /* the circle that keeps station on the ship moves with her */
    t.m.rotation.y = a + Math.PI / 2; /* nose (+x) along the direction of flight, (-sin a, -cos a) */
    cp[n++] = t.p.x;
    cp[n++] = t.p.y;
    cp[n++] = t.p.z;
  }
  /* PT-108's tow line, from her stern bitt to the sled's bridle */
  const tb = PT.L.find((t) => t.kind === 'ptboat'),
    ts = PT.L.find((t) => t.kind === 'sled');
  if (tb && ts) {
    const a = tb.m.localToWorld(new THREE.Vector3(...PTB.BITT)),
      b = ts.m.localToWorld(new THREE.Vector3(5.5, -1.3, 0));
    cp.set([a.x, a.y, a.z, b.x, b.y, b.z], 12);
  }
  PT.g.geometry.attributes.position.needsUpdate = true;
}
