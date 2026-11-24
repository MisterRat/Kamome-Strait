/* ===== THE COAST BATTERIES (Settings > Enable enemy: Shore) =====
   Each Japanese port has a pair of 8 cm/40 3rd Year Type naval guns (the user's, 2026-11-22: a gun of less reach than the 12 cm/45s
   they had, 14 km or under): a 3-inch gun the Navy set up ashore all over the Pacific for coast defence (a copy of the British
   12-pounder, hand worked): 5.99 kg HE at 680 m/s, -7 to +75 deg, 10,800 m at 45 deg, 13 - 20 rounds a minute aboard ship (about 10
   ashore) (NavWeaps); here reaching 10,000 m at most, so that Port Ugaki's battery cannot reach Depot Nimitz. Each sits in a sandbagged pit on the shore behind the harbour, on a pedestal with a light shield, and a crew of
   five (pointer, trainer, loader, two ammunition handlers). They open fire when she comes inside about 10 km by day (3 km at night, where they can see her),
   lead her by her course and speed at the moment of firing, and walk the fall of shot onto her: the first round is off by several
   per cent of the range, and each spotted splash halves the error, down to the battery's limit (about 1% of the range, 3 mils in line). A shell that comes down inside
   her hull is a hit (counted, like the strafing, until battle damage comes). The guns are targets: the 3"/50 knocks them out. */
/* the still-water level the guns and their shells work to: the ocean's where the world has one, else the painted sea (-8 m) */
function coastSea() {
  return typeof OCEAN !== 'undefined' ? OCEAN.Y : SEA.PAINT;
}
const COAST = {
  G: [] /* guns: { grp, tur, bar, p (pivot), yaw, el, t (target entry), cd, er, ed, n, ... } */,
  S: [] /* shells in flight */,
  hits: 0,
  msgT: 0,
  MV: 680,
  K: 1.81e-4 /* fitted: 10,000 m at most (at 40 deg) (the user's, 2026-11-22: within that, short of Depot Nimitz; the table's 10,800 m at 45 deg), as the GSPEC drag law */,
  RLD: 6 /* seconds a round: about 10 a minute ashore */,
  R: 10000 /* they open fire inside this by day */,
  REACH: 10000 /* the most they can reach (ROE.reach): Port Ugaki's battery falls short of Depot Nimitz (10.3 km) and the Liberty's anchorage off it (10.2) */,
  PIV: 1.25 /* the trunnions above the pit's floor */,
  MZ: 2.5 /* the muzzle ahead of the trunnions */,
  EL0: (-7 * Math.PI) / 180,
  EL1: (45 * Math.PI) / 180 /* the mount goes to +75, but the range is greatest at 40 - 45 */,
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
        if (sd > 0) at(0.3, 1.18, 0, cyl(0.045, 0.045, 0.6, 8), 0xb08a3a, Math.PI / 2) /* an 8 cm round, brass case */;
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
  /* the gun on its pedestal, a light shield and a platform: turns as a whole (yaw), nose toward +x. The shield open-topped, as a
     high-angle pedestal mount's: the barrel elevates through its slot to +75 */
  const mount = () => [
    part(cyl(0.38, 0.55, 0.75, 14), GREY, 0, 0.375, 0) /* the pedestal */,
    part(cyl(1.25, 1.25, 0.1, 20), DK, 0, 0.75, 0) /* the crew's platform */,
    part(bx(0.85, 0.5, 0.6), GREY, 0.05, 1.0, 0) /* the cradle's carriage */,
    part(bx(0.06, 1.15, 1.7), GREY, 0.75, 1.42, 0) /* the shield's front plate */,
    part(bx(0.55, 1.0, 0.06), GREY, 0.48, 1.35, 0.85),
    part(bx(0.55, 1.0, 0.06), GREY, 0.48, 1.35, -0.85) /* its sides */,
    part(bx(0.07, 0.75, 0.24), DK, 0.765, 1.45, 0) /* the barrel's slot */,
    part(cyl(0.18, 0.18, 0.05, 12), DK, 0.1, 1.0, 0.45, Math.PI / 2) /* elevating handwheel */,
    part(cyl(0.18, 0.18, 0.05, 12), DK, 0.1, 1.0, -0.45, Math.PI / 2) /* training handwheel */,
    part(bx(0.16, 0.2, 0.14), DK, 0.35, 1.55, -0.5) /* the pointer's telescope */,
    ...man(-0.2, 0.8, 0, 1).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 0.8, 0).multiply(q.m)), q)) /* pointer */,
    ...man(-0.2, -0.8, 0, 1).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 0.8, 0).multiply(q.m)), q)) /* trainer */,
    ...man(-1.15, 0, 0, 2).map((q) => ((q.m = new THREE.Matrix4().makeTranslation(0, 0.8, 0).multiply(q.m)), q)) /* loader with a round */,
  ];
  /* the barrel (3.2 m: 40 calibres of 76.2 mm and the breech), the breech and the recoil cylinder under it: elevates about the
     trunnions, 0.7 m from its breech end */
  const barrel = () => [
    part(new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.12, 0), new THREE.Vector2(0.12, 0.8), new THREE.Vector2(0.085, 1.1), new THREE.Vector2(0.065, 3.05), new THREE.Vector2(0.075, 3.12), new THREE.Vector2(0.075, 3.2), new THREE.Vector2(0.04, 3.2)], 12), GREY, -0.7, 0, 0, 0, 0, -Math.PI / 2),
    part(bx(0.3, 0.28, 0.28), DK, -0.55, 0, 0) /* breech ring (inside the barrel's 3.2 m) */,
    part(cyl(0.06, 0.06, 1.2, 8), GREY, -0.05, -0.17, 0, 0, 0, Math.PI / 2) /* recoil cylinder under the barrel */,
    part(cyl(0.08, 0.08, 0.36, 10), DK, 0, 0, 0, Math.PI / 2) /* trunnions */,
  ];
  const mat = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  const G = { pit: new GX.Acc().add(pit()).geometry(), mount: new GX.Acc().add(mount()).geometry(), barrel: new GX.Acc().add(barrel()).geometry() };
  /* one gun at (x, z) on the shore, facing the sea along yaw (world: 0 = +x... as GX.xf) */
  COAST.add = (x, z, yaw) => {
    const y = SURF(x, z),
      grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = yaw;
    grp.add(new THREE.Mesh(G.pit, mat()));
    const tur = new THREE.Group(),
      bar = new THREE.Group();
    tur.add(new THREE.Mesh(G.mount, mat()));
    bar.position.set(0, COAST.PIV, 0);
    bar.add(new THREE.Mesh(G.barrel, mat()));
    tur.add(bar);
    grp.add(tur);
    scene.add(grp);
    const t = { m: grp, lit: null, c: grp.position, r: 2.6, hp: 30, hp0: 30, type: 'coast12' /* the coast gun's type (the name kept: an 8 cm now) */, dead: false, s1: 2, col: 0x6e7477, kind: 'aa', y0: grp.position.y };
    T.push(t);
    const g = { grp, tur, bar, t, p: new THREE.Vector3(x, y + COAST.PIV, z), yaw: 0, el: 0.05, cd: Math.random() * 6, er: 0, ed: 0, n: 0, rec: 0, home: yaw, smoke: 0 };
    g.p.y = y + COAST.PIV;
    COAST.G.push(g);
    return g;
  };
  /* the battery of a port: two guns on land either side of the harbour, a little back from the water, clear of the buildings */
  COAST.port = (F, rnd, taken, use) => {
    const sea0 = coastSea();
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
          if (h < sea0 + 3) continue;
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
            sea = H(sx, sz) < sea0 + 0.05; /* the sea level (SEA is an object: this compared with a string and no battery was ever placed) */
          }
          if (sea) best = [u, d, x, z];
        }
      if (!best) continue;
      const [u, d, x, z] = best;
      use(u - 6, u + 6, d - 6, d + 6);
      COAST.add(x, z, seaYaw).bat = F; /* the battery it belongs to */
    }
  };
}
