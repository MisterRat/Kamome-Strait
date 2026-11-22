/* detailed vehicle models (forward = +x while building, then turned to +z and fitted to the target's box) */
const VM = (() => {
  const Z = Math.PI / 2,
    { cyl, bx, part } = GX,
    sph = () => GX.sph(10),
    cache = {}; /* one geometry per model type, shared by every vehicle/building of that type */
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
  /* ---- the Japanese base buildings, 1945 (docs/research_1945_bases.md, "Airfields" and "Naval bases"): dispersed timber buildings
     on concrete piers under corrugated-iron roofs, earth-covered concrete bunkers and magazines, timber-framed hangars with sliding
     doors, buried concrete fuel cisterns with drums under palm-frond netting; mottled dark green and brown. Each stands on y = 0
     inside the target's footprint (x = width, z = length), front toward +z. ---- */
  const MOT = [0x5d6247, 0x3f4a32, 0x6a5440] /* the godowns' mottle */;
  const hipRoof = GX.hipRoof;
  const hq = () => {
    /* the headquarters: a single-storey timber building (15.6 x 9.4 m) on concrete piers, a 2.3 m veranda along the front, a hipped
       corrugated-iron roof with deep eaves; radio mast, flagstaff with the ensign, a sandbagged entrance */
    const P = [],
      W = 15.6,
      z0 = -5.8,
      z1 = 3.6,
      fl = 0.9 /* the floor */,
      wt = 3.98 /* the walls' top */,
      WALL = 0x8a7a5c,
      TRIM = 0x5a4632,
      ROOF = 0x5a5248;
    for (let x = -7.5; x <= 7.6; x += 2.5) for (const z of [-5.5, -2.5, 0.5, 3.4, 5.7]) P.push(part(bx(0.35, 0.74, 0.35), 0x8f8a80, x, 0.37, z)); /* concrete piers */
    P.push(part(bx(16, 0.2, 12), 0x6b5a42, 0, fl - 0.1, 0)); /* the floor, over the piers */
    P.push(part(bx(W, wt - fl + 0.02, z1 - z0), WALL, 0, (wt + fl) / 2 - 0.01, (z0 + z1) / 2)); /* the walls */
    for (const z of [z1 + 0.01, z0 - 0.01]) for (let k = 0; k < 6; k++) P.push(part(bx(W + 0.02, 0.05, 0.03), TRIM, 0, fl + 0.35 + k * 0.5, z)); /* weatherboard laps */
    /* windows with open wooden shutters: five on the front and back, three on each end */
    const win = (x, z, ry) => {
      const c = Math.cos(ry),
        sn = Math.sin(ry);
      P.push(part(bx(1.3, 1.4, 0.06), TRIM, x, 2.5, z, 0, ry), part(bx(1.1, 1.2, 0.08), 0x1f2a30, x, 2.5, z, 0, ry));
      for (const d of [-1, 1]) P.push(part(bx(0.6, 1.3, 0.04), 0x4a5a3a, x + c * d * 0.97, 2.5, z - sn * d * 0.97, 0, ry)); /* shutters, folded back on the wall */
    };
    for (const x of [-6, -3, 3, 6]) win(x, z1 + 0.03, 0), win(x, z0 - 0.03, Math.PI);
    win(0, z0 - 0.03, Math.PI);
    for (const z of [-3.6, -1.1, 1.4]) win(W / 2 + 0.03, z, Math.PI / 2), win(-W / 2 - 0.03, z, -Math.PI / 2);
    P.push(part(bx(1.7, 2.3, 0.08), 0x3a2f26, 0, fl + 1.15, z1 + 0.04), part(bx(0.04, 2.3, 0.1), TRIM, 0, fl + 1.15, z1 + 0.06)); /* the double door */
    /* the veranda: posts on the floor's edge up to the eave beam, a hand rail either side of the steps, the infill over the front wall */
    const zv = 5.85;
    for (const x of [-7.8, -4.7, -1.4, 1.4, 4.7, 7.8]) P.push(part(bx(0.18, 3.0, 0.18), TRIM, x, fl + 1.5 - 0.02, zv));
    P.push(part(bx(16, 0.18, 0.2), TRIM, 0, fl + 3.0, zv)); /* the eave beam on the posts */
    for (const s of [-1, 1]) P.push(part(bx(6.5, 0.08, 0.08), TRIM, s * 4.6, fl + 0.9, zv), part(bx(0.06, 0.9, 0.06), TRIM, s * 3.0, fl + 0.45, zv));
    {
      /* the infill from the front wall's top up to the roof over the veranda, cut to the hip line */
      const ry0 = (x) => 3.6 + 0.36 * Math.min(6.6 - z1, 8.8 - Math.abs(x)) + 0.02;
      P.push(GX.ext([[-W / 2, wt - 0.04], [W / 2, wt - 0.04], [W / 2, ry0(W / 2)], [5.8, ry0(5.8)], [-5.8, ry0(-5.8)], [-W / 2, ry0(-W / 2)]], 0.1, WALL, z1));
    }
    for (let k = 0; k < 3; k++) {
      const t = fl - 0.18 - k * 0.27;
      P.push(part(bx(2.2, t, 0.34), 0x8f8a80, 0, t / 2, 6.15 + k * 0.32)); /* concrete steps down from the veranda, each a block on the ground */
    }
    /* the roof: eaves at 3.6 m, 1 m over the walls, ridge 2.4 m up; a ridge cap and fascia boards */
    const ex0 = -8.8,
      ex1 = 8.8,
      ez0 = -6.8,
      ez1 = 6.6,
      ey = 3.6,
      rise = 2.41;
    P.push(hipRoof(ex0, ex1, ez0, ez1, ey, rise, ROOF));
    P.push(part(bx(4.4, 0.16, 0.24), 0x3c3832, 0, ey + rise + 0.02, (ez0 + ez1) / 2));
    for (const z of [ez0, ez1]) P.push(part(bx(17.6, 0.12, 0.05), TRIM, 0, ey - 0.03, z));
    for (const x of [ex0, ex1]) P.push(part(bx(0.05, 0.12, 13.4), TRIM, x, ey - 0.03, (ez0 + ez1) / 2));
    /* radio mast behind the building, with its yards and guys to ground anchors; the flagstaff and ensign in front */
    P.push(part(cyl(0.07, 0.1, 10, 6), 0x3a3d40, -5.5, 5, -8.6), part(bx(2.2, 0.08, 0.08), 0x3a3d40, -5.5, 9.4, -8.6), part(bx(1.6, 0.08, 0.08), 0x3a3d40, -5.5, 8.6, -8.6));
    for (const [dx, dz] of [[-3, -2], [3, -2], [0, 3]]) P.push(GX.rod([-5.5, 8.0, -8.6], [-5.5 + dx, 0.05, -8.6 + dz], 0.012, 0x2a2a28, 0.012, 4), part(bx(0.25, 0.2, 0.25), 0x8f8a80, -5.5 + dx, 0.1, -8.6 + dz));
    P.push(part(cyl(0.06, 0.08, 9, 6), 0xcfcfcf, 6.8, 4.5, 8.8), ...FLG.at('jn', 2.1, 6.87, 8.95, 8.8, 0));
    /* the entrance: sandbag blast walls either side of the path, the unit's signboard on its post */
    sandbags(P, -2.9, 8.2, 4, 0, 3);
    sandbags(P, 2.9, 8.2, 4, 0, 3);
    P.push(part(bx(0.14, 2.2, 0.14), TRIM, 1.6, 1.1, 7.0), part(bx(0.36, 1.5, 0.05), 0xd8cfb4, 1.6, 1.5, 7.09));
    return P;
  };
  const bunker = () => {
    /* an earth-covered concrete command bunker: a turfed coral mound 14 m across and 3 m high over the concrete box, the concrete
       portal standing out of its face with a steel door and an embrasure, vent pipes and a periscope housing on top, palm fronds */
    const P = [],
      CON = 0x8a8c84,
      prof = [[7, 0], [6.6, 0.55], [5.8, 1.55], [4.8, 2.45], [3.6, 2.95], [1.8, 3.12], [0, 3.15]],
      mh = (r) => {
        for (let i = 0; i < prof.length - 1; i++)
          if (r >= prof[i + 1][0]) return prof[i][1] + ((prof[i + 1][1] - prof[i][1]) * (prof[i][0] - r)) / (prof[i][0] - prof[i + 1][0]);
        return 3.15;
      };
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), 18);
    P.push({ ...part(g, 0x7d7a52, 0, 0, 0) });
    /* the portal: wing walls and a roof slab running back into the mound, the front face with a door and the gun slit */
    P.push(part(bx(6.2, 0.5, 3.3), CON, 0, 2.4, 5.35) /* roof slab */, part(bx(0.55, 2.65, 3.3), CON, -2.83, 1.32, 5.35), part(bx(0.55, 2.65, 3.3), CON, 2.83, 1.32, 5.35));
    P.push(part(bx(6.2, 2.15, 0.4), CON, 0, 1.075, 6.8)); /* the front wall between them */
    P.push(part(bx(1.3, 2.0, 0.08), 0x33362f, -1.4, 1.0, 7.03), part(bx(1.5, 0.12, 0.2), CON, -1.4, 2.06, 7.05)); /* steel door and its lintel */
    P.push(part(bx(2.2, 0.36, 0.06), 0x0c0d0b, 1.4, 1.65, 7.02), part(bx(2.6, 0.12, 0.45), CON, 1.4, 1.95, 7.2)); /* the embrasure and its hood */
    /* on top: two vent pipes with caps, the periscope housing, an aerial; palm fronds laid over the crown */
    for (const [x, z] of [[-1.6, -0.8], [1.9, -1.6]]) P.push(part(cyl(0.15, 0.15, 1.0, 8), 0x555a50, x, mh(Math.hypot(x, z)) + 0.35, z), part(cyl(0.3, 0.3, 0.1, 8), 0x555a50, x, mh(Math.hypot(x, z)) + 0.88, z));
    P.push(part(bx(0.6, 0.5, 0.6), CON, 0.2, 3.3, 1.2), part(cyl(0.025, 0.025, 3, 5), 0x2b2d2f, -0.6, 4.6, -2.2));
    for (const [x, z, a] of [[-0.8, 0.4, 0.3], [1.2, -0.6, 1.9], [0.1, -2.2, 0.9], [-2.0, -1.8, 2.6], [2.4, 1.0, 1.2]]) P.push(part(bx(2.4, 0.05, 0.55), 0x4d6b32, x, mh(Math.hypot(x, z)) + 0.02, z, 0, a));
    /* sandbag blast walls in front of the door and the slit, ammunition boxes */
    sandbags(P, -2.6, 8.4, 3, 0, 2);
    sandbags(P, 2.6, 8.4, 3, 0, 2);
    P.push(part(bx(1.1, 0.7, 1.0), 0x6a5a3c, -4.6, 0.35, 7.6), part(bx(1.1, 0.7, 1.0), 0x7a6a48, -4.3, 1.05, 7.7));
    GX.camo(P.slice(0, 1), [0x7d7a52], [0x7d7a52, 0x5f6a3e, 0x9a8c62], 2.2, 1.7);
    return P;
  };
  const hangar = () => {
    /* a timber-framed hangar (18 x 30 m) clad in corrugated iron, mottled; a low gable roof on king-post trusses, the open front with
       four sliding doors run back to either side on their top rail, high strip windows, a lean-to workshop on the starboard side */
    const P = [],
      W = 18,
      D = 30,
      fy = 0.2 /* slab top */,
      wy = 5.6 /* wall top */,
      ey = 5.4,
      ry = 7.85,
      SKIN = 0x5d6247,
      TIM = 0x5a4632;
    P.push(part(bx(W + 0.4, 0.2, D + 0.4), 0x8a8a84, 0, 0.1, 0)); /* the concrete floor */
    for (const s of [-1, 1]) P.push(part(bx(0.2, wy - fy, D), SKIN, s * 9, (wy + fy) / 2, 0)); /* the side walls */
    P.push(part(bx(W, wy - fy, 0.2), SKIN, 0, (wy + fy) / 2, -D / 2)); /* the back wall */
    P.push(part(prism(W, ry - wy + 0.1, 0.2), SKIN, 0, wy - 0.05, -D / 2)); /* its gable */
    /* the roof: two corrugated panels from the eaves (0.6 m over the walls) to the ridge, a ridge cap */
    const a = Math.atan2(ry - ey, 9.6),
      pl = Math.hypot(9.6, ry - ey);
    for (const s of [-1, 1]) P.push(part(bx(pl, 0.12, D + 1.0), 0x4e4a40, s * 4.8, (ey + ry) / 2 + 0.06, 0.3, 0, 0, -s * a));
    P.push(part(bx(0.5, 0.2, D + 1.0), 0x3c3832, 0, ry + 0.1, 0.3));
    /* the trusses: tie beams wall to wall, king posts to the ridge, the front one carrying the door header and the front gable */
    for (const z of [-9, -3, 3, 9, D / 2 - 0.2]) P.push(part(bx(W, 0.22, 0.22), TIM, 0, wy - 0.1, z), part(bx(0.2, ry - wy + 0.1, 0.2), TIM, 0, (ry + wy) / 2, z));
    P.push(part(prism(W, ry - wy + 0.1, 0.15), SKIN, 0, wy - 0.05, D / 2 - 0.2)); /* the front gable over the opening */
    P.push(part(bx(W, 0.6, 0.4), TIM, 0, 5.3, D / 2) /* door header */, part(bx(0.5, 5.4, 0.5), TIM, -8.85, 2.9, D / 2), part(bx(0.5, 5.4, 0.5), TIM, 8.85, 2.9, D / 2));
    P.push(part(bx(19, 0.15, 0.15), 0x2a2a28, 0, 5.0, D / 2 + 0.25)); /* the sliding doors' top rail */
    for (const s of [-1, 1]) for (const k of [0, 1]) P.push(part(bx(4.0, 4.75, 0.1), k ? 0x6a5440 : SKIN, s * 6.9, fy + 2.375, D / 2 + 0.25 + k * 0.1), part(bx(4.0, 0.12, 0.12), TIM, s * 6.9, 2.6, D / 2 + 0.31 + k * 0.1)); /* four door leaves, two stacked each side, and their braces */
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) P.push(part(bx(0.06, 0.6, 1.6), 0x1e2a33, s * 9.11, 4.4, -11 + i * 5.5)); /* strip windows */
    /* the lean-to workshop on the starboard side, its shed roof falling away from the hangar wall */
    P.push(part(bx(4.2, 3.2, 10), SKIN, 11.2, fy + 1.4, 3), part(bx(4.4, 0.2, 10.4), 0x8a8a84, 11.2, 0.1, 3));
    P.push(part(bx(4.8, 0.12, 10.6), 0x4e4a40, 11.3, 3.28, 3, 0, 0, -0.135), part(bx(1.3, 2.2, 0.08), 0x33362f, 12.0, fy + 1.1, 8.03));
    /* inside: a work bench at the back, drums and a crate by the door */
    P.push(part(bx(6, 0.9, 1.0), TIM, -3, fy + 0.45, -D / 2 + 0.7), part(cyl(0.3, 0.3, 0.88, 8), 0x8b4a2b, 13.9, 0.44, 9.5), part(cyl(0.3, 0.3, 0.88, 8), 0x56603f, 13.9, 0.44, 10.2), crate(-10.0, 0, 9, 1.2, 0x7a5f35));
    GX.camo(P, [SKIN], MOT, 3.0, 4.2);
    return P;
  };
  const fuel = () => {
    /* a buried concrete fuel cistern (7 m across) banked with earth, only its rim and shallow domed roof showing, a manhole, the vent
       and the filling pipe down to a valve stand; beside it 200 l drums stacked under palm-frond netting on four posts */
    const P = [],
      R = 3.5,
      CON = 0x8f8f86;
    P.push(part(cyl(R, R, 1.7, 22), CON, 0, 0.85, 0)); /* the cistern wall, standing out of the ground */
    const dm = new THREE.SphereGeometry(1, 22, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    P.push(part(dm, 0x9a9a90, 0, 1.68, 0, 0, 0, 0, R, 0.55, R)); /* the domed roof */
    const bank = new THREE.LatheGeometry([[4.6, 0], [4.2, 0.6], [3.75, 1.15], [3.45, 1.25]].map(([r, y]) => new THREE.Vector2(r, y)), 22);
    P.push(part(bank, 0x7d7a52, 0, 0, 0)); /* the earth banked against it */
    P.push(part(cyl(0.42, 0.45, 0.2, 10), 0x55564f, 0.6, 2.2, 0.4) /* manhole */, part(cyl(0.08, 0.08, 1.0, 6), 0x3a3d40, -1.2, 2.5, -0.8), part(cyl(0.14, 0.14, 0.12, 6), 0x3a3d40, -1.2, 3.0, -0.8) /* vent and cap */);
    /* the filling pipe: up from the roof, over the bank, down to the valve stand */
    const pr = 0.09,
      PC = 0x3a3d40,
      A = [2.6, 1.95, -1.8],
      B = [2.6, 2.5, -1.8],
      C = [5.4, 2.5, -1.8],
      E = [5.4, 0.3, -1.8];
    P.push(GX.rod(A, B, pr, PC, pr, 6), GX.rod(B, C, pr, PC, pr, 6), GX.rod(C, E, pr, PC, pr, 6), part(bx(0.5, 0.6, 0.5), 0x56603f, 5.4, 0.3, -1.8));
    P.push(part(new THREE.TorusGeometry(0.22, 0.03, 4, 10), 0xb22a24, 5.4, 1.2, -1.66), part(cyl(0.03, 0.03, 0.14, 4), PC, 5.4, 1.2, -1.75, Z, 0, 0)); /* the valve wheel on its spindle */
    /* the drum dump: two rows of three, two lying on top, under a frond net on posts */
    const cols = [0x56603f, 0x8b4a2b, 0x3b5675];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) P.push(part(cyl(0.29, 0.29, 0.88, 10), cols[(i + j) % 3], 5.0 + j * 0.62, 0.44, 0.6 + i * 0.62));
    for (let i = 0; i < 2; i++) P.push(part(cyl(0.29, 0.29, 0.88, 10), cols[i], 5.31, 1.17, 0.91 + i * 0.62, Z, 0, 0));
    for (const [x, z] of [[4.4, 0.0], [6.6, 0.0], [4.4, 2.4], [6.6, 2.4]]) P.push(part(cyl(0.06, 0.06, 2.2, 5), 0x5a4632, x, 1.1, z));
    P.push(part(bx(2.5, 0.05, 2.7), 0x4d6b32, 5.5, 2.22, 1.2));
    for (let k = 0; k < 5; k++) P.push(part(bx(2.7, 0.04, 0.35), 0x5d7a3a, 5.5, 2.27, 0.1 + k * 0.55, 0, 0.15 * (k % 2 ? 1 : -1)));
    GX.camo([P[2]], [0x7d7a52], [0x7d7a52, 0x5f6a3e, 0x9a8c62], 2.0, 2.3);
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
  const DRV = { truck: 'jp-type94-cargo', supply: 'jp-type94-supply', tanker: 'jp-type94-fuel', jeep: 'jp-kurogane', apc: 'jp-ko-hi' };
  const defs = {
    /* the enemy vehicles are the reference-built models (MODELS, the Japanese army vehicles piece) */
    truck: () => MODELS.get('jp-type94-cargo'),
    supply: () => MODELS.get('jp-type94-supply'),
    tanker: () => MODELS.get('jp-type94-fuel'),
    jeep: () => MODELS.get('jp-kurogane'),
    apc: () => MODELS.get('jp-ko-hi'),
    tank: () => MODELS.get('jp-ha-go'),
    warehouse: () => MODELS.get('jp-godown', 24, 14) /* the Japanese timber godown (the waterfront piece) */,
    hq,
    bunker,
    hangar,
    fuel,
  };
  return {
    has: (t) => !!defs[t],
    isB: (t) => !!BSET[t],
    make: (t, s) => cache[t] || (cache[t] = bake(defs[t](), s, !!BSET[t], t)),
    /* the same with a driver at the wheel (a convoy vehicle on the move; MODELS.driven): its MODELS name in DRV */
    makeDriven: (t, s) => (DRV[t] ? cache[t + '#d'] || (cache[t + '#d'] = bake(MODELS.driven(DRV[t]), s, false, t)) : VM.make(t, s)),
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
        ? kind === 'veh'
          ? VM.makeDriven(type, s) /* on the move: a driver at the wheel */
          : VM.make(type, s)
        : sp.cyl
          ? new THREE.CylinderGeometry(4.5, 4.5, 9, 14)
          : new THREE.BoxGeometry(s[0], s[1], s[2]),
      new THREE.MeshLambertMaterial(det ? { vertexColors: true, side: VM.isB(type) ? 2 : 0 } : { color: sp.c }),
    );
  /* on the drawn ground: a building on the lowest of its footprint, a vehicle tilted along the slope (its nose is local +z) */
  const gA = GROUNDAT(x, z, s[0], s[2], ry, !VM.isB(type) && !sp.cyl, SURF, s[1]); /* on the topmost surface (SURF) */
  m.position.set(x, gA.y + s[1] / 2, z);
  m.rotation.set(gA.rx, ry, gA.rz, 'YXZ');
  scene.add(m);
  const gnd = sp.cyl ? null : { w: s[0], d: s[2], h: s[1], ry, tilt: !VM.isB(type) } /* SURF.settle puts it on any road, pad or apron laid there */;
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
    gnd,
  };
  e.y0 = m.position.y; /* where it was set down (on its surface, tilted): a reset puts it back here */
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
/* whose a message is about (the user's, 2026-11-22: colour them, red for the enemy and blue for the allies): 'jp', 'us' or ''
   (her own ship's business, practice, the rest). From its words, and who sent it (the radio) */
const MSG_JP = /\b(ENEMY|BANDITS?|BOGIES?|RAID(ERS?)?|INBOUND|SHORE (BATTERY|BATTERIES|GUNS?)|COAST (BATTERY|GUNS?)|TORPEDO(ES)?|SUBMARINE|SONAR CONTACT|I-58|JAPANESE|IJN|KUME|UKURU|AGUNI|AMAMI|T-14S?|FRANKS?|KI-84|HAYATE|STRADDLED|UNDER FIRE|SHELL HIT|KAITEN)\b/,
  MSG_US = /\b(AIR SUPPORT|KAMOME CONTROL|FRIENDLY|ALLIED|LIBERTY|PT-?1\d\d|PT BASE|HALSEY|NIMITZ|P-51S?|MUSTANGS?|USS|FLETCHER|PCE ?843|RONCADOR)\b/,
  MSG_NONE = /\b(EXERCISE|PRACTICE|DRILL|SLEEVES?|TARGETS? (ARE )?OUT)\b/;
function msgSide(t, from) {
  t = String(t || '').toUpperCase();
  if (MSG_NONE.test(t) || from === 'EXERCISE SUB') return '';
  if (MSG_JP.test(t)) return 'jp';
  if (MSG_US.test(t) || from === 'KAMOME CONTROL' || /^(PT|LIBERTY|USS|P-51)/.test(from || '')) return 'us';
  return '';
}
function note(x) {
  const e = $$('kill');
  e.textContent = x;
  const sd = msgSide(x);
  e.style.color = sd === 'jp' ? '#ff6a5a' : sd === 'us' ? '#7ab8ff' : '';
  e.style.display = 'block';
  clearTimeout(note.t);
  note.t = setTimeout(() => (e.style.display = 'none'), 1600);
  if (typeof SIMS !== 'undefined' && SIMS.cur) SIMS.cur.noted(String(x)) /* the simulator keeps it (the PCE: on the radio paper) */;
}
function damage(t, d) {
  if (t.dead) return;
  if (typeof AIRSUP !== 'undefined') AIRSUP.hit(t); /* a sea unit or ground installation under fire calls for air support */
  t.hp -= d;
  if (t.hp <= 0) killT(t);
}
function killT(t) {
  t.dead = true;
  if (t.side !== 'us') killed++; /* an Allied one lost is not a kill */
  if (t.type === 'ship' && typeof VEH !== 'undefined') VEH.sinkStart(t) /* a ship sinks (VEH) */;
  else {
    t.m.scale.y = 0.3;
    t.m.position.y = t.type === 'ship' || t.y0 === undefined ? H(t.c.x, t.c.z) + t.s1 * 0.15 : t.y0 - t.s1 * 0.35; /* squashed onto the surface it stood on */
  }
  if (t.lit) t.lit.visible = false; /* the lights go out */
  t.m.traverse((o) => {
    if (o.userData.wake) return void (o.visible = false); /* she is stopped: no wake (and its material is every ship's) */
    if (t.mov && o.material && o.material.color && !o.isPoints && !o.userData.own) ((o.material = o.material.clone()), (o.userData.own = true)); /* a vehicle's material may be shared with others (the fleet's PCE with the player's): its own copy */
    if (o.material && o.material.color && !o.isPoints) {
      o.userData.c0 = o.material.color.getHex();
      o.material.color.set(0x1a1a1a);
    }
  });
  explode(t.c.clone().add(new V(0, t.s1 * 0.5, 0)), t.type == 'fuel' ? 16 : t.type == 'hangar' ? 20 : 9);
  if (t.type == 'fuel' || t.type == 'tanker') blast(t.c, t.type == 'fuel' ? 22 : 14, 40);
  if (t.side === 'us') {
    if (t.c.distanceTo(cam.position) < 8000) note(t.type === 'ship' ? 'ALLIED SHIP SUNK' : t.type === 'plane' ? 'ALLIED AIRCRAFT DESTROYED' : 'ALLIED VEHICLE DESTROYED');
    return;
  }
  if (t.mov && t.c.distanceTo(cam.position) > 8000) return; /* an enemy vehicle lost far off (to the Allied guns): no word */
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
