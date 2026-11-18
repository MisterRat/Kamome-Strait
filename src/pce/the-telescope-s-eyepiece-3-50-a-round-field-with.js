/* the telescope's eyepiece (3"/50): a round field with the cross-wires and a mil scale, drawn over the view */
function gunOverlay() {
  const c = $$('gunOv');
  if (!c) return;
  const G = GUN.cur,
    free = camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn && !SCAM.on,
    want = !!(G && G.s.sight === 'scope' && !GUN.look && free),
    bino = !!(STN.bino && free);
  c.style.display = want || bino ? 'block' : 'none';
  if (!want && !bino) return;
  const w = innerWidth,
    h = innerHeight;
  if (bino) {
    if (c.dataset.mode !== 'bino' || c.width !== w || c.height !== h) {
      /* the binoculars: two overlapping round fields */
      c.dataset.mode = 'bino';
      c.width = w;
      c.height = h;
      const g = c.getContext('2d'),
        r = h * 0.46,
        dx = r * 0.62;
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-out';
      for (const s of [-1, 1]) {
        const rg = g.createRadialGradient(w / 2 + s * dx, h / 2, r * 0.85, w / 2 + s * dx, h / 2, r);
        rg.addColorStop(0, 'rgba(0,0,0,1)');
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg;
        g.beginPath();
        g.arc(w / 2 + s * dx, h / 2, r, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    return;
  }
  if (c.dataset.mode !== 'scope' || c.width !== w || c.height !== h) {
    c.dataset.mode = 'scope';
    c.width = w;
    c.height = h;
    const g = c.getContext('2d'),
      r = Math.min(w, h) * 0.47,
      cx = w / 2,
      cy = h / 2,
      px = h / 2 / Math.tan((G.s.fov * D2R) / 2) /* pixels per radian at the centre */;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#000';
    g.beginPath();
    g.rect(0, 0, w, h);
    g.arc(cx, cy, r, 0, Math.PI * 2, true);
    g.fill();
    const rg = g.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(10,10,10,0.9)';
    g.lineWidth = Math.max(1, h / 900);
    g.beginPath();
    g.moveTo(cx - r, cy);
    g.lineTo(cx + r, cy);
    g.moveTo(cx, cy - r);
    g.lineTo(cx, cy + r);
    /* mil ticks: every 10 mils, long every 50 */
    for (let m = -100; m <= 100; m += 10) {
      if (!m) continue;
      const o = m * 0.001 * px,
        L = (m % 50 ? 0.012 : 0.028) * h;
      if (Math.abs(o) > r) continue;
      g.moveTo(cx + o, cy - L);
      g.lineTo(cx + o, cy + L);
      g.moveTo(cx - L, cy + o);
      g.lineTo(cx + L, cy + o);
    }
    g.stroke();
  }
}
