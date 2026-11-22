/* =====================================================================================================================
   THE PCE-842 MODEL - built from the PCE-874 Booklet of General Plans (BuShips PCE 874-S0103-426816, plates 3 to 8), which the
   user chose as the closest deck layout to PCE-842, checked against the A. D. Baker PCE-827 class drawing and photographs of PCE-842.
   Model frame: bow toward +x, waterline at y = 0, starboard +z, origin amidships. Frames are the plans' 24 in (0.6096 m) frames,
   numbered aft from frame 0 at the forward perpendicular: x = XF(frame).
   Key measurements taken from the plans (above the 8 ft 4 in design waterline):
     stem head 5.77 m; forecastle (upper) deck at the side 5.6 m at frame 3, 4.75 at 22, 4.45 at 40, 4.35 at the break (frame 62.8);
     main deck aft 2.8 m, fantail 2.55 to 2.7; keel 2.54 m below the waterline from frame 6 to 70; beam 10.08 m (33 ft 1 in);
     navigating bridge (02) deck 7.03 m, open bridge 9.6 m, A/S hut roof 11.7 m, searchlight platform 13.8 m, mast at frame 40.
   Paint: Measure 32 dazzle as photographed on PCE-842 (port side; the starboard side is mirrored until a starboard photo turns up),
   in 5-L light gray, 5-O ocean gray and BK dull black, with 20-B deck blue on the decks. The pattern is painted per pixel by the
   ship's material (PCEM.material) on every part coloured with the KEY colour, so the band edges stay sharp.
   The five playable stations have their own first-person interiors (rooms face inward, so they cannot be seen from outside):
   1 OOD in the pilothouse, 2 engine room, 3 radar / radio room (and the sonar in the A/S hut), 4 gunner: 3"/50, 20 mm and aft twin
   40 mm, 5 torpedoman: the Hedgehog, the K-guns and the depth-charge racks.
   ===================================================================================================================== */
const PCEM = (() => {
  const FR = 0.6096,
    XF = (f) => 27.75 - FR * f,
    PI = Math.PI,
    HP = PI / 2;
  const sst = (a) => (a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a));
  const tab = (T, v) => {
    if (v <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++)
      if (v <= T[i][0]) {
        const a = T[i - 1],
          b = T[i],
          t = (v - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    return T[T.length - 1][1];
  };
  /* ---------- the hull, from the plans ---------- */
  const F_STEM = -1.1,
    F_BRK = 62.8,
    F_END = 91.16 /* the transom at the deck: plate 4 (outboard profile) shows it raked, from frame 90 at the counter's knuckle to
      the deck at about 91.2 (measured on plate 4); 91.16 makes her the published 184 ft 6 in (56.24 m) overall from the stem head (it was
      once a square stern at 90.2, 0.6 m short) */,
    F_KN = 90 /* the transom at the knuckle */;
  /* the frame of the raked transom at height y (between the knuckle c and the deck t) */
  const fTr = (y, c, t) => F_KN + (F_END - F_KN) * Math.min(1, Math.max(0, (y - c) / Math.max(0.01, t - c)));
  const HD = [
      [-1.1, 5.77],
      [2.6, 5.62],
      [10, 5.18],
      [22, 4.75],
      [40, 4.45],
      [62.8, 4.35],
    ] /* forecastle deck at the side */,
    HM = [
      [62.8, 2.82],
      [77, 2.75],
      [82, 2.55],
      [91.5, 2.7],
    ] /* main deck aft of the break */,
    BD = [
      [-1.1, 0.1],
      [3.5, 1.51],
      [8.1, 2.62],
      [12.7, 3.38],
      [17.3, 3.93],
      [22, 4.33],
      [26.6, 4.64],
      [31.2, 4.84],
      [35.9, 4.96],
      [40.5, 5.04],
      [72.9, 5.04],
      [77.6, 4.84],
      [82.2, 4.54],
      [86.9, 3.93],
      [91.5, 3.02],
    ] /* deck-edge half-breadth (main deck plan outline, scaled to the 33 ft 1 in beam) */,
    BC = [
      [0, 0],
      [2, 0.55],
      [5, 1.25],
      [10, 2.25],
      [15, 3.05],
      [20, 3.7],
      [25, 4.15],
      [30, 4.5],
      [35, 4.75],
      [40, 4.88],
      [45, 4.92],
      [55, 4.92],
      [60, 4.85],
      [70, 4.6],
      [76, 4.25],
      [80, 3.85],
      [84, 3.3],
      [88.3, 2.6],
      [91.5, 2.35],
    ] /* half-breadth at the waterline (aft of frame 88.3: at the counter's knuckle) */,
    NX = [
      [0, 1.5],
      [8, 2.2],
      [18, 3.2],
      [30, 3.8],
      [62, 3.8],
      [76, 2.8],
      [88, 2.2],
      [91.5, 2.0],
    ] /* section fullness below the waterline (superellipse exponent) */;
  const hd = (f) => tab(HD, f),
    hm = (f) => tab(HM, f),
    top = (f) => (f <= F_BRK ? hd(f) : hm(f)),
    Bd = (f) => tab(BD, f),
    Bc = (f) => (f < 0 ? 0 : tab(BC, f));
  /* the knuckle: the waterline under the hull, rising above it at the overhanging counter stern */
  /* (plate 4: the counter meets the 8 ft 4 in waterline at about frame 89.7, a waterline length of 179 ft 4.5 in; it once rose from frame 86 and
     ended the waterline at 88.3, 0.85 m short) */
  const yc = (f) => (f < 0 ? 5.77 * (-f / 1.1) : f > 89.7 ? 0.5 * sst((f - 89.7) / 1.5) : 0);
  /* the keel: a curved forefoot, flat from frame 6 to 70, rising in the run to the counter */
  const yk = (f) => {
    if (f < 0) return yc(f);
    if (f < 5.7) return -2.54 * Math.sqrt(f / 5.7);
    if (f <= 70) return -2.54;
    if (f < 88.3) return -2.54 * Math.pow(1 - (f - 70) / 18.3, 1.15);
    return yc(f) - 0.22;
  };
  /* half-breadth of the hull at height y at frame f (the shell, inside out: used for the hull, the ocean mask and the rooms) */
  function hb(f, y) {
    const k = yk(f),
      c = yc(f),
      b = Bc(f),
      t = top(f),
      d = Bd(f);
    if (y <= k) return 0;
    if (y < c) {
      const D = c - k,
        n = tab(NX, f);
      return b * Math.pow(Math.max(0, 1 - Math.pow((c - y) / D, n)), 1 / n);
    }
    const v = Math.min(1, (y - c) / Math.max(0.01, t - c));
    return b + (d - b) * Math.pow(v, 1.5);
  }

  /* ---------- colours ---------- */
  const KEY = [1, 0, 1] /* painted by the dazzle shader (Measure 32), with the red bottom and black boot-topping below */,
    KEY_IN = 0x55606a /* 5-O ocean gray on the inboard faces of bulwarks and tubs */,
    DECK = 0x39434e /* 20-B deck blue */,
    GUNC = 0x4b5258,
    BARREL = 0x2e3135,
    STEEL = 0x3c4045,
    DARK = 0x1a1d20,
    WIN = 0x10161b,
    WHITE = 0xe6e6e0,
    BRASS = 0xa8823a,
    CANVAS = 0x6d6f5d,
    WOOD = 0x8a6a45,
    RUBBER = 0x2b2b2b,
    INT_W = 0xd4d6cf /* interior bulkheads: white */,
    INT_F = 0x4d4a46 /* interior deck: dark linoleum / steel */,
    INT_C = 0xe2e2dc,
    ENG_W = 0xb9bdb6 /* engine room: light gray */,
    ENG_F = 0x5a5d5f /* engine room floor plates */,
    ENG_M = 0x6f7a72 /* machinery: gray-green enamel */,
    GLOW = 0x47ff8e /* radar scope */,
    DIAL = 0xf2efe2;
  const { part, cyl, bx, sph, M4 } = GX;
  const groups = [];
  let P = [];
  let INTR = false; /* while true, emitted groups are interiors (their own mesh, evenly lit) */
  const begin = () => (P = []),
    emit = (T) => groups.push([P, T || null, INTR]);
  const add = (g, hex, x, y, z, rx, ry, rz, sx, sy, sz) => {
    const p = part(g, hex, x, y, z, rx, ry, rz, sx, sy, sz);
    if (Array.isArray(hex)) {
      p.c = hex;
      p.hex = 0;
    }
    P.push(p);
    return p;
  };
  const B = (sx, sy, sz, hex, x, y, z, ry, rx, rz) => add(bx(sx, sy, sz), hex, x, y, z, rx || 0, ry || 0, rz || 0);
  const C = (r1, r2, h, hex, x, y, z, rx, ry, rz, n) => add(cyl(r1, r2, h, n || 12), hex, x, y, z, rx || 0, ry || 0, rz || 0);
  const Cx = (r, l, hex, x, y, z, n) => C(r, r, l, hex, x, y, z, 0, 0, HP, n) /* a cylinder lying along x */,
    Cz = (r, l, hex, x, y, z, n) => C(r, r, l, hex, x, y, z, HP, 0, 0, n) /* along z */;
  const S = (r, hex, x, y, z, sx, sy, sz) => add(sph(10), hex, x, y, z, 0, 0, 0, r * (sx || 1), r * (sy || 1), r * (sz || 1));
  /* a geometry with its faces turned inside out (an inner face that can be seen from inside a tub, a room, a boat) */
  const flip = (g) => {
    g = g.index ? g.toNonIndexed() : g;
    const p = g.attributes.position.array,
      n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 9)
      for (let k = 0; k < 3; k++) {
        const t = p[i + 3 + k];
        p[i + 3 + k] = p[i + 6 + k];
        p[i + 6 + k] = t;
        const u = n[i + 3 + k];
        n[i + 3 + k] = n[i + 6 + k];
        n[i + 6 + k] = u;
      }
    for (let i = 0; i < n.length; i++) n[i] = -n[i];
    return g;
  };
  /* a surface lofted through rows of points (each row the same length) */
  const loft = (rows) => {
    const pos = [],
      idx = [],
      I = rows[0].length;
    for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
    for (let j = 0; j < rows.length - 1; j++)
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
    return g;
  };
  /* a vertical prism from a plan outline [x, z] (anticlockwise seen from above), walls only; with a roof in roofHex */
  const prism = (pts, y0, y1, hex, roofHex) => {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 6 });
    g.rotateX(-HP);
    g.translate(0, y0, 0);
    add(g, hex, 0, 0, 0);
    if (roofHex !== undefined) {
      const r = new THREE.ShapeGeometry(sh, 6);
      r.rotateX(-HP);
      r.translate(0, y1 + 0.006, 0);
      add(r, roofHex, 0, 0, 0);
    }
  };
  /* a plate between two polylines (a bulwark, a windscreen): outer face key-painted, inner face in hexIn */
  const plate = (a, b, hexOut, hexIn, ctr) => {
    let g1 = loft([a, b]),
      g2 = flip(loft([a, b]));
    if (ctr) {
      /* the outer face must face away from ctr: test the first triangle */
      const m = Math.floor(a.length / 2),
        p0 = new THREE.Vector3(...a[m - 1]),
        p1 = new THREE.Vector3(...a[m]),
        p2 = new THREE.Vector3(...b[m]),
        n = p1.clone().sub(p0).cross(p2.clone().sub(p0)),
        o = p0.clone().sub(new THREE.Vector3(...ctr));
      o.y = 0;
      if (n.dot(o) < 0) [g1, g2] = [g2, g1];
    }
    add(g1, hexOut, 0, 0, 0);
    add(g2, hexIn, 0, 0, 0);
  };
  /* an open tub (a gun tub, a director's tub): wall inside and out, a rim, and a deck */
  const tub = (x, y, z, r, h, deckHex) => {
    C(r, r, h, KEY, x, y + h / 2, z, 0, 0, 0, 28).g;
    P[P.length - 1].g = new THREE.CylinderGeometry(r, r, h, 28, 1, true);
    add(flip(new THREE.CylinderGeometry(r - 0.04, r - 0.04, h, 28, 1, true)), KEY_IN, x, y + h / 2, z);
    add(new THREE.TorusGeometry(r - 0.02, 0.035, 5, 28), KEY_IN, x, y + h, z, HP, 0, 0);
    C(r - 0.03, r - 0.03, 0.04, deckHex === undefined ? DECK : deckHex, x, y + 0.02, z, 0, 0, 0, 28);
  };
  /* rails: stanchions along a polyline at deck height, with two wires */
  const rails = (pts, h) => {
    h = h || 1.0;
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = pts[i];
      C(0.022, 0.022, h, STEEL, x, y + h / 2, z, 0, 0, 0, 5);
      if (i < pts.length - 1) {
        const [x2, y2, z2] = pts[i + 1],
          L = Math.hypot(x2 - x, z2 - z, y2 - y),
          ry = -Math.atan2(z2 - z, x2 - x),
          rz = Math.atan2(y2 - y, Math.hypot(x2 - x, z2 - z));
        for (const k of [0.52, 1.0]) B(L, 0.02, 0.02, STEEL, (x + x2) / 2, (y + y2) / 2 + h * k, (z + z2) / 2, ry, 0, rz);
      }
    }
  };
  /* a run of stanchion points along the deck edge from frame a to b on one side */
  const edge = (a, b, side, step, inset) => {
    const out = [];
    const n = Math.max(1, Math.round(Math.abs(b - a) / (step || 2)));
    for (let i = 0; i <= n; i++) {
      const f = a + ((b - a) * i) / n,
        t = top(f);
      out.push([XF(f), t, side * (hb(f, t) - (inset || 0.12))]);
    }
    return out;
  };
  /* a round gauge: black bezel and a white face, facing along x ('x') or z ('z') */
  const dial = (x, y, z, r, ax) => {
    const rx = ax === 'z' ? HP : 0,
      rz = ax === 'z' ? 0 : HP;
    C(r, r, 0.04, DARK, x, y, z, rx, 0, rz, 16);
    return C(r * 0.86, r * 0.86, 0.046, DIAL, x, y, z, rx, 0, rz, 16);
  };

  /* ================= THE GUN CREWS: a US Navy sailor, 1945 =================
     Mk 2 steel helmet (navy gray), kapok life jacket, chambray shirt, dungarees, black shoes; talkers wear a sound-powered phone headset
     with the mouthpiece on the chest. Built facing +x with the feet at the origin; pose = 'stand' | 'sit' | 'lean' (a 20 mm gunner
     strapped into the shoulder rests); arms = 'down' | 'wheel' (hands forward on the hand wheels) | 'clip' (a loader holding a clip up to
     the guide) | 'round' (holding a 3 in round) | 'rests' (hands up on the 20 mm's grips) | 'glass' (at a director's sight). */
  const SKIN = [0xc89a7a, 0xb8835e, 0x8d5a3b, 0xd7a98a, 0xa8754f],
    DUNG = 0x2d3a52,
    SHIRT = 0x8ea6c4,
    KAPOK = 0x7e8170,
    HELM = 0x5b6570,
    SHOE = 0x1b1b1b;
  let crewN = 0;
  const bone = (a, b, w, d, hex) => {
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]),
      L = dir.length();
    const p = add(bx(w, L, d), hex, 0, 0, 0);
    p.m = new M4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()), new THREE.Vector3(1, 1, 1));
    return p;
  };
  const sailor = (pose, arms, talker) => {
    const Q = [],
      P0 = P;
    P = Q;
    const skin = SKIN[crewN++ % SKIN.length],
      sin = Math.sin,
      cos = Math.cos,
      D = PI / 180;
    /* pelvis height, lean of the trunk (+ forward), thigh and shin angles from straight down (+ forward) */
    const seat = pose === 'sit',
      px = 0,
      py = seat ? 0.62 : 0.93,
      lean = pose === 'lean' ? -12 * D : seat ? 8 * D : 4 * D,
      th = seat ? 85 * D : pose === 'lean' ? -6 * D : 0,
      sh = seat ? 10 * D : pose === 'lean' ? 6 * D : 0;
    const T = [px + 0.56 * sin(lean), py + 0.56 * cos(lean)] /* top of the trunk */,
      Hd = [T[0] + 0.15 * sin(lean), T[1] + 0.15 * cos(lean)] /* the head's centre: 15 cm above the shoulders (it was 24, a long neck) */;
    /* legs */
    for (const s of [-1, 1]) {
      const z = s * 0.11,
        hip = [px, py - 0.04, z],
        kn = [hip[0] + 0.44 * sin(th), hip[1] - 0.44 * cos(th), z],
        ft = [kn[0] + 0.45 * sin(sh), kn[1] - 0.45 * cos(sh), z];
      bone(hip, kn, 0.17, 0.16, DUNG);
      bone(kn, ft, 0.14, 0.13, DUNG);
      B(0.27, 0.09, 0.12, SHOE, ft[0] + 0.07, ft[1] + 0.045, z);
    }
    /* trunk: shirt, then the kapok jacket over it, collar, belt */
    bone([px, py - 0.05, 0], [T[0], T[1], 0], 0.24, 0.36, SHIRT);
    bone([px + 0.01, py + 0.08, 0], [T[0] - 0.01 * sin(lean), T[1] - 0.03, 0], 0.32, 0.44, KAPOK);
    for (const s of [-1, 1]) bone([T[0] - 0.02, T[1] - 0.04, s * 0.18], [T[0] - 0.08, T[1] - 0.16, s * 0.22], 0.12, 0.1, KAPOK);
    B(0.26, 0.05, 0.38, 0x3a3326, px, py - 0.02, 0, 0, 0, -lean);
    /* neck, head, Mk 2 helmet with its brim and chin strap */
    bone([T[0], T[1] - 0.04, 0], [Hd[0] - 0.02, Hd[1] - 0.06, 0], 0.09, 0.09, skin);
    S(0.1, skin, Hd[0], Hd[1], 0, 0.95, 1.15, 0.92);
    B(0.04, 0.035, 0.035, skin, Hd[0] + 0.1, Hd[1] - 0.01, 0);
    S(0.155, HELM, Hd[0] - 0.01, Hd[1] + 0.06, 0, 1, 0.62, 1.02);
    C(0.18, 0.185, 0.02, HELM, Hd[0] - 0.01, Hd[1] + 0.03, 0, 0, 0, 0, 14);
    B(0.02, 0.15, 0.17, 0x2a2a26, Hd[0] + 0.02, Hd[1] - 0.06, 0);
    if (talker) {
      for (const s of [-1, 1]) Cz(0.05, 0.04, DARK, Hd[0] - 0.01, Hd[1] - 0.01, s * 0.12, 10);
      bone([Hd[0] - 0.01, Hd[1] + 0.09, -0.12], [Hd[0] - 0.01, Hd[1] + 0.09, 0.12], 0.015, 0.015, DARK);
      C(0.06, 0.03, 0.09, DARK, T[0] + 0.21, T[1] - 0.1, 0, 0, 0, HP, 10);
      bone([T[0] + 0.2, T[1] - 0.1, 0], [Hd[0] - 0.02, Hd[1] - 0.06, 0.11], 0.012, 0.012, DARK);
    }
    /* arms: upper arm and forearm angles from straight down (+ forward), and how far apart the hands are */
    const A = {
      down: [12, 22, 0.24],
      wheel: [62, 88, 0.3],
      clip: [150, 172, 0.13],
      round: [55, 95, 0.16],
      rests: [108, 158, 0.24],
      glass: [80, 118, 0.12],
    }[arms || 'down'];
    for (const s of [-1, 1]) {
      const sh0 = [T[0] - 0.03, T[1] - 0.05, s * 0.24],
        a1 = A[0] * D + lean,
        a2 = A[1] * D + lean,
        zH = s * A[2],
        el = [sh0[0] + 0.3 * sin(a1), sh0[1] - 0.3 * cos(a1), (sh0[2] + zH) / 2 + s * 0.02],
        hn = [el[0] + 0.27 * sin(a2), el[1] - 0.27 * cos(a2), zH];
      bone(sh0, el, 0.11, 0.11, SHIRT);
      bone(el, hn, 0.09, 0.09, SHIRT);
      S(0.05, skin, hn[0], hn[1], hn[2]);
    }
    /* what the hands hold */
    const hx = T[0] + (arms === 'clip' ? 0.12 : 0.5),
      hy = arms === 'clip' ? T[1] + 0.48 : T[1] - 0.12;
    if (arms === 'clip') for (let k = 0; k < 4; k++) C(0.022, 0.022, 0.38, BRASS, hx, hy, -0.12 + k * 0.08, 0, 0, 0, 5);
    if (arms === 'round') {
      Cx(0.04, 0.6, BRASS, T[0] + 0.45, T[1] - 0.18, 0, 8);
      add(cyl(0.04, 0.01, 0.2, 8), 0x4a5a3a, T[0] + 0.85, T[1] - 0.18, 0, 0, 0, -HP);
    }
    P = P0;
    return Q;
  };
  /* put a crewman into the current group: (x, y, z) of his feet, facing yaw (0 = toward +x, + turns toward -z, i.e. to port) */
  const man = (x, y, z, yaw, pose, arms, talker) => {
    const Q = sailor(pose, arms, talker),
      T = GX.xf(x, y, z, yaw || 0);
    for (const q of Q) q.m = q.m ? new M4().multiplyMatrices(T, q.m) : T.clone();
    P.push(...Q);
  };

  /* lead angles for the ring sights' 100, 200 and 300 knot rings: target speed / the shell's mean velocity, 618 m/s for the 20 mm out to
     1,000 yd and 739 m/s for the 40 mm out to 1,500 m (the drag fits in the game's GUNS table) */
  const KN = 0.5144,
    LEAD20 = [100, 200, 300].map((k) => Math.atan((k * KN) / 618)),
    LEAD40 = [100, 200, 300].map((k) => Math.atan((k * KN) / 739));
  /* live instrument faces: the game paints them (radar, sonar, gauges, telegraphs, compass cards); p is the face's centre (model frame),
     w x h its size, n the way it faces, up the way its top points */
  const FACES = [],
    WHEEL = { parts: [], pivot: [0, 0, 0] };
  const face = (id, p, w, h, n, up) => FACES.push({ id, p, w, h, n, up: up || [0, 1, 0] });
  /* collect the parts a function adds into a list of their own */
  const grab = (fn) => {
    const Q = [],
      P0 = P;
    P = Q;
    fn();
    P = P0;
    return Q;
  };
  /* the guns the player can man (station 4) are moving parts, not baked into the hull: d.T places the mount (its rest bearing
     included) in the model frame, d.base stays fixed with the hull, d.train turns about the mount's vertical axis, d.elev is
     built level about the trunnions at d.pivot (in the training frame), d.pm is the crewman the player replaces, d.sight (if any)
     is a sight built about the eye that tilts with the guns (a sight linkage). d.eye is in the training frame, or in the
     elevating frame when d.eyeEl (the 20 mm gunner rides the gun in its shoulder rests). d.muzzles are in the elevating frame. */
  const MNT = [];
  /* every gun of hers that is not a moving mount, in the model frame (the AI crews fire them: RULES OF ENGAGEMENT): [type, x, y, z] at the
     trunnions */
  const GUNPOS = [];
  const mount = (d) => {
    groups.push([d.base, d.T, false]);
    MNT.push(d);
  };
  /* ================= THE HULL ================= */
  begin();
  {
    const FS = [];
    for (let f = F_STEM; f < 0; f += 0.275) FS.push(f);
    for (const f of [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8]) FS.push(f);
    for (let f = 10; f < F_BRK; f += 2.5) FS.push(f);
    const FA = [F_BRK];
    for (let f = 64; f < 86; f += 2.5) FA.push(f);
    for (const f of [86, 87, 88, 88.3, 89, 89.6, 90, 90.7, F_END]) FA.push(f);
    FS.push(F_BRK);
    const NB = 9,
      NA = 10;
    const ring = (f, side) => {
      const x = XF(f),
        k = yk(f),
        c = yc(f),
        t = top(f),
        pts = [];
      /* aft of the knuckle each point stops at the raked transom */
      const at = (y) => (f > F_KN ? Math.min(f, fTr(y, c, t)) : f);
      for (let j = 0; j <= NB; j++) {
        const y = k + (c - k) * (1 - Math.pow(1 - j / NB, 1.6)),
          fe = at(y);
        pts.push([XF(fe), y, side * hb(fe, y)]);
      }
      for (let j = 1; j <= NA; j++) {
        const y = c + (t - c) * (j / NA),
          fe = at(y);
        pts.push([XF(fe), y, side * hb(fe, Math.min(y, t - 1e-4))]);
      }
      return pts;
    };
    for (const list of [FS, FA]) {
      const R = list.map((f) => ring(f, 1)),
        L = list.map((f) => ring(f, -1).reverse());
      /* starboard: rows run bow to stern, points keel to deck edge; port is mirrored with reversed winding */
      add(loft(R), KEY, 0, 0, 0);
      add(loft(L), KEY, 0, 0, 0);
      /* the deck: five points across, with 12 cm of camber */
      const D = list.map((f) => {
        const t = top(f),
          w = hb(f, t - 1e-4) - 0.01,
          x = XF(f);
        return [1, 0.5, 0, -0.5, -1].map((u) => [x, t + 0.12 * (1 - u * u), u * w]);
      });
      add(loft(D), DECK, 0, 0, 0);
    }
    /* the transom: a fan from its centre */
    {
      const f = F_END,
        r = ring(f, 1),
        l = ring(f, -1),
        x = (XF(F_KN) + XF(F_END)) / 2,
        cy = (yk(f) + top(f)) / 2,
        pos = [];
      /* each triangle both ways round, so the plate is solid whichever way its winding faces (from astern part of it was culled, and
         the sea showed through) */
      for (let i = 0; i < r.length - 1; i++) {
        pos.push(x, cy, 0, ...r[i], ...r[i + 1]);
        pos.push(x, cy, 0, ...r[i + 1], ...r[i]);
        pos.push(x, cy, 0, ...l[i + 1], ...l[i]);
        pos.push(x, cy, 0, ...l[i], ...l[i + 1]);
      }
      /* and the triangles that close the fan along the deck edge across the top and the keel across the bottom (the top one was
         missing: a wedge of sea showed through the stern from astern) */
      for (const [a, b] of [
        [r[r.length - 1], l[l.length - 1]],
        [l[0], r[0]],
      ])
        pos.push(x, cy, 0, ...a, ...b, x, cy, 0, ...b, ...a);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      add(g, KEY, 0, 0, 0);
      /* the deck edge across the transom */
      B(0.06, 0.12, 2 * hb(f, top(f) - 0.01), KEY, XF(F_END) + 0.02, top(f) + 0.06, 0);
    }
    /* the end of the forecastle deck: a bulkhead across the ship at the break, with doors and the ladder down */
    {
      const f = F_BRK,
        x = XF(f),
        w = hb(f, hd(f) - 0.01),
        y0 = hm(f),
        y1 = hd(f);
      B(0.1, y1 - y0, 2 * w, KEY, x - 0.05, (y0 + y1) / 2, 0);
      for (const s of [-1, 1]) {
        B(0.04, 1.75, 0.7, STEEL, x - 0.12, y0 + 0.9, s * 1.9);
        B(0.03, 0.12, 0.12, DARK, x - 0.15, y0 + 0.95, s * 1.62);
      }
      /* the ladder from the main deck up to the forecastle, on the centreline */
      for (const s of [-1, 1]) B(1.9, 0.08, 0.05, STEEL, x - 0.9, (y0 + y1) / 2 + 0.05, s * 0.38, 0, 0, 0.72);
      for (let i = 0; i < 7; i++) B(0.18, 0.03, 0.72, STEEL, x - 1.6 + i * 0.22, y0 + 0.2 + i * 0.22, 0);
    }
    /* the bulwark at the bow: about a metre high at the stem, fading into the rails by frame 12 */
    for (const s of [-1, 1]) {
      const a = [],
        b = [];
      for (let f = F_STEM + 0.05; f <= 9; f += 0.6) {
        const t = top(f),
          z = s * hb(f, t - 1e-3),
          h = 0.55 * Math.pow(Math.max(0, 1 - f / 9), 0.9) + 0.06;
        a.push([XF(f), t - 0.02, z]);
        b.push([XF(f), t + h, z * 1.01]);
      }
      plate(a, b, KEY, KEY_IN, [XF(6), 5, 0]);
    }
    /* rails along the rest of the decks */
    for (const s of [-1, 1]) {
      rails(edge(F_STEM + 0.4, 22, s, 1.9));
      rails(edge(40, 57.5, s, 2.0));
      rails(edge(63.3, 89.9, s, 1.9));
    }
    /* the hull number on each bow, white, as photographed (about 18 m forward of amidships, high on the bow) */
    {
      const SEG = { a: [0.5, 0.94, 0.86, 0.12], b: [0.94, 0.72, 0.12, 0.44], c: [0.94, 0.28, 0.12, 0.44], d: [0.5, 0.06, 0.86, 0.12], e: [0.06, 0.28, 0.12, 0.44], f: [0.06, 0.72, 0.12, 0.44], g: [0.5, 0.5, 0.86, 0.12] },
        DIG = { 8: 'abcdefg', 4: 'bcfg', 2: 'abged' },
        HN = 1.0,
        WN = 0.62;
      for (const s of [-1, 1])
        [].forEach((ch, di) => {
          /* read left to right from outside: on the port side the bow is on the left (8 forward), on the starboard side the stern is */
          const xl = s < 0 ? 19.2 - di * 0.82 : 16.94 + di * 0.82;
          for (const k of DIG[ch]) {
            const q = SEG[k],
              x = s < 0 ? xl - q[0] * WN : xl + q[0] * WN,
              y = 3.5 + q[1] * HN,
              f = (27.75 - x) / FR;
            /* each stroke lies along the plating: turned to the hull's waterline angle at that point */
            B(q[2] * WN, q[3] * HN, 0.03, WHITE, x, y, s * (hb(f, y) + 0.025), s * Math.atan2(hb(f + 0.5, y) - hb(f - 0.5, y), FR));
          }
        });
    }
    /* portholes: under the forecastle deck, and aft above the main deck */
    for (const s of [-1, 1]) {
      for (let f = 6; f <= 58; f += 3.9) {
        if ((f > 30 && f < 36) || (f > 12.5 && f < 19)) continue; /* none behind the hull number or the bridge front */
        const y = top(f) - 1.05,
          z = hb(f, y);
        C(0.17, 0.17, 0.06, BRASS, XF(f), y, s * (z + 0.005), HP, 0, 0, 10);
        C(0.13, 0.13, 0.07, WIN, XF(f), y, s * (z + 0.012), HP, 0, 0, 10);
      }
      for (let f = 66; f <= 80; f += 3.6) {
        const y = 1.85,
          z = hb(f, y);
        C(0.15, 0.15, 0.06, BRASS, XF(f), y, s * (z + 0.005), HP, 0, 0, 10);
        C(0.11, 0.11, 0.07, WIN, XF(f), y, s * (z + 0.012), HP, 0, 0, 10);
      }
    }
    /* a rubbing strake along the side at the main-deck level, as on the plans */
    for (const s of [-1, 1]) {
      const a = [];
      for (let f = 2; f <= 88; f += 2) {
        const y = f < F_BRK ? Math.min(top(f) - 1.55, 3.3) : top(f) - 0.25;
        a.push([XF(f), y, s * (hb(f, y) + 0.04)]);
      }
      for (let i = 0; i < a.length - 1; i++) {
        const [x1, y1, z1] = a[i],
          [x2, y2, z2] = a[i + 1];
        B(Math.hypot(x2 - x1, z2 - z1) + 0.02, 0.09, 0.08, KEY, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1), 0, Math.atan2(y2 - y1, x2 - x1));
      }
    }
    /* bilge keels, twin screws on shafts and struts, and the rudder */
    for (const s of [-1, 1]) {
      for (let f = 30; f < 62; f += 2) B(1.25, 0.04, 0.42, KEY, XF(f + 1), -1.95, s * 4.28, 0, s * 0.75, 0);
      const zs = s * 1.65;
      Cx(0.11, 13.5, STEEL, XF(76.5), -1.62, zs, 8);
      P[P.length - 1].m = new M4().compose(new THREE.Vector3(XF(76.5), -1.55, zs), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, HP - 0.035)), new THREE.Vector3(1, 1, 1));
      C(0.06, 0.06, 1.2, STEEL, XF(82.5), -1.2, zs * 0.85, s * 0.35, 0, 0, 6);
      Cx(0.22, 0.6, BRASS, XF(84.2), -1.82, zs, 12);
      for (let i = 0; i < 4; i++) {
        const a = (i * PI) / 2 + 0.4;
        B(0.06, 0.62, 0.3, BRASS, XF(84.2) - 0.1, -1.82 + Math.cos(a) * 0.45, zs + Math.sin(a) * 0.45, 0, a, 0);
      }
    }
    B(1.5, 1.6, 0.12, KEY, XF(87.6), -1.05, 0); /* the rudder, under the counter */
    /* the centreline skeg under the run, from frame 70 to the rudder post */
    {
      const a = [],
        b = [];
      for (let f = 70; f <= 87.5; f += 1.75) {
        a.push([XF(f), yk(f) + 0.05, 0]);
        b.push([XF(f), -2.54 + (f - 70) * 0.06, 0]);
      }
      for (const z of [-0.07, 0.07]) {
        const g = loft([a.map((p) => [p[0], p[1], z]), b.map((p) => [p[0], p[1], z])]);
        add(z > 0 ? g : flip(g), KEY, 0, 0, 0);
      }
    }
  }
  emit();

  /* ================= THE FORECASTLE: anchors, windlass, the 3"/50 and the Hedgehog ================= */
  begin();
  {
    const yF = (f) => hd(f) + 0.12;
    /* jackstaff and the forward anchor light */
    C(0.035, 0.05, 4.6, WOOD, XF(-0.6), hd(-0.6) + 2.3 + 0.9, 0, 0, 0, 0, 6);
    B(0.12, 0.3, 0.16, STEEL, XF(-0.6), hd(-0.6) + 1.0, 0) /* the jackstaff's socket on the stem head */;
    S(0.1, WHITE, XF(-0.6), hd(-0.6) + 5.57, 0) /* the anchor light, on the staff's head */;
    /* anchors in their hawse pipes, chain pipes, the windlass and bitts */
    for (const s of [-1, 1]) {
      const f = 5.4,
        y = 3.85,
        z = s * (hb(f, y) + 0.06);
      C(0.32, 0.32, 0.14, DARK, XF(f), y, z, HP, 0, 0, 12);
      B(0.14, 1.25, 0.12, STEEL, XF(f) - 0.05, y - 0.55, z + s * 0.06);
      B(0.95, 0.2, 0.14, STEEL, XF(f) - 0.05, y - 1.15, z + s * 0.06, 0, 0, 0.0);
      for (const d of [-1, 1]) B(0.42, 0.13, 0.14, STEEL, XF(f) - 0.05 + d * 0.38, y - 1.0, z + s * 0.06, 0, 0, d * 0.7);
      C(0.2, 0.2, 0.08, STEEL, XF(7.2), yF(7.2), s * 0.75, 0, 0, 0, 10);
      for (let i = 0; i < 9; i++) B(0.17, 0.05, 0.1, DARK, XF(7.4 + i * 0.35), yF(7.4 + i * 0.35) + 0.03, s * 0.75, 0, 0, 0);
      for (const f2 of [3.2, 13.6])
        for (const d of [-0.22, 0.22]) C(0.13, 0.13, 0.45, STEEL, XF(f2) + d, yF(f2) + 0.22, s * (hb(f2, hd(f2)) - 0.55), 0, 0, 0, 10);
    }
    {
      const x = XF(10.6),
        y = yF(10.6);
      B(1.0, 0.75, 1.3, STEEL, x, y + 0.37, 0);
      for (const s of [-1, 1]) {
        Cz(0.36, 0.3, DARK, x, y + 0.55, s * 0.82, 14);
        Cz(0.42, 0.04, STEEL, x, y + 0.55, s * 0.99, 14);
      }
      Cz(0.12, 2.3, STEEL, x, y + 0.55, 0, 8);
    }
    /* the 3"/50 Mk 22 on its pedestal (open mount), ready-service boxes, and the platform ring */
    {
      const f = 16.0 /* plates 4 and 5: the mount at frame 16 (it was at 17.5) */,
        x = XF(f),
        y = yF(f);
      C(2.4, 2.4, 0.05, 0x2f3740, x, y + 0.02, 0, 0, 0, 0, 32);
      emit();
      begin();
      /* the mount is the player's (station 4): its pedestal stays put, the carriage trains and the slide elevates (see MNT) */
      const base = grab(() => {
        C(0.42, 0.55, 0.85, GUNC, 0, 0.42, 0, 0, 0, 0, 16);
        C(0.62, 0.62, 0.12, GUNC, 0, 0.9, 0, 0, 0, 0, 18);
      });
      const train = grab(() => {
        B(1.0, 0.55, 0.95, GUNC, 0, 1.2, 0);
        for (const s of [-1, 1]) B(0.75, 0.55, 0.08, GUNC, 0.05, 1.5, s * 0.42);
        Cz(0.11, 1.0, STEEL, 0.05, 1.62, 0, 10);
        /* hand wheels for training (right) and elevating (left), the pointer's and trainer's seats and shoulder pieces */
        for (const s of [-1, 1]) {
          add(new THREE.TorusGeometry(0.2, 0.02, 5, 14), BRASS, -0.2, 1.25, s * 0.55, 0, 0, 0);
          B(0.32, 0.05, 0.3, STEEL, -0.6, 1.0, s * 0.62);
          C(0.025, 0.025, 0.45, STEEL, -0.6, 0.75, s * 0.62, 0, 0, 0, 5);
          B(0.25, 0.2, 0.06, RUBBER, -0.25, 1.55, s * 0.6);
          /* footrests */
          B(0.3, 0.04, 0.28, STEEL, -0.2, 0.42, s * 0.66);
        }
        /* the trainer (right) on his seat; the loader behind the breech with a round; the sight-setter, a talker */
        man(-0.82, 0.4, 0.66, 0, 'sit', 'wheel', true);
        man(-1.62, 0, -1.12, 0.25, 'stand', 'round');
        man(-1.5, 0, 1.12, -0.3, 'stand', 'down', true);
      });
      /* the elevating part, built level about the trunnions: slide, barrel, recoil cylinders, breech, and the pointer's and
         trainer's sight telescopes on their brackets either side of the slide */
      const elev = grab(() => {
        B(1.35, 0.36, 0.42, GUNC, -0.1, 0, 0);
        Cx(0.075, 3.25, BARREL, 2.2, 0.02, 0, 12);
        Cx(0.095, 0.9, BARREL, 0.95, 0.02, 0, 12);
        Cx(0.06, 0.18, DARK, 3.86, 0.02, 0, 10);
        for (const s of [-1, 1]) Cx(0.07, 1.1, GUNC, 0.35, -0.2, s * 0.13, 10);
        B(0.55, 0.42, 0.36, GUNC, -0.95, 0.02, 0);
        B(0.15, 0.3, 0.3, STEEL, -1.25, 0.02, 0);
        for (const s of [-1, 1]) {
          Cx(0.05, 0.45, DARK, -0.2, 0.3, s * 0.32, 8);
          B(0.1, 0.12, 0.1, DARK, -0.45, 0.3, s * 0.32);
          bone([-0.15, -0.2, s * 0.13], [-0.15, 0.3, s * 0.32], 0.05, 0.05, GUNC) /* the sight's bracket from the cradle */;
          bone([-0.15, 0.3, s * 0.32], [-0.15, 0.2, s * 0.6], 0.04, 0.04, GUNC) /* the telescope's arm */;
          /* the telescope: tube, eyepiece and its rubber eyecup toward the seat, sun shade forward */
          Cx(0.035, 0.55, DARK, -0.2, 0.2, s * 0.6, 10);
          Cx(0.045, 0.08, RUBBER, -0.5, 0.2, s * 0.6, 10);
          Cx(0.05, 0.12, DARK, 0.12, 0.2, s * 0.6, 10);
          B(0.3, 0.05, 0.16, STEEL, -0.15, 0.13, s * 0.5);
        }
      });
      /* the pointer (left seat): the player when he mans this gun */
      const pm = grab(() => man(-0.82, 0.4, -0.66, 0, 'sit', 'wheel'));
      mount({
        id: '3in',
        T: GX.xf(x, y, 0, 0),
        ry0: 0,
        base,
        train,
        elev,
        pm,
        pivot: [0.05, 1.62, 0],
        eye: [-0.63, 1.82, -0.6] /* the pointer's eye at his telescope */,
        muzzles: [[3.97, 0.02, 0]],
      });
      begin();
      for (const s of [-1, 1]) {
        B(0.9, 0.7, 0.55, KEY, XF(21.2), yF(21.2) + 0.35, s * 3.15, s * 0.5);
        B(0.92, 0.04, 0.57, STEEL, XF(21.2), yF(21.2) + 0.72, s * 3.15, s * 0.5);
      }
    }
    /* the Hedgehog Mk 10: four cradles of six spigots, loaded, on the centreline ahead of the bridge; its ready boxes */
    {
      const f0 = 21.6 /* plate 5: the Mk 10 projector spans frames 20.1 to 23.0 (it was at 22.2) */,
        x = XF(f0),
        y = yF(f0);
      B(2.0, 0.32, 1.85, STEEL, x, y + 0.16, 0);
      for (let r = 0; r < 4; r++) {
        const xr = x + 0.7 - r * 0.46;
        B(0.14, 0.42, 1.75, STEEL, xr, y + 0.5, 0);
        for (let i = 0; i < 6; i++) {
          const z = -0.72 + i * 0.29,
            tilt = 0.68 - r * 0.06;
          /* the spigot (the bombs themselves are separate in the game, so they leave when fired and come back as loaded) */
          C(0.032, 0.032, 0.62, DARK, xr + 0.12, y + 0.82, z, 0, 0, -tilt, 6);
          C(0.06, 0.07, 0.08, STEEL, xr + 0.02, y + 0.71, z, 0, 0, -tilt, 8);
        }
      }
      for (const s of [-1, 1])
        for (const d of [0, 1]) {
          B(1.4, 0.6, 0.5, KEY, XF(25.4 + d * 1.6), yF(25) + 0.3, s * (2.6 + d * 0.5), s * 0.62);
        }
    }
  }
  emit();

  /* ================= THE BRIDGE: deckhouse (01), navigating bridge (02) with pilothouse and radar room, open bridge (03) with the A/S hut ================= */
  const Y1 = 4.45,
    Y2 = 7.03,
    Y3 = 9.6,
    YG = 10.15 /* the open bridge's raised grating (the compass stands on it, as on plate 3) */,
    YHUT = 11.5;
  const X_PH0 = XF(25.0) /* plates 4 and 5: the steering station's front at frame 25 (it was 23.8) */,
    X_PH1 = XF(29.0) /* pilothouse */,
    X_RR1 = XF(35.8) /* radar plot / radio room aft end */,
    W_PH = 2.15;
  begin();
  {
    /* 01: the deckhouse on the forecastle deck, frames 26.6 to 38 (its after wall, behind the blower rooms, on the PCE 874/875
       upper deck plan; it once ran on to 43.4 and into the 20 mm tub), angled at the forward corners */
    const a = XF(26.6),
      b = XF(38.0),
      w = 3.85;
    prism(
      [
        [b, -w],
        [a - 1.6, -w],
        [a, -w + 1.6],
        [a, w - 1.6],
        [a - 1.6, w],
        [b, w],
      ],
      hd(35) - 0.05,
      Y2,
      KEY,
      DECK,
    );
    /* doors and a few portholes in the deckhouse */
    for (const s of [-1, 1]) {
      B(0.8, 1.8, 0.05, STEEL, XF(36.9), Y1 + 1.0, s * (w + 0.02));
      for (const f of [30, 33.5]) {
        C(0.16, 0.16, 0.05, BRASS, XF(f), Y1 + 1.55, s * (w + 0.02), HP, 0, 0, 10);
        C(0.12, 0.12, 0.06, WIN, XF(f), Y1 + 1.55, s * (w + 0.03), HP, 0, 0, 10);
      }
    }
    /* 02: the navigating bridge deck, wide with wings, overhanging the deckhouse */
    const wa = XF(23.6),
      wb = XF(36.6);
    prism(
      [
        [wb, -5.15],
        [wa + 0.4, -5.15],
        [wa + 0.8, -4.3],
        [wa + 0.8, 4.3],
        [wa + 0.4, 5.15],
        [wb, 5.15],
      ],
      Y2 - 0.22,
      Y2,
      KEY,
      DECK,
    );
    /* the bridge wings' splinter shields (open to the sky) */
    for (const s of [-1, 1]) {
      const o = [
          [wb + 0.05, Y2, s * 5.12],
          [wa + 0.4, Y2, s * 5.12],
          [wa + 0.78, Y2, s * 4.3],
        ],
        t = o.map(([x, y, z]) => [x, y + 1.12, z]);
      plate(o, t, KEY, KEY_IN, [XF(30), Y2, 0]);
    }
    /* the pilothouse (steering station) and the radar plot / radio room: one enclosure, rounded forward */
    const ph = [
      [X_RR1, -W_PH],
      [X_PH0 - 0.75, -W_PH],
      [X_PH0, -W_PH + 0.75],
      [X_PH0, W_PH - 0.75],
      [X_PH0 - 0.75, W_PH],
      [X_RR1, W_PH],
    ];
    prism(ph, Y2, Y3, KEY, DECK);
    /* pilothouse windows: five across the front and the angled corners, two each side (dark from outside); 0.8 m deep (they were
       0.42: the user's, 2026-11-21, a better view for the OOD, who now stands his watch in here) */
    {
      const yw = Y2 + 1.55;
      const pane = (w, h, x, y, z, ry) => add(new THREE.PlaneGeometry(w, h), WIN, x, y, z, 0, ry, 0);
      for (let i = -1; i <= 1; i++) pane(0.72, 0.8, X_PH0 + 0.012, yw, i * 0.78, HP);
      for (const s of [-1, 1]) {
        pane(0.5, 0.8, X_PH0 - 0.3665, yw, s * (W_PH - 0.3665), HP - s * (PI / 4)); /* 12 mm proud of the angled corner */
        for (const d of [0.9, 1.7]) pane(0.5, 0.8, X_PH0 - 0.75 - d, yw, s * (W_PH + 0.012), s > 0 ? 0 : PI);
        B(0.8, 1.85, 0.05, STEEL, XF(31.5), Y2 + 0.95, s * (W_PH + 0.02));
      }
    }
    /* 20 mm tubs on the wings: two forward (frame 24.0, z 3.2), two aft (frame 35.3): the navigating bridge plan (they were at 21.8 and 34.5) */
    for (const s of [-1, 1]) {
      tub(XF(24.0), Y2 - 0.2, s * 3.2, 1.05, 1.15);
      tub(XF(35.3), Y2, s * 4.35, 0.95, 1.1);
    }
    /* life rafts on the wing sides, and the radio direction-finder cable */
    for (const s of [-1, 1]) {
      add(new THREE.TorusGeometry(1, 0.17, 6, 18), 0x8b8d78, XF(29.5), Y2 - 0.75, s * 5.32, 0, 0, 0, 0.95, 0.42, 1);
      P[P.length - 1].m = new M4().compose(new THREE.Vector3(XF(29.5), Y2 - 0.75, s * 5.32), new THREE.Quaternion(), new THREE.Vector3(0.95, 0.42, 1));
      /* the Carley float's bottom: a wooden grating slung inside the ring (its floor), seen from outboard as the raft hangs */
      add(new THREE.CylinderGeometry(1, 1, 0.05, 20), 0x6e6450, XF(29.5), Y2 - 0.75, s * 5.27);
      P[P.length - 1].m = new M4().compose(
        new THREE.Vector3(XF(29.5), Y2 - 0.75, s * 5.27),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
        new THREE.Vector3(0.86, 1, 0.37),
      );
      for (const dx of [-0.5, 0.5]) B(0.05, 0.3, 0.05, STEEL, XF(29.5) + dx, Y2 - 0.2, s * 5.15) /* the float's slings, from the wing's side down to its ring */;
      for (let i = -3; i <= 3; i++) {
        const xs = i * 0.22,
          h = 2 * 0.37 * Math.sqrt(Math.max(0, 1 - (xs / 0.86) ** 2));
        add(new THREE.BoxGeometry(0.07, h, 0.03), 0x8a7a5a, XF(29.5) + xs, Y2 - 0.75, s * 5.3);
      }
      add(new THREE.BoxGeometry(1.6, 0.06, 0.03), 0x8a7a5a, XF(29.5), Y2 - 0.75, s * 5.3);
    }
    /* 03: the open bridge on the pilothouse roof: bulwark and windscreen, with the A/S hut at its forward end */
    {
      const ob0 = XF(24.1),
        ob1 = XF(33.0),
        w3 = 2.9;
      prism(
        [
          [ob1, -w3],
          [ob0 - 0.9, -w3],
          [ob0, -w3 + 0.9],
          [ob0, w3 - 0.9],
          [ob0 - 0.9, w3],
          [ob1, w3],
        ],
        Y3 - 0.12,
        Y3,
        KEY,
        DECK,
      );
      /* the bulwark, 1.15 m, with a glass windscreen (shown as a thin dark frame) on its forward part */
      const ring = [
        [ob1, -w3],
        [ob0 - 0.9, -w3],
        [ob0, -w3 + 0.9],
        [ob0, w3 - 0.9],
        [ob0 - 0.9, w3],
        [ob1, w3],
      ];
      const lo = ring.map(([x, z]) => [x, Y3, z]),
        hi = ring.map(([x, z]) => [x, Y3 + 2.0, z]);
      plate(lo, hi, KEY, KEY_IN, [XF(28.5), Y3, 0]);
      /* bulwark cap and the wind deflector */
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, z1] = ring[i],
          [x2, z2] = ring[i + 1];
        B(Math.hypot(x2 - x1, z2 - z1), 0.05, 0.16, STEEL, (x1 + x2) / 2, Y3 + 2.02, (z1 + z2) / 2, -Math.atan2(z2 - z1, x2 - x1));
      }
      /* the A/S hut (sonar), enclosed, across the forward end of the open bridge */
      prism(
        [
          [ob0 - 2.25, -1.85],
          [ob0 - 0.35, -1.85],
          [ob0 + 0.02, -1.4],
          [ob0 + 0.02, 1.4],
          [ob0 - 0.35, 1.85],
          [ob0 - 2.25, 1.85],
        ],
        Y3,
        YHUT,
        KEY,
        DECK,
      );
      for (let i = -1; i <= 1; i++) add(new THREE.PlaneGeometry(0.55, 0.36), WIN, ob0 + 0.032, Y3 + 1.42, i * 0.85, 0, HP, 0);
      B(0.05, 1.8, 0.7, STEEL, ob0 - 2.27, Y3 + 0.92, 0.95);
      /* the grating, from the hut back to the after bulwark */
      B(ob0 - 2.3 - ob1, 0.06, 2 * w3 - 0.15, WOOD, (ob0 - 2.3 + ob1) / 2, YG - 0.03, 0);
      for (let k = 0; k < 3; k++) B(ob0 - 2.3 - ob1, YG - Y3 - 0.06, 0.08, STEEL, (ob0 - 2.3 + ob1) / 2, (Y3 + YG) / 2 - 0.03, -2.5 + k * 2.5);
      /* the open bridge's fittings: compass binnacle, gyro repeater, voice tubes, the RDF loop, signal lights, flag bag */
      const xc = XF(30.4);
      C(0.2, 0.26, 1.05, BRASS, xc, YG + 0.52, 0, 0, 0, 0, 14);
      S(0.24, BRASS, xc, YG + 1.12, 0, 1, 0.55, 1);
      for (const s of [-1, 1]) S(0.1, 0x2f4f6d, xc, YG + 1.0, s * 0.36);
      C(0.05, 0.07, 1.0, STEEL, XF(28.6), YG + 0.5, 0, 0, 0, 0, 8);
      C(0.17, 0.17, 0.06, DARK, XF(28.6), YG + 1.04, 0, 0, 0, 0.35, 14);
      C(0.15, 0.15, 0.065, DIAL, XF(28.6), YG + 1.045, 0, 0, 0, 0.35, 14);
      for (const [f, z] of [
        [26.8, -1.3],
        [26.8, -1.0],
        [26.8, 1.0],
        [26.8, 1.3],
      ]) {
        C(0.035, 0.035, 0.85, BRASS, XF(f), YG + 0.45, z, 0, 0, 0, 6);
        C(0.075, 0.045, 0.12, BRASS, XF(f), YG + 0.92, z, 0, 0, 0, 8);
      }
      C(0.04, 0.04, 1.3, STEEL, XF(29.1), YG + 0.65, 1.55, 0, 0, 0, 6);
      add(new THREE.TorusGeometry(0.42, 0.035, 6, 4), STEEL, XF(29.1), YG + 1.6, 1.55, 0, 0, PI / 4);
      B(0.7, 0.85, 0.5, WOOD, XF(31.5), YG + 0.42, -1.9);
      B(0.74, 0.04, 0.54, WOOD, XF(31.5), YG + 0.86, -1.9);
      for (const s of [-1, 1]) {
        C(0.05, 0.05, 0.6, STEEL, ob1 + 0.25, YG + 1.4, s * (w3 - 0.15), 0, 0, 0, 6);
        Cx(0.17, 0.42, STEEL, ob1 + 0.25, YG + 1.82, s * (w3 - 0.15), 14);
        C(0.15, 0.15, 0.03, 0xdedcc0, ob1 + 0.47, YG + 1.82, s * (w3 - 0.15), 0, 0, HP, 14);
      }
      B(1.4, 0.6, 0.6, CANVAS, ob1 - 0.6, YG + 0.3, 0);
      /* the watch on the open bridge: a lookout in each wing with binoculars and a talker on the sound-powered phone (the OOD
         stands his watch in the pilothouse: the user's, 2026-11-21; the open bridge is no longer a station) */
      man(XF(27.6), YG, -2.35, 1.0, 'stand', 'glass');
      man(XF(27.6), YG, 2.35, -1.0, 'stand', 'glass');
      man(XF(32.3), YG, -1.05, 0.25, 'stand', 'down', true);
    }
  }
  emit();

  /* ================= THE MAST: pole with bipod legs to the open bridge, searchlight platform, yard, radar ================= */
  begin();
  {
    const xm = XF(39.8),
      y0 = Y2,
      yb = hd(39.8) /* the mast is stepped on the deck abaft the deckhouse (frame 40 on the plan) */;
    C(0.1, 0.18, y0 + 13.0 - yb, STEEL, xm, (y0 + 13.0 + yb) / 2, 0, 0, 0, 0, 10);
    /* the pointed platform at the navigating bridge level, from the deckhouse's after wall back round the mast */
    {
      const pa = XF(38.0) + 0.05,
        pb = XF(41.6);
      prism(
        [
          [pb, 0],
          [xm + 0.3, -0.75],
          [pa, -1.1],
          [pa, 1.1],
          [xm + 0.3, 0.75],
        ],
        y0 - 0.12,
        y0,
        KEY,
        DECK,
      );
    }
    /* bipod legs to the open bridge's after corners */
    for (const s of [-1, 1]) {
      const ax = XF(33.0) - 0.15,
        ay = Y3 + 0.1,
        az = s * 2.6,
        bx2 = xm,
        by = 13.2,
        L = Math.hypot(bx2 - ax, by - ay, az),
        mid = new THREE.Vector3((ax + bx2) / 2, (ay + by) / 2, az / 2),
        dir = new THREE.Vector3(bx2 - ax, by - ay, -az).normalize(),
        qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const p = C(0.08, 0.1, L, STEEL, 0, 0, 0, 0, 0, 0, 8);
      p.m = new M4().compose(mid, qq, new THREE.Vector3(1, 1, 1));
    }
    /* searchlight platform (13.8 m) with its rail and the 24 in searchlight */
    C(0.95, 0.95, 0.08, STEEL, xm + 0.3, 13.8, 0, 0, 0, 0, 20);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      C(0.018, 0.018, 0.9, STEEL, xm + 0.3 + Math.cos(a) * 0.92, 14.25, Math.sin(a) * 0.92, 0, 0, 0, 4);
    }
    add(new THREE.TorusGeometry(0.92, 0.02, 4, 20), STEEL, xm + 0.3, 14.7, 0, HP, 0, 0);
    C(0.08, 0.1, 0.5, STEEL, xm + 0.6, 14.1, 0, 0, 0, 0, 8);
    Cx(0.34, 0.6, STEEL, xm + 0.65, 14.65, 0, 16);
    C(0.3, 0.3, 0.03, 0xdedcc0, xm + 0.96, 14.65, 0, 0, 0, HP, 16);
    /* the signal yard with halyards, and the small whip antennas */
    Cz(0.05, 4.6, STEEL, xm, 17.1, 0, 6);
    for (const s of [-1, 1]) {
      bone([xm, 17.1, s * 2.25], [XF(33.0) + 0.3, Y3 + 0.05, s * 2.2], 0.02, 0.02, DARK) /* signal halyard, from the yardarm down to the flag bag at the open bridge's after edge */;
      B(0.03, 0.03, 0.03, DARK, xm, 17.1, s * 2.25);
    }
    /* the surface-search radar at the masthead: pedestal and radome */
    C(0.12, 0.12, 0.5, STEEL, xm, 20.1, 0, 0, 0, 0, 8);
    C(0.38, 0.38, 0.55, 0x8a9096, xm, 20.6, 0, 0, 0, 0, 16);
    S(0.38, 0x8a9096, xm, 20.88, 0, 1, 0.5, 1);
    /* the truck: masthead lights */
    S(0.07, WHITE, xm, 19.9, 0);
    /* the gaff for the ensign */
    B(1.0, 0.04, 0.04, STEEL, xm - 0.45, 16.3, 0, 0, 0, -0.15);
  }
  emit();

  /* ================= AMIDSHIPS: the hood, the boat, the 20 mm, the 40 mm directors and the twin 40 mm tubs ================= */
  begin();
  {
    const yd = (f) => hd(f) + 0.12;
    /* the deck gear locker and the ventilation hood (the stack), frames 44.7 to 54.5 */
    B(XF(50) - XF(54.5), 1.9, 1.5, KEY, (XF(50) + XF(54.5)) / 2, yd(52) + 0.95, 0);
    {
      const a = XF(50),
        b = XF(44.9),
        h0 = yd(48),
        side = [];
      const prof = [
        [a, h0],
        [b, h0],
        [b, h0 + 2.6],
        [b - 0.5, h0 + 3.6],
        [a + 1.7, h0 + 4.3],
        [a + 0.6, h0 + 4.25],
        [a, h0 + 3.7],
      ];
      const sh = new THREE.Shape(prof.map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1.45, bevelEnabled: false });
      g.translate(0, 0, -0.725);
      add(g, KEY, 0, 0, 0);
      C(0.2, 0.2, 0.7, DARK, a + 1.2, h0 + 4.55, 0.25, 0, 0, 0, 10);
      C(0.2, 0.2, 0.7, DARK, a + 1.2, h0 + 4.55, -0.25, 0, 0, 0, 10);
      for (const s of [-1, 1]) B(1.4, 0.6, 0.03, DARK, (a + b) / 2, h0 + 2.2, s * 0.74);
    }
    /* ventilator cowls */
    for (const [f, z] of [
      [44, -1.4],
      [44, 1.4],
      [56.5, 0],
    ]) {
      C(0.22, 0.22, 1.2, KEY, XF(f), yd(f) + 0.6, z, 0, 0, 0, 12);
      S(0.3, KEY, XF(f) + 0.12, yd(f) + 1.35, z, 1, 0.9, 1);
      C(0.24, 0.24, 0.05, DARK, XF(f) + 0.36, yd(f) + 1.38, z, 0, 0, HP, 12);
    }
    /* the 26 ft motor whaleboat on the port side, frames 44.5 to 57.4, on chocks, with its boom from the mast */
    {
      const L = 7.92,
        Bm = 2.15,
        x0 = (XF(44.5) + XF(57.4)) / 2 /* plate 5: bow at frame 44.5, stern at 57.4 (it was 46 to 57) */,
        z0 = -3.1,
        y0 = yd(51) + 0.75;
      const rowsO = [],
        rowsI = [];
      for (let i = 0; i <= 14; i++) {
        const u = i / 14,
          x = x0 + (u - 0.5) * L,
          w = (Bm / 2) * Math.pow(Math.sin(PI * Math.min(0.999, 0.04 + 0.96 * u)), 0.55) * (u < 0.5 ? 1 : 0.92 + 0.08 * (1 - u) * 2),
          d = 0.85 * Math.pow(Math.sin(PI * (0.08 + 0.84 * u)), 0.4);
        const sec = [];
        for (let j = 0; j <= 8; j++) {
          const a = -HP + (j / 8) * PI;
          sec.push([x, y0 - Math.cos(a) * d * 0.95 + 0.0, z0 + Math.sin(a) * w]);
        }
        rowsO.push(sec);
        rowsI.push(sec.map(([px, py, pz]) => [px, py + 0.05, z0 + (pz - z0) * 0.93]));
      }
      add(flip(loft(rowsO)), 0x5d6870, 0, 0, 0);
      add(loft(rowsI), 0x75685a, 0, 0, 0);
      for (let i = 1; i < 5; i++) B(0.22, 0.04, Bm * 0.85, WOOD, x0 - L / 2 + i * 1.55, y0 - 0.25, z0);
      B(1.5, 0.75, 1.2, 0x5d6870, x0 + 0.6, y0 - 0.1, z0);
      for (const d of [-2.4, 2.4]) B(0.3, 0.75, 1.6, WOOD, x0 + d, y0 - 1.05, z0);
      const p = C(0.08, 0.1, 9.6, STEEL, 0, 0, 0, 0, 0, 0, 8),
        a = new THREE.Vector3(XF(40.3), Y2 + 0.4, -0.3),
        b = new THREE.Vector3(x0 + 2.0, y0 + 2.2, z0 + 0.3),
        dir = b.clone().sub(a);
      p.m = new M4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()), new THREE.Vector3(1, a.distanceTo(b) / 9.6, 1));
      C(0.012, 0.012, 2.6, DARK, x0 + 2.0, y0 + 0.9, z0 + 0.3, 0, 0, 0, 3);
    }
    /* the boat winch (port) */
    {
      const x = XF(46.2),
        y = yd(46);
      B(0.9, 0.55, 0.7, STEEL, x, y + 0.27, -1.6);
      Cz(0.22, 0.5, DARK, x, y + 0.62, -1.6, 12);
    }
    /* life nets and floater nets on the sides */
    for (const s of [-1, 1]) B(3.6, 0.35, 0.3, CANVAS, (XF(40.6) + XF(46.5)) / 2, yd(43.5) + 0.5, s * 4.8) /* plate 5: frames 40.6 to 46.5 (they were 43 to 48) */;
    /* the starboard 20 mm tub (frame 44.7) */
    tub(XF(44.7), yd(44.7), 3.3, 1.35, 1.05);
    /* the 40 mm Mk 51 directors, port and starboard (frame 56.5: plate 4 puts them at 56.8, plate 5 at 56.2; they were at 55.7) */
    for (const s of [-1, 1]) {
      tub(XF(56.5), yd(56.5), s * 1.25, 0.95, 1.0);
      C(0.1, 0.13, 1.05, STEEL, XF(56.5), yd(56.5) + 0.52, s * 1.25, 0, 0, 0, 8);
      B(0.45, 0.35, 0.32, GUNC, XF(56.5), yd(56.5) + 1.2, s * 1.25);
      for (const d of [-1, 1]) B(0.08, 0.05, 0.42, STEEL, XF(56.5) - 0.24, yd(56.5) + 1.12, s * 1.25 + d * 0.2);
      /* the director's operator, behind the sight, looking outboard; he is a talker to his mount */
      man(XF(56.5), yd(56.5) + 0.04, s * 1.25 - s * 0.62, -s * HP, 'stand', 'glass', true);
    }
    /* RS boxes and the 40 mm barrel stowage */
    for (const s of [-1, 1]) B(1.2, 0.65, 0.55, KEY, XF(58.5), yd(58) + 0.33, s * 4.1);
    B(3.0, 0.4, 0.8, KEY, (XF(52) + XF(57)) / 2, yd(55) + 0.2, 2.8);
  }
  emit();

  /* a twin 40 mm Bofors Mk 1 mount, trained toward +x, built at its own origin (the base on the platform): the fixed stand, the
     training carriage (with the crew), the elevating guns (level, about the trunnions at 0.05, 1.1, 0) and the pointer.
     own = the player's mount: its pointer's ring sight is a separate part on a linkage (so it is left off the carriage) */
  const T40_PIV = [0.05, 1.1, 0];
  const twin40parts = (own, one) => {
    const pz = one ? 0.36 : 0.62 /* the carriage side plates: a single mount's carriage is narrower */,
      bz = one ? [0] : [-0.29, 0.29] /* the barrels */;
    const base = grab(() => C(1.0, 1.05, 0.28, GUNC, 0, 0.14, 0, 0, 0, 0, 20));
    const train = grab(() => {
      B(1.3, 0.7, 1.4, GUNC, -0.1, 0.62, 0);
      for (const s of [-1, 1]) {
        B(1.2, 0.95, 0.1, GUNC, 0, 1.0, s * pz);
        /* the pointer's (left) and trainer's (right) seats with their hand cranks and ring sights */
        B(0.36, 0.06, 0.34, STEEL, -0.55, 0.95, s * 1.05);
        C(0.03, 0.03, 0.6, STEEL, -0.55, 0.65, s * 1.05, 0, 0, 0, 5);
        add(new THREE.TorusGeometry(0.13, 0.015, 4, 12), BRASS, -0.15, 1.15, s * 0.98, 0, 0, 0);
        B(0.3, 0.04, 0.5, STEEL, -0.75, 0.45, s * 1.05);
        if (own && s < 0) continue;
        add(new THREE.TorusGeometry(0.12, 0.012, 4, 16), DARK, 0.05, 1.62, s * 1.0, 0, HP, 0);
        C(0.012, 0.012, 0.44, DARK, 0.05, 1.39, s * 1.0, 0, 0, 0, 3) /* the sight's post */;
        bone([0.05, 1.4, s * pz], [0.05, 1.3, s * 1.0], 0.03, 0.03, DARK) /* its arm from the carriage side plate */;
      }
      /* the crew: the trainer (right) on his seat, two loaders standing behind the breeches with clips */
      man(-0.78, 0.36, 1.05, 0, 'sit', 'wheel', true);
      if (one) man(-1.05, 0.28, 0, 0, 'stand', 'clip');
      else {
        man(-1.05, 0.28, -0.32, 0, 'stand', 'clip');
        man(-1.05, 0.28, 0.32, 0, 'stand', 'clip');
      }
    });
    const elev = grab(() => {
      for (const z of bz) {
        Cx(0.05, 2.15, BARREL, 1.35, 0.0, z, 10);
        add(cyl(0.085, 0.055, 0.35, 10), DARK, 2.55, 0.0, z, 0, 0, -HP);
        Cx(0.095, 1.05, 0x5b6268, 0.55, 0.0, z, 12);
        B(0.85, 0.32, 0.22, GUNC, -0.25, 0.02, z);
        /* the loading guide and a clip of four rounds on top */
        B(0.32, 0.42, 0.16, STEEL, -0.2, 0.38, z);
        for (let k = 0; k < 4; k++) C(0.022, 0.022, 0.38, BRASS, -0.33 + k * 0.08, 0.66, z, 0, 0, 0, 5);
      }
      B(0.5, 0.22, one ? 0.26 : 0.4, GUNC, -0.15, -0.12, 0);
    });
    /* the pointer (left seat) */
    const pm = grab(() => man(-0.78, 0.36, -1.05, 0, 'sit', 'wheel'));
    return { base, train, elev, pm };
  };
  /* the single 40 mm (Army M1 / Navy Mk 3 type, from the References 3-D drawings): a square pedestal with round lightening holes, the
     carriage on a toothed training ring, the pointer's and trainer's seats on outrigger arms with foot rests, the loader's platform
     with its railing behind, the clip guide on the breech, the recoil cylinder under the barrel, the flared flash hider, and the
     cross-bar ring sights out at the two layers' eyes. Built along +x about the trunnions at T40_PIV */
  const single40parts = () => {
    const base = grab(() => {
      B(1.6, 0.03, 1.6, STEEL, 0, 0.015, 0);
      C(0.52, 0.78, 0.34, GUNC, 0, 0.2, 0, 0, PI / 4, 0, 4);
      for (const [x, z, ry] of [
        [0.33, 0, 0],
        [-0.33, 0, 0],
        [0, 0.33, HP],
        [0, -0.33, HP],
      ])
        C(0.11, 0.11, 0.02, DARK, x * 1.02, 0.2, z * 1.02, HP, ry, 0, 14) /* the lightening holes */;
    });
    const train = grab(() => {
      /* the loader's platform and its railing */
      B(1.15, 0.04, 1.35, STEEL, -0.55, 0.39, 0);
      for (const z of [-0.66, 0.66]) for (const x of [-1.1, -0.6, -0.1]) C(0.02, 0.02, 0.75, STEEL, x, 0.78, z, 0, 0, 0, 6);
      for (const x of [-1.1]) for (const z of [-0.3, 0.3]) C(0.02, 0.02, 0.75, STEEL, x, 0.78, z, 0, 0, 0, 6);
      for (const y of [0.62, 0.9, 1.15]) {
        for (const z of [-0.66, 0.66]) B(1.0, 0.03, 0.03, STEEL, -0.6, y, z);
        B(0.03, 0.03, 1.32, STEEL, -1.1, y, 0);
      }
      /* the training ring with its teeth, the carriage and its cheeks */
      C(0.42, 0.42, 0.1, GUNC, 0, 0.47, 0, 0, 0, 0, 24);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * 2 * PI;
        B(0.05, 0.08, 0.04, STEEL, Math.cos(a) * 0.43, 0.47, Math.sin(a) * 0.43, -a);
      }
      C(0.3, 0.34, 0.42, GUNC, 0, 0.72, 0, 0, 0, 0, 16);
      for (const z of [-0.24, 0.24]) B(0.62, 0.5, 0.06, GUNC, 0.02, 1.0, z);
      /* the seats on their outriggers, foot rests forward, the elevating and training hand cranks */
      for (const k of [-1, 1]) {
        bone([0, 0.55, k * 0.3], [-0.55, 0.9, k * 1.02], 0.05, 0.05, STEEL);
        C(0.17, 0.17, 0.035, STEEL, -0.55, 0.95, k * 1.05, 0, 0, 0, 14);
        for (let j = 0; j < 6; j++) C(0.018, 0.018, 0.04, DARK, -0.55 + 0.09 * Math.cos(j), 0.96, k * 1.05 + 0.09 * Math.sin(j), 0, 0, 0, 5);
        bone([0.05, 0.5, k * 0.3], [0.45, 0.42, k * 0.95], 0.04, 0.04, STEEL);
        B(0.36, 0.03, 0.15, GUNC, 0.55, 0.45, k * 0.98, k * 0.35, 0, -0.35);
        add(new THREE.TorusGeometry(0.11, 0.015, 4, 12), STEEL, -0.12, 1.02, k * 0.72, 0, 0, 0);
        C(0.015, 0.015, 0.12, DARK, -0.12, 1.02, k * 0.79, HP, 0, 0, 5);
        bone([-0.12, 1.02, k * 0.27], [-0.12, 1.02, k * 0.72], 0.02, 0.02, STEEL) /* the hand wheel's shaft, from the side plate */;
      }
      /* the crew: the trainer (right), the loader on his platform with a clip */
      man(-0.78, 0.36, 1.05, 0, 'sit', 'wheel', true);
      man(-1.0, 0.41, 0, 0, 'stand', 'clip');
    });
    const elev = grab(() => {
      B(0.95, 0.4, 0.34, GUNC, -0.12, 0.02, 0) /* the breech casing */;
      B(0.3, 0.12, 0.38, GUNC, -0.45, 0.1, 0) /* the loader's tray */;
      /* the clip guide on top with a clip of four rounds */
      for (const z of [-0.09, 0.09]) B(0.36, 0.42, 0.04, STEEL, -0.28, 0.42, z);
      for (let k = 0; k < 4; k++) C(0.022, 0.022, 0.4, BRASS, -0.4 + k * 0.08, 0.48, 0, 0, 0, 0, 6);
      B(0.34, 0.03, 0.18, STEEL, -0.28, 0.29, 0) /* the clip's charger, between the guide plates, the rounds standing in it */;
      Cz(0.07, 0.6, STEEL, 0, 0, 0, 10) /* the trunnions */;
      Cx(0.075, 1.0, 0x5b6268, 0.6, -0.13, 0, 12) /* the recoil cylinder */;
      Cx(0.085, 0.4, GUNC, 0.5, 0.06, 0, 12);
      Cx(0.05, 2.15, BARREL, 1.55, 0.06, 0, 10);
      C(0.06, 0.06, 0.06, STEEL, 1.95, 0.06, 0, 0, 0, -HP, 10);
      add(cyl(0.1, 0.05, 0.38, 12), DARK, 2.8, 0.06, 0, 0, 0, -HP) /* the flash hider */;
      /* the cross-bar sights: a bar over the breech out to each layer, an eye ring aft and the cartwheel forward */
      Cz(0.02, 1.5, STEEL, 0.05, 0.36, 0, 6);
      for (const k of [-1, 1]) {
        Cx(0.018, 0.75, STEEL, 0.1, 0.36, k * 0.75, 6);
        add(new THREE.TorusGeometry(0.06, 0.012, 4, 14), DARK, -0.25, 0.42, k * 0.75, 0, HP, 0);
        add(new THREE.TorusGeometry(0.11, 0.012, 4, 18), DARK, 0.46, 0.42, k * 0.75, 0, HP, 0);
        for (let j = 0; j < 4; j++) B(0.008, 0.22, 0.008, DARK, 0.46, 0.42, k * 0.75, HP, (j * PI) / 4, 0);
      }
    });
    const pm = grab(() => man(-0.78, 0.36, -1.05, 0, 'sit', 'wheel'));
    return { base, train, elev, pm };
  };
  const single40 = (elev) => {
    const g = single40parts(),
      T = new M4().compose(new THREE.Vector3(...T40_PIV), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, elev)), new THREE.Vector3(1, 1, 1));
    for (const e of g.elev) e.m = new M4().multiplyMatrices(T, e.m);
    return [...g.base, ...g.train, ...g.pm, ...g.elev];
  };
  const twin40 = (elev, one) => {
    const g = twin40parts(false, one),
      T = new M4().compose(new THREE.Vector3(...T40_PIV), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, elev)), new THREE.Vector3(1, 1, 1));
    for (const e of g.elev) e.m = new M4().multiplyMatrices(T, e.m);
    return [...g.base, ...g.train, ...g.pm, ...g.elev];
  };
  /* a ring-and-bead sight (the "cartwheel"): seen from the eye at the origin looking along +x, a small eye ring of radius er at de (none if 0), and the front
     sight at d with its bead and rings whose radii are the lead angles for crossing targets at 100, 200 and 300 knots (lead =
     target speed x time of flight / range = target speed / the shell's mean velocity over the gun's useful range; the game's GUNS
     table works them out from the same ballistics, see gunLead) */
  const ringSight = (d, de, leads, post, er) => {
    const t = 0.0032;
    for (const a of leads) add(new THREE.TorusGeometry(d * Math.tan(a), t, 4, 40), DARK, d, 0, 0, 0, HP, 0);
    const R = d * Math.tan(leads[leads.length - 1]);
    for (let i = 0; i < 8; i++) B(0.004, R, 0.004, DARK, d, (R / 2) * Math.cos((i * PI) / 4), (R / 2) * Math.sin((i * PI) / 4), 0, (i * PI) / 4, 0);
    S(0.006, DARK, d, 0, 0);
    if (er) add(new THREE.TorusGeometry(er, 0.0016, 4, 20), DARK, de, 0, 0, 0, HP, 0), C(0.004, 0.004, R + post - er + 0.004, DARK, de, -(R + post + er) / 2, 0, 0, 0, 0, 5) /* the eye ring's post, down to the sight bar */;
    /* the post that carries the front sight, and the sight bar under both */
    C(0.007, 0.007, post, DARK, d, -R - post / 2, 0, 0, 0, 0, 5);
    Cx(0.012, d - de + 0.06, DARK, (d + de) / 2, -R - post, 0, 6);
  };
  /* the two twin 40 mm amidships (frame 62.1 on plates 4 and 5; it was 61.6, in tubs at the after end of the forecastle deck) */
  for (const s of [-1, 1]) {
    begin();
    tub(XF(62.1), hd(62.1) + 0.12, s * 2.85, 2.3, 1.08);
    emit();
    begin();
    P.push(...twin40(0.22));
    emit(GX.xf(XF(62.1), hd(62.1) + 0.16, s * 2.85, PI + s * 0.6)) /* at rest trained aft and a little outboard, like the after mount */;
    GUNPOS.push(['40', XF(62.1), hd(62.1) + 0.16 + 1.1, s * 2.85]);
  }

  /* ================= THE MAIN DECK AFT: K-guns, the aft twin 40 mm on its platform, its director, the depth-charge racks ================= */
  const Y_PLAT = 2.75 + 0.56;
  begin();
  {
    const ym = (f) => hm(f) + 0.12;
    /* the after twin 40 mm platform, 22 in above the deck (frame 76.3 on plates 4 and 6; it was 74.8), with its splinter shield */
    {
      const x = XF(76.3);
      C(2.55, 2.55, Y_PLAT - ym(76.3), KEY, x, (Y_PLAT + ym(76.3)) / 2, 0, 0, 0, 0, 30);
      C(2.52, 2.52, 0.04, DECK, x, Y_PLAT + 0.02, 0, 0, 0, 0, 30);
      tub(x, Y_PLAT, 0, 2.55, 1.05, DECK);
      for (let i = 0; i < 3; i++) B(0.2, 0.03, 0.7, STEEL, x + 2.75 + i * 0.22, ym(71) + 0.18 + i * 0.18, 0);
    }
    /* its Mk 51 director on a pedestal platform to port (frame 69.5 on plates 4 and 6; it was 66.4) */
    {
      const x = XF(69.5),
        z = -1.45,
        yp = ym(69.5) + 1.15;
      for (const d of [
        [-0.6, -0.6],
        [0.6, -0.6],
        [-0.6, 0.6],
        [0.6, 0.6],
      ])
        C(0.04, 0.04, 1.15, STEEL, x + d[0], ym(69.5) + 0.57, z + d[1], 0, 0, 0, 6);
      B(1.5, 0.06, 1.5, DECK, x, yp, z);
      rails(
        [
          [x - 0.75, yp, z - 0.75],
          [x + 0.75, yp, z - 0.75],
          [x + 0.75, yp, z + 0.75],
          [x - 0.75, yp, z + 0.75],
          [x - 0.75, yp, z - 0.75],
        ],
        0.95,
      );
      C(0.09, 0.12, 0.95, STEEL, x, yp + 0.48, z, 0, 0, 0, 8);
      B(0.45, 0.35, 0.32, GUNC, x, yp + 1.1, z);
      man(x + 0.6, yp + 0.03, z, PI, 'stand', 'glass', true);
    }
    /* depth-charge projectors (K-guns Mk 6), two each side (frames 64.6 and 73.7). Each: a deck foundation, the expansion chamber and
       breech (the firing lock and lanyard), the barrel laid 45 deg OUTBOARD over the rail; the arbor and its Mk 6 charge in the
       muzzle are drawn by the game (they leave when she fires and come back when the crew reloads; KG gives their pose). Inboard
       of each gun, the roller loader: an inclined frame of two rails with three ready charges rolling down toward the gun, and a
       small loading davit forward of it. A Mk 6 charge: 17.6 in (0.447 m) across, 27.6 in (0.70 m) long */
    for (const s of [-1, 1])
      for (const f of [64.6, 73.7]) {
        const x = XF(f),
          z = s * (hb(f, hm(f)) - 0.75),
          y = ym(f),
          r45 = s * (PI / 4),
          c45 = Math.SQRT1_2,
          py = y + 0.32 /* the barrel's root */;
        B(0.75, 0.1, 0.75, STEEL, x, y + 0.05, z);
        C(0.3, 0.34, 0.16, GUNC, x, y + 0.18, z, 0, 0, 0, 14) /* the foundation ring */;
        C(0.2, 0.2, 0.36, GUNC, x, py + 0.06, z + s * 0.02, r45, 0, 0, 14) /* the expansion chamber */;
        Cx(0.07, 0.2, 0x2c2e2c, x, py - 0.02, z - s * 0.13, 8) /* the breech and firing lock */;
        B(0.06, 0.06, 0.3, 0x2c2e2c, x, py - 0.02, z - s * 0.32);
        C(0.135, 0.135, 0.85, GUNC, x, py + c45 * 0.55, z + s * c45 * 0.55, r45, 0, 0, 14) /* the barrel */;
        C(0.155, 0.155, 0.05, STEEL, x, py + c45 * 0.96, z + s * c45 * 0.96, r45, 0, 0, 14) /* the muzzle band */;
        for (const k of [-1, 1]) B(0.04, 0.5, 0.1, GUNC, x + k * 0.2, py + 0.08, z + s * 0.12, 0, r45, 0) /* side brackets */;
        /* the roller loader: alongside the deck edge just forward of the gun (not inboard, where the 40 mm tubs overhang the deck), two
           rails sloping down aft toward the gun, three ready charges on them, the end stop by the gun */
        const dx = f < 70 ? -1 : 1 /* both loaders lie in the clear stretch of deck edge between the two guns */,
          xi = x + dx * 0.62,
          xo = x + dx * 2.3,
          zl = z - s * 0.12,
          yl = y + 0.5,
          yh = y + 0.68,
          Ll = Math.hypot(xo - xi, yh - yl),
          ang = Math.atan2(yh - yl, xo - xi) + (dx < 0 ? Math.PI : 0);
        for (const k of [-0.22, 0.22]) {
          B(Ll, 0.05, 0.05, STEEL, (xi + xo) / 2, (yl + yh) / 2, zl + k, 0, 0, ang);
          C(0.025, 0.025, yl - y, STEEL, xi, (yl + y) / 2, zl + k, 0, 0, 0, 5);
          C(0.025, 0.025, yh - y, STEEL, xo, (yh + y) / 2, zl + k, 0, 0, 0, 5);
        }
        B(0.04, 0.18, 0.55, STEEL, xi - dx * 0.02, yl + 0.1, zl) /* the stop */;
        for (let k = 0; k < 3; k++) {
          const t = (k + 0.5) / 3.1,
            cx = xi + (xo - xi) * t,
            cy = yl + (yh - yl) * t + 0.24;
          Cz(0.224, 0.7, 0x3f4a3a, cx, cy, zl, 14) /* lying athwartships, to roll fore and aft */;
          for (const e of [-0.33, 0.33]) Cz(0.228, 0.03, 0x2e352b, cx, cy, zl + e, 14);
        }
        /* the loading davit: a post, a jib out over the gun, the fall and hook */
        const xd = x - dx * 0.3;
        C(0.04, 0.05, 1.9, STEEL, xd, y + 0.95, z - s * 0.55, 0, 0, 0, 8);
        B(0.05, 0.05, 0.62, STEEL, xd, y + 1.86, z - s * 0.27);
        C(0.008, 0.008, 0.55, 0x30302a, xd, y + 1.58, z + s * 0.02, 0, 0, 0, 4);
        B(0.04, 0.08, 0.04, 0x30302a, xd, y + 1.28, z + s * 0.02);
      }
    /* the stern depth-charge racks (Mk 3), port and starboard, sloping to the transom, each loaded with eight Mk 6 charges */
    for (const s of [-1, 1]) {
      const fa = 80.2,
        fb = 89.6,
        za = s * 1.95,
        xa = XF(fa),
        xb = XF(fb),
        ya = ym(fa) + 0.75,
        yb = ym(fb) + 0.45,
        L = Math.hypot(xa - xb, ya - yb),
        ang = Math.atan2(ya - yb, xa - xb);
      for (const d of [-0.42, 0.42]) {
        B(L, 0.08, 0.08, STEEL, (xa + xb) / 2, (ya + yb) / 2, za + d, 0, 0, ang);
        for (let k = 0; k <= 4; k++) {
          const u = k / 4,
            x = xa + (xb - xa) * u,
            y = ya + (yb - ya) * u;
          C(0.035, 0.035, y - ym(fa + (fb - fa) * u), STEEL, x, (y + ym(fa + (fb - fa) * u)) / 2, za + d, 0, 0, 0, 5);
        }
      }
      for (let k = 0; k < 8; k++) {
        const u = (k + 0.5) / 8.4,
          x = xa + (xb - xa) * u,
          y = ya + (yb - ya) * u + 0.3;
        Cz(0.26, 0.7, 0x3f4a3a, x, y, za, 14);
        Cz(0.18, 0.72, 0x34402f, x, y, za, 10);
      }
      /* the release gear at the stern end */
      B(0.25, 0.45, 1.0, STEEL, xb + 0.2, yb + 0.25, za);
    }
    /* the depth-charge control board on its stand between the racks, facing forward to the torpedoman: depth setting and charges left */
    {
      const x = XF(84.6),
        y = ym(84.6);
      C(0.04, 0.05, 1.25, STEEL, x - 0.05, y + 0.62, 0, 0, 0, 0, 6);
      B(0.08, 0.6, 0.8, DARK, x, y + 1.35, 0);
      face('dcBoard', [x + 0.05, y + 1.35, 0], 0.74, 0.54, [1, 0, 0]);
    }
    /* the stern: ensign staff, stern light, a davit and the hand winch, lockers */
    C(0.035, 0.045, 3.4, WOOD, XF(89.7), ym(89.7) + 1.7, 0, 0, 0, 0, 6);
    for (const [f, z] of [
      [84, -3.4],
      [84, 3.4],
      [69.5, 2.9],
    ])
      B(0.9, 0.95, 0.6, KEY, XF(f), ym(f) + 0.47, z);
    {
      const x = XF(87),
        z = -3.0;
      C(0.08, 0.09, 2.6, STEEL, x, ym(87) + 1.3, z, 0, 0, 0, 8);
      B(1.5, 0.08, 0.08, STEEL, x + 0.7, ym(87) + 2.42, z, 0, 0, -0.2) /* the arm, from the post's head */;
    }
    /* deck hatches and a couple of ventilators aft */
    for (const f of [68.2, 79.2]) B(1.1, 0.25, 1.1, STEEL, XF(f), ym(f) + 0.12, 0);
  }
  emit();
  {
    /* the after twin 40 mm: the player's (station 4) */
    const g = twin40parts(true);
    mount({
      id: '40',
      T: GX.xf(XF(76.3), Y_PLAT + 0.02, 0, PI),
      ry0: PI,
      ...g,
      pivot: T40_PIV,
      eye: [-0.6, 1.79, -1.0] /* the pointer's eye */,
      sight: grab(() => {
        ringSight(0.5, 0.12, LEAD40, 0.12, 0);
        /* the linkage: a rod from the sight bar down to the mount's platform, which keeps it on the line of the bores */
        const yb = -0.5 * Math.tan(LEAD40[LEAD40.length - 1]) - 0.12;
        C(0.015, 0.015, 1.79 + yb + 0.02, DARK, 0.3, (yb - 1.79) / 2, 0, 0, 0, 0, 5);
      }) /* built about the eye */,
      muzzles: [
        [2.74, 0, -0.29],
        [2.74, 0, 0.29],
      ],
    });
  }

  /* the 20 mm Oerlikons on Mk 4 mounts in their tubs: the pedestal, the training head, the cradle with the gun, its 60-round drum,
     the shield, the shoulder rests and the cartwheel ring sight (elevating about 0, 1.3, 0); the gunner stands strapped into the
     shoulder rests and rides the gun, his loader stands by with a spare drum */
  const O20_PIV = [0, 1.2, 0];
  const oer20parts = (legs) => {
    const base = grab(() => {
      if (legs) {
        /* the Mk 10 pedestal: four splayed legs on foot pads to a cap plate, the column from it */
        for (const [a, b] of [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ]) {
          bone([a * 0.42, 0.02, b * 0.42], [a * 0.1, 0.8, b * 0.1], 0.07, 0.035, GUNC);
          B(0.16, 0.03, 0.16, STEEL, a * 0.43, 0.015, b * 0.43);
        }
        for (const s of [-1, 1]) bone([-0.29, 0.32, -s * 0.29], [0.29, 0.32, s * 0.29], 0.04, 0.04, GUNC) /* the cross braces, leg to leg */;
        C(0.2, 0.2, 0.06, GUNC, 0, 0.8, 0, 0, 0, 0, 14);
        C(0.11, 0.13, 0.1, GUNC, 0, 0.86, 0, 0, 0, 0, 12);
        return;
      }
      C(0.2, 0.28, 0.9, GUNC, 0, 0.45, 0, 0, 0, 0, 12);
      C(0.34, 0.34, 0.05, GUNC, 0, 0.03, 0, 0, 0, 0, 14);
    });
    const train = grab(() => {
      C(0.13, 0.15, 0.4, GUNC, 0, 1.05, 0, 0, 0, 0, 10) /* the height-adjusting column */;
      B(0.3, 0.2, 0.32, GUNC, 0, 1.22, 0);
      man(-0.7, 0, 0.75, 0.5, 'stand', 'round', true);
    });
    const elev = grab(() => {
      Cx(0.035, 1.9, BARREL, 0.95, 0, 0, 8);
      Cx(0.05, 0.25, DARK, 1.75, 0, 0, 8) /* the flash hider */;
      Cx(0.06, 0.55, GUNC, 0.15, 0, 0, 10) /* the recoil spring casing */;
      B(0.75, 0.13, 0.12, GUNC, -0.1, 0, 0) /* the receiver */;
      /* the drum on top of the receiver */
      Cz(0.17, 0.12, 0x353a3f, 0.05, 0.19, 0, 18);
      Cz(0.07, 0.125, DARK, 0.05, 0.19, 0, 10);
      /* the cradle, its trunnions, the shoulder rests and the hand grips with the trigger */
      B(0.55, 0.06, 0.3, GUNC, -0.05, -0.1, 0);
      Cz(0.04, 0.38, STEEL, 0, 0, 0, 8);
      for (const s of [-1, 1]) {
        bone([-0.25, -0.05, s * 0.16], [-0.52, 0.2, s * 0.2], 0.035, 0.035, STEEL);
        add(new THREE.TorusGeometry(0.09, 0.03, 5, 10, PI), RUBBER, -0.55, 0.2, s * 0.2, 0, HP, -HP) /* the curved shoulder rest */;
        C(0.018, 0.018, 0.16, DARK, -0.3, -0.17, s * 0.13, 0, 0, 0.3, 5) /* hand grips, under the cradle */;
      }
      /* the shield: two plates forward of the gunner, low enough for him to see over them through the sight */
      B(0.04, 0.62, 0.42, GUNC, 0.45, -0.1, -0.24);
      B(0.04, 0.62, 0.42, GUNC, 0.45, -0.1, 0.24);
      /* the ring sight on its bracket above the drum: the eye ring 0.3 m ahead of the eye, the cartwheel 0.78 m ahead (eye at -0.4, 0.45, -0.1: left of the drum) */
      const Q = grab(() => ringSight(0.78, 0.3, LEAD20, 0.06, 0.011)),
        T = GX.xf(-0.4, 0.45, -0.1, 0);
      for (const q of Q) q.m = new M4().multiplyMatrices(T, q.m);
      P.push(...Q);
      {
        /* its bracket: from the drum's top up (or down) to the sight bar, beside the drum */
        const yb = 0.45 - 0.78 * Math.tan(LEAD20[LEAD20.length - 1]) - 0.06;
        B(0.05, Math.abs(yb - 0.3) + 0.03, 0.07, GUNC, 0.05, (yb + 0.3) / 2, -0.085);
      }
    });
    const pm = grab(() => man(-0.62, 0, 0, 0, 'lean', 'rests'));
    return { base, train, elev, pm };
  };
  const oer20 = (legs) => {
    const g = oer20parts(legs),
      T = new M4().compose(new THREE.Vector3(...O20_PIV), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.3)), new THREE.Vector3(1, 1, 1));
    for (const e of g.elev) e.m = new M4().multiplyMatrices(T, e.m);
    return [...g.base, ...g.train, ...g.pm, ...g.elev];
  };
  for (const [x, y, z, ry] of [
    [XF(24.0), Y2 - 0.2, 3.2, -0.5],
    [XF(24.0), Y2 - 0.2, -3.2, 0.5],
    [XF(35.3), Y2, 4.35, -1.2],
    [XF(35.3), Y2, -4.35, 1.2],
  ]) {
    begin();
    P.push(...oer20());
    emit(GX.xf(x, y, z, ry));
    GUNPOS.push(['20', x, y + 1.2, z]);
  }
  {
    /* the starboard 20 mm amidships, abaft the bridge: the player's (station 4) */
    const g = oer20parts();
    mount({
      id: '20',
      T: GX.xf(XF(44.7), hd(44.7) + 0.12, 3.3, -1.4),
      ry0: -1.4,
      ...g,
      pivot: O20_PIV,
      eye: [-0.4, 0.45, -0.1] /* in the elevating frame: he rides the gun */,
      eyeEl: true,
      muzzles: [[1.9, 0, 0]],
    });
  }

  /* ================= THE STATIONS' INTERIORS (faces turned inward) ================= */
  /* a room: floor, ceiling and four walls facing inward; holes = windows cut in a wall ['x0'|'x1'|'z0'|'z1', u0, u1, v0, v1] */
  const room = (x0, x1, y0, y1, z0, z1, cw, cf, cc, holes) => {
    holes = holes || [];
    const plane = (w, h, hex, x, y, z, rx, ry) => {
      if (w > 0.005 && h > 0.005) add(new THREE.PlaneGeometry(w, h), hex, x, y, z, rx, ry, 0);
    };
    plane(x1 - x0, z1 - z0, cf, (x0 + x1) / 2, y0, (z0 + z1) / 2, -HP, 0);
    plane(x1 - x0, z1 - z0, cc, (x0 + x1) / 2, y1, (z0 + z1) / 2, HP, 0);
    /* a wall with rectangular holes: split into vertical strips */
    const wall = (key, len, put) => {
      const hs = holes.filter((h) => h[0] === key).sort((a, b) => a[1] - b[1]);
      let u = 0;
      for (const h of hs) {
        put(u, h[1], 0, y1 - y0);
        put(h[1], h[2], 0, h[3] - y0);
        put(h[1], h[2], h[4] - y0, y1 - y0);
        u = h[2];
      }
      put(u, len, 0, y1 - y0);
    };
    /* x1 wall (forward) faces -x: u runs along z from z0 */
    wall('x1', z1 - z0, (a, b, c, d) => plane(b - a, d - c, cw, x1, y0 + (c + d) / 2, z0 + (a + b) / 2, 0, -HP));
    wall('x0', z1 - z0, (a, b, c, d) => plane(b - a, d - c, cw, x0, y0 + (c + d) / 2, z0 + (a + b) / 2, 0, HP));
    wall('z0', x1 - x0, (a, b, c, d) => plane(b - a, d - c, cw, x0 + (a + b) / 2, y0 + (c + d) / 2, z0, 0, 0));
    wall('z1', x1 - x0, (a, b, c, d) => plane(b - a, d - c, cw, x0 + (a + b) / 2, y0 + (c + d) / 2, z1, 0, PI));
    /* the runs under the deckhead along both side bulkheads: a cable bundle on its hangers and a painted pipe, a junction box here
       and there (what makes a compartment read as the inside of a ship) */
    const L = x1 - x0;
    if (L > 0.8)
      for (const sd of [-1, 1]) {
        const zw = sd < 0 ? z0 : z1;
        for (let i = 0; i < 3; i++) Cx(0.017, L - 0.04, 0x262626, (x0 + x1) / 2, y1 - 0.075 - (i % 2) * 0.03, zw - sd * (0.05 + i * 0.032), 6);
        Cx(0.032, L - 0.04, 0xb4b4aa, (x0 + x1) / 2, y1 - 0.2, zw - sd * 0.09, 8);
        for (let x = x0 + 0.25; x < x1 - 0.1; x += 0.6096) {
          B(0.025, 0.24, 0.02, STEEL, x, y1 - 0.12, zw - sd * 0.06);
          B(0.025, 0.02, 0.17, STEEL, x, y1 - 0.105, zw - sd * 0.09);
        }
        for (let x = x0 + 0.9; x < x1 - 0.5; x += 2.6) B(0.2, 0.26, 0.09, 0x8e938c, x, y1 - 0.48, zw - sd * 0.05);
      }
  };
  const lamp = (x, y, z) => {
    C(0.12, 0.08, 0.1, STEEL, x, y - 0.05, z, 0, 0, 0, 10);
    S(0.08, 0xfff4d2, x, y - 0.12, z);
  };

  INTR = true;
  /* --- 1: the pilothouse (steering station, the OOD's): wheel, two engine-order telegraphs, compass, rudder-angle indicator, voice tubes --- */
  begin();
  {
    const x0 = X_PH1,
      x1 = X_PH0 - 0.8,
      y0 = Y2 + 0.01,
      y1 = Y3 - 0.14,
      w = W_PH - 0.06,
      wy0 = Y2 + 1.15,
      wy1 = Y2 + 1.95 /* the windows 0.8 m deep (the user's, 2026-11-21: a better view) */;
    /* the rounded front is drawn as a flat inner wall with the three windows; the corner windows in the side walls */
    room(x0, x1, y0, y1, -w, w, INT_W, INT_F, INT_C, [
      ['x1', w - 1.14, w - 0.42, wy0, wy1],
      ['x1', w - 0.36, w + 0.36, wy0, wy1],
      ['x1', w + 0.42, w + 1.14, wy0, wy1],
      ['z0', x1 - x0 - 2.7, x1 - x0 - 2.2, wy0, wy1],
      ['z1', x1 - x0 - 2.7, x1 - x0 - 2.2, wy0, wy1],
      ['z0', x1 - x0 - 1.9, x1 - x0 - 1.4, wy0, wy1],
      ['z1', x1 - x0 - 1.9, x1 - x0 - 1.4, wy0, wy1],
    ]);
    /* window frames (seen from inside) */
    for (let i = -1; i <= 1; i++) {
      B(0.04, 0.05, 0.76, STEEL, x1 - 0.02, wy0 - 0.02, i * 0.78);
      B(0.04, 0.05, 0.76, STEEL, x1 - 0.02, wy1 + 0.02, i * 0.78);
    }
    /* steering stand and wheel (brass hub, eight spokes with handles): the wheel turns with the helm (WHEEL, a moving part) */
    const xs = x1 - 0.75;
    B(0.42, 1.2, 0.36, 0x4d5257, xs, y0 + 0.6, 0) /* the steering stand, its shaft coming out of its face */;
    Cx(0.05, 0.3, BRASS, xs - 0.32, y0 + 1.12, 0, 10);
    WHEEL.pivot = [xs - 0.46, y0 + 1.12, 0];
    WHEEL.parts = grab(() => {
      add(new THREE.TorusGeometry(0.42, 0.025, 6, 28), WOOD, 0, 0, 0, 0, HP, 0);
      /* the spokes half a spoke off the upright at amidships (the user's, 2026-11-22): the OOD sees dead ahead between two of them */
      for (let i = 0; i < 8; i++) {
        const a = ((i + 0.5) / 8) * PI * 2;
        B(0.03, 0.56, 0.03, BRASS, 0, 0, 0, 0, a, 0);
        P[P.length - 1].m = new M4().compose(new THREE.Vector3(0, Math.cos(a) * 0.28, Math.sin(a) * 0.28), new THREE.Quaternion().setFromEuler(new THREE.Euler(a, 0, 0)), new THREE.Vector3(1, 1, 1));
        C(0.022, 0.022, 0.14, WOOD, 0, Math.cos(a) * 0.52, Math.sin(a) * 0.52, a, 0, 0, 6);
      }
      Cx(0.07, 0.08, BRASS, 0, 0, 0, 12);
    });
    /* the magnetic compass binnacle ahead of the wheel and the gyro repeater above the windows' sill */
    C(0.18, 0.24, 0.95, BRASS, x1 - 0.3, y0 + 0.48, 0, 0, 0, 0, 14);
    S(0.2, BRASS, x1 - 0.3, y0 + 1.0, 0, 1, 0.5, 1);
    C(0.15, 0.15, 0.03, DIAL, x1 - 0.3, y0 + 1.04, 0, 0, 0, 0, 16);
    face('qmCompass', [x1 - 0.3, y0 + 1.06, 0], 0.27, 0.27, [0, 1, 0], [1, 0, 0]);
    /* the rudder-angle indicator, overhead forward */
    B(0.08, 0.28, 0.62, DARK, x1 - 0.05, y1 - 0.22, 0);
    dial(x1 - 0.1, y1 - 0.22, 0, 0.12, 'x');
    face('qmRudder', [x1 - 0.13, y1 - 0.22, 0], 0.22, 0.22, [-1, 0, 0]);
    /* two engine-order telegraphs (port engine and starboard engine) */
    for (const s of [-1, 1]) {
      const z = s * 0.95,
        xt = x1 - 0.5;
      C(0.1, 0.14, 0.95, BRASS, xt, y0 + 0.48, z, 0, 0, 0, 10);
      C(0.26, 0.26, 0.14, BRASS, xt, y0 + 1.1, z, 0, 0, HP, 18);
      C(0.22, 0.22, 0.15, DIAL, xt, y0 + 1.1, z, 0, 0, HP, 18);
      face(s < 0 ? 'qmTelP' : 'qmTelS', [xt - 0.08, y0 + 1.1, z], 0.42, 0.42, [-1, 0, 0]);
      B(0.04, 0.4, 0.05, DARK, xt - 0.1, y0 + 1.25, z, 0, 0, 0.4);
      S(0.05, 0x8c2020, xt - 0.12, y0 + 1.43, z);
    }
    /* engine RPM indicators and a clock on the forward bulkhead, voice tubes, sound-powered phone */
    dial(x1 - 0.03, Y2 + 2.2, -1.25, 0.11, 'x');
    dial(x1 - 0.03, Y2 + 2.2, 1.25, 0.11, 'x');
    dial(x1 - 0.03, Y2 + 2.25, 0, 0.09, 'x');
    face('qmRpmP', [x1 - 0.06, Y2 + 2.2, -1.25], 0.19, 0.19, [-1, 0, 0]);
    face('qmRpmS', [x1 - 0.06, Y2 + 2.2, 1.25], 0.19, 0.19, [-1, 0, 0]);
    face('qmClock', [x1 - 0.06, Y2 + 2.25, 0], 0.155, 0.155, [-1, 0, 0]);
    for (const z of [-1.6, -1.45, 1.45, 1.6]) {
      C(0.03, 0.03, 1.2, BRASS, x1 - 0.12, y0 + 0.6, z, 0, 0, 0, 6);
      C(0.07, 0.04, 0.1, BRASS, x1 - 0.18, y0 + 1.25, z, 0, 0, HP * 0.6, 8);
    }
    B(0.15, 0.24, 0.16, DARK, x0 + 0.1, y0 + 1.5, -1.6);
    /* the chart table aft and a stool */
    B(0.9, 0.06, 1.1, WOOD, x0 + 0.6, y0 + 0.95, 1.4);
    B(0.85, 0.9, 1.05, 0x4d5257, x0 + 0.6, y0 + 0.47, 1.4);
    lamp(x1 - 1.2, y1, 0);
    lamp(x0 + 0.8, y1, 0);
  }
  emit();

  /* --- 3: the radar plot / radio room (aft part of the 02 enclosure) and the sonar in the A/S hut --- */
  begin();
  {
    const x0 = X_RR1 + 0.06,
      x1 = X_PH1 - 0.06,
      y0 = Y2 + 0.01,
      y1 = Y3 - 0.14,
      w = W_PH - 0.06;
    room(x0, x1, y0, y1, -w, w, INT_W, INT_F, INT_C);
    /* the bulkhead between the radar room and the pilothouse, with a door (as seen from both sides) */
    B(0.06, y1 - y0, 2 * w, INT_W, x1 + 0.03, (y0 + y1) / 2, 0);
    B(0.07, 1.85, 0.75, STEEL, x1 + 0.03, y0 + 0.93, 1.1);
    /* the operator's seat (the station's eye): the radar console and the radio receiver are angled in toward it, \__/ with the
       sonar console in the middle, so each face is seen square on from the chair */
    const EYE = [X_RR1 + 2.21, -0.45],
      /* build fn facing +x with the front face's foot at the origin, then stand it at (x, z) facing the operator */
      toward = (x, z, fn) => {
        const yaw = Math.atan2(-(EYE[1] - z), EYE[0] - x),
          T = GX.xf(x, y0, z, yaw),
          f0 = FACES.length,
          Q = grab(fn);
        for (const q of Q) (q.m = q.m ? new M4().multiplyMatrices(T, q.m) : T.clone()), P.push(q);
        /* the faces it added: into the room's frame */
        const Rm = new THREE.Matrix4().extractRotation(T);
        for (let i = f0; i < FACES.length; i++) {
          const F = FACES[i];
          F.p = new THREE.Vector3(...F.p).add(new THREE.Vector3(0, -y0, 0)).applyMatrix4(T).toArray();
          F.n = new THREE.Vector3(...F.n).applyMatrix4(Rm).toArray();
        }
      };
    /* the surface-search radar console with its PPI scope (glowing green), in the port forward corner */
    toward(x0 + 3.28, -1.22, () => {
      /* the same cabinet as the radio receiver opposite (mirror image about the chair): the scope sits flush in a bezel the size of
         the radio's paper window, at the same height, so the two displays line up */
      const SY = 1.35;
      B(0.5, 1.85, 0.85, 0x4b5257, -0.25, 0.93, 0);
      B(0.04, 0.62, 0.72, DARK, 0.01, SY, 0);
      C(0.27, 0.27, 0.012, GLOW, 0.034, SY, 0, 0, 0, HP, 28);
      face('radar', [0.045, y0 + SY, 0], 0.54, 0.54, [1, 0, 0]);
      for (let i = 0; i < 4; i++) dial(0.01, 0.85, -0.27 + i * 0.18, 0.05, 'x');
    });
    /* the radio transmitter and receiver racks along the port bulkhead, with dials */
    {
      const xr = x0 + 1.48;
      B(0.38, 1.85, 0.5, 0x51585e, xr, y0 + 0.93, -w + 0.27);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) dial(xr - 0.085 + c * 0.17, y0 + 1.0 + r * 0.32, -w + 0.53, 0.05, 'z');
    }
    /* the receiver that prints the radio traffic (its paper window and tuning dial), in the port after corner, angled in */
    toward(x0 + 1.02, -1.22, () => {
      B(0.5, 1.85, 0.85, 0x51585e, -0.25, 0.93, 0);
      B(0.04, 0.62, 0.72, DARK, 0.01, 1.35, 0);
      face('radio', [0.035, y0 + 1.35, 0], 0.66, 0.56, [1, 0, 0]);
      dial(0.01, 0.85, 0, 0.09, 'x');
    });
    /* the sonar repeater console between the radio racks and the radar (the stack itself is in the A/S hut on the open bridge, its
       range recorder and bearing repeater are brought down here so one operator works all three): range recorder, bearing indicator,
       the ping key and the training hand wheel */
    {
      const xc = x0 + 2.215,
        zc = -w + 0.3;
      B(1.05, 1.0, 0.55, 0x4b5257, xc, y0 + 0.5, zc);
      B(1.05, 0.8, 0.4, 0x3f454b, xc, y0 + 1.4, zc - 0.07);
      face('sonarRec', [xc + 0.2, y0 + 1.42, zc + 0.14], 0.5, 0.42, [0, 0, 1]);
      dial(xc - 0.33, y0 + 1.45, zc + 0.12, 0.17, 'z');
      face('sonarBrg', [xc - 0.33, y0 + 1.45, zc + 0.15], 0.29, 0.29, [0, 0, 1]);
      add(new THREE.TorusGeometry(0.16, 0.02, 6, 18), BRASS, xc - 0.1, y0 + 1.0, zc + 0.3, 0, 0, 0);
      S(0.035, 0x8c2020, xc + 0.35, y0 + 1.02, zc + 0.27);
    }
    /* receivers and a typewriter (the "mill") on the desk on the starboard side, headphones */
    B(x1 - x0 - 0.08, 0.05, 0.65, WOOD, (x0 + x1) / 2, y0 + 0.75, w - 0.33);
    for (const xl of [x0 + 0.08, (x0 + x1) / 2, x1 - 0.08]) B(0.05, 0.73, 0.05, STEEL, xl, y0 + 0.365, w - 0.62);
    B(0.55, 0.32, 0.45, 0x51585e, x0 + 0.6, y0 + 0.95, w - 0.3);
    B(0.55, 0.32, 0.45, 0x51585e, x0 + 1.2, y0 + 0.95, w - 0.3);
    for (let c = 0; c < 4; c++) dial(x0 + 0.42 + c * 0.13, y0 + 0.98, w - 0.53, 0.035, 'z');
    B(0.42, 0.14, 0.32, DARK, x1 - 0.6, y0 + 0.85, w - 0.35);
    /* the plotting table (dead-reckoning tracer) on the centreline */
    B(1.1, 0.95, 0.8, 0x4d5257, (x0 + x1) / 2 + 0.2, y0 + 0.48, 0.2);
    B(1.15, 0.04, 0.85, 0xe8e4d2, (x0 + x1) / 2 + 0.2, y0 + 0.97, 0.2);
    /* chairs */
    for (const [x, z] of [
      [x0 + 2.15, -0.5],
      [x0 + 0.9, w - 0.9],
    ]) {
      C(0.2, 0.2, 0.06, RUBBER, x, y0 + 0.5, z, 0, 0, 0, 12);
      C(0.03, 0.03, 0.48, STEEL, x, y0 + 0.24, z, 0, 0, 0, 6);
    }
    lamp((x0 + x1) / 2, y1, 0);
    /* the sonar (A/S hut on the open bridge): the hut's inside, and the sound stack with its range recorder and training wheel */
    const hx1 = XF(24.1) - 0.4,
      hx0 = XF(24.1) - 2.2,
      hw = 1.78;
    room(hx0, hx1, Y3 + 0.01, YHUT - 0.08, -hw, hw, INT_W, INT_F, INT_C, [
      ['x1', hw - 1.13, hw - 0.57, Y3 + 1.24, Y3 + 1.6],
      ['x1', hw - 0.28, hw + 0.28, Y3 + 1.24, Y3 + 1.6],
      ['x1', hw + 0.57, hw + 1.13, Y3 + 1.24, Y3 + 1.6],
      ['x0', 2 * hw - 1.3, 2 * hw - 0.6, Y3 + 0.02, Y3 + 1.8],
    ]);
    B(0.6, 1.35, 0.85, 0x4b5257, hx1 - 0.35, Y3 + 0.68, 0.75);
    B(0.04, 0.32, 0.5, 0xe8e4d2, hx1 - 0.66, Y3 + 1.15, 0.75);
    dial(hx1 - 0.66, Y3 + 0.75, 0.6, 0.12, 'x');
    dial(hx1 - 0.66, Y3 + 0.75, 0.92, 0.07, 'x');
    add(new THREE.TorusGeometry(0.2, 0.025, 6, 20), BRASS, hx1 - 0.72, Y3 + 0.45, 0.75, 0, HP, 0);
    C(0.18, 0.12, 0.2, DARK, hx1 - 0.2, YHUT - 0.35, 0.2, 0, 0, HP, 12);
    C(0.2, 0.2, 0.06, RUBBER, hx1 - 1.2, Y3 + 0.5, 0.75, 0, 0, 0, 12);
    C(0.03, 0.03, 0.48, STEEL, hx1 - 1.2, Y3 + 0.25, 0.75, 0, 0, 0, 6);
    lamp((hx0 + hx1) / 2, YHUT - 0.08, 0);
  }
  emit();

  /* --- 2: the forward engine room (frames 33.5 to 46): the starboard main diesel, a 60 kW generator, the switchboard,
         the throttle and gauge board at the engine's after end, ladders and piping --- */
  const ER = { x0: XF(46) + 0.1, x1: XF(33.5) - 0.1, y0: -1.55, y1: 2.65, w: 4.25 };
  begin();
  {
    const { x0, x1, y0, y1, w } = ER;
    room(x0, x1, y0, y1, -w, w, ENG_W, ENG_F, ENG_W);
    /* floor plates' pattern (a few seams), the hull frames on the side walls */
    for (let x = x0 + 0.6; x < x1; x += 0.6096) for (const s of [-1, 1]) B(0.08, y1 - y0 - 0.2, 0.12, ENG_W - 0x0b0b0b, x, (y0 + y1) / 2, s * (w - 0.06));
    for (let x = x0 + 1.0; x < x1; x += 1.0) B(0.02, 0.012, 2 * w - 0.2, 0x45484a, x, y0 + 0.006, 0);
    /* the main diesel (V-12, about 4.6 m long), starboard; the reduction gear and shaft at its after end */
    {
      const ze = 1.75,
        xa = x0 + 2.3,
        xb = x1 - 0.85,
        xc = (xa + xb) / 2,
        L = xb - xa;
      B(L, 0.35, 1.7, 0x3d4243, xc, y0 + 0.18, ze);
      B(L, 0.95, 1.35, ENG_M, xc, y0 + 0.82, ze);
      for (const s of [-1, 1]) {
        /* the two cylinder banks in a V, six heads each, with rocker covers */
        B(L * 0.94, 0.55, 0.55, ENG_M, xc, y0 + 1.55, ze + s * 0.42, 0, s * 0.5, 0);
        for (let i = 0; i < 6; i++) B(0.55, 0.16, 0.42, 0x8b958c, xa + 0.35 + (i + 0.5) * ((L - 0.7) / 6), y0 + 1.86, ze + s * 0.62, 0, s * 0.5, 0);
      }
      /* exhaust manifold (lagged, silver) rising to the uptake, and the blower at the forward end */
      Cx(0.17, L * 0.9, 0xb9bcb5, xc, y0 + 2.1, ze, 12);
      C(0.17, 0.17, y1 - (y0 + 2.1), 0xb9bcb5, xb - 0.2, (y1 + y0 + 2.1) / 2, ze, 0, 0, 0, 12);
      B(0.6, 1.1, 1.2, ENG_M, xb + 0.32, y0 + 1.15, ze);
      B(0.85, 1.3, 1.5, 0x55605a, xa - 0.45, y0 + 0.75, ze);
      Cx(0.14, xa - 0.85 - x0, STEEL, (x0 + xa - 0.85) / 2, y0 + 0.65, ze, 10);
      /* the control station on the engine's inboard side at its after end: gauge board (eight dials), throttle wheel,
         and the engine-order telegraph repeater beside it */
      const zb = ze - 0.82;
      B(1.5, 0.95, 0.1, 0x2f3437, xa + 0.85, y0 + 1.5, zb);
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 4; c++) {
          dial(xa + 0.32 + c * 0.35, y0 + 1.33 + r * 0.33, zb - 0.07, 0.11, 'z');
          face('eg' + (r * 4 + c), [xa + 0.32 + c * 0.35, y0 + 1.33 + r * 0.33, zb - 0.1], 0.19, 0.19, [0, 0, -1]);
        }
      add(new THREE.TorusGeometry(0.22, 0.025, 6, 20), 0x8c2020, xa + 0.5, y0 + 0.92, zb - 0.12, 0, 0, 0);
      Cz(0.04, 0.2, STEEL, xa + 0.5, y0 + 0.92, zb - 0.05, 6);
      C(0.1, 0.13, 1.0, BRASS, xa - 0.15, y0 + 0.5, zb - 0.55, 0, 0, 0, 10);
      C(0.22, 0.22, 0.12, BRASS, xa - 0.15, y0 + 1.1, zb - 0.55, HP, 0, 0, 16);
      C(0.18, 0.18, 0.13, DIAL, xa - 0.15, y0 + 1.1, zb - 0.55, HP, 0, 0, 16);
      face('eTel', [xa - 0.15, y0 + 1.1, zb - 0.62], 0.34, 0.34, [0, 0, -1]);
    }
    /* the 60 kW diesel generator, port */
    {
      const zg = -2.45,
        xa = x0 + 2.4,
        xb = x1 - 1.3;
      B(xb - xa, 0.3, 1.1, 0x3d4243, (xa + xb) / 2, y0 + 0.15, zg);
      B((xb - xa) * 0.6, 0.85, 0.85, ENG_M, xa + (xb - xa) * 0.65, y0 + 0.72, zg);
      Cx(0.42, (xb - xa) * 0.38, 0x5c6a62, xa + (xb - xa) * 0.18, y0 + 0.72, zg, 16);
    }
    /* the switchboard on the forward bulkhead, port side: black panels with meters and breakers */
    B(0.35, 1.9, 2.0, 0x23272a, x1 - 0.18, y0 + 1.15, -2.6);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) dial(x1 - 0.37, y0 + 1.25 + r * 0.38, -3.35 + c * 0.5, 0.08, 'x');
    /* the ladder to the hatch, the log desk, piping along the overhead and the walls, lamps */
    for (const s of [-1, 1]) B(0.06, 4.5, 0.06, STEEL, x1 - 2.0, (y0 + y1) / 2 + 0.2, -0.9 + s * 0.3, 0, 0, -0.35);
    for (let i = 0; i < 11; i++) B(0.05, 0.04, 0.6, STEEL, x1 - 2.65 + i * 0.14, y0 + 0.3 + i * 0.38, -0.9);
    B(0.6, 0.05, 0.5, WOOD, x0 + 0.4, y0 + 1.0, -3.6);
    B(0.55, 0.95, 0.45, 0x4d5257, x0 + 0.4, y0 + 0.48, -3.6);
    for (const [y, z, c] of [
      [y1 - 0.25, -3.5, 0x8c2020],
      [y1 - 0.4, -3.2, 0x2c5c8c],
      [y1 - 0.25, 3.5, 0xb9bcb5],
      [y1 - 0.45, 0.6, 0x5a7d4b],
    ])
      Cx(0.07, x1 - x0, c, (x0 + x1) / 2, y, z, 8);
    for (let x = x0 + 1.2; x < x1; x += 2.2) lamp(x, y1, 0);
  }
  emit();

  INTR = false;
  /* ================= the shape the ocean must keep out of (half-breadth at the waterline, bow to stern) ================= */
  const WL = [];
  for (let i = 0; i < 32; i++) {
    const f = F_STEM + ((F_END - F_STEM) * i) / 31;
    WL.push(yc(f) > 0.05 ? 0 : hb(f, 0.0));
  }

  /* ---------- the stations: eye in the model frame, the way the eye looks (yaw: + to starboard), and a name ---------- */
  const STN = {
    /* the OOD in the pilothouse, at the wheel and telegraphs (he has the quartermaster's duties too: the user's, 2026-11-21) */
    1: [{ e: [X_PH0 - 2.35, Y2 + 1.66, 0], yaw: 0, pitch: -0.04, name: 'OOD - PILOTHOUSE' }],
    2: [{ e: [ER.x0 + 1.4, ER.y0 + 1.65, -0.35], yaw: 0.62, pitch: -0.12, fov: 52, name: 'ENGINEERING - FORWARD ENGINE ROOM' }],
    3: [
      { e: [X_RR1 + 2.21, Y2 + 1.22, -0.45], yaw: -0.61, pitch: 0.075, fov: 38, name: 'COMMUNICATIONS - RADAR', dev: 'radar' },
      { e: [X_RR1 + 2.21, Y2 + 1.22, -0.45], yaw: -1.61, pitch: 0.08, fov: 38, name: 'COMMUNICATIONS - SONAR', dev: 'sonar' },
      { e: [X_RR1 + 2.21, Y2 + 1.22, -0.45], yaw: -2.53, pitch: 0.075, fov: 38, name: 'COMMUNICATIONS - RADIO', dev: 'radio' },
    ],
    /* the gunner mans a gun (gun: the mount's id): his eye and the way he looks come from the gun itself (see GUN in the game) */
    4: [
      { gun: '3in', e: [XF(16.0) - 0.63, hd(16.0) + 0.12 + 1.82, -0.6], yaw: 0, pitch: 0, name: 'GUNNER - 3"/50 FORWARD (POINTER)' },
      { gun: '20', e: [XF(44.7), hd(44.7) + 0.12 + 1.63, 3.3], yaw: 1.4, pitch: 0, name: 'GUNNER - 20 MM STARBOARD AMIDSHIPS' },
      { gun: '40', e: [XF(76.3) + 0.6, Y_PLAT + 1.8, 1.0], yaw: PI, pitch: 0, name: 'GUNNER - TWIN 40 MM AFT (POINTER)' },
    ],
    5: [
      /* the torpedoman's four positions, bow to stern: the Hedgehog, the K-guns each side, the stern racks and their control board */
      { tp: 'hh', e: [XF(24.1), hd(24.1) + 0.12 + 1.65, -1.6], yaw: 0.3, pitch: -0.32, name: 'TORPEDOMAN - HEDGEHOG' },
      { tp: 'port', e: [XF(69.0), hm(69.0) + 0.12 + 1.65, -2.7], yaw: -1.0, pitch: -0.33, name: 'TORPEDOMAN - PORT K-GUNS' },
      { tp: 'stbd', e: [XF(67.4), hm(67.4) + 0.12 + 1.65, 2.6], yaw: 1.05, pitch: -0.33, name: 'TORPEDOMAN - STARBOARD K-GUNS' },
      { tp: 'rack', e: [XF(81.2), hm(81.2) + 0.12 + 1.65, 0], yaw: PI, pitch: -0.32, name: 'TORPEDOMAN - DEPTH-CHARGE RACKS' },
    ],
  };

  /* ---------- the Measure 32 dazzle (PCE-842, port side as photographed; mirrored to starboard) ---------- */
  /* convex quads in the side view (x, y), each with a colour: 1 = 5-O ocean gray, 2 = BK dull black; elsewhere 5-L light gray */
  const DZ = [
    [1, [28.9, 1.2], [18.5, 5.6], [18.5, 30], [28.9, 30]],
    [2, [27.9, -1], [20.6, -1], [4.8, 6.3], [12.2, 6.3]],
    [2, [6.4, 5.2], [3.4, 5.2], [-0.6, -1], [2.4, -1]],
    [2, [2.4, -1], [-0.6, -1], [-5.6, 5.2], [-2.6, 5.2]],
    [2, [-11.0, 4.7], [-13.6, 4.7], [-18.4, 1.6], [-16.9, 1.15]],
    [2, [-16.9, 1.95], [-18.4, 1.6], [-14.6, -1], [-12.0, -1]],
    [1, [-19.3, -1], [-28.9, -1], [-28.9, 30], [-22.2, 30]],
    [2, [-23.4, -1], [-28.9, -1], [-28.9, 0.95], [-24.8, 0.95]],
    [1, [14.5, 6.9], [4.0, 6.9], [4.0, 30], [10.2, 30]],
    [2, [12.0, 9.5], [9.0, 9.5], [6.2, 12.5], [9.2, 12.5]],
  ];
  const glQuad = (q) => {
    const p = q.slice(1);
    let s = '';
    for (let i = 0; i < 4; i++) {
      const a = p[i],
        b = p[(i + 1) % 4];
      s += `(${(b[0] - a[0]).toFixed(3)})*(v.y-(${a[1].toFixed(3)}))-(${(b[1] - a[1]).toFixed(3)})*(v.x-(${a[0].toFixed(3)}))${i < 3 ? '>=0.0&&' : '>=0.0'}`;
    }
    /* the quads are listed clockwise or anticlockwise; accept either winding */
    const s2 = s.replace(/>=0\.0/g, '<=0.0');
    return `if((${s})||(${s2}))k=${q[0]}.0;`;
  };
  const GL_DZ = 'float dazzle(vec2 v){float k=0.0;' + DZ.map(glQuad).join('') + 'return k;}';
  /* the weather decks and the outside of her: steel deck plates painted 20-B Deck Blue, the superstructure and fittings weathered.
     Painted in the shader (no textures to load), the deck told apart by its colour and by facing up */
  const XGLSL = (() => {
    const v = (n) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((x) => x.toFixed(5)).join(', ');
    return {
      head: `
float xH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float xN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(xH(i), xH(i + vec2(1.0, 0.0)), f.x), mix(xH(i + vec2(0.0, 1.0)), xH(i + vec2(1.0, 1.0)), f.x), f.y); }
float xF(vec2 p){ return 0.5 * xN(p) + 0.25 * xN(p * 2.03 + 7.1) + 0.125 * xN(p * 4.1 + 3.3) + 0.0625 * xN(p * 8.3 + 1.7); }
float xL(float u, float s){ float f = fract(u / s); return min(f, 1.0 - f) * s; }
`,
      body: `
{
  vec3 N = normalize(vMN);
  float m = 1.0;
  if (distance(vColor, vec3(XDECK)) < 0.012 && N.y > 0.6) {
    /* the deck: plates in strakes running fore and aft, 1.5 m wide, each strake's butt welds every 6 m staggered from its
       neighbours'; a dark seam with a raised bead either side */
    float sk = floor((vMP.z + 0.2) / 1.524);
    float dz = xL(vMP.z + 0.2, 1.524), dx = xL(vMP.x + 3.0 * mod(sk, 2.0) + 1.1 * sk, 6.1);
    float d = min(dz, dx);
    m *= 1.0 - 0.22 * (1.0 - smoothstep(0.004, 0.011, d)) + 0.05 * (smoothstep(0.011, 0.016, d) - smoothstep(0.016, 0.028, d));
    /* each plate a slightly different age of paint; touch-up patches of fresher, darker paint */
    vec2 pid = vec2(floor((vMP.x + 3.0 * mod(sk, 2.0) + 1.1 * sk) / 6.1), sk);
    m *= 0.95 + 0.08 * xH(pid);
    float tp = step(0.82, xH(floor(vMP.xz / vec2(1.3, 0.9)) + 3.7)) * step(0.4, xN(vMP.xz * 0.8));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.9, 1.0), tp * 0.6);
    /* the non-skid: a fine grit, and a slow mottle */
    m *= 0.92 + 0.12 * xH(floor(vMP.xz * 140.0));
    m *= 0.9 + 0.14 * xF(vMP.xz * 0.7);
    /* worn walkways: the paint scuffed lighter along the side decks and down the centre */
    float walk = smoothstep(0.55, 0.85, xN(vec2(vMP.x * 0.35, vMP.z * 1.6)));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.45, 0.48), walk * 0.22 * (0.6 + 0.4 * xN(vMP.xz * 9.0)));
    /* salt: pale tide marks where spray dried */
    float salt = smoothstep(0.62, 0.8, xF(vMP.xz * 0.45 + 2.0)) * (1.0 - smoothstep(0.8, 0.95, xF(vMP.xz * 0.45 + 2.0)));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.7, 0.72, 0.72), salt * 0.28);
    /* rust: small blooms where the paint is chipped, a few bleeding along the seams */
    float rs = smoothstep(0.84, 0.95, xN(vMP.xz * 3.3 + 11.0)) * smoothstep(0.55, 0.85, xN(vMP.xz * 17.0));
    rs = max(rs, (1.0 - smoothstep(0.0, 0.04, d)) * smoothstep(0.78, 0.93, xN(vMP.xz * 2.1 + 5.0)) * 0.6);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.21, 0.15) * (0.8 + 0.4 * xN(vMP.xz * 40.0)), rs * 0.5);
  } else {
    /* the superstructure, the hull above the boot top and the fittings: a slow mottle in the paint, rust runs from fittings and
       seams streaking down the vertical faces, salt haze low on them */
    float vert = (1.0 - abs(N.y)) * (1.0 - smoothstep(0.06, 0.12, max(max(vColor.r, vColor.g), vColor.b) - min(min(vColor.r, vColor.g), vColor.b))) /* paintwork only (greys), not the crew or the coloured fittings */;
    vec2 uv = vec2(vMP.x + vMP.z, vMP.y);
    m *= 0.94 + 0.1 * xF(uv * 1.6 + N.xz);
    float run = smoothstep(0.7, 0.9, xN(vec2(uv.x * 7.0, 0.0))) * smoothstep(0.35, 0.8, xN(vec2(uv.x * 2.0, uv.y * 0.9 + 3.0))) * vert;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.24, 0.16), run * 0.32);
    float hz = smoothstep(0.55, 0.85, xF(uv * 0.8 + 4.0)) * vert;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.75, 0.77, 0.77), hz * 0.08);
  }
  diffuseColor.rgb *= m;
}
`.replace(/vec3\(XDECK\)/g, 'vec3(' + v(DECK) + ')'),
    };
  })();
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  material.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMP;varying vec3 vMN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMP=position;vMN=normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMP;varying vec3 vMN;\n' + GL_DZ + '\n' + XGLSL.head)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nif(vColor.r>0.99&&vColor.b>0.99&&vColor.g<0.02){' +
          'if(vMP.y<-0.32)diffuseColor.rgb=vec3(0.36,0.14,0.12);else if(vMP.y<0.28)diffuseColor.rgb=vec3(0.075,0.08,0.085);' +
          'else{float k=dazzle(vMP.xy);diffuseColor.rgb=k>1.5?vec3(0.11,0.115,0.125):k>0.5?vec3(0.36,0.4,0.43):vec3(0.62,0.645,0.65);}}\n' +
          XGLSL.body,
      );
  };
  material.userData.key = 'pce842dazzle';
  material.userData.cs = 1; /* keep the world's cloud-shadow / hull-mask hook (csApply) off the ship itself */

  /* build: everything into one geometry (the rooms included: they face inward and cannot be seen from outside) */
  /* the hull number on each bow, white, as photographed (about 18 m forward of amidships, high on the bow); the number is a parameter so the other escorts wear their own */
  const DIGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'bcfg', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function hullNumber(txt) {
    const SEG = { a: [0.5, 0.94, 0.86, 0.12], b: [0.94, 0.72, 0.12, 0.44], c: [0.94, 0.28, 0.12, 0.44], d: [0.5, 0.06, 0.86, 0.12], e: [0.06, 0.28, 0.12, 0.44], f: [0.06, 0.72, 0.12, 0.44], g: [0.5, 0.5, 0.86, 0.12] },
      HN = 1.0,
      WN = 0.62,
      out = [];
    for (const s of [-1, 1])
      String(txt).split('').forEach((ch, di) => {
        const xl = s < 0 ? 19.2 - di * 0.82 : 16.94 + di * 0.82;
        for (const k of DIGS[ch] || '') {
          const q = SEG[k],
            x = s < 0 ? xl - q[0] * WN : xl + q[0] * WN,
            y = 3.5 + q[1] * HN,
            f = (27.75 - x) / FR;
          out.push(part(bx(q[2] * WN, q[3] * HN, 0.03), WHITE, x, y, s * (hb(f, y) + 0.025), 0, s * Math.atan2(hb(f + 0.5, y) - hb(f - 0.5, y), FR), 0));
        }
      });
    return out;
  }
  function build(num) {
    const acc = new GX.Acc();
    for (const [parts, T, intr] of groups) if (!intr) acc.add(parts, T);
    acc.add(hullNumber(num || '842'), null);
    return acc.geometry();
  }
  /* the station interiors: one mesh, lit evenly (deckhead lights) so the rooms read the same by day and by night */
  const intMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(0.42, 0.42, 0.4) });
  intMaterial.userData.cs = 1;
  /* the rooms' surfaces are painted in the shader (no textures to load), told apart by their colours */
  const IGLSL = (() => {
    const v = (n) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((x) => x.toFixed(5)).join(', ');
    return { head: `
varying vec3 vMp;
varying vec3 vMn;
float iH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float iN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(iH(i), iH(i + vec2(1.0, 0.0)), f.x), mix(iH(i + vec2(0.0, 1.0)), iH(i + vec2(1.0, 1.0)), f.x), f.y); }
float iF(vec2 p){ return 0.5 * iN(p) + 0.25 * iN(p * 2.03 + 7.1) + 0.125 * iN(p * 4.1 + 3.3) + 0.0625 * iN(p * 8.3 + 1.7); }
