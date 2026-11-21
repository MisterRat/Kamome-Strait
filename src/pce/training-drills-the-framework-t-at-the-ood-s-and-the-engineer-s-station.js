/* =====================================================================================================================
   TRAINING DRILLS (the user's, 2026-11-21): the OOD's (station 1) and the engineer's (station 2), each assessed at the end like
   the torpedoman's attack runs. T at either station opens its list of drills (Q / E choose, Space begins); the missions menu
   starts them too. A drill runs while the player stays at its station (leave it and the drill is broken off); the AI keeps every
   other station. At the end the debrief stays up (the grade, the measures behind it) until T is pressed again or the player
   leaves. Each drill is an entry in DRILLS: { id, stn, title, what, start(D), step(D, dt), key(D, code) -> used, box(D) -> html,
   draw(D, g, w, h) (its picture, optional) }. It ends itself with drillEnd(D, score 0-100, lines).
   Normal: quick, forgiving. Hardcore: the real thing (narrower windows, the damage grows while you work, no markers).
   ===================================================================================================================== */
var DRILLS = [];
var DRILL = { on: null /* the drill running */, menu: false, sel: 0, D: null /* its state */, deb: null /* the last debrief */, boxT: 0 };
const drillSay = (who, txt) => RADIO.add(who, txt, { own: true });
const drillHC = () => FM.use('orders') || FM.use('aa') || FM.use('walk') || FM.use('eng'); /* Hardcore: any of its options */
const drillList = () => DRILLS.filter((d) => d.stn === SHIP.stn);
/* T at station 1 or 2: the list (or close it); with a debrief up, the list again */
function drillToggle() {
  if (DRILL.on) return drillAbort('DRILL ENDED');
  if (DRILL.menu) return (DRILL.menu = false), note('DRILLS CLOSED');
  if (!drillList().length) return false;
  DRILL.deb = null;
  DRILL.menu = true;
  DRILL.sel = Math.min(DRILL.sel, drillList().length - 1);
  note('TRAINING DRILLS - Q / E CHOOSE, SPACE BEGINS');
  return true;
}
function drillStart(id) {
  const d = DRILLS.find((x) => x.id === id);
  if (!d) return;
  if (SHIP.stn !== d.stn || camMode != 1) shipStation(d.stn);
  DRILL.menu = false;
  DRILL.deb = null;
  DRILL.on = d;
  DRILL.D = { t: 0, hc: drillHC(), ev: [] };
  d.start(DRILL.D);
  SND.tone(880, 880, 0.25, 0.1, 'square');
  note('DRILL: ' + d.title.toUpperCase());
}
function drillAbort(msg) {
  const d = DRILL.on;
  if (d && d.stop) d.stop(DRILL.D);
  DRILL.on = null;
  DRILL.D = null;
  note(msg || 'DRILL BROKEN OFF');
}
/* the end of a drill: its grade and what it was measured on */
function drillEnd(D, score, lines) {
  const d = DRILL.on;
  if (d && d.stop) d.stop(D);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const v = score >= 85 ? 'EXCELLENT' : score >= 60 ? 'SATISFACTORY' : 'UNSATISFACTORY';
  DRILL.deb = { title: d.title, score, v, lines, hc: D.hc };
  DRILL.on = null;
  DRILL.D = null;
  SND.tone(660, 990, 0.3, 0.12, 'sine');
  note(d.title.toUpperCase() + ': ' + v + ' (' + score + ')');
  drillSay(d.stn === 2 ? 'CHIEF ENGINEER' : 'CAPTAIN', d.title.toUpperCase() + ' COMPLETE. ' + v + '.');
}
/* the station's keys while a drill (or its list) is up: true when used */
function drillKey(code, rep) {
  if (code === 'KeyT') return rep || drillToggle() !== false;
  if (DRILL.menu) {
    const L = drillList();
    if (code === 'KeyQ' || code === 'KeyE') return rep || ((DRILL.sel = (DRILL.sel + (code === 'KeyE' ? 1 : -1) + L.length) % L.length), true);
    if (code === 'Space') return rep || (drillStart(L[DRILL.sel].id), true);
    return false;
  }
  if (DRILL.on && DRILL.on.key) return DRILL.on.key(DRILL.D, code, rep) === true;
  if (dcxLive()) return dcxKey(code, rep);
  return false;
}
/* each frame */
function drillStep(dt, here) {
  if (DRILL.on || DRILL.menu || DRILL.deb) {
    const d = DRILL.on,
      away = !here || (d ? SHIP.stn !== d.stn : SHIP.stn !== 1 && SHIP.stn !== 2);
    if (away && (d || DRILL.menu || DRILL.deb)) {
      if (d) drillAbort('DRILL BROKEN OFF - YOU LEFT YOUR STATION');
      DRILL.menu = false;
      DRILL.deb = null;
    }
  }
  if (DRILL.on && started && !paused && !crashed) {
    DRILL.D.t += dt;
    DRILL.on.step(DRILL.D, dt);
  }
  drillBox(here);
}
/* the drill box: the instructor's word, the drill's own picture, the debrief */
function drillBox(here) {
  let el = $$('drillBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'drillBox';
    el.style.cssText =
      'position:fixed;top:96px;left:50%;transform:translateX(-50%);width:min(540px,92vw);background:rgba(12,20,28,.86);color:#dfe6e8;font:13px/1.45 ui-monospace,Consolas,monospace;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.18);z-index:6;pointer-events:none';
    el.innerHTML = '<div id="drillTx"></div><canvas id="drillCv" width="500" height="150" style="display:none;width:100%;margin-top:6px;border-radius:4px;background:#0b1218"></canvas>';
    document.body.appendChild(el);
  }
  const live = !DRILL.on && !DRILL.menu && dcxLive() /* in action: the engineer's repair jobs */,
    show = here && (DRILL.on || DRILL.menu || DRILL.deb || live) && !paused && (SHIP.stn === 1 || SHIP.stn === 2);
  el.style.display = show ? 'block' : 'none';
  if (!show) return;
  const now = performance.now();
  if (now - DRILL.boxT < 80) return;
  DRILL.boxT = now;
  const tx = $$('drillTx'),
    cv = $$('drillCv'),
    T = '<b>' + kbText('targets') + '</b>';
  let h = '',
    pic = null;
  if (live) {
    h = '<b style="color:#ff8a6a">DAMAGE CONTROL - ENGINE ROOM</b><br>' + dcxText();
    pic = { draw: () => dcxDraw(cv.getContext('2d'), cv.width, cv.height) };
  } else if (DRILL.menu) {
    h = '<b style="color:#9fc3d6">TRAINING DRILLS - ' + (SHIP.stn === 2 ? 'ENGINEERING' : 'OFFICER OF THE DECK') + '</b>';
    drillList().forEach((d, i) => {
      h += '<br>' + (i === DRILL.sel ? '<b style="color:#ffd27a">&#9656; ' + d.title + '</b><br><span style="color:#b8c4c8">&nbsp;&nbsp;' + d.what + '</span>' : '&nbsp;&nbsp;' + d.title);
    });
    h += '<br><span style="color:#9aa"><b>Q / E</b> choose &middot; <b>Space</b> begin &middot; ' + T + ' close' + (drillHC() ? ' &middot; HARDCORE' : '') + '</span>';
  } else if (DRILL.on) {
    const d = DRILL.on;
    h = '<b style="color:#9fc3d6">DRILL - ' + d.title.toUpperCase() + '</b> <span style="color:#9aa">' + fmtT(DRILL.D.t) + (DRILL.D.hc ? ' &middot; HARDCORE' : '') + '</span><br>' + d.box(DRILL.D);
    if (d.draw) pic = d;
  } else if (DRILL.deb) {
    const b = DRILL.deb,
      col = b.v === 'EXCELLENT' ? '#8fe39a' : b.v === 'SATISFACTORY' ? '#ffd27a' : '#ff8a6a';
    h =
      '<b style="color:#9fc3d6">' + b.title.toUpperCase() + ' - ASSESSMENT</b>' + (b.hc ? ' <span style="color:#9aa">HARDCORE</span>' : '') +
      '<br><b style="font-size:17px;color:' + col + '">' + b.v + ' &middot; ' + b.score + '/100</b>' +
      b.lines.map((l) => '<br>' + l).join('') +
      '<br><span style="color:#9aa">' + T + ' another drill</span>';
  }
  tx.innerHTML = h;
  cv.style.display = pic ? 'block' : 'none';
  if (pic) {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    pic.draw(DRILL.D, g, cv.width, cv.height);
  }
}
/* a mark out of full for one measure: full at or better than `good`, nothing at or worse than `bad` */
const drillMark = (x, good, bad, full) => full * Math.max(0, Math.min(1, (bad - x) / (bad - good)));
/* a timing bar (the wrench, the shoring maul): a marker sweeps to and fro; Space when it is in the green */
function drillBar(g, w, h, y, B, label) {
  const x0 = 20,
    x1 = w - 20,
    bw = x1 - x0;
  g.fillStyle = '#1c2a33';
  g.fillRect(x0, y, bw, 14);
  g.fillStyle = '#2f7d3f';
  g.fillRect(x0 + bw * (B.c - B.w / 2), y, bw * B.w, 14);
  g.fillStyle = '#ffd27a';
  g.fillRect(x0 + bw * B.x - 2, y - 3, 4, 20);
  g.fillStyle = '#b8c4c8';
  g.font = '12px monospace';
  g.fillText(label, x0, y - 6);
}
/* the bar's marker: a smooth sweep, faster in Hardcore */
const barMake = (D, w) => ({ x: 0, dir: 1, c: 0.25 + Math.random() * 0.5, w: D.hc ? w * 0.55 : w, sp: D.hc ? 1.25 : 0.8 });
function barStep(B, dt) {
  B.x += B.dir * B.sp * dt;
  if (B.x > 1) (B.x = 1), (B.dir = -1);
  if (B.x < 0) (B.x = 0), (B.dir = 1);
}
const barHit = (B) => Math.abs(B.x - B.c) <= B.w / 2;
