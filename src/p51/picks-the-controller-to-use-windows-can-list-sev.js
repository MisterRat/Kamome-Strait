/* Picks the controller to use. Windows can list several devices (virtual pads from Steam, vJoy and so on) and the
   first one may be silent, so the pad being used is the one that is actually moving; it stays selected until
   another one is touched or it disappears. */
let padIdx = -1,
  padHad = false;
function activePad() {
  const all = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  const list = all.filter((g) => g && g.connected);
  if (!list.length) {
    if (padHad) note('CONTROLLER LOST - press a button to reconnect');
    padHad = false;
    padIdx = -1;
    return null;
  }
  const busy = (g) => g.buttons.some((b) => b.pressed) || g.axes.some((v) => Math.abs(v) > 0.5);
  let cur = list.find((g) => g.index === padIdx);
  const act = list.find(busy);
  if (act && (!cur || (act !== cur && !busy(cur)))) cur = act;
  if (!cur) cur = list[0];
  if (cur.index !== padIdx || !padHad) {
    padIdx = cur.index;
    note('CONTROLLER: ' + String(cur.id).replace(/\(.*/, '').trim().slice(0, 30));
  }
  padHad = true;
  return cur;
}
function pollPad() {
  const gp = activePad();
  if (!gp) {
    pad.p = pad.r = pad.y = pad.thr = pad.view = pad.lx = pad.ly = 0;
    pad.trE = pad.trR = pad.trA = 0;
    pad.fire = pad.brake = false;
    return;
  }
  if (!padSeen) {
    padSeen = true;
    setHelpMode('pad');
  }
  const a = gp.axes,
    b = gp.buttons,
    bp = (i) => !!(b[i] && b[i].pressed),
    bv = (i) => (b[i] ? b[i].value : 0),
    e = (i) => bp(i) && !prevB[i];
  const prevB = padPrev;
  padPrev = b.map((x) => x.pressed);
  if (e(PB.manual)) toggleDocs();
  if (pmOpen) {
    pad.trE = pad.trR = pad.trA = 0;
    pad.p = pad.r = pad.y = pad.thr = pad.lx = pad.ly = 0;
    pad.fire = pad.brake = false;
    if (e(4)) pmCycle(-1);
    if (e(5)) pmCycle(1);
    if (INFO_TABS.includes(pmTab)) $$('pmBox').scrollTop += dzf(a[3]) * 22;
    if (menuOpen) {
      if (e(12)) menuMove(-1);
      if (e(13)) menuMove(1);
      if (e(0) || e(9)) menuPick(menuSel);
      if (e(1) || e(8)) pmShow(false);
    } else if (pmTab === 'set') {
      if (e(12)) pmNav(-1);
      if (e(13)) pmNav(1);
      if (e(0)) pmActivate();
      if (e(1) || e(8)) pauseMenu(false);
    } else {
      if (e(12)) $$('pmBox').scrollTop -= 90;
      if (e(13)) $$('pmBox').scrollTop += 90;
      if (e(1) || e(8) || e(0)) pmShow(false);
    }
    return;
  }
  if (!started) {
    if (e(8)) toggleMenu();
    if (e(0) || e(9)) $$('go').click();
    if (e(14)) setDiff(Math.max(0, DIFFS.indexOf(DIFF) - 1));
    if (e(15)) setDiff(Math.min(2, DIFFS.indexOf(DIFF) + 1));
    if (e(11)) setDiff((DIFFS.indexOf(DIFF) + 1) % 3);
    padPrev = b.map((x) => x.pressed);
    return;
  }
  /* Hardcore trim: hold Back; then D-pad up/down = elevator, left/right = rudder, LB/RB = aileron, A = centre.
     Back alone (pressed and released without trimming) still opens the pause menu. */
  const mod = bp(PB.pause) && FM.use('trim');
  pad.trE = pad.trR = pad.trA = 0;
  if (mod) {
    pad.trE = (bp(13) ? 1 : 0) - (bp(12) ? 1 : 0);
    pad.trR = (bp(15) ? 1 : 0) - (bp(14) ? 1 : 0);
    pad.trA = (bp(5) ? 1 : 0) - (bp(4) ? 1 : 0);
    if (pad.trE || pad.trR || pad.trA) trimPadUsed = true;
    if (e(0)) {
      trimPadUsed = true;
      ACT.trimC();
    }
  }
  pad.r = dzf(a[2]);
  pad.p = dzf(a[3]); /* right stick: roll / pitch */
  pad.y = mod ? 0 : (bp(PB.rudR) ? 1 : 0) - (bp(PB.rudL) ? 1 : 0); /* bumpers: rudder */
  if (!mod && bp(PB.rudR) && bp(PB.rudL)) {
    /* both bumpers held for 1.5 s: bail out */
    if (!DM.bailHold) DM.bailHold = performance.now();
    else if (performance.now() - DM.bailHold > 1500) {
      DM.bailHold = 0;
      bailOut();
    }
  } else DM.bailHold = 0;
  pad.thr = mod ? 0 : (bp(PB.thrUp) ? 1 : 0) - (bp(PB.thrDn) ? 1 : 0); /* d-pad up/down: throttle */
  pad.fire = bv(PB.guns) > 0.3;
  pad.brake = bp(PB.brake); /* trigger guns, button brakes */
  pad.lx = dzf(a[0], 0.1);
  pad.ly = dzf(a[1], 0.1); /* left stick: look */
  if (e(PB.rocket)) fireRocket();
  if (e(PB.bomb)) dropBomb();
  if (e(PB.camera)) {
    if (ROAM.on) roamExit();
    else if (orbitOn) orbReset();
    else camMode ^= 1;
  }
  if (!mod && e(PB.flapUp)) ACT.flapUp();
  if (!mod && e(PB.flapDn)) ACT.flapDn();
  if (crashed) {
    if (e(0) || e(1) || e(2) || e(3) || e(8) || e(9)) reset();
    padPrev = b.map((x) => x.pressed);
    return;
  }
  if (e(PB.r3)) r3Down = performance.now();
  else if (!bp(PB.r3) && prevB[PB.r3] && r3Down) {
    setDiff((DIFFS.indexOf(DIFF) + 1) % 3);
    r3Down = 0;
  }
  if (!mod && e(PB.gear)) ACT.gear();
  if (e(PB.brake)) ACT.brake();
  if (e(PB.restart)) ACT.restart();
  if (FM.use('trim')) {
    /* with trim on, Back opens the pause menu when it is released, unless it was used as the trim key */
    if (!bp(PB.pause) && prevB[PB.pause]) {
      if (!trimPadUsed) ACT.pause();
      trimPadUsed = false;
    }
  } else {
    trimPadUsed = false;
    if (e(PB.pause)) ACT.pause();
  }
  padPrev = b.map((x) => x.pressed);
}
function refreshHelp() {
  const h = $$('help');
  h.classList.toggle('pad', HM.pad);
  h.classList.toggle('touch', !!MOB);
}
function setHelpMode(m) {
  HM.pad = m === 'pad';
  refreshHelp();
} /* keyboard help until a controller shows up; the display setting in the pause menu still decides whether it is visible */
addEventListener('gamepadconnected', () => {
  note('CONTROLLER CONNECTED');
  setHelpMode('pad');
});
addEventListener('gamepaddisconnected', () => {
  padSeen = false;
  setHelpMode('kbd');
});
const keys = {};
