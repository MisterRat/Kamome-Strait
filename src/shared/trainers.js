/* trainers */
const trn = {
  mode: 'free',
  t: 0,
  done: false,
  sum: '',
  title: '',
  step: 0,
  idleOK: false,
  appr: false,
  lifted: false,
  liftV: 0,
  liftD: 0,
  air: false,
  td: null,
  pvy: 0,
  pk: 0,
  spawn: 2,
  res: 0,
};
const TRN_NAMES = {
  free: 'FREE FLIGHT',
  takeoff: 'TAKEOFF TRAINER',
  landing: 'LANDING TRAINER',
  dogfight: 'DOGFIGHT TRAINER',
  convoy: 'CONVOY STRAFING',
  bomb: 'BUILDING BOMBING',
  barrel: 'BARREL ROLL TRAINER',
  immelmann: 'IMMELMANN TRAINER',
  splits: 'SPLIT S TRAINER',
  wingover: 'WINGOVER TRAINER',
  lowyoyo: 'LOW YO-YO TRAINER',
  highyoyo: 'HIGH YO-YO TRAINER',
  adf: 'ADF NAVIGATION TRAINER',
};
function placeAt(x, y, z, tx, tz, spd) {
  const dx = tx - x,
    dz = tz - z,
    l = Math.hypot(dx, dz),
    fx = dx / l,
    fz = dz / l;
  q.setFromAxisAngle(UPV, Math.atan2(-fx, -fz));
  pos.set(x, Math.max(y, H(x, z) + 120), z);
  vel.set(fx * spd, 0, fz * spd);
  {
    const o = { sig: 1, a: 340.3, ps: 1 };
    if (FM.use('alt')) atmos(pos.y, o);
    autoTrim(spd * Math.sqrt(o.sig)); /* trimmed for the indicated speed */
  }
  thr = 0.7;
  gearOn = false;
  flapLvl = 0;
  fl = 0;
  onGround = false;
  cp.copy(pos).add(new V(0, 4, 14));
}
function trainerReset() {
  if (RPL.busy && !RPL.keep) rpSimCancel(); /* a mission change while the pilot is still flying its hidden recording */
  if (RPL.on && !RPL.keep) rpStop();
  convoyClear();
  guide.cvRe = false;
  CV.st = 'idle';
  CV.tm = 8;
  Object.assign(trn, {
    t: 0,
    done: false,
    sum: '',
    title: '',
    step: 0,
    idleOK: false,
    appr: false,
    lifted: false,
    air: false,
    td: null,
    spawn: 2,
    res: 0,
    rpAuto: 0,
    rpShown: false,
    rpReady: false,
    rec: null,
    recEnd: false,
  });
  trn.a = null;
  guide.plan = null;
  guide.rs = null; /* the ring starts afresh with each mission */
  guide.pts = [];
  guide.marks = [];
  guide.hdg = null;
  guide.tgt = null;
  guide.t = 0;
  guide.info = '';
  const free = trn.mode === 'free';
  T.forEach((t) => {
    if (t.kind === 'st') {
      t.m.visible = free;
      if (!free) t.dead = true;
    }
  });
  const m = trn.mode;
  if (m === 'landing') {
    placeAt(1600, 330, -200, 1600, 4000, 83);
    thr = 0.5;
  } else if (m === 'dogfight') placeAt(0, 900, 300, 0, -5000, 130);
  else if (m === 'convoy') {
    const tg = CVC.getTangentAt(CVE / CLEN),
      pe = CVC.getPointAt(CVE / CLEN);
    placeAt(pe.x - tg.x * 4500, 350, pe.z - tg.z * 4500, pe.x, pe.z, 110);
    CV.pre = Math.max(0, (CVE + 150) / CV.spd - 46); /* far enough back to line up on the convoy without breaking off */
    CV.tm = 1;
  } else if (m === 'bomb') placeAt(BASE[0] - 2200, 700, BASE[1] + 1800, BASE[0], BASE[1], 120);
  else if (m === 'adf') placeAt(0, 2500, 200, 10000, 200, 125); /* high over the home field, pointed the wrong way (east) */
  else if (AERO[m]) aeroStart(m);
  coachHide();
}
const coachEl = $$('coach'),
  coachT = $$('coachT'),
  coachS = $$('coachS'),
  coachH = $$('coachH');
let coachMin = false;
function coach(title, text, hint, lvl) {
  coachEl.style.display = 'block';
  coachT.textContent = title;
  const gi = guide.on && guide.info && guide.pts.length > 1 ? guide.info : '';
  coachS.textContent = coachMin ? gi : text + (gi ? '\n' + gi : '');
  coachH.textContent = hint || '';
  coachH.className = lvl || '';
  coachH.style.display = hint ? 'block' : 'none';
}
function coachHide() {
  coachEl.style.display = 'none';
}
const fmtT = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function resupply(dt) {
  FM.fuel = 1; /* the trainers keep the tanks full */
  if (ammoTot() < 350) {
    ammo = AMMO0.slice();
    note('AMMO RESUPPLIED');
  }
  if (trn.mode === 'bomb' && (bmN >= 2 || rkN >= 6)) {
    trn.res += dt;
    if (trn.res > 8) {
      trn.res = 0;
      bmN = 0;
      rkN = 0;
      rkMesh.forEach((m) => (m.visible = true));
      bmMesh.forEach((m) => (m.visible = true));
      note('ORDNANCE RESUPPLIED');
    }
  }
}
function updTrainer(dt) {
  const m = trn.mode;
  trn.t += dt;
  if (m === 'free') {
    coachHide();
    return;
  }
  const name = TRN_NAMES[m],
    kmh = (FM.ias || vel.length()) * 3.6,
    agl = pos.y - 2 - H(pos.x, pos.z),
    gnd = onGround || agl < 0.6,
    footer = 'Enter = try again   M = mission menu',
    pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y))) * 57.3,
    R = Math.round,
    flapDeg = ANG[flapLvl];
  if (!AERO[m] && m !== 'adf' && !crashed && !trn.done && !trn.recEnd) rpRecGen(dt, false);
  if (crashed) {
    if (!AERO[m] && trn.rec && !trn.recEnd) {
      trn.recEnd = true;
      rpRecGen(0, true);
    }
    coach(name, 'You crashed.', footer + (rpAvail() ? '   \\ = replay' : ''), 'bad');
    return;
  }
  if (trn.done) {
    if (!AERO[m] && trn.rec && !trn.recEnd) {
      trn.recEnd = true;
      rpRecGen(0, true);
    }
    const ae = rpAvail();
    if (ae) {
      trn.rpAuto = (trn.rpAuto || 0) + dt;
      if (trn.rpAuto > 2.5 && !trn.rpShown) {
        trn.rpShown = true;
        rpStart();
      }
    }
    coach(name + ' - COMPLETE', trn.sum, footer + (ae ? '   \\ = replay' : ''), 'ok');
    return;
  }
  const T0 = (t, h, l) => coach(name + '  -  ' + trn.title, t, h, l);
  const mission = TRAINERS[m];
  if (mission) mission({ dt, name, kmh, agl, gnd, footer, pitch, R, flapDeg, T0 });
}
