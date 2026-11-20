/* ---------- armament ---------- */
const gunLoc = [],
  AMMO0 = [380, 270, 270, 380, 270, 270];
let ammo = AMMO0.slice();
const gunT = [0, 0, 0, 0, 0, 0];
[-1, 1].forEach((sd) =>
  [2.3, 3.0, 3.7].forEach((ax) => {
    const x = sd * ax,
      zle = wzle(Math.min(1, ax / WSEMI)),
      y = wy(ax),
      zm =
        zle -
        0.3; /* zle = leading edge of the swept, tapered wing at this span: each muzzle sticks out .3 m ahead of it, so the row follows the wing */
    add(
      new THREE.CylinderGeometry(0.033, 0.033, 0.9, 10).rotateX(Math.PI / 2),
      dark,
      x,
      y,
      zm + 0.45,
    ); /* barrel, buried well inside the wing */
    add(
      new THREE.CylinderGeometry(0.055, 0.055, 0.06, 12).rotateX(Math.PI / 2),
      dark,
      x,
      y,
      zle + 0.02,
    ); /* gun-port fairing on the leading edge */
    add(
      new THREE.CylinderGeometry(0.046, 0.04, 0.08, 10).rotateX(Math.PI / 2),
      dark,
      x,
      y,
      zm + 0.03,
    ); /* muzzle brake */
    gunLoc.push(new V(x, y + 0.17, zm - 0.06));
  }),
);
const flashS = gunLoc.map((l) => {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffc060,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  s.scale.set(1.3, 1.3, 1);
  s.position.copy(l);
  s.position.y -= 0.17;
  s.visible = false;
  model.add(s);
  return s;
});
const rkMesh = [],
  ORD = [2, 5, 1, 4, 0, 3];
let rkN = 0,
  bmN = 0;
[-1, 1].forEach((sd) =>
  [3.7, 4.1, 4.5].forEach((x) =>
    rkMesh.push(
      add(
        new THREE.CylinderGeometry(0.07, 0.07, 1.7, 8).rotateX(Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0x5a6b3a }),
        sd * x,
        wy(x) - 0.27,
        wmid(x / WSEMI),
      ),
    ),
  ),
);
const bmMesh = [];
[-1, 1].forEach((sd) => {
  const m = add(
    new THREE.SphereGeometry(0.3, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b6f3a }),
    sd * 2.9,
    wy(2.9) - 0.55,
    wmid(2.9 / WSEMI),
  );
  m.scale.set(1, 1, 3.2);
  bmMesh.push(m);
});
const B = [],
  RK = [],
  BM = [],
  MAXB = 500,
  bpos = new Float32Array(MAXB * 6),
  bgeo = new THREE.BufferGeometry();
bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
bgeo.setDrawRange(0, 0);
const blines = new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: 0xffe27a, fog: false }));
blines.frustumCulled = false;
scene.add(blines);
