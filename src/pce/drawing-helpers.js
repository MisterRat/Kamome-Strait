/* ---------- drawing helpers ---------- */
function dialFace(g, s, ticks, lab) {
  g.clearRect(0, 0, s, s);
  g.fillStyle = '#f2efe2';
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#222';
  g.fillStyle = '#222';
  g.lineWidth = s / 128;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const [a, txt, big] of ticks) {
    const c = Math.cos(a),
      sn = Math.sin(a),
      r0 = s * (big ? 0.37 : 0.41),
      r1 = s * 0.46;
    g.beginPath();
    g.moveTo(s / 2 + sn * r0, s / 2 - c * r0);
    g.lineTo(s / 2 + sn * r1, s / 2 - c * r1);
    g.stroke();
    if (txt !== undefined && txt !== '') {
      g.font = 'bold ' + Math.round(s * 0.085) + 'px monospace';
      g.fillText(txt, s / 2 + sn * s * 0.29, s / 2 - c * s * 0.29);
    }
  }
  if (lab) {
    g.font = Math.round(s * 0.07) + 'px monospace';
    g.fillText(lab, s / 2, s * 0.68);
  }
}
function needle(g, s, a, col, len) {
  g.save();
  g.translate(s / 2, s / 2);
  g.rotate(a);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-s * 0.018, s * 0.06);
  g.lineTo(0, -s * (len || 0.42));
  g.lineTo(s * 0.018, s * 0.06);
  g.fill();
  g.beginPath();
  g.arc(0, 0, s * 0.035, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
