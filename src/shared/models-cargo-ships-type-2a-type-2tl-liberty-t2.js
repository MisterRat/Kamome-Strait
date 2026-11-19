/* ---------- cargo ships, built from the research (docs/research_1945_bases.md) ----------
   Real sizes in metres, bow toward +x, waterline at y = 0, keel at -draught, port side at -z. One builder, a spec per type:
   hull (lofted, flat-plate sections for the Japanese wartime standard ships), islands, hatches, masts and derricks, funnel, catwalk,
   and the 1945 paint (Japanese grey-green with dark-green disruptive bands over red-brown antifouling and a thin black boot-top;
   Liberty haze grey; T2 in Measure 22, Navy Blue to the main deck edge and haze grey above). */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2;
  const ship = (S) => {
    const P = [],
      L = S.L,
      X0 = -L / 2,
      B = S.B / 2,
      D = S.T,
      F = S.fb /* freeboard to the main deck amidships */;
    /* half-beam along the length: square amidships, flat-plate (faceted) or curved toward the ends */
    const beam = (t) => {
      if (t < S.aft) {
        const k = t / S.aft;
        return S.flat ? 0.55 + 0.45 * k : 0.5 + 0.5 * Math.sin(k * Z);
      }
      if (t > S.fwd) {
        const k = (t - S.fwd) / (1 - S.fwd);
        return Math.max(0.02, S.flat ? 1 - Math.pow(k, 1.15) : Math.cos(k * Z * 0.98));
      }
      return 1;
    };
    const keelUp = (t) => (t > 0.93 ? Math.pow((t - 0.93) / 0.07, 1.4) * D * 0.85 : t < 0.05 ? (1 - t / 0.05) * D * 0.55 : 0);
    const sheer = (t) => F + S.sheer * (Math.pow(Math.max(0, (t - 0.5) / 0.5), 2) + 0.5 * Math.pow(Math.max(0, (0.5 - t) / 0.5), 2));
    P.push(
      ...GX.loft({
        L,
        X0,
        N: 34,
        sect: (t) => {
          const b = B * beam(t),
            k = -D + keelUp(t),
            d = sheer(t),
            bil = Math.min(S.bilge, b * 0.9);
          return [
            [k, 0],
            [k, Math.max(0.01, b - bil)],
            [Math.max(k, -D + bil), b],
            [Math.max(k, -0.5), b],
            [Math.max(k, 0.3), b],
            [Math.min(d, Math.max(k, 2.0)), b],
            [d, b],
          ];
        },
        paint: (y) => (y < -0.5 ? S.bottom : y < 0.3 ? S.boot : S.side),
        deck: S.deck,
        transom: S.cruiser ? null : S.side,
      }),
    );
    /* bulwark cap */
    P.push(part(bx(L * 0.86, 0.12, B * 2 + 0.1), 0x2a2c2c, X0 + L * 0.47, F + 0.06, 0));
    /* EVERYTHING STACKS on what is under it: topAt(x, z) is the highest top already built there (the main deck, an island, a tier) */
    const tops = [];
    const topAt = (x, z) => tops.reduce((y, q) => (x >= q[0] && x <= q[1] && Math.abs(z || 0) <= q[3] ? Math.max(y, q[2]) : y), F);
    /* islands: [x0, x1, height above the main deck, width fraction, colour] (forecastle, bridge, poop, engine house) */
    for (const [a, b, h, wf, c] of S.islands) {
      const y0 = F - 0.1;
      P.push(part(bx(b - a, h + 0.1, B * 2 * wf), c, (a + b) / 2, y0 + (h + 0.1) / 2, 0));
      tops.push([a, b, F + h, B * wf]);
      if (h > 2.5 && wf < 0.95)
        for (const s of [-1, 1]) for (let x = a + 1.5; x < b - 1; x += 2.2) P.push(part(bx(0.9, 0.7, 0.02), 0x161c20, x, F + h - 1.0, s * (B * wf + 0.005)));
    }
    /* bridge house tiers, each on what is under it; wheelhouse windows on the front, a roof plate on top */
    for (const [x, w, d, , c] of S.tiers) {
      const y = topAt(x, 0);
      P.push(part(bx(d, 2.6, w), c, x, y + 1.3, 0), part(bx(0.02, 0.9, w * 0.8), 0x161c20, x + d / 2 + 0.005, y + 1.6, 0));
      P.push(part(bx(d + 0.6, 0.12, w + 0.6), 0x2e3030, x, y + 2.66, 0));
      tops.push([x - d / 2, x + d / 2, y + 2.72, w / 2]);
    }
    /* hatches with their coamings (standing on the deck): [x, length, width] */
    for (const [x, l, w] of S.hatch) P.push(part(bx(l + 0.5, 0.9, w + 0.5), S.coam, x, F + 0.45, 0), part(bx(l, 0.18, w), S.hatchTop, x, F + 0.95, 0));
    /* masts: goalposts (two posts and a crossbar), kingposts, pole masts, standing on the deck; each derrick's heel on its post, its head
       held up by a topping lift from the masthead */
    for (const m of S.masts) {
      const [kind, x, h] = m,
        c = S.mast,
        y0 = topAt(x, 0) - 0.2,
        zs = kind === 'goal' ? [-3.2, 3.2] : kind === 'king' ? [-2.6, 2.6] : [0];
      for (const z of zs) P.push(GX.rod([x, y0, z], [x, F + h, z], kind === 'pole' ? 0.4 : 0.36, c, kind === 'pole' ? 0.25 : 0.3, 8));
      if (kind === 'goal') P.push(part(bx(0.6, 0.6, 7.0), c, x, F + h - 0.3, 0));
      if (kind === 'pole') P.push(part(bx(0.25, 0.25, 5), c, x, F + h * 0.8, 0));
      for (const dir of m[3] || [1, -1])
        for (const z of kind === 'pole' ? [-0.6, 0.6] : zs) {
          const zp = kind === 'pole' ? 0 : z,
            heel = [x + dir * 0.35, F + 2.0, zp],
            head = [x + dir * 10, F + h * 0.62, z * 0.7];
          P.push(GX.rod(heel, head, 0.18, c, 0.12, 6), GX.rod(head, [x, F + h - 0.5, zp], 0.03, 0x2a2a2a, 0.03, 4));
        }
    }
    /* funnel, on the house top under it */
    if (S.funnel) {
      const [x, h, r, c] = S.funnel,
        y = topAt(x, 0) - 0.1;
      P.push(part(cyl(r, r * 1.06, h, 14), c, x, y + h / 2, 0, 0, 0, 0, 1.25, 1, 1), part(cyl(r * 1.02, r * 1.02, 0.6, 14), 0x1a1a1a, x, y + h - 0.3, 0, 0, 0, 0, 1.25, 1, 1));
    }
    /* catwalk (tankers): an elevated walkway on stanchions standing on the deck, from the bridge island to the engine house and on to
       the forecastle, with the deck piping beneath it and the tank hatches */
    if (S.catwalk) {
      const [a, b] = S.catwalk,
        yw = F + 2.4;
      P.push(part(bx(b - a + 0.6, 0.15, 1.1), S.walk, (a + b) / 2, yw, 0));
      for (let x = a + 1; x < b; x += 6) for (const z of [0.45, -0.45]) P.push(GX.rod([x, F - 0.05, z], [x, yw, z], 0.08, S.walk, 0.08, 4));
      for (const z of [-2.2, -1.2, 1.2, 2.2]) P.push(part(cyl(0.18, 0.18, b - a, 6), 0x3a3a36, (a + b) / 2, F + 0.15, z, 0, 0, Z));
      for (let x = a + 4; x < b - 2; x += 10) for (const s of [-1, 1]) P.push(part(cyl(0.45, 0.45, 0.4, 8), 0x3a3a36, x, F + 0.15, s * 4.5));
    }
    /* guns of the armed guard (US) or a stern gun (Japan): a tub on the top under it, the barrel from the mount */
    for (const [x] of S.guns || []) {
      const y = topAt(x, 0) - 0.05;
      P.push(part(cyl(1.6, 1.7, 1.2, 10), S.side2 || S.side, x, y + 0.6, 0), part(cyl(0.12, 0.12, 4, 6), 0x2a2a2a, x + 1.9, y + 1.0, 0, 0, 0, -Z));
    }
    /* Japanese disruptive camouflage: diagonal, wavy dark-green bands across every vertical surface painted the hull colour */
    if (S.camo) {
      const cf = (x, y) => (Math.sin(x / 6.5 + y / 2.2 + 0.9 * Math.sin(x / 21)) > 0.5 ? S.camo : S.side);
      P.forEach((q) => q.hex === S.side && ((q.cf = cf), (q.cfE = 2.5)));
    }
    /* ensign staff at the stern */
    {
      const y = topAt(X0 + 1.2, 0) - 0.05;
      P.push(part(cyl(0.06, 0.08, 4, 6), 0x555555, X0 + 1.2, y + 2, 0), ...FLG.at(S.flag, 2.4, X0 + 1.15, y + 3.9, 0, Math.PI));
    }
    return P;
  };
  /* Japanese colours (1945): light grey-green, dark pine-green bands, red-brown antifouling, thin black boot-top, red-brown decks */
  const JG = 0x7c876e,
    JG2 = 0x3f4d38,
    JRED = 0x6b3a2a,
    JDECK = 0x5d4434,
    WOOD = 0x8a7a5c;
  /* US 1945: haze grey 5-H, Navy Blue 5-N, deck blue 20-B, antifouling red, black boot-top */
  const HAZE = 0x7f868c,
    NAVY = 0x3a4652,
    DECKB = 0x48525c,
    URED = 0x6e2e26,
    BLK = 0x1c1c1c;
  /* Type 2A wartime standard cargo ship: 137.0 x 18.2 m, 7.8 m draught; flat-plate hull, four holds, goalpost masts, central house */
  MODELS.add('jp-type2a', () =>
    ship({
      L: 137, B: 18.2, T: 7.8, fb: 3.6, sheer: 1.6, bilge: 1.2, flat: true, aft: 0.1, fwd: 0.82, cruiser: false, flag: 'jp', poopH: 2.6,
      bottom: JRED, boot: BLK, side: JG, deck: JDECK, camo: JG2, coam: JG, hatchTop: WOOD, mast: JG, walk: JG,
      islands: [[50, 68.5, 2.6, 1, JG], [-12, 12, 2.8, 1, JG], [-68.5, -56, 2.6, 1, JG]],
      tiers: [[2, 13, 12, 6.4, 0x8a9480], [3, 9, 8, 9.0, 0x8a9480]],
      hatch: [[42, 11, 9], [26, 11, 9], [-22, 11, 9], [-40, 11, 9]],
      masts: [['goal', 34, 14], ['goal', -31, 14]],
      funnel: [-6, 9, 1.8, JG], funnelY: 2.8,
      guns: [[-63, 2.6]],
    }),
  { L: 137, W: 18.2, D: 7.8, name: 'Type 2A wartime standard cargo ship' });
  /* Type 2TL wartime standard tanker: 153.5 x 20.0 m, 9.1 m draught; engine and funnel far aft, midships bridge, flying catwalk, two kingposts */
  MODELS.add('jp-type2tl', () =>
    ship({
      L: 153.5, B: 20, T: 9.1, fb: 2.8, sheer: 1.4, bilge: 1.4, flat: true, aft: 0.08, fwd: 0.84, cruiser: false, flag: 'jp', poopH: 6,
      bottom: JRED, boot: BLK, side: JG, deck: JDECK, camo: JG2, coam: JG, hatchTop: JG, mast: JG, walk: JG,
      islands: [[62, 76.75, 2.6, 1, JG], [8, 24, 3.0, 0.8, JG], [-76.75, -52, 6, 1, JG]],
      tiers: [[16, 12, 10, 5.8, 0x8a9480], [17, 8, 6, 8.4, 0x8a9480], [-63, 14, 10, 8.8, 0x8a9480]],
      hatch: [],
      masts: [['king', 44, 13, [1]], ['king', -30, 13, [-1]]],
      funnel: [-70, 7, 2.0, JG], funnelY: 8.8,
      catwalk: [-52, 62],
      guns: [[-73, 6]],
    }),
  { L: 153.5, W: 20, D: 9.1, name: 'Type 2TL wartime standard tanker' });
  /* Liberty ship EC2-S-C1: 134.6 x 17.3 m, 8.5 m draught; plumb bow, central island, five holds, three masts with paired derricks; Measure 13 */
  MODELS.add('us-liberty', () =>
    ship({
      L: 134.6, B: 17.3, T: 8.5, fb: 3.9, sheer: 1.8, bilge: 1.6, flat: false, aft: 0.1, fwd: 0.86, cruiser: true, flag: 'us', poopH: 2.6,
      bottom: URED, boot: BLK, side: HAZE, deck: DECKB, coam: HAZE, hatchTop: 0x5d6048, mast: HAZE, walk: HAZE,
      islands: [[54, 67.3, 2.6, 1, HAZE], [-10, 12, 2.8, 1, HAZE], [-67.3, -58, 2.6, 1, HAZE]],
      tiers: [[4, 14, 12, 6.4, HAZE], [5, 10, 8, 9.0, HAZE]],
      hatch: [[46, 10, 8.5], [32, 12, 8.5], [20, 8, 8.5], [-22, 12, 8.5], [-40, 12, 8.5]],
      masts: [['pole', 40, 18], ['pole', 26, 18], ['pole', -32, 18]],
      funnel: [-3, 7, 1.5, HAZE], funnelY: 8.6,
      guns: [[60, 2.6], [-62, 2.6]],
    }),
  { L: 134.6, W: 17.3, D: 8.5, name: 'Liberty ship EC2-S-C1' });
  /* T2-SE-A1 tanker: 159.6 x 20.7 m, 9.2 m draught; raised forecastle, amidships bridge, centreline catwalk, aft engine house; Measure 22 */
  MODELS.add('us-t2', () =>
    ship({
      L: 159.6, B: 20.7, T: 9.2, fb: 3.0, sheer: 1.4, bilge: 1.5, flat: false, aft: 0.08, fwd: 0.85, cruiser: true, flag: 'us', poopH: 6, m22: true,
      bottom: URED, boot: BLK, side: NAVY, side2: HAZE, deck: DECKB, coam: HAZE, hatchTop: HAZE, mast: HAZE, walk: DECKB,
      islands: [[64, 79.8, 2.8, 1, HAZE], [10, 26, 3.0, 0.8, HAZE], [-79.8, -54, 6, 1, HAZE]],
      tiers: [[18, 13, 10, 6, HAZE], [19, 9, 6, 8.6, HAZE], [-66, 15, 10, 9, HAZE]],
      hatch: [],
      masts: [['king', 46, 14, [1]], ['king', -36, 14, [-1]]],
      funnel: [-72, 7, 2.2, HAZE], funnelY: 9,
      catwalk: [-54, 64],
      guns: [[72, 2.8], [-76, 6]],
    }),
  { L: 159.6, W: 20.7, D: 9.2, name: 'T2-SE-A1 tanker' });
})();
