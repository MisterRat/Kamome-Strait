/* ---------- I-58, a Type B3 (Otsu-gata) cruiser submarine, as refitted at Kure in May 1945 ----------
   108.7 m overall, 9.30 m beam, 5.19 m draught (navypedia, Otsu-gata B3); her May 1945 refit (alchetron's I-58 history): the 140 mm
   gun, the hangar and the catapult gone; six kaiten on deck; a snorkel; the Type 3 radar. The kaiten's places from the reproduction
   the user found (References/Type B3, "i58 showing all 6 kaiten", the late kaiten-carrying type): two abreast forward of the
   tower, three aft of it (two abreast and one on the centreline behind them) and one on the stern (the user's, 2026-11-21: the
   Japanese submarine is I-58, mid-1944 to mid-1945).
   The hull and the tower measured off the cutaway (References/Type B3/i-58_submarine_cutaway.png, scaled to her 108.7 m), metres
   from her stern, heights from the waterline: the deck 2.95 m up amidships, 3.8 m at the bow, the stem raking forward to the deck at
   108.7 m and the forefoot meeting the keel at about 95 m; the tail rising to the big semi-balanced rudder (2 to 9 m, below the
   keel) and the screws at 6.5 m; the tower from 49.5 to 63 m, its bridge 6.9 m up, the periscopes at 57 m raised to 13.7 m, the
   radio direction finder's loop at 59.7 m; the twin 25 mm on the platform at the tower's after end.
   Kaiten Type 1: 14.75 m long, 1.0 m across, on two cradles each, with their straps. Paint from the reproductions and the painting:
   dark grey sides, near-black deck, red below the waterline, the Hinomaru on the tower's sides.
   Bow toward +x, the waterline at y = 0. o.far: the distant form (fewer stations, no small fittings). */
(() => {
  const { part, bx, cyl } = GX,
    LOA = 108.7,
    M = (m) => m - LOA / 2 /* metres from her stern to x */,
    SIDE = 0x55595c,
    DECK = 0x2b2d2f,
    BOOT = 0x6e2a22,
    GUN = 0x3a3d40,
    KT = 0x2e3133 /* the kaiten */,
    STRAP = 0xc8a23a;
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
  const B = 9.3 / 2,
    W = tab([[0, 0.05], [0.03, 0.22], [0.07, 0.4], [0.12, 0.58], [0.2, 0.78], [0.3, 0.95], [0.38, 1], [0.62, 1], [0.7, 0.93], [0.78, 0.8], [0.85, 0.62], [0.9, 0.45], [0.95, 0.25], [1, 0.02]]),
    KD = tab([[0, 0.4], [0.03, -1.4], [0.08, -2.3], [0.11, -2.5], [0.2, -3.6], [0.28, -4.6], [0.32, -5.19], [0.874, -5.19], [0.883, -4.4], [0.92, -3.0], [0.948, -1.6], [0.975, 0.9], [1, 3.3]]),
    DH = tab([[0, 1.6], [0.04, 3.1], [0.1, 3.05], [0.3, 2.95], [0.6, 2.95], [0.75, 3.3], [0.85, 3.6], [0.95, 3.8], [1, 3.6]]);
  const SH = [[0, 0], [0.03, 0.29], [0.11, 0.55], [0.25, 0.79], [0.42, 0.95], [0.58, 1], [0.74, 0.96], [0.87, 0.84], [0.95, 0.7], [1, 0.58]];
  const sect = (t) => {
    const w = W(t) * B,
      kd = KD(t),
      dh = DH(t),
      yT = Math.min(1.2, dh - 0.45),
      vee = Math.max(0, Math.min(1, (t - 0.85) / 0.15)),
      cw = Math.min(2.6, 0.95 * w),
      P = SH.map(([u, v]) => [kd + u * (Math.max(yT, kd + 0.2) - kd), w * (v * (1 - vee) + u * 0.58 * vee)]);
    P.push([P[P.length - 1][0] + 0.15, cw], [dh - 0.06, cw], [dh, cw * 0.97]);
    return P;
  };
  const tOf = (m) => m / LOA;
  /* a kaiten on its two cradles: its middle at x, across at z, its keel on the deck at y; o.far: a plain cylinder */
  const kaiten = (P, x, z, y, far) => {
    const L = 14.75,
      r = 0.5,
      yc = y + 0.55 + r;
    P.push(part(cyl(r, r, L - 1.2, far ? 6 : 12), KT, x - 0.2, yc, z, 0, 0, Math.PI / 2));
    if (far) return;
    const nose = GX.sph(10);
    P.push(part(nose, KT, x + L / 2 - 0.8, yc, z, 0, 0, 0, 0.6, r, r)); /* the warhead's round nose */
    P.push(part(cyl(r, 0.18, 1.0, 10), KT, x - L / 2 + 0.3, yc, z, 0, 0, Math.PI / 2)); /* the tail cone */
    P.push(part(bx(0.5, 0.05, 1.2), KT, x - L / 2 + 0.2, yc, z)); /* the fins */
    P.push(part(bx(0.5, 1.2, 0.05), KT, x - L / 2 + 0.2, yc, z));
    P.push(part(cyl(0.22, 0.28, 0.45, 8), KT, x + 1.2, yc + r + 0.15, z)); /* the pilot's little tower and periscope */
    P.push(part(cyl(0.03, 0.03, 0.7, 4), KT, x + 1.25, yc + r + 0.6, z));
    for (const dx of [-3.5, 3.0]) {
      P.push(part(bx(0.35, 0.55, 1.1), GUN, x + dx, y + 0.28, z)); /* a cradle */
      P.push(part(cyl(r + 0.03, r + 0.03, 0.12, 12), STRAP, x + dx, yc, z, 0, 0, Math.PI / 2)); /* its strap */
    }
  };
  MODELS.add(
    'jp-i58',
    (o) => {
      o = o || {};
      const far = !!o.far,
        P = GX.loft({ L: LOA, X0: M(0), N: far ? 18 : 56, sect, paint: (y) => (y < -0.05 ? BOOT : SIDE), deck: DECK, transom: null });
      /* THE TOWER, 49.5 to 63 m: its body to 5.4 m, round at the front and tapered aft; the bridge forward to 6.9 m; the shears */
      const plan = (a, b, hw) => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const k = i / 6;
          pts.push([M(a) + (M(b) - M(a)) * k * 0.82, hw * Math.min(1, 0.4 + k * 1.2)]);
        }
        for (let i = 0; i <= 8; i++) {
          const a2 = -Math.PI / 2 + (i / 8) * Math.PI;
          pts.push([M(a) + (M(b) - M(a)) * 0.82 + Math.cos(a2) * (M(b) - M(a)) * 0.18, -Math.sin(a2) * hw]);
        }
        for (let i = 6; i >= 0; i--) {
          const k = i / 6;
          pts.push([M(a) + (M(b) - M(a)) * k * 0.82, -hw * Math.min(1, 0.4 + k * 1.2)]);
        }
        return pts;
      };
      const yd = DH(tOf(56));
      P.push(GX.plan(plan(49.5, 63, 1.55), 5.4 - yd, SIDE, yd - 0.05));
      P.push(part(bx(M(62.5) - M(50), 0.02, 2.6), DECK, (M(50) + M(62.5)) / 2, 5.41, 0));
      P.push(GX.plan(plan(54.5, 62.6, 1.25), 6.9 - 5.4, SIDE, 5.4));
      P.push(part(bx(M(62) - M(55), 0.02, 2.1), DECK, (M(55) + M(62)) / 2, 6.91, 0));
      P.push(part(bx(2.4, 0.8, 1.2), SIDE, M(57.6), 7.3, 0)); /* the shears' housing */
      /* the Hinomaru on each side of the tower (the reproduction), white square and red disc */
      if (!far)
        for (const s of [1, -1]) {
          P.push(part(bx(1.1, 0.75, 0.02), 0xe8e6df, M(56), 4.3, s * 1.56));
          P.push(part(cyl(0.22, 0.22, 0.03, 12), 0xb8282a, M(56), 4.3, s * 1.575, Math.PI / 2, 0, 0));
        }
      /* the periscopes raised (13.7 m), the DF loop's mast (9.4 m) with the loop, the Type 3 radar's mast and horns, the snorkel */
      P.push(part(cyl(0.09, 0.12, 13.7 - 7.7, far ? 5 : 10), GUN, M(57.0), (13.7 + 7.7) / 2, 0));
      P.push(part(cyl(0.07, 0.11, 13.7 - 7.7, far ? 5 : 10), GUN, M(57.9), (13.7 + 7.7) / 2, 0));
      P.push(part(cyl(0.05, 0.06, 9.1 - 6.9, 6), GUN, M(59.7), 8.0, 0));
      if (!far) P.push(part(new THREE.TorusGeometry(0.28, 0.035, 5, 14), GUN, M(59.7), 9.35, 0));
      P.push(part(cyl(0.06, 0.07, 9.6 - 6.9, 6), GUN, M(55.4), 8.25, 0));
      P.push(part(bx(0.35, 0.5, 1.4), GUN, M(55.4), 9.4, 0)); /* the Type 3's horn pair */
      P.push(part(cyl(0.18, 0.2, 9.8 - 5.4, far ? 6 : 10), GUN, M(53.4), (9.8 + 5.4) / 2, 0)); /* the snorkel, aft of the bridge */
      P.push(part(bx(0.55, 0.35, 0.55), GUN, M(53.4), 9.9, 0)); /* its head */
      /* the twin 25 mm on the after platform, 51 m, trained aft and up */
      P.push(part(cyl(0.22, 0.28, 0.7, far ? 6 : 10), GUN, M(51), 5.75, 0));
      P.push(part(bx(0.7, 0.4, 0.7), GUN, M(51), 6.25, 0));
      for (const s of [1, -1]) P.push(part(cyl(0.035, 0.045, 1.8, 5), GUN, M(51) - 0.85, 6.55, s * 0.14, 0, 0, Math.PI / 2 - 0.35));
      if (!far) {
        /* the bridge's rail and the after platform's */
        const rail = (x0, x1, hw, y, h) => {
          for (const s of [1, -1]) P.push(GX.rod([x0, y + h, s * hw], [x1, y + h, s * hw], 0.025, GUN));
          for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 1.2))) for (const s of [1, -1]) P.push(GX.rod([x, y, s * hw], [x, y + h, s * hw], 0.02, GUN));
        };
        rail(M(50), M(54.3), 1.2, 5.4, 0.9);
        /* the deck's lifelines on stanchions, both sides, from the stern to the bow */
        for (const s of [1, -1]) {
          let prev = null;
          for (let m = 4; m <= 104; m += 4) {
            const t = tOf(m),
              y = DH(t),
              z = s * Math.min(2.6, 0.95 * W(t) * B) * 0.9;
            P.push(GX.rod([M(m), y, z], [M(m), y + 0.9, z], 0.02, GUN));
            if (prev) P.push(GX.rod(prev, [M(m), y + 0.9, z], 0.012, GUN));
            prev = [M(m), y + 0.9, z];
          }
        }
      }
      /* THE SIX KAITEN: two abreast forward of the tower, two abreast aft of it and one behind them, one on the stern */
      const zk = 1.55;
      for (const s of [1, -1]) kaiten(P, M(64.3 + 7.4), s * zk, DH(tOf(71.7)), far);
      for (const s of [1, -1]) kaiten(P, M(33.5 + 7.4), s * zk, DH(tOf(40.9)), far);
      kaiten(P, M(17.8 + 7.4), 0, DH(tOf(25.2)), far);
      kaiten(P, M(2.4 + 7.4), 0, DH(tOf(9.8)), far);
      /* UNDER THE TAIL: the two screws (6.5 m), the stern planes, the big rudder (2 to 9 m, to 4.5 m down) */
      for (const s of [1, -1]) {
        P.push(GX.rod([M(6.5), -1.3, s * 1.5], [M(22), -2.2, s * 1.1], 0.13, BOOT));
        P.push(part(cyl(0.22, 0.22, 0.5, 8), 0x6b5a3a, M(6.5), -1.3, s * 1.5, 0, 0, Math.PI / 2));
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + (s > 0 ? 0 : 0.4);
          P.push(part(bx(0.12, 1.05, 0.38), 0x6b5a3a, M(6.5) - 0.05, -1.3 + Math.cos(a) * 0.58, s * 1.5 + Math.sin(a) * 0.58, a, 0, 0.35));
        }
      }
      P.push(part(bx(2.2, 0.12, 5.4), BOOT, M(9.5), -1.0, 0));
      P.push(part(bx(6.6, 3.9, 0.18), BOOT, M(5.5), -2.55, 0));
      return P;
    },
    { kind: 'ship', title: 'I-58, Type B3 submarine, May 1945 (six kaiten)' },
  );
})();
