/* ---------- the Japanese island waterfront, 1945 (docs/research_1945_bases.md, "Naval bases") ----------
   Deep-draught ships lay at anchor offshore and were worked by Daihatsu landing barges and wooden lighters; the jetties were narrow
   coral-block moles with timber T-heads, rubber-tyre fenders and hand-cranked timber A-frame derricks; drums were stacked under
   palm-frond netting; a 600 mm Decauville line ran from the pier head inland; the warehouses were low timber godowns with deep eaves,
   mottled dark green and brown. Real sizes in metres; boats bow toward +x on their waterline (y = 0), structures on y = 0. */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    GREY = 0x5c6266,
    DK = 0x262626;
  /* Daihatsu (Type A landing barge): 14.88 x 3.35 m, 0.7 m draught; bow ramp, open well, steering position aft */
  MODELS.add('jp-daihatsu', () => {
    const L = 14.88,
      P = GX.loft({
        L, X0: -L / 2, N: 10,
        sect: (t) => {
          const b = 1.675 * (t < 0.08 ? 0.82 + t * 2.2 : t > 0.92 ? 0.93 : 1),
            k = -0.7 + (t > 0.85 ? (t - 0.85) * 3 : 0);
          return [[k, 0], [k, b * 0.55], [k + 0.2, b], [0.2, b], [1.15, b]];
        },
        paint: (y) => (y < 0.2 ? 0x3c3f41 : GREY),
        deck: null,
        transom: GREY,
      });
    P.push(part(bx(L * 0.86, 0.08, 3.1), 0x3a3d3f, 0.2, 0.0, 0)); /* the well floor, up to the ramp */
    P.push(part(bx(0.15, 1.5, 3.2), GREY, L / 2 - 0.1, 0.55, 0, 0, 0, 0.12)); /* the bow ramp, up */
    P.push(part(bx(1.8, 2.2, 2.2), GREY, -L / 2 + 1.5, 1.12, 0), part(bx(1.9, 0.08, 2.4), 0x5d5a3e, -L / 2 + 1.5, 2.26, 0)); /* steering position, standing on the well floor */
    P.push(part(cyl(0.05, 0.05, 1.2, 6), DK, -L / 2 + 0.9, 2.88, 0), ...FLG.at('jn', 0.7, -L / 2 + 0.88, 3.43, 0, Math.PI)); /* ensign staff on its roof */
    for (let k = 0; k < 4; k++) P.push(part(bx(1.1, 0.7, 1.0), 0x7a6648, -2.5 + k * 1.5, 0.39, (k % 2 ? 0.6 : -0.5))); /* cargo, on the floor */
    return P;
  }, { L: 14.88, W: 3.35, D: 0.7, name: 'Daihatsu landing barge' });
  /* a wooden lighter: an unpowered cargo barge, ~12 x 4 m, with a load of crates and drums */
  MODELS.add('jp-lighter', () => {
    const P = [
      GX.ext([[-6, -0.6], [5.2, -0.6], [6, 0.9], [-6, 0.9]], 4.0, 0x5a4632),
      part(bx(11.2, 0.1, 3.6), 0x7a6446, -0.2, 0.75, 0),
      part(bx(11.6, 0.15, 0.2), 0x3d3024, -0.2, 0.95, 2.0),
      part(bx(11.6, 0.15, 0.2), 0x3d3024, -0.2, 0.95, -2.0),
    ];
    for (let k = 0; k < 5; k++) P.push(part(bx(1.4, 1.0, 1.3), k % 2 ? 0x7a6648 : 0x6c5a3e, -4 + k * 2, 1.3, (k % 2 ? 0.7 : -0.6)));
    for (let k = 0; k < 4; k++) P.push(part(cyl(0.3, 0.3, 0.88, 8), 0x4d5a3a, 3.5 + (k % 2) * 0.7, 1.24, -1 + (k >> 1) * 0.7));
    return P;
  }, { L: 12, W: 4, name: 'wooden lighter (cargo barge)' });
  /* hand-cranked timber A-frame derrick (shear legs) on a stone pier: two legs leaning out over the water, a back stay, a winch */
  MODELS.add('jp-aframe-derrick', () => {
    const P = [],
      Hh = 11,
      xt = Math.tan(0.42) * Hh /* the head, leaning out over the water */,
      T = 0x6a4f33;
    /* the timber sill frame on the pier: across under both feet, and back to the stay's anchor block */
    P.push(GX.beam([0, 0.15, -2.4], [0, 0.15, 2.4], 0.3, 0.3, 0x5a4632), GX.beam([0, 0.15, 0], [-6, 0.15, 0], 0.3, 0.3, 0x5a4632), part(bx(0.8, 0.5, 0.8), 0x9c9686, -6, 0.25, 0));
    for (const s of [-1, 1]) P.push(GX.rod([0, 0.3, s * 2.2], [xt, Hh, s * 0.35], 0.24, T, 0.18, 8)); /* the two legs, feet on the sill */
    P.push(part(bx(0.4, 0.4, 1.2), T, xt, Hh, 0)); /* the head block joining them */
    P.push(GX.rod([xt, Hh, 0], [-6, 0.5, 0], 0.025, DK, 0.025, 4)); /* back stay to the anchor block */
    P.push(GX.rod([xt + 0.1, Hh - 0.2, 0], [xt + 0.1, Hh - 6.8, 0], 0.02, DK, 0.02, 4), part(bx(0.5, 0.35, 0.5), DK, xt + 0.1, Hh - 6.95, 0)); /* the fall and its hook */
    P.push(part(bx(1.4, 0.9, 1.2), 0x4a4a46, -2.2, 0.75, 0), part(cyl(0.25, 0.25, 1.3, 8), 0x3a3a36, -2.2, 1.3, 0, Z)); /* the hand winch, on the back sill */
    P.push(GX.rod([-2.2, 1.3, 0], [xt, Hh, 0], 0.02, DK, 0.02, 4)); /* its rope to the head */
    return P;
  }, { L: 6, W: 5, H: 11, name: 'timber A-frame derrick' });
  /* a coral-block mole (stone jetty) of length L (along +x from x = 0) and width W, its top at height h above y = 0, the seaward end
     a timber T-head (tw wide); weathered timber pilings, tyre fenders and bollards along the sides; the blocks in two coral shades */
  MODELS.add('jp-mole', (L, W, h, tw, base) => {
    const P = [],
      b0 = base || -4,
      C1 = 0xc4bda8,
      C2 = 0xb3ab95;
    const Lm = L - 10;
    for (let x = 0, k = 0; x < Lm; x += 2.4, k++) P.push(part(bx(2.4, h - b0, W), k % 2 ? C1 : C2, x + 1.2, (h + b0) / 2, 0));
    P.push(part(bx(Lm, 0.25, W + 0.1), 0xa39b86, Lm / 2, h + 0.12, 0)); /* the paved top */
    /* the T-head: a timber deck on piles */
    P.push(part(bx(10, 0.35, tw), 0x6a5236, Lm + 5, h + 0.1, 0));
    for (let i = 0; i <= 3; i++) for (let j = -2; j <= 2; j++) P.push(part(cyl(0.22, 0.22, h - b0 + 0.3, 6), 0x4a3a2a, Lm + 0.5 + i * 3, (h + b0) / 2, (j * tw) / 5));
    /* pilings, fenders and bollards along both sides */
    for (let x = 3; x < L; x += 6) {
      const sz = x > Lm ? tw / 2 : W / 2;
      for (const s of [-1, 1]) {
        P.push(part(cyl(0.18, 0.2, h - b0 + 0.6, 6), 0x6a5a44, x, (h + b0) / 2 + 0.3, s * (sz + 0.2)));
        P.push(part(new THREE.TorusGeometry(0.38, 0.13, 5, 8), 0x1d1d1d, x > Lm ? x : x + 1.5, h - 0.9, s * (x > Lm ? sz + 0.42 : sz + 0.1))); /* tyre fender, hung on the mole's face (on a piling at the T-head) */
        if ((x | 0) % 12 === 3) P.push(part(cyl(0.18, 0.22, 0.6, 6), 0x2a2a28, x, h + 0.42, s * (sz - 0.6)));
      }
    }
    return P;
  }, { name: 'coral-block mole with a timber T-head' });
  /* 600 mm Decauville track, L long along +x, and a hand-pushed rail cart (with drums if loaded) */
  MODELS.add('jp-decauville', (L) => {
    const P = [];
    for (const s of [-1, 1]) P.push(part(bx(L, 0.07, 0.05), 0x3a3836, L / 2, 0.11, s * 0.3));
    for (let x = 0.4; x < L; x += 0.9) P.push(part(bx(0.16, 0.08, 1.0), 0x4d3c2c, x, 0.04, 0));
    return P;
  }, { name: 'Decauville 600 mm track' });
  MODELS.add('jp-rail-cart', (loaded) => {
    const P = [part(bx(1.8, 0.12, 1.0), 0x5a4632, 0, 0.45, 0)];
    for (const x of [-0.6, 0.6]) for (const s of [-1, 1]) P.push(part(cyl(0.16, 0.16, 0.05, 14), DK, x, 0.27, s * 0.3, Z)); /* flanged steel wheels */
    if (loaded !== false) for (let k = 0; k < 3; k++) P.push(part(cyl(0.29, 0.29, 0.88, 8), [0x4d5a3a, 0x7a4a2a, 0x4d5a3a][k], -0.6 + k * 0.6, 0.95, 0));
    return P;
  }, { name: 'Decauville hand cart' });
  /* 200-litre drums stacked under palm-frond camouflage netting on poles (n x m drums, two high in places) */
  MODELS.add('jp-drum-dump', (n, m) => {
    const P = [],
      N = n || 6,
      M = m || 4;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < M; j++) {
        P.push(part(cyl(0.29, 0.29, 0.88, 8), (i + j) % 3 ? 0x4d5a3a : 0x6e4a2e, i * 0.62, 0.44, j * 0.62));
        if ((i + j) % 2 === 0) P.push(part(cyl(0.29, 0.29, 0.88, 8), 0x4d5a3a, i * 0.62, 1.32, j * 0.62));
      }
    const w = N * 0.62 + 1.6,
      d = M * 0.62 + 1.6,
      cx = (N - 1) * 0.31,
      cz = (M - 1) * 0.31;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(part(cyl(0.06, 0.07, 2.4, 5), 0x6a5a40, cx + (sx * w) / 2, 1.2, cz + (sz * d) / 2));
    /* the net: a sagging sheet of fronds, mottled */
    const net = new THREE.PlaneGeometry(w + 1, d + 1, 6, 4).rotateX(-Z);
    const p = net.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, 2.4 - 0.35 * (1 - Math.abs(p.getX(i)) / ((w + 1) / 2)) * (1 - Math.abs(p.getZ(i)) / ((d + 1) / 2)));
    net.computeVertexNormals();
    const q = part(net, 0x4f6a35, cx, 0, cz);
    q.cf = (x, y, z) => (Math.sin(x * 1.7 + z * 0.9) + Math.cos(z * 2.1 - x * 0.6) > 0.6 ? 0x6f7a45 : 0x3e5a2c);
    P.push(...GX.both(q));
    return P;
  }, { name: 'drum dump under palm-frond netting' });
  /* a Pacific outrigger canoe (the islanders' dugout, drawn up on the beach): a 6 m dugout hull with raised, pointed ends, open inside,
     an outrigger float 1.7 m off its port side on two booms with forked stanchions, a paddle laid across; keel and float on y = 0 */
  MODELS.add('pac-canoe', (c) => {
    const L = 6,
      H = c || 0x7a5a38,
      P = GX.loft({
        L, X0: -L / 2, N: 11,
        sect: (t) => {
          const e = Math.abs(t - 0.5) * 2,
            b = 0.3 * Math.sqrt(Math.max(0.02, 1 - e ** 2.4)),
            y = 0.62 + 0.28 * e ** 3;
          return [[0.06 * e ** 2, 0], [0.12 + 0.1 * e ** 2, b * 0.8], [y, b]];
        },
        paint: (y, k) => (k === 0 ? 0x4a3a28 : H),
        deck: null,
        transom: null,
      });
    P.push(...P.splice(0).flatMap((q) => GX.both(q))); /* a dugout: seen from inside too */
    P.push(part(bx(4.6, 0.04, 0.42), 0x3a2c1e, 0, 0.3, 0)); /* the bilge boards inside */
    const fz = -1.75;
    P.push(part(GX.cyl(0.13, 0.13, 4.0, 8), 0x8a7050, 0, 0.13, fz, 0, 0, Z), part(GX.sph(6), 0x8a7050, 2.0, 0.13, fz, 0, 0, 0, 0.3, 0.13, 0.13), part(GX.sph(6), 0x8a7050, -2.0, 0.13, fz, 0, 0, 0, 0.3, 0.13, 0.13)); /* the float, pointed ends */
    for (const x of [-1.1, 1.1]) {
      P.push(GX.rod([x, 0.66, 0.25], [x, 0.66, fz - 0.05], 0.045, 0x6a5236, 0.045, 5)); /* the boom, lashed across the gunwales */
      P.push(GX.rod([x - 0.02, 0.66, fz], [x - 0.12, 0.2, fz], 0.03, 0x6a5236, 0.03, 4), GX.rod([x + 0.02, 0.66, fz], [x + 0.12, 0.2, fz], 0.03, 0x6a5236, 0.03, 4)); /* the forked stanchions, from the boom down to the float */
    }
    P.push(GX.rod([-0.4, 0.69, -0.35], [1.0, 0.69, 0.3], 0.025, 0x8a6a44, 0.025, 4), part(bx(0.5, 0.02, 0.16), 0x8a6a44, 1.2, 0.69, 0.39, 0, 0.43, 0)); /* a paddle across the gunwales */
    return P;
  }, { L: 6, W: 2.2, name: 'Pacific outrigger canoe' });
  /* godown: a low gable-roofed timber warehouse with deep eaves, mottled dark green and brown, on a stone plinth; W x D footprint,
     the long side along x, the doors on +z */
  MODELS.add('jp-godown', (W, D) => {
    const P = [],
      w = W || 24,
      d = D || 14,
      eh = 4.2 /* eaves */,
      rise = 2.6,
      G = 0x4e5a3c,
      B = 0x5e4a36;
    P.push(part(bx(w + 0.4, 0.6, d + 0.4), 0x8c8676, 0, 0.3, 0));
    P.push(part(bx(w, eh, d), G, 0, 0.6 + eh / 2, 0));
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1.2) for (const s of [-1, 1]) P.push(part(bx(0.12, eh, 0.06), 0x3a4230, x, 0.6 + eh / 2, s * (d / 2 + 0.03))); /* the boards' battens */
    /* the gable ends and the roof with deep eaves (1.2 m), dark weathered boards */
    const top = 0.6 + eh + rise;
    for (const s of [-1, 1]) {
      const g = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-d / 2, 0.6 + eh), new THREE.Vector2(d / 2, 0.6 + eh), new THREE.Vector2(0, top)])).rotateY(Z);
      P.push(...GX.both(part(g, G, (s * w) / 2, 0, 0)));
    }
    const a = Math.atan2(rise, d / 2),
      pl = Math.hypot(d / 2, rise) + 1.2;
    for (const s of [-1, 1]) P.push(part(bx(w + 2.4, 0.18, pl), 0x3e3a30, 0, top - (pl / 2) * Math.sin(a) + 0.1, s * (pl / 2) * Math.cos(a), s * a, 0, 0));
    /* sliding doors and the loading step */
    for (const x of [-w / 4, w / 4]) P.push(part(bx(4, 3.2, 0.12), B, x, 2.2, d / 2 + 0.08), part(bx(4.4, 0.12, 0.2), 0x2a2a28, x, 3.9, d / 2 + 0.15));
    P.push(part(bx(w * 0.8, 0.3, 1.2), 0x8c8676, 0, 0.45, d / 2 + 0.8));
    return GX.camo(P, [G], [G, B, 0x3a4630], 3.2, 0.9);
  }, { name: 'timber godown' });
  /* Japanese airfield control tower (docs/research_1945_bases.md, airfields): a low reinforced-concrete bunker tower of two storeys, 9 m,
     slit windows, a flat observation roof with a parapet and a sandbagged AA position, an external steel ladder from the ground to the
     roof, mottled green and earth camouflage; the Rising Sun on a staff at a roof corner */
  MODELS.add('jp-control-tower', () => {
    const P = [],
      C = 0x8a8a7c,
      M = [C, 0x4e5a3c, 0x6a5a40];
    P.push(part(bx(8, 4.2, 8), C, 0, 2.1, 0)); /* ground storey */
    P.push(part(bx(6, 3.4, 6), C, 0, 5.9, 0)); /* the observation storey, on it */
    P.push(part(bx(6.8, 0.35, 6.8), 0x7a7a6e, 0, 7.775, 0)); /* the flat roof slab */
    for (const s of [-1, 1]) P.push(part(bx(6.8, 0.6, 0.25), C, 0, 8.25, s * 3.275), part(bx(0.25, 0.6, 6.8), C, s * 3.275, 8.25, 0)); /* parapet */
    /* slit windows: wide on the observation storey (all round), narrow below */
    for (const s of [-1, 1]) {
      P.push(part(bx(4.6, 0.55, 0.04), 0x141a1e, 0, 6.3, s * 3.01), part(bx(0.04, 0.55, 4.6), 0x141a1e, s * 3.01, 6.3, 0));
      for (const x of [-2.2, 2.2]) P.push(part(bx(1.2, 0.3, 0.04), 0x141a1e, x, 2.8, s * 4.01));
    }
    P.push(part(bx(1.1, 2.1, 0.06), 0x3a3428, 0, 1.05, 4.02)); /* steel door */
    /* the sandbagged AA position on the roof: a ring of bags */
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      P.push(part(bx(0.85, 0.38, 0.5), k % 2 ? 0x9c8c5e : 0xa89a68, Math.cos(a) * 1.5, 8.14, Math.sin(a) * 1.5, 0, -a + Math.PI / 2, 0));
    }
    /* the external steel ladders up the +x side: the ground storey's face to its roof, then the observation storey's face to the parapet */
    for (const [x, y0, y1] of [[4.04, 0, 4.2], [3.04, 4.2, 8.55]]) {
      for (const z of [-2.6, -2.1]) P.push(GX.rod([x, y0, z], [x, y1, z], 0.035, 0x2e2e2a));
      for (let y = y0 + 0.35; y < y1 - 0.1; y += 0.35) P.push(part(bx(0.04, 0.04, 0.54), 0x2e2e2a, x, y, -2.35));
    }
    P.push(...FLG.pole('jn', 5, 2.4, 2.6, 7.95, -2.6, 0)); /* the Rising Sun, on the roof */
    return GX.camo(P, [C], M, 2.2, 0.6);
  }, { L: 8, W: 8, H: 9, name: 'Japanese airfield control tower (concrete)' });
})();
