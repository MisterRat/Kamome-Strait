/* ---------- the Type T-14 motor torpedo boat (No. 538 class Gyoraitei), 1944-45: the Japanese side's PT boat ----------
   From the user's spec (PLAN section 9) and Navypedia: 15.0 m x 3.60 m, 0.72 m draught, 14.5 t, one 920 hp Type 71 petrol engine on
   one shaft, 33-35 kn, crew 7. Wooden hard-chine planing hull with V frames; a low pilothouse forward of amidships with a raked
   windscreen, the open cockpit behind it under a canvas hood, a short signal mast on the pilothouse roof; two 45 cm torpedoes on
   side-drop cradles along the deck edges abaft the cockpit; one Type 96 25 mm single on the after deck; four depth charges on stern
   rails; the ensign on a staff at the transom. Paint: dark grey (v 0) or mottled green (v 1), red anti-fouling below the chine.
   Model frame as every boat: bow +x, starboard +z, waterline y = 0, origin amidships (transom at x = -7.5).
   MODELS.get('jp-t14', v, crew, live) -> parts (live: without the torpedoes and the 25 mm's moving parts, which T14.torp(z) and
   T14.gunParts() give separately); T14.deckY(x) is the deck height at x (for anything placed on her later). */
const T14 = (() => {
  const L = 15.0,
    X0 = -L / 2,
    sst = (a) => (a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a)),
    T = (x) => (x - X0) / L,
    /* the lines against t (0 transom .. 1 stem): deck at the side, half-breadth at the deck, the chine, the keel */
    yd = (t) => 0.92 + 0.5 * Math.pow(t, 1.8),
    hb = (t) => (t < 0.45 ? 1.62 + 0.18 * sst(t / 0.45) : Math.max(0.03, 1.8 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.45) / 0.55, 2.2))))),
    bc = (t) => hb(t) * 0.9 * (1 - sst((t - 0.55) / 0.43)),
    yc = (t) => -0.1 + 1.05 * Math.pow(sst((t - 0.35) / 0.63), 1.3),
    yk = (t) => (t < 0.4 ? -0.58 - 0.14 * sst(t / 0.4) : -0.72 + 1.67 * Math.pow(sst((t - 0.4) / 0.6), 1.6)),
    deckY = (x) => yd(T(x)),
    halfB = (x) => hb(T(x));
  const GREY = 0x4e5457,
    GREEN = 0x4f5a43,
    DECK = 0x5c5e57,
    RED = 0x6e2f27,
    DK = 0x262829,
    CANVAS = 0x8b8565,
    GLASS = 0x1c2428,
    TORP = 0x55595c,
    GUN = 0x34383a;
  /* move a list of parts (built at the origin, facing +x) to (x, y, z) turned by yaw */
  const put = (P, x, y, z, yaw) => {
    const M = new THREE.Matrix4().makeRotationY(yaw || 0).setPosition(x, y, z);
    P.forEach((q) => (q.m = M.clone().multiply(q.m || new THREE.Matrix4())));
    return P;
  };
  /* one 45 cm Type 91 torpedo (5.27 m x 0.45 m) as it lies in its cradle on side z, noses forward (model frame) */
  const TZ = 1.22,
    TR = 0.225,
    TXN = 0.1,
    TY = () => yd(T(-2.5)) + 0.42;
  const torp = (z) => {
    const { part, bx, cyl, sph } = GX,
      Z = Math.PI / 2,
      tr = TR,
      xN = TXN,
      ty = TY();
    return [
      part(sph(8), 0x5e5a4a, xN - 0.32, ty, z, 0, 0, 0, 0.32, tr, tr) /* the warhead's nose */,
      part(cyl(tr, tr, 3.9, 10), TORP, xN - 2.27, ty, z, 0, 0, Z) /* the body */,
      part(cyl(tr + 0.004, tr + 0.004, 0.03, 10), DK, xN - 1.1, ty, z, 0, 0, Z) /* the warhead joint */,
      part(cyl(tr, 0.08, 0.8, 10), TORP, xN - 4.62, ty, z, 0, 0, -Z) /* the afterbody, tapering aft */,
      part(bx(0.36, 0.5, 0.012), TORP, xN - 5.0, ty, z),
      part(bx(0.36, 0.012, 0.5), TORP, xN - 5.0, ty, z) /* the tail fins */,
      part(cyl(0.03, 0.03, 0.2, 6), DK, xN - 5.12, ty, z, 0, 0, Z),
      part(bx(0.03, 0.26, 0.05), 0x8a7a50, xN - 5.22, ty, z, 0.6, 0, 0) /* shaft and screw */,
    ];
  };
  /* the Type 96 25 mm single's moving parts for a live boat, in the frame the ground fire (AA.gun) turns: +z along the barrel at
     train 0 and elevation 0. tur turns on the pedestal (its origin on the pedestal top, model (GX0, gTop())); bar elevates about the
     trunnions, GBAR above that */
  const GX0 = -5.55,
    gTop = () => yd(T(GX0)) + 0.72,
    GBAR = 0.38;
  const gunParts = () => {
    const { part, bx, cyl } = GX,
      Z = Math.PI / 2,
      tor = () => new THREE.TorusGeometry(0.1, 0.02, 4, 8);
    const tur = [part(bx(0.4, 0.3, 0.45), GUN, 0, 0.15, 0) /* the carriage */];
    for (const k of [-1, 1]) tur.push(part(bx(0.06, 0.22, 0.12), GUN, k * 0.1, GBAR, 0)); /* trunnion arms */
    tur.push(part(tor(), DK, 0.22, 0.15, 0, 0, Z, 0), part(tor(), DK, -0.22, 0.15, 0, 0, Z, 0)); /* training and elevating hand-wheels */
    const bar = [
      part(bx(0.16, 0.2, 0.9), GUN, 0, 0.04, 0) /* the receiver */,
      part(cyl(0.035, 0.04, 1.5, 8), GUN, 0, 0.04, 1.18, Z, 0, 0) /* the barrel */,
      part(cyl(0.055, 0.055, 0.18, 8), DK, 0, 0.04, 1.95, Z, 0, 0) /* flash hider */,
      part(bx(0.12, 0.25, 0.3), 0x4d4a3e, 0, 0.24, 0) /* the 15-round magazine on top */,
      part(bx(0.5, 0.06, 0.06), GUN, -0.25, -0.01, 0.3),
      part(bx(0.08, 0.12, 0.3), DK, -0.47, 0, 0.35) /* the shoulder rest */,
    ];
    return { tur, bar };
  };
  function build(v, crew, live) {
    const { part, bx, cyl, sph } = GX,
      Z = Math.PI / 2,
      SIDE = v === 1 ? GREEN : GREY,
      P = GX.loft({
        L, X0, N: 26,
        sect: (t) => [[yk(t), 0], [yc(t), bc(t)], [yd(t), hb(t)]],
        paint: (y, k) => (k === 0 ? RED : SIDE),
        deck: DECK,
        transom: SIDE,
      });
    /* rubbing strake along the sheer, half let into the topsides */
    for (let i = 0; i < 9; i++) {
      const a = 0.02 + (0.94 * i) / 9,
        b = 0.02 + (0.94 * (i + 1)) / 9;
      for (const s of [-1, 1]) P.push(GX.beam([X0 + L * a, yd(a) - 0.07, s * hb(a)], [X0 + L * b, yd(b) - 0.07, s * hb(b)], 0.07, 0.08, DK));
    }
    /* the foredeck: twin bitts, a fairlead pair at the stem, the forepeak hatch */
    for (const s of [-1, 1]) P.push(part(cyl(0.07, 0.08, 0.32, 8), DK, 6.0, deckY(6.0) + 0.12, s * 0.16));
    P.push(part(bx(0.7, 0.16, 0.65), DECK, 3.8, deckY(3.8) + 0.05, 0), part(bx(0.6, 0.04, 0.55), DK, 3.8, deckY(3.8) + 0.14, 0));
    /* the pilothouse: a low wooden house with a raked windscreen, x 0.5 .. 2.6 */
    const p0 = 0.5,
      p1 = 2.6,
      yb = deckY(p0) - 0.06,
      ya = deckY(p1) + 0.45 /* the foot of the raked front */,
      yt = deckY(p1) + 0.85 /* the roof */,
      rk = 0.35,
      pw = 1.7;
    P.push(GX.ext([[p0, yb], [p1, yb], [p1, ya], [p1 - rk, yt], [p0, yt]], pw, SIDE));
    P.push(part(bx(p1 - rk - p0 + 0.05, 0.05, pw + 0.08), DECK, (p0 + p1 - rk) / 2, yt + 0.02, 0)); /* the roof planking, lapped over the sides */
    {
      /* three windscreen panes on the raked front, 1 cm proud of it */
      const n = new THREE.Vector2(yt - ya, rk).normalize(),
        cx = p1 - rk / 2 + n.x * 0.011,
        cy = (ya + yt) / 2 + n.y * 0.011,
        ang = Math.atan2(n.y, n.x);
      for (const z of [-0.52, 0, 0.52]) P.push(part(bx(0.02, 0.36, 0.44), GLASS, cx, cy, z, 0, 0, ang));
      for (const s of [-1, 1]) for (const x of [1.0, 1.75]) P.push(part(bx(0.5, 0.26, 0.02), GLASS, x, yt - 0.27, s * (pw / 2 + 0.011))); /* side windows */
    }
    /* the signal mast on the pilothouse roof, with its yard, a masthead lamp and the halyards down to the roof edge */
    const mx = 1.05,
      mt = yt + 2.6;
    P.push(GX.rod([mx, yt, 0], [mx, mt, 0], 0.055, DK, 0.035, 8), part(sph(6), 0xd8d2b8, mx, mt + 0.02, 0, 0, 0, 0, 0.07, 0.07, 0.07));
    P.push(GX.rod([mx, mt - 0.6, -0.75], [mx, mt - 0.6, 0.75], 0.025, DK, 0.025, 6));
    for (const s of [-1, 1]) P.push(GX.rod([mx, mt - 0.6, s * 0.72], [mx - 0.25, yt + 0.03, s * 0.8], 0.006, DK, 0.006, 4));
    /* the open cockpit abaft the pilothouse: coaming walls on the deck, the canvas hood over its forward half, the wheel */
    const c0 = -0.7,
      cy0 = deckY(c0),
      ch = 0.42;
    for (const s of [-1, 1]) P.push(part(bx(p0 - c0 + 0.04, ch + 0.08, 0.06), SIDE, (p0 + c0) / 2, cy0 + ch / 2 - 0.02, s * 0.82));
    P.push(part(bx(0.06, ch + 0.06, 1.7), SIDE, c0, cy0 + ch / 2 - 0.03, 0));
    {
      const sh = new THREE.Shape(),
        r = 0.85,
        hh = 0.5;
      for (let i = 0; i <= 10; i++) {
        const a = (Math.PI * i) / 10;
        i ? sh.lineTo(r * Math.cos(a), hh * Math.sin(a)) : sh.moveTo(r * Math.cos(a), hh * Math.sin(a));
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: false, curveSegments: 4 });
      g.rotateY(Z);
      P.push(part(g, CANVAS, p0 - 0.53, cy0 + ch + 0.02, 0)); /* the hood: from the pilothouse's after face back over the coaming tops */
    }
    const wx = 0.0,
      wy = deckY(wx) + 0.95;
    P.push(GX.rod([wx + 0.12, deckY(wx) - 0.02, 0], [wx + 0.04, wy, 0], 0.05, DK, 0.04, 6) /* the wheel's pedestal */, part(new THREE.TorusGeometry(0.22, 0.022, 4, 10), 0x5a4632, wx, wy, 0, 0, Z, 0) /* the wheel */);
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) P.push(part(bx(0.02, 0.44, 0.02), 0x5a4632, wx, wy, 0, a, 0, 0)); /* its spokes */
    /* the engine-room hatch amidships, with two mushroom vents */
    const h0 = -2.65,
      h1 = -0.95;
    P.push(part(bx(h1 - h0, 0.36, 1.1), SIDE, (h0 + h1) / 2, deckY((h0 + h1) / 2) + 0.12, 0), part(bx(h1 - h0 + 0.06, 0.04, 1.16), DECK, (h0 + h1) / 2, deckY((h0 + h1) / 2) + 0.31, 0));
    for (const x of [-2.25, -1.35]) P.push(part(cyl(0.07, 0.07, 0.3, 8), DK, x, deckY(x) + 0.43, 0.32), part(cyl(0.16, 0.16, 0.06, 10), DK, x, deckY(x) + 0.6, 0.32));
    /* two 45 cm Type 91 torpedoes (5.27 m x 0.45 m) on side-drop cradles at the deck edges, noses forward */
    const tz = 1.22,
      tr = 0.225,
      xN = 0.1,
      ty = deckY(-2.5) + 0.42;
    for (const s of [-1, 1]) {
      const z = s * tz;
      if (!live) P.push(...torp(z)); /* a live boat carries hers as separate meshes, which drop when she fires */
      for (const xc of [-3.9, -1.05]) {
        const d = deckY(xc);
        P.push(part(bx(0.14, 0.08, 0.72), DK, xc, d + 0.02, z) /* the cradle's base on the deck */);
        P.push(part(bx(0.12, ty - tr - d + 0.02, 0.3), DK, xc, (ty - tr + d + 0.04) / 2, z)); /* the saddle, up under the body */
        for (const k of [-1, 1]) P.push(part(bx(0.06, ty + 0.27 - d, 0.06), DK, xc, (ty + 0.27 + d) / 2, z + k * 0.27)); /* the two stanchions */
        P.push(part(bx(0.08, 0.04, 0.6), DK, xc, ty + tr + 0.02, z)); /* the strap over the top */
        P.push(GX.rod([xc, d + 0.04, z - s * 0.27], [xc, ty + 0.25, z + s * 0.27], 0.02, DK, 0.02, 4)); /* the tipping arm (she drops over the side) */
      }
    }
    /* the Type 96 25 mm single on the after deck, stowed trained forward along the centreline, a little elevated (aft, its barrel
       would cross the ensign staff): the pedestal, and unless live the same turret and barrel parts (T14.gunParts) the patrol model
       turns, so the two never differ */
    {
      const top = gTop();
      P.push(part(cyl(0.16, 0.24, 0.75, 8), GUN, GX0, top - 0.72 + 0.345, 0)); /* the pedestal, bolted through the deck */
      if (!live) {
        const GP = gunParts(),
          Mt = new THREE.Matrix4().makeTranslation(GX0, top, 0).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)) /* +z (the barrel) to +x (forward) */,
          Mb = Mt.clone().multiply(new THREE.Matrix4().makeTranslation(0, GBAR, 0)).multiply(new THREE.Matrix4().makeRotationX(-0.18));
        for (const q of GP.tur) P.push({ ...q, m: Mt.clone().multiply(q.m || new THREE.Matrix4()) });
        for (const q of GP.bar) P.push({ ...q, m: Mb.clone().multiply(q.m || new THREE.Matrix4()) });
      }
    }
    /* four Type 95 depth charges on stern rails, two a side, rolling aft over the transom */
    for (const s of [-1, 1]) {
      const zc = s * 1.05,
        d = deckY(-6.7);
      for (const k of [-1, 1]) P.push(part(bx(1.5, 0.06, 0.06), DK, -6.7, d + 0.02, zc + k * 0.2));
      P.push(part(bx(0.06, 0.32, 0.5), DK, -6.0, d + 0.15, zc)); /* the forward stop */
      for (const x of [-6.35, -6.95]) P.push(part(cyl(0.22, 0.22, 0.62, 10), 0x3b3d3c, x, d + 0.27, zc, Z, 0, 0));
    }
    /* the ensign staff at the transom */
    {
      const x = X0 + 0.15,
        d = deckY(x),
        top = d + 1.5;
      P.push(GX.rod([x, d - 0.02, 0], [x, top, 0], 0.03, DK, 0.025, 6), ...FLG.at('jn', 0.8, x - 0.02, top - 0.05, 0, Math.PI));
    }
    /* her crew: the helmsman at the wheel and the 25 mm gunner (navy working blues) */
    if (crew !== false) {
      P.push(...put(MODELS.get('crew', 'jn', 'stand', 1), -0.38, deckY(-0.38), 0.15, 0));
      P.push(...put(MODELS.get('crew', 'jn', 'stand', 0), -6.3, deckY(-6.3), 0, 0)); /* the gunner behind the breech, between the depth-charge rails */
    }
    if (v === 1) GX.camo(P, [GREEN], [GREEN, 0x3b4433, 0x6a6a4e], 1.6, 3.1);
    return P;
  }
  MODELS.add('jp-t14', build, { L, W: 3.6, D: 0.72, name: 'Type T-14 motor torpedo boat (Gyoraitei)' });
  return { L, W: 3.6, D: 0.72, deckY, halfB, torp, TZ, gunParts, GX0, gTop, GBAR };
})();
