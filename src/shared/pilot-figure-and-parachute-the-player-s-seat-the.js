/* ---------- pilot figure and parachute: the player's seat, the bandits' cockpits and the descents ---------- */
function makePilot() {
  const g = new THREE.Group(),
    suit = new THREE.MeshLambertMaterial({ color: 0x59623f }),
    leath = new THREE.MeshLambertMaterial({ color: 0x6e4f30 }),
    skin = new THREE.MeshLambertMaterial({ color: 0xd0a070 }),
    gog = new THREE.MeshLambertMaterial({ color: 0x151515 }),
    lens = new THREE.MeshPhongMaterial({ color: 0x2a3d50, shininess: 90, specular: 0xaaaaaa }),
    pack = new THREE.MeshLambertMaterial({ color: 0x7b8460 });
  const mk = (geo, m, x, y, z, p = g) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };
  const sph = (r, m, x, y, z, p, sx = 1, sy = 1, sz = 1) => {
    const o = mk(new THREE.SphereGeometry(r, 14, 10), m, x, y, z, p);
    o.scale.set(sx, sy, sz);
    return o;
  };
  /* rounded limb: a tapered tube with a ball at each end, pointing along -z (dir 'z') or down (dir 'y') */
  const limb = (len, r0, r1, m, p, dir) => {
    const t = new THREE.CylinderGeometry(r0, r1, len, 12);
    if (dir === 'z') t.rotateX(Math.PI / 2).translate(0, 0, -len / 2);
    else t.translate(0, -len / 2, 0);
    mk(t, m, 0, 0, 0, p);
    sph(r0, m, 0, 0, 0, p);
    if (dir === 'z') sph(r1, m, 0, 0, -len, p);
    else sph(r1, m, 0, -len, 0, p);
  };
  /* torso: a tapered body with round shoulders, a rounded chest and seat, a parachute pack on the back. The upper body is its own group so the pilot can lean forward to the controls. */
  const up = new THREE.Group();
  g.add(up);
  mk(new THREE.CylinderGeometry(0.17, 0.14, 0.46, 16), suit, 0, 0.3, 0, up).scale.z = 0.72;
  sph(0.175, suit, 0, 0.5, 0, up, 1, 0.5, 0.72);
  sph(0.145, suit, 0, 0.08, 0, g, 1, 0.55, 0.75);
  sph(0.15, pack, 0, 0.28, 0.16, up, 1, 1.4, 0.55);
  const head = new THREE.Group();
  head.position.set(0, 0.66, 0);
  up.add(head);
  mk(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), skin, 0, -0.1, 0, head); /* neck */
  sph(0.1, skin, 0, 0, 0, head, 0.92, 1.05, 1);
  sph(0.115, leath, 0, 0.025, 0.01, head, 0.95, 0.9, 1.02); /* helmet */
  /* goggles: an elastic strap round the helmet and two round lenses on the face */
  mk(
    new THREE.CylinderGeometry(0.118, 0.118, 0.03, 20, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x151515, side: THREE.DoubleSide }),
    0,
    0.03,
    0.005,
    head,
  );
  [-1, 1].forEach((sd) => {
    sph(0.034, lens, sd * 0.045, 0.03, -0.108, head, 1, 1, 0.45);
    mk(new THREE.TorusGeometry(0.034, 0.007, 6, 14), gog, sd * 0.045, 0.03, -0.112, head);
  });
  const arms = [],
    elbs = [],
    legs = [];
  [-1, 1].forEach((sd) => {
    const a = new THREE.Group();
    a.position.set(sd * 0.2, 0.46, 0);
    up.add(a);
    limb(0.3, 0.055, 0.047, suit, a, 'z');
    const el = new THREE.Group(); /* the elbow: the forearm is its own bone, so a hand can reach a control */
    el.position.set(0, 0, -0.3);
    a.add(el);
    limb(0.3, 0.047, 0.04, suit, el, 'z');
    sph(0.05, leath, 0, 0, -0.31, el, 1, 0.9, 1.2); /* gloved hand */
    a.rotation.order = 'ZXY';
    arms.push(a);
    elbs.push(el);
    const l = new THREE.Group();
    l.position.set(sd * 0.09, 0.03, 0);
    g.add(l);
    limb(0.5, 0.085, 0.06, suit, l, 'z');
    const k = new THREE.Group();
    k.position.set(0, 0, -0.5);
    l.add(k);
    limb(0.5, 0.06, 0.045, suit, k, 'y');
    sph(0.06, leath, 0, -0.52, -0.04, k, 0.9, 0.7, 1.7); /* boot */
    legs.push([l, k]);
  });
  g.userData = { head, arms, elbs, legs, up };
  poseSit(g);
  return g;
}
function poseSit(g) {
  const u = g.userData;
  u.arms.forEach((a) => a.rotation.set(-0.6, 0, 0));
  u.elbs.forEach((e) => e.rotation.set(-0.35, 0, 0));
  u.up.rotation.x = 0;
  u.legs.forEach(([l, k]) => {
    l.rotation.x = 0;
    k.rotation.x = 0.9;
  });
}
function poseHang(g) {
  const u = g.userData;
  u.arms.forEach((a, i) => a.rotation.set(1.5, 0, i ? -0.45 : 0.45)); /* hands up on the risers */
  u.elbs.forEach((e) => e.rotation.set(0, 0, 0));
  u.up.rotation.x = 0;
  u.legs.forEach(([l, k]) => {
    l.rotation.x = -1.45;
    k.rotation.x = 1.25;
  });
}
