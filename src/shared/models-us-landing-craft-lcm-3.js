/* ---------- the US Navy's LCM(3), 1945 ----------
   Landing Craft, Mechanized, Mark 3: 50 ft (15.24 m) x 14 ft 1 in (4.29 m), about 4 ft (1.2 m) draught loaded aft; a steel scow with a
   bow ramp, an open well for 30 tons of cargo, twin diesels under the raised after deck and the coxswain standing behind a steel
   shield on it. At the forward bases they unloaded the anchored Liberty ships into the piers and beaches. Navy grey; bow toward +x,
   her waterline at y = 0. The coxswain stands at the wheel (a boat that moves has someone driving it) */
(() => {
  const { part, bx, cyl } = GX,
    GREY = 0x5e676c,
    DK = 0x2a2c2d,
    put = (P, x, y, z, yaw) => {
      const M = new THREE.Matrix4().makeRotationY(yaw || 0).setPosition(x, y, z);
      P.forEach((q) => (q.m = M.clone().multiply(q.m || new THREE.Matrix4())));
      return P;
    };
  MODELS.add(
    'us-lcm3',
    () => {
      const L = 15.24,
        X0 = -L / 2,
        b = 2.145,
        P = GX.loft({
          L,
          X0,
          N: 10,
          sect: (t) => {
            const k = -1.2 + (t > 0.82 ? (t - 0.82) * 3.4 : 0); /* the bottom sweeps up to the ramp */
            return [
              [k, 0],
              [k, b * 0.7],
              [k + 0.25, b],
              [0.3, b],
              [1.3, b],
            ];
          },
          paint: (y) => (y < 0.15 ? 0x3a3d3e : GREY),
          deck: null,
          transom: GREY,
        });
      P.push(part(bx(L / 2 - 0.2 - (X0 + 4.1), 0.3, 3.9), 0x40484c, (L / 2 - 0.2 + X0 + 4.1) / 2, 0.12, 0)); /* the well floor, from the engine room to the ramp */
      P.push(part(bx(0.2, 1.9, 3.8), GREY, L / 2 - 0.1, 0.85, 0, 0, 0, 0.1)); /* the bow ramp, up */
      /* the engine room under the after deck: solid from the bottom up to the deck (1.3 m), the full beam inside the sides */
      P.push(part(bx(4.0, 2.4, 4.0), GREY, X0 + 2.1, 0.1, 0), part(bx(4.0, 0.08, 4.1), 0x4a5256, X0 + 2.1, 1.32, 0));
      /* the coxswain's steel shield, the wheel on its pedestal behind it, the engine hatches and exhausts */
      P.push(
        part(bx(0.08, 1.15, 1.6), GREY, X0 + 3.3, 1.93, 0),
        part(bx(0.7, 1.15, 0.08), GREY, X0 + 2.95, 1.93, 0.8),
        part(bx(0.7, 1.15, 0.08), GREY, X0 + 2.95, 1.93, -0.8),
      );
      P.push(part(cyl(0.06, 0.06, 0.95, 6), DK, X0 + 2.9, 1.8, 0), part(cyl(0.24, 0.24, 0.04, 12), DK, X0 + 2.85, 2.3, 0, 0, 0, Math.PI / 2 - 0.4));
      P.push(part(bx(1.1, 0.12, 1.2), 0x4a5256, X0 + 1.2, 1.42, 1.1), part(bx(1.1, 0.12, 1.2), 0x4a5256, X0 + 1.2, 1.42, -1.1));
      for (const s of [-1, 1]) P.push(part(cyl(0.09, 0.09, 1.0, 8), DK, X0 + 0.5, 1.8, s * 1.7));
      P.push(...put(MODELS.get('crew', 'us', 'stand', 2), X0 + 2.45, 1.36, 0, 0)); /* the coxswain, on the after deck at the wheel */
      P.push(part(cyl(0.04, 0.04, 1.6, 6), DK, X0 + 0.2, 2.1, 0), ...FLG.at('us', 0.7, X0 + 0.18, 2.85, 0, Math.PI)); /* ensign staff at the stern */
      /* the load in the well: crates and drums */
      for (let k = 0; k < 4; k++) P.push(part(bx(1.3, 0.8, 1.2), k % 2 ? 0x5f6340 : 0x6b6a48, -1.6 + k * 1.6, 0.67, k % 2 ? 0.8 : -0.7));
      for (let k = 0; k < 6; k++) P.push(part(cyl(0.29, 0.29, 0.88, 8), 0x4d5a3a, 5.0 + (k % 2) * 0.65, 0.71, -1.3 + (k >> 1) * 0.7));
      return P;
    },
    { L: 15.24, W: 4.29, D: 1.2, name: 'LCM(3) landing craft' },
  );
})();
