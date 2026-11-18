/* ---------- HUD ---------- */
const FL_S = ['UP', '10°', '20°', '30°', '45°'],
  FL_H = ['UP', '10°', '20°', '30°', '40°', '50°'],
  tqf = $$('tqf'),
  tqh = $$('tqh'),
  tqv = $$('tqv'),
  fli = [...document.querySelectorAll('#flp i')];
let FL = FL_S;
const hud = $$('hud'),
  ah = $$('ah').getContext('2d'),
  warn = $$('warn');
function drawAH() {
  const c = ah,
    W = 120,
    pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y))),
    roll = Math.atan2(-right.y, up.y);
  c.clearRect(0, 0, W, W);
  c.save();
  c.beginPath();
  c.arc(60, 60, 58, 0, 7);
  c.clip();
  c.translate(60, 60);
  c.rotate(-roll);
  c.translate(0, pitch * 120);
  c.fillStyle = '#4f8fd0';
  c.fillRect(-200, -400, 400, 400);
  c.fillStyle = '#7a5a32';
  c.fillRect(-200, 0, 400, 400);
  c.strokeStyle = '#fff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-200, 0);
  c.lineTo(200, 0);
  for (let i = -3; i <= 3; i++) {
    if (!i) continue;
    const y = -i * 0.17 * 120,
      w = i % 2 ? 14 : 26;
    c.moveTo(-w, y);
    c.lineTo(w, y);
  }
  c.stroke();
  c.restore();
  c.strokeStyle = '#ffb43a';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(25, 60);
  c.lineTo(48, 60);
  c.moveTo(72, 60);
  c.lineTo(95, 60);
  c.moveTo(60, 60);
  c.lineTo(60, 52);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.5)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(60, 60, 58, 0, 7);
  c.stroke();
}
