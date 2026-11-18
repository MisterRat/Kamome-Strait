/* compound dressing for the depot and the base: perimeter fence, guard towers, floodlights, stacks of crates and barrels, parked vehicles */
{
  const acc = new GX.Acc(),
    { part, bx, cyl, sph, Z } = VM;
  const put = (P, x, z, yaw, k, y0) => acc.add(P, GX.xf(x, y0 == null ? H(x, z) : y0, z, yaw, k));
  const post = () => [
    part(bx(0.14, 2.3, 0.14), 0x6b6e70, 0, 1.15, 0),
    part(bx(0.7, 0.05, 0.05), 0x4a4d4f, 0, 2.3, 0, 0, 0, 0.0),
  ];
  const fenceSeg = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0),
      yaw = Math.atan2(-(z1 - z0), x1 - x0),
      mx = (x0 + x1) / 2,
      mz = (z0 + z1) / 2;
    put(
      [
        part(bx(L, 0.035, 0.035), 0x75797c, 0, 0.5, 0),
        part(bx(L, 0.035, 0.035), 0x75797c, 0, 1.1, 0),
        part(bx(L, 0.035, 0.035), 0x75797c, 0, 1.7, 0),
        part(bx(L, 0.03, 0.03), 0x3a3c3e, 0, 2.3, 0),
        part(bx(L, 1.8, 0.012), 0x8a8e90, 0, 1.2, 0),
      ],
      mx,
      mz,
      yaw,
      1,
      (H(x0, z0) + H(x1, z1)) / 2,
    );
  };
  const fence = (cx, cz, x0, x1, z0, z1) => {
    const pts = [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
      [x0, z0],
    ];
    for (let e = 0; e < 4; e++) {
      const a = pts[e],
        b = pts[e + 1],
        L = Math.hypot(b[0] - a[0], b[1] - a[1]),
        n = Math.round(L / 5);
      for (let i = 0; i < n; i++) {
        const ax = cx + a[0] + ((b[0] - a[0]) * i) / n,
          az = cz + a[1] + ((b[1] - a[1]) * i) / n,
          bx2 = cx + a[0] + ((b[0] - a[0]) * (i + 1)) / n,
          bz = cz + a[1] + ((b[1] - a[1]) * (i + 1)) / n;
        if (nearRoad((ax + bx2) / 2, (az + bz) / 2, 13) || nearRoad(ax, az, 13) || nearRoad(bx2, bz, 13)) continue;
        fenceSeg(ax, az, bx2, bz);
        put(post(), ax, az, 0, 1);
      }
    }
  };
  const tower = (x, z) => {
    const P = [],
      g = 0x4d5240;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) P.push(part(bx(0.18, 6.4, 0.18), g, sx * 1.0, 3.2, sz * 1.0, sz * 0.05, 0, -sx * 0.05));
    for (const y of [1.6, 3.4, 5.0])
      P.push(
        part(bx(2.1, 0.1, 0.1), g, 0, y, 1),
        part(bx(2.1, 0.1, 0.1), g, 0, y, -1),
        part(bx(0.1, 0.1, 2.1), g, 1, y, 0),
        part(bx(0.1, 0.1, 2.1), g, -1, y, 0),
      );
    P.push(
      part(bx(3.0, 0.2, 3.0), 0x5a5f4c, 0, 6.5, 0),
      part(bx(2.5, 1.5, 2.5), 0x6a6f58, 0, 7.35, 0),
      part(bx(2.6, 0.06, 0.7), 0x1e2a33, 0, 7.6, 1.28),
      part(bx(0.7, 0.06, 2.6), 0x1e2a33, 1.28, 7.6, 0),
      part(bx(0.7, 0.06, 2.6), 0x1e2a33, -1.28, 7.6, 0),
      part(new THREE.ConeGeometry(2.3, 1.1, 4).rotateY(Math.PI / 4), 0x4a4f3c, 0, 8.6, 0),
      part(bx(0.5, 0.4, 0.5), 0x2b2d2f, 1.45, 6.85, 1.45),
      part(cyl(0.03, 0.03, 2, 5), 0x2b2d2f, -1.0, 9.2, -1.0),
      part(bx(2.8, 0.3, 0.08), 0x9c8c5e, 0, 6.8, 1.52),
      part(bx(0.08, 0.3, 2.8), 0x9c8c5e, 1.52, 6.8, 0),
      part(bx(0.08, 0.3, 2.8), 0x9c8c5e, -1.52, 6.8, 0),
    );
    put(P, x, z, 0, 1);
  };
  const flood = (x, z) => {
    put(
      [
        part(cyl(0.1, 0.14, 9, 6), 0x55595b, 0, 4.5, 0),
        part(bx(0.9, 0.14, 0.14), 0x3a3d3f, 0, 9.0, 0),
        part(bx(0.35, 0.25, 0.3), 0x2b2d2f, -0.38, 8.9, 0.1, 0.4),
        part(bx(0.35, 0.25, 0.3), 0x2b2d2f, 0.38, 8.9, 0.1, 0.4),
        part(bx(0.28, 0.14, 0.02), 0xfff2c0, -0.38, 8.86, 0.26, 0.4),
        part(bx(0.28, 0.14, 0.02), 0xfff2c0, 0.38, 8.86, 0.26, 0.4),
      ],
      x,
      z,
      0,
      1,
    );
  };
  const stack = (x, z, yaw, n) => {
    const P = [],
      cs = [0x7a5f35, 0x8b6c3c, 0x56603f, 0x6d6a60];
    for (let i = 0; i < n; i++) {
      const gx = (i % 3) * 1.35,
        gz = ((i / 3) | 0) * 1.35;
      P.push(
        part(bx(1.2, 1.1, 1.2), cs[i % 4], gx, 0.55, gz, 0, (i % 5) * 0.07),
        ...(i % 2 ? [part(bx(1.0, 0.9, 1.0), cs[(i + 1) % 4], gx, 1.55, gz, 0, 0.2)] : []),
      );
    }
    P.push(part(bx(4.4, 0.12, 2.8), 0x6e5a3a, 1.3, 0.06, 0.6));
    put(P, x, z, yaw, 1);
  };
  const drums = (x, z, yaw) => {
    const P = [],
      cs = [0x56603f, 0x8b4a2b, 0x3b5675, 0x56603f];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++) P.push(part(cyl(0.3, 0.3, 0.88, 10), cs[(i + j) % 4], i * 0.72, 0.44, j * 0.72));
    put(P, x, z, yaw, 1);
  };
  const veh = (t, x, z, yaw, k) => put(VM.parts(t), x, z, yaw, k);
  const lay = (cx, cz, o) => {
    fence(cx, cz, o.f[0], o.f[1], o.f[2], o.f[3]);
    [
      [o.f[0], o.f[2]],
      [o.f[1], o.f[2]],
      [o.f[1], o.f[3]],
      [o.f[0], o.f[3]],
    ].forEach((c) => tower(cx + c[0] + (c[0] < 0 ? 3 : -3), cz + c[1] + (c[1] < 0 ? 3 : -3)));
    o.fl.forEach((c) => {
      if (!nearRoad(cx + c[0], cz + c[1], 10)) flood(cx + c[0], cz + c[1]);
    });
    o.st.forEach((c) => {
      if (!nearRoad(cx + c[0], cz + c[1], 12)) stack(cx + c[0], cz + c[1], c[2], c[3]);
    });
    o.dr.forEach((c) => {
      if (!nearRoad(cx + c[0], cz + c[1], 12)) drums(cx + c[0], cz + c[1], c[2]);
    });
    o.v.forEach((c) => {
      if (!nearRoad(cx + c[1], cz + c[2], 10)) veh(c[0], cx + c[1], cz + c[2], c[3], c[4]);
    });
  };
  lay(DEPOT[0], DEPOT[1], {
    f: DEPF,
    fl: [
      [-120, -55],
      [-40, -30],
      [-60, 45],
      [-125, 95],
      [-5, 50],
      [-110, 5],
    ],
    st: [
      [-62, 18, 0.1, 9],
      [-118, -30, 0, 6],
      [-30, 60, 0.2, 6],
      [-70, 95, 0, 4],
    ],
    dr: [
      [-40, -60, 0.2],
      [-140, -40, 0],
      [-30, 25, 0.5],
    ],
    v: [
      ['supply', -48, 35, 0.4, 0.9],
      ['jeep', -30, -45, 2.2, 1.1],
      ['tanker', -118, -55, 1.4, 0.95],
      ['truck', -75, -35, -0.3, 0.9],
      ['jeep', -100, 40, 0.7, 1.1],
    ],
  });
  lay(BASE[0], BASE[1], {
    f: BASEF,
    fl: [
      [0, -40],
      [30, 30],
      [90, 0],
      [120, 95],
      [-25, 50],
      [95, -70],
    ],
    st: [
      [18, 60, 0, 6],
      [96, 12, 0.2, 9],
      [130, 20, 0, 4],
      [0, -62, 0.1, 6],
    ],
    dr: [
      [60, -60, 0],
      [100, -20, 0.3],
      [10, 30, 0.2],
    ],
    v: [
      ['apc', 20, -20, 0.5, 0.95],
      ['supply', 92, 0, 0.2, 0.9],
      ['jeep', 30, 40, 1.4, 1.1],
      ['truck', 100, -55, -0.5, 0.9],
      ['tank', 60, 35, 0.3, 0.95],
      ['jeep', -22, 70, 3, 1.1],
    ],
  });
  const g = acc.geometry();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
  scene.add(m);
  csTree(m);
}

