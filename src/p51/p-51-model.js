/* ---------- P-51 model ---------- */
const plane = new THREE.Group(),
  model = new THREE.Group();
plane.add(model);
scene.add(plane);
model.position.y = 0.17;
const PH = (c, s = 70, sp = 0x777777, ds = false) => {
  const m = new THREE.MeshPhongMaterial({ color: c, shininess: s, specular: sp });
  if (ds) m.side = THREE.DoubleSide;
  return m;
};
const metal = PH(0xc3c8cd, 85, 0xb0b0b0, true),
  metal2 = PH(0xa9afb5, 60, 0x888888, true),
  dark = new THREE.MeshLambertMaterial({ color: 0x1d1d1f }),
  red = PH(0xc8201c, 50, 0x666666, true),
  olive = new THREE.MeshLambertMaterial({ color: 0x4a5230, side: THREE.DoubleSide }),
  soot = new THREE.MeshLambertMaterial({ color: 0x3a3430 }),
  zchrom = new THREE.MeshLambertMaterial({ color: 0x56633a, side: THREE.DoubleSide }),
  glass = new THREE.MeshPhongMaterial({
    color: 0x9ccbe8,
    transparent: true,
    opacity: 0.4,
    shininess: 120,
    specular: 0xffffff,
    depthWrite: false,
  });
const add = (g, m, x, y, z, p = model) => {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  p.add(o);
  return o;
};
/* the nose art: the insignia piece sets these once the fuselage is built; the nose-art options piece calls them */
let noseArtApply = null,
  noseTally = null;
