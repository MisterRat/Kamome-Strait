/* the far world's hamlets, farms and the tracks that join them (the same fixed network the 3D world builds from) */
function mmRural(g, Rm, lw) {
  const N = WORLD.NET,
    R = Rm * 1.1,
    RG = N.RG,
    FC = N.FC,
    drawn = new Set(),
    P = [0, 0];
  let budget = 6;
  const road = (a, b, col, w) => {
    const key = a.id < b.id ? a.id + b.id : b.id + a.id;
    if (drawn.has(key)) return;
    drawn.add(key);
    const n = Math.max(3, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 400));
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      N.pathPt(a, b, i / n, P);
      if (i) g.lineTo(P[0], P[1]);
      else g.moveTo(P[0], P[1]);
    }
    g.stroke();
  };
  const hams = [];
  for (let ri = Math.floor((pos.x - R - RG * 2) / RG); ri <= Math.floor((pos.x + R + RG * 2) / RG); ri++)
    for (let rj = Math.floor((pos.z - R - RG * 2) / RG); rj <= Math.floor((pos.z + R + RG * 2) / RG); rj++) {
      const h = N.hamlet(ri, rj);
      if (h) hams.push(h);
    }
  /* the paved roads between the far enemy bases */
  g.strokeStyle = '#f0dfa0';
  g.lineWidth = Math.max(lw(1.7), 22);
  for (const r of WORLD.RT.list()) {
    if (r.x1 < pos.x - R || r.x0 > pos.x + R || r.z1 < pos.z - R || r.z0 > pos.z + R) continue;
    g.beginPath();
    for (let k = 0; k < r.n; k += 3) (k ? g.lineTo(r.x[k], r.z[k]) : g.moveTo(r.x[k], r.z[k]));
    g.stroke();
  }
  const col = '#e2d49a';
  for (const h of hams) for (const o of N.links(h)) road(h, o, col, Math.max(lw(1.4), 14));
  const farms = [];
  if (Rm <= 8000)
  for (let ci = Math.floor((pos.x - R) / FC); ci <= Math.floor((pos.x + R) / FC); ci++)
    for (let cj = Math.floor((pos.z - R) / FC); cj <= Math.floor((pos.z + R) / FC); cj++) {
      const f = N.farm(ci, cj);
      if (!f) continue;
      if (f.par === undefined) {
        if (budget <= 0) continue; /* worked out a few at a time as they come into view */
        budget--;
      }
      if (N.live(f)) farms.push(f);
    }
  for (const f of farms) road(f, f.par, col, Math.max(lw(1), 10));
  g.fillStyle = '#f0e6c0';
  g.strokeStyle = '#3a3220';
  g.lineWidth = lw(1);
  for (const f of farms) {
    g.fillRect(f.x - lw(1.5), f.z - lw(1.5), lw(3), lw(3));
    g.strokeRect(f.x - lw(1.5), f.z - lw(1.5), lw(3), lw(3));
  }
  for (const h of hams) {
    const w = lw(5);
    g.fillStyle = '#ffe9a0';
    g.fillRect(h.x - w / 2, h.z - w / 2, w, w);
    g.strokeRect(h.x - w / 2, h.z - w / 2, w, w);
    g.fillStyle = '#7a4a2a';
    g.fillRect(h.x - lw(1.2), h.z - lw(1.2), lw(2.4), lw(2.4));
  }
}
function drawMinimap() {
  const now = performance.now();
  if (now - mmT < 100) return;
  mmT = now;
  const el = $$('mm');
  if (!mmOn || !started || UI.hid.mm) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  const S = mmC.width,
    c = S / 2,
    Rm = MMR[mmZ],
    s = c / Rm,
    psi = Math.atan2(-fwd.x, -fwd.z),
    g = mmx,
    lw = (px) => px / s;
  g.clearRect(0, 0, S, S);
  g.save();
  g.beginPath();
  g.arc(c, c, c - 2, 0, 7);
  g.clip();
  g.fillStyle = '#183049';
  g.fillRect(0, 0, S, S);
  g.translate(c, c);
  g.rotate(psi);
  g.scale(s, s);
  g.translate(-pos.x, -pos.z);
  g.imageSmoothingEnabled = true;
  mmFar();
  g.drawImage(MMF, -MFS / 2, -MFS / 2, MFS, MFS); /* the whole far world, coarse, behind the detailed home area */
  if (mmZ <= 2) mmTiles(g, Rm * 1.05);
  g.drawImage(MMT, -SZ / 2, -SZ / 2, SZ, SZ);
  mmRural(g, Rm, lw);
  g.strokeStyle = '#e9e9e4';
  g.lineWidth = Math.max(lw(2.4), 45);
  g.beginPath();
  g.moveTo(0, 600);
  g.lineTo(0, -1700);
  g.stroke(); /* runway */
  g.strokeStyle = '#f0dfa0';
  g.lineWidth = Math.max(lw(1.7), 22);
  g.beginPath();
  RP.forEach((q, i) => (i ? g.lineTo(q.x, q.z) : g.moveTo(q.x, q.z)));
  g.stroke(); /* road */
  for (const L of [RP2, RP3, RSPUR]) {
    g.beginPath();
    L.forEach((q, i) => (i ? g.lineTo(q.x, q.z) : g.moveTo(q.x, q.z)));
    g.stroke();
  }
  const sq = (x, z, px, col) => {
    g.fillStyle = col;
    g.fillRect(x - lw(px / 2), z - lw(px / 2), lw(px), lw(px));
  };
  sq(DEPOT[0], DEPOT[1], 6, '#3ad0ff');
  sq(BASE[0], BASE[1], 6, '#3ad0ff');
  BLD.forEach((b) =>
    sq(b.c.x, b.c.z, 4, b.dead ? '#555' : guide.tgt === b && trn.mode === 'bomb' ? '#ff9a2e' : '#ffc94a'),
  );
  if (trn.mode === 'free')
    T.forEach((q) => {
      if (q.kind === 'st' && !q.dead) sq(q.c.x, q.c.z, 3.5, '#ff5a4a');
      else if (q.kind === 'aa' && !q.dead && (!q.site || trn.mode === 'free')) sq(q.c.x, q.c.z, 3, '#ff4ad8');
    });
  CV.list.forEach((v) => {
    if (!v.dead) {
      g.fillStyle = '#ff3b30';
      g.beginPath();
      g.arc(v.m.position.x, v.m.position.z, lw(3), 0, 7);
      g.fill();
    }
  });
  if (guide.on && trn.mode !== 'free' && guide.pts.length > 1) {
    const P = guide.pts;
    g.lineWidth = lw(2.2);
    g.strokeStyle = '#55ff88';
    g.beginPath();
    let pf = false;
    P.forEach((q, i) => {
      if (q.fin && !pf) {
        g.stroke();
        g.strokeStyle = '#ffd24a';
        g.beginPath();
        g.moveTo(P[Math.max(0, i - 1)].x, P[Math.max(0, i - 1)].z);
        pf = true;
      }
      if (i) g.lineTo(q.x, q.z);
      else g.moveTo(q.x, q.z);
    });
    g.stroke();
  }
  EN.forEach((e) => {
    if (e.dying) return;
    g.save();
    g.translate(e.p.x, e.p.z);
    g.rotate(Math.atan2(e.fwd.x, -e.fwd.z));
    g.scale(lw(1), lw(1));
    g.fillStyle = '#ff4fd8';
    g.strokeStyle = '#000';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, -8);
    g.lineTo(5.5, 6);
    g.lineTo(0, 3);
    g.lineTo(-5.5, 6);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  });
  g.restore();
  g.save();
  g.translate(c, c);
  g.strokeStyle = 'rgba(255,255,255,.25)';
  g.lineWidth = 1;
  g.beginPath();
  g.arc(0, 0, c / 2, 0, 7);
  g.stroke(); /* half-range ring */
  g.fillStyle = '#fff';
  g.strokeStyle = '#000';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(6, 8);
  g.lineTo(0, 4);
  g.lineTo(-6, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore(); /* you */
  g.save();
  g.translate(c + Math.sin(psi) * (c - 11), c - Math.cos(psi) * (c - 11));
  g.fillStyle = '#ffb43a';
  g.font = 'bold 12px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('N', 0, 0);
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(c, c, c - 1.5, 0, 7);
  g.stroke();
  g.fillStyle = '#fff';
  g.font = 'bold 11px sans-serif';
  g.textAlign = 'right';
  g.textBaseline = 'alphabetic';
  g.shadowColor = '#000';
  g.shadowBlur = 3;
  g.fillText(Rm / 1000 + ' km', S - 10, S - 8);
}
