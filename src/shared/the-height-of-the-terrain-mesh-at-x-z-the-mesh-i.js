/* the height of the terrain MESH at x, z (the mesh is a 100 m grid of triangles, so on a crest it sits below the true height HR);
   trees and rocks stand on this so they do not float */
const HMC = new Float32Array(261 * 261).fill(NaN); /* the home mesh's node heights, worked out once each as they are asked for */
function HMESH(x, z) {
  if (x < -13000 || x > 13000 || z < -13000 || z > 13000) {
    try {
      return WORLD.hm(x, z);
    } catch (e) {
      return Math.max(WH(x, z), SEA.PAINT); /* before the far world is set up */
    }
  }
  const u = Math.max(0, Math.min(SEG - 1e-6, ((x + SZ / 2) / SZ) * SEG)),
    v = Math.max(0, Math.min(SEG - 1e-6, ((z + SZ / 2) / SZ) * SEG)),
    i = Math.floor(u),
    j = Math.floor(v),
    fx = u - i,
    fz = v - j,
    q = (a, b) => {
      const k = a * (SEG + 1) + b;
      let h = HMC[k];
      if (h !== h) h = HMC[k] = Math.max(HR((a / SEG - 0.5) * SZ, (b / SEG - 0.5) * SZ), SEA.PAINT);
      return h;
    },
    ha = q(i, j),
    hb = q(i, j + 1),
    hc = q(i + 1, j + 1),
    hd = q(i + 1, j);
  return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
}
/* lay a ground object on the drawn ground: footprint w along its local x by d along its local z, turned by yaw (three.js rotation.y).
   Returns { y, rx, rz }: y the base height: for a building (tilt false) the lowest of its centre and corners, so no corner hangs in
   the air on a slope (the uphill side stands in the ground, as on a cut platform); for a vehicle (tilt true) the height under its
   middle with rx, rz the pitch and roll that lay it along the slope (Euler order 'YXZ', yaw first) */
function GROUNDAT(x, z, w, d, yaw, tilt, gf) {
  const G = gf || H,
    c = Math.cos(yaw || 0),
    s = Math.sin(yaw || 0),
    at = (lx, lz) => G(x + c * lx + s * lz, z - s * lx + c * lz),
    a = w / 2,
    b = d / 2;
  if (!tilt) return { y: Math.min(G(x, z), at(a, b), at(-a, b), at(a, -b), at(-a, -b)), rx: 0, rz: 0 };
  const hf = at(0, b * 0.8),
    hb = at(0, -b * 0.8),
    hr = at(a * 0.8, 0),
    hl = at(-a * 0.8, 0);
  return { y: Math.max(G(x, z), (hf + hb) / 2, (hl + hr) / 2), rx: -Math.atan2(hf - hb, 1.6 * b), rz: Math.atan2(hr - hl, 1.6 * a) };
}
/* SURF(x, z): the height of the SURFACE a vehicle or a man stands on: the topmost road, runway, apron, Marston mat, yard, pad or quay
   laid over the ground there, else the drawn ground (H). The surfaces are the meshes drawn over the ground as decals (polygon offset)
   and the thin flat plates (a runway, an apron); they are gathered the first time it is asked (after the world is built; SURF.reset()
   gathers them again) and each 1 m cell is measured once, with a ray straight down. SURF.settle() puts every target that stands on the
   ground (mkT: vehicles and buildings) back down on the surfaces, once, after they have all been built. */
const SURF = (() => {
  let L = null;
  const C = new Map(),
    rc = new THREE.Raycaster(),
    o = new THREE.Vector3(),
    dn = new THREE.Vector3(0, -1, 0),
    hit = [];
  const gather = () => {
    L = [];
    scene.updateMatrixWorld(true);
    scene.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.visible) return;
      const mt = m.material;
      if (!mt || Array.isArray(mt) || mt.transparent || mt.type === 'ShaderMaterial') return;
      const g = m.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld),
        sx = b.max.x - b.min.x,
        sz = b.max.z - b.min.z;
      if (sx > 50000) return; /* the open-sea plane */
      if (m.userData.surface || (mt.polygonOffset && Math.max(sx, sz) > 4) || (b.max.y - b.min.y < 0.6 && Math.max(sx, sz) > 6)) L.push(m);
    });
  };
  const f = (x, z) => {
    const h0 = H(x, z);
    if (h0 <= SEA.PAINT + 0.01) return h0;
    const k = Math.round(x) * 1000003 + Math.round(z);
    let h = C.get(k);
    if (h !== undefined) return h;
    if (!L) gather();
    rc.set(o.set(x, h0 + 6, z), dn);
    rc.far = 7;
    hit.length = 0;
    rc.intersectObjects(L, false, hit);
    h = h0;
    for (const q of hit) if (q.point.y > h0 - 0.4) h = Math.max(h, q.point.y);
    C.set(k, h);
    return h;
  };
  f.reset = () => ((L = null), C.clear());
  let settled = false;
  f.settle = () => {
    if (settled || typeof T === 'undefined') return;
    settled = true;
    f.reset(); /* everything is built now: gather every surface */
    for (const t of T) if (t.gnd && !t.dead) {
      const g = t.gnd,
        gA = GROUNDAT(t.m.position.x, t.m.position.z, g.w, g.d, g.ry, g.tilt, f);
      t.m.position.y = gA.y + g.h / 2;
      t.m.rotation.set(gA.rx, g.ry, gA.rz, 'YXZ');
      t.m.updateMatrix();
      t.m.updateMatrixWorld(true);
    }
  };
  return f;
})();
HM_OK = SEG === 260; /* from here on H is the drawn ground (HMC is sized for the 260-cell grid) */
const tg = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG);
tg.rotateX(-Math.PI / 2);
const terrU = { uTime: { value: 0 } };
