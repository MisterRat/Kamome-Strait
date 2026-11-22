/* ---------- the radar (surface search, ship's head up) ---------- */
const RADAR = { R: [2, 5, 10], ri: 1, a: 0, last: 0, off: null };
function radarRange(d) {
  RADAR.ri = Math.max(0, Math.min(RADAR.R.length - 1, RADAR.ri + d));
  if (RADAR.off) RADAR.off.getContext('2d').clearRect(0, 0, 512, 512);
  note('RADAR ' + RADAR.R[RADAR.ri] + ' MILE SCALE');
}
function radarContacts() {
  const L = [];
  for (const t of T) if (t.type === 'ship' && !t.dead) L.push([t.c.x, t.c.z, 2]);
  if (typeof AFLD !== 'undefined' && AFLD.a) for (const o of AFLD.a) if (o.kind === 'ship' && o.m && o.m !== SHIPM.mesh) L.push([o.m.position.x, o.m.position.z, 2.5]);
  if (PT.on) for (const t of PT.L) if (t.kind === 'raft' || t.kind === 'sled' || t.kind === 'ptboat') L.push([t.p.x, t.p.z, t.kind === 'ptboat' ? 1.5 : 1]);
  return L;
}
function radarDraw(f, dt) {
  const s = 512,
    g = f.g;
  if (!RADAR.off) {
    RADAR.off = document.createElement('canvas');
    RADAR.off.width = RADAR.off.height = s;
  }
  const o = RADAR.off.getContext('2d'),
    R = RADAR.R[RADAR.ri] * 1852,
    a0 = RADAR.a,
    a1 = a0 + (engPower() ? Math.min(1.2, dt * (Math.PI * 2) / 4) : 0) /* 15 turns a minute; no power, no sweep */,
    bow = [-Math.sin(SHIP.hdg), -Math.cos(SHIP.hdg)],
    stb = [Math.cos(SHIP.hdg), -Math.sin(SHIP.hdg)],
    k = s / 2 / R;
  /* the phosphor fades */
  o.globalCompositeOperation = 'destination-out';
  o.fillStyle = 'rgba(0,0,0,' + Math.min(1, dt * 0.35) + ')';
  o.fillRect(0, 0, s, s);
  o.globalCompositeOperation = 'source-over';
  const C = radarContacts();
  for (let a = a0; a < a1; a += 0.01) {
    const ca = Math.cos(a),
      sa = Math.sin(a),
      dx = bow[0] * ca + stb[0] * sa,
      dz = bow[1] * ca + stb[1] * sa;
    /* land: the first high ground along the beam paints, and shadows what is behind it */
    let shadow = false;
    for (let i = 4; i < 90; i++) {
      const r = (R * i) / 90,
        h = HR(pos.x + dx * r, pos.z + dz * r);
      if (h > OCEAN.Y + 0.5) {
        o.fillStyle = shadow ? 'rgba(90,255,140,0.18)' : 'rgba(110,255,150,0.9)';
        o.fillRect(s / 2 + sa * r * k - 2, s / 2 - ca * r * k - 2, 4, 4);
        shadow = true;
      }
    }
    for (const c of C) {
      const ex = c[0] - pos.x,
        ez = c[1] - pos.z,
        r = Math.hypot(ex, ez);
      if (r > R || r < 30) continue;
      const b = Math.atan2(ex * stb[0] + ez * stb[1], ex * bow[0] + ez * bow[1]);
      if (Math.abs(angW(b - a)) < 0.006) {
        o.fillStyle = 'rgba(190,255,200,1)';
        o.beginPath();
        o.arc(s / 2 + Math.sin(b) * r * k, s / 2 - Math.cos(b) * r * k, 3 + c[2] * 2, 0, Math.PI * 2);
        o.fill();
      }
    }
    /* sea clutter close in */
    for (let i = 0; i < 3; i++) {
      const r = Math.random() * Math.random() * 600;
      o.fillStyle = 'rgba(90,255,140,0.35)';
      o.fillRect(s / 2 + sa * r * k, s / 2 - ca * r * k, 2, 2);
    }
  }
  RADAR.a = a1 % (Math.PI * 2);
  /* the scope: dark face, the painted returns, range rings, the heading flash, the sweep */
  g.clearRect(0, 0, s, s);
  g.save();
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = '#031a0b';
  g.fillRect(0, 0, s, s);
  g.drawImage(RADAR.off, 0, 0);
  g.strokeStyle = 'rgba(80,220,120,0.35)';
  g.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) {
    g.beginPath();
    g.arc(s / 2, s / 2, (s / 2) * (i / 4), 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(s / 2, s / 2);
  g.lineTo(s / 2, 4);
  g.stroke();
  g.strokeStyle = 'rgba(170,255,190,0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(s / 2, s / 2);
  g.lineTo(s / 2 + Math.sin(RADAR.a) * s * 0.5, s / 2 - Math.cos(RADAR.a) * s * 0.5);
  g.stroke();
  g.fillStyle = 'rgba(150,255,170,0.8)';
  g.font = 'bold 22px monospace';
  g.textAlign = 'left';
  g.textAlign = 'center';
  g.fillText(RADAR.R[RADAR.ri] + ' NM  RINGS ' + RADAR.R[RADAR.ri] / 4 + ' NM', s / 2, 470);
  radarOverlay(g, s, R);
  g.restore();
  if (!engPower()) {
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#ff8a6a';
    g.font = 'bold 30px monospace';
    g.textAlign = 'center';
    g.fillText('NO POWER', s / 2, s / 2 + 10);
    g.textAlign = 'left';
  }
}
