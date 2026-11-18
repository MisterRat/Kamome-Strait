/* ---------- ADF radio compass: the needle points at a radio beacon, relative to the nose ---------- */
const BEACONS = [
  { id: 'KMM', name: 'KAMOME FIELD', x: ISL.bx, z: ISL.bz },
  { id: 'HOM', name: 'HOME FIELD', x: 70, z: 380 },
];
let adfSel = 0,
  adfT = 0;
function adfInfo(bc) {
  const dx = bc.x - pos.x,
    dz = bc.z - pos.z,
    hdg = (Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI,
    brg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  let rel = brg - hdg;
  rel = ((((rel + 180) % 360) + 360) % 360) - 180;
  return { dist: Math.hypot(dx, dz), brg: (brg + 360) % 360, hdg: (hdg + 360) % 360, rel };
}
$$('adf').onclick = () => {
  if (trn.mode === 'free') adfSel = (adfSel + 1) % BEACONS.length;
};
function drawADF() {
  const now = performance.now();
  if (now - adfT < 66) return;
  adfT = now;
  const el = $$('adf');
  if (!started || (trn.mode !== 'free' && trn.mode !== 'adf') || (trn.mode === 'free' && UI.hid.adf)) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.classList.toggle('mis', trn.mode === 'adf'); /* the ADF mission always shows it */
  const bc = BEACONS[trn.mode === 'adf' ? 0 : adfSel],
    b = adfInfo(bc),
    c = $$('adfc'),
    g = c.getContext('2d'),
    cx = 85,
    cy = 85,
    r = 76;
  g.clearRect(0, 0, 170, 214);
  /* the compass card turns with the heading; the needle shows the beacon relative to the nose */
  g.save();
  g.translate(cx, cy);
  g.fillStyle = '#10161c';
  g.beginPath();
  g.arc(0, 0, r, 0, 7);
  g.fill();
  g.strokeStyle = '#9aa';
  g.lineWidth = 2;
  g.stroke();
  g.save();
  g.rotate((-b.hdg * Math.PI) / 180);
  g.fillStyle = '#ddd';
  g.strokeStyle = '#ccd';
  g.font = 'bold 13px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let d = 0; d < 360; d += 10) {
    const a = (d * Math.PI) / 180,
      l = d % 30 === 0 ? 10 : 5;
    g.lineWidth = d % 90 === 0 ? 2 : 1;
    g.beginPath();
    g.moveTo(Math.sin(a) * (r - 2), -Math.cos(a) * (r - 2));
    g.lineTo(Math.sin(a) * (r - 2 - l), -Math.cos(a) * (r - 2 - l));
    g.stroke();
    if (d % 90 === 0) g.fillText(['N', 'E', 'S', 'W'][d / 90], Math.sin(a) * (r - 20), -Math.cos(a) * (r - 20));
    else if (d % 30 === 0) g.fillText(String(d / 10), Math.sin(a) * (r - 20), -Math.cos(a) * (r - 20));
  }
  g.restore();
  /* the needle: the red head points at the station */
  g.save();
  g.rotate((b.rel * Math.PI) / 180);
  g.fillStyle = '#ff5a3c';
  g.beginPath();
  g.moveTo(0, -r + 14);
  g.lineTo(7, 0);
  g.lineTo(-7, 0);
  g.closePath();
  g.fill();
  g.fillStyle = '#c8c8c8';
  g.beginPath();
  g.moveTo(0, r - 30);
  g.lineTo(5, 0);
  g.lineTo(-5, 0);
  g.closePath();
  g.fill();
  g.restore();
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(0, -r - 1);
  g.lineTo(5, -r + 9);
  g.lineTo(-5, -r + 9);
  g.closePath();
  g.fill(); /* the nose mark */
  g.restore();
  g.fillStyle = '#e8e8e0';
  g.font = 'bold 14px sans-serif';
  g.textAlign = 'center';
  const sp = Math.max(20, Math.hypot(vel.x, vel.z)),
    eta = b.dist / sp;
  g.fillText('ADF  ' + bc.id, 85, 184);
  g.font = '12px sans-serif';
  g.fillText(String(Math.round(b.brg)).padStart(3, '0') + '°  ' + (b.dist / 1000).toFixed(1) + ' km  ' + fmtT(eta), 85, 201);
}
const MFS = 104000,
  MFN = 416,
  MMF = document.createElement('canvas');
let mmFd = false;
const MMW = [[6, 97, 172, 234], [10, 54, 138, 213], [14, 52, 133, 208], [18, 49, 127, 202], [22, 46, 120, 194], [26, 42, 112, 185], [30, 38, 103, 176], [34, 34, 95, 168], [38, 30, 86, 159], [42, 26, 79, 151], [46, 23, 73, 145], [50, 21, 68, 140], [54, 20, 66, 138], [62, 20, 65, 137]];
