/* ---------- cockpit interior (its group, ck, is the airframe's: see the cockpit group piece) ---------- */
const pcv = document.createElement('canvas');
pcv.width = 1024;
pcv.height = 640;
const pcx = pcv.getContext('2d'),
  ptex = new THREE.CanvasTexture(pcv);
const pmatD = new THREE.MeshLambertMaterial({ color: 0x151617 });
const pbg = (() => {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = '#17181a';
  g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 7000; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.18)';
    g.fillRect(Math.random() * 1024, Math.random() * 640, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const rv = (x, y) => {
    g.fillStyle = '#050505';
    g.beginPath();
    g.arc(x + 1, y + 1, 4, 0, 7);
    g.fill();
    g.fillStyle = '#8d9196';
    g.beginPath();
    g.arc(x, y, 3.4, 0, 7);
    g.fill();
    g.fillStyle = '#d4d7da';
    g.beginPath();
    g.arc(x - 1, y - 1, 1.2, 0, 7);
    g.fill();
  };
  const txt = (t, x, y, sz, col, al) => {
    g.fillStyle = col || '#c9ccd0';
    g.font = 'bold ' + sz + 'px sans-serif';
    g.textAlign = al || 'center';
    g.textBaseline = 'middle';
    g.fillText(t, x, y);
  };
  for (let x = 18; x < 1024; x += 62) {
    rv(x, 12);
    rv(x, 628);
  }
  for (let y = 44; y < 640; y += 62) {
    rv(12, y);
    rv(1012, y);
  }
  /* the two square housings (directional gyro, flight indicator), as in the manual's figure 2 */
  const hs = (x, y, w, h) => {
    g.fillStyle = '#0b0c0d';
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#2c2e31';
    g.lineWidth = 3;
    g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    rv(x + 9, y + 9);
    rv(x + w - 9, y + 9);
    rv(x + 9, y + h - 9);
    rv(x + w - 9, y + h - 9);
  };
  hs(345, 128, 150, 164);
  hs(520, 123, 160, 174);
  /* the base of the gun sight, top centre */
  {
    const gr = g.createLinearGradient(452, 0, 572, 0);
    gr.addColorStop(0, '#2f3134');
    gr.addColorStop(0.5, '#6d7074');
    gr.addColorStop(1, '#2f3134');
    g.fillStyle = gr;
    g.fillRect(452, 0, 120, 30);
    g.fillStyle = '#0a0a0a';
    g.fillRect(470, 8, 84, 8);
  }
  /* the glare-shield edge / placard line */
  g.fillStyle = '#08090a';
  g.fillRect(0, 436, 1024, 4);
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.fillRect(0, 440, 1024, 2);
  g.fillStyle = '#0a0a0a';
  g.fillRect(398, 446, 228, 24);
  txt('PARK BRAKE', 512, 458, 16, '#e8e8e2');
  g.fillStyle = '#c41d14';
  g.beginPath();
  g.arc(512, 482, 9, 0, 7);
  g.fill();
  /* silver "depress pedal to release parking brake" plates */
  const plate = (x, y, w, h) => {
    const gr = g.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, '#c6c9cb');
    gr.addColorStop(0.5, '#8f9395');
    gr.addColorStop(1, '#b3b6b8');
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
    g.strokeStyle = '#4a4d4f';
    g.lineWidth = 3;
    g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ['DEPRESS PEDAL', 'TO RELEASE', 'PARKING BRAKE'].forEach((t, i) =>
      txt(t, x + w / 2, y + h / 2 - 22 + i * 24, 17, '#5d6063'),
    );
    rv(x + 10, y + 10);
    rv(x + w - 10, y + 10);
    rv(x + 10, y + h - 10);
    rv(x + w - 10, y + h - 10);
  };
  plate(25, 530, 215, 100);
  plate(790, 530, 205, 100);
  /* the lower centre panel */
  g.fillStyle = '#3a403a';
  g.fillRect(255, 522, 515, 112);
  g.strokeStyle = '#161916';
  g.lineWidth = 3;
  g.strokeRect(256.5, 523.5, 512, 109);
  [
    [270, 536],
    [756, 536],
    [270, 620],
    [756, 620],
  ].forEach((q) => rv(q[0], q[1]));
  /* toggle switches */
  const tg = (x, y, label, up) => {
    g.fillStyle = '#2a2c2e';
    g.beginPath();
    g.arc(x, y, 11, 0, 7);
    g.fill();
    g.strokeStyle = '#7b7f83';
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = '#d8dadc';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + (up ? -17 : 17));
    g.stroke();
    g.fillStyle = '#f0f0ec';
    g.beginPath();
    g.arc(x, y + (up ? -18 : 18), 4.5, 0, 7);
    g.fill();
    txt(label, x, y + (up ? 26 : -26), 10, '#b9bcc0');
  };
  g.fillStyle = '#0b0c0d';
  g.fillRect(28, 450, 212, 70);
  g.strokeStyle = '#2c2e31';
  g.lineWidth = 2;
  g.strokeRect(29, 451, 210, 68);
  txt('BOMB CONTROL', 90, 460, 10, '#9a9da1');
  [
    ['LEFT', 58],
    ['RIGHT', 98],
    ['FUSE', 138],
  ].forEach(([l, x]) => tg(x, 490, l, false));
  txt('BOOSTER', 205, 460, 10, '#9a9da1');
  tg(50, 418, 'GUN SAFE', true); /* gun and camera safety switch (14) */
  g.fillStyle = '#0b0c0d';
  g.fillRect(8, 262, 26, 70);
  g.strokeStyle = '#8d9196';
  g.lineWidth = 2;
  g.strokeRect(8.5, 262.5, 25, 69);
  g.fillStyle = '#cfd2d4';
  g.fillRect(15, 276, 12, 8);
  g.fillStyle = '#d22';
  g.beginPath();
  g.arc(21, 280, 7, 0, 7);
  g.fill();
  txt('BOOST', 21, 346, 9, '#b9bcc0'); /* boost control lever (10) */
  tg(205, 490, 'PUMP', true);
  g.fillStyle = '#0b0c0d';
  g.fillRect(790, 450, 205, 70);
  g.strokeStyle = '#2c2e31';
  g.strokeRect(791, 451, 203, 68);
  tg(818, 490, 'STARTER', false);
  tg(868, 490, 'OIL DIL', false);
  g.fillStyle = '#1a1b1c';
  g.beginPath();
  g.arc(945, 485, 15, 0, 7);
  g.fill();
  g.strokeStyle = '#8d9196';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = '#d8dadc';
  g.beginPath();
  g.arc(945, 485, 7, 0, 7);
  g.fill();
  txt('PRIMER', 945, 463, 10, '#9a9da1');
  /* ignition switch (rotary, at BOTH), fuel shut-off, fuel selector, cockpit light, gun-sight rheostat, supercharger switch */
  const rot = (x, y, r, a, labels) => {
    g.fillStyle = '#0d0e0f';
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
    g.strokeStyle = '#8d9196';
    g.lineWidth = 3;
    g.stroke();
    g.strokeStyle = '#e8e8e2';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - Math.sin(a) * r * 0.2, y + Math.cos(a) * r * 0.2);
    g.lineTo(x + Math.sin(a) * r * 0.85, y - Math.cos(a) * r * 0.85);
    g.stroke();
    (labels || []).forEach(([t, ang]) =>
      txt(t, x + Math.sin(ang) * (r + 12), y - Math.cos(ang) * (r + 12), 9, '#b9bcc0'),
    );
  };
  rot(335, 580, 30, 0.7, [
    ['OFF', -1.2],
    ['L', -0.4],
    ['R', 0.3],
    ['BOTH', 1.0],
  ]);
  txt('IGNITION', 335, 540, 10, '#b9bcc0');
  g.fillStyle = '#0d0e0f';
  g.fillRect(412, 548, 40, 70);
  g.strokeStyle = '#8d9196';
  g.strokeRect(412.5, 548.5, 39, 69);
  txt('ON', 432, 558, 9, '#d8dadc');
  txt('SHUT', 432, 604, 9, '#d8dadc');
  g.fillStyle = '#d8dadc';
  g.beginPath();
  g.arc(432, 572, 8, 0, 7);
  g.fill();
  rot(505, 582, 30, -0.3, [
    ['L', -1.2],
    ['MAIN', 0],
    ['R', 1.2],
  ]);
  txt('FUEL SELECTOR', 505, 540, 10, '#b9bcc0');
  tg(585, 568, 'COCKPIT LT', false);
  g.fillStyle = '#0d0e0f';
  g.beginPath();
  g.arc(585, 612, 11, 0, 7);
  g.fill();
  g.strokeStyle = '#8d9196';
  g.lineWidth = 2;
  g.stroke();
  txt('SIGHT', 628, 612, 9, '#b9bcc0');
  tg(735, 568, 'SUPERCHARGER', true);
  return c;
})();
function lamp(c, x, y, lbl, on, col) {
  c.fillStyle = '#050505';
  c.beginPath();
  c.arc(x, y, 13, 0, 7);
  c.fill();
  c.fillStyle = on ? col : '#2b2b2b';
  c.beginPath();
  c.arc(x, y, 9, 0, 7);
  c.fill();
  if (on) {
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath();
    c.arc(x - 3, y - 3, 3, 0, 7);
    c.fill();
  }
  c.fillStyle = '#b9bcc0';
  c.font = 'bold 12px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillText(lbl, x, y + 16);
}
