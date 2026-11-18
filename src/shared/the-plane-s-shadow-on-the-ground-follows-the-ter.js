/* ---------- the plane's shadow on the ground (follows the terrain, shrinks and fades with height) and wingtip vapour trails ---------- */
const SHT = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d'),
    S = 256 / 13,
    X = (x) => 128 + x * S,
    Z = (z) => 128 + z * S;
  const poly = (pts) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))));
    g.closePath();
  };
  const mir = (a) =>
    a.concat(
      a
        .slice()
        .reverse()
        .map((p) => [-p[0], p[1]]),
    );
  const fus = mir([
    [0, -4.7],
    [0.32, -4.2],
    [0.56, -3.2],
    [0.66, -1.8],
    [0.62, 0.2],
    [0.45, 2.3],
    [0.26, 4.1],
    [0.12, 5.0],
  ]);
  const wing = [
    [0, -2.14],
    [-5.5, -1.78],
    [-5.7, -1.3],
    [-5.64, -0.5],
    [-3.33, -0.12],
    [0, 0.5],
    [3.33, -0.12],
    [5.64, -0.5],
    [5.7, -1.3],
    [5.5, -1.78],
  ];
  const tail = [
    [-0.1, 2.9],
    [-2.0, 3.18],
    [-2.0, 4.0],
    [-0.12, 4.19],
    [0.12, 4.19],
    [2.0, 4.0],
    [2.0, 3.18],
    [0.1, 2.9],
  ];
  for (let k = 6; k >= 0; k--) {
    g.lineJoin = 'round';
    g.lineWidth = k * 3.2;
    g.strokeStyle = 'rgba(0,0,0,.07)';
    [fus, wing, tail].forEach((p) => {
      poly(p);
      g.stroke();
    });
  }
  g.fillStyle = '#000';
  [fus, wing, tail].forEach((p) => {
    poly(p);
    g.fill();
  });
  g.beginPath();
  g.arc(X(0), Z(-4.9), 1.6 * S, 0, 7);
  g.fillStyle = 'rgba(0,0,0,.2)';
  g.fill(); /* the spinning prop */
  return new THREE.CanvasTexture(c);
})();
const SHD = (() => {
  const gm = new THREE.PlaneGeometry(1, 1, 6, 6),
    m = new THREE.Mesh(
      gm,
      new THREE.MeshBasicMaterial({
        map: SHT,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
        color: 0x000000,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
    );
  m.frustumCulled = false;
  m.renderOrder = 2;
  scene.add(m);
  return { m, gm };
})();
function updShadow() {
  const on = started && !crashed && QL.t().shadow;
  SHD.m.visible = on;
  if (!on) return;
  const sun = CSH.sun,
    rx = sun.x / sun.y,
    rz = sun.z / sun.y;
  let gh = H(pos.x, pos.z),
    sx = pos.x,
    sz = pos.z;
  for (let i = 0; i < 3; i++) {
    sx = pos.x - rx * (pos.y - gh);
    sz = pos.z - rz * (pos.y - gh);
    gh = H(sx, sz);
  } /* the sun's ray through the plane meets the ground here */
  const h = Math.max(0, pos.y - gh);
  if (h > 3000) {
    SHD.m.visible = false;
    return;
  }
  const sc = 13 * (1 + h / 2600),
    ux = right.x * sc,
    uz = right.z * sc,
    vx = fwd.x * sc,
    vz = fwd.z * sc,
    p = SHD.gm.attributes.position;
  for (let j = 0; j <= 6; j++)
    for (let i = 0; i <= 6; i++) {
      const a = i / 6 - 0.5,
        b = 0.5 - j / 6,
        x = sx + ux * a + vx * b,
        z = sz + uz * a + vz * b;
      p.setXYZ(j * 7 + i, x, H(x, z) + 0.45, z);
    }
  p.needsUpdate = true;
  SHD.gm.computeBoundingSphere();
  SHD.m.material.opacity = 0.5 / (1 + h / 650);
}
