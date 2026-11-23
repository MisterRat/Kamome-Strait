/* =====================================================================================================================
   THE OOD'S ORDERS IN ACTION (the user's, 2026-11-21: finish the OOD's station). Comms reports to the bridge (the radar's air
   contacts, sonar's submarine, the power and the fuel); the OOD decides and gives his orders. At station 1, G opens his orders
   (Q / E choose, Space gives it; G again closes them):
     HOLD FIRE / GUNS FREE    the gun crews (the AI at the mounts the player is not on) cease fire or open it again
     TARGET PRIORITY          the kind of target the crews take first: aircraft, escorts, torpedo boats, shore guns, AA guns, cargo ships
     REQUEST AIR SUPPORT      Comms calls Kamome Control (one call at a time: AIRSUP)
     MAKE SMOKE / SECURE      the engine room lights off the smoke generator (THE ENGINE ROOM ON PATROL) or shuts it down
     ATTACK: HEDGEHOG         the torpedomen fire it (the bombs land about 250 yd ahead: him dead on the bow, 200 to 300 yd)
     ATTACK: THE PATTERN      the racks and the K-guns, over 14 s, set to the depth ordered (as her stern comes over him)
     DEPTH SETTING            the charges' depth, 50 to 300 ft (Normal: set to sonar's estimate when he is found)
   The orders stand when he leaves the station. With the player elsewhere the AI OOD has the deck: he calls for air support when
   the radar finds enemy aircraft (CAP), lays smoke when she comes under shellfire and secures it when it stops, and attacks a
   Japanese submarine sonar holds: he cons her down sonar's bearing at attack speed and fires on the same timing as the drill.
   ===================================================================================================================== */
var OODO = { menu: false, sel: 0, hold: false, pri: 'air', dep: 150, pat: null, depSet: false, sub: false, ai: { cool: 0, smoke: false }, atk: null };
const ORD_DEP = [50, 100, 150, 200, 250, 300];
/* the target priority (the user's, 2026-11-22): the kind of target the gun crews take first, the nearest of it in reach; if none,
   their usual order (aircraft, then escorts, torpedo boats, shore guns, AA guns). Cargo ships (unarmed) only when put first */
const ORD_PRI = [
  ['air', 'AIRCRAFT'],
  ['escort', 'ESCORTS'],
  ['t14', 'TORPEDO BOATS'],
  ['coast', 'SHORE GUNS'],
  ['aa', 'AA GUNS'],
  ['cargo', 'CARGO SHIPS'],
];
const ordPriName = () => (ORD_PRI.find((p) => p[0] === OODO.pri) || ORD_PRI[0])[1];
function ordReset() {
  Object.assign(OODO, { menu: false, sel: 0, hold: false, pri: 'air', dep: 150, pat: null, depSet: false, sub: false, ai: { cool: 0, smoke: false, run: false, f: {} }, atk: null });
}
/* the player is the OOD: at station 1 in the pilothouse */
const ordPlayer = () => camMode == 1 && SHIP.stn === 1;
/* sonar's contact, if he holds one now (the operator's estimate, under half a minute old) */
const ordContact = () => {
  const E = subEst();
  return E && E.age < 30 ? E : null;
};
/* a Japanese submarine near sonar's contact (the AI OOD attacks only the enemy, not the exercise boat) */
const ordEnemySub = (E) => SUBS.L.find((s) => s.side === 'jp' && s.on && !s.sunk && Math.hypot(s.p.x - E.p.x, s.p.z - E.p.z) < 400);
const ordAirUp = () => AIRSUP.busy('PCE 842');
/* the orders, as they read now */
function ordList() {
  const C = ordContact();
  return [
    { id: 'guns', t: OODO.hold ? 'GUNS FREE' : 'HOLD FIRE' },
    { id: 'pri', t: 'TARGET PRIORITY: ' + ordPriName() },
    { id: 'air', t: 'REQUEST AIR SUPPORT', off: ordAirUp() && 'A FLIGHT IS ANSWERING', hot: CAP.S.raid && !ordAirUp() },
    { id: 'smoke', t: SMK.on ? 'SECURE SMOKE' : 'MAKE SMOKE', off: !SMK.on && SMK.oil <= 0 && 'NO FOG OIL' },
    { id: 'hh', t: 'ATTACK: FIRE HEDGEHOG', off: !C ? 'NO SONAR CONTACT' : HH.n <= 0 ? 'THE HEDGEHOG IS EMPTY' : HH.L.length || HH.q.length ? 'ITS BOMBS ARE IN THE AIR' : '', hot: !!C },
    { id: 'pat', t: 'ATTACK: FIRE THE PATTERN', off: !C ? 'NO SONAR CONTACT' : OODO.pat ? 'THE PATTERN IS ROLLING' : '', hot: !!C },
    { id: 'dep', t: 'DEPTH SETTING ' + OODO.dep + ' FT' },
  ];
}
function ordGive(id, by) {
  const B = (t) => RADIO.add('BRIDGE', t, { own: true });
  /* in a drill, the drill may take the order as its own (the attack drill: its Hedgehog and its pattern, assessed by it) */
  if (DRILL.on && DRILL.on.order && DRILL.on.order(DRILL.D, id)) return;
  if (id === 'guns') {
    OODO.hold = !OODO.hold;
    B(OODO.hold ? 'ALL GUNS, BRIDGE. CEASE FIRE, CEASE FIRE. HOLD YOUR FIRE.' : 'ALL GUNS, BRIDGE. GUNS FREE. ENGAGE THE ENEMY.');
    note(OODO.hold ? 'OOD: HOLD FIRE' : 'OOD: GUNS FREE');
  } else if (id === 'pri') {
    const i = ORD_PRI.findIndex((p) => p[0] === OODO.pri);
    OODO.pri = ORD_PRI[(i + 1) % ORD_PRI.length][0];
    B('ALL GUNS, BRIDGE. TARGET PRIORITY: ' + ordPriName() + '.');
    note('TARGET PRIORITY: ' + ordPriName());
  } else if (id === 'air') {
    if (ordAirUp()) return note('AIR SUPPORT IS ALREADY ANSWERING YOUR LAST CALL');
    B('COMMS, BRIDGE: REQUEST AIR SUPPORT FROM KAMOME CONTROL.');
    if (!CAP.call('PCE 842')) note('KAMOME CONTROL HAS NO FIGHTERS FOR YOU NOW');
  } else if (id === 'smoke') smkOrder(!SMK.on, by);
  else if (id === 'hh') {
    if (!ordContact()) return note('NO SONAR CONTACT TO ATTACK');
    if (hhFire()) {
      B('FIRE HEDGEHOG!');
      const A = by === 'you' && !DRILL.on && ordAtk();
      if (A) ((A.hh = aswRelTo(A.s.p)), (A.last = SHIP.t));
    }
  } else if (id === 'pat') {
    if (!ordContact()) return note('NO SONAR CONTACT TO ATTACK');
    if (OODO.pat) return;
    aswArm(OODO.dep);
    OODO.pat = { t0: SHIP.t };
    B('FIRE THE PATTERN! SET ' + OODO.dep + ' FEET.');
    const A = by === 'you' && !DRILL.on && ordAtk();
    if (A) ((A.pat = { rel: aswRelTo(A.s.p), best: aswBest(OODO.dep) }), (A.last = SHIP.t));
  } else if (id === 'dep') {
    OODO.dep = ORD_DEP[(ORD_DEP.indexOf(OODO.dep) + 1) % ORD_DEP.length];
    OODO.depSet = true;
    note('DEPTH SETTING ' + OODO.dep + ' FT');
  }
}
/* the OOD's keys (station 1, no drill): true when used */
function ordKey(code, rep) {
  if (code === 'KeyG') {
    if (rep) return true;
    OODO.menu = !OODO.menu;
    if (OODO.menu) DRILL.deb = null;
    note(OODO.menu ? "OOD'S ORDERS - Q / E CHOOSE, SPACE GIVES IT" : 'ORDERS CLOSED');
    return true;
  }
  if (!OODO.menu) return false;
  const L = ordList();
  if (code === 'KeyQ' || code === 'KeyE') return rep || ((OODO.sel = (OODO.sel + (code === 'KeyE' ? 1 : -1) + L.length) % L.length), true);
  if (code === 'Space') {
    if (rep) return true;
    const o = L[OODO.sel];
    if (o.off) note(o.off);
    else ordGive(o.id, 'you');
    return true;
  }
  return false;
}
/* what Comms has reported to the bridge, as the OOD's box shows it */
function ordReports() {
  const R = [],
    C = ordContact();
  if (CAP.S.raid) R.push('<b style="color:#ff8a6a">RADAR: ENEMY AIRCRAFT</b>' + (ordAirUp() ? ' &middot; AIR SUPPORT ANSWERING' : ''));
  if (C) R.push('<b style="color:#ff8a6a">SONAR: SUBMARINE</b> BEARING ' + raidBrg(C.p) + ', ' + Math.round(C.p.distanceTo(pos) / 0.9144 / 25) * 25 + ' YD');
  if (!ENG.pwr) R.push('<b style="color:#ff8a6a">NO POWER: RADAR AND SONAR DEAD</b>');
  if (ENG.leak > 0) R.push('<b style="color:#ff8a6a">LOSING FUEL</b>');
  if (ENG.heat > 1.1) R.push('<b style="color:#ff8a6a">ENGINES OVERHEATED</b>');
  R.push('GUNS <b>' + (OODO.hold ? 'HOLDING FIRE' : 'FREE') + '</b> &middot; FIRST <b>' + ordPriName() + '</b> &middot; SMOKE <b>' + (SMK.on ? 'ON' : 'OFF') + '</b> &middot; FUEL <b>' + Math.round(ENG.fuel * 100) + '%</b>');
  return R;
}
DRILLP.push({
  stn: 1,
  inDrill: true,
  show: () => OODO.menu,
  html() {
    let h = "<b style=\"color:#9fc3d6\">THE OOD'S ORDERS</b><br>" + ordReports().join('<br>');
    ordList().forEach((o, i) => {
      const col = o.off ? '#6a7a84' : o.hot ? '#ff8a6a' : '#dfe6e8',
        t = '<span style="color:' + col + '">' + o.t + (o.off ? ' (' + o.off + ')' : '') + '</span>';
      h += '<div class="dbI" data-i="' + i + '">' + (i === OODO.sel ? '<b style="color:#ffd27a">&#9656; </b><b>' + t + '</b>' : '&nbsp;&nbsp;' + t) + '</div>';
    });
    return h + '<span style="color:#9aa"><b>Q / E</b> choose &middot; <b>Space</b> give the order (or click it) &middot; <b>G</b> close</span>';
  },
  /* a click on an order: choose it and give it */
  click(i) {
    const o = ordList()[i];
    if (!o) return;
    OODO.sel = i;
    if (o.off) note(o.off);
    else ordGive(o.id, 'you');
  },
  /* the plot while sonar holds a submarine (Hardcore: his bearing and range from the reports only) */
  pic: () => !!ordContact() && !drillHC(),
  draw: (g, w, h) => aswHeadUp(g, w, h, ordContact().p),
});
/* ---- THE ATTACK'S ASSESSMENT (the user's, 2026-11-22: an attack ordered from the pilothouse in action gets its report, as the drill's
   does). It starts with the player's first weapon on a contact; it ends when everything fired has gone off and nothing more has been
   fired for 90 s or he is well astern: then the report, marked as the drill's (aswAssess), with either weapon alone enough ---- */
function ordAtk() {
  if (OODO.atk) return OODO.atk;
  const C = ordContact(),
    s = C && (ordEnemySub(C) || (PT.on && PT.L.find((t) => t.kind === 'sub')));
  if (!s) return null;
  return (OODO.atk = { s, jp: s.side === 'jp', hh: null, pat: null, yd: 1e9, hits: 0, last: SHIP.t, hc: drillHC() });
}
/* a charge has gone off at p: how near him */
function ordAtkBurst(p) {
  const A = OODO.atk;
  if (!A) return;
  const yd = Math.round((A.jp ? Math.max(0, SUBS.capsule(A.s, p)) : A.s.p.distanceTo(p)) / 0.9144);
  A.yd = Math.min(A.yd, yd);
}
function ordAtkStep() {
  const A = OODO.atk;
  if (!A || OODO.pat || HH.q.length || HH.L.length || DC.L.length) return;
  /* the run is over: he is well astern of her (400 yd), or nothing more has been fired for a minute and a half */
  if (SHIP.t - A.last < 90 && aswRelTo(A.s.p).al > -400) return;
  OODO.atk = null;
  const R = aswAssess({ yd: A.yd, hits: A.hits, sunk: A.jp && A.s.sunk, hh: A.hh, pat: A.pat, one: true });
  RADIO.add('SONAR', R.v === 'KILL' ? (A.jp ? 'BRIDGE, SONAR. BREAKING-UP NOISES. HE IS GOING DOWN.' : 'EXERCISE SUB REPORTS: YOU GOT ME.') : R.v === 'DAMAGED' ? 'BRIDGE, SONAR. CLOSE. HE MAY BE DAMAGED.' : 'BRIDGE, SONAR. NO EFFECT ON THE TARGET.', { own: true });
  OODO.menu = false; /* the report in the box */
  drillReport(A.jp ? 'Attack on I-58' : 'Attack on the exercise sub', R.s, R.lines, A.hc, 1, ': ', true);
}
/* each frame: the pattern rolling, the reports to a player OOD, the AI OOD */
function ordStep(dt) {
  if (!SIMS.on('pce') || !started || paused || crashed || RPL.on) return;
  if (OODO.menu && !ordPlayer()) OODO.menu = false;
  if (OODO.pat && aswPatStep(OODO.pat, SHIP.t)) OODO.pat = null;
  ordAtkStep();
  const C = ordContact();
  /* a new submarine contact: Normal, sonar's estimate of his depth goes on the charges */
  if (C && !OODO.sub) {
    OODO.sub = true;
    const s = ordEnemySub(C) || (PT.on && PT.L.find((t) => t.kind === 'sub'));
    if (s && !drillHC() && !OODO.depSet) {
      const d = s.d !== undefined ? s.d : s.o && s.o.d;
      if (d !== undefined) OODO.dep = ORD_DEP.reduce((a, b) => (Math.abs(b - d / 0.3048) < Math.abs(a - d / 0.3048) ? b : a));
    }
    if (ordPlayer()) note('SONAR CONTACT - G FOR YOUR ORDERS');
  }
  if (!C) ((OODO.sub = false), (OODO.depSet = false));
  if (ordPlayer()) return;
  /* ---- the AI OOD ---- */
  const A = OODO.ai;
  A.cool = Math.max(0, A.cool - dt);
  /* smoke under shellfire, secured three minutes after the last hit */
  if (SHIP.t - ENG.hitT < 3 && !SMK.on && SMK.oil > 0 && (SIMS.cur.coastOn() || SIMS.cur.shipsOn())) ((A.smoke = true), smkOrder(true, 'ai'));
  if (A.smoke && SMK.on && SHIP.t - ENG.hitT > 180) ((A.smoke = false), smkOrder(false, 'ai'));
  /* the attack on an enemy submarine: he cons her (not while the player has the helm, a drill, a torpedoman's run or the way home).
     Once the run has begun he goes on by sonar's last fix carried on for up to a minute: close in the echo is lost under her bow,
     and the attack is finished by the plot (the user's, 2026-11-23: she ran over I-58 and no order was ever given) */
  const E = subEst(),
    Fx = C || (A.run && E && E.age < 60 ? E : null),
    S = Fx && ordEnemySub(Fx);
  /* he is sunk (a Hedgehog bomb on his hull, or charges close enough): the attack is over, and the torpedoman is told so and makes the
     charges safe (the user's, 2026-11-23: after a Hedgehog hit nobody said whether it was over) */
  if (A.run && A.sub && A.sub.sunk) {
    ordRunEnd(A, 'CHECK FIRE, CHECK FIRE. HE IS SUNK. PUT THE SAFETY FORKS BACK IN AND SECURE THE CHARGES.');
    A.sub = null;
    A.cool = 0;
    ASW.live = false;
    if (!FM.use('orders')) for (const k of ['rack', 'port', 'stbd']) DC.arm[k] = false; /* game mode: the crews make them safe */
    note('OOD: ENEMY SUBMARINE SUNK. SECURE FROM THE ATTACK.');
    return;
  }
  if (!S || atHelm() || DRILL.on || ASW.ph !== 'idle' || RTB.on) {
    if (A.run || ASW.live) ordRunEnd(A, A.run ? 'LOST CONTACT. ATTACK BROKEN OFF.' : '');
    return;
  }
  const r = aswRelTo(Fx.p),
    yd = Math.hypot(r.al, r.cr);
  if (A.cool > 0 && yd < 900) return; /* opening out after an attack, to come round again */
  /* down sonar's bearing, with the helmsman's lag taken out (he is ordered past it by as much as she is off it) */
  const brg = Math.atan2(-(Fx.p.x - pos.x), -(Fx.p.z - pos.z));
  if (yd > 150) SHIP.hold = brg + Math.max(-0.3, Math.min(0.3, angW(brg - SHIP.hdg)));
  SHIP.tel = yd < 1500 ? 0.67 : 1;
  if (!OODO.depSet && S.d !== undefined) OODO.dep = ORD_DEP.reduce((a, b) => (Math.abs(b - S.d / 0.3048) < Math.abs(a - S.d / 0.3048) ? b : a));
  const torp = camMode == 1 && SHIP.stn === 5 /* the player is the torpedoman: the orders are his to carry out */,
    say = ordPhone;
  /* the run begins: the torpedoman is told what is coming and the depth to set, on his phone (station 5) */
  if (!A.run) {
    if (yd > 1500) return;
    A.run = true;
    A.sub = S.side === 'jp' ? S : null;
    A.f = {};
    ASW.O = [];
    ASW.depth = OODO.dep;
    say('SUBMARINE CONTACT BEARING ' + raidBrg(Fx.p) + ', ' + Math.round(yd / 25) * 25 + ' YARDS. WE ARE ATTACKING. MAN THE HEDGEHOG. SET ALL CHARGES ' + OODO.dep + ' FEET AND PULL THE SAFETY FORKS.');
    if (!(camMode == 1 && SHIP.stn === 5)) note('OOD: ATTACKING THE SUBMARINE');
  }
  ASW.depth = OODO.dep;
  const f = A.f,
    fw = new THREE.Vector3(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)),
    stern = pos.clone().addScaledVector(fw, tpXF(90)),
    tos = ((Fx.p.x - stern.x) * fw.x + (Fx.p.z - stern.z) * fw.z) / Math.max(1, SHIP.u) /* seconds until her stern is over him */;
  if (!f.sbh && r.al < 460 && HH.n > 0) ((f.sbh = 1), say('STAND BY HEDGEHOG.', 'hh'));
  if (!f.hh && r.al < 300 && r.al > 150) {
    f.hh = 1;
    if (Math.abs(r.cr) < 50 && HH.n > 0 && !HH.L.length && !HH.q.length) {
      const o = say('FIRE HEDGEHOG!', 'hh', true);
      if (!torp) (ordGive('hh', 'ai'), (o.st = 'ok')) /* the Hedgehog's crew fire it */;
    } else if (HH.n > 0) say('CHECK FIRE HEDGEHOG - HE IS OFF THE BOW. CHARGES ONLY.', 'rack');
  }
  if (!f.sbc && tos < 25) {
    f.sbc = 1;
    say('STAND BY CHARGES. ' + OODO.dep + ' FEET. SAFETY FORKS OUT.', 'rack');
    /* game mode: the crews pull the safety forks and set the ordered depth on "stand by"; Hardcore: the torpedoman does both */
    if (!FM.use('orders')) for (const k of ['rack', 'port', 'stbd']) ((DC.arm[k] = true), (DC.dep[k] = OODO.dep));
  }
  if (torp) {
    if (!f.r1 && tos < 9) ((f.r1 = 1), say('FIRE ONE!', 'rack', true));
    if (!f.ks && tos < 5) ((f.ks = 1), say('FIRE STARBOARD K-GUNS!', 'stbd', true));
    if (!f.kp && tos < 1) ((f.kp = 1), say('FIRE PORT K-GUNS!', 'port', true));
    if (!f.r2 && tos < -6) ((f.r2 = 1), say('FIRE TWO!', 'rack', true));
    if (f.r2 && tos < -12) ordRunEnd(A, 'OPENING OUT TO COME ROUND AGAIN. RELOAD.');
  } else if (!OODO.pat && r.al < aswBest(OODO.dep) && r.al > -20 && Math.abs(r.cr) < 60) {
    ordGive('pat', 'ai');
    say('FIRE THE PATTERN! ' + OODO.dep + ' FEET.');
    ordRunEnd(A, 'OPENING OUT TO COME ROUND AGAIN. RELOAD.');
  }
  if (A.run && tos < -20) ordRunEnd(A, 'PASSED OVER HIM. OPENING OUT TO COME ROUND AGAIN.');
}
/* an order on the torpedoman's phone (station 5's box); it sounds only there */
function ordPhone(t, k, fire) {
  ASW.live = true;
  if (camMode == 1 && SHIP.stn === 5) return aswSay('TORPEDOMAN, BRIDGE. ' + t, k, fire);
  const o = { txt: 'TORPEDOMAN, BRIDGE. ' + t, k: k || null, t0: ASW.t, st: fire ? 'open' : 'info' };
  ASW.O.push(o);
  ASW.msg = o.txt;
  return o;
}
/* the run is over: open out for a minute before coming round again; the torpedoman told why */
function ordRunEnd(A, why) {
  for (const o of ASW.O) if (o.st === 'open') o.st = 'gone';
  if (why) ordPhone(why);
  if (A.run) A.cool = 60;
  A.run = false;
  A.hh = false;
  if (!why || /LOST/.test(why)) ASW.live = false;
}
HOOKS.tick.push(ordStep);
