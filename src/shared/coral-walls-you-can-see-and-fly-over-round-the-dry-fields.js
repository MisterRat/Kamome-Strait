/* coral walls you can see and fly over: rough walls of coral blocks round the dry fields that lie near the road (the user's, 2026-11-23:
   the Pacific, not Normandy: these were leafy hedgerows). 1.0-1.5 m high, 0.6-0.8 m thick, pale grey-cream coral with dark joints */
/* CORAL: the wall itself, shared: the home map's walls below and the battle area's (BA) round the far world's fields are built the same way.
   CORAL.mesh(items, H, sphere): items [x, z, yaw, length, height, thickness, shade], each standing on the lowest of H() under its ends
   and middle; sphere (THREE.Sphere) holds them all, for culling; returns the InstancedMesh (not yet in the scene). CORAL.LEN: a block's length. */
const CORAL = (() => {
  const lc = document.createElement('canvas');
  lc.width = lc.height = 64;
  const lg = lc.getContext('2d');
  lg.fillStyle = '#4a4a42'; /* the joints */
  lg.fillRect(0, 0, 64, 64);
  let sd = 5;
  const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  /* courses of rough blocks, each a little different in size and shade, pitted */
  for (let y = 0; y < 64; y += 11) {
    let x = -rn() * 10;
    while (x < 64) {
      const w = 9 + rn() * 9,
        v = 0.78 + rn() * 0.2;
      lg.fillStyle = 'rgb(' + Math.round(222 * v) + ',' + Math.round(214 * v) + ',' + Math.round(192 * v) + ')';
      lg.beginPath();
      lg.ellipse(x + w / 2, y + 5.5, w / 2 - 0.6, 4.8, 0, 0, 7);
      lg.fill();
      x += w;
    }
  }
  for (let i = 0; i < 260; i++) {
    lg.fillStyle = rn() < 0.6 ? 'rgba(90,88,76,.45)' : 'rgba(250,246,232,.35)';
    lg.fillRect(rn() * 64, rn() * 64, 1 + rn(), 1 + rn());
  }
  const lt = new THREE.CanvasTexture(lc);
  lt.wrapS = lt.wrapT = THREE.RepeatWrapping;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 8);
  }
  const mat = new THREE.MeshLambertMaterial({ map: lt, color: 0xffffff });
  const mesh = (items, H, sphere) => {
    const hm = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length)),
      M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      cc = new THREE.Color();
    items.forEach((a, i) => {
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a[2]);
      /* on the lowest ground under it (both ends and the middle), 10 cm in: on a slope no end hangs in the air */
      const sx = Math.sin(a[2]) * a[3] * 0.48,
        sz = Math.cos(a[2]) * a[3] * 0.48,
        gy = Math.min(H(a[0], a[1]), H(a[0] + sx, a[1] + sz), H(a[0] - sx, a[1] - sz));
      M.compose(new THREE.Vector3(a[0], gy - 0.1, a[1]), Q, new THREE.Vector3(a[5], a[4], a[3]));
      hm.setMatrixAt(i, M);
      cc.setRGB(a[6], a[6] * 0.98, a[6] * 0.92);
      hm.setColorAt(i, cc);
    });
    hm.count = items.length;
    hm.instanceMatrix.needsUpdate = true;
    if (hm.instanceColor) hm.instanceColor.needsUpdate = true;
    /* an instanced mesh is culled by its geometry's sphere: each mesh gets its own copy round where its walls stand */
    hm.geometry = geo.clone();
    hm.geometry.boundingSphere = sphere;
    hm.frustumCulled = true;
    return hm;
  };
  return { mesh, LEN: 15.6 };
})();
/* the home map's walls: round the dry fields that lie near the road */
{
  const items = [];
  let sh = 11;
  const rnd = () => (sh = (sh * 16807) % 2147483647) / 2147483647;
  for (const s of FARM.walls) {
    const dx = s.x1 - s.x0,
      dz = s.z1 - s.z0,
      len = Math.hypot(dx, dz),
      n = Math.floor(len / 15.5),
      yaw = Math.atan2(dx, dz);
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n,
        x = s.x0 + dx * u,
        z = s.z0 + dz * u;
      if (rnd() < 0.08) continue;
      if (Math.hypot(HR(x + 10, z) - HR(x - 10, z), HR(x, z + 10) - HR(x, z - 10)) / 20 > 0.1) continue;
      if (HR(x, z) < 3.2 || HR(x + 8, z) < 3.2 || HR(x - 8, z) < 3.2 || HR(x, z + 8) < 3.2 || HR(x, z - 8) < 3.2)
        continue;
      if (!nearRoad(x, z, 1800) || nearRoad(x, z, 26) || inCompound(x, z)) continue;
      items.push([
        x,
        z,
        yaw,
        15.6,
        1.0 + rnd() * 0.5 /* height */,
        0.6 + rnd() * 0.2 /* thickness */,
        0.86 + rnd() * 0.14,
      ]);
    }
  }
  const hm = CORAL.mesh(items, H, new THREE.Sphere(new THREE.Vector3((DEPOT[0] + BASE[0]) / 2, 40, (DEPOT[1] + BASE[1]) / 2), 3800));
  scene.add(hm);
  FARM.wallCount = items.length;
}
