/* THE DRIVE TRAIN AND THE TRACKS (PLAN_M4A3_Sherman_Tank 3.1, 5.4, 6; T2). The figures are the spec sheet's (References/M4A3/Drawings and
   specs): Ford GAA, 450 hp net at 2,600 rpm, 950 lb-ft net at 2,200; synchromesh 1st 7.56, 2nd 3.11, 3rd 1.78, 4th 1.11, 5th 0.73,
   reverse 5.65; bevel 3.53, final drive 2.84; sprocket pitch diameter 25.038 in; 31.6 t; turning circle 62 ft; 60% grade; a 24 in wall;
   a 7.5 ft trench. 2,600 rpm in 5th is 26.5 mph, in 1st 2.6 mph: the sheet's speeds.
   THE ENGINE drives the sprockets through the clutch, the gearbox and the controlled differential: its torque (throttle x the curve)
   x the overall ratio / the sprocket's radius is the pull at the tracks, no more than the ground will bear (its grip by kind, BA.kind).
   Against it: rolling resistance (by kind: a road little, a paddy a lot), the grade, the laterals' braking. The governor holds 2,600 rpm.
   THE LATERALS: the controlled differential turns her on a fixed radius (31 ft, half the turning circle) when a lateral is pulled hard,
   wider when it is pulled a little; it cannot turn her on the spot, and the braked side costs speed. Both pulled: the brakes.
   GAME MODE: automatic gears (she pulls away in 2nd, 1st up a steep slope or in a paddy; up at 2,450 rpm, down at 1,050 (800 off the
   accelerator), each gear held 2 s at least; a shift takes 0.7 s with the power off), W the accelerator, S the brakes and, stopped, reverse; A / D the laterals; stopped with nothing held, the
   parking brake holds her. (Hardcore's own gearbox, clutch, stalling and start sequence come with the driver's station.)
   THE TRACKS ON THE GROUND: each track's run is a straight line under the hull resting on the ground (BA.GH) at the points along it: the
   line is the one under the centre of gravity across the highest points (an edge of the points' upper hull), so on a step her bow rises
   until her weight passes over it, then she tips down onto the top; over a ditch narrower than the run she bridges it. The front run of
   the track climbs to the sprocket, so a step up to 0.61 m is taken by the rising track; higher than that is a wall: she stops. The
   hull follows the two lines on springs (VVSS): it settles, it drops no faster than it would fall. */
const DT = {
  M: 31600,
  R: (25.038 * 0.0254) / 2 /* the sprocket's pitch radius, m */,
  G: [-5.65, 0, 7.56, 3.11, 1.78, 1.11, 0.73] /* index: 0 reverse, 1 neutral, 2..6 1st..5th */,
  FD: 3.53 * 2.84 /* bevel x final drive */,
  EFF: 0.85,
  IDLE: 550,
  GOV: 2600,
  RTURN: (62 * 0.3048) / 2 /* the turning radius with a lateral pulled hard, m */,
  B: 2.108 /* track centres */,
  STEP: 0.61,
  /* the ground's grip (traction coefficient) and rolling resistance, by BA.K */
  MU: { 0: 0.75, 1: 0.65, 2: 0.7, 3: 0.7, 4: 0.35, 5: 0.8, 6: 0.5, 8: 0.75, 9: 0.75 } /* dry ground about 0.75: the sheet's 60% grade */,
  CRR: { 0: 0.05, 1: 0.1, 2: 0.07, 3: 0.07, 4: 0.18, 5: 0.025, 6: 0.12, 8: 0.035, 9: 0.05 },
  /* the points along each track, its own frame (lz forward is -): the run on the ground from the rear bogie to the front one, then the
     front run climbing to the sprocket and the rear run to the idler: [lz, how high the track is there above the run's line] */
  TP: [
    [2.62, 0.3],
    [2.2, 0.08],
    [1.87, 0],
    [1.3, 0],
    [0.65, 0],
    [0, 0],
    [-0.65, 0],
    [-1.3, 0],
    [-1.87, 0],
    [-2.15, 0.15],
    [-2.4, 0.33],
    [-2.7, 0.52],
  ],
  CG: -0.1 /* the centre of gravity's lz: a little forward (the engine is aft, the turret and ammunition forward) */,
};
/* the engine's net torque (N m) at rpm, wide open: 950 lb-ft at 2,200, 885 at 2,600 (450 hp), falling to about 700 at 800 */
const dtTorque = (rpm) => {
  const p = [
    [500, 820],
    [1000, 1070],
    [1600, 1230],
    [2200, 1288],
    [2600, 1233],
    [2800, 900],
  ];
  if (rpm <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++)
    if (rpm <= p[i][0]) return p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * (rpm - p[i - 1][0])) / (p[i][0] - p[i - 1][0]);
  return 0;
};
const DRV = {
  v: 0 /* along her nose, m/s (the collision layer stops her by setting it to 0) */,
  w: 0 /* her turn, rad/s (+ to the left) */,
  rpm: DT.IDLE,
  gear: 1 /* index into DT.G: 1 neutral */,
  shift: 0 /* time left in a shift, s */,
  thr: 0,
  latL: 0,
  latR: 0,
  brake: 0,
  park: true,
  clutch: 0 /* the clutch pedal: 0 in (engaged) .. 1 down (Hardcore) */,
  engine: true /* running */,
  battery: true /* the master switch */,
  crank: 0 /* how long the starter has turned her over */,
  rpmF: 550 /* the engine's own speed off the clutch */,
  kind: 0,
  grade: 0 /* the slope along her nose (sin), + up */,
  blocked: false /* a step higher than she can climb is under her bow */,
  pitch: 0,
  roll: 0,
  vy: 0 /* the hull's settling speeds */,
  vp: 0,
  vr: 0,
  E: new THREE.Euler(0, 0, 0, 'YXZ'),
};
/* a point (lx, lz) of the vehicle's own frame (nose -z, right +x) at heading h: its world x, z */
const tankAt = (lx, lz, h) => [pos.x + Math.cos(h) * lx + Math.sin(h) * lz, pos.z - Math.sin(h) * lx + Math.cos(h) * lz];
/* one track's line on the ground: [height under the CG, slope (rise per metre toward the bow), the two points it rests on (along her
   nose, height)] */
function dtTrack(lx, h) {
  const P = DT.TP.map(([lz, rise]) => {
    const [x, z] = tankAt(lx, lz, h);
    return [-lz, BA.GH(x, z) - rise] /* along her nose, +forward */;
  });
  P.sort((a, b) => a[0] - b[0]);
  /* the upper hull of the points (they are in order along her): the line under the CG is its edge spanning the CG */
  const U = [];
  for (const p of P) {
    while (U.length >= 2) {
      const a = U[U.length - 2],
        b = U[U.length - 1];
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0) U.pop();
      else break;
    }
    U.push(p);
  }
  const c = -DT.CG;
  let i = 0;
  while (i < U.length - 2 && U[i + 1][0] < c) i++;
  const a = U[i],
    b = U[Math.min(i + 1, U.length - 1)],
    s = b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
  return [a[1] + s * (c - a[0]), s, a, b];
}
/* is there a wall at the track's end (e = -1 the bow, +1 the stern): a face steeper than 45 degrees standing more than 0.61 m (what the
   track's run up to the sprocket or the idler can climb) over the track's line there. A slope, however steep, is not a wall: there the
   grade and the ground's grip decide */
function dtWall(lx, h, T, e) {
  const L = (lz) => {
      const [x, z] = tankAt(lx, lz, h);
      return BA.GH(x, z);
    },
    far = L(e * 3.05),
    near = L(e * 2.65),
    yl = T[2][1] + T[1] * (-e * 3.05 - T[2][0]);
  return far - yl > DT.STEP && (far - near) / 0.4 > 1;
}
/* settle her on the ground now (a spawn, a jump): no springs */
function tankSettle() {
  const L = dtTrack(-DT.B / 2, TANK.hdg),
    R = dtTrack(DT.B / 2, TANK.hdg);
  DRV.pitch = Math.atan((L[1] + R[1]) / 2);
  DRV.roll = Math.atan((R[0] - L[0]) / DT.B);
  pos.y = (L[0] + R[0]) / 2;
  DRV.vy = DRV.vp = DRV.vr = 0;
  q.setFromEuler(DRV.E.set(DRV.pitch, TANK.hdg, DRV.roll, 'YXZ'));
}
/* the driver's hands and feet, game mode: W accelerator, S brakes (stopped: reverse), A / D the laterals; a game controller's left stick */
function dtControls(h) {
  /* DRV.ai { fw, tu }: an AI driver's hands instead of the player's (a drill drives her while the player is at the in-game gun) */
  const fw = DRV.ai ? DRV.ai.fw : kb('thrUp') - kb('thrDn') + (pad.ly ? -pad.ly : 0),
    tu = DRV.ai ? DRV.ai.tu || 0 : kb('rollR') - kb('rollL') + (pad.lx || 0),
    ease = (x, t) => x + Math.max(-h * 4, Math.min(h * 4, t - x)) /* a lateral takes a quarter second to pull or let go */;
  DRV.latL = ease(DRV.latL, Math.max(0, -tu));
  DRV.latR = ease(DRV.latR, Math.max(0, tu));
  const rev = DRV.gear === 0;
  if (fw > 0.05) {
    if (rev && DRV.v < -0.3) (DRV.thr = 0), (DRV.brake = fw);
    else {
      if (rev || DRV.gear === 1) DRV.gear = DRV.grade > 0.25 || DRV.kind === BA.K.paddy ? 2 : 3 /* pull away in 2nd (1st up a slope, in mud) */;
      DRV.thr = Math.min(1, fw);
      DRV.brake = 0;
    }
    DRV.park = false;
  } else if (fw < -0.05) {
    if (!rev && DRV.v > 0.3) (DRV.thr = 0), (DRV.brake = -fw);
    else {
      DRV.gear = 0;
      DRV.thr = Math.min(1, -fw);
      DRV.brake = 0;
    }
    DRV.park = false;
  } else {
    DRV.thr = 0;
    DRV.brake = 0;
    if (Math.abs(DRV.v) < 0.3) (DRV.park = true), DRV.gear !== 0 && DRV.gear > 3 && (DRV.gear = 3);
  }
}
/* the automatic gearbox (game mode): up at 2,450 rpm, down at 1,050 (800 off the accelerator), a gear held 2 s at least */
function dtAuto(h) {
  if (DRV.shift > 0) return void (DRV.shift -= h);
  if (DRV.gear < 2) return;
  /* losing way up a slope (or in mud) in 2nd or higher: straight down to 1st, whatever the hold */
  if (DRV.gear >= 3 && DRV.thr > 0.5 && DRV.v < 1.2 && (DRV.grade > 0.15 || DRV.kind === BA.K.paddy)) return void ((DRV.gear = 2), (DRV.shift = 0.4), (DRV.held = 0));
  const w = (Math.abs(DRV.v) / DT.R) * DT.G[DRV.gear] * DT.FD * (60 / (2 * Math.PI)) /* the engine's speed from the tracks' */;
  DRV.held = (DRV.held || 0) + h;
  if (DRV.held < 2) return; /* a gear is held at least 2 s */
  if (w > 2450 && DRV.gear < 6 && DRV.thr > 0.2 && !(DRV.gear === 2 && DRV.grade > 0.12)) (DRV.gear++, (DRV.shift = 0.7), (DRV.held = 0));
  else if (w < (DRV.thr > 0.2 ? 1050 : 800) && DRV.gear > 3) (DRV.gear--, (DRV.shift = 0.5), (DRV.held = 0));
}
/* HARDCORE (the Hardcore tab; FM.use): 'gearbox' the driver's own gears through the clutch (E up, Q down, the gate R N 1 2 3 4 5; left
   Shift the clutch pedal; a shift without the clutch down grinds and does nothing; let the clutch in too fast or lug her below about
   300 rpm and she stalls); 'start' the start sequence (she starts cold: V the battery's master switch, then R the starter held, in
   neutral or with the clutch down); 'roll' no automatic hold: stopped with the laterals let go and the parking brake off (B), she rolls
   down a slope. Without 'start' a stalled engine starts again by itself in neutral or with the clutch down. */
const dtHC = () => FM.use('gearbox');
function dtControlsHC(h) {
  const fw = kb('thrUp') - kb('thrDn') + (pad.ly ? -pad.ly : 0),
    tu = kb('rollR') - kb('rollL') + (pad.lx || 0),
    ease = (x, t) => x + Math.max(-h * 4, Math.min(h * 4, t - x));
  DRV.latL = ease(DRV.latL, Math.max(0, -tu));
  DRV.latR = ease(DRV.latR, Math.max(0, tu));
  DRV.thr = Math.max(0, Math.min(1, fw)) /* W the accelerator */;
  DRV.brake = Math.max(0, Math.min(1, -fw)) /* S both laterals back: the brakes */;
  DRV.clutch += Math.max(-h * 1.4, Math.min(h * 5, (kb('clutch') ? 1 : 0) - DRV.clutch)) /* down at once, let in over about 0.7 s */;
  if (!FM.use('roll')) {
    if (DRV.thr > 0.05) DRV.park = false;
    else if (Math.abs(DRV.v) < 0.3 && !DRV.brake) DRV.park = true;
  }
}
/* the gear keys: in Hardcore the driver's own; in game mode the box is automatic */
function dtGear(d) {
  if (!dtHC()) return note('GEARS: AUTOMATIC (HARDCORE: YOUR OWN, THROUGH THE CLUTCH)');
  if (DRV.engine && DRV.clutch < 0.8) return note('GEARS GRIND - CLUTCH DOWN FIRST (SHIFT)');
  DRV.gear = Math.max(0, Math.min(6, DRV.gear + d));
  note('GEAR ' + ['REVERSE', 'NEUTRAL', '1ST', '2ND', '3RD', '4TH', '5TH'][DRV.gear]);
}
/* the starter (Hardcore 'start'); without it a stalled engine starts again by itself in neutral or with the clutch down */
function dtStarter(h) {
  if (DRV.engine) return void (DRV.crank = 0);
  const free = !dtHC() || DRV.gear === 1 || DRV.clutch > 0.8 /* the automatic box starts in neutral */;
  if (!FM.use('start')) {
    if (free) (DRV.engine = true), (DRV.rpmF = DT.IDLE), note('ENGINE RUNNING');
    return;
  }
  if (!kb('starter')) return void (DRV.crank = 0);
  if (!DRV.battery) return void (DRV.crank === 0 && ((DRV.crank = -1), note('NO POWER - THE BATTERY SWITCH (V)')));
  if (!free) return void (DRV.crank === 0 && ((DRV.crank = -1), note('IN GEAR - NEUTRAL, OR THE CLUTCH DOWN, TO START')));
  DRV.crank = Math.max(0, DRV.crank) + h;
  DRV.rpmF = 170 + 40 * Math.sin(DRV.crank * 40);
  if (DRV.crank > 1.4) (DRV.engine = true), (DRV.rpmF = DT.IDLE), (DRV.crank = 0), note('ENGINE STARTED');
}
/* back to the start: in neutral, the parking brake on; with Hardcore 'start' cold, the battery off */
function dtReset() {
  const cold = FM.use('start');
  Object.assign(DRV, { v: 0, w: 0, gear: 1, shift: 0, thr: 0, latL: 0, latR: 0, brake: 0, park: true, clutch: 0, engine: !cold, battery: !cold, crank: 0, rpm: cold ? 0 : DT.IDLE, rpmF: cold ? 0 : DT.IDLE, fuel: 1, heat: 0.3, held: 0 });
}
function tankDrive(h) {
  const hc = dtHC() && !DRV.ai /* an AI driver drives the automatic way */;
  if (hc) dtControlsHC(h);
  else (dtControls(h), dtAuto(h), (DRV.clutch = 0));
  dtStarter(h);
  const g = 9.81,
    m = DT.M,
    hd = TANK.hdg;
  DRV.kind = BA.kind(pos.x, pos.z);
  const mu = DT.MU[DRV.kind] ?? 0.6,
    crr = DT.CRR[DRV.kind] ?? 0.05;
  /* the engine: on the clutch with the tracks turning it, else slipping the clutch to pull away */
  const ratio = DT.G[DRV.gear] * DT.FD,
    wrpm = ratio ? (Math.abs(DRV.v) / DT.R) * Math.abs(ratio) * (60 / (2 * Math.PI)) : 0,
    inGear = ratio !== 0 && DRV.shift <= 0;
  const want = DT.IDLE + DRV.thr * (DT.GOV - DT.IDLE),
    c = hc ? 1 - DRV.clutch : 1 /* how much the clutch carries */;
  /* the engine's own speed: free it runs up to what the accelerator asks; on the clutch the tracks drag it toward theirs */
  if (DRV.engine) DRV.rpmF += (want - DRV.rpmF) * Math.min(1, h * 3);
  else if (!DRV.crank) DRV.rpmF = Math.max(0, DRV.rpmF - 900 * h);
  if (!hc) {
    /* game mode: pulling away (1st, 2nd, reverse) the clutch slips up to about 1,700 rpm; in the higher gears the engine turns with the tracks */
    DRV.rpm = inGear ? Math.max(wrpm, DRV.gear <= 3 ? Math.min(want, 1100 + DRV.thr * 600) : DT.IDLE) : (DRV.rpmF = DRV.rpm + (want - DRV.rpm) * Math.min(1, h * 3));
  } else {
    if (inGear && DRV.engine) DRV.rpmF += (wrpm - DRV.rpmF) * Math.min(1, c * c * h * 6);
    DRV.rpm = inGear && c > 0.97 ? wrpm : DRV.rpmF;
    /* lugged below about 300 rpm on the clutch, or the clutch let in on a stopped tank in gear: she stalls */
    if (DRV.engine && inGear && c > 0.85 && wrpm < 320 && DRV.rpmF < 420) (DRV.engine = false), (DRV.stalls = (DRV.stalls || 0) + 1), note('STALLED');
  }
  /* the pull at the tracks (governed: none past 2,600 rpm); no more than the ground's grip */
  let F = 0;
  if (inGear && DRV.thr > 0 && DRV.engine) {
    const r = hc ? Math.max(DRV.rpm, DRV.rpmF * (1 - c)) : DRV.rpm,
      gov = r > DT.GOV ? Math.max(0, 1 - (r - DT.GOV) / 150) : 1;
    F = (dtTorque(r) * DRV.thr * gov * Math.abs(ratio) * DT.EFF * c) / DT.R;
    F = Math.min(F, mu * m * g) * Math.sign(ratio);
  }
  /* engine braking when she is in gear with the accelerator up (a dead engine on the clutch drags harder) */
  if (inGear && DRV.thr === 0 && Math.abs(DRV.v) > 0.3 && c > 0.5 && (wrpm > DT.IDLE || !DRV.engine)) F -= Math.sign(DRV.v) * (DRV.engine ? 0.03 : 0.08) * m * g;
  /* against her: the grade, rolling resistance, the laterals' braking (the controlled differential brakes the inside track), the brakes */
  const steer = Math.max(DRV.latL, DRV.latR),
    both = Math.min(DRV.latL, DRV.latR),
    grade = -g * m * DRV.grade,
    roll = crr * m * g + steer * 0.05 * m * g,
    brk = (DRV.brake + both + (DRV.park ? 1 : 0)) * mu * m * g;
  let a = (F + grade) / m;
  /* the resistances and the brakes stop her; they never push her backwards */
  const stop = (roll + brk) / m;
  let v = DRV.v + a * h;
  if (Math.abs(v) <= stop * h) v = 0;
  else v -= Math.sign(v) * stop * h;
  /* a step too high in front (or behind, backing) stops her */
  if ((DRV.blocked > 0 && v > 0) || (DRV.blocked < 0 && v < 0)) v = 0;
  DRV.v = v;
  /* the turn: on the controlled differential's radius, wider with a lateral pulled less (a lateral pulled stops neither track) */
  const pull = DRV.latL - DRV.latR;
  DRV.w = Math.abs(pull) > 0.02 ? (v * Math.sign(pull) * Math.min(1, Math.abs(pull))) / DT.RTURN : 0;
  const nh = hd + DRV.w * h;
  pos.x -= Math.sin(nh) * v * h;
  pos.z -= Math.cos(nh) * v * h;
  TANK.hdg = nh;
  dtSuspension(h);
}
/* the hull on the two tracks' lines: springs (about 1.5 Hz, well damped), never into the ground, falling no faster than g */
function dtSuspension(h) {
  const L = dtTrack(-DT.B / 2, TANK.hdg),
    R = dtTrack(DT.B / 2, TANK.hdg),
    ty = (L[0] + R[0]) / 2,
    tp = Math.atan((L[1] + R[1]) / 2),
    tr = Math.atan((R[0] - L[0]) / DT.B);
  /* a wall ahead stops her going forward, one astern going back; either way she can still back off it */
  DRV.blocked = dtWall(-DT.B / 2, TANK.hdg, L, -1) || dtWall(DT.B / 2, TANK.hdg, R, -1) ? 1 : dtWall(-DT.B / 2, TANK.hdg, L, 1) || dtWall(DT.B / 2, TANK.hdg, R, 1) ? -1 : 0;
  const k = 90,
    c = 2 * Math.sqrt(k) * 0.8;
  DRV.vy += (k * (ty - pos.y) - c * DRV.vy) * h;
  DRV.vy = Math.max(DRV.vy, -9.81 * 1.5);
  pos.y += DRV.vy * h;
  if (pos.y < ty - 0.15) pos.y = ty - 0.15 /* the springs bottom out */;
  DRV.vp += (k * (tp - DRV.pitch) - c * DRV.vp) * h;
  DRV.pitch += DRV.vp * h;
  DRV.vr += (k * (tr - DRV.roll) - c * DRV.vr) * h;
  DRV.roll += DRV.vr * h;
  DRV.grade = Math.sin(DRV.pitch);
  q.setFromEuler(DRV.E.set(DRV.pitch, TANK.hdg, DRV.roll, 'YXZ'));
}
