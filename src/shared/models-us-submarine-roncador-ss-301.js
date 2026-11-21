/* ---------- USS RONCADOR (SS-301), a Balao-class fleet submarine, as commissioned (27 March 1945) ----------
   Built by Cramp, Philadelphia. From her own Booklet of General Plans, 1945 (References/Balao Class/ss301bogp1945v2.pdf: the
   outboard profile at 1/8" = 1 ft, the main deck plan and the typical sections) and NavSource: 311 ft 8 in (95.0 m) overall, 27 ft
   3 in (8.31 m) beam, 15 ft 3 in (4.65 m) draught; one 5"/25 deck gun, one 40 mm, two .50 cal (the user's choice, 2026-11-21:
   the American submarine is Roncador, mid-1944 to mid-1945).
   Measured off the profile (feet from her stern, heights from the waterline): the casing deck 7.5 ft up amidships, rising to 12 ft
   at the bow; the bridge fairing from 167 to 210 ft, its gun decks 13.75 ft up, the bridge 18.3 ft; the lookout platform on the
   periscope shears 31.7 ft; No. 2 periscope at 189.8 ft and No. 1 at 192.5 ft, raised to 52 ft; the SJ radar mast at 187.5 ft, 41.7
   ft to its head, the SJ's dish at 32 ft; the 5"/25 aft of the fairing at 150 ft (trained aft as drawn), the 40 mm on the forward gun
   deck at 205 ft, a 20 mm on the after one at 173 ft. The stem meets the waterline at 305 ft (the bow overhangs it); the stern
   tapers to a round tail at the waterline with the screws, the stern planes and the rudder under it.
   The hull: the sections' shape, an egg of the outer hull round the pressure hull, widest a little below the waterline, with the
   narrow free-flooding casing on top (about 58% of the beam, from the deck plan); the limber holes along her sides. Paint from the
   builder's photograph (Delaware River, 1945): light grey sides, dark deck and fairing top, black below the waterline.
   Bow toward +x, the waterline at y = 0. o.far: the distant form (fewer stations, no small fittings). */
(() => {
  const { part, bx, cyl } = GX,
    FT = 0.3048,
    LOA = 311.67,
    F = (ft) => (ft - LOA / 2) * FT /* feet from her stern to x */,
    SIDE = 0x8d9397,
    DECK = 0x3f4447,
    BOOT = 0x26292b,
    GUN = 0x4a5054,
    DARK = 0x1c1e20;
  /* a table lookup with straight-line interpolation: [[t, v], ...] */
  const tab = (T) => (t) => {
    if (t <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++)
      if (t <= T[i][0]) {
        const [a, va] = T[i - 1],
          [b, vb] = T[i];
        return va + ((vb - va) * (t - a)) / (b - a);
      }
    return T[T.length - 1][1];
  };
  /* t: 0 the stern, 1 the bow; from the plans' sections (half-breadth as a fraction of the beam), the keel and the deck from the profile */
  const B = 8.31 / 2,
    W = tab([[0, 0.04], [0.03, 0.2], [0.067, 0.35], [0.088, 0.5], [0.15, 0.65], [0.24, 0.8], [0.3, 0.93], [0.39, 1], [0.6, 1], [0.68, 0.9], [0.75, 0.8], [0.81, 0.62], [0.87, 0.5], [0.92, 0.32], [0.97, 0.12], [1, 0.01]]),
    KD = tab([[0, -0.1], [0.03, -1.2], [0.06, -2.2], [0.1, -2.7], [0.2, -3.96], [0.3, -4.5], [0.35, -4.65], [0.75, -4.65], [0.85, -4.3], [0.92, -3.5], [0.96, -2.2], [0.978, 0], [1, 2.6]]),
    DH = tab([[0, 0.9], [0.04, 1.2], [0.08, 1.55], [0.15, 1.85], [0.3, 2.15], [0.5, 2.29], [0.7, 2.5], [0.8, 2.75], [0.9, 3.1], [0.97, 3.45], [1, 3.66]]);
  /* the outer hull's half-section, keel to the top of the side (u: height fraction, v: breadth fraction), as the sections draw it */
  const SH = [[0, 0], [0.03, 0.29], [0.11, 0.55], [0.25, 0.79], [0.42, 0.95], [0.58, 1], [0.74, 0.96], [0.87, 0.84], [0.95, 0.7], [1, 0.58]];
  const sect = (t) => {
    const w = W(t) * B,
      kd = KD(t),
      dh = DH(t),
      yT = Math.min(0.9, dh - 0.45),
      vee = Math.max(0, Math.min(1, (t - 0.85) / 0.15)) /* the bow's sections run to a V */,
      cw = Math.min(2.4, 0.95 * w),
      P = SH.map(([u, v]) => [kd + u * (Math.max(yT, kd + 0.2) - kd), w * (v * (1 - vee) + u * 0.58 * vee)]);
    P.push([P[P.length - 1][0] + 0.15, cw], [dh - 0.06, cw], [dh, cw * 0.97]);
    return P;
  };
  /* the hull's half-breadth at height y, station t (for fittings on her side) */
  const sideZ = (t, y) => {
    const P = sect(t);
    for (let i = 1; i < P.length; i++) if (y <= P[i][0]) return P[i - 1][1] + ((P[i][1] - P[i - 1][1]) * (y - P[i - 1][0])) / (P[i][0] - P[i - 1][0] || 1);
    return P[P.length - 1][1];
  };
  const tOf = (ft) => ft / LOA;
  MODELS.add(
    'us-roncador',
    (o) => {
      o = o || {};
      const far = !!o.far,
        P = GX.loft({ L: LOA * FT, X0: F(0), N: far ? 18 : 56, sect, paint: (y) => (y < -0.05 ? BOOT : SIDE), deck: DECK, transom: null });
      /* the limber holes: the free-flooding slots along her sides, a row from 60 to 285 ft */
      if (!far)
        for (let ft = 62; ft < 284; ft += 4.4) {
          const t = tOf(ft),
            y0 = 0.95,
            y1 = 1.3,
            x = F(ft);
          for (const s of [1, -1]) {
            const z0 = sideZ(t, y0) + 0.02,
              z1 = sideZ(t, y1) + 0.02,
              q = GX.grid(
                [
                  [[x - 0.45, y0, s * z0], [x + 0.45, y0, s * z0]],
                  [[x - 0.45, y1, s * z1], [x + 0.45, y1, s * z1]],
                ],
                DARK,
              );
            P.push(...GX.both(q));
          }
        }
      /* THE BRIDGE FAIRING, 167 to 210 ft: its gun decks 13.75 ft up, a round front, tapered aft */
      const yd = DH(tOf(188)),
        plan = (a, b, hw) => {
          const pts = [];
          for (let i = 0; i <= 6; i++) {
            const k = i / 6;
            pts.push([F(a) + (F(b) - F(a)) * k * 0.82, hw * Math.min(1, 0.35 + k * 1.3)]);
          }
          for (let i = 0; i <= 8; i++) {
            const a2 = -Math.PI / 2 + (i / 8) * Math.PI;
            pts.push([F(a) + (F(b) - F(a)) * 0.82 + Math.cos(a2) * (F(b) - F(a)) * 0.18, -Math.sin(a2) * hw]);
          }
          for (let i = 6; i >= 0; i--) {
            const k = i / 6;
            pts.push([F(a) + (F(b) - F(a)) * k * 0.82, -hw * Math.min(1, 0.35 + k * 1.3)]);
          }
          return pts.map(([x, z]) => [x, -z]);
        };
      P.push(GX.plan(plan(167, 210, 1.5), 13.75 * FT - yd, SIDE, yd - 0.05));
      P.push(part(bx(F(210) - F(167) - 0.6, 0.02, 2.6), DECK, (F(167) + F(210)) / 2 + 0.2, 13.75 * FT + 0.01, 0)); /* the gun decks' gratings */
      /* the bridge: the raised middle, 178 to 200 ft, to 18.3 ft */
      P.push(GX.plan(plan(178, 200, 1.25), 18.3 * FT - 13.75 * FT, SIDE, 13.75 * FT));
      P.push(part(bx(F(199) - F(179), 0.02, 2.0), DECK, (F(179) + F(199)) / 2, 18.3 * FT + 0.01, 0));
      /* the periscope shears: two columns from the bridge to the lookout platform (31.7 ft), the platform across them */
      const yb = 18.3 * FT,
        yl = 31.7 * FT;
      for (const ft of [188.6, 193.6]) P.push(part(bx(0.55, yl - yb, 0.7), SIDE, F(ft), (yb + yl) / 2, 0));
      P.push(part(bx(F(195.5) - F(186.5), 0.08, 1.7), DECK, (F(186.5) + F(195.5)) / 2, yl, 0));
      /* the periscopes, raised (52 ft), and the SJ radar's mast (41.7 ft) with its dish at 32 ft */
      P.push(part(cyl(0.09, 0.12, 52 * FT - yb, far ? 5 : 10), GUN, F(189.8), (52 * FT + yb) / 2, 0));
      P.push(part(cyl(0.07, 0.12, 52 * FT - yb, far ? 5 : 10), GUN, F(192.5), (52 * FT + yb) / 2, 0));
      P.push(part(cyl(0.06, 0.08, 41.7 * FT - yb, 6), GUN, F(187.5), (41.7 * FT + yb) / 2, 0));
      P.push(part(bx(0.18, 0.55, 1.05), GUN, F(187.5) + 0.15, 32 * FT, 0)); /* the SJ's dish, edge-on fore and aft */
      if (!far) {
        /* the guard rails round the lookout platform and the bridge, the gun decks' rails */
        const rail = (x0, x1, hw, y, h) => {
          for (const s of [1, -1]) P.push(GX.rod([x0, y + h, s * hw], [x1, y + h, s * hw], 0.025, GUN));
          for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 1.2))) for (const s of [1, -1]) P.push(GX.rod([x, y, s * hw], [x, y + h, s * hw], 0.02, GUN));
        };
        rail(F(186.5), F(195.5), 0.82, yl, 0.9);
        rail(F(168), F(178), 1.3, 13.75 * FT, 1.0);
        rail(F(200), F(208.5), 1.3, 13.75 * FT, 1.0);
      }
      /* THE 5"/25 aft of the fairing (150 ft), trained aft: the pedestal, the slide, the barrel (25 calibres, 3.2 m) */
      const gy = DH(tOf(150));
      P.push(part(cyl(0.32, 0.4, 0.9, far ? 6 : 12), GUN, F(150), gy + 0.45, 0));
      P.push(part(bx(1.2, 0.5, 0.75), GUN, F(150) - 0.2, gy + 1.15, 0));
      P.push(part(cyl(0.085, 0.11, 3.2, far ? 5 : 10), GUN, F(150) - 0.5 - 1.6, gy + 1.25, 0, 0, 0, Math.PI / 2 + 0.04));
      if (!far) for (const s of [1, -1]) P.push(part(bx(0.5, 0.06, 0.45), GUN, F(150) + 0.1, gy + 0.85, s * 0.65)); /* the pointer's and trainer's seats */
      /* the 40 mm on the forward gun deck (205 ft), trained ahead; the 20 mm on the after one (173 ft), trained aft */
      const yg = 13.75 * FT;
      P.push(part(cyl(0.3, 0.35, 0.7, far ? 6 : 10), GUN, F(205), yg + 0.35, 0));
      P.push(part(bx(0.9, 0.45, 0.8), GUN, F(205), yg + 0.95, 0));
      P.push(part(cyl(0.05, 0.06, 2.25, 6), GUN, F(205) + 1.4, yg + 1.15, 0, 0, 0, -Math.PI / 2 + 0.08));
      P.push(part(cyl(0.12, 0.15, 1.0, 6), GUN, F(173), yg + 0.5, 0));
      P.push(part(cyl(0.03, 0.04, 1.7, 5), GUN, F(173) - 0.9, yg + 1.1, 0, 0, 0, Math.PI / 2 - 0.15));
      if (!far) P.push(part(bx(0.06, 0.6, 0.9), GUN, F(173) - 0.15, yg + 1.0, 0)); /* the 20 mm's shield */
      /* the jackstaff at the bow and the stern's light */
      if (!far) {
        P.push(GX.rod([F(274), DH(tOf(274)), 0], [F(274), DH(tOf(274)) + 3.2, 0], 0.04, GUN));
        P.push(GX.rod([F(22), DH(tOf(22)), 0], [F(22), DH(tOf(22)) + 1.0, 0], 0.05, GUN));
      }
      /* UNDER THE TAIL: the two screws (19 ft), the stern diving planes and the rudder */
      for (const s of [1, -1]) {
        P.push(GX.rod([F(19), -2.3, s * 1.55], [F(40), -2.6, s * 1.2], 0.12, BOOT)); /* the shaft */
        P.push(part(cyl(0.22, 0.22, 0.5, 8), 0x6b5a3a, F(19), -2.3, s * 1.55, 0, 0, Math.PI / 2));
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + (s > 0 ? 0 : 0.4);
          P.push(part(bx(0.12, 1.0, 0.35), 0x6b5a3a, F(19) - 0.05, -2.3 + Math.cos(a) * 0.55, s * 1.55 + Math.sin(a) * 0.55, a, 0, 0.35));
        }
      }
      /* the stern planes: under the tail between 7 and 15 ft, at the screws' depth (8 ft down); the rudder: the tail's end, 1 to 9 ft,
         from 3.4 ft above the waterline to 5 ft below it (the profile's rectangle) */
      P.push(part(bx(2.4, 0.12, 5.0), BOOT, F(11), -2.5, 0));
      P.push(part(bx(2.4, 2.55, 0.16), BOOT, F(5), -0.25, 0));
      return P;
    },
    { kind: 'ship', title: 'USS Roncador (SS-301), Balao class, 1945' },
  );
})();
