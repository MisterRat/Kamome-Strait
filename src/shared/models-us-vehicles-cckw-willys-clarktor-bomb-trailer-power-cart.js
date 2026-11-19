/* ---------- US airfield vehicles and kit, built from the references (docs/research_1945_bases.md; References/ photos) ----------
   Real sizes in metres, nose toward +x, wheels on y = 0, port side at -z. Paint 1945: lusterless olive drab, white stars; the
   Clarktor in chrome yellow (rear-area field). */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    OD = 0x4c5233 /* lusterless olive drab */,
    OD2 = 0x41462c,
    CANV = 0x5d5f3f,
    DK = 0x242523,
    TYRE = 0x1b1b1a,
    GLASS = 0x1d2a33,
    WHITE = 0xe6e4da,
    LAMP = 0xd9d2a8;
  const W = GX.wheel,
    lamp = (x, y, z) => part(GX.sph(8), LAMP, x, y, z, 0, 0, 0, 0.1, 0.1, 0.1);
  /* THE CCKW CHASSIS (every part bears on another): frame rails (top y = 0.95) on leaf springs over the axles, the axles through the
     hubs; bonnet sides down to the rails; front fenders joined to the bonnet; the brush guard standing on the bumper; the open cab's tub
     on the rails; the steering column from the dash to the wheel. Axles x = 2.35, -1.05, -2.25; wheels 0.48 m radius. */
  const C0 = 0.75,
    C1 = 0.95;
  const cckwRun = (P) => {
    for (const s of [-1, 1]) P.push(part(bx(6.1, C1 - C0, 0.14), DK, 0.1, (C0 + C1) / 2, s * 0.42));
    for (const x of [3.05, 0.3, -2.85]) P.push(part(bx(0.14, 0.16, 0.98), DK, x, 0.85, 0));
    for (const x of [2.35, -1.05, -2.25]) {
      P.push(part(cyl(0.07, 0.07, 1.8, 8), DK, x, 0.48, 0, Z), part(cyl(0.22, 0.22, 0.4, 10), 0x34372a, x, 0.48, 0, Z));
      for (const s of [-1, 1]) P.push(...W(x, 0.48, s * 0.82, 0.48, 0.32, TYRE, OD2), part(bx(1.0, C0 - 0.52, 0.1), 0x2e2e2a, x, (C0 + 0.52) / 2, s * 0.42));
    }
    P.push(part(bx(0.14, 0.14, 1.9), DK, -3.0, 0.82, 0)); /* rear bumper on the rail ends */
  };
  const cckwFront = (P) => {
    P.push(
      GX.ext([[1.55, C1 - 0.02], [2.9, C1 - 0.02], [2.98, 1.15], [2.98, 1.62], [2.88, 1.7], [1.55, 1.72]], 1.0, OD),
      part(bx(0.05, 0.62, 0.85), 0x2f322a, 3.0, 1.36, 0),
      part(bx(0.14, 0.16, 2.05), DK, 3.18, 0.82, 0) /* front bumper on the rail ends */,
    );
    for (let i = -4; i <= 4; i++) P.push(part(bx(0.03, 0.6, 0.04), 0x3b3e33, 3.04, 1.36, i * 0.09));
    for (const s of [-1, 1]) {
      P.push(GX.ext([[1.5, 0.92], [1.7, 1.12], [2.55, 1.15], [2.95, 0.95], [3.05, 0.78], [2.85, 0.76], [2.68, 0.98], [1.75, 0.98]], 0.58, OD, s * 0.78)); /* fender, from the bonnet side out */
      P.push(lamp(2.8, 1.1, s * 0.74));
      P.push(part(bx(0.06, 0.74, 0.05), DK, 3.18, 1.27, s * 0.6), part(bx(0.06, 0.05, 0.36), DK, 3.18, 1.62, s * 0.74)); /* brush guard, standing on the bumper */
      P.push(part(bx(0.5, 0.05, 0.42), DK, 1.3, 0.94, s * 0.7)); /* step, on the rail */
    }
    /* open cab: the tub on the rails, scuttle, windscreen frame on the scuttle, seat, steering column and wheel */
    P.push(
      GX.ext([[0.35, C1 - 0.02], [1.55, C1 - 0.02], [1.55, 1.72], [1.48, 1.72], [1.38, 1.3], [0.35, 1.3]], 2.0, OD),
      part(bx(0.06, 0.62, 1.95), OD2, 1.52, 2.02, 0, 0, 0, -0.06),
      part(bx(0.03, 0.5, 1.7), GLASS, 1.53, 2.02, 0, 0, 0, -0.06),
      part(bx(0.55, 0.45, 1.85), 0x3b3a2b, 0.62, 1.5, 0),
      part(bx(0.15, 0.7, 1.85), 0x3b3a2b, 0.4, 1.75, 0),
      GX.rod([1.5, 1.45, 0.45], [1.22, 1.85, 0.45], 0.03, DK),
      part(cyl(0.21, 0.21, 0.03, 12), DK, 1.22, 1.86, 0.45, 0, 0, 0.6),
      GX.star(0.95, 1.38, 1.003, 0.22),
      GX.star(0.95, 1.38, -1.003, 0.22, Math.PI),
      GX.star(2.2, 1.722, 0, 0.3, 0, -Z),
      part(bx(0.02, 0.1, 0.5), WHITE, 2.2, 1.55, 0.505) /* hood registration number */,
    );
    for (const s of [-1, 1]) P.push(part(bx(0.04, 0.5, 0.75), OD2, 1.05, 1.4, s * 0.98)); /* low doors in the tub sides */
  };
  /* GMC CCKW 353 2½-ton 6x6 cargo truck: 6.51 x 2.24 x 2.80 m over the canvas bows */
  MODELS.add('us-cckw-cargo', () => {
    const P = [];
    cckwFront(P);
    cckwRun(P);
    for (const x of [-3.0, -1.5, 0.0]) P.push(part(bx(0.15, 0.2, 2.1), 0x4d3c2c, x, C1 + 0.1, 0)); /* bed bolsters */
    P.push(part(bx(3.75, 0.12, 2.24), 0x5a5134, -1.48, C1 + 0.26, 0));
    for (const s of [-1, 1]) P.push(part(bx(3.75, 0.55, 0.06), OD, -1.48, C1 + 0.59, s * 1.09), GX.star(-1.6, C1 + 0.59, s * 1.123, 0.28, s > 0 ? 0 : Math.PI));
    P.push(part(bx(0.06, 0.6, 2.24), OD, -3.33, C1 + 0.59, 0), part(bx(0.06, 0.75, 2.2), OD, 0.38, C1 + 0.66, 0));
    P.push(GX.ext([[-3.3, C1 + 0.84], [0.38, C1 + 0.84], [0.38, 2.6], [0.2, 2.8], [-3.1, 2.8], [-3.3, 2.6]], 2.2, CANV)); /* canvas over the bows, down onto the sides */
    P.push(part(bx(0.03, 0.7, 1.9), 0x3d3f2a, -3.32, 2.2, 0));
    return P;
  }, { L: 6.51, W: 2.24, H: 2.8, name: 'GMC CCKW 353 2½-ton 6x6 cargo truck' });
  /* F-2A fuel servicing truck on the CCKW chassis: 750-gallon tank, rear pump and hose compartment */
  MODELS.add('us-cckw-fuel', (c) => {
    const P = [],
      t = c || OD;
    cckwFront(P);
    cckwRun(P);
    P.push(
      part(cyl(0.82, 0.82, 3.0, 16), t, -1.2, 1.85, 0, 0, 0, Z, 1, 1, 1.22) /* the tank, bottom at 1.03 */,
      part(bx(0.3, 0.12, 1.6), DK, -2.4, C1 + 0.08, 0),
      part(bx(0.3, 0.12, 1.6), DK, 0.0, C1 + 0.08, 0) /* saddles, rails up to the tank */,
      part(bx(3.0, 0.08, 0.5), DK, -1.2, 2.7, 0) /* catwalk on the tank's top */,
      part(bx(0.8, 1.15, 2.0), OD2, -3.05, 1.5, 0) /* pump and hose compartment, on the rail ends */,
      part(cyl(0.25, 0.25, 0.1, 12), DK, -0.5, 2.78, 0),
      part(cyl(0.25, 0.25, 0.1, 12), DK, -1.9, 2.78, 0),
      part(cyl(0.3, 0.3, 0.3, 12), DK, -3.1, 1.45, 1.05, Z),
      part(bx(0.7, 0.2, 0.02), WHITE, -1.2, 1.85, 1.0) /* "GASOLINE", on the tank's side */,
      part(bx(0.7, 0.2, 0.02), WHITE, -1.2, 1.85, -1.0),
    );
    return P;
  }, { L: 6.51, W: 2.24, name: 'F-2A fuel servicing truck (CCKW chassis)' });
  /* Willys MB 1/4-ton 4x4: 3.36 x 1.57 x 1.77 m (windscreen up, top down); 9-slot grille, flat fenders, jerrycan and spare at the back */
  MODELS.add('us-willys-mb', () => {
    const P = [
      GX.ext([[-1.6, 0.48], [1.55, 0.48], [1.62, 0.6], [1.62, 1.02], [1.55, 1.05], [0.35, 1.05], [0.32, 0.98], [-1.55, 0.98], [-1.62, 0.9]], 1.25, OD),
      part(bx(0.04, 0.38, 0.62), 0x2c2f26, 1.63, 0.82, 0),
      part(bx(0.15, 0.1, 1.45), DK, 1.66, 0.5, 0) /* bumper, on the frame horns at the body's nose */,
      part(bx(0.06, 0.62, 1.32), OD2, 0.3, 1.35, 0, 0, 0, -0.08) /* windscreen frame, standing in the cowl */,
      part(bx(0.03, 0.5, 1.2), GLASS, 0.31, 1.35, 0, 0, 0, -0.08),
      part(bx(0.5, 0.35, 1.1), 0x3d3b2c, -0.35, 1.05, 0),
      part(bx(0.5, 0.35, 0.5), 0x3d3b2c, -1.05, 1.05, 0),
      GX.rod([0.25, 1.0, 0.35], [0.02, 1.3, 0.35], 0.025, DK) /* steering column */,
      part(cyl(0.19, 0.19, 0.03, 12), DK, 0.02, 1.31, 0.35, 0, 0, 0.7),
      part(bx(0.15, 0.48, 0.34), OD2, -1.67, 0.78, 0.4) /* jerrycan, in its bracket on the tail panel */,
      GX.star(0.95, 1.053, 0, 0.26, 0, -Z),
      part(bx(0.45, 0.01, 0.06), WHITE, 1.3, 1.052, 0) /* hood number */,
    ];
    for (let i = -4; i <= 4; i++) P.push(part(bx(0.02, 0.32, 0.035), 0x15160f, 1.64, 0.82, i * 0.065));
    for (const s of [-1, 1]) {
      P.push(part(bx(0.9, 0.04, 0.3), OD, 1.15, 0.92, s * 0.64), part(bx(0.6, 0.04, 0.24), OD, -1.15, 0.92, s * 0.64));
      P.push(...W(1.0, 0.36, s * 0.62, 0.36, 0.2, TYRE, OD2, 10), ...W(-1.04, 0.36, s * 0.62, 0.36, 0.2, TYRE, OD2, 10));
      P.push(lamp(1.6, 0.86, s * 0.42), GX.star(-1.1, 0.8, s * 0.64, 0.15, s > 0 ? 0 : Math.PI));
    }
    P.push(part(cyl(0.34, 0.34, 0.18, 10), TYRE, -1.69, 0.75, -0.25, 0, 0, Z), part(cyl(0.19, 0.19, 0.2, 8), OD2, -1.69, 0.75, -0.25, 0, 0, Z)); /* spare on the back */
    return P;
  }, { L: 3.36, W: 1.57, H: 1.77, name: 'Willys MB jeep' });
  /* Clark Clarktor 6 aircraft tug: 2.54 x 1.32 x 1.42 m; tiny 4-wheel, dual rear tyres, open seat over the rear axle; chrome yellow */
  MODELS.add('us-clarktor6', (c) => {
    const Y = c || 0xd4a52a,
      P = [
        GX.ext([[-1.05, 0.35], [1.2, 0.35], [1.27, 0.48], [1.2, 0.85], [0.35, 0.95], [-0.3, 0.95], [-0.55, 0.75], [-1.05, 0.75]], 1.0, Y),
        GX.ext([[-1.0, 0.62], [-0.9, 0.74], [-0.35, 0.74], [-0.25, 0.62], [-0.3, 0.58], [-0.95, 0.58]], 1.32, Y) /* rear fenders over the duals */,
        part(bx(0.3, 0.2, 0.3), DK, -0.75, 0.84, 0) /* seat pedestal, on the rear deck */,
        part(bx(0.45, 0.12, 0.45), 0x2a2a28, -0.75, 1.0, 0) /* seat */,
        part(bx(0.08, 0.42, 0.45), 0x2a2a28, -1.0, 1.2, 0),
        GX.rod([-0.1, 0.92, 0], [-0.4, 1.32, 0], 0.025, DK) /* steering column, from the cowl */,
        part(cyl(0.17, 0.17, 0.03, 10), DK, -0.41, 1.33, 0, 0, 0, 0.6),
        part(bx(0.25, 0.1, 0.2), DK, 1.35, 0.5, 0),
        part(bx(0.25, 0.1, 0.2), DK, -1.15, 0.5, 0) /* rear pintle, out of the body */,
        part(bx(0.04, 0.3, 0.6), 0x3a3a34, 1.28, 0.65, 0),
      ];
    for (const s of [-1, 1]) P.push(...W(0.75, 0.3, s * 0.48, 0.3, 0.18, TYRE, Y, 10), ...W(-0.62, 0.32, s * 0.52, 0.32, 0.28, TYRE, Y, 10));
    return P;
  }, { L: 2.54, W: 1.32, H: 1.42, name: 'Clarktor 6 aircraft tug' });
  /* M5 bomb trailer: ~3.6 m open steel channel frame, cradles, pneumatic tyres, tow bars; with two 500 lb bombs */
  MODELS.add('us-m5-trailer', (bombs) => {
    const P = [part(bx(2.7, 0.12, 1.2), OD2, 0, 0.55, 0), part(bx(0.45, 0.06, 0.06), DK, 1.575, 0.53, 0), part(bx(0.45, 0.06, 0.06), DK, -1.575, 0.53, 0)] /* tow bars, from the frame */;
    for (const x of [-0.8, 0, 0.8]) P.push(part(bx(0.12, 0.18, 1.1), 0x6a5a3a, x, 0.7, 0));
    for (const s of [-1, 1]) for (const x of [-1.0, 1.0]) P.push(...W(x, 0.3, s * 0.68, 0.3, 0.16, TYRE, OD2, 10));
    if (bombs !== false)
      for (const z of [-0.3, 0.3]) P.push(part(cyl(0.18, 0.18, 1.3, 10), 0x4a4f3a, 0, 0.95, z, 0, 0, Z), part(GX.sph(8), 0x4a4f3a, 0.65, 0.95, z, 0, 0, 0, 0.3, 0.18, 0.18), part(bx(0.3, 0.3, 0.02), 0x4a4f3a, -0.75, 0.95, z), part(bx(0.3, 0.02, 0.3), 0x4a4f3a, -0.75, 0.95, z), part(bx(0.06, 0.37, 0.37), 0xb59a2a, 0.3, 0.95, z));
    return P;
  }, { L: 3.6, W: 1.5, name: 'M5 bomb trailer' });
  /* C-10 auxiliary power unit (starter cart): 1.5 x 0.9 x 1.1 m, steel frame on three wheels, engine and generator, cable reel */
  MODELS.add('us-c10-cart', (c) => {
    const k = c || OD,
      P = [
        part(bx(1.1, 0.62, 0.8), k, -0.05, 0.6, 0),
        part(bx(1.1, 0.05, 0.84), DK, -0.05, 0.93, 0),
        part(bx(0.22, 0.45, 0.66), 0x2c2f26, 0.55, 0.55, 0),
        part(cyl(0.15, 0.15, 0.3, 10), 0x2a2a28, -0.35, 0.95, 0, Z),
        part(bx(0.2, 0.05, 0.05), DK, 0.75, 0.35, 0),
        part(bx(0.04, 0.3, 0.3), 0x3a3a34, -0.62, 0.7, 0),
      ];
    for (const s of [-1, 1]) P.push(...W(-0.4, 0.22, s * 0.4, 0.22, 0.1, TYRE, k, 8));
    P.push(...W(0.5, 0.18, 0, 0.18, 0.1, TYRE, k, 8));
    return P;
  }, { L: 1.5, W: 0.9, H: 1.1, name: 'C-10 auxiliary power unit (starter cart)' });
})();
