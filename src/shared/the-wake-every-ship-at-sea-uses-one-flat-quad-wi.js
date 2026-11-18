/* the wake every ship at sea uses: ONE flat quad with ONE shared painted texture (bow spray along the hull, a churned white trail, and two foam
   lines spreading back at the classic Kelvin angle). Drawn for a 78 m ship; k scales it to other lengths. */
let WAKE_MAT = null;
function shipWakeMesh(k, y) {
  const W = 512,
    Hh = 256,
    XB = 42,
    XL = 250,
    ZH = 32;
  if (!WAKE_MAT) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = Hh;
    const g2 = c.getContext('2d'),
      px = (x) => ((XB - x) / XL) * W,
      pz = (z) => (1 - (z + ZH) / (2 * ZH)) * Hh,
      blob = (x, z, r, a) => {
        const gx = px(x),
          gz = pz(z),
          rr = (r / XL) * W,
          gr = g2.createRadialGradient(gx, gz, 0, gx, gz, rr);
        gr.addColorStop(0, 'rgba(255,255,255,' + a + ')');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g2.fillStyle = gr;
        g2.fillRect(gx - rr, gz - rr, rr * 2, rr * 2);
      };
    for (let n = 0; n < 900; n++) {
      const x = -34 - Math.pow(Math.random(), 1.7) * 200,
        kk = (-34 - x) / 200,
        z = (Math.random() - 0.5) * (7 + 16 * kk) * (1 - 0.4 * kk);
      blob(x, z, 1.2 + Math.random() * 2.2, 0.5 * (1 - kk) * (1 - kk) + 0.04);
    }
    for (const sg of [1, -1])
      for (let n = 0; n < 420; n++) {
        const kk = Math.pow(Math.random(), 1.2),
          x = -30 - kk * 200,
          z = sg * (4.2 + (-30 - x) * 0.19) + (Math.random() - 0.5) * (1 + 2 * kk);
        if (Math.abs(z) < ZH - 1) blob(x, z, 0.9 + Math.random() * 1.4 + kk, 0.55 * (1 - kk) + 0.05);
      }
    for (const sg of [1, -1])
      for (let n = 0; n < 260; n++) {
        const kk = Math.random(),
          x = 38 - kk * 52,
          z = sg * (0.5 + 4.3 * Math.min(1, (38 - x) / 10) + Math.random() * (0.8 + 2.5 * kk));
        blob(x, z, 0.8 + Math.random() * 1.2, 0.55 * (1 - kk * kk));
      }
    for (const sg of [1, -1])
      for (let n = 0; n < 150; n++) {
        const kk = Math.random(),
          x = 30 - kk * 60,
          z = sg * (4.6 + kk * 11) + (Math.random() - 0.5) * 1.2;
        blob(x, z, 0.8 + Math.random(), 0.3 * (1 - kk));
      }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    WAKE_MAT = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.9 });
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute([XB, 0, -ZH, XB, 0, ZH, XB - XL, 0, -ZH, XB - XL, 0, ZH], 3));
  wg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 1, 1], 2));
  wg.setIndex([0, 2, 1, 1, 2, 3]);
  const wk = new THREE.Mesh(wg, WAKE_MAT);
  wk.scale.setScalar(k);
  wk.position.y = y;
  wk.frustumCulled = false;
  return wk;
}
let WSOCK = null;
{
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }),
    mk = (g, m, x, y, z) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      scene.add(o);
      return o;
    };
  const slab = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#74767a';
    x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = Math.random() < 0.5 ? 'rgba(40,42,46,.10)' : 'rgba(190,192,196,.10)';
      x.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    const o = x.createRadialGradient(70, 60, 2, 70, 60, 26);
    o.addColorStop(0, 'rgba(30,30,30,.09)');
    o.addColorStop(1, 'rgba(30,30,30,0)');
    x.fillStyle = o;
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = 'rgba(50,52,56,.55)';
    x.fillRect(0, 0, 128, 2);
    x.fillRect(0, 0, 2, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return (rx, ry) => {
      const u = t.clone();
      u.repeat.set(rx, ry);
      u.needsUpdate = true;
      return new THREE.MeshLambertMaterial({ map: u });
    };
  })();
  mk(
    new THREE.PlaneGeometry(150, 380).rotateX(-Math.PI / 2),
    slab(15, 38),
    -135,
    0.12,
    305,
  ); /* apron: 10 m slabs, now reaching the northern hangar */
  mk(new THREE.PlaneGeometry(40, 24).rotateX(-Math.PI / 2), slab(4, 2.4), -45, 0.13, 300); /* taxiway */
  for (let k = 0; k < 3; k++) {
    const z = 150 + k * 70,
      x = -190; /* arched hangars */
    mk(new THREE.BoxGeometry(24, 7, 40), lam(0x8a929a), x, 3.5, z);
    mk(
      new THREE.CylinderGeometry(12, 12, 40, 18, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).scale(1, 0.45, 1),
      lam(0x7b848c),
      x,
      7,
      z,
    );
    mk(new THREE.PlaneGeometry(15, 5.5), lam(0x23272b), x + 12.05, 2.8, z).rotation.y = Math.PI / 2;
  }
  const tw = new THREE.Group();
  tw.position.set(-95, 0, -120);
  scene.add(tw); /* control tower */
  [
    [new THREE.BoxGeometry(5, 14, 5), lam(0xb8bcc0), 0, 7, 0],
    [new THREE.BoxGeometry(9, 4, 9), lam(0x9aa0a6), 0, 16, 0],
    [
      new THREE.BoxGeometry(9.2, 2.4, 9.2),
      new THREE.MeshLambertMaterial({ color: 0x6fa0c0, transparent: true, opacity: 0.7 }),
      0,
      16.4,
      0,
    ],
    [new THREE.BoxGeometry(10.5, 0.6, 10.5), lam(0x2b2e32), 0, 18.6, 0],
  ].forEach((a) => {
    const o = new THREE.Mesh(a[0], a[1]);
    o.position.set(a[2], a[3], a[4]);
    tw.add(o);
  });
  mk(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), lam(0xdddddd), 32, 4, 300); /* windsock */
  WSOCK = mk(new THREE.ConeGeometry(0.65, 3.6, 12, 1, true).rotateZ(-Math.PI / 2), lam(0xff6a00), 34, 8, 300);
  FLG.mesh('us', 12, 3.4, 42, 300, 0, 0); /* the Stars and Stripes at Fletcher Field */
  const wb = new THREE.SphereGeometry(0.35, 6, 5),
    lights = new THREE.InstancedMesh(wb, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), 120),
    mt = new THREE.Matrix4();
  let n = 0; /* edge lights */
  for (let z = RW.zS - 10; z > RW.zN + 10 && n < 118; z -= 45)
    for (const x of [-27, 27]) {
      mt.setPosition(x, 0.4, z);
      lights.setMatrixAt(n++, mt);
    }
  lights.count = n;
  lights.frustumCulled = false;
  scene.add(lights);
  const bar = lam(0xf2f2f2);
  for (let i = -4; i <= 4; i++)
    for (const z of [RW.zS - 14, RW.zN + 14]) mk(new THREE.BoxGeometry(1.8, 0.05, 20), bar, i * 5, 0.2, z);
} /* threshold bars */
