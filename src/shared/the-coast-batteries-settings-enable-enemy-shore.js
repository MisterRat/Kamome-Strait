/* ===== THE COAST BATTERIES (Settings > Enable enemy: Shore or All) =====
   Each Japanese port has a pair of 12 cm/45 3rd Year Type naval guns, the Navy's commonest coast-defence gun in the Pacific
   (old destroyer guns, hand worked): 20.3 kg HE at 825 m/s, -7 to +33 deg, 15,000 m at 33 deg, 5 - 6 rounds a minute
   (NavWeaps). Each sits in a sandbagged pit on the shore behind the harbour, with a shield and a crew of five (pointer, trainer,
   loader, two ammunition handlers). They open fire when she comes inside about 14 km by day (3 km at night, where they can see her),
   lead her by her course and speed at the moment of firing, and walk the fall of shot onto her: the first round is off by several
   per cent of the range, and each spotted splash halves the error, down to the battery's limit (about 1% of the range, 3 mils in line). A shell that comes down inside
   her hull is a hit (counted, like the strafing, until battle damage comes). The guns are targets: the 3"/50 knocks them out. */
/* the still-water level the guns and their shells work to: the ocean's where the world has one, else the painted sea (-8 m) */
function coastSea() {
  return typeof OCEAN !== 'undefined' ? OCEAN.Y : -8;
}
const COAST = {
  G: [] /* guns: { grp, tur, bar, p (pivot), yaw, el, t (target entry), cd, er, ed, n, ... } */,
  S: [] /* shells in flight */,
  hits: 0,
  msgT: 0,
  MV: 825,
  K: 1.26e-4 /* fitted: 15,000 m at 33 deg, as the GSPEC drag law */,
  RLD: 11 /* seconds a round: 5 - 6 a minute */,
  EL0: (-7 * Math.PI) / 180,
  EL1: (33 * Math.PI) / 180,
};
{
  const { part, bx, cyl, sph } = GX,
    GREY = 0x6e7477 /* IJN gun grey */,
    DK = 0x3b3f40,
    BAG = [0xa8996a, 0x9c8d60, 0xb2a476, 0x958658],
    UNI = 0x6d6a48 /* Navy landing-force green-khaki */,
    SKIN = 0xc89a7a,
    HELM = 0x4f5236;
  /* a standing man (1.68 m) facing +x; arms: 0 at his sides, 1 working the handwheels, 2 carrying a shell at the chest */
  const man = (x, z, yaw, arms) => {
    const P = [],
      c = Math.cos(yaw),
      s = Math.sin(yaw),
      at = (lx, y, lz, g, col, rx, ry, rz, sx, sy, sz) => P.push(part(g, col, x + lx * c + lz * s, y, z - lx * s + lz * c, rx, (ry || 0) + yaw, rz, sx, sy, sz));
    for (const sd of [-1, 1]) {
      at(0, 0.42, sd * 0.1, bx(0.16, 0.84, 0.15), UNI);
      at(0.04, 0.05, sd * 0.1, bx(0.26, 0.1, 0.14), 0x2a2620);
      at(0.02, 0.88, sd * 0.11, bx(0.18, 0.2, 0.17), 0x8a7d58) /* puttees and belt line */;
    }
    at(0, 1.13, 0, bx(0.24, 0.55, 0.42), UNI);
    at(0, 1.52, 0, sph(10), SKIN, 0, 0, 0, 0.12, 0.13, 0.12);
    at(0, 1.6, 0, sph(10), HELM, 0, 0, 0, 0.16, 0.09, 0.16);
    for (const sd of [-1, 1])
      if (arms === 1) at(0.22, 1.15, sd * 0.2, bx(0.42, 0.1, 0.1), UNI, 0, 0, -0.3);
      else if (arms === 2) {
        at(0.16, 1.12, sd * 0.2, bx(0.32, 0.1, 0.1), UNI);
        if (sd > 0) at(0.3, 1.18, 0, cyl(0.06, 0.06, 0.62, 8), 0xb08a3a, Math.PI / 2) /* a 12 cm round, brass case */;
      } else at(0, 1.05, sd * 0.25, bx(0.1, 0.55, 0.1), UNI);
    return P;
  };
  /* the pit: an earth floor, a horseshoe of sandbags three courses high (open at the back), ready-use boxes and the two handlers */
  const pit = () => {
    const P = [part(cyl(4.4, 4.6, 0.6, 24), 0x7a7058, 0, -0.25, 0)];
    let k = 0;
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 30; i++) {
        const a = ((i + (row % 2) * 0.5) / 30) * 2 * Math.PI;
        if (Math.cos(a) < -0.85) continue; /* the entrance at the back (-x) */
        const r = 4.15 - row * 0.12;
        P.push(part(bx(0.36, 0.27, 0.86), BAG[k++ % 4], r * Math.cos(a), 0.18 + row * 0.27, r * Math.sin(a), 0, -a, 0));
      }
    for (const sd of [-1, 1]) {
      P.push(part(bx(0.9, 0.55, 0.6), 0x4d4a32, -2.6, 0.3, sd * 2.2));
      P.push(...man(-2.0, sd * 2.4, sd > 0 ? -2.2 : 2.2, sd > 0 ? 2 : 0));
    }
    return P;
  };
  /* the gun on its pedestal, shield and platform: turns as a whole (yaw), nose toward +x */
  const mount = () => [
    part(cyl(0.55, 0.75, 1.0, 14), GREY, 0, 0.5, 0),
    part(cyl(1.6, 1.6, 0.12, 20), DK, 0, 1.0, 0) /* the crew's platform */,
    part(bx(1.3, 0.75, 0.9), GREY, 0.1, 1.35, 0) /* the cradle's carriage */,
    /* the shield: a square box open at the back, its front plate, sides and roof joined at the edges, and the slot the barrel
       elevates in */
    part(bx(0.08, 1.75, 2.58), GREY, 1.05, 1.975, 0),
    part(bx(1.24, 1.75, 0.08), GREY, 0.45, 1.975, 1.25),
    part(bx(1.24, 1.75, 0.08), GREY, 0.45, 1.975, -1.25),
    part(bx(1.24, 0.07, 2.58), GREY, 0.45, 2.885, 0),
    part(bx(0.09, 0.95, 0.34), DK, 1.065, 1.95, 0),
    part(cyl(0.22, 0.22, 0.06, 12), DK, 0.2, 1.3, 0.6, Math.PI / 2) /* elevating handwheel */,
    part(cyl(0.22, 0.22, 0.06, 12), DK, 0.2, 1.3, -0.6, Math.PI / 2) /* training handwheel */,
    part(bx(0.2, 0.25, 0.18), DK, 0.5, 2.1, -0.65) /* the pointer's telescope */,
    ...man(-0.2, 0.95, 0, 1).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 1.06, 0).multiply(q.m)), q)) /* pointer */,
    ...man(-0.2, -0.95, 0, 1).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 1.06, 0).multiply(q.m)), q)) /* trainer */,
    ...man(-1.25, 0, 0, 2).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 1.06, 0).multiply(q.m)), q)) /* loader with a round */,
  ];
  /* the barrel (5.55 m), the breech and the recoil cylinder: elevates about the trunnions */
  const barrel = () => [
    part(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.19, 0), new THREE.Vector2(0.19, 1.3), new THREE.Vector2(0.13, 1.6), new THREE.Vector2(0.1, 5.2), new THREE.Vector2(0.115, 5.35), new THREE.Vector2(0.115, 5.55), new THREE.Vector2(0.06, 5.55)], 14), GREY, -1.0, 0, 0, 0, 0, -Math.PI / 2),
    part(bx(0.45, 0.42, 0.42), DK, -1.1, 0, 0) /* breech ring and Welin block */,
    part(cyl(0.08, 0.08, 1.9, 8), GREY, 0.0, 0.27, 0, 0, 0, Math.PI / 2) /* recoil cylinder over the barrel */,
    part(cyl(0.12, 0.12, 0.5, 10), DK, 0, 0, 0, Math.PI / 2) /* trunnions */,
  ];
  const mat = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  const G = { pit: new GX.Acc().add(pit()).geometry(), mount: new GX.Acc().add(mount()).geometry(), barrel: new GX.Acc().add(barrel()).geometry() };
  /* one gun at (x, z) on the shore, facing the sea along yaw (world: 0 = +x... as GX.xf) */
  COAST.add = (x, z, yaw) => {
    const y = H(x, z),
      grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = yaw;
    grp.add(new THREE.Mesh(G.pit, mat()));
    const tur = new THREE.Group(),
      bar = new THREE.Group();
    tur.add(new THREE.Mesh(G.mount, mat()));
    bar.position.set(0, 1.62, 0);
    bar.add(new THREE.Mesh(G.barrel, mat()));
    tur.add(bar);
    grp.add(tur);
    scene.add(grp);
    const t = { m: grp, lit: null, c: grp.position, r: 3.2, hp: 40, hp0: 40, type: 'coast12', dead: false, s1: 2, col: 0x6e7477, kind: 'aa' };
    T.push(t);
    const g = { grp, tur, bar, t, p: new THREE.Vector3(x, y + 1.62 + 1.06 * 0, z), yaw: 0, el: 0.05, cd: Math.random() * 6, er: 0, ed: 0, n: 0, rec: 0, home: yaw, smoke: 0 };
    g.p.y = y + 1.62;
    COAST.G.push(g);
    return g;
  };
  /* the battery of a port: two guns on land either side of the harbour, a little back from the water, clear of the buildings */
  COAST.port = (F, rnd, taken, use) => {
    const SEA = coastSea();
    const [x0, z0] = F.w(0, 0),
      [x1, z1] = F.w(0, 100),
      seaYaw = Math.atan2(-(z1 - z0), x1 - x0);
    for (const side of [-1, 1]) {
      let best = null;
      for (let du = 0; du <= 240 && !best; du += 15)
        for (let d = 40; d >= -170 && !best; d -= 10) {
          const u = side * (175 + du);
          if (taken(u, d, 7)) continue;
          const [x, z] = F.w(u, d);
          const h = H(x, z);
          if (h < SEA + 3) continue;
          /* fairly level ground, and the sea in front of it within 250 m */
          let lo = 1e9,
            hi = -1e9;
          for (const [a, b] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) {
            const hh = H(x + a, z + b);
            lo = Math.min(lo, hh);
            hi = Math.max(hi, hh);
          }
          if (hi - lo > 3.5) continue;
          let sea = false;
          for (let k = 20; k <= 250 && !sea; k += 20) {
            const [sx, sz] = F.w(u, d + k);
            sea = H(sx, sz) < SEA + 0.05;
          }
          if (sea) best = [u, d, x, z];
        }
      if (!best) continue;
      const [u, d, x, z] = best;
      use(u - 6, u + 6, d - 6, d + 6);
      COAST.add(x, z, seaYaw);
    }
  };
}
