/* the bandit is the shared Ki-84 Hayate (THE KI-84 HAYATE block), gear up, with its propeller in a group of its own that spins */
const KI84GEO = {};
function buildEnemy() {
  const g = new THREE.Group(),
    inner = new THREE.Group();
  g.add(inner);
  if (!KI84GEO.air) {
    KI84GEO.air = new GX.Acc().add(KI84.parts({ gear: 'up', prop: false })).geometry();
    KI84GEO.far = new GX.Acc().add(KI84.parts({ gear: 'up', prop: false, far: true })).geometry() /* its distant form (the builder at lower detail) */;
    KI84GEO.prop = new GX.Acc().add(KI84.blades(0)).geometry();
    KI84GEO.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  }
  /* the model's nose is +x; the bandit flies along -z */
  const body = GX.far(new THREE.Mesh(KI84GEO.air, KI84GEO.mat), 0, 1000, KI84GEO.far) /* beyond 1 km its distant form */;
  body.rotation.y = Math.PI / 2;
  inner.add(body);
  const pilot = makePilot();
  pilot.position.set(0, 0.45, 1.2); /* in the seat under the hood */
  inner.add(pilot);
  const prop = new THREE.Group();
  prop.position.set(0, 0, -KI84.HUB);
  inner.add(prop);
  const pm = new THREE.Mesh(KI84GEO.prop, KI84GEO.mat);
  pm.rotation.y = Math.PI / 2;
  prop.add(pm);
  return { g, inner, prop, pilot };
}
function damageE(e, d) {
  if (e.dying) return;
  e.hp -= d;
  if (e.hp <= 0) {
    e.dying = true;
    e.t = 0;
    e.v = e.fwd.clone().multiplyScalar(e.sp);
    airKills++;
    /* some bandits jump: the pilot leaves the burning aircraft and floats down under a parachute */
    if (e.p.y - H(e.p.x, e.p.z) > 250 && Math.random() < BAIL_ENEMY) {
      e.pilot.visible = false;
      spawnChutist(e.p.clone(), e.v.clone().addScaledVector(UPV, 3));
      note('BANDIT DOWN - PILOT BAILED OUT');
    } else note('BANDIT DOWN');
    explode(e.p.clone(), 12);
  }
}
function spawnEnemy() {
  if (!started || crashed || paused) return;
  if (EN.filter((e) => !e.dying).length >= MAXEN) {
    note('BANDIT STILL IN THE AREA - LB TO CLEAR');
    return;
  }
  const nw = performance.now();
  if (!RPL.sim && nw - lastSpawn < 1500) return;
  lastSpawn = nw;
  const f = new V(fwd.x, 0, fwd.z);
  if (f.lengthSq() < 1e-4) f.set(0, 0, -1);
  f.normalize().applyAxisAngle(UPV, (Math.random() - 0.5) * Math.PI * 1.3);
  let p = null;
  for (let k = 0; k < 10 && !p; k++) {
    const ff = k ? f.clone().applyAxisAngle(UPV, (Math.random() - 0.5) * Math.PI * 1.3) : f,
      c = pos.clone().addScaledVector(ff, 1800 + Math.random() * 800);
    c.y = Math.max(pos.y + (Math.random() - 0.5) * 300, H(c.x, c.z) + 200);
    if (c.y - pos.y < 350 || k == 9) p = c;
  }
  banditAt(p).duel = true; /* the one the player calls up: a duel (it breaks off only when damaged, RULES OF ENGAGEMENT) */
  note('BANDIT!');
  SND.beep(880, 0.15);
}
/* a bandit at p, turned toward the player (spawnEnemy's, and the fighters an enemy base scrambles: BASEAIR) */
function banditAt(p) {
  const b = buildEnemy();
  Object.assign(b, {
    p,
    fwd: pos.clone().sub(p).normalize(),
    sp: Math.max(60, 125 * DIFF.f),
    hp: DIFF.hp,
    hp0: DIFF.hp /* RULES OF ENGAGEMENT: it breaks off when damaged past half */,
    dying: false,
    t: 0,
    ev: 0,
    side: 1,
    dive: false,
    bank: 0,
    fireT: 0,
    bt: Math.random() * 3,
    tr: 0,
    v: null,
  });
  {
    const f0 = b.fwd,
      r0 = new V().crossVectors(f0, UPV).normalize(),
      u0 = new V().crossVectors(r0, f0);
    m4.makeBasis(r0, u0, f0.clone().negate());
    b.q = new Q().setFromRotationMatrix(m4);
    b.v = f0.clone().multiplyScalar(b.sp);
    b.ctl = { p: 0, r: 0 };
  }
  b.g.position.copy(p);
  scene.add(b.g);
  EN.push(b);
  return b;
}
function clearEnemies() {
  EN.forEach((e) => scene.remove(e.g));
  EN.length = 0;
  EB.length = 0;
  egeo.setDrawRange(0, 0);
}
function eFire(e, dist) {
  if (EB.length >= MAXE - 4) return;
  const right = new V().crossVectors(e.fwd, UPV).normalize();
  [-1, 1].forEach((s) => {
    const o = e.p
        .clone()
        .addScaledVector(e.fwd, 4)
        .addScaledVector(right, s * 1.6),
      tt = dist / 820,
      lead = pos.clone().addScaledVector(vel, tt);
    lead.y += 4.9 * tt * tt;
    const a = lead.sub(o).normalize();
    const S = DIFF.spread;
    a.x += (Math.random() - 0.5) * S;
    a.y += (Math.random() - 0.5) * S;
    a.z += (Math.random() - 0.5) * S;
    EB.push({ p: o, v: a.normalize().multiplyScalar(820), t: 0 });
  });
}
