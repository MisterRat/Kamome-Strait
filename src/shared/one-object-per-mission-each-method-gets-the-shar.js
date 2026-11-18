/* one object per mission; each method gets the shared per-frame context built in updTrainer */
const TRAINERS = {
  /* ADF navigation: home on the beacon of a distant island airfield and land there */
  adf(c) {
    const { T0, R, kmh, gnd, agl } = c,
      b = adfInfo(BEACONS[0]),
      onR = ISL.onRwy(pos.x, pos.z, 10),
      side = b.rel > 0 ? 'right' : 'left';
    if (trn.step === 0 && Math.abs(b.rel) < 8) {
      trn.hold = (trn.hold || 0) + c.dt;
      if (trn.hold > 3) trn.step = 1;
    } else if (trn.step === 0) trn.hold = 0;
    if (trn.step === 1 && b.dist < 10000) trn.step = 2;
    if (trn.step <= 2 && b.dist < 500) trn.step = 3;
    if (trn.step === 3 && gnd && onR) trn.step = 4;
    if (trn.step === 4 && gnd && kmh < 6) {
      trn.done = true;
      trn.sum =
        'Landed at Kamome Field in ' +
        fmtT(trn.t) +
        ', found by radio compass alone. The needle took you straight to a small island in open sea: that is how crews found tiny airfields in the Pacific.';
      note('ADF NAVIGATION COMPLETE');
      return;
    }
    const rl = Math.abs(R(b.rel)) + ' deg ' + side,
      dk = (b.dist / 1000).toFixed(1);
    if (trn.step === 0) {
      trn.title = 'Step 1/5: Point at the beacon';
      T0(
        'The ADF needle (right of the screen) always points at the KMM radio beacon on Kamome Field, 43 km away. The top of the dial is your nose.\nTurn until the needle sits straight up: then the nose points at the beacon. Needle on the right: turn right.',
        Math.abs(b.rel) < 8 ? 'Needle is up. Hold it there for 3 seconds.' : 'Needle ' + rl + ' of the nose: turn ' + side + '.',
        Math.abs(b.rel) < 8 ? 'ok' : 'warn',
      );
    } else if (trn.step === 1) {
      trn.title = 'Step 2/5: Home on the needle';
      const dr = Math.abs(b.rel) > 12;
      T0(
        'Hold the heading with the needle up. A crosswind pushes you sideways, so the needle drifts off the top: turn a few degrees toward it to put it back. Do not chase it with big turns.\n' +
          dk +
          ' km to go, about ' +
          fmtT(b.dist / Math.max(20, Math.hypot(vel.x, vel.z))) +
          ' flying time.',
        dr ? 'Needle ' + rl + ': turn ' + side + ' a few degrees.' : 'On the line. Distance ' + dk + ' km.',
        dr ? 'warn' : 'ok',
      );
    } else if (trn.step === 2) {
      trn.title = 'Step 3/5: Let down and look';
      const lo = pos.y < 900;
      T0(
        'About 10 km out. Keep the needle up, ease the throttle back and descend to 600 m. The island is low and flat: you will see its runway and the radio mast from a few kilometres. Fly over the mast.\n' +
          dk +
          ' km to the beacon.',
        lo ? 'Height ' + R(pos.y) + ' m. Keep the needle up.' : 'Height ' + R(pos.y) + ' m: descend towards 600 m.',
        lo ? 'ok' : 'warn',
      );
    } else if (trn.step === 3) {
      trn.title = 'Step 4/5: Over the station, then land';
      T0(
        'You are over the beacon: the needle swings round to point behind you (station passage). Now join the circuit: the runway runs 070 / 250 degrees (07 and 25). Follow the green ring: it leads a circuit round onto a straight final, then down the glide slope. Lower the gear (G) and flaps, about 170 km/h on final, and land on the runway.\nThe runway numbers are painted at each end.',
        gearOn ? 'Gear down. Speed ' + R(kmh) + ' km/h. Height ' + R(agl) + ' m.' : 'Gear UP: press G before landing.',
        gearOn ? 'ok' : 'warn',
      );
    } else {
      trn.title = 'Step 5/5: Stop on the runway';
      T0('Down on Kamome Field. Brake to a stop on the runway (B or the brake button).', 'Speed ' + R(kmh) + ' km/h.', 'ok');
    }
  },
  takeoff(c) {
    const { dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 } = c;
    if (!gnd && !trn.lifted) {
      trn.lifted = true;
      trn.liftV = kmh;
      trn.liftD = 420 - pos.z;
    }
    if (trn.step < 1 && (flapLvl >= 1 || kmh > 25)) trn.step = 1;
    if (trn.step < 2 && thr >= 0.95) trn.step = 2;
    if (trn.step < 3 && kmh >= 150) trn.step = 3;
    if (trn.step < 4 && !gnd) trn.step = 4;
    if (trn.step < 5 && !gearOn && !gnd) trn.step = 5;
    if (trn.step < 6 && flapLvl === 0 && kmh >= 235 && !gearOn) trn.step = 6;
    if (!gnd && agl >= 300) {
      trn.done = true;
      trn.sum =
        'Liftoff at ' +
        R(trn.liftV) +
        ' km/h after ' +
        R(trn.liftD) +
        ' m. ' +
        (trn.liftV < 215 ? 'Clean takeoff!' : 'A bit fast: try rotating nearer 150 km/h.') +
        (gearOn ? ' The gear is still down.' : '') +
        (flapLvl > 0 ? ' The flaps are still down.' : '');
      note('TAKEOFF COMPLETE');
      return;
    }
    const s = trn.step,
      off = pos.x;
    let txt,
      h = '',
      l = '';
    /* the green ring is a point on the pilot's recorded line; the white marker is your flight path */
    let ringH = '';
    if (!gnd && s >= 4 && guide.rs) {
      const fpaN = Math.asin(Math.max(-1, Math.min(1, vel.y / Math.max(1, vel.length())))) * 57.3,
        fpaR = Math.atan2(guide.rs.y + 2 - pos.y, Math.hypot(guide.rs.x - pos.x, guide.rs.z - pos.z)) * 57.3;
      ringH = fpaN > fpaR + 2 ? ' White marker is above the ring: ease the nose down.' : fpaN < fpaR - 2 ? ' White marker is below the ring: raise the nose a little.' : ' White marker is in the ring: good.';
    }
    if (s === 0) {
      trn.title = 'Step 1/7: Flaps';
      txt =
        'Set the flaps to 10 degrees: press F (or D-pad right) once.\nFlaps add lift, so she leaves the ground sooner and slower. They are safe up to 640 km/h.';
      h = 'Flaps now: ' + (flapDeg ? flapDeg + ' degrees' : 'UP') + '. Press F once.';
      l = 'warn';
    } else if (s === 1) {
      trn.title = 'Step 2/7: Full power';
      txt =
        'Push the throttle to 100%: hold Shift (or D-pad up) until the bar on the right is full.\nPower gives speed, and speed gives lift.';
      h = 'Throttle ' + R(thr * 100) + '%';
      l = thr > 0.9 ? 'ok' : 'warn';
    } else if (s === 2) {
      trn.title = 'Step 3/7: Roll straight';
      txt =
        'Keep the nose on the runway centerline. Roll left/right (A / D or right stick) steers on the ground.\nDo not pull back yet: rotate at 150 km/h.';
      h =
        'Speed ' +
        R(kmh) +
        ' km/h (rotate at 150). ' +
        (Math.abs(off) < 4
          ? 'On the centerline.'
          : R(Math.abs(off)) +
            ' m ' +
            (off > 0 ? 'right' : 'left') +
            ' of the centerline: steer ' +
            (off > 0 ? 'left' : 'right') +
            '.');
      l = Math.abs(off) < 10 ? 'ok' : 'warn';
    } else if (s === 3) {
      trn.title = 'Step 4/7: Rotate';
      txt =
        "Ease the stick back until the nose sits about 10 degrees above the horizon, then hold it there.\nThe white marker stays on the horizon until she lifts off, so judge by the nose angle. Don't yank it: too much nose-up adds drag and can stall the wing.";
      if (pitch > 15) {
        h = 'Nose too high (' + R(pitch) + '). Ease forward!';
        l = 'bad';
      } else if (pitch < 6) {
        h = 'Nose ' + R(pitch) + ' deg: pull back gently toward 10.';
        l = 'warn';
      } else {
        h = 'Good: nose ' + R(pitch) + ' deg. She lifts off at about 200 km/h (' + R(kmh) + ' now).';
        l = 'ok';
      }
    } else if (s === 4) {
      trn.title = 'Step 5/7: Gear up';
      txt =
        'You are flying! Raise the landing gear now: press G (or A). The gear is drag.\nKeep the nose about 10 degrees up and the wings level. Now the white marker should sit in the green ring.';
      if (kmh < 190 || (kmh < 235 && pitch > 11)) {
        h = 'Speed ' + R(kmh) + (pitch > 11 ? ', nose ' + R(pitch) + ' deg: too steep to gain speed. Lower the nose to 8 to 10 degrees.' : ': lower the nose a little, you need airspeed.');
        l = 'warn';
      } else {
        h = 'Speed ' + R(kmh) + ' km/h, climbing ' + vel.y.toFixed(1) + ' m/s. Gear up: G / A.' + ringH;
        l = 'ok';
      }
    } else if (s === 5) {
      trn.title = 'Step 6/7: Build speed, flaps up';
      txt =
        'Hold the nose 8 to 10 degrees up and let the speed build to 240 km/h, then retract the flaps: press V (or D-pad left).\nRaising them early makes you sink. A steeper nose stops the speed building.';
      if (flapLvl === 0 && kmh < 235) {
        h = 'Flaps are up. Build speed: now ' + R(kmh) + ', want 240 km/h.';
        l = 'warn';
      } else if (kmh < 235) {
        h = pitch > 11 ? 'Nose ' + R(pitch) + ' deg is too steep: the speed will not build. Lower it to 8 to 10 (speed ' + R(kmh) + ', want 240).' : 'Wait: speed ' + R(kmh) + ' km/h, want 240 before flaps up.';
        l = 'warn';
      } else {
        h = 'Speed OK: flaps up now (V / D-pad left)!' + ringH;
        l = 'bad';
      }
    } else {
      trn.title = 'Step 7/7: Climb away';
      txt = 'Climb out at 250 to 270 km/h with the nose 9 to 12 degrees up (full power), until you are 300 m above the ground.';
      h =
        'Height ' +
        R(agl) +
        ' m, speed ' +
        R(kmh) +
        ' km/h. ' +
        (kmh < 215 ? 'Too slow: lower the nose.' : kmh > 310 ? 'Fast: you can raise the nose.' : 'Good climb.') +
        ringH;
      l = kmh < 215 ? 'bad' : 'ok';
    }
    T0(txt, h, l);
    return;
  },
  landing(c) {
    const { dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 } = c;
    if (!gnd) {
      trn.pvy = vel.y;
      trn.pk = kmh;
      trn.air = true;
    } else if (trn.air && !trn.td) {
      trn.air = false;
      trn.td = { sink: Math.max(0, -trn.pvy), kmh: trn.pk, off: pos.x };
    }
    const dist = pos.z - 600,
      off = pos.x,
      ideal = Math.max(0, (dist + 200) * 0.0524),
      err = agl - ideal,
      psi = Math.atan2(-fwd.x, -fwd.z),
      onFinal = Math.abs(off) < 250 && Math.abs(psi) < 0.6 && dist > -500;
    const leg = onFinal ? 'FINAL' : fwd.z > 0.45 ? 'DOWNWIND' : fwd.x < -0.45 ? 'BASE' : 'TURNING',
      thrAbeam =
        dist < 0
          ? (-dist / 1000).toFixed(1) + ' km ahead'
          : dist < 250
            ? 'abeam you'
            : (dist / 1000).toFixed(1) + ' km behind you';
    let st;
    if (gnd && trn.td) st = 6;
    else if (!gnd && agl < 9 && dist < 350 && trn.appr) st = 5;
    else {
      if (trn.step < 4) {
        if (thr > 0.12 && !trn.idleOK) st = 0;
        else {
          trn.idleOK = true;
          if (!gearOn) st = 1;
          else if (flapLvl < 2) st = 2;
          else if (kmh > 235) st = 3;
          else st = 4;
        }
      } else st = 4;
      if (st === 4) trn.appr = true;
    }
    trn.step = Math.max(trn.step, st >= 4 ? st : 0);
    if (st < 4) trn.step = 0;
    let txt,
      h = '',
      l = '',
      ln = onFinal
        ? 'Distance ' +
          (dist > 0 ? (dist / 1000).toFixed(1) + ' km' : 'over the runway') +
          ' | height ' +
          R(agl) +
          ' m | speed ' +
          R(kmh) +
          ' km/h | sink ' +
          Math.max(0, -vel.y).toFixed(1) +
          ' m/s'
        : 'Circuit: ' + leg + ' | threshold ' + thrAbeam + ' | height ' + R(agl) + ' m | speed ' + R(kmh) + ' km/h';
    if (st === 0) {
      trn.title = 'Step 1/7: Slow down';
      txt =
        (onFinal
          ? 'You are fast. '
          : 'You start on the DOWNWIND leg of the landing circuit: parallel to the runway, flying the opposite way. The circuit is downwind, base, final.\nFirst slow down. ') +
        "Close the throttle completely: hold Ctrl (or D-pad down) until the bar reads 0%.\nKeep the nose level, don't climb or dive. With power off she slows by herself, about 20 seconds.";
      h =
        'Speed ' +
        R(kmh) +
        ' km/h, throttle ' +
        R(thr * 100) +
        '%. Target: idle, then below ' +
        (FM.use('ops') ? 273 : 350) +
        ' km/h for the gear.';
      l = 'warn';
    } else if (st === 1) {
      trn.title = 'Step 2/7: Landing gear';
      txt =
        'Lower the landing gear: press G (or A). The gear is a big drag brake and you need it down to land.\nSafe below ' +
        (FM.use('ops') ? '273 (170 mph)' : 350) +
        ' km/h.';
      h =
        kmh > (FM.use('ops') ? 273 : 350)
          ? 'Speed ' +
            R(kmh) +
            ': wait until below ' +
            (FM.use('ops') ? 273 : 350) +
            ' km/h. Keep the nose level, throttle idle.'
          : 'Speed ' + R(kmh) + ' km/h: gear down now (G / A).';
      l = kmh > (FM.use('ops') ? 273 : 350) ? 'warn' : 'bad';
    } else if (st === 2) {
      trn.title = 'Step 3/7: Flaps';
      txt =
        'Extend the flaps in two steps: F (or D-pad right) once for 10 degrees, again for 20 degrees.\nFlaps give lift at low speed and add drag to slow you. Limits: 10 deg to 640 km/h, 20 deg to 440 km/h.';
      h =
        'Flaps now: ' +
        (flapDeg ? flapDeg + ' degrees' : 'UP') +
        (kmh > 440 ? '. Too fast for 20 degrees (' + R(kmh) + ' km/h): wait.' : '. Press F again for 20.');
      l = kmh > 440 ? 'warn' : 'bad';
    } else if (st === 3) {
      trn.title = 'Step 4/7: Settle at 210 km/h';
      txt =
        'Hold the nose level and let the speed fall to 210 km/h (final approach speed).\nIf she is slow to bleed off: throttle idle, nose a touch higher. If she sinks too fast, add a little throttle.';
      h = 'Speed ' + R(kmh) + ' km/h, target 210. Fast by ' + R(kmh - 210) + ' km/h.';
      l = 'warn';
    } else if (st === 4) {
      trn.title = onFinal ? 'Step 5/7: Final approach' : 'Step 5/7: Base and final turns';
      txt = onFinal
        ? 'Fly down to the runway at 210 km/h, following the green ring: it sits on the centreline and on a 3 degree slope that meets the runway 200 m past the threshold. Use the ailerons to stay on the centreline, the THROTTLE for your height on the slope and the NOSE for the speed.\nThe coach below tells you how many metres high, low, left or right you are.'
        : 'Follow the green ring around the circuit: a RIGHT turn onto BASE, then a second right turn onto final, rolling out lined up with the runway at 210 km/h.\nBank no more than 30 degrees and descend gently, about 150 m at the turn onto final.\nJoin the 3 degree slope from BELOW: hold your height until the ring comes up to you, then descend.';
      const hot = onFinal && kmh > 250 && dist < 1500,
        go = onFinal && ((kmh > 270 && dist < 800 && agl > 20) || (agl > 70 && dist < 200 && dist > -300));
      const sh = onFinal && agl < 30 && dist > 400;
      if (go) {
        h = 'UNSTABLE: GO AROUND! Full throttle, climb straight ahead, gear up once climbing, then circle back.';
        l = 'bad';
      } else if (sh) {
        h = 'TOO LOW, still ' + R(dist) + ' m from the runway: you will land short! Add power and climb gently now.';
        l = 'bad';
      } else if (hot) {
        h =
          'TOO FAST (' +
          R(kmh) +
          ' km/h)! Throttle idle, raise the nose slightly to bleed speed, flaps 20. Still over 260 inside 1 km? Go around.';
        l = 'bad';
      } else if (kmh < 175) {
        h = 'DANGEROUSLY SLOW (' + R(kmh) + '; stall about 150-165). Lower the nose and add throttle now!';
        l = 'bad';
      } else if (kmh > 228) {
        h = 'Fast by ' + R(kmh - 210) + ' km/h: throttle idle and hold the nose slightly higher; the speed will bleed.';
        l = 'warn';
      } else if (kmh < 192) {
        h = 'A little slow: add a touch of throttle or lower the nose slightly.';
        l = 'warn';
      } else if (!onFinal) {
        h =
          leg === 'DOWNWIND'
            ? 'DOWNWIND: hold 210-230 km/h and about ' +
              R(Math.max(150, agl)) +
              ' m, wings level, and follow the path. Threshold ' +
              thrAbeam +
              '.'
            : leg === 'BASE'
              ? 'BASE: the second right turn onto final is coming. Hold 210 km/h, descend gently and follow the path onto final.'
              : 'Turning: keep the bank under 30 degrees, hold 210 km/h and roll out on the runway centerline.';
        l = kmh > 235 || kmh < 180 ? 'warn' : 'ok';
      } else if (err > 35) {
        h =
          'ABOVE the glide slope by ' +
          R(err) +
          ' m: throttle to idle and lower the nose to descend, holding 210 km/h.';
        l = 'warn';
      } else if (err < -25) {
        h =
          'BELOW the glide slope by ' +
          R(-err) +
          ' m: add throttle and hold the nose up a little. Do not let the speed fall.';
        l = 'warn';
      } else if (Math.abs(off) > 30) {
        h =
          R(Math.abs(off)) +
          ' m ' +
          (off > 0 ? 'right' : 'left') +
          ' of the centreline: bank gently ' +
          (off > 0 ? 'left' : 'right') +
          ' to line up.';
        l = 'warn';
      } else {
        h = 'On the centreline and the slope (ideal height ' + R(ideal) + ' m). Speed good. Keep it steady.';
        l = 'ok';
      }
      ln += ' | ideal ' + R(ideal) + ' m';
    } else if (st === 5) {
      trn.title = 'Step 6/7: Flare';
      txt =
        "Flare now! Throttle to idle and ease the nose up to about 8 degrees so she settles gently onto the main wheels.\nDon't push the nose down.";
      if (-vel.y > 4) {
        h = 'Sinking ' + (-vel.y).toFixed(1) + ' m/s: ease the nose up now!';
        l = 'bad';
      } else if (pitch > 13) {
        h = 'Nose too high (' + R(pitch) + '): ease forward a little.';
        l = 'bad';
      } else {
        h = 'Nose ' + R(pitch) + ' deg, sink ' + Math.max(0, -vel.y).toFixed(1) + ' m/s: good, hold it.';
        l = 'ok';
      }
    } else {
      trn.title = 'Step 7/7: Rollout';
      const d = trn.td;
      txt =
        'Touched down at ' +
        R(d.kmh) +
        ' km/h. Throttle idle, keep her straight (roll input steers) and hold B for the brakes.';
      if ((kmh <= 2 || vel.length() * 3.6 <= 2) && gnd) {
        const sc =
          d.sink < 2.5 && Math.abs(d.off) < 12 && d.kmh > 150 && d.kmh < 190
            ? 3
            : d.sink < 4.5 && Math.abs(d.off) < 25
              ? 2
              : 1;
        trn.done = true;
        trn.sum =
          (sc === 3 ? 'Perfect landing! ' : sc === 2 ? 'Good landing. ' : 'Safe, but rough. ') +
          'Touchdown ' +
          R(d.kmh) +
          ' km/h, sink ' +
          d.sink.toFixed(1) +
          ' m/s, ' +
          R(Math.abs(d.off)) +
          ' m off the centerline.   ' +
          '*'.repeat(sc) +
          '-'.repeat(3 - sc);
        note('LANDING COMPLETE');
        return;
      }
      h = 'Speed ' + R(kmh) + ' km/h. ' + (thr > 0.1 ? 'Throttle to idle! ' : '') + 'Hold B to brake.';
      l = thr > 0.1 ? 'warn' : 'ok';
    }
    T0(txt + '\n' + ln, h, l);
    return;
  },
  dogfight(c) {
    const { dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 } = c;
    resupply(dt);
    php = Math.min(100, php + 1.2 * dt);
    DM.heal(dt);
    const alive = EN.filter((e) => !e.dying);
    if (!alive.length) {
      trn.spawn -= dt;
      if (trn.spawn <= 0 && airKills < 3) {
        spawnEnemy();
        trn.spawn = 3;
      }
    } else trn.spawn = 3;
    if (airKills >= 3) {
      trn.done = true;
      trn.sum = '3 bandits shot down in ' + fmtT(trn.t) + '. Hull ' + R(php) + '%.';
      note('DOGFIGHT COMPLETE');
      return;
    }
    trn.title = 'Bandits down ' + airKills + '/3  |  Hull ' + R(php) + '%';
    if (!alive.length) {
      T0(
        'Next bandit incoming.\nRules of the fight: keep your speed up (over 250 km/h; if it falls below 235, level the wings and trade height for speed until you have 270 again), turn so your nose points a little AHEAD of him, get behind him, then fire short bursts.',
        'Check the pink B marker on the compass: it points at the bandit.',
        '',
      );
      return;
    }
    const e = alive[0],
      d = e.p.distanceTo(pos),
      to = e.p.clone().sub(pos).normalize(),
      ata = Math.acos(Math.max(-1, Math.min(1, fwd.dot(to)))) * 57.3,
      him = Math.acos(Math.max(-1, Math.min(1, e.fwd.dot(to.clone().negate())))) * 57.3,
      tb = to.clone().applyQuaternion(q.clone().invert()),
      clock = (Math.round((Math.atan2(tb.x, -tb.z) * 57.3) / 30) + 12) % 12 || 12,
      hl = tb.y > 0.25 ? 'high' : tb.y < -0.25 ? 'low' : 'level',
      dy = e.p.y - pos.y;
    const where =
      'Bandit ' +
      (d < 1000 ? R(d) + ' m' : (d / 1000).toFixed(1) + ' km') +
      ' at your ' +
      clock +
      " o'clock, " +
      hl +
      ' (' +
      R(Math.abs(dy)) +
      ' m ' +
      (dy >= 0 ? 'above' : 'below') +
      ').';
    let txt, h, l;
    if (him < 22 && d < 1000 && ata > 90) {
      txt =
        'DEFENSIVE: he is behind you!\nBreak: roll hard toward him and pull; or dive and run. A hard turn costs speed, so keep it above 235 km/h.';
      h = 'He has you in his sights at ' + R(d) + ' m. Break now!';
      l = 'bad';
    } else if (ata < 18 && d < 800 && him > 60) {
      txt =
        'OFFENSIVE: you are on his tail!\nPut the small orange ring a little ahead of him and fire short bursts (Space / right trigger) inside 520 m.';
      h =
        d < 520
          ? ata < 4
            ? 'FIRE! Ring on target at ' + R(d) + ' m.'
            : 'In range (' + R(d) + ' m): steer the ring onto him (' + R(ata) + ' deg off).'
          : 'Close in to under 520 m: ' + R(d) + ' m now. Add power, keep the ring on him.';
      l = d < 520 && ata < 4 ? 'ok' : 'warn';
    } else {
      txt =
        'NEUTRAL: get behind him.\nTurn so the pink marker is dead ahead, match his height, and pull inside his turn without stalling (stay above 235 km/h).';
      h =
        ata > 100
          ? 'He is behind you: turn hard toward him to keep him in sight.'
          : 'Angle off ' +
            R(ata) +
            ' deg, range ' +
            R(d) +
            ' m. ' +
            (dy > 40 ? 'Climb a little to match him.' : dy < -40 ? 'Dive a little to match him.' : 'Height matched.');
      l = 'warn';
    }
    if (kmh < 235 && l !== 'bad') {
      h = 'LOW ENERGY (' + R(kmh) + ' km/h, stall near 160): wings level, trade height for speed until 270 before turning again.';
      l = 'bad';
    }
    T0(txt + '\n' + where, h, l);
    return;
  },
  convoy(c) {
    const { dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 } = c;
    resupply(dt);
    const alive = CV.list.filter((v) => !v.dead),
      stats =
        'Vehicles destroyed: ' +
        (CV.destroyed + CV.list.filter((v) => v.dead && !v.gone).length) +
        '   Escaped: ' +
        CV.escaped;
    trn.title = 'Strafing runs';
    if (CV.st === 'wreck' && !trn.rpReady && trn.rec && trn.rec.length > 4) {
      trn.rpReady = true;
      trn.sum = stats;
      trn.recEnd = true;
      rpRecGen(0, true);
    }
    if (CV.st !== 'run' || !alive.length) {
      T0(
        (CV.st === 'wreck'
          ? 'Convoy finished. Next one in ' + Math.ceil(CV.tm + CV.gap) + ' s.'
          : 'Next convoy leaves the airbase in ' + Math.ceil(CV.tm) + ' s.') +
          '\nPlan: the convoy leaves the depot ahead of you. Follow the green ring (the pilot\'s line) toward the road and come in on the nearest vehicle.\n' +
          stats +
          (trn.rpReady ? '\n\\ = replay with the sim pilot\'s best path (restarts the mission)' : ''),
        'Follow the green ring; the red T marker on the compass shows the road.',
        '',
      );
      return;
    }
    let nv = alive[0],
      nd = 1e9;
    for (const v of alive) {
      const dd = v.m.position.distanceTo(pos);
      if (dd < nd) {
        nd = dd;
        nv = v;
      }
    }
    const to = nv.m.position.clone().sub(pos).normalize(),
      ata = Math.acos(Math.max(-1, Math.min(1, fwd.dot(to)))) * 57.3,
      lead = Math.max(...alive.map((v) => v.s));
    let txt, h, l;
    const high = agl > 0.4 * nd + 40;
    if (agl < 18 && vel.y < -1.5 && nd < 800) {
      txt = 'PULL UP!';
      h = 'Only ' + R(agl) + ' m above the ground and sinking: pull back NOW, then climb and set up another pass.';
      l = 'bad';
    } else if (nd < 1500 && (ata > 38 || high || nd < 160)) {
      txt =
        'Break off\nThis run is spoiled: ' +
        (nd < 160 ? 'you have gone past the vehicle.' : ata > 38 ? 'the vehicle is too far off your nose.' : 'you are too high to get down on it.') +
        '\nFly straight and level at about 160 m and keep going until the convoy is 2.3 km away, then turn back in on the nearest vehicle.';
      h = 'Range ' + R(nd) + ' m, ' + R(ata) + ' deg off the nose, height ' + R(agl) + ' m. Extend away, then come back.';
      l = 'warn';
    } else if (nd > 1500) {
      txt =
        'Step 1: Follow the green ring\nKeep the white marker in the green ring: it is the line the pilot flew down to the convoy. Hold about 390 km/h. The convoy comes into view ahead and the red T marker on the compass points at the nearest vehicle.\nIf you wander far off the line or stay too high, you will have to break off and try again.';
      h = 'Nearest vehicle ' + (nd / 1000).toFixed(1) + ' km away, ' + R(ata) + ' deg off the nose. Height ' + R(agl) + ' m, speed ' + R(kmh) + ' km/h.';
      l = ata > 60 ? 'warn' : 'ok';
    } else {
      txt =
        'Step 2: Dive, aim, fire\nKeep the nose on the vehicle and go down to the deck, 20 to 50 m, by the time you are 700 m out. Hold the trigger (Space / right trigger) from 700 m to about 250 m while it is within 8 degrees of your nose. The burst has to walk onto it.\nThe pull-up comes at about 20 m, or at once if you are closer than 160 m. Tankers explode!';
      if (nd <= 700)
        h =
          ata < 8
            ? 'FIRE! On target (' + R(nd) + ' m, ' + R(ata) + ' deg off).'
            : 'In range (' + R(nd) + ' m): ' + R(ata) + ' deg off. Steer onto the vehicle.';
      else h = 'Range ' + R(nd) + ' m. Keep the nose on it and come down: fire inside 700 m.';
      l = ata < (nd <= 700 ? 8 : 12) ? 'ok' : 'warn';
    }
    if (kmh < 260 && agl > 150 && l !== 'bad') {
      h =
        'LOW SPEED (' +
        R(kmh) +
        ' km/h, stall 165): add power and lower the nose BEFORE you turn. Tight turns at this speed stall the wing.';
      l = 'bad';
    }
    T0(txt + '\n' + stats + ' | convoy ' + ((CLEN - lead) / 1000).toFixed(1) + ' km from the depot', h, l);
    return;
  },
  bomb(c) {
    const { dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 } = c;
    resupply(dt);
    const left = BLD.filter((b) => !b.dead);
    if (!left.length) {
      trn.done = true;
      trn.sum = 'All ' + BLD.length + ' buildings destroyed in ' + fmtT(trn.t) + '.';
      note('BUILDINGS DESTROYED');
      return;
    }
    trn.title = 'Buildings left ' + left.length + '/' + BLD.length;
    const tg =
        guide.tgt && !guide.tgt.dead && Math.hypot(guide.tgt.c.x - pos.x, guide.tgt.c.z - pos.z) > 600
          ? guide.tgt
          : pickBldg(left),
      td = Math.hypot(tg.c.x - pos.x, tg.c.z - pos.z);
    const vh = Math.hypot(vel.x, vel.z) || 1,
      hx = vel.x / vh,
      hz = vel.z / vh,
      imp = bombImpact(),
      ex = imp.x - tg.c.x,
      ez = imp.z - tg.c.z,
      along = ex * hx + ez * hz,
      cross = -ex * hz + ez * hx; // along>0: long. cross>0: impact is to the RIGHT of the target
    const ord = 'Bombs ' + (2 - bmN) + ' | Rockets ' + (6 - rkN),
      im =
        'A bomb dropped now would land ' +
        R(Math.abs(along)) +
        ' m ' +
        (along > 0 ? 'LONG' : 'SHORT') +
        ' and ' +
        R(Math.abs(cross)) +
        ' m ' +
        (cross > 0 ? 'RIGHT' : 'LEFT') +
        ' of the target.';
    let txt, h, l;
    const relOK = Math.abs(cross) <= 30 && along >= -40 && along <= 8 && agl > 150 && td < 2400 && pitch < -8;
    if (agl < (relOK ? 0 : 200) && vel.y < 0 && td < 900) {
      txt = 'PULL UP!';
      h = 'Only ' + R(agl) + ' m above the ground: pull back now and climb away.';
      l = 'bad';
    } else if (td > 2600) {
      txt =
        'Step 1: Approach\nThe red T marker on the compass points at the nearest building. Follow the green ring toward it, level at about 900 m and 390 km/h.\nKeep the white marker inside the green ring to stay lined up.';
      h = 'Target ' + (td / 1000).toFixed(1) + ' km away, height ' + R(agl) + ' m, speed ' + R(kmh) + ' km/h.';
      l = 'warn';
    } else if (pitch > -8 && td > 700) {
      txt =
        'Step 2: Roll in\nWhen the target is about 2 km ahead, lower the nose into a 10 to 18 degree dive straight at it. A dive makes the aim steady and speeds the bomb up.';
      h = 'Target ' + (td / 1000).toFixed(1) + ' km. Nose ' + R(pitch) + ' deg: nose down toward the target.';
      l = 'warn';
    } else {
      txt =
        'Step 3: Aim and release\nThe red IMPACT circle shows where a bomb dropped now would land. Dive so it slides onto the building, and press Z (or X) when the coach says RELEASE NOW. The bomb keeps your speed and falls for about 5 s.\nPull up by 250 m. Rockets (R): fire from 800-1000 m.';
      const steer =
        Math.abs(cross) > 30
          ? ' Impact is ' +
            R(Math.abs(cross)) +
            ' m to the ' +
            (cross > 0 ? 'right' : 'left') +
            ' of the target: steer ' +
            (cross > 0 ? 'LEFT' : 'RIGHT') +
            '.'
          : '';
      if (relOK) {
        h = 'RELEASE NOW (Z / X)! ' + im;
        l = 'ok';
      } else if (along > 8 && Math.abs(cross) <= 60) {
        h =
          'TOO LATE: the bomb would land ' +
          R(along) +
          ' m long. Hold your fire, pull up and come around for another dive.';
        l = 'bad';
      } else if (along < -40 && along >= -300) {
        h = 'GET READY: release point in about ' + Math.max(0, (-along - 20) / vh).toFixed(1) + ' s. ' + im + steer;
        l = 'warn';
      } else {
        h = im + steer;
        l = 'warn';
      }
      if (agl < 250 && l !== 'ok') l = 'bad';
    }
    if (kmh < 260 && agl > 150 && l !== 'bad') {
      h =
        'LOW SPEED (' +
        R(kmh) +
        ' km/h, stall 165): add power and lower the nose BEFORE you turn. Tight turns at this speed stall the wing.';
      l = 'bad';
    }
    T0(txt + '\n' + ord, h, l);
  },
};
