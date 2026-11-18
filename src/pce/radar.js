/* ---- radar ---- */
function radarTargets() {
  const L = [];
  for (const t of T) if (t.type === 'ship' && !t.dead) L.push({ ref: t, x: t.c.x, z: t.c.z, name: 'SHIP' });
  if (typeof AFLD !== 'undefined' && AFLD.a) for (const o of AFLD.a) if (o.kind === 'ship' && o.m && o.m !== SHIPM.mesh) L.push({ ref: o, x: o.m.position.x, z: o.m.position.z, name: 'SHIP' });
  if (PT.on)
    for (const t of PT.L)
      if (t.kind === 'raft' || t.kind === 'ptboat' || t.kind === 'sled') L.push({ ref: t, x: t.p.x, z: t.p.z, name: t.kind === 'raft' ? 'RAFT' : t.kind === 'ptboat' ? 'PT 105' : 'SLED' });
  for (const c of L) [c.b, c.r] = cRel(c.x, c.z);
  return L.filter((c) => c.r > 60 && c.r < 18520);
}
function radarNearest(b, r, L) {
  let best = null,
    bs = 1e9;
  for (const c of L || radarTargets()) {
    const s = Math.abs(angW(c.b - b)) / 0.05 + Math.abs(c.r - r) / Math.max(150, 0.05 * c.r);
    if (s < bs) (bs = s), (best = c);
  }
  return best ? { c: best, s: bs, bErr: Math.abs(angW(best.b - b)), rErr: Math.abs(best.r - r) } : null;
}
function radarReport() {
  const R = COMMS.rd,
    hc = FM.use('comms'),
    n = radarNearest(R.b, R.r),
    tolB = (hc ? 2 : 3) * (Math.PI / 180);
  if (!n || n.bErr > tolB || n.rErr > Math.max(hc ? 100 : 150, 0.05 * n.c.r)) {
    R.bad++;
    SND.tone(240, 200, 0.18, 0.12, 'square');
    note('NOTHING THERE - LAY THE CURSOR AND THE STROBE ON THE CONTACT');
    return null;
  }
  const c = n.c;
  let m = R.M.get(c.ref);
  if (!m) R.M.set(c.ref, (m = { lab: String.fromCharCode(65 + (R.n++ % 26)), k: [] }));
  m.k.push({ t: SHIP.t, x: c.x, z: c.z });
  m.name = c.name;
  R.good++;
  let txt = 'CONTACT ' + m.lab + ' (' + c.name + ') BEARING ' + c3(cTrue(R.b)) + ' RANGE ' + cYd(R.r) + ' YDS';
  const k0 = m.k.find((q) => SHIP.t - q.t >= 40);
  if (k0) {
    const dt = SHIP.t - k0.t,
      vx = (c.x - k0.x) / dt,
      vz = (c.z - k0.z) / dt;
    m.trk = { crs: (((Math.atan2(vx, -vz) * 180) / Math.PI) % 360 + 360) % 360, kn: Math.hypot(vx, vz) / 0.5144, vx, vz, t: SHIP.t };
    R.tr++;
    txt += '. COURSE ' + c3(m.trk.crs) + ' SPEED ' + Math.round(m.trk.kn) + ' KNOTS';
  }
  SND.tone(880, 880, 0.08, 0.1, 'sine');
  RADIO.add('RADAR', txt, { own: true });
  note('RADAR: ' + txt);
  return { c, m };
}
function radarOverlay(g, s, R) {
  const C = COMMS.rd,
    k = s / 2 / R;
  g.save();
  /* the marks: each contact reported, at its plotted position, with its letter, and its course and speed line when tracked */
  for (const [, m] of C.M) {
    const q = m.k[m.k.length - 1],
      [b, r] = cRel(q.x, q.z);
    if (r > R) continue;
    const x = s / 2 + Math.sin(b) * r * k,
      y = s / 2 - Math.cos(b) * r * k;
    g.strokeStyle = 'rgba(255,220,120,0.9)';
    g.lineWidth = 2;
    g.strokeRect(x - 6, y - 6, 12, 12);
    g.fillStyle = 'rgba(255,220,120,0.95)';
    g.font = 'bold 18px monospace';
    g.textAlign = 'left';
    g.fillText(m.lab, x + 9, y - 6);
    if (m.trk) {
      const [b2, r2] = cRel(q.x + m.trk.vx * 180, q.z + m.trk.vz * 180) /* where she will be in 3 minutes */;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(s / 2 + Math.sin(b2) * r2 * k, s / 2 - Math.cos(b2) * r2 * k);
      g.stroke();
    }
  }
  /* game mode: the contact nearest the cursor is boxed */
  if (!FM.use('comms')) {
    const n = radarNearest(C.b, C.r);
    if (n && n.c.r < R && n.bErr < 0.14) {
      const x = s / 2 + Math.sin(n.c.b) * n.c.r * k,
        y = s / 2 - Math.cos(n.c.b) * n.c.r * k;
      g.strokeStyle = 'rgba(120,200,255,0.9)';
      g.setLineDash([4, 3]);
      g.strokeRect(x - 11, y - 11, 22, 22);
      g.setLineDash([]);
    }
  }
  /* the bearing cursor and the range strobe */
  g.strokeStyle = 'rgba(255,170,90,0.9)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(s / 2, s / 2);
  g.lineTo(s / 2 + Math.sin(C.b) * s * 0.5, s / 2 - Math.cos(C.b) * s * 0.5);
  g.stroke();
  const rr = Math.min(R, C.r) * k;
  g.beginPath();
  g.arc(s / 2 + Math.sin(C.b) * rr, s / 2 - Math.cos(C.b) * rr, 7, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([2, 6]);
  g.beginPath();
  g.arc(s / 2, s / 2, rr, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(255,190,120,0.95)';
  g.font = 'bold 20px monospace';
  g.textAlign = 'center';
  g.fillText('BRG ' + c3(cTrue(C.b)) + 'T  RNG ' + cYd(C.r) + ' YD', s / 2, 44);
  g.restore();
}
