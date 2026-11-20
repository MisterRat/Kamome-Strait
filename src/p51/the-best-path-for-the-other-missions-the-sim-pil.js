/* ---------- the best path for the other missions: the sim pilot flies the whole mission ----------
   The world is put back to the start of the mission, a scripted pilot flies it with the real flight model (the same physics, weapons and
   bandits as you), following the same flight-director point the player sees, and its path is recorded. Then the mission restarts. */
function rpMBot(m, S) {
  const cl = (x) => Math.max(-1, Math.min(1, x)),
    kmh = (FM.ias || vel.length()) * 3.6,
    agl = pos.y - 2 - H(pos.x, pos.z),
    pit = Math.asin(Math.max(-1, Math.min(1, fwd.y))) * 57.3,
    bank = Math.atan2(-right.y, up.y) * 57.3,
    psi = Math.atan2(-fwd.x, -fwd.z),
    qi = q.clone().invert();
  let p = 0,
    r = 0,
    y = 0,
    th = thr;
  if (AERO[m]) {
    /* the maneuver trainers: the scripted pilot used for the replay, flown from the start state in a fixed direction */
    if (S.i === 0 && trn.a) {
      trn.a.sg = 1;
      trn.a.dh = 0.001;
    }
    const ct = rpBotCtl(m, trn.a, FM.on);
    pad.p = ct.p;
    pad.r = ct.r;
    pad.y = 0;
    thr = ct.th;
    return;
  }
  pad.fire = false;
  pad.brake = false;
  S.prate = S.pp === undefined ? 0 : (pit - S.pp) * 60;
  S.pp = pit;
  /* follow a point: bank toward it in proportion to the bearing error, pull in proportion to the elevation error */
  const follow = (tg, gMax, bk, isP) => {
    const tb = tg.clone().sub(pos).applyQuaternion(qi),
      br = Math.atan2(tb.x, -tb.z),
      el = Math.atan2(tb.y, Math.hypot(tb.x, tb.z) * (tb.z < 0 ? 1 : -1)),
      db = Math.max(-(bk || 50), Math.min(bk || 50, br * 57.3 * (S.kb || 1.6) - ((isP || tg === look) && !S.ng && guide.latErr !== undefined ? Math.max(-250, Math.min(250, guide.latErr)) * 0.1 : 0)));
    r = cl((db - bank) * 0.04);
    p = cl(el * 3 + (Math.abs(bank) / 57.3) * 0.25 * (Math.abs(bank) < 85 ? 1 : 0.3));
    const gl0 = Math.min(gMax, Math.max(1.6, (kmh - 190) / 45));
    if (isP || tg === look) {
      /* fly the flight-path angle toward the point, not the nose (the nose sits well above the path at low speed) */
      const dxz = Math.hypot(tg.x - pos.x, tg.z - pos.z) || 1,
        gT = Math.atan2(tg.y - pos.y, dxz),
        gam = Math.atan2(vel.y, Math.hypot(vel.x, vel.z));
      p = cl((gT - gam) * 5 + (Math.abs(bank) < 85 ? Math.max(0, 1 / Math.cos((Math.abs(bank) / 57.3))  - gF) * 0.7 + (Math.abs(bank) / 57.3) * 0.12 : 0.1));
      if (guide.vertErr !== undefined && !S.ng) p = cl(p - guide.vertErr * 0.004);
      if (isP) {
        /* load-factor control: hold the G the bank needs, plus what the climb or dive error asks for */
        const bn = Math.min(Math.abs(bank), 75) / 57.3,
          nzT = Math.max(S.nzMin !== undefined ? S.nzMin : 0.3, Math.min(gl0, 1 / Math.cos(bn) + (S.kg || 4) * (gT - gam) - (S.ng ? 0 : guide.vertErr || 0) * 0.004));
        p = cl((nzT - gF) * 0.5 + (nzT - 1) * 0.12);
      }
    }
    const gl = Math.min(gMax, Math.max(1.6, (kmh - 190) / 45));
    if (p > 0 && gF > gl) p *= Math.max(0, 1 - (gF - gl) * 0.9);
    if (buffet > 0.05) p = Math.min(p, 0.1);
    return { br, el, tb };
  };
  const hard = (tg, gMax) => {
    const tb = tg.clone().sub(pos).applyQuaternion(qi),
      ang = Math.acos(Math.max(-1, Math.min(1, -tb.z / Math.max(1, tb.length())))),
      err = Math.atan2(tb.x, tb.y);
    r = ang > 0.04 ? cl(err * 1.2) : cl(-bank * 0.02);
    p = cl(Math.min(1, ang * 3) * Math.max(0, Math.cos(err)));
    const gl = Math.min(gMax, Math.max(1.6, (kmh - 190) / 45));
    if (gF > gl) p *= Math.max(0, 1 - (gF - gl) * 0.9);
    if (buffet > 0.05) p = Math.min(p, 0.1);
    return { ang, tb };
  };
  const look = guide.look && guide.pts.length > 1 ? new V(guide.look.x, guide.look.y, guide.look.z) : null;
  /* a point on the guide route itself, further along than the soft aiming point (which is limited to gentle slopes) */
  let plk = null;
  if (guide.pts.length > 1) {
    try {
      const pr = projectOnPath(guide.pts),
        lp = pathAt(guide.pts, pr.s + Math.max(120, vel.length() * 2.2));
      plk = new V(lp.x, lp.y + 2, lp.z);
    } catch (er) {}
  }
  const spd = (tgt) => (th = Math.max(0, Math.min(1, 0.45 + (tgt - kmh) * 0.02)));
  if (m === 'takeoff') {
    th = 1;
    if (S.i < 3) flapLvl = Math.min(1, ANG.length - 1);
    const psT = Math.max(-0.15, Math.min(0.15, pos.x * 0.004));
    y = cl((psi - psT) * 3);
    if (!onGround && agl > 1.6 && vel.y > 0) S.up = true;
    if (!S.up) {
      p = kmh >= 150 ? cl((16 - pit) * 0.25) : 0;
    } else {
      if (gearOn && agl > 12 && vel.y > 0) gearOn = false;
      if (kmh >= 240 && !gearOn) flapLvl = 0;
      const tp = Math.max(4, Math.min(16, 9 + (kmh - 250) * 0.12)); /* hold the 250 km/h the coach asks for */
      p = Math.max(-0.5, Math.min(0.5, (tp - pit) * 0.08));
      if (buffet > 0.05) p = Math.min(p, 0);
      r = cl(-bank * 0.05 - (psi - psT) * 1.2);
    }
  } else if (m === 'landing') {
    const dist = pos.z - 600,
      lim = FM.use('ops') ? 273 : 350;
    if (!S.idle) {
      th = 0;
      if (thr < 0.12) S.idle = true;
    }
    if (onGround && trn.td) {
      th = 0;
      pad.brake = true;
      y = cl((psi - Math.max(-0.15, Math.min(0.15, pos.x * 0.01))) * 3);
      p = 0;
      r = 0;
    } else {
      if (!gearOn && kmh < lim - 5) gearOn = true;
      if (gearOn && flapLvl < 2 && kmh < 430 && S.i % 30 === 0) flapLvl++;
      if (agl < 12 && dist < 350 && trn.appr && !onGround) {
        th = kmh < 175 ? 0.3 : 0;
        p = cl((7 - pit) * 0.1 + Math.max(0, -vel.y - 0.8) * 0.15);
        const psT = Math.max(-0.08, Math.min(0.08, pos.x * 0.004)),
          bt = Math.max(-10, Math.min(10, -pos.x * 0.1 + (psi - psT) * 57.3 * 0.8));
        r = cl((bt - bank) * 0.05);
        y = cl((psi - psT) * 3);
      } else {
        if (look) follow(look, 3.5, 40);
        if (flapLvl >= 2) th = Math.max(0, Math.min(1, 0.35 + ((dist > 1500 ? 230 : 210) - kmh) * 0.02));
        else if (gearOn) th = 0;
        if (kmh < 185) {
          p = Math.min(p, -0.1);
          th = 1;
        }
      }
    }
  } else if (m === 'dogfight') {
    th = 1;
    const e = EN.find((x) => !x.dying);
    if (e) {
      const d = e.p.distanceTo(pos),
        lead = e.p.clone().addScaledVector(e.v, Math.min(1.5, d / 800));
      lead.y += 4.9 * Math.pow(Math.min(1.5, d / 800), 2);
      const lo = agl < 550 ? 60 : 0;
      if (kmh < 235 + lo) S.ext = true;
      else if (kmh > 270 + lo) S.ext = false;
      if (S.ext || buffet > 0.05) {
        /* extend: wings level, trade a little height for speed */
        r = cl(-bank * 0.05);
        p = cl(((agl > 700 ? -7 : agl > 450 ? 0 : 2) - pit) * 0.06);
        if (kmh < 215 && agl > 350) p = Math.min(p, -0.25);
      } else {
        hard(lead, 4.5);
        if (agl < 900 && pit < -18) p = Math.max(p, 0.3);
        const ang = Math.acos(Math.max(-1, Math.min(1, fwd.dot(lead.clone().sub(pos).normalize()))));
        if (ang < 0.07 && d < 520) pad.fire = true;
      }
    } else {
      r = cl(-bank * 0.05);
      p = cl((2 - pit) * 0.05);
    }
  } else if (m === 'convoy') {
    S.nzMin = -0.5;
    S.kg = 10;
    S.kb = 3.5;
    S.ng = true; /* the strafing run is flown at the vehicles, not along the guide route */
    spd(330);
    const al = CV.list.filter((v) => !v.dead);
    if (al.length && CV.st === 'run') {
      /* strafing run: turn in on the nearest vehicle from a distance, come down to the deck and fire; break off and extend when the run is spoiled */
      const nv = al.reduce((a, b) => (a.m.position.distanceTo(pos) < b.m.position.distanceTo(pos) ? a : b)),
        nd = nv.m.position.distanceTo(pos),
        to = nv.m.position.clone().sub(pos).normalize(),
        ata = Math.acos(Math.max(-1, Math.min(1, fwd.dot(to)))) * 57.3,
        high = agl > 0.4 * nd + 40;
      if (!S.ext && ((nd < 1500 && (ata > 38 || high)) || nd < 160)) S.ext = true;
      if (S.ext && nd > 2300) S.ext = false;
      if (S.ext) {
        /* extend: straight and low, away from the convoy, to set up the next run */
        const hx = vel.x / (Math.hypot(vel.x, vel.z) || 1),
          hz = vel.z / (Math.hypot(vel.x, vel.z) || 1),
          ax = pos.x + hx * 900,
          az = pos.z + hz * 900;
        follow(new V(ax, H(ax, az) + 160, az), 4.5, 70, true);
      } else {
        const tl = nd < 1400 ? nd / 950 : nd / Math.max(60, vel.length() - 8) /* guns: a short lead; far out: the point where we will meet the convoy */,
          dirv = CVC.getTangentAt(Math.min(0.999, nv.s / CLEN)),
          aim0 = new V(nv.m.position.x + dirv.x * CV.spd * tl, 0, nv.m.position.z + dirv.z * CV.spd * tl),
          want = Math.max(-5, Math.min(300, (nd - 1000) * 0.1 + 8)),
          aim = new V(aim0.x, H(aim0.x, aim0.z) + want, aim0.z);
        if (nd > 1400) follow(aim, 4.5, 70, true);
        else follow(aim, 4.5, 70);
        for (const v of al) {
          const dd = v.m.position.distanceTo(pos),
            aa = Math.acos(Math.max(-1, Math.min(1, fwd.dot(v.m.position.clone().sub(pos).normalize())))) * 57.3;
          if (dd < 700 && aa < 8 && agl > 18) pad.fire = true;
        }
      }
    } else if (CV.st === 'idle' || (CV.st === 'run' && !al.length)) {
      /* the convoy is about to leave: fly along the road towards the depot, coming down */
      const rp = CVC.getPointAt(CVE / CLEN);
      follow(new V(rp.x, H(rp.x, rp.z) + 170, rp.z), 4.5, 70, true);
    } else if (plk) follow(plk, 4.5, 55, true);
    else if (look) follow(look, 4.5, 55);
  } else if (m === 'bomb') {
    spd(400);
    if (plk) follow(plk, 4.5, 55, true);
    else if (look) follow(look, 4.5, 55);
    const left = BLD.filter((b) => !b.dead);
    if (left.length) {
      const tg = guide.tgt && !guide.tgt.dead && Math.hypot(guide.tgt.c.x - pos.x, guide.tgt.c.z - pos.z) > 600 ? guide.tgt : pickBldg(left),
        td = Math.hypot(tg.c.x - pos.x, tg.c.z - pos.z),
        vh = Math.hypot(vel.x, vel.z) || 1,
        hx = vel.x / vh,
        hz = vel.z / vh,
        imp = bombImpact(),
        ex = imp.x - tg.c.x,
        ez = imp.z - tg.c.z,
        along = ex * hx + ez * hz,
        cross = -ex * hz + ez * hx;
      if (Math.abs(cross) <= 30 && along >= -40 && along <= 8 && agl > 150 && td < 2400 && pit < -8 && S.i - (S.lastB || -999) > 40) {
        dropBomb();
        S.lastB = S.i;
      }
      if (agl < 260 && vel.y < 0) p = Math.max(p, 0.9);
    }
  }
  if (m === 'dogfight' || m === 'convoy' || m === 'bomb') {
    /* ground recovery: wings level, pull as hard as the wing allows, full power; looks ahead at the terrain too */
    const sink = Math.max(0, -vel.y),
      cl5 = pos.y - 2 + vel.y * 5 - H(pos.x + vel.x * 5, pos.z + vel.z * 5),
      cl10 = pos.y - 2 + vel.y * 10 - H(pos.x + vel.x * 10, pos.z + vel.z * 10),
      cvy = m === 'convoy',
      clr = cvy ? Math.min(agl, cl5 + 60) : Math.min(agl, cl5 + 40, cl10 + 80),
      dog = m === 'dogfight';
    if (clr < (dog ? 300 : cvy ? 22 : 90) + (sink * sink) / (cvy ? 50 : 30)) {
      r = cl(-bank * 0.06);
      const gl = Math.min(5, Math.max(1.6, (kmh - 190) / 45));
      p = Math.abs(bank) < 70 ? (buffet > 0.02 ? 0 : gF < gl ? 1 : 0.25) : 0.1;
      if (kmh < 200 && agl > 60) p = Math.min(p, 0.1);
      th = 1;
      pad.fire = false;
    }
  }
  pad.p = p;
  pad.r = r;
  pad.y = y;
  thr = th;
}
const RPM_CAP = { takeoff: 90, landing: 300, dogfight: 420, convoy: 330, bomb: 420, barrel: 120, immelmann: 120, splits: 120, wingover: 120, lowyoyo: 120, highyoyo: 120 };
function rpMissionStart() {
  const m = trn.mode,
    mc = { m, bn: m === 'bomb' ? BLD.filter((b) => b.dead).length : 0, cn: m === 'convoy' ? Math.min(2, CV.list.filter((v) => v.dead && !v.gone).length) : 0, srcRec: trn.rec, rec: trn.rec.slice(), sum: trn.sum || (m === 'bomb' ? BLD.filter((b) => b.dead).length + ' of ' + BLD.length + ' buildings destroyed.' : ''), T: trn.rec[trn.rec.length - 1].t, ideal: null, ok: false, simSum: '', simT: 0 };
  if (m === 'convoy' && !mc.sum) mc.sum = trn.sum || '';
  RPL.mc = mc;
  if (PRE_MODES[m] && PP.out && PP.key === ppKey()) {
    /* the pilot already flew this mission before it began: its recording is what the green ring followed */
    Object.assign(mc, { ok: PP.ok, ideal: PP.out, simSum: PP.simSum, simT: PP.simT, why: PP.why });
    rpStart();
    return;
  }
  RPL.busy = true;
  RPL.on = true;
  RPL.keep = true;
  RPL.snd = SND.on;
  SND.on = false;
  coachHide();
  reset();
  started = true;
  RPL.keep = false;
  RPL.sim = { m, i: 0, out: [], t0: performance.now() };
  $$('rplW').style.display = 'flex';
  $$('rplWt').textContent = 'The sim pilot is flying this mission to find the best path...';
  requestAnimationFrame(rpSimChunk);
}
function rpSimChunk() {
  const S = RPL.sim;
  if (!S) return;
  const t0 = performance.now(),
    dt = 1 / 60,
    cap = RPM_CAP[S.m];
  let fin = false;
  while (performance.now() - t0 < (RPL.mc && RPL.mc.pre ? 30 : 14) && !fin) {
    rpMBot(S.m, S);
    step(dt);
    plane.position.copy(pos);
    plane.quaternion.copy(q);
    if (pad.fire || S.m === 'bomb') plane.updateMatrixWorld(true);
    updWeapons(dt);
    updEnemies(dt);
    updChutists(dt);
    updService(dt);
    updConvoy(dt);
    updTrainer(dt);
    updGuide(dt);
    if (guide.pts.length > 1) {
      try {
        guideState(dt);
      } catch (er) {}
    }
    FM.eT = 0;
    S.i++;
    if (S.i % 6 === 0) {
      const e = EN.find((x) => !x.dying);
      S.out.push({ p: pos.clone(), f: fwd.clone(), u: up.clone(), t: S.i * dt, v: vel.length(), k: (FM.ias || vel.length()) * 3.6, g: gF, d: e ? e.p.clone() : null });
    }
    if (S.m === 'bomb' && RPL.mc.bn > 0 && BLD.filter((b) => b.dead).length >= RPL.mc.bn) trn.rpReady = true;
    if (S.m === 'convoy') {
      /* enough vehicles hit: let the pilot fly clear for a few seconds, then stop */
      const kills = CV.list.filter((v) => v.dead && !v.gone).length;
      if (kills >= Math.max(1, RPL.mc.cn || 0) && !S.kt) S.kt = S.i;
      if (S.kt && S.i - S.kt > 300) trn.rpReady = true;
    }
    fin = trn.done || crashed || trn.rpReady || S.i * dt > cap;
  }
  $$('rplWt').textContent = 'The sim pilot is flying this mission to find the best path... ' + Math.round((100 * S.i * dt) / cap) + '%';
  if (fin) rpSimEnd();
  else requestAnimationFrame(rpSimChunk);
}
function rpSimCancel() {
  if (!RPL.busy) return;
  RPL.sim = null;
  SND.on = RPL.snd;
  RPL.mc = null;
  RPL.keep = true;
  reset();
  started = true;
  RPL.keep = false;
  RPL.busy = false;
  RPL.on = false;
  $$('rplW').style.display = 'none';
}
function rpSimEnd() {
  const S = RPL.sim,
    mc = RPL.mc;
  RPL.sim = null;
  mc.ok = (trn.done || trn.rpReady) && !crashed;
  mc.simSum = trn.sum || (S.m === 'bomb' ? BLD.filter((b) => b.dead).length + ' of ' + BLD.length + ' buildings destroyed in ' + fmtT(S.i / 60) + '.' : '');
  if (S.m === 'convoy' && mc.ok && !mc.simSum) mc.simSum = 'Vehicles destroyed: ' + (CV.destroyed + CV.list.filter((v) => v.dead && !v.gone).length) + ' in ' + fmtT(S.i / 60) + '.';
  if (!mc.ok && !crashed && S.out.length > 5) {
    /* did not finish in the time allowed: still show how far the sim pilot got, labelled as such */
    const tl = ' (the sim pilot ran out of time).',
      bd = BLD.filter((b) => b.dead).length,
      cd = CV.destroyed + CV.list.filter((v) => v.dead && !v.gone).length;
    if (S.m === 'dogfight' && airKills >= 1) (mc.ok = true), (mc.simSum = airKills + ' of 3 bandits shot down in ' + fmtT(S.i / 60) + tl);
    else if (S.m === 'bomb' && bd >= 1) (mc.ok = true), (mc.simSum = bd + ' of ' + BLD.length + ' buildings destroyed in ' + fmtT(S.i / 60) + tl);
    else if (S.m === 'convoy' && cd >= 1) (mc.ok = true), (mc.simSum = 'Vehicles destroyed: ' + cd + tl);
  }
  mc.simT = S.i / 60;
  mc.ideal = mc.ok && S.out.length > 5 ? S.out : null;
  if (mc.ideal) {
    mc.ideal.forEach((o, i) => (o.t = Math.max(0, o.t)));
  }
  mc.why = crashed ? 'the sim pilot crashed' : mc.ok ? '' : 'the sim pilot ran out of time';
  SND.on = RPL.snd;
  const pre = !!mc.pre,
    pk = ppKey(),
    /* a recording only counts if the pilot really did the job: a convoy run that let every vehicle escape is not a line to teach */
    good = !!mc.ideal && mc.ok && (S.m === 'convoy' ? !!S.kt : S.m === 'bomb' ? BLD.filter((b) => b.dead).length >= 1 : true);
  RPL.keep = true;
  reset();
  started = true;
  RPL.keep = false;
  RPL.busy = false;
  RPL.on = false;
  $$('rplW').style.display = 'none';
  if (pre && !good && (PP.tries || 0) < 1) {
    PP.tries = (PP.tries || 0) + 1; /* try again: wind and gusts differ a little from run to run */
    RPL.mc = null;
    rpPrefly(true);
    return;
  }
  if (pre) {
    /* kept for the whole mission: the green ring and the replay both use it */
    RPL.mc = null;
    if (!good) note('THE PILOT COULD NOT RECORD A LINE FOR THIS MISSION: NO GREEN RING');
    Object.assign(PP, { key: good ? pk : '', out: good ? mc.ideal : null, ok: mc.ok, ix: 0, simSum: mc.simSum, simT: mc.simT, why: mc.why });
    PP.pts = null;
    if (good) {
      let sAcc = 0;
      PP.pts = mc.ideal.map((o, i) => {
        if (i) sAcc += o.p.distanceTo(mc.ideal[i - 1].p);
        return { x: o.p.x, y: o.p.y - 2, z: o.p.z, s: sAcc };
      });
    }
    return;
  }
  rpStart();
}

