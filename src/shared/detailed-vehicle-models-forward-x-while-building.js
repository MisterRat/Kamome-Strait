/* detailed vehicle models (forward = +x while building, then turned to +z and fitted to the target's box) */
const VM = (() => {
  const Z = Math.PI / 2,
    { cyl, bx, part } = GX,
    sph = () => GX.sph(10),
    cache = {}; /* one geometry per model type, shared by every vehicle/building of that type */
  const wheel = (x, z, r, w) => [
    part(cyl(r, r, w, 12), 0x151515, x, r, z, Z),
    part(cyl(r * 0.5, r * 0.5, w + 0.02, 10), 0x6a6e70, x, r, z, Z),
  ];
  const lights = (x, y, w, c) => [-1, 1].map((s) => part(sph(), c || 0xf2e9b8, x, y, s * w, 0, 0, 0, 0.09, 0.09, 0.09));
  const olive = 0x56603f,
    tan = 0x8b8667,
    dk = 0x2d2f30,
    gl = 0x1d2a33;
  /* ---- buildings: built to the target's exact footprint (x = width, z = length, y up, standing on the ground) ---- */
  const prism = (w, h, d) => {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(w / 2, 0);
    sh.lineTo(0, h);
    sh.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  };
  const gable = (P, w, d, y0, rise, wall, roof, over) => {
    const a = Math.atan2(rise, w / 2),
      pl = Math.hypot(w / 2, rise) + (over || 0.3);
    P.push(part(prism(w, rise, d), wall, 0, y0, 0));
    P.push(
      part(bx(pl, 0.22, d + (over || 0.3) * 2), roof, -w / 4, y0 + rise / 2 + 0.05, 0, 0, 0, a),
      part(bx(pl, 0.22, d + (over || 0.3) * 2), roof, w / 4, y0 + rise / 2 + 0.05, 0, 0, 0, -a),
      part(bx(0.5, 0.3, d + 0.3), 0x3f4246, 0, y0 + rise + 0.1, 0),
    );
  };
  const crate = (x, y, z, s, c, ry) => part(bx(s, s, s), c, x, y + s / 2, z, 0, ry || 0);
  const barrel = (x, z, c) => part(cyl(0.3, 0.3, 0.88, 10), c, x, 0.44, z);
  const sandbags = (P, x, z, len, ry, rows) => {
    const c = Math.cos(ry),
      s = Math.sin(ry);
    for (let r = 0; r < (rows || 2); r++)
      for (let i = 0; i < len; i++) {
        const o = (i - len / 2) * 0.9 + (r % 2) * 0.45;
        P.push(part(bx(0.85, 0.38, 0.5), r % 2 ? 0x9c8c5e : 0xa89a68, x + c * o, 0.2 + r * 0.38, z - s * o, 0, ry));
      }
  };
  const win = (P, x, y, z, ry, w, h) => {
    P.push(part(bx(w + 0.24, h + 0.24, 0.1), 0xe4e0d4, x, y, z, 0, ry), part(bx(w, h, 0.14), 0x20303c, x, y, z, 0, ry));
  };
  const warehouse = () => {
    const P = [],
      W = 24,
      D = 14,
      c = 0x8d9296;
    P.push(part(bx(W + 0.1, 0.8, D + 0.1), 0x6d6a60, 0, 0.4, 0), part(bx(W, 5, D), c, 0, 2.5, 0));
    gable(P, W, D, 5, 3, c, 0x5b6065, 0.4);
    for (let i = 0; i <= 24; i++)
      for (const s of [-1, 1]) P.push(part(bx(0.12, 4.2, 0.14), 0x7c8185, -11.6 + i, 2.9, s * (D / 2 + 0.07)));
    P.push(
      part(bx(8.4, 4.2, 0.22), 0x4a4f54, 3, 2.2, D / 2 + 0.1),
      part(bx(10, 0.25, 0.4), 0x2b2d2f, 3, 4.5, D / 2 + 0.25),
      part(bx(1.4, 2.4, 0.2), 0x3a4a3a, -8, 1.3, D / 2 + 0.1),
    );
    for (let i = 0; i < 4; i++) P.push(part(bx(0.08, 4.1, 0.1), 0x2b2d2f, 0.2 + i * 2.2, 2.2, D / 2 + 0.22));
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++) win(P, -9 + i * 4.4, 3.6, s * (D / 2 + 0.05), s > 0 ? 0 : Math.PI, 1.4, 0.8);
    P.push(
      part(bx(6, 1.0, 2.4), 0x5a5d5f, -6, 0.5, D / 2 + 1.2),
      part(bx(7, 0.1, 0.9), 0x3d4043, -6, 1.05, D / 2 + 0.6),
      crate(-8, 1.0, D / 2 + 1.4, 1.1, 0x8b6c3c),
      crate(-6.6, 1.0, D / 2 + 1.2, 1.1, 0x7a5f35, 0.3),
      crate(-7.4, 2.1, D / 2 + 1.3, 1.0, 0x8b6c3c),
      barrel(-4.2, D / 2 + 1.0, 0x56603f),
      barrel(-3.5, D / 2 + 1.2, 0x8b4a2b),
      crate(11, 0, D / 2 + 0.9, 1.4, 0x7a5f35),
      crate(12.3, 0, D / 2 + 1.0, 1.1, 0x8b6c3c),
      crate(11.6, 1.4, D / 2 + 0.9, 1.0, 0x7a5f35),
    );
    P.push(
      part(bx(2.6, 0.06, 3.2), 0x6e5a46, 6.5, 2.8, -D / 2 - 0.03),
      part(bx(2.8, 2.2, 0.05), 0x7d6a54, -6, 1.6, -D / 2 - 0.03),
      part(cyl(0.1, 0.1, 6, 6), 0x3a3d40, W / 2 + 0.1, 2.6, -D / 2 + 0.8),
    );
    return P;
  };
  const hq = () => {
    const P = [],
      W = 16,
      D = 12,
      c = 0xa89b84;
    P.push(part(bx(W + 0.1, 0.7, D + 0.1), 0x6d6558, 0, 0.35, 0), part(bx(W, 5, D), c, 0, 2.5, 0));
    gable(P, W, D, 5, 3, c, 0x6b4a3a, 0.6);
    P.push(part(bx(1.1, 3.2, 1.1), 0x8a4b3a, 4.2, 7.6, -2.5), part(bx(1.4, 0.2, 1.4), 0x4a4a4a, 4.2, 9.2, -2.5));
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++) {
        win(P, -6 + i * 3, 3.0, s * (D / 2 + 0.05), s > 0 ? 0 : Math.PI, 1.1, 1.4);
        if (s > 0 && i !== 2) win(P, -6 + i * 3, 1.0, s * (D / 2 + 0.05), 0, 1.1, 0.8);
      }
    P.push(
      part(bx(1.8, 2.5, 0.16), 0x3a2f26, 0, 1.35, D / 2 + 0.1),
      part(bx(3.4, 0.3, 1.3), 0x7a7468, 0, 0.15, D / 2 + 0.8),
      part(bx(3.2, 0.14, 1.8), 0x4a5a3a, 0, 3.2, D / 2 + 0.8, 0.25),
      part(bx(0.12, 3, 0.12), 0x4a4a4a, -1.5, 1.6, D / 2 + 1.6),
      part(bx(0.12, 3, 0.12), 0x4a4a4a, 1.5, 1.6, D / 2 + 1.6),
    );
    P.push(
      part(cyl(0.07, 0.07, 9, 6), 0xcfcfcf, 7.2, 4.5, D / 2 + 2.5),
      ...FLG.at('jn', 2.1, 7.27, 8.95, D / 2 + 2.5, 0), /* the Rising Sun over the HQ */
      part(cyl(0.06, 0.06, 7, 6), 0x3a3d40, -5.5, 8.4, -1),
      part(bx(2, 0.08, 0.08), 0x3a3d40, -5.5, 10.5, -1),
      part(bx(1.6, 0.08, 0.08), 0x3a3d40, -5.5, 9.8, -1),
      part(bx(1.6, 1.3, 1.2), 0x56603f, -W / 2 - 1.1, 0.65, 0),
      part(bx(0.5, 0.5, 0.4), 0x2b2d2f, -W / 2 - 1.1, 1.5, 0.3),
    );
    sandbags(P, -3.5, D / 2 + 3.3, 5, 0, 3);
    sandbags(P, 3.5, D / 2 + 3.3, 5, 0, 3);
    return P;
  };
  const bunker = () => {
    const P = [],
      g = 0x56603f;
    P.push(part(bx(10, 2.6, 10), 0x6d7266, 0, 1.3, 0));
    const fr = cyl(9.9, 4.6, 3.4, 4);
    fr.rotateY(Math.PI / 4);
    P.push(part(fr, 0x5a5f43, 0, 1.7, 0));
    P.push(
      part(bx(6.4, 2.8, 2.2), 0x7a7f72, 0, 1.4, 5.2),
      part(bx(6.8, 0.3, 2.4), 0x666b5f, 0, 2.9, 5.2),
      part(bx(2.2, 2.1, 0.3), 0x33362f, -1.0, 1.1, 6.35),
      part(bx(2.5, 0.16, 0.4), 0x555a50, -1.0, 2.25, 6.35),
      part(bx(3.0, 0.55, 0.34), 0x0c0d0b, 1.7, 1.9, 6.35),
      part(bx(3.3, 0.12, 0.5), 0x555a50, 1.7, 2.2, 6.35),
      part(bx(2.2, 2.2, 0.08), 0x7a7f72, -1.0, 1.1, 6.4),
      part(bx(5.2, 0.06, 4.6), 0x4d5a3a, 0, 3.7, 1, 0.28),
      part(cyl(0.2, 0.2, 0.9, 8), 0x555a50, -2.5, 3.9, -1),
      part(cyl(0.2, 0.2, 0.9, 8), 0x555a50, 2.8, 3.7, -2),
      part(bx(0.4, 0.3, 0.4), 0x555a50, 0, 3.55, -3.4),
      part(cyl(0.025, 0.025, 3, 5), 0x2b2d2f, 3, 5, -3),
    );
    sandbags(P, -3.4, 7.4, 3, 0, 2);
    sandbags(P, 3.8, 7.4, 3, 0, 2);
    P.push(part(bx(1.1, 0.7, 1.0), 0x6a5a3c, 0, 0.35, 8.7), part(bx(1.1, 0.7, 1.0), 0x7a6a48, 1.4, 0.35, 9));
    return P;
  };
  const hangar = () => {
    const P = [],
      W = 18,
      D = 30,
      c = 0x7d8088,
      rb = 0x5e6268;
    P.push(part(bx(W + 0.1, 0.5, D + 0.1), 0x5a5d60, 0, 0.25, 0), part(bx(W, 4.2, D), c, 0, 2.1, 0));
    const ar = new THREE.CylinderGeometry(W / 2, W / 2, D, 20, 1, false, Math.PI / 2, Math.PI)
      .rotateX(Math.PI / 2)
      .scale(1, 0.42, 1);
    P.push(part(ar, 0x6f747a, 0, 4.2, 0));
    for (let i = 0; i < 7; i++) {
      const t = new THREE.TorusGeometry(W / 2 + 0.05, 0.14, 5, 20, Math.PI).scale(1, 0.42, 1);
      P.push(part(t, rb, 0, 4.2, -D / 2 + 0.3 + (i * (D - 0.6)) / 6));
    }
    P.push(
      part(bx(11, 3.9, 0.3), 0x2e3236, 0, 2.2, D / 2 + 0.12),
      part(bx(11.6, 0.3, 0.45), rb, 0, 4.25, D / 2 + 0.2),
      part(bx(0.3, 4.2, 0.45), rb, -5.8, 2.1, D / 2 + 0.2),
      part(bx(0.3, 4.2, 0.45), rb, 5.8, 2.1, D / 2 + 0.2),
      part(bx(5.4, 3.8, 0.22), 0x8a8f94, -3.0, 2.0, D / 2 + 0.35),
      part(bx(0.1, 3.8, 0.26), 0x4a4e52, -0.3, 2.0, D / 2 + 0.36),
    );
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++) P.push(part(bx(0.12, 0.6, 1.5), 0x1e2a33, s * (W / 2 + 0.02), 3.7, -10 + i * 5));
    P.push(
      part(bx(5, 3, 12), 0x6d7076, W / 2 + 2.4, 1.5, 2),
      part(bx(5.6, 0.18, 12.6), 0x4a4d52, W / 2 + 2.4, 3.2, 2, 0, 0, -0.08),
      part(bx(1.4, 2.2, 0.14), 0x33362f, W / 2 + 2.4, 1.1, 8.1),
      part(bx(0.7, 0.5, 1.2), 0x4a4d52, 0, 6.6, -4),
      part(bx(0.7, 0.5, 1.2), 0x4a4d52, 0, 6.6, 6),
      part(cyl(0.3, 0.3, 0.9, 8), 0x8b4a2b, -W / 2 - 0.7, 0.45, 10),
      part(cyl(0.3, 0.3, 0.9, 8), 0x56603f, -W / 2 - 0.7, 0.45, 10.8),
      crate(-W / 2 - 1.0, 0, -8, 1.2, 0x7a5f35),
    );
    return P;
  };
  const fuel = () => {
    const P = [],
      R = 4.5;
    P.push(part(cyl(R + 0.2, R + 0.2, 0.5, 24), 0x4a4d52, 0, 0.25, 0), part(cyl(R, R, 7.4, 24), 0xb8bcc0, 0, 4.2, 0));
    const dm = new THREE.SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    P.push(
      part(dm, 0xaab0b5, 0, 7.9, 0, 0, 0, 0, R, 1.15, R),
      part(cyl(0.5, 0.5, 0.6, 10), 0x7d8186, 0, 9.1, 0),
      part(cyl(0.9, 0.9, 0.2, 10), 0x6d7176, 1.8, 8.8, 1.2),
    );
    for (const y of [2.1, 3.9, 5.7, 7.5]) P.push(part(cyl(R + 0.06, R + 0.06, 0.16, 24), 0x7d8186, 0, y, 0));
    P.push(part(cyl(R + 0.07, R + 0.07, 0.9, 24), 0xb22a24, 0, 6.2, 0));
    P.push(
      part(bx(0.12, 8.6, 0.12), 0x3a3d40, R + 0.15, 4.3, -0.4),
      part(bx(0.12, 8.6, 0.12), 0x3a3d40, R + 0.15, 4.3, 0.4),
    );
    for (let i = 0; i < 17; i++) P.push(part(bx(0.12, 0.06, 0.8), 0x3a3d40, R + 0.15, 0.5 + i * 0.5, 0));
    P.push(
      part(cyl(0.3, 0.3, 3.2, 8), 0x3a3d40, R + 1.4, 0.9, -1.6, 0, 0, Z),
      part(cyl(0.28, 0.28, 0.2, 8), 0xb22a24, R + 2.4, 1.5, -1.6),
      part(cyl(0.18, 0.18, 3, 8), 0x3a3d40, R + 1.4, 0.5, -1.6, Z, 0, 0),
      part(bx(0.7, 0.7, 0.7), 0x56603f, R + 3.1, 0.35, -1.6),
    );
    for (let i = 0; i < 4; i++) P.push(part(bx(0.3, 2.4, 0.04), 0x7a5c45, -2.8 + i * 1.9, 3.6, R + 0.04));
    const bund = new THREE.CylinderGeometry(8.2, 8.8, 0.9, 28, 1, true);
    P.push(part(bund, 0x6a6350, 0, 0.45, 0));
    return P;
  };
  const BSET = { warehouse: 1, hq: 1, bunker: 1, hangar: 1, fuel: 1 };
  /* REAL SIZES (GX.fit): each vehicle is scaled, axis by axis, to the type it stands for; figures from References/vehicle research
     spec sheet.pdf. The Type 94 family shares the cargo truck's scale, so its cab and wheels are one size.
     Truck, supply, tanker: Isuzu Type 94 six-wheeled truck, 5.40 x 1.90 x 2.25 m; jeep: Kurogane Type 95, 3.38 x 1.52 x 1.68;
     apc: Isuzu Type 98 Ko-Hi half-track prime mover, 4.65 x 1.90 x 2.15; tank: Type 95 Ha-Go, 4.30 x 2.07 x 2.28. */
  const REAL = {
    truck: { L: 5.4, W: 1.9, H: 2.25 },
    supply: { as: 'truck' },
    tanker: { as: 'truck' },
    jeep: { L: 3.38, W: 1.52, H: 1.68 },
    apc: { L: 4.65, W: 1.9, H: 2.15 },
    tank: { L: 4.3, W: 2.07, H: 2.28 },
  };
  /* the scale (in the model's own frame, nose along +x) that brings type t to its real size */
  const fitS = {};
  const fitScale = (t) => fitS[t] || (fitS[t] = REAL[t].as ? fitScale(REAL[t].as) : GX.fitM(defs[t](), REAL[t]));
  const bake = (P, s, isB, t) => {
    if (REAL[t]) {
      const g = new GX.Acc().add(P, new THREE.Matrix4().makeRotationY(-Z).multiply(fitScale(t))).geometry();
      g.computeBoundingBox();
      const b = g.boundingBox;
      g.translate(-(b.max.x + b.min.x) / 2, -s[1] / 2 - b.min.y, -(b.max.z + b.min.z) / 2);
      g.computeBoundingSphere();
      return g;
    }
    const g = new GX.Acc().add(P, new THREE.Matrix4().makeRotationY(isB ? 0 : -Z)).geometry();
    if (isB) {
      g.translate(0, -s[1] / 2, 0);
      g.computeBoundingSphere();
      return g;
    }
    g.computeBoundingBox();
    const bb = g.boundingBox,
      k = s[2] / (bb.max.z - bb.min.z);
    g.scale(k, k, k);
    g.computeBoundingBox();
    const b2 = g.boundingBox;
    g.translate(-(b2.max.x + b2.min.x) / 2, -s[1] / 2 - b2.min.y, -(b2.max.z + b2.min.z) / 2);
    g.computeBoundingSphere();
    return g;
  };
  const defs = {
    /* the enemy vehicles are the reference-built models (MODELS, the Japanese army vehicles piece) */
    truck: () => MODELS.get('jp-type94-cargo'),
    supply: () => MODELS.get('jp-type94-supply'),
    tanker: () => MODELS.get('jp-type94-fuel'),
    jeep: () => MODELS.get('jp-kurogane'),
    apc: () => MODELS.get('jp-ko-hi'),
    tank: () => MODELS.get('jp-ha-go'),
    warehouse,
    hq,
    bunker,
    hangar,
    fuel,
  };
  return {
    has: (t) => !!defs[t],
    isB: (t) => !!BSET[t],
    make: (t, s) => cache[t] || (cache[t] = bake(defs[t](), s, !!BSET[t], t)),
    parts: (t) => defs[t](),
    /* the parts at the type's real size (for parked vehicles; nose along +x, wheels on y = 0) */
    fitParts: (t) => (REAL[t] ? GX.fit(defs[t](), null, fitScale(t)) : defs[t]()),
    part,
    bx,
    cyl,
    sph,
    Z,
    crate,
    barrel,
    sandbags,
  };
})();
function mkT(type, x, z, ry, kind) {
  const sp = SP[type],
    s = sp.s,
    det = VM.has(type),
    m = new THREE.Mesh(
      det
        ? VM.make(type, s)
        : sp.cyl
          ? new THREE.CylinderGeometry(4.5, 4.5, 9, 14)
          : new THREE.BoxGeometry(s[0], s[1], s[2]),
      new THREE.MeshLambertMaterial(det ? { vertexColors: true, side: VM.isB(type) ? 2 : 0 } : { color: sp.c }),
    );
  m.position.set(x, H(x, z) + s[1] / 2, z);
  m.rotation.y = ry;
  scene.add(m);
  if (sp.roof && !det) {
    const rf = new THREE.Mesh(
      new THREE.BoxGeometry(s[0] + 0.7, 0.6, s[2] + 0.7),
      new THREE.MeshLambertMaterial({ color: sp.roof }),
    );
    rf.position.y = s[1] / 2 + 0.3;
    m.add(rf);
  }
  if (sp.cab && !det) {
    const cb = new THREE.Mesh(
      new THREE.BoxGeometry(s[0] * 0.92, s[1] * 0.7, s[2] * 0.28),
      new THREE.MeshLambertMaterial({ color: 0x3f4a32 }),
    );
    cb.position.set(0, -s[1] * 0.12, s[2] * 0.38);
    m.add(cb);
  }
  let lit = null;
  if (VM.isB(type) && type !== 'fuel') {
    /* lit windows round the walls (shown at night) */
    const pts = [],
      y = -s[1] / 2 + Math.min(3, s[1] * 0.45);
    for (let a = -s[0] / 2 + 2; a <= s[0] / 2 - 1.9; a += 4.2) pts.push(a, y, s[2] / 2 + 0.5, a, y, -s[2] / 2 - 0.5);
    for (let a = -s[2] / 2 + 2; a <= s[2] / 2 - 1.9; a += 4.2) pts.push(s[0] / 2 + 0.5, y, a, -s[0] / 2 - 0.5, y, a);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    lit = new THREE.Points(lg, BLDL);
    lit.visible = BLDL.opacity > 0.02;
    m.add(lit);
  }
  csTree(m);
  const e = {
    m,
    lit,
    c: m.position,
    r: Math.max(s[0], s[2]) * 0.55,
    hp: sp.hp,
    hp0: sp.hp,
    type,
    dead: false,
    s1: s[1],
    col: sp.c,
    kind: kind || 'st',
  };
  T.push(e);
  return e;
}
(function () {
  let sd = 7;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  [
    [250, -400, 'truck'],
    [300, -450, 'fuel'],
    [-260, -900, 'tank'],
    [-300, -960, 'truck'],
    [220, -1300, 'hangar'],
  ].forEach((a) => mkT(a[2], a[0], a[1], rnd() * 3));
  [
    [1800, -2600],
    [-2500, -5200],
    [4200, -800],
    [-4800, 1500],
    [900, -7400],
    [-6200, -3500],
  ].forEach(([cx, cz]) => {
    let ok = null;
    for (let i = 0; i < 400 && !ok; i++) {
      const x = cx + (rnd() - 0.5) * 2400,
        z = cz + (rnd() - 0.5) * 2400,
        h = H(x, z);
      if (h > 4 && h < 120) ok = [x, z];
    }
    if (!ok) return;
    ['truck', 'tank', 'fuel', 'hangar', 'truck', 'tank', 'fuel'].forEach((ty) => {
      for (let a = 0; a < 30; a++) {
        const x = ok[0] + (rnd() - 0.5) * 300,
          z = ok[1] + (rnd() - 0.5) * 300;
        if (H(x, z) > 3 && !nearRoad(x, z, 140) && !inCompound(x, z)) {
          mkT(ty, x, z, rnd() * 3);
          break;
        }
      }
    });
  });
})();
function segHit(a, b, c, r) {
  const d = b.clone().sub(a),
    l2 = d.lengthSq(),
    t = l2 ? Math.max(0, Math.min(1, c.clone().sub(a).dot(d) / l2)) : 0;
  return a.clone().addScaledVector(d, t).distanceToSquared(c) < r * r;
}
function note(x) {
  const e = $$('kill');
  e.textContent = x;
  e.style.display = 'block';
  clearTimeout(note.t);
  note.t = setTimeout(() => (e.style.display = 'none'), 1600);
}
function damage(t, d) {
  if (t.dead) return;
  t.hp -= d;
  if (t.hp <= 0) killT(t);
}
function killT(t) {
  t.dead = true;
  killed++;
  t.m.scale.y = 0.3;
  t.m.position.y = H(t.c.x, t.c.z) + t.s1 * 0.15;
  if (t.type === 'ship') t.m.rotation.z = (t.c.x % 2 > 1 ? 1 : -1) * 0.2; /* a ship settles by the side as it burns */
  if (t.lit) t.lit.visible = false; /* the lights go out */
  t.m.traverse((o) => {
    if (o.material && o.material.color && !o.isPoints) {
      o.userData.c0 = o.material.color.getHex();
      o.material.color.set(0x1a1a1a);
    }
  });
  explode(t.c.clone().add(new V(0, t.s1 * 0.5, 0)), t.type == 'fuel' ? 16 : t.type == 'hangar' ? 20 : 9);
  if (t.type == 'fuel' || t.type == 'tanker') blast(t.c, t.type == 'fuel' ? 22 : 14, 40);
  if (!RPL.on && !RPL.busy) AF.target(t);
  if (t.kind !== 'veh' || trn.mode === 'convoy')
    note(t.kind == 'bld' ? 'BUILDING DESTROYED' : t.kind == 'veh' ? 'VEHICLE DESTROYED' : t.type == 'ship' ? 'SHIP SUNK' : t.type == 'plane' ? 'AIRCRAFT DESTROYED ON THE GROUND' : t.type == 'tower' ? 'CONTROL TOWER DESTROYED' : t.type == 'crane' ? 'CRANE DESTROYED' : t.type == 'aa25' ? 'FLAK GUN DESTROYED' : t.type == 'coast12' ? 'COAST GUN KNOCKED OUT' : t.type == 'sl150' ? 'SEARCHLIGHT DESTROYED' : 'TARGET DESTROYED');
}
function blast(p, R, dmg) {
  EN.forEach((e) => {
    if (e.dying) return;
    const d = e.p.distanceTo(p) - 6;
    if (d < R) damageE(e, dmg * (1 - Math.max(0, d) / R));
  });
  T.forEach((t) => {
    if (t.dead) return;
    const d = t.c.distanceTo(p) - t.r * 0.5;
    if (d < R) damage(t, dmg * (1 - Math.max(0, d) / R));
  });
}
