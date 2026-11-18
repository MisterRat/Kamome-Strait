/* Kamome Field: a small island airfield about 43 km out (north-north-west of the home airfield), for navigation training with the ADF radio compass.
   Local frame: u runs along the runway (heading 070), v across it. The island is flat and level around the runway and falls to the sea. */
const ISL = (() => {
  const F = { x: -14000, z: -40500 },
    hdg = (70 * Math.PI) / 180,
    ux = Math.sin(hdg),
    uz = -Math.cos(hdg),
    vx = -uz,
    vz = ux,
    H0 = 14,
    loc = (x, z) => {
      const dx = x - F.x,
        dz = z - F.z;
      return [dx * ux + dz * uz, dx * vx + dz * vz];
    };
  return {
    F,
    hdg,
    ux,
    uz,
    vx,
    vz,
    H0,
    len: 1300,
    wid: 40,
    ident: 'KMM',
    name: 'KAMOME FIELD',
    loc,
    w: (u, v) => [F.x + ux * u + vx * v, F.z + uz * u + vz * v],
    /* island height at x, z, or null when this point is far from the island */
    h(x, z) {
      if (Math.abs(x - F.x) > 3600 || Math.abs(z - F.z) > 3600) return null;
      const [u, v] = loc(x, z),
        e = Math.hypot(u / 2700, v / 1350);
      if (e > 1.6) return null;
      const hills = e > 0.55 ? 7 * fbm(x * 0.6, z * 0.6) * ss(0.55, 0.8, e) * (1 - ss(0.9, 1.1, e)) : 0;
      /* flat to a short beach, then a steep drop to the sea floor (-40 m: the same depth the main map's edge shows, so the sea is seamless) */
      return { h: H0 + hills - 22 * ss(0.78, 0.93, e) - 32 * ss(0.93, 1.12, e), e };
    },
    onRwy(x, z, m) {
      const [u, v] = loc(x, z);
      return Math.abs(u) < 650 + m && Math.abs(v) < 20 + m;
    },
  };
})();
