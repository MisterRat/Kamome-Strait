/* ---------- the Fulton-class submarine tender (AS-11 to AS-19): USS Sperry (AS-12), Submarine Base Lockwood's tender ----------
   Rebuilt 2026-11-24 from the user's References/Fulton-class:
   - HAER CA-342 (National Park Service, 2009) on Sperry herself: 530 ft 7 in overall (161.73 m), beam 73 ft 4 in (22.35 m), draught
     22 ft 5 in (6.83 m); two 20-ton electric cranes aft, two 5-ton derricks abaft the bridge, the pilothouse at the superstructure's
     forward end with bridge wings and searchlights; in the war two single 5"/38s on the bow and two on the stern, four twin 40 mm
     on the superstructure, the Mk 51 directors, motor launches aft;
   - the ONI-style Fulton-class profile (with its height scale in feet) for heights and the fore-and-aft places: main deck about
     25 ft above the water amidships rising to 30 ft at the stern, the forecastle rising to 44 ft at the stem, two galleried decks of
     shops and berthing from the stern guns to the bridge (top 45 ft), the bridge a third of the way back from the bow with the lattice
     director tower abaft it (90 ft), the foremast abaft that (about 130 ft), one tall narrow funnel amidships (75 ft), the crane
     posts and mainmast aft (about 120 ft), boats on the top deck;
   - the 1941 Fulton (AS-11) profile print, the class model, and the photographs of Sperry under way, for shapes.
   (as1ga1914.pdf in the same folder is the 1914 USS Fulton, AS-1, a different and much smaller ship: not used.)
   Bow toward +x, waterline at y = 0, port side at -z. Measure 22: Navy Blue hull, haze grey above. Every part rests on the part
   below it (tools/connectivity.py, and the user's 2026-11-24: nothing hanging in empty space). */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    L = 161.73,
    X0 = -L / 2,
    B = 22.35 / 2,
    D = 6.83,
    F = 7.9 /* main deck above the waterline amidships */,
    U = 10.8 /* one deck up: the top of the first gallery deck, and the forecastle deck at the break */,
    S = 13.7 /* the superstructure deck (top of the second gallery deck) */,
    H3 = 16.5 /* the top of the deckhouses on the superstructure deck */,
    TA = 0.735,
    TB = 0.757 /* the forecastle break, hidden inside the superstructure's front */,
    NAVY = 0x3a4652,
    HAZE = 0x7f868c,
    HAZE2 = 0x737a80,
    DECKB = 0x48525c,
    URED = 0x6e2e26,
    BLK = 0x1c1c1c,
    WIN = 0x161c20,
    BAY = 0x2a3036,
    GUN = 0x5f666c,
    WIRE = 0x2a2a2a;
  const tx = (x) => (x - X0) / L;
  /* half-breadths (fractions of B): at the waterline and below, and at the deck edge (the bow flares out above the water) */
  const bWL = (t) => (t < 0.07 ? 0.25 + 0.75 * Math.sin((t / 0.07) * Z) : t > 0.64 ? Math.cos(((t - 0.64) / 0.36) * Z * 0.985) : 1);
  const bTop = (t) => (t < 0.07 ? 0.4 + 0.6 * Math.sin((t / 0.07) * Z) : t > 0.7 ? Math.cos(Math.pow((t - 0.7) / 0.3, 1.25) * Z * 0.97) : 1);
  const keelUp = (t) => (t > 0.94 ? Math.pow((t - 0.94) / 0.06, 1.5) * D * 0.9 : t < 0.05 ? (1 - t / 0.05) * D * 0.6 : 0);
  /* the deck at the side: main deck with its sheer aft, then (past the break) the forecastle rising to 44 ft at the stem */
  const deckT = (t) => {
    const lo = F + 1.1 * Math.pow(Math.max(0, (0.3 - t) / 0.3), 2),
      hi = U + 2.5 * Math.pow(Math.max(0, (t - TB) / (1 - TB)), 2);
    return t <= TA ? lo : t >= TB ? hi : lo + ((hi - lo) * (t - TA)) / (TB - TA);
  };
  const deckY = (x) => deckT(tx(x));
  const sect = (t) => {
    const w = B * bWL(t),
      wt = B * bTop(t),
      k = -D + keelUp(t),
      d = deckT(t),
      bil = Math.min(2.6, w * 0.9);
    return [
      [k, 0],
      [k, Math.max(0.01, w - bil)],
      [Math.max(k, -D + bil), w],
      [Math.max(k, -0.6), w],
      [Math.max(k, 0.3), w],
      [Math.min(d, Math.max(k, 2.0)), w + (wt - w) * 0.25],
      [d, wt],
    ];
  };
  /* the hull's half-breadth at height y at station t (so fittings on the side sit on the plating) */
  const hbAt = (t, y) => {
    const s = sect(t);
    for (let i = 0; i < s.length - 1; i++) if (y >= s[i][0] && y <= s[i + 1][0]) return s[i][1] + ((s[i + 1][1] - s[i][1]) * (y - s[i][0])) / Math.max(1e-6, s[i + 1][0] - s[i][0]);
    return s[s.length - 1][1];
  };
  const tender = (far) => {
    const P = [];
    const box = (x0, x1, y0, y1, hw, c) => P.push(part(bx(x1 - x0, y1 - y0, hw * 2), c, (x0 + x1) / 2, (y0 + y1) / 2, 0));
    const slab = (x0, x1, y, hw) => P.push(part(bx(x1 - x0 + 0.5, 0.12, hw * 2 + 0.5), 0x2e3236, (x0 + x1) / 2, y + 0.06, 0)) /* a deck edge, resting on the deck below */;
    /* THE HULL: a cruiser stern, straight sides for most of her length, a fine flared bow */
    P.push(...GX.loft({ L, X0, N: far ? 24 : 64, sect, paint: (y) => (y < -0.6 ? URED : y < 0.3 ? BLK : NAVY), deck: DECKB, transom: null }));
    if (!far)
      for (const s of [-1, 1]) for (let x = X0 + L * 0.08; x < X0 + L * 0.73; x += 3.1) P.push(part(bx(0.45, 0.45, 0.02), WIN, x, F - 1.3, s * (B + 0.006))) /* scuttles */;
    /* THE GALLERY DECKS: shops, berthing and offices, two decks from the stern guns to the bridge, open bays along their sides */
    const g1 = [-70, 43.2, 10.75],
      g2 = [-63, 43.2, 10.15];
    box(g1[0], g1[1], F - 0.4, U, g1[2], HAZE);
    slab(g1[0], g1[1], U, g1[2]);
    box(g2[0], g2[1], U, S, g2[2], HAZE2);
    slab(g2[0], g2[1], S, g2[2]);
    for (const [a, b, hw, y] of [
      [g1[0] + 2, g1[1] - 1, g1[2], (deckY(g1[0]) + U) / 2 + 0.2],
      [g2[0] + 2, g2[1] - 1, g2[2], (U + S) / 2],
    ])
      for (const s of [-1, 1]) {
        P.push(part(bx(b - a, 1.4, 0.02), BAY, (a + b) / 2, y, s * (hw + 0.006)));
        if (!far) for (let x = a; x <= b + 0.01; x += (b - a) / Math.round((b - a) / 5.2)) P.push(part(bx(0.35, 1.5, 0.06), HAZE, x, y, s * (hw + 0.03)));
      }
    /* THE DECKHOUSES on the superstructure deck: aft (the cranes and mainmast), the funnel's casing, and the bridge block forward */
    const hA = [-40, -18, 4.5],
      hF = [-10, 6, 4],
      hB = [6, 44, 6.5];
    for (const [a, b, hw, c] of [
      [...hA, HAZE],
      [...hF, HAZE2],
      [...hB, HAZE],
    ]) {
      box(a, b, S - 0.1, H3, hw, c);
      slab(a, b, H3, hw);
      if (!far) for (const s of [-1, 1]) for (let x = a + 1.5; x < b - 1; x += 3) P.push(part(bx(0.6, 0.5, 0.02), WIN, x, S + 1.7, s * (hw + 0.006)));
    }
    /* THE BRIDGE: chart house and CIC, the pilothouse forward with its windows, the open bridge wings with searchlights, the roof
       with the two Mk 51 directors */
    box(27, 36, H3, 19.2, 4.5, HAZE2);
    box(36, 43, H3, 19.2, 5.5, HAZE);
    P.push(part(bx(0.02, 0.8, 10), WIN, 43.01, 18.3, 0));
    P.push(part(bx(5, 0.3, 18), HAZE, 39.5, H3 + 0.15, 0)) /* the wings, on the bridge block's top */;
    P.push(part(bx(8.4, 0.15, 11.8), 0x2e3236, 39.1, 19.275, 0)) /* the pilothouse and chart house roof */;
    for (const s of [-1, 1]) {
      P.push(part(cyl(0.45, 0.5, 0.25, 10), HAZE2, 39.5, 19.35 + 0.125, s * 3), part(bx(0.9, 0.7, 0.9), HAZE2, 39.5, 19.6 + 0.35, s * 3)) /* Mk 51 */;
      if (!far) P.push(part(cyl(0.12, 0.12, 0.5, 6), HAZE2, 39.5, H3 + 0.55, s * 8.3), part(cyl(0.45, 0.45, 0.6, 10), 0x9aa0a4, 39.5, H3 + 1.1, s * 8.3, 0, 0, Z)) /* searchlights */;
    }
    /* the lattice director tower abaft the bridge: four legs, two platforms, the director on top (90 ft) */
    {
      const x = 10;
      for (const dx of [-1.6, 1.6]) for (const dz of [-1.6, 1.6]) P.push(GX.rod([x + dx, H3, dz], [x + dx * 0.7, 26, dz * 0.7], 0.14, HAZE2, 0.12, 6));
      const o = (y) => 1.6 - (0.48 * (y - H3)) / (26 - H3) /* the legs' offset at height y: they lean in */;
      if (!far)
        for (const y of [18.5, 22]) {
          const y2 = y + 3,
            a = o(y),
            b = o(y2);
          for (const s of [-1, 1]) P.push(GX.rod([x - a, y, s * a], [x + b, y2, s * b], 0.06, HAZE2, 0.06, 4), GX.rod([x + s * a, y, -a], [x + s * b, y2, b], 0.06, HAZE2, 0.06, 4));
        }
      P.push(part(bx(3.6, 0.25, 3.6), HAZE, x, 26.125, 0), part(bx(2.2, 1.15, 2.2), HAZE2, x, 26.25 + 0.575, 0), part(bx(0.3, 0.3, 3.4), HAZE2, x, 26.9, 0));
    }
    /* the foremast: a pole on the bridge block, its yard, the SC radar near the top; the two 5-ton derricks on its heel, topped up aft */
    {
      const xm = 23.8;
      P.push(GX.rod([xm, H3, 0], [xm, 40, 0], 0.36, HAZE, 0.17, 8), part(bx(0.3, 0.3, 10), HAZE, xm, 33, 0), part(bx(0.25, 1.8, 2.6), 0x2a2e30, xm + 0.28, 38, 0));
      for (const s of [-1, 1]) {
        const head = [15.6, 25.2, s * 2.4];
        P.push(GX.rod([xm - 0.25, H3 + 1.4, s * 0.25], head, 0.2, HAZE2, 0.14, 6));
        if (!far) P.push(GX.rod(head, [xm, 32, 0], 0.03, WIRE, 0.03, 4));
      }
    }
    /* the funnel: one tall, narrow, oval, raked a little, on its casing (75 ft) */
    {
      const xf = -2.9;
      P.push(part(cyl(1.9, 1.95, 6.8, 16), HAZE, xf, H3 - 0.3 + 3.4, 0, 0, 0, 0.04, 1.24, 1, 1), part(cyl(1.93, 1.93, 0.6, 16), BLK, xf - 0.12, 22.6, 0, 0, 0, 0.04, 1.24, 1, 1));
    }
    /* the two 20-ton cranes aft, on the centreline either side of the mainmast: a post, the machinery house, a long boom (the after
       one stowed pointing aft, the forward one forward), its topping wire to the house */
    for (const [xc, dir] of [
      [-36, -1],
      [-22, 1],
    ]) {
      P.push(part(cyl(1.3, 1.6, 4.5, 12), HAZE2, xc, H3 + 2.25, 0), part(bx(3.4, 3, 3), HAZE2, xc, H3 + 4.5 + 1.5, 0));
      const head = [xc + dir * 14, 30.5, 0];
      P.push(GX.rod([xc + dir * 1.6, 22.4, 0], head, 0.45, HAZE, 0.3, 6), GX.rod(head, [xc, H3 + 7.4, 0], 0.04, WIRE, 0.04, 4));
      P.push(part(bx(0.5, 0.9, 0.5), 0x24282a, head[0] + dir * 0.1, 30.5 - 0.6, 0)) /* the hook block, hauled up to the boom head */;
    }
    /* the mainmast between the cranes */
    P.push(GX.rod([-29, H3, 0], [-29, 37, 0], 0.3, HAZE, 0.16, 8), part(bx(0.25, 0.25, 8), HAZE, -29, 31, 0));
    /* the motor launches and whaleboats on chocks on the superstructure deck */
    for (const s of [-1, 1])
      for (const x of [-52.5, -14.5]) {
        const z = s * 7;
        for (const dx of [-2.6, 2.6]) P.push(part(bx(0.5, 0.6, 2), 0x5a4a38, x + dx, S + 0.3, z));
        P.push(part(bx(8, 1.3, 2.4), 0x8e9498, x, S + 0.6 + 0.65, z));
        if (!far) P.push(part(bx(4, 0.8, 1.9), 0x8e9498, x + 0.6, S + 1.9 + 0.4, z), part(bx(7.6, 0.06, 2.2), 0x5a4a38, x, S + 1.9 + 0.03, z));
      }
    /* the four 5"/38s in open single mounts with shields: two on the bow (the forecastle, and above it on its gun house), two on the
       stern (on the gallery decks' stepped after ends); the barrels fore and aft */
    const gun = (x, y, dir) => {
      P.push(part(cyl(1.6, 1.8, 0.6, 12), HAZE2, x, y + 0.3, 0), part(bx(2.4, 1.7, 2.6), HAZE, x - dir * 0.2, y + 1.45, 0));
      P.push(part(cyl(0.11, 0.13, 5.4, 8), GUN, x + dir * 3.6, y + 1.5, 0, 0, 0, dir * -Z));
    };
    box(43.2, 52.5, deckY(43.2) - 0.3, S, 3.5, HAZE) /* the forward gun house */;
    slab(43.2, 52.5, S, 3.5);
    gun(48.6, S + 0.12, 1);
    gun(60.8, deckY(60.8) - 0.05, 1);
    gun(-59, S + 0.12, -1);
    gun(-66.5, U + 0.12, -1);
    /* the four twin 40 mm in tubs on the superstructure deck: abreast the director tower and abaft the after deckhouse */
    for (const [x, s] of [
      [10, -1],
      [10, 1],
      [-46, -1],
      [-46, 1],
    ]) {
      const z = s * 8.7,
        y = S + 0.12;
      P.push(part(cyl(1.4, 1.4, 1.1, 12), HAZE2, x, y + 0.55, z), part(bx(1, 0.6, 0.9), GUN, x, y + 1.1 + 0.3, z));
      for (const dz of [-0.25, 0.25]) P.push(part(cyl(0.06, 0.06, 2.6, 6), GUN, x + 1.6, y + 1.45, z + dz, 0, 0, -Z));
    }
    /* on the forecastle: the windlass, the anchors in their hawses; the jack staff at the stem and the ensign staff at the stern */
    if (!far) {
      const xw = 66;
      P.push(part(bx(2.6, 1.1, 4.4), 0x2a2e30, xw, deckY(xw) + 0.5, 0));
      const xa = X0 + L * 0.95,
        ya = deckY(xa) - 1.6,
        za = hbAt(0.95, ya);
      for (const s of [-1, 1]) P.push(part(bx(1.4, 1.6, 0.5), BLK, xa, ya, s * (za + 0.1)));
      const xj = X0 + L - 2.2,
        yj = deckY(xj);
      P.push(part(cyl(0.05, 0.07, 4, 6), 0x555555, xj, yj + 2, 0));
      const xs = X0 + 1.6,
        ys = deckY(xs);
      P.push(part(cyl(0.06, 0.08, 5, 6), 0x555555, xs, ys + 2.5, 0), ...FLG.at('us', 2.4, xs - 0.05, ys + 4.95, 0, Math.PI));
    }
    return P;
  };
  MODELS.add('us-fulton', (o) => tender(!!(o && o.far)), {
    name: 'Fulton-class submarine tender (USS Sperry, AS-12)',
    L,
    W: 22.35,
    D,
  });
})();
