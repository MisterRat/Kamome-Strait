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
  /* steel-angle control tower: four storeys of bolted angle legs with cross bracing, timber floors, an outside stair, the glazed cab
     (green-tinted, leaning out) with a catwalk round it, a mast on the roof; cab floor at 12 m, roof at 15 m */
  MODELS.add('us-control-tower', () => {
    const P = [],
      S = 0x5d6248,
      w0 = 3.4,
      w1 = 2.6,
      H = 12,
      leg = (y) => w0 + ((w1 - w0) * y) / H;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const a = leg(0),
          b = leg(H),
          l = Math.hypot(H, a - b);
        P.push(part(bx(0.2, l, 0.2), S, (sx * (a + b)) / 2, H / 2, (sz * (a + b)) / 2, (sz * (a - b)) / H, 0, (-sx * (a - b)) / H));
      }
    for (let k = 0; k < 4; k++) {
      const y0 = k * 3,
        y1 = y0 + 3,
        a = leg(y0),
        b = leg(y1);
      P.push(part(bx(2 * b + 0.3, 0.12, 2 * b + 0.3), 0x7a6648, 0, y1, 0)); /* floor */
      for (const s of [-1, 1]) {
        const d = Math.hypot(2 * (a + b) / 2, 3);
        P.push(part(bx(0.08, d, 0.08), S, 0, y0 + 1.5, s * (a + b) / 2, 0, 0, Math.atan2(2 * (a + b) / 2, 3)), part(bx(0.08, d, 0.08), S, s * (a + b) / 2, y0 + 1.5, 0, Math.atan2(2 * (a + b) / 2, 3), 0, 0));
      }
      /* the stair, flight by flight, inside the frame on the -z side: each flight from one floor up to the next (through its hatch) */
      const sx = k % 2 ? 1 : -1;
      P.push(GX.beam([sx * (a - 0.5), y0 + 0.06, -(a - 0.6)], [-sx * (b - 0.5), y1, -(b - 0.6)], 0.7, 0.1, 0x7a6648));
    }
    /* the cab: floor 12 m, 3 m high, glass leaning out, roof with overhang, catwalk with rail */
    P.push(part(bx(5.4, 0.25, 5.4), 0x7a6648, 0, H + 0.1, 0) /* catwalk deck */);
    for (const s of [-1, 1]) P.push(part(bx(5.4, 0.06, 0.06), S, 0, H + 1.1, s * 2.67), part(bx(0.06, 0.06, 5.4), S, s * 2.67, H + 1.1, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(GX.rod([sx * 2.67, H + 0.2, sz * 2.67], [sx * 2.67, H + 1.13, sz * 2.67], 0.035, S)); /* rail posts on the catwalk deck */
    P.push(part(bx(3.8, 0.9, 3.8), 0x6a6e56, 0, H + 0.6, 0));
    for (const [rx, ry, z, x] of [[0.12, 0, 1.95, 0], [-0.12, 0, -1.95, 0]]) P.push(part(bx(3.9, 1.9, 0.06), 0x4f7a6a, x, H + 2.0, z, rx, ry, 0));
    for (const [rz, x] of [[-0.12, 1.95], [0.12, -1.95]]) P.push(part(bx(0.06, 1.9, 3.9), 0x4f7a6a, x, H + 2.0, 0, 0, 0, rz));
    P.push(part(bx(4.9, 0.3, 4.9), 0x3e4234, 0, H + 3.1, 0), part(cyl(0.06, 0.06, 4, 6), 0x2b2b28, 1.8, H + 5.2, 1.8));
    P.push(part(bx(0.5, 0.3, 0.3), 0x2b2b28, -1.4, H + 3.4, -1.4) /* Aldis lamp box */);
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
