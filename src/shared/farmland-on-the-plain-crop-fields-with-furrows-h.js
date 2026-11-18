/* ---------- farmland on the plain: crop fields with furrows, hedgerows (3D near the road) and farm tracks ---------- */
const FARM = { a: 0.31, cs: 340, hedges: [] };
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
  const crops = [
    [0.46, 0.62, 0.22],
    [0.52, 0.68, 0.26],
    [0.6, 0.72, 0.28],
    [0.78, 0.72, 0.36],
    [0.82, 0.76, 0.42],
    [0.58, 0.44, 0.27],
    [0.5, 0.36, 0.24],
    [0.66, 0.78, 0.4],
    [0.4, 0.56, 0.2],
    [0.72, 0.7, 0.34],
  ];
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
      const c = crops[(hash(i, j, 1) * crops.length) | 0],
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
      g.fillStyle = col(c, k * 0.88);
      g.globalAlpha = 0.55;
      for (let y = -90; y < 90; y += 4.2) g.fillRect(-90, y, 180, 1.6);
      g.restore();
      g.globalAlpha = 1;
    }
  /* hedgerows and walls do not run up and down big hills: skip a line where the ground is steep */
  const steep = (x, z) => Math.hypot(HR(x + 12, z) - HR(x - 12, z), HR(x, z + 12) - HR(x, z - 12)) / 24 > 0.1;
  const seg = (u0, v0, u1, v1, type) => {
    const a = U2W(u0, v0),
      b = U2W(u1, v1);
    if (Math.hypot((a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cz) > PL.R * 0.9) return;
    for (let q = 0; q <= 6; q++) if (steep(a[0] + ((b[0] - a[0]) * q) / 6, a[1] + ((b[1] - a[1]) * q) / 6)) return;
    const A = px(a[0], a[1]),
      B = px(b[0], b[1]);
    if (type < 0.56) {
      g.strokeStyle = 'rgba(30,52,24,.85)';
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(A[0], A[1]);
      g.lineTo(B[0], B[1]);
      g.stroke();
      FARM.hedges.push({ x0: a[0], z0: a[1], x1: b[0], z1: b[1] });
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
      seg(i * cs, j * cs, i * cs, (j + 1) * cs, hash(i, j, 10));
      seg(i * cs, j * cs, (i + 1) * cs, j * cs, hash(i, j, 11));
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
