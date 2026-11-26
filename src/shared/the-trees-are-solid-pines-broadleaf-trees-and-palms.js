/* ---------- the trees are solid (PHYS.field): pines, broadleaf trees and palms, wherever they grow ----------
   There are far too many to hold as solids, so they are made solid only round what can strike them (an aircraft, a ship, a tank:
   PHYS's actives), a little ahead of it, and let go behind. Each tree is its trunk (a capsule from its foot to its crown, leaning
   with it) and the core of its crown (a ball a third of the crown's width), from the tree's own model and its size: brushing the
   tip of a frond is not a crash, flying into the tree is. Shrubs and trees under 3 m are left out (the ground is the gear's).
   The trees come from three places: the home map's pines and broadleaf trees (NT), its palms (the instanced buckets, TREEM), and
   every far-world chunk's trees as it is built (TREESRC, kept by the far world as chunks come and go). */
const TREESRC = new Set() /* the far world's tree sets now in the scene: { src: { key, mats, n, grid }, im } */;
{
  const DIM = new WeakMap(),
    M = new THREE.Matrix4(),
    V = THREE.Vector3;
  /* the size of a tree model: its height, its crown's width and centre (model frame) */
  const dims = (g) => {
    let d = DIM.get(g);
    if (d) return d;
    if (!g.boundingBox) g.computeBoundingBox();
    const b = g.boundingBox;
    d = { h: b.max.y, w: Math.max(b.max.x - b.min.x, b.max.z - b.min.z), cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2 };
    DIM.set(g, d);
    return d;
  };
  /* a tree's primitives from its model and its instance matrix (mats at o) */
  const tree = (g, mats, o) => () => {
    const d = dims(g);
    M.fromArray(mats, o);
    const sy = Math.hypot(mats[o + 4], mats[o + 5], mats[o + 6]),
      sx = Math.hypot(mats[o], mats[o + 1], mats[o + 2]),
      H = d.h * sy;
    if (H < 3) return null;
    const foot = new V(0, 0, 0).applyMatrix4(M),
      top = new V(d.cx, d.h * 0.62, d.cz).applyMatrix4(M),
      crown = new V(d.cx, d.h * 0.78, d.cz).applyMatrix4(M);
    return [
      { cap: [foot, top], r: Math.min(0.45, Math.max(0.15, 0.03 * H)) },
      { ball: crown, r: Math.max(0.5, 0.32 * d.w * sx) },
    ];
  };
  const ids = new WeakMap();
  let nid = 0;
  const idOf = (o) => ids.get(o) || (ids.set(o, ++nid), nid);
  /* every tree of a gridded source (mats, grid by NT.cell) within R of (x, z) */
  const grid = (sr, x, z, R, emit, key, geoAt) => {
    const C = NT.cell || 150,
      c0 = Math.floor((x - R) / C),
      c1 = Math.floor((x + R) / C),
      d0 = Math.floor((z - R) / C),
      d1 = Math.floor((z + R) / C),
      R2 = R * R,
      id = idOf(sr);
    for (let a = c0; a <= c1; a++)
      for (let b = d0; b <= d1; b++) {
        const l = sr.grid.get((a + 512) * 1024 + (b + 512));
        if (!l) continue;
        for (const i of l) {
          const o = i * 16,
            dx = sr.mats[o + 12] - x,
            dz = sr.mats[o + 14] - z;
          if (dx * dx + dz * dz < R2) emit(key + id + ':' + i, tree(geoAt(i), sr.mats, o));
        }
      }
  };
  if (typeof PHYS !== 'undefined')
    PHYS.field({
      name: 'TREE',
      kind: 'tree',
      near(x, z, R, emit) {
        /* the home map's pines and broadleaf trees */
        if (typeof NT !== 'undefined') for (const sp of NT.sp) if (sp.grid && sp.vars) grid(sp, x, z, R, emit, sp.key, (i) => sp.vars[i % 3].geometry);
        /* the far world's chunks (every kind but the shrubs) */
        if (typeof GEO !== 'undefined')
          for (const T of TREESRC) {
            const k = T.src.key;
            if (k !== 'shr' && GEO[k]) grid(T.src, x, z, R, emit, k, () => GEO[k]);
          }
        /* the home map's palms: instanced buckets */
        if (typeof TREEM !== 'undefined')
          for (const B of TREEM) {
            if (B.key !== 'palm') continue;
            const im = B.m,
              A = im.instanceMatrix.array,
              n = B.full || im.count;
            if (!B.box) {
              let x0 = 1e9,
                x1 = -1e9,
                z0 = 1e9,
                z1 = -1e9;
              for (let i = 0; i < n; i++) ((x0 = Math.min(x0, A[i * 16 + 12])), (x1 = Math.max(x1, A[i * 16 + 12])), (z0 = Math.min(z0, A[i * 16 + 14])), (z1 = Math.max(z1, A[i * 16 + 14])));
              B.box = [x0, x1, z0, z1];
            }
            const b = B.box;
            if (x + R < b[0] || x - R > b[1] || z + R < b[2] || z - R > b[3]) continue;
            const R2 = R * R,
              id = idOf(B);
            for (let i = 0; i < n; i++) {
              const dx = A[i * 16 + 12] - x,
                dz = A[i * 16 + 14] - z;
              if (dx * dx + dz * dz < R2) emit('palm' + id + ':' + i, tree(im.geometry, A, i * 16));
            }
          }
      },
    });
}
