/* a small round gauge with a green arc */
function pSmall(c, x, y, r, t, val, mx, bands, lo) {
  lo = lo || 0;
  gBase(c, x, y, r, '');
  gTicks(c, x, y, r, lo, mx, -120, 120, (mx - lo) / 4, 2, () => '', 9);
  (bands || []).forEach((b) => gBand(c, x, y, r, lo, mx, -120, 120, b[0], b[1], b[2]));
  gNeedle(c, x, y, r, val, lo, mx, -120, 120, 0.82, '#fff', 2.4);
  c.fillStyle = '#b9bcc0';
  c.font = 'bold ' + Math.max(9, (r * 0.3) | 0) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'top';
  c.fillText(t, x, y + r + 9);
}
function drawPanel() {
  const c = pcx,
    v = vel.length(),
    mph = v * 2.237,
    altF = pos.y,
    iasV = FM.ias || v,
    hdg = ((Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI + 360) % 360,
    pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y))),
    roll = Math.atan2(-right.y, up.y),
    rpm = Math.min(3300, 700 + thr * 2300 + Math.max(0, mph - 420) * 3),
    mp = 12 + thr * 49,
    now = performance.now();
  c.drawImage(pbg, 0, 0);
  /* turn rate from the change of heading (standard rate = 3 degrees a second) */
  {
    const dt = (now - PNL.t) / 1000;
    if (dt > 0.02 && dt < 1) {
      let d = hdg - PNL.hd;
      d = ((d + 540) % 360) - 180;
      PNL.tr += (d / dt - PNL.tr) * 0.4;
    }
    PNL.hd = hdg;
    PNL.t = now;
  }
  /* top row: remote-reading compass (5), clock (3), suction gauge (1), manifold pressure (37), oxygen blinker (35) */
  pCard(c, 215, 85, 48, hdg, '', true);
  c.fillStyle = '#9a9da1';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('REMOTE COMPASS', 215, 146);
  {
    const x = 330,
      y = 85,
      r = 48,
      d = new Date(),
      hh = (d.getHours() % 12) + d.getMinutes() / 60,
      mm = d.getMinutes() + d.getSeconds() / 60;
    gBase(c, x, y, r, '');
    c.strokeStyle = '#e8eaec';
    for (let i = 0; i < 12; i++) {
      const a = i * 30 * DEG;
      c.lineWidth = i % 3 ? 1.5 : 3;
      c.beginPath();
      c.moveTo(x + Math.sin(a) * r * 0.8, y - Math.cos(a) * r * 0.8);
      c.lineTo(x + Math.sin(a) * r * 0.94, y - Math.cos(a) * r * 0.94);
      c.stroke();
    }
    gNeedle(c, x, y, r, hh, 0, 12, 0, 360, 0.5, '#fff', 4);
    gNeedle(c, x, y, r, mm, 0, 60, 0, 360, 0.8, '#fff', 3);
    c.fillStyle = '#9a9da1';
    c.fillText('CLOCK', x, y + r + 16);
  }
  gBase(c, 690, 85, 48, '');
  gTicks(c, 690, 85, 48, 0, 10, -120, 120, 2, 2, (q) => q, 1);
  gBand(c, 690, 85, 48, 0, 10, -120, 120, 3.75, 4.25, '#3c3');
  gNeedle(c, 690, 85, 48, engOut ? 0.4 : 4.0, 0, 10, -120, 120, 0.8, '#fff', 2.6);
  c.fillStyle = '#9a9da1';
  c.fillText('SUCTION', 690, 85 + 48 + 16);
  gBase(c, 830, 80, 56, 'MAN PRESS kPa');
  gBand(c, 830, 80, 56, 40, 240, -120, 120, 88, 122, '#3c3');
  gBand(c, 830, 80, 56, 40, 240, -120, 120, 122, 207, '#ec3');
  gBand(c, 830, 80, 56, 40, 240, -120, 120, 207, 240, '#d22');
  gTicks(c, 830, 80, 56, 40, 240, -120, 120, 40, 2, (q) => q, 1);
  gNeedle(c, 830, 80, 56, mp * 3.386, 40, 240, -120, 120, 0.8, '#fff', 3.4);
  {
    const x = 925,
      y = 175,
      r = 36,
      on = 0; /* the oxygen flow blinker stays dark: the flashing was distracting */
    gBase(c, x, y, r, '');
    c.fillStyle = on ? '#e8e8e2' : '#101010';
    c.beginPath();
    c.arc(x, y - 4, r * 0.5, 0, 7);
    c.fill();
    c.fillStyle = '#9a9da1';
    c.font = 'bold 10px sans-serif';
    c.fillText('O2 FLOW', x, y + r + 16);
  }
  /* left column: carburettor air temperature (9) and the g meter */
  pSmall(
    c,
    95,
    210,
    44,
    'CARB AIR C',
    engOut ? 10 : 15 + thr * 12 + FM.eT * 15,
    60,
    [
      [15, 30, '#3c3'],
      [40, 60, '#d22'],
    ],
    -30,
  );
  {
    const x = 95,
      y = 330,
      r = 44;
    gBase(c, x, y, r, 'G');
    gTicks(c, x, y, r, -4, 10, -120, 120, 2, 2, (q) => q, 1);
    gNeedle(c, x, y, r, gF, -4, 10, -120, 120, 0.8, '#fff', 3);
  }
  /* middle row: airspeed (4), directional gyro (2), flight indicator (36), tachometer (34) */
  {
    const x = 240,
      y = 210,
      r = 84;
    gBase(c, x, y, r, 'AIR SPEED  KM/H');
    gBand(c, x, y, r, 0, 1000, -150, 150, 810, 1000, '#d22');
    gTicks(c, x, y, r, 0, 1000, -150, 150, 100, 5, (q) => q, 2);
    gNeedle(c, x, y, r, iasV * 3.6, 0, 1000, -150, 150, 0.8, '#fff', 5);
  }
  pCard(c, 420, 210, 58, hdg, 'DIR GYRO', false);
  {
    const x = 600,
      y = 210,
      r = 64;
    gBase(c, x, y, r, '');
    c.save();
    c.beginPath();
    c.arc(x, y, r - 2, 0, 7);
    c.clip();
    c.translate(x, y);
    c.rotate(-roll);
    c.translate(0, pitch * r * 2.2);
    c.fillStyle = '#3d78b8';
    c.fillRect(-200, -400, 400, 400);
    c.fillStyle = '#6b4f2e';
    c.fillRect(-200, 0, 400, 400);
    c.strokeStyle = '#fff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-200, 0);
    c.lineTo(200, 0);
    for (let i = -3; i <= 3; i++) {
      if (!i) continue;
      const yy = -i * r * 0.38,
        w = i % 2 ? r * 0.2 : r * 0.4;
      c.moveTo(-w, yy);
      c.lineTo(w, yy);
    }
    c.stroke();
    c.restore();
    c.strokeStyle = '#ffb43a';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x - r * 0.55, y);
    c.lineTo(x - r * 0.18, y);
    c.moveTo(x + r * 0.18, y);
    c.lineTo(x + r * 0.55, y);
    c.moveTo(x, y);
    c.lineTo(x, y - r * 0.1);
    c.stroke();
  }
  {
    const x = 810,
      y = 210,
      r = 84;
    gBase(c, x, y, r, 'TACHOMETER  RPM x100');
    gBand(c, x, y, r, 0, 45, -120, 120, 16, 24, '#3c3');
    gBand(c, x, y, r, 0, 45, -120, 120, 30, 32.4, '#ec3');
    gBand(c, x, y, r, 0, 45, -120, 120, 32.4, 45, '#d22');
    gTicks(c, x, y, r, 0, 45, -120, 120, 5, 5, (q) => q, 1);
    gNeedle(c, x, y, r, rpm / 100, 0, 45, -120, 120, 0.8, '#fff', 5);
  }
  /* bottom row: altimeter (12), bank-and-turn (13), rate of climb (31), coolant (32), oil/fuel/oil pressure (33) */
  {
    const x = 240,
      y = 385,
      r = 74;
    gBase(c, x, y, r, 'ALTIMETER  M');
    gTicks(c, x, y, r, 0, 10, 0, 360, 1, 5, (q) => q % 10, 1);
    gNeedle(c, x, y, r, (((altF % 10000) + 10000) % 10000) / 1000, 0, 10, 0, 360, 0.5, '#fff', 6);
    gNeedle(c, x, y, r, (((altF % 1000) + 1000) % 1000) / 100, 0, 10, 0, 360, 0.85, '#fff', 3.5);
  }
  {
    const x = 410,
      y = 385,
      r = 56,
      tr = Math.max(-1, Math.min(1, PNL.tr / 6)),
      slip = Math.max(-1, Math.min(1, (vel.dot(right) / Math.max(25, v)) * 6));
    gBase(c, x, y, r, 'BANK & TURN');
    c.strokeStyle = '#e8eaec';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - r * 0.7, y - r * 0.15);
    c.lineTo(x - r * 0.7, y - r * 0.3);
    c.moveTo(x + r * 0.7, y - r * 0.15);
    c.lineTo(x + r * 0.7, y - r * 0.3);
    c.moveTo(x, y - r * 0.15);
    c.lineTo(x, y - r * 0.3);
    c.stroke();
    c.save();
    c.translate(x, y + r * 0.1);
    c.rotate(tr * 0.5);
    c.strokeStyle = '#ffb43a';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-r * 0.62, 0);
    c.lineTo(r * 0.62, 0);
    c.moveTo(0, 0);
    c.lineTo(0, -r * 0.2);
    c.stroke();
    c.restore();
    c.fillStyle = '#0a0a0a';
    c.fillRect(x - r * 0.62, y + r * 0.42, r * 1.24, r * 0.2);
    c.fillStyle = '#e8eaec';
    c.beginPath();
    c.arc(x + slip * r * 0.5, y + r * 0.52, r * 0.08, 0, 7);
    c.fill();
  }
  {
    const x = 590,
      y = 385,
      r = 62;
    gBase(c, x, y, r, 'CLIMB M/S');
    gTicks(c, x, y, r, -20, 20, -255, 75, 5, 5, (q) => Math.abs(q), 1);
    gNeedle(c, x, y, r, Math.max(-20, Math.min(20, vel.y)), -20, 20, -255, 75, 0.8, '#fff', 3.5);
  }
  pSmall(c, 705, 385, 42, 'COOLANT C', engOut ? 40 : 85 + thr * 25 + FM.eT * 30, 150, [
    [100, 110, '#3c3'],
    [121, 150, '#d22'],
  ]);
  {
    const x = 860,
      y = 385,
      r = 70;
    gBase(c, x, y, r, '');
    pSmall(c, x - r * 0.45, y - r * 0.1, r * 0.4, '', engOut ? 40 : 65 + thr * 15 + FM.eT * 25, 150, [
      [70, 80, '#3c3'],
      [90, 150, '#d22'],
    ]);
    pSmall(c, x + r * 0.45, y - r * 0.1, r * 0.4, '', engOut ? 0 : 14, 25, [
      [12, 16, '#3c3'],
      [19, 25, '#d22'],
    ]);
    pSmall(c, x, y + r * 0.42, r * 0.4, '', engOut ? 4 : 70 + thr * 10, 100, [
      [0, 50, '#d22'],
      [70, 80, '#3c3'],
      [90, 100, '#d22'],
    ]);
    c.fillStyle = '#9a9da1';
    c.font = 'bold 10px sans-serif';
    c.textAlign = 'center';
    c.fillText('OIL TEMP  FUEL P  OIL P', x, y + r + 16);
  }
  /* hydraulic pressure gauge (21) in the lower centre panel */
  pSmall(c, 665, 582, 30, 'HYD', engOut ? 600 : 1000, 1500, [[800, 1100, '#3c3']]);
  /* oxygen pressure gauge (29) and oxygen system warning light (30) */
  pSmall(
    c,
    950,
    285,
    38,
    'OXYGEN',
    400,
    500,
    [
      [400, 500, '#3c3'],
      [0, 100, '#d22'],
    ],
    0,
  );
  lamp(c, 940, 372, 'O2', false, '#ff3b30');
  /* warning lights */
  lamp(c, 270, 496, 'GEAR', gearOn, '#38d058');
  lamp(c, 345, 496, 'FLAPS', flapLvl > 0, '#ffb030');
  lamp(c, 420, 496, 'ENG FAIL', engOut, '#ff3b30');
  lamp(c, 595, 496, 'STALL', buffet > 0.05, '#ffb030');
  lamp(c, 670, 496, 'MAGS', !engOut, '#38d058');
  lamp(c, 745, 496, 'BATT', true, '#38d058');
  const nk = WX.lt || 0; /* night: the instrument lights are dim */
  if (nk > 0.05) {
    c.fillStyle = 'rgba(0,0,0,' + (0.5 * nk).toFixed(2) + ')';
    c.fillRect(0, 0, 1024, 640);
  }
  ptex.needsUpdate = true;
}

