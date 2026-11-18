/* ---------- the sonar: echo ranging; the exercise submarine (practice targets) and the shoals answer ---------- */
const SONAR = { brg: 0 /* train, rel. to the bow, rad (+ starboard) */, R: [1000, 2000, 4000], ri: 1, t: 0, paper: null, last: null, dir: 1, rep: 0 };
function sonarRange(d) {
  SONAR.ri = Math.max(0, Math.min(2, SONAR.ri + d));
  note('SONAR ' + SONAR.R[SONAR.ri] + ' YARD SCALE');
}
function sonarPing(here) {
  const R = SONAR.R[SONAR.ri] * 0.9144,
    bow = [-Math.sin(SHIP.hdg), -Math.cos(SHIP.hdg)],
    stb = [Math.cos(SHIP.hdg), -Math.sin(SHIP.hdg)],
    ca = Math.cos(SONAR.brg),
    sa = Math.sin(SONAR.brg),
    dx = bow[0] * ca + stb[0] * sa,
    dz = bow[1] * ca + stb[1] * sa,
    E = [];
  /* the bottom and the shore: the first shoal water along the beam (less than 15 m deep) */
  for (let i = 3; i < 60; i++) {
    const r = (R * i) / 60;
    if (HR(pos.x + dx * r, pos.z + dz * r) > OCEAN.Y - 15) {
      E.push({ r, k: 0.5, dop: 0, w: 6 });
      break;
    }
  }
  if (PT.on)
    for (const t of PT.L) {
      if (t.kind !== 'sub') continue;
      const ex = t.p.x - pos.x,
        ez = t.p.z - pos.z,
        r = Math.hypot(ex, ez);
      if (r > R) continue;
      const b = Math.atan2(ex * stb[0] + ez * stb[1], ex * bow[0] + ez * bow[1]),
        off = Math.abs(angW(b - SONAR.brg));
      if (off > 0.16) continue;
      /* Doppler: the target's motion along the line of sight, less the ship's own */
      const rv = ((t.v.x - vel.x) * ex + (t.v.z - vel.z) * ez) / r;
      E.push({ r, k: 1 - off / 0.2, dop: -rv, w: 3, sub: true, b });
    }
  SONAR.last = { E, t: 0 };
  commsEcho(E, here);
  /* the paper moves on a step and the stylus writes the reverberation and the echoes */
  const p = SONAR.paper,
    g = p.getContext('2d'),
    W = p.width,
    H = p.height;
  g.drawImage(p, -6, 0);
  g.fillStyle = '#e9e2c6';
  g.fillRect(W - 6, 0, 6, H);
  for (let y = 0; y < H * 0.12; y += 2) {
    g.fillStyle = 'rgba(40,30,20,' + (0.5 * (1 - y / (H * 0.12))) * Math.random() + ')';
    g.fillRect(W - 6, y, 5, 2);
  }
  for (const e of E) {
    g.fillStyle = 'rgba(25,18,10,' + (0.5 + 0.5 * e.k) + ')';
    g.fillRect(W - 6, (e.r / R) * H - e.w / 2, 5, e.w);
  }
  if (here) {
    SND.tone(1150, 1140, 0.12, 0.12, 'sine');
    for (const e of E) SND.tone(1150 * (1 + e.dop / 750), 1150 * (1 + e.dop / 750), 0.12, 0.07 * e.k * (e.sub ? 1 : 0.5), 'sine', Math.min(6, (2 * e.r) / 1500));
  }
  const sub = E.find((e) => e.sub);
  if (sub && SHIP.t - SONAR.rep > 30) {
    SONAR.rep = SHIP.t;
    const brg = Math.round(((((-SHIP.hdg + sub.b) * 180) / Math.PI) % 360 + 360) % 360),
      yd = Math.round(sub.r / 0.9144 / 50) * 50,
      dop = sub.dop > 0.8 ? 'UP DOPPLER' : sub.dop < -0.8 ? 'DOWN DOPPLER' : 'NO DOPPLER';
    RADIO.add('SONAR', 'CONTACT BEARING ' + String(brg).padStart(3, '0') + ' RANGE ' + yd + ' YDS ' + dop);
    if (!here) note('SONAR CONTACT ' + String(brg).padStart(3, '0') + ' - ' + yd + ' YDS');
  }
}
function sonarStep(dt, here, train) {
  if (!SONAR.paper) {
    SONAR.paper = document.createElement('canvas');
    SONAR.paper.width = 400;
    SONAR.paper.height = 330;
    const g = SONAR.paper.getContext('2d');
    g.fillStyle = '#e9e2c6';
    g.fillRect(0, 0, 400, 330);
  }
  if (here) SONAR.brg = Math.max(-2.8, Math.min(2.8, SONAR.brg + train * 0.26 * dt));
  SONAR.t += dt;
  const T = (2 * SONAR.R[SONAR.ri] * 0.9144) / 1500 + 0.4;
  if (SONAR.t >= T) {
    SONAR.t = 0;
    /* searching alone, the operator steps the beam 5 degrees a ping across the bow, 80 degrees each side */
    if (!here) {
      /* with a contact he holds it: the beam on the last fix, hunting a little either side; without one he searches */
      const E = subEst();
      if (E && E.age < 30) SONAR.brg = Math.max(-2.8, Math.min(2.8, cRel(E.p.x, E.p.z)[0] + (SONAR.dir = -SONAR.dir) * 0.04));
      else {
        SONAR.brg += SONAR.dir * 0.087;
        if (Math.abs(SONAR.brg) > 1.4) SONAR.dir = -SONAR.dir;
      }
    }
    sonarPing(here);
  }
}
function sonarRecDraw(f) {
  const g = f.g,
    W = 512,
    H = 430;
  g.fillStyle = '#2b2f33';
  g.fillRect(0, 0, W, H);
  if (SONAR.paper) g.drawImage(SONAR.paper, 40, 50, 432, 340);
  /* the stylus: it runs down the paper as the sound goes out and back */
  const k = Math.min(1, SONAR.t / ((2 * SONAR.R[SONAR.ri] * 0.9144) / 1500));
  g.fillStyle = '#7a1a10';
  g.fillRect(462, 50 + k * 340 - 3, 14, 6);
  g.fillStyle = '#d8d2b8';
  g.font = 'bold 22px monospace';
  g.textAlign = 'left';
  g.fillText('RANGE RECORDER  ' + SONAR.R[SONAR.ri] + ' YDS', 40, 34);
  g.font = '18px monospace';
  for (let i = 0; i <= 4; i++) g.fillText(String((SONAR.R[SONAR.ri] * i) / 4), 2, 56 + (340 * i) / 4);
}
function sonarBrgDraw(f) {
  const s = 256,
    T = [];
  for (let d = 0; d < 360; d += 10) T.push([(d * Math.PI) / 180, d % 30 ? '' : String(d / 10).padStart(2, '0'), d % 30 === 0]);
  dialFace(f.g, s, T, 'TRAIN');
  needle(f.g, s, SONAR.brg, '#b01a10', 0.42);
}
