/* THE P-51D'S DISPLAY FORM (Phase 5): the player's exterior made from the player's own model, never built separately. The cockpit
   (ck), the pilot, the lights' glows and the aerial wire are left out (o.gear false: the landing gear too); everything else is
   merged into one mesh per material, texture coordinates kept for the decals. The propeller stays its own group so it can turn.
   P51DISP.make(o) -> { g, prop }: g in the frame of the player's `plane` group (nose toward -z), prop inside it, spun about its
   own z axis like the player's. Copies share geometry and materials with the first one made (cheap), so make them freely.
   Built from the model as it stands, so the first call comes while the player's model is in its rest pose (load time). */
const P51DISP = (() => {
  const made = {};
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
        if (!by.has(o.material)) by.set(o.material, []);
        by.get(o.material).push([geo, o.renderOrder]);
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
        U = uv ? new Float32Array(n * 2) : null;
      let k = 0;
      for (const [q] of list) {
        P.set(q.attributes.position.array, k * 3);
        if (q.attributes.normal) N.set(q.attributes.normal.array, k * 3);
        if (U) U.set(q.attributes.uv.array, k * 2);
        k += q.attributes.position.count;
        q.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      if (U) geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, m);
      mesh.renderOrder = Math.max(...list.map((x) => x[1]));
      g.add(mesh);
    });
    return g;
  };
  const first = (gearOn) => {
    const skip = [ck, plPilot, prop];
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
  return { make };
})();
