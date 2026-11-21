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
    asMesh = (P, lit, near) => {
      const g = new GX.Acc().add(P, GX.xf(0, 0, 0, 0)).geometry();
      g.computeBoundingBox();
      const b = g.boundingBox,
        s1 = near ? near[1] : b.max.y - b.min.y,
        k0 = near ? near[2] : b.min.y; /* read before translate(), which recomputes the box in place; a distant form sits as its near one */
      g.translate(0, -k0 - s1 / 2, 0); /* base at the model's own zero, the mesh origin in the middle (as the other targets) */
      g.computeBoundingSphere();
      return [
        new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })),
        s1,
        k0 /* the model's lowest point (a ship: her keel, below her waterline at 0) */,
      ];
    },
    /* Pfar: the same model's distant form, swapped in beyond FAR_AT (a THREE.LOD the renderer switches by camera distance) */
    FAR_AT = 1000,
    target = (P, type, hp, r, u, d, ry, yOff, Pfar) => {
      const near = asMesh(P),
        [x, z] = FR.w(u, d);
      let [m, s1, k0] = near;
      if (Pfar) {
        const lod = new THREE.LOD();
        lod.addLevel(m, 0);
        lod.addLevel(asMesh(Pfar, null, near)[0], FAR_AT);
        lod.geometry = m.geometry; /* the near form's, for the code that measures a target */
        m = lod;
      } else if (type === 'ship') GX.far(m, Math.max(0.3, r / 36)); /* a vessel's distant form beyond 1 km (r: about 0.3 of her length) */
      /* a ship floats with her own waterline (the model's y = 0) at the sea's design waterline; anything else stands on the ground */
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const gb = m.geometry.boundingBox,
        gA =
          type === 'ship' || yOff
            ? null
            : GROUNDAT(
                x,
                z,
                gb.max.x - gb.min.x,
                gb.max.z - gb.min.z,
                ry,
                false,
                SURF,
              ); /* on the lowest of the surfaces (apron, yard, ground) under its footprint */
      m.position.set(x, type === 'ship' ? SEA.WL + k0 + s1 / 2 : (gA ? gA.y : H(x, z)) + s1 / 2 + (yOff || 0), z);
      m.rotation.y = ry;
      scene.add(m);
      const e = { m, lit: null, c: m.position, r, hp, hp0: hp, type, dead: false, s1, k0, col: 0x555555, kind: 'st', y0: m.position.y };
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
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
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
  /* the waterfront (1945 Japanese practice, docs/research_1945_bases.md): a narrow coral-block mole with a timber T-head for the small
     craft, the big ships at anchor offshore in the deepest water near by, worked by Daihatsu barges and wooden lighters */
  const MOLE = { d0: 95, L: 112, W: 8, h: 2.2, tw: 24 }; /* from 95 m out (where the shore drops to the sea) to the T-head at 207 m */
  {
    const P = MODELS.get('jp-mole', MOLE.L, MOLE.W, MOLE.h, MOLE.tw, -6),
      g = new GX.Acc().add(P, null).geometry(),
      m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })),
      [x, z] = SITE.w(0, MOLE.d0);
    m.position.set(x, SEA.WL, z);
    m.rotation.y = SITE.ryS;
    scene.add(m);
  }
  /* where to anchor a ship of length len and draught dr, near (u, d0) in frame F: the first spot seaward with dr x 0.8 of water under
     the whole hull (sampled), else the deepest spot found; hf is the frame's height function */
  const anchorD = (F, u, len, dr, d0, hf) => {
    let best = null,
      bz = 1e9;
    for (let d = d0; d <= d0 + 700; d += 10) {
      let worst = -1e9;
      for (let dd = d - len / 2; dd <= d + len / 2; dd += 15)
        for (const uu of [u - 8, u, u + 8]) {
          const [x, z] = F.w(uu, dd);
          worst = Math.max(worst, hf(x, z));
        }
      if (worst < SEA.WL - dr * 0.8) return d;
      if (worst < bz) ((bz = worst), (best = d));
    }
    return best;
  };
  /* anchored hulls ride the waves where they lie (RIDE); each entry: { m, base y, yaw, ride, e (its target, if any) } */
  const ANCH = [];
  const rideAt = (o, dt) => {
    if (o.e && o.e.dead) return;
    const m = o.m;
    if (!o.cb) {
      /* her outline for the ships under way to keep clear of (COLL); a shuttle is a mover too */
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      o.cb = COLL.add({
        sea: true,
        fixed: !o.sh,
        hl: (bb.max.x - bb.min.x) / 2,
        r: (bb.max.z - bb.min.z) / 2,
        mg: 4,
        x: m.position.x,
        z: m.position.z,
        yaw: o.yaw,
        v: 0,
      });
    }
    if (o.sh) {
      /* a shuttle (a Daihatsu working a ship): alongside her, run in to the T-head, lie there, run back; 4 knots, turning to her course */
      const S = o.sh,
        L = Math.hypot(S.b[0] - S.a[0], S.b[1] - S.a[1]),
        run = L / (S.v || 2.1) /* her speed: a Daihatsu's 4 knots unless given */,
        cyc = 2 * (run + S.wait),
        t = (performance.now() / 1000 + S.ph) % cyc;
      let k, back;
      if (t < S.wait) ((k = 0), (back = false));
      else if (t < S.wait + run) ((k = (t - S.wait) / run), (back = false));
      else if (t < 2 * S.wait + run) ((k = 1), (back = true));
      else ((k = 1 - (t - 2 * S.wait - run) / run), (back = true));
      const e = k * k * (3 - 2 * k);
      m.position.x = S.a[0] + (S.b[0] - S.a[0]) * e;
      m.position.z = S.a[1] + (S.b[1] - S.a[1]) * e;
      const want = back ? Math.atan2(S.b[1] - S.a[1], -(S.b[0] - S.a[0])) : Math.atan2(-(S.b[1] - S.a[1]), S.b[0] - S.a[0]);
      let dy = want - o.yaw;
      while (dy > Math.PI) dy -= 2 * Math.PI;
      while (dy < -Math.PI) dy += 2 * Math.PI;
      if (k > 0 && k < 1) o.yaw += dy * Math.min(1, dt * 0.8);
      if (o.wk) o.wk.visible = k > 0 && k < 1; /* her wake only while she is under way */
      /* under way she waits for any boat or ship crossing ahead of her (not for her own berths) */
      Object.assign(o.cb, { x: m.position.x, z: m.position.z, yaw: o.yaw, v: k > 0 && k < 1 ? S.v || 2.1 : 0 });
      if (k > 0 && k < 1) {
        const q = COLL.look(o.cb, 45);
        if (q && !q.o.fixed && q.d < 18) S.ph -= dt; /* hold her place on the run */
      }
    }
    RIDE.step(o.ride, m.position.x, m.position.z, Math.cos(o.yaw), -Math.sin(o.yaw), dt, 0);
    m.matrixAutoUpdate = true;
    m.position.y = o.y0 + o.ride.hv;
    m.rotation.set(o.ride.ro, o.yaw, o.ride.pi, 'YXZ');
    /* a small craft keeps the sea out of her well and off her deck (OCEAN hull, cut just under her waterline) */
    if (o.hull && typeof OCEAN !== 'undefined')
      OCEAN.place(o.hull.h || (o.hull.h = OCEAN.hull(o.hull.o)), m.position.x, m.position.z, Math.cos(o.yaw), -Math.sin(o.yaw), 0, SEA.WL + o.ride.hv - 0.4, 0);
  };
  SITE.anch = ANCH;
  {
    /* the mole and its T-head: no ship under way comes through them (COLL) */
    const [sx, sz] = SITE.w(0, MOLE.d0 + (MOLE.L - 10) / 2),
      [tx, tz] = SITE.w(0, MOLE.d0 + MOLE.L - 5);
    COLL.add({ sea: true, fixed: true, x: sx, z: sz, yaw: Math.atan2(-SITE.S.z, SITE.S.x), hl: (MOLE.L - 10) / 2, r: MOLE.W / 2, v: 0 });
    COLL.add({ sea: true, fixed: true, x: tx, z: tz, yaw: Math.atan2(-SITE.A.z, SITE.A.x), hl: MOLE.tw / 2, r: 5, v: 0 });
  }
  SITE.rideAt = rideAt;
  const ship = (parts, len, u, d, hp) => target(parts, 'ship', hp, len * 0.3, u, d, SITE.ryS);
  const hullUp = (P) => P; /* ship models are built with their waterline at y = 0 and the keel below it; target() floats them there */
  /* the freighter and the tanker at anchor (bows to seaward), each with a Daihatsu or a lighter alongside */
  const anchorShip = (P, len, dr, beam, u, hp) => {
    const d = anchorD(SITE, u, len, dr, 230, HR) /* HR: the seabed itself (H stops at the sea surface) */,
      e = ship(hullUp(P), len, u, d, hp);
    ANCH.push({ m: e.m, y0: e.m.position.y, yaw: SITE.ryS, ride: RIDE.make(0.43 * len, 0.45 * beam, len < 60 ? 6 : 9), e });
    return { e, d };
  };
  const afloat = (P, u, d, yaw, len, beam) => {
    const [m, s1, k0] = asMesh(P),
      [x, z] = SITE.w(u, d);
    m.position.set(x, SEA.WL + k0 + s1 / 2, z);
    m.rotation.y = yaw;
    scene.add(m);
    const o = {
      m,
      y0: m.position.y,
      yaw,
      ride: RIDE.make(0.43 * len, 0.45 * beam, 3),
      hull: { o: { kind: 'rect', cut: 'deck', hl: len * 0.46, hw: beam * 0.42 } },
    };
    ANCH.push(o);
    return o;
  };
  const FRT = anchorShip(M.freighter('jp'), 137, 7.8, 18.2, -70, 150),
    TNK = anchorShip(M.tanker('jp'), 153.5, 9.1, 20, 60, 180);
  {
    /* the freighter's Daihatsu: lies alongside her, then runs her cargo in to the T-head and back */
    const o = afloat(MODELS.get('jp-daihatsu'), -70 + 9.1 + 2.4, FRT.d - 20, SITE.ryS, 14.9, 3.35);
    o.sh = { a: SITE.w(-70 + 9.1 + 2.4, FRT.d - 20), b: SITE.w(-MOLE.tw / 2 - 2.2, MOLE.d0 + MOLE.L + 12), wait: 60, ph: 0 };
  }
  afloat(MODELS.get('jp-lighter'), -70 - 9.1 - 2.6, FRT.d + 10, SITE.ryS, 12, 4);
  afloat(MODELS.get('jp-lighter'), 60 - 10 - 2.6, TNK.d - 30, SITE.ryS, 12, 4);
  /* small craft at the T-head: a Daihatsu and a lighter moored to it */
  afloat(MODELS.get('jp-daihatsu'), -MOLE.tw / 2 - 2.2, MOLE.d0 + MOLE.L - 6, SITE.ryS + Math.PI, 14.9, 3.35);
  afloat(MODELS.get('jp-lighter'), MOLE.tw / 2 + 2.6, MOLE.d0 + MOLE.L - 7, SITE.ryS, 12, 4);
  SITE.anchD = { frt: FRT.d, tnk: TNK.d };
  /* a Ukuru-class kaibokan (77.7 m x 9.1 m): the coastal escort that patrols up and down the shore off the port.
     The hull is lofted from stations (flared bow, raked stem, tumblehome-free flush deck with bulwarks); the guns are the same Type 96 25 mm mounts as the bases. */
  const UK = {
    L: 78,
    X0: -39,
    mounts: [
      [20.5, 3.0],
      [20.5, -3.0],
      [-3, 3.55],
      [-3, -3.55],
    ],
  };
  const ukuru = () => {
    const P = [],
      L = UK.L,
      X0 = UK.X0,
      N = 46,
      GX_ = GX;
    const tt = (x) => (x - X0) / L,
      bowK = (t) => Math.max(0, (t - 0.55) / 0.45),
      beamF = (t) =>
        t < 0.12
          ? 0.6 + 0.4 * Math.sin((t / 0.12) * Z)
          : t < 0.6
            ? 1
            : t > 0.999
              ? 0 /* the stem: the sides meet, no gap */
              : Math.max(0.04, Math.pow(1 - Math.pow((t - 0.6) / 0.4, 1.7), 0.62)),
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
      for (let q = 0; q < 5; q++)
        grid(
          [
            [s0[keys[q]], s0[keys[q + 1]]],
            [mir(s0[keys[q]]), mir(s0[keys[q + 1]])],
          ],
          cols[q],
        );
    }
    const dk = deckY,
      box = (sx, sy, sz, hex, x, y, z, ry) => part(bx(sx, sy, sz), hex, x, y, z, 0, ry || 0, 0),
      rod = (r, l, hex, x, y, z) => part(cyl(r, r, l, 8), hex, x, y, z, 0, 0, -Z) /* a cylinder lying along +x, centred */,
      wire = (x0, y0, x1, y1, z) =>
        part(bx(Math.hypot(x1 - x0, y1 - y0), 0.02, 0.02), 0x1b1b1b, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0));
    /* portholes along the topside */
    for (let x = -31; x <= 4; x += 3.1) for (const s of [-1, 1]) P.push(box(0.34, 0.3, 0.07, WIN, x, 2.5, s * (sideZ(x, 2.5) + 0.02)));
    for (let x = 22; x <= 33; x += 3.0) for (const s of [-1, 1]) P.push(box(0.3, 0.28, 0.07, WIN, x, 2.55, s * (sideZ(x, 2.55) + 0.02)));
    /* anchors in their hawse pipes, windlass, capstan, bollards, jackstaff */
    for (const s of [-1, 1]) {
      P.push(box(0.34, 1.2, 0.2, 0x2b2d2f, 33.8, 3.0, s * (sideZ(33.8, 3.0) + 0.14)), box(0.9, 0.2, 0.2, 0x2b2d2f, 33.8, 2.55, s * (sideZ(33.8, 2.55) + 0.14)));
      P.push(part(cyl(0.3, 0.3, 0.12, 10), 0x15171a, 35.2, 3.6, s * (sideZ(35.2, 3.6) + 0.04), Z));
      for (const x of [30, 0, -26, -35]) P.push(part(cyl(0.16, 0.2, 0.5, 8), 0x3a3d40, x, dk(x) + 0.25, s * (W(x) * 0.93)));
    }
    P.push(
      box(1.7, 0.7, 1.7, 0x4a4d50, 31.0, dk(31) + 0.35, 0),
      part(cyl(0.45, 0.55, 0.9, 10), 0x4a4d50, 33, dk(33) + 0.45, 0),
      part(cyl(0.04, 0.04, 1.9, 6), 0x3a3a3a, 38.4, dk(38.4) + 0.95, 0),
    );
    /* 12 cm gun forward on the forecastle */
    {
      const x = 27,
        y = dk(27);
      P.push(part(cyl(1.7, 1.9, 0.5, 16), 0x585d62, x, y + 0.25, 0), part(cyl(1.0, 1.2, 0.5, 12), 0x41454a, x, y + 0.65, 0));
      P.push(
        box(2.0, 1.45, 2.3, 0x737a81, x - 0.1, y + 1.5, 0),
        box(2.1, 0.12, 2.4, GREY3, x - 0.1, y + 2.28, 0),
        box(0.1, 0.6, 1.2, 0x15171a, x + 0.95, y + 1.55, 0),
      );
      P.push(rod(0.23, 1.6, 0x3a3d40, x + 1.3, y + 1.6, 0), rod(0.12, 4.6, GUN, x + 3.3, y + 1.6, 0), rod(0.17, 0.45, GUN, x + 5.6, y + 1.6, 0));
      P.push(box(0.6, 0.5, 0.9, 0x6b5c40, x - 1.9, y + 0.3, 1.4), box(0.6, 0.5, 0.9, 0x6b5c40, x - 1.9, y + 0.3, -1.4));
    }
    /* bridge: house, upper bridge, compass bridge, wings, windows, searchlights, directors */
    {
      const x = 12,
        y = dk(12);
      P.push(box(10.5, 2.5, 7.0, GREY2, x, y + 1.25, 0), box(10.7, 0.14, 7.2, GREY3, x, y + 2.57, 0));
      P.push(box(7.2, 2.1, 5.6, 0x7c838b, x + 0.4, y + 3.7, 0), box(7.4, 0.14, 5.8, GREY3, x + 0.4, y + 4.82, 0));
      P.push(box(3.6, 0.9, 3.2, 0x757c84, x - 0.6, y + 5.34, 0), box(3.8, 0.1, 3.4, GREY3, x - 0.6, y + 5.83, 0)); /* the compass platform, on the house top */
      P.push(box(3.6, 0.12, 10.6, GREY3, x + 0.6, y + 2.68, 0));
      for (const s of [-1, 1]) {
        P.push(
          box(3.6, 0.5, 0.05, GREY2, x + 0.6, y + 2.99, s * 5.27),
          box(0.05, 0.5, 2.0, GREY2, x + 2.37, y + 2.99, s * 4.3),
        ); /* wing screens, on the wing deck's edges */
        P.push(
          part(cyl(0.42, 0.42, 0.6, 12), 0x3d4044, x + 0.6, y + 3.04, s * 4.8),
          part(cyl(0.4, 0.4, 0.05, 12), 0xd8e4f0, x + 1.03, y + 3.14, s * 4.8, 0, 0, Z),
        ); /* searchlight, standing on the wing deck */
        for (let k = -1; k <= 1; k++)
          P.push(box(0.8, 0.55, 0.06, WIN, x + 0.4 + k * 1.9, y + 3.9, s * 2.83), box(0.8, 0.5, 0.06, WIN, x + k * 2.8, y + 1.5, s * 3.53));
        P.push(box(0.05, 1.5, 0.7, 0x3a3d40, x - 0.5, y + 1.0, s * 3.55 + s * 0.02));
      }
      for (let k = -2; k <= 2; k++) P.push(box(0.06, 0.6, 0.85, WIN, x + 4.03, y + 3.9, k * 1.05), box(0.06, 0.55, 0.8, WIN, x + 5.28, y + 1.5, k * 1.2));
      P.push(
        part(cyl(0.8, 0.9, 0.9, 10), 0x6a7077, x - 0.6, y + 6.32, 0),
        box(0.5, 0.35, 1.4, 0x15171a, x - 0.1, y + 6.37, 0),
        box(0.18, 0.18, 2.6, 0x3a3d40, x - 0.6, y + 6.86, 0),
      ); /* the director on the platform, its rangefinder arms on top */
      P.push(box(1.5, 0.9, 0.12, 0x3a3d40, x + 2.3, y + 5.45, 0), box(0.12, 0.5, 0.12, 0x3a3d40, x + 2.3, y + 4.95, 0)); /* Type 22 radar */
      P.push(box(0.5, 0.3, 0.5, 0x5a5f62, x - 3.4, y + 2.9, 2.0), box(0.5, 0.3, 0.5, 0x5a5f62, x - 3.4, y + 2.9, -2.0));
      /* mast with yard, crow's nest, Type 13 radar and the aerial wires */
      const mx = x - 3.2,
        my = y + 2.64;
      P.push(part(cyl(0.14, 0.26, 14, 8), 0x4a4d50, mx, my + 7, 0));
      P.push(
        box(0.1, 0.1, 5.4, 0x4a4d50, mx, my + 10.5, 0),
        part(cyl(0.75, 0.75, 0.08, 12), 0x3a3d40, mx, my + 8.2, 0),
        part(cyl(0.7, 0.7, 0.4, 12), 0x5a5f62, mx, my + 8.0, 0),
      );
      P.push(part(GX_.sph(8), 0xffe9a8, mx, my + 14.08, 0, 0, 0, 0, 0.12, 0.12, 0.12)); /* masthead light, on the truck */
      for (const z of [-0.9, 0.9]) P.push(box(0.08, 1.7, 0.08, 0x3a3d40, mx + 0.08, my + 11.39, z)); /* the Type 13 array's posts, standing on the yard */
      for (let r = 0; r < 4; r++) P.push(box(0.08, 0.06, 2.2, 0x2b2d2f, mx + 0.08, my + 10.85 + r * 0.45, 0));
      P.push(
        wire(mx, my + 14, 38.4, dk(38.4) + 1.9, 0),
        wire(mx, my + 10.5, -38.4, dk(-38.4) + 3.2, 0),
        wire(mx, my + 10.5, mx - 6, y + 2.6, 2.7),
        wire(mx, my + 10.5, mx - 6, y + 2.6, -2.7),
      );
    }
    /* funnel: hexagonal, as the class's simplified build had it */
    {
      const x = -3,
        y = dk(-3);
      P.push(box(6.5, 1.4, 5.2, 0x7a8189, x, y + 0.7, 0), box(6.7, 0.1, 5.4, GREY3, x, y + 1.45, 0));
      P.push(
        part(cyl(1.45, 1.8, 5.0, 6), 0x6a7077, x, y + 3.9, 0),
        part(cyl(1.5, 1.5, 0.95, 6), 0x1b1c1e, x, y + 6.0, 0),
        part(cyl(1.58, 1.58, 0.12, 6), 0x303236, x, y + 6.5, 0),
      );
      P.push(
        box(0.05, 4.4, 0.5, 0x303236, x + 1.7, y + 3.6, 0),
        part(cyl(0.14, 0.14, 2.4, 8), 0x3a3d40, x - 1.62, y + 6.2, 0.7),
        part(cyl(0.12, 0.12, 2.0, 8), 0x3a3d40, x - 1.62, y + 6.0, -0.7),
      ); /* steam pipes, against the funnel's after side */
      for (const s of [-1, 1])
        P.push(part(cyl(0.45, 0.45, 0.8, 10), 0x4a4d50, x - 1.8, y + 1.9, s * 1.9), part(cyl(0.35, 0.5, 0.4, 10), 0x303236, x - 1.8, y + 2.5, s * 1.9));
    }
    /* after deckhouse with the twin 12 cm mount on its roof */
    {
      const x = -22,
        y = dk(-22);
      P.push(box(11, 2.3, 6.6, GREY2, x + 1.5, y + 1.15, 0), box(11.2, 0.14, 6.8, GREY3, x + 1.5, y + 2.37, 0));
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) P.push(box(0.8, 0.5, 0.06, WIN, x - 1.5 + k * 2.4, y + 1.4, s * 3.33));
      P.push(box(0.05, 1.3, 0.8, 0x3a3d40, x + 7.04, y + 0.7, 1.4), box(0.05, 1.3, 0.8, 0x3a3d40, x + 7.04, y + 0.7, -1.4));
      const gy = y + 2.44;
      P.push(
        part(cyl(1.9, 2.0, 0.5, 16), 0x585d62, x, gy + 0.25, 0),
        box(2.6, 1.5, 3.0, 0x737a81, x - 0.2, gy + 1.25, 0),
        box(2.7, 0.12, 3.1, GREY3, x - 0.2, gy + 2.05, 0),
      ); /* the gun house, on its base ring */
      for (const s of [-1, 1])
        P.push(
          rod(0.2, 1.4, 0x3a3d40, x + 1.2, gy + 1.3, s * 0.55),
          rod(0.11, 4.2, GUN, x + 3.1, gy + 1.3, s * 0.55),
          rod(0.15, 0.4, GUN, x + 5.2, gy + 1.3, s * 0.55),
        );
      P.push(box(0.1, 0.55, 1.9, 0x15171a, x + 1.1, gy + 1.4, 0));
      for (const s of [-1, 1])
        P.push(
          part(cyl(0.55, 0.55, 0.12, 12), 0xa8742e, x + 1.5, y + 1.3, s * 3.42, Z),
          part(cyl(0.56, 0.56, 0.1, 12), 0x3a3d40, x + 1.5, y + 1.3, s * 3.46, Z),
        );
    }
    /* boats on davits, either side abaft the funnel */
    for (const s of [-1, 1]) {
      const x = -11,
        y = dk(-11);
      P.push(
        box(5.6, 0.7, 1.5, 0x8c8f91, x, y + 1.6, s * 3.4),
        box(1.4, 0.65, 1.0, 0x8c8f91, x + 3.2, y + 1.6, s * 3.4, 0.0),
        box(2.2, 0.45, 1.2, 0x4a4f52, x - 0.4, y + 2.15, s * 3.4),
        box(5.9, 0.08, 1.7, 0x2b2d2f, x, y + 1.97, s * 3.4),
      );
      for (const dx of [-2, 2])
        P.push(
          part(cyl(0.07, 0.07, 2.3, 6), 0x303436, x + dx, y + 1.1, s * 3.4 + s * 0.9, -s * 0.35),
          box(0.12, 0.12, 0.12, 0x303436, x + dx, y + 2.18, s * 3.9),
        ); /* davits, leaning in over the boat to their heads */
    }
    /* stern: depth-charge rails and drums, projectors, throwers, chutes, ensign staff */
    {
      for (const s of [-1, 1]) {
        const z = s * 1.2;
        P.push(box(7.4, 0.1, 0.1, 0x2b2d2f, -34.4, dk(-36) + 0.12, z - 0.25), box(7.4, 0.1, 0.1, 0x2b2d2f, -34.4, dk(-36) + 0.12, z + 0.25));
        for (let i = 0; i < 8; i++) P.push(part(cyl(0.3, 0.3, 0.8, 10), i % 3 ? 0x303436 : 0x3a3f42, -37.8 + i * 0.9, dk(-36) + 0.55, z, Z));
        P.push(
          part(cyl(0.18, 0.24, 1.0, 8), 0x3a3d40, -31.8, dk(-32) + 0.55, s * 2.7, 0, 0, 0),
          part(cyl(0.12, 0.14, 0.8, 8), 0x2b2d2f, -31.8, dk(-32) + 1.2, s * 2.9, s * 0.65),
        );
        for (let i = 0; i < 4; i++)
          P.push(
            part(cyl(0.1, 0.14, 0.8, 8), 0x3a3d40, -29.2 + i * 1.4, dk(-28) + 0.5, s * 3.4, s * 0.6),
            part(cyl(0.2, 0.2, 0.12, 8), 0x2b2d2f, -29.2 + i * 1.4, dk(-28) + 0.08, s * 3.3),
          );
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
  {
    const d = anchorD(SITE, -175, 78, 3.06, 200, HR),
      e = ship(ukuruR(), 78, -175, d, 140);
    ANCH.push({ m: e.m, y0: e.m.position.y, yaw: SITE.ryS, ride: RIDE.make(33.5, 4.2, 8), e });
  }
  {
    /* the patrol: a racetrack along the coast 420 m out, 1.9 km long, with a U-turn at each end */
    /* laid clear of everything moored and anchored (the ships at anchor, the Ukuru alongside, the craft at the mole): its two legs and
       its turns keep 100 m from their hulls, stepping out to sea 30 m at a time until they do (COLL handles the traffic) */
    const clearOf = (u0, u1, d0, R, gap) => {
      const P = [];
      for (let u = u0; u <= u1; u += 25) P.push(SITE.w(u, d0), SITE.w(u, d0 + 2 * R));
      for (let a = 0; a <= Math.PI; a += Math.PI / 8)
        P.push(SITE.w(u1 + Math.sin(a) * R, d0 + R - Math.cos(a) * R), SITE.w(u0 - Math.sin(a) * R, d0 + R - Math.cos(a) * R));
      for (const o of ANCH) {
        const g = o.m.geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        const hl = (g.boundingBox.max.x - g.boundingBox.min.x) / 2,
          c = Math.cos(o.yaw),
          sn = -Math.sin(o.yaw);
        for (let t = -hl; t <= hl; t += 10) for (const [x, z] of P) if (Math.hypot(o.m.position.x + c * t - x, o.m.position.z + sn * t - z) < gap) return false;
      }
      return true;
    };
    let d0 = 420;
    while (d0 < 900 && !clearOf(-350, 1500, d0, 60, 100)) d0 += 30;
    const u0 = -350,
      u1 = 1500,
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
      const g = {
        t: e,
        grp: new THREE.Group(),
        tur,
        bar,
        x: 0,
        z: 0,
        nr: 0,
        bias: new V(0, 0, 0),
        yaw: 0,
        pit: 0.5,
        acq: 0,
        mag: 30,
        rl: 0,
        cd: 0,
        side: 1,
        rec: 0,
        snd: 0,
        v: new V(0, 0, 0),
        piv: new V(),
        site: true,
        ship: true,
        loc: new V(mx, top + 0.9, mz),
      };
      AA.gun.push(g);
      guns.push(g);
    }
    {
      const wk = shipWakeMesh(1, -e.k0 - e.s1 / 2 + 0.45); /* on the water, just above her waterline */
      e.m.add(wk);
    }
    const tmp = new V();
    e.m.matrixAutoUpdate = true;
    SITE.patrol = { e, s: 0, sp: 8.5 };
    const bd = COLL.add({ sea: true, hl: 39, r: 4.6, mg: 30, x: e.m.position.x, z: e.m.position.z, yaw: SITE.ryS, v: 0 }); /* she gives way (COLL) */
    SITE.pat = (dt) => {
      const q = SITE.patrol,
        m = e.m;
      if (!e.dead) {
        const s0 = q.s,
          o0 = bd.off;
        COLL.steer(bd, dt, 600);
        q.s = (q.s + q.sp * dt * bd.slow + per) % per;
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
          [xt, zt] = SITE.w(u, d),
          wx = SITE.A.x * du + SITE.S.x * dd,
          wz = SITE.A.z * du + SITE.S.z * dd,
          yt = Math.atan2(-wz, wx),
          x_ = xt + Math.sin(yt) * bd.off /* her offset to starboard of her track, while she gives way */,
          z_ = zt + Math.cos(yt) * bd.off,
          yw_ = yt + bd.dyaw,
          held = COLL.intrudes(bd, x_, z_, yw_) /* that would put her into another hull: she holds where she is */,
          x = held ? bd.x : x_,
          z = held ? bd.z : z_,
          yw = held ? bd.yaw : yw_,
          rd = e.ride || (e.ride = RIDE.make(33.5, 4.2, 8)); /* she rides the waves (RIDE): a 78 m escort, 9.3 m beam */
        if (held) ((q.s = s0), (bd.off = o0), (bd.slow = 0));
        Object.assign(bd, { x, z, yaw: yw, v: q.sp * Math.abs(bd.slow) });
        RIDE.step(rd, x, z, Math.cos(yw), -Math.sin(yw), dt, 0);
        m.matrixAutoUpdate = true; /* the scene is frozen after the build */
        m.position.set(x, y0 + rd.hv, z);
        m.rotation.set(rd.ro, yw, rd.pi, 'YXZ');
      } else bd.v = 0;
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
  /* ----- Type T-14 motor torpedo boats (the Japanese side's PT boat, MODELS 'jp-t14'): 15 m, 3.6 m beam, 0.72 m draught ----- */
  /* a racetrack in a site's frame: s metres round it -> [u, d, heading in the (u,d) plane: 0 = along +u, turning toward +d] */
  const raceAt = (s, u0, u1, d0, R) => {
    const Ls = u1 - u0;
    if (s < Ls) return [u0 + s, d0, 0];
    if ((s -= Ls) < Math.PI * R) return [u1 + Math.sin(s / R) * R, d0 + R - Math.cos(s / R) * R, s / R];
    if ((s -= Math.PI * R) < Ls) return [u1 - s, d0 + 2 * R, Math.PI];
    s -= Ls;
    return [u0 - Math.sin(s / R) * R, d0 + R + Math.cos(s / R) * R, Math.PI + s / R];
  };
  /* T-14 weapons. The 25 mm single is an AA.gun entry (it fires under the Ground Fire option, at the aircraft or at the ship, as the
     escort's twin mounts do). The torpedoes: with Ground Fire on and the player's ship (PCE-842) within 3 km, a boat leaves her patrol,
     runs in at 30 knots on a collision course, drops both fish at about 1,200 m (side-drop cradles: she aims the boat), turns away,
     and rejoins her track; she reloads at her base (the start of her track) from its stock (T14MAG). A Type 91 runs at 42 knots for 2,000 m just under the surface, its wake showing.
     A hit on the hull is counted, like the shells, until battle damage comes. */
  /* T14MAG: the torpedoes each group's base holds for reloads (three reloads for its two boats); a boat that has fired goes back for
     two more while there are any, then patrols on with her 25 mm only */
  const T14MAG = 6;
  const T14W = (SITE.t14w = { hits: 0, msgT: 0, fired: 0 }),
    TSP = 21.6,
    TRUN = 2000;
  const t14Hot = () => AA.on && SIMS.cur.afloat && started && !crashed && !(typeof RPL !== 'undefined' && RPL.busy);
  const t14Fish = (RUN, x, z, yw) => {
    const o = new THREE.Object3D();
    const wk = shipWakeMesh(8 / 78, 0.05);
    wk.scale.z *= 0.3; /* a straight, narrow bubble track (a ship's wake squeezed sideways: no Kelvin arms) */
    o.add(wk);
    o.position.set(x, coastSea(), z);
    o.rotation.y = yw;
    scene.add(o);
    RUN.push({ o, x, z, dx: Math.cos(yw), dz: -Math.sin(yw), r: 0 });
    T14W.fired++;
    (T14W.log || (T14W.log = [])).push([Math.round(x), Math.round(z), +yw.toFixed(3), Math.round(pos.x), Math.round(pos.z)]) > 20 &&
      T14W.log.shift(); /* for the tests */
    if (T14W.msgT <= 0 && Math.hypot(pos.x - x, pos.z - z) < 3000) (note('TORPEDO WAKES!'), (T14W.msgT = 10));
  };
  /* the skipper's estimate of the ship's course and speed, by eye from a low, fast boat: off by about 10 degrees and 24 per cent (one
     standard deviation, times the difficulty's spread); calibrated so that about one attack in four hits a ship holding her course
     and speed (fewer if she turns: he aims at where she was going). WWII torpedo-boat attacks seldom hit; this keeps them a threat. */
  const t14Guess = () => {
    const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5,
      k = 0.6 + DIFF.spread * 8;
    return { eC: g() * 0.17 * k, eS: g() * 0.24 * k };
  };
  const t14Torps = (RUN, dt) => {
    for (let i = RUN.length - 1; i >= 0; i--) {
      const t = RUN[i];
      t.x += t.dx * TSP * dt;
      t.z += t.dz * TSP * dt;
      t.r += TSP * dt;
      t.o.position.set(t.x, coastSea(), t.z);
      t.o.updateMatrixWorld(true);
      const p = new THREE.Vector3(t.x, coastSea() + 0.2, t.z); /* at her waterline (the hull test's frame starts at the sea) */
      let end = t.r > TRUN,
        boom = false;
      if (SIMS.cur.afloat && Math.abs(pos.x - t.x) < 60 && Math.abs(pos.z - t.z) < 60 && SIMS.cur.struck(p)) {
        boom = end = true;
        T14W.hits++;
        SIMS.cur.torpedoed();
        note('TORPEDO HIT! (' + T14W.hits + ')');
      } else if (HR(t.x, t.z) > coastSea() - 1.5) boom = end = true; /* into the shallows: it hits the bottom */
      if (boom) {
        const c = p.clone().setY(coastSea());
        for (let k = 0; k < 6; k++)
          fxAdd(c.clone().add(new V((Math.random() - 0.5) * 5, 2 + k * 3, (Math.random() - 0.5) * 5)), 0xe9eef0, 4, 14, 2.4, 6, false); /* the water column */
        SND.boom(c, 8);
      }
      if (end)
        (scene.remove(t.o),
          RUN.splice(i, 1),
          (T14W.ends || (T14W.ends = [])).push([
            Math.round(t.r),
            boom ? (t.r > TRUN ? 'x' : HR(t.x, t.z) > coastSea() - 1.5 ? 'bottom' : 'hit') : 'run out',
            Math.round(Math.hypot(pos.x - t.x, pos.z - t.z)),
          ]) > 20 && T14W.ends.shift());
    }
  };
  /* n boats in loose line ahead (gap m apart, staggered 12 m to seaward) round a racetrack at sp m/s; returns the per-frame update */
  const mkT14s = (F, u0, u1, d0, R, n, sp, gap) => {
    const per = 2 * (u1 - u0) + 2 * Math.PI * R,
      B = [],
      F0 = FR,
      MAT = () => new THREE.MeshLambertMaterial({ vertexColors: true }),
      geo = (P) => new GX.Acc().add(P).geometry(),
      GP = T14.gunParts(),
      GT = geo(GP.tur),
      GB = geo(GP.bar),
      FISH = [null, geo(T14.torp(-T14.TZ)), geo([...T14.torp(-T14.TZ), ...T14.torp(T14.TZ)])] /* by fish aboard: none, the port one, both */,
      RUN = []; /* this group's torpedoes running */
    const G = { B, RUN, F, mag: T14MAG, mag0: T14MAG, cap: 2 * T14MAG }; /* mag: the torpedoes left at the group's base for reloads (up to cap,
      the base's store, when a freighter brings more) */
    (T14W.groups || (T14W.groups = [])).push(G);
    FR = F;
    for (let i = 0; i < n; i++) {
      const e = target(MODELS.get('jp-t14', i % 2, undefined, true), 'ship', 30, 15 * 0.3, u0, d0, F.ryS),
        wl = -e.k0 - e.s1 / 2;
      e.m.add(shipWakeMesh(15 / 78, wl + 0.12) /* a small boat's wake, on the water at her waterline */);
      e.m.matrixAutoUpdate = true;
      /* the 25 mm on its pedestal, stowed trained forward until it has a target */
      const tur = new THREE.Group(),
        bar = new THREE.Group();
      tur.position.set(T14.GX0, T14.gTop() + wl, 0);
      tur.add(new THREE.Mesh(GT, MAT()));
      bar.position.set(0, T14.GBAR, 0);
      bar.add(new THREE.Mesh(GB, MAT()));
      tur.add(bar);
      e.m.add(tur);
      const g = {
        t: e,
        grp: new THREE.Group(),
        tur,
        bar,
        x: 0,
        z: 0,
        nr: 0,
        bias: new V(0, 0, 0),
        yaw: F.ryS + Math.PI / 2 /* stowed trained forward */,
        pit: 0.18,
        acq: 0,
        mag: 15,
        rl: 0,
        cd: 0,
        side: 1,
        rec: 0,
        snd: 0,
        v: new V(0, 0, 0),
        piv: new V(),
        site: true,
        ship: true,
        loc: new V(T14.GX0, T14.gTop() + T14.GBAR + wl, 0),
      };
      AA.gun.push(g);
      /* the two torpedoes in their cradles: one mesh, its shape swapped as they go over the side (one draw call) */
      const fm = new THREE.Mesh(FISH[2], MAT());
      fm.position.y = wl;
      e.m.add(fm);
      const fish = {
        n: 2,
        set(n) {
          this.n = n;
          fm.visible = n > 0;
          if (n) fm.geometry = FISH[n];
        },
      };
      B.push({
        e,
        g,
        fish,
        y0: e.m.position.y,
        wl,
        off: i * gap,
        dz: (i % 2) * 12,
        ride: RIDE.make(0.43 * 15, 0.45 * 3.6, 3),
        hull: null,
        bd: COLL.add({
          sea: true,
          hl: 7.5,
          r: 1.8,
          mg: 10,
          maxOff: 40 /* she stays out of the escort's lane */,
          x: e.m.position.x,
          z: e.m.position.z,
          yaw: F.ryS,
          v: 0,
          tclr: 6,
        }),
        s: 0,
        mode: 'track',
        mt: 0,
        rearm: 0,
        x: 0,
        z: 0,
        yw: 0,
        v: sp,
      });
    }
    FR = F0;
    const s0 = Math.random() * per;
    for (const b of B) b.s = s0 - b.off;
    const trackXZ = (b, s) => {
      const [u, d, h] = raceAt(((s % per) + per) % per, u0, u1, d0 + b.dz, R),
        du = Math.cos(h),
        dd = Math.sin(h),
        [x, z] = F.w(u, d),
        wx = F.A.x * du + F.S.x * dd,
        wz = F.A.z * du + F.S.z * dd;
      return [x, z, Math.atan2(-wz, wx)];
    };
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    /* water over dmin m deep all along a run from (x, z) on heading yw for L metres (a fish set shallow for small ships runs at about
       2 m: no reef or shoal to run it aground; the boat herself wants 2 m under her) */
    const deepRun = (x, z, yw, L, dmin) => {
      for (let r = 0; r <= L; r += 30) if (HR(x + Math.cos(yw) * r, z - Math.sin(yw) * r) > coastSea() - (dmin || 2)) return false;
      return true;
    };
    /* steer a boat off her track toward heading hw at speed v (she turns about 15 degrees a second), giving way as any ship does */
    const freeMove = (b, hw, v, dt) => {
      /* off her track she keeps to deep water (over 3 m for 90 m ahead): the nearest clear heading to the one she wants, else she stops */
      let ok = false;
      for (const k of [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.2, -1.2, 1.7, -1.7, 2.3, -2.3, Math.PI])
        if (deepRun(b.x, b.z, hw + k, 90)) {
          ((hw += k), (ok = true));
          break;
        }
      if (!ok) v = 0;
      const av = COLL.avoid(b.bd, Math.max(60, v * 12));
      b.yw += Math.max(-0.26 * dt, Math.min(0.26 * dt, wrap(hw + av.turn - b.yw)));
      b.v += Math.max(-3 * dt, Math.min(2 * dt, v * av.slow - b.v));
      const nx = b.x + Math.cos(b.yw) * b.v * dt,
        nz = b.z - Math.sin(b.yw) * b.v * dt;
      if (COLL.intrudes(b.bd, nx, nz, b.yw)) b.v = 0; /* she holds rather than go into another hull */
      else ((b.x = nx), (b.z = nz));
    };
    return (G.upd = (dt) => {
      const hot = t14Hot();
      T14W.msgT = Math.max(0, T14W.msgT - dt / 3);
      for (const b of B) {
        const m = b.e.m;
        if (b.e.dead) {
          if (b.hull) (OCEAN.unhull(b.hull), (b.hull = null));
          b.bd.v = 0;
          continue;
        }
        let x, z, yw, v;
        if (b.mode === 'track') {
          /* each boat keeps her own place on the track, and gives way (COLL): to her own leader too */
          const s0 = b.s,
            o0 = b.bd.off;
          COLL.steer(b.bd, dt, 160);
          b.s = (b.s + sp * dt * b.bd.slow + per) % per;
          const [xt, zt, yt] = trackXZ(b, b.s);
          x = xt + Math.sin(yt) * b.bd.off;
          z = zt + Math.cos(yt) * b.bd.off;
          yw = yt + b.bd.dyaw;
          v = sp * Math.abs(b.bd.slow);
          if (COLL.intrudes(b.bd, x, z, yw))
            ((b.s = s0), (b.bd.off = o0), (b.bd.slow = 0), (x = b.bd.x), (z = b.bd.z), (yw = b.bd.yaw), (v = 0)); /* she holds */
          /* fired: back to the base for two more, while it has them (the start of her track, in deep water) */
          if (b.fish.n < 2 && G.mag >= 2) Object.assign(b, { mode: 'reload', mt: 0, rt: 0, x, z, yw, v });
          const R = Math.hypot(pos.x - x, pos.z - z);
          if (hot && b.fish.n === 2 && R < 3000 && R > 1400 && HR((x + pos.x) / 2, (z + pos.z) / 2) < coastSea() - 4)
            Object.assign(b, { mode: 'run', mt: 0, x, z, yw, v, ...t14Guess() });
        } else {
          b.mt += dt;
          const dx = pos.x - b.x,
            dz = pos.z - b.z,
            R = Math.hypot(dx, dz);
          if (b.mode === 'run') {
            /* a collision course: where the ship will be when a fish fired now would meet her (|d + v t| = fish speed x t) */
            const ce = Math.cos(b.eC),
              se = Math.sin(b.eC),
              vx = (vel.x * ce - vel.z * se) * (1 + b.eS) /* what her skipper makes of the ship's course and speed */,
              vz = (vel.x * se + vel.z * ce) * (1 + b.eS),
              qa = vx * vx + vz * vz - TSP * TSP,
              qb = 2 * (dx * vx + dz * vz),
              qd = Math.max(0, qb * qb - 4 * qa * R * R),
              tt = (-qb - Math.sqrt(qd)) / (2 * qa),
              lx = dx + vx * tt,
              lz = dz + vz * tt,
              hw = Math.atan2(-lz, lx);
            freeMove(b, hw, 15.4, dt);
            if (!hot || b.mt > 240 || R > 4500 || R < 500) b.mode = 'rejoin'; /* no shot, or too close in: she gives it up */
            else if (R < 1300 && Math.abs(wrap(hw - b.yw)) < 0.012 && deepRun(b.x, b.z, b.yw, tt * TSP + 150)) {
              /* both fish over the side, one a second after the other, then hard over away from her */
              t14Fish(RUN, b.x + Math.cos(b.yw) * 2, b.z - Math.sin(b.yw) * 2, b.yw + 0.012); /* the two spread a little, to bracket her */
              b.fish.set(1);
              b.f2 = 1;
              b.fy = b.yw; /* the course both fish are aimed on: she holds it until the second is away */
              Object.assign(b, { mode: 'away', mt: -1, aw: b.yw + (Math.random() < 0.5 ? 2.2 : -2.2) });
            }
          } else if (b.mode === 'reload') {
            /* to the base, then two minutes lying there while the torpedoes are swung aboard */
            const [rx, rz] = trackXZ(b, 0),
              rd = Math.hypot(rx - b.x, rz - b.z);
            if (rd > 25) freeMove(b, Math.atan2(-(rz - b.z), rx - b.x), rd > 200 ? 15.4 : 4, dt);
            else if ((b.rt += dt) > 120 || G.mag < 2) {
              if (G.mag >= 2) ((G.mag -= 2), b.fish.set(2));
              b.mode = 'rejoin';
            } else freeMove(b, b.yw, 0, dt);
          } else if (b.mode === 'away') {
            if (b.f2 > 0 && (b.f2 -= dt) <= 0) (t14Fish(RUN, b.x, b.z, b.fy - 0.012), b.fish.set(0)); /* the second fish a second later */
            freeMove(b, b.f2 > 0 ? b.fy : b.aw, 15.4, dt);
            if (b.mt > 30) b.mode = 'rejoin';
          } else {
            /* back to the nearest point of her track, a little ahead of it */
            let bs = b.s,
              bd2 = 1e18;
            for (let s = 0; s < per; s += 20) {
              const [tx, tz] = trackXZ(b, s),
                d2 = (tx - b.x) ** 2 + (tz - b.z) ** 2;
              if (d2 < bd2) ((bd2 = d2), (bs = s));
            }
            const [tx, tz] = trackXZ(b, bs + 40);
            freeMove(b, Math.atan2(-(tz - b.z), tx - b.x), 12, dt);
            if (bd2 < 20 * 20) (Object.assign(b, { mode: 'track', s: bs }), Object.assign(b.bd, { off: 0, offT: 0, dyaw: 0 }));
          }
          x = b.x;
          z = b.z;
          yw = b.yw;
          v = b.v;
        }
        Object.assign(b.bd, { x, z, yaw: yw, v });
        RIDE.step(b.ride, x, z, Math.cos(yw), -Math.sin(yw), dt, 0);
        m.position.set(x, b.y0 + b.ride.hv, z);
        m.rotation.set(b.ride.ro, yw, b.ride.pi - 0.035 /* bow up: she is on the plane */, 'YXZ');
        m.updateMatrixWorld(true);
        /* the 25 mm rides on her: AA.gun aims in world yaw */
        const g = b.g;
        g.tur.rotation.y = g.yaw - yw;
        g.bar.rotation.x = -g.pit;
        g.bar.position.z = -0.12 * g.rec;
        g.piv.copy(g.loc);
        m.localToWorld(g.piv);
        g.x = g.piv.x;
        g.z = g.piv.z;
        if (typeof OCEAN !== 'undefined')
          OCEAN.place(b.hull || (b.hull = OCEAN.hull({ kind: 't14', cut: 'deck' })), x, z, Math.cos(yw), -Math.sin(yw), Math.max(v, 1), m.position.y + b.wl, 0);
      }
      t14Torps(RUN, dt);
    }); /* G.upd: the group each frame (the tests step it too) */
  };
  /* is a racetrack (and m metres round it) water deeper than dmin? (h: the seabed function of that map) */
  const deepOK = (F, u0, u1, d0, R, m, dmin, h) => {
    for (let u = u0 - R - m; u <= u1 + R + m; u += 40)
      for (let d = d0 - m; d <= d0 + 2 * R + m; d += 40) {
        const [x, z] = F.w(u, d);
        if (h(x, z) > -dmin) return false;
      }
    return true;
  };
  {
    /* two lie alongside the mole's east face, the second rafted outboard of the first, bows to seaward */
    for (const [k, du] of [
      [0, MOLE.W / 2 + 2.05],
      [1, MOLE.W / 2 + 2.05 + 3.7],
    ]) {
      const e = ship(MODELS.get('jp-t14', k), 15, du, MOLE.d0 + 72 - k * 4, 30);
      ANCH.push({ m: e.m, y0: e.m.position.y, yaw: SITE.ryS, ride: RIDE.make(6.4, 1.6, 3), e, hull: { o: { kind: 't14', cut: 'deck' } } });
    }
    /* and two on patrol inshore of the kaibokan, west of the mole: 18 knots round a 900 m racetrack */
    for (const [u0, u1, d0] of [
      [-1150, -250, 260],
      [-900, -250, 300],
      [250, 1100, 260],
    ])
      if (deepOK(SITE, u0, u1, d0, 35, 30, 4, HR)) {
        const upd = mkT14s(SITE, u0, u1, d0, 35, 2, 9.3, 45),
          _p = SITE.pat;
        SITE.pat = (dt) => (_p && _p(dt), upd(dt));
        SITE.t14 = [u0, u1, d0];
        break;
      }
  }
  /* two hand-cranked timber A-frame derricks on the T-head, leaning out over the berths either side (targets, as the cranes were) */
  for (const s of [-1, 1]) {
    const u = s * (MOLE.tw / 2 - 3),
      d = MOLE.d0 + MOLE.L - 5,
      [x, z] = SITE.w(u, d);
    target(MODELS.get('jp-aframe-derrick'), 'crane', 70, 8, u, d, SITE.ryA + (s > 0 ? 0 : Math.PI), SEA.WL + MOLE.h + 0.3 - H(x, z));
  }
  /* on the mole: the Decauville line from the T-head to the shore with two hand carts, drums under netting at its root, and the
     navy's dock hands (IJNAS working rig) at the T-head; one static mesh */
  {
    const acc = new GX.Acc(),
      onMole = (P, u, d, yaw) => {
        const [x, z] = SITE.w(u, d);
        acc.add(P, GX.xf(x, SEA.WL + MOLE.h + 0.25, z, SITE.ryS + (yaw || 0)));
      };
    onMole(MODELS.get('jp-decauville', MOLE.L - 4), 1.2, MOLE.d0, 0);
    onMole(MODELS.get('jp-rail-cart', true), 1.2, MOLE.d0 + 40, 0);
    onMole(MODELS.get('jp-rail-cart', false), 1.2, MOLE.d0 + MOLE.L - 12, 0);
    [
      ['work', -6, -4, Z],
      ['stand', 4, -3, -2],
      ['walk', -2, -30, Math.PI],
      ['stand', -9, -7, 0.5],
    ] /* all four on the T-head's deck (it runs from L - 10 to L) */
      .forEach(([pose, du, dd, yaw], k) => onMole(MODELS.get('crew', 'jn', pose, k), du, MOLE.d0 + MOLE.L + dd, yaw));
    const [dx, dz] = SITE.w(-30, 62);
    acc.add(MODELS.get('jp-drum-dump', 7, 4), GX.xf(dx, H(dx, dz), dz, SITE.ryA));
    const m = new THREE.Mesh(acc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
    scene.add(m);
  }
  [
    ['warehouse', -95, -45],
    ['warehouse', -45, -50],
    ['warehouse', 10, -52],
    ['hq', -8, -88],
    ['bunker', 80, -82],
  ].forEach(([t, u, d]) => bld(t, u, d, SITE.ryA));
  [
    [65, -25],
    [90, -25],
    [115, -25],
  ].forEach(([u, d]) => bld('fuel', u, d, 0));
  [
    ['truck', -60, 10],
    ['supply', 55, 15],
    ['tanker', 100, 12],
    ['jeep', -20, 20],
  ].forEach(([t, u, d], i) => bld(t, u, d, SITE.ryA + i));
  /* a perimeter fence (wire on posts) with a guard tower at each corner and at the given u along each long side; in the current frame FR */
  const fenceRect = (U0, U1, D0, D1, mids) => {
    const acc = new GX.Acc();
    const put = (P, x, z, yaw, y0, T) => acc.add(P, T || GX.xf(x, y0 == null ? GX.standY(P, x, z, yaw) : y0, z, yaw, 1));
    const edge = (u0, d0, u1, d1) => {
      const L = Math.hypot(u1 - u0, d1 - d0),
        n = Math.round(L / 6);
      for (let i = 0; i < n; i++) {
        const [ax, az] = FR.w(u0 + ((u1 - u0) * i) / n, d0 + ((d1 - d0) * i) / n),
          [bx2, bz] = FR.w(u0 + ((u1 - u0) * (i + 1)) / n, d0 + ((d1 - d0) * (i + 1)) / n);
        if (
          nearRoad((ax + bx2) / 2, (az + bz) / 2, 13) ||
          nearRoad(ax, az, 13) ||
          nearRoad(bx2, bz, 13) ||
          (FR !== SITE && WORLD.RT.near((ax + bx2) / 2, (az + bz) / 2, 9))
        )
          continue;
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
          GX.xfRun(ax, H(ax, az), az, bx2, H(bx2, bz), bz) /* following the ground from post to post */,
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
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(part(bx(0.18, 6.4, 0.18), g, sx, 3.2, sz, sz * 0.05, 0, -sx * 0.05));
      for (const y of [1.6, 3.4, 5.0])
        P.push(
          part(bx(2.1, 0.1, 0.1), g, 0, y, 1),
          part(bx(2.1, 0.1, 0.1), g, 0, y, -1),
          part(bx(0.1, 0.1, 2.1), g, 1, y, 0),
          part(bx(0.1, 0.1, 2.1), g, -1, y, 0),
        );
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
    [
      [U0 + 4, D0 + 4],
      [U1 - 4, D0 + 4],
      [U1 - 4, D1 - 4],
      [U0 + 4, D1 - 4],
    ]
      .concat(
        ...mids.map((u) => [
          [u, D0 + 4],
          [u, D1 - 4],
        ]),
      )
      .forEach(([u, d]) => gt(u, d));
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
        top = Math.max(
          ...KI84.CONTACT.map(([cx, cz]) => SURF(x0 + cx * Math.cos(ry) + cz * Math.sin(ry), z0 - cx * Math.sin(ry) + cz * Math.cos(ry))),
        ); /* the apron's top (SURF) under each wheel */
      target(M.ki84(bodies[i % 4], o), 'plane', 14, 7, u, DR - 100, ry, top - H(x0, z0) + 0.01, M.ki84(bodies[i % 4], Object.assign({ far: true }, o)));
    }
    /* the ground crew at work on the line (IJAAF khaki-tan coveralls, field caps) and a tractor to tow the fighters: one static mesh */
    {
      const acc = new GX.Acc(),
        at = (P, u, d, yaw) => {
          const [x, z] = FR.w(u, d);
          acc.add(P, GX.xf(x, GX.standY(P, x, z, FR.ryS + yaw), z, FR.ryS + yaw)); /* on the apron (SURF) */
        };
      [
        [1, 'work', 3.2, 2.2, Math.PI],
        [1, 'stand', 6, -2.5, 2.2],
        [4, 'kneel', 2.5, -3.6, 0.4],
        [4, 'work', 3.4, 2.4, Math.PI],
        [7, 'stand', -4, 3, -1.2],
        [7, 'walk', 8, 6, 0.8],
      ].forEach(([i, pose, du, dd, yaw], k) => at(MODELS.get('crew', 'ja', pose, k), -250 + i * 62 + du, DR - 100 + dd, yaw));
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
        const v = (62 + Math.random() * 45) | 0;
        g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 28) + ',0.5)';
        g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
      }
    }
    const YT = new THREE.CanvasTexture(yc);
    YT.wrapS = YT.wrapT = THREE.RepeatWrapping;
    YT.anisotropy = 8;
    drape(-330, 330, DR - 295, DR - 165, cc(YT, 66, 26), 1, 1, 0.27);
    [
      ['hangar', -210],
      ['hangar', -110],
      ['hangar', -10],
    ].forEach(([t, u]) => bld(t, u, DR - 215, FR.ryA + Z));
    [
      ['hq', -250, DR - 270],
      ['warehouse', 90, DR - 255],
      ['warehouse', 140, DR - 255],
      ['bunker', 230, DR - 230],
    ].forEach(([t, u, d]) => bld(t, u, d, FR.ryA));
    [
      [210, DR - 175],
      [235, DR - 175],
    ].forEach(([u, d]) => bld('fuel', u, d, 0));
    [
      ['truck', -160, DR - 150],
      ['supply', 40, DR - 160],
      ['tanker', 180, DR - 150],
      ['jeep', -60, DR - 130],
      ['apc', 120, DR - 165],
    ].forEach(([t, u, d], i) => bld(t, u, d, FR.ryA + 0.3 * i));
    /* control tower on the yard, in front of the hangars (a target): the reference-built Japanese tower (MODELS 'jp-control-tower') */
    {
      const P = MODELS.get('jp-control-tower');
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
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        q.flatMap((p) => [p[0], y, p[1]]),
        3,
      ),
    );
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, ru, 0, ru, rd, 0, rd], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(
      g,
      new THREE.MeshLambertMaterial({ map: tex, side: 2, polygonOffset: true, polygonOffsetFactor: -(off || 2), polygonOffsetUnits: -(off || 2) }),
    );
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
        acc.add(P, GX.xf(x, y == null ? GX.standY(P, x, z, yaw) : y, z, yaw, k));
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
      P.push(
        part(bx(4.4, 0.05, 0.75), j % 2 ? 0x3b8a32 : 0x2f7a2a, tx + Math.cos(a) * 2.0, ty - 0.82, tz + Math.sin(a) * 2.0, 0, -a, -0.42),
      ); /* each frond springs from the crown (its inner end at the trunk's head) and droops */
    }
    P.push(part(GX.sph(6), 0x5a3a1a, tx, ty - 0.1, tz, 0, 0, 0, 0.32, 0.3, 0.32));
    return P;
  };
  const stack = (r) => {
    const P = [];
    for (let i = 0; i < 6; i++) P.push(part(cyl(0.45, 0.45, 0.9, 8), i % 2 ? 0x5b3a2a : 0x3a4a5a, (i % 3) * 1.0 - 1, 0.45, (i >> 1) * 1.0 - 0.5));
    for (let i = 0; i < 3; i++) P.push(part(bx(1.2, 1.0, 1.2), 0xa8885a, 3 + (i % 2) * 1.3, 0.5, -0.6 + (i >> 1) * 1.3));
    for (let i = 0; i < 4; i++) P.push(part(bx(0.9, 0.5, 0.6), 0xb8a070, -3 + (i % 2) * 1.0, 0.3 + (i >> 1) * 0.5, 0.4 * (i >> 1)));
    return P;
  };
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
      P.push(part(bx(0.5, 0.5, 262), 0x5a4630, 65, wy - 0.1, 0), part(bx(0.5, 0.5, 262), 0x5a4630, 41, wy - 0.1, 0)); /* the edge beams, on the pile heads */
      S.acc.add(P, L0);
      /* the finger jetty, 190 m out to deep water, with bollards and a little white lighthouse at its end */
      flat(F, -4, 4, 60, 255, wy, PLANK, 2, 40, 3);
      const J = [];
      for (let k = 0; k <= 19; k++) for (const s of [-1, 1]) J.push(part(cyl(0.3, 0.3, 11, 6), 0x4a3a2a, 62 + k * 10, wy - 5.4, s * 3.7));
      for (let k = 0; k < 9; k++) for (const s of [-1, 1]) J.push(part(cyl(0.22, 0.26, 0.9, 6), 0x2a2a28, 75 + k * 20, wy + 0.45, s * 3.7));
      J.push(
        part(cyl(1.1, 1.5, 8, 8), 0xece8da, 250, wy + 4, 0),
        part(cyl(1.35, 1.35, 1.2, 8), 0xb02a20, 250, wy + 8.6, 0),
        part(cyl(0.3, 0.3, 1.6, 6), 0x222222, 250, wy + 9.8, 0),
      );
      S.acc.add(J, L0);
      use(-135, 135, 36, 70);
      /* four long sheds along the back of the yard (timber walls, rusty and grey iron) */
      FR = F;
      for (let i = 0; i < 4; i++) {
        target(
          MODELS.get('jp-godown', 34, 15),
          'warehouse',
          40,
          17,
          -140 + i * 62,
          -62,
          YF,
        ); /* a timber godown (the waterfront piece), under the Hinomaru, so a target */
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
        /* hand-cranked timber A-frame derricks at the wharf's edge, leaning out over the water */
        const [ex, ez] = F.w(u, 61);
        target(MODELS.get('jp-aframe-derrick'), 'crane', 30, 7, u, 61, YS, wy - H(ex, ez));
      }
      FR = SITE;
      for (let i = 0; i < 6; i++) S.at(stack(), -100 + i * 38, 22 + (i % 2) * 4, YA + i, pad + 0.12); /* on the coral yard */
      /* a village of thatched huts on posts behind the sheds, and the harbour church */
      for (let i = 0; i < 14; i++) {
        const u = -190 + (i % 7) * 30 + (r() - 0.5) * 8,
          d = -132 + (i >> 3) * 30 + (r() - 0.5) * 8;
        S.at(PB.hut(0, 0, 0, 5 + (i % 3) * 0.5, 4 + (i % 2) * 0.5).P, u, d, r() * 6.28);
        use(u - 5, u + 5, d - 5, d + 5);
      }
      /* outrigger canoes drawn up above the tide line */
      const cc2 = [0x7a5a38, 0x3a6a78, 0x8a3a2a, 0x6a6a3a, 0x7a5a38];
      for (let i = 0; i < 5; i++) S.at(MODELS.get('pac-canoe', cc2[i]), -150 + i * 12, 34, YA + (r() - 0.5) * 0.4, pad + 0.12);
      for (let i = 0; i < 4; i++) S.at(MODELS.get('pac-canoe', cc2[i]), 70 + i * 12, 34, YA + (r() - 0.5) * 0.4, pad + 0.12);
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
      for (let i = 0; i < 4; i++) S.at(MODELS.get('pac-canoe', cc2[i]), -170 + i * 9, 24 + (i % 2) * 5, YA + (r() - 0.5) * 0.4, null);
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
    for (const [u0, u1, d0] of [
      [-350, 1500, 420],
      [-350, 1000, 520],
      [-500, 500, 520],
      [-400, 400, 700],
      [-300, 300, 900],
    ])
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
      const g = {
        t: e,
        grp: new THREE.Group(),
        tur,
        bar,
        x: 0,
        z: 0,
        nr: 0,
        bias: new V(0, 0, 0),
        yaw: 0,
        pit: 0.5,
        acq: 0,
        mag: 30,
        rl: 0,
        cd: 0,
        side: 1,
        rec: 0,
        snd: 0,
        v: new V(0, 0, 0),
        piv: new V(),
        site: true,
        ship: true,
        loc: new V(mx, top + 0.9, mz),
      };
      AA.gun.push(g);
      guns.push(g);
    }
    e.m.add(shipWakeMesh(1, -e.k0 - e.s1 / 2 + 0.45) /* on the water, just above her waterline */);
    e.m.matrixAutoUpdate = true;
    let s = Math.random() * per;
    /* two Type T-14s on an inner track, inshore of her, where the sea is deep enough */
    const tU1 = Math.min(u1, u0 + 900),
      t14 = deepOK(F, u0, tU1, d0 - 180, 35, 30, 6, WH) ? mkT14s(F, u0, tU1, d0 - 180, 35, 2, 9.3, 45) : null;
    const P = { e, vis: true, track: { u0, u1, d0, R }, t14 };
    const bd = COLL.add({ sea: true, hl: 39, r: 4.6, mg: 30, x: e.m.position.x, z: e.m.position.z, yaw: F.ryS, v: 0 }); /* she gives way (COLL) */
    P.upd = (dt) => {
      if (t14) t14(dt);
      const m = e.m;
      if (!e.dead) {
        const s0 = s,
          o0 = bd.off;
        COLL.steer(bd, dt, 600);
        s = (s + 8.5 * dt * bd.slow + per) % per;
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
          [xt, zt] = F.w(u, d),
          wx = F.A.x * du + F.S.x * dd,
          wz = F.A.z * du + F.S.z * dd,
          yt = Math.atan2(-wz, wx),
          x_ = xt + Math.sin(yt) * bd.off,
          z_ = zt + Math.cos(yt) * bd.off,
          yw_ = yt + bd.dyaw,
          held = COLL.intrudes(bd, x_, z_, yw_) /* she holds rather than go into another hull */,
          x = held ? bd.x : x_,
          z = held ? bd.z : z_,
          yw = held ? bd.yaw : yw_,
          rd = e.ride || (e.ride = RIDE.make(33.5, 4.2, 8)); /* she rides the waves (RIDE): a 78 m escort, 9.3 m beam */
        if (held) ((s = s0), (bd.off = o0), (bd.slow = 0));
        Object.assign(bd, { x, z, yaw: yw, v: 8.5 * Math.abs(bd.slow) });
        RIDE.step(rd, x, z, Math.cos(yw), -Math.sin(yw), dt, 0);
        m.position.set(x, y0 + rd.hv, z);
        m.rotation.set(rd.ro, yw, rd.pi, 'YXZ');
      } else bd.v = 0;
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
    [
      ['warehouse', -110, -80],
      ['warehouse', -110, 0],
      ['warehouse', -40, -95],
      ['hq', 90, -80],
      ['bunker', 110, 20],
      ['warehouse', 20, 85],
    ].forEach(([t, u, d]) => bld(t, u, d, F.ryA));
    [
      ['truck', -60, 40],
      ['supply', -20, 30],
      ['jeep', 30, -20],
      ['tanker', 60, 60],
      ['apc', 85, 90],
      ['truck', -90, 80],
    ].forEach(([t, u, d], i) => bld(t, u, d, F.ryA + 0.4 * i));
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
  /* ----- Depot Mikawa's landing (the user's, 2026-11-21): a timber pier from its shore (the compound stands 300 m inland), where the
     freighter's Daihatsu brings the cargo from the IJN base. F.landing: the pier head, for the freighter's run (mkCiv) ----- */
  const mikawaLanding = (F) => {
    let ds = 170;
    while (ds < 700 && WH(...F.w(0, ds)) > SEA.WL) ds += 5;
    F.shoreD = ds;
    F.landing = [-5, ds + 76];
  }; /* (where; the pier itself is built after the naval bases, with pierF: see below) */
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
  /* a sea-lane finder: a coarse grid of open deep water (a cell counts only if it and its four neighbours are all at least 14 m deep), a breadth-first search, then the corners pulled tight by line of sight */
  const LANES = (() => {
    const C = 800,
      N = 125,
      O0 = -50000,
      sea = new Uint8Array(N * N),
      ok = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) sea[j * N + i] = HR(O0 + (i + 0.5) * C, O0 + (j + 0.5) * C) < -14 ? 1 : 0;
    const NB = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
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
    /* clear water from p to q, at least lim deep (the seabed below lim; default: water at all), looked at every 50 m */
    const los = (p, q, lim) => {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]),
        n = Math.ceil(L / 50),
        b = lim == null ? -9 : lim;
      for (let k = 0; k <= n; k++) if (HR(p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n) > b) return false;
      return true;
    };
    /* the nearest open cell that can be seen from point p */
    const near = (c, p, lim) => {
      let best = null,
        bd = 1e12;
      for (let dj = -12; dj <= 12; dj++)
        for (let di = -12; di <= 12; di++) {
          const i = c[0] + di,
            j = c[1] + dj;
          if (i < 0 || j < 0 || i >= N || j >= N || !ok[j * N + i]) continue;
          const d = di * di + dj * dj;
          if (d < bd && los(p, ctr(i, j), lim)) {
            bd = d;
            best = [i, j];
          }
        }
      return best;
    };
    /* the waypoints between two open-water points (excluding both), or null if there is no sea route */
    /* lim: the least depth for the ship (her draught), as in los */
    const route = (a, b, lim) => {
      if (los(a, b, lim)) return [];
      const s0 = near(cell(a), a, lim),
        g0 = near(cell(b), b, lim);
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
        while (j > i && !los(cur, cells[j], lim)) j--;
        if (los(cur, b, lim)) break;
        out.push(cells[j]);
        cur = cells[j];
        i = j + 1;
      }
      return out;
    };
    return { route, los };
  })();
  /* a far harbour's anchorage for a ship of length len and draught dr: the first spot seaward of the jetty head (255 m) with dr x 0.8 of
     water under the whole hull, else the deepest found (WH is the far map's seabed) */
  const anchorFar = (F, u, len, dr) => {
    let best = 300,
      bz = 1e9;
    for (let d = 270 + len / 2; d <= 900; d += 10) {
      let worst = -1e9;
      for (let dd = d - len / 2; dd <= d + len / 2; dd += 15)
        for (const uu of [u - 8, u, u + 8]) {
          const [x, z] = F.w(uu, dd);
          worst = Math.max(worst, WH(x, z));
        }
      if (worst < SEA.WL - dr * 0.8) return d;
      if (worst < bz) ((bz = worst), (best = d));
    }
    return best;
  };
  /* o.jA, o.jB: the [u, d] each end's Daihatsu runs to (default a colonial harbour's jetty head) */
  const mkCiv = (parts, len, FA, FB, u, phase, dr, o) => {
    o = o || {};
    const dA = anchorFar(FA, u, len, dr || 8),
      dB = anchorFar(FB, u, len, dr || 8),
      p0 = FA.w(u, dA),
      p3 = FB.w(u, dB);
    let p1 = null,
      p2 = null,
      mid = null;
    const lim = SEA.WL - (dr || 8) * 0.9; /* deep enough for her all the way (90% of her draught under the keel line) */
    /* o.via [p, q]: she goes through that straight water (a dredged channel, narrower than the lane finder's grid sees) */
    const viaRoute = (a, b) => {
      if (!o.via) return LANES.route(a, b, lim);
      const [v0, v1] = o.via,
        r1 = LANES.route(a, v0, lim),
        r2 = LANES.route(v1, b, lim);
      return r1 && r2 && LANES.los(v0, v1, lim) ? [...r1, v0, v1, ...r2] : null;
    };
    for (const off of [900, 600, 400]) {
      const a = FA.w(u, dA + off),
        b = FB.w(u, dB + off);
      if (!LANES.los(p0, a, lim) || !LANES.los(b, p3, lim)) continue;
      const r = viaRoute(a, b);
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
    const c = { m, s1, k0, pts, seg, L, v: 7.5, dock: 150, phase, yaw: FA.ryS, vis: true, len, onA: o.onA, onB: o.onB };
    c.bd = COLL.add({ sea: true, hl: len / 2, r: len * 0.075, mg: 40, x: p0[0], z: p0[1], yaw: c.yaw, v: 0, maxOff: 250 }); /* she gives way (COLL) */
    CIV.push(c);
    /* her Daihatsu: works between her and the harbour's jetty head while she lies at anchor (1945 practice: deep-draught ships were
       unloaded offshore by barge), and waits at that jetty while she is at sea */
    {
      const [bm, bs1, bk0] = asMesh(MODELS.get(o.boat || 'jp-daihatsu')); /* o.boat: an American ship's LCM(3) */
      bm.userData.lcm = !!o.boat;
      scene.add(bm);
      c.bg = {
        m: bm,
        y0: SEA.WL + bk0 + bs1 / 2,
        ride: RIDE.make(o.boat ? 6.6 : 6.4, o.boat ? 1.9 : 1.5, 3),
        yaw: FA.ryS,
        u,
        dA,
        dB,
        FA,
        FB,
        jA: o.jA || [-9, 245],
        jB: o.jB || [-9, 245],
      };
      bm.position.set(...((p) => [p[0], c.bg.y0, p[1]])(FA.w(...c.bg.jA)));
    }
    /* under the Hinomaru, so a target: it sinks where it is hit and stays down until the flight restarts (an American one, o.us, is not) */
    if (!o.us)
      c.t = { m, lit: null, c: m.position, r: len * 0.3, hp: len * 1.6, hp0: len * 1.6, type: 'ship', dead: false, s1, k0, col: 0x555555, kind: 'civ' };
    if (c.t) T.push(c.t);
    m.rotation.y = c.yaw;
    m.position.set(p0[0], SEA.WL + k0 + s1 / 2, p0[1]); /* her waterline (the model's y = 0) at the sea's */
    return c;
  };
  /* her cargo ashore (onA at the first harbour, onB at the second): when her boat reaches the jetty on its first run in each stay at
     anchor (40% of the way through the stay). Every frame for every run, seen or not, so a base far off is still supplied; a sunk ship
     brings nothing */
  const civCargo = (c, t) => {
    if (!c.onA && !c.onB) return;
    if (c.t && c.t.dead) return;
    const cyc = 2 * (c.L / c.v + c.dock),
      tt = (t + c.phase) % cyc,
      kA = c.dock * 0.4,
      kB = c.dock * 1.4 + c.L / c.v,
      was = c.ctt;
    c.ctt = tt;
    if (was === undefined) return;
    const past = (k) => (was <= tt ? was < k && tt >= k : was < k || tt >= k);
    if (c.onA && past(kA)) c.onA();
    if (c.onB && past(kB)) c.onB();
  };
  const updCiv = (c, t, dt) => {
    if (c.t && c.t.dead) {
      c.m.children[0].visible = false;
      return;
    }
    const cyc = 2 * (c.L / c.v + c.dock);
    /* under way she gives way to any ship in her lane (COLL): steps out of it, and holds back her schedule while she is slowed */
    if (c.bd.v > 0 && dt > 0) {
      COLL.steer(c.bd, dt, 700);
      c.phase -= (1 - c.bd.slow) * dt;
    }
    const tt = (t + c.phase) % cyc;
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
    const yt = back ? Math.atan2(dz, -dx) : Math.atan2(-dz, dx),
      oo = moving ? c.bd.off || 0 : 0,
      cx = a[0] + dx * k + Math.sin(yt) * oo /* to starboard of her route while she gives way */,
      cz = a[1] + dz * k + Math.cos(yt) * oo,
      rd = c.ride || (c.ride = RIDE.make(0.43 * c.len, 0.08 * c.len, c.len < 60 ? 6 : 9));
    if (!moving) c.bd.off = c.bd.offT = 0;
    Object.assign(c.bd, { x: cx, z: cz, yaw: c.yaw, v: moving ? c.v * (c.bd.slow == null ? 1 : c.bd.slow) : 0 });
    if (dt > 0) RIDE.step(rd, cx, cz, Math.cos(c.yaw), -Math.sin(c.yaw), dt, 0);
    c.m.position.set(cx, SEA.WL + c.k0 + c.s1 / 2 + rd.hv, cz);
    c.m.rotation.set(rd.ro, c.yaw, rd.pi, 'YXZ');
    c.m.children[0].visible = moving;
    /* the Daihatsu: at anchor (the first or the second dock period) she shuttles ship -> jetty -> ship; at sea it waits at the jetty */
    const B = c.bg;
    if (B) {
      const atB = tt >= c.dock + c.L / c.v,
        F = atB ? B.FB : B.FA,
        dd = atB ? B.dB : B.dA,
        tl = moving ? -1 : (atB ? tt - c.dock - c.L / c.v : tt) / c.dock,
        P0 = F.w(B.u + Math.sign(B.u) * -(0.07 * c.len + 3), dd - 15) /* alongside her, on the jetty side */,
        P1 = F.w(...(atB ? B.jB : B.jA)); /* the jetty head (or the landing) */
      let k = 1;
      if (tl >= 0) k = tl < 0.15 ? 0 : tl < 0.4 ? (tl - 0.15) / 0.25 : tl < 0.6 ? 1 : tl < 0.85 ? 1 - (tl - 0.6) / 0.25 : 0;
      const e = k * k * (3 - 2 * k),
        bx = P0[0] + (P1[0] - P0[0]) * e,
        bz = P0[1] + (P1[1] - P0[1]) * e,
        dx = P1[0] - P0[0],
        dz = P1[1] - P0[1],
        out = tl >= 0.6 && tl < 0.85;
      if (k > 0 && k < 1) B.yaw = out ? Math.atan2(dz, -dx) : Math.atan2(-dz, dx);
      if (dt > 0) RIDE.step(B.ride, bx, bz, Math.cos(B.yaw), -Math.sin(B.yaw), dt, 0);
      B.m.position.set(bx, B.y0 + B.ride.hv, bz);
      B.m.rotation.set(B.ride.ro, B.yaw, B.ride.pi, 'YXZ');
      B.m.matrixAutoUpdate = true;
      if (typeof OCEAN !== 'undefined')
        OCEAN.place(
          B.hh || (B.hh = OCEAN.hull({ kind: 'rect', cut: 'deck', hl: B.m.userData.lcm ? 7.4 : 6.8, hw: B.m.userData.lcm ? 2.0 : 1.4 })),
          bx,
          bz,
          Math.cos(B.yaw),
          -Math.sin(B.yaw),
          0,
          SEA.WL + B.ride.hv - 0.4,
          0,
        ); /* the sea kept out of her well */
    }
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
    else if (F.kind === 'air') farBuild(F, () => (farAirbase(F, seed), F.inland ? null : mkPatrol(F)));
    else farBuild(F, () => (compound(F, seed), F.id === 'cv1' && mikawaLanding(F), mkPatrol(F)));
  }
  {
    const ports = FS.list.filter((f) => f.kind === 'port');
    if (ports.length > 1) {
      const [A, B] = ports;
      mkCiv(M.freighter('jp'), 137, A, B, 70, 0, 7.8); /* anchored either side of the jetty's line, clear of each other */
      mkCiv(M.tanker('jp'), 153.5, B, A, -70, 900, 9.1);
    }
  }
  /* ----- THE NAVAL BASES (user's sites, 2026-11-20): the IJN base on the north tip of the long island and the US Navy PT-boat base on the
     south shore of the big island (FS.nav). Built in each site's own frame (u along the coast, d seaward) on its levelled coral pad. ----- */
  /* a craft moored or at anchor in frame F: rides the waves where she lies (ANCH, rideAt), the sea kept out of her (OCEAN hull) */
  const mooredF = (F, P, u, d, yaw, len, beam) => {
    const [m, s1, k0] = asMesh(P),
      [x, z] = F.w(u, d);
    GX.far(m, Math.max(0.3, len / 120)); /* her distant form beyond 1 km */
    m.position.set(x, SEA.WL + k0 + s1 / 2, z);
    m.rotation.y = yaw;
    scene.add(m);
    const o = {
      m,
      y0: m.position.y,
      yaw,
      ride: RIDE.make(0.43 * len, 0.45 * beam, 3),
      hull: { o: { kind: 'rect', cut: 'deck', hl: len * 0.46, hw: beam * 0.42 } },
    };
    ANCH.push(o);
    return o;
  };
  /* a timber pier on piles from d0 out to d1, w wide, centred on u: plank deck, two rows of piles every 6 m, edge beams, bollards (COLL keeps ships off it) */
  const bedF = (F) => (Math.max(Math.abs(F.O.x), Math.abs(F.O.z)) > 13000 ? WH : HR); /* the seabed itself (H stops at the painted water) */
  const pierF = (F, S, u, d0, d1, w, wy) => {
    flat(F, u - w / 2, u + w / 2, d0, d1, wy, PLANK, Math.max(1, w / 4), (d1 - d0) / 5, 3);
    const bed = bedF(F),
      L = d1 - d0,
      at = (x, s) => bed(...F.w(u + s * (w / 2 - 0.3), d0 + x)) - 1.2 - wy; /* each pile driven into the bed */
    let ab = 0;
    for (const dd of [0, 4, 8]) for (const s of [-1, 0, 1]) ab = Math.min(ab, bed(...F.w(u + (s * w) / 2, d0 + dd)) - wy);
    const [ox, oz] = F.w(u, d0);
    S.acc.add(MODELS.get('naval-pier', L, w, at, ab - 0.6, false), GX.xf(ox, wy, oz, F.ryS));
    const [cx, cz] = F.w(u, (d0 + d1) / 2);
    COLL.add({ sea: true, fixed: true, x: cx, z: cz, yaw: F.ryS, hl: L / 2, r: w / 2, v: 0 });
    SURF.wet(F.w(u - w / 2, d0), F.w(u + w / 2, d1)); /* the crews walk out on its deck */
  };
  /* a yard surface in frame F at height y, on a 10 m grid that rides up over the drawn ground wherever that stands higher (the 100 m
     terrain triangles cross the pad's edges), so nothing on it is ever buried */
  const flatD = (F, u0, u1, d0, d1, y, tex, tu) => {
    const nu = Math.ceil((u1 - u0) / 10),
      nd = Math.ceil((d1 - d0) / 10),
      pos = [],
      uv = [],
      idx = [];
    for (let j = 0; j <= nd; j++)
      for (let i = 0; i <= nu; i++) {
        const u = u0 + ((u1 - u0) * i) / nu,
          d = d0 + ((d1 - d0) * j) / nd,
          [x, z] = F.w(u, d);
        pos.push(x, Math.max(y, H(x, z) + 0.12), z);
        uv.push((u - u0) / tu, (d - d0) / tu);
      }
    for (let j = 0; j < nd; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i;
        idx.push(a, a + 1, a + nu + 2, a, a + nu + 2, a + nu + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    g.setIndex(idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex, side: 2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.userData.surface = true;
    scene.add(m);
    return m;
  };
  const naval = (F) => {
    const r = rng(F.navy === 'jp' ? 4242 : F.navy === 'usdep' ? 4444 : 4343),
      S = siteAcc(F),
      YS = F.ryS,
      YA = F.ryA,
      YF = F.ryA + Math.PI,
      pad = F.ph,
      gy = pad + 0.12;
    const rects = [];
    const taken = (u, d, m) => rects.some((q) => u > q[0] - m && u < q[1] + m && d > q[2] - m && d < q[3] + m);
    const use = (u0, u1, d0, d1) => rects.push([u0, u1, d0, d1]);
    let pat = null;
    if (F.navy === 'jp') {
      /* the IJN base: a coral yard, a coral-block mole with a T-head out to 5 m of water, godowns, the HQ under the Rising Sun,
         fuel, drums, derricks at the mole's root; T-14s and small craft moored; 25 mm guns, a searchlight and the coast battery */
      flatD(F, -F.pu, F.pu, F.pi + 5, F.po - 2, gy, CORAL, 10);
      const ML = 150,
        MW = 8,
        MT = 26,
        Md0 = -2;
      {
        const g = new GX.Acc().add(MODELS.get('jp-mole', ML, MW, 2.2, MT, -6), null).geometry(),
          m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })),
          [x, z] = F.w(0, Md0);
        m.position.set(x, SEA.WL, z);
        m.rotation.y = YS;
        m.userData.surface = true; /* the crews walk on it (SURF) */
        scene.add(m);
        SURF.wet(F.w(-MW / 2, Md0), F.w(MW / 2, Md0 + ML - 12));
        SURF.wet(F.w(-MT / 2, Md0 + ML - 12), F.w(MT / 2, Md0 + ML + 2));
        const [sx, sz] = F.w(0, Md0 + (ML - 10) / 2),
          [tx, tz] = F.w(0, Md0 + ML - 5);
        COLL.add({ sea: true, fixed: true, x: sx, z: sz, yaw: YS, hl: (ML - 10) / 2, r: MW / 2, v: 0 });
        COLL.add({ sea: true, fixed: true, x: tx, z: tz, yaw: YA, hl: MT / 2, r: 5, v: 0 });
      }
      use(-MT / 2 - 4, MT / 2 + 4, 0, 30);
      FR = F;
      for (const u of [-14, 14]) target(MODELS.get('jp-aframe-derrick'), 'crane', 30, 7, u, -2, YS); /* on the yard's edge at the mole's root */
      for (let i = 0; i < 3; i++) {
        target(MODELS.get('jp-godown', 30, 14), 'warehouse', 40, 16, -110 + i * 42, -55, YF);
        use(-126 + i * 42, -94 + i * 42, -64, -46);
      }
      bld('hq', 85, -120, YA);
      use(70, 100, -135, -105);
      for (const u of [95, 120]) bld('fuel', u, -45, 0);
      use(85, 130, -55, -35);
      FR = SITE;
      /* barracks: two long timber huts at the back of the yard */
      for (const u of [-90, -40]) {
        S.at(MODELS.get('jp-godown', 26, 9), u, -150, YA);
        use(u - 14, u + 14, -156, -144);
      }
      S.at(MODELS.get('jp-drum-dump', 7, 4), -120, -110, YA, gy);
      S.at(MODELS.get('jp-drum-dump', 6, 3), -75, -105, YA + 0.2, gy);
      use(-130, -65, -118, -98);
      for (let i = 0; i < 5; i++) S.at(stack(r), -105 + i * 12, -20 + (i % 2) * 6, YA + i, gy);
      use(-112, -50, -26, -8);
      S.at(FLG.pole('jn', 12, 3.0, 0, 0, 0, 0), 60, -110, YA); /* the Rising Sun over the HQ */
      /* moored: two Type T-14s alongside the mole, a Daihatsu and a lighter at the T-head */
      const sideU = MW / 2 + 1.9;
      mooredF(F, MODELS.get('jp-t14'), -sideU, Md0 + 85, YS, 15, 3.6);
      mooredF(F, MODELS.get('jp-t14'), sideU, Md0 + 110, YS + Math.PI, 15, 3.6);
      /* her freighter runs between the base and Depot Mikawa (the user's, 2026-11-21): anchored off each, her Daihatsu taking the cargo
         to the mole's T-head here and to the depot's landing there (mkCiv) */
      {
        const MK = FS.list.find((s) => s.id === 'cv1');
        const CH = FS.chan[0];
        if (MK && MK.landing)
          mkCiv(M.freighter('jp'), 137, F, MK, 60, 0, 7.8, {
            jA: [-MT / 2 - 2.2, Md0 + ML - 4],
            jB: MK.landing,
            via: [CH.a, CH.b],
            /* she brings the base's torpedoes (the user's, 2026-11-21: the runs resupply the bases): each call six more Type 91s into
               the store its T-14s reload from, up to what the store holds */
            onA: () => {
              const G = (SITE.t14w.groups || []).find((g) => g.F === F);
              if (G) G.mag = Math.min(G.cap, G.mag + T14MAG);
            },
          }); /* through the dredged channel */
        /* the channel's buoys: red to port going in from the sea (left of a -> b), green to starboard, every 400 m */
        {
          const ax = CH.a[0],
            az = CH.a[1],
            L = Math.hypot(CH.b[0] - ax, CH.b[1] - az),
            fx = (CH.b[0] - ax) / L,
            fz = (CH.b[1] - az) / L,
            P = [];
          for (let s = 0; s <= L; s += 400)
            for (const sd of [-1, 1]) {
              const off = (CH.w / 2 + 6) * sd,
                x = ax + fx * s - fz * off,
                z = az + fz * s + fx * off,
                c = sd < 0 ? 0xb8302a : 0x2f7a3a;
              P.push(part(cyl(0.9, 1.1, 1.6, 10), c, x, SEA.WL + 0.5, z), part(cyl(0.12, 0.5, 2.2, 8), c, x, SEA.WL + 2.4, z));
            }
          const m = new THREE.Mesh(new GX.Acc().add(P, null).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
          scene.add(m);
        }
      }
      mooredF(F, MODELS.get('jp-lighter'), MT / 2 + 2.6, Md0 + ML - 6, YS, 12, 4);
      /* guns and light */
      farGun(F, -125, -10, YS);
      farGun(F, 125, -15, YS);
      farGun(F, 0, -175, YS);
      farLamp(F, 135, 8, YS);
      use(-132, -118, -17, -3);
      use(118, 142, -22, 15);
      COAST.port(F, r, taken, use);
      pat = mkPatrol(F);
      /* the base at work: navy hands walking between the godowns, the HQ, the barracks and out along the mole; a Type 94 truck on the yard */
      const walkJ = (v, path, sp, wait) =>
        AFLD.add(
          CREW_RIG('jn', v),
          path.map(([u, d]) => F.w(u, d)),
          sp,
          wait,
          'walk',
        );
      walkJ(
        0,
        [
          [0, -30],
          [0, 140],
        ],
        1.3,
        12,
      );
      walkJ(
        1,
        [
          [85, -100],
          [30, -40],
          [16, -10],
        ],
        1.4,
        8,
      );
      walkJ(
        0,
        [
          [-68, -38],
          [-14, -10],
          [0, -2],
          [0, 60],
        ],
        1.2,
        10,
      );
      walkJ(
        1,
        [
          [-90, -138],
          [-30, -80],
          [40, -80],
        ],
        1.4,
        7,
      );
      walkJ(
        1,
        [
          [110, -30],
          [60, -25],
        ],
        1.2,
        14,
      );
      AFLD.add(MODELS.drivenAs('jn', 1, 'jp-type94-cargo') /* a sailor at the wheel, in working blues */, [F.w(-110, -36), F.w(60, -36)], 5, 25, 'veh');
    } else if (F.navy === 'usdep') {
      /* THE US NAVY SUPPLY DEPOT (the user's, 2026-11-21): on the south shore of the islet 7.2 km east of the PT-boat base, as far
         from it as Depot Mikawa is from the IJN base. A coral yard behind a fence; two big Quonset store huts and a row of small ones
         (office, quarters); a tank farm; stacked stores; a 10 m supply pier out to deep water; the Stars and Stripes; trucks, a
         jeep on its rounds, sailors at work. */
      flatD(F, -F.pu, F.pu, F.pi + 5, F.po - 2, gy, CORAL, 10);
      const wy = pad + 0.6;
      pierF(F, S, 0, F.po - 4, 170, 10, wy); /* the supply pier */
      /* the resupply run (the user's, 2026-11-21): a Liberty ship between the US naval base and here, anchored off each in turn while
         her LCM(3) works the cargo in to the base's middle finger pier (its east side, clear of PT-110) and to this pier's head;
         anchored west of the base's piers, clear of the PCE's berth and PT-110's lane */
      {
        const NB = FS.nav.find((s) => s.navy === 'us');
        if (NB)
          mkCiv(M.freighter('us'), 134.6, NB, F, -150, 300, 8.5, {
            jA: [-25 + 3 + 2.4, 128],
            jB: [-5 - 2.4, 160],
            boat: 'us-lcm3',
            us: true,
            onA: () => (NB.store = Math.min(3, (NB.store || 0) + 1)) /* a full load of ammunition into the base's store (the PCE rearms from it) */,
          });
      }
      use(-14, 14, -6, 180);
      for (const [u, d] of [
        [-75, -95],
        [-25, -95],
      ]) {
        S.at(MODELS.get('us-quonset', 'elephant'), u, d, YA, gy); /* the store huts */
        use(u - 20, u + 20, d - 18, d + 18);
      }
      for (let i = 0; i < 4; i++) {
        const u = 40 + i * 22;
        S.at(MODELS.get('us-quonset', 'std'), u, -105, YA, gy);
        use(u - 8, u + 8, -113, -97);
      }
      for (let i = 0; i < 4; i++) S.at(MODELS.get('us-fuel-tank'), -120 + (i % 2) * 11, -45 - (i >> 1) * 11, YA, gy); /* the tank farm */
      use(-130, -100, -62, -36);
      for (let i = 0; i < 6; i++) S.at(stack(), -60 + (i % 3) * 14, -40 - ((i >> 1) & 1) * 12 - (i > 2 ? 0 : 0), YA + i * 0.5, gy); /* stores on the yard */
      use(-68, -24, -60, -32);
      S.at(FLG.pole('us', 12, 2.8, 0, 0, 0, 0), 20, -30, YA);
      S.at(M.cargoTruck(), 60, -40, YA - 0.1);
      S.at(M.cargoTruck(), 75, -42, YA + 0.05);
      S.at(M.fuelTruck(0x6b7350), -95, -25, YS);
      use(50, 85, -50, -32);
      FR = F;
      fenceRect(-F.pu + 8, F.pu - 8, F.pi + 12, -2, []);
      FR = SITE;
      const walkU = (v, path, sp, wait) =>
        AFLD.add(
          CREW_RIG('us', v),
          path.map(([u, d]) => F.w(u, d)),
          sp,
          wait,
          'walk',
        );
      walkU(
        0,
        [
          [-75, -75],
          [-10, -20],
          [0, 0],
          [0, 150],
        ],
        1.3,
        10,
      );
      walkU(
        1,
        [
          [-25, -75],
          [-50, -45],
        ],
        1.3,
        12,
      );
      walkU(
        2,
        [
          [50, -90],
          [20, -35],
          [-110, -30],
        ],
        1.2,
        9,
      );
      walkU(
        1,
        [
          [95, -90],
          [95, -30],
        ],
        1.4,
        14,
      );
      AFLD.add(M.jeepD(), [F.w(-120, -12), F.w(120, -12)], 7, 20, 'veh');
    } else {
      /* the US Navy PT-boat base: a coral yard, two finger piers with PT boats, the PCE's own pier (her berth: she is out on patrol),
         a fuel jetty and its tank farm, Quonset huts, the boat shop, the Stars and Stripes */
      flatD(F, -F.pu, F.pu, F.pi + 5, F.po - 2, gy, CORAL, 10);
      const wy = pad + 0.6;
      for (const u of [-75, -25]) pierF(F, S, u, F.po - 4, 140, 6, wy); /* out past where the 100 m home mesh meets the water */
      pierF(F, S, 75, F.po - 4, 150, 8, wy); /* the PCE's berth (56 m alongside its outer end) */
      pierF(F, S, 135, F.po - 4, 55, 4, wy); /* the fuel jetty */
      use(-80, -20, 0, 130);
      use(70, 140, 0, 110);
      /* PT boats alongside the finger piers, bows out */
      const pt = (num, u, d) => {
        const g = PTB.build(num);
        g.userData.spray.visible = false;
        const [x, z] = F.w(u, d);
        g.position.set(x, SEA.WL, z);
        g.rotation.y = YS;
        scene.add(g);
        const o = { m: g, y0: SEA.WL, yaw: YS, ride: RIDE.make(0.43 * 24.4, 0.45 * 6.3, 3), hull: { o: { kind: 'rect', cut: 'deck', hl: 11.2, hw: 2.6 } } };
        o.cb = COLL.add({ sea: true, fixed: true, hl: 12.2, r: 3.2, mg: 4, x, z, yaw: YS, v: 0 });
        ANCH.push(o);
      };
      pt('107', -75 - 3 - 3.3, 95);
      pt('108', -75 + 3 + 3.3, 122);
      {
        /* PT-110 goes out on patrol and comes back: out from her berth to 900 m off at 10 knots, an hour's worth of waiting compressed */
        pt('110', -25 - 3 - 3.3, 108);
        const o = ANCH[ANCH.length - 1];
        o.cb.fixed = false;
        o.sh = { a: F.w(-25 - 3 - 3.3, 108), b: F.w(-25 - 3 - 3.3, 900), wait: 150, ph: 40, v: 5.1 };
        o.wk = shipWakeMesh(24.4 / 78, 0.4); /* the same painted wake as the fleet's PT boats */
        o.wk.visible = false;
        o.m.add(o.wk);
      }
      /* the base at work: sailors between the huts, the shop, the tank farm and out on the piers; the jeep on its rounds */
      const walkU = (v, path, sp, wait) =>
        AFLD.add(
          CREW_RIG('us', v),
          path.map(([u, d]) => F.w(u, d)),
          sp,
          wait,
          'walk',
        );
      walkU(
        0,
        [
          [-117, -55],
          [-75, -2],
          [-75, 85],
        ],
        1.4,
        8,
      );
      walkU(
        1,
        [
          [-25, -30],
          [-25, 100],
        ],
        1.3,
        10,
      );
      walkU(
        2,
        [
          [45, -28],
          [105, -42],
        ],
        1.2,
        12,
      );
      walkU(
        0,
        [
          [-100, -90],
          [-35, -90],
          [-10, -40],
        ],
        1.4,
        6,
      );
      walkU(
        1,
        [
          [20, -35],
          [75, 0],
          [75, 130],
        ],
        1.3,
        15,
      );
      walkU(
        2,
        [
          [-140, -90],
          [-50, -90],
          [-40, -50],
        ],
        1.2,
        9,
      );
      AFLD.add(M.jeepD(), [F.w(-145, -15), F.w(140, -15)], 7, 20, 'veh');
      /* the fuel line along the jetty, and the tank farm behind it (four 1,000-barrel tanks) */
      {
        const d0 = F.po - 4,
          P = [
            part(cyl(0.18, 0.18, d0 + 50, 6), 0x5a5a52, (d0 - 50) / 2, gy + 0.18, 135 + 1.4, 0, 0, Z) /* on the yard, from the tank farm */,
            part(cyl(0.18, 0.18, wy - gy, 6), 0x5a5a52, d0, (wy + gy) / 2 + 0.18, 135 + 1.4) /* up onto the jetty */,
            part(cyl(0.18, 0.18, 52 - d0, 6), 0x5a5a52, (52 + d0) / 2, wy + 0.18, 135 + 1.4, 0, 0, Z) /* along the jetty deck to its head */,
          ];
        const [ox, oz] = F.w(0, 0);
        S.acc.add(P, GX.xf(ox, 0, oz, YS));
      }
      for (let i = 0; i < 4; i++)
        S.at(MODELS.get('us-fuel-tank'), 112 + i * 11, -55, YA + Math.PI / 2, gy); /* four 1,000-barrel gasoline tanks, ladders to the jetty side */
      use(105, 160, -65, -45);
      /* Quonset huts: two rows (quarters, mess, stores); the boat shop is an Elephant hut */
      for (let i = 0; i < 4; i++)
        for (const d of [-70, -110]) {
          const u = -130 + i * 26;
          S.at(MODELS.get('us-quonset', 'std'), u, d, YA, gy);
          use(u - 8, u + 8, d - 8, d + 8);
        }
      S.at(MODELS.get('us-quonset', 'elephant'), 10, -60, YS, gy);
      use(-8, 28, -80, -40);
      /* the flag and two trucks (the jeep drives) */
      S.at(FLG.pole('us', 12, 2.8, 0, 0, 0, 0), 40, -20, YA);

      S.at(M.cargoTruck(), -40, -30, YA - 0.1);
      S.at(M.fuelTruck(0x6b7350), 100, -30, YS);
      use(30, 110, -45, -12);
      use(-50, -30, -38, -22);
    }
    /* palms over the rest of the yard and round it */
    for (let i = 0, k = 0; i < 40 && k < 400; k++) {
      const u = (r() - 0.5) * (2 * F.pu + 80),
        d = F.pi - 30 + r() * (F.po - F.pi + 20);
      if (taken(u, d, 7)) continue;
      const [x, z] = F.w(u, d);
      if (H(x, z) < SEA.Y + 1.5) continue; /* not in the water or on the bank */
      i++;
      S.at(palm(8 + r() * 5, r()), u, d, r() * 6.28);
    }
    S.flush();
    return pat;
  };
  for (const F of FS.nav) farBuild(F, () => naval(F));
  /* Depot Mikawa's landing pier, added to the depot's own far site (so it shows and hides with it) */
  {
    const MK = FS.list.find((s) => s.id === 'cv1'),
      fr = FARS.find((q) => q.F === MK);
    if (MK && MK.shoreD && fr) {
      scene.add = function (...a) {
        fr.mine.push(...a);
        return _sceneAdd.apply(this, a);
      };
      try {
        const S = siteAcc(MK);
        pierF(MK, S, 0, MK.shoreD - 8, MK.shoreD + 80, 6, SEA.Y + 2.6);
        S.flush();
      } finally {
        delete scene.add;
      }
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
        if (c.bg) c.bg.m.traverse((q) => (q.layers.mask = c.vis ? 1 : 2));
      }
    };
    SITE.pat = (dt) => {
      if (_pat) _pat(dt);
      for (const o of SITE.anch || []) SITE.rideAt(o, dt); /* the home port's ships and craft at anchor */
      const t = performance.now() / 1000;
      for (const s of FARS) if (s.pat && !s.far) s.pat.upd(dt);
      for (const c of CIV) {
        if (c.vis) updCiv(c, t, dt);
        civCargo(c, t);
      }
    };
  }
}
