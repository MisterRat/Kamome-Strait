/* ---------- airfield detail: runway numbers and markings, taxiway lines, parked fighters, trucks, drums ---------- */
{
  const Z = Math.PI / 2,
    Y = 1.5,
    { V3, Q, M4, cyl, bx, part, xf } = GX,
    sph = () => GX.sph(12),
    acc = new GX.Acc(),
    BL = [];
  const place = (P, x, z, yaw, bl, bw) => {
    acc.add(P, xf(x, 0.12, z, yaw));
    BL.push([x - 1.2, z - 0.6, yaw, bl, bw]);
  };
  const wheel = (x, z, r, w) => part(cyl(r, r, w, 10), 0x151515, x, r, z, Z);
  /* ---- smooth lifting surfaces: a lofted aerofoil section (rounded nose, thin tail) through any number of stations, so wings and
     fins are tapered and rounded instead of boxes. Station = [z, xLeadingEdge, xTrailingEdge, yCentre, thickness]; z runs ascending. ---- */
  const FR = [
    [0, 0],
    [0.04, 0.45],
    [0.15, 0.8],
    [0.35, 1],
    [0.65, 0.75],
    [0.9, 0.22],
    [1, 0],
    [0.9, -0.18],
    [0.65, -0.55],
    [0.35, -0.8],
    [0.15, -0.7],
    [0.04, -0.42],
  ];
  const foil = (st) => {
    const n = FR.length,
      pos = [],
      idx = [];
    for (const [z, xl, xt, y, t] of st) for (const [u, v] of FR) pos.push(xl + (xt - xl) * u, y + (v * t) / 2, z);
    const V = (i, j) => i * n + (j % n);
    const qd = [];
    for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < n; j++) qd.push([V(i, j), V(i + 1, j), V(i, j + 1), V(i + 1, j + 1)]);
    /* work out which way round the triangles must go so the upper surface faces up */
    const P = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]],
      a = P(V(0, 3)),
      b = P(V(1, 3)),
      c = P(V(0, 4)),
      ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
      fl = ny < 0;
    for (const [p0, p1, p2, p3] of qd) {
      if (fl) idx.push(p0, p2, p1, p1, p2, p3);
      else idx.push(p0, p1, p2, p2, p1, p3);
    }
    /* the two ends: a fan around the section centre, copied vertices so the edge stays crisp */
    for (const end of [0, st.length - 1]) {
      const base = pos.length / 3,
        [z, xl, xt, y] = st[end];
      for (let j = 0; j < n; j++) pos.push(pos[V(end, j) * 3], pos[V(end, j) * 3 + 1], pos[V(end, j) * 3 + 2]);
      pos.push((xl + xt) / 2, y, z);
      const cc = base + n,
        up = end ? 1 : -1; /* the outward direction along z */
      for (let j = 0; j < n; j++) {
        const p = base + j,
          q = base + ((j + 1) % n),
          // the sign of the z component of (q-p)x(cc-p) decides the winding
          cz = (pos[q * 3] - pos[p * 3]) * (pos[cc * 3 + 1] - pos[p * 3 + 1]) - (pos[q * 3 + 1] - pos[p * 3 + 1]) * (pos[cc * 3] - pos[p * 3]);
        if (cz * up > 0) idx.push(p, q, cc);
        else idx.push(p, cc, q);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  /* a wing from a chord table [[|z|, chord]...]: the quarter-chord line sits at x = qx(z); thickness is tk x chord; y rises with dihedral.
     Returns a builder for the whole wing or for a slice of it (z0..z1, chord fraction f0..f1 from the nose) made a little fatter by infl. */
  const mkWing = (tbl, qx, y0, dih, tk) => {
    const cz = (z) => {
      z = Math.abs(z);
      for (let i = 0; i < tbl.length - 1; i++)
        if (z <= tbl[i + 1][0]) return tbl[i][1] + ((tbl[i + 1][1] - tbl[i][1]) * (z - tbl[i][0])) / (tbl[i + 1][0] - tbl[i][0] || 1);
      return tbl[tbl.length - 1][1];
    };
    const W = {
      c: cz,
      y: (z) => y0 + dih * Math.abs(z),
      top: (z) => y0 + dih * Math.abs(z) + (tk * cz(z)) / 2,
      build(z0, z1, f0, f1, infl) {
        f0 = f0 || 0;
        f1 = f1 == null ? 1 : f1;
        infl = infl || 0;
        const zs = new Set([z0, z1]);
        for (const [z] of tbl) for (const s of [-1, 1]) if (s * z > z0 && s * z < z1) zs.add(s * z);
        return foil(
          [...zs]
            .sort((p, q) => p - q)
            .map((z) => {
              const c = cz(z),
                xq = qx(z);
              return [z, xq + 0.25 * c - f0 * c + (f0 ? 0 : infl), xq + 0.25 * c - f1 * c - (f1 < 1 ? 0 : infl), W.y(z), tk * c + infl];
            }),
        );
      },
    };
    return W;
  };
  /* a fin standing up from the fuselage (root buried inside it): quarter-chord at x = xq0 - sweep*h, chord c0 -> c1, height h;
     f0..f1 is the part of the chord (a fin takes 0..0.62, a rudder 0.62..1). Built lying along z; stand it up with rx = -Z. */
  const mkFin = (xq0, sweep, c0, c1, h, f0, f1, tfac) =>
    foil(
      [-0.2, 0.0, h * 0.5, h * 0.9, h].map((z) => {
        const k = Math.max(0, z) / h,
          c = c0 + (c1 - c0) * k,
          xq = xq0 - sweep * Math.max(0, z);
        return [z, xq + 0.25 * c - f0 * c, xq + 0.25 * c - f1 * c, 0, (tfac || 0.11) * c * (k > 0.9 ? 0.6 : 1)];
      }),
    );
  const PW = mkWing([[0, 2.7], [1.0, 2.6], [2.4, 2.2], [3.6, 1.85], [4.7, 1.4], [5.15, 1.0], [5.4, 0.55]], (z) => 0.6 - 0.05 * Math.abs(z), Y - 0.45, 0.02, 0.15),
    PT = mkWing([[0, 1.15], [1.0, 1.0], [1.6, 0.75], [1.9, 0.4], [1.97, 0.15]], () => -4.35, Y + 0.2, 0.012, 0.09),
    KW = mkWing([[0, 2.6], [1.2, 2.5], [3.0, 2.05], [4.4, 1.5], [5.2, 1.05], [5.5, 0.65], [5.62, 0.3]], (z) => 0.2 - 0.03 * Math.abs(z), Y - 0.45, 0.022, 0.15);
  /* a parked P-51 style fighter, nose toward local +x */
  const fighter = (body, trim, o) => {
    o = o || {};
    const P = [],
      under = o.under || 0x8c9096;
    P.push(part(cyl(0.78, 0.32, 7.8), body, -0.5, Y, 0, 0, 0, -Z));
    P.push(part(cyl(0.6, 0.78, 1.2), trim, 4.0, Y, 0, 0, 0, -Z));
    P.push(part(new THREE.ConeGeometry(0.32, 0.9, 12), o.spin || 0x1d1d1d, 5.05, Y, 0, 0, 0, -Z));
    P.push(part(bx(1.5, 0.5, 0.7), under, -0.2, Y - 0.85, 0));
    P.push(part(sph(), 0x27384a, -0.6, Y + 0.62, 0, 0, 0, 0, 1.15, 0.5, 0.45));
    P.push(part(PW.build(-5.4, 5.4), body, 0, 0, 0));
    P.push(part(PT.build(-1.97, 1.97), body, 0, 0, 0));
    for (const s of [-1, 1]) {
      P.push(part(bx(0.12, 0.95, 0.12), 0x6d7176, 0.3, 0.58, s * 1.35));
      P.push(wheel(0.3, s * 1.35, 0.4, 0.22));
      P.push(part(bx(0.14, 0.5, 0.7), under, 0.3, Y - 0.75, s * 1.35));
    }
    P.push(part(mkFin(-3.9, 0.35, 1.6, 0.75, 1.55, 0, 0.62), body, 0, Y + 0.1, 0, -Z)); /* fin, rooted in the fuselage */
    P.push(part(mkFin(-3.9, 0.35, 1.6, 0.75, 1.55, 0.62, 1, 0.07), trim, 0, Y + 0.1, 0, -Z)); /* rudder */
    P.push(part(bx(0.08, 1.0, 0.08), 0x6d7176, -4.0, 0.7, 0));
    P.push(part(sph(), 0x151515, -4.0, 0.17, 0, 0, 0, 0, 0.17, 0.17, 0.17));
    const a = o.ang || 0;
    P.push(part(bx(0.06, 3.0, 0.22), 0x181818, 4.62, Y, 0, a));
    P.push(part(bx(0.06, 3.0, 0.22), 0x181818, 4.62, Y, 0, a + Z));
    if (o.stripes) {
      let k = 0;
      for (const z of [2.3, 2.75, 3.2, 3.65, 4.1]) {
        P.push(part(PW.build(z - 0.2, z + 0.2, 0, 1, 0.02), k++ % 2 ? 0x15151a : 0xf1f1ec, 0, 0, 0));
        P.push(part(PW.build(-z - 0.2, -z + 0.2, 0, 1, 0.02), k % 2 ? 0x15151a : 0xf1f1ec, 0, 0, 0));
      }
      for (const [x, c] of [
        [-3.5, 0xf1f1ec],
        [-3.15, 0x15151a],
        [-2.8, 0xf1f1ec],
      ])
        P.push(part(cyl(0.43, 0.43, 0.3), c, x, Y, 0, 0, 0, -Z));
    } else
      for (const s of [-1, 1]) {
        P.push(part(cyl(0.42, 0.42, 0.04), 0x23346a, 0.05, PW.top(3.1) + 0.012, s * 3.1));
      }
    if (o.tanks)
      for (const s of [-1, 1]) P.push(part(cyl(0.3, 0.3, 2.4, 10), 0xa5aaaf, 0.4, Y - 0.88, s * 2.7, 0, 0, -Z));
    return P;
  };
  /* a parked Nakajima Ki-84 Hayate: the shared model (THE KI-84 HAYATE block) on its wheels, tail down, nose toward +x */
  const ki84 = (body, o) => KI84.parked({ body, ang: ((o && o.ang) || 0) * Math.PI });

  const fuelTruck = (c) => {
    const P = [];
    P.push(part(bx(7.2, 0.45, 2.2), 0x2d2f30, 0, 0.85, 0));
    P.push(part(bx(1.9, 1.7, 2.2), c, 2.7, 1.95, 0));
    P.push(part(bx(0.05, 0.8, 1.8), 0x1d2a33, 3.66, 2.25, 0));
    P.push(part(cyl(1.05, 1.05, 4.6), 0xa9afb4, -0.8, 2.15, 0, 0, 0, -Z));
    P.push(part(bx(0.6, 0.9, 1.7), 0x3a3d40, -3.1, 1.5, 0));
    for (const x of [2.4, -1.5, -2.8]) for (const s of [-1, 1]) P.push(wheel(x, s * 1.05, 0.55, 0.45));
    return P;
  };
  const cargoTruck = () => {
    const P = [];
    P.push(part(bx(7.2, 0.45, 2.2), 0x2d2f30, 0, 0.85, 0));
    P.push(part(bx(1.8, 1.6, 2.2), 0x56603f, 2.5, 1.9, 0));
    P.push(part(bx(1.2, 0.9, 2.0), 0x56603f, 3.7, 1.65, 0));
    P.push(part(bx(0.05, 0.7, 1.8), 0x1d2a33, 3.43, 2.3, 0));
    P.push(part(bx(4.8, 0.2, 2.4), 0x4a4d3a, -0.7, 1.2, 0));
    P.push(part(bx(4.6, 1.5, 2.2), 0x8b8667, -0.7, 2.05, 0));
    P.push(part(cyl(1.1, 1.1, 4.6, 10), 0x8b8667, -0.7, 2.8, 0, 0, 0, -Z));
    for (const x of [2.5, -1.8, -3.0]) for (const s of [-1, 1]) P.push(wheel(x, s * 1.05, 0.55, 0.45));
    return P;
  };
  const jeep = () => {
    const P = [];
    P.push(part(bx(3.0, 0.55, 1.55), 0x56603f, 0, 0.8, 0));
    P.push(part(bx(1.0, 0.4, 1.4), 0x56603f, 1.5, 1.2, 0));
    P.push(part(bx(0.05, 0.55, 1.4), 0x1d2a33, 0.55, 1.5, 0, 0, 0, -0.35));
    P.push(part(bx(0.55, 0.5, 1.2), 0x3f4630, -0.5, 1.15, 0));
    P.push(part(cyl(0.32, 0.32, 0.2, 10), 0x151515, -1.6, 1.1, 0, 0, 0, Z));
    for (const x of [1, -1]) for (const s of [-1, 1]) P.push(wheel(x, s * 0.82, 0.34, 0.28));
    return P;
  };
  const tug = () => {
    const P = [];
    P.push(part(bx(2.4, 0.8, 1.3), 0xc9a227, 0, 0.95, 0));
    P.push(part(bx(1.0, 0.8, 1.1), 0xc9a227, -0.2, 1.7, 0));
    P.push(part(bx(1.6, 0.08, 0.08), 0x333333, 2.0, 0.5, 0));
    for (const x of [0.8, -0.8]) for (const s of [-1, 1]) P.push(wheel(x, s * 0.7, 0.4, 0.3));
    return P;
  };
  const drums = () => {
    const P = [],
      cols = [0x56603f, 0x8b4a2b, 0x3b5675, 0x56603f];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++) P.push(part(cyl(0.3, 0.3, 0.88, 10), cols[(i + j) % 4], i * 0.72, 0.56, j * 0.72));
    for (let i = 0; i < 2; i++) P.push(part(cyl(0.3, 0.3, 0.88, 10), cols[i], 0.36 + i * 0.72, 1.44, 0.7));
    return P;
  };
  /* the line-up: six fighters in front of the apron's east side, two at the hangar doors */
  [
    [-108, 336, 0.1, 0xb7bcc2, 0xb22a24, {}],
    [-108, 360, -0.08, 0x5d6341, 0xd9b92a, { ang: 0.7 }],
    [-108, 384, 0.05, 0xb7bcc2, 0x222d5a, { stripes: 1, ang: 1.1 }],
    [-108, 408, -0.12, 0xb7bcc2, 0xd9b92a, { tanks: 1, ang: 0.3 }],
    [-108, 432, 0.08, 0x5d6341, 0xb22a24, { stripes: 1, ang: 0.2 }],
    [-108, 456, 0, 0xb7bcc2, 0x1e4fa3, { tanks: 1, ang: 0.9 }],
    [-163, 220, 0.05, 0x5d6341, 0xd9b92a, { ang: 0.5 }],
    [-163, 290, -0.1, 0xb7bcc2, 0xb22a24, { ang: 0.1 }],
  ].forEach((a) => place(fighter(a[3], a[4], a[5]), a[0], a[1], a[2], 12.5, 13));
  place(fuelTruck(0x56603f), -136, 345, -Z, 8, 3);
  place(cargoTruck(), -140, 392, Z, 8, 3);
  place(jeep(), -128, 422, 0.3, 4, 2.2);
  place(jeep(), -86, 314, 0.9, 4, 2.2);
  place(jeep(), -148, 262, -0.4, 4, 2.2);
  place(tug(), -124, 474, Z * 2, 3, 1.8);
  place(fuelTruck(0x9aa0a6), -152, 462, -0.2, 8, 3);
  place(cargoTruck(), -72, 466, Math.PI, 8, 3);
  place(drums(), -172, 330, 0, 3.2, 3.2);
  place(drums(), -178, 468, 0.3, 3.2, 3.2);
  {
    const g = acc.geometry();
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
  }
  /* the moving ones: each is its own small mesh; AFLD.update() drives them along their routes */
  const crew = (shirt) => {
    const P = [];
    P.push(part(bx(0.28, 0.7, 0.5), shirt, 0, 1.15, 0));
    P.push(part(bx(0.26, 0.8, 0.2), 0x4a4a3a, 0, 0.4, 0.13));
    P.push(part(bx(0.26, 0.8, 0.2), 0x4a4a3a, 0, 0.4, -0.13));
    P.push(part(bx(0.2, 0.6, 0.14), shirt, 0, 1.15, 0.34));
    P.push(part(bx(0.2, 0.6, 0.14), shirt, 0, 1.15, -0.34));
    P.push(part(sph(), 0xc89a7a, 0, 1.66, 0, 0, 0, 0, 0.14, 0.15, 0.14));
    P.push(part(sph(), 0x3b4228, 0, 1.74, 0, 0, 0, 0, 0.16, 0.1, 0.16));
    return P;
  };
  /* the fighter that taxis about is going to and from the hangar for repair tests: it stands at the first hangar, a mechanic walks out to look it over,
     goes back in, and it taxis to the run-up spot at the east end of the taxiway and back */
  AFLD.addRepair(fighter(0xb7bcc2, 0xb22a24, { stripes: 1, ang: 0.4 }), crew(0x6f7a8a), {
    path: [[-40, 303], [-100, 303], [-100, 150], [-165, 150]],
    door: [-176.5, 145.5],
    spot: [-172.4, 150],
    face: 0,
  });
  /* the jeep is a perimeter patrol: it drives right round the paved area, outside its edge, and keeps going */
  AFLD.add(jeep(), [[-54, 120], [-54, 490], [-64, 502], [-220, 502], [-230, 490], [-230, 124], [-220, 112], [-64, 112]], 7, 0, 'veh', { loop: true });
  /* the fuel bowser works down the line of fighters, just behind their tails, and stands at each one to fuel it */
  AFLD.add(fuelTruck(0x56603f), [[-123, 336], [-123, 360], [-123, 384], [-123, 408], [-123, 432], [-123, 456]], 4, 9, 'veh', { stops: 9, hose: [-108.4, 1.8] });
  AFLD.add(crew(0x8b7d5a), [[-97, 338], [-97, 372]], 1.4, 5, 'walk');
  AFLD.add(crew(0x6f7a8a), [[-97, 398], [-97, 436]], 1.3, 8, 'walk');
  AFLD.add(crew(0xa89b84), [[-172, 160], [-172, 205]], 1.4, 6, 'walk');
  AFLD.add(crew(0x8b7d5a), [[-150, 346], [-124, 346]], 1.2, 9, 'walk');
  /* ships on the open sea: a freighter, a tanker and a patrol boat. Bows point toward +x. */
  const hullSteps = (L, b, h, col, y0) => {
    const P = [];
    P.push(part(bx(L * 0.78, h, b), col, -L * 0.11, y0 + h / 2, 0));
    [[0.1, 0.8], [0.06, 0.55], [0.035, 0.3]].forEach((q, i) => {
      P.push(part(bx(L * q[0], h, b * q[1]), col, L * (0.28 + [0.05, 0.13, 0.19][i]), y0 + h / 2, 0));
    });
    return P;
  };
  const freighter = (fl) => {
    const L = 95,
      P = hullSteps(L, 14, 6.5, 0x2f3438, -1.5);
    P.push(part(cyl(0.05, 0.05, 3.4, 6), 0x555555, -L / 2 + 1.2, 6.7, 0), ...FLG.at(fl || 'jp', 2.1, -L / 2 + 1.15, 8.3, 0, Math.PI));
    P.push(part(bx(L * 0.78, 1.5, 14.2), 0x7a2a22, -L * 0.11, -1.2, 0));
    P.push(part(bx(14, 9, 11), 0xdadad4, -L / 2 + 11, 10.7, 0));
    P.push(part(bx(6, 3, 11.4), 0x1d2a33, -L / 2 + 14, 13, 0));
    P.push(part(cyl(1.9, 1.9, 6), 0xb02a20, -L / 2 + 6, 17.5, 0));
    P.push(part(cyl(0.2, 0.2, 14), 0x555555, 14, 12, 0));
    for (let i = 0; i < 4; i++) P.push(part(bx(11, 1.2, 9.5), 0x6b5a3a, 28 - i * 15, 5.7, 0));
    return P;
  };
  const tanker = (fl) => {
    const L = 112,
      P = hullSteps(L, 17, 5.5, 0x23282c, -1.5);
    P.push(part(cyl(0.05, 0.05, 3.4, 6), 0x555555, -L / 2 + 1.2, 5.7, 0), ...FLG.at(fl || 'jp', 2.1, -L / 2 + 1.15, 7.3, 0, Math.PI));
    P.push(part(bx(L * 0.78, 1.4, 17.2), 0x4a2a22, -L * 0.11, -1.2, 0));
    P.push(part(bx(12, 10, 14), 0xd8d8d0, -L / 2 + 9, 10.5, 0));
    P.push(part(bx(5, 2.6, 14.4), 0x1d2a33, -L / 2 + 12, 12.8, 0));
    P.push(part(cyl(1.6, 1.6, 5), 0x303438, -L / 2 + 5, 16.5, 0));
    P.push(part(bx(L * 0.58, 0.5, 1.2), 0x6a6a64, 8, 4.5, 0));
    for (let i = 0; i < 5; i++) P.push(part(cyl(2.2, 2.2, 1.0), 0x3d4247, 30 - i * 11, 4.2, 0));
    return P;
  };
  const patrol = (fl) => {
    const L = 32,
      P = hullSteps(L, 6, 2.6, 0x7b838a, -0.8);
    P.push(part(cyl(0.04, 0.04, 2.6, 6), 0x555555, -L / 2 + 0.8, 3.1, 0), ...FLG.at(fl || 'jn', 1.2, -L / 2 + 0.76, 4.3, 0, Math.PI));
    P.push(part(bx(7, 2.6, 4.6), 0x969ea5, -3, 3.4, 0));
    P.push(part(bx(3, 1.2, 4.7), 0x1d2a33, -2, 3.7, 0));
    P.push(part(cyl(0.12, 0.12, 6), 0x444444, -4, 7, 0));
    P.push(part(cyl(0.18, 0.18, 3), 0x333333, 8, 3.2, 0, 0, 0, -Z));
    return P;
  };
  /* the US Navy patrol craft escort off the home airfield, a PCE-842 class (56.2 m x 10.1 m, 850 tons): lofted hull with the raised forecastle and rounded transom,
     3"/50 forward with the Hedgehog behind it, pilothouse and open flying bridge with Mk 51 director and SO/SA radar, a stubby funnel, two 40 mm Bofors, four 20 mm Oerlikons
     in tubs, depth charge rails and K-guns on the fantail, whaleboats, Carley floats, rails, ensign and the hull number. Bow toward +x; waterline at y = 0, keel 2.9 m below it. */
  const PCE = { L: 56.2, X0: -28.1 };
  const pce = () => {
    const P = [],
      L = PCE.L,
      X0 = PCE.X0,
      N = 40;
    const sst = (a) => (a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a)),
      tt = (x) => (x - X0) / L,
      bowK = (t) => Math.max(0, (t - 0.6) / 0.4),
      beamF = (t) => (t < 0.1 ? 0.72 + 0.28 * Math.sin((t / 0.1) * Z) : t < 0.55 ? 1 : Math.max(0.04, Math.pow(1 - Math.pow((t - 0.55) / 0.45, 1.8), 0.6))),
      W = (x) => 5.04 * beamF(tt(x)),
      dk = (x) => 2.55 + 0.9 * sst((x - 6) / 3) + 0.15 * Math.max(0, 1 - tt(x) / 0.12) + 1.0 * Math.pow(bowK(tt(x)), 2.2),
      flare = (x) => 1 + 0.22 * Math.pow(bowK(tt(x)), 1.3),
      keelY = (x) => -2.9 + 2.55 * Math.pow(Math.max(0, (tt(x) - 0.78) / 0.22), 1.6),
      bulw = (x) => 0.25 + 0.65 * sst((x - 4) / 6),
      sideZ = (x, y) => W(x) * (1 + (flare(x) - 1) * Math.max(0, Math.min(1, (y - 0.4) / (dk(x) - 0.4))));
    PCE.deckY = dk;
    const BOT = 0x6b2b25,
      BOOT = 0x1c1f23,
      HULL = 0x2f3b49,
      HULL2 = 0x3a4656,
      SUP = 0x8c959c,
      SUP2 = 0x7c868e,
      SUP3 = 0x6f7880,
      DECK = 0x3d4854,
      GUN = 0x2c2e30,
      STEEL = 0x3a3d40,
      WIN = 0x141c22,
      WHITE = 0xe9e9e4,
      BRASS = 0xa8742e;
    const S = Array.from({ length: N }, (_, i) => {
      const x = X0 + (L * i) / (N - 1),
        w = W(x),
        k = keelY(x),
        d = dk(x),
        f = flare(x),
        b = bulw(x),
        zi = Math.max(0.02, w * f - 0.14);
      return {
        p0: [x, k, 0],
        p1: [x, k * 0.62, 0.72 * w],
        p2: [x, 0, 0.985 * w],
        p3: [x, 0.4, w],
        p4: [x, d, w * f],
        p5: [x, d + b, w * f * 0.995],
        p4i: [x, d, zi],
        p5i: [x, d + b, zi],
      };
    });
    const mir = (p) => [p[0], p[1], -p[2]],
      Rk = (k) => S.map((s) => s[k]),
      Lk = (k) => S.map((s) => mir(s[k]));
    const grid = (rows, hex) => {
      const J = rows.length,
        I = rows[0].length,
        pos = [],
        idx = [];
      for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
      for (let j = 0; j < J - 1; j++)
        for (let i = 0; i < I - 1; i++) {
          const a = j * I + i,
            b = a + 1,
            c = a + I + 1,
            d = a + I;
          idx.push(a, b, c, a, c, d);
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      P.push(part(g, hex, 0, 0, 0));
    };
    grid([Lk('p2'), Lk('p1'), Rk('p0'), Rk('p1'), Rk('p2')], BOT);
    grid([Rk('p2'), Rk('p3')], BOOT);
    grid([Lk('p3'), Lk('p2')], BOOT);
    grid([Rk('p3'), Rk('p4')], HULL);
    grid([Lk('p4'), Lk('p3')], HULL);
    grid([Rk('p4'), Rk('p5')], HULL);
    grid([Lk('p5'), Lk('p4')], HULL);
    grid([Rk('p5'), Rk('p5i')], HULL2);
    grid([Lk('p5i'), Lk('p5')], HULL2);
    grid([Rk('p5i'), Rk('p4i')], HULL2);
    grid([Lk('p4i'), Lk('p5i')], HULL2);
    grid([Rk('p4i'), Lk('p4i')], DECK);
    {
      const s0 = S[0],
        keys = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'],
        cols = [BOT, BOT, BOOT, HULL, HULL];
      for (let q = 0; q < 5; q++) grid([[s0[keys[q]], s0[keys[q + 1]]], [mir(s0[keys[q]]), mir(s0[keys[q + 1]])]], cols[q]);
    }
    const box = (sx, sy, sz, hex, x, y, z, ry) => part(bx(sx, sy, sz), hex, x, y, z, 0, ry || 0, 0),
      rod = (r, l, hex, x, y, z) => part(cyl(r, r, l, 8), hex, x, y, z, 0, 0, -Z), /* a cylinder lying along +x, centred */
      post = (r, l, hex, x, y, z) => part(cyl(r, r, l, 8), hex, x, y, z),
      wire = (x0, y0, x1, y1, z, hex) => part(bx(Math.hypot(x1 - x0, y1 - y0), 0.03, 0.03), hex || 0x1b1b1b, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0));
    /* portholes along the topside, abaft the break */
    for (let x = -22; x <= 3; x += 2.8) for (const s of [-1, 1]) P.push(box(0.3, 0.26, 0.07, WIN, x, 1.7, s * (sideZ(x, 1.7) + 0.02)));
    for (let x = 11; x <= 15; x += 2.0) for (const s of [-1, 1]) P.push(box(0.3, 0.26, 0.07, WIN, x, 2.3, s * (sideZ(x, 2.3) + 0.02)));
    /* the hull number, 842, in white on each bow, built from seven-segment strokes */
    {
      const SEG = { a: [0.275, 0.935, 0.55, 0.13], b: [0.485, 0.75, 0.13, 0.5], c: [0.485, 0.25, 0.13, 0.5], d: [0.275, 0.065, 0.55, 0.13], e: [0.065, 0.25, 0.13, 0.5], f: [0.065, 0.75, 0.13, 0.5], g: [0.275, 0.5, 0.55, 0.13] },
        DIG = { 8: 'abcdefg', 4: 'bcfg', 2: 'abged' };
      for (const s of [-1, 1])
        '842'.split('').forEach((ch, di) => {
          const x0 = s > 0 ? 15.6 + di * 0.85 : 18.2 - di * 0.85;
          for (const k of DIG[ch]) {
            const q = SEG[k],
              x = x0 + (s > 0 ? q[0] : -q[0]),
              y = 1.7 + q[1];
            P.push(box(q[2], q[3], 0.05, WHITE, x, y, s * (sideZ(x, y) + 0.03)));
          }
        });
    }
    /* anchors in their hawse pipes, windlass, capstan, bollards and the jackstaff */
    for (const s of [-1, 1]) {
      P.push(box(0.34, 1.1, 0.2, STEEL, 24.2, 2.9, s * (sideZ(24.2, 2.9) + 0.14)), box(0.9, 0.2, 0.2, STEEL, 24.2, 2.45, s * (sideZ(24.2, 2.45) + 0.14)));
      P.push(part(cyl(0.28, 0.28, 0.12, 10), 0x15171a, 25.2, 3.4, s * (sideZ(25.2, 3.4) + 0.04), Z));
      for (const x of [26, 8, -8, -25]) P.push(post(0.15, 0.45, 0x3a3d40, x, dk(x) + 0.22, s * (W(x) * 0.9)));
    }
    P.push(box(1.5, 0.6, 1.5, 0x4a4d50, 25.2, dk(25.2) + 0.3, 0), part(cyl(0.4, 0.5, 0.8, 10), 0x4a4d50, 26.8, dk(26.8) + 0.4, 0), post(0.04, 1.8, 0x3a3a3a, 27.6, dk(27.6) + 0.9, 0));
    /* the 3"/50 on the forecastle: pedestal, shield, breech, barrel and recoil sleeve, ready-service boxes */
    {
      const x = 20.5,
        y = dk(20.5);
      P.push(part(cyl(1.0, 1.15, 0.45, 16), 0x585d62, x, y + 0.22, 0), part(cyl(0.7, 0.8, 0.5, 12), 0x41454a, x, y + 0.65, 0));
      P.push(box(0.1, 1.5, 2.2, 0x737a81, x + 0.85, y + 1.6, 0), box(1.7, 1.4, 0.07, 0x737a81, x, y + 1.6, 1.1), box(1.7, 1.4, 0.07, 0x737a81, x, y + 1.6, -1.1), box(1.8, 0.07, 2.3, SUP3, x, y + 2.35, 0));
      P.push(box(1.0, 0.6, 0.7, 0x2b2d2f, x - 0.3, y + 1.4, 0), rod(0.2, 1.1, STEEL, x + 1.05, y + 1.65, 0), rod(0.085, 3.4, GUN, x + 2.45, y + 1.65, 0), rod(0.11, 0.3, GUN, x + 4.1, y + 1.65, 0));
      P.push(box(0.12, 0.5, 0.9, 0x15171a, x + 0.9, y + 1.65, 0));
      for (const s of [-1, 1]) P.push(box(0.5, 0.4, 0.7, 0x6b5c40, x - 1.6, y + 0.2, s * 1.5), box(0.3, 0.1, 0.4, 0x2b2d2f, x - 0.8, y + 0.9, s * 0.65));
    }
    /* the Hedgehog: four rows of six spigots on a flat rack between the gun and the bridge */
    {
      const x = 12.2,
        y = dk(12.2);
      P.push(box(2.3, 0.25, 3.2, 0x41454a, x, y + 0.22, 0), box(2.3, 0.12, 0.1, STEEL, x, y + 0.34, 1.55), box(2.3, 0.12, 0.1, STEEL, x, y + 0.34, -1.55));
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) P.push(part(cyl(0.05, 0.07, 0.9, 6), r % 2 ? 0x2b2d2f : 0x3a3d40, x - 0.75 + r * 0.5 - 0.15, y + 0.74, -1.25 + c * 0.5, 0, 0, -0.32));
      P.push(box(0.8, 0.5, 0.6, 0x6b5c40, x - 2.0, y + 0.25, 1.9), box(0.8, 0.5, 0.6, 0x6b5c40, x - 2.0, y + 0.25, -1.9));
    }
    /* the main deckhouse, with the pilothouse, wings and open flying bridge on its forward end */
    {
      const y = dk(-2);
      P.push(box(15, 2.4, 7.0, SUP, -2, y + 1.2, 0), box(15.2, 0.12, 7.2, SUP3, -2, y + 2.46, 0));
      for (const s of [-1, 1]) for (let x = -8.5; x <= 4.0; x += 2.1) P.push(box(0.7, 0.55, 0.06, WIN, x, y + 1.45, s * 3.53));
      for (let k = -2; k <= 2; k++) P.push(box(0.06, 0.55, 0.8, WIN, 5.53, y + 1.45, k * 1.2));
      const py = y + 2.52;
      P.push(box(5.4, 2.3, 6.0, SUP2, 2.8, py + 1.15, 0), box(5.6, 0.14, 6.2, SUP3, 2.8, py + 2.37, 0));
      for (let k = -2; k <= 2; k++) P.push(box(0.06, 0.7, 0.95, WIN, 5.53, py + 1.5, k * 1.1));
      for (const s of [-1, 1]) {
        for (let k = -1; k <= 1; k++) P.push(box(0.9, 0.65, 0.06, WIN, 2.8 + k * 1.5, py + 1.5, s * 3.03));
        P.push(box(3.0, 0.1, 1.6, SUP3, 3.4, py + 1.0, s * 4.5), box(3.0, 0.05, 0.04, 0x1b1b1b, 3.4, py + 1.9, s * 5.28), box(0.04, 0.9, 1.6, 0x1b1b1b, 4.9, py + 1.45, s * 4.5));
        P.push(part(cyl(0.35, 0.35, 0.5, 12), 0x3d4044, 4.2, py + 1.4, s * 4.0), part(cyl(0.33, 0.33, 0.05, 12), 0xd8e4f0, 4.55, py + 1.45, s * 4.0, 0, 0, Z));
      }
      /* open flying bridge: coaming, compass binnacle, the Mk 51 director, a searchlight and the signal lamp */
      const fy = py + 2.44;
      P.push(box(5.6, 0.5, 0.08, SUP2, 2.8, fy + 0.25, 3.0), box(5.6, 0.5, 0.08, SUP2, 2.8, fy + 0.25, -3.0), box(0.08, 0.5, 6.0, SUP2, 5.6, fy + 0.25, 0));
      P.push(post(0.18, 0.7, 0x4a4d50, 4.6, fy + 0.35, 0), part(cyl(0.22, 0.22, 0.1, 10), BRASS, 4.6, fy + 0.74, 0));
      P.push(part(cyl(0.55, 0.65, 0.8, 10), 0x6a7077, 1.8, fy + 0.4, 0), box(1.3, 0.8, 1.1, 0x757c84, 1.8, fy + 1.2, 0), rod(0.07, 0.8, GUN, 2.7, fy + 1.3, 0.3), rod(0.07, 0.8, GUN, 2.7, fy + 1.3, -0.3));
      P.push(part(cyl(0.3, 0.3, 0.45, 10), 0x3d4044, 4.6, fy + 0.6, 2.2), part(cyl(0.28, 0.28, 0.05, 10), 0xd8e4f0, 4.85, fy + 0.65, 2.2, 0, 0, Z));
      /* mast with the yard, SA "bedspring" air-search array and the SO surface-search dish on top */
      const mx = 0.5,
        my = fy;
      P.push(part(cyl(0.1, 0.2, 9.5, 8), 0x4a4d50, mx, my + 4.7, 0), box(0.1, 0.1, 4.6, 0x4a4d50, mx, my + 6.3, 0));
      P.push(box(0.12, 1.5, 2.4, 0x3a3d40, mx - 0.5, my + 8.0, 0));
      for (let r = 0; r < 6; r++) P.push(box(0.08, 0.05, 2.3, 0x2b2d2f, mx - 0.58, my + 7.4 + r * 0.25, 0));
      P.push(part(cyl(0.45, 0.2, 0.28, 12), 0x5a5f62, mx + 0.45, my + 9.1, 0), post(0.05, 0.9, 0x3a3d40, mx, my + 9.9, 0), part(cyl(0.02, 0.02, 3.2, 4), 0x2b2d2f, mx, my + 11.0, 0.0));
      P.push(part(GX.sph(8), 0xe8e4d0, mx, my + 10.5, 0, 0, 0, 0, 0.1, 0.1, 0.1));
      for (const z of [-1.2, 1.2]) P.push(box(0.04, 0.5, 0.04, 0x3a3d40, mx + 0.1, my + 6.05, z));
      P.push(wire(mx, my + 9.2, 25.5, dk(25.5) + 1.9, 0), wire(mx, my + 9.2, -26, dk(-26) + 2.2, 0), wire(mx, my + 6.3, mx - 3, y + 2.5, 3.3), wire(mx, my + 6.3, mx - 3, y + 2.5, -3.3), wire(mx, my + 6.3, mx + 3.2, py + 1.2, 2.3, 0x2a2a2a), wire(mx, my + 6.3, mx + 3.2, py + 1.2, -2.3, 0x2a2a2a));
      /* signal flag hoist on the yard */
      for (let i = 0; i < 4; i++) P.push(box(0.05, 0.45, 0.5, [0xb22a24, 0xe6e0c8, 0x1e4fa3, 0xd9b92a][i], mx + 0.05, my + 5.9, -1.7 + i * 0.7));
    }
    /* the stubby diesel funnel (oval, short, flat cap), engine-room vents and the whistle */
    {
      const y = dk(-3) + 2.52,
        x = -3.0;
      P.push(part(cyl(1.15, 1.35, 3.4, 12), 0x6a7077, x, y + 1.7, 0, 0, 0, 0, 1.0, 1.0, 1.35), part(cyl(1.18, 1.18, 0.7, 12), 0x1b1c1e, x, y + 3.3, 0, 0, 0, 0, 1.0, 1.0, 1.35), part(cyl(1.25, 1.25, 0.1, 12), 0x303236, x, y + 3.7, 0, 0, 0, 0, 1.0, 1.0, 1.35));
      P.push(box(0.05, 3.0, 0.5, 0x303236, x + 1.3, y + 1.6, 0), post(0.1, 0.9, 0x3a3d40, x - 1.0, y + 4.2, 0.5), post(0.1, 0.7, 0x3a3d40, x - 1.0, y + 4.1, -0.5));
      for (const s of [-1, 1]) {
        P.push(part(cyl(0.4, 0.4, 0.7, 10), 0x4a4d50, x - 3.0, y + 0.35, s * 2.3), part(cyl(0.32, 0.46, 0.35, 10), 0x303236, x - 3.0, y + 0.85, s * 2.3, 0, 0, 0.45 * s));
      }
    }
    /* two motor whaleboats on the deckhouse roof, one each side of the funnel's after end */
    for (const s of [-1, 1]) {
      const y = dk(-7) + 2.52,
        x = -7.4;
      P.push(box(4.6, 0.6, 1.5, 0x8c8f91, x, y + 0.5, s * 2.5), box(1.0, 0.55, 1.0, 0x8c8f91, x + 2.6, y + 0.5, s * 2.5), box(4.8, 0.07, 1.6, 0x2b2d2f, x, y + 0.82, s * 2.5), box(1.8, 0.4, 1.0, 0x4a4f52, x - 0.4, y + 0.98, s * 2.5));
      for (const dx of [-1.6, 1.6]) P.push(box(0.1, 0.3, 1.9, 0x303436, x + dx, y + 0.15, s * 2.5));
    }
    /* Carley floats and life rings on the deckhouse sides, lifejacket lockers */
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) P.push(part(cyl(0.5, 0.5, 0.3, 14), 0xb5452c, -6 + i * 1.4, dk(-6) + 1.6, s * 3.7, Z), part(cyl(0.3, 0.3, 0.32, 10), 0x2b2d2f, -6 + i * 1.4, dk(-6) + 1.6, s * 3.7, Z));
      P.push(part(cyl(0.3, 0.3, 0.08, 14), WHITE, 5.2, dk(5) + 2.9, s * 3.05, Z), box(0.8, 0.55, 0.3, 0x5a5f62, -9.0, dk(-9) + 0.5, s * 3.0));
    }
    /* the after deckhouse with the 40 mm Bofors on its roof */
    const bofors = (x, y, z) => {
      P.push(part(cyl(1.35, 1.5, 0.7, 14), 0x585d62, x, y + 0.35, z), part(cyl(1.2, 1.2, 0.06, 14), 0x15171a, x, y + 0.72, z));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        P.push(box(0.35, 0.25, 0.18, 0x7d7452, x + Math.cos(a) * 1.4, y + 0.8, z + Math.sin(a) * 1.4, -a));
      }
      P.push(post(0.35, 0.9, 0x4a4d50, x, y + 1.15, z), box(1.5, 0.55, 0.75, 0x41454a, x + 0.1, y + 1.75, z), rod(0.09, 0.7, STEEL, x + 0.9, y + 1.78, z), rod(0.058, 2.3, GUN, x + 2.0, y + 1.78, z), rod(0.085, 0.3, GUN, x + 3.2, y + 1.78, z));
      P.push(box(0.65, 0.3, 0.55, 0x2b2d2f, x - 0.15, y + 2.15, z), box(0.12, 0.28, 0.55, 0x7d7452, x - 0.15, y + 2.4, z), box(0.55, 0.06, 0.55, SUP3, x + 0.55, y + 2.1, z));
      P.push(box(0.05, 0.9, 1.2, 0x737a81, x + 0.7, y + 1.7, z + 0.9), box(0.05, 0.9, 1.2, 0x737a81, x + 0.7, y + 1.7, z - 0.9));
      P.push(box(0.5, 0.06, 0.5, 0x2b2d2f, x - 0.8, y + 1.15, z + 0.9), box(0.5, 0.06, 0.5, 0x2b2d2f, x - 0.8, y + 1.15, z - 0.9));
    };
    {
      const x = -14.2,
        y = dk(-14.2);
      P.push(box(6.6, 2.2, 6.4, SUP, x, y + 1.1, 0), box(6.8, 0.12, 6.6, SUP3, x, y + 2.26, 0));
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) P.push(box(0.7, 0.5, 0.06, WIN, x - 1.2 + k * 2.4, y + 1.3, s * 3.23));
      P.push(box(0.05, 1.4, 0.8, 0x3a3d40, x + 3.3, y + 0.8, 1.2), box(0.05, 1.4, 0.8, 0x3a3d40, x + 3.3, y + 0.8, -1.2));
      bofors(x - 0.4, y + 2.32, 0);
      for (const s of [-1, 1]) P.push(box(0.04, 0.04, 0.04, 0x15171a, x + 1, y + 2.32, s * 2.8));
    }
    /* four 20 mm Oerlikons in tubs: two on the bridge wings' roof corners, two abaft the funnel casing */
    const oerl = (x, y, z) => {
      P.push(part(cyl(0.6, 0.65, 0.9, 12), 0x585d62, x, y + 0.45, z), part(cyl(0.64, 0.64, 0.07, 12), 0x15171a, x, y + 0.92, z), post(0.07, 0.9, STEEL, x, y + 1.35, z));
      P.push(box(0.9, 0.16, 0.14, GUN, x + 0.1, y + 1.85, z), rod(0.032, 1.1, GUN, x + 0.95, y + 1.85, z), part(cyl(0.2, 0.2, 0.12, 10), 0x2b2d2f, x + 0.05, y + 2.05, z), box(0.04, 0.5, 0.6, 0x737a81, x + 0.55, y + 1.85, z), part(cyl(0.18, 0.18, 0.03, 10), STEEL, x - 0.45, y + 1.85, z, Z));
    };
    oerl(2.0, dk(2) + 2.52 + 0.1, 3.0);
    oerl(2.0, dk(2) + 2.52 + 0.1, -3.0);
    oerl(-18.5, dk(-18.5), 3.0);
    oerl(-18.5, dk(-18.5), -3.0);
    /* a second 40 mm on the fantail tub, a deckhouse hatch and the ensign staff; depth charge rails, drums and K-guns */
    bofors(-22.8, dk(-22.8), 0);
    for (const s of [-1, 1]) {
      const z = s * 1.3;
      P.push(box(7.0, 0.1, 0.1, 0x2b2d2f, -24.5, dk(-26) + 0.12, z - 0.25), box(7.0, 0.1, 0.1, 0x2b2d2f, -24.5, dk(-26) + 0.12, z + 0.25));
      for (let i = 0; i < 7; i++) P.push(part(cyl(0.3, 0.3, 0.8, 10), i % 3 ? 0x303436 : 0x3a3f42, -27.2 + i * 0.95, dk(-26) + 0.55, z, Z));
      for (let i = 0; i < 3; i++) P.push(part(cyl(0.16, 0.22, 0.9, 8), 0x3a3d40, -19.6 + i * 1.5, dk(-19) + 0.5, s * 4.0, 0, 0, 0), part(cyl(0.1, 0.12, 0.8, 8), 0x2b2d2f, -19.6 + i * 1.5, dk(-19) + 1.15, s * 4.2, s * 0.65), part(cyl(0.2, 0.2, 0.12, 8), 0x2b2d2f, -19.6 + i * 1.5, dk(-19) + 0.08, s * 3.95));
      P.push(box(1.0, 0.5, 0.8, 0x2b2d2f, -28.0, 2.9, s * 0.9));
    }
    {
      const x = -27.6,
        y = dk(-27.6);
      P.push(post(0.05, 3.3, 0x555555, x, y + 1.65, 0), ...FLG.at('us', 1.7, x - 0.05, y + 3.25, 0, Math.PI));
    }
    /* guard rails: stanchions every 2.2 m and a top and middle wire along both sides, from the stern to the break of the forecastle */
    for (const s of [-1, 1]) {
      const xs = [];
      for (let x = -27; x <= 8; x += 2.2) xs.push(x);
      for (const x of xs) P.push(post(0.025, 1.0, 0x6a6f74, x, dk(x) + 0.5, s * (sideZ(x, dk(x)) - 0.12)));
      for (let i = 0; i < xs.length - 1; i++) {
        const a = xs[i],
          b = xs[i + 1];
        P.push(wire(a, dk(a) + 1.0, b, dk(b) + 1.0, s * (sideZ(a, dk(a)) - 0.12), 0x4a4d50), wire(a, dk(a) + 0.5, b, dk(b) + 0.5, s * (sideZ(a, dk(a)) - 0.12), 0x4a4d50));
      }
    }
    /* deck hatches and ventilators forward of the bridge and on the quarterdeck */
    for (const x of [-20, 8.2]) P.push(box(1.1, 0.35, 1.1, 0x4a525b, x, dk(x) + 0.18, 2.0), box(1.1, 0.35, 1.1, 0x4a525b, x, dk(x) + 0.18, -2.0));
    for (const s of [-1, 1]) P.push(part(cyl(0.3, 0.3, 0.9, 10), 0x4a4d50, 8.8, dk(8.8) + 0.45, s * 3.4), part(cyl(0.24, 0.42, 0.45, 10), 0x303236, 8.8, dk(8.8) + 1.0, s * 3.4, 0, 0, 0.4 * s));
    return P;
  };
  /* THE ALLIED FLEET: one list for the whole world. The detailed PCE and PT-105 models (built from the plans), each hull wearing its
     own number on the bow. [kind, hull number, length m, ring radii r0 and r1 m, speed m/s, placement seed]. The US freighter and
     tanker models (freighter('us'), tanker('us')) are kept for later. A game's piece may take a ship for a player (HOOKS.claimShip). */
  const FLEET = [
    ['pt', '105', 24.4, 1500, 3800, 14, 1],
    ['pce', '843', 56.2, 2500, 6500, 6.5, 2],
    ['pce', '842', 56.2, 2000, 5000, 7.5, 3] /* the US Navy PCE off the home airfield */,
    ['pt', '106', 24.4, 3000, 5500, 13, 4],
  ];
  for (const [kind, num, L, r0, r1, sp, seed] of FLEET) {
    if (!AFLD.addShip([], L, r0, r1, sp, seed, SEA.WL, kind === 'pt' ? 0.4 : 0.6)) continue; /* waterline at the sea plane */
    const o = AFLD.a[AFLD.a.length - 1];
    if (kind === 'pce') {
      o.m.geometry.dispose();
      o.m.geometry = PCEM.build(num);
      o.m.material = PCEM.material;
      PCEM.flags(o.m);
    } else o.m.add(PTB.build(num));
    if (HOOKS.claimShip.some((h) => h(kind, num, o))) continue; /* a player's ship: no AI gun crews */
    if (kind === 'pce')
      try {
        PCEM.mounts(o.m);
      } catch (e) {
        console.warn('PCE guns', e);
      }
  }
  AFLD.hullSteps = hullSteps;
  AFLD.models = { freighter, tanker, patrol, pce, fighter, ki84, fuelTruck, cargoTruck, jeep, tug, crew, drums }; /* the port and the airbase reuse these models */
  /* soft contact shadows under everything parked */
  {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d'),
      gr = x.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,.75)');
    gr.addColorStop(0.6, 'rgba(0,0,0,.4)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    const sh = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1).rotateX(-Z),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(c),
          transparent: true,
          depthWrite: false,
          opacity: 0.55,
        }),
        BL.length,
      ),
      m4 = new M4();
    BL.forEach((b, i) => {
      m4.compose(new V3(b[0], 0.2, b[1]), new Q().setFromAxisAngle(new V3(0, 1, 0), b[2]), new V3(b[3], 1, b[4]));
      sh.setMatrixAt(i, m4);
    });
    sh.frustumCulled = false;
    scene.add(sh);
  }
  /* painted markings */
  const quad = (A, x, z, lx, lw, a) => {
    const c = Math.cos(a),
      s = Math.sin(a),
      dx = (c * lx) / 2,
      dz = (s * lx) / 2,
      px = (-s * lw) / 2,
      pz = (c * lw) / 2,
      P = [
        [x - dx - px, z - dz - pz],
        [x + dx - px, z + dz - pz],
        [x + dx + px, z + dz + pz],
        [x - dx + px, z - dz + pz],
      ];
    for (const i of [0, 2, 1, 0, 3, 2]) A.push(P[i][0], 0.24, P[i][1]);
  };
  const seg = (A, x1, z1, x2, z2, w) =>
    quad(A, (x1 + x2) / 2, (z1 + z2) / 2, Math.hypot(x2 - x1, z2 - z1), w, Math.atan2(z2 - z1, x2 - x1));
  const dash = (A, x1, z1, x2, z2, w, d, gp) => {
    const L = Math.hypot(x2 - x1, z2 - z1),
      ux = (x2 - x1) / L,
      uz = (z2 - z1) / L;
    for (let t = 0; t + d <= L + 0.01; t += d + gp)
      seg(A, x1 + ux * t, z1 + uz * t, x1 + ux * (t + d), z1 + uz * (t + d), w);
  };
  const flush = (A, hex) => {
    const g = new THREE.BufferGeometry(),
      n = [];
    for (let i = 0; i < A.length; i += 3) n.push(0, 1, 0);
    g.setAttribute('position', new THREE.Float32BufferAttribute(A, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: hex, side: THREE.DoubleSide })));
  };
  const Yw = [],
    Wh = [];
  seg(Yw, -135, 300, -25, 300, 0.4);
  for (let i = 0; i < 10; i++) {
    const a = (i * Z) / 10,
      b = ((i + 1) * Z) / 10;
    seg(Yw, -25 + 25 * Math.sin(a), 275 + 25 * Math.cos(a), -25 + 25 * Math.sin(b), 275 + 25 * Math.cos(b), 0.4);
  } /* taxi centreline + lead-on curve */
  seg(Yw, -84, 300, -84, 486, 0.35);
  seg(Yw, -150, 300, -150, 205, 0.35); /* apron lanes */
  seg(Yw, -65, 288.3, -26, 288.3, 0.25);
  seg(Yw, -65, 311.7, -26, 311.7, 0.25);
  seg(Yw, -34, 288, -34, 312, 0.4);
  dash(Yw, -31.4, 288, -31.4, 312, 0.4, 1.4, 1.2); /* taxiway edges, hold-short line */
  for (let k = 0; k < 7; k++) seg(Wh, -126, 324 + 24 * k, -90, 324 + 24 * k, 0.25); /* parking stalls */
  for (const [z0, sg] of [
    [RW.zS, -1],
    [RW.zN, 1],
  ]) {
    const f = (d) => z0 + sg * d; /* aiming point + touchdown zone bars at both ends */
    for (const s of [-1, 1]) {
      seg(Wh, s * 11, f(300), s * 11, f(340), 5);
      for (const x of [6, 9.2, 12.4]) seg(Wh, s * x, f(150) - 0, s * x, f(172), 1.8);
      for (const x of [7.5, 11]) seg(Wh, s * x, f(255), s * x, f(277), 1.8);
    }
  }
  flush(Yw, 0xe0b81c);
  flush(Wh, 0xe4e4de);
  const num = (txt, z, rot) => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#e8e8e2';
    x.font = 'bold 190px Arial,Helvetica,sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.save();
    x.translate(128, 134);
    x.scale(0.62, 1);
    x.fillText(txt, 0, 0);
    x.restore();
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 28).rotateX(-Z),
      new THREE.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false }),
    );
    m.position.set(0, 0.24, z);
    m.rotation.y = rot;
    scene.add(m);
  };
  num('36', RW.zS - 52, 0);
  num('18', RW.zN + 52, Math.PI);
}
