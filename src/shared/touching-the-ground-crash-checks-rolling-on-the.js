/* touching the ground: crash checks, rolling on the wheels, braking. Returns false if the aircraft was destroyed. */
function groundContact(dt, v) {
  const h = H(pos.x, pos.z),
    wasOn = onGround;
  onGround = false;
  if (pos.y < h + GEAR.h) {
    axes();
    if (h <= SEA.PAINT) {
      crash('SPLASHDOWN');
      return false;
    }
    const sink = -vel.y,
      off = (Math.abs(pos.x) > 45 || pos.z > RW.zS + 20 || pos.z < RW.zN - 20) && !ISL.onRwy(pos.x, pos.z, 8);
    if (sink > 7 || up.y < 0.7 || (off && v > 20) || (!gearOn && v > 15)) {
      crash(sink > 7 ? 'HARD LANDING' : off ? 'OFF THE RUNWAY' : 'GEAR UP');
      return false;
    }
    onGround = true;
    const wetk = FM.use('wet') ? WX.wet : 0;
    if (!wasOn) {
      SND.touch(Math.max(0, sink), v * (1 - 0.7 * wetk)); /* a wet runway: less squeal */
      if (wetk > 0.4) note('WET RUNWAY - LONGER STOPPING DISTANCE');
    }
    const hyd = wetk > 0.5 && v > 45;
    if (hyd !== FM.hyd) {
      FM.hyd = hyd;
      if (hyd) note('HYDROPLANING - BRAKES AND STEERING WEAK');
    }
    pos.y = h + GEAR.h;
    if (vel.y < 0) vel.y = 0;
    const e = SC.gE.setFromQuaternion(q, 'YXZ');
    e.x = Math.min(
      Math.max(e.x, 0),
      Math.max(0, GEAR.sit - tiltV),
    ); /* the tail wheel touches at GEAR.sit total nose-up (tiltV is the model's visual tail-sitter tilt) */
    e.z = 0;
    q.setFromEuler(e);
    axes();
    tmp.set(fwd.x, 0, fwd.z).normalize();
    let vh = Math.max(0, vel.dot(tmp) - (kb('brake') || pad.brake ? 6 * (1 - 0.5 * wetk) * (hyd ? 0.4 : 1) : 0.4) * dt);
    vel.set(0, vel.y, 0).addScaledVector(tmp, vh);
  }
  if (pos.y < -6) {
    crash('SPLASHDOWN');
    return false;
  }
  return true;
}
function step(dt) {
  readControls(dt);
  const wv = windNow(SC.w),
    inv = SC.inv.copy(q).invert(),
    va = SC.va.copy(vel).sub(wv) /* the wing and the gauges feel the air, the ground feels the ground */,
    vl = SC.vl.copy(va).applyQuaternion(inv),
    v = va.length(),
    gs = vel.length(),
    fs = Math.max(-vl.z, 0),
    hq = FM.use('torque'),
    ha = FM.use('alt'),
    hf = FM.use('fuel'),
    hp = FM.use('perf'),
    hl = FM.use('gload'),
    ht = FM.use('ice'),
    wetk = FM.use('wet') ? WX.wet : 0;
  if (ha) atmos(pos.y, AT);
  else {
    AT.sig = 1;
    AT.ps = 1;
    AT.a = 340.3;
  }
  const se = Math.sqrt(AT.sig),
    fe = fs * se; /* equivalent (indicated) airspeed: what the wing and the gauges feel */
  FM.ias = v * se;
  alpha = Math.atan2(-vl.y, Math.max(fs, 1));
  const am = 0.256,
    aa = Math.abs(alpha);
  stalled = aa > am && v > 8;
  /* redline: 470 mph indicated, or Mach 0.75 higher up (the limit falls with altitude) */
  FM.red = Math.max(FM.ias * 2.237, 470 + (v / AT.a - 0.75) * 600);
  buffet = (onGround || v < 20 ? 0 : Math.max(0, (aa - 0.9 * am) / (0.1 * am))) + Math.max(0, (FM.red - 470) / 35);
  CL = aa <= am ? 4.8 * alpha : Math.sign(alpha) * Math.max(0.5, 1.23 - 3 * (aa - am));
  CL += 0.2 * fl;
  CL *= 1 - 0.3 * FM.ice; /* ice on the wing spoils the lift */
  /* weight: carried ordnance, less the fuel already burned (1,614 lb when full) */
  const iw = 1 / (1 + (0.25 * ((2 - bmN) * 500 + (6 - rkN) * 135 - (hf ? (1 - FM.fuel) * 1614 : 0))) / 9000);
  let lift = Math.max(
    (hl ? -99 : -3.5) * 9.8 * iw,
    Math.min(
      (fe > 58 ? (hl && fe * 2.237 > 315 ? 99 : gmax(fe)) : 99) * 9.8 * iw,
      CL *
        0.004 *
        fs *
        fs *
        AT.sig *
        iw *
        (1 + 0.08 * Math.max(0, 1 - Math.max(0, pos.y - 2 - Math.max(0, H(pos.x, pos.z))) / 10)),
    ),
  );
  gF = lift / 9.8;
  if (hl) {
    /* structural limits: past the limit the airframe bends, at 1.5 times the limit the wing fails */
    gLimits(iw, FM.ias * 2.237, FM.lim);
    FM.over = gF > FM.lim.pos ? gF / FM.lim.pos : gF < FM.lim.neg ? gF / FM.lim.neg : 0;
    if (FM.over > 1.5) {
      crash('WING FAILURE');
      return;
    }
    if (FM.over > 1) {
      FM.str = Math.min(1, FM.str + (FM.over - 1) * 2 * dt);
      if (FM.warnS <= 0) {
        FM.warnS = 1;
        note('OVERSTRESS - AIRFRAME DAMAGED');
      }
    } else if (FM.over === 0 && FM.warnS > 0) FM.warnS = 0;
  } else {
    FM.lim.pos = 7;
    FM.lim.neg = -3.5;
    FM.over = 0;
  }
  if (gF > 4.5) blk = Math.min(1, blk + (gF - 4.5) * 0.25 * dt);
  else blk = Math.max(0, blk - 0.5 * dt);
  const acc = SC.acc.set(0, -9.8, 0);
  /* on the wheels the lift acts straight up: tilted back with the nose-up attitude it would act as a brake on the take-off roll (the induced drag already covers that) */
  if (onGround) acc.y += lift * up.y;
  else if (hp && v > 15) {
    /* real-performance option: lift acts square to the airflow, so tilting it back with the angle of attack does not add a second, hidden drag */
    SC.ld.copy(va).multiplyScalar(1 / v);
    SC.lu.copy(up).addScaledVector(SC.ld, -up.dot(SC.ld));
    const lm = SC.lu.length();
    if (lm > 0.2) acc.addScaledVector(SC.lu, lift / lm);
    else acc.addScaledVector(up, lift);
  } else acc.addScaledVector(up, lift);
  acc.addScaledVector(right, -vl.x * 1.5);
  acc.addScaledVector(
    fwd,
    (engOut || (hf && FM.fuel <= 0) || (DM.on && DM.eng >= 1) ? 0 : iw) *
      (FM.hot ? 0.35 : 1) *
      (1 - 0.7 * (DM.on ? DM.eng : 0)) *
      (1 - 0.15 * FM.ice) *
      AT.ps *
      power(thr) *
      Math.min(3.4, 2.31 + 0.02 * Math.max(0, 100 - v)) *
      (hp
        ? Math.max(
            0.15,
            1 -
          FM.perf.dip * smooth(45, 60, FM.ias) * (1 - smooth(80, 169, FM.ias)) -
          FM.perf.alt * Math.pow(1 - AT.sig, FM.perf.altp) * smooth(45, 60, FM.ias) * (1 - smooth(75, 105, FM.ias)),
          )
        : 1),
  );
  if (v > 0.1)
    acc.addScaledVector(
      va,
      -iw *
        (AT.sig *
          (0.000054 * v +
            (ht ? 0.00006 * FM.ice * v : 0) +
            (hp ? FM.perf.drag * v : 0) +
            (hp ? FM.perf.ind : 0.0003) * CL * CL * v +
            0.00009 * fl * v +
            (gearOn ? 0.00003 * v : 0)) +
          (0.01 * Math.pow(Math.max(0, v - (hp ? FM.perf.vw : 193)), 2)) / Math.max(v, 1)),
    );
  vel.addScaledVector(acc, dt);
  /* rotation */
  const wash = hq ? thr * 0.35 * (1 - Math.min(1, fs / 90)) : 0 /* propwash blowing over the tail at low speed */,
    eff = Math.max(0.12, Math.min(1, fs / 70 + wash)),
    beta = vl.x / Math.max(fs, 20),
    eff2 =
      eff /
      (1 +
        Math.pow(
          fs / (hl ? 220 : 160),
          2,
        )); /* load limits on: the elevator keeps its bite at speed, so you can overstress the airframe */
  const fus = hf
    ? Math.max(0, Math.min(1, (FM.fuel - 0.684) / 0.316))
    : 0; /* fuselage tank fullness: aft CG, twitchier pitch */
  const htr = FM.use('trim') /* trim tabs: Hardcore only */;
  let rx = s.p * 0.9 * eff2 * (1 + 0.15 * fus),
    ry = -s.y * 0.3 * eff2 - beta * 2 * Math.min(1, fs / 40) - (htr ? TRIM.r * 0.16 * eff2 : 0),
    rz = s.r * 1.8 * eff2 + (htr ? TRIM.a * 0.5 * eff2 : 0);
  rx -= (0.04 * fl + (gearOn ? 0.015 : 0)) * Math.min(1, fs / 40);
  rx += (Math.random() - 0.5) * 0.25 * Math.max(0, (FM.red - 470) / 35);
  if (!onGround)
    rx +=
      -(
        alpha -
        Math.min(
          0.17,
          htr
            ? 9.8 / (0.0192 * iw * (TRIM_V0 * Math.exp(-0.6 * TRIM.e)) ** 2) /* trimmed: holds the alpha for 1 g at the trim speed */
            : 9.8 / (0.0192 * AT.sig * iw * Math.max(fs, 30) ** 2) /* untrimmed: always trims itself to 1 g */,
        )
      ) *
      0.9 *
      (1 - 0.25 * fus) *
      Math.min(1, fs / 40);
  if (stalled && !onGround) rx -= 0.3 * Math.sign(alpha);
  if (onGround) {
    /* wet runway: weaker steering; a crosswind weathercocks the tail wheel aircraft into the wind */
    ry =
      -(s.y + s.r + (htr ? TRIM.r * 0.5 * Math.min(1, fs / 25) * Math.min(1, thr * 3) /* tyre friction holds the nose at idle; the trim only counters torque under power */ : 0)) * 0.5 * Math.min(1, fs / 12) * (1 - 0.35 * wetk - (FM.hyd ? 0.4 : 0)) -
      Math.max(-0.6, Math.min(0.6, beta)) * Math.min(1, fs / 20) * Math.min(1, gs / 10); /* parked or crawling: tyre friction holds the tail against the wind */
  }
  if (WX.tI > 0 && !onGround) {
    /* turbulence jostles the aircraft */
    const tk = WX.tI * Math.min(1, fs / 40),
      tt = WX.t;
    rx += 0.12 * tk * wnz(tt * 2.1, 3);
    rz += 0.35 * tk * wnz(tt * 1.7, 9);
    ry += 0.08 * tk * wnz(tt * 1.3, 4);
  }
  if (DM.on && DM.any()) {
    /* damaged wings roll the aircraft toward the damaged side and blunt the ailerons; a damaged tail blunts elevator and rudder */
    rz *= 1 - 0.25 * (DM.wl + DM.wr);
    rz += 0.45 * (DM.wr - DM.wl) * Math.min(1, fs / 60);
    rx *= 1 - 0.5 * DM.tail;
    ry += s.y * 0.3 * eff2 * 0.5 * DM.tail;
  }
  SC.rates.x = rx;
  SC.rates.y = ry;
  SC.rates.z = rz;
  hardcore(dt, fs, v, aa, am, SC.rates);
  updIce(dt);
  rx = SC.rates.x;
  ry = SC.rates.y;
  rz = SC.rates.z;
  q.multiply(SC.dq.setFromEuler(SC.dE.set(rx * dt, ry * dt, -rz * dt, 'YXZ'))).normalize();
  pos.addScaledVector(vel, dt);
  groundContact(dt, gs);
}

function crash(why) {
  if (BL.on) return; /* the pilot is already out: the aircraft's end is shown by the descent */
  crashed = true;
  model.visible = false;
  explode(pos.clone(), 18);
  if (pos.y < H(pos.x, pos.z) + 30 && !RPL.on && !RPL.busy) AF.wreck(pos, 1, 200);
  const m = $$('msg');
  m.innerHTML =
    why +
    '<br><small style="font-size:14px;color:#fff">' +
    (MOB ? 'Tap here to restart' : 'Press Enter, or A / Start on the controller, to restart') +
    '</small>';
  m.style.display = 'block';
  buzz([80, 50, 220]);
}

