/* ---------- the US Army's camp and range pieces (PLAN_M4A3_Sherman_Tank 4.5): Camp Buckner, Beach Orange, Buckner Range, the front ----------
   Each in metres, on its own ground at y = 0, its long side along x:
   us-tent        the M1934 pyramidal tent, 16 ft square (4.88 m), 11 ft high at the pole (3.35 m), 3 ft walls (0.91 m), olive drab
                  canvas, the door flap rolled up, guy lines to stakes (FM 20-15 Tents and tent pitching, 1945)
   us-revetment   a tank revetment: a U of earth and coral bulldozed up 2.2 m high round a 9 x 5.5 m bay (an M4A3 is 5.9 x 2.6 m),
                  open at one end (+x), its banks sloped and topped with sandbags
   us-target      a range target board: a 3 x 2.4 m panel (a tank's front, painted) on two posts, with an aiming cross
   us-sandbags    a sandbagged position: a ring of bagged wall 0.9 m high and r across (a foxhole's parapet, a mortar pit's, a CP's),
                  two courses of bags; open at one side (+x) for the way in
   us-range-flag  the red range flag on a 6 m pole (flown while the range is firing)
   us-dump        a field dump: stacks of crates (75 mm rounds), jerrycans and drums on dunnage under a tarpaulin edge */
(() => {
  const { part, bx, cyl } = GX,
    OD = 0x5b5a3e /* olive drab canvas */,
    OD2 = 0x4e4d35,
    EARTH = 0x8a7a5a,
    EARTH2 = 0x7a6a4c,
    BAG = 0x9a8a62,
    BAG2 = 0x8a7b56,
    WOODP = 0x7a6448;
  MODELS.add(
    'us-tent',
    () => {
      const P = [],
        a = 4.88 / 2,
        wh = 0.91,
        hp = 3.35;
      /* the four walls and the four roof faces (each face a box leaned in to meet at the pole's top) */
      for (const [dx, dz, ry] of [
        [a, 0, 0],
        [-a, 0, Math.PI],
        [0, a, -Math.PI / 2],
        [0, -a, Math.PI / 2],
      ]) {
        P.push(part(bx(0.05, wh, 4.88), OD, dx, wh / 2, dz, 0, ry, 0));
      }
      /* the roof: a square pyramid from the walls' tops to the pole (a four-sided cone turned to sit square on the walls) */
      P.push(part(cyl(0.08, a * Math.SQRT2, hp - wh, 4), OD2, 0, wh + (hp - wh) / 2, 0, 0, Math.PI / 4, 0));
      /* the pole's top cap, the door (a dark opening, the flap rolled above it) */
      P.push(part(cyl(0.25, 0.4, 0.35, 8), OD2, 0, hp - 0.1, 0));
      P.push(part(bx(0.06, 0.85, 1.1), 0x1e2018, a + 0.03, 0.42, 0), part(cyl(0.12, 0.12, 1.2, 6), OD2, a + 0.12, 0.95, 0, Math.PI / 2, 0, 0));
      /* guy stakes and lines at the corners */
      for (const [sx, sz] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const s0 = [sx * (a + 1.5), 0.05, sz * (a + 1.5)],
          top = [sx * a, wh + 0.05, sz * a];
        P.push(GX.rod(s0, top, 0.012, 0xc8bf9c, 0.012, 3), part(bx(0.06, 0.3, 0.06), WOODP, s0[0], 0.1, s0[2]));
      }
      return P;
    },
    { name: 'US Army M1934 pyramidal tent', L: 4.88, W: 4.88, H: 3.35 },
  );
  MODELS.add(
    'us-revetment',
    () => {
      const P = [],
        L0 = 9,
        W0 = 5.5,
        h = 2.2,
        t = 1.4 /* the bank's top width */;
      /* the back bank (-x) and the two side banks: a sloped trapezoid each (a box with its outer face leaned), topped with bags */
      const bank = (cx, cz, len, ry) => {
        /* stepped like a bulldozed berm: a wide foot, a narrower body, the top */
        P.push(part(bx(len, h * 0.5, t + 2.4), EARTH, cx, h * 0.25, cz, 0, ry, 0));
        P.push(part(bx(len, h * 0.5, t + 1.0), EARTH2, cx, h * 0.75, cz, 0, ry, 0));
        P.push(part(bx(len, 0.3, t), EARTH2, cx, h + 0.15, cz, 0, ry, 0));
        for (let k = 0; k < Math.floor(len / 0.9); k++) {
          const f = -len / 2 + 0.45 + k * 0.9,
            x = cx + (ry ? 0 : f),
            z = cz + (ry ? f : 0);
          P.push(part(bx(0.85, 0.28, 0.5), k % 2 ? BAG : BAG2, x, h + 0.44, z, 0, ry, 0));
        }
      };
      bank(-L0 / 2 - 1.8, 0, W0 + 7.2, Math.PI / 2);
      for (const s of [-1, 1]) bank(-0.4, s * (W0 / 2 + 1.8), L0 + 1.0, 0);
      return P;
    },
    { name: 'Tank revetment (earth and coral, sandbag-topped)', L: 12.6, W: 12.7, H: 2.9 },
  );
  MODELS.add(
    'us-target',
    () => {
      const P = [];
      for (const z of [-1.3, 1.3]) P.push(part(bx(0.15, 3.2, 0.15), WOODP, -0.1, 1.6, z));
      P.push(part(bx(0.06, 2.4, 3.0), 0xb8b0a0, 0, 1.6 + 0.4, 0), part(bx(0.07, 2.0, 0.12), 0x1e1e1e, 0.01, 2.0, 0), part(bx(0.07, 0.12, 2.6), 0x1e1e1e, 0.01, 2.0, 0));
      P.push(part(bx(0.07, 0.8, 1.0), 0x8a2a22, 0.012, 2.0, 0)) /* the aiming mark */;
      P.push(part(bx(0.8, 0.12, 0.3), WOODP, -0.4, 0.06, 1.3), part(bx(0.8, 0.12, 0.3), WOODP, -0.4, 0.06, -1.3)) /* the feet */;
      return P;
    },
    { name: 'Range target board', L: 0.9, W: 3.0, H: 3.2 },
  );
  MODELS.add(
    'us-sandbags',
    (r = 2.2, open = 1.4) => {
      const P = [],
        n = Math.max(8, Math.round((2 * Math.PI * r) / 0.85));
      for (let L = 0; L < 2; L++)
        for (let k = 0; k < n; k++) {
          const a = ((k + L * 0.5) / n) * Math.PI * 2;
          if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < open / r / 2) continue; /* the way in (+x) */
          P.push(part(bx(0.85, 0.44, 0.5), (k + L) % 2 ? BAG : BAG2, Math.cos(a) * r, 0.22 + L * 0.44, Math.sin(a) * r, 0, -a + Math.PI / 2, 0));
        }
      P.push(part(cyl(r - 0.3, r - 0.3, 0.04, 14), 0x4a3e2c, 0, 0.02, 0)) /* the dug floor, dark */;
      return P;
    },
    { name: 'Sandbagged position' },
  );
  MODELS.add(
    'us-range-flag',
    () => [part(cyl(0.05, 0.07, 6, 6), 0x9a9a92, 0, 3, 0), part(bx(0.02, 0.9, 1.4), 0xc0281e, 0, 5.4, 0.72)],
    { name: 'Range flag', H: 6 },
  );
  MODELS.add(
    'us-dump',
    (w = 6, d = 4, seed = 1) => {
      const P = [];
      let s = seed * 9301;
      const rr = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      P.push(part(bx(w, 0.12, d), WOODP, 0, 0.06, 0)) /* the dunnage */;
      for (let i = 0; i < Math.floor((w * d) / 3); i++) {
        const x = (rr() - 0.5) * (w - 1),
          z = (rr() - 0.5) * (d - 1),
          k = rr();
        if (k < 0.5) {
          const hgt = 1 + Math.floor(rr() * 3);
          for (let j = 0; j < hgt; j++) P.push(part(bx(1.1, 0.42, 0.55), j % 2 ? 0x6e6a44 : 0x5e5a3a, x, 0.33 + j * 0.42, z)) /* 75 mm crates */;
        } else if (k < 0.8) for (let j = 0; j < 4; j++) P.push(part(bx(0.17, 0.47, 0.35), 0x5b5f3a, x + (j % 2) * 0.2, 0.36, z + (j >> 1) * 0.38)) /* jerrycans */;
        else P.push(part(cyl(0.29, 0.29, 0.88, 10), 0x4a5a3a, x, 0.56, z)) /* a drum */;
      }
      return P;
    },
    { name: 'Field dump (crates, jerrycans, drums)' },
  );
})();
