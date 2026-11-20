/* ---------- compass ---------- */
const cc = $$('cmpc').getContext('2d'),
  CW = 640,
  HOME = new V(0, 0, -550),
  wr = (a) => (((a % 360) + 540) % 360) - 180;
const brg = (p) => (Math.atan2(p.x - pos.x, -(p.z - pos.z)) * 180) / Math.PI,
  hd = (p) => Math.hypot(p.x - pos.x, p.z - pos.z);
const fmtD = (d) => (d < 1000 ? Math.round(d / 10) * 10 + 'm' : (d / 1000).toFixed(1) + 'km');
function mkC(hdg, p, col, tag) {
  const rel = wr(brg(p) - hdg),
    ppd = CW / 120,
    out = Math.abs(rel) > 60,
    x = out ? (rel > 0 ? CW - 14 : 14) : CW / 2 + rel * ppd,
    c = cc;
  c.globalAlpha = out ? 0.7 : 1;
  c.fillStyle = col;
  c.strokeStyle = 'rgba(0,0,0,.7)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 8, 28);
  c.lineTo(x + 8, 28);
  c.lineTo(x, 43);
  c.closePath();
  c.stroke();
  c.fill();
  c.font = 'bold 12px ui-monospace,Menlo,monospace';
  c.textAlign = 'center';
  c.fillText(tag + ' ' + fmtD(hd(p)), Math.max(40, Math.min(CW - 40, x)), 87);
  c.globalAlpha = 1;
}
function drawCompass(hdg) {
  const c = cc,
    ppd = CW / 120;
  c.clearRect(0, 0, CW, 90);
  c.textAlign = 'center';
  for (let d = Math.floor((hdg - 62) / 5) * 5; d <= hdg + 62; d += 5) {
    const x = CW / 2 + (d - hdg) * ppd,
      dd = ((d % 360) + 360) % 360,
      maj = dd % 10 == 0;
    c.strokeStyle = 'rgba(255,255,255,.85)';
    c.lineWidth = maj ? 2 : 1;
    c.beginPath();
    c.moveTo(x, 48);
    c.lineTo(x, maj ? 60 : 55);
    c.stroke();
    if (dd % 30 == 0) {
      const lab = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[dd] || String(dd / 10).padStart(2, '0');
      c.font = 'bold 13px ui-monospace,Menlo,monospace';
      c.fillStyle = lab.length == 1 ? '#ffb43a' : '#e8f2e0';
      c.fillText(lab, x, 74);
    }
  }
  c.fillStyle = '#ffb43a';
  c.font = 'bold 14px ui-monospace,Menlo,monospace';
  c.fillText(String(Math.round(hdg) % 360).padStart(3, '0') + '°', CW / 2, 13);
  c.beginPath();
  c.moveTo(CW / 2 - 6, 17);
  c.lineTo(CW / 2 + 6, 17);
  c.lineTo(CW / 2, 25);
  c.closePath();
  c.fill();
  let best = null,
    bd = 1e9;
  for (const tt of T) {
    if (
      tt.dead ||
      !(
        trn.mode === 'free' ||
        (trn.mode === 'convoy' && tt.kind === 'veh') ||
        (trn.mode === 'bomb' && tt.kind === 'bld')
      )
    )
      continue;
    const d = hd(tt.c);
    if (d < bd) {
      bd = d;
      best = tt;
    }
  }
  let eb = null,
    ed = 1e9;
  for (const e of EN) {
    if (e.dying) continue;
    const d = hd(e.p);
    if (d < ed) {
      ed = d;
      eb = e;
    }
  }
  mkC(hdg, HOME, '#ffffff', 'H');
  if (eb) mkC(hdg, eb.p, '#ff4fd8', 'B');
  if (best) mkC(hdg, best.c, '#ff3b30', 'T');
}
