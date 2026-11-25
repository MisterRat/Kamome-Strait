/* ---------- THE CONTROLLER AND TOUCH: each station's buttons from one table (the user's, 2026-11-24) ----------
   The PCE is worked from the keyboard: every station, drill, menu and the chart answers keys. The controller and the touch buttons
   press those same keys, so they work everywhere the keyboard does and can never disagree with it.
   Everywhere (controller): LB / RB the station before / after (from the chase view: back to her station), D-pad up / down the
   engines (the arrow keys), Y the camera, the right stick the rudder (where it is not training Comms or a gun's stick), Back the
   pause menu, L3 the manual, Start restarts. The station's own jobs are in PCEX below: each row [controller slot, key, touch label,
   what it does, hold]. Slots: 0 A, 1 B, 2 X, 6 LT, 11 R3, 14 / 15 D-pad left / right, 'rx-' 'rx+' 'ry-' 'ry+' the right stick (or
   the touch stick) pushed that way, '' touch only; 'click' at the chart is the controller's cursor. Each station's trigger (RT, the
   touch FIRE button) is PCEX_FIRE.
   Touch: the station buttons (1-5) on the right, the station's own buttons bottom left (up to twelve), the telegraph lever on the left,
   the rudder arrows, and the stick (drag the right half) lays a gun, trains the radar or sonar, walks the deck (Hardcore) or steers.
   Where the stick aims, FIRE moves to the bottom left (body.aimMode) so the right thumb aims and the left thumb fires. */
const PCEX = {
  chase: [
    [0, 'KeyO', 'MAP', 'minimap on / off'],
    [2, 'KeyT', 'TARGETS', 'practice targets'],
    [14, 'Minus', 'MAP &minus;', 'minimap zoom out'],
    [15, 'Equal', 'MAP +', 'minimap zoom in'],
  ],
  ood: [
    [0, 'Digit1', 'CHART', 'to the chart table'],
    [1, 'KeyG', 'ORDERS', "the OOD's orders"],
    [2, 'KeyT', 'DRILLS', 'training drills'],
    [6, 'KeyX', 'BINOCS', 'binoculars'],
    [14, 'KeyQ', '&#9664;', 'choose (orders, drills)', 1],
    [15, 'KeyE', '&#9654;', 'choose', 1],
    [11, 'KeyR', 'PATTERN', 'fire the pattern (attack drill)'],
  ],
  chart: [
    [0, 'click', '', 'place, pick or drag a waypoint; drag the chart (the left stick moves the cursor)'],
    [1, 'Backspace', 'DELETE', 'remove the selected waypoint'],
    [2, 'Digit1', 'WHEEL', 'back to the wheel'],
    [6, 'Tab', 'NEXT WP', 'select the next waypoint'],
    [11, 'KeyL', 'LOOP', 'loop the route on / off'],
    ['', 'Home', 'CENTRE', 'centre on her'],
    [14, 'Minus', 'ZOOM &minus;', 'zoom out'],
    [15, 'Equal', 'ZOOM +', 'zoom in'],
  ],
  eng: [
    [2, 'KeyT', 'DRILLS', 'training drills'],
    [14, 'KeyQ', '&#9664;', 'choose, the smoke valve', 1],
    [15, 'KeyE', '&#9654;', 'choose, the smoke valve', 1],
    ['', 'ArrowUp', '&#9650;<br>AHEAD', 'answer / ring ahead', 1],
    ['', 'ArrowDown', '&#9660;<br>ASTERN', 'answer / ring astern', 1],
  ],
  radar: [
    [0, 'Digit3', 'NEXT', 'next: sonar, radio'],
    [2, 'KeyT', 'SCHOOL', 'Comms school'],
    ['rx-', 'KeyQ', '', 'cursor left', 1],
    ['rx+', 'KeyE', '', 'cursor right', 1],
    ['ry-', 'KeyR', 'STROBE +', 'range strobe out', 1],
    ['ry+', 'KeyF', 'STROBE &minus;', 'range strobe in', 1],
    [14, 'PageDown', 'SCALE &minus;', 'shorter scale'],
    [15, 'PageUp', 'SCALE +', 'longer scale'],
  ],
  sonar: [
    [0, 'Digit3', 'NEXT', 'next: radio, radar'],
    [2, 'KeyT', 'SCHOOL', 'Comms school'],
    ['rx-', 'KeyQ', '', 'train left', 1],
    ['rx+', 'KeyE', '', 'train right', 1],
    [6, 'KeyZ', 'CUT L', 'left cut'],
    [1, 'KeyX', 'CUT R', 'right cut'],
    ['ry-', 'KeyU', 'UP DOP', 'up Doppler'],
    ['ry+', 'KeyB', 'DN DOP', 'down Doppler'],
    [11, 'KeyN', 'NO DOP', 'no Doppler'],
    [14, 'PageDown', 'RANGE &minus;', 'shorter range'],
    [15, 'PageUp', 'RANGE +', 'longer range'],
  ],
  radio: [
    [0, 'Digit3', 'NEXT', 'next: radar, sonar'],
    [2, 'KeyT', 'SCHOOL', 'Comms school'],
    [1, 'KeyB', 'BRIDGE', 'route the message to the bridge'],
    ['ry-', 'PageUp', 'PAPER &#9650;', 'scroll the paper', 1],
    ['ry+', 'PageDown', 'PAPER &#9660;', 'scroll the paper', 1],
  ],
  gun: [
    [0, 'Digit4', 'NEXT GUN', 'next gun'],
    [6, 'KeyX', 'SIGHT', 'sight / telescope / look round'],
    [1, 'KeyR', 'DRUM', 'new drum (20 mm)'],
    [2, 'KeyT', 'TARGETS', 'practice targets'],
    [14, 'PageDown', 'RANGE &minus;', 'sight range (Hardcore)'],
    [15, 'PageUp', 'RANGE +', 'sight range (Hardcore)'],
  ],
  torp: [
    [0, 'Digit5', 'NEXT', 'next position'],
    [2, 'KeyJ', 'ORDERED', 'go to the ordered weapon'],
    [6, 'KeyX', 'ARM', 'arm / safe'],
    [1, 'KeyR', 'LOAD HH', 'load the Hedgehog'],
    [11, 'KeyT', 'SUB', 'the exercise sub'],
    [14, 'PageDown', 'DEPTH &minus;', 'shallower'],
    [15, 'PageUp', 'DEPTH +', 'deeper'],
  ],
};
/* the trigger at each station: [key, touch label, what it does]. At a gun and at the torpedoman's weapons the controller's trigger
   fires through pad.fire as before; there the touch button holds Space */
const PCEX_FIRE = {
  chase: null,
  ood: ['Space', 'GIVE', 'give the order / start the drill'],
  chart: ['Enter', 'ENGAGE', 'engage / disengage the route'],
  eng: ['Space', 'OK', 'the job (hold: the hose)'],
  radar: ['Space', 'REPORT', 'report the contact'],
  sonar: ['Space', 'REPORT', 'report the contact'],
  radio: ['Space', 'ACK', 'acknowledge'],
  gun: ['Space', 'FIRE', 'fire'],
  torp: ['Space', 'FIRE', 'fire the weapon you are at'],
};
const PCEX_SLOT = {
  0: 'A',
  1: 'B',
  2: 'X',
  6: 'LT',
  11: 'R3',
  14: 'D-pad &larr;',
  15: 'D-pad &rarr;',
  'rx-': 'R-stick &larr;',
  'rx+': 'R-stick &rarr;',
  'ry-': 'R-stick &uarr;',
  'ry+': 'R-stick &darr;',
};
/* where the player is: which row of PCEX */
function pceCtx() {
  if (typeof SHIP === 'undefined' || camMode != 1) return 'chase';
  if (typeof GUN !== 'undefined' && GUN.cur) return 'gun';
  const st = PCEM.STN[SHIP.stn] && PCEM.STN[SHIP.stn][SHIP.sub],
    dev = (st && st.dev) || '';
  if (SHIP.stn === 1) return dev === 'chart' ? 'chart' : 'ood';
  if (SHIP.stn === 2) return 'eng';
  if (SHIP.stn === 3) return dev || 'radar';
  return SHIP.stn === 5 ? 'torp' : 'gun';
}
/* does the stick (the controller's right stick, the touch stick, tilt) steer her here? not where it lays a gun or works Comms */
function pceStickSteers() {
  const c = pceCtx();
  return c !== 'gun' && c !== 'radar' && c !== 'sonar' && c !== 'radio';
}
/* pressing keys: a tap (down and up), or held (down now, repeating as a held key does, up when let go). PX.held is keyed by who holds
   it: 'p...' the controller, 't...' the touch buttons, 's...' the touch stick at Comms, 'tT' the telegraph lever, 'tF' FIRE */
const PX = { held: {}, ctx: '', cur: null, curOn: false, A: false, tel: null, telT: 0, telLast: 0, tk: '', touch: [] };
const pxKey = (code, down, rep) =>
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, repeat: !!rep, bubbles: true }));
const pxTap = (code) => (pxKey(code, true), pxKey(code, false));
function pxHold(id, code, on) {
  const h = PX.held[id];
  if (on && !h) {
    PX.held[id] = { code, t: performance.now(), r: 0 };
    pxKey(code, true);
  } else if (!on && h) {
    delete PX.held[id];
    if (h.code) pxKey(h.code, false);
  }
}
function pxRelease(pre) {
  for (const id in PX.held) if (!pre || id.startsWith(pre)) pxHold(id, null, false);
}
/* held keys repeat like the keyboard's: after 0.35 s, every 70 ms (the engine room's hose, the drills) */
function pxRepeat() {
  const n = performance.now();
  for (const id in PX.held) {
    const h = PX.held[id];
    if (h.code && n - h.t > 350 && n - h.r > 70) {
      h.r = n;
      pxKey(h.code, true, true);
    }
  }
}
/* LB / RB: the station before / after; from the chase view, back to her station */
const pxStn = (d) => pxTap('Digit' + (camMode != 1 ? SHIP.stn : ((SHIP.stn - 1 + d + 5) % 5) + 1));
/* the controller, each frame after the shared buttons (the role's padStep) */
function pcePad(gp, edge, held, dt) {
  if (PHOTO.on || ROAM.on || crashed) {
    pxRelease('p');
    pceChartCur(false);
    return;
  }
  const c = pceCtx(),
    a = gp.axes;
  if (c !== PX.ctx) {
    pxRelease('p');
    if (PX.A) NAVCHART.up(PX.cur[0], PX.cur[1]);
    PX.A = false;
    PX.ctx = c;
  }
  if (edge(4)) pxStn(-1);
  if (edge(5)) pxStn(1);
  pxHold('pU', 'ArrowUp', held(12));
  pxHold('pD', 'ArrowDown', held(13));
  const rx = a[2] || 0,
    ry = a[3] || 0;
  for (const [s, code, , , hold] of PCEX[c]) {
    if (s === '' || s === 'click') continue;
    if (typeof s === 'number') {
      if (hold) pxHold('p' + s, code, held(s));
      else if (edge(s)) pxTap(code);
      continue;
    }
    const on = s === 'rx-' ? rx < -0.5 : s === 'rx+' ? rx > 0.5 : s === 'ry-' ? ry < -0.5 : ry > 0.5;
    if (hold) pxHold('p' + s, code, on);
    else if (on && !PX.held['p' + s]) {
      /* a flick of the stick taps once */
      pxTap(code);
      PX.held['p' + s] = { code: '', t: 0, r: 0 };
    } else if (!on) delete PX.held['p' + s];
  }
  if (!pceStickSteers()) pad.r = 0;
  /* the trigger: at a gun and the torpedoman's weapons pad.fire fires; elsewhere it is the station's key */
  const F = PCEX_FIRE[c];
  pxHold('pF', F && F[0], !!(F && c !== 'gun' && c !== 'torp' && gp.buttons[7] && gp.buttons[7].value > 0.3));
  if (c === 'chart') {
    /* the left stick moves a cursor on the chart; A works it like the mouse's left button (hold A and move to drag) */
    if (!PX.cur) PX.cur = [NAVCHART.MW / 2, NAVCHART.H / 2];
    const sp = 520 * dt,
      mx = pad.lx * sp,
      my = pad.ly * sp;
    pad.lx = pad.ly = 0; /* not the free look */
    PX.cur[0] = Math.max(0, Math.min(NAVCHART.W, PX.cur[0] + mx));
    PX.cur[1] = Math.max(0, Math.min(NAVCHART.H, PX.cur[1] + my));
    if (mx || my) NAVCHART.move(PX.cur[0], PX.cur[1]);
    if (edge(0)) {
      PX.A = true;
      NAVCHART.down(PX.cur[0], PX.cur[1], 0);
    } else if (PX.A && !held(0)) {
      PX.A = false;
      NAVCHART.up(PX.cur[0], PX.cur[1]);
    }
    pceChartCur(true);
  } else pceChartCur(false);
  pxRepeat();
}
function pceChartCur(on) {
  if (!on && !PX.curOn) return;
  PX.curOn = on;
  if (on) NAVCHART.setCur(PX.cur[0], PX.cur[1]);
  else NAVCHART.setCur(null);
}
/* ---- touch ---- */
/* the telegraph lever (the shared throttle slider): the finger picks an order (the nearest bell), and the engine keys ring it on until
   she has it; nothing moving it for a second (Hardcore: only the pilothouse and the engine room ring the engines) gives up */
const PX_NOTCH = [-0.5, -0.33, -0.17, 0, 0.17, 0.33, 0.5, 0.67, 0.83, 1];
function pceTel(v) {
  if (v === null) return;
  const t = -0.5 + 1.5 * v;
  PX.tel = PX_NOTCH.reduce((b, n) => (Math.abs(n - t) < Math.abs(b - t) ? n : b), 0);
  PX.telT = performance.now();
  PX.telLast = SHIP.tel;
}
function pceTelStep() {
  if (PX.tel === null) return;
  const d = PX.tel - SHIP.tel,
    n = performance.now();
  if (Math.abs(SHIP.tel - PX.telLast) > 0.002) {
    PX.telLast = SHIP.tel;
    PX.telT = n;
  }
  if (Math.abs(d) < 0.02 || n - PX.telT > 1000) {
    if (Math.abs(d) < 0.02) SHIP.tel = PX.tel; /* on the bell exactly */
    PX.tel = null;
    pxRelease('tT');
    return;
  }
  const k = d > 0 ? 'ArrowUp' : 'ArrowDown';
  if (PX.held.tT && PX.held.tT.code !== k) pxHold('tT', null, false);
  pxHold('tT', k, true);
}
/* the station's own buttons (#tCtx, made here) and the station bar (#tStn) */
function pceTouchInit() {
  const box = document.getElementById('tCtx'),
    bar = document.getElementById('tStn');
  if (!box || box.dataset.ok) return;
  box.dataset.ok = 1;
  box.innerHTML = Array.from({ length: 12 }, (_, i) => '<div class="tb" data-i="' + i + '" style="display:none"></div>').join('');
  box.querySelectorAll('.tb').forEach((el) => {
    const i = +el.dataset.i;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* the pointer was already released: harmless */
      }
      const r = PX.touch[i];
      if (!r) return;
      el.classList.add('on');
      if (r[4]) pxHold('t' + i, r[1], true);
      else pxTap(r[1]);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) =>
      el.addEventListener(ev, () => {
        el.classList.remove('on');
        pxHold('t' + i, null, false);
      }),
    );
  });
  if (bar)
    bar.querySelectorAll('.tb').forEach((el) =>
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pxTap('Digit' + el.dataset.n);
      }),
    );
}
/* each touch-UI tick (the shared per-frame glue, about 12 times a second): the lever, the stick at Comms, the labels */
function pceTouchUI() {
  pceTouchInit();
  pceTelStep();
  const c = pceCtx();
  /* the touch stick at Comms trains the radar or sonar and works the strobe or the paper, as the right stick does */
  if ((c === 'radar' || c === 'sonar' || c === 'radio') && !(TC.cfg.on && TC.state === 'ok')) {
    for (const [s, code, , , hold] of PCEX[c]) {
      if (typeof s !== 'string' || s[0] !== 'r' || !hold) continue;
      const on = s === 'rx-' ? TC.sr < -0.5 : s === 'rx+' ? TC.sr > 0.5 : s === 'ry-' ? TC.sp < -0.5 : TC.sp > 0.5;
      pxHold('s' + s, code, on);
    }
  } else pxRelease('s');
  pxRepeat();
  /* the lever: the bar is the order rung, the white line where it is going */
  const ord = PX.tel !== null ? PX.tel : SHIP.tel;
  $$('tThrF').style.height = ((SHIP.tel + 0.5) / 1.5) * 100 + '%';
  $$('tThrH').style.bottom = ((ord + 0.5) / 1.5) * 100 + '%';
  $$('tThrL').innerHTML = Math.abs(ord) < 0.02 ? 'STOP' : (ord > 0 ? 'AHEAD' : 'ASTERN') + '<br>' + Math.round(Math.abs(ord) * 100) + '%';
  const bar = document.getElementById('tStn');
  if (bar) bar.querySelectorAll('.tb').forEach((el) => el.classList.toggle('cur', camMode == 1 && +el.dataset.n === SHIP.stn));
  if (c === PX.tk) return;
  PX.tk = c;
  /* where the stick aims (a gun, the torpedoman, the radar, the sonar) FIRE goes to the left thumb (the user's, 2026-11-24: aiming and
     firing with the same right thumb cannot be done) */
  document.body.classList.toggle('aimMode', c === 'gun' || c === 'torp' || c === 'radar' || c === 'sonar');
  pxRelease('t');
  PX.touch = PCEX[c].filter((r) => r[2]);
  const box = document.getElementById('tCtx');
  if (box)
    box.querySelectorAll('.tb').forEach((el, i) => {
      const r = PX.touch[i];
      el.innerHTML = r ? r[2] : '';
      el.style.display = r ? '' : 'none';
    });
  const F = PCEX_FIRE[c],
    fb = document.getElementById('tFire');
  if (fb) {
    fb.innerHTML = F ? F[1] : '';
    fb.style.visibility = F ? '' : 'hidden';
  }
}
SIMS.add({
  id: 'pce',
  padStep: (gp, edge, held, dt) => pcePad(gp, edge, held, dt),
  touchUI: () => pceTouchUI(),
  thrTouch: (v) => pceTel(v),
  /* the FIRE button holds the station's key (at the chart Enter engages the route); the other shared buttons as before */
  touchBtn: (id, down) => {
    if (id !== 'tFire') return false;
    const F = PCEX_FIRE[pceCtx()];
    pxHold('tF', F && F[0], down && !!F);
    return true;
  },
  /* a finger on the chart table works it as the mouse does */
  touchDown: (e) => chartDown(e),
  touchMove: (e) => chartMove(e),
  touchUp: () => chartUp(),
});
/* the controls box for the controller, from the table */
function pcePadHelp(c) {
  const L = ['<b>LB / RB</b> station &middot; <b>D-pad &uarr; &darr;</b> engines' + (pceStickSteers() ? ' &middot; <b>R-stick</b> rudder' : '')];
  if (c === 'gun') L.push('<b>L-stick</b> aims &middot; <b>RT</b> fires');
  else if (c === 'torp') L.push('<b>RT</b> fires the weapon you are at' + (FM.use('walk') ? ' &middot; <b>L-stick</b> walks' : ''));
  else if (PCEX_FIRE[c]) L.push('<b>RT</b> ' + PCEX_FIRE[c][2]);
  const t = PCEX[c].filter((r) => r[0] !== '').map((r) => '<b>' + PCEX_SLOT[r[0]] + '</b> ' + r[3].replace(/ \(.*\)$/, ''));
  for (let i = 0; i < t.length; i += 3) L.push(t.slice(i, i + 3).join(' &middot; '));
  return L;
}
/* the Controls page's controller rows: every station's buttons */
function pcePadDoc() {
  const name = { chase: 'Chase view', ood: 'OOD (1)', chart: 'Chart table (1 again)', eng: 'Engineering (2)', radar: 'Radar (3)', sonar: 'Sonar (3 again)', radio: 'Radio (3 again)', gun: 'Gunner (4)', torp: 'Torpedoman (5)' };
  return Object.keys(PCEX).map((c) => [
    name[c],
    () =>
      (PCEX_FIRE[c] ? '<b>RT</b> ' + PCEX_FIRE[c][2] + ' &middot; ' : '') +
      PCEX[c]
        .filter((r) => r[0] !== '')
        .map((r) => '<b>' + PCEX_SLOT[r[0]] + '</b> ' + r[3])
        .join(' &middot; '),
    '',
    0,
  ]);
}
