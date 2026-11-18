/* the port and the airbase: two more enemy sites for free flight, found by searching the map for a gently sloping coast with level farmland behind it.
   Local frame: u runs along the coast, d runs out to sea (so the airbase, on the inland side, has negative d). */
const SITE = (() => {
  const O = { x: 2000, z: -7200 },
    n = Math.hypot(0.38, 0.92),
    S = { x: -0.38 / n, z: -0.92 / n },
    A = { x: -S.z, z: S.x };
  return {
    O,
    S,
    A,
    ryA: Math.atan2(-A.z, A.x) /* yaw that lays a model's +x along the coast */,
    ryS: Math.atan2(-S.z, S.x) /* yaw that points a model's +x out to sea */,
    w: (u, d) => [O.x + A.x * u + S.x * d, O.z + A.z * u + S.z * d],
    H0: 26.5 /* the airbase stands on a levelled pad this high (the farmland there rolls between 25 and 60 m) */,
    pad(x, z) {
      const dx = x - O.x,
        dz = z - O.z,
        u = dx * A.x + dz * A.z,
        d = dx * S.x + dz * S.z,
        e = Math.hypot(Math.max(0, Math.abs(u) - 780), Math.max(0, -1110 - d, d + 520));
      return 1 - ss(0, 230, e);
    },
    H1: 3.2 /* the harbour yard is cut and filled level at this height (the shore there falls 20 m) */,
    pad2(x, z) {
      const dx = x - O.x,
        dz = z - O.z,
        u = dx * A.x + dz * A.z,
        d = dx * S.x + dz * S.z,
        t = Math.max(Math.max(0, Math.abs(u) - 200) / 220, Math.max(0, -150 - d) / 220, Math.max(0, d - 52) / 60);
      return 1 - ss(0, 1, t);
    },
    inside(x, z, m) {
      const dx = x - O.x,
        dz = z - O.z,
        u = dx * A.x + dz * A.z,
        d = dx * S.x + dz * S.z;
      return (Math.abs(u) < 190 + m && d > -150 - m && d < 270 + m) || (Math.abs(u) < 740 + m && d > -1110 - m && d < -520 + m);
    },
  };
})();
