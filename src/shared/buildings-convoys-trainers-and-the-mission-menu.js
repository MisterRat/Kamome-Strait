/* ---------- buildings, convoys, trainers and the mission menu ---------- */
Object.assign(SP, {
  warehouse: { s: [24, 8, 14], hp: 90, c: 0x8d9296, roof: 0x5b6065 },
  hq: { s: [16, 10, 12], hp: 140, c: 0xa89b84, roof: 0x6b4a3a },
  bunker: { s: [14, 4, 14], hp: 200, c: 0x6d7266, roof: 0x555a4c },
  jeep: { s: [1.9, 1.6, 3.6], hp: 5, c: 0x6b7050, cab: 1 },
  supply: { s: [2.6, 2.8, 6.5], hp: 8, c: 0x5a6840, cab: 1 },
  tanker: { s: [2.8, 3, 7], hp: 10, c: 0x9a9ea2, cab: 1 },
  apc: { s: [2.8, 2.4, 5.6], hp: 18, c: 0x4a5438 },
});
const BLD = [];
{
  const DP = [
      ['warehouse', -90, 70, 0],
      ['warehouse', -90, -10, 0],
      ['hq', -50, -70, 0],
      ['warehouse', -10, 80, 0],
      ['bunker', -130, 30, 0],
    ],
    BS = [
      ['hq', 70, 70, 0],
      ['warehouse', 70, -10, 0],
      ['warehouse', 110, 50, 0],
      ['bunker', 40, -80, 0],
      ['warehouse', -20, 85, 0],
      ['hq', 120, -40, 0],
    ];
  DP.forEach((a) => BLD.push(mkT(a[0], DEPOT[0] + a[1], DEPOT[1] + a[2], a[3], 'bld')));
  BS.forEach((a) => BLD.push(mkT(a[0], BASE[0] + a[1], BASE[1] + a[2], a[3], 'bld')));
  /* ground for each compound: a patch of packed earth with hard standing under the buildings, and gravel roads from the main road
     to every building. One textured mesh per compound, draped over the terrain; the canvas is 4 pixels to the metre. */
  const yard = (c, f, list) => {
    const m = 14,
      x0 = f[0] - m,
      z0 = f[2] - m,
      W = f[1] - f[0] + 2 * m,
      D = f[3] - f[2] + 2 * m,
      K = 4,
      cv2 = document.createElement('canvas');
    cv2.width = Math.round(W * K);
    cv2.height = Math.round(D * K);
    const g = cv2.getContext('2d'),
      X = (x) => (x - x0) * K,
      Y = (z) => (z - z0) * K;
    let sd = 777 + Math.round(c[0]);
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#6a5c44';
    g.fillRect(0, 0, cv2.width, cv2.height);
    for (let i = 0; i < 90; i++) {
      /* worn and darker patches */
      g.fillStyle = rnd() < 0.5 ? 'rgba(80,68,48,.25)' : 'rgba(120,104,76,.22)';
      g.beginPath();
      g.ellipse(rnd() * cv2.width, rnd() * cv2.height, 20 + rnd() * 70, 14 + rnd() * 40, rnd() * 3, 0, 7);
      g.fill();
    }
    /* roads are collected, then all the dark edges are drawn first and all the gravel on top, so an edge never cuts across a junction */
    const segs = [],
      gravel = (n, ax, az, bx, bz, w) => segs.push([n, ax, az, bx, bz, w]),
      drawRoads = () => {
        g.lineCap = 'butt';
        g.strokeStyle = 'rgba(70,62,46,.8)';
        for (const [, ax, az, bx, bz, w] of segs) {
          g.lineWidth = (w + 1.6) * K;
          g.beginPath();
          g.moveTo(X(ax), Y(az));
          g.lineTo(X(bx), Y(bz));
          g.stroke();
        }
        g.strokeStyle = '#8f8878';
        for (const [n, ax, az, bx, bz, w] of segs) {
          g.lineWidth = w * K;
          g.beginPath();
          g.moveTo(X(ax), Y(az));
          g.lineTo(X(bx), Y(bz));
          g.stroke();
          const len = Math.hypot(bx - ax, bz - az);
          for (let k = 0; k < n * len; k++) {
            const t = rnd(),
              o = (rnd() - 0.5) * w,
              px = ax + (bx - ax) * t + (-(bz - az) / len) * o,
              pz = az + (bz - az) * t + ((bx - ax) / len) * o,
              v = 110 + ((rnd() * 60) | 0);
            g.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + (v - 22) + ',.55)';
            g.fillRect(X(px), Y(pz), 2, 2);
          }
        }
      };
    /* hard standing under and around every building */
    for (const b of list) {
      const sz = SP[b[0]].s;
      g.save();
      g.translate(X(b[1]), Y(b[2]));
      g.rotate(-b[3]); /* the canvas turns the other way round from the scene's yaw */
      g.fillStyle = 'rgba(132,124,106,.92)';
      g.fillRect((-sz[0] / 2 - 4) * K, (-sz[2] / 2 - 4) * K, (sz[0] + 8) * K, (sz[2] + 8) * K);
      g.restore();
    }
    /* the main gravel road through the yard, joining the paved road at the reference point, and a branch to each building */
    const bxs = list.map((b) => b[1]),
      zs = 0 /* the main gravel road runs through the point where the paved road ends */,
      lo = Math.min(Math.min(...bxs) - 12, -8),
      hi = Math.max(Math.max(...bxs) + 12, 8);
    gravel(40, lo, zs, hi, zs, 6.5);
    /* the last stretch of the paved road, so the gravel follows it in and the two meet exactly */
    const near = RP.filter((r) => Math.hypot(r.x - c[0], r.z - c[1]) < 60);
    for (let i = 1; i < near.length; i++)
      gravel(40, near[i - 1].x - c[0], near[i - 1].z - c[1], near[i].x - c[0], near[i].z - c[1], 6.5);
    for (const b of list) {
      const e = SP[b[0]].s[2] / 2 + 3,
        zEnd = b[2] > zs ? b[2] - e : b[2] + e;
      gravel(40, b[1], zs, b[1], zEnd, 5);
    }
    drawRoads();
    /* grain, then soften the outer edge into the grass */
    for (let i = 0; i < 26000; i++) {
      const v = 70 + ((rnd() * 70) | 0);
      g.fillStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 28) + ',.35)';
      g.fillRect(rnd() * cv2.width, rnd() * cv2.height, 2, 2);
    }
    const im = g.getImageData(0, 0, cv2.width, cv2.height),
      fade = m * K * 0.9;
    for (let y = 0; y < cv2.height; y++)
      for (let x = 0; x < cv2.width; x++) {
        const d = Math.min(x, y, cv2.width - 1 - x, cv2.height - 1 - y),
          a = Math.min(1, d / fade);
        im.data[(y * cv2.width + x) * 4 + 3] = Math.round(255 * a * a * (3 - 2 * a));
      }
    g.putImageData(im, 0, 0);
    const tex = new THREE.CanvasTexture(cv2);
    tex.anisotropy = 8;
    const geo = new THREE.PlaneGeometry(W, D, Math.ceil(W / 6), Math.ceil(D / 6)).rotateX(-Math.PI / 2),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const wx = c[0] + x0 + W / 2 + p.getX(i),
        wz = c[1] + z0 + D / 2 + p.getZ(i);
      p.setXYZ(i, wx, H(wx, wz) + 0.3, wz);
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    scene.add(mesh);
  };
  yard(DEPOT, DEPF, DP);
  yard(BASE, BASEF, BS);
  for (const [Fz, Ff] of [[DEPOT, DEPF], [BASE, BASEF]]) FLG.mesh('jn', 12, 3.0, Fz[0] + Ff[0] + 18, Fz[1] + Ff[2] + 18, 0.5);
}
