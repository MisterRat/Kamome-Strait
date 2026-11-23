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
/* the islands' pine: the Ryukyu pine (Pinus luchuensis), not a spruce (the user's, 2026-11-23: the Pacific): a bare trunk leaning a
   little, and a flat crown of layered pads up top */
GEO.con = (() => {
  const tr = new THREE.CylinderGeometry(0.2, 0.36, 8.2, 5, 3, true),
    p = tr.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = (p.getY(i) + 4.1) / 8.2;
    p.setX(i, p.getX(i) + k * k * 0.9);
  }
  tr.translate(0, 4.1, 0);
  tr.computeVertexNormals();
  const pad = (r, x, y, z, sy) => {
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.scale(1, sy, 1);
    g.translate(x, y, z);
    return g;
  };
  return mergeParts([
    { g: tr, c: [0.34, 0.24, 0.16] },
    { g: pad(3.3, 1.0, 8.7, 0.1, 0.36), c: [0.12, 0.3, 0.12] },
    { g: pad(2.5, -1.3, 7.7, 1.0, 0.4), c: [0.1, 0.27, 0.11] },
    { g: pad(2.2, 1.9, 9.6, -1.0, 0.36), c: [0.14, 0.34, 0.13] },
    { g: pad(1.7, -0.3, 10.3, -0.7, 0.42), c: [0.13, 0.32, 0.12] },
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
/* the low trees and bushes of the islands: pandanus (screw pine), a leaning stem or two on stilt roots, each crowned with a rosette of long
   strap leaves (the user's, 2026-11-23: the Pacific) */
GEO.shr = (() => {
  const parts = [];
  const stem = (lean, ry) => {
    const g = new THREE.CylinderGeometry(0.06, 0.1, 1.7, 5, 1, true);
    g.translate(0, 0.85, 0);
    g.rotateZ(lean);
    g.rotateY(ry);
    parts.push({ g, c: [0.42, 0.36, 0.26] });
    const top = new THREE.Vector3(0, 1.7, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), lean).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    for (let k = 0; k < 9; k++) {
      const lf = new THREE.PlaneGeometry(1.25, 0.16, 3, 1);
      lf.translate(0.62, 0, 0);
      lf.rotateX(-Math.PI / 2);
      const q = lf.attributes.position;
      for (let m = 0; m < q.count; m++) {
        const x = q.getX(m);
        q.setY(m, 0.35 * x - 0.45 * x * x); /* up, then arching over */
      }
      lf.rotateZ(0.5 - (k % 3) * 0.25);
      lf.rotateY((k / 9) * Math.PI * 2 + ry);
      lf.translate(top.x, top.y, top.z);
      lf.computeVertexNormals();
      parts.push({ g: lf, c: [0.24 + (k % 2) * 0.05, 0.42, 0.18] });
    }
  };
  stem(0.25, 0);
  stem(-0.35, 1.9);
  /* stilt roots from the foot of the stems */
  for (let k = 0; k < 4; k++) {
    const g = new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4, 1, true);
    g.translate(0, 0.3, 0);
    g.rotateZ(0.6);
    g.rotateY((k / 4) * Math.PI * 2);
    g.translate(0, 0, 0);
    parts.push({ g, c: [0.4, 0.34, 0.24] });
  }
  return mergeParts(parts);
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
