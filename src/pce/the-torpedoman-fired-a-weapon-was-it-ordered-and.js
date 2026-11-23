/* the torpedoman fired a weapon: was it ordered, and on time? */
function aswFired(tp) {
  /* in action (the AI OOD's attack on a live submarine): the order carried out, and the attack's assessment (ordAtk) begun */
  if (ASW.live && ASW.ph !== 'run') {
    const o = ASW.O.find((o) => o.k === tp && o.st === 'open');
    if (o) o.st = ASW.t - o.t0 > (FM.use('orders') ? 4 : 6) ? 'late' : 'ok';
    const A = !DRILL.on && ordAtk();
    if (A) {
      A.last = SHIP.t;
      if (tp === 'hh') A.hh = aswRelTo(A.s.p);
      else if (!A.pat) A.pat = { rel: aswRelTo(A.s.p), best: aswBest(ASW.depth) };
    }
    return;
  }
  if (ASW.ph !== 'run') return;
  if ((tp === 'rack' || tp === 'port' || tp === 'stbd') && DC.dep[tp] !== ASW.depth) ASW.bad = true;
  const o = ASW.O.find((o) => o.k === tp && o.st === 'open');
  if (!o) return ASW.un++;
  const late = ASW.t - o.t0 > (FM.use('orders') ? 4 : 6);
  o.st = late ? 'late' : 'ok';
  if (late) note('LATE - ' + o.txt);
}
function aswStep(dt, here) {
  const sub = PT.on ? PT.L.find((t) => t.kind === 'sub') : null,
    cm = ASW.who === 'comms',
    stn = cm ? 3 : 5,
    want = (cm ? SHIP.stn === 3 && COMMS.les && COMMS.les.atk : SHIP.stn === 5) && started && !RPL.on && !!sub;
  ASW.t += dt;
  /* after a run the score stays up until the player presses T again (a new run) or leaves the station */
  if (ASW.ph === 'done') {
    if (SHIP.stn !== stn) (ASW.ph = 'idle'), (ASW.deb = '');
    else if (sub && !cm) (ASW.ph = 'idle'), (ASW.deb = '');
    else return;
  }
  if (!want) {
    if (ASW.ph !== 'idle') {
      if (SHIP.stn !== stn) note('ATTACK BROKEN OFF');
      SHIP.hold = SHIP.hdg;
    }
    ASW.ph = 'idle';
    return;
  }
  const V = THREE.Vector3,
    fw = new V(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)),
    rt = new V(Math.cos(SHIP.hdg), 0, -Math.sin(SHIP.hdg)),
    /* the OOD attacks what sonar tells him: the last fix carried on (COMMS.est), not where the sub really is */
    Est = subEst(),
    S = Est ? Est.p : pos.clone().addScaledVector(fw, 2000),
    Sv = Est ? Est.v : new V(),
    stern = pos.clone().addScaledVector(fw, tpXF(90)),
    hh = pos.clone().addScaledVector(fw, tpXF(21.6)),
    rng = Math.hypot(S.x - pos.x, S.z - pos.z),
    alS = (S.x - stern.x) * fw.x + (S.z - stern.z) * fw.z,
    alH = (S.x - hh.x) * fw.x + (S.z - hh.z) * fw.z,
    crH = (S.x - hh.x) * rt.x + (S.z - hh.z) * rt.z,
    u = Math.max(1, SHIP.u),
    tos = alS / u /* seconds until the stern is over the sub */,
    hdgTo = (x, z) => Math.atan2(-(x - pos.x), -(z - pos.z));
  if (ASW.ph === 'idle') {
    ASW.ph = 'open';
    ASW.t = 0;
    ASW.O = [];
    ASW.heldT = 0;
    aswSay(cm ? 'SONAR, BRIDGE. FIND THE EXERCISE SUB AND REPORT HIM. I WILL ATTACK ON YOUR REPORTS.' : 'TORPEDOMAN, BRIDGE. SONAR HAS THE EXERCISE SUB. WE WILL RUN IN ON HIM. MAN YOUR STATIONS.');
  }
  if (ASW.ph === 'open') {
    /* steady for a few seconds while the exercise sub repositions (the drill is arranged: he goes deep about 750 m ahead and
       starts his run), then the attack begins */
    ASW.tel = 0.85;
    if (ASW.t < 0.1) ASW.hold = SHIP.hdg;
    if (cm ? Est && Est.src === 'you' && Est.age < 10 && rng < 1700 : ASW.t > (ASW.run ? 15 : 5)) {
      if (!cm) aswPlace(sub, 340 + 20 * SHIP.u); /* close enough that the first order comes within about half a minute */
      ASW.ph = 'run';
      ASW.run++;
      ASW.t = 0;
      ASW.O = [];
      ASW.f = {};
      ASW.best = 1e9;
      ASW.hh = 0;
      ASW.un = 0;
      ASW.bad = false;
      ASW.deb = '';
      sub.o.d = [30.5, 45.7, 61][Math.floor(Math.random() * 3)];
      ASW.depth = Math.round(sub.o.d / 0.3048 / 25) * 25;
      ASW.ev = [];
      DC.arm = { rack: false, port: false, stbd: false };
      if (!cm) COMMS.est = { p: sub.p.clone(), v: sub.v.clone(), t: SHIP.t, src: 'ai' };
      aswSay('ATTACK ' + ASW.run + '. CONTACT ' + Math.round(sub.p.distanceTo(pos) / 0.9144 / 50) * 50 + ' YARDS. SET DEPTH ' + ASW.depth + '.');
    }
  } else if (ASW.ph === 'run') {
    const f = ASW.f;
    ASW.tel = tos > 45 ? 0.9 : 0.62; /* run in fast, slow to the attack speed for the last of it */
    /* conn: steer for where the sub will be, then steady for the run over him */
    if (tos > 14 || !f.on) {
      /* until the Hedgehog has fired, lead him for where its pattern lands (about 245 m ahead, 6 s after firing); then for the run over him */
      const tgo = f.hh ? rng / u : Math.max(0, rng - 245) / u + 6;
      ASW.hold = hdgTo(S.x + Sv.x * tgo, S.z + Sv.z * tgo);
    }
    if (!f.on && Math.abs(angW(ASW.hold - SHIP.hdg)) < 0.3 && alS > 300) f.on = true;
    if (f.on) {
      if (!f.sbh && alH < 460) (f.sbh = 1), aswSay('STAND BY HEDGEHOG.', 'hh');
      if (!f.hh && alH < 245 + u * 2 && alH > 120) {
        f.hh = 1;
        ASW.crH = crH;
        if (Math.abs(crH) < 50) aswSay('FIRE HEDGEHOG!', 'hh', true);
        else aswSay('CHECK FIRE HEDGEHOG - HE IS OFF THE BOW. CHARGES ONLY.', 'rack');
      }
      if (!f.sbc && tos < 25) {
        f.sbc = 1;
        aswSay('STAND BY CHARGES. SAFETY FORKS OUT.', 'rack');
        /* game mode: the crews pull the safety forks on "stand by"; Hardcore: the torpedoman arms each position himself (X) */
        if (!FM.use('orders')) DC.arm = { rack: true, port: true, stbd: true };
      }
      if (!f.r1 && tos < 9) (f.r1 = 1), aswSay('FIRE ONE!', 'rack', true);
      if (!f.ks && tos < 5) (f.ks = 1), aswSay('FIRE STARBOARD K-GUNS!', 'stbd', true);
      if (!f.kp && tos < 1) (f.kp = 1), aswSay('FIRE PORT K-GUNS!', 'port', true);
      if (!f.r2 && tos < -6) (f.r2 = 1), aswSay('FIRE TWO!', 'rack', true);
    }
    /* the sonar operator's reports: the OOD calls for them, and without them he loses the attack (unless he is on his final run) */
    if (Est && Est.age < 20) ASW.heldT += dt;
    ASW.held = ASW.heldT / Math.max(1, ASW.t);
    const age = Est ? Est.age : 1e9;
    if (cm && age > 20 && !f.ask && !(f.on && tos < 20)) (f.ask = 1), aswSay('SONAR, BRIDGE - REPORT THE CONTACT!');
    if (age < 15) f.ask = 0;
    if (age > 45 && !(f.on && tos < 20)) {
      ASW.lost = true;
      aswSay('LOST CONTACT. ATTACK BROKEN OFF.');
      return aswDebrief();
    }
    /* the sonar test: the torpedomen are AI, and carry out each order two or three seconds after it is given */
    if (cm)
      for (const o of ASW.O)
        if (o.st === 'open' && ASW.t - o.t0 > 2.5) {
          if (o.k === 'hh') {
            HH.n = 24;
            if (hhFire()) aswFired('hh');
          } else {
            DC.dep[o.k] = ASW.depth;
            DC.arm[o.k] = true;
            if (dcFire(o.k)) aswFired(o.k);
          }
        }
    /* an order not carried out within the window plus six seconds is missed */
    for (const o of ASW.O) if (o.st === 'open' && ASW.t - o.t0 > (FM.use('orders') ? 4 : 6) + 6) (o.st = 'miss'), note('MISSED - ' + o.txt);
    if ((f.r2 && tos < -16 && !DC.L.length && !HH.L.length && !HH.q.length && !ASW.O.some((o) => o.st === 'open')) || ASW.t > 360) aswDebrief();
  }
}
