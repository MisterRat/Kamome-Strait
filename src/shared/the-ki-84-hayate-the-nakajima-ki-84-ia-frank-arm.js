/* ===== THE KI-84 HAYATE: the Nakajima Ki-84-Ia "Frank" (Army Type 4 Fighter), one model shared by P-51 Mustang FS and PCE-842 =====
   Keep this block identical in both games: an improvement made in one is copied to the other.
   Built to the published figures: span 11.238 m, length 9.92 m, wing area 21.0 m^2 (tapered wing, 6 deg dihedral, rounded tips),
   Ha-45 eighteen-cylinder radial in a 1.3 m cowl, four-blade 3.10 m propeller (brown, yellow tips), two 12.7 mm Ho-103 in the cowl,
   two 20 mm Ho-5 in the wings, bubble canopy, tall fin. Paint: Army olive green above, grey-green below, yellow-orange IFF
   strips on the inner leading edges, red hinomaru, white fuselage band.
   Frame: x forward along the thrust line, y up, z to starboard; origin at the centre of gravity (2.9 m behind the spinner tip).
   Shape measured off the Kagero 1/32 drawings and the US 3-view in PCE-842/References/Ki-84; markings after the 11th Sentai's
   White 46 (s/n 1446, the surviving aircraft now at Chiran): red spinner, lightning bolt on the fin.
   KI84.parts(o)   -> GX parts in the flying frame (o.gear 'down' | 'up', o.body hex, o.spinner hex, o.prop false to leave the blades out,
                      o.ang blade angle, o.tanks true for the two 200 l drop tanks)
   KI84.blades(a)  -> the four blades and spinner around the prop hub, for a spinning group placed at KI84.HUB
   KI84.parked(o)  -> the parts sitting on its wheels in the three-point attitude, wheels on y = 0, nose toward +x
   KI84.CONTACT    -> [x, z] of the three wheels' ground contacts in that parked frame
   KI84.mesh(o)    -> one vertex-coloured mesh of KI84.parts(o) */
const KI84 = (() => {
  const { part, Acc } = GX,
    V3 = THREE.Vector3,
    S0 = 2.9 /* centre of gravity, metres behind the spinner tip */,
    X = (s) => S0 - s /* station (metres aft of the spinner tip) to x */,
    lerpT = (T, s, k) => {
      if (s <= T[0][0]) return T[0][k];
      for (let i = 1; i < T.length; i++)
        if (s <= T[i][0]) {
          const a = T[i - 1],
            b = T[i],
            t = (s - a[0]) / (b[0] - a[0]),
            u = t * t * (3 - 2 * t);
          return a[k] + (b[k] - a[k]) * (0.5 * t + 0.5 * u);
        }
      return T[T.length - 1][k];
    },
    /* every triangle is turned to face out(p), the outward direction at its centre */
    geo = (pos, idx, out) => {
      if (out)
        for (let k = 0; k < idx.length; k += 3) {
          const a = idx[k] * 3,
            b = idx[k + 1] * 3,
            c = idx[k + 2] * 3,
            ux = pos[b] - pos[a],
            uy = pos[b + 1] - pos[a + 1],
            uz = pos[b + 2] - pos[a + 2],
            vx = pos[c] - pos[a],
            vy = pos[c + 1] - pos[a + 1],
            vz = pos[c + 2] - pos[a + 2],
            o = out([(pos[a] + pos[b] + pos[c]) / 3, (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3, (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3]);
          if ((uy * vz - uz * vy) * o[0] + (uz * vx - ux * vz) * o[1] + (ux * vy - uy * vx) * o[2] < 0) {
            const t = idx[k + 1];
            idx[k + 1] = idx[k + 2];
            idx[k + 2] = t;
          }
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    },
    /* a surface over a nu x nv grid of points f(i, j) */
    grid = (nu, nv, f, out) => {
      const pos = [],
        idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
      for (let j = 0; j < nv; j++)
        for (let i = 0; i < nu; i++) {
          const a = j * (nu + 1) + i,
            b = a + 1,
            c = a + nu + 1,
            d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      return geo(pos, idx, out);
    },
    /* a flat disc laid on a surface: map(dx, dy) gives the point and the outward normal */
    disc = (r, map, n, off) => {
      /* in rings, so it follows the curve of the skin instead of cutting under it */
      const n0 = map(0, 0)[1];
      return grid(n || 24, 6, (u, v) => {
        const [p, nn] = map(r * v * Math.cos(u * 2 * Math.PI), r * v * Math.sin(u * 2 * Math.PI));
        const k = off || 0.008;
        return [p[0] + nn[0] * k, p[1] + nn[1] * k, p[2] + nn[2] * k];
      }, () => n0);
    };

  /* ---------- the fuselage: stations (s), half width, top and bottom (m, from the thrust line) ---------- */
  /* measured off the Kagero 1/32 side and plan views (References/Ki-84): the forward decking rises from the cowl to the windscreen,
     the spine stays high all the way to the fin, and the belly sweeps up behind the wing */
  const FU = [
      [0.55, 0.6, 0.6, -0.6],
      [0.8, 0.645, 0.645, -0.645],
      [1.5, 0.665, 0.665, -0.67],
      [1.9, 0.65, 0.74, -0.7],
      [2.5, 0.62, 0.82, -0.76],
      [3.2, 0.58, 0.86, -0.78],
      [4.2, 0.53, 0.84, -0.75],
      [5.2, 0.46, 0.78, -0.6],
      [6.5, 0.41, 0.74, -0.45],
      [7.6, 0.32, 0.71, -0.34],
      [8.5, 0.23, 0.67, -0.22],
      [9.2, 0.12, 0.6, -0.1],
      [9.62, 0.04, 0.5, 0.02],
    ],
    NS = 2.5 /* superellipse exponent of the sections */,
    se = (c, n) => Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
    /* a point on the fuselage at station s, angle a (0 on top, + toward starboard), pushed out by o */
    fpt = (s, a, o) => {
      const hw = lerpT(FU, s, 1) + (o || 0),
        yt = lerpT(FU, s, 2) + (o || 0),
        yb = lerpT(FU, s, 3) - (o || 0),
        ym = (yt + yb) / 2,
        h = (yt - yb) / 2;
      const c = Math.cos(a),
        k = c > 0 ? 1 - 0.18 * c * c * Math.min(1, Math.max(0, (s - 4.6) / 2)) : 1;
      return [X(s), ym + h * se(c, NS), k * hw * se(Math.sin(a), NS)];
    },
    fnorm = (s, a) => {
      const p = fpt(s, a),
        q = fpt(s, a + 0.01),
        r = fpt(s + 0.01, a),
        u = new V3(q[0] - p[0], q[1] - p[1], q[2] - p[2]),
        v = new V3(r[0] - p[0], r[1] - p[1], r[2] - p[2]),
        n = new V3().crossVectors(v, u).normalize();
      const out = new V3(0, p[1] - (lerpT(FU, s, 2) + lerpT(FU, s, 3)) / 2, p[2]);
      if (n.dot(out) < 0) n.negate();
      return n.toArray();
    },
    fuse = (s0, s1, a0, a1, o, ns) =>
      grid(ns || 40, Math.max(2, Math.round(((a1 - a0) / Math.PI) * 14)), (u, v) => fpt(s0 + (s1 - s0) * u, a0 + (a1 - a0) * v, o), (p) => {
        const ss = S0 - p[0];
        return [0, p[1] - (lerpT(FU, ss, 2) + lerpT(FU, ss, 3)) / 2, p[2]];
      }),
    /* a decal on the fuselage side: centred at station s, height y, on side sd */
    fdecal = (r, s, y, sd, off) =>
      disc(r, (dx, dy) => {
        const ss = s - dx,
          yt = lerpT(FU, ss, 2),
          yb = lerpT(FU, ss, 3),
          ym = (yt + yb) / 2,
          h = (yt - yb) / 2,
          c = Math.max(-1, Math.min(1, (y + dy - ym) / h)),
          /* invert the superellipse for the angle that gives this height */
          a = Math.acos(Math.sign(c) * Math.pow(Math.abs(c), NS / 2)) * sd;
        return [fpt(ss, a), fnorm(ss, a)];
      }, 24, off);

  /* ---------- the wing family: an aerofoil swept along a planform (also the tailplane and the fin) ---------- */
  const foil = (x, t) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x),
    camber = (x, m) => (x < 0.4 ? (m / 0.16) * (0.8 * x - x * x) : (m / 0.36) * (0.2 - 0.8 * x + x * x)),
    /* W: { half span, root LE station, LE sweep (m per m), root chord, tip chord, tip round length, t root, t tip, camber, dihedral, root height } */
    wpt = (W, z, u, up, inf) => {
      const zt = W.b - W.tr,
        k = Math.min(z, zt) / zt;
      let c = W.c0 + (W.c1 - W.c0) * k,
        le = W.le + W.sw * z;
      if (z > zt) {
        /* elliptic tip: the chord shrinks about its 40% line */
        const e = Math.sqrt(Math.max(0.0004, 1 - Math.pow((z - zt) / W.tr, 2))),
          mid = le + 0.4 * c;
        c *= e;
        le = mid - 0.4 * c;
      }
      const uc = (1 - Math.cos(u * Math.PI)) / 2,
        t = W.t0 + (W.t1 - W.t0) * Math.min(1, z / W.b),
        yy = c * (camber(uc, W.m) + (up ? 1 : -1) * (foil(uc, t) + (inf || 0) / c));
      return { s: le + uc * c, y: W.y0 + Math.tan(W.dh) * z + yy, c, le };
    },
    /* map the wing's (span, chord, side) to the model frame; vertical surfaces (fin) turn the span to +y */
    wxyz = (W, z, u, up, sd, inf) => {
      const p = wpt(W, z, u, up, inf);
      return W.vert ? [X(p.s), W.yb + z, p.y * (up ? 1 : 1)] : [X(p.s), p.y, sd * (W.z0 + z)];
    },
    wsurf = (W, sd, up, z0, z1, u0, u1, inf, nu, nv) =>
      grid(nu || 16, nv || 18, (u, v) => wxyz(W, z0 + (z1 - z0) * v, u0 + (u1 - u0) * u, up, sd, inf), () => (W.vert ? [0, 0, up ? 1 : -1] : [0, up ? 1 : -1, 0])),
    /* a decal on a wing surface at span z, chord fraction u */
    wdecal = (W, r, z, uf, sd, up) =>
      disc(r, (dx, dy) => {
        const zz = z + dy,
          p0 = wpt(W, zz, 0, up),
          s = p0.le + uf * p0.c - dx,
          u = Math.acos(Math.max(-1, Math.min(1, 1 - (2 * (s - p0.le)) / p0.c))) / Math.PI,
          a = wxyz(W, zz, u, up, sd),
          b = wxyz(W, zz + 0.02, u, up, sd),
          c = wxyz(W, zz, Math.min(1, u + 0.02), up, sd),
          n = new V3()
            .crossVectors(new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), new V3(c[0] - a[0], c[1] - a[1], c[2] - a[2]))
            .normalize();
        if ((up ? 1 : -1) * n.y < 0) n.negate();
        return [a, n.toArray()];
      }, 28);
  /* the fin's half thickness at station s, height y */
  const finZ = (s, y) => {
    const z = Math.max(0.01, Math.min(FIN.b - 0.05, y - FIN.yb)),
      p0 = wpt(FIN, z, 0, true),
      xc = Math.max(0.002, Math.min(0.998, (s - p0.le) / p0.c)),
      t = FIN.t0 + (FIN.t1 - FIN.t0) * (z / FIN.b);
    return p0.c * foil(xc, t);
  };
  const WING = { b: 5.619, z0: 0, le: 2.15, sw: 0.03, c0: 2.5, c1: 1.15, tr: 0.45, t0: 0.16, t1: 0.09, m: 0.02, dh: (6 * Math.PI) / 180, y0: -0.45 },
    TAIL = { b: 2.22, z0: 0, le: 8.15, sw: 0.03, c0: 1.1, c1: 0.85, tr: 0.45, t0: 0.11, t1: 0.08, m: 0, dh: 0, y0: 0.47 },
    FIN = { b: 1.53, z0: 0, le: 7.7, sw: 0.85, c0: 2.22, c1: 0.92, tr: 0.42, t0: 0.1, t1: 0.08, m: 0, dh: 0, y0: 0, yb: 0.1, vert: true };

  /* ---------- the propeller ---------- */
  const HUB = X(0.42),
    blade = () => {
      /* one blade along +y: wide paddle, rounded tip, twisted, brown with a yellow tip (built as two parts) */
      const R0 = 0.26,
        R1 = 1.55,
        sec = (u) => {
          const r = R0 + (R1 - R0) * u,
            c = (0.17 + 0.16 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.85)) * (u > 0.88 ? Math.sqrt(Math.max(0.05, 1 - Math.pow((u - 0.88) / 0.12, 2))) : 1),
            tw = 0.95 - 0.6 * u;
          return { r, c, tw, t: 0.05 * (1 - 0.7 * u) + 0.012 };
        },
        side = (u0, u1, f) =>
          grid(6, 10, (i, j) => {
            const q = sec(u0 + (u1 - u0) * j),
              cx = (i - 0.5) * q.c,
              cy = f * q.t * (1 - Math.pow(2 * i - 1, 2)) * 0.5;
            return [cy * Math.cos(q.tw) - cx * Math.sin(q.tw), q.r, cx * Math.cos(q.tw) + cy * Math.sin(q.tw)];
          }, (p) => {
            const q = sec(Math.max(0, Math.min(1, (p[1] - R0) / (R1 - R0))));
            return [f * Math.cos(q.tw), 0, f * Math.sin(q.tw)];
          });
      return { brown: [side(0, 0.8, 1), side(0, 0.8, -1), side(0.83, 0.9, 1), side(0.83, 0.9, -1)], tip: [side(0.8, 0.83, 1), side(0.8, 0.83, -1), side(0.9, 1, 1), side(0.9, 1, -1)] };
    },
    BL = blade(),
    PROPC = 0x2e2a22,
    TIPC = 0xd9a91f;
  const blades = (ang, spin) => {
    const P = [];
    for (let k = 0; k < 4; k++) {
      const a = (ang || 0) + (k * Math.PI) / 2;
      for (const g of BL.brown) P.push(part(g, PROPC, 0, 0, 0, a));
      for (const g of BL.tip) P.push(part(g, TIPC, 0, 0, 0, a));
    }
    /* the spinner, a pointed cone about the hub */
    P.push(part(new THREE.LatheGeometry([...Array(9)].map((_, i) => new THREE.Vector2(0.31 * Math.sin(((i / 8) * Math.PI) / 2) + 0.001, 0.42 - 0.58 * (i / 8))).reverse(), 18), spin == null ? 0xa82820 : spin, 0, 0, 0, 0, 0, -Math.PI / 2));
    return P;
  };

  const parts = (o) => {
    o = o || {};
    const body = o.body == null ? 0x4f5b3a : o.body,
      under = 0x9c9f93,
      dark = 0x1d1e1b,
      red = 0xb5141c,
      white = 0xe2e1d8,
      iff = 0xe08f22,
      glass = 0x2f4655,
      frame = body,
      metal = 0x55585a,
      line = (c) => (c === under ? 0x7d8076 : 0x3c4630),
      P = [],
      add = (g, hex, x, y, z, rx, ry, rz, sx, sy, sz) => P.push(part(g, hex, x || 0, y || 0, z || 0, rx, ry, rz, sx, sy, sz));
    const A = 0.62 * Math.PI; /* the colour demarcation, a little below the side's widest point */
    /* fuselage: olive top and sides, grey belly */
    add(fuse(0.5, 9.62, -A, A, 0, 48), body);
    add(fuse(0.5, 9.62, A, 2 * Math.PI - A, 0, 48), under);
    /* tail cap and the cowl front: the engine's front row of cylinders behind the cowl lip */
    add(new THREE.CircleGeometry(0.62, 24), dark, X(0.6), 0, 0, 0, Math.PI / 2);
    add(new THREE.TorusGeometry(0.6, 0.035, 6, 30), 0x2a2b28, X(0.52), 0, 0, 0, Math.PI / 2);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 2 * Math.PI;
      add(new THREE.CylinderGeometry(0.075, 0.085, 0.22, 8), 0x3a3b38, X(0.72), 0.42 * Math.cos(a), 0.42 * Math.sin(a), Math.PI / 2 - a, 0, Math.PI / 2, 1, 1, 1);
    }
    add(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 14), 0x2f302d, X(0.62), 0, 0, 0, 0, Math.PI / 2); /* reduction-gear case */
    /* cowl gills: a slightly flared ring of flaps behind the cowl */
    add(fuse(1.7, 1.9, -Math.PI, Math.PI, 0.012, 3), 0x3d4632);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * 2 * Math.PI,
        p = fpt(1.88, a, 0.012);
      add(new THREE.BoxGeometry(0.2, 0.01, 0.012), 0x2c3324, p[0], p[1], p[2], -a, 0, 0);
    }
    /* anti-glare panel on top of the cowl, and the troughs of the two Ho-103 guns firing through the propeller */
    add(fuse(0.75, 3.25, -0.33, 0.33, 0.004, 12), 0x23271d);
    for (const z of [-0.14, 0.14]) {
      add(new THREE.BoxGeometry(1.0, 0.03, 0.06), 0x111210, X(1.15), 0.65, z);
      add(new THREE.CylinderGeometry(0.018, 0.018, 0.25, 6), 0x111210, X(0.62), 0.6, z, 0, 0, Math.PI / 2);
    }
    /* carburettor intake on top of the cowl lip, oil cooler under the chin */
    add(new THREE.BoxGeometry(0.55, 0.1, 0.2), body, X(0.95), 0.66, 0);
    add(new THREE.BoxGeometry(0.04, 0.07, 0.16), dark, X(0.68), 0.66, 0);
    add(new THREE.BoxGeometry(0.66, 0.3, 0.44), under, X(1.8), -0.78, 0);
    add(new THREE.BoxGeometry(0.04, 0.22, 0.38), dark, X(1.47), -0.8, 0);
    /* exhausts: the Ha-45's individual thrust stacks, two banks a side, and the soot streak they leave along the fuselage */
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const s = 1.93 + (i % 2) * 0.05,
          y = 0.45 - i * 0.19,
          a = Math.acos(Math.max(-1, Math.min(1, (y - 0.02) / 0.7))),
          p = fpt(s, sd * a);
        add(new THREE.CylinderGeometry(0.04, 0.045, 0.22, 6), 0x2b2522, p[0] - 0.08, p[1], p[2] + sd * 0.02, Math.PI / 2, 0, -0.5 * sd, 1, 1, 1);
      }
      add(fuse(2.0, 3.3, sd > 0 ? 1.2 : -1.8, sd > 0 ? 1.8 : -1.2, 0.004, 10), 0x434a38);
    }
    /* the canopy: windscreen, sliding hood and the fixed rear glazing over the cockpit */
    const CAN = [
        [3.19, 0.0, 0.3],
        [3.65, 0.3, 0.31],
        [4.2, 0.33, 0.32],
        [4.75, 0.31, 0.31],
        [5.0, 0.18, 0.27],
        [5.25, 0.0, 0.2],
      ],
      cpt = (s, a, o) => {
        const h = lerpT(CAN, s, 1) + (o || 0),
          w = lerpT(CAN, s, 2) + (o || 0),
          base = lerpT(FU, s, 2) - 0.05;
        return [X(s), base + h * se(Math.cos(a), 2.2), w * se(Math.sin(a), 2.2)];
      };
    const cout = (p) => [0, p[1] - lerpT(FU, S0 - p[0], 2) + 0.05, p[2]];
    add(grid(30, 14, (u, v) => cpt(3.19 + 2.06 * u, -Math.PI / 2 + Math.PI * v), cout), glass);
    /* frames: the windscreen bow, the hood's front and rear bows, the rear section's bow, and the hood's top rail */
    for (const s of [3.62, 3.72, 4.75, 5.0])
      add(grid(1, 14, (u, v) => cpt(s + u * 0.04, -Math.PI / 2 + Math.PI * v, 0.012), cout), frame);
    for (const sd of [-1, 1]) add(grid(20, 1, (u, v) => cpt(3.19 + 0.45 * u, sd * (0.55 + 0.06 * v), 0.01), cout), frame);
    add(grid(26, 1, (u, v) => cpt(3.75 + 1.0 * u, -0.025 + 0.05 * v, 0.012), cout), frame);
    /* the head armour and headrest inside the hood, the pilot's gunsight */
    add(new THREE.BoxGeometry(0.06, 0.32, 0.34), 0x2a2c27, X(4.62), 1.0, 0);
    add(new THREE.BoxGeometry(0.1, 0.1, 0.08), 0x1a1a1a, X(3.6), 1.0, 0);
    /* the radio mast behind the canopy and the aerial wire to the fin */
    add(new THREE.BoxGeometry(0.08, 0.84, 0.035), body, X(5.55), 1.17, 0, 0, 0, 0.08);
    {
      const a = new V3(X(5.55) - 0.03, 1.58, 0),
        b = new V3(X(9.35), FIN.yb + FIN.b * 0.95, 0),
        d = b.clone().sub(a);
      add(new THREE.CylinderGeometry(0.005, 0.005, d.length(), 3), 0x111111, (a.x + b.x) / 2, (a.y + b.y) / 2, 0, 0, 0, Math.atan2(d.y, d.x) - Math.PI / 2);
    }
    /* markings on the fuselage: the hinomaru and the white band ahead of the tail */
    for (const sd of [-1, 1]) {
      add(fdecal(0.46, 6.23, 0.12, sd), white);
      add(fdecal(0.4, 6.23, 0.12, sd, 0.016), red);
    }
    add(fuse(7.05, 7.35, -Math.PI, Math.PI, 0.004, 3), white);

    /* ---------- the wings ---------- */
    for (const sd of [-1, 1]) {
      add(wsurf(WING, sd, true, 0, WING.b, 0, 1, 0, 22, 22), body);
      add(wsurf(WING, sd, false, 0, WING.b, 0, 1, 0, 22, 22), under);
      /* yellow-orange IFF strip along the leading edge, from the fuselage out to three-quarters of the span */
      add(wsurf(WING, sd, true, 0.62, 4.4, 0, 0.09, 0.004, 4, 12), iff);
      add(wsurf(WING, sd, false, 0.62, 4.4, 0, 0.07, 0.004, 4, 12), iff);
      /* hinomaru on both faces near the tip (the upper ones without a surround, the lower ones too) */
      add(wdecal(WING, 0.62, 3.96, 0.6, sd, true), red);
      add(wdecal(WING, 0.62, 3.96, 0.6, sd, false), red);
      /* hinge lines: the flaps inboard, the ailerons outboard, top and bottom */
      for (const up of [true, false]) {
        add(wsurf(WING, sd, up, 0.62, 3.0, 0.775, 0.785, 0.003, 1, 8), line(up ? body : under));
        add(wsurf(WING, sd, up, 3.05, 5.15, 0.735, 0.745, 0.003, 1, 8), line(up ? body : under));
        add(wsurf(WING, sd, up, 3.0, 3.05, 0.74, 1.0, 0.003, 4, 1), line(up ? body : under));
      }
      /* the 20 mm Ho-5 cannon: barrel and fairing out of the leading edge */
      {
        const z = 2.6,
          p = wpt(WING, z, 0, true),
          y = WING.y0 + Math.tan(WING.dh) * z - 0.02;
        add(new THREE.CylinderGeometry(0.05, 0.055, 0.32, 10), body, X(p.s) + 0.08, y, sd * z, 0, 0, Math.PI / 2);
        add(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 8), 0x161616, X(p.s) + 0.4, y, sd * z, 0, 0, Math.PI / 2);
      }
      /* the landing light in the starboard leading edge, the pitot tube on the port wing */
      if (sd > 0) {
        const z = 3.55,
          p = wpt(WING, z, 0, true);
        add(new THREE.SphereGeometry(0.1, 10, 6), 0xd8e2e6, X(p.s) - 0.03, WING.y0 + Math.tan(WING.dh) * z, z, 0, 0, 0, 0.6, 0.6, 1.4);
      } else {
        const z = 4.2,
          p = wpt(WING, z, 0, false);
        add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), 0x8a8a86, X(p.s) + 0.2, WING.y0 + Math.tan(WING.dh) * z - 0.1, -z, 0, 0, Math.PI / 2);
      }
      /* navigation lights on the tips */
      add(new THREE.SphereGeometry(0.04, 6, 4), sd > 0 ? 0x2a9a4a : 0xc0262a, X(wpt(WING, WING.b - 0.03, 0.35, true).s), WING.y0 + Math.tan(WING.dh) * (WING.b - 0.03), sd * (WING.b - 0.02));
    }
    /* the wing fillet under the fuselage, where the wing meets the belly */
    add(fuse(2.35, 4.95, Math.PI * 0.75, Math.PI * 1.25, 0.02, 14), under);

    /* ---------- the tail: tailplane with elevators, the fin and rudder ---------- */
    for (const sd of [-1, 1]) {
      add(wsurf(TAIL, sd, true, 0, TAIL.b, 0, 1, 0, 12, 12), body);
      add(wsurf(TAIL, sd, false, 0, TAIL.b, 0, 1, 0, 12, 12), under);
      for (const up of [true, false]) add(wsurf(TAIL, sd, up, 0.15, 1.9, 0.55, 0.565, 0.003, 1, 6), line(up ? body : under));
    }
    add(wsurf(FIN, 1, true, 0, FIN.b, 0, 1, 0, 12, 12), body);
    add(wsurf(FIN, 1, false, 0, FIN.b, 0, 1, 0, 12, 12), body);
    for (const up of [true, false]) add(wsurf(FIN, 1, up, 0.02, 1.2, 0.6, 0.615, 0.003, 1, 6), line(body));
    /* the rudder's lower part, running down behind the tail cone */
    add(new THREE.BoxGeometry(0.5, 0.22, 0.06), body, X(9.62), 0.1, 0);
    /* the 11th Sentai's lightning bolt across the fin and rudder, red edged in white (o.unit false leaves it off).
       Laid out in the fin's own coordinates (chord fraction, height fraction) and draped on its skin, so it stays on the fin. */
    if (o.unit !== false) {
      const PTS = [
          [0.2, 0.42],
          [0.52, 0.7],
          [0.55, 0.5],
          [0.9, 0.74],
        ],
        onFin = (u, h, sd, off) => {
          const z = h * FIN.b,
            p = wpt(FIN, z, 0, true),
            xc = Math.max(0.002, Math.min(0.998, u)),
            t = FIN.t0 + (FIN.t1 - FIN.t0) * h;
          return [X(p.le + xc * p.c), FIN.yb + z, sd * (p.c * foil(xc, t) + off)];
        };
      for (const sd of [-1, 1])
        for (const [w, c, off] of [
          [0.05, white, 0.005],
          [0.027, red, 0.01],
        ])
          for (let i = 0; i < 3; i++) {
            const [u0, h0] = PTS[i],
              [u1, h1] = PTS[i + 1],
              /* the strip's width across its direction, in fin fractions (chord ~1.6 m, height 1.53 m) */
              dl = Math.hypot((u1 - u0) * 1.6, (h1 - h0) * FIN.b),
              nu = (-(h1 - h0) * FIN.b) / dl / 1.6,
              nh = ((u1 - u0) * 1.6) / dl / FIN.b,
              e = w / dl;
            add(
              grid(10, 1, (a, b) => {
                const k = -e + (1 + 2 * e) * a,
                  q = b - 0.5;
                return onFin(u0 + (u1 - u0) * k + nu * w * q * 2, h0 + (h1 - h0) * k + nh * w * q * 2, sd, off);
              }, () => [0, 0, sd]),
              c,
            );
          }
    }

    /* ---------- undercarriage ---------- */
    const MW = { s: 2.25, z: 1.75, top: -0.5, ax: -1.62, r: 0.33 };
    if (o.gear !== 'up') {
      for (const sd of [-1, 1]) {
        const x = X(MW.s);
        /* oleo leg and its torque link, the wheel with its hub, the door on the leg, and the open inner door */
        add(new THREE.CylinderGeometry(0.06, 0.06, MW.top - MW.ax + 0.05, 8), 0x6c6f70, x, (MW.top + MW.ax) / 2, sd * (MW.z - 0.1));
        add(new THREE.CylinderGeometry(0.045, 0.045, 0.38, 8), 0xb9bcbd, x, MW.ax + 0.24, sd * (MW.z - 0.1));
        add(new THREE.BoxGeometry(0.14, 0.04, 0.03), 0x55585a, x - 0.08, MW.ax + 0.33, sd * (MW.z - 0.1), 0, 0, 0.6);
        P.push(...GX.tyre(x, MW.ax, sd * MW.z, MW.r, 0.17, 0x161616, metal, 20)); /* the main wheel: round tyre, rim and hub */
        add(new THREE.BoxGeometry(0.62, 0.9, 0.025), under, x, MW.ax + 0.42, sd * (MW.z + 0.098)); /* the leg door, outboard of the wheel */
        add(new THREE.BoxGeometry(0.1, 0.08, 0.24), 0x6c6f70, x, MW.ax + 0.8, sd * (MW.z - 0.005)); /* its bracket on the oleo leg */
        add(new THREE.BoxGeometry(0.62, 0.02, 0.5), under, x, MW.top - 0.22, sd * 0.42, sd * 1.3);
        /* the open wheel well under the wing */
        add(wdecal(WING, 0.36, 0.95, 0.32, sd, false), 0x3a4048);
      }
      /* the tail wheel */
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 6), 0x6c6f70, X(8.7), -0.3, 0, 0, 0, 0.25);
      P.push(...GX.tyre(X(8.75), -0.47, 0, 0.13, 0.09, 0x161616, 0x6c6f70, 14)); /* the tail wheel */
    } else {
      /* gear up: the doors flush under the wing */
      for (const sd of [-1, 1]) add(wdecal(WING, 0.36, 0.95, 0.32, sd, false), line(under));
    }
    /* drop tanks */
    if (o.tanks)
      for (const sd of [-1, 1]) {
        add(new THREE.SphereGeometry(1, 14, 10), 0x8f9286, X(3.3), -1.02, sd * 2.0, 0, 0, 0, 1.15, 0.22, 0.22);
        add(new THREE.BoxGeometry(0.4, 0.2, 0.04), 0x8f9286, X(3.25), -0.8, sd * 2.0);
      }
    if (o.prop !== false) for (const q of blades(o.ang, o.spinner)) P.push(part(q.g, q.hex, 0, 0, 0)), (P[P.length - 1].m = new THREE.Matrix4().makeTranslation(HUB, 0, 0).multiply(q.m));
    return P;
  };
  /* three-point attitude: main wheels and tail wheel on the ground */
  const MAIN = [X(2.25), -1.62 - 0.33],
    TAILW = [X(8.75), -0.47 - 0.13],
    ATT = Math.atan2(TAILW[1] - MAIN[1], MAIN[0] - TAILW[0]),
    PARK = new THREE.Matrix4().makeTranslation(0, -(MAIN[1] * Math.cos(ATT) + MAIN[0] * Math.sin(ATT)), 0).multiply(new THREE.Matrix4().makeRotationZ(ATT));
  /* where the wheels touch the ground in the parked frame: [x, z] of the two main wheels and the tail wheel */
  const CONTACT = [MAIN, MAIN, TAILW].map(([x, y], i) => [x * Math.cos(ATT) - y * Math.sin(ATT), [1.75, -1.75, 0][i]]);
  const parked = (o) => parts(Object.assign({}, o, { gear: 'down' })).map((q) => ({ g: q.g, hex: q.hex, m: q.m ? PARK.clone().multiply(q.m) : PARK.clone() }));
  const mesh = (o, mat) => new THREE.Mesh(new Acc().add(parts(o)).geometry(), mat || new THREE.MeshLambertMaterial({ vertexColors: true }));
  return { parts, blades, parked, mesh, CONTACT, HUB, ATT, S0, SPAN: 11.238, LEN: 9.92, WING, TAIL, FIN, X };
})();
