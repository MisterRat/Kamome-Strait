/* airframe icing (Hardcore): builds in cloud when the air is just below freezing, melts in warmer air */
function updIce(dt) {
  if (!FM.use('ice')) {
    FM.ice = 0;
    FM.iceW = 0;
    return;
  }
  const T = WX.oat(pos.y),
    on = !onGround && WX.inCloud && T < 2 && T > -25;
  if (on) FM.ice = Math.min(1, FM.ice + dt / (WX.wx === 'storm' ? 55 : 90));
  else if (T >= 1) FM.ice = Math.max(0, FM.ice - dt / 45);
  else FM.ice = Math.max(0, FM.ice - dt / 500);
  if (FM.ice > 0.35 && FM.iceW === 0) {
    FM.iceW = 1;
    note('ICING - LEAVE THE CLOUD OR DESCEND TO WARMER AIR');
  } else if (FM.ice > 0.75 && FM.iceW === 1) {
    FM.iceW = 2;
    note('SEVERE ICING - LIFT FALLING, DRAG RISING');
  } else if (FM.ice < 0.1 && FM.iceW) {
    FM.iceW = 0;
    note('ICE CLEARED');
  }
}
function hardcore(dt, fs, v, aa, am, r) {
  const hq = FM.use('torque'),
    hs = FM.use('spin'),
    hh = FM.use('heat'),
    hw = FM.use('pwr'),
    hf = FM.use('fuel');
  {
    const pw = thr * (FM.hot ? 0.35 : 1) * (engOut ? 0 : 1),
      sf = Math.max(0, 1 - fs / 110); /* torque and P-factor matter at low speed and high power */
    if (hq && onGround) r.y += 0.07 * pw * sf * Math.min(1, fs / 10); /* the nose swings left on the take-off roll */
    else if (hq) {
      r.z -= 0.1 * pw * sf; /* torque rolls the aircraft left */
      r.y += 0.18 * pw * sf * (1 + 6 * Math.max(0, alpha)); /* P-factor yaws it left, more at high angle of attack */
    }
    const depth = hs && stalled && !onGround ? Math.min(1, (aa - am) / 0.15) : 0;
    if (depth > 0 && !FM.was) FM.dir = Math.sign(-s.y - 0.3 * s.r + 0.15 * pw) || 1; /* which wing drops */
    FM.was = depth > 0;
    if (depth > 0 && !FM.spin) {
      r.z -= FM.dir * 0.5 * depth; /* wing drop */
      r.y += FM.dir * 0.15 * depth;
    }
    if (!hs) FM.spin = false;
    /* a spin needs a stall plus rudder held; opposite rudder + stick forward (idle throttle is quicker) recovers */
    if (!FM.spin) {
      FM.spinT =
        depth > 0.25 && Math.abs(s.y) > 0.35 ? FM.spinT + dt * (0.7 + 0.6 * thr) : Math.max(0, FM.spinT - 2 * dt);
      if (FM.spinT > 1) {
        FM.spin = true;
        FM.recT = 0;
        note('SPIN - OPPOSITE RUDDER, STICK FORWARD, THROTTLE BACK');
        buzz([60, 40, 60]);
      }
    } else if (onGround) FM.spin = false;
    else {
      const pitchAng = Math.asin(Math.max(-1, Math.min(1, fwd.y)));
      r.x = (-0.9 - pitchAng) * 1.2;
      r.y = FM.dir * 1.1;
      r.z = -FM.dir * 0.9;
      if (FM.dir * s.y > 0.3 && s.p < -0.1) FM.recT += dt * (thr > 0.6 ? 0.5 : 1);
      else FM.recT = Math.max(0, FM.recT - dt);
      if (FM.recT > 0.8) {
        FM.spin = false;
        FM.spinT = 0;
        note('SPIN RECOVERED - PULL OUT GENTLY');
      }
    }
    /* fuel: about 8 gal/h at idle to 120 gal/h at full power; the engine quits when the tanks run dry */
    if (hf) {
      if (!engOut) FM.fuel = Math.max(0, FM.fuel - ((8 + 112 * thr) / 3600 / 269) * dt);
      if (FM.fuel <= 0.12 && FM.lowT === 0) {
        FM.lowT = 1;
        note('LOW FUEL - LAND SOON');
      } else if (FM.fuel <= 0 && FM.lowT === 1) {
        FM.lowT = 2;
        note('OUT OF FUEL - GLIDE TO A LANDING');
      } else if (FM.fuel > 0.2) FM.lowT = 0;
    } else {
      FM.fuel = 1;
      FM.lowT = 0;
    }
    /* engine heat: full throttle (above 90%) heats the engine, lower power and fast air cool it */
    if (hh || (hw && FM.eT > 0)) {
      if (thr > 0.9 && !engOut) FM.eT = Math.min(1.2, FM.eT + (dt / 240) * (1 + Math.max(0, 1 - v / 80)));
      else FM.eT = Math.max(0, FM.eT - (dt / 40) * (0.5 + Math.min(1, v / 80)));
      if (!FM.hot && FM.eT >= 1) {
        FM.hot = true;
        note('ENGINE OVERHEATING - REDUCE POWER');
      } else if (FM.hot && FM.eT < 0.6) {
        FM.hot = false;
        note('ENGINE TEMPERATURE NORMAL');
      } else if (FM.eT > 0.75 && FM.warnT <= 0) {
        FM.warnT = 1;
        note('ENGINE TEMPERATURE HIGH - EASE THE THROTTLE');
      }
      if (FM.eT < 0.6) FM.warnT = 0;
    } else {
      FM.eT = 0;
      FM.hot = false;
    }
    /* engine power limits from the manual: war emergency power for 5 minutes, and no more than 3240 rpm in a dive */
    if (hw && !engOut) {
      if (thr > 0.9) {
        FM.wepT += dt;
        if (FM.wepT > 270 && !FM.wepW) {
          FM.wepW = true;
          note('WAR EMERGENCY POWER: 30 SECONDS LEFT');
        }
        if (FM.wepT > 300 && !FM.wepX) {
          FM.wepX = true;
          FM.eT = Math.max(FM.eT, 1.2);
          note('5 MINUTE LIMIT EXCEEDED - ENGINE OVERHEATED, THROTTLE BACK');
        }
      } else {
        FM.wepT = Math.max(0, FM.wepT - dt);
        if (FM.wepT < 30) FM.wepW = FM.wepX = false;
      }
      const rpmD = 700 + thr * 2300 + Math.max(0, (FM.ias || v) * 2.237 - 420) * 3;
      if (rpmD > 3240) {
        FM.rpmT += dt;
        if (FM.rpmT > 3 && FM.rpmT - dt <= 3) {
          FM.eT = Math.max(FM.eT, 1.2);
          note('OVERSPEED OVER 3240 RPM - ENGINE DAMAGED, THROTTLE BACK');
        }
      } else FM.rpmT = Math.max(0, FM.rpmT - dt);
    } else if (!hw) {
      FM.wepT = FM.rpmT = 0;
      FM.wepW = FM.wepX = false;
    }
  }
}
