/* merge the plain meshes of a group into one mesh per material (fewer draw calls for small static detail) */
function mergeGroup(g) {
  const by = new Map();
  g.children.slice().forEach((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    o.updateMatrix();
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrix);
    if (!by.has(o.material)) by.set(o.material, []);
    by.get(o.material).push(geo);
    g.remove(o);
  });
  by.forEach((list, m) => {
    const n = list.reduce((a, q) => a + q.attributes.position.count, 0),
      P = new Float32Array(n * 3),
      N = new Float32Array(n * 3);
    let k = 0;
    list.forEach((q) => {
      P.set(q.attributes.position.array, k * 3);
      N.set(q.attributes.normal.array, k * 3);
      k += q.attributes.position.count;
      q.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.computeBoundingSphere();
    g.add(new THREE.Mesh(geo, m));
  });
}
let noseArtApply = null,
  noseTally = null;
