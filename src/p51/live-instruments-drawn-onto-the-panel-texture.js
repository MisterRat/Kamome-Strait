/* live instruments, drawn onto the panel texture */
const DEG = Math.PI / 180;
let ckT = 0;
function gBase(c, x, y, r, title) {
  c.fillStyle = '#050606';
  c.beginPath();
  c.arc(x, y, r + 8, 0, 7);
  c.fill();
  c.strokeStyle = '#6a6d70';
  c.lineWidth = 4;
  c.beginPath();
  c.arc(x, y, r + 5, 0, 7);
  c.stroke();
  c.fillStyle = '#101214';
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
  c.fillStyle = '#d8dadc';
  c.font = 'bold ' + ((r * 0.16) | 0) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(title, x, y + r * 0.5);
}
function gTicks(c, x, y, r, mn, mx, a0, a1, maj, minN, fmt, every) {
  const n = Math.round((mx - mn) / maj);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let i = 0; i <= n; i++) {
    const v = mn + i * maj,
      a = (a0 + ((a1 - a0) * (v - mn)) / (mx - mn)) * DEG,
      s = Math.sin(a),
      co = -Math.cos(a);
    c.strokeStyle = '#e8eaec';
    c.lineWidth = r * 0.035 + 1;
    c.beginPath();
    c.moveTo(x + s * r * 0.82, y + co * r * 0.82);
    c.lineTo(x + s * r * 0.96, y + co * r * 0.96);
    c.stroke();
    if (i % every == 0) {
      c.fillStyle = '#e8eaec';
      c.font = 'bold ' + ((r * 0.15) | 0) + 'px sans-serif';
      c.fillText(fmt(v), x + s * r * 0.66, y + co * r * 0.66);
    }
    if (i < n)
      for (let j = 1; j < minN; j++) {
        const a2 = (a0 + ((a1 - a0) * (v + (maj * j) / minN - mn)) / (mx - mn)) * DEG;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x + Math.sin(a2) * r * 0.89, y - Math.cos(a2) * r * 0.89);
        c.lineTo(x + Math.sin(a2) * r * 0.96, y - Math.cos(a2) * r * 0.96);
        c.stroke();
      }
  }
}
function gBand(c, x, y, r, mn, mx, a0, a1, v0, v1, col) {
  const f = (v) => (a0 + ((a1 - a0) * (v - mn)) / (mx - mn)) * DEG - Math.PI / 2;
  c.strokeStyle = col;
  c.lineWidth = r * 0.07;
  c.beginPath();
  c.arc(x, y, r * 0.9, f(v0), f(v1));
  c.stroke();
}
function gNeedle(c, x, y, r, val, mn, mx, a0, a1, len, col, w) {
  const a = (a0 + (a1 - a0) * Math.max(0, Math.min(1, (val - mn) / (mx - mn)))) * DEG,
    s = Math.sin(a),
    co = -Math.cos(a);
  c.strokeStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - s * r * 0.12, y - co * r * 0.12);
  c.lineTo(x + s * r * len, y + co * r * len);
  c.stroke();
  c.fillStyle = '#222';
  c.beginPath();
  c.arc(x, y, r * 0.07, 0, 7);
  c.fill();
}
const PNL = { hd: 0, t: 0, tr: 0 };
