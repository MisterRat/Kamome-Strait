/* =====================================================================================================================
   THE OOD'S ORDERS IN ACTION (the user's, 2026-11-21: finish the OOD's station). Comms reports to the bridge (the radar's air
   contacts, sonar's submarine, the power and the fuel); the OOD decides and gives his orders. At station 1, G opens his orders
   (Q / E choose, Space gives it; G again closes them):
     HOLD FIRE / GUNS FREE    the gun crews (the AI at the mounts the player is not on) cease fire or open it again
     REQUEST AIR SUPPORT      Comms calls Kamome Control (one call at a time: AIRSUP)
     MAKE SMOKE / SECURE      the engine room lights off the smoke generator (THE ENGINE ROOM ON PATROL) or shuts it down
     ATTACK: HEDGEHOG         the torpedomen fire it (the bombs land about 250 yd ahead: him dead on the bow, 200 to 300 yd)
     ATTACK: THE PATTERN      the racks and the K-guns, over 14 s, set to the depth ordered (as her stern comes over him)
     DEPTH SETTING            the charges' depth, 50 to 300 ft (Normal: set to sonar's estimate when he is found)
   The orders stand when he leaves the station. With the player elsewhere the AI OOD has the deck: he calls for air support when
   the radar finds enemy aircraft (CAP), lays smoke when she comes under shellfire and secures it when it stops, and attacks a
   Japanese submarine sonar holds: he cons her down sonar's bearing at attack speed and fires on the same timing as the drill.
   ===================================================================================================================== */
var OODO = { menu: false, sel: 0, hold: false, dep: 150, pat: null, depSet: false, sub: false, ai: { cool: 0, smoke: false } };
const ORD_DEP = [50, 100, 150, 200, 250, 300];
function ordReset() {
  Object.assign(OODO, { menu: false, sel: 0, hold: false, dep: 150, pat: null, depSet: false, sub: false, ai: { cool: 0, smoke: false } });
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
    { id: 'air', t: 'REQUEST AIR SUPPORT', off: ordAirUp() && 'A FLIGHT IS ANSWERING', hot: CAP.S.raid && !ordAirUp() },
    { id: 'smoke', t: SMK.on ? 'SECURE SMOKE' : 'MAKE SMOKE', off: !SMK.on && SMK.oil <= 0 && 'NO FOG OIL' },
    { id: 'hh', t: 'ATTACK: FIRE HEDGEHOG', off: !C ? 'NO SONAR CONTACT' : HH.n <= 0 ? 'THE HEDGEHOG IS EMPTY' : HH.L.length || HH.q.length ? 'ITS BOMBS ARE IN THE AIR' : '', hot: !!C },
    { id: 'pat', t: 'ATTACK: FIRE THE PATTERN', off: !C ? 'NO SONAR CONTACT' : OODO.pat ? 'THE PATTERN IS ROLLING' : '', hot: !!C },
    { id: 'dep', t: 'DEPTH SETTING ' + OODO.dep + ' FT' },
  ];
}
function ordGive(id, by) {
  const B = (t) => RADIO.add('BRIDGE', t, { own: true });
  if (id === 'guns') {
    OODO.hold = !OODO.hold;
    B(OODO.hold ? 'ALL GUNS, BRIDGE. CEASE FIRE, CEASE FIRE. HOLD YOUR FIRE.' : 'ALL GUNS, BRIDGE. GUNS FREE. ENGAGE THE ENEMY.');
    note(OODO.hold ? 'OOD: HOLD FIRE' : 'OOD: GUNS FREE');
  } else if (id === 'air') {
    if (ordAirUp()) return note('AIR SUPPORT IS ALREADY ANSWERING YOUR LAST CALL');
    B('COMMS, BRIDGE: REQUEST AIR SUPPORT FROM KAMOME CONTROL.');
    if (!CAP.call('PCE 842')) note('KAMOME CONTROL HAS NO FIGHTERS FOR YOU NOW');
  } else if (id === 'smoke') smkOrder(!SMK.on, by);
  else if (id === 'hh') {
    if (!ordContact()) return note('NO SONAR CONTACT TO ATTACK');
    if (hhFire()) B('FIRE HEDGEHOG!');
  } else if (id === 'pat') {
    if (!ordContact()) return note('NO SONAR CONTACT TO ATTACK');
    if (OODO.pat) return;
    aswArm(OODO.dep);
    OODO.pat = { t0: SHIP.t };
    B('FIRE THE PATTERN! SET ' + OODO.dep + ' FEET.');
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
  R.push('GUNS <b>' + (OODO.hold ? 'HOLDING FIRE' : 'FREE') + '</b> &middot; SMOKE <b>' + (SMK.on ? 'ON' : 'OFF') + '</b> &middot; FUEL <b>' + Math.round(ENG.fuel * 100) + '%</b>');
  return R;
}
DRILLP.push({
  stn: 1,
  show: () => OODO.menu,
  html() {
    let h = "<b style=\"color:#9fc3d6\">THE OOD'S ORDERS</b><br>" + ordReports().join('<br>');
    ordList().forEach((o, i) => {
      const col = o.off ? '#6a7a84' : o.hot ? '#ff8a6a' : '#dfe6e8',
        t = '<span style="color:' + col + '">' + o.t + (o.off ? ' (' + o.off + ')' : '') + '</span>';
      h += '<br>' + (i === OODO.sel ? '<b style="color:#ffd27a">&#9656; </b><b>' + t + '</b>' : '&nbsp;&nbsp;' + t);
    });
    return h + '<br><span style="color:#9aa"><b>Q / E</b> choose &middot; <b>Space</b> give the order &middot; <b>G</b> close</span>';
  },
  /* the plot while sonar holds a submarine (Hardcore: his bearing and range from the reports only) */
  pic: () => !!ordContact() && !drillHC(),
  draw: (g, w, h) => aswHeadUp(g, w, h, ordContact().p),
});
/* each frame: the pattern rolling, the reports to a player OOD, the AI OOD */
function ordStep(dt) {
  if (!SIMS.on('pce') || !started || paused || crashed || RPL.on) return;
  if (OODO.menu && !ordPlayer()) OODO.menu = false;
  if (OODO.pat && aswPatStep(OODO.pat, SHIP.t)) OODO.pat = null;
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
  /* the attack on an enemy submarine: he cons her (not while the player has the helm, a drill, a torpedoman's run or the way home) */
  const S = C && ordEnemySub(C);
  if (!S || atHelm() || DRILL.on || ASW.ph !== 'idle' || RTB.on) return;
  const r = aswRelTo(C.p),
    yd = Math.hypot(r.al, r.cr);
  if (A.cool > 0 && yd < 900) return; /* opening out after an attack, to come round again */
  /* down sonar's bearing, with the helmsman's lag taken out (he is ordered past it by as much as she is off it) */
  const brg = Math.atan2(-(C.p.x - pos.x), -(C.p.z - pos.z));
  if (yd > 150) SHIP.hold = brg + Math.max(-0.3, Math.min(0.3, angW(brg - SHIP.hdg)));
  SHIP.tel = yd < 1500 ? 0.67 : 1;
  if (!OODO.depSet && S.d !== undefined) OODO.dep = ORD_DEP.reduce((a, b) => (Math.abs(b - S.d / 0.3048) < Math.abs(a - S.d / 0.3048) ? b : a));
  const torp = camMode == 1 && SHIP.stn === 5 /* the player is the torpedoman: the order is his to carry out */;
  if (r.al > 200 && r.al < 300 && Math.abs(r.cr) < 40 && HH.n > 0 && !HH.L.length && !HH.q.length && !A.hh) {
    A.hh = true;
    if (torp) RADIO.add('BRIDGE', 'TORPEDOMAN, BRIDGE. FIRE HEDGEHOG!', { own: true });
    else ordGive('hh', 'ai');
  }
  if (!OODO.pat && r.al < aswBest(OODO.dep) && r.al > -20 && Math.abs(r.cr) < 60) {
    if (torp) RADIO.add('BRIDGE', 'TORPEDOMAN, BRIDGE. FIRE THE PATTERN! SET ' + OODO.dep + ' FEET.', { own: true });
    else ordGive('pat', 'ai');
    A.cool = 60;
    A.hh = false;
  }
}
HOOKS.tick.push(ordStep);
