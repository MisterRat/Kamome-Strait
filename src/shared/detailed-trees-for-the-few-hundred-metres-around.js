/* ---- detailed trees for the few hundred metres around the camera. Grown procedurally at start-up, level by level (after the
   "Fractals to Forests" method): a trunk, limbs that fork off it, twigs that fork off the limbs, each a tapered, wandering tube,
   and the last twigs carry cards of leaves (two crossed, alpha-cut textures, shaded as if the whole crown were a ball).
   Conifers are whorls of drooping boughs with needle sprays. The textures are drawn here with canvas, so nothing is downloaded. ---- */
function treeTextures() {
  const tex = (w, h, fill, draw, repeat) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    draw(x, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    for (let i = 0; i < d.length; i += 4)
      if (d[i + 3] < 8) {
        /* keep the leaf colour in the see-through pixels so the mip-maps do not grow dark edges */
        d[i] = fill[0];
        d[i + 1] = fill[1];
        d[i + 2] = fill[2];
      }
    const t = new THREE.DataTexture(new Uint8Array(d), w, h, THREE.RGBAFormat);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  };
  let sd = 4242;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const bark = tex(
    64,
    128,
    [90, 62, 40],
    (x, w, h) => {
      x.fillStyle = '#5c3f28';
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const px = rnd() * w,
          py = rnd() * h,
          L = 18 + rnd() * 50;
        x.strokeStyle = rnd() < 0.6 ? 'rgba(34,22,14,0.7)' : 'rgba(128,92,60,0.55)';
        x.lineWidth = 1.5 + rnd() * 2.5;
        for (const dx of [0, w, -w]) {
          x.beginPath();
          x.moveTo(px + dx, py);
          x.lineTo(px + dx + (rnd() - 0.5) * 4, py + L);
          x.stroke();
        }
      }
    },
    true,
  );
  const leaf = tex(256, 256, [58, 110, 38], (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = '#4a3a22';
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(2, h * 0.5);
    x.quadraticCurveTo(w * 0.5, h * 0.5 + 10, w - 6, h * 0.5 - 4);
    x.stroke();
    const drawLeaf = (px, py, ang, L, W) => {
      x.save();
      x.translate(px, py);
      x.rotate(ang);
      const g = x.createLinearGradient(0, -W, 0, W),
        k = 0.85 + rnd() * 0.3;
      g.addColorStop(0, `rgb(${Math.round(38 * k)},${Math.round(88 * k)},${Math.round(26 * k)})`);
      g.addColorStop(0.5, `rgb(${Math.round(84 * k)},${Math.round(142 * k)},${Math.round(48 * k)})`);
      g.addColorStop(1, `rgb(${Math.round(34 * k)},${Math.round(78 * k)},${Math.round(24 * k)})`);
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, 0);
      x.bezierCurveTo(L * 0.2, -W * 1.1, L * 0.7, -W * 1.0, L, 0);
      x.bezierCurveTo(L * 0.7, W * 1.0, L * 0.2, W * 1.1, 0, 0);
      x.fill();
      x.strokeStyle = 'rgba(160,200,100,0.55)';
      x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(0, 0);
      x.lineTo(L * 0.92, 0);
      x.stroke();
      x.restore();
    };
    for (let i = 0; i < 13; i++) {
      const t = (i + 0.5) / 13,
        side = i % 2 ? 1 : -1,
        px = 6 + t * (w - 40),
        py = h * 0.5 + 10 * Math.sin(t * 3.0) - 5 * t;
      drawLeaf(px, py, side * (0.95 - 0.4 * t) + (rnd() - 0.5) * 0.3, 52 - 16 * t + rnd() * 10, 15 - 4 * t);
    }
    drawLeaf(w - 36, h * 0.5 - 6, -0.05, 44, 13);
  });
  const need = tex(256, 128, [24, 64, 28], (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.strokeStyle = '#4b3524';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(2, h / 2);
    x.lineTo(w - 4, h / 2);
    x.stroke();
    for (let i = 0; i < 70; i++) {
      const t = i / 69,
        px = 8 + t * (w - 36);
      for (const side of [-1, 1]) {
        const L = (34 - 14 * t) * (0.8 + rnd() * 0.4),
          k = 0.85 + rnd() * 0.4;
        x.strokeStyle = `rgb(${Math.round(34 * k)},${Math.round(92 * k)},${Math.round(40 * k)})`;
        x.lineWidth = 2.8;
        x.beginPath();
        x.moveTo(px, h / 2);
        x.lineTo(px + L * 0.55, h / 2 + side * L * 0.85);
        x.stroke();
      }
    }
  });
  return { bark, leaf, need };
}
function growTree(kind, seed) {
  let sd = seed;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647,
    rr = (a, b) => a + (b - a) * rnd(),
    V3 = THREE.Vector3,
    UP = new V3(0, 1, 0);
  const BP = [],
    BN = [],
    BU = [],
    BC = [],
    BI = [],
    LP = [],
    LN = [],
    LU = [],
    LC = [],
    LI = [];
  const perp = (d) => new V3().crossVectors(d, Math.abs(d.y) > 0.9 ? new V3(1, 0, 0) : UP).normalize();
  /* one tapered, wandering tube; the sections come back so that children can sprout from them */
  const branch = (o, dir, len, r0, secs, segs, q) => {
    const S = [],
      p = o.clone(),
      d = dir.clone().normalize();
    for (let i = 0; i <= secs; i++) {
      S.push({ p: p.clone(), d: d.clone(), r: r0 * (1 - (i / secs) * (1 - q.end)) });
      p.addScaledVector(d, len / secs);
      const g = (q.gnarl / Math.max(0.2, Math.sqrt(S[i].r))) * 0.45; /* thin twigs wander more */
      d.x += (rnd() - 0.5) * g;
      d.z += (rnd() - 0.5) * g;
      d.y += (rnd() - 0.5) * g * 0.6 + q.force / secs; /* growth force: up for limbs, down for drooping boughs */
      d.normalize();
    }
    const vb = BP.length / 3,
      ur = Math.max(1, Math.round(r0 * 5)),
      u = perp(S[0].d);
    let run = 0;
    for (let i = 0; i <= secs; i++) {
      const s = S[i];
      if (i) run += s.p.distanceTo(S[i - 1].p);
      u.addScaledVector(s.d, -u.dot(s.d));
      if (u.lengthSq() < 1e-4) u.copy(perp(s.d));
      u.normalize();
      const v = new V3().crossVectors(s.d, u);
      for (let j = 0; j <= segs; j++) {
        const t = (j / segs) * Math.PI * 2,
          n = u.clone().multiplyScalar(Math.cos(t)).addScaledVector(v, Math.sin(t));
        BP.push(s.p.x + n.x * s.r, s.p.y + n.y * s.r, s.p.z + n.z * s.r);
        BN.push(n.x, n.y, n.z);
        BU.push((j / segs) * ur, run * 0.7);
        BC.push(1, 1, 1);
      }
    }
    for (let i = 0; i < secs; i++)
      for (let j = 0; j < segs; j++) {
        const a = vb + i * (segs + 1) + j,
          b = a + segs + 1;
        BI.push(a, b, a + 1, a + 1, b, b + 1);
      }
    return S;
  };
  /* the places on a parent where children sprout: spread along it, turned round it by the golden angle, so none line up */
  const kids = (S, n, q) => {
    const out = [],
      r0 = rnd() * 6.283;
    for (let k = 0; k < n; k++) {
      const f = (q.t0 + (q.t1 - q.t0) * ((k + rnd() * 0.6) / n)) * (S.length - 1),
        i = Math.min(S.length - 2, Math.floor(f)),
        a = f - i,
        d = S[i].d
          .clone()
          .lerp(S[i + 1].d, a)
          .normalize(),
        w = perp(d),
        w2 = new V3().crossVectors(d, w),
        ph = r0 + k * 2.399 + (rnd() - 0.5) * 0.5,
        ang = q.ang * (0.85 + rnd() * 0.3);
      out.push({
        p: S[i].p.clone().lerp(S[i + 1].p, a),
        d: d
          .clone()
          .multiplyScalar(Math.cos(ang))
          .addScaledVector(w.multiplyScalar(Math.cos(ph)).addScaledVector(w2, Math.sin(ph)), Math.sin(ang)),
        r: S[i].r * (1 - a) + S[i + 1].r * a,
      });
    }
    return out;
  };
  const CEN = new V3(0, kind === 'oak' ? 6 : 8.5, 0);
  /* a card of leaves (or needles): two crossed quads along the twig, lit with a normal pointing away from the crown's centre */
  const card = (p, d, size, aspect, tone) => {
    const c = p.clone().addScaledVector(d, size * 0.5),
      n = c.clone().sub(CEN);
    if (kind !== 'oak') n.y *= 0.3;
    n.normalize();
    n.y += 0.6;
    n.normalize();
    const hf = Math.max(0, Math.min(1, (c.y - 1.5) / (kind === 'oak' ? 8 : 10))),
      sh = (0.95 + 0.4 * hf) * rr(0.92, 1.08) * tone,
      w1 = kind === 'oak' ? perp(d).applyAxisAngle(d, rnd() * 3.14) : new V3().crossVectors(d, UP).normalize(),
      w2 = new V3().crossVectors(d, w1),
      h = size * 0.5 * aspect,
      vb = LP.length / 3;
    if (w1.lengthSq() < 0.01) w1.copy(perp(d));
    [w1, w2].forEach((w, k) => {
      const base = LP.length / 3;
      [
        [0, 0, -1],
        [1, 0, -1],
        [1, 1, 1],
        [0, 1, 1],
      ].forEach(([u, v, sg]) => {
        const q = p
          .clone()
          .addScaledVector(d, u * size)
          .addScaledVector(w, sg * h);
        LP.push(q.x, q.y, q.z);
        LN.push(n.x, n.y, n.z);
        LU.push(u, v);
        LC.push(sh, sh, sh);
      });
      LI.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return vb;
  };
  if (kind === 'oak') {
    const trunk = branch(new V3(0, -0.3, 0), new V3((rnd() - 0.5) * 0.12, 1, (rnd() - 0.5) * 0.12), 4.2, 0.5, 7, 8, {
      gnarl: 0.16,
      force: 0.1,
      end: 0.55,
    });
    for (const c1 of kids(trunk, 6, { t0: 0.5, t1: 0.98, ang: 0.95 })) {
      const S1 = branch(c1.p, c1.d, rr(2.3, 3.0), c1.r * 0.6, 5, 6, { gnarl: 0.35, force: 0.5, end: 0.35 });
      for (const c2 of kids(S1, 4, { t0: 0.3, t1: 1, ang: 0.8 })) {
        const S2 = branch(c2.p, c2.d, rr(1.4, 2.0), c2.r * 0.6, 4, 4, { gnarl: 0.5, force: 0.4, end: 0.3 });
        card(S2[S2.length - 1].p, S2[S2.length - 1].d, rr(2.0, 2.6), 1, 1);
        for (const c3 of kids(S2, 3, { t0: 0.4, t1: 1, ang: 0.7 })) {
          const S3 = branch(c3.p, c3.d, rr(0.9, 1.3), c3.r * 0.6, 2, 3, { gnarl: 0.6, force: 0.3, end: 0.2 });
          for (const f of [0.3, 0.7, 1]) {
            const i = Math.min(S3.length - 1, Math.round(f * (S3.length - 1)));
            card(S3[i].p, S3[i].d, rr(1.9, 2.7), 1, 1);
          }
        }
      }
    }
  } else {
    /* the Ryukyu pine (not a spruce: the Pacific, the user's, 2026-11-23): a trunk bare for most of its height, leaning and bending a
       little; the branches spread from its upper third, near level and turning up at the ends, their needles in flat pads */
    const lean = new V3((rnd() - 0.5) * 0.35, 1, (rnd() - 0.5) * 0.35).normalize(),
      trunk = branch(new V3(0, -0.3, 0), lean, rr(8.5, 10.5), 0.36, 7, 7, { gnarl: 0.14, force: 0.15, end: 0.45 });
    for (const c1 of kids(trunk, 8, { t0: 0.6, t1: 0.98, ang: 1.25 })) {
      const S1 = branch(c1.p, c1.d, rr(2.6, 4.0), c1.r * 0.55, 4, 5, { gnarl: 0.3, force: 0.2, end: 0.3 });
      for (const c2 of kids(S1, 4, { t0: 0.35, t1: 1, ang: 0.85 })) {
        const S2 = branch(c2.p, c2.d, rr(1.0, 1.6), c2.r * 0.6, 2, 3, { gnarl: 0.4, force: 0.35, end: 0.25 });
        /* the needle pads: wide, flat, lying near level */
        for (const f of [0.3, 0.65, 1]) {
          const q = Math.min(S2.length - 1, Math.round(f * (S2.length - 1))),
            d = S2[q].d.clone().setY(S2[q].d.y * 0.35).normalize();
          card(S2[q].p, d, rr(2.2, 3.0), 0.75, 1);
        }
      }
      card(S1[S1.length - 1].p, S1[S1.length - 1].d.clone().setY(0.2).normalize(), rr(2.4, 3.0), 0.75, 1);
    }
    card(trunk[trunk.length - 1].p.clone(), UP, 2.4, 0.75, 1);
  }
  const nb = BP.length / 3,
    g = new THREE.BufferGeometry(),
    idx = BI.concat(LI.map((i) => i + nb));
  g.setAttribute('position', new THREE.Float32BufferAttribute(BP.concat(LP), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(BN.concat(LN), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(BU.concat(LU), 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(BC.concat(LC), 3));
  g.setIndex(new THREE.BufferAttribute(nb + LP.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  g.addGroup(0, BI.length, 0);
  g.addGroup(BI.length, LI.length, 1);
  return g;
}
const TMAT = {
  con: treeMat(1),
  oak: treeMat(1),
  shr: treeMat(0),
  palm: treeMat(0),
};
function addSpecies(key, items) {
  const buckets = new Map(),
    geo = GEO[key];
  for (const it of items) {
    const k = Math.floor((it[0] + 10500) / 5250) + ',' + Math.floor((it[2] + 10500) / 5250);
    let b = buckets.get(k);
    if (!b) {
      b = [];
      buckets.set(k, b);
    }
    b.push(it);
  }
  const M = new THREE.Matrix4(),
    Q = new THREE.Quaternion(),
    Y = new THREE.Vector3(0, 1, 0),
    cl = new THREE.Color();
  for (const b of buckets.values()) {
    const g = new THREE.BufferGeometry();
    for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
    let x0 = 1e9,
      x1 = -1e9,
      y0 = 1e9,
      y1 = -1e9,
      z0 = 1e9,
      z1 = -1e9;
    const im = new THREE.InstancedMesh(g, TMAT[key], b.length);
    b.forEach((it, i) => {
      Q.setFromAxisAngle(Y, it[3]);
      M.compose(new THREE.Vector3(it[0], it[1], it[2]), Q, new THREE.Vector3(it[4], it[5], it[4]));
      im.setMatrixAt(i, M);
      cl.setRGB(it[6], it[7], it[8]);
      im.setColorAt(i, cl);
      x0 = Math.min(x0, it[0]);
      x1 = Math.max(x1, it[0]);
      y0 = Math.min(y0, it[1]);
      y1 = Math.max(y1, it[1] + 14 * it[5]);
      z0 = Math.min(z0, it[2]);
      z1 = Math.max(z1, it[2]);
    });
    g.boundingSphere = new THREE.Sphere(
      new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
      Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 20,
    );
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    scene.add(im);
    TREEM.push({ m: im, full: b.length, key }) /* key: the kind (PHYS: the palms are solid) */;
  }
}
{
  let sd = 77;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const con = [],
    oak = [],
    shr = [],
    palm = [],
    CAP = { con: 4800, oak: 800, shr: 1300, palm: 300 };
  const jit = () => [0.82 + rnd() * 0.38, 0.82 + rnd() * 0.38, 0.82 + rnd() * 0.38],
    autumn = () => jit(); /* evergreen: no autumn colours in the tropics (the user's, 2026-11-23) */
  for (let k = 0; k < 130000 && (con.length < CAP.con || oak.length < CAP.oak || shr.length < CAP.shr); k++) {
    const x = (rnd() - 0.5) * 20000,
      z = (rnd() - 0.5) * 20000;
    if (Math.abs(x) < 500 && z > -3300 && z < 1300) continue;
    if (nearRoad(x, z, 70) || inCompound(x, z)) continue;
    const h = HR(x, z);
    if (h < 3 || h > 420) continue;
    const f = vn(x * 0.0011 + 9.3, z * 0.0011 - 4.1) + 0.5 * vn(x * 0.004, z * 0.004),
      plain = Math.hypot(x - PL.cx, z - PL.cz) < PL.R * 0.95;
    if (plain && f < 0.3 && rnd() > 0.04) continue;
    const sl = Math.hypot(HR(x + 40, z) - h, HR(x, z + 40) - h);
    if (h >= 9 && f > 0.12 && sl <= 22) {
      const c = h > 150 || (f > 0.5 && rnd() < 0.62) || rnd() < 0.3;
      if (c && con.length < CAP.con) {
        const sc = 0.7 + rnd() * 0.9,
          j = jit();
        con.push([x, HMESH(x, z), z, rnd() * 6.283, sc, 0.9 + rnd() * 0.5, j[0], j[1], j[2]]);
      } else if (oak.length < CAP.oak) {
        const sc = 0.75 + rnd() * 0.7,
          j = autumn();
        oak.push([x, HMESH(x, z), z, rnd() * 6.283, sc, 0.9 + rnd() * 0.35, j[0], j[1], j[2]]);
      }
    } else if (sl < 18 && f > -0.15 && rnd() < 0.5 && shr.length < CAP.shr) {
      const sc = 0.8 + rnd() * 1.4,
        j = jit();
      shr.push([x, HMESH(x, z), z, rnd() * 6.283, sc, 0.8 + rnd() * 0.5, j[0], j[1], j[2]]);
    }
  }
  for (let k = 0; k < 70000 && palm.length < CAP.palm; k++) {
    const x = (rnd() - 0.5) * 20000,
      z = (rnd() - 0.5) * 20000,
      h = HR(x, z);
    if (h < 0.6 || h > 6.5) continue;
    if (nearRoad(x, z, 70) || inCompound(x, z)) continue;
    let wet = false;
    for (let a = 0; a < 8 && !wet; a++) {
      const th = a * 0.785;
      if (HR(x + Math.cos(th) * 140, z + Math.sin(th) * 140) < -1) wet = true;
    }
    if (!wet) continue;
    const sc = 0.85 + rnd() * 0.4,
      j = jit();
    palm.push([x, HMESH(x, z), z, rnd() * 6.283, sc, 1, j[0], j[1], j[2]]);
  }
  /* a palm here and there by the coral walls (no hedgerow oaks: the Pacific, the user's, 2026-11-23) */
  for (const s of FARM.walls) {
    const dx = s.x1 - s.x0,
      dz = s.z1 - s.z0,
      len = Math.hypot(dx, dz);
    if (!nearRoad((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, 1800)) continue;
    for (let d = 20; d < len - 20; d += 55 + rnd() * 40) {
      if (rnd() > 0.2 || palm.length >= CAP.palm + 150) continue;
      const x = s.x0 + (dx * d) / len + (rnd() - 0.5) * 4,
        z = s.z0 + (dz * d) / len + (rnd() - 0.5) * 4;
      if (nearRoad(x, z, 34) || inCompound(x, z) || HR(x, z) < 3.5) continue;
      const j = jit();
      palm.push([x, HMESH(x, z), z, rnd() * 6.283, 0.85 + rnd() * 0.4, 1, j[0], j[1], j[2]]);
    }
  }
  /* a dense wood on a quiet hill about 4.6 km north-west of the start (heading 323): nothing else is built there, so the trees can be admired close up */
  {
    const FX = -2750,
      FZ = -3250;
    for (let gx = -540; gx <= 540; gx += 21)
      for (let gz = -540; gz <= 540; gz += 21) {
        const x = FX + gx + (rnd() - 0.5) * 17,
          z = FZ + gz + (rnd() - 0.5) * 17;
        if (Math.hypot(x - FX, z - FZ) > 520 - 60 * rnd()) continue; /* a ragged edge */
        const h = HR(x, z);
        if (h < 40 || h > 420 || nearRoad(x, z, 70) || inCompound(x, z)) continue;
        if (Math.hypot(HR(x + 40, z) - h, HR(x, z + 40) - h) > 28) continue;
        if (vn(x * 0.006 + 3.3, z * 0.006 - 8.1) < -0.3 && rnd() < 0.85) continue; /* a few clearings */
        const j = jit();
        if (rnd() < 0.7 || h > 230)
          con.push([x, HMESH(x, z), z, rnd() * 6.283, 0.8 + rnd() * 0.9, 0.95 + rnd() * 0.5, j[0], j[1], j[2]]);
        else oak.push([x, HMESH(x, z), z, rnd() * 6.283, 0.85 + rnd() * 0.6, 0.95 + rnd() * 0.4, j[0], j[1], j[2]]);
      }
  }
  addSpecies('con', con);
  addSpecies('oak', oak);
  /* the detailed trees: for each species a pool of instanced variants, refilled with whatever stands near the camera */
  {
    const NEAR = { con: { items: con }, oak: { items: oak } },
      TX = treeTextures(),
      M4 = new THREE.Matrix4(),
      Qa = new THREE.Quaternion(),
      CELL = 150;
    NT.sp = [];
    for (const key of ['con', 'oak']) {
      const sp = NEAR[key],
        n = sp.items.length;
      sp.mats = new Float32Array(n * 16);
      sp.cols = new Float32Array(n * 3);
      sp.grid = new Map();
      sp.items.forEach((it, i) => {
        Qa.setFromAxisAngle(UPV0, it[3]);
        M4.compose(new THREE.Vector3(it[0], it[1], it[2]), Qa, new THREE.Vector3(it[4], it[5], it[4]));
        M4.toArray(sp.mats, i * 16);
        sp.cols.set([it[6], it[7], it[8]], i * 3);
        const k = (Math.floor(it[0] / CELL) + 512) * 1024 + Math.floor(it[2] / CELL) + 512;
        let b = sp.grid.get(k);
        if (!b) sp.grid.set(k, (b = []));
        b.push(i);
      });
      const mats = [
        treeMat(2, { map: TX.bark }),
        treeMat(2, { map: key === 'oak' ? TX.leaf : TX.need, alphaTest: 0.45 }),
      ];
      sp.vars = [0, 1, 2].map((v) => {
        const im = new THREE.InstancedMesh(growTree(key, 9100 + v * 37 + (key === 'oak' ? 11 : 0)), mats, NT.max);
        im.setColorAt(0, new THREE.Color());
        im.count = 0;
        im.frustumCulled = false;
        scene.add(im);
        return im;
      });
      sp.key = key;
      sp.src = [sp];
      NT.sp.push(sp);
    }
    NT.cell = CELL;
  }
  addSpecies('shr', shr);
  addSpecies('palm', palm);
  TREES = TREEM[0].m;
  TREES.full = TREEM[0].full;
  FARM.treeCounts = { con: con.length, oak: oak.length, shr: shr.length, palm: palm.length };
}

