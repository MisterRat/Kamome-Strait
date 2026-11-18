/* ===== end of THE COAST BATTERIES ===== */
const SITES = [],
  SITE_OBJ = [];
{
  const _sceneAdd = scene.add; /* remember what this module adds, so the whole site can be culled by distance (see SITE.vis) */
  scene.add = function (...a) {
    SITE_OBJ.push(...a);
    return _sceneAdd.apply(this, a);
  };
  let FR = SITE; /* the frame the site builders work in (the home site, or a far one) */
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    M = AFLD.models,
    asMesh = (P, lit) => {
      const g = new GX.Acc().add(P, GX.xf(0, 0, 0, 0)).geometry();
      g.computeBoundingBox();
      const b = g.boundingBox,
        s1 = b.max.y - b.min.y,
        k0 = b.min.y; /* read before translate(), which recomputes the box in place */
      g.translate(0, -k0 - s1 / 2, 0); /* base at the model's own zero, the mesh origin in the middle (as the other targets) */
      g.computeBoundingSphere();
      return [new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })), s1, k0 /* the model's lowest point (a ship: her keel, below her waterline at 0) */];
    },
    target = (P, type, hp, r, u, d, ry, yOff) => {
      const [m, s1, k0] = asMesh(P),
        [x, z] = FR.w(u, d);
      /* a ship floats with her own waterline (the model's y = 0) at the sea's design waterline; anything else stands on the ground */
      m.position.set(x, type === 'ship' ? SEA.WL + k0 + s1 / 2 : H(x, z) + s1 / 2 + (yOff || 0), z);
      m.rotation.y = ry;
      scene.add(m);
      const e = { m, lit: null, c: m.position, r, hp, hp0: hp, type, dead: false, s1, k0, col: 0x555555, kind: 'st' };
      T.push(e);
      if (FR === SITE) SITES.push(e); /* the far sites keep their own lists */
      return e;
    },
    bld = (type, u, d, ry) => {
      const [x, z] = FR.w(u, d),
        e = mkT(type, x, z, ry, 'st');
      if (FR === SITE) SITES.push(e);
      return e;
    };
  /* a texture and a mesh draped over the terrain */
  const concrete = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#8c8e90';
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 700; i++) {
        g.fillStyle = Math.random() < 0.5 ? 'rgba(50,52,56,.12)' : 'rgba(200,202,206,.12)';
        g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }
      g.fillStyle = 'rgba(60,62,66,.6)';
      g.fillRect(0, 0, 128, 2);
      g.fillRect(0, 0, 2, 128);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      return t;
    },
    runwayTex = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#55575b';
      g.fillRect(0, 0, 256, 64);
      for (let i = 0; i < 900; i++) {
        g.fillStyle = Math.random() < 0.5 ? 'rgba(30,30,34,.15)' : 'rgba(150,150,154,.1)';
        g.fillRect(Math.random() * 256, Math.random() * 64, 1 + Math.random() * 3, 1 + Math.random() * 2);
      }
      g.fillStyle = '#dcdcd4';
      g.fillRect(40, 30, 90, 4); /* centre dashes */
      g.fillRect(0, 3, 256, 2);
      g.fillRect(0, 59, 256, 2);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      return t;
    },
    drape = (u0, u1, d0, d1, tex, ru, rd, yoff) => {
      const st = 10,
        nu = Math.max(1, Math.ceil((u1 - u0) / st)),
        nd = Math.max(1, Math.ceil((d1 - d0) / st)),
        P = [],
        UV = [],
        I = [];
      for (let j = 0; j <= nd; j++)
        for (let i = 0; i <= nu; i++) {
          const [x, z] = FR.w(u0 + ((u1 - u0) * i) / nu, d0 + ((d1 - d0) * j) / nd);
          P.push(x, HMESH(x, z) + yoff, z);
          UV.push((i / nu) * ru, (j / nd) * rd);
        }
      for (let j = 0; j < nd; j++)
        for (let i = 0; i < nu; i++) {
          const a = j * (nu + 1) + i,
            b = a + 1,
            c = a + nu + 1,
            e = c + 1;
          I.push(a, c, b, b, c, e);
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setIndex(I);
      g.computeVertexNormals();
      if (g.attributes.normal.getY(0) < 0) {
        g.setIndex(I.slice().reverse());
        g.computeVertexNormals();
      }
      g.computeBoundingSphere();
      const m = new THREE.Mesh(
        g,
        new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      );
      scene.add(m);
      return m;
    };
  const CT = concrete(),
    RT = runwayTex();
  const cc = (t, ru, rd) => {
    const u = t.clone();
    u.repeat.set(ru, rd);
    u.needsUpdate = true;
    return u;
  };
  /* colonial ground and deck textures (shared with the far harbours) */
  const mkTex = (w, h, fn) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  /* pale coral earth with grit, the ground of every yard */
  const CORAL = mkTex(128, 128, (g, w, h) => {
    g.fillStyle = '#a89570';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const v = 150 + ((Math.random() * 60) | 0);
      g.fillStyle = 'rgba(' + v + ',' + (v - 14) + ',' + (v - 46) + ',.45)';
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  });
  /* weathered deck planks */
  const PLANK = mkTex(128, 128, (g, w, h) => {
    for (let k = 0; k < 8; k++) {
      const v = 92 + ((Math.random() * 30) | 0);
      g.fillStyle = 'rgb(' + v + ',' + (v - 20) + ',' + (v - 42) + ')';
      g.fillRect(0, k * 16, w, 16);
      g.fillStyle = 'rgba(20,12,6,.55)';
      g.fillRect(0, k * 16 + 15, w, 1);
      for (let n = 0; n < 3; n++) g.fillRect(Math.random() * w, k * 16, 1, 16);
    }
  });
  /* split coconut drying in the sun */
  const COPRA = mkTex(128, 128, (g, w, h) => {
    g.fillStyle = '#c4b48a';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 150 + ((Math.random() * 60) | 0);
      g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 40) + ',.6)';
      g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    }
  });
  /* ===== the port ===== */
  drape(-130, 130, -95, 48, cc(CORAL, 26, 14), 1, 1, 0.35); /* the quay: pale coral earth */
  {
    /* a finger pier on piles, running 270 m out (40 to 310 m from the shore), long enough for a 150 m ship to lie alongside clear of
       the beach; the deck stays 4.5 m above the sea */
    const P = [part(bx(270, 0.8, 16), 0x6f5a40, 0, 0, 0)];
    for (let k = 0; k <= 10; k++)
      for (const s of [-1, 1]) {
        P.push(part(cyl(0.45, 0.45, 9, 8), 0x4a3a2a, -120 + k * 24, -4.6, s * 7.4));
        P.push(part(cyl(0.3, 0.3, 1, 8), 0x2a2a28, -120 + k * 24, 0.9, s * 7.6));
      }
    P.push(part(bx(270, 0.25, 0.4), 0x5a4630, 0, 0.5, 7.9), part(bx(270, 0.25, 0.4), 0x5a4630, 0, 0.5, -7.9));
    const [m] = asMesh(P),
      [x, z] = SITE.w(0, 175);
    m.position.set(x, -3.0, z);
    m.rotation.y = SITE.ryS;
    scene.add(m);
  }
  const ship = (parts, len, u, d, hp) => target(parts, 'ship', hp, len * 0.3, u, d, SITE.ryS);
  const hullUp = (P) => P; /* ship models are built with their waterline at y = 0 and the keel below it; target() floats them there */
  ship(hullUp(M.freighter('jp')), 137, -17.5, 225, 150); /* alongside the pier, her stern clear of the beach */
  ship(hullUp(M.tanker('jp')), 153.5, 18.5, 232, 180);
  /* a Ukuru-class kaibokan (77.7 m x 9.1 m): the coastal escort that patrols up and down the shore off the port.
     The hull is lofted from stations (flared bow, raked stem, tumblehome-free flush deck with bulwarks); the guns are the same Type 96 25 mm mounts as the bases. */
  const UK = { L: 78, X0: -39, mounts: [[20.5, 3.0], [20.5, -3.0], [-3, 3.55], [-3, -3.55]] };
  const ukuru = () => {
    const P = [],
      L = UK.L,
      X0 = UK.X0,
      N = 46,
      GX_ = GX;
    const tt = (x) => (x - X0) / L,
      bowK = (t) => Math.max(0, (t - 0.55) / 0.45),
      beamF = (t) => (t < 0.12 ? 0.6 + 0.4 * Math.sin((t / 0.12) * Z) : t < 0.6 ? 1 : Math.max(0.04, Math.pow(1 - Math.pow((t - 0.6) / 0.4, 1.7), 0.62))),
      W = (x) => 4.55 * beamF(tt(x)),
      deckY = (x) => 3.7 + 0.25 * Math.max(0, 1 - tt(x) / 0.15) + 1.0 * Math.pow(bowK(tt(x)), 2.2),
      flare = (x) => 1 + 0.2 * Math.pow(bowK(tt(x)), 1.3),
      keelY = (x) => -1.6 + 1.45 * Math.pow(Math.max(0, (tt(x) - 0.8) / 0.2), 1.6),
      sideZ = (x, y) => W(x) * (1 + (flare(x) - 1) * Math.max(0, (y - 0.55) / (deckY(x) - 0.55)));
    UK.deckY = deckY;
    const RED = 0x6b2b25,
      DARK = 0x232426,
      GREY = 0x6a727b,
      GREY2 = 0x777e86,
      GREY3 = 0x666d74,
      DECK = 0x5e5848,
      GUN = 0x2c2e30,
      WIN = 0x141c22;
    const S = Array.from({ length: N }, (_, i) => {
      const x = X0 + (L * i) / (N - 1),
        w = W(x),
        k = keelY(x),
        d = deckY(x),
        f = flare(x),
        zi = Math.max(0.02, w * f - 0.16);
      return {
        p0: [x, k, 0],
        p1: [x, k * 0.62, 0.7 * w],
        p2: [x, 0, 0.985 * w],
        p3: [x, 0.55, w],
        p4: [x, d, w * f],
        p5: [x, d + 0.85, w * f * 0.995],
        p4i: [x, d, zi],
        p5i: [x, d + 0.85, zi],
      };
    });
    const mir = (p) => [p[0], p[1], -p[2]],
      Rk = (k) => S.map((s) => s[k]),
      Lk = (k) => S.map((s) => mir(s[k]));
    const grid = (rows, hex) => {
      const J = rows.length,
        I = rows[0].length,
        pos = [],
        idx = [];
      for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
      for (let j = 0; j < J - 1; j++)
        for (let i = 0; i < I - 1; i++) {
          const a = j * I + i,
            b = a + 1,
            c = a + I + 1,
            d = a + I;
          idx.push(a, b, c, a, c, d);
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      P.push(part(g, hex, 0, 0, 0));
    };
    grid([Lk('p2'), Lk('p1'), Rk('p0'), Rk('p1'), Rk('p2')], RED);
    grid([Rk('p2'), Rk('p3')], DARK);
    grid([Lk('p3'), Lk('p2')], DARK);
    grid([Rk('p3'), Rk('p4')], GREY);
    grid([Lk('p4'), Lk('p3')], GREY);
    grid([Rk('p4'), Rk('p5')], GREY);
    grid([Lk('p5'), Lk('p4')], GREY);
    grid([Rk('p5'), Rk('p5i')], GREY3);
    grid([Lk('p5i'), Lk('p5')], GREY3);
    grid([Rk('p5i'), Rk('p4i')], GREY2);
    grid([Lk('p4i'), Lk('p5i')], GREY2);
    grid([Rk('p4i'), Lk('p4i')], DECK);
    {
      const s0 = S[0],
        keys = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'],
        cols = [RED, RED, DARK, GREY, GREY];
      for (let q = 0; q < 5; q++) grid([[s0[keys[q]], s0[keys[q + 1]]], [mir(s0[keys[q]]), mir(s0[keys[q + 1]])]], cols[q]);
    }
    const dk = deckY,
      box = (sx, sy, sz, hex, x, y, z, ry) => part(bx(sx, sy, sz), hex, x, y, z, 0, ry || 0, 0),
      rod = (r, l, hex, x, y, z) => part(cyl(r, r, l, 8), hex, x, y, z, 0, 0, -Z), /* a cylinder lying along +x, centred */
      wire = (x0, y0, x1, y1, z) => part(bx(Math.hypot(x1 - x0, y1 - y0), 0.02, 0.02), 0x1b1b1b, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0));
    /* portholes along the topside */
    for (let x = -31; x <= 4; x += 3.1) for (const s of [-1, 1]) P.push(box(0.34, 0.3, 0.07, WIN, x, 2.5, s * (sideZ(x, 2.5) + 0.02)));
    for (let x = 22; x <= 33; x += 3.0) for (const s of [-1, 1]) P.push(box(0.3, 0.28, 0.07, WIN, x, 2.55, s * (sideZ(x, 2.55) + 0.02)));
    /* anchors in their hawse pipes, windlass, capstan, bollards, jackstaff */
    for (const s of [-1, 1]) {
      P.push(box(0.34, 1.2, 0.2, 0x2b2d2f, 33.8, 3.0, s * (sideZ(33.8, 3.0) + 0.14)), box(0.9, 0.2, 0.2, 0x2b2d2f, 33.8, 2.55, s * (sideZ(33.8, 2.55) + 0.14)));
      P.push(part(cyl(0.3, 0.3, 0.12, 10), 0x15171a, 35.2, 3.6, s * (sideZ(35.2, 3.6) + 0.04), Z));
      for (const x of [30, 0, -26, -35]) P.push(part(cyl(0.16, 0.2, 0.5, 8), 0x3a3d40, x, dk(x) + 0.25, s * (W(x) * 0.93)));
    }
    P.push(box(1.7, 0.7, 1.7, 0x4a4d50, 31.0, dk(31) + 0.35, 0), part(cyl(0.45, 0.55, 0.9, 10), 0x4a4d50, 33, dk(33) + 0.45, 0), part(cyl(0.04, 0.04, 1.9, 6), 0x3a3a3a, 38.4, dk(38.4) + 0.95, 0));
    /* 12 cm gun forward on the forecastle */
    {
      const x = 27,
        y = dk(27);
      P.push(part(cyl(1.7, 1.9, 0.5, 16), 0x585d62, x, y + 0.25, 0), part(cyl(1.0, 1.2, 0.5, 12), 0x41454a, x, y + 0.65, 0));
      P.push(box(2.0, 1.45, 2.3, 0x737a81, x - 0.1, y + 1.5, 0), box(2.1, 0.12, 2.4, GREY3, x - 0.1, y + 2.28, 0), box(0.1, 0.6, 1.2, 0x15171a, x + 0.95, y + 1.55, 0));
      P.push(rod(0.23, 1.6, 0x3a3d40, x + 1.3, y + 1.6, 0), rod(0.12, 4.6, GUN, x + 3.3, y + 1.6, 0), rod(0.17, 0.45, GUN, x + 5.6, y + 1.6, 0));
      P.push(box(0.6, 0.5, 0.9, 0x6b5c40, x - 1.9, y + 0.3, 1.4), box(0.6, 0.5, 0.9, 0x6b5c40, x - 1.9, y + 0.3, -1.4));
    }
    /* bridge: house, upper bridge, compass bridge, wings, windows, searchlights, directors */
    {
      const x = 12,
        y = dk(12);
      P.push(box(10.5, 2.5, 7.0, GREY2, x, y + 1.25, 0), box(10.7, 0.14, 7.2, GREY3, x, y + 2.57, 0));
      P.push(box(7.2, 2.1, 5.6, 0x7c838b, x + 0.4, y + 3.7, 0), box(7.4, 0.14, 5.8, GREY3, x + 0.4, y + 4.82, 0));
      P.push(box(3.6, 0.9, 3.2, 0x757c84, x - 0.6, y + 5.35, 0), box(3.8, 0.1, 3.4, GREY3, x - 0.6, y + 5.85, 0));
      P.push(box(3.6, 0.12, 10.6, GREY3, x + 0.6, y + 2.68, 0));
      for (const s of [-1, 1]) {
        P.push(box(3.6, 0.5, 0.05, GREY2, x + 0.6, y + 3.0, s * 5.3), box(0.05, 0.5, 2.0, GREY2, x + 2.4, y + 3.0, s * 4.3));
        P.push(part(cyl(0.42, 0.42, 0.6, 12), 0x3d4044, x + 0.6, y + 3.3, s * 4.8), part(cyl(0.4, 0.4, 0.05, 12), 0xd8e4f0, x + 1.05, y + 3.4, s * 4.8, 0, 0, Z));
        for (let k = -1; k <= 1; k++) P.push(box(0.8, 0.55, 0.06, WIN, x + 0.4 + k * 1.9, y + 3.9, s * 2.83), box(0.8, 0.5, 0.06, WIN, x + k * 2.8, y + 1.5, s * 3.53));
        P.push(box(0.05, 1.5, 0.7, 0x3a3d40, x - 0.5, y + 1.0, s * 3.55 + s * 0.02));
      }
      for (let k = -2; k <= 2; k++) P.push(box(0.06, 0.6, 0.85, WIN, x + 4.03, y + 3.9, k * 1.05), box(0.06, 0.55, 0.8, WIN, x + 5.28, y + 1.5, k * 1.2));
      P.push(part(cyl(0.8, 0.9, 0.9, 10), 0x6a7077, x - 0.6, y + 6.5, 0), box(0.5, 0.35, 1.4, 0x15171a, x - 0.1, y + 6.55, 0), box(0.18, 0.18, 2.6, 0x3a3d40, x - 0.6, y + 7.15, 0));
      P.push(box(1.5, 0.9, 0.12, 0x3a3d40, x + 2.3, y + 5.45, 0), box(0.12, 0.5, 0.12, 0x3a3d40, x + 2.3, y + 4.95, 0)); /* Type 22 radar */
      P.push(box(0.5, 0.3, 0.5, 0x5a5f62, x - 3.4, y + 2.9, 2.0), box(0.5, 0.3, 0.5, 0x5a5f62, x - 3.4, y + 2.9, -2.0));
      /* mast with yard, crow's nest, Type 13 radar and the aerial wires */
      const mx = x - 3.2,
        my = y + 2.64;
      P.push(part(cyl(0.14, 0.26, 14, 8), 0x4a4d50, mx, my + 7, 0));
      P.push(box(0.1, 0.1, 5.4, 0x4a4d50, mx, my + 10.5, 0), part(cyl(0.75, 0.75, 0.08, 12), 0x3a3d40, mx, my + 8.2, 0), part(cyl(0.7, 0.7, 0.4, 12), 0x5a5f62, mx, my + 8.0, 0));
      P.push(part(GX_.sph(8), 0xffe9a8, mx, my + 14.2, 0, 0, 0, 0, 0.12, 0.12, 0.12));
      for (const z of [-0.9, 0.9]) P.push(box(0.08, 1.7, 0.08, 0x3a3d40, mx + 0.5, my + 12.4, z));
      for (let r = 0; r < 4; r++) P.push(box(0.08, 0.06, 2.2, 0x2b2d2f, mx + 0.5, my + 11.7 + r * 0.45, 0));
      P.push(wire(mx, my + 14, 38.4, dk(38.4) + 1.9, 0), wire(mx, my + 10.5, -38.4, dk(-38.4) + 3.2, 0), wire(mx, my + 10.5, mx - 6, y + 2.6, 2.7), wire(mx, my + 10.5, mx - 6, y + 2.6, -2.7));
    }
    /* funnel: hexagonal, as the class's simplified build had it */
    {
      const x = -3,
        y = dk(-3);
      P.push(box(6.5, 1.4, 5.2, 0x7a8189, x, y + 0.7, 0), box(6.7, 0.1, 5.4, GREY3, x, y + 1.45, 0));
      P.push(part(cyl(1.45, 1.8, 5.0, 6), 0x6a7077, x, y + 3.9, 0), part(cyl(1.5, 1.5, 0.95, 6), 0x1b1c1e, x, y + 6.0, 0), part(cyl(1.58, 1.58, 0.12, 6), 0x303236, x, y + 6.5, 0));
      P.push(box(0.05, 4.4, 0.5, 0x303236, x + 1.7, y + 3.6, 0), part(cyl(0.14, 0.14, 2.4, 8), 0x3a3d40, x - 1.9, y + 6.2, 0.7), part(cyl(0.12, 0.12, 2.0, 8), 0x3a3d40, x - 1.9, y + 6.0, -0.7));
      for (const s of [-1, 1]) P.push(part(cyl(0.45, 0.45, 0.8, 10), 0x4a4d50, x - 1.8, y + 1.9, s * 1.9), part(cyl(0.35, 0.5, 0.4, 10), 0x303236, x - 1.8, y + 2.5, s * 1.9));
    }
    /* after deckhouse with the twin 12 cm mount on its roof */
    {
      const x = -22,
        y = dk(-22);
      P.push(box(11, 2.3, 6.6, GREY2, x + 1.5, y + 1.15, 0), box(11.2, 0.14, 6.8, GREY3, x + 1.5, y + 2.37, 0));
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) P.push(box(0.8, 0.5, 0.06, WIN, x - 1.5 + k * 2.4, y + 1.4, s * 3.33));
      P.push(box(0.05, 1.3, 0.8, 0x3a3d40, x + 7.04, y + 0.7, 1.4), box(0.05, 1.3, 0.8, 0x3a3d40, x + 7.04, y + 0.7, -1.4));
      const gy = y + 2.44;
      P.push(part(cyl(1.9, 2.0, 0.5, 16), 0x585d62, x, gy + 0.25, 0), box(2.6, 1.5, 3.0, 0x737a81, x - 0.2, gy + 1.3, 0), box(2.7, 0.12, 3.1, GREY3, x - 0.2, gy + 2.1, 0));
      for (const s of [-1, 1]) P.push(rod(0.2, 1.4, 0x3a3d40, x + 1.2, gy + 1.3, s * 0.55), rod(0.11, 4.2, GUN, x + 3.1, gy + 1.3, s * 0.55), rod(0.15, 0.4, GUN, x + 5.2, gy + 1.3, s * 0.55));
      P.push(box(0.1, 0.55, 1.9, 0x15171a, x + 1.1, gy + 1.4, 0));
      for (const s of [-1, 1]) P.push(part(cyl(0.55, 0.55, 0.12, 12), 0xa8742e, x + 1.5, y + 1.3, s * 3.42, Z), part(cyl(0.56, 0.56, 0.1, 12), 0x3a3d40, x + 1.5, y + 1.3, s * 3.46, Z));
    }
    /* boats on davits, either side abaft the funnel */
    for (const s of [-1, 1]) {
      const x = -11,
        y = dk(-11);
      P.push(box(5.6, 0.7, 1.5, 0x8c8f91, x, y + 1.6, s * 3.4), box(1.4, 0.65, 1.0, 0x8c8f91, x + 3.2, y + 1.6, s * 3.4, 0.0), box(2.2, 0.45, 1.2, 0x4a4f52, x - 0.4, y + 2.15, s * 3.4), box(5.9, 0.08, 1.7, 0x2b2d2f, x, y + 1.97, s * 3.4));
      for (const dx of [-2, 2]) P.push(part(cyl(0.07, 0.07, 2.3, 6), 0x303436, x + dx, y + 1.1, s * 3.4 + s * 0.9, s * 0.35), box(0.12, 0.12, 0.12, 0x303436, x + dx, y + 2.2, s * 3.9));
    }
    /* stern: depth-charge rails and drums, projectors, throwers, chutes, ensign staff */
    {
      for (const s of [-1, 1]) {
        const z = s * 1.2;
        P.push(box(7.4, 0.1, 0.1, 0x2b2d2f, -34.4, dk(-36) + 0.12, z - 0.25), box(7.4, 0.1, 0.1, 0x2b2d2f, -34.4, dk(-36) + 0.12, z + 0.25));
        for (let i = 0; i < 8; i++) P.push(part(cyl(0.3, 0.3, 0.8, 10), i % 3 ? 0x303436 : 0x3a3f42, -37.8 + i * 0.9, dk(-36) + 0.55, z, Z));
        P.push(part(cyl(0.18, 0.24, 1.0, 8), 0x3a3d40, -31.8, dk(-32) + 0.55, s * 2.7, 0, 0, 0), part(cyl(0.12, 0.14, 0.8, 8), 0x2b2d2f, -31.8, dk(-32) + 1.2, s * 2.9, s * 0.65));
        for (let i = 0; i < 4; i++) P.push(part(cyl(0.1, 0.14, 0.8, 8), 0x3a3d40, -29.2 + i * 1.4, dk(-28) + 0.5, s * 3.4, s * 0.6), part(cyl(0.2, 0.2, 0.12, 8), 0x2b2d2f, -29.2 + i * 1.4, dk(-28) + 0.08, s * 3.3));
        P.push(box(1.0, 0.5, 0.9, 0x2b2d2f, -39.0, 3.0, s * 0.9));
      }
      const x = -38.3,
        y = dk(-38.3);
      P.push(part(cyl(0.05, 0.05, 3.3, 6), 0x555555, x, y + 1.65, 0), ...FLG.at('jn', 1.9, x - 0.05, y + 3.25, 0, Math.PI)); /* the Rising Sun ensign */
      P.push(part(bx(0.5, 1.0, 0.1), 0x40444a, -35.5, dk(-35.5) + 0.5, 3.2));
    }
    /* the four 25 mm twin mounts stand on tubs: the gun heads are added as live meshes (see below) */
    for (const [mx, mz] of UK.mounts) {
      const y = dk(mx);
      P.push(part(cyl(1.35, 1.5, 0.9, 14), 0x585d62, mx, y + 0.45, mz), part(cyl(1.2, 1.2, 0.06, 14), 0x15171a, mx, y + 0.93, mz));
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 1.6 + 0.3;
        P.push(box(0.4, 0.3, 0.2, 0x7d7452, mx + Math.cos(a) * 1.45, y + 1.0, mz + Math.sin(a) * 1.45, -a));
      }
    }
    return P;
  };
  /* her real draught (3.06 m) below the waterline; the model is otherwise built to her plans */
  const ukuruR = () => GX.fit(ukuru(), { D: 3.06 }, new THREE.Matrix4());
  /* the port's patrol vessel: a second Ukuru, alongside (the Japanese side's one patrol type) */
  ship(ukuruR(), 78, -62, 245, 140);
  {
    /* the patrol: a racetrack along the coast 420 m out, 1.9 km long, with a U-turn at each end */
    const u0 = -350,
      u1 = 1500,
      d0 = 420,
      R = 60,
      Ls = u1 - u0,
      per = 2 * Ls + 2 * Math.PI * R,
      e = ship(ukuruR(), 78, u0, d0, 140),
      y0 = e.m.position.y,
      oy = -e.k0 - e.s1 / 2; /* mesh-local y = model y + oy */
    const MAT = () => new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }),
      guns = [];
    /* the same Type 96 25 mm twin mounts as the bases: AA.gun entries that ride on the hull and fire under the Ground Fire option */
    for (const [mx, mz] of UK.mounts) {
      const tur = new THREE.Group(),
        bar = new THREE.Group(),
        top = UK.deckY(mx) + 0.96 + oy;
      tur.position.set(mx, top + 0.25, mz);
      tur.add(new THREE.Mesh(AA.mount.tur, MAT()));
      tur.add(new THREE.Mesh(AA.mount.man, MAT()));
      bar.position.set(0, 0.65, 0);
      bar.add(new THREE.Mesh(AA.mount.bar, MAT()));
      tur.add(bar);
      e.m.add(tur);
      const g = { t: e, grp: new THREE.Group(), tur, bar, x: 0, z: 0, nr: 0, bias: new V(0, 0, 0), yaw: 0, pit: 0.5, acq: 0, mag: 30, rl: 0, cd: 0, side: 1, rec: 0, snd: 0, v: new V(0, 0, 0), piv: new V(), site: true, ship: true, loc: new V(mx, top + 0.9, mz) };
      AA.gun.push(g);
      guns.push(g);
    }
    {
      const wk = shipWakeMesh(1, -e.k0 - e.s1 / 2 + 0.45) /* on the water, just above her waterline */;
      e.m.add(wk);
    }
    const tmp = new V();
    e.m.matrixAutoUpdate = true;
    SITE.patrol = { e, s: 0, sp: 8.5 };
    SITE.pat = (dt) => {
      const q = SITE.patrol,
        m = e.m;
      if (!e.dead) {
        q.s = (q.s + q.sp * dt) % per;
        let s = q.s,
          u,
          d,
          h;
        if (s < Ls) {
          u = u0 + s;
          d = d0;
          h = 0;
        } else if ((s -= Ls) < Math.PI * R) {
          const a = s / R;
          u = u1 + Math.sin(a) * R;
          d = d0 + R - Math.cos(a) * R;
          h = a;
        } else if ((s -= Math.PI * R) < Ls) {
          u = u1 - s;
          d = d0 + 2 * R;
          h = Math.PI;
        } else {
          s -= Ls;
          const a = s / R;
          u = u0 - Math.sin(a) * R;
          d = d0 + R + Math.cos(a) * R;
          h = Math.PI + a;
        }
        /* heading h in the (u,d) plane: 0 = along +u, turning toward +d (out to sea) */
        const du = Math.cos(h),
          dd = Math.sin(h),
          [x, z] = SITE.w(u, d),
          wx = SITE.A.x * du + SITE.S.x * dd,
          wz = SITE.A.z * du + SITE.S.z * dd,
          yw = Math.atan2(-wz, wx),
          rd = e.ride || (e.ride = RIDE.make(33.5, 4.2, 8)) /* she rides the waves (RIDE): a 78 m escort, 9.3 m beam */;
        RIDE.step(rd, x, z, Math.cos(yw), -Math.sin(yw), dt, 0);
        m.matrixAutoUpdate = true; /* the scene is frozen after the build */
        m.position.set(x, y0 + rd.hv, z);
        m.rotation.set(rd.ro, yw, rd.pi, 'YXZ');
      }
      m.updateMatrixWorld(true);
      for (const g of guns) {
        g.tur.matrixAutoUpdate = g.bar.matrixAutoUpdate = true;
        g.tur.rotation.y = g.yaw - m.rotation.y; /* AA.gun aims in world yaw; the mount rides on the hull */
        g.bar.rotation.x = -g.pit;
        g.bar.position.z = -0.12 * g.rec;
        tmp.copy(g.loc);
        m.localToWorld(tmp);
        g.piv.copy(tmp);
        g.x = tmp.x;
        g.z = tmp.z;
      }
    };
  }
  /* cranes either side of the pier root: a tall gantry with a boom reaching toward the water */
  const crane = () => {
    /* a timber gantry derrick (the colonial harbour's cargo gear) */
    const P = [];
    for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) P.push(part(bx(0.7, 13, 0.7), 0x6a4a2a, x, 6.5, z));
    P.push(part(bx(11, 1.2, 11), 0x5a4630, 0, 13.2, 0), part(bx(4, 3, 5), 0xb8a070, -2, 15.2, 0));
    P.push(part(bx(40, 0.9, 1.8), 0x5a4630, 14, 15, 0), part(bx(0.2, 9, 0.2), 0x222222, 30, 10.5, 0), part(bx(1.2, 1.2, 1.2), 0x333333, 30, 6, 0));
    return P;
  };
  target(crane(), 'crane', 70, 15, -34, 40, SITE.ryS);
  target(crane(), 'crane', 70, 15, 34, 40, SITE.ryS);
  [['warehouse', -95, -45], ['warehouse', -45, -50], ['warehouse', 10, -52], ['hq', -8, -88], ['bunker', 80, -82]].forEach(([t, u, d]) =>
    bld(t, u, d, SITE.ryA),
  );
  [[65, -25], [90, -25], [115, -25]].forEach(([u, d]) => bld('fuel', u, d, 0));
  [['truck', -60, 10], ['supply', 55, 15], ['tanker', 100, 12], ['jeep', -20, 20]].forEach(([t, u, d], i) => bld(t, u, d, SITE.ryA + i));
  /* a perimeter fence (wire on posts) with a guard tower at each corner and at the given u along each long side; in the current frame FR */
  const fenceRect = (U0, U1, D0, D1, mids) => {
    const acc = new GX.Acc();
    const put = (P, x, z, yaw, y0) => acc.add(P, GX.xf(x, y0 == null ? H(x, z) : y0, z, yaw, 1));
    const edge = (u0, d0, u1, d1) => {
      const L = Math.hypot(u1 - u0, d1 - d0),
        n = Math.round(L / 6);
      for (let i = 0; i < n; i++) {
        const [ax, az] = FR.w(u0 + ((u1 - u0) * i) / n, d0 + ((d1 - d0) * i) / n),
          [bx2, bz] = FR.w(u0 + ((u1 - u0) * (i + 1)) / n, d0 + ((d1 - d0) * (i + 1)) / n);
        if (nearRoad((ax + bx2) / 2, (az + bz) / 2, 13) || nearRoad(ax, az, 13) || nearRoad(bx2, bz, 13) || (FR !== SITE && WORLD.RT.near((ax + bx2) / 2, (az + bz) / 2, 9))) continue;
        const Ls = Math.hypot(bx2 - ax, bz - az),
          yaw = Math.atan2(-(bz - az), bx2 - ax);
        put(
          [
            part(bx(Ls, 0.035, 0.035), 0x75797c, 0, 0.5, 0),
            part(bx(Ls, 0.035, 0.035), 0x75797c, 0, 1.1, 0),
            part(bx(Ls, 0.035, 0.035), 0x75797c, 0, 1.7, 0),
            part(bx(Ls, 0.03, 0.03), 0x3a3c3e, 0, 2.3, 0),
            part(bx(Ls, 1.8, 0.012), 0x8a8e90, 0, 1.2, 0),
          ],
          (ax + bx2) / 2,
          (az + bz) / 2,
          yaw,
          (H(ax, az) + H(bx2, bz)) / 2,
        );
        put([part(bx(0.14, 2.3, 0.14), 0x6b6e70, 0, 1.15, 0), part(bx(0.7, 0.05, 0.05), 0x4a4d4f, 0, 2.3, 0)], ax, az, yaw);
      }
    };
    edge(U0, D0, U1, D0);
    edge(U1, D0, U1, D1);
    edge(U1, D1, U0, D1);
    edge(U0, D1, U0, D0);
    const gt = (u, d) => {
      const g = 0x4d5240,
        P = [];
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) P.push(part(bx(0.18, 6.4, 0.18), g, sx, 3.2, sz, sz * 0.05, 0, -sx * 0.05));
      for (const y of [1.6, 3.4, 5.0])
        P.push(part(bx(2.1, 0.1, 0.1), g, 0, y, 1), part(bx(2.1, 0.1, 0.1), g, 0, y, -1), part(bx(0.1, 0.1, 2.1), g, 1, y, 0), part(bx(0.1, 0.1, 2.1), g, -1, y, 0));
      P.push(
        part(bx(3.0, 0.2, 3.0), 0x5a5f4c, 0, 6.5, 0),
        part(bx(2.5, 1.5, 2.5), 0x6a6f58, 0, 7.35, 0),
        part(bx(2.6, 0.06, 0.7), 0x1e2a33, 0, 7.6, 1.28),
        part(bx(0.7, 0.06, 2.6), 0x1e2a33, 1.28, 7.6, 0),
        part(bx(0.7, 0.06, 2.6), 0x1e2a33, -1.28, 7.6, 0),
        part(new THREE.ConeGeometry(2.3, 1.1, 4).rotateY(Math.PI / 4), 0x4a4f3c, 0, 8.6, 0),
      );
      const [x, z] = FR.w(u, d);
      put(P, x, z, FR.ryA);
    };
    [[U0 + 4, D0 + 4], [U1 - 4, D0 + 4], [U1 - 4, D1 - 4], [U0 + 4, D1 - 4]].concat(...mids.map((u) => [[u, D0 + 4], [u, D1 - 4]])).forEach(([u, d]) => gt(u, d));
    scene.add(new THREE.Mesh(acc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true })));
  };
  /* ===== the airbase: a function of a site frame (the home one, and the two far ones) ===== */
  const airbase = (F, DR, seed) => {
    FR = F;
  drape(-600, 600, DR - 18, DR + 18, RT, 10, 1, 0.3); /* runway 1,200 m x 36 m */
  drape(-460, 460, DR - 70, DR - 56, cc(CT, 92, 3), 1, 1, 0.28); /* parallel taxiway */
  for (const u of [-380, 380]) drape(u - 7, u + 7, DR - 56, DR - 18, cc(CT, 3, 8), 1, 1, 0.28); /* the two links to the runway */
  drape(-300, 300, DR - 150, DR - 70, cc(CT, 60, 14), 1, 1, 0.3); /* the apron */
  let sd = seed;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647,
    bodies = [0x4d5a3c, 0x5d6341, 0x5a5f48, 0x6b6f5a];
  for (let i = 0; i < 9; i++) {
    const u = -250 + i * 62,
      o = { ang: rnd(), stripes: 0 };
    /* on its wheels on the apron: the apron is draped 0.3 m over the terrain mesh, so stand it on the highest of its three
       wheel contacts there (the mesh's base goes at the terrain height under its centre, plus yOff) */
    const ry = FR.ryS + (rnd() - 0.5) * 0.25,
      [x0, z0] = FR.w(u, DR - 100),
      top = Math.max(...KI84.CONTACT.map(([cx, cz]) => HMESH(x0 + cx * Math.cos(ry) + cz * Math.sin(ry), z0 - cx * Math.sin(ry) + cz * Math.cos(ry)) + 0.3));
    target(M.ki84(bodies[i % 4], o), 'plane', 14, 7, u, DR - 100, ry, top - H(x0, z0) + 0.01);
  }
  /* the ground crew at work on the line (IJAAF khaki-tan coveralls, field caps) and a tractor to tow the fighters: one static mesh */
  {
    const acc = new GX.Acc(),
      at = (P, u, d, yaw) => {
        const [x, z] = FR.w(u, d);
        acc.add(P, GX.xf(x, HMESH(x, z) + 0.3, z, FR.ryS + yaw));
      };
    [[1, 'work', 3.2, 2.2, Math.PI], [1, 'stand', 6, -2.5, 2.2], [4, 'kneel', 2.5, -3.6, 0.4], [4, 'work', 3.4, 2.4, Math.PI], [7, 'stand', -4, 3, -1.2], [7, 'walk', 8, 6, 0.8]].forEach(([i, pose, du, dd, yaw], k) =>
      at(MODELS.get('crew', 'ja', pose, k), -250 + i * 62 + du, DR - 100 + dd, yaw),
    );
    at(GX.fit(MODELS.get('jp-tug', 0x6e6142), MODELS.info('jp-tug')), -250 + 2 * 62 + 9, DR - 92, 0.6);
    const m = new THREE.Mesh(acc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    csTree(m);
    scene.add(m);
  }
  /* the base yard behind the apron: bare gravel ground for the hangars, offices and stores (as at the other two bases) */
  const yc = document.createElement('canvas');
  yc.width = yc.height = 256;
  {
    const g = yc.getContext('2d');
    g.fillStyle = '#5a5240';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 62 + Math.random() * 45 | 0;
      g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 28) + ',0.5)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  }
  const YT = new THREE.CanvasTexture(yc);
  YT.wrapS = YT.wrapT = THREE.RepeatWrapping;
  YT.anisotropy = 8;
  drape(-330, 330, DR - 295, DR - 165, cc(YT, 66, 26), 1, 1, 0.27);
  [['hangar', -210], ['hangar', -110], ['hangar', -10]].forEach(([t, u]) => bld(t, u, DR - 215, FR.ryA + Z));
  [['hq', -250, DR - 270], ['warehouse', 90, DR - 255], ['warehouse', 140, DR - 255], ['bunker', 230, DR - 230]].forEach(([t, u, d]) =>
    bld(t, u, d, FR.ryA),
  );
  [[210, DR - 175], [235, DR - 175]].forEach(([u, d]) => bld('fuel', u, d, 0));
  [['truck', -160, DR - 150], ['supply', 40, DR - 160], ['tanker', 180, DR - 150], ['jeep', -60, DR - 130], ['apc', 120, DR - 165]].forEach(
    ([t, u, d], i) => bld(t, u, d, FR.ryA + 0.3 * i),
  );
  /* control tower on the yard, in front of the hangars (a target) */
  {
    const P = [],
      c = 0xb8bcc0;
    P.push(
      part(bx(5, 14, 5), c, 0, 7, 0),
      part(bx(7.6, 0.4, 7.6), 0x8e9398, 0, 14.2, 0),
      part(bx(7, 2.4, 7), 0x5d6a74, 0, 15.6, 0),
      part(bx(7.2, 1.3, 7.2), 0x1e2a33, 0, 15.7, 0),
      part(bx(7.8, 0.35, 7.8), 0x6a6e72, 0, 17.0, 0),
      part(cyl(0.06, 0.06, 5, 5), 0x2b2d2f, 2, 19.5, 2),
      part(bx(5.2, 0.5, 5.2), 0xb33a2e, 0, 3.5, 0),
      part(bx(5.2, 0.5, 5.2), 0xb33a2e, 0, 10.5, 0),
    );
    P.push(...FLG.pole('jn', 8, 3.2, 1.8, 17.3, -1.8, 0)); /* the Rising Sun on the tower */
    target(P, 'tower', 60, 9, 0, DR - 190, FR.ryA);
  }
  /* perimeter fence round the whole airfield, with guard towers */
  fenceRect(-650, 650, DR - 310, DR + 80, [-320, 320]);
    FR = SITE;
  };
  airbase(SITE, -750, 4242);
  delete scene.add;
  /* the site is some 7 km from your airfield: beyond 6.5 km none of its hundred-odd meshes is drawn (they leave the camera's layer) */
  {
    const cs = [SITE.w(0, 100), SITE.w(0, -800)],
      all = SITE_OBJ.concat(AA.gun.filter((g) => g.site && !g.ship).map((g) => g.grp));
    let far = null,
      tm = 0;
    SITE.vis = (dt) => {
      if ((tm -= dt) > 0) return;
      tm = 0.4;
      const d = Math.min(...cs.map((c) => Math.hypot(cam.position.x - c[0], cam.position.z - c[1]))),
        f = d > 6500;
      if (f === far) return;
      far = f;
      for (const o of all) o.traverse((q) => (q.layers.mask = f ? 2 : 1));
    };
  }
  /* =====================================================================================================================
     THE FAR SITES (phase 2): two colonial harbours, two enemy airbases and two enemy convoy bases, scattered over the far world.
     Each one is built once, behind the menu, as a handful of merged meshes in its own frame (u along the coast, d out to sea; see FS), so nothing
     is ever built or dropped while you fly: the sites are only hidden beyond 31 km, which the fog (and the terrain, built from 34 km) already covers.
     The colonial look (palms, thatched huts on posts, timber wharves, corrugated-iron sheds, a copra shed, outrigger canoes) is shared with the home port.
     ===================================================================================================================== */
  const PB = WORLD.PB,
    prismG = PB.prismG,
    FARS = [],
    FAR_R = 31000,
    ZZ = Math.PI / 2;
  const rng = (seed) => {
    let s = (seed * 2654435761) % 2147483647 || 12345;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  };
  /* a flat textured quad in a site's own frame, at height y (the pads are dead level, so no draping is needed) */
  const flat = (F, u0, u1, d0, d1, y, tex, ru, rd, off) => {
    const q = [F.w(u0, d0), F.w(u1, d0), F.w(u1, d1), F.w(u0, d1)],
      g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(q.flatMap((p) => [p[0], y, p[1]]), 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, ru, 0, ru, rd, 0, rd], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex, side: 2, polygonOffset: true, polygonOffsetFactor: -(off || 2), polygonOffsetUnits: -(off || 2) }));
    scene.add(m);
    return m;
  };
  /* merged scenery of one site: parts placed by (u, d) and a yaw; at() skips anything that would sit on a home road */
  const siteAcc = (F) => {
    const acc = new GX.Acc(),
      home = F === SITE;
    return {
      acc,
      at(P, u, d, yaw, y, k) {
        const [x, z] = F.w(u, d);
        if (home && nearRoad(x, z, 12)) return;
        acc.add(P, GX.xf(x, y == null ? H(x, z) : y, z, yaw, k));
      },
      flush() {
        const m = new THREE.Mesh(acc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
        scene.add(m);
        return m;
      },
    };
  };
  /* ----- the colonial parts, all in local metres with the base at y = 0 ----- */
  /* a coconut palm: a leaning trunk and a crown of drooping fronds (about 130 triangles) */
  const palm = (h, r) => {
    const a0 = r * 6.2832,
      ca = Math.cos(a0),
      sa = Math.sin(a0),
      lean = 0.07 + r * 0.1,
      tx = ca * Math.sin(lean) * h,
      tz = sa * Math.sin(lean) * h,
      ty = Math.cos(lean) * h,
      P = [part(cyl(0.2, 0.34, h, 6), 0x7d6244, tx / 2, ty / 2, tz / 2, sa * lean, 0, -ca * lean)];
    for (let j = 0; j < 9; j++) {
      const a = (j / 9) * 6.2832 + r * 3;
      P.push(part(bx(4.4, 0.05, 0.75), j % 2 ? 0x3b8a32 : 0x2f7a2a, tx + Math.cos(a) * 2.0, ty + 0.1, tz + Math.sin(a) * 2.0, 0, -a, -0.42));
    }
    P.push(part(GX.sph(6), 0x5a3a1a, tx, ty - 0.1, tz, 0, 0, 0, 0.32, 0.3, 0.32));
    return P;
  };
  /* a corrugated-iron shed with timber walls: its long side along x, the door on +z */
  const shed = (L, W, wall, roof) => [
    part(bx(L, 3.4, W), wall, 0, 1.7, 0),
    part(prismG(W + 1.4, 2.0, L + 1.4), roof, 0, 3.4, 0, 0, ZZ),
    part(bx(4.2, 2.8, 0.14), 0x3a2a1c, 0, 1.4, W / 2 + 0.05),
    part(bx(L, 0.3, W + 0.1), 0x6a5a40, 0, 0.15, 0),
  ];
  /* a timber derrick for working cargo: a mast, a slanting boom, a platform */
  const derrick = () => [
    part(bx(3.4, 0.5, 3.4), 0x6a5236, 0, 0.25, 0),
    part(cyl(0.26, 0.36, 11, 6), 0x6a4a2a, 0, 5.75, 0),
    part(bx(15, 0.36, 0.36), 0x5a4630, 5.2, 9.2, 0, 0, 0, 0.5),
    part(bx(0.1, 7, 0.1), 0x222222, 10.4, 5.8, 0),
    part(bx(1.6, 1.0, 1.4), 0xb8a070, 10.4, 2.0, 0),
    part(bx(1.4, 1.4, 1.2), 0x7a2a22, -1.4, 1.2, 0),
  ];
  const canoe = (c) => [
    part(bx(6.0, 0.5, 0.75), c, 0, 0.45, 0),
    part(bx(1.0, 0.5, 0.7), c, 3.2, 0.7, 0, 0, 0, 0.45),
    part(bx(1.0, 0.5, 0.7), c, -3.2, 0.7, 0, 0, 0, -0.45),
    part(cyl(0.16, 0.16, 4.6, 6), 0x8a6a44, 0, 0.3, 2.0, 0, 0, ZZ),
    part(bx(0.1, 0.1, 1.7), 0x6a4a2a, 1.3, 0.55, 1.2),
    part(bx(0.1, 0.1, 1.7), 0x6a4a2a, -1.3, 0.55, 1.2),
  ];
  const stack = (r) => {
    const P = [];
    for (let i = 0; i < 6; i++) P.push(part(cyl(0.45, 0.45, 0.9, 8), i % 2 ? 0x5b3a2a : 0x3a4a5a, (i % 3) * 1.0 - 1, 0.45, (i >> 1) * 1.0 - 0.5));
    for (let i = 0; i < 3; i++) P.push(part(bx(1.2, 1.0, 1.2), 0xa8885a, 3 + (i % 2) * 1.3, 0.5, -0.6 + (i >> 1) * 1.3));
    for (let i = 0; i < 4; i++) P.push(part(bx(0.9, 0.5, 0.6), 0xb8a070, -3 + (i % 2) * 1.0, 0.3 + (i >> 1) * 0.5, 0.4 * (i >> 1)));
    return P;
  };
  /* a moored schooner: black hull, white deckhouse, two masts and furled gaff sails (alongside the jetty, +x forward) */
  const schooner = () => [
    part(bx(14, 2.6, 5.2), 0x23313c, 0, 0.4, 0),
    part(bx(6, 2.6, 3.4), 0x23313c, 9.5, 0.4, 0, 0, 0, 0),
    part(bx(4, 2.4, 4.4), 0x23313c, -8.6, 0.4, 0),
    part(bx(7, 0.2, 5.4), 0x6a5236, 0, 1.75, 0),
    part(bx(4.6, 1.7, 3.2), 0xe8e4d8, -3.5, 2.7, 0),
    part(bx(4.8, 0.2, 3.4), 0x8a2a22, -3.5, 3.6, 0),
    part(cyl(0.16, 0.22, 12, 6), 0x6a4a2a, 3.2, 7.4, 0),
    part(cyl(0.14, 0.2, 10.5, 6), 0x6a4a2a, -7.0, 6.6, 0),
    part(bx(7, 0.16, 0.16), 0x6a4a2a, 0.6, 4.6, 0),
    part(bx(6, 0.16, 0.16), 0x6a4a2a, -9.5, 4.2, 0),
    part(bx(6.6, 0.2, 0.5), 0xd8d2bc, 0.6, 5.2, 0),
    part(bx(5.6, 0.2, 0.5), 0xd8d2bc, -9.2, 4.8, 0),
    part(cyl(0.1, 0.12, 7, 5), 0x6a4a2a, 14, 2.9, 0, 0, 0, -1.1),
  ];
  /* ----- the harbour ----- */
  /* the colonial harbour in frame F. full: a whole new port (yard, wharf, jetty, sheds, village). The home port keeps its own quay, buildings and targets and is dressed only. */
  const harbour = (F, full, seed) => {
    const r = rng(seed),
      S = siteAcc(F),
      YF = F.ryA + Math.PI,
      YA = F.ryA,
      YS = F.ryS,
      pad = full ? FS.PORT_H : 3.2;
    const rects = []; /* occupied (u0, u1, d0, d1), so the palms keep clear */
    const taken = (u, d, m) => rects.some((q) => u > q[0] - m && u < q[1] + m && d > q[2] - m && d < q[3] + m);
    const use = (u0, u1, d0, d1) => rects.push([u0, u1, d0, d1]);
    if (full) {
      flat(F, -205, 205, -150, 48, pad + 0.12, CORAL, 41, 40, 2);
      /* the main wharf: a timber deck on two rows of piles along the water's edge (site-local: x = d seaward, z = u along the coast) */
      const wy = pad + 0.5,
        [ox, oz] = F.w(0, 0),
        L0 = GX.xf(ox, 0, oz, YS);
      flat(F, -130, 130, 40, 66, wy, PLANK, 26, 5, 3);
      const P = [];
      for (let k = -13; k <= 13; k++) for (const dd of [41, 65]) P.push(part(cyl(0.3, 0.3, 11.5, 6), 0x4a3a2a, dd, wy - 5.7, k * 10));
      P.push(part(bx(0.5, 0.5, 262), 0x5a4630, 66.1, wy - 0.1, 0), part(bx(0.5, 0.5, 262), 0x5a4630, 39.9, wy - 0.1, 0));
      S.acc.add(P, L0);
      /* the finger jetty, 190 m out to deep water, with bollards and a little white lighthouse at its end */
      flat(F, -4, 4, 60, 255, wy, PLANK, 2, 40, 3);
      const J = [];
      for (let k = 0; k <= 19; k++) for (const s of [-1, 1]) J.push(part(cyl(0.3, 0.3, 11, 6), 0x4a3a2a, 62 + k * 10, wy - 5.4, s * 3.7));
      for (let k = 0; k < 9; k++) for (const s of [-1, 1]) J.push(part(cyl(0.22, 0.26, 0.9, 6), 0x2a2a28, 75 + k * 20, wy + 0.45, s * 3.7));
      J.push(part(cyl(1.1, 1.5, 8, 8), 0xece8da, 250, wy + 4, 0), part(cyl(1.35, 1.35, 1.2, 8), 0xb02a20, 250, wy + 8.6, 0), part(cyl(0.3, 0.3, 1.6, 6), 0x222222, 250, wy + 9.8, 0));
      S.acc.add(J, L0);
      use(-135, 135, 36, 70);
      /* four long sheds along the back of the yard (timber walls, rusty and grey iron) */
      const roofs = [0x8e9494, 0x9b4a35, 0x8e9494, 0xa05a3a];
      FR = F;
      for (let i = 0; i < 4; i++) {
        target(shed(34, 15, 0xa8946a, roofs[i]), 'warehouse', 40, 17, -140 + i * 62, -62, YF); /* under the Hinomaru, so a target */
        use(-160 + i * 62, -120 + i * 62, -75, -48);
      }
      FR = SITE;
      /* the copra floor and its heaps */
      flat(F, -60, 50, -20, 22, pad + 0.3, COPRA, 8, 3, 4);
      for (let i = 0; i < 6; i++) S.at([part(GX.sph(8), 0xe6dcb8, 0, 0, 0, 0, 0, 0, 3.2, 0.9, 2.2)], -45 + i * 17, -6 + (i % 2) * 14, 0, pad + 0.3);
      use(-65, 55, -25, 27);
      /* harbour master's bungalow with a flagpole, derricks on the wharf, stacks of cargo */
      S.at(PB.bungalow(0, 0, 0, 9, 7).P, 160, -20, YF);
      S.at(FLG.pole('jp', 11, 2.7, 0, 0, 0, 0), 146, -4, YA); /* the Hinomaru over the harbour master's house */
      use(140, 185, -40, 5);
      FR = F;
      for (const u of [-50, 50]) {
        const [ex, ez] = F.w(u, 52);
        target(derrick(), 'crane', 30, 7, u, 52, YS, wy - H(ex, ez));
      }
      FR = SITE;
      for (let i = 0; i < 6; i++) S.at(stack(), -100 + i * 38, 22 + (i % 2) * 4, YA + i, pad);
      /* a village of thatched huts on posts behind the sheds, and the harbour church */
      for (let i = 0; i < 14; i++) {
        const u = -190 + (i % 7) * 30 + (r() - 0.5) * 8,
          d = -132 + (i >> 3) * 30 + (r() - 0.5) * 8;
        S.at(PB.hut(0, 0, 0, 5 + (i % 3) * 0.5, 4 + (i % 2) * 0.5).P, u, d, r() * 6.28);
        use(u - 5, u + 5, d - 5, d + 5);
      }
      /* canoes drawn up above the tide line and a schooner alongside the jetty */
      const cc2 = [0x7a5a38, 0x3a6a78, 0x8a3a2a, 0x6a6a3a, 0x7a5a38];
      for (let i = 0; i < 5; i++) S.at(canoe(cc2[i]), -150 + i * 12, 34, YA + (r() - 0.5) * 0.4, pad + 0.2);
      for (let i = 0; i < 4; i++) S.at(canoe(cc2[i]), 70 + i * 12, 34, YA + (r() - 0.5) * 0.4, pad + 0.2);
    } else {
      /* the home port: huts and palms beyond its own buildings, canoes on the beach, a timber derrick pair stays as the cranes */
      use(-135, 135, -100, 70);
      for (let i = 0; i < 10; i++) {
        const side = i < 5 ? -1 : 1,
          u = side * (150 + (i % 5) * 9 + (r() - 0.5) * 6),
          d = -118 + (i % 5) * 16 + (r() - 0.5) * 6;
        S.at(PB.hut(0, 0, 0, 5 + (i % 3) * 0.5, 4 + (i % 2) * 0.5).P, u, d, r() * 6.28);
        use(u - 5, u + 5, d - 5, d + 5);
      }
      S.at(FLG.pole('jp', 11, 2.7, 0, 0, 0, 0), 150, -60, YA);
      const cc2 = [0x7a5a38, 0x3a6a78, 0x8a3a2a, 0x6a6a3a];
      for (let i = 0; i < 4; i++) S.at(canoe(cc2[i]), -170 + i * 9, 24 + (i % 2) * 5, YA + (r() - 0.5) * 0.4, null);
    }
    /* the coast battery: two 12 cm/45 guns either side of the harbour (THE COAST BATTERIES) */
    COAST.port(F, r, taken, use);
    /* palms over the whole yard, along the shore and round the huts */
    const n = full ? 70 : 40;
    for (let i = 0, k = 0; i < n && k < 400; k++) {
      const u = (r() - 0.5) * (full ? 430 : 400),
        d = -150 + r() * (full ? 175 : 190);
      if (taken(u, d, 6)) continue;
      i++;
      S.at(palm(8 + r() * 5, r()), u, d, r() * 6.28);
    }
    return S.flush();
  };
  /* ----- a patrol ship off an enemy site: the home Ukuru-class kaibokan, racing up and down the coast in the site's own frame ----- */
  const seaOK = (F, u0, u1, d0, R) => {
    /* the whole racetrack (and 150 m round it) must be open deep sea */
    for (let u = u0 - R - 150; u <= u1 + R + 150; u += 60)
      for (let d = d0 - 150; d <= d0 + 2 * R + 150; d += 60) {
        const [x, z] = F.w(u, d);
        if (WH(x, z) > -14) return false;
      }
    return true;
  };
  const mkPatrol = (F) => {
    const R = 60;
    let pick = null;
    for (const [u0, u1, d0] of [[-350, 1500, 420], [-350, 1000, 520], [-500, 500, 520], [-400, 400, 700], [-300, 300, 900]])
      if (seaOK(F, u0, u1, d0, R)) {
        pick = [u0, u1, d0];
        break;
      }
    if (!pick) return null;
    const [u0, u1, d0] = pick,
      Ls = u1 - u0,
      per = 2 * Ls + 2 * Math.PI * R;
    FR = F;
    const e = target(ukuruR(), 'ship', 140, 78 * 0.3, u0, d0, F.ryS);
    FR = SITE;
    const y0 = e.m.position.y,
      oy = -e.k0 - e.s1 / 2,
      MATu = () => new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }),
      guns = [],
      tmp = new V();
    for (const [mx, mz] of UK.mounts) {
      const tur = new THREE.Group(),
        bar = new THREE.Group(),
        top = UK.deckY(mx) + 0.96 + oy;
      tur.position.set(mx, top + 0.25, mz);
      tur.add(new THREE.Mesh(AA.mount.tur, MATu()));
      tur.add(new THREE.Mesh(AA.mount.man, MATu()));
      bar.position.set(0, 0.65, 0);
      bar.add(new THREE.Mesh(AA.mount.bar, MATu()));
      tur.add(bar);
      e.m.add(tur);
      const g = { t: e, grp: new THREE.Group(), tur, bar, x: 0, z: 0, nr: 0, bias: new V(0, 0, 0), yaw: 0, pit: 0.5, acq: 0, mag: 30, rl: 0, cd: 0, side: 1, rec: 0, snd: 0, v: new V(0, 0, 0), piv: new V(), site: true, ship: true, loc: new V(mx, top + 0.9, mz) };
      AA.gun.push(g);
      guns.push(g);
    }
    e.m.add(shipWakeMesh(1, -e.k0 - e.s1 / 2 + 0.45) /* on the water, just above her waterline */);
    e.m.matrixAutoUpdate = true;
    let s = Math.random() * per;
    const P = { e, vis: true, track: { u0, u1, d0, R } };
    P.upd = (dt) => {
      const m = e.m;
      if (!e.dead) {
        s = (s + 8.5 * dt) % per;
        let q = s,
          u,
          d,
          h;
        if (q < Ls) {
          u = u0 + q;
          d = d0;
          h = 0;
        } else if ((q -= Ls) < Math.PI * R) {
          const a = q / R;
          u = u1 + Math.sin(a) * R;
          d = d0 + R - Math.cos(a) * R;
          h = a;
        } else if ((q -= Math.PI * R) < Ls) {
          u = u1 - q;
          d = d0 + 2 * R;
          h = Math.PI;
        } else {
          q -= Ls;
          const a = q / R;
          u = u0 - Math.sin(a) * R;
          d = d0 + R + Math.cos(a) * R;
          h = Math.PI + a;
        }
        const du = Math.cos(h),
          dd = Math.sin(h),
          [x, z] = F.w(u, d),
          wx = F.A.x * du + F.S.x * dd,
          wz = F.A.z * du + F.S.z * dd,
          yw = Math.atan2(-wz, wx),
          rd = e.ride || (e.ride = RIDE.make(33.5, 4.2, 8)) /* she rides the waves (RIDE): a 78 m escort, 9.3 m beam */;
        RIDE.step(rd, x, z, Math.cos(yw), -Math.sin(yw), dt, 0);
        m.position.set(x, y0 + rd.hv, z);
        m.rotation.set(rd.ro, yw, rd.pi, 'YXZ');
      }
      m.updateMatrixWorld(true);
      for (const g of guns) {
        g.tur.matrixAutoUpdate = g.bar.matrixAutoUpdate = true;
        g.tur.rotation.y = g.yaw - m.rotation.y;
        g.bar.rotation.x = -g.pit;
        g.bar.position.z = -0.12 * g.rec;
        tmp.copy(g.loc);
        m.localToWorld(tmp);
        g.piv.copy(tmp);
        g.x = tmp.x;
        g.z = tmp.z;
      }
    };
    return P;
  };
  /* guns and lights of a site (free flight only, like the home port and airbase) */
  const farGun = (F, u, d, yaw) => {
    const [x, z] = F.w(u, d);
    AA.mkGun(x, z, 0, 0, yaw);
    const g = AA.gun[AA.gun.length - 1];
    g.site = g.t.site = true;
    return g;
  };
  const farLamp = (F, u, d, yaw) => {
    const [x, z] = F.w(u, d);
    AA.mkLamp(x, z, 0, 0, yaw);
    const L = AA.lamp[AA.lamp.length - 1];
    L.site = L.t.site = true;
    return L;
  };
  /* ----- the enemy convoy-style base: a fenced compound of stores and vehicles on gravel, two guns and two searchlights ----- */
  const GRAVEL = mkTex(128, 128, (g, w, h) => {
    g.fillStyle = '#5a5240';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1600; i++) {
      const v = 62 + ((Math.random() * 45) | 0);
      g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 28) + ',.5)';
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  });
  const compound = (F, seed) => {
    const r = rng(seed),
      S = siteAcc(F),
      YA = F.ryA;
    const hh = F.H + 0.18;
    flat(F, -185, 185, -165, 165, hh, GRAVEL, 36, 32, 2);
    FR = F;
    [['warehouse', -110, -80], ['warehouse', -110, 0], ['warehouse', -40, -95], ['hq', 90, -80], ['bunker', 110, 20], ['warehouse', 20, 85]].forEach(([t, u, d]) => bld(t, u, d, F.ryA));
    [['truck', -60, 40], ['supply', -20, 30], ['jeep', 30, -20], ['tanker', 60, 60], ['apc', 85, 90], ['truck', -90, 80]].forEach(([t, u, d], i) => bld(t, u, d, F.ryA + 0.4 * i));
    fenceRect(-160, 160, -140, 140, []);
    FR = SITE;
    for (let i = 0; i < 5; i++) S.at(stack(), -120 + i * 55, 115 + (i % 2) * 10, YA + i * 0.7, hh);
    S.at(FLG.pole('jn', 12, 3.0, 0, 0, 0, 0), 65, -78, YA, hh); /* the Rising Sun over the depot */
    for (let i = 0, k = 0; i < 34 && k < 300; k++) {
      const u = (r() - 0.5) * 440,
        d = (r() - 0.5) * 420;
      if (Math.abs(u) < 190 && Math.abs(d) < 175) continue;
      i++;
      S.at(palm(8 + r() * 5, r()), u, d, r() * 6.28);
    }
    S.flush();
    farGun(F, -135, 100, 0.5);
    farGun(F, 135, 105, 0.4);
    farLamp(F, -140, -118, 1.4);
    farLamp(F, 140, -112, 2.2);
  };
  /* ----- the far enemy airbase: the home airbase layout, two guns and two searchlights, palms round the fence and a patrol ship offshore ----- */
  const farAirbase = (F, seed) => {
    const r = rng(seed),
      S = siteAcc(F);
    airbase(F, -750, seed);
    for (let i = 0, k = 0; i < 90 && k < 900; k++) {
      const u = (r() - 0.5) * 1700,
        d = -1180 + r() * 300;
      if (Math.abs(u) < 700 && d > -1100 && d < -650) continue;
      const [x, z] = F.w(u, d);
      if (WH(x, z) < 1) continue;
      i++;
      S.at(palm(8 + r() * 5, r()), u, d, r() * 6.28);
    }
    S.flush();
    farGun(F, -480, -700, 0.5);
    farGun(F, 470, -705, 0.5);
    farLamp(F, -330, -1010, 2.0);
    farLamp(F, 360, -1010, 1.2);
  };
  /* ----- civilian ships: a freighter and a tanker sail between the two harbours, tie up at the jetty for a while, and sail back ----- */
  const CIV = [];
  const berthD = (F, u, len) => {
    for (let d = 100 + len / 2; d <= 215; d += 5) {
      let ok = true;
      for (let uu = u - 14; uu <= u + 14 && ok; uu += 14)
        for (let dd = d - len / 2; dd <= d + len / 2 + 25; dd += 20) {
          const [x, z] = F.w(uu, dd);
          if (WH(x, z) > -9.5) {
            ok = false;
            break;
          }
        }
      if (ok) return d;
    }
    return 160 + len / 2 * 0.2;
  };
  /* a sea-lane finder: a coarse grid of open deep water (a cell counts only if it and its four neighbours are all at least 14 m deep), a breadth-first search, then the corners pulled tight by line of sight */
  const LANES = (() => {
    const C = 800,
      N = 125,
      O0 = -50000,
      sea = new Uint8Array(N * N),
      ok = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sea[j * N + i] = HR(O0 + (i + 0.5) * C, O0 + (j + 0.5) * C) < -14 ? 1 : 0;
    const NB = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        let k = 1;
        for (const [a, b] of NB) {
          const ii = i + a,
            jj = j + b;
          if (ii < 0 || jj < 0 || ii >= N || jj >= N || !sea[jj * N + ii]) k = 0;
        }
        ok[j * N + i] = k;
      }
    const cell = (p) => [Math.max(0, Math.min(N - 1, Math.floor((p[0] - O0) / C))), Math.max(0, Math.min(N - 1, Math.floor((p[1] - O0) / C)))];
    const ctr = (i, j) => [O0 + (i + 0.5) * C, O0 + (j + 0.5) * C];
    const los = (p, q) => {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]),
        n = Math.ceil(L / 150);
      for (let k = 0; k <= n; k++) if (HR(p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n) > -9) return false;
      return true;
    };
    /* the nearest open cell that can be seen from point p */
    const near = (c, p) => {
      let best = null,
        bd = 1e12;
      for (let dj = -12; dj <= 12; dj++)
        for (let di = -12; di <= 12; di++) {
          const i = c[0] + di,
            j = c[1] + dj;
          if (i < 0 || j < 0 || i >= N || j >= N || !ok[j * N + i]) continue;
          const d = di * di + dj * dj;
          if (d < bd && los(p, ctr(i, j))) {
            bd = d;
            best = [i, j];
          }
        }
      return best;
    };
    /* the waypoints between two open-water points (excluding both), or null if there is no sea route */
    const route = (a, b) => {
      if (los(a, b)) return [];
      const s0 = near(cell(a), a),
        g0 = near(cell(b), b);
      if (!s0 || !g0) return null;
      const par = new Int32Array(N * N).fill(-2),
        q = [s0[1] * N + s0[0]];
      par[q[0]] = -1;
      const goal = g0[1] * N + g0[0];
      for (let h = 0; h < q.length && par[goal] === -2; h++) {
        const c = q[h],
          ci = c % N,
          cj = (c / N) | 0;
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++) {
            const i = ci + di,
              j = cj + dj;
            if ((!di && !dj) || i < 0 || j < 0 || i >= N || j >= N || !ok[j * N + i] || par[j * N + i] !== -2) continue;
            par[j * N + i] = c;
            q.push(j * N + i);
          }
      }
      if (par[goal] === -2) return null;
      const cells = [];
      for (let c = goal; c !== -1; c = par[c]) cells.push(ctr(c % N, (c / N) | 0));
      cells.reverse();
      const out = [];
      let cur = a,
        i = 0;
      while (i < cells.length) {
        let j = cells.length - 1;
        while (j > i && !los(cur, cells[j])) j--;
        if (los(cur, b)) break;
        out.push(cells[j]);
        cur = cells[j];
        i = j + 1;
      }
      return out;
    };
    return { route, los };
  })();
  const mkCiv = (parts, len, FA, FB, u, phase) => {
    const dA = berthD(FA, u, len),
      dB = berthD(FB, u, len),
      p0 = FA.w(u, dA),
      p3 = FB.w(u, dB);
    let p1 = null,
      p2 = null,
      mid = null;
    for (const off of [900, 600, 400]) {
      const a = FA.w(u, dA + off),
        b = FB.w(u, dB + off);
      if (!LANES.los(p0, a) || !LANES.los(b, p3)) continue;
      const r = LANES.route(a, b);
      if (r) {
        p1 = a;
        p2 = b;
        mid = r;
        break;
      }
    }
    if (!p1) return null; /* no sea route between the two harbours: no ships (never a ship sailing over land) */
    const [m, s1, k0] = asMesh(parts);
    m.add(shipWakeMesh(1, -k0 - s1 / 2 + 0.45)); /* on the water, just above her waterline */
    scene.add(m);
    const pts = [p0, p1, ...mid, p2, p3],
      seg = [];
    let L = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(l);
      L += l;
    }
    const c = { m, s1, k0, pts, seg, L, v: 7.5, dock: 150, phase, yaw: FA.ryS, vis: true, len };
    CIV.push(c);
    /* under the Hinomaru, so a target: it sinks where it is hit and stays down until the flight restarts */
    c.t = { m, lit: null, c: m.position, r: len * 0.3, hp: len * 1.6, hp0: len * 1.6, type: 'ship', dead: false, s1, k0, col: 0x555555, kind: 'civ' };
    T.push(c.t);
    m.rotation.y = c.yaw;
    m.position.set(p0[0], SEA.WL + k0 + s1 / 2, p0[1]); /* her waterline (the model's y = 0) at the sea's */
    return c;
  };
  const updCiv = (c, t, dt) => {
    if (c.t && c.t.dead) {
      c.m.children[0].visible = false;
      return;
    }
    const cyc = 2 * (c.L / c.v + c.dock),
      tt = (t + c.phase) % cyc;
    let s,
      back = false,
      moving = true;
    if (tt < c.dock) {
      s = 0;
      moving = false;
    } else if (tt < c.dock + c.L / c.v) s = (tt - c.dock) * c.v;
    else if (tt < 2 * c.dock + c.L / c.v) {
      s = c.L;
      moving = false;
      back = true;
    } else {
      s = c.L - (tt - 2 * c.dock - c.L / c.v) * c.v;
      back = true;
    }
    let i = 0,
      q = Math.max(0, Math.min(c.L, s));
    while (i < c.seg.length - 1 && q > c.seg[i]) {
      q -= c.seg[i];
      i++;
    }
    const a = c.pts[i],
      b = c.pts[i + 1],
      k = q / (c.seg[i] || 1),
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    let want = Math.atan2(-dz, dx);
    if (back) want = Math.atan2(dz, -dx);
    let dy = want - c.yaw;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    c.yaw += dy * Math.min(1, dt * 1.5);
    /* she rides the waves (RIDE): samples 0.43 x her length fore and aft and 0.08 x it each side, a slower roll for the big ones */
    const cx = a[0] + dx * k,
      cz = a[1] + dz * k,
      rd = c.ride || (c.ride = RIDE.make(0.43 * c.len, 0.08 * c.len, c.len < 60 ? 6 : 9));
    if (dt > 0) RIDE.step(rd, cx, cz, Math.cos(c.yaw), -Math.sin(c.yaw), dt, 0);
    c.m.position.set(cx, SEA.WL + c.k0 + c.s1 / 2 + rd.hv, cz);
    c.m.rotation.set(rd.ro, c.yaw, rd.pi, 'YXZ');
    c.m.children[0].visible = moving;
  };
  /* ----- build everything ----- */
  const farBuild = (F, fn) => {
    const mine = [],
      g0 = AA.gun.length,
      l0 = AA.lamp.length;
    scene.add = function (...a) {
      mine.push(...a);
      return _sceneAdd.apply(this, a);
    };
    let pat = null;
    try {
      pat = fn();
    } finally {
      delete scene.add;
      FR = SITE;
    }
    for (let i = g0; i < AA.gun.length; i++) if (!AA.gun[i].ship) mine.push(AA.gun[i].grp);
    for (let i = l0; i < AA.lamp.length; i++) mine.push(AA.lamp[i].grp);
    FARS.push({ F, mine, pat, cx: F.O.x, cz: F.O.z, far: null });
  };
  for (const F of FS.list) {
    WH(F.O.x, F.O.z); /* make sure the pad height is known */
    const seed = Math.round(Math.abs(F.O.x) + Math.abs(F.O.z)) % 100000;
    if (F.kind === 'port') farBuild(F, () => void harbour(F, true, seed));
    else if (F.kind === 'air') farBuild(F, () => (farAirbase(F, seed), mkPatrol(F)));
    else farBuild(F, () => (compound(F, seed), mkPatrol(F)));
  }
  {
    const ports = FS.list.filter((f) => f.kind === 'port');
    if (ports.length > 1) {
      const [A, B] = ports;
      mkCiv(M.freighter('jp'), 137, A, B, 13, 0);
      mkCiv(M.tanker('jp'), 153.5, B, A, -13, 900);
    }
  }
  SITE.far = FARS;
  SITE.SEA = LANES; /* the sea-lane finder */
  SITE.civ = CIV;
  /* the home port gets the same colonial dress */
  farBuild(SITE, () => void harbour(SITE, false, 777));
  {
    const _vis = SITE.vis,
      _pat = SITE.pat;
    let tm = 0;
    SITE.vis = (dt) => {
      if (_vis) _vis(dt);
      const nw = performance.now();
      if (nw - tm < 400) return;
      tm = nw;
      for (const s of FARS) {
        const d = Math.hypot(cam.position.x - s.cx, cam.position.z - s.cz),
          f = !(PHOTO.on || ROAM.on) && d > Math.min(FAR_R, scene.fog.far + 3500) + (s.F.kind === 'air' ? 1500 : 0);
        if (f === s.far) continue;
        s.far = f;
        for (const o of s.mine) o.traverse((q) => (q.layers.mask = f ? 2 : 1));
        if (s.pat) s.pat.e.m.traverse((q) => (q.layers.mask = f ? 2 : 1));
      }
      for (const c of CIV) {
        const d = Math.hypot(cam.position.x - c.m.position.x, cam.position.z - c.m.position.z);
        c.vis = PHOTO.on || ROAM.on || d < Math.min(FAR_R, scene.fog.far + 3500) + 2000;
        c.m.traverse((q) => (q.layers.mask = c.vis ? 1 : 2));
      }
    };
    SITE.pat = (dt) => {
      if (_pat) _pat(dt);
      const t = performance.now() / 1000;
      for (const s of FARS) if (s.pat && !s.far) s.pat.upd(dt);
      for (const c of CIV) if (c.vis) updCiv(c, t, dt);
    };
  }
}
