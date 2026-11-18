/* energy check for a half loop: speed needed now to reach the top, ignoring drag (so it is a minimum) */
function aeroNeed(A) {
  const v = Math.max(vel.length(), 1),
    th = Math.max(0, Math.min(180, A.loop)) / 57.3,
    R = (v * v) / (9.8 * Math.max(gF, 2.5)),
    vtop = A.hc ? 58 : 50,
    need = Math.sqrt(vtop * vtop + 2 * 9.8 * R * (1 + Math.cos(th))),
    k = FM.ias / v;
  return { need: need * k * 3.6, have: FM.ias * 3.6 };
}
function aeroStallReport(c, A) {
  const need = A.hc ? 650 : 520,
    hi = A.hc ? 5.8 : 5,
    why = [];
  if (A.entK < need * 0.94) why.push('you entered at ' + c.R(A.entK) + ' km/h, you need ' + need + '+ (all your energy comes from entry speed)');
  if (A.pmG > hi - 0.5) why.push('you were pulling ' + A.pmG.toFixed(1) + ' G at only ' + c.R(c.kmh) + ' km/h: the stall speed rises with the square root of G, so a hard pull at low speed stalls the wing');
  if (A.pmThr < 0.9) why.push('the throttle was at ' + c.R(A.pmThr * 100) + '%, not full');
  if (A.gPk < 2.5) why.push('your early pull was only ' + A.gPk.toFixed(1) + ' G: a lazy pull makes a huge loop and uses up the speed climbing');
  if (!why.length) why.push('the speed ran out before the top; start the pull earlier and a little harder, or enter faster');
  return 'STALL at ' + c.R(c.kmh) + ' km/h, ' + c.R(Math.max(0, A.loop)) + ' deg into the loop, ' + A.pmG.toFixed(1) + ' G: ' + why.join('; ') + '.\nTo recover: stick forward (nose to the horizon), then try again with Enter.';
}
const AERO_DEF = {
  /* ---- Immelmann: a half loop up, then a half roll to upright, going the other way ---- */
  immelmann: {
    steps: [
      {
        t: 'Get set',
        txt: (c, A) =>
          'Wings level, nose on the horizon, full throttle. You need about ' +
          (A.hc ? 650 : 520) +
          ' km/h to get over the top' +
          (A.hc ? '. In Hardcore the real drag and thinner air bleed your speed faster, so come in faster than in Standard mode.' : '.'),
        hint: (c, A) => [
          'Speed ' + c.R(c.kmh) + ' km/h (want ' + (A.hc ? 650 : 520) + '+). ' + (thr < 0.95 ? 'Full throttle: hold Shift.' : 'Level: pitch ' + c.R(c.pitch) + '.'),
          c.kmh > (A.hc ? 600 : 480) && thr > 0.9 ? 'ok' : 'warn',
        ],
        done: (c, A) => Math.abs(c.pitch) < 6 && Math.abs(A.bank) < 12 && c.kmh > (A.hc ? 600 : 480) && thr > 0.9,
      },
      {
        t: 'Pull up',
        txt: (c, A) =>
          'Pull the stick back firmly and smoothly (' +
          (A.hc ? '4.5 to 5.5' : '3.5 to 4.5') +
          ' G), wings level. The nose swings up through the vertical.' +
          (A.hc ? '\nKeep a touch of right rudder: torque will try to swing the nose left as the speed falls.' : ''),
        hint: (c, A) => {
          const hi = A.hc ? 5.8 : 5,
            lo = A.hc ? 3.5 : 2.5;
          if (Math.abs(A.bank) > 20 && A.loop < 80) return ['Wings level! Bank ' + c.R(Math.abs(A.bank)) + ' deg: use the ailerons.', 'warn'];
          const E = aeroNeed(A);
          if (buffet > 0.05) return ['Wing buffeting: close to the stall at ' + c.R(c.kmh) + ' km/h and ' + gF.toFixed(1) + ' G. Ease the stick a little.', 'bad'];
          if (A.loop > 25 && E.have < E.need * 0.9) return ['NOT ENOUGH SPEED for the top: ' + c.R(E.have) + ' km/h now, about ' + c.R(E.need) + ' needed here. Do not keep pulling: you will stall. Roll wings level, nose to the horizon, press Enter and enter faster.', 'bad'];
          if (gF > hi) return ['G ' + gF.toFixed(1) + ': too hard, ease off or you bleed all your speed.', 'bad'];
          if (gF < lo && A.loop < 40) return ['G ' + gF.toFixed(1) + ': pull harder, a lazy pull makes a huge loop.', 'warn'];
          return ['G ' + gF.toFixed(1) + ', nose ' + c.R(c.pitch) + ' deg, speed ' + c.R(c.kmh) + '. Good.', 'ok'];
        },
        done: (c, A) => A.loop >= 85,
      },
      {
        t: 'Over the top',
        txt: (c, A) =>
          'Keep pulling past the vertical. The horizon appears upside down. Do NOT let the speed drop below about ' +
          (A.hc ? '180' : '150') +
          ' km/h, or the wing will stall.' +
          (A.hc ? '\nHardcore: ease the pull as the speed drops, and add right rudder.' : ''),
        hint: (c, A) =>
          buffet > 0.05
            ? ['Wing buffeting at ' + c.R(c.kmh) + ' km/h: relax the stick NOW (it is the stall warning) and keep the wings level.', 'bad']
            : c.kmh < (A.hc ? 170 : 140)
              ? ['Speed ' + c.R(c.kmh) + ': too slow! Ease the stick and let the nose fall.', 'bad']
              : ['Speed ' + c.R(c.kmh) + ' km/h, loop ' + c.R(A.loop) + ' of 180 deg. Keep the pull smooth: relax it a little as the speed falls.', 'ok'],
        done: (c, A) => A.loop >= 150 && Math.abs(A.bank) > 100,
      },
      {
        t: 'Roll upright',
        txt: () =>
          'Nose near the horizon, upside down: roll to wings level with the ailerons (left or right), and relax the back pressure while you roll.',
        hint: (c, A) => ['Bank ' + c.R(Math.abs(A.bank)) + ' deg from level. Roll with A / D (or the right stick).', 'ok'],
        done: (c, A) => Math.abs(A.bank) < 25,
      },
      {
        t: 'Level off',
        txt: () => 'Wings level: ease the nose onto the horizon and settle. You are now heading the other way.',
        hint: (c, A) => ['Nose ' + c.R(c.pitch) + ' deg, heading change ' + c.R(Math.abs(wrap180(A.hdg - A.hdg0))) + ' deg.', 'ok'],
        done: (c, A) => Math.abs(c.pitch) < 10 && Math.abs(A.bank) < 15 && Math.abs(wrap180(A.hdg - A.hdg0)) > 140,
      },
    ],
    fail: (c, A) => (stalled && A.loop > 40 && A.loop < 170 && c.kmh < 140 ? 'STALLED over the top. Release the back pressure and let the nose fall, then try again (Enter). Next time enter faster or pull a little harder early on.' : ''),
    finish: (c, A) => {
      const he = Math.abs(180 - Math.abs(wrap180(A.hdg - A.hdg0))),
        sc = Math.max(0, Math.round(100 - he * 1.5 - Math.max(0, (A.hc ? 175 : 150) - A.topKmh) * 0.3 - Math.max(0, A.maxG - (A.hc ? 6 : 5)) * 10));
      return 'Immelmann done: heading reversed to within ' + c.R(he) + ' deg, slowest speed ' + c.R(A.topKmh) + ' km/h, peak ' + A.maxG.toFixed(1) + ' G, height gained ' + c.R(pos.y - A.y0) + ' m. Score ' + sc + '/100.';
    },
  },
  /* ---- Split S: roll onto your back, then pull through a half loop downward ---- */
  splits: {
    steps: [
      {
        t: 'Get set',
        txt: (c, A) =>
          'Level at about ' + (A.hc ? 340 : 320) + ' km/h with the throttle CLOSED (the dive gives you plenty of speed). You are 2,400 m up: the manoeuvre needs about 1,000 m.',
        hint: (c, A) => ['Speed ' + c.R(c.kmh) + ' km/h, throttle ' + c.R(thr * 100) + '%. ' + (thr > 0.25 ? 'Close the throttle: hold Ctrl.' : 'Good.'), thr > 0.25 ? 'warn' : 'ok'],
        done: (c, A) => thr < 0.25 && Math.abs(c.pitch) < 6 && Math.abs(A.bank) < 12,
      },
      {
        t: 'Roll onto your back',
        txt: () => 'Roll the aircraft upside down with the ailerons and stop there, wings level, inverted. Do not pull yet.',
        hint: (c, A) => ['Bank ' + c.R(Math.abs(A.bank)) + ' deg (want 180). Nose ' + c.R(c.pitch) + ' deg.', Math.abs(A.bank) > 150 ? 'ok' : 'warn'],
        done: (c, A) => Math.abs(A.bank) > 150,
      },
      {
        t: 'Pull through',
        txt: (c, A) =>
          'Pull the stick back (' +
          (A.hc ? '4 to 5' : '3 to 4') +
          ' G): the nose falls through the vertical toward the ground. The speed will climb fast: keep the wings level and keep pulling steadily.' +
          (A.hc ? '\nHardcore: do not exceed 750 km/h indicated, and watch the G limit (+8 at normal weight).' : ''),
        hint: (c, A) => {
          const vmax = A.hc ? 700 : 760;
          if (c.agl < 500) return ['LOW: ' + c.R(c.agl) + ' m above the ground. PULL harder!', 'bad'];
          if (c.kmh > vmax) return ['Speed ' + c.R(c.kmh) + ': getting fast, keep pulling.', 'bad'];
          if (gF < 1.5 && Math.abs(c.pitch) < 80) return ['G ' + gF.toFixed(1) + ': pull harder, the dive is steepening.', 'warn'];
          return ['G ' + gF.toFixed(1) + ', nose ' + c.R(c.pitch) + ' deg, speed ' + c.R(c.kmh) + ', height ' + c.R(c.agl) + ' m.', 'ok'];
        },
        done: (c, A) => A.loop <= -150,
      },
      {
        t: 'Level out',
        txt: () => 'Almost round: ease the back pressure, roll the wings level if needed, and bring the nose to the horizon. Add power when you are level.',
        hint: (c, A) => ['Nose ' + c.R(c.pitch) + ' deg, height ' + c.R(c.agl) + ' m, speed ' + c.R(c.kmh) + '.', 'ok'],
        done: (c, A) => Math.abs(c.pitch) < 10 && Math.abs(A.bank) < 20,
      },
    ],
    fail: (c, A) => (A.maxKmh > (A.hc ? 780 : 820) ? 'OVERSPEED: ' + c.R(A.maxKmh) + ' km/h. You started the pull too late or too soft.' : ''),
    finish: (c, A) => {
      const he = Math.abs(180 - Math.abs(wrap180(A.hdg - A.hdg0))),
        lost = A.y0 - pos.y,
        sc = Math.max(0, Math.round(100 - he * 1.5 - Math.max(0, lost - 1000) * 0.05 - Math.max(0, A.maxKmh - 650) * 0.15 - Math.max(0, A.maxG - (A.hc ? 6 : 5)) * 10));
      return 'Split S done: heading reversed to within ' + c.R(he) + ' deg, ' + c.R(lost) + ' m lost, top speed ' + c.R(A.maxKmh) + ' km/h, peak ' + A.maxG.toFixed(1) + ' G. Score ' + sc + '/100.';
    },
  },
  /* ---- Barrel roll: a corkscrew around an imaginary barrel in front of you ---- */
  barrel: {
    steps: [
      {
        t: 'Get set',
        txt: (c, A) => 'Wings level, nose on the horizon, about ' + (A.hc ? 470 : 420) + ' km/h. The green ring will show which way to roll: follow it.',
        hint: (c, A) => ['Speed ' + c.R(c.kmh) + ' km/h. Nose ' + c.R(c.pitch) + ', bank ' + c.R(A.bank) + '.', 'ok'],
        done: (c, A) => Math.abs(c.pitch) < 6 && Math.abs(A.bank) < 12 && c.kmh > (A.hc ? 420 : 370),
      },
      {
        t: 'Nose up',
        txt: (c, A) => 'Pull the nose up about 20 degrees above the horizon. Then start to roll while keeping a little back pressure.' + (A.hc ? '\nHardcore: the real drag bleeds your speed in the climb, so do not go above 20 degrees, and keep the throttle at full power.' : ''),
        hint: (c, A) => ['Nose ' + c.R(c.pitch) + ' deg (want 20), speed ' + c.R(c.kmh) + '.', c.pitch > 12 ? 'ok' : 'warn'],
        done: (c, A) => c.pitch > 12 || Math.abs(A.bank) > 30,
      },
      {
        t: 'Roll around the barrel',
        txt: (c, A) =>
          'Roll steadily with the ailerons, holding a gentle pull: the nose should trace a circle around a point ahead. Upside down the nose should be near the horizon; keep the G above zero (a light pull the whole way).' +
          (A.hc ? '\nHardcore: the engine torque helps one direction and fights the other; use a little rudder to keep the ball centred.' : ''),
        hint: (c, A) => {
          if (gF < 0.3 && Math.abs(A.roll) > 70) return ['G ' + gF.toFixed(1) + ': pull back a little more as you go over the top.', 'warn'];
          if (gF > 4) return ['G ' + gF.toFixed(1) + ': too hard, ease off.', 'bad'];
          if (c.kmh < (A.hc ? 220 : 190)) return ['Speed ' + c.R(c.kmh) + ': too slow, let the nose drop.', 'bad'];
          return ['Rolled ' + c.R(Math.abs(A.roll)) + ' of 360 deg. G ' + gF.toFixed(1) + ', speed ' + c.R(c.kmh) + '.', 'ok'];
        },
        done: (c, A) => Math.abs(A.roll) >= 330,
      },
      {
        t: 'Roll out',
        txt: () => 'Finish the roll with wings level on your original heading, nose on the horizon.',
        hint: (c, A) => ['Heading error ' + c.R(Math.abs(wrap180(A.hdg - A.hdg0))) + ' deg, nose ' + c.R(c.pitch) + '.', 'ok'],
        done: (c, A) => Math.abs(A.bank) < 15 && Math.abs(c.pitch) < 12,
      },
    ],
    fail: (c, A) => (stalled && trn.step >= 1 ? 'STALLED. Release the stick, let the nose fall, and try again (Enter).' : ''),
    finish: (c, A) => {
      const he = Math.abs(wrap180(A.hdg - A.hdg0)),
        dh = Math.abs(pos.y - A.y0),
        sc = Math.max(0, Math.round(100 - he * 2 - dh * 0.1 - Math.max(0, 0.3 - A.minG) * 40));
      return 'Barrel roll done: back on heading to within ' + c.R(he) + ' deg and ' + c.R(dh) + ' m of your start height, lowest G ' + A.minG.toFixed(1) + ', slowest ' + c.R(A.minKmh) + ' km/h. Score ' + sc + '/100.';
    },
  },
  /* ---- Wingover: a climbing turn that stalls the nose over, then a diving turn back to the start height ---- */
  wingover: {
    steps: [
      {
        t: 'Get set',
        txt: (c, A) => 'Wings level, nose on the horizon, about ' + (A.hc ? 520 : 460) + ' km/h, full throttle.',
        hint: (c, A) => ['Speed ' + c.R(c.kmh) + ' km/h.', c.kmh > (A.hc ? 470 : 410) ? 'ok' : 'warn'],
        done: (c, A) => Math.abs(c.pitch) < 6 && Math.abs(A.bank) < 12 && c.kmh > (A.hc ? 470 : 410) && thr > 0.9,
      },
      {
        t: 'Climbing turn',
        txt: (c, A) => 'Start the climbing turn the way the green ring leads: pull up and roll into the turn together. Let the bank build to 60 or 70 degrees as the nose climbs to about 30 degrees.' + (A.hc ? '\nHardcore: the speed falls faster than in Standard mode; keep full power and use a little right rudder.' : ''),
        hint: (c, A) => ['Nose ' + c.R(c.pitch) + ', bank ' + c.R(Math.abs(A.bank)) + ', heading change ' + c.R(Math.abs(A.dh)) + ' deg.', c.pitch > 20 && Math.abs(A.bank) > 40 ? 'ok' : 'warn'],
        done: (c, A) => c.pitch > 20 && Math.abs(A.bank) > 40,
      },
      {
        t: 'Over the top',
        txt: (c, A) =>
          'Keep the turn going: as the speed falls the nose will drop through the horizon while you are banked about 80 to 90 degrees. Keep the stick light and keep turning. Hold the speed above ' +
          (A.hc ? '200' : '170') +
          ' km/h.' +
          (A.hc ? '\nHardcore: add right rudder as the speed drops; torque pulls the nose left.' : ''),
        hint: (c, A) =>
          c.kmh < (A.hc ? 190 : 160)
            ? ['Speed ' + c.R(c.kmh) + ': too slow, let the nose fall.', 'bad']
            : ['Heading change ' + c.R(Math.abs(A.dh)) + ' of 180. Speed ' + c.R(c.kmh) + ', nose ' + c.R(c.pitch) + '.', 'ok'],
        done: (c, A) => Math.abs(A.dh) >= 80 && c.pitch < 5,
      },
      {
        t: 'Down and round',
        txt: () => 'The nose is falling and the speed will build again. Keep turning, and begin to roll the wings level and ease the nose up as your heading nears the reverse of where you started.',
        hint: (c, A) => ['Heading change ' + c.R(Math.abs(A.dh)) + ' of 180 deg. Height ' + c.R(pos.y - A.y0) + ' m from the start. Speed ' + c.R(c.kmh) + '.', 'ok'],
        done: (c, A) => Math.abs(A.dh) >= 160 && Math.abs(A.bank) < 20 && Math.abs(c.pitch) < 12,
      },
    ],
    fail: (c, A) => (stalled && trn.step >= 1 ? 'STALLED. Release the stick, let the nose fall, and try again (Enter).' : ''),
    finish: (c, A) => {
      const he = Math.abs(180 - Math.abs(A.dh)),
        dh = Math.abs(pos.y - A.y0),
        sc = Math.max(0, Math.round(100 - he * 1.2 - dh * 0.1 - Math.max(0, (A.hc ? 190 : 160) - A.topKmh) * 0.3));
      return 'Wingover done: heading reversed to within ' + c.R(he) + ' deg, ' + c.R(dh) + ' m from your start height, slowest ' + c.R(A.topKmh) + ' km/h. Score ' + sc + '/100.';
    },
  },
  /* ---- Low yo-yo: you are behind a turning target and cannot close by turning flat: dive below him to gain speed, then pull up onto his tail ---- */
  lowyoyo: {
    drone: true,
    steps: [
      {
        t: 'Dive to build speed',
        txt: (c, A) =>
          'GOAL: end up close behind the drone (inside 450 m), nose pointed at him, at his height. Do NOT shoot him.\nThe drone (follow the marker) is circling left, and the same speed as you. If you just turn flat you never catch him.\nSTEP: push the stick FORWARD so the nose goes about 15 degrees below the horizon. Keep the wings level and the throttle full.' +
          (A.hc ? '\nHardcore: drag takes your energy, so full throttle and a clean dive matter more.' : ''),
        hint: (c, A) => [
          'Nose ' + c.R(c.pitch) + ' deg (want about -15), speed ' + c.R(c.kmh) + ' km/h. ' + (c.pitch > -6 ? 'Push the stick forward.' : c.pitch < -25 ? 'Too steep: ease back a little.' : 'Good, hold it.'),
          c.pitch < -6 && c.pitch > -25 ? 'ok' : 'warn',
        ],
        done: (c, A) => A.tgt && A.tgt.dy > 40 && c.pitch < -5,
      },
      {
        t: 'Turn toward him',
        txt: () =>
          'Keep the nose a little below the horizon and bank TOWARD the drone (use A or D) so you cut across his circle. Your speed is building: that is the point.\nWatch the drone marker: when he is under 700 m away, go to the next step.',
        hint: (c, A) => {
          const T = A.tgt;
          if (!T) return ['', 'warn'];
          return [
            'He is ' + (T.ata < 15 ? 'dead ahead' : 'on your ' + T.side) + ' (' + T.cl + " o'clock), " + c.R(T.d) + ' m, ' + c.R(Math.abs(T.dy)) + ' m ' + (T.dy >= 0 ? 'above' : 'below') + ' you. ' + (T.ata > 15 ? 'Bank ' + T.side + ' to point at him.' : 'Nose on him: good.') + ' Speed ' + c.R(c.kmh) + '.',
            T.ata > 25 ? 'warn' : 'ok',
          ];
        },
        done: (c, A) => A.tgt && A.tgt.d < 700,
      },
      {
        t: 'Pull up onto his tail',
        txt: () =>
          'Now pull the stick BACK smoothly to bring the nose up onto the drone, and fly the marker to the middle of the screen. Use your extra speed to climb up to his height.\nYou win when you are inside 450 m, nose within 12 degrees of him, at his height, for 1 second. Do not get closer than 150 m or you have overshot.',
        hint: (c, A) => {
          const T = A.tgt;
          if (!T) return ['', 'warn'];
          if (T.d < 150) return ['TOO CLOSE (' + c.R(T.d) + ' m): you are overshooting. Pull up and throttle back.', 'bad'];
          const adv = T.ata < 12 ? 'Nose on him.' : T.elev > 0 ? 'Nose is ' + c.R(T.elev) + ' deg too LOW: pull back.' : 'Nose is ' + c.R(-T.elev) + ' deg too HIGH: ease forward.';
          return ['Range ' + c.R(T.d) + ' m (need under 450). ' + adv + ' Height diff ' + c.R(T.dy) + ' m.', T.d < 450 && T.ata < 12 && Math.abs(T.dy) < 50 ? 'ok' : 'warn'];
        },
        done: (c, A) => A.hold >= 1,
      },
    ],
    fail: (c, A) => (A.tgt && A.tgt.d > 2600 ? 'He got away. Try again (Enter).' : ''),
    finish: (c, A) => {
      const sc = Math.max(0, Math.round(100 - Math.max(0, 150 - A.minRange) * 0.5 - Math.max(0, trn.t - 50) * 0.8));
      return 'Low yo-yo done: on his tail in ' + fmtT(trn.t) + ', closest approach ' + c.R(A.minRange) + ' m, speed ' + c.R(c.kmh) + ' km/h. Score ' + sc + '/100.';
    },
  },
  /* ---- High yo-yo: you are closing too fast and would overshoot: pull up out of his plane to trade speed for height, then drop onto his tail ---- */
  highyoyo: {
    drone: true,
    steps: [
      {
        t: 'Pull up',
        txt: (c, A) =>
          'GOAL: end up close behind the drone (inside 450 m), nose pointed at him, at his height. Do NOT shoot him.\nYou are much faster than him: fly straight at him and you shoot past and he is behind YOU.\nSTEP: pull the stick BACK to climb at about 20 to 30 degrees, wings level. Your extra speed turns into height.' +
          (A.hc ? '\nHardcore: pull smoothly (3 to 4 G); the thin air and drag bleed your speed quickly.' : ''),
        hint: (c, A) => {
          const T = A.tgt;
          return [
            'Nose ' + c.R(c.pitch) + ' deg (want 20 to 30), speed ' + c.R(c.kmh) + '. ' + (c.pitch < 12 ? 'Pull the stick back.' : c.pitch > 40 ? 'Too steep: ease forward.' : 'Good, hold it.') + (T ? ' He is ' + c.R(T.d) + ' m ahead.' : ''),
            c.pitch > 12 && c.pitch < 40 ? 'ok' : 'warn',
          ];
        },
        done: (c, A) => A.tgt && A.tgt.dy < -60 && c.pitch > 4,
      },
      {
        t: 'Climb above him',
        txt: (c, A) =>
          'Keep climbing until you are about 150 m ABOVE him, then ease the nose over. Bank a little toward him (A or D) so he stays in view.\nKeep your speed up: ' +
          (A.hc ? 'above 250' : 'above 220') +
          ' km/h. If it falls below that, ease the nose down.',
        hint: (c, A) => {
          const T = A.tgt;
          if (!T) return ['', 'warn'];
          return ['You are ' + c.R(-T.dy) + ' m above him (want 150). He is ' + (T.ata < 15 ? 'ahead' : 'on your ' + T.side) + ', ' + c.R(T.d) + ' m. Speed ' + c.R(c.kmh) + '.', c.kmh < (A.hc ? 250 : 220) ? 'bad' : 'ok'];
        },
        done: (c, A) => A.tgt && (A.tgt.dy < -120 || A.tgt.closing < 20),
      },
      {
        t: 'Drop onto his tail',
        txt: () =>
          'Now roll toward him and push the stick FORWARD gently so the nose drops onto the drone; fly the marker to the middle of the screen. Reduce the throttle a little so you do not overshoot.\nYou win when you are inside 450 m, nose within 12 degrees of him, at his height, for 1 second. Closer than 150 m means you overshot.',
        hint: (c, A) => {
          const T = A.tgt;
          if (!T) return ['', 'warn'];
          if (T.d < 150) return ['TOO CLOSE (' + c.R(T.d) + ' m): you are overshooting. Throttle back and climb.', 'bad'];
          const adv = T.ata < 12 ? 'Nose on him.' : T.elev > 0 ? 'Nose is ' + c.R(T.elev) + ' deg too LOW: pull back.' : 'Nose is ' + c.R(-T.elev) + ' deg too HIGH: push forward.';
          return ['Range ' + c.R(T.d) + ' m (need under 450). ' + adv + ' Height diff ' + c.R(T.dy) + ' m.', T.d < 450 && T.ata < 12 && Math.abs(T.dy) < 50 ? 'ok' : 'warn'];
        },
        done: (c, A) => A.hold >= 1,
      },
    ],
    fail: (c, A) => (A.tgt && A.tgt.d > 2600 ? 'He got away. Try again (Enter).' : ''),
    finish: (c, A) => {
      const sc = Math.max(0, Math.round(100 - Math.max(0, 150 - A.minRange) * 0.5 - Math.max(0, trn.t - 50) * 0.8));
      return 'High yo-yo done: on his tail in ' + fmtT(trn.t) + ', closest approach ' + c.R(A.minRange) + ' m, speed ' + c.R(c.kmh) + ' km/h. Score ' + sc + '/100.';
    },
  },
};
