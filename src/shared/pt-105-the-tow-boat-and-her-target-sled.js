/* =====================================================================================================================
   PT-105, THE TOW BOAT, AND HER TARGET SLED
   PT-105 was an 80 ft Elco (PT-103 class, the same as PT-109). Built from the PT-109 general arrangement in the References folder
   (plan, profile and lines) and the Elco cutaway: 80 ft (24.38 m) long, 20 ft 8 in (6.30 m) beam, hard-chine planing hull of
   mahogany planking. Deck at the side 1.45 m above the waterline at the transom rising to 2.4 m at the stem; flat aft bottom,
   the chine sweeping up forward to meet the stem. Late-war armament (NavSource): one single 40 mm, one 37 mm, one 20 mm, two
   twin .50s and four torpedoes. From aft: smoke generator and the tow bitt on the transom deck, the single 40 mm Bofors on the
   stern, the 20 mm Oerlikon on the after end of the day cabin roof, the day cabin and engine-room trunk with its ventilators (four Mk 13 torpedoes on roll-off racks along
   the deck edges, two aft, two forward), the port twin .50 turret, the cockpit and chart house with the mast, the
   starboard twin .50 turret, the 37 mm M4 on the forward deck and the crew's hatch. Three Packard V-12s on three screws, three rudders.
   Paint: green (Measure 31 style) on hull and deck, red anti-fouling below the chine. Five crew shown: the helmsman, both
   turret gunners, the 20 mm gunner and a man aft tending the tow.
   Model frame, as for the PCE: bow toward +x, starboard +z, waterline y = 0, origin amidships (s = distance from the transom,
   x = s - 12.19). PTB.build() makes the boat (one vertex-coloured mesh plus her spray), PTB.sled() the target sled.
   ===================================================================================================================== */
const PTB = (() => {
  const L = 24.38,
    X = (s) => s - L / 2,
    sst = (a) => (a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a)),
    /* the hull: deck at the side, half-breadth at the deck, the chine (half-breadth, height) and the keel, against s */
    yd = (s) => 1.45 + 0.95 * Math.pow(s / L, 1.8),
    hb = (s) => (s < 10 ? 2.78 + 0.39 * sst(s / 10) : 3.17 * Math.sqrt(Math.max(0, 1 - Math.pow((s - 10) / 14.38, 2.2)))),
    bc = (s) => hb(s) * 0.88 * (1 - sst((s - 13) / 9.6)),
    yc = (s) => -0.05 + 1.3 * Math.pow(sst((s - 8) / 14.6), 1.3),
    yk = (s) => -0.85 + 1.5 * Math.pow(sst((s - 12.5) / 11.88), 1.6),
    dy = (s, z) => yd(s) + 0.12 * (1 - Math.min(1, (z / Math.max(0.01, hb(s))) ** 2)) /* the deck, with its crown */;
  const GREEN = 0x5c6b4d,
    DECK = 0x67765a,
    RED = 0x9a2c24,
    DARK = 0x2c302a,
    GUNM = 0x3a3d3a,
    STEEL = 0x707670,
    TUBE = 0x5f6a57,
    DUNG = 0x4a5d7a,
    SKIN = 0xc79c7a,
    HELM = 0x515a46,
    KAPOK = 0xa89660;
  function hull() {
    /* lofted from 60 sections; the quads are emitted per colour (deck, topsides, bottom, transom) */
    const G = { d: [], t: [], b: [], tr: [] },
      Q = (a, A, B, C, D) => a.push(...A, ...B, ...C, ...A, ...C, ...D),
      N = 60,
      sec = (s, k) => [
        [X(s), dy(s, 0), 0],
        [X(s), yd(s), k * hb(s)],
        [X(s), yc(s), k * bc(s)],
        [X(s), yk(s), 0],
      ];
    for (let i = 0; i < N; i++) {
      const s0 = (L * i) / N,
        s1 = (L * (i + 1)) / N;
      for (const k of [1, -1]) {
        const A = sec(s0, k),
          B = sec(s1, k);
        Q(G.d, A[0], A[1], B[1], B[0]);
        Q(G.t, A[1], A[2], B[2], B[1]);
        Q(G.b, A[2], A[3], B[3], B[2]);
      }
    }
    for (const k of [1, -1]) {
      const A = sec(0, k);
      Q(G.tr, A[0], A[1], A[2], A[3]);
    }
    const geo = (a) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
      g.computeVertexNormals();
      return g;
    };
    return [GX.part(geo(G.d), DECK, 0, 0, 0), GX.part(geo(G.t), GREEN, 0, 0, 0), GX.part(geo(G.b), RED, 0, 0, 0), GX.part(geo(G.tr), GREEN, 0, 0, 0)];
  }
  function details() {
    const P = [],
      { part, bx, cyl, sph } = GX,
      B = (sx, sy, sz, hex, x, y, z, rx, ry, rz) => P.push(part(bx(sx, sy, sz), hex, x, y, z, rx, ry, rz)),
      C = (r1, r2, h, hex, x, y, z, rx, ry, rz, n) => P.push(part(cyl(r1, r2, h, n || 12), hex, x, y, z, rx, ry, rz)),
      S = (r, hex, x, y, z, sx, sy, sz) => P.push(part(sph(10), hex, x, y, z, 0, 0, 0, r * (sx || 1), r * (sy || 1), r * (sz || 1))),
      T = (r, t, hex, x, y, z, rx, ry, rz) => P.push(part(new THREE.TorusGeometry(r, t, 6, 18), hex, x, y, z, rx, ry, rz));
    /* a crewman standing at (s, z) on the deck, turned to yaw; low: only head and shoulders show (in a turret) */
    const man = (s, z, yaw, h0) => {
      const y = h0 === undefined ? dy(s, z) : h0,
        x = X(s);
      if (PCEM.crew) return P.push(...PCEM.crew(x, y, z, yaw, 'stand'));
      C(0.09, 0.09, 0.8, DUNG, x, y + 0.4, z - 0.1);
      C(0.09, 0.09, 0.8, DUNG, x, y + 0.4, z + 0.1);
      C(0.2, 0.18, 0.62, DUNG, x, y + 1.12, z);
      C(0.23, 0.23, 0.42, KAPOK, x, y + 1.15, z);
      S(0.11, SKIN, x + Math.cos(yaw) * 0.02, y + 1.58, z - Math.sin(yaw) * 0.02);
      S(0.135, HELM, x, y + 1.64, z, 1, 0.55, 1);
      for (const k of [-1, 1]) C(0.06, 0.055, 0.6, DUNG, x + Math.cos(yaw) * 0.15, y + 1.15, z + k * 0.24, 0, 0, 0.4);
    };
    /* four Mk 13 torpedoes on Mk 1 roll-off racks along the deck edges (late-war, as on PT-131 in 1944; the References rack drawing
       and the Mk 13 manual): 22.4 in (0.569 m) diameter, 13 ft 5 in (4.09 m) long, a rounded nose, the parallel body, the tapered
       afterbody and the box tail round the fins and the two contra-rotating screws. The rack: a long base plate, two stands with posts
       either side of the body, clamp bands over it, a top bar between the stands, and the tipping arms on the outboard side that roll
       her off over the side */
    const torpedo = (sm, z) => {
      const y = dy(sm, z) + 0.42,
        sF = sm + 2.045,
        k = Math.sign(z),
        r = 0.285;
      TD.push([X(sF), y, z]) /* for the shark mouth decal (build) */;
      P.push(part(sph(14), TORP, X(sF - 0.42), y, z, 0, 0, 0, 0.42, r, r)) /* the nose */;
      C(0.03, 0.03, 0.04, STEEL, X(sF) + 0.01, y, z, 0, 0, Math.PI / 2, 8);
      C(r, r, 2.33, TORP, X(sF - 1.585), y, z, 0, 0, Math.PI / 2, 18) /* the warhead and air flask */;
      C(r, 0.12, 0.8, TORP, X(sF - 3.15), y, z, 0, 0, Math.PI / 2, 18) /* the afterbody */;
      for (const f of [0.62, 1.4, 2.35, 2.75]) C(r + 0.006, r + 0.006, 0.03, 0x4a3f26, X(sF - f), y, z, 0, 0, Math.PI / 2, 18) /* joint bands */;
      for (const f of [1.75, 2.0, 2.2]) B(0.18, 0.12, 0.02, 0x6a5834, X(sF - f), y + 0.18, z + k * 0.21, 0.9 * k, 0, 0) /* hand-hole plates */;
      /* the tail: the shaft, four fins, the box shroud round them, the two screws */
      C(0.05, 0.05, 0.6, TORP, X(sF - 3.82), y, z, 0, 0, Math.PI / 2, 8);
      for (const q of [0, 1]) B(0.42, 0.5, 0.015, TORP, X(sF - 3.75), y, z, q * Math.PI / 2, 0, 0);
      for (const [dy2, dz] of [
        [0.25, 0],
        [-0.25, 0],
        [0, 0.25],
        [0, -0.25],
      ])
        B(0.3, dz ? 0.5 : 0.015, dz ? 0.015 : 0.5, TORP, X(sF - 3.82), y + dy2, z + dz);
      for (const f of [3.98, 4.06]) for (const q of [0.4, 1.97, 3.54]) B(0.03, 0.2, 0.06, 0x8a7a50, X(sF - f), y + Math.sin(q + f * 5) * 0.09, z + Math.cos(q + f * 5) * 0.09, -(q + f * 5), 0, 0);
      /* the rack */
      const yb = dy(sm, z);
      B(1.9, 0.04, 0.62, STEEL, X(sm), yb + 0.02, z);
      for (const ds of [-0.58, 0.58]) {
        for (const pz of [-0.34, 0.34]) B(0.12, 0.62, 0.05, GUNM, X(sm + ds), yb + 0.33, z + pz);
        T(0.31, 0.02, GUNM, X(sm + ds), y, z, 0, Math.PI / 2, 0) /* the clamp band */;
        B(0.06, 0.06, 0.74, GUNM, X(sm + ds), y + 0.38, z) /* the cross head */;
        B(0.1, 0.3, 0.06, GUNM, X(sm + ds), yb + 0.18, z + k * 0.42, 0, 0, 0) /* the tipping arm */;
        B(0.1, 0.06, 0.3, GUNM, X(sm + ds), yb + 0.32, z + k * 0.5, 0, 0, 0);
      }
      B(1.2, 0.05, 0.05, GUNM, X(sm), y + 0.38, z) /* the top bar */;
    };
    torpedo(4.1, -2.5);
    torpedo(4.1, 2.5);
    torpedo(11.6, -2.72);
    torpedo(11.6, 2.72);
    /* the day cabin and engine-room trunk: hatches, skylights and the ventilators */
    const tk = dy(7.6, 0);
    B(7.0, 0.62, 2.25, GREEN, X(7.6), tk + 0.29, 0.1);
    B(7.04, 0.06, 2.29, DECK, X(7.6), tk + 0.61, 0.1);
    for (const s of [6.6, 8.3]) B(1.0, 0.1, 1.1, DARK, X(s), tk + 0.67, 0.1);
    for (const s of [9.6, 10.4]) B(0.55, 0.12, 0.55, 0x8a9a9a, X(s), tk + 0.66, -0.55);
    for (const [s, z] of [
      [4.6, -1.15],
      [5.75, 1.3],
    ]) {
      C(0.11, 0.11, 1.1, GREEN, X(s), dy(s, z) + 0.55, z);
      C(0.11, 0.11, 0.35, GREEN, X(s) + 0.12, dy(s, z) + 1.12, z, 0, 0, -Math.PI / 2);
      C(0.15, 0.15, 0.06, DARK, X(s) + 0.3, dy(s, z) + 1.12, z, 0, 0, -Math.PI / 2);
    }
    /* life rafts (floater nets) on the trunk */
    B(1.5, 0.28, 0.75, 0x9e8f5f, X(8.9), tk + 0.78, 0.55);
    T(0.32, 0.07, 0xc8b070, X(10.2), tk + 0.7, 0.55, Math.PI / 2, 0, 0);
    /* the cockpit (armoured, open-topped) and the chart house forward of it */
    const ck = dy(12.2, 0);
    /* the cockpit is narrow and to port (PT-109 plan): the forward turret stands outboard of it to starboard */
    for (const z of [-1.3, 0.45]) B(2.2, 0.98, 0.06, GREEN, X(12.2), ck + 0.49, z);
    B(0.06, 0.98, 1.81, GREEN, X(11.1), ck + 0.49, -0.425);
    B(2.2, 0.06, 1.7, DARK, X(12.2), ck + 0.04, -0.425);
    const ch = dy(14.6, 0);
    B(3.0, 1.25, 2.6, GREEN, X(14.8), ch + 0.62, 0);
    B(1.2, 0.06, 2.4, GREEN, X(16.55), ch + 0.92, 0, 0, 0, -0.62) /* the sloped front */;
    B(3.04, 0.06, 2.64, DECK, X(14.8), ch + 1.26, 0);
    for (const z of [-1.31, 1.31]) for (const s of [13.8, 14.8, 15.8]) B(0.5, 0.25, 0.02, 0x1d2428, X(s), ch + 0.9, z);
    for (const z of [-0.8, 0, 0.8]) B(0.02, 0.24, 0.55, 0x1d2428, X(16.35), ch + 1.03, z);
    /* the windscreen, wheel, throttles, compass and the helmsman */
    B(0.06, 0.35, 2.3, 0x9bb3c0, X(13.33), ch + 1.42, 0, 0, 0, 0.2);
    T(0.24, 0.025, 0x3a2a1a, X(13.1), ck + 1.0, -0.1, 0, Math.PI / 2, 0);
    C(0.04, 0.04, 0.35, STEEL, X(13.22), ck + 1.0, -0.1, 0, 0, Math.PI / 2);
    B(0.12, 0.88, 0.12, STEEL, X(13.1), ck + 0.44, -0.5) /* the throttle pedestal from the cockpit floor */;
    B(0.22, 0.1, 0.34, STEEL, X(13.1), ck + 0.92, -0.5) /* the quadrant */;
    for (const z of [-0.6, -0.5, -0.4]) B(0.06, 0.22, 0.04, 0xb02020, X(13.1), ck + 1.05, z, 0, 0, 0.4);
    C(0.05, 0.05, 0.88, STEEL, X(13.1), ck + 0.44, -0.95) /* the compass's pedestal */;
    C(0.13, 0.15, 0.25, 0x9a8a50, X(13.1), ck + 1.0, -0.95);
    man(12.6, -0.1, 0, ck);
    /* the mast (aft end of the chart house), yard, the ensign and the red "Baker" flag she flies while towing; a whip aerial */
    const mt = ch + 1.27,
      xm = X(13.5);
    C(0.06, 0.04, 4.0, 0x8a8a7a, xm, mt + 2.0, 0);
    B(0.05, 0.05, 1.7, 0x8a8a7a, xm, mt + 3.2, 0);
    /* the flags stream aft from their halyards: the red "Baker" at the starboard yardarm, the ensign at the masthead with its union
       at the hoist (next to the mast) */
    B(0.75, 0.45, 0.02, 0xc8202a, xm - 0.39, mt + 2.95, 0.78) /* the Baker flag, its hoist at the yard */;
    for (let i = 0; i < 7; i++) B(0.95, 0.06, 0.02, i % 2 ? 0xf0f0ea : 0xb8202a, xm - 0.55, mt + 3.75 - i * 0.06, 0);
    B(0.4, 0.24, 0.026, 0x2a3a6a, xm - 0.28, mt + 3.66, 0);
    C(0.012, 0.006, 3.6, 0x30302a, X(16.0), ch + 1.26 + 1.8, -1.0);
    /* the twin .50 turrets (Mk 17): a ring tub, twin M2s on the scarf ring, ammunition boxes, the gunner */
    /* the tubs stand high (PT-109 plan and profile): the rim about 1.85 m above the deck, the highest thing on her decks, the shell
       running down to the deck past the cabin side, the gunner's floor 0.9 m up inside */
    const turret = (s, z, yaw) => {
      const y0 = dy(s, z),
        y = y0 + 0.9;
      P.push(part(new THREE.CylinderGeometry(0.85, 0.88, y + 0.95 - y0, 22, 1, true), GREEN, X(s), (y0 + y + 0.95) / 2, z)) /* the tub, open at the top */;
      C(0.8, 0.8, y + 0.6 - y0, DARK, X(s), (y0 + y + 0.6) / 2, z, 0, 0, 0, 22) /* the tub's floor */;
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * 2 * Math.PI;
        B(0.03, 0.36, 0.24, 0x3c4a34, X(s) + Math.cos(a) * 0.8, y + 0.78, z - Math.sin(a) * 0.8, 0, a, 0) /* its inner wall */;
      }
      T(0.84, 0.04, STEEL, X(s), y + 0.95, z, Math.PI / 2, 0, 0);
      man(s - Math.cos(yaw) * 0.45, z + Math.sin(yaw) * 0.45, yaw, y + 0.05);
      /* the Mk 17 mount: the twin M2 heavy barrels on a cradle on the ring's post, built along +x then turned to yaw and elevated 8 deg */
      const G = [],
        put = (g, hex, x, yy, zz, rx, ry, rz) => G.push(part(g, hex, x, yy, zz, rx, ry, rz)),
        el = 0.14;
      put(cyl(0.05, 0.06, 0.5, 8), STEEL, 0, 0.25, 0);
      put(bx(0.35, 0.08, 0.5), GUNM, 0.05, 0.52, 0);
      for (const k of [-0.11, 0.11]) {
        put(bx(0.62, 0.16, 0.11), GUNM, 0.0, 0.62, k) /* the receiver */;
        put(bx(0.12, 0.1, 0.1), 0x2c2e2c, -0.36, 0.6, k) /* the back plate */;
        for (const g of [-0.04, 0.04]) put(cyl(0.012, 0.012, 0.16, 5), 0x3a2a1a, -0.46, 0.57, k + g, 0, 0, Math.PI / 2) /* spade grips */;
        put(cyl(0.032, 0.032, 0.42, 10), 0x30322f, 0.5, 0.64, k, 0, 0, -Math.PI / 2) /* the barrel jacket */;
        for (const q of [0.36, 0.46, 0.56, 0.66]) put(cyl(0.034, 0.034, 0.025, 10), 0x1c1d1c, q, 0.64, k, 0, 0, -Math.PI / 2) /* its cooling holes */;
        put(cyl(0.019, 0.019, 0.85, 8), GUNM, 1.12, 0.64, k, 0, 0, -Math.PI / 2) /* the heavy barrel */;
        put(cyl(0.03, 0.026, 0.09, 8), 0x1c1d1c, 1.56, 0.64, k, 0, 0, -Math.PI / 2) /* the muzzle */;
        put(bx(0.16, 0.04, 0.1), 0x9a8a50, 0.0, 0.66, k + Math.sign(k) * 0.1, 0, 0, 0.2) /* the belt feeding in from outboard */;
      }
      put(new THREE.TorusGeometry(0.08, 0.008, 4, 14), GUNM, 0.2, 0.86, 0, 0, Math.PI / 2, 0) /* the ring sight */;
      /* the curved ammunition trays (Mk 17 plan in the References): one each side round the inside of the ring, from abeam the
         guns aft, rounds showing, the belt chutes up into the guns; they turn with the mount, not with the guns' elevation */
      const TR = [];
      for (const k of [-1, 1])
        for (let i = 0; i < 9; i++) {
          const a = k * (0.75 + i * 0.2),
            cx = Math.cos(a) * 0.6,
            cz = -Math.sin(a) * 0.6;
          TR.push(part(bx(0.13, 0.22, 0.19), 0x4a4f38, cx, 0.76, cz, 0, a, 0));
          TR.push(part(bx(0.11, 0.03, 0.17), 0x9a8a50, cx, 0.88, cz, 0, a, 0));
        }
      for (const k of [-1, 1]) TR.push(part(bx(0.3, 0.05, 0.08), 0x9a8a50, 0.1, 1.05, -k * 0.3, 0, -k * 0.5, 0.35));
      put(cyl(0.008, 0.008, 0.32, 4), GUNM, 0.2, 0.7, 0) /* its post, from the cradle */;
      const M = new THREE.Matrix4().compose(
        new THREE.Vector3(X(s) + Math.cos(yaw) * 0.1, y + 0.62, z - Math.sin(yaw) * 0.1),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, el, 'YXZ')),
        new THREE.Vector3(1, 1, 1),
      );
      for (const q of G) (q.m = new THREE.Matrix4().multiplyMatrices(M, q.m)), P.push(q);
      const My = GX.xf(X(s), y, z, yaw);
      for (const q of TR) (q.m = new THREE.Matrix4().multiplyMatrices(My, q.m)), P.push(q);
    };
    turret(7.45, -1.15, 0.4);
    turret(12.4, 1.4, -0.2);
    /* her late-war guns (NavSource: one single 40 mm, one 37 mm, one 20 mm and the two twin .50s):
       the single 40 mm Bofors on the stern trained aft (the PCE's 40 mm model with one barrel, its pointer, trainer and loader) on a
       round deck plate; the 20 mm Oerlikon moved up onto the after end of the day cabin roof, trained aft over the Bofors; the
       37 mm M4 (the P-39's cannon on a pedestal) on the forward deck */
    const put = (Q, T) => {
      for (const q of Q) (q.m = q.m ? new THREE.Matrix4().multiplyMatrices(T, q.m) : T.clone()), P.push(q);
    };
    const s40 = 1.85,
      y40 = dy(s40, 0);
    C(1.12, 1.12, 0.06, STEEL, X(s40), y40 + 0.03, 0, 0, 0, 0, 24);
    if (PCEM.single40) put(PCEM.single40(0.12), GX.xf(X(s40), y40 + 0.06, 0, Math.PI));
    const s20 = 4.75;
    if (PCEM.oer20pt) put(PCEM.oer20pt(), GX.xf(X(s20), dy(7.6, 0) + 0.64, 0.1, Math.PI));
    {
      /* the 37 mm (Mk 9 drawing in the References): built along +x about the trunnions 1.0 m up, elevated 0.12 rad, then placed.
         The pedestal: a flanged deck ring with gussets, a cone, and a narrow yoke up to the trunnions. The gun: a long receiver, the
         barrel 2 m ahead of the trunnions, the tall clip box standing on the receiver just aft of them, the shoulder yoke at the breech */
      const s37 = 19.5,
        y37 = dy(s37, 0),
        G = [],
        E = [],
        g = (A, geo, hex, x, y, z, rx, ry, rz) => A.push(part(geo, hex, x, y, z, rx, ry, rz)),
        HP = Math.PI / 2;
      g(G, cyl(0.5, 0.5, 0.04, 24), STEEL, 0, 0.02, 0) /* the deck ring */;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 2 * Math.PI;
        g(G, bx(0.16, 0.1, 0.03), GUNM, Math.cos(a) * 0.4, 0.07, Math.sin(a) * 0.4, 0, -a, 0) /* the gussets */;
      }
      g(G, cyl(0.17, 0.36, 0.3, 16), GUNM, 0, 0.19, 0) /* the cone */;
      g(G, cyl(0.17, 0.17, 0.05, 16), STEEL, 0, 0.36, 0);
      for (const k of [-1, 1]) g(G, bx(0.08, 0.62, 0.05), GUNM, 0, 0.68, k * 0.1, k * 0.12, 0, 0) /* the yoke arms */;
      g(G, cyl(0.06, 0.06, 0.28, 10), STEEL, 0, 1.0, 0, HP, 0, 0) /* the trunnion boss */;
      g(E, bx(1.25, 0.16, 0.16), 0x3a3d3a, -0.35, 0, 0) /* the receiver, from the breech forward past the trunnions */;
      g(E, bx(0.9, 0.04, 0.12), 0x2c2e2c, -0.35, -0.095, 0) /* the slide under it */;
      g(E, bx(0.18, 0.12, 0.12), 0x2c2e2c, -1.03, 0.02, 0) /* the back plate */;
      g(E, cyl(0.05, 0.05, 0.45, 10), GUNM, 0.45, 0.02, 0, 0, 0, -HP) /* the recoil sleeve */;
      g(E, cyl(0.03, 0.034, 2.0, 10), 0x30322f, 1.65, 0.02, 0, 0, 0, -HP) /* the barrel */;
      g(E, cyl(0.04, 0.04, 0.08, 10), 0x1c1d1c, 2.62, 0.02, 0, 0, 0, -HP);
      /* the clip box: tall, banded, standing on the receiver */
      g(E, bx(0.3, 0.6, 0.2), 0x4a4f38, -0.36, 0.38, 0);
      for (const y of [0.15, 0.62]) g(E, bx(0.32, 0.04, 0.22), STEEL, -0.36, y, 0);
      for (let i = 0; i < 3; i++) g(E, cyl(0.025, 0.025, 0.2, 6), 0x9a8a50, -0.46 + i * 0.1, 0.7, 0, HP, 0, 0) /* rounds showing */;
      /* the shoulder yoke behind the breech, the hand grip and trigger, a ring sight on the left */
      g(E, bx(0.05, 0.05, 0.44), STEEL, -1.13, -0.02, 0) /* the shoulder yoke, on the back plate */;
      for (const k of [-1, 1]) {
        g(E, new THREE.TorusGeometry(0.08, 0.025, 5, 10, Math.PI), 0x262626, -1.15, 0.06, k * 0.22, 0, HP, -HP);
        g(E, bx(0.3, 0.035, 0.035), STEEL, -1.05, -0.02, k * 0.2);
      }
      g(E, cyl(0.018, 0.018, 0.18, 5), 0x262626, -0.85, -0.18, 0.08, 0, 0, 0.3);
      g(E, bx(0.04, 0.2, 0.04), GUNM, -0.15, 0.18, -0.1) /* the ring sight's post, on the receiver's side */;
      g(E, new THREE.TorusGeometry(0.09, 0.008, 4, 16), GUNM, -0.15, 0.3, -0.1, 0, HP, 0);
      const Te = new THREE.Matrix4().compose(new THREE.Vector3(0, 1.0, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12)), new THREE.Vector3(1, 1, 1));
      for (const q of E) (q.m = new THREE.Matrix4().multiplyMatrices(Te, q.m)), G.push(q);
      const Tm = GX.xf(X(s37), y37, 0, 0);
      put(G, Tm);
      /* the gunner leaning into the rests, and his loader with a round */
      if (PCEM.crew) {
        put(PCEM.crew(-1.5, 0, 0, 0, 'lean', 'rests'), Tm);
        put(PCEM.crew(-0.5, 0, 0.75, -0.5, 'stand', 'round'), Tm);
      }
    }
    man(0.9, 1.4, Math.PI, dy(0.9, 1.4));
    /* the tow bitt, the smoke generator, cleats and chocks */
    C(0.12, 0.14, 0.5, STEEL, X(0.7), dy(0.7, 0) + 0.25, 0);
    C(0.18, 0.12, 0.06, STEEL, X(0.7), dy(0.7, 0) + 0.52, 0);
    C(0.27, 0.27, 1.05, 0x6b6b5e, X(0.45), dy(0.45, -2.2) + 0.3, -2.2, Math.PI / 2, 0, 0);
    for (const [s, z] of [
      [23.6, 0],
      [20.5, 1.7],
      [20.5, -1.7],
      [3.5, 2.6],
      [3.5, -2.6],
    ])
      B(0.3, 0.1, 0.1, STEEL, X(s), dy(s, z) + 0.06, z);
    /* the crew's hatch and the forward deck's dorades */
    B(0.8, 0.12, 0.8, DARK, X(20.9), dy(20.9, 0) + 0.06, 0);
    for (const z of [-0.9, 0.9]) C(0.09, 0.09, 0.35, GREEN, X(18.2), dy(18.2, z) + 0.17, z);
    /* the exhausts in the transom, the three screws on their struts, three rudders */
    for (const z of [-2.1, -1.4, -0.6, 0.6, 1.4, 2.1]) C(0.1, 0.1, 0.12, DARK, X(0) - 0.02, 0.35, z, 0, 0, Math.PI / 2, 10);
    for (const z of [-1.25, 0, 1.25]) {
      C(0.045, 0.045, 4.0, STEEL, X(2.6), -0.95, z, 0, 0, Math.PI / 2 - 0.08, 8);
      C(0.33, 0.33, 0.06, 0xb08a40, X(0.75), -1.1, z, 0, 0, Math.PI / 2, 14);
      B(0.55, 0.62, 0.04, STEEL, X(0.15), -1.0, z);
      B(0.12, 0.55, 0.06, STEEL, X(1.4), -0.75, z, 0, 0, 0.5);
    }

    /* ---- more of her fittings ---- */
    const ck2 = dy(12.2, 0),
      ch2 = dy(14.6, 0),
      top = ch2 + 1.27;
    /* running lights on the chart house sides in their screens (red port, green starboard), the searchlight and the siren */
    for (const [z, hex] of [
      [-1.36, 0xd02020],
      [1.36, 0x20c040],
    ]) {
      B(0.3, 0.22, 0.03, GREEN, X(15.9), ch2 + 1.0, z + Math.sign(z) * -0.04) /* the screen, on the chart house side */;
      B(0.1, 0.12, 0.08, hex, X(15.95), ch2 + 1.0, z + Math.sign(z) * 0.01) /* the lamp, on its screen */;
    }
    C(0.16, 0.18, 0.26, GUNM, X(15.6), top + 0.25, 0.6, 0, 0, Math.PI / 2, 12);
    C(0.14, 0.14, 0.02, 0xfff4c8, X(15.6) + 0.14, top + 0.25, 0.6, 0, 0, Math.PI / 2, 12);
    C(0.05, 0.07, 0.2, STEEL, X(15.6), top + 0.08, 0.6);
    C(0.05, 0.11, 0.3, 0x8a8a7a, X(13.5) + 0.12, top + 2.5, 0, 0, 0, -Math.PI / 2, 8);
    /* the stern staff and the radio aerial from the masthead to it */
    const ss = [X(0.15), dy(0.15, -0.4), -0.4];
    C(0.03, 0.02, 1.9, 0x8a8a7a, ss[0], ss[1] + 0.95, ss[2]);
    const wire = (a, b) => {
      const dx = b[0] - a[0],
        dyy = b[1] - a[1],
        dz = b[2] - a[2],
        len = Math.hypot(dx, dyy, dz),
        m = new THREE.Matrix4().lookAt(new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(0, 1, 0)),
        q = new THREE.Quaternion().setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)),
        e = new THREE.Euler().setFromQuaternion(q);
      C(0.008, 0.008, len, 0x202020, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, e.x, e.y, e.z, 4);
    };
    wire([X(13.5), top + 3.9, 0], [ss[0], ss[1] + 1.85, ss[2]]);
    wire([X(13.5), top + 3.4, 0], [X(17.2), dy(17.2, 0) + 0.1, 0]);
    /* the anchor on the forward deck, its chain to the hawse, a mushroom vent or two */
    const sa = 21.9,
      ya = dy(sa, 0);
    B(1.1, 0.07, 0.09, STEEL, X(sa), ya + 0.05, 0.35);
    B(0.07, 0.07, 0.75, STEEL, X(sa) - 0.5, ya + 0.05, 0.35);
    B(0.25, 0.05, 0.05, STEEL, X(sa) - 0.5, ya + 0.08, 0.04, 0, 0.6, 0);
    B(0.25, 0.05, 0.05, STEEL, X(sa) - 0.5, ya + 0.08, 0.66, 0, -0.6, 0);
    for (let i = 0; i < 9; i++) B(0.09, 0.05, 0.05, 0x404040, X(sa + 0.65 + i * 0.12), dy(sa + 0.65 + i * 0.12, 0.2) + 0.03, 0.35 - i * 0.04, 0, (i % 2) * 1.57, 0);
    C(0.12, 0.12, 0.06, STEEL, X(23.4), dy(23.4, 0) + 0.03, 0);
    for (const [sv, z] of [
      [17.3, 0],
      [9.0, 1.8],
      [9.0, -1.8],
    ]) {
      C(0.05, 0.05, 0.12, STEEL, X(sv), dy(sv, z) + 0.06, z);
      C(0.13, 0.13, 0.05, STEEL, X(sv), dy(sv, z) + 0.13, z);
    }
    /* hatch hinges and dogs on the trunk and the crew's hatch */
    const tk2 = dy(7.6, 0);
    for (const sh of [6.6, 8.3]) {
      C(0.025, 0.025, 1.0, STEEL, X(sh) - 0.5, tk2 + 0.73, 0.1, Math.PI / 2, 0, 0, 6);
      B(0.08, 0.04, 0.04, STEEL, X(sh) + 0.45, tk2 + 0.74, 0.1);
    }
    C(0.025, 0.025, 0.75, STEEL, X(20.9) - 0.4, dy(20.9, 0) + 0.13, 0, Math.PI / 2, 0, 0, 6);
    /* a life ring on the trunk side, extinguishers by the cockpit and the engine hatch, a boat hook on the trunk */
    T(0.3, 0.07, 0xe8e2d0, X(9.4), tk2 + 0.32, 1.26, 0, 0, 0);
    for (const q of [0, 1, 2, 3]) B(0.08, 0.15, 0.03, 0xc84020, X(9.4) + Math.cos(q * 1.57) * 0.3, tk2 + 0.32 + Math.sin(q * 1.57) * 0.3, 1.29);
    for (const [sx, z, y] of [
      [11.3, -1.0, ck2],
      [4.3, 0.95, tk2],
    ])
      C(0.08, 0.08, 0.45, 0xb02020, X(sx), y + 0.23, z);
    C(0.02, 0.02, 3.2, 0x8a6a44, X(7.6), tk2 + 0.67, -0.85, 0, 0, Math.PI / 2, 6);
    /* ammunition ready lockers by the turrets */
    B(0.6, 0.45, 0.4, 0x4f5a42, X(9.1), dy(9.1, -2.0) + 0.23, -2.0);
    B(0.6, 0.45, 0.4, 0x4f5a42, X(13.9), dy(13.9, 2.0) + 0.23, 2.0);
    /* in the cockpit: the binnacle hood, voice tubes and the radio */
    C(0.05, 0.05, 1.12, STEEL, X(13.1), ck2 + 0.56, -0.6) /* the binnacle's pedestal */;
    S(0.12, 0x9a8a50, X(13.1), ck2 + 1.18, -0.6, 1, 0.6, 1);
    for (const z of [-0.3, -0.42]) C(0.035, 0.035, 0.8, 0x9a8a50, X(13.18), ck2 + 0.6, z);
    B(0.4, 0.35, 0.3, 0x3a4038, X(11.5), ck2 + 0.55, 0.9);
    /* the smoke generator's valve wheel and the transom's underwater exhaust boxes */
    T(0.1, 0.015, 0xb02020, X(0.45), dy(0.45, -2.2) + 0.3, -1.62, 0, 0, 0);
    for (const k of [-1, 1]) B(0.6, 0.25, 0.35, GUNM, X(0.3), 0.15, k * 2.55);
    return P;
  }
  /* the rub rail along the sheer, the toe rail on the deck edge and the spray rails along the chines: lofted strips */
  function rails() {
    const S = { rub: [], toe: [], spr: [] },
      Q = (a, A, B, C, D) => a.push(...A, ...B, ...C, ...A, ...C, ...D),
      N = 48;
    for (let i = 0; i < N; i++) {
      const s0 = 0.05 + ((L - 0.4) * i) / N,
        s1 = 0.05 + ((L - 0.4) * (i + 1)) / N;
      for (const k of [1, -1]) {
        const o = (s, d, y) => [X(s), y, k * (hb(s) + d)];
        /* the rub rail: a half-round wooden fender just below the deck edge */
        Q(S.rub, o(s0, 0.07, yd(s0) - 0.04), o(s0, 0.07, yd(s0) - 0.16), o(s1, 0.07, yd(s1) - 0.16), o(s1, 0.07, yd(s1) - 0.04));
        Q(S.rub, o(s0, 0.0, yd(s0) - 0.01), o(s0, 0.07, yd(s0) - 0.04), o(s1, 0.07, yd(s1) - 0.04), o(s1, 0.0, yd(s1) - 0.01));
        Q(S.rub, o(s0, 0.07, yd(s0) - 0.16), o(s0, 0.0, yd(s0) - 0.19), o(s1, 0.0, yd(s1) - 0.19), o(s1, 0.07, yd(s1) - 0.16));
        /* the toe rail on the deck edge */
        Q(S.toe, o(s0, -0.03, yd(s0)), o(s0, -0.03, yd(s0) + 0.07), o(s1, -0.03, yd(s1) + 0.07), o(s1, -0.03, yd(s1)));
        /* the spray rail along the chine, forward of amidships */
        if (s0 > 10 && bc(s1) > 0.05) {
          const c = (s, d, y) => [X(s), y, k * (bc(s) + d)];
          Q(S.spr, c(s0, 0, yc(s0)), c(s0, 0.1, yc(s0) + 0.02), c(s1, 0.1, yc(s1) + 0.02), c(s1, 0, yc(s1)));
        }
      }
    }
    const geo = (a) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
      g.computeVertexNormals();
      return g;
    };
    return [GX.part(geo(S.rub), 0x4a3a28, 0, 0, 0), GX.part(geo(S.toe), 0x8a7a5a, 0, 0, 0), GX.part(geo(S.spr), GREEN, 0, 0, 0)];
  }
  /* her paint, worked in the shader from the model-space position and the part's colour (no textures to load): planked plywood
     topsides with salt streaks, a black boot top and grime along the waterline; plywood deck panels with non-skid speckle and
     worn walkways; mottled anti-fouling with a scum line; weathering on the fittings */
  /* the torpedoes: bare steel and bronze under a coat of cosmoline that weathers to a dull brass */
  const TORP = 0x6c5f3b,
    TD = [];
  function paint(mat) {
    const v = (n) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((x) => x.toFixed(5)).join(', ');
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMp;\nvarying vec3 vMn;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMp = position;\nvMn = normal;');
      sh.fragmentShader = sh.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vMp;
varying vec3 vMn;
float pH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(pH(i), pH(i + vec2(1.0, 0.0)), f.x), mix(pH(i + vec2(0.0, 1.0)), pH(i + vec2(1.0, 1.0)), f.x), f.y); }
float pF(vec2 p){ return 0.5 * pN(p) + 0.25 * pN(p * 2.03 + 7.1) + 0.125 * pN(p * 4.1 + 3.3) + 0.0625 * pN(p * 8.3 + 1.7); }
float pL(float u, float s){ float f = fract(u / s); return min(f, 1.0 - f) * s; }
bool pIs(vec3 c, vec3 k){ return distance(c, k) < 0.012; }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
{
  vec3 c = vColor;
  vec3 N = normalize(vMn);
  float m = 1.0;
  if (pIs(c, vec3(${v(GREEN)})) && abs(N.y) < 0.6 && abs(vMp.z) > 1.6 && vMp.y < 2.5) {
    /* topsides: the planking's seams faint under the paint, salt streaks running down, grime and the boot top at the waterline */
    m *= 1.0 - 0.07 * (1.0 - smoothstep(0.004, 0.012, pL(vMp.y + 0.03 * vMp.x, 0.2)));
    m *= 1.0 - 0.06 * (1.0 - smoothstep(0.004, 0.012, pL(vMp.x, 2.44)));
    m *= 0.92 + 0.12 * pF(vec2(vMp.x * 0.8, vMp.y * 3.0));
    float st = smoothstep(0.62, 0.9, pN(vec2(vMp.x * 6.0, vMp.y * 0.35))) * smoothstep(0.0, 1.0, vMp.y);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.84, 0.8), st * 0.25);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.22, 0.14), (1.0 - smoothstep(0.1, 0.55, vMp.y)) * 0.45 * (0.6 + 0.4 * pN(vMp.xz * 2.0)));
    if (vMp.y < 0.17 && vMp.y > -0.02) diffuseColor.rgb = vec3(0.06, 0.065, 0.06);
  } else if (pIs(c, vec3(${v(DECK)}))) {
    /* the deck: 4 x 8 ft plywood panels, non-skid speckle, a worn walkway down each side of the trunk */
    float d = min(pL(vMp.x + 0.3, 2.44), pL(vMp.z + 0.2, 1.22));
    m *= 1.0 - 0.25 * (1.0 - smoothstep(0.004, 0.012, d));
    m *= 0.9 + 0.2 * pH(floor(vMp.xz * 90.0)) * 0.6 + 0.08 * pF(vMp.xz * 1.5);
    float walk = smoothstep(0.7, 0.0, abs(abs(vMp.z) - 1.75)) * smoothstep(-11.0, -6.0, vMp.x) * smoothstep(6.0, 2.0, vMp.x);
    m *= 1.0 + 0.12 * walk * pN(vMp.xz * 3.0);
    m *= 1.0 - 0.12 * smoothstep(0.6, 0.9, pN(vMp.xz * 5.0 + 3.0));
  } else if (pIs(c, vec3(${v(RED)}))) {
    /* the anti-fouling: mottled, darker toward the keel, a scum line of weed at the waterline */
    m *= 0.86 + 0.24 * pF(vec2(vMp.x * 1.2, vMp.z * 1.2 + vMp.y * 4.0));
    m *= 0.8 + 0.2 * smoothstep(-0.9, 0.0, vMp.y);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22, 0.28, 0.14), smoothstep(-0.25, 0.0, vMp.y) * 0.55 * pN(vMp.xz * 4.0));
  } else {
    /* paint wear and grime on the cabins, tubes and fittings */
    m *= 0.9 + 0.16 * pF(vMp.xy * 3.0 + vMp.zz * 2.0);
    if (pIs(c, vec3(${v(TORP)}))) {
      /* cosmoline: a dull waxy brass, runs and drips streaking along the body, darker dirty smears, a little green verdigris */
      float rn = pN(vec2(vMp.x * 1.5, vMp.y * 11.0 + vMp.z * 11.0));
      m *= 0.82 + 0.22 * pF(vMp.xy * 4.0 + vMp.zz * 3.0) + 0.1 * smoothstep(0.5, 0.95, rn);
      m *= 0.92 + 0.1 * smoothstep(-0.3, 0.8, N.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.25, 0.2, 0.12), smoothstep(0.62, 0.85, pN(vMp.xz * 3.0 + vMp.yy * 4.0)) * 0.45);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.44, 0.32), smoothstep(0.78, 0.95, pN(vMp.xy * 9.0 + 5.0)) * 0.3);
    }
    if (pIs(c, vec3(${v(TUBE)}))) {
      m *= 1.0 + 0.12 * smoothstep(0.0, 1.0, N.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.26, 0.14), smoothstep(0.8, 0.95, pN(vec2(vMp.x * 5.0, vMp.y * 14.0))) * 0.25);
    }
  }
  diffuseColor.rgb *= m;
}`,
        );
    };
  }
  /* the hull number on each bow (white on green), drawn on a canvas */
  function number(txt) {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#eceae0';
    g.font = 'bold 50px Arial';
    g.textAlign = 'center';
    g.fillText(txt, 64, 50);
    const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
      grp = new THREE.Group();
    for (const k of [1, -1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), mat),
        s = 20.3;
      m.position.set(X(s), yd(s) - 0.55, k * (hb(s) + 0.03));
      m.rotation.y = k > 0 ? 0.1 : Math.PI - 0.1;
      grp.add(m);
    }
    return grp;
  }
  /* the shark mouths on the torpedoes' noses, as on the Mustang: a skin just over the nose and the front of the body (a lathe of the
     nose's profile, u round the body, v along it from the tip) carrying a canvas with a mouth and an eye on each side */
  let SHK = null;
  function sharkTex() {
    if (SHK) return SHK;
    /* drawn in the body's own terms so the mouth wraps round the nose: d metres aft of the tip, y up, phi round the body (phi 0 to
       starboard, pi/2 down, pi to port, 3pi/2 up, as the lathe lays u). The mouth is a band between the lips' heights, open at the
       tip where the two sides meet, closing to its corners 0.95 m aft; the teeth along both lips; an eye above each corner, along
       the body, its forward end lower */
    const W = 1024,
      H = 512,
      L = 1.4,
      R = 0.291,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d'),
      rad = (d) => (d < 0.42 ? R * Math.sqrt(Math.max(0, 1 - (1 - d / 0.42) * (1 - d / 0.42))) : R),
      DC = 0.95,
      yU = (d) => 0.11 - 0.14 * Math.pow(Math.min(1, d / DC), 1.3),
      yL = (d) => -0.17 + 0.14 * Math.pow(Math.min(1, d / DC), 0.8),
      /* chart pixel of a point d aft, y up, on the starboard (side 1) or port (side -1) of the body */
      PX = (d, y, side) => {
        const r = rad(d),
          q = Math.asin(Math.max(-1, Math.min(1, -y / r))),
          phi = side > 0 ? q : Math.PI - q;
        return [(((phi / (2 * Math.PI)) % 1) + 1) % 1 * W, (d / L) * H];
      };
    /* the mouth, pixel by pixel: black under the upper lip shading to red in the throat */
    const img = g.createImageData(W, H),
      D = img.data;
    for (let j = 0; j < H; j++) {
      const d = ((j + 0.5) / H) * L;
      if (d > DC) break;
      const r = rad(d),
        u0 = yU(d),
        l0 = yL(d);
      for (let i = 0; i < W; i++) {
        const phi = ((i + 0.5) / W) * 2 * Math.PI,
          y = -r * Math.sin(phi);
        if (y > u0 || y < l0) continue;
        const t = (u0 - y) / Math.max(1e-4, u0 - l0),
          k = 4 * (j * W + i),
          m = Math.min(1, Math.max(0, (t - 0.35) / 0.3));
        D[k] = 10 + m * 185;
        D[k + 1] = 9 + m * 12;
        D[k + 2] = 9 + m * 22;
        D[k + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    /* a lip on one side: from where it comes over the top (upper) or under the bottom (lower) of the nose back to the corner */
    const lip = (yf, side, n) => {
      const out = [];
      let d0 = 0.002;
      while (d0 < DC && Math.abs(yf(d0)) >= rad(d0)) d0 += 0.002;
      for (let i = 0; i <= n; i++) {
        const d = d0 + (DC - d0) * Math.pow(i / n, 1.25);
        out.push(PX(d, yf(d), side));
      }
      return out;
    };
    const draw = (fn) => {
      for (const off of [0, W, -W]) {
        g.save();
        g.translate(off, 0);
        fn();
        g.restore();
      }
    };
    for (const side of [1, -1]) {
      const U = lip(yU, side, 16),
        Lo = lip(yL, side, 14);
      /* keep each lip on one copy of the chart (no jump across the seam) */
      for (const A of [U, Lo]) for (let i = 1; i < A.length; i++) if (Math.abs(A[i][0] - A[i - 1][0]) > W / 2) A[i][0] += A[i][0] < A[i - 1][0] ? W : -W;
      const teeth = (A, dir, L0) => {
        for (let i = 2; i < A.length - 1; i++) {
          const a = A[i],
            b = A[i + 1],
            mx = (a[0] + b[0]) / 2,
            my = (a[1] + b[1]) / 2,
            dx = b[0] - a[0],
            dy = b[1] - a[1],
            l = Math.hypot(dx, dy) || 1,
            len = Math.min(L0 * (0.55 + 0.45 * (1 - i / A.length)) * (i % 2 ? 0.8 : 1), l * 1.6);
          /* point toward the mouth: down the body for the upper teeth, up for the lower; phi grows downward to starboard */
          let nx = -dy / l,
            ny = dx / l;
          if (Math.sign(nx) !== dir * side) (nx = -nx), (ny = -ny);
          g.beginPath();
          g.moveTo(...a);
          g.lineTo(mx + nx * len, my + ny * len);
          g.lineTo(...b);
          g.closePath();
          g.fillStyle = '#f4f1e4';
          g.fill();
          g.lineWidth = 2.5;
          g.strokeStyle = '#0c0c0c';
          g.stroke();
        }
      };
      draw(() => {
        teeth(U, 1, 30);
        teeth(Lo, -1, 26);
        for (const A of [U, Lo]) {
          g.beginPath();
          g.moveTo(...A[0]);
          for (const q of A) g.lineTo(...q);
          g.lineWidth = 6;
          g.strokeStyle = '#0c0c0c';
          g.lineJoin = 'round';
          g.stroke();
        }
      });
      /* the eye: an almond along the body above the corner, the forward end lower, the pupil forward under the lid */
      const qb = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
      const F = [0.6, 0.13],
        B2 = [0.86, 0.2],
        top = [0.71, 0.27],
        bot = [0.76, 0.12],
        E = [];
      for (let i = 0; i <= 12; i++) E.push(PX(...qb(F, top, B2, i / 12), side));
      for (let i = 12; i >= 0; i--) E.push(PX(...qb(F, bot, B2, i / 12), side));
      for (let i = 1; i < E.length; i++) if (Math.abs(E[i][0] - E[0][0]) > W / 2) E[i][0] += E[i][0] < E[0][0] ? W : -W;
      const pu = PX(0.69, 0.175, side);
      if (Math.abs(pu[0] - E[0][0]) > W / 2) pu[0] += pu[0] < E[0][0] ? W : -W;
      draw(() => {
        g.beginPath();
        g.moveTo(...E[0]);
        for (const q of E) g.lineTo(...q);
        g.closePath();
        g.fillStyle = '#f4f1e4';
        g.fill();
        g.lineWidth = 4;
        g.strokeStyle = '#0c0c0c';
        g.stroke();
        g.beginPath();
        g.ellipse(pu[0], pu[1], 9, 13, 0, 0, 7);
        g.fillStyle = '#0c0c0c';
        g.fill();
      });
    }
    SHK = new THREE.CanvasTexture(c);
    SHK.anisotropy = 4;
    return SHK;
  }
  function sharks() {
    const r = 0.291,
      L = 1.4,
      n = 28,
      pts = [];
    for (let i = n; i >= 0; i--) {
      const d = (i / n) * L,
        e = Math.min(1, d / 0.42),
        rr = d < 0.42 ? r * Math.sqrt(Math.max(0, 1 - (1 - e) * (1 - e))) : r;
      pts.push(new THREE.Vector2(Math.max(rr, 0.004), -d));
    }
    const geo = new THREE.LatheGeometry(pts, 40);
    geo.rotateZ(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({ map: sharkTex(), transparent: true, alphaTest: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      grp = new THREE.Group();
    for (const [x, y, z] of TD) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + 0.002, y, z);
      m.renderOrder = 1;
      grp.add(m);
    }
    return grp;
  }
  /* her bow wave, the wake and the rooster tail: sheets of foam (a speckled texture fading away from the boat) */
  let FOAM = null;
  function foamTex() {
    if (FOAM) return FOAM;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d');
    for (let i = 0; i < 2600; i++) {
      const u = Math.random(),
        v = Math.random(),
        a = (1 - u) * (1 - u) * (1 - Math.abs(v - 0.5) * 1.6) * (0.35 + Math.random() * 0.65);
      if (a <= 0) continue;
      g.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      g.beginPath();
      g.arc(u * 256, v * 64, 1 + Math.random() * 3.5 * (1 - u * 0.6), 0, 6.3);
      g.fill();
    }
    FOAM = new THREE.CanvasTexture(c);
    return FOAM;
  }
  function spray() {
    const mat = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      g = new THREE.Group(),
      /* a quad: a, b at the boat (u = 0), c, d at the far end (u = 1) */
      quad = (a, b, c, d) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0], 2));
        const m = new THREE.Mesh(geo, mat);
        m.renderOrder = 2;
        return m;
      };
    for (const k of [1, -1]) {
      /* the bow wave peeling off the chine and curling out */
      g.add(quad([X(17.5), 0.15, k * 2.75], [X(16.5), 0.75, k * 3.3], [X(6), 0.9, k * 6.0], [X(7), 0.05, k * 4.2]));
      /* the wake: an arm opening astern on each side */
      g.add(quad([X(0.3), 0.06, k * 0.6], [X(0.3), 0.06, k * 3.0], [X(-55), 0.06, k * 20], [X(-55), 0.06, k * 6]));
    }
    /* the rooster tail off the three screws */
    g.add(quad([X(0), 0.2, -1.5], [X(0), 0.2, 1.5], [X(-16), 2.2, 0.8], [X(-16), 2.2, -0.8]));
    g.add(quad([X(-16), 2.2, -0.8], [X(-16), 2.2, 0.8], [X(-34), 0.06, 2.4], [X(-34), 0.06, -2.4]));
    return g;
  }
  function build(num) {
    TD.length = 0;
    const a = new GX.Acc();
    a.add(hull(), null);
    a.add(rails(), null);
    a.add(details(), null);
    const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.material.userData.cs = 1;
    paint(m.material);
    const grp = new THREE.Group();
    grp.add(m, number(num || '105'), sharks());
    const sp = spray();
    grp.add(sp);
    grp.userData.spray = sp;
    return grp;
  }
  /* the high-speed target sled: a wooden planing sled about 9 m long, upturned at the bow, on two skids, carrying a canvas screen
     on a wooden frame painted with a destroyer's silhouette, a flag staff and the towing bridle. Origin at the screen's centre
     (so the hit box sits on the target), the sled's bottom 1.5 m below it */
  function sled() {
    const P = [],
      { part, bx, cyl } = GX,
      B = (sx, sy, sz, hex, x, y, z, rx, ry, rz) => P.push(part(bx(sx, sy, sz), hex, x, y, z, rx, ry, rz)),
      C = (r1, r2, h, hex, x, y, z, rx, ry, rz) => P.push(part(cyl(r1, r2, h, 8), hex, x, y, z, rx, ry, rz)),
      WOOD = 0x8a6a44,
      y0 = -1.5;
    B(8.0, 0.3, 3.4, WOOD, -0.5, y0 + 0.15, 0);
    B(1.6, 0.3, 3.4, WOOD, 4.1, y0 + 0.45, 0, 0, 0, 0.42) /* the upturned bow */;
    for (const z of [-1.5, 1.5]) B(9.2, 0.22, 0.22, 0x5e4a30, 0, y0 - 0.02, z);
    for (const x of [-3.8, -1.3, 1.2]) B(0.2, 0.12, 3.5, 0x6e5434, x, y0 + 0.36, 0);
    /* the screen: posts, battens and the canvas, with the silhouette of a destroyer on it */
    for (const x of [-4.0, -1.3, 1.4, 3.6]) C(0.08, 0.1, 3.4, WOOD, x, y0 + 1.95, 0);
    for (const y of [y0 + 0.75, y0 + 3.55]) B(8.0, 0.12, 0.12, WOOD, -0.2, y, 0);
    B(7.8, 2.7, 0.05, 0xdcd8c8, -0.2, y0 + 2.15, 0);
    const SIL = 0x34383c;
    for (const k of [0.04, -0.04]) {
      B(7.2, 0.5, 0.02, SIL, -0.2, y0 + 1.05, k);
      B(1.0, 0.45, 0.02, SIL, 2.2, y0 + 1.5, k);
      B(1.5, 0.7, 0.02, SIL, 0.9, y0 + 1.65, k);
      B(0.45, 0.85, 0.02, SIL, -0.2, y0 + 1.7, k);
      B(0.45, 0.75, 0.02, SIL, -1.2, y0 + 1.65, k);
      B(0.08, 1.6, 0.02, SIL, 0.6, y0 + 2.4, k);
      B(1.0, 0.35, 0.02, SIL, -2.6, y0 + 1.45, k);
    }
    /* the flag staff with a red flag, the bridle to the tow line */
    C(0.04, 0.04, 2.0, 0x8a8a7a, -4.0, y0 + 4.6, 0) /* the flag staff, carried up from the after screen post */;
    B(0.02, 0.5, 0.8, 0xd02a20, -4.0, y0 + 5.3, 0.43) /* the red flag, its hoist on the staff */;
    for (const z of [-1.4, 1.4]) C(0.025, 0.025, 2.4, 0x2a2a24, 4.9 + 1.0, y0 + 0.75, z * 0.5, Math.PI / 2 + Math.sign(z) * 0.95, 0, Math.PI / 2);
    const a = new GX.Acc();
    a.add(P, null);
    const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.material.userData.cs = 1;
    return m;
  }
  return { build, sled, L, X, yd, hb, dy, BITT: [X(0.7), dy(0.7, 0) + 0.45, 0] };
})();
