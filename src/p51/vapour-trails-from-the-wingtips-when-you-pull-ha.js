/* vapour trails from the wingtips when you pull hard at speed */
const VT = (() => {
  const N = 150,
    LIFE = 3.4,
    c = document.createElement('canvas');
  c.width = 32;
  c.height = 64;
  const g = c.getContext('2d'),
    im = g.createImageData(32, 64);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 32; x++) {
      const u = x / 31,
        v = y / 63,
        a = Math.pow(Math.sin(u * Math.PI), 0.9) * Math.pow(1 - v, 0.85) * Math.min(1, v * 6 + 0.35),
        o = (y * 32 + x) * 4;
      im.data[o] = 240;
      im.data[o + 1] = 246;
      im.data[o + 2] = 255;
      im.data[o + 3] = Math.round(a * 255);
    }
  g.putImageData(im, 0, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0.9,
  });
  const tr = [-1, 1].map((s) => {
    const gm = new THREE.BufferGeometry(),
      pa = new Float32Array(N * 6),
      ua = new Float32Array(N * 4),
      idx = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    gm.setAttribute('position', new THREE.BufferAttribute(pa, 3));
    gm.setAttribute('uv', new THREE.BufferAttribute(ua, 2));
    gm.setIndex(idx);
    const m = new THREE.Mesh(gm, mat);
    m.frustumCulled = false;
    m.renderOrder = 3;
    m.visible = false;
    scene.add(m);
    return { s, m, gm, pa, ua, pts: [] };
  });
  return { N, LIFE, tr };
})();
const _vt = new V(),
  _vc = new V(),
  _vs = new V(),
  _vq = new V();
function updTrails(dt) {
  const now = performance.now() / 1000,
    spd = vel.length(),
    agl = pos.y - 2 - H(pos.x, pos.z);
  const inten =
    started && !crashed && agl > 25
      ? Math.min(1, Math.max(0, (gF - 2.4) / 2.2)) * Math.min(1, Math.max(0, (spd - 55) / 40))
      : 0;
  VT.tr.forEach((t) => {
    const P = t.pts;
    if (inten > 0.03) {
      _vt.set(t.s * 5.5, 0.33, 0.4);
      model.localToWorld(_vt);
      const l = P[P.length - 1];
      if (l && Math.hypot(_vt.x - l.x, _vt.y - l.y, _vt.z - l.z) > 120) P.length = 0;
      if (
        !P.length ||
        Math.hypot(_vt.x - P[P.length - 1].x, _vt.y - P[P.length - 1].y, _vt.z - P[P.length - 1].z) >
          Math.max(1.6, spd * 0.026)
      )
        P.push({ x: _vt.x, y: _vt.y, z: _vt.z, w: inten, t: now });
    }
    while (P.length && (now - P[0].t > VT.LIFE || P.length > VT.N - 1)) P.shift();
    const Q = inten > 0.03 ? P.concat([{ x: _vt.x, y: _vt.y, z: _vt.z, w: inten, t: now }]) : P,
      n = Q.length; /* the newest vertex always sits on the wingtip itself */
    if (n < 2) {
      t.m.visible = false;
      return;
    }
    t.m.visible = true;
    for (let i = 0; i < VT.N; i++) {
      const k = Math.min(i, n - 1),
        pt = Q[n - 1 - k],
        pa = Q[Math.min(n - 1, n - k)],
        pb = Q[Math.max(0, n - 2 - k)],
        age = now - pt.t,
        f = age / VT.LIFE;
      _vq.set(pa.x - pb.x, pa.y - pb.y, pa.z - pb.z);
      if (_vq.lengthSq() < 1e-6) _vq.set(0, 0, -1);
      _vc.set(cam.position.x - pt.x, cam.position.y - pt.y, cam.position.z - pt.z);
      _vs.crossVectors(_vq, _vc).normalize();
      const hw = i < n ? (0.3 + age * 0.95) * pt.w * Math.max(0, 1 - Math.pow(f, 2.2)) : 0;
      t.pa[i * 6] = pt.x - _vs.x * hw;
      t.pa[i * 6 + 1] = pt.y - _vs.y * hw;
      t.pa[i * 6 + 2] = pt.z - _vs.z * hw;
      t.pa[i * 6 + 3] = pt.x + _vs.x * hw;
      t.pa[i * 6 + 4] = pt.y + _vs.y * hw;
      t.pa[i * 6 + 5] = pt.z + _vs.z * hw;
      const v = i < n ? Math.min(1, f) : 1;
      t.ua[i * 4] = 0;
      t.ua[i * 4 + 1] = v;
      t.ua[i * 4 + 2] = 1;
      t.ua[i * 4 + 3] = v;
    }
    t.gm.attributes.position.needsUpdate = true;
    t.gm.attributes.uv.needsUpdate = true;
  });
}
