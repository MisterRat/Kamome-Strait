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
  /* the torso (with belt and the navy singlet) or the neck and head with the cap, for a figure whose hips are at hip */
  const upper = (P, S, c, sk, hip, which) => {
    if (which === 'torso') {
    /* torso, belt, shoulders */
    const ty = hip + 0.3;
    P.push(part(bx(0.22, 0.58, 0.36), c.top, 0, ty, 0), part(bx(0.23, 0.06, 0.37), S === 'jn' ? 0x5d6d7e : 0x3a3428, 0, hip + 0.03, 0));
    if (S === 'jn' && c.band) P.push(part(bx(0.16, 0.3, 0.26), c.top, 0, ty + 0.12, 0)); /* the singlet: bare shoulders and arms */
      return;
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
    upper(P, S, c, sk, hip, 'torso');
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
    upper(P, S, c, sk, hip, 'head');
    return P;
  }, { name: 'ground crew figure' });
  /* a seated driver: origin at his hips (on the seat), facing +x; thighs level, shins down to the pedals, his hands on the wheel at
     hand = [forward, up] from the hips. MODELS.get('driver', side, v, hand) */
  MODELS.add('driver', (side, v, hand) => {
    const S = side || 'us',
      c = U[S][(v || 0) % U[S].length],
      sk = SKIN[S],
      P = [],
      [hx, hy] = hand || [0.45, 0.1],
      arm = S === 'jn' && c.band ? sk : c.top,
      sh = 0.55;
    for (const s of [-1, 1]) {
      const z = s * 0.1;
      P.push(limb(0, 0, 0.44, 0.02, z, 0.085, 0.07, c.legs), limb(0.44, 0.02, 0.5, -0.4, z, 0.07, 0.055, c.putt || c.legs));
      P.push(part(bx(0.26, 0.1, 0.11), c.boots, 0.58, -0.43, z));
    }
    upper(P, S, c, sk, 0, 'torso');
    for (const s of [-1, 1]) {
      const z = s * 0.22,
        hz = s * 0.16,
        ex = hx * 0.45,
        ey = sh - 0.32;
      P.push(limb(0, sh, ex, ey, z, 0.055, 0.045, arm), limb(ex, ey, hx, hy, (z + hz) / 2, 0.045, 0.04, arm === sk ? sk : arm));
      P.push(part(sph(6), sk, hx, hy, hz, 0, 0, 0, 0.05, 0.05, 0.05));
    }
    upper(P, S, c, sk, 0, 'head');
    return P;
  }, { name: 'seated driver' });
  /* WHO DRIVES WHAT: each vehicle that moves gets a driver in its seat (hip: his hips on the seat; wheel: the steering wheel's centre;
     the vehicle's frame, nose +x, the right-hand side at -z). The American vehicles drive on the left of the cab (+z), the Japanese
     on the right (-z), an army man (MODELS.drivenAs(side, v, name, ...) for another, the navy's at its base). MODELS.driven(name, ...args) -> the model's parts with its driver; a parked vehicle has none. */
  const SEATS = {
    'us-willys-mb': ['us', [-0.4, 1.25, 0.35], [0.02, 1.31, 0.35]],
    'us-cckw-cargo': ['us', [0.7, 1.75, 0.45], [1.22, 1.86, 0.45]],
    'us-cckw-fuel': ['us', [0.7, 1.75, 0.45], [1.22, 1.86, 0.45]],
    'us-clarktor6': ['us', [-0.75, 1.08, 0], [-0.4, 1.32, 0]],
    'jp-kurogane': ['ja', [-0.3, 0.98, -0.3], [0.12, 1.12, -0.3]],
    'jp-type94-cargo': ['ja', [0.62, 1.06, -0.42], [1.05, 1.32, -0.42]],
    'jp-type94-supply': ['ja', [0.62, 1.06, -0.42], [1.05, 1.32, -0.42]],
    'jp-type94-fuel': ['ja', [0.62, 1.06, -0.42], [1.05, 1.32, -0.42]],
    'jp-ko-hi': ['ja', [0.35, 1.1, -0.42], [0.78, 1.34, -0.42]],
  };
  MODELS.drivenAs = (who, v, name, ...a) => {
    const P = MODELS.get(name, ...a),
      s = SEATS[name];
    if (!s) return P;
    const [side, h, w] = s,
      M = new THREE.Matrix4().makeTranslation(h[0], h[1], h[2]);
    for (const q of MODELS.get('driver', who || side, v || 0, [w[0] - h[0], w[1] - h[1]])) P.push(Object.assign({}, q, { m: new THREE.Matrix4().multiplyMatrices(M, q.m) }));
    return P;
  };
  MODELS.driven = (name, ...a) => MODELS.drivenAs(null, 0, name, ...a);
  /* the same figure jointed, for one who walks: CREW_RIG(side, v) -> { root, step(dist, speed) }. Each thigh hangs from its hip, each
     shin (with its boot) from its knee, each upper arm from its shoulder and each forearm (with the hand) from its elbow; root's origin
     is on the ground under the hips. step() poses it for the metres walked so far (dist) at the speed it walks now: a stride of
     1.5 m (two steps), legs swinging about 26 degrees either side at a walk, the knee bending as the leg comes through, the arms swinging
     against the legs, the boots kept near level at the ankles, and the body rising a little over each step. Standing still, it eases to
     attention. Eleven small meshes. */
  window.CREW_RIG = (side, v) => {
    const S = side || 'us',
      c = U[S][(v || 0) % U[S].length],
      sk = SKIN[S],
      hip = S === 'us' ? 0.82 : 0.78,
      arm = S === 'jn' && c.band ? sk : c.top,
      mat = new THREE.MeshLambertMaterial({ vertexColors: true }),
      mesh = (P) => new THREE.Mesh(new GX.Acc().add(P, GX.xf(0, 0, 0, 0)).geometry(), mat),
      root = new THREE.Group(),
      body = new THREE.Group();
    root.add(body);
    const B = [];
    upper(B, S, c, sk, hip, 'torso');
    upper(B, S, c, sk, hip, 'head');
    body.add(mesh(B));
    const th = hip * 0.5 /* thigh length */,
      sh = hip - th - 0.07 /* shin, to the ankle */,
      J = { leg: [], knee: [], foot: [], arm: [], elb: [] };
    for (const s of [-1, 1]) {
      const z = s * 0.1;
      /* the leg: thigh from the hip, the shin and boot from the knee */
      const L = new THREE.Group();
      L.position.set(0, hip, z);
      L.add(mesh([limb(0, 0, 0, -th, 0, 0.085, 0.07, c.legs)]));
      const K = new THREE.Group();
      K.position.set(0, -th, 0);
      K.add(mesh([limb(0, 0, 0, -sh, 0, 0.07, 0.055, c.putt || c.legs)]));
      const F = new THREE.Group(); /* the ankle: the boot stays near level as the leg swings */
      F.position.set(0, -sh, 0);
      F.add(mesh([part(bx(0.26, 0.1, 0.11), c.boots, 0.06, -0.02, 0)]));
      K.add(F);
      L.add(K);
      J.foot.push(F);
      body.add(L);
      J.leg.push(L), J.knee.push(K);
      /* the arm: upper arm from the shoulder, forearm and hand from the elbow */
      const sy = hip + 0.55,
        A = new THREE.Group();
      A.position.set(0, sy, s * 0.22);
      A.add(mesh([limb(0, 0, 0, -0.3, 0, 0.055, 0.045, arm)]));
      const E = new THREE.Group();
      E.position.set(0, -0.3, 0);
      E.add(mesh([limb(0, 0, 0, -0.27, 0, 0.045, 0.04, arm === sk ? sk : arm), part(sph(6), sk, 0, -0.3, 0, 0, 0, 0, 0.05, 0.05, 0.05)]));
      A.add(E);
      body.add(A);
      J.arm.push(A), J.elb.push(E);
    }
    let amp = 0;
    const live = [root, body, ...J.leg, ...J.knee, ...J.foot, ...J.arm, ...J.elb];
    const step = (dist, speed) => {
      for (const g of live) g.matrixAutoUpdate = true; /* the scene is frozen after the build: the joints keep moving */
      /* how hard it strides: 0 standing, 1 at a brisk walk (1.4 m/s) */
      amp += (Math.min(1, speed / 1.4) - amp) * 0.15;
      const ph = (dist / 1.5) * Math.PI * 2;
      for (let k = 0; k < 2; k++) {
        const sg = k ? -1 : 1,
          q = Math.sin(ph) * sg /* + : this leg forward */,
          swing = 0.45 * amp * q;
        J.leg[k].rotation.z = swing;
        /* the knee bends as the leg swings through (going forward), straight as it takes the weight */
        J.knee[k].rotation.z = -amp * (0.08 + 0.55 * Math.max(0, Math.cos(ph) * sg));
        J.foot[k].rotation.z = -0.85 * (J.leg[k].rotation.z + J.knee[k].rotation.z) + 0.15 * amp * Math.max(0, -q) /* toe off behind */;
        J.arm[k].rotation.z = -0.35 * amp * q;
        J.elb[k].rotation.z = 0.12 + 0.2 * amp * Math.max(0, -q);
      }
      body.position.y = 0.035 * amp * (Math.abs(Math.cos(ph)) - 1); /* lowest as the feet pass, highest over the straight leg */
    };
    step(0, 0);
    return { rig: true, root, step };
  };
})();
