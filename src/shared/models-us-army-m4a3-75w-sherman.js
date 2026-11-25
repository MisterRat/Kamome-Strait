/* ---------- the M4A3(75)W Sherman, late production (PLAN_M4A3_Sherman_Tank 3, 3.1): the tank simulator's own and every display copy ----------
   us-m4a3   the Medium Tank M4A3(75)W: the large-hatch welded hull with the 47 deg glacis, VVSS (three bogies a side, the late trailing
             return rollers), the high-bustle D78461 turret with the oval loader's hatch, the pistol port and the commander's all-round
             vision cupola, the 75 mm M3 in the M34A1 mount (the wide rotor shield over the coax and the direct telescope), the .50 M2HB
             on the turret roof, the bow .30 in its ball mount, sandshields.
   Sources (References/M4A3/): the M4A3(75)W late-production spec sheet (every dimension: 247 in long with sandshields, 105 in wide
   with them, 115.7 in high over the cupola, tread 83 in, ground clearance 17 in, fire height 88 in, turret ring 69 in, tracks
   16.56 in, 147 in on the ground, 12 road wheels 20 in, idler 22 in, sprocket 13 teeth 25.04 in pitch diameter); TM 9-2800 (1943)
   page 112 (232.5 in long and 103 in wide without sandshields, 111.75 in high without the cupola); the line drawings and the
   sub-variant side views (the large-hatch 75W profile); the 75 mm M3's 118.4 in from muzzle to breech face.
   In metres, nose along +x, ground at y = 0, the left (port) side at -z; the turret ring's centre at x = TX. The turret and gun are
   their own lists (turret(), gun()) so the simulator can traverse and elevate them; MODELS.get('us-m4a3') returns the whole tank as one
   list for a display copy (gun forward, level). Paint: US Army olive drab, the white star on the hull sides and the turret. */
const M4A3 = (() => {
  const { part, bx, cyl, sph } = GX,
    OD = 0x4f5530 /* olive drab, sun-faded */,
    OD2 = 0x454b29 /* the shadowed faces, the cast turret */,
    OD3 = 0x5c6238 /* the lit upper faces */,
    DARK = 0x2c2e22 /* grilles, openings */,
    STEEL = 0x3b3a35 /* the tracks' steel chevron shoes */,
    RUB = 0x1f1f1d /* road wheel tyres */,
    GUNM = 0x3e4128 /* the gun, painted */,
    GLASS = 0x6b7d86,
    WHITE = 0xdcdcd2,
    Z = Math.PI / 2;
  /* the key heights and stations (metres) */
  const K = {
    L: 5.906 /* hull 232.5 in, without sandshields */,
    X0: -2.953 /* the rearmost point (the exhaust deflector's hood); the rear plate is RP */,
    X1: 2.953 /* the nose's foremost point */,
    W: 2.616 /* hull over the sponsons, 103 in */,
    WS: 2.667 /* over the sandshields, 105 in */,
    TRK: 2.108 /* track centres, 83 in */,
    TW: 0.421 /* track width, 16.56 in */,
    CLR: 0.432 /* ground clearance, 17 in */,
    DECK: 1.89 /* the hull roof */,
    SP: 1.0 /* the sponsons' underside, over the tracks */,
    TX: 0.05 /* the turret ring's centre */,
    RING: 0.876 /* the turret ring's radius, 69 in inside */,
    FIRE: 2.235 /* the gun's axis, the fire height 88 in */,
    ROOF: 2.6 /* the turret roof */,
    TOP: 2.939 /* over the cupola, 115.7 in */,
    RW: 0.254 /* road wheel radius, 20 in */,
    SPR: 0.318 /* sprocket pitch radius, 25.04 in */,
    IDL: 0.279 /* idler radius, 22 in */,
  };
  K.RP = K.X0 + 0.25 /* the rear plate */;
  K.F0 = -3.12 /* the rear mudguards' ends */;
  K.F1 = 3.15 /* the front mudguards' ends: 6.27 m with the sandshields (247 in) */;
  K.SX = 2.36; /* the sprocket's centre */
  K.SY = 0.66;
  K.IX = -2.62; /* the idler's centre (at the rear, adjustable) */
  K.IY = 0.56;
  K.BOG = [1.3, -0.17, -1.64] /* the three bogies' centres; wheels 0.27 m either side: 147 in on the ground */;
  /* the hull: a side profile extruded across. The upper hull (sponsons over the tracks) from the rear plate to the glacis; the lower
     hull between the tracks with the rounded final-drive nose */
  const hull = () => {
    const P = [],
      g1 = 1.53 /* the glacis's top edge */,
      gy = 1.02 /* its foot */,
      g2 = g1 + (K.DECK - gy) * Math.tan((47 * Math.PI) / 180) /* 47 deg from vertical */;
    P.push(
      GX.ext(
        [
          [K.RP, K.SP],
          [K.RP, K.DECK - 0.06],
          [K.RP + 0.08, K.DECK],
          [g1, K.DECK],
          [g2, gy],
          [g2, K.SP],
        ],
        K.W,
        OD,
      ),
    );
    /* the lower hull and the nose: 4.25 in rounded to 2 in under the final drives */
    P.push(
      GX.ext(
        [
          [K.RP + 0.08, 0.62],
          [K.RP, K.SP + 0.02],
          [g2, K.SP + 0.02],
          [g2 + 0.2, 0.98],
          [K.X1 - 0.08, 0.86],
          [K.X1, 0.72],
          [K.X1 - 0.04, 0.6],
          [K.X1 - 0.2, 0.5],
          [K.X1 - 0.5, K.CLR + 0.03],
          [K.RP + 0.45, K.CLR],
          [K.RP + 0.18, 0.48],
        ],
        K.TRK - K.TW - 0.06,
        OD2,
      ),
    );
    /* the final-drive housing's bolted flange across the nose, the two towing clevises */
    P.push(part(bx(0.06, 0.07, K.TRK - K.TW), OD3, g2 + 0.12, 0.99, 0));
    for (const s of [-1, 1]) P.push(part(bx(0.16, 0.1, 0.08), OD2, K.X1 - 0.02, 0.56, s * 0.42), part(cyl(0.035, 0.035, 0.16, 8), DARK, K.X1 + 0.03, 0.56, s * 0.42, Z));
    /* the sandshields along each side over the tracks (they add 15 in of length and 1 1/8 in of width), the front and rear mudguards */
    for (const s of [-1, 1]) {
      P.push(part(bx(K.X1 - K.RP - 0.3, 0.26, 0.012), OD, (K.RP + K.X1) / 2 - 0.05, K.SP + 0.1, s * (K.WS / 2 - 0.006)));
      P.push(part(bx(0.5, 0.012, K.TW + 0.06), OD, K.F1 - 0.24, 0.96, s * (K.TRK / 2), 0, 0, -0.38) /* the front mudguard, sloping down over the sprocket */);
      P.push(part(bx(0.5, 0.012, K.TW + 0.06), OD, K.F0 + 0.24, 0.99, s * (K.TRK / 2), 0, 0, 0.28) /* the rear mudguard */);
    }
    /* the glacis: the large hatches' raised hoods for the driver (left) and the assistant driver (right), the hatches and their
       periscopes; the ventilator dome between them; the bow gun's ball mount on the right; the headlights with their brush guards */
    const gm = (f) => [g1 + (g2 - g1) * f, K.DECK - (K.DECK - gy) * f] /* a point on the glacis, f from its top */;
    for (const s of [-1, 1]) {
      P.push(part(bx(0.62, 0.11, 0.78), OD3, g1 - 0.32, K.DECK + 0.05, s * 0.52));
      P.push(part(cyl(0.29, 0.31, 0.06, 14), OD, g1 - 0.33, K.DECK + 0.13, s * 0.52) /* the large hatch */);
      P.push(part(bx(0.12, 0.08, 0.17), DARK, g1 - 0.12, K.DECK + 0.14, s * 0.62), part(bx(0.02, 0.05, 0.13), GLASS, g1 - 0.05, K.DECK + 0.15, s * 0.62));
      P.push(part(bx(0.1, 0.07, 0.15), DARK, g1 - 0.42, K.DECK + 0.19, s * 0.4) /* the hatch's own rotating periscope */);
      const [hx, hy] = gm(0.18);
      P.push(part(cyl(0.07, 0.08, 0.11, 10), DARK, hx + 0.03, hy + 0.06, s * 1.05, 0, 0, -0.75), part(cyl(0.065, 0.065, 0.02, 10), 0xc9c6a6, hx + 0.08, hy + 0.1, s * 1.05, 0, 0, -0.75));
      P.push(part(bx(0.02, 0.2, 0.2), OD3, hx + 0.15, hy + 0.08, s * 1.05, 0, 0, -0.75) /* the brush guard */);
    }
    P.push(part(sph(10), OD2, g1 - 0.15, K.DECK + 0.02, 0, 0, 0, 0, 0.16, 0.09, 0.16) /* the ventilator */);
    {
      const [bx0, by0] = gm(0.42);
      P.push(part(sph(12), OD2, bx0 + 0.02, by0 + 0.02, 0.45, 0, 0, 0, 0.17, 0.17, 0.17));
      P.push(part(cyl(0.022, 0.026, 0.42, 8), GUNM, bx0 + 0.22, by0 + 0.06, 0.45, 0, 0, -Z) /* the bow .30's barrel jacket */);
      P.push(part(bx(0.04, 0.24, 0.34), OD3, bx0 - 0.05, by0 - 0.02, 0.45, 0, 0, -0.82) /* the mount's armoured boss on the plate */);
    }
    /* lifting rings at the glacis corners; the siren on the left mudguard */
    for (const s of [-1, 1]) P.push(part(cyl(0.05, 0.05, 0.025, 8), OD3, g1 + 0.05, K.DECK + 0.02, s * 1.15, Z));
    P.push(part(cyl(0.06, 0.07, 0.12, 10), OD2, g2 + 0.12, 1.07, -1.05, 0, 0, -Z));
    /* the engine deck: the grille doors over the radiator, the two big access doors, fuel filler caps, the tools (shovel, axe,
       crowbar, sledge) strapped along the sides */
    P.push(part(bx(1.1, 0.03, 1.5), OD3, K.RP + 0.75, K.DECK + 0.015, 0));
    for (let i = 0; i < 9; i++) P.push(part(bx(0.06, 0.012, 1.4), DARK, K.RP + 0.3 + i * 0.11, K.DECK + 0.035, 0));
    for (const s of [-1, 1]) P.push(part(bx(0.95, 0.025, 0.62), OD3, K.RP + 1.3, K.DECK + 0.013, s * 0.38), part(cyl(0.07, 0.07, 0.03, 10), OD2, K.RP + 1.2, K.DECK + 0.03, s * 1.08));
    P.push(part(bx(1.3, 0.04, 0.06), 0x6f5a3c, K.RP + 1.5, K.DECK + 0.04, 1.2), part(bx(0.28, 0.05, 0.2), DARK, K.RP + 0.8, K.DECK + 0.04, 1.2));
    P.push(part(bx(1.4, 0.045, 0.05), DARK, K.RP + 1.6, K.DECK + 0.04, -1.2), part(bx(0.9, 0.04, 0.06), 0x6f5a3c, K.RP + 0.8, K.DECK + 0.04, -1.12));
    /* the rear plate: the exhaust deflector (the big hood over the exhausts), the towing pintle, the idler adjusters, the
       tank-infantry telephone box on the right rear (Okinawa) */
    P.push(part(bx(0.24, 0.36, K.W - 0.5), OD2, K.X0 + 0.12, 1.3, 0), part(bx(0.27, 0.03, K.W - 0.46), OD3, K.X0 + 0.135, 1.49, 0, 0, 0, 0.25) /* the hood's lip */);
    P.push(part(bx(0.16, 0.18, 0.16), DARK, K.RP - 0.08, 0.92, 0), part(bx(0.2, 0.32, 0.18), OD3, K.RP - 0.1, 1.45, 0.92));
    for (const s of [-1, 1]) P.push(part(bx(0.1, 0.12, 0.12), OD, K.RP - 0.05, 0.72, s * 0.72));
    /* the white stars on the hull sides */
    for (const s of [-1, 1]) P.push(star(0.21, WHITE, -0.55, 1.47, s * (K.W / 2 + 0.004), s > 0 ? 0 : Math.PI));
    return P.filter(Boolean);
  };
  /* a five-pointed star of radius r on a vertical face, facing +z (ry turns it) */
  const star = (r, hex, x, y, z, ry) => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        rr = i % 2 ? r * 0.382 : r;
      i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    return part(new THREE.ShapeGeometry(s), hex, x, y, z, 0, ry, 0);
  };
  /* one side's running gear (s = -1 left, 1 right): the drive sprocket at the front, the idler at the rear, three VVSS bogies of two
     road wheels each with their volute spring housings and trailing return rollers, and the track round them */
  const gear = (s) => {
    const P = [],
      z = (s * K.TRK) / 2,
      zo = z + s * 0.02;
    /* the sprocket: two toothed rings on the final drive's hub */
    for (const d of [-0.12, 0.12]) P.push(part(cyl(K.SPR + 0.03, K.SPR + 0.03, 0.05, 13), OD2, K.SX, K.SY, z + d, Z));
    P.push(part(cyl(0.2, 0.22, 0.32, 12), OD, K.SX, K.SY, z, Z), part(cyl(0.12, 0.12, 0.06, 10), OD3, K.SX, K.SY, z + s * 0.17, Z));
    /* the idler: a dished wheel */
    P.push(part(cyl(K.IDL, K.IDL, 0.3, 14), OD2, K.IX, K.IY, z, Z), part(cyl(0.1, 0.1, 0.05, 10), OD3, K.IX, K.IY, z + s * 0.16, Z));
    for (const bx0 of K.BOG) {
      /* the bogie bracket bolted to the hull, the volute spring housing, the two arms */
      /* the bracket: a tall casting between the two wheels, from the arms' pivots up to the skid under the track's top run */
      P.push(part(bx(0.46, 0.5, 0.2), OD2, bx0, 0.7, z - s * 0.04));
      P.push(part(bx(0.3, 0.05, 0.24), OD3, bx0, 0.97, z - s * 0.02) /* the skid */);
      P.push(part(bx(0.2, 0.26, 0.2), OD, bx0, 0.46, z + s * 0.08) /* the volute spring housing */);
      for (const d of [-1, 1]) {
        P.push(part(bx(0.34, 0.07, 0.07), OD2, bx0 + d * 0.15, 0.37, z + s * 0.12, 0, 0, d * 0.35));
        /* the road wheel: a pair of discs on rubber tyres */
        P.push(part(cyl(K.RW, K.RW, 0.24, 14), RUB, bx0 + d * 0.27, K.RW + 0.05, z, Z), part(cyl(0.17, 0.17, 0.25, 12), OD2, bx0 + d * 0.27, K.RW + 0.05, z, Z));
        P.push(part(cyl(0.07, 0.07, 0.27, 8), OD3, bx0 + d * 0.27, K.RW + 0.05, z, Z));
      }
      /* the trailing return roller on its arm at the bracket's rear */
      P.push(part(cyl(0.11, 0.11, 0.22, 10), RUB, bx0 - 0.28, 0.96, z, Z), part(bx(0.22, 0.06, 0.06), OD2, bx0 - 0.18, 0.92, z - s * 0.1, 0, 0, 0.3));
    }
    /* the track: the ground run, the top run over the return rollers, the runs up to the sprocket and down to the idler, and the
       wraps round them. Shoes 6 in long: the chevron bars across every shoe, one part per run (steel T54E1) */
    const run = (x0, y0, x1, y1) => {
      const L = Math.hypot(x1 - x0, y1 - y0),
        a = Math.atan2(y1 - y0, x1 - x0),
        mx = (x0 + x1) / 2,
        my = (y0 + y1) / 2,
        nx = -Math.sin(a) * 0.03,
        ny = Math.cos(a) * 0.03;
      P.push(part(bx(L, 0.06, K.TW), STEEL, mx, my, z, 0, 0, a));
      const n = Math.floor(L / 0.1524);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        P.push(part(bx(0.05, 0.015, K.TW - 0.06), 0x2e2d2a, x0 + (x1 - x0) * t - nx * 1.2, y0 + (y1 - y0) * t - ny * 1.2, z, 0, 0, a));
      }
    };
    const ys = 0.03,
      w0 = K.BOG[0] + 0.27,
      w1 = K.BOG[2] - 0.27,
      top = 1.1;
    run(w1, ys, w0, ys);
    run(w0, ys, K.SX + 0.08, K.SY - K.SPR - 0.02);
    run(K.SX - 0.05, K.SY + K.SPR + 0.05, K.BOG[2] - 0.28, top - 0.07);
    run(K.BOG[2] - 0.28, top - 0.07, K.IX + 0.05, K.IY + K.IDL + 0.03);
    run(w1, ys, K.IX - 0.05, K.IY - K.IDL - 0.02);
    /* the wraps: short runs round the sprocket and the idler */
    for (const [cx, cy, r, a0, a1] of [
      [K.SX, K.SY, K.SPR + 0.05, -1.3, 1.6],
      [K.IX, K.IY, K.IDL + 0.03, 1.6, 4.5],
    ])
      for (let i = 0; i < 4; i++) {
        const b0 = a0 + ((a1 - a0) * i) / 4,
          b1 = a0 + ((a1 - a0) * (i + 1)) / 4;
        run(cx + Math.cos(b0) * r, cy + Math.sin(b0) * r, cx + Math.cos(b1) * r, cy + Math.sin(b1) * r);
      }
    return P;
  };
  /* the turret, built about its own ring centre (x = 0, y = 0 at the hull roof): the high-bustle cast turret as a loft of rounded
     rings, the roof, the cupola, the hatches, the periscopes, the pistol port, the radio aerial base and the .50 */
  const turret = () => {
    const P = [],
      /* the plan at the ring (y 0): front x 0.98 rounded, sides z +-0.95, the bustle back to x -1.28 (high: it starts above the
         rear deck's hatch hoods); the casting rounds in toward the roof */
      plan = (k, dx, bust) => {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const a = -Z + (i / 12) * Math.PI;
          pts.push([Math.cos(a) * 0.98 * k + dx, Math.sin(a) * 0.95 * k]);
        }
        pts.push([-0.55 * k + dx, 0.95 * k], [-1.1 * bust + dx, 0.82 * k], [-1.28 * bust + dx, 0.55 * k], [-1.3 * bust + dx, 0], [-1.28 * bust + dx, -0.55 * k], [-1.1 * bust + dx, -0.82 * k], [-0.55 * k + dx, -0.95 * k]);
        pts.push(pts[0]);
        return pts;
      },
      rows = [
        [0.0, 0.94, 0.92],
        [0.12, 0.99, 0.98],
        [0.36, 1.0, 1.0],
        [0.56, 0.97, 0.98],
        [0.68, 0.9, 0.94],
        [K.ROOF - K.DECK, 0.8, 0.88],
      ].map(([y, k, b]) => plan(k, 0.02, b).map(([x, zz]) => [x, y, zz]));
    P.push(GX.grid(rows, OD2));
    P.push(GX.plan(plan(0.8, 0.02, 0.88).slice(0, -1).map(([x, zz]) => [x, zz]), 0.03, OD, K.ROOF - K.DECK - 0.015));
    /* the cupola bulge on the right rear (the late castings, November 1944 on) */
    P.push(part(sph(12), OD2, -0.3, 0.42, 0.62, 0, 0, 0, 0.42, 0.3, 0.32));
    const ry = K.ROOF - K.DECK;
    /* the commander's all-round vision cupola: the ring with six vision blocks, the hatch dome; its top at 115.7 in */
    const cx = -0.3,
      cz = 0.42,
      ct = K.TOP - K.DECK;
    P.push(part(cyl(0.34, 0.37, ct - ry - 0.1, 12), OD, cx, ry + (ct - ry - 0.1) / 2, cz));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.2832 + 0.26;
      P.push(part(bx(0.06, 0.08, 0.13), GLASS, cx + Math.cos(a) * 0.345, ry + 0.13, cz + Math.sin(a) * 0.345, 0, -a, 0));
    }
    P.push(part(cyl(0.3, 0.32, 0.08, 12), OD3, cx, ct - 0.06, cz), part(cyl(0.05, 0.05, 0.04, 8), OD2, cx, ct - 0.01, cz) /* the hatch's own periscope */);
    /* the loader's oval hatch on the left, his periscope; the gunner's M10C periscope ahead of the commander */
    P.push(part(cyl(0.3, 0.31, 0.05, 14), OD3, -0.15, ry + 0.03, -0.45, 0, 0, 0, 1, 1, 0.72));
    P.push(part(bx(0.12, 0.09, 0.18), DARK, 0.3, ry + 0.06, -0.52), part(bx(0.22, 0.12, 0.2), OD, 0.55, ry + 0.05, 0.36), part(bx(0.02, 0.07, 0.14), GLASS, 0.66, ry + 0.07, 0.36));
    /* the pistol port on the left rear wall; the ventilator dome; the lifting rings; the aerial base on the bustle's right */
    P.push(part(cyl(0.11, 0.11, 0.05, 10), OD3, -0.75, 0.42, -0.9, Z, 0, 0.35));
    P.push(part(sph(8), OD, 0.1, ry, 0.05, 0, 0, 0, 0.12, 0.07, 0.12));
    for (const s of [-1, 1]) P.push(part(cyl(0.045, 0.045, 0.025, 8), OD3, 0.5, ry - 0.02, s * 0.72, Z));
    P.push(part(cyl(0.05, 0.06, 0.1, 8), OD3, -1.05, ry + 0.02, 0.55), part(cyl(0.006, 0.01, 2.2, 4), DARK, -1.05, ry + 1.15, 0.55));
    /* the .50 M2HB on its pintle behind the cupola, its barrel forward over the turret, the ammunition box on the mount */
    P.push(part(cyl(0.035, 0.035, 0.3, 8), OD2, -0.82, ry + 0.15, 0.1));
    P.push(part(bx(0.8, 0.14, 0.11), GUNM, -0.62, ry + 0.36, 0.1), part(cyl(0.022, 0.022, 1.14, 8), GUNM, 0.33, ry + 0.38, 0.1, 0, 0, -Z), part(cyl(0.035, 0.035, 0.42, 8), DARK, -0.02, ry + 0.38, 0.1, 0, 0, -Z));
    P.push(part(bx(0.26, 0.16, 0.1), OD3, -0.62, ry + 0.25, 0.2));
    /* the star on each side of the turret */
    for (const s of [-1, 1]) P.push(star(0.19, WHITE, -0.45, 0.36, s * 0.955, s > 0 ? 0 : Math.PI));
    return P;
  };
  /* the gun, built about its trunnions (x = 0 at the gun shield's face line, y = 0 on the axis): the M34A1 gun shield (3.5 in) with its
     wide rotor shield, the coax .30's port and the telescope's on either side, the tube (40 calibres; the muzzle 118.4 in ahead of
     the breech face, which is 0.95 m behind the shield's face) */
  const gun = () => {
    const P = [],
      Lt = 3.007 - 0.95;
    P.push(part(bx(0.36, 0.62, 1.02), OD2, -0.12, 0, 0) /* the rotor shield behind */);
    P.push(GX.ext([[-0.06, -0.3], [0.1, -0.24], [0.14, 0], [0.1, 0.24], [-0.06, 0.3]], 0.98, OD));
    P.push(part(cyl(0.12, 0.13, 0.22, 12), OD2, 0.22, 0, 0, 0, 0, -Z) /* the gun's collar */);
    P.push(part(cyl(0.058, 0.068, Lt - 0.3, 12), GUNM, 0.3 + (Lt - 0.3) / 2, 0, 0, 0, 0, -Z));
    P.push(part(cyl(0.064, 0.064, 0.08, 12), GUNM, Lt - 0.04, 0, 0, 0, 0, -Z) /* the muzzle's thickening */);
    P.push(part(cyl(0.038, 0.038, 0.02, 10), 0x111111, Lt + 0.002, 0, 0, 0, 0, -Z) /* the bore */);
    P.push(part(cyl(0.03, 0.03, 0.06, 8), DARK, 0.13, 0.02, 0.3, 0, 0, -Z) /* the coax port (right) */, part(cyl(0.03, 0.03, 0.06, 8), GLASS, 0.13, 0.1, -0.28, 0, 0, -Z) /* the telescope (left) */);
    return P;
  };
  /* the whole tank for a display copy: turret at bearing 0, gun level */
  const G = { gunX: 0.98 /* the shield's face from the ring centre */, gunY: K.FIRE - K.DECK };
  const whole = () => {
    const P = [...hull(), ...gear(-1), ...gear(1)],
      T = new GX.M4().makeTranslation(K.TX, K.DECK, 0),
      Gm = new GX.M4().makeTranslation(K.TX + G.gunX, K.FIRE, 0);
    for (const q of turret()) P.push({ ...q, m: new GX.M4().multiplyMatrices(T, q.m) });
    for (const q of gun()) P.push({ ...q, m: new GX.M4().multiplyMatrices(Gm, q.m) });
    return P;
  };
  MODELS.add('us-m4a3', whole, { name: 'Medium Tank M4A3(75)W, late production', L: 6.27, W: 2.667, H: 2.939 });
  return { K, G, hull, gear, turret, gun, whole };
})();
