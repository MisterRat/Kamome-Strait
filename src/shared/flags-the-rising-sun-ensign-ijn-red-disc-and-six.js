/* ---------- flags: the Rising Sun ensign (IJN: red disc and sixteen rays), the plain Hinomaru (merchant ships, civil harbours) and the Stars and Stripes (US).
   A flag hangs from its hoist at the origin: x runs along the fly, y down. pole() is a white staff with the flag at its head; mesh() drops one on the ground. ---------- */
const FLG = (() => {
  const { cyl, bx, part, xf, M4 } = GX,
    WHT = 0xf2efe6,
    RED = 0xbc002d,
    USR = 0xb22234,
    USB = 0x3c3b6e,
    RATIO = { jn: 1.5, jp: 1.5, us: 1.9 };
  const rays = (w, h, cx) => {
    const pos = [],
      idx = [],
      cy = -h / 2,
      dl = Math.PI / 32,
      zf = 0.013,
      L = (a) => {
        const c = Math.cos(a),
          s = Math.sin(a);
        return Math.min(c > 1e-6 ? (w - cx) / c : c < -1e-6 ? -cx / c : 1e9, s > 1e-6 ? h / 2 / s : s < -1e-6 ? -h / 2 / s : 1e9);
      };
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        a0 = a - dl,
        a1 = a + dl,
        l0 = L(a0),
        l1 = L(a1),
        x0 = cx + l0 * Math.cos(a0),
        y0 = cy + l0 * Math.sin(a0),
        x1 = cx + l1 * Math.cos(a1),
        y1 = cy + l1 * Math.sin(a1),
        b = i * 6;
      pos.push(cx, cy, zf, x0, y0, zf, x1, y1, zf, cx, cy, -zf, x1, y1, -zf, x0, y0, -zf);
      idx.push(b, b + 1, b + 2, b + 3, b + 4, b + 5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const make = (kind, w) => {
    const h = w / RATIO[kind],
      P = [];
    if (kind === 'us') {
      const sh = h / 13;
      for (let i = 0; i < 13; i++) P.push(part(bx(w, sh * 1.002, 0.02), i % 2 ? WHT : USR, w / 2, -sh * (i + 0.5), 0));
      const cw = w * 0.4,
        ch = sh * 7;
      P.push(part(bx(cw, ch, 0.03), USB, cw / 2, -ch / 2, 0));
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) P.push(part(bx(cw * 0.07, cw * 0.07, 0.036), WHT, cw * (0.2 + c * 0.3), -ch * (0.2 + r * 0.3), 0));
    } else {
      const cx = kind === 'jn' ? w * 0.42 : w / 2;
      P.push(part(bx(w, h, 0.02), WHT, w / 2, -h / 2, 0));
      P.push(part(cyl(h * 0.3, h * 0.3, 0.034, 20), RED, cx, -h / 2, 0, Math.PI / 2));
      if (kind === 'jn') P.push(part(rays(w, h, cx), RED, 0, 0, 0));
    }
    return P;
  };
  const on = (P, T) => P.map((q) => ({ g: q.g, hex: q.hex, m: new M4().multiplyMatrices(T, q.m) }));
  /* a flag alone, hoist at (x, y, z), streaming toward yaw */
  const at = (kind, w, x, y, z, yaw) => on(make(kind, w), xf(x, y, z, yaw || 0));
  /* a staff H metres tall standing at (x, y, z) with the flag at its head */
  const pole = (kind, H, w, x, y, z, yaw) => {
    const P = [part(cyl(0.05 + H * 0.004, 0.08 + H * 0.006, H, 6), 0xe4e2da, 0, H / 2, 0), part(GX.sph(6), 0xc9a24a, 0, H + 0.1, 0, 0, 0, 0, 0.1, 0.1, 0.1)];
    return on(P.concat(on(make(kind, w), xf(0.07, H - 0.12, 0, 0))), xf(x, y, z, yaw || 0));
  };
  const mesh = (kind, H, w, x, z, yaw, y) => {
    const m = new THREE.Mesh(new GX.Acc().add(pole(kind, H, w, 0, 0, 0, 0), xf(x, y === undefined ? H_(x, z) : y, z, yaw || 0)).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
    scene.add(m);
    return m;
  };
  const H_ = (x, z) => H(x, z);
  /* a staff with its flag as a free mesh (not in the scene), for fixing to a moving model */
  const flagOnly = (kind, w, x, y, z, yaw) => new THREE.Mesh(new GX.Acc().add(make(kind, w), xf(x, y, z, yaw || 0)).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
  return { make, at, pole, mesh, flagOnly };
})();

