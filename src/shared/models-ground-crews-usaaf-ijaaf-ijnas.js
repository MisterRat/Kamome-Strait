/* ---------- airfield ground crews, 1945 (docs/research_1945_bases.md) ----------
   A figure about 1.75 m tall, facing +x, feet on y = 0; ~250 triangles. Uniforms:
   'us'  USAAF: herringbone-twill fatigues in olive drab #7 (or light sage), A-3 mechanic's cap with the visor flipped up, tan roughout boots;
   'ja'  Japanese army (IJAAF): khaki-tan coveralls, khaki-brown field cap with neck flaps, puttees and dark split-toe tabi;
   'jn'  Japanese navy (IJNAS): blue-grey work trousers, white sleeveless singlet, white headband (the tropical working rig).
   Poses: 'stand', 'walk' (stride), 'work' (arms up, as at an engine), 'kneel'. MODELS.get('crew', side, pose, variant). */
(() => {
  const { part, bx, cyl } = GX,
    sph = (n) => GX.sph(n || 8);
  const U = {
    us: [{ top: 0x50553a, legs: 0x50553a, cap: 0x4a4f35, boots: 0x7d6347 }, { top: 0x7d8466, legs: 0x7d8466, cap: 0x6f7759, boots: 0x7d6347 }, { top: 0x5a5b3e, legs: 0x50553a, cap: 0x4a4f35, boots: 0x3a2f25 }],
    ja: [{ top: 0x9c8b5e, legs: 0x9c8b5e, cap: 0x7a6845, boots: 0x2b2622, putt: 0x6e6448 }, { top: 0x8f8a62, legs: 0x8f8a62, cap: 0x7a6845, boots: 0x2b2622, putt: 0x6e6448 }],
    jn: [{ top: 0xe6e4dc, legs: 0x5d6d7e, cap: null, boots: 0x2b2622, band: 0xf2f0ea }, { top: 0x5d6d7e, legs: 0x5d6d7e, cap: 0x4c5a69, boots: 0x2b2622 }],
  };
  const SKIN = { us: 0xc89a7a, ja: 0xc79a6c, jn: 0xc79a6c };
  /* a limb: a tapered cylinder from (x0, y0, z) to (x1, y1, z), in the figure's x-y plane */
  const limb = (x0, y0, x1, y1, z, r0, r1, c) => {
    const l = Math.hypot(x1 - x0, y1 - y0),
      a = Math.atan2(x1 - x0, y1 - y0);
    return part(cyl(r1, r0, l, 6), c, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, -a);
  };
  MODELS.add('crew', (side, pose, v) => {
    const S = side || 'us',
      c = U[S][(v || 0) % U[S].length],
      sk = SKIN[S],
      P = [],
      p = pose || 'stand',
      kn = p === 'kneel',
      hip = kn ? 0.5 : S === 'us' ? 0.82 : 0.78;
    /* legs: stride for 'walk', one knee down for 'kneel' */
    for (const s of [-1, 1]) {
      const z = s * 0.1,
        fx = p === 'walk' ? s * 0.22 : 0;
      if (kn) {
        if (s < 0) P.push(limb(0, hip, 0.4, 0.45, z, 0.085, 0.07, c.legs), limb(0.4, 0.45, 0.38, 0.06, z, 0.07, 0.055, c.putt || c.legs));
        else P.push(limb(0, hip, -0.05, 0.12, z, 0.085, 0.07, c.legs), limb(-0.05, 0.12, -0.45, 0.06, z, 0.07, 0.055, c.putt || c.legs));
      } else {
        P.push(limb(0, hip, fx * 0.55, hip * 0.5, z, 0.085, 0.07, c.legs), limb(fx * 0.55, hip * 0.5, fx, 0.07, z, 0.07, 0.055, c.putt || c.legs));
      }
      const bx0 = kn ? (s < 0 ? 0.42 : -0.5) : fx;
      P.push(part(bx(0.26, 0.1, 0.11), c.boots, bx0 + 0.06, 0.05, z));
    }
    /* torso, belt, shoulders */
    const ty = hip + 0.3;
    P.push(part(bx(0.22, 0.58, 0.36), c.top, 0, ty, 0), part(bx(0.23, 0.06, 0.37), S === 'jn' ? 0x5d6d7e : 0x3a3428, 0, hip + 0.03, 0));
    if (S === 'jn' && c.band) P.push(part(bx(0.16, 0.3, 0.26), c.top, 0, ty + 0.12, 0)); /* the singlet: bare shoulders and arms */
    const arm = S === 'jn' && c.band ? sk : c.top;
    /* arms */
    for (const s of [-1, 1]) {
      const z = s * 0.22,
        sh = hip + 0.55;
      if (p === 'work') P.push(limb(0, sh, 0.25, sh + 0.25, z, 0.055, 0.045, arm), limb(0.25, sh + 0.25, 0.35, sh + 0.55, z, 0.045, 0.04, sk));
      else if (p === 'walk') P.push(limb(0, sh, -s * 0.15, sh - 0.3, z, 0.055, 0.045, arm), limb(-s * 0.15, sh - 0.3, -s * 0.1, sh - 0.58, z, 0.045, 0.04, arm === sk ? sk : arm));
      else P.push(limb(0, sh, 0.03, sh - 0.3, z, 0.055, 0.045, arm), limb(0.03, sh - 0.3, 0.1, sh - 0.56, z, 0.045, 0.04, arm === sk ? sk : arm));
      P.push(part(sph(6), sk, p === 'work' ? 0.36 : p === 'walk' ? -s * 0.1 : 0.1, p === 'work' ? sh + 0.58 : sh - 0.6, z, 0, 0, 0, 0.05, 0.05, 0.05));
    }
    /* neck and head */
    const hy = hip + 0.78;
    P.push(part(cyl(0.05, 0.05, 0.1, 6), sk, 0, hip + 0.64, 0), part(sph(8), sk, 0.01, hy, 0, 0, 0, 0, 0.1, 0.12, 0.1));
    if (S === 'us') {
      /* A-3 mechanic's cap: soft crown, the visor flipped up */
      P.push(part(sph(8), c.cap, 0, hy + 0.06, 0, 0, 0, 0, 0.11, 0.07, 0.11), part(bx(0.02, 0.07, 0.15), c.cap, 0.1, hy + 0.12, 0, 0, 0, 0.3));
    } else if (S === 'ja') {
      /* field cap with its short visor and the neck flaps */
      P.push(
        part(cyl(0.1, 0.11, 0.09, 8), c.cap, 0, hy + 0.08, 0),
        part(bx(0.07, 0.015, 0.14), c.cap, 0.11, hy + 0.04, 0),
        part(bx(0.02, 0.14, 0.2), 0xb0a27a, -0.1, hy - 0.02, 0),
        part(bx(0.012, 0.018, 0.018), 0xd9b92a, 0.105, hy + 0.09, 0) /* the yellow star */,
      );
    } else if (c.band) P.push(part(cyl(0.104, 0.104, 0.035, 8), c.band, 0, hy + 0.04, 0)) /* white headband */;
    else P.push(part(cyl(0.1, 0.11, 0.08, 8), c.cap, 0, hy + 0.08, 0), part(bx(0.07, 0.015, 0.14), c.cap, 0.11, hy + 0.05, 0));
    return P;
  }, { name: 'ground crew figure' });
})();
