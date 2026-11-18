/* ---------- aftermath: burning wrecks, smoke columns, craters and scorch marks that last for the rest of the flight ---------- */
const AF = {
  g: null,
  em: [],
  sm: [],
  fl: [],
  nx: 0,
  nd: 0,
  t_: 0,
  CD: 160,
  M: new THREE.Matrix4(),
  Q0: new THREE.Quaternion(),
  P: new V(),
  S: new V(),
  build() {
    if (this.g) return;
    this.g = new THREE.Group();
    scene.add(this.g);
    const disc = (col, op, ro) => {
      const m = new THREE.InstancedMesh(
        new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: op,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
        this.CD,
      );
      m.count = 0;
      m.frustumCulled = false;
      m.renderOrder = ro;
      this.g.add(m);
      return m;
    };
    this.rim = disc(0x5a4630, 0.5, 1);
    this.scr = disc(0x0e0b08, 0.8, 2);
    for (let i = 0; i < 150; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, color: 0x222222, transparent: true, depthWrite: false }),
      );
      s.visible = false;
      this.g.add(s);
      this.sm.push({ s, on: false, t: 0, life: 1, vx: 0, vy: 0, vz: 0, s0: 1, s1: 1 });
    }
    for (let i = 0; i < 20; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: i % 2 ? 0xffd070 : 0xff7a20,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      s.visible = false;
      this.g.add(s);
      this.fl.push({ s, used: false });
    }
  },
  fx() {
    return QL.t().fx;
  },
  /* a dark disc on the ground: scorch mark (r) with a lighter ring of thrown earth (rim) */
  mark(x, z, r, rim) {
    if (!this.g || HR(x, z) < 0.5) return;
    let y = -1e9;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566,
        d = i ? r * 0.8 : 0;
      y = Math.max(y, H(x + Math.cos(a) * d, z + Math.sin(a) * d));
    }
    const i = this.nd++ % this.CD;
    this.S.set(r, 1, r);
    this.P.set(x, y + 0.2, z);
    this.M.compose(this.P, this.Q0, this.S);
    this.scr.setMatrixAt(i, this.M);
    this.S.set(rim || r * 1.35, 1, rim || r * 1.35);
    this.P.y = y + 0.12;
    this.M.compose(this.P, this.Q0, this.S);
    this.rim.setMatrixAt(i, this.M);
    this.scr.count = this.rim.count = Math.min(this.CD, this.nd);
    this.scr.instanceMatrix.needsUpdate = this.rim.instanceMatrix.needsUpdate = true;
  },
  /* a burning wreck: flames and a smoke column; sz scales the whole thing, life is in seconds */
  fire(p, sz, life, wet) {
    if (!this.g || (!wet && HR(p.x, p.z) < 0.5)) return;
    const max = [3, 6, 10][this.fx()];
    while (this.em.length >= max) this.drop(this.em.shift());
    const fl = this.fl.filter((f) => !f.used).slice(0, 2);
    fl.forEach((f) => (f.used = true));
    this.em.push({ x: p.x, y: wet ? p.y : H(p.x, p.z), z: p.z, sz, life, t: 0, acc: 0, fl });
  },
  drop(e) {
    e.fl.forEach((f) => ((f.used = false), (f.s.visible = false)));
  },
  clear() {
    this.em.forEach((e) => this.drop(e));
    this.em.length = 0;
    this.sm.forEach((m) => ((m.on = false), (m.s.visible = false)));
    this.nd = 0;
    if (this.g) {
      this.scr.count = this.rim.count = 0;
      this.scr.instanceMatrix.needsUpdate = this.rim.instanceMatrix.needsUpdate = true;
    }
  },
  /* a destroyed target: scorch under it, and it burns according to what it was */
  target(t) {
    this.build();
    const big = t.type == 'fuel' || t.type == 'tanker',
      sz = Math.max(0.5, Math.min(1.8, t.r / 9)) * (big ? 1.3 : 1);
    this.mark(t.c.x, t.c.z, Math.max(3, t.r * 1.15 + 1.5), 0);
    this.fire(t.c, sz, big ? 420 : t.type == 'ship' ? 300 : t.kind == 'bld' ? 240 : t.kind == 'veh' ? 110 : 150, t.type === 'ship');
  },
  crater(p, r) {
    this.build();
    this.mark(p.x, p.z, r * 0.8, r * 1.5);
  },
  wreck(p, sz, life) {
    this.build();
    this.mark(p.x, p.z, 4 * sz, 6.5 * sz);
    this.fire(p, sz, life);
  },
  update(dt) {
    if (!this.g) return;
    this.g.visible = true;
    const fx = this.fx(),
      wx = WX.wx_ || 0,
      wz = WX.wz_ || 0,
      lite = fx === 0 ? 0.5 : fx === 1 ? 0.8 : 1;
    for (let i = this.em.length - 1; i >= 0; i--) {
      const e = this.em[i];
      e.t += dt;
      if (e.t >= e.life) {
        this.drop(e);
        this.em.splice(i, 1);
        continue;
      }
      const k = e.t < e.life * 0.6 ? 1 : 1 - (e.t - e.life * 0.6) / (e.life * 0.4),
        dx = e.x - pos.x,
        dz = e.z - pos.z,
        near = dx * dx + dz * dz < 12000 * 12000;
      e.fl.forEach((f, j) => {
        f.s.visible = near;
        if (!near) return;
        const w = e.sz * (j ? 6 : 11) * (0.8 + 0.3 * Math.sin(this.t_ * (9 + j * 5) + e.x)) * (0.35 + 0.65 * k);
        f.s.scale.set(w, w * 1.3, 1);
        f.s.position.set(e.x, e.y + w * 0.5, e.z);
        f.s.material.opacity = (0.55 + 0.35 * Math.sin(this.t_ * 13 + j)) * (0.3 + 0.7 * k);
      });
      if (!near) continue;
      e.acc += dt * 1.5 * lite * (0.25 + 0.75 * k);
      while (e.acc >= 1) {
        e.acc -= 1;
        let m = null;
        for (let n = 0; n < this.sm.length; n++) {
          const c = this.sm[(this.nx + n) % this.sm.length];
          if (!c.on) {
            m = c;
            this.nx = (this.nx + n + 1) % this.sm.length;
            break;
          }
        }
        if (!m) break;
        const g = 0.07 + Math.random() * 0.16;
        m.on = true;
        m.t = 0;
        m.life = 11 + Math.random() * 4;
        m.vx = wx * 0.85 + (Math.random() - 0.5) * 2;
        m.vz = wz * 0.85 + (Math.random() - 0.5) * 2;
        m.vy = 8 + Math.random() * 4;
        m.s0 = 5 * e.sz;
        m.s1 = (30 + Math.random() * 18) * e.sz;
        m.s.material.color.setRGB(g, g, g * 0.95);
        m.s.position.set(e.x + (Math.random() - 0.5) * 3 * e.sz, e.y + 3 * e.sz, e.z + (Math.random() - 0.5) * 3 * e.sz);
        m.s.visible = true;
      }
    }
    this.t_ = (this.t_ || 0) + dt;
    for (const m of this.sm) {
      if (!m.on) continue;
      m.t += dt;
      if (m.t >= m.life) {
        m.on = false;
        m.s.visible = false;
        continue;
      }
      const u = m.t / m.life,
        s = m.s0 + (m.s1 - m.s0) * Math.sqrt(u);
      m.s.position.x += m.vx * dt;
      m.s.position.y += m.vy * dt;
      m.s.position.z += m.vz * dt;
      m.s.scale.set(s, s, 1);
      m.s.material.opacity = Math.min(1, m.t / 0.7) * (1 - u) * 0.62;
    }
  },
  hide() {
    if (this.g) this.g.visible = false;
  },
};
