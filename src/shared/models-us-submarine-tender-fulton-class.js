/* ---------- the Fulton-class submarine tender (AS-11 to AS-19): USS Sperry (AS-12), Submarine Base Lockwood's tender ----------
   Sizes from DANFS and the HAER report on Sperry (maritime.dot.gov): 529 ft 6 in to 530 ft 7 in overall (161.4 m), beam 73 ft 4 in
   (22.35 m), draught 22 ft 5 in mean (6.83 m); four single 5"/38 guns, 40 mm twins and 20 mm; complement 1,307. The hull and the
   superstructure were the same as the Dixie-class destroyer tenders' and the Vulcan-class repair ships' (Wikipedia, Fulton class):
   a high-sided hull with a raised forecastle, a long block of shop and berthing decks amidships with the bridge at its forward end,
   one large funnel, heavy cranes either side for lifting torpedoes and machinery out of the boats alongside, boats in davits, and
   the four 5"/38s two forward and two aft, each pair one above the other. Bow toward +x, waterline at y = 0, port side at -z.
   Painted to Measure 22 (Navy Blue to the main deck, haze grey above). */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    L = 161.4,
    X0 = -L / 2,
    B = 22.35 / 2,
    D = 6.83,
    F = 8.2 /* main deck above the waterline amidships */,
    FC = 10.6 /* forecastle deck at its after end */,
    NAVY = 0x3a4652,
    HAZE = 0x7f868c,
    HAZE2 = 0x737a80,
    DECKB = 0x48525c,
    URED = 0x6e2e26,
    BLK = 0x1c1c1c,
    WIN = 0x161c20,
    GUN = 0x5f666c;
  const tender = (far) => {
    const P = [];
    /* the hull: a fine bow and a cruiser stern, square amidships, the forecastle deck rising to the stem */
    const beam = (t) => (t < 0.12 ? 0.55 + 0.45 * Math.sin((t / 0.12) * Z) : t > 0.68 ? Math.max(0.02, Math.cos(((t - 0.68) / 0.32) * Z * 0.98)) : 1);
    const keelUp = (t) => (t > 0.95 ? Math.pow((t - 0.95) / 0.05, 1.4) * D * 0.85 : t < 0.04 ? (1 - t / 0.04) * D * 0.5 : 0);
    const sheer = (t) => (t > 0.62 ? FC + 2.4 * Math.pow((t - 0.62) / 0.38, 2) : F + 0.6 * Math.pow(Math.max(0, (0.25 - t) / 0.25), 2));
    P.push(
      ...GX.loft({
        L,
        X0,
        N: far ? 16 : 40,
        sect: (t) => {
          const b = B * beam(t),
            k = -D + keelUp(t),
            d = sheer(t),
            bil = Math.min(2.6, b * 0.9);
          return [
            [k, 0],
            [k, Math.max(0.01, b - bil)],
            [Math.max(k, -D + bil), b],
            [Math.max(k, -0.6), b],
            [Math.max(k, 0.3), b],
            [Math.min(d, Math.max(k, 2.0)), b],
            [d, b],
          ];
        },
        paint: (y) => (y < -0.6 ? URED : y < 0.3 ? BLK : NAVY),
        deck: DECKB,
        transom: null,
      }),
    );
    /* the forecastle break: the step from the main deck up to the forecastle, plated in */
    const xFc = X0 + L * 0.62;
    P.push(part(bx(0.3, FC - F + 0.1, B * 2 * 0.98), NAVY, xFc, (F + FC) / 2, 0));
    if (!far)
      for (const s of [-1, 1]) for (let x = X0 + 10; x < xFc - 4; x += 3.1) P.push(part(bx(0.45, 0.45, 0.02), WIN, x, F - 1.4, s * (B + 0.006))) /* scuttles along the hull */;
    /* the superstructure: three decks of shops, berthing and offices from aft of the forecastle break to the quarterdeck, the bridge at
       its forward end over the forecastle; each deck a little narrower */
    const S0 = X0 + L * 0.22,
      S1 = xFc + 4;
    const tiers = [
      [S0, S1, F, 2.8, 0.86, HAZE],
      [S0 + 6, S1 - 2, F + 2.8, 2.7, 0.8, HAZE2],
      [S0 + 18, S1 - 6, F + 5.5, 2.6, 0.62, HAZE],
    ];
    for (const [a, b, y, h, wf, c] of tiers) {
      P.push(part(bx(b - a, h, B * 2 * wf), c, (a + b) / 2, y + h / 2, 0), part(bx(b - a + 0.6, 0.12, B * 2 * wf + 0.6), 0x2e3236, (a + b) / 2, y + h + 0.06, 0));
      if (!far) for (const s of [-1, 1]) for (let x = a + 2; x < b - 1.5; x += 2.6) P.push(part(bx(0.7, 0.6, 0.02), WIN, x, y + h * 0.6, s * (B * wf + 0.006)));
    }
    /* the bridge: navigating bridge and pilothouse over the superstructure's forward end, its windows forward, wings either side */
    const xb = S1 - 4,
      yb = F + 8.1;
    P.push(part(bx(7, 2.6, 12), HAZE2, xb, yb + 1.3, 0), part(bx(0.02, 0.9, 10), WIN, xb + 3.51, yb + 1.7, 0), part(bx(7.6, 0.14, 12.6), 0x2e3236, xb, yb + 2.67, 0));
    P.push(part(bx(4, 1.1, B * 2 * 0.95), HAZE, xb + 0.5, yb + 0.55, 0)) /* the wings */;
    P.push(part(bx(3.6, 2.2, 5), HAZE2, xb - 1, yb + 3.8, 0), part(bx(0.02, 0.7, 4), WIN, xb + 0.81, yb + 4.2, 0)) /* the chart house and fire control */;
    /* the foremast: a pole mast on the bridge with a yard and the radar (SC on the topmast) */
    const xm = xb - 2.5;
    P.push(GX.rod([xm, yb + 2.7, 0], [xm, yb + 22, 0], 0.32, HAZE, 0.18, 8), part(bx(0.3, 0.3, 9), HAZE, xm, yb + 16, 0), part(bx(0.25, 1.8, 2.6), 0x2a2e30, xm + 0.3, yb + 20.5, 0));
    /* the funnel: one large, oval, raked a little, on the top deck abaft amidships */
    const xf = X0 + L * 0.4,
      yf = F + 8.1;
    P.push(part(cyl(3.2, 3.4, 9.5, 16), HAZE, xf, yf + 4.75, 0, 0, 0, 0.05, 1.5, 1, 1), part(cyl(3.25, 3.25, 0.7, 16), BLK, xf - 0.25, yf + 9.2, 0, 0, 0, 0.05, 1.5, 1, 1));
    /* the heavy cranes: one each side abreast the funnel, a pedestal and a long lattice boom raised over the side (the boats alongside) */
    for (const s of [-1, 1]) {
      const xc = xf + 13,
        zc = s * (B * 0.62),
        y0 = F + 5.5;
      P.push(part(cyl(1.3, 1.6, 4.5, 12), HAZE2, xc, y0 + 2.25, zc), part(bx(3.4, 3, 3), HAZE2, xc, y0 + 5.9, zc));
      const heel = [xc + 1.6, y0 + 6, zc],
        head = [xc + 13, y0 + 15, zc + s * 7];
      P.push(GX.rod(heel, head, 0.55, HAZE, 0.35, 6), GX.rod(head, [xc, y0 + 7.4, zc], 0.04, 0x2a2a2a, 0.04, 4), GX.rod(head, [head[0], F + 1, head[2]], 0.03, 0x2a2a2a, 0.03, 4));
    }
    /* the mainmast aft, on the superstructure's after end */
    {
      const x = S0 + 10;
      P.push(GX.rod([x, F + 5.5, 0], [x, F + 24, 0], 0.3, HAZE, 0.16, 8), part(bx(0.25, 0.25, 7), HAZE, x, F + 19, 0));
    }
    /* boats in davits along the superstructure's sides */
    for (const s of [-1, 1])
      for (const x of [xf - 12, xf - 22, xf + 24]) {
        const z = s * (B * 0.86 + 1.4),
          y = F + 3.6;
        P.push(part(bx(8.5, 1.3, 2.4), 0x8e9498, x, y, z), part(bx(8, 0.2, 2.1), 0x5a4a38, x, y + 0.6, z));
        for (const dx of [-3.4, 3.4]) P.push(GX.rod([x + dx, F + 2.8, s * (B * 0.86)], [x + dx, F + 5.4, z], 0.12, HAZE2, 0.1, 6));
      }
    /* the four 5"/38s in open single mounts with shields: two forward (the forecastle, and above it on the superstructure's front) and two
       aft (the quarterdeck, and above it on the superstructure's after end); the barrels fore and aft */
    const gun = (x, y, dir) => {
      P.push(part(cyl(1.6, 1.8, 0.6, 12), HAZE2, x, y + 0.3, 0), part(bx(2.4, 1.7, 2.6), HAZE, x - dir * 0.2, y + 1.45, 0));
      P.push(part(cyl(0.11, 0.13, 5.4, 8), GUN, x + dir * 3.6, y + 1.5, 0, 0, 0, dir * -Z));
    };
    gun(X0 + L * 0.79, FC + 0.9, 1);
    gun(S1 + 0.4, F + 5.5, 1);
    gun(X0 + 6, F + 0.4, -1);
    gun(S0 - 4, F + 2.8, -1);
    /* 40 mm twins in tubs at the superstructure's corners */
    for (const [x, s] of [
      [S1 - 2, -1],
      [S1 - 2, 1],
      [S0 + 3, -1],
      [S0 + 3, 1],
    ]) {
      const y = F + 5.5;
      P.push(part(cyl(1.4, 1.4, 1.1, 12), HAZE2, x, y + 0.55, s * (B * 0.62 + 0.8)));
      for (const dz of [-0.25, 0.25]) P.push(part(cyl(0.06, 0.06, 2.6, 6), GUN, x + 1.4, y + 1.4, s * (B * 0.62 + 0.8) + dz, 0, 0, -Z));
    }
    /* the anchors and the windlass on the forecastle; the jack and ensign staffs */
    if (!far) {
      for (const s of [-1, 1]) P.push(part(bx(1.4, 1.6, 0.4), BLK, X0 + L * 0.95, FC + 0.6, s * 2.6));
      P.push(part(bx(2.6, 1.1, 4.4), 0x2a2e30, X0 + L * 0.9, FC + 2.95, 0));
      P.push(part(cyl(0.06, 0.08, 5, 6), 0x555555, X0 + 1.4, F + 2.7, 0), ...FLG.at('us', 2.4, X0 + 1.35, F + 4.5, 0, Math.PI));
      P.push(part(cyl(0.05, 0.07, 3.5, 6), 0x555555, X0 + L - 1.6, FC + 4.2, 0));
    }
    return P;
  };
  MODELS.add('us-fulton', (o) => tender(!!(o && o.far)), {
    name: 'Fulton-class submarine tender (USS Sperry, AS-12)',
    L: 161.4,
    W: 22.35,
    D: 6.83,
  });
})();
