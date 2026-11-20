/* a rotating compass card (the directional gyro and the remote-reading compass) */
function pCard(c, x, y, r, hdg, title, small) {
  gBase(c, x, y, r, title);
  c.save();
  c.translate(x, y);
  c.rotate(-hdg * DEG);
  c.fillStyle = '#e8eaec';
  c.strokeStyle = '#e8eaec';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = 'bold ' + ((r * 0.2) | 0) + 'px sans-serif';
  for (let a = 0; a < 360; a += small ? 30 : 10) {
    c.save();
    c.rotate(a * DEG);
    c.lineWidth = a % 30 ? 1 : 2;
    c.beginPath();
    c.moveTo(0, -r * 0.9);
    c.lineTo(0, -r * (a % 30 ? 0.8 : 0.74));
    c.stroke();
    if (a % 30 == 0) c.fillText({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[a] || a / 10, 0, -r * 0.58);
    c.restore();
  }
  c.restore();
  c.fillStyle = '#ffb43a';
  c.beginPath();
  c.moveTo(x, y - r * 0.95);
  c.lineTo(x - 6, y - r * 0.7);
  c.lineTo(x + 6, y - r * 0.7);
  c.fill();
}
