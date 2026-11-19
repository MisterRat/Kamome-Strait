/* hedgerows you can see and fly over: low leafy walls along the field boundaries that lie near the road */
{
  const lc = document.createElement('canvas');
  lc.width = lc.height = 64;
  const lg = lc.getContext('2d');
  lg.fillStyle = '#3f6a2a';
  lg.fillRect(0, 0, 64, 64);
  let sd = 5;
  const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 420; i++) {
    const v = rn();
    lg.fillStyle = v < 0.35 ? '#2a4d1c' : v < 0.7 ? '#4f7f33' : '#6e9a42';
    lg.beginPath();
    lg.arc(rn() * 64, rn() * 64, 1.5 + rn() * 3.2, 0, 7);
    lg.fill();
  }
  const lt = new THREE.CanvasTexture(lc);
  lt.wrapS = lt.wrapT = THREE.RepeatWrapping;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 8);
  }
  const mats = [];
  const items = [];
  let sh = 11;
  const rnd = () => (sh = (sh * 16807) % 2147483647) / 2147483647;
  for (const s of FARM.hedges) {
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
        1.9 + rnd() * 1.5 + Math.sin(x * 0.07 + z * 0.05) * 0.45,
        2.4 + rnd() * 1.0,
        0.62 + rnd() * 0.3,
      ]);
    }
  }
  const hm = new THREE.InstancedMesh(
      geo,
      new THREE.MeshLambertMaterial({ map: lt, color: 0xffffff }),
      Math.max(1, items.length),
    ),
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
    cc.setRGB(a[6] * 0.9, a[6] + 0.02, a[6] * 0.78);
    hm.setColorAt(i, cc);
  });
  hm.count = items.length;
  hm.instanceMatrix.needsUpdate = true;
  if (hm.instanceColor) hm.instanceColor.needsUpdate = true;
  hm.geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3((DEPOT[0] + BASE[0]) / 2, 40, (DEPOT[1] + BASE[1]) / 2),
    3800,
  );
  hm.frustumCulled = true;
  scene.add(hm);
  FARM.hedgeCount = items.length;
}

