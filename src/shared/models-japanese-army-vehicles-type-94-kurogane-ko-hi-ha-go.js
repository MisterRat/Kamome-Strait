/* ---------- Japanese army vehicles, built from the references (docs/research_1945_bases.md; References/ photos) ----------
   All at their real sizes in metres, nose toward +x, wheels on y = 0, port side at -z. Paint 1945: army khaki-brown, canvas darker;
   the Ha-Go and the Ko-Hi in the three-tone scheme (khaki-yellow, olive green, red-brown). */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    KHAKI = 0x6e6142 /* army khaki-brown */,
    CANVAS = 0x4f4a38,
    WOOD = 0x7a6346,
    DK = 0x262624,
    TYRE = 0x1c1c1b,
    GLASS = 0x1d2a33,
    LAMP = 0xd9d2a8,
    C3 = [0x8f8150 /* khaki-yellow (karekusa) */, 0x4b5634 /* olive green */, 0x6a4b33 /* red-brown */];
  const W = GX.wheel,
    lamp = (x, y, z) => [part(GX.sph(8), LAMP, x, y, z, 0, 0, 0, 0.09, 0.09, 0.09), part(GX.cyl(0.018, 0.018, 0.24, 6), DK, x, y - 0.16, z)]; /* a headlamp on its stalk (down into the wing it is bolted to) */
  /* THE TYPE 94 CHASSIS, built so that every part bears on another: two frame rails (top at y = 0.80) carried on leaf springs that sit
     on the axles, the axles running through the wheel hubs; the bonnet's side panels come down to the rails, the front mudguards join the
     bonnet sides and run back into the running boards, which are bolted to the rails; the cab and the bed stand on the rails (the bed
     on three cross bolsters). Front axle x = 1.85, rear bogie x = -1.15 and -2.12, wheels 0.42 m radius. */
  const FR0 = 0.62,
    FR1 = 0.8,
    RZ = 0.4,
    AX = [1.85, -1.15, -2.12];
  const t94run = (P) => {
    for (const s of [-1, 1]) P.push(part(bx(5.5, FR1 - FR0, 0.12), DK, 0.02, (FR0 + FR1) / 2, s * RZ)); /* frame rails, x -2.73 .. 2.77 */
    for (const x of [2.7, 0.3, -2.6]) P.push(part(bx(0.12, 0.14, 2 * RZ + 0.12), DK, x, 0.71, 0)); /* cross members */
    AX.forEach((x, i) => {
      const zw = i ? 0.66 : 0.74,
        w = i ? 0.42 : 0.22;
      P.push(part(cyl(0.06, 0.06, 2 * zw, 8), DK, x, 0.42, 0, Z)); /* the axle, through both hubs */
      if (i === 0) P.push(part(bx(0.55, 0.42, 0.42), 0x3a3a34, x, 0.42, 0)); /* front: none; rear: the differential */
      else P.push(part(cyl(0.2, 0.2, 0.36, 10), 0x3a3a34, x, 0.42, 0, Z));
      for (const s of [-1, 1]) {
        if (i) for (const d of [-0.11, 0.11]) P.push(...W(x, 0.42, s * zw + d, 0.42, 0.2, TYRE, 0x3b3a33)); /* twin rear tyres */
        else P.push(...W(x, 0.42, s * zw, 0.42, w, TYRE, 0x3b3a33));
        P.push(part(bx(0.9, FR0 - 0.44, 0.1), 0x2e2e2a, x, (FR0 + 0.44) / 2, s * RZ)); /* leaf spring: axle up to the rail */
      }
    });
    P.push(part(bx(0.06, 0.34, 0.45), DK, -2.74, 0.62, 0.3), part(bx(0.12, 0.12, 1.6), DK, -2.76, 0.66, 0)); /* number plate and the rear bumper on the rail ends */
  };
  /* the front: bonnet (sides down to the rails), the round radiator with vertical slats, mudguards joined to the bonnet, running boards */
  const t94front = (P, c) => {
    P.push(
      GX.ext([[1.35, FR1 - 0.02], [2.6, FR1 - 0.02], [2.62, 1.12], [2.62, 1.38], [2.5, 1.5], [1.35, 1.5]], 0.9, c),
      part(cyl(0.44, 0.44, 0.08, 14, 1), 0x2e2d29, 2.64, 1.2, 0, 0, 0, Z, 1, 1, 0.92),
      part(bx(1.1, 0.06, 0.04), c, 1.95, 1.5, 0.44),
      part(bx(1.1, 0.06, 0.04), c, 1.95, 1.5, -0.44),
      part(bx(0.12, 0.14, 1.75), DK, 2.8, 0.66, 0) /* front bumper, on the rail ends */,
    );
    for (let i = -3; i <= 3; i++) P.push(part(bx(0.03, 0.6, 0.04), 0x55534a, 2.67, 1.2, i * 0.1));
    for (const s of [-1, 1]) {
      /* mudguard: from the bonnet side (z 0.45) out over the wheel (to 0.95); its rear runs down into the running board */
      P.push(GX.ext([[1.3, 0.76], [1.5, 1.0], [2.2, 1.02], [2.55, 0.86], [2.6, 0.7], [2.42, 0.7], [2.3, 0.88], [1.55, 0.88], [1.42, 0.76]], 0.5, c, s * 0.7));
      P.push(part(bx(1.2, 0.05, 0.5), DK, 0.85, 0.77, s * 0.7)); /* running board, on the rail */
      P.push(...lamp(2.45, 1.08, s * 0.7)); /* headlamp, on the mudguard */
    }
  };
  /* the cab: late-war soft-top cab standing on the rails, its front against the bonnet, windscreen, canvas roof on the cab sides */
  const t94cab = (P, c) => {
    P.push(
      GX.ext([[0.25, FR1 - 0.02], [1.4, FR1 - 0.02], [1.4, 1.5], [1.32, 2.0], [0.25, 2.0]], 1.72, c),
      GX.ext([[0.25, 1.98], [1.32, 1.98], [1.28, 2.18], [0.25, 2.25]], 1.74, CANVAS),
      part(bx(0.04, 0.42, 1.5), GLASS, 1.372, 1.76, 0, 0, 0, 0.159) /* in the cab's raked front */,
    );
    for (const s of [-1, 1]) P.push(part(bx(0.9, 0.4, 0.02), 0x15191c, 0.72, 1.7, s * 0.865));
  };
  /* wooden drop-side bed on three bolsters */
  const t94bed = (P) => {
    for (const x of [-2.3, -1.2, -0.1]) P.push(part(bx(0.15, 0.22, 1.9), 0x4d3c2c, x, FR1 + 0.1, 0)); /* bolsters, on the rails */
    P.push(part(bx(2.95, 0.12, 1.9), WOOD, -1.2, FR1 + 0.26, 0)); /* floor, on the bolsters */
    for (const s of [-1, 1]) P.push(part(bx(2.95, 0.5, 0.06), WOOD, -1.2, FR1 + 0.57, s * 0.92));
    P.push(part(bx(0.06, 0.5, 1.9), WOOD, -2.66, FR1 + 0.57, 0), part(bx(0.06, 0.62, 1.9), WOOD, 0.24, FR1 + 0.63, 0));
    for (const s of [-1, 1]) for (const x of [-2.2, -1.2, -0.2]) P.push(part(bx(0.07, 0.52, 0.08), 0x5a4834, x, FR1 + 0.57, s * 0.91)); /* stakes, set into the side boards */
  };
  /* Isuzu Type 94 six-wheeled truck, cargo: 5.40 x 1.90 x 2.25 m */
  MODELS.add('jp-type94-cargo', () => {
    const P = [];
    t94front(P, KHAKI);
    t94cab(P, KHAKI);
    t94run(P);
    t94bed(P);
    P.push(part(bx(1.0, 0.25, 0.8), 0x5b5338, -0.9, 1.24, 0.2), part(bx(0.7, 0.45, 0.6), 0x5b5338, -1.8, 1.34, -0.3)); /* a load, on the floor */
    return P;
  }, { L: 5.4, W: 1.9, H: 2.25, name: 'Isuzu Type 94 cargo truck' });
  /* Type 94 supply truck: the cargo truck with a canvas tilt over bows */
  MODELS.add('jp-type94-supply', () => {
    const P = [];
    t94front(P, KHAKI);
    t94cab(P, KHAKI);
    t94run(P);
    t94bed(P);
    P.push(GX.ext([[-2.68, 1.58], [0.22, 1.58], [0.22, 2.25], [0.05, 2.42], [-2.55, 2.42], [-2.68, 2.25]], 1.94, 0x5c5a3d)); /* the tilt, down onto the bed sides */
    P.push(part(bx(0.04, 0.8, 1.6), 0x3a392a, -2.7, 1.95, 0));
    return P;
  }, { L: 5.4, W: 1.9, name: 'Isuzu Type 94 supply truck (canvas tilt)' });
  /* Type 94 fuel bowser: an elliptical tank on the chassis and a pump house at the back */
  MODELS.add('jp-type94-fuel', () => {
    const P = [];
    t94front(P, KHAKI);
    t94cab(P, KHAKI);
    t94run(P);
    P.push(part(cyl(0.7, 0.7, 2.6, 16), KHAKI, -1.0, 1.55, 0, 0, 0, Z, 1, 1, 1.25)); /* the elliptical tank, bottom at 0.85 */
    for (const x of [-2.0, 0.0]) P.push(part(bx(0.3, 0.2, 1.4), DK, x, 0.88, 0)); /* saddles: rails up into the tank */
    for (const x of [-2.3, 0.3]) P.push(part(cyl(0.72, 0.72, 0.06, 16), 0x5d5238, x, 1.55, 0, 0, 0, Z, 1, 1, 1.27));
    P.push(
      part(bx(0.5, 0.9, 1.7), 0x5d5238, -2.5, FR1 + 0.43, 0) /* pump house, on the rails, against the tank's end */,
      part(cyl(0.2, 0.2, 0.12, 10), 0x3d3a30, -0.5, 2.24, 0),
      part(cyl(0.2, 0.2, 0.12, 10), 0x3d3a30, -1.6, 2.24, 0),
      part(bx(0.5, 0.25, 0.02), 0xe8e4d6, -1.0, 1.55, 0.875) /* white kanji panel (fuel), on the tank's side */,
      part(bx(0.5, 0.25, 0.02), 0xe8e4d6, -1.0, 1.55, -0.875),
    );
    return P;
  }, { L: 5.4, W: 1.9, name: 'Isuzu Type 94 fuel bowser' });
  /* Kurogane Type 95 scout car: 3.38 x 1.52 x 1.68 m; rounded beetle bonnet, open body, tan canvas top, side spare wheel */
  MODELS.add('jp-kurogane', () => {
    const c = 0x66603d,
      P = [
        GX.ext([[-1.62, 0.42], [1.55, 0.42], [1.69, 0.55], [1.66, 0.74], [1.45, 0.92], [0.95, 1.0], [0.3, 1.02], [0.3, 0.98], [-1.5, 0.98], [-1.66, 0.8]], 1.3, c),
        /* the folding canvas top, its front edge strapped to the windscreen frame's top rail */
        GX.ext([[-1.55, 0.96], [0.215, 0.96], [0.262, 1.62], [0.25, 1.66], [-0.15, 1.68], [-1.35, 1.66], [-1.55, 1.5]], 1.34, 0x9a8a62),
        /* the windscreen frame, standing in the cowl (its foot in the body) up to the top's front edge */
        part(bx(0.06, 0.7, 1.24), 0x4a4632, 0.26, 1.3, 0, 0, 0, -0.08),
        part(bx(0.04, 0.6, 1.16), GLASS, 0.255, 1.3, 0, 0, 0, -0.08),
        part(bx(0.05, 0.3, 0.7), 0x2a2924, 1.68, 0.66, 0),
      ];
    for (const s of [-1, 1]) {
      P.push(GX.ext([[0.65, 0.62], [0.9, 0.82], [1.45, 0.82], [1.68, 0.6], [1.6, 0.55], [1.35, 0.72], [0.95, 0.72], [0.78, 0.6]], 0.2, c, s * 0.68));
      P.push(GX.ext([[-1.55, 0.62], [-1.3, 0.82], [-0.8, 0.82], [-0.55, 0.62], [-0.65, 0.58], [-0.9, 0.72], [-1.25, 0.72], [-1.45, 0.58]], 0.2, c, s * 0.68));
      P.push(...W(1.15, 0.33, s * 0.62, 0.33, 0.18, TYRE, 0x3b3a33, 10), ...W(-1.05, 0.33, s * 0.62, 0.33, 0.18, TYRE, 0x3b3a33, 10));
      P.push(...lamp(1.5, 0.92, s * 0.48));
      P.push(part(bx(0.75, 0.3, 0.02), 0x15191c, -0.6, 1.3, s * 0.68)) /* open side under the top */;
    }
    P.push(...W(-0.35, 0.72, 0.72, 0.31, 0.16, TYRE, c, 10)); /* the spare on the right side, its inner face on the body side */
    return P;
  }, { L: 3.38, W: 1.52, H: 1.68, name: 'Kurogane Type 95 scout car' });
  /* Isuzu Type 98 Ko-Hi half-track prime mover: 4.65 x 1.90 x 2.15 m; truck cab and bonnet, short bed over a tracked bogie */
  MODELS.add('jp-ko-hi', () => {
    const c = C3[0],
      F0 = 0.66,
      F1 = 0.84 /* frame rails */,
      P = [];
    for (const sz of [-1, 1]) P.push(part(bx(4.55, F1 - F0, 0.12), DK, 0, (F0 + F1) / 2, sz * 0.4));
    for (const x of [2.2, 0.0, -2.2]) P.push(part(bx(0.12, 0.14, 0.92), DK, x, 0.75, 0));
    P.push(
      GX.ext([[1.0, F1 - 0.02], [2.12, F1 - 0.02], [2.3, 0.98], [2.3, 1.35], [2.15, 1.45], [1.0, 1.45]], 0.95, c) /* bonnet, sides to the rails */,
      part(bx(0.04, 0.5, 0.8), 0x2e2d29, 2.31, 1.12, 0),
      part(bx(0.12, 0.14, 1.7), DK, 2.33, 0.72, 0) /* bumper on the rail ends */,
      GX.ext([[-0.05, F1 - 0.02], [1.0, F1 - 0.02], [1.0, 1.45], [0.95, 1.85], [-0.05, 1.85]], 1.82, c) /* cab, on the rails */,
      GX.ext([[-0.05, 1.83], [0.95, 1.83], [0.9, 2.12], [-0.05, 2.15]], 1.84, CANVAS),
      part(bx(0.04, 0.38, 1.5), GLASS, 0.97, 1.65, 0, 0, 0, -0.1),
    );
    for (const x of [-2.1, -1.2, -0.3]) P.push(part(bx(0.15, 0.2, 1.9), 0x4d3c2c, x, F1 + 0.1, 0)); /* bed bolsters */
    P.push(part(bx(2.2, 0.12, 1.9), WOOD, -1.2, F1 + 0.26, 0));
    /* front axle on springs */
    P.push(part(cyl(0.06, 0.06, 1.44, 8), DK, 1.62, 0.42, 0, Z));
    for (const sz of [-1, 1]) {
      P.push(part(bx(2.2, 0.48, 0.05), c, -1.2, F1 + 0.56, sz * 0.93), part(bx(0.85, 0.36, 0.02), 0x15191c, 0.45, 1.62, sz * 0.92));
      P.push(part(bx(0.8, F0 - 0.44, 0.1), 0x2e2e2a, 1.62, (F0 + 0.44) / 2, sz * 0.4));
      P.push(GX.ext([[0.95, 0.8], [1.2, 1.0], [2.0, 1.02], [2.25, 0.8], [2.12, 0.72], [1.95, 0.86], [1.3, 0.86], [1.1, 0.78]], 0.47, c, sz * 0.71)); /* mudguard from the bonnet side */
      P.push(...W(1.62, 0.42, sz * 0.72, 0.42, 0.25, TYRE, 0x3b3a33));
      P.push(...lamp(2.1, 1.08, sz * 0.7));
      /* the tracked bogie: hung from the rail on two brackets; track loop, four road wheels, sprocket forward, idler aft */
      P.push(part(bx(1.9, 0.2, 0.12), 0x2e2e2a, -1.15, 0.62, sz * 0.62)); /* bogie beam under the rail, out to the track */
      for (const x of [-1.9, -0.4]) P.push(part(bx(0.15, 0.3, 0.3), 0x2e2e2a, x, 0.68, sz * 0.5));
      P.push(GX.ext([[-2.3, 0.45], [-2.1, 0.08], [-0.3, 0.06], [0.05, 0.42], [-0.05, 0.75], [-2.2, 0.72]], 0.32, 0x2a2a26, sz * 0.78));
      for (const x of [-1.85, -1.4, -0.95, -0.5]) P.push(...GX.tyre(x, 0.3, sz * 0.78, 0.24, 0.34, 0x262624, 0x3a3b33, 12)); /* rubber-tyred road wheels */
      P.push(...GX.tyre(-0.1, 0.48, sz * 0.78, 0.27, 0.34, 0x3a3b33, 0x2e2f29, 12), ...GX.tyre(-2.18, 0.45, sz * 0.78, 0.22, 0.34, 0x3a3b33, 0x2e2f29, 12)); /* sprocket and idler */
    }
    P.push(part(bx(0.5, 0.06, 0.06), DK, -2.45, 0.75, 0)); /* the towing pintle, on the rear cross member */
    return GX.camo(P, [c], C3, 0.9, 1.7);
  }, { L: 4.65, W: 1.9, H: 2.15, name: 'Isuzu Type 98 Ko-Hi half-track prime mover' });
  /* Type 95 Ha-Go light tank: 4.30 x 2.07 x 2.28 m; riveted hull, turret offset to the left with its cupola, 37 mm gun, bow MG,
     bell-crank suspension (two bogies of two road wheels a side), muffler on the right fender */
  MODELS.add('jp-ha-go', () => {
    const c = C3[0],
      P = [
        /* lower hull and the superstructure over the tracks (side profile, extruded) */
        GX.ext([[-2.05, 0.55], [1.7, 0.55], [2.15, 0.82], [2.12, 1.0], [1.55, 1.15], [1.25, 1.5], [0.85, 1.55], [-1.55, 1.55], [-2.05, 1.35]], 1.56, c),
        part(bx(0.5, 0.25, 0.55), c, 1.05, 1.6, 0.42) /* the driver's position */,
        part(bx(0.04, 0.06, 0.3), 0x111111, 1.32, 1.6, 0.42),
        part(cyl(0.035, 0.035, 0.45, 6), 0x2b2b28, 1.35, 1.35, -0.38, 0, 0, -Z) /* bow machine gun */,
        part(cyl(0.11, 0.11, 0.1, 8), c, 1.18, 1.35, -0.38, 0, 0, -Z),
        /* engine deck: grilles and the radiator */
        part(bx(1.1, 0.04, 1.2), 0x3c3d33, -1.15, 1.57, 0),
      ];
    /* the turret, offset to the left (port), with the commander's cupola, 37 mm gun forward and the rear-facing machine gun */
    const tz = -0.22;
    P.push(
      part(cyl(0.58, 0.64, 0.5, 12), c, 0.15, 1.8, tz),
      part(cyl(0.3, 0.34, 0.22, 10), c, -0.05, 2.15, tz - 0.08),
      part(cyl(0.18, 0.18, 0.06, 10), 0x3c3d33, -0.05, 2.27, tz - 0.08),
      part(bx(0.3, 0.3, 0.32), c, 0.72, 1.82, tz),
      part(cyl(0.045, 0.05, 1.05, 8), 0x2b2b28, 1.35, 1.84, tz, 0, 0, -Z),
      part(cyl(0.03, 0.03, 0.4, 6), 0x2b2b28, -0.55, 1.88, tz + 0.35, 0, 0.6, Z),
    );
    for (const s of [-1, 1]) {
      const z = s * 0.89;
      P.push(GX.ext([[-2.12, 0.5], [-1.88, 0.1], [1.45, 0.08], [1.98, 0.58], [1.88, 0.86], [-1.95, 0.8]], 0.28, 0x262622, z));
      for (const x of [-1.25, -0.6, 0.15, 0.8]) P.push(...GX.tyre(x, 0.33, z, 0.27, 0.3, 0x262624, 0x3a3b33, 12)); /* rubber-tyred road wheels */
      for (const x of [-0.92, 0.48]) P.push(part(bx(0.85, 0.16, 0.06), 0x3a3b33, x, 0.48, z + s * 0.17), part(cyl(0.12, 0.12, 0.12, 8), 0x3a3b33, x, 0.5, z + s * 0.2, Z)); /* bell cranks and their springs */
      P.push(...GX.tyre(1.72, 0.6, z, 0.29, 0.3, 0x3a3b33, 0x2e2f29, 12), ...GX.tyre(-1.88, 0.5, z, 0.23, 0.3, 0x3a3b33, 0x2e2f29, 12)); /* sprocket and idler */
      for (const x of [-0.6, 0.6]) P.push(part(cyl(0.08, 0.08, 0.3, 6), 0x3a3b33, x, 0.85, z, Z));
      P.push(part(bx(3.8, 0.04, 0.32), c, -0.15, 1.02, z)); /* fender */
    }
    P.push(part(cyl(0.11, 0.11, 0.95, 8), 0x4d4436, -0.85, 1.14, 0.9, 0, 0, Z)); /* muffler, lying on the right fender */
    for (let i = 0; i < 12; i++) P.push(part(bx(0.04, 0.04, 0.02), 0x3c3d33, -1.6 + i * 0.25, 1.45, 0.785), part(bx(0.04, 0.04, 0.02), 0x3c3d33, -1.6 + i * 0.25, 1.45, -0.785)); /* rivets, along the superstructure side */
    return GX.camo(P, [c], C3, 0.85, 0.4);
  }, { L: 4.3, W: 2.07, H: 2.28, name: 'Type 95 Ha-Go light tank' });
  /* Komatsu G40 (IJN) / Kato tractor, the Japanese aircraft tug: ~3.4 x 1.6 x 1.5 m; navy grey-blue, yellow anchor on the grille */
  MODELS.add('jp-tug', (col) => {
    const c = col || 0x6c7a84 /* navy grey-blue; the army's in khaki-brown */,
      P = [
        part(bx(2.5, 0.16, 0.6), DK, -0.15, 0.5, 0) /* the frame, carried on both axles */,
        GX.ext([[-1.25, 0.56], [0.9, 0.56], [0.9, 1.15], [0.75, 1.25], [-0.2, 1.25], [-0.2, 0.95], [-1.25, 0.95]], 0.95, c) /* engine and body, on the frame */,
        part(bx(0.06, 0.6, 0.75), 0x2c3238, 0.93, 0.88, 0) /* radiator, in the body's nose */,
        part(bx(0.02, 0.18, 0.12), 0xd9b92a, 0.965, 0.95, 0) /* the yellow anchor */,
        part(bx(0.5, 0.12, 0.5), 0x2b2b28, -0.75, 1.0, 0) /* seat, on the body */,
        part(bx(0.06, 0.45, 0.45), 0x2b2b28, -1.0, 1.28, 0),
        GX.rod([-0.21, 0.94, 0], [-0.46, 1.41, 0], 0.03, DK) /* steering column, from the foot of the body's step */,
        part(cyl(0.18, 0.18, 0.04, 10), DK, -0.46, 1.41, 0, 0, 0, 0.5),
        GX.rod([0.2, 1.24, 0.3], [0.2, 1.65, 0.3], 0.05, 0x2b2b28) /* exhaust stack, on the bonnet */,
        part(bx(0.35, 0.1, 0.25), DK, 1.05, 0.52, 0) /* front pintle, on the frame */,
        part(bx(0.35, 0.1, 0.25), DK, -1.45, 0.52, 0) /* rear pintle */,
      ];
    for (const [x, r, w, zw] of [[0.55, 0.38, 0.22, 0.62], [-0.85, 0.42, 0.3, 0.6]]) {
      P.push(part(cyl(0.06, 0.06, 2 * zw, 8), DK, x, r, 0, Z)); /* the axle, through the hubs */
      for (const s of [-1, 1]) P.push(...W(x, r, s * zw, r, w, TYRE, c, 10));
      P.push(part(bx(0.3, Math.max(0.05, 0.42 - r + 0.08), 0.5), DK, x, (r + 0.5) / 2, 0)); /* axle to frame */
    }
    return P;
  }, { L: 3.4, W: 1.6, H: 1.5, name: 'Komatsu G40 / Kato tractor (aircraft tug)' });
})();
