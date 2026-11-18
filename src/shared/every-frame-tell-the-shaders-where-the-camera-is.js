/* every frame: tell the shaders where the camera is; now and then (every ~30 m of movement) refill the pools of detailed trees */
function updNearTrees(cx, cy, cz, force) {
  NTU.c.value.set(cx, cy, cz);
  const R = NT.R * NT.k;
  if (R < 60 || !NT.sp.length || cy > R + 430) {
    if (NT.act) {
      NT.sp.forEach((sp) => sp.vars.forEach((im) => (im.count = 0)));
      NT.act = false;
      NT.gx = 1e9;
    }
    NTU.a.value = -2;
    NTU.b.value = -1;
    return;
  }
  const mv = Math.hypot(cx - NT.gx, cy - NT.gy, cz - NT.gz);
  if (!force && NT.act && mv < 30) return;
  NT.gx = cx;
  NT.gy = cy;
  NT.gz = cz;
  NT.act = true;
  const cap = Math.max(20, Math.floor(NT.cap * NT.k)),
    gr = R + 40,
    r2 = gr * gr,
    c0 = Math.floor((cx - gr) / NT.cell),
    c1 = Math.floor((cx + gr) / NT.cell),
    d0 = Math.floor((cz - gr) / NT.cell),
    d1 = Math.floor((cz + gr) / NT.cell);
  let rEff = R;
  for (const sp of NT.sp) {
    const cand = [];
    for (let a = c0; a <= c1; a++)
      for (let b = d0; b <= d1; b++) {
        for (const sr of sp.src) {
          const l = sr.grid.get((a + 512) * 1024 + (b + 512));
          if (!l) continue;
          for (const i of l) {
            const o = i * 16,
              dx = sr.mats[o + 12] - cx,
              dy = sr.mats[o + 13] - cy,
              dz = sr.mats[o + 14] - cz,
              d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < r2) cand.push([d2, i, sr]);
          }
        }
      }
    if (cand.length > cap) {
      cand.sort((p, q) => p[0] - q[0]);
      rEff = Math.min(rEff, Math.sqrt(cand[cap - 1][0]) - 32);
      cand.length = cap;
    }
    const cnt = [0, 0, 0],
      V = sp.vars;
    for (const [, i, sr] of cand) {
      const v = i % 3,
        im = V[v],
        k = cnt[v]++;
      if (k >= NT.max) {
        cnt[v]--;
        continue;
      }
      im.instanceMatrix.array.set(sr.mats.subarray(i * 16, i * 16 + 16), k * 16);
      im.instanceColor.array.set(sr.cols.subarray(i * 3, i * 3 + 3), k * 3);
    }
    V.forEach((im, v) => {
      im.count = cnt[v];
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor.needsUpdate = true;
    });
  }
  rEff = Math.max(60, rEff);
  NTU.b.value = rEff;
  NTU.a.value = rEff * 0.8;
}
const GEO = {};
GEO.con = (() => {
  const a = new THREE.ConeGeometry(3.7, 7.2, 6, 1, true);
  a.translate(0, 4.5, 0);
  const b = new THREE.ConeGeometry(2.5, 6, 6, 1, true);
  b.translate(0, 8.6, 0);
  return mergeParts([
    { g: a, c: [0.1, 0.27, 0.11] },
    { g: b, c: [0.12, 0.33, 0.13] },
  ]);
})();
GEO.oak = (() => {
  const tr = new THREE.CylinderGeometry(0.38, 0.52, 3.8, 5, 1, true);
  tr.translate(0, 1.9, 0);
  const bl = (r, x, y, z, sy) => {
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.scale(1, sy, 1);
    g.translate(x, y, z);
    return g;
  };
  return mergeParts([
    { g: tr, c: [0.3, 0.2, 0.12] },
    { g: bl(3.3, 0, 5.9, 0, 0.85), c: [0.19, 0.41, 0.12] },
    { g: bl(2.5, 1.9, 4.9, 0.8, 0.85), c: [0.24, 0.48, 0.14] },
    { g: bl(2.4, -1.8, 5.1, -1.0, 0.85), c: [0.17, 0.37, 0.11] },
  ]);
})();
GEO.shr = (() => {
  const a = new THREE.IcosahedronGeometry(1.0, 0);
  a.scale(1.35, 0.8, 1.3);
  a.translate(0, 0.75, 0);
  const b = new THREE.IcosahedronGeometry(0.7, 0);
  b.translate(0.9, 0.55, 0.3);
  return mergeParts([
    { g: a, c: [0.2, 0.36, 0.14] },
    { g: b, c: [0.27, 0.43, 0.17] },
  ]);
})();
GEO.palm = (() => {
  const tr = new THREE.CylinderGeometry(0.27, 0.45, 9.5, 6, 4, true),
    p = tr.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = (p.getY(i) + 4.75) / 9.5;
    p.setX(i, p.getX(i) + k * k * 2.4);
  }
  tr.translate(0, 4.75, 0);
  tr.computeVertexNormals();
  const parts = [{ g: tr, c: [0.42, 0.3, 0.18] }];
  for (let i = 0; i < 10; i++) {
    const fr = new THREE.PlaneGeometry(6, 1.9, 4, 1);
    fr.translate(3, 0, 0);
    fr.rotateX(-Math.PI / 2);
    const pp = fr.attributes.position;
    for (let j = 0; j < pp.count; j++) {
      const x = pp.getX(j);
      pp.setY(j, -Math.pow(x / 6, 2) * 2.6);
    }
    fr.computeVertexNormals();
    fr.rotateY((i / 10) * Math.PI * 2);
    fr.translate(2.4, 9.5, 0);
    parts.push({ g: fr, c: [0.2 + (i % 2) * 0.05, 0.47, 0.16] });
  }
  return mergeParts(parts);
})();
