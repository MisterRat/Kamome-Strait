/* ---------- US airfield buildings, 1945 Pacific (docs/research_1945_bases.md, "US structures in detail") ----------
   Real sizes in metres, standing on y = 0; the door side faces +x. Corrugated steel is shown with alternating vertex-colour bands
   (no textures), ribs and trusses as thin raised members. */
(() => {
  const { part, bx, cyl } = GX,
    Z = Math.PI / 2;
  /* a half-elliptical arch section (z across, y up), n segments, half-width a, rise b, from springing height y0 */
  const arch = (a, b, y0, n) => Array.from({ length: n + 1 }, (_, i) => {
    const t = Math.PI * (i / n);
    return [-Math.cos(t) * a, y0 + Math.sin(t) * b];
  });
  /* corrugated arch skin from x0 to x1: one grid per arch facet, alternate facets a shade apart (the sheets) */
  const skin = (P, sec, x0, x1, c1, c2) => {
    for (let i = 0; i < sec.length - 1; i++) {
      const [z0, y0] = sec[i],
        [z1, y1] = sec[i + 1];
      P.push(...GX.both(GX.grid([[[x0, y0, z0], [x1, y0, z0]], [[x0, y1, z1], [x1, y1, z1]]], i % 2 ? c1 : c2)));
    }
  };
  /* an end wall filling an arch section at x (a flat polygon) */
  const endWall = (sec, x, c, flip) => {
    const sh = new THREE.Shape();
    sec.forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
    const g = new THREE.ShapeGeometry(sh);
    g.rotateY(flip ? -Z : Z);
    g.translate(x, 0, 0);
    return GX.both(part(g, c, 0, 0, 0));
  };
  /* Butler combat hangar: 39.62 m clear span x 48.77 m long x 11.89 m crown; three-hinged lattice box-truss arches at 6.10 m (8 bays);
     galvanised corrugated sheeting, the lowest row left open for air; canvas curtain doors under a box-girder header; tail notch at the back */
  MODELS.add('us-butler-hangar', () => {
    const P = [],
      W = 39.62,
      Lh = 48.77,
      H = 11.89,
      x0 = -Lh / 2,
      x1 = Lh / 2,
      G1 = 0x8e969b,
      G2 = 0x848c91,
      sec = arch(W / 2, H - 1.6, 1.6, 14);
    P.push(part(bx(Lh + 2, 0.25, W + 2), 0x7c7d78, 0, 0.12, 0)); /* the coral-concrete floor */
    skin(P, sec, x0, x1, G1, G2);
    /* the open lowest row along both sides (dark), with the truss feet showing */
    for (const s of [-1, 1]) P.push(part(bx(Lh, 1.6, 0.05), 0x1e2124, 0, 0.8, s * (W / 2 - 0.02)));
    /* the arch trusses: 9 lattice box trusses at 6.10 m, standing proud of the skin as dark bands */
    for (let k = 0; k <= 8; k++) {
      const x = x0 + (k * Lh) / 8,
        sc = arch(W / 2 + 0.25, H - 1.35, 1.6, 14);
      for (let i = 0; i < sc.length - 1; i++) {
        const [za, ya] = sc[i],
          [zb, yb] = sc[i + 1],
          l = Math.hypot(zb - za, yb - ya);
        P.push(part(bx(0.5, 0.3, l), 0x6d7378, x, (ya + yb) / 2, (za + zb) / 2, -Math.atan2(yb - ya, zb - za), 0, 0));
      }
      for (const s of [-1, 1]) P.push(part(bx(0.5, 1.6, 0.5), 0x6d7378, x, 0.8, s * (W / 2 + 0.1)));
    }
    /* back wall with the tail notch (a box 5 m deep, 6 m wide, 10 m high) */
    P.push(...endWall(sec, x0, G2, true), part(bx(5, 10, 6), 0x868e93, x0 - 2.5, 5, 0), part(bx(5.4, 0.3, 6.4), 0x6d7378, x0 - 2.5, 10.1, 0));
    /* the door end: box-girder header across the opening, the gable above it, canvas curtains drawn to either side */
    const hy = 8.6;
    P.push(part(bx(1.0, 1.4, W), 0x6d7378, x1, hy + 0.7, 0));
    const gab = sec.filter(([, y]) => y >= hy + 1.4).map(([z, y]) => [z, y]);
    if (gab.length > 2) P.push(...endWall([[gab[0][0], hy + 1.4], ...gab, [gab[gab.length - 1][0], hy + 1.4]], x1, G1));
    for (const s of [-1, 1]) P.push(part(bx(0.6, hy, 9), 0x5a5c42, x1 - 0.3, hy / 2, s * (W / 2 - 4.6)));
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) P.push(part(bx(0.15, hy, 0.25), 0x4d4f38, x1 - 0.05, hy / 2, s * (W / 2 - 1 - i * 1.5)));
    P.push(part(bx(0.05, hy - 0.2, W - 18.4), 0x101214, x1 - 1.2, (hy - 0.2) / 2, 0)); /* the dark interior through the open curtains */
    return P;
  }, { L: 48.77, W: 39.62, H: 11.89, name: 'Butler combat hangar' });
  /* Quonset hut. 'std' Stran-Steel 20 x 48 ft: 6.10 x 14.63 m, 3.15 m high, 13 ribs at 1.22 m; 'elephant' 40 x 100 ft: 12.19 x 30.48 x 6.10 m,
     26 ribs, sliding end doors. Olive drab corrugated steel on a concrete slab; end walls with a double door, two windows and a vent. */
  MODELS.add('us-quonset', (kind) => {
    const E = kind === 'elephant',
      W = E ? 12.19 : 6.1,
      Lq = E ? 30.48 : 14.63,
      Rr = E ? 6.1 : 3.05,
      nR = E ? 26 : 13,
      C1 = 0x5b6045,
      C2 = 0x535840,
      P = [],
      sec = arch(W / 2, Rr, 0.1, 10);
    P.push(part(bx(Lq + 1, 0.2, W + 0.8), 0x8a8a84, 0, 0.1, 0));
    skin(P, sec, -Lq / 2, Lq / 2, C1, C2);
    for (let k = 0; k < nR; k++) {
      const x = -Lq / 2 + (k * Lq) / (nR - 1),
        sc = arch(W / 2 + 0.04, Rr + 0.04, 0.1, 10);
      for (let i = 0; i < sc.length - 1; i++) {
        const [za, ya] = sc[i],
          [zb, yb] = sc[i + 1],
          l = Math.hypot(zb - za, yb - ya);
        P.push(part(bx(0.1, 0.05, l), 0x464a35, x, (ya + yb) / 2, (za + zb) / 2, -Math.atan2(yb - ya, zb - za), 0, 0));
      }
    }
    for (const [x, fl] of [[Lq / 2, false], [-Lq / 2, true]]) {
      P.push(...endWall(sec, x, 0x6a6e56, fl));
      const s = fl ? -1 : 1,
        dw = E ? 4.5 : 1.12,
        dh = E ? 4.2 : 2.03;
      P.push(part(bx(0.06, dh, dw), E ? 0x4d523a : 0x3c3a2e, x + s * 0.03, 0.1 + dh / 2, 0));
      for (const z of E ? [-4.2, 4.2] : [-1.9, 1.9]) P.push(part(bx(0.06, 0.95, 0.8), 0x1e2a30, x + s * 0.03, E ? 2.4 : 1.55, z));
      P.push(part(bx(0.06, 0.4, 0.8), 0x3c3a2e, x + s * 0.03, E ? 5.2 : 2.6, 0));
    }
    return P;
  }, { name: 'Quonset hut' });
  /* steel-angle control tower: an open frame of four tapering angle-iron legs on concrete footings, girts at every 3 m and X-bracing on
     each face; an outside stair of four switchback flights (stringers, treads, handrail) with landings bolted to the -z face; the cab on a
     catwalk deck at 12 m: low wall, green-tinted glass leaning out, roof with overhang, mast and Aldis lamp. Every member is drawn from
     joint to joint (GX.rod / GX.beam), so legs, girts, braces, landings and the deck all meet. */
  MODELS.add('us-control-tower', () => {
    const P = [],
      S = 0x5d6248 /* the steel */,
      TB = 0x7a6648 /* timber */,
      w0 = 3.4,
      w1 = 2.6,
      H = 12,
      leg = (y) => w0 + ((w1 - w0) * y) / H,
      J = (sx, sz, y) => [sx * leg(y), y, sz * leg(y)] /* a leg at height y */,
      rod = (a, b, r) => P.push(GX.rod(a, b, r, S, r, 4)) /* angle iron, drawn square */;
    /* the legs on their footings */
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        rod(J(sx, sz, 0.3), J(sx, sz, H), 0.11);
        P.push(part(bx(0.7, 0.3, 0.7), 0x9a968c, sx * leg(0.3), 0.15, sz * leg(0.3))); /* the concrete footing the leg is bolted to */
      }
    /* girts round each level and an X of braces on every face of every storey */
    const faces = [[[1, -1], [1, 1]], [[-1, -1], [-1, 1]], [[-1, 1], [1, 1]], [[-1, -1], [1, -1]]];
    for (let k = 0; k < 4; k++) {
      const y0 = k * 3,
        y1 = y0 + 3;
      for (const [[ax, az], [bx_, bz]] of faces) {
        rod(J(ax, az, y1), J(bx_, bz, y1), 0.06);
        rod(J(ax, az, y0 + 0.2), J(bx_, bz, y1), 0.04);
        rod(J(bx_, bz, y0 + 0.2), J(ax, az, y1), 0.04);
      }
    }
    /* the outside stair on the -z face: flight k climbs from level 3k to 3k + 3 along x, turning on a landing at each end */
    const zf = (y) => -leg(y) /* the face */,
      SW = 0.7;
    for (let k = 0; k < 4; k++) {
      const y0 = k * 3,
        y1 = y0 + 3,
        s = k % 2 ? -1 : 1,
        xa = s * 1.5,
        xb = -s * 1.5,
        z0 = zf(y0) - 0.12,
        z1 = zf(y1) - 0.12 /* the inner stringer, just outside the face */;
      for (const dz of [0, -SW]) P.push(GX.beam([xa, y0 + 0.05, z0 + dz], [xb, y1 + 0.05, z1 + dz], 0.18, 0.05, S)); /* the two stringers */
      for (let t = 1; t < 12; t++) {
        const u = t / 12,
          x = xa + (xb - xa) * u,
          y = y0 + 3 * u,
          z = z0 + (z1 - z0) * u;
        P.push(part(bx(0.24, 0.04, SW), TB, x, y + 0.06, z - SW / 2)); /* a tread, between the stringers */
      }
      /* the handrail on the open side, on two posts from the outer stringer */
      const ho = 0.95;
      for (const u of [0.04, 0.96]) {
        const x = xa + (xb - xa) * u,
          y = y0 + 3 * u + 0.08,
          z = z0 - SW + (z1 - z0) * u;
        rod([x, y, z], [x, y + ho, z], 0.025);
      }
      rod([xa + (xb - xa) * 0.04, y0 + 0.12 + ho + 0.12, z0 - SW], [xa + (xb - xa) * 0.96, y0 + 2.88 + ho + 0.08, z1 - SW], 0.025);
      /* the landing it arrives on: from the flight's end out to the turn, spanning from the face to the outer stringer */
      const xl = xb - s * 0.9,
        zi = zf(y1),
        zo = zf(y1) - 0.12 - SW - 0.05;
      P.push(part(bx(1.0, 0.08, zi - zo), TB, (xb + xl) / 2 - s * 0.05, y1 + 0.02, (zi + zo) / 2));
      rod([xb - s * 0.05, y1 - 0.02, zo], [xl - s * 0.05, y1 - 0.02, zo], 0.04); /* its outer edge member */
      rod([xl - s * 0.05, y1 - 0.02, zo], [xl - s * 0.05, y1 - 0.02, zi], 0.04);
      rod([xl - s * 0.05, y1, zo], [xl - s * 0.05, y1 + 1.0, zo], 0.025); /* the corner post */
    }
    /* the cab on its catwalk deck, which spans the leg tops and reaches out over the top landing */
    P.push(part(bx(5.4, 0.25, 5.4), TB, 0, H + 0.1, 0) /* catwalk deck */);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod([sx * 2.67, H + 0.22, sz * 2.67], [sx * 2.67, H + 1.13, sz * 2.67], 0.035); /* rail posts */
    rod([-2.67, H + 1.1, 2.67], [2.67, H + 1.1, 2.67], 0.03);
    rod([2.67, H + 1.1, -2.67], [2.67, H + 1.1, 2.67], 0.03);
    rod([-2.67, H + 1.1, -2.67], [-2.67, H + 1.1, 2.67], 0.03);
    rod([-2.67, H + 1.1, -2.67], [1.3, H + 1.1, -2.67], 0.03); /* the -z rail stops short of the gap where the stair comes up */
    rod([1.3, H + 0.22, -2.67], [1.3, H + 1.13, -2.67], 0.035);
    P.push(part(bx(3.8, 0.9, 3.8), 0x6a6e56, 0, H + 0.67, 0) /* the cab's low wall, on the deck */);
    for (const [rx, z] of [[0.12, 1.95], [-0.12, -1.95]]) P.push(part(bx(3.9, 1.9, 0.06), 0x4f7a6a, 0, H + 2.05, z, rx, 0, 0));
    for (const [rz, x] of [[-0.12, 1.95], [0.12, -1.95]]) P.push(part(bx(0.06, 1.9, 3.9), 0x4f7a6a, x, H + 2.05, 0, 0, 0, rz));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod([sx * 1.9, H + 1.1, sz * 1.9], [sx * 2.1, H + 3.0, sz * 2.1], 0.04); /* the window posts */
    P.push(part(bx(4.9, 0.3, 4.9), 0x3e4234, 0, H + 3.12, 0), part(cyl(0.06, 0.06, 4, 6), 0x2b2b28, 1.8, H + 5.25, 1.8));
    P.push(part(bx(0.5, 0.3, 0.3), 0x2b2b28, -1.4, H + 3.42, -1.4) /* Aldis lamp box */);
    return P;
  }, { L: 6.8, W: 6.8, H: 17, name: 'steel-angle control tower' });
  /* Marston mat (M8 pierced steel plank) as a shared canvas texture: planks 3.05 x 0.381 m in brick bond, three rows of holes each.
     One texture tile = 6.10 m x 3.05 m (two plank lengths by eight plank widths). */
  let PSP = null;
  GX.psp = () => {
    if (PSP) return PSP;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#6c6a5e';
    g.fillRect(0, 0, 512, 256);
    const pw = 256 / 8,
      pl = 256;
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? pl / 2 : 0;
      for (let k = -1; k < 3; k++) {
        const x = off + k * pl;
        g.fillStyle = r % 3 ? '#77756a' : '#706e62';
        g.fillRect(x + 1, r * pw + 1, pl - 2, pw - 2);
        g.fillStyle = 'rgba(40,40,36,.85)';
        for (let i = 0; i < 29; i++) for (let j = 0; j < 3; j++) g.fillRect(x + 5 + i * 8.6, r * pw + 6 + j * 9, 4, 4);
        g.fillStyle = 'rgba(130,85,55,.08)'; /* a little rust */
        g.fillRect(x + Math.random() * pl, r * pw, 20 + Math.random() * 30, pw);
      }
    }
    PSP = new THREE.CanvasTexture(c);
    PSP.wrapS = PSP.wrapT = THREE.RepeatWrapping;
    PSP.anisotropy = 4;
    return PSP;
  };
})();
