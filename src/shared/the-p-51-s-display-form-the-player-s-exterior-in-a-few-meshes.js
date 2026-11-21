/* THE P-51D'S DISPLAY FORM (Phase 5): the player's exterior made from the player's own model, never built separately. The cockpit
   (ck), the pilot, the lights' glows and the aerial wire are left out (o.gear false: the landing gear too); everything else is
   merged into one mesh per material, texture coordinates kept for the decals. The propeller stays its own group so it can turn.
   P51DISP.make(o) -> { g, prop }: g in the frame of the player's `plane` group (nose toward -z), prop inside it, spun about its
   own z axis like the player's. Plain colours are folded into vertex colours (a few materials, a few draw calls). Copies share geometry and materials with the first one made (cheap), so make them freely.
   Built from the model as it stands, so the first call comes while the player's model is in its rest pose (load time). */
const P51DISP = (() => {
  /* the player's pilot, if he exists yet (only the P-51 game has him, and the parked form is made before he is) */
  const pilot = () => {
    try {
      return plPilot;
    } catch (e) {
      return null;
    }
  };
  const made = {};
  /* the plain-coloured materials fold into one vertex-coloured material per kind (type, shine, sides ...): its colour goes
     into the vertices, so a copy draws in a handful of calls; textured and see-through materials stay as they are */
  const KINDS = new Map();
  const kind = (m) => {
    if (m.map || m.alphaMap || m.transparent || !m.color) return m;
    const k = [m.type, m.shininess, m.specular && m.specular.getHex(), m.side, m.emissive && m.emissive.getHex(), m.flatShading, m.depthWrite].join('|');
    if (!KINDS.has(k)) {
      const c = m.clone();
      c.color = new THREE.Color(0xffffff);
      c.vertexColors = true;
      KINDS.set(k, c);
    }
    return KINDS.get(k);
  };
  const paint = (geo, m) => {
    const n = geo.attributes.position.count,
      C = new Float32Array(n * 3),
      old = m.vertexColors && geo.attributes.color;
    for (let i = 0; i < n; i++) {
      C[i * 3] = m.color.r * (old ? old.getX(i) : 1);
      C[i * 3 + 1] = m.color.g * (old ? old.getY(i) : 1);
      C[i * 3 + 2] = m.color.b * (old ? old.getZ(i) : 1);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
  };
  /* one geometry per material; a part mirrored by a negative scale has its triangles turned back to face out */
  const bake = (root, skip) => {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(),
      by = new Map(),
      M = new THREE.Matrix4();
    const walk = (o) => {
      if (!o.visible || skip.includes(o) || o.isSprite || o.isLine || o.isPoints) return;
      if (o.isMesh && o.geometry && !Array.isArray(o.material)) {
        const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        M.multiplyMatrices(inv, o.matrixWorld);
        geo.applyMatrix4(M);
        if (M.determinant() < 0)
          for (const k of ['position', 'normal', 'uv']) {
            const a = geo.attributes[k];
            if (!a) continue;
            const s = a.itemSize,
              A = a.array;
            for (let t = 0; t < a.count; t += 3)
              for (let c = 0; c < s; c++) {
                const i = (t + 1) * s + c,
                  j = (t + 2) * s + c,
                  x = A[i];
                A[i] = A[j];
                A[j] = x;
              }
          }
        const m = kind(o.material);
        if (m !== o.material) paint(geo, o.material);
        if (!by.has(m)) by.set(m, []);
        by.get(m).push([geo, o.renderOrder]);
      }
      for (const c of o.children) walk(c);
    };
    walk(root);
    const g = new THREE.Group();
    by.forEach((list, m) => {
      const n = list.reduce((a, [q]) => a + q.attributes.position.count, 0),
        uv = list.every(([q]) => q.attributes.uv),
        P = new Float32Array(n * 3),
        N = new Float32Array(n * 3),
        U = uv ? new Float32Array(n * 2) : null,
        col = list.every(([q]) => q.attributes.color),
        Cc = col ? new Float32Array(n * 3) : null;
      let k = 0;
      for (const [q] of list) {
        P.set(q.attributes.position.array, k * 3);
        if (q.attributes.normal) N.set(q.attributes.normal.array, k * 3);
        if (U) U.set(q.attributes.uv.array, k * 2);
        if (Cc) Cc.set(q.attributes.color.array, k * 3);
        k += q.attributes.position.count;
        q.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      if (U) geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      if (Cc) geo.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, m);
      mesh.renderOrder = Math.max(...list.map((x) => x[1]));
      g.add(mesh);
    });
    return g;
  };
  const first = (gearOn) => {
    const skip = [ck, prop];
    if (pilot()) skip.push(pilot());
    if (!gearOn) skip.push(gear);
    const body = bake(model, skip);
    body.position.copy(model.position);
    body.quaternion.copy(model.quaternion);
    body.scale.copy(model.scale);
    model.updateMatrix();
    prop.updateMatrix();
    const pr = bake(prop, []);
    pr.matrixAutoUpdate = true;
    pr.position.copy(prop.position).applyMatrix4(model.matrix);
    pr.quaternion.copy(model.quaternion).multiply(prop.quaternion);
    return { body, pr };
  };
  const copy = (src) => {
    const g = new THREE.Group();
    g.position.copy(src.position);
    g.quaternion.copy(src.quaternion);
    g.scale.copy(src.scale);
    for (const m of src.children) {
      const c = new THREE.Mesh(m.geometry, m.material);
      c.renderOrder = m.renderOrder;
      if (m.geometry.attributes.color && m.geometry.attributes.position.count > 3000) GX.far(c, 0.28) /* beyond 1 km its distant form */;
      g.add(c);
    }
    return g;
  };
  const make = (o) => {
    const k = o && o.gear === false ? 'up' : 'down';
    const F = made[k] || (made[k] = first(k === 'down'));
    const g = new THREE.Group(),
      prop2 = copy(F.pr);
    g.add(copy(F.body), prop2);
    return { g, prop: prop2 };
  };
  /* THE PARKED FORM: the same exterior as one vertex-coloured part (GX), for the scenery's static meshes. The texture overlays (nose
     art, soot, panel lines: the player's near detail) and the propeller's blur disc are left out, the canopy glass is made opaque,
     and the paint is the livery asked for: body (natural metal or olive drab) and trim (spinner, nose band). Sitting on its three
     wheels in the factory's three-point attitude (GEAR.sit), wheels on y = 0, nose toward +x (the scenery's frame).
     P51DISP.parts(body, trim, o) -> [part]   (o.air: gear up and level instead, for a tow plane; its thrust line at y = 1.4) */
  const GLASS = 0x2f4655,
    BODY = [metal.color.getHex(), metal2.color.getHex()],
    TRIM = red.color.getHex();
  const flat = {};
  const flatten = (gearOn) => {
    model.updateMatrix();
    const skip = [ck];
    if (pilot()) skip.push(pilot());
    if (!gearOn) skip.push(gear);
    const P = [],
      N = [],
      C = [],
      tag = [],
      col = new THREE.Color(),
      M = new THREE.Matrix4(),
      top = new THREE.Matrix4().copy(model.matrix);
    plane.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(plane.matrixWorld).invert();
    const walk = (o) => {
      if (!o.visible || skip.includes(o) || o.isSprite || o.isLine || o.isPoints) return;
      const m = o.material;
      if (o.isMesh && o.geometry && m && !Array.isArray(m) && !m.map && !(m.transparent && m.opacity < 0.3)) {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        M.multiplyMatrices(inv, o.matrixWorld);
        g.applyMatrix4(M);
        const pa = g.attributes.position.array,
          na = g.attributes.normal.array,
          old = m.vertexColors && g.attributes.color,
          hex = m.transparent ? GLASS : m.color.getHex(),
          flip = M.determinant() < 0;
        col.setHex(hex);
        for (let t = 0; t < g.attributes.position.count; t += 3)
          for (const i of flip ? [t, t + 2, t + 1] : [t, t + 1, t + 2]) {
            P.push(pa[i * 3], pa[i * 3 + 1], pa[i * 3 + 2]);
            N.push(na[i * 3], na[i * 3 + 1], na[i * 3 + 2]);
            if (old) C.push(col.r * old.getX(i), col.g * old.getY(i), col.b * old.getZ(i)), tag.push(0);
            else C.push(col.r, col.g, col.b), tag.push(hex);
          }
        g.dispose();
      }
      for (const c of o.children) walk(c);
    };
    walk(model);
    return { P, N, C, tag };
  };
  const parts = (body, trim, o) => {
    o = o || {};
    const k = o.air ? 'air' : 'park',
      F = flat[k] || (flat[k] = flatten(!o.air)),
      g = new THREE.BufferGeometry(),
      C = Float32Array.from(F.C),
      cb = new THREE.Color(body == null ? BODY[0] : body),
      ct = new THREE.Color(trim == null ? TRIM : trim),
      c0 = new THREE.Color(BODY[0]);
    for (let i = 0; i < F.tag.length; i++) {
      const h = F.tag[i];
      if (h === BODY[0] || h === BODY[1]) {
        const s = h === BODY[0] ? 1 : new THREE.Color(h).r / c0.r;
        C[i * 3] = cb.r * s;
        C[i * 3 + 1] = cb.g * s;
        C[i * 3 + 2] = cb.b * s;
      } else if (h === TRIM) {
        C[i * 3] = ct.r;
        C[i * 3 + 1] = ct.g;
        C[i * 3 + 2] = ct.b;
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(F.P, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(F.N, 3));
    /* nose -z to nose +x; parked: tail down on the three wheels, the main wheels' contact on y = 0 */
    const T = new THREE.Matrix4().makeRotationY(-Math.PI / 2);
    if (o.air) T.multiply(new THREE.Matrix4().makeTranslation(0, 1.4, 0));
    else {
      const a = GEAR.sit,
        y = GEAR.mainBottom * Math.cos(a) - GEAR.mainZ * Math.sin(a);
      T.multiply(new THREE.Matrix4().makeTranslation(0, -y, 0)).multiply(new THREE.Matrix4().makeRotationX(a));
    }
    return [{ g, vc: true, hex: 0xffffff, m: T }];
  };
  /* a parked copy as its own object (not merged into the scenery): a THREE.LOD of the parked form near and its distant form (GX.thin,
     cells of THIN m) beyond FAR_AT. Same frame as parts(). One vertex-coloured material for all. */
  const FAR_AT = 1000,
    THIN = 0.28,
    MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  const parked = (body, trim, o) => {
    const near = new GX.Acc().add(parts(body, trim, o)).geometry(),
      lod = new THREE.LOD();
    lod.addLevel(new THREE.Mesh(near, MAT), 0);
    lod.addLevel(new THREE.Mesh(GX.thin(near, THIN), MAT), FAR_AT);
    return lod;
  };
  return { make, parts, parked };
})();
