/* ---------- THE BATTLE AREA (PLAN_M4A3_Sherman_Tank 4.2, 4.3, 6): the land south of Port Ugaki at ground level ----------
   The far world's ground is a 100 m grid: right for an aircraft, far too coarse for a tank crew whose eyes are 2-3 m up. Round the tank
   the battle area draws its own ground in 64 m tiles: 2 m between heights out to RN tiles, 8 m out to RF tiles, built a few at a time
   as she moves, and the far world's chunks leave that square undrawn (NEARCUT). Everything is a fixed function of position, so the
   same field has the same walls every visit, and the ground the tank drives on is the ground that is drawn.
     BA.GH(x, z)       the ground she stands on (the camp's gravel pad included)
     BA.kind(x, z)     the ground's kind there (BA.K: grass, cane, potato, veg, paddy, road, sand, scrub, gravel, dirt)
     BA.block(x, z, r) a wall or a windbreak within r of (x, z): { nx, nz } (the way out), else null
     BA.update(p)      stream the tiles round p (each frame while the tank simulator plays); BA.clear() drops them all
   The ground: the far world's mesh height (WORLD.hm) plus a little relief of its own (the fields' small rises and hollows, the paddies
   dug down, the course's ditch, step, slope and terraces); on the roads and the camp's pad none, so the roads, the camp and the far
   world's trees sit on it exactly.
   The fields (4.3): a grid turned FA from north, rows 90-130 m deep, fields 55-115 m wide along a row. Each side of a field is a coral
   wall (half of them), a windbreak of fukugi trees, a paddy dyke (between two paddies) or open; most walls have a gate. Fields are cane,
   sweet potato, vegetables, rice (on the low ground), fallow grass, scrub on the steeper slopes. No fields on the roads, the sites, the
   course or the shore. */
const BA = (() => {
  const TS = 64,
    RN = 3 /* the full-detail ring, in tiles round the tank's tile */,
    RF = 6 /* the outer ring (8 m) */,
    AREA = { x0: -200, x1: 14600, z0: 21500, z1: 34500 } /* the land south of Port Ugaki, Beach Orange and Camp Buckner included */,
    FA = 0.42 /* the field grid's turn */,
    CA = Math.cos(FA),
    SA = Math.sin(FA),
    ROWP = 110,
    COLP = 85;
  const K = { grass: 0, cane: 1, potato: 2, veg: 3, paddy: 4, road: 5, sand: 6, scrub: 7, gravel: 8, dirt: 9 };
  const COL = [
    [0.36, 0.47, 0.2],
    [0.44, 0.52, 0.2],
    [0.27, 0.4, 0.15],
    [0.42, 0.36, 0.22],
    [0.3, 0.42, 0.4] /* a paddy: shallow water over mud, the rice standing in rows */,
    [0.64, 0.61, 0.53],
    [0.78, 0.74, 0.6],
    [0.32, 0.38, 0.19],
    [0.56, 0.53, 0.46],
    [0.5, 0.42, 0.3],
  ];
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
     through the stations, and comes back along the lane between two windbreaks at d = 70 */
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
  const nearSite = (x, z) => {
    for (const s of FS.army) if (Math.hypot(x - s.O.x, z - s.O.z) < s.R * 0.85) return s;
    for (const s of FS.list) if (Math.abs(x - s.O.x) < s.R && Math.abs(z - s.O.z) < s.R) return s;
    return null;
  };
  const roadD = (x, z) => (WORLD.RT.near(x, z, 7) ? (WORLD.RT.near(x, z, 4) ? 0 : 5) : 99);
  /* ----- the fields: rows along v, fields along u (the grid turned FA) ----- */
  const toU = (x, z) => x * CA + z * SA,
    toV = (x, z) => -x * SA + z * CA,
    toX = (u, v) => u * CA - v * SA,
    toZ = (u, v) => u * SA + v * CA;
  const vb = (r) => r * ROWP + (hs(r, 0, 11) - 0.5) * 40 /* the line between row r - 1 and row r */,
    ub = (r, k) => k * COLP + (hs(r, k, 13) - 0.5) * 60 /* the line between field k - 1 and field k in row r */;
  const rowOf = (v) => {
    let r = Math.floor(v / ROWP);
    if (v < vb(r)) r--;
    else if (v >= vb(r + 1)) r++;
    return r;
  };
  const colOf = (r, u) => {
    let k = Math.floor(u / COLP);
    if (u < ub(r, k)) k--;
    else if (u >= ub(r, k + 1)) k++;
    return k;
  };
  /* what a field grows: rice on the low flat ground, scrub on the slopes, else by its hash */
  const FK = new Map();
  const fieldKind = (r, k) => {
    const key = r * 100003 + k;
    let v = FK.get(key);
    if (v !== undefined) return v;
    const u = (ub(r, k) + ub(r, k + 1)) / 2,
      w = (vb(r) + vb(r + 1)) / 2,
      x = toX(u, w),
      z = toZ(u, w),
      h = WORLD.hm(x, z),
      sl = Math.hypot(WORLD.hm(x + 30, z) - WORLD.hm(x - 30, z), WORLD.hm(x, z + 30) - WORLD.hm(x, z - 30)) / 60,
      q = hs(r, k, 17);
    v = sl > 0.14 ? K.scrub : h < 7 && sl < 0.04 && q < 0.75 ? K.paddy : q < 0.36 ? K.cane : q < 0.58 ? K.potato : q < 0.74 ? K.veg : q < 0.86 ? K.paddy : K.grass;
    FK.set(key, v);
    return v;
  };
  /* a boundary segment's kind: 1 coral wall, 2 windbreak, 3 paddy dyke, 0 open; and its gate (a gap 6 m wide) at t from its start */
  const edge = (a, b, s, kA, kB) => {
    if (kA === K.paddy && kB === K.paddy) return { k: 3, g: -1 };
    const q = hs(a, b, s);
    const k = q < 0.5 ? 1 : q < 0.6 ? 2 : kA === K.paddy || kB === K.paddy ? 3 : 0;
    return { k, g: hs(a, b, s + 7) < 0.75 ? hs(a, b, s + 9) : -1 };
  };
  /* is a field at (x, z) at all (not road, site, course, shore, the camp's pad) */
  const fieldOK = (x, z) => !onPad(x, z) && !inCourse(x, z) && !nearSite(x, z) && roadD(x, z) > 6 && WORLD.hm(x, z) > 1.6;
  /* ----- the ground ----- */
  const inArea = (x, z) => x > AREA.x0 && x < AREA.x1 && z > AREA.z0 && z < AREA.z1;
  /* the drawn ground and its kind: [height, kind, rows (0 none, 1 along u, 2 along v)] */
  const OUT = [0, 0, 0];
  const sample = (x, z) => {
    let h = WORLD.hm(x, z),
      k = K.grass,
      rows = 0;
    const co = inCourse(x, z);
    if (co) {
      const [u, d] = co,
        b = coBase(),
        e = sm(0, 30, Math.min(u - CO.u0, CO.u1 - u, d - CO.d0, CO.d1 - d)) /* levelled to its base, blended back at its edges */;
      h += (b + coRel(u, d) - h) * e;
      k = (Math.abs(d) < 11 && u > -205 && u < 205) || (Math.abs(d - 70) < 4 && Math.abs(u) < 205) ? K.dirt : K.grass;
      if (u > 40 && u < 90 && Math.abs(d) < 11) k = K.paddy;
    } else if (onPad(x, z)) k = K.gravel;
    else if (h < 1.6) k = K.sand;
    else {
      const rd = roadD(x, z);
      if (rd === 0) k = K.road;
      else if (!nearSite(x, z)) {
        const u = toU(x, z),
          v = toV(x, z),
          r = rowOf(v),
          c = colOf(r, u);
        k = fieldKind(r, c);
        if (rd < 7) k = K.grass;
        else {
          /* the field's own relief: a little rise and fall, dug down for a paddy, rows by its hash */
          const ed = Math.min(u - ub(r, c), ub(r, c + 1) - u, v - vb(r), vb(r + 1) - v);
          if (k === K.paddy) h -= 0.35 * sm(0.6, 2.2, ed);
          else h += (vn(x / 23, z / 23) - 0.5) * 0.25 * sm(1, 6, ed);
          if (k === K.cane || k === K.potato || k === K.veg || k === K.paddy) rows = hs(r, c, 19) < 0.5 ? 1 : 2;
        }
      }
    }
    OUT[0] = h;
    OUT[1] = k;
    OUT[2] = rows;
    return OUT;
  };
  const GV = (x, z) => sample(x, z)[0];
  /* the ground the tank stands on: the drawn ground, or on the camp's pad its gravel (12 cm over the levelled pad) */
  const GH = (x, z) => (inArea(x, z) ? (onPad(x, z) ? camp().H + 0.12 : GV(x, z)) : WORLD.hm(x, z));
  /* ----- walls, windbreaks and dykes: what stands on a field's sides ----- */
  /* the segments of field boundary within the box [x0, x1] x [z0, z1] (padded), each [ax, az, bx, bz, kind, gate t or -1, key] */
  const segs = (x0, x1, z0, z1) => {
    const out = [],
      us = [toU(x0, z0), toU(x1, z0), toU(x0, z1), toU(x1, z1)],
      vs = [toV(x0, z0), toV(x1, z0), toV(x0, z1), toV(x1, z1)],
      u0 = Math.min(...us) - 10,
      u1 = Math.max(...us) + 10,
      v0 = Math.min(...vs) - 10,
      v1 = Math.max(...vs) + 10;
    for (let r = rowOf(v0) - 1; r <= rowOf(v1) + 1; r++) {
      const va = vb(r),
        vB = vb(r + 1);
      for (let k = colOf(r, u0) - 1; k <= colOf(r, u1) + 1; k++) {
        const ua = ub(r, k),
          uB = ub(r, k + 1),
          kf = fieldKind(r, k);
        /* its west side (u = ua): between fields k - 1 and k of row r */
        {
          const e = edge(r, k, 31, fieldKind(r, k - 1), kf);
          if (e.k) out.push([toX(ua, va), toZ(ua, va), toX(ua, vB), toZ(ua, vB), e.k, e.g, r * 7919 + k * 31]);
        }
        /* its north side (v = va): against row r - 1, cut at the fields of this row */
        {
          const ka = fieldKind(r - 1, colOf(r - 1, (ua + uB) / 2)),
            e = edge(r, k, 37, ka, kf);
          if (e.k) out.push([toX(ua, va), toZ(ua, va), toX(uB, va), toZ(uB, va), e.k, e.g, r * 7919 + k * 31 + 1]);
        }
      }
    }
    return out;
  };
  /* is a point of a boundary segment a place where it actually stands (a field on at least one side, not in a gate) */
  const stands = (sg, t, len, x, z) => {
    if (sg[5] >= 0) {
      const gc = 8 + sg[5] * Math.max(0, len - 16);
      if (Math.abs(t * len - gc) < 3.2) return false;
    }
    return fieldOK(x, z);
  };
  /* the course's own walls and windbreaks: the wall across the track at station 4 (its 5 m gap in the middle) and the lane's two belts */
  const coSegs = () => {
    const x = CO.x,
      z = CO.z;
    return [
      [x, z - 14, x, z - 2.6, 1, -1, -1],
      [x, z + 2.6, x, z + 14, 1, -1, -2],
      [x - 200, z + 65.5, x + 200, z + 65.5, 2, -1, -3],
      [x - 200, z + 74.5, x + 200, z + 74.5, 2, -1, -4],
    ];
  };
  /* BA.block: the nearest wall or windbreak within r of (x, z) (for the tank's collision): { nx, nz, k } pointing away from it */
  const block = (x, z, r) => {
    if (!inArea(x, z)) return null;
    const L = segs(x - r - 6, x + r + 6, z - r - 6, z + r + 6).concat(inCourse(x, z) ? coSegs() : []);
    let best = null,
      bd = 1e9;
    for (const sg of L) {
      if (sg[4] === 3) continue; /* a dyke does not stop a tank */
      const ax = sg[0],
        az = sg[1],
        bx = sg[2] - ax,
        bz = sg[3] - az,
        len = Math.hypot(bx, bz),
        t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (len * len))),
        px = ax + bx * t,
        pz = az + bz * t,
        d = Math.hypot(x - px, z - pz),
        half = sg[4] === 2 ? 2.2 : 0.45;
      if (d - half > r || d >= bd) continue;
      if (sg[6] >= 0 && !stands(sg, t, len, px, pz)) continue;
      bd = d;
      best = { nx: d > 1e-6 ? (x - px) / d : -bz / len, nz: d > 1e-6 ? (z - pz) / d : bx / len, k: sg[4], d: d - half };
    }
    return best;
  };
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
  /* the ground's material: vertex colours, the same grain as the far world's ground near the eye, and crop rows (the rows attribute:
     1 along the grid's u, 2 along its v, one row a metre) */
  const gmat = new THREE.MeshLambertMaterial({ vertexColors: true });
  gmat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float rows;varying float vRows;varying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRows=rows;vWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRows;varying vec3 vWP;\n' + TERR_NOISE)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n' +
          'float dq=length(vWP-cameraPosition);float nk=1.0-smoothstep(120.0,700.0,dq);' +
          'float g1=vn2(vWP.xz*0.7),g2=vn2(vWP.xz*2.9),g3=vn2(vWP.xz*11.0);float gr=(g1*0.45+g2*0.33+g3*0.22)-0.5;' +
          'diffuseColor.rgb*=1.0+gr*0.55*nk;' +
          'float blade=vn2(vec2(vWP.x*21.0,vWP.z*2.6))-0.5;diffuseColor.rgb*=1.0+blade*0.12*nk;' +
          'if(vRows>0.5){float u=vWP.x*' + CA.toFixed(6) + '+vWP.z*' + SA.toFixed(6) + ',v=-vWP.x*' + SA.toFixed(6) + '+vWP.z*' + CA.toFixed(6) + ';' +
          'float s=vRows<1.5?v:u;float rw=smoothstep(0.25,0.75,abs(fract(s)-0.5)*2.0);diffuseColor.rgb*=mix(1.0,0.72+0.38*rw,(1.0-smoothstep(150.0,500.0,dq))*clamp(vRows,0.0,1.0));}',
      );
  };
  gmat.userData.key = 'battlearea1';
  if (typeof csApply === 'function') csApply(gmat);
  const wmat = new THREE.MeshLambertMaterial({ vertexColors: true });
  /* a simple growing buffer of triangles (position, normal, colour) */
  const Buf = () => {
    const P = [],
      Nn = [],
      C = [];
    const tri = (a, b, c, col) => {
      const ux = b[0] - a[0],
        uy = b[1] - a[1],
        uz = b[2] - a[2],
        vx = c[0] - a[0],
        vy = c[1] - a[1],
        vz = c[2] - a[2];
      let nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      for (const p of [a, b, c]) P.push(p[0], p[1], p[2]), Nn.push(nx, ny, nz), C.push(col[0], col[1], col[2]);
    };
    const quad = (a, b, c, d, col) => (tri(a, b, c, col), tri(a, c, d, col));
    /* a box: centre (x, y0 bottom, z), length L along (dx, dz), thickness T, height Hh; top tilted by dy along its length */
    const box = (x, y0, z, dx, dz, L, T, Hh, col, dy) => {
      const ax = dx * L * 0.5,
        az = dz * L * 0.5,
        nx = -dz * T * 0.5,
        nz = dx * T * 0.5,
        e = dy || 0,
        c = [
          [x - ax - nx, y0 - e, z - az - nz],
          [x + ax - nx, y0 + e, z + az - nz],
          [x + ax + nx, y0 + e, z + az + nz],
          [x - ax + nx, y0 - e, z - az + nz],
        ],
        t = c.map((p) => [p[0], p[1] + Hh, p[2]]),
        dk = [col[0] * 0.78, col[1] * 0.78, col[2] * 0.78];
      quad(t[0], t[3], t[2], t[1], col);
      quad(c[0], c[1], t[1], t[0], dk);
      quad(c[1], c[2], t[2], t[1], col);
      quad(c[2], c[3], t[3], t[2], dk);
      quad(c[3], c[0], t[0], t[3], col);
    };
    /* an upright n-sided prism (a tree's crown, a trunk, a post) */
    const prism = (x, y0, z, r0, r1, Hh, n, col) => {
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 6.2832,
          a1 = ((i + 1) / n) * 6.2832,
          p = (r, a, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r],
          sh = 0.82 + 0.18 * Math.cos(a0 - 0.8);
        quad(p(r0, a0, y0), p(r0, a1, y0), p(r1, a1, y0 + Hh), p(r1, a0, y0 + Hh), [col[0] * sh, col[1] * sh, col[2] * sh]);
        if (r1 > 0.05) tri([x, y0 + Hh, z], p(r1, a1, y0 + Hh), p(r1, a0, y0 + Hh), col);
      }
    };
    const mesh = (mat) => {
      if (!P.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      const m = new THREE.Mesh(g, mat);
      m.matrixAutoUpdate = false;
      return m;
    };
    return { tri, quad, box, prism, mesh, n: () => P.length / 9 };
  };
  const CORAL = [0.74, 0.71, 0.62],
    FUK = [0.13, 0.27, 0.11] /* fukugi: dark glossy green */,
    BARK = [0.32, 0.26, 0.2],
    DYKE = [0.4, 0.42, 0.25],
    CANE = [0.46, 0.56, 0.22];
  /* the tile's ground, its walls and windbreaks (and, near, its cane) */
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
      rw = new Float32Array(NV),
      hh = new Float32Array((n + 3) * (n + 3));
    /* the heights on a grid one step wider than the tile (for the normals), then the skirt ring 1.2 m down */
    const at = (a, b) => (b + 1) * (n + 3) + (a + 1);
    for (let b = -1; b <= n + 1; b++)
      for (let a = -1; a <= n + 1; a++) {
        const x = x0 + Math.max(0, Math.min(n, a)) * st,
          z = z0 + Math.max(0, Math.min(n, b)) * st,
          s = sample(x, z),
          sk = a < 0 || b < 0 || a > n || b > n,
          k = at(a, b),
          c = COL[s[1]],
          tn = 0.92 + 0.16 * hs(Math.round(x / 6), Math.round(z / 6), 3);
        hh[k] = s[0];
        pos[k * 3] = x - x0;
        pos[k * 3 + 1] = s[0] - (sk ? 1.2 : 0);
        pos[k * 3 + 2] = z - z0;
        col[k * 3] = c[0] * tn;
        col[k * 3 + 1] = c[1] * tn;
        col[k * 3 + 2] = c[2] * tn;
        rw[k] = s[2];
      }
    for (let b = -1; b <= n + 1; b++)
      for (let a = -1; a <= n + 1; a++) {
        const A = Math.max(0, Math.min(n, a)),
          B = Math.max(0, Math.min(n, b)),
          hl = hh[at(Math.max(-1, A - 1), B)],
          hr = hh[at(Math.min(n + 1, A + 1), B)],
          hd = hh[at(A, Math.max(-1, B - 1))],
          hu = hh[at(A, Math.min(n + 1, B + 1))],
          nx = (hl - hr) / (2 * st),
          nz = (hd - hu) / (2 * st),
          l = Math.hypot(nx, 1, nz),
          k = at(a, b);
        nor[k * 3] = nx / l;
        nor[k * 3 + 1] = 1 / l;
        nor[k * 3 + 2] = nz / l;
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('rows', new THREE.BufferAttribute(rw, 1));
    g.setIndex(gridIdx(n));
    g.computeBoundingSphere();
    const ground = new THREE.Mesh(g, gmat);
    ground.position.set(x0, 0, z0);
    ground.matrixAutoUpdate = false;
    ground.updateMatrix();
    /* what stands on it: walls in rough blocks 1.4-2.6 m long, 1.0-1.8 m high, 0.6-0.9 m thick, following the ground; windbreaks two rows
       of fukugi 2.6 m apart along the boundary; dykes 0.5 m; cane in clumps on the near tiles */
    const B = Buf(),
      inT = (x, z) => x >= x0 && x < x0 + TS && z >= z0 && z < z0 + TS;
    const L = segs(x0, x0 + TS, z0, z0 + TS);
    if (inCourse(x0 + 32, z0 + 32) || inCourse(x0, z0) || inCourse(x0 + TS, z0 + TS) || inCourse(x0 + TS, z0) || inCourse(x0, z0 + TS)) L.push(...coSegs());
    for (const sg of L) {
      const ax = sg[0],
        az = sg[1],
        dx = sg[2] - ax,
        dz = sg[3] - az,
        len = Math.hypot(dx, dz),
        ux = dx / len,
        uz = dz / len,
        own = sg[6] >= 0;
      if (sg[4] === 1) {
        let t = 0,
          q = 0;
        while (t < len) {
          const bl = 1.4 + 1.2 * hs(sg[6], q, 41),
            tm = (t + bl / 2) / len,
            x = ax + dx * tm,
            z = az + dz * tm;
          if (inT(x, z) && (!own || stands(sg, tm, len, x, z))) {
            const ht = 1.0 + 0.8 * hs(sg[6], q, 43),
              th = 0.6 + 0.3 * hs(sg[6], q, 47),
              ya = GV(x - (ux * bl) / 2, z - (uz * bl) / 2),
              yb = GV(x + (ux * bl) / 2, z + (uz * bl) / 2),
              v = 0.86 + 0.2 * hs(sg[6], q, 53),
              jx = (hs(sg[6], q, 59) - 0.5) * 0.15;
            B.box(x - uz * jx, (ya + yb) / 2 - 0.15, z + ux * jx, ux, uz, bl * 1.02, th, ht, [CORAL[0] * v, CORAL[1] * v, CORAL[2] * v * 0.96], (yb - ya) / 2);
            /* a few blocks along the top, uneven */
            if (hs(sg[6], q, 61) < 0.6) B.box(x, (ya + yb) / 2 - 0.15 + ht, z, ux, uz, bl * 0.6, th * 0.8, 0.22, [CORAL[0] * v * 0.92, CORAL[1] * v * 0.92, CORAL[2] * v * 0.88], 0);
          }
          t += bl;
          q++;
        }
      } else if (sg[4] === 2) {
        for (let q = 0, t = 1.5; t < len; t += 2.8, q++)
          for (const side of [-1.3, 1.3]) {
            const tt = t + (side > 0 ? 1.4 : 0),
              x = ax + ux * tt - uz * side,
              z = az + uz * tt + ux * side;
            if (!inT(x, z) || (own && !stands(sg, tt / len, len, ax + ux * tt, az + uz * tt))) continue;
            const y = GV(x, z),
              hgt = 6 + 3.5 * hs(sg[6], q * 2 + (side > 0 ? 1 : 0), 67),
              v = 0.85 + 0.3 * hs(sg[6], q, 71);
            B.prism(x, y - 0.1, z, 0.18, 0.15, 1.2, 5, BARK);
            B.prism(x, y + 0.6, z, 1.5, 0.9, hgt - 0.6, fine ? 7 : 5, [FUK[0] * v, FUK[1] * v, FUK[2] * v]);
          }
      } else if (sg[4] === 3) {
        for (let t = 0; t < len; t += 3) {
          const x = ax + ux * (t + 1.5),
            z = az + uz * (t + 1.5);
          if (!inT(x, z) || (own && !fieldOK(x, z))) continue;
          const y = GV(x, z);
          B.box(x, y - 0.2, z, ux, uz, 3.05, 1.3, 0.62, DYKE, 0);
        }
      }
    }
    /* the cane (near only) */
    if (fine) {
      for (let b = 0; b < n; b += 2)
        for (let a = 0; a < n; a += 2) {
          const x = x0 + (a + 1) * st,
            z = z0 + (b + 1) * st,
            s = sample(x, z);
          if (s[1] === K.cane)
            for (let c = 0; c < 4; c++) {
              const cx = x + (hs(a * 7 + c, b, 73) - 0.5) * 3.6,
                cz = z + (hs(a, b * 7 + c, 79) - 0.5) * 3.6,
                cy = GV(cx, cz),
                ch = 2.6 + 1.2 * hs(a + c, b, 83),
                v = 0.85 + 0.3 * hs(a, b + c, 89);
              B.prism(cx, cy, cz, 0.45, 0.85, ch, 3, [CANE[0] * v, CANE[1] * v, CANE[2] * v * 0.9]);
            }
        }
    }
    /* the course's marker boards (one per station, at its start, left of the track) */
    if (fine)
      for (const [nm, ua] of STN) {
        const x = CO.x + ua,
          z = CO.z - 15;
        if (!inT(x, z)) continue;
        const y = GV(x, z);
        B.box(x, y, z, 1, 0, 0.12, 0.12, 2.2, [0.9, 0.9, 0.86], 0);
        B.box(x, y + 1.6, z + 0.1, 1, 0, 1.4, 0.06, 0.7, nm.startsWith('7') ? [0.2, 0.3, 0.6] : [0.75, 0.15, 0.12], 0);
      }
    const stand = B.mesh(wmat);
    if (stand) stand.updateMatrix();
    return { ground, stand, fine };
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
        m.geometry.dispose();
      }
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
      const [a, b, fine] = queue.shift(),
        old = tiles.get(KEY(a, b)),
        T = build(a, b, fine);
      if (old) drop(old);
      scene.add(T.ground);
      if (T.stand) scene.add(T.stand);
      tiles.set(KEY(a, b), T);
    }
    /* the far world's ground is left undrawn over the square the tiles cover in full (the ring the queue has finished) */
    if (!queue.length) NEARCUT.value.set(ci * TS + TS / 2, cj * TS + TS / 2, (RF + 0.5) * TS - 0.5, 1);
    else if (NEARCUT.value.w > 0) {
      /* still filling: keep the cut only where every tile is in */
      let ok = RF;
      for (const [a, b] of queue) ok = Math.min(ok, Math.max(Math.abs(a - ci), Math.abs(b - cj)) - 1);
      NEARCUT.value.set(ci * TS + TS / 2, cj * TS + TS / 2, Math.max(0, (ok + 0.5) * TS - 0.5), ok >= 0 ? 1 : 0);
    }
  };
  return { K, GH, GV, kind: (x, z) => (inArea(x, z) ? (onPad(x, z) ? K.gravel : sample(x, z)[1]) : K.grass), block, update, clear, CO, STN, tiles, inArea };
})();
