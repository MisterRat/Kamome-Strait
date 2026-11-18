/* a road that ends on another road stops at that road's edge instead of running into it */
function trimRoad(L) {
  const out = L.slice(),
    others = [RP, RP2, RP3, RSPUR].filter((Y) => Y !== L),
    dseg = (Y, x, z) => {
      let m = 1e9;
      for (let i = 0; i < Y.length - 1; i++) {
        const ax = Y[i].x,
          az = Y[i].z,
          bx = Y[i + 1].x - ax,
          bz = Y[i + 1].z - az,
          t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz || 1)));
        m = Math.min(m, Math.hypot(x - ax - bx * t, z - az - bz * t));
      }
      return m;
    };
  for (const end of [0, 1]) {
    const get = () => (end ? out[out.length - 1] : out[0]);
    let Yh = null;
    for (const Y of others) {
      let bi = -1,
        bd = 24;
      const e = get();
      for (let i = 3; i < Y.length - 3; i++) {
        const d = Math.hypot(Y[i].x - e.x, Y[i].z - e.z);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      }
      if (bi >= 0) Yh = Y;
    }
    if (!Yh) continue;
    let last = null;
    while (out.length > 3 && dseg(Yh, get().x, get().z) < 5.6) last = end ? out.pop() : out.shift();
    if (!last) continue;
    const k = get();
    let lo = 0,
      hi = 1;
    for (let it = 0; it < 14; it++) {
      const m = (lo + hi) / 2;
      if (dseg(Yh, k.x + (last.x - k.x) * m, k.z + (last.z - k.z) * m) < 5.6) hi = m;
      else lo = m;
    }
    const p = new THREE.Vector3(k.x + (last.x - k.x) * lo, 0, k.z + (last.z - k.z) * lo);
    if (end) out.push(p);
    else out.unshift(p);
  }
  return out;
}
for (const RPL of [RP, RP2, RP3, RSPUR]) {
  const RPX = trimRoad(RPL);
  const n = RPX.length,
    P = new Float32Array(n * 6),
    UV = new Float32Array(n * 4),
    NR = new Float32Array(n * 6),
    idx = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const p = RPX[i],
      a = RPX[Math.max(0, i - 1)],
      b = RPX[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x,
      dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    if (i > 0) s += Math.hypot(p.x - RPX[i - 1].x, p.z - RPX[i - 1].z);
    [-1, 1].forEach((k, j) => {
      const x = p.x - dz * 5.5 * k,
        z = p.z + dx * 5.5 * k,
        o = i * 2 + j;
      P.set([x, HMESH(x, z) + 0.4, z], o * 3);
      NR.set([0, 1, 0], o * 3);
      UV.set([j, s / 14], o * 2);
    });
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(NR, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  g.setIndex(idx);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#3b3d40';
  x.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 500; i++) {
    const v = (50 + Math.random() * 30) | 0;
    x.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
    x.fillRect(Math.random() * 64, Math.random() * 128, 2, 2);
  }
  x.fillStyle = '#d8d8cc';
  x.fillRect(4, 0, 3, 128);
  x.fillRect(57, 0, 3, 128);
  x.fillStyle = '#e0c050';
  x.fillRect(30, 0, 4, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  const rm = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  g.computeBoundingSphere();
  rm.frustumCulled = RPL !== RP;
  scene.add(rm);
}

