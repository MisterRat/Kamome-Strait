/* THE DRIVER'S COMPARTMENT (station 4, buttoned up; PLAN_M4A3_Sherman_Tank 5.4, T2). From TM 9-754 fig. 9 (the driver's control group)
   and fig. 10 (the instrument box) in References/M4A3/Interior photos (the M4A4's; the GAA tank's is close): the two steering levers
   (the laterals) rising from the floor in front of his seat, the parking brake lever on their left, the clutch (left) and accelerator
   (right) pedals, the gear shift lever on the transmission at his right hand, the transmission's ribbed housing between him and the
   assistant driver, the instrument box on the left sponson turned toward him, his hatch periscope over his head. The hull inside is
   white, as they were painted. Shown only while the player is at station 4's third view (TANK.STN 4: the seat down, looking at the
   panel): the display copies and the far tanks never carry it.
   It moves with the drive train (DRV): the laterals pulled back as far as they are held, the gear lever in its gate (1st and reverse
   to the left, 2nd and 3rd in the middle, 4th and 5th to the right; forward for 1st, 2nd and 4th, back for reverse, 3rd and 5th),
   the accelerator under the foot, the clutch down in a shift, the parking brake lever up when set. The instruments are live: the
   tachometer, speedometer (miles per hour), engine water temperature, oil pressure, volts, amperes, fuel, the power unit's oil
   temperature, the clock (the game's), the warning lights. The model's frame: nose +x, up +y, right +z (the hull's 0 at its centre). */
/* the inside's own light: the hatch shut, only a little daylight comes through the periscopes, and the dome light is on */
const DCOMP_MAT = () => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x34332d });
const DCOMP = { g: null, lat: [], gear: null, acc: null, clu: null, park: null, cv: null, ctx: null, tex: null, t: 0 };
function dcompBuild() {
  if (DCOMP.g || !TANK.mesh) return;
  const { part, bx, cyl, sph } = GX,
    WH_ = 0xd9d6c8 /* the inside's white */,
    GR = 0x6b6b62,
    DK = 0x2a2a26,
    OD = 0x4f5530,
    P = [];
  const plate = (x, y, z, sx, sy, sz, c, rz) => P.push(part(bx(sx, sy, sz), c || WH_, x, y, z, 0, 0, rz || 0));
  /* the shell: floor, the lower hull's sides between the tracks, the sponsons' floors and sides, the roof, the glacis and the nose
     inside, the bulkhead toward the fighting compartment (behind the seats, in shadow) */
  plate(1.0, 0.46, 0, 2.9, 0.03, 1.62, GR);
  for (const s of [-1, 1]) {
    plate(1.0, 0.74, s * 0.82, 2.9, 0.56, 0.03);
    plate(1.0, 1.0, s * 1.03, 2.9, 0.03, 0.42);
    plate(1.0, 1.43, s * 1.25, 2.9, 0.86, 0.03);
  }
  plate(0.55, 1.86, 0, 1.95, 0.03, 2.5);
  {
    const ax = 1.53,
      ay = 1.89,
      bx_ = 2.463,
      by = 1.02,
      L = Math.hypot(bx_ - ax, ay - by),
      a = Math.atan2(by - ay, bx_ - ax);
    plate((ax + bx_) / 2 - 0.05, (ay + by) / 2 - 0.05, 0, L, 0.03, 2.5, WH_, a);
    plate(2.36, 0.75, 0, 0.03, 0.6, 1.62);
  }
  plate(-0.42, 1.15, 0, 0.03, 1.4, 2.5, DK);
  /* the transmission between the drivers: the ribbed housing and the differential's housing ahead of it */
  P.push(part(cyl(0.3, 0.33, 1.1, 18), 0x8f8d80, 1.65, 0.78, 0.05, 0, 0, Math.PI / 2));
  for (let i = 0; i < 6; i++) P.push(part(cyl(0.345, 0.345, 0.03, 18), 0x9c9a8c, 1.25 + i * 0.13, 0.78, 0.05, 0, 0, Math.PI / 2));
  P.push(part(bx(0.5, 0.5, 1.2), 0x8f8d80, 2.15, 0.72, 0.05));
  /* the seats: the driver's on the left, the assistant driver's on the right; their backs */
  for (const z of [-0.52, 0.62]) {
    P.push(part(bx(0.46, 0.08, 0.44), 0x55524a, 0.48, 0.92, z), part(bx(0.07, 0.46, 0.42), 0x55524a, 0.24, 1.17, z));
    P.push(part(cyl(0.035, 0.035, 0.44, 8), GR, 0.48, 0.68, z));
  }
  /* his hatch periscope over his head, the hatch's hinge beam; the siren switch and the choke on the left wall */
  P.push(part(bx(0.16, 0.3, 0.12), DK, 1.11, 1.7, -0.4), part(bx(0.02, 0.07, 0.1), 0x8fa7b0, 1.03, 1.62, -0.4));
  P.push(part(bx(0.04, 0.05, 0.18), GR, 0.98, 1.08, -1.2), part(cyl(0.012, 0.012, 0.16, 6), DK, 1.05, 1.15, -1.18, Math.PI / 2, 0, 0));
  const shell = new THREE.Mesh(new GX.Acc().add(P, new GX.M4()).geometry(), DCOMP_MAT());
  DCOMP.g = new THREE.Group();
  DCOMP.g.add(shell);
  /* a moving part: its parts round a pivot, a group placed at the pivot */
  const mover = (parts, x, y, z) => {
    const m = new THREE.Mesh(new GX.Acc().add(parts, new GX.M4()).geometry(), DCOMP_MAT()),
      g = new THREE.Group();
    g.position.set(x, y, z);
    g.add(m);
    DCOMP.g.add(g);
    return g;
  };
  /* the laterals: from the floor ahead of him, leaning back to his hands; black grips. Pulled, the top comes back toward him */
  for (const z of [-0.7, -0.36]) {
    const lv = [part(cyl(0.018, 0.022, 0.95, 8), GR, -0.12, 0.47, 0, 0, 0, 0.26), part(cyl(0.028, 0.028, 0.15, 8), DK, -0.24, 0.9, 0, 0, 0, 0.26)];
    DCOMP.lat.push(mover(lv, 1.16, 0.48, z));
  }
  /* the parking brake lever on the left of the laterals: up when set */
  DCOMP.park = mover([part(cyl(0.013, 0.016, 0.5, 6), GR, 0, 0.25, 0), part(sph(8), DK, 0, 0.5, 0, 0, 0, 0, 0.03, 0.03, 0.03)], 1.06, 0.5, -0.92);
  /* the gear shift lever on the transmission at his right hand: a ball knob with the 1st/reverse button */
  DCOMP.gear = mover([part(cyl(0.014, 0.018, 0.5, 8), GR, 0, 0.25, 0), part(sph(10), DK, 0, 0.5, 0, 0, 0, 0, 0.04, 0.035, 0.04), part(cyl(0.008, 0.008, 0.02, 6), 0xb0a080, 0, 0.54, 0)], 0.95, 1.0, -0.16);
  /* the pedals: clutch left, accelerator right; they pivot at the floor */
  const pedal = (x, z, w) => mover([part(cyl(0.012, 0.012, 0.3, 6), GR, 0, 0.15, 0), part(bx(0.06, 0.18, w), 0x3a3a34, 0.0, 0.3, 0, 0, 0, -0.5)], x, 0.48, z);
  DCOMP.clu = pedal(1.5, -0.72, 0.1);
  DCOMP.acc = pedal(1.5, -0.42, 0.08);
  /* the instrument box on the left sponson, turned toward his eyes: its face a canvas drawn with the live instruments (dcompPanel) */
  DCOMP.cv = document.createElement('canvas');
  DCOMP.cv.width = 640;
  DCOMP.cv.height = 352;
  DCOMP.ctx = DCOMP.cv.getContext('2d');
  DCOMP.tex = new THREE.CanvasTexture(DCOMP.cv);
  const box = new THREE.Group();
  box.position.set(1.18, 1.24, -1.0);
  box.rotation.set(0, -0.86, 0);
  box.rotateX(-0.32);
  const bm = new THREE.Mesh(new GX.Acc().add([part(bx(0.43, 0.25, 0.1), 0x4a4d3a, 0, 0, -0.051)], new GX.M4()).geometry(), DCOMP_MAT());
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.41, 0.225), new THREE.MeshBasicMaterial({ map: DCOMP.tex }));
  box.add(bm, face);
  DCOMP.g.add(box);
  DCOMP.g.visible = false;
  TANK.mesh.add(DCOMP.g);
  dcompPanel(true);
}
/* a round gauge on the panel: centre, radius, the scale's ends (value, angle), its numbers, the needle at v */
function dcGauge(c, x, y, r, a0, a1, v0, v1, v, nums, label) {
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
  c.strokeStyle = '#9a9a8c';
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = '#e8e4d4';
  c.strokeStyle = '#e8e4d4';
  c.lineWidth = 1.5;
  c.font = 'bold ' + Math.round(r * 0.26) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const ang = (q) => a0 + ((a1 - a0) * (q - v0)) / (v1 - v0);
  for (const n of nums) {
    const a = ang(n);
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
    c.lineTo(x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.97);
    c.stroke();
    c.fillText(String(n), x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66);
  }
  c.font = Math.round(r * 0.18) + 'px sans-serif';
  c.fillText(label, x, y + r * 0.42);
  const a = ang(Math.max(v0, Math.min(v1, v)));
  c.strokeStyle = '#f2f0e6';
  c.lineWidth = Math.max(2, r * 0.06);
  c.beginPath();
  c.moveTo(x - Math.cos(a) * r * 0.12, y - Math.sin(a) * r * 0.12);
  c.lineTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84);
  c.stroke();
}
/* the panel's face, after fig. 10: the clock, the tachometer, the engine's water temperature and oil pressure, volts and amperes, the
   speedometer, fuel, the power unit's oil temperature, the warning lights; redrawn ten times a second while he looks at it */
function dcompPanel(force) {
  const c = DCOMP.ctx;
  if (!c) return;
  const W = 640,
    H = 352,
    rpm = DRV.rpm,
    run = rpm > 300,
    mph = Math.abs(DRV.v) * 2.237;
  c.fillStyle = '#4c5040';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#2c2f24';
  c.lineWidth = 6;
  c.strokeRect(3, 3, W - 6, H - 6);
  /* the switches across the top, the five exhaust stack warning lights, low oil pressure and high water temperature */
  c.fillStyle = '#d8d4c4';
  c.font = '11px sans-serif';
  c.textAlign = 'center';
  ['ACCESSORIES', 'HEAD LIGHTS', 'VOLT METER', 'PANEL LIGHTS', 'SIREN', 'INSTRUMENTS'].forEach((t, i) => {
    c.fillText(t, 180 + i * 70, 24);
    c.fillStyle = '#222';
    c.beginPath();
    c.arc(180 + i * 70, 42, 9, 0, 7);
    c.fill();
    c.fillStyle = '#d8d4c4';
  });
  for (let i = 0; i < 5; i++) {
    c.fillStyle = DRV.heat > 0.9 ? '#ff5030' : '#5a2a20';
    c.beginPath();
    c.arc(330 + i * 38, 86, 8, 0, 7);
    c.fill();
  }
  c.fillStyle = '#d8d4c4';
  c.fillText('EXHAUST STACK TEMP WARNING', 405, 106);
  const oilP = run ? 18 + (rpm / 2600) * 44 : 0,
    wt = 150 + 30 * (DRV.heat || 0),
    lowOil = run && oilP < 15;
  c.fillStyle = lowOil || !run ? '#ff6040' : '#5a2a20';
  c.beginPath();
  c.arc(380, 138, 8, 0, 7);
  c.fill();
  c.fillStyle = wt > 235 ? '#ff6040' : '#5a2a20';
  c.beginPath();
  c.arc(290, 138, 8, 0, 7);
  c.fill();
  c.fillStyle = '#d8d4c4';
  c.fillText('LOW OIL PRESS', 380, 158);
  c.fillText('HIGH WATER TEMP', 290, 158);
  c.fillText('IGNITION', 470, 158);
  c.fillText('STARTER', 545, 158);
  c.fillStyle = run ? '#c8c0a0' : '#555';
  c.fillRect(462, 126, 16, 22);
  c.fillStyle = '#777';
  c.beginPath();
  c.arc(545, 136, 12, 0, 7);
  c.fill();
  /* the clock (the game's time) */
  {
    const [hh, mm] = (WX.clock() || '12:00').split(':').map(Number),
      x = 85,
      y = 120,
      r = 54;
    c.fillStyle = '#111';
    c.beginPath();
    c.arc(x, y, r, 0, 7);
    c.fill();
    c.strokeStyle = '#9a9a8c';
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = '#e8e4d4';
    c.font = 'bold 13px sans-serif';
    for (let i = 1; i <= 12; i++) c.fillText(String(i), x + Math.sin((i / 12) * 6.283) * r * 0.75, y - Math.cos((i / 12) * 6.283) * r * 0.75 + 1);
    c.strokeStyle = '#f2f0e6';
    c.lineWidth = 3;
    const ha = (((hh % 12) + mm / 60) / 12) * 6.283,
      ma = (mm / 60) * 6.283;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5);
    c.moveTo(x, y);
    c.lineTo(x + Math.sin(ma) * r * 0.78, y - Math.cos(ma) * r * 0.78);
    c.stroke();
  }
  const A0 = Math.PI * 0.75,
    A1 = Math.PI * 2.25;
  dcGauge(c, 190, 268, 72, A0, A1, 0, 3500, rpm, [0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((v) => v), 'R.P.M.');
  dcGauge(c, 300, 216, 40, A0, A1, 100, 260, wt, [100, 180, 260], 'ENG TEMP');
  dcGauge(c, 405, 216, 40, A0, A1, 0, 80, oilP, [0, 20, 40, 60, 80], 'OIL PRESS');
  dcGauge(c, 300, 304, 36, A0, A1, 16, 32, run ? 28 : 24, [16, 24, 32], 'VOLTS');
  dcGauge(c, 405, 304, 36, Math.PI * 1.15, Math.PI * 1.85, -100, 100, run ? 12 : -8, [-100, 0, 100], 'AMPERES');
  dcGauge(c, 520, 264, 68, A0, A1, 0, 80, mph, [0, 10, 20, 30, 40, 50, 60, 70, 80], 'M.P.H.');
  dcGauge(c, 600, 316, 30, Math.PI * 1.15, Math.PI * 1.85, 0, 1, DRV.fuel ?? 1, [0, 1], 'FUEL');
  dcGauge(c, 70, 300, 38, A0, A1, 100, 325, 150 + 40 * (DRV.heat || 0), [100, 200, 325], 'OIL TEMP');
  /* the dials' rpm numbers are hundreds on the real one: write them as it does */
  DCOMP.tex.needsUpdate = true;
}
/* each frame: show it at its view, move the controls, redraw the panel; and the engine's heat (warms with the load, cools at rest) */
function dcompPose(dt) {
  DRV.heat = Math.max(0, Math.min(1.2, (DRV.heat || 0.3) + dt * ((DRV.rpm / 2600) * DRV.thr * 0.004 - ((DRV.heat || 0.3) - 0.3) * 0.002)));
  DRV.fuel = Math.max(0, (DRV.fuel ?? 1) - (Math.abs(DRV.v) * dt) / 160934 /* about 100 miles on her 168 gallons */);
  const v = STATION.view(),
    on = camMode == 1 && STATION.stn === 4 && v && v.inside && !PHOTO.on;
  if (on && !DCOMP.g) dcompBuild();
  if (!DCOMP.g) return;
  DCOMP.g.visible = !!on;
  /* inside, the hull's outside is not drawn (its lower hull is a solid block over the compartment's floor); nothing outside can be seen
     from in here but through the periscope, which is its own view */
  TANK.mesh.material.visible = !on;
  if (!on) return;
  DCOMP.lat[0].rotation.z = DRV.latL * 0.32;
  DCOMP.lat[1].rotation.z = DRV.latR * 0.32;
  DCOMP.park.rotation.z = DRV.park ? -0.15 : 0.7;
  DCOMP.acc.rotation.z = -DRV.thr * 0.3;
  DCOMP.clu.rotation.z = DRV.shift > 0 ? -0.35 : 0;
  /* the gate: [across (+ to the right), along (+ forward)] for R, N, 1st..5th */
  const G = [[-1, -1], [0, 0], [-1, 1], [0, 1], [0, -1], [1, 1], [1, -1]][DRV.gear] || [0, 0];
  DCOMP.gear.rotation.set(G[0] * 0.18, 0, -G[1] * 0.28);
  DCOMP.t += dt;
  if (DCOMP.t > 0.1) (DCOMP.t = 0), dcompPanel();
}
