/* ---------- the North American P-51D Mustang as a scenery model (parked on the line, or the tow plane) ----------
   The player's P-51D is built from the factory general-arrangement drawing (the fuselage, canopy, wing, tail, scoop and landing-gear
   pieces). This is the same aeroplane from the same tables, copied here so it can be built before those pieces load, at a scenery
   budget: one vertex-coloured part list, no cockpit, no moving surfaces. Span 11.28 m (37 ft 0.25 in), length 9.83 m (387 in), wing
   root chord 104 in, tip 50 in, 5 deg dihedral; main wheels 142 in apart at station 114 on 27 in tyres, 76.5 in below the reference
   line; tail wheel at station 313; Hamilton Standard four-blade propeller, 11 ft 2 in. Stations are inches from the spinner tip.
   Frame: nose +x, starboard +z. Parked: sitting on its three wheels in the three-point attitude (12.3 deg nose up), wheels on y = 0.
   o.air: gear up, level, the thrust line at y = 1.4 (the tow plane). Paint: body (natural metal or olive drab), trim (spinner, nose band,
   rudder), o.spin spinner, o.stripes invasion stripes, o.tanks two 75 gal drop tanks, o.ang propeller angle.
   MODELS.get('us-p51d', body, trim, o) */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2,
    IN = 0.0254,
    X = (st) => 4.88 - st * IN /* station -> x (nose +x) */,
    sst = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  /* the fuselage table: [station, half-width, top, bottom, squareness] (the factory drawing, as the player's model) */
  const FUS = [
    [27, 0.37, 0.42, -0.4, 2.3], [35, 0.385, 0.455, -0.55, 2.4], [50, 0.4, 0.495, -0.66, 2.5], [70, 0.42, 0.533, -0.735, 2.6],
    [90, 0.445, 0.56, -0.77, 2.6], [110, 0.455, 0.577, -0.775, 2.6], [130, 0.46, 0.585, -0.775, 2.6], [180, 0.46, 0.585, -0.765, 2.6],
    [222, 0.41, 0.577, -0.74, 2.6], [250, 0.34, 0.545, -0.6, 2.5], [280, 0.3, 0.52, -0.53, 2.4], [300, 0.28, 0.525, -0.47, 2.3],
    [320, 0.25, 0.5, -0.41, 2.2], [340, 0.2, 0.4, -0.33, 2.2], [360, 0.14, 0.27, -0.18, 2.2], [380, 0.06, 0.12, -0.04, 2.1], [387, 0.0, 0.05, 0.0, 2.0],
  ];
  const fusAt = (st) => {
    let i = 0;
    while (i < FUS.length - 2 && st > FUS[i + 1][0]) i++;
    const a = FUS[i],
      b = FUS[i + 1],
      u = Math.max(0, Math.min(1, (st - a[0]) / (b[0] - a[0])));
    return a.map((v, k) => v + (b[k] - v) * u);
  };
  /* canopy: [station, top of the glass, squareness] */
  const CAN = [
    [129, 0.59, 3.4], [134, 0.67, 3.2], [140, 0.78, 3.0], [146, 0.875, 2.8], [150, 0.9, 2.6], [158, 0.927, 2.5], [170, 0.915, 2.5],
    [180, 0.89, 2.5], [190, 0.85, 2.5], [200, 0.79, 2.5], [210, 0.71, 2.4], [216, 0.65, 2.4], [222, 0.58, 2.4],
  ];
  /* a loft through rows of points (each row a ring or loop), every triangle turned away from its rows' centre (so it faces out) */
  const loft = (rows, hex, closed) => {
    const pos = [],
      idx = [],
      n = rows[0].length,
      C = rows.map((r) => r.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]));
    rows.forEach((r) => r.forEach((p) => pos.push(...p)));
    const tri = (a, b, c, ca) => {
      const P = (i) => pos.slice(i * 3, i * 3 + 3),
        A = P(a),
        B = P(b),
        Cc = P(c),
        u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]],
        v = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]],
        nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]],
        o = [(A[0] + B[0] + Cc[0]) / 3 - ca[0], (A[1] + B[1] + Cc[1]) / 3 - ca[1], (A[2] + B[2] + Cc[2]) / 3 - ca[2]];
      if (nn[0] * o[0] + nn[1] * o[1] + nn[2] * o[2] >= 0) idx.push(a, b, c);
      else idx.push(a, c, b);
    };
    for (let j = 0; j < rows.length - 1; j++) {
      const ca = C[j].map((v, k) => (v + C[j + 1][k]) / 2);
      for (let i = 0; i < (closed === false ? n - 1 : n); i++) {
        const i2 = (i + 1) % n,
          a = j * n + i,
          b = j * n + i2,
          c = (j + 1) * n + i2,
          d = (j + 1) * n + i;
        tri(a, b, c, ca);
        tri(a, c, d, ca);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return part(g, hex, 0, 0, 0);
  };
  /* a superellipse ring at x: centre yc, half-width hw, half-height hh, exponent from the squareness; inflated by e */
  const NT = 14;
  const ring = (x, yc, hw, hh, sq, e, a0, a1) => {
    const R = [],
      k = 2 / sq,
      m = a1 == null ? NT : 8;
    for (let j = 0; j < m; j++) {
      const t = a1 == null ? (2 * Math.PI * j) / NT : a0 + ((a1 - a0) * j) / (m - 1),
        c = Math.cos(t),
        s = Math.sin(t);
      R.push([x, yc + (hh + e) * Math.sign(s) * Math.abs(s) ** k, (hw + e) * Math.sign(c) * Math.abs(c) ** k]);
    }
    return R;
  };
  const fusRing = (st, e, a0, a1) => {
    const [, hw, top, bot, sq] = fusAt(st);
    return ring(X(st), (top + bot) / 2, Math.max(0.004, hw), Math.max(0.004, (top - bot) / 2), sq, e || 0, a0, a1);
  };
  const fusLoft = (s0, s1, n, hex, e) => {
    const rows = [];
    for (let i = 0; i <= n; i++) rows.push(fusRing(s0 + ((s1 - s0) * i) / n, e));
    return loft(rows, hex);
  };
  /* the wing (factory three-view): leading edge from station 107.9 at the root to 121.4 at the tip, trailing edge 211.9 at the root
     breaking at 59 % of the span to the tip's 171.4; root centre 0.58 m below the reference line, rising 0.5 m to the tip */
  const WS = 5.64,
    xle = (u) => X(107.9 + (121.4 - 107.9) * u),
    xte = (u) => (u < 0.59 ? X(211.9) + ((0.115 - X(211.9)) * u) / 0.59 : 0.115 + ((X(171.4) - 0.115) * (u - 0.59)) / 0.41),
    wy = (u) => -0.58 + 0.5 * u,
    wt = (u) => 0.151 - 0.036 * u /* thickness / chord: NAA/NACA 45-100 laminar section, 15.1 % root, 11.5 % tip */;
  const CS = [1, 0.8, 0.6, 0.4, 0.25, 0.12, 0.05, 0.015, 0];
  const naca = (x, t) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4) + 0.002;
  const foilRow = (xL, xT, yc, zs, t, e) => {
    const c = xL - xT,
      R = [];
    for (const f of CS) R.push([xL - f * c, yc + naca(f, t) * c + e, zs]);
    for (const f of CS.slice(1, -1).reverse()) R.push([xL - f * c, yc - naca(f, t) * c - e, zs]);
    return R;
  };
  /* rows of a wing from span fraction u0 to u1 (one side, s = +-1); the tip is rounded and closed */
  const wingRows = (u0, u1, n, s, e) => {
    const R = [];
    for (let i = 0; i <= n; i++) {
      const u = n ? u0 + ((u1 - u0) * i) / n : u0,
        tipK = u > 0.95 ? Math.sqrt(Math.max(0, 1 - ((u - 0.95) / 0.05) ** 2)) : 1,
        xl = xle(u),
        xt = xte(u),
        mid = (xl + xt) / 2,
        hc = ((xl - xt) / 2) * (0.35 + 0.65 * tipK);
      R.push(foilRow(mid + hc + e, mid - hc - e, wy(u), s * u * WS, wt(u) * (0.4 + 0.6 * tipK), e));
    }
    return R;
  };
  const US = [0, 0.12, 0.3, 0.45, 0.59, 0.72, 0.84, 0.93, 0.97, 0.99, 1];
  const wing = (s, hex) => loft(US.map((u) => wingRows(u, u, 0, s, 0)[0]), hex);
  /* a plan-form slab (tailplane): [lateral, x] outline points half one side, thickness t at the root */
  const TP = [
    [0, X(307.2), X(354.5)], [0.6, X(309.5), X(352.5)], [1.2, X(312.5), X(350.6)], [1.7, X(315.5), X(349.2)], [1.93, X(317.5), X(348.5)], [2.0, X(318.3), X(347.6)], [2.008, X(332), X(333)],
  ];
  const tailplane = (s, hex) =>
    loft(
      TP.map(([z, xl, xt], i) => {
        const tk = i === TP.length - 1 ? 0.2 : 1;
        return foilRow(xl, xt, 0.12, s * z, 0.1 * tk, 0);
      }),
      hex,
    );
  const build = (body, trim, o) => {
    o = o || {};
    body = body == null ? 0xb7bcc2 : body;
    trim = trim == null ? 0xb22a24 : trim;
    const P = [],
      DK = 0x1b1c1e,
      OD = 0x4f5434,
      GLASS = 0x2a3a48,
      FRAME = 0xa9adb2,
      TYRE = 0x161616,
      metal = body === 0xb7bcc2;
    /* fuselage: the nose band in the trim colour, the rest in the body colour */
    P.push(fusLoft(27, 50, 3, trim), fusLoft(50, 387, 16, body));
    if (metal) {
      /* the olive-drab anti-glare panel on top of the nose, ahead of the windscreen */
      const rows = [];
      for (const st of [52, 80, 105, 129]) rows.push(fusRing(st, 0.004, Z - 0.45, Z + 0.45));
      P.push(loft(rows, OD, false));
    }
    /* spinner: an ogive from the tip to station 27, in the spinner colour */
    {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const st = (27 * i) / 8,
          r = 0.392 * Math.sqrt(Math.max(0, 1 - ((27 - st) / 27) ** 2.2));
        pts.push(new THREE.Vector2(Math.max(0.001, r), X(st)));
      }
      const g = new THREE.LatheGeometry(pts.reverse(), 14);
      g.rotateZ(-Z);
      P.push(part(g, o.spin || trim, 0, 0.01, 0));
    }
    /* propeller: four Hamilton Standard paddle blades (black, yellow tips) round the hub at station 20.5 */
    {
      const xh = X(20.5),
        a0 = o.ang || 0;
      for (let k = 0; k < 4; k++) {
        const a = a0 + (k * Math.PI) / 2,
          bl = (r0, r1, c, hex) => part(bx(0.05, r1 - r0, c), hex, xh, 0.01 + Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2, a, 0.38, 0);
        P.push(bl(0.2, 0.75, 0.2, DK), bl(0.74, 1.4, 0.27, DK), bl(1.39, 1.56, 0.24, DK), bl(1.55, 1.7, 0.19, 0xe3c021));
      }
    }
    /* canopy: the bubble hood and windscreen on the fuselage top, a framed windscreen bow */
    {
      const rows = [];
      for (const [st, top, sq] of CAN) {
        const [, hw, ft, fb, fsq] = fusAt(st),
          yb = ft - 0.07,
          yc = (ft + fb) / 2,
          hh = (ft - fb) / 2,
          xb = hw * Math.pow(Math.max(0, 1 - Math.abs((yb - yc) / hh) ** fsq), 1 / fsq) * 0.92,
          h = Math.max(0.012, top - yb),
          k = 2 / sq,
          R = [];
        for (let j = 0; j <= 8; j++) {
          const t = (Math.PI * j) / 8,
            c = Math.cos(t),
            s = Math.sin(t);
          R.push([X(st), yb + h * Math.abs(s) ** k, xb * Math.sign(c) * Math.abs(c) ** k]);
        }
        rows.push(R);
      }
      P.push(loft(rows, GLASS, false));
      const bow = (st) => {
        const i = CAN.findIndex((r) => r[0] >= st),
          r = rows[i];
        return loft([r.map((p) => [p[0] + 0.03, p[1] + 0.006, p[2] * 1.02]), r.map((p) => [p[0] - 0.03, p[1] + 0.006, p[2] * 1.02])], FRAME, false);
      };
      P.push(bow(150), bow(129));
    }
    /* the radio mast behind the canopy, raked aft */
    P.push(part(bx(0.28, 0.42, 0.03), body, X(247), 0.7, 0, 0, 0, 0.35));
    /* belly radiator scoop (the manual's duct): lip, diffuser, nozzle; dark mouth */
    {
      const T = [[157, -0.95, 0.24], [160, -1.04, 0.29], [170, -1.12, 0.33], [185, -1.135, 0.34], [200, -1.12, 0.335], [215, -1.06, 0.32], [230, -0.98, 0.3], [245, -0.82, 0.27], [252, -0.74, 0.25]],
        top = -0.6;
      P.push(loft(T.map(([st, yb, hw]) => ring(X(st), (top + yb) / 2, hw, (top - yb) / 2, 3.2, 0)), body));
      P.push(part(new THREE.CircleGeometry(1, 14), DK, X(157) + 0.004, (-0.95 - 0.76) / 2, 0, 0, Z, 0, 0.23, 0.095, 1));
    }
    /* carburettor intake under the nose */
    {
      const T = [[33, -0.6, 0.1], [40, -0.66, 0.12], [55, -0.72, 0.12], [70, -0.76, 0.1], [82, -0.77, 0.05]],
        top = -0.45;
      P.push(loft(T.map(([st, yb, hw]) => ring(X(st), (top + yb) / 2, hw, (top - yb) / 2, 3, 0)), body));
      P.push(part(new THREE.CircleGeometry(1, 10), DK, X(33) + 0.004, -0.57, 0, 0, Z, 0, 0.09, 0.03, 1));
    }
    /* six exhaust stacks a side on the nose */
    for (const s of [-1, 1])
      for (let i = 0; i < 6; i++) {
        const st = 46 + i * 7.6,
          [, hw] = fusAt(st);
        P.push(part(bx(0.1, 0.07, 0.08), 0x3c2a20, X(st), 0.24, s * (hw + 0.02)));
      }
    /* wings, tailplane, fin and rudder */
    P.push(wing(1, body), wing(-1, body), tailplane(1, body), tailplane(-1, body));
    P.push(
      GX.ext([[X(300), 0.38], [X(310.9), 0.5], [X(327.2), 0.6], [X(337.4), 1.14], [X(344.5), 1.66], [X(351.6), 1.767], [X(362), 1.767], [X(362), 0.1], [X(300), 0.1]].reverse(), 0.09, body) /* fin and its dorsal fillet, rooted in the fuselage */,
      GX.ext([[X(362), 1.767], [X(372), 1.767], [X(376), 1.6], [X(384.2), 0.73], [X(387.3), 0.16], [X(386.2), -0.033], [X(381), -0.133], [X(372), -0.153], [X(362), -0.153]].reverse(), 0.08, trim) /* rudder */,
    );
    /* national insignia: star in a blue disc with the white bars, on the upper port and lower starboard wing and both fuselage sides */
    const insignia = (x, y, z, r, ry, rx) => [GX.disc(x, y, z, r, 0x203260, ry, rx), GX.star(x, y, z, r * 0.95, ry, rx, 0xeceae2)];
    {
      const u = 0.83 /* outboard of the stripes */,
        c = xle(u) - xte(u),
        x = xle(u) - 0.35 * c /* over the section's thickest part */,
        t = naca(0.35, wt(u)) * c;
      P.push(...insignia(x, wy(u) + t + 0.01, -u * WS, 0.4, 0, -Z), ...insignia(x, wy(u) - t - 0.01, u * WS, 0.4, 0, Z));
      for (const s of [-1, 1]) {
        const st = 262,
          [, hw] = fusAt(st);
        P.push(...insignia(X(st), 0.02, s * (hw + 0.012), 0.33, s > 0 ? 0 : Math.PI, 0));
        for (const d of [-1, 1]) P.push(part(bx(0.36, 0.14, 0.01), 0xeceae2, X(st) + d * 0.45, 0.02, s * (fusAt(st + d * -18)[1] + 0.008)));
      }
    }
    /* invasion stripes (black and white) round the wings and the rear fuselage */
    if (o.stripes) {
      let k = 0;
      for (let i = 0; i < 5; i++) {
        const u0 = 0.4 + i * 0.075,
          c = k++ % 2 ? 0x15151a : 0xf1f1ec;
        for (const s of [-1, 1]) P.push(loft([wingRows(u0, u0, 0, s, 0.008)[0], wingRows(u0 + 0.075, u0 + 0.075, 0, s, 0.008)[0]], c));
      }
      [[292, 0xf1f1ec], [304, 0x15151a], [316, 0xf1f1ec]] /* aft of the fuselage star */.forEach(([st, c]) => P.push(fusLoft(st, st + 12, 1, c, 0.008)));
    }
    /* two 75 gal drop tanks on pylons under the wings */
    if (o.tanks)
      for (const s of [-1, 1]) {
        const u = 0.46,
          xc = (xle(u) + xte(u)) / 2 + 0.25,
          yb = wy(u) - (wt(u) * (xle(u) - xte(u))) * 0.5 * 0.55;
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const f = i / 8;
          pts.push(new THREE.Vector2(Math.max(0.001, 0.27 * Math.sin(Math.PI * f) ** 0.6), -1.0 + 2.0 * f));
        }
        const g = new THREE.LatheGeometry(pts, 10);
        g.rotateZ(-Z);
        P.push(part(g, 0xa5aaaf, xc, yb - 0.37, s * u * WS), part(bx(0.6, 0.14, 0.06), body, xc, yb - 0.04, s * u * WS));
      }
    /* landing gear: oleo legs with their fairing doors, the main wheels inboard of them, and the steerable tail wheel */
    if (!o.air) {
      const xm = X(114),
        ym = -1.6,
        rm = 0.343;
      for (const s of [-1, 1]) {
        const zl = s * 1.98,
          zw = s * 1.8;
        P.push(GX.rod([xm + 0.04, -0.5, zl], [xm, ym, zl], 0.06, 0xc9ccd0, 0.075, 8) /* the oleo leg, from inside the wing */);
        P.push(part(bx(0.5, 1.02, 0.02), body, xm + 0.02, -1.06, s * 2.045) /* its fairing door */);
        P.push(part(cyl(0.035, 0.035, 0.22, 6), 0xc9ccd0, xm, ym, (zl + zw) / 2, Z) /* the axle */);
        P.push(...GX.tyre(xm, ym, zw, rm, 0.2, TYRE, 0x8d9196, 20, 'z'));
      }
      const xt = X(313),
        yt = -0.673;
      P.push(GX.rod([X(303), -0.4, 0], [xt, yt, 0], 0.035, 0xc9ccd0, 0.035, 6), GX.rod([X(303), -0.4, 0.06], [xt, yt, 0.06], 0.012, 0xc9ccd0, 0.012, 4));
      P.push(...GX.tyre(xt, yt, 0, 0.17, 0.1, TYRE, 0x8d9196, 14, 'z'));
    }
    /* the attitude: parked on three wheels (nose up 12.3 deg, the main wheels on y = 0), or level with the thrust line at y = 1.4 */
    let M;
    if (o.air) M = new THREE.Matrix4().makeTranslation(0, 1.4, 0);
    else {
      const sit = Math.atan2(-0.673 - 0.17 - (-1.6 - 0.343), X(114) - X(313)),
        R = new THREE.Matrix4().makeRotationZ(sit),
        c = new THREE.Vector3(X(114), -1.6, 0).applyMatrix4(R);
      M = new THREE.Matrix4().makeTranslation(0, 0.343 - c.y, 0).multiply(R);
    }
    return P.map((q) => ({ ...q, m: M.clone().multiply(q.m || new THREE.Matrix4()) }));
  };
  MODELS.add('us-p51d', build, { L: 9.83, W: 11.28, name: 'North American P-51D Mustang (parked)' });
})();
