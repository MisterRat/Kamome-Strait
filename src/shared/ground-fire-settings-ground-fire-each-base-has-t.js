/* ---------- ground fire (Settings > Ground fire): each base has two Type 96 25 mm twin AA guns and two 150 cm searchlights ----------
   The guns fire at you in free flight, convoy and bombing. At night they only fire when a searchlight has you (or you are close).
   The lights sweep at night and lock on, and the second light is cued onto the first one's target. Guns and lights are targets. */
const AA = {
  on: false,
  gun: [],
  lamp: [],
  bl: [] /* shells in flight */,
  fg: [] /* the airfield's 3.7-inch gun: scenery */,
  lit: 0,
  dz: 0,
  msgT: 0,
  fT: 0,
  t: 0,
  load() {
    this.on = store.get('aa', false) === true;
  },
};
AA.load();
{
  const { part, bx, cyl, sph } = GX,
    Z = Math.PI / 2,
    G0 = -1.5; /* the group origin is 1.5 m above the ground (so killT can squash it like a building) */
  const build = (P) => new GX.Acc().add(P, GX.xf(0, G0, 0, 0, 1)).geometry();
  const raw = (P) => new GX.Acc().add(P).geometry(); /* parts of the moving heads are placed on their own pivots */
  const lam = () => new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 });
  const bags = (P, r, n, a0, a1, layers) => {
    for (let L = 0; L < layers; L++)
      for (let i = 0; i < n; i++) {
        const a = a0 + ((i + L * 0.5) / n) * (a1 - a0);
        P.push(part(bx(1.5, 0.45, 0.62), L ? 0x7d7452 : 0x8a8058, Math.cos(a) * r, 0.55 + L * 0.42, Math.sin(a) * r, 0, -a - Z));
      }
  };
  /* ----- Type 96 25 mm twin mount ----- */
  const gunPit = () => {
    const P = [part(cyl(4.7, 4.9, 0.35, 24), 0x4d432d, 0, 0.15, 0), part(cyl(0.5, 0.65, 0.95, 10), 0x3d4038, 0, 0.8, 0)];
    bags(P, 3.8, 18, 0, Math.PI * 2, 2);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094 + 0.5;
      P.push(part(bx(0.25, 0.18, 1.9), 0x3d4038, Math.cos(a) * 0.95, 0.4, Math.sin(a) * 0.95, 0, Z - a));
    }
    P.push(
      part(bx(0.7, 0.4, 0.45), 0x4a5035, 2.1, 0.55, -1.4, 0, 0.4),
      part(bx(0.7, 0.4, 0.45), 0x4a5035, 2.45, 0.55, -0.6, 0, 0.2),
      part(bx(0.7, 0.4, 0.45), 0x3e4430, 2.3, 0.95, -1.0, 0, 0.3),
      part(bx(0.5, 0.3, 0.8), 0x6b5a3a, -2.4, 0.5, 1.2, 0, 0.5) /* spare magazines */,
    );
    return build(P);
  };
  const gunTurret = () => {
    const P = [
      part(bx(1.7, 0.3, 1.0), 0x4b5238, 0, 0.15, 0),
      part(bx(0.2, 0.95, 0.95), 0x4b5238, 0.65, 0.7, 0.05),
      part(bx(0.2, 0.95, 0.95), 0x4b5238, -0.65, 0.7, 0.05),
      part(bx(0.45, 0.08, 0.42), 0x2a2c26, -1.25, 0.3, -0.75),
      part(bx(0.45, 0.08, 0.42), 0x2a2c26, 1.25, 0.3, -0.75),
      part(bx(0.06, 0.4, 0.06), 0x33352e, -1.25, 0.1, -0.75),
      part(bx(0.06, 0.4, 0.06), 0x33352e, 1.25, 0.1, -0.75),
      part(bx(0.5, 0.06, 0.8), 0x33352e, -1.0, 0.3, -0.45),
      part(bx(0.5, 0.06, 0.8), 0x33352e, 1.0, 0.3, -0.45),
      part(cyl(0.22, 0.22, 0.07, 12), 0x1d1d1d, -1.0, 0.75, -0.1, 0, 0, Z) /* hand wheels */,
      part(cyl(0.22, 0.22, 0.07, 12), 0x1d1d1d, 1.0, 0.75, -0.1, 0, 0, Z),
      part(cyl(0.04, 0.04, 0.8, 8), 0x1a1a1a, -0.45, 1.25, 0.2, Z), /* sight tube */
      part(bx(0.12, 0.2, 0.12), 0x1a1a1a, -0.45, 1.1, -0.15),
    ];
    return raw(P);
  };
  const gunBarrels = () => {
    const P = [part(bx(0.9, 0.4, 1.2), 0x464b36, 0, 0, 0.25), part(bx(0.55, 0.5, 0.6), 0x3a4030, 0, 0, -0.35)];
    for (const s of [-1, 1]) {
      P.push(
        part(cyl(0.062, 0.062, 2.45, 10), 0x1c1c1c, s * 0.2, 0, 1.85, Z),
        part(cyl(0.1, 0.1, 0.95, 10), 0x2c2f28, s * 0.2, 0, 1.0, Z) /* jacket */,
        part(cyl(0.1, 0.075, 0.3, 10), 0x121212, s * 0.2, 0, 3.15, Z) /* flash hider */,
        part(bx(0.2, 0.27, 0.64), 0x2f3526, s * 0.2, 0.36, 0.3) /* curved top magazine */,
        part(bx(0.2, 0.22, 0.4), 0x2f3526, s * 0.2, 0.46, -0.1, 0.5),
      );
    }
    return raw(P);
  };
  /* ----- 150 cm searchlight on its carriage ----- */
  const lampBase = () => {
    const P = [part(cyl(3.3, 3.5, 0.3, 20), 0x4d432d, 0, 0.13, 0), part(bx(2.0, 0.25, 1.7), 0x4b5238, 0, 0.85, 0), part(cyl(0.38, 0.5, 0.9, 12), 0x3d4038, 0, 1.4, 0)];
    for (const s of [-1, 1]) P.push(part(cyl(0.52, 0.52, 0.17, 14), 0x16171a, s * 1.15, 0.52, -0.2, 0, 0, Z));
    P.push(
      part(bx(0.16, 0.16, 2.0), 0x3d4038, 0, 0.75, -1.8) /* drawbar */,
      part(bx(1.6, 0.9, 0.95), 0x58603f, 2.3, 0.6, 0.6) /* generator */,
      part(cyl(0.06, 0.06, 0.7, 8), 0x1d1d1d, 2.7, 1.3, 0.6),
      part(bx(0.5, 0.35, 0.4), 0x3e4430, -2.2, 0.4, 0.8),
    );
    bags(P, 3.0, 11, Math.PI * 0.05, Math.PI * 0.95, 2);
    return build(P);
  };
  const lampYoke = () => raw([part(bx(0.18, 1.1, 0.45), 0x4b5238, 1.0, 0.35, 0), part(bx(0.18, 1.1, 0.45), 0x4b5238, -1.0, 0.35, 0), part(bx(2.2, 0.2, 0.5), 0x3d4038, 0, -0.2, 0)]);
  const lampDrum = () =>
    raw([
      part(cyl(0.88, 0.88, 1.25, 20), 0x5e6450, 0, 0, 0.1, Z),
      part(cyl(0.62, 0.88, 0.55, 20), 0x4f5442, 0, 0, -0.75, Z),
      part(cyl(0.93, 0.93, 0.14, 20), 0x20221d, 0, 0, 0.74, Z),
      part(cyl(0.13, 0.13, 2.05, 8), 0x2a2c26, 0, 0, 0, 0, 0, Z),
      part(bx(0.4, 0.25, 0.4), 0x33352e, 0, 0.95, -0.3),
    ]);
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'),
      r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(210,230,255,.55)');
    r.addColorStop(1, 'rgba(180,210,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const beamGeo = (L, rFar) => {
    const g = new THREE.CylinderGeometry(rFar, 0.7, L, 20, 8, true);
    g.translate(0, L / 2, 0);
    g.rotateX(Z);
    const p = g.attributes.position,
      col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = Math.pow(Math.max(0, 1 - p.getZ(i) / L), 1.25);
      col[i * 3] = k * 0.82;
      col[i * 3 + 1] = k * 0.9;
      col[i * 3 + 2] = k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  };
  const LB = 8000; /* the Type 96 150 cm land searchlight lit a target out to about 8 km (Japanese Navy figure) */
  /* the gunner: sits behind the breech on the platform, hands forward on the hand wheels, in a steel helmet */
  const gunner = (y0, zo) =>
    raw([
      ...[-1, 1].flatMap((s) => [
        part(bx(0.16, 0.1, 0.3), 0x2a2a26, s * 0.12, y0 + 0.05, zo + 0.4),
        part(bx(0.15, 0.4, 0.15), 0x6f6643, s * 0.12, y0 + 0.3, zo + 0.3),
        part(bx(0.17, 0.15, 0.5), 0x6f6643, s * 0.12, y0 + 0.55, zo + 0.05),
        part(bx(0.11, 0.11, 0.55), 0x6f6643, s * 0.27, y0 + 1.0, zo + 0.3),
      ]),
      part(bx(0.42, 0.55, 0.26), 0x7a6f4a, 0, y0 + 0.95, zo - 0.15),
      part(sph(10), 0xc89a7a, 0, y0 + 1.4, zo - 0.12, 0, 0, 0, 0.12, 0.13, 0.12),
      part(sph(10), 0x4a4f35, 0, y0 + 1.47, zo - 0.12, 0, 0, 0, 0.16, 0.1, 0.16),
    ]);
  const GEOM = { pit: gunPit(), tur: gunTurret(), bar: gunBarrels(), lb: lampBase(), ly: lampYoke(), ld: lampDrum(), man: gunner(0.3, -0.75), man37: gunner(0.33, -1.0) };
  AA.mount = { tur: GEOM.tur, bar: GEOM.bar, man: GEOM.man }; /* the 25 mm twin mount, reused by the escort ship */
  const MAT = lam();
  const mk = (g) => {
    return new THREE.Mesh(g, MAT.clone()); /* one material per mesh: killT darkens and restores each mesh's own colour */
  };
  const addT = (grp, type, hp, r) => {
    const e = { m: grp, lit: null, c: grp.position, r, hp, hp0: hp, type, dead: false, s1: 3, col: 0x4a5035, kind: 'aa' };
    T.push(e);
    return e;
  };
  const gun = (cx, cz, rx, rz, yaw0) => {
    const x = cx + rx,
      z = cz + rz,
      grp = new THREE.Group();
    grp.position.set(x, H(x, z) + 1.5, z);
    grp.add(mk(GEOM.pit));
    const tur = new THREE.Group();
    tur.position.set(0, 1.25 + G0, 0);
    tur.add(mk(GEOM.tur));
    tur.add(mk(GEOM.man));
    const bar = new THREE.Group();
    bar.position.set(0, 0.65, 0);
    bar.add(mk(GEOM.bar));
    tur.add(bar);
    grp.add(tur);
    scene.add(grp);
    const t = addT(grp, 'aa25', 40, 4.5);
    AA.gun.push({
      t, grp, tur, bar, x, z, nr: 0, bias: new V(0, 0, 0), yaw: yaw0, pit: 0.5, acq: 0, mag: 30, rl: 0, cd: 0, side: 1, rec: 0, snd: 0, v: new V(0, 0, 0),
      piv: new V(x, H(x, z) + 1.5 + 0.4 + 0, z),
    });
  };
  const lamp = (cx, cz, rx, rz, home, fr) => {
    const x = cx + rx,
      z = cz + rz,
      grp = new THREE.Group();
    grp.position.set(x, H(x, z) + 1.5, z);
    grp.add(mk(GEOM.lb));
    const head = new THREE.Group();
    head.position.set(0, 2.1 + G0, 0);
    head.add(mk(GEOM.ly));
    const pit = new THREE.Group();
    pit.rotation.order = 'YXZ';
    pit.add(mk(GEOM.ld));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.8, 18), new THREE.MeshBasicMaterial({ color: 0x8c9bb0 }));
    lens.position.z = 0.82;
    pit.add(lens);
    head.add(pit);
    head.rotation.order = 'YXZ';
    grp.add(head);
    scene.add(grp);
    /* the beam: three nested additive cones, brighter on the axis */
    const beam = new THREE.Group();
    beam.rotation.order = 'YXZ';
    const R = LB * Math.tan(0.0245);
    [[1, 0.075], [0.62, 0.085], [0.3, 0.1]].forEach((k) => {
      const m = new THREE.Mesh(
        beamGeo(LB, R * k[0]),
        new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: k[1], blending: THREE.AdditiveBlending, depthWrite: false, side: 2, fog: false }),
      );
      m.frustumCulled = false;
      beam.add(m);
    });
    beam.visible = false;
    scene.add(beam);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glow.scale.set(26, 26, 1);
    glow.visible = false;
    scene.add(glow);
    const spl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xcfe0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    spl.visible = false;
    scene.add(spl);
    const t = fr ? { dead: false } : addT(grp, 'sl150', 16, 3);
    AA.lamp.push({
      fr: !!fr, t, grp, head, pit, lens, beam, glow, spl, ct: Math.random() * 0.15, cloudAxis: Infinity, occ: false, x, z, home, yaw: home, el: 0.8, wy: home, we: 0.8, mode: 'search', lost: 0, cue: 0, lit: false, on: false,
      p: new V(x, H(x, z) + 1.5 + 0.6, z),
    });
  };

  /* ----- QF 3.7-inch heavy AA gun (the home airfield's own battery) ----- */
  const pit37 = () => {
    const P = [part(cyl(5.2, 5.4, 0.3, 24), 0x5a5238, 0, 0.12, 0), part(cyl(0.55, 0.7, 0.8, 12), 0x4d513c, 0, 0.7, 0)];
    bags(P, 4.5, 22, 0, Math.PI * 2, 2);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI * 0.5 + 0.4; /* the cruciform platform with its four outriggers */
      P.push(part(bx(0.34, 0.2, 2.9), 0x4d513c, Math.cos(a) * 1.5, 0.4, Math.sin(a) * 1.5, 0, Z - a), part(cyl(0.14, 0.14, 0.4, 8), 0x2a2c26, Math.cos(a) * 2.9, 0.35, Math.sin(a) * 2.9));
    }
    P.push(part(bx(1.1, 0.8, 0.6), 0x6e6a48, 2.9, 0.5, 1.9, 0, 0.3), part(bx(1.1, 0.8, 0.6), 0x6e6a48, 3.0, 0.5, 1.1, 0, 0.1), part(bx(0.5, 0.35, 0.9), 0x5b6046, -3.0, 0.45, -1.5, 0, 0.5));
    for (let i = 0; i < 5; i++) P.push(part(cyl(0.12, 0.12, 0.9, 8), 0xb59a4c, -2.6 + i * 0.28, 0.5, 2.7, 0, 0, Z)); /* shells ready to hand */
    return build(P);
  };
  const tur37 = () =>
    raw([
      part(cyl(0.9, 1.0, 0.35, 16), 0x4d513c, 0, 0.15, 0),
      part(bx(0.25, 1.1, 1.3), 0x5b6046, 0.85, 0.75, 0.1),
      part(bx(0.25, 1.1, 1.3), 0x5b6046, -0.85, 0.75, 0.1),
      part(bx(2.3, 1.15, 0.07), 0x5f6448, 0, 1.25, 1.0) /* shield */,
      part(bx(0.5, 0.07, 0.45), 0x2a2c26, -1.4, 0.55, -0.55),
      part(bx(0.5, 0.07, 0.45), 0x2a2c26, 1.4, 0.55, -0.55),
      part(cyl(0.05, 0.05, 0.55, 8), 0x1a1a1a, -1.4, 0.3, -0.55),
      part(cyl(0.05, 0.05, 0.55, 8), 0x1a1a1a, 1.4, 0.3, -0.55),
      part(cyl(0.25, 0.25, 0.08, 12), 0x1d1d1d, -1.05, 1.05, -0.3, 0, 0, Z),
      part(cyl(0.25, 0.25, 0.08, 12), 0x1d1d1d, 1.05, 1.05, -0.3, 0, 0, Z),
      part(bx(0.5, 0.4, 0.5), 0x33352e, 1.3, 1.3, -0.2) /* fuze setter */,
    ]);
  const bar37 = () =>
    raw([
      part(bx(1.0, 0.55, 1.4), 0x464b36, 0, 0, 0.2),
      part(bx(0.55, 0.5, 0.7), 0x383c2d, 0, 0.05, -0.65) /* breech */,
      part(cyl(0.085, 0.07, 4.4, 12), 0x1c1c1c, 0, 0.05, 2.7, Z),
      part(cyl(0.13, 0.13, 1.7, 10), 0x2c2f28, 0, 0.05, 1.2, Z),
      part(cyl(0.11, 0.11, 1.3, 10), 0x2c2f28, 0, -0.38, 0.9, Z) /* recoil cylinder */,
      part(cyl(0.11, 0.09, 0.4, 10), 0x121212, 0, 0.05, 5.0, Z) /* muzzle */,
      part(bx(0.5, 0.06, 0.8), 0x2a2c26, 0, -0.3, -0.2) /* loading tray */,
    ]);
  GEOM.p37 = pit37();
  GEOM.t37 = tur37();
  GEOM.b37 = bar37();
  const fgun = (x, z, yaw0) => {
    const grp = new THREE.Group();
    grp.position.set(x, H(x, z) + 1.5, z);
    grp.add(mk(GEOM.p37));
    const tur = new THREE.Group();
    tur.position.set(0, 1.1 + G0, 0);
    tur.add(mk(GEOM.t37));
    tur.add(mk(GEOM.man37));
    const bar = new THREE.Group();
    bar.position.set(0, 1.05, 0);
    bar.add(mk(GEOM.b37));
    tur.add(bar);
    grp.add(tur);
    scene.add(grp);
    AA.fg.push({ grp, tur, bar, x, z, yaw: yaw0, pit: 0.6, acq: 0, cd: 2, rec: 0, piv: null });
  };
  const D = DEPOT,
    B = BASE;
  gun(D[0], D[1], -146, 72, 0.6);
  gun(D[0], D[1], -18, -78, 0.6);
  gun(B[0], B[1], -28, -75, 0.4);
  gun(B[0], B[1], 128, 88, 0.4);
  lamp(D[0], D[1], -148, -62, 1.4);
  lamp(D[0], D[1], 3, 97, 1.0);
  lamp(B[0], B[1], -34, 40, 1.9);
  lamp(B[0], B[1], 134, -85, 2.4);
  /* the port and the airbase (free flight only): two guns and a searchlight each */
  const sg = (u, d, yaw) => {
      const [x, z] = SITE.w(u, d);
      gun(x, z, 0, 0, yaw);
      const g = AA.gun[AA.gun.length - 1];
      g.site = g.t.site = true;
    },
    sl = (u, d, home) => {
      const [x, z] = SITE.w(u, d);
      lamp(x, z, 0, 0, home);
      const L = AA.lamp[AA.lamp.length - 1];
      L.site = L.t.site = true;
    };
  AA.mkGun = gun; /* the far sites place their own guns and lights */
  AA.mkLamp = lamp;
  sg(-150, -20, 0.5);
  sg(150, -30, 0.5);
  sl(-110, -105, 1.2);
  sg(-480, -700, 0.5);
  sg(470, -705, 0.5);
  sl(40, -1010, 2.0);
  /* the player's airfield: a 3.7-inch gun behind the hangars and a searchlight beside the line-up, both on our side, for show only */
  fgun(-168, 100, 0.8);
  lamp(0, 0, -218, 372, 0.3, true);
  /* Kamome Field: a 3.7-inch gun at the east end of the apron and a searchlight at the west */
  {
    const [gx, gz] = ISL.w(175, -75),
      [lx, lz] = ISL.w(-215, -80);
    fgun(gx, gz, 1.2);
    lamp(lx, lz, 0, 0, 0.3, true);
  }
}
const _aaF = new V(),
  _aaR = new V(),
  _aaU = new V();
