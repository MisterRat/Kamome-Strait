/* ---------- farmland on the plain: rice paddies first, then cane, sweet potato and red-earth fallow; coral walls round the dry fields
   (3D near the road), earth dykes between the paddies, and farm tracks (the user's, 2026-11-23: the Pacific, not Normandy: no hedgerows;
   more paddies than crop fields) ---------- */
const FARM = { a: 0.31, cs: 340, walls: [] };
{
  const FW = 2048,
    HS = 4700,
    cx = PL.cx,
    cz = PL.cz,
    cs = FARM.cs,
    cvs = document.createElement('canvas');
  cvs.width = cvs.height = FW;
  const g = cvs.getContext('2d');
  const px = (x, z) => [((x - (cx - HS)) / (2 * HS)) * FW, ((z - (cz - HS)) / (2 * HS)) * FW],
    ca = Math.cos(FARM.a),
    sa = Math.sin(FARM.a),
    U2W = (u, v) => [cx + u * ca - v * sa, cz + u * sa + v * ca];
  const hash = (i, j, k) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483629)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  /* [colour, paddy]: six in ten plots are rice paddies (flooded, or green with young rice, or ripening), the rest sugar cane, sweet
     potato and fallow red earth */
  const crops = [
    [[0.56, 0.68, 0.74], 1] /* flooded, just planted: the water shows the sky */,
    [[0.48, 0.6, 0.68], 1],
    [[0.36, 0.58, 0.26], 1] /* young rice */,
    [[0.42, 0.64, 0.24], 1],
    [[0.5, 0.66, 0.26], 1],
    [[0.66, 0.66, 0.3], 1] /* ripening */,
    [[0.5, 0.66, 0.24], 0] /* sugar cane */,
    [[0.44, 0.6, 0.2], 0],
    [[0.3, 0.46, 0.2], 0] /* sweet potato */,
    [[0.62, 0.4, 0.28], 0] /* fallow: the islands' red earth */,
  ];
  const plot = (i, j) => crops[(hash(i, j, 1) * crops.length) | 0];
  const NC = Math.ceil(HS / cs) + 1,
    col = (c, k) =>
      'rgb(' +
      Math.round(Math.min(1, c[0] * k) * 255) +
      ',' +
      Math.round(Math.min(1, c[1] * k) * 255) +
      ',' +
      Math.round(Math.min(1, c[2] * k) * 255) +
      ')';
  for (let i = -NC; i < NC; i++)
    for (let j = -NC; j < NC; j++) {
      const A = U2W(i * cs, j * cs),
        B = U2W((i + 1) * cs, j * cs),
        C = U2W((i + 1) * cs, (j + 1) * cs),
        D = U2W(i * cs, (j + 1) * cs),
        mx = (A[0] + C[0]) / 2,
        mz = (A[1] + C[1]) / 2;
      if (Math.hypot(mx - cx, mz - cz) > PL.R * 0.94) continue;
      const [c, pd] = plot(i, j),
        k = 0.9 + hash(i, j, 2) * 0.2,
        P = [A, B, C, D].map((q) => px(q[0], q[1]));
      g.beginPath();
      P.forEach((q, n) => (n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
      g.closePath();
      g.fillStyle = col(c, k);
      g.fill();
      g.save();
      g.clip();
      const m = px(mx, mz),
        ang = FARM.a + (hash(i, j, 3) < 0.5 ? 0 : Math.PI / 2);
      g.translate(m[0], m[1]);
      g.rotate(ang);
      g.fillStyle = col(c, k * (pd ? 1.12 : 0.88));
      g.globalAlpha = pd ? 0.25 : 0.55; /* a paddy's rows of rice are fine and faint, the water between them a little lighter */
      for (let y = -90; y < 90; y += pd ? 2.6 : 4.2) g.fillRect(-90, y, 180, pd ? 0.9 : 1.6);
      g.restore();
      g.globalAlpha = 1;
    }
  /* walls do not run up and down big hills: skip a line where the ground is steep */
  const steep = (x, z) => Math.hypot(HR(x + 12, z) - HR(x - 12, z), HR(x, z + 12) - HR(x, z - 12)) / 24 > 0.1;
  const seg = (u0, v0, u1, v1, type, paddies) => {
    const a = U2W(u0, v0),
      b = U2W(u1, v1);
    if (Math.hypot((a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cz) > PL.R * 0.9) return;
    for (let q = 0; q <= 6; q++) if (steep(a[0] + ((b[0] - a[0]) * q) / 6, a[1] + ((b[1] - a[1]) * q) / 6)) return;
    const A = px(a[0], a[1]),
      B = px(b[0], b[1]);
    if (paddies) {
      /* between two paddies: a low earth dyke, grassed on top */
      g.strokeStyle = 'rgba(96,104,58,.7)';
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(A[0], A[1]);
      g.lineTo(B[0], B[1]);
      g.stroke();
    } else if (type < 0.56) {
      /* a dry field's boundary: a rough coral wall, pale grey-cream with its shadow */
      g.strokeStyle = 'rgba(70,72,60,.35)';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(A[0], A[1]);
      g.lineTo(B[0], B[1]);
      g.stroke();
      g.strokeStyle = 'rgba(214,208,190,.6)';
      g.lineWidth = 0.8;
      g.stroke();
      FARM.walls.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1] });
    } else if (type < 0.8) {
      g.strokeStyle = 'rgba(176,150,106,.95)';
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(A[0], A[1]);
      g.lineTo(B[0], B[1]);
      g.stroke();
      g.strokeStyle = 'rgba(212,192,150,.9)';
      g.lineWidth = 0.9;
      g.stroke();
    }
  };
  for (let i = -NC; i < NC; i++)
    for (let j = -NC; j < NC; j++) {
      seg(i * cs, j * cs, i * cs, (j + 1) * cs, hash(i, j, 10), plot(i, j)[1] && plot(i - 1, j)[1]);
      seg(i * cs, j * cs, (i + 1) * cs, j * cs, hash(i, j, 11), plot(i, j)[1] && plot(i, j - 1)[1]);
    }
  g.globalCompositeOperation = 'destination-out';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [wd, al] of [
    [52, 0.35],
    [30, 1],
  ]) {
    g.globalAlpha = al;
    g.lineWidth = (wd / (2 * HS)) * FW;
    for (const L of [RP, RP2, RP3, RSPUR]) {
      g.beginPath();
      L.forEach((p, n) => {
        const q = px(p.x, p.z);
        n ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
      });
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  /* clear the crops under each compound: its fenced rectangle plus a soft edge */
  for (const [c, f] of [
    [DEPOT, DEPF],
    [BASE, BASEF],
  ]) {
    const k = FW / (2 * HS),
      q0 = px(c[0] + f[0], c[1] + f[2]);
    g.fillStyle = 'rgba(0,0,0,0.125)';
    for (let m = 8; m >= 0; m--) {
      const e = 12 + m * 6; /* metres beyond the fence */
      g.fillRect(q0[0] - e * k, q0[1] - e * k, (f[1] - f[0] + 2 * e) * k, (f[3] - f[2] + 2 * e) * k);
    }
  }
  g.globalCompositeOperation = 'destination-in';
  {
    const q = px(cx, cz),
      r = (PL.R / (2 * HS)) * FW,
      gr = g.createRadialGradient(q[0], q[1], r * 0.78, q[0], q[1], r);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, FW, FW);
  }
  const tx = new THREE.CanvasTexture(cvs);
  tx.flipY = false;
  tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping;
  tx.anisotropy = 8;
  FARMU.value = tx;
  FARMG.value.set(cx, cz, HS, 0);
}
