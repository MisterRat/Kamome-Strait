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
function GROUNDAT(x, z, w, d, yaw, tilt, gf, h) {
  const G = gf || H,
    c = Math.cos(yaw || 0),
    s = Math.sin(yaw || 0),
    at = (lx, lz) => G(x + c * lx + s * lz, z - s * lx + c * lz),
    a = w / 2,
    b = d / 2;
  if (!tilt) return { y: Math.min(G(x, z), at(a, b), at(-a, b), at(a, -b), at(-a, -b)), rx: 0, rz: 0 };
  /* the plane through the four wheel points; then the body, turned exactly as it will be drawn (Euler YXZ about its
     centre, h/2 above the bottom), is lifted until no point of its underside (a 3 x 5 grid over the wheelbase and track) is below the ground */
  const wa = a * 0.85,
    wb = b * 0.75 /* where the wheels or tracks touch: inset from the bumpers and the sides */,
    fr = at(wa, wb),
    fl = at(-wa, wb),
    br = at(wa, -wb),
    bl = at(-wa, -wb),
    rx = -Math.atan((fr + fl - br - bl) / (4 * wb)),
    rz = Math.atan((fr + br - fl - bl) / (4 * wa)),
    hh = (h || 0) / 2,
    R = GROUNDAT.R || (GROUNDAT.R = { e: new THREE.Euler(), v: new THREE.Vector3() });
  R.e.set(rx, yaw || 0, rz, 'YXZ');
  let y = -Infinity;
  for (const lx of [-wa, 0, wa])
    for (const lz of [-wb, -wb / 2, 0, wb / 2, wb]) {
      const v = R.v.set(lx, -hh, lz).applyEuler(R.e);
      y = Math.max(y, G(x + v.x, z + v.z) - v.y - hh);
    }
  return { y, rx, rz };
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
    _l = rc.layers.enableAll() /* a far site's meshes are kept off the camera's layer while it is far away: they still count */,
    o = new THREE.Vector3(),
    dn = new THREE.Vector3(0, -1, 0),
    hit = [];
  /* is m a surface: a decal (polygon offset) or a thin flat plate laid over the ground, or one marked userData.surface? Hidden ones count
     too (a far site's apron is hidden while it is far away, and what stands on it is placed then) */
  const isSurf = (m) => {
    if (!m.isMesh || m.isInstancedMesh) return false;
    const mt = m.material;
    if (!mt || Array.isArray(mt) || mt.transparent || mt.type === 'ShaderMaterial') return false;
    const g = m.geometry;
    /* measured afresh: a draped apron's vertices are moved after it is made, and a stale bounding sphere hides it from the ray */
    g.computeBoundingBox();
    g.computeBoundingSphere();
    m.updateMatrixWorld(true);
    const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld),
      sx = b.max.x - b.min.x,
      sz = b.max.z - b.min.z;
    if (sx > 50000) return false; /* the open-sea plane */
    return !!(m.userData.surface || (mt.polygonOffset && Math.max(sx, sz) > 4) || (b.max.y - b.min.y < 0.6 && Math.max(sx, sz) > 6));
  };
  /* the world is built a piece at a time (into groups as well as the scene) and things are placed on it as it goes: every object added
     anywhere is noted (Object3D.add), and before a look the new ones that now hang in the scene are checked for surfaces (the cache is
     cleared if there are any); taken out of the scene, a surface no longer counts */
  const NEW = [];
  {
    const add0 = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function (...a) {
      for (const o of a) if (o && (o.isMesh || (o.children && o.children.length) || o.isGroup)) NEW.push(o);
      if (NEW.length > 20000) NEW.splice(0, 10000);
      return add0.apply(this, a);
    };
  }
  const inScene = (o) => {
    while (o.parent) o = o.parent;
    return o === scene;
  };
  const gather = () => {
    L = [];
    NEW.length = 0;
    scene.traverse((m) => isSurf(m) && L.push(m));
  };
  const sync = () => {
    if (!NEW.length) return;
    let added = false;
    const keep = [];
    for (const o of NEW) {
      if (!inScene(o)) {
        if (!o.parent) keep.push(o); /* not hung anywhere yet: look again later */
        continue;
      }
      o.traverse((m) => isSurf(m) && !L.includes(m) && (L.push(m), (added = true)));
    }
    NEW.length = 0;
    NEW.push(...keep.slice(-5000));
    if (added) C.clear();
  };
  const f = (x, z) => {
    const h0 = H(x, z);
    if (h0 <= SEA.PAINT + 0.01) return h0;
    const k = Math.round(x) * 1000003 + Math.round(z);
    /* the cache keeps how far the surface lies above the ground in each 1 m cell, not a height: on a slope a height would be wrong
       by up to half a metre's rise elsewhere in the cell */
    if (L) sync();
    const c = C.get(k);
    if (c !== undefined) return h0 + c;
    let h;
    if (!L) gather();
    rc.set(o.set(x, h0 + 6, z), dn);
    rc.far = 7;
    hit.length = 0;
    rc.intersectObjects(L, false, hit);
    for (let i = hit.length - 1; i >= 0; i--) if (!inScene(hit[i].object)) hit.splice(i, 1); /* taken away since */
    h = h0;
    for (const q of hit) if (q.point.y > h0 - 0.4) h = Math.max(h, q.point.y);
    C.set(k, h - h0);
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
        gA = GROUNDAT(t.m.position.x, t.m.position.z, g.w, g.d, g.ry, g.tilt, f, g.h);
      t.m.position.y = gA.y + g.h / 2;
      t.m.rotation.set(gA.rx, g.ry, gA.rz, 'YXZ');
      t.m.updateMatrix();
      t.m.updateMatrixWorld(true);
      t.y0 = t.m.position.y;
    }
    /* the ground-fire guns and searchlights (groups whose origin is 1.5 m above their floor): onto any pad laid after them */
    if (typeof AA !== 'undefined')
      for (const g of AA.gun.concat(AA.lamp)) {
        if (g.ship || !g.grp || !g.grp.parent) continue;
        const P = g.grp.position,
          dy = f(P.x, P.z) + 1.5 - P.y;
        if (Math.abs(dy) < 0.005) continue;
        P.y += dy;
        if (g.piv) g.piv.y += dy;
        if (g.p) g.p.y += dy;
        if (g.t && g.t.m === g.grp) g.t.y0 = P.y;
        g.grp.updateMatrixWorld(true);
      }
  };
  return f;
})();
HM_OK = SEG === 260; /* from here on H is the drawn ground (HMC is sized for the 260-cell grid) */
const tg = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG);
tg.rotateX(-Math.PI / 2);
const terrU = { uTime: { value: 0 } };
