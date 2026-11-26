/* ---------- THE BATTLE AREA (PLAN_M4A3_Sherman_Tank 4.2, 4.3, 6): the land south of Port Ugaki at ground level ----------
   The world's ground is its far chunks: a 100 m mesh, its paint, and the fields its shader draws (FARM_PAINT: 340 m plots turned 0.31,
   paddies, cane, sweet potato, fallow, pale walls round the dry ones). The battle area does NOT make a ground of its own: round the tank it
   draws the SAME ground finer, in 64 m tiles (2 m out to RN tiles, 8 m out to RF), so a tank crew 2-3 m up sees and feels the small
   things. Each tile takes the chunk mesh's own surface (WORLD.surf: height, paint, farm, normal), the world's own ground shader
   (WORLD.groundShade) and the world's plots (WORLD.plot); the chunks leave that square undrawn (NEARCUT). Seen from anywhere the two
   are one ground. What it adds, near the tank only:
     the paddies dug 0.3 m down inside their earth dykes, a little rise and fall in the dry ground (none on the roads or the camp's pad);
     coral walls (the shared CORAL wall, as on the home map) on the plot edges the shader paints pale, with gaps;
     Buckner Course (its ditch, step, slope, paddy, terraces and a wall with a gap), the one thing laid out here and not in the world.
     BA.GH(x, z)       what she stands on: SURF (roads, the camp's pad, quays) or the fine ground
     BA.kind(x, z)     the ground's kind there (BA.K), for traction (T2)
     (its walls are solid through the shared collision layer, PHYS: CORAL.mesh)
     BA.update(p)      stream the tiles round p (each frame while the tank simulator plays); BA.clear() drops them all */
const BA = (() => {
  const TS = 64,
    RN = 3 /* the full-detail ring, in tiles round the tank's tile */,
    RF = 6 /* the outer ring (8 m) */,
    AREA = { x0: -200, x1: 14600, z0: 21500, z1: 34500 } /* the land south of Port Ugaki, Beach Orange and Camp Buckner included */;
  const K = { grass: 0, cane: 1, potato: 2, fallow: 3, paddy: 4, road: 5, sand: 6, gravel: 8, dirt: 9 };
  /* a hash of integers to 0..1 */
  const hs = (a, b, s) => {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 1013904223)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const sm = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const vn = (x, z) => {
    const i = Math.floor(x),
      j = Math.floor(z),
      fx = x - i,
      fz = z - j,
      u = fx * fx * (3 - 2 * fx),
      v = fz * fz * (3 - 2 * fz);
    return hs(i, j, 5) * (1 - u) * (1 - v) + hs(i + 1, j, 5) * u * (1 - v) + hs(i, j + 1, 5) * (1 - u) * v + hs(i + 1, j + 1, 5) * u * v;
  };
  /* ----- the places that are not fields ----- */
  const camp = () => FS.army.find((f) => f.id === 'camp');
  /* Buckner Course (PLAN 4.1, 11): its own frame, u east and d south of (12,950, 28,250); the track runs along d = 0 from u -200 to 200
     through the stations, and comes back along the lane at d = 70 */
  const CO = { x: 12950, z: 28250, u0: -235, u1: 235, d0: -40, d1: 100, H: null };
  const coBase = () => {
    if (CO.H == null) {
      let s = 0,
        n = 0;
      for (let u = -200; u <= 200; u += 100) for (let d = -20; d <= 80; d += 50) (s += WORLD.hm(CO.x + u, CO.z + d)), n++;
      CO.H = s / n;
    }
    return CO.H;
  };
  /* the course's stations: [name, u0, u1] (the board at each says which) */
  const STN = [
    ['1 DITCH', -175, -150],
    ['2 STEP', -125, -88],
    ['3 SLOPE', -75, -30],
    ['4 WALL GAP', -10, 10],
    ['5 PADDY', 35, 95],
    ['6 TERRACES', 115, 190],
    ['7 LANE', -200, 200],
  ];
  /* the course's ground relative to its base: the features cut and built along the track (|d| < 12) */
  const coRel = (u, d) => {
    if (Math.abs(d) > 13) return 0;
    const e = 1 - sm(10, 13, Math.abs(d)) /* the features end in short banks at the track's sides */;
    let y = 0;
    if (u > -166 && u < -162) y = -1.6 * sm(-166, -165.8, u) * (1 - sm(-162.2, -162, u)) /* the ditch, 2 m across at its top: a tank crosses 2.29 m */;
    if (u > -120.3 && u < -92) y = 0.6 * sm(-120.3, -120, u) * (1 - sm(-95, -92.6, u)) /* the step: 0.6 m up, a ramp down */;
    if (u > -72 && u < -35) y = Math.min(4, Math.max(0, (u + 70) * 0.5), Math.max(0, (-36.7 - u) * 0.3 + 0.0)) /* the slope: 50% up 4 m, 30% down */;
    if (u > 40 && u < 90) y = -0.4 /* the paddy */;
    if (u > 118 && u < 188) y = (u > 120 ? 1.2 : 1.2 * sm(118, 120, u)) + (u > 140 ? 1.2 : 0) - (u > 170 ? (Math.min(u, 187) - 170) * 0.14 : 0) /* two terraces up, a ramp down */;
    return y * e;
  };
  const inCourse = (x, z) => {
    const u = x - CO.x,
      d = z - CO.z;
    return u > CO.u0 && u < CO.u1 && d > CO.d0 && d < CO.d1 ? [u, d] : null;
  };
  /* within the camp's pad (its levelled gravel) */
  const onPad = (x, z) => {
    const F = camp();
    if (!F) return false;
    const [u, d] = F.uv(x, z);
    return u > -F.pu + 10 && u < F.pu - 10 && d > F.d0 + 10 && d < F.d1 - 10;
  };
  const underPad = (x, z) => {
    const F = camp();
    if (!F) return false;
    const [u, d] = F.uv(x, z);
    return u > -F.pu + 1 && u < F.pu - 1 && d > F.d0 + 1 && d < F.d1 - 1;
  };
  const nearSite = (x, z) => {
    for (const s of FS.army) if (Math.hypot(x - s.O.x, z - s.O.z) < s.R * 0.85) return s;
    for (const s of FS.list) if (Math.abs(x - s.O.x) < s.R && Math.abs(z - s.O.z) < s.R) return s;
    return null;
  };
  const roadD = (x, z) => (WORLD.RT.near(x, z, 7) ? (WORLD.RT.near(x, z, 4) ? 0 : 5) : 99);
  const roadAt = (x, z, d) => WORLD.RT.near(x, z, d) || WORLD.onRoad(x, z);
  const inArea = (x, z) => x > AREA.x0 && x < AREA.x1 && z > AREA.z0 && z < AREA.z1;
  /* ----- the world's plots, worked out as its shader paints them ----- */
  const FCA = Math.cos(WORLD.FA),
    FSA = Math.sin(WORLD.FA),
    FCS = WORLD.FCS,
    toX = (u, v) => (u * FCA - v * FSA) * FCS,
    toZ = (u, v) => (u * FSA + v * FCA) * FCS;
  const S = new Float32Array(8);
  /* how strongly the plot at (x, z) shows (the shader's fk) */
  const plotK = (x, z, P) => (WORLD.surf(x, z, S) ? sm(P.th - 0.3, P.th + 0.3, S[4]) : 0);
  /* ----- the ground: the chunk's surface, and near the tank its small relief ----- */
  /* the relief added at (x, z) to the chunk's height h there, and the ground's kind; out [dh, kind, farmOff] */
  const RL = [0, 0, 0];
  const relief = (x, z, h) => {
    RL[0] = 0;
    RL[2] = 0;
    const co = inCourse(x, z);
    if (co) {
      const [u, d] = co,
        e = sm(0, 30, Math.min(u - CO.u0, CO.u1 - u, d - CO.d0, CO.d1 - d)) /* levelled to its base, blended back at its edges */,
        tr = (Math.abs(d) < 11 && u > -205 && u < 205) || (Math.abs(d - 70) < 4 && Math.abs(u) < 205);
      RL[0] = (coBase() + coRel(u, d) - h) * e;
      RL[1] = u > 40 && u < 90 && Math.abs(d) < 11 ? K.paddy : tr ? K.dirt : K.grass;
      RL[2] = tr || e > 0.5 ? 1 : 0 /* no field painted on the course */;
      return RL;
    }
    if (onPad(x, z)) return (RL[1] = K.gravel), RL;
    if (h < 1.6) return (RL[1] = K.sand), RL;
    if (roadAt(x, z, 6)) return (RL[1] = K.road), RL;
    const P = WORLD.plot(x, z),
      fk = plotK(x, z, P),
      ed = Math.min(P.fu, 1 - P.fu, P.fv, 1 - P.fv) * FCS /* metres in from the plot's edge */,
      rd = roadAt(x, z, 14) ? 0 : 1;
    if (P.paddy) RL[0] = -0.3 * fk * sm(1.0, 2.6, ed) * rd /* dug down inside its dykes */;
    else RL[0] = (vn(x / 23, z / 23) - 0.5) * 0.25 * sm(2, 8, ed) * rd;
    RL[1] = fk < 0.5 ? K.grass : P.paddy ? K.paddy : P.kind === 'cane' ? K.cane : P.kind === 'potato' ? K.potato : K.fallow;
    return RL;
  };
  /* what the tank stands on: SURF (the shared surface every vehicle rides: a road, the camp's pad, a yard, a quay, else the ground), and
     where that is the bare ground, the fine ground's relief (a paddy, the course) */
  const GH = (x, z) => {
    const s = SURF(x, z);
    if (!inArea(x, z)) return s;
    const h = WORLD.surf(x, z, S) ? S[0] : WORLD.hm(x, z);
    return s > h + 0.05 ? s : h + relief(x, z, h)[0];
  };
  const kind = (x, z) => {
    if (!inArea(x, z)) return K.grass;
    const h = WORLD.hm(x, z);
    return relief(x, z, h)[1];
  };
  /* ----- the walls: the shared coral wall on the plot edges the shader paints pale (a dry plot on either side), in blocks of CORAL.LEN
     counted from a fixed origin on each edge line, so a block is the same whichever tile builds it; about one in twelve left out (a gap) -- */
  const LEN = CORAL.LEN;
  /* the block m on edge line k (dir 0: the line u = k, running along v; dir 1: v = k, along u): its item, or null */
  const wallAt = (dir, k, m) => {
    const t = ((m + 0.5) * LEN) / FCS,
      x = dir ? toX(t, k) : toX(k, t),
      z = dir ? toZ(t, k) : toZ(k, t);
    if (!inArea(x, z) || hs(dir * 7 + k, m, 101) < 0.08) return null;
    /* the plots either side, 4 m in */
    const nx = dir ? -FSA : FCA,
      nz = dir ? FCA : FSA,
      A = WORLD.plot(x - nx * 4, z - nz * 4),
      B = WORLD.plot(x + nx * 4, z + nz * 4);
    if (!((!A.paddy && plotK(x - nx * 4, z - nz * 4, A) > 0.5) || (!B.paddy && plotK(x + nx * 4, z + nz * 4, B) > 0.5))) return null;
    const h = WORLD.hm(x, z);
    if (h < 3.2 || onPad(x, z) || inCourse(x, z) || nearSite(x, z) || roadAt(x, z, 12)) return null;
    if (Math.hypot(WORLD.hm(x + 10, z) - WORLD.hm(x - 10, z), WORLD.hm(x, z + 10) - WORLD.hm(x, z - 10)) / 20 > 0.1) return null;
    return [x, z, Math.atan2(dir ? FCA : -FSA, dir ? FSA : FCA), LEN, 1.0 + 0.5 * hs(dir * 7 + k, m, 103), 0.6 + 0.2 * hs(dir * 7 + k, m, 107), 0.86 + 0.14 * hs(dir * 7 + k, m, 109)];
  };
  /* every wall block whose centre lies in the box */
  const wallsIn = (x0, x1, z0, z1, out) => {
    const U = [],
      V = [];
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) U.push((x * FCA + z * FSA) / FCS), V.push((-x * FSA + z * FCA) / FCS);
    const u0 = Math.min(...U),
      u1 = Math.max(...U),
      v0 = Math.min(...V),
      v1 = Math.max(...V);
    for (let k = Math.ceil(u0); k <= Math.floor(u1); k++)
      for (let m = Math.floor((v0 * FCS) / LEN) - 1; m <= Math.ceil((v1 * FCS) / LEN); m++) {
        const w = wallAt(0, k, m);
        if (w && w[0] >= x0 && w[0] < x1 && w[1] >= z0 && w[1] < z1) out.push(w);
      }
    for (let k = Math.ceil(v0); k <= Math.floor(v1); k++)
      for (let m = Math.floor((u0 * FCS) / LEN) - 1; m <= Math.ceil((u1 * FCS) / LEN); m++) {
        const w = wallAt(1, k, m);
        if (w && w[0] >= x0 && w[0] < x1 && w[1] >= z0 && w[1] < z1) out.push(w);
      }
    return out;
  };
  /* the course's wall across the track at station 4, its 5 m gap in the middle: two short blocks of the same wall */
  const coWalls = () => [
    [CO.x, CO.z - 8.3, 0, 11.4, 1.3, 0.7, 0.92],
    [CO.x, CO.z + 8.3, 0, 11.4, 1.3, 0.7, 0.92],
  ];

  /* ----- building a tile ----- */
  const KEY = (i, j) => i * 4096 + j;
  const tiles = new Map();
  const idxCache = {};
  const gridIdx = (n) => {
    if (idxCache[n]) return idxCache[n];
    const m = n + 3 /* the skirt ring round it */,
      a = [];
    for (let j = 0; j < m - 1; j++)
      for (let i = 0; i < m - 1; i++) {
        const p = j * m + i;
        a.push(p, p + m, p + 1, p + 1, p + m, p + m + 1);
      }
    return (idxCache[n] = new THREE.Uint32BufferAttribute(a, 1));
  };
  /* the course's marker boards (one per station, at its start, left of the track): the shared geometry kit */
  const boards = (x0, z0) => {
    const P = [];
    for (const [nm, ua] of STN) {
      const x = CO.x + ua,
        z = CO.z - 15;
      if (x < x0 || x >= x0 + TS || z < z0 || z >= z0 + TS) continue;
      const y = GH(x, z);
      P.push(GX.part(GX.bx(0.12, 2.2, 0.12), 0xe6e6dc, x, y + 1.1, z), GX.part(GX.bx(1.4, 0.7, 0.06), nm.startsWith('7') ? 0x334d99 : 0xbf261f, x, y + 1.95, z + 0.1));
    }
    if (!P.length) return null;
    const m = new THREE.Mesh(new GX.Acc().add(P, new GX.M4()).geometry(), WALLM);
    m.matrixAutoUpdate = false;
    return m;
  };
  const WALLM = new THREE.MeshLambertMaterial({ vertexColors: true });
  /* the tile: the chunk's surface finer (and near, its relief), drawn with the world's own ground shader; its walls; its boards.
     null while a chunk under it is not built yet (it waits in the queue) */
  const SN = 14 /* the shore texture's size (the chunks' encoding, finer) */;
  const build = (i, j, fine) => {
    const x0 = i * TS,
      z0 = j * TS,
      n = fine ? 32 : 8,
      st = TS / n,
      m = n + 3,
      NV = m * m,
      pos = new Float32Array(NV * 3),
      nor = new Float32Array(NV * 3),
      col = new Float32Array(NV * 3),
      frm = new Float32Array(NV),
      dh = new Float32Array(NV);
    const at = (a, b) => (b + 1) * m + (a + 1);
    for (let b = -1; b <= n + 1; b++)
      for (let a = -1; a <= n + 1; a++) {
        const x = x0 + a * st,
          z = z0 + b * st;
        if (!WORLD.surf(x, z, S)) return null;
        const k = at(a, b),
          h = S[0],
          r = fine && inArea(x, z) ? relief(x, z, h) : (inCourse(x, z) ? relief(x, z, h) : ((RL[0] = 0), (RL[2] = 0), RL));
        dh[k] = r[0];
        pos[k * 3] = x - x0;
        pos[k * 3 + 1] = h + r[0];
        pos[k * 3 + 2] = z - z0;
        col[k * 3] = S[1];
        col[k * 3 + 1] = S[2];
        col[k * 3 + 2] = S[3];
        frm[k] = r[2] ? 0 : S[4];
        if (r[2] && r[1] === K.dirt) (col[k * 3] = 0.5), (col[k * 3 + 1] = 0.43), (col[k * 3 + 2] = 0.31) /* the course's track */;
        /* the normal: the chunk's, tilted by the relief's own slope */
        nor[k * 3] = S[5];
        nor[k * 3 + 1] = S[6];
        nor[k * 3 + 2] = S[7];
      }
    for (let b = 0; b <= n; b++)
      for (let a = 0; a <= n; a++) {
        const k = at(a, b),
          gx = (dh[at(a + 1, b)] - dh[at(a - 1, b)]) / (2 * st),
          gz = (dh[at(a, b + 1)] - dh[at(a, b - 1)]) / (2 * st);
        let nx = nor[k * 3] - gx * nor[k * 3 + 1],
          ny = nor[k * 3 + 1],
          nz = nor[k * 3 + 2] - gz * nor[k * 3 + 1];
        const l = Math.hypot(nx, ny, nz);
        nor[k * 3] = nx / l;
        nor[k * 3 + 1] = ny / l;
        nor[k * 3 + 2] = nz / l;
      }
    /* the outer ring of the grid is the skirt: a flap 2 m out from the tile's edge lying 3 cm under the world's surface there, tucked under
       the next tile (or the far ground past the cut), so a crack at a seam shows ground, not the sea below, even seen at a low angle */
    for (let b = -1; b <= n + 1; b++)
      for (let a = -1; a <= n + 1; a++) {
        if (a >= 0 && b >= 0 && a <= n && b <= n) continue;
        const k = at(a, b),
          q = at(Math.max(0, Math.min(n, a)), Math.max(0, Math.min(n, b)));
        pos[k * 3] = pos[q * 3] + (a < 0 ? -2 : a > n ? 2 : 0);
        pos[k * 3 + 2] = pos[q * 3 + 2] + (b < 0 ? -2 : b > n ? 2 : 0);
        const fx = x0 + pos[k * 3],
          fz = z0 + pos[k * 3 + 2];
        const fh = WORLD.surf(fx, fz, S) ? S[0] : WORLD.hm(fx, fz),
          fr = (fine && inArea(fx, fz)) || inCourse(fx, fz) ? relief(fx, fz, fh)[0] : 0 /* the same relief as the ground there (a paddy, the course) */;
        pos[k * 3 + 1] = fh + fr - 0.03;
        for (const o of [0, 1, 2]) (nor[k * 3 + o] = nor[q * 3 + o]), (col[k * 3 + o] = col[q * 3 + o]);
        frm[k] = frm[q];
      }
    /* under the camp's own pad mesh the ground keeps below it, or the two would fight */
    for (let b = -1; b <= n + 1; b++)
      for (let a = -1; a <= n + 1; a++) {
        const k = at(a, b);
        if (underPad(x0 + pos[k * 3], z0 + pos[k * 3 + 2])) pos[k * 3 + 1] = Math.min(pos[k * 3 + 1], camp().H - 0.4);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('farm', new THREE.BufferAttribute(frm, 1));
    g.setIndex(gridIdx(n));
    g.computeBoundingSphere();
    /* the shore texture the world's shader paints the beach from, as the chunks make theirs (heights -41..+6 m in 8 bits) */
    const sx = TS / (SN - 2),
      td = new Uint8Array(SN * SN);
    for (let b = 0; b < SN; b++) for (let a = 0; a < SN; a++) td[b * SN + a] = Math.round(255 * Math.max(0, Math.min(1, (WH(x0 + (a - 0.5) * sx, z0 + (b - 0.5) * sx) + 41) / 47)));
    const tex = new THREE.DataTexture(td, SN, SN, THREE.LuminanceFormat, THREE.UnsignedByteType);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    const mat = WORLD.groundShade(new THREE.MeshLambertMaterial({ vertexColors: true }), tex, new THREE.Vector4(x0 - sx, z0 - sx, SN * sx, SN * sx));
    const ground = new THREE.Mesh(g, mat);
    ground.userData.surface = false;
    ground.position.set(x0, 0, z0);
    ground.matrixAutoUpdate = false;
    ground.updateMatrix();
    /* the walls (the shared coral wall) and the course's boards */
    const W = wallsIn(x0, x0 + TS, z0, z0 + TS, []);
    for (const w of coWalls()) if (w[0] >= x0 && w[0] < x0 + TS && w[1] >= z0 && w[1] < z0 + TS) W.push(w);
    let stand = null;
    if (W.length) stand = CORAL.mesh(W, GH, new THREE.Sphere(new THREE.Vector3(x0 + TS / 2, pos[at(n >> 1, n >> 1) * 3 + 1], z0 + TS / 2), TS));
    const bd = fine ? boards(x0, z0) : null;
    if (bd) {
      if (stand) stand.add(bd);
      else stand = bd;
    }
    return { ground, stand, fine, tex, mat };
  };
  /* ----- streaming ----- */
  let ci = null,
    cj = null,
    queue = [];
  const want = (i, j) => {
    const x = i * TS + TS / 2,
      z = j * TS + TS / 2;
    return inArea(x, z);
  };
  const drop = (T) => {
    for (const m of [T.ground, T.stand])
      if (m) {
        scene.remove(m);
        m.traverse((o) => o.geometry && o.geometry.dispose());
      }
    T.tex.dispose();
    T.mat.dispose();
  };
  const clear = () => {
    for (const T of tiles.values()) drop(T);
    tiles.clear();
    NEARCUT.value.set(0, 0, 0, 0);
    ci = cj = null;
  };
  /* stream round p: the tiles of the two rings, the fine ones first; a time budget per frame (all at once when urgent: the first frame) */
  const update = (p, urgent) => {
    const i = Math.floor(p.x / TS),
      j = Math.floor(p.z / TS);
    if (!want(i, j)) {
      if (tiles.size) clear();
      return;
    }
    if (i !== ci || j !== cj) {
      ci = i;
      cj = j;
      queue = [];
      for (let b = j - RF; b <= j + RF; b++)
        for (let a = i - RF; a <= i + RF; a++) {
          if (!want(a, b)) continue;
          const fine = Math.max(Math.abs(a - i), Math.abs(b - j)) <= RN,
            T = tiles.get(KEY(a, b));
          if (!T || T.fine !== fine) queue.push([a, b, fine, Math.hypot(a - i, b - j)]);
        }
      queue.sort((p1, p2) => p1[3] - p2[3]);
      /* the tiles beyond the outer ring go */
      for (const [k, T] of tiles) {
        const a = Math.floor(k / 4096),
          b = k - a * 4096;
        if (Math.max(Math.abs(a - i), Math.abs(b - j)) > RF + 1) {
          drop(T);
          tiles.delete(k);
        }
      }
    }
    const t0 = performance.now();
    while (queue.length && (urgent || performance.now() - t0 < 6)) {
      const [a, b, fine] = queue[0],
        T = build(a, b, fine);
      if (!T) break; /* a chunk under it is not built yet: try again next frame */
      queue.shift();
      const old = tiles.get(KEY(a, b));
      if (old) drop(old);
      scene.add(T.ground);
      if (T.stand) scene.add(T.stand);
      tiles.set(KEY(a, b), T);
    }
    /* the far world's ground is left undrawn over the square the tiles cover in full (the ring the queue has finished) */
    if (!queue.length) NEARCUT.value.set(ci * TS + TS / 2, cj * TS + TS / 2, (RF + 0.5) * TS, 1);
    else if (NEARCUT.value.w > 0) {
      /* still filling: keep the cut only where every tile is in */
      let ok = RF;
      for (const [a, b] of queue) ok = Math.min(ok, Math.max(Math.abs(a - ci), Math.abs(b - cj)) - 1);
      NEARCUT.value.set(ci * TS + TS / 2, cj * TS + TS / 2, Math.max(0, (ok + 0.5) * TS), ok >= 0 ? 1 : 0);
    }
    /* only the tiles inside the cut are drawn: one outside it would lie on the far world's ground and the two would fight */
    const r = NEARCUT.value.w > 0 ? Math.round((NEARCUT.value.z + 0.5) / TS - 0.5) : -1;
    for (const [k, T] of tiles) {
      const a = Math.floor(k / 4096),
        v = Math.max(Math.abs(a - ci), Math.abs(k - a * 4096 - cj)) <= r;
      T.ground.visible = v;
      if (T.stand) T.stand.visible = v;
    }
  };
  return { K, GH, kind, update, clear, CO, STN, tiles, inArea };
})();
