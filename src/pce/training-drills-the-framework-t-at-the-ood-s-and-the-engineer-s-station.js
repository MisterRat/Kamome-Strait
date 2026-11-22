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
/* the station's other boxes, shown in the drill box when no drill, list or debrief is up: { stn, show() -> bool, html() -> html,
   draw(g, w, h) (optional) }: the engineer's repair jobs, the OOD's orders */
var DRILLP = [];
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
  DRILL.on = null;
  DRILL.D = null;
  drillReport(d.title, score, lines, D.hc, d.stn, ' COMPLETE. ');
}
/* an assessment in the box (a drill's, or the OOD's attack in action): its title, score (0..100) and lines */
function drillReport(title, score, lines, hc, stn, said, act) {
  score = Math.max(0, Math.min(100, Math.round(score)));
  const v = score >= 85 ? 'EXCELLENT' : score >= 60 ? 'SATISFACTORY' : 'UNSATISFACTORY';
  DRILL.deb = { title, score, v, lines, hc, act };
  SND.tone(660, 990, 0.3, 0.12, 'sine');
  note(title.toUpperCase() + ': ' + v + ' (' + score + ')');
  drillSay(stn === 2 ? 'CHIEF ENGINEER' : 'CAPTAIN', title.toUpperCase() + (said || '. ') + v + '.');
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
  /* the OOD's orders, in a drill too (the user's, 2026-11-22): G opens them; while open they take Q / E / Space */
  if (SHIP.stn === 1 && DRILL.on && (code === 'KeyG' || OODO.menu) && ordKey(code, rep)) return true;
  if (DRILL.on && DRILL.on.key) return DRILL.on.key(DRILL.D, code, rep) === true;
  if (dcxLive()) return dcxKey(code, rep);
  if (SHIP.stn === 1) return ordKey(code, rep);
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
/* the boxes on screen (the user's, 2026-11-22: at the OOD's station the orders and a drill both open at once, the orders on the left
   and the drill on the right; the backgrounds 10% more see-through). drillBox: a drill's list, the drill itself, its assessment (and at
   station 2 the repair jobs, as before); ordBox: the OOD's orders */
function dbEl(id) {
  let el = $$(id);
  if (el) return el;
  el = document.createElement('div');
  el.id = id;
  el.style.cssText =
    'position:fixed;top:96px;left:50%;transform:translateX(-50%);width:min(540px,92vw);background:rgba(12,20,28,.76);color:#dfe6e8;font:13px/1.45 ui-monospace,Consolas,monospace;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.18);z-index:6;pointer-events:none';
  el.innerHTML =
    '<style>#' + id + ' .dbI{border-radius:3px;padding:0 3px;margin:0 -3px}#' + id + '.clk .dbI{cursor:pointer}#' + id + '.clk .dbI:hover{background:rgba(255,210,122,.16)}</style>' +
    '<div class="tx"></div><canvas width="500" height="150" style="display:none;width:100%;margin-top:6px;border-radius:4px;background:rgba(11,18,24,.85)"></canvas>';
  document.body.appendChild(el);
  /* the mouse on a list (the user's, 2026-11-22): a click on a line (data-i) chooses it and acts, as Space does. On mousedown: the
     box is redrawn several times a second, so a click's press and release may fall on different copies of the line */
  el.addEventListener('mousedown', (e) => {
    const it = e.target.closest('.dbI');
    e.stopPropagation();
    e.preventDefault();
    if (!it || e.button !== 0) return;
    const i = +it.dataset.i;
    if (el.dataset.role === 'menu') {
      const L = drillList();
      if (L[i]) ((DRILL.sel = i), drillStart(L[i].id));
    } else if (el.dataset.role === 'live' && DRILL.click) DRILL.click(i);
    DRILL.boxT = 0;
  });
  return el;
}
/* one box: shown or not, where (left, right or centred), what it says and draws, and what a click does */
function dbShow(id, c, place) {
  const el = dbEl(id);
  el.style.display = c ? 'block' : 'none';
  if (!c) return;
  if (el.dataset.place !== place) {
    el.dataset.place = place;
    const side = { left: '12px', right: 'auto', top: '160px', bottom: 'auto', transform: 'none', width: 'min(440px,42vw)' };
    Object.assign(
      el.style,
      place === 'left'
        ? side
        : place === 'right'
          ? { ...side, left: 'auto', right: '12px', top: '212px' /* under the minimap */ }
          : place === 'bottom'
            ? { left: '50%', right: 'auto', top: 'auto', bottom: '12px', transform: 'translateX(-50%)', width: 'min(420px,36vw)' }
            : { left: '50%', right: 'auto', top: '96px', bottom: 'auto', transform: 'translateX(-50%)', width: 'min(540px,92vw)' },
    );
  }
  el.dataset.role = c.role || '';
  const clk = !!c.role;
  el.classList.toggle('clk', clk);
  el.style.pointerEvents = clk ? 'auto' : 'none';
  el.querySelector('.tx').innerHTML = c.h;
  const cv = el.querySelector('canvas');
  cv.style.display = c.pic ? 'block' : 'none';
  if (c.pic) {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    c.pic(g, cv.width, cv.height);
  }
}
/* what the drill box says: the list, the drill, the assessment; or null */
function drillContent() {
  const T = '<b>' + kbText('targets') + '</b>';
  if (DRILL.menu) {
    let h = '<b style="color:#9fc3d6">TRAINING DRILLS - ' + (SHIP.stn === 2 ? 'ENGINEERING' : 'OFFICER OF THE DECK') + '</b>';
    drillList().forEach((d, i) => {
      h += '<div class="dbI" data-i="' + i + '">' + (i === DRILL.sel ? '<b style="color:#ffd27a">&#9656; ' + d.title + '</b><br><span style="color:#b8c4c8">&nbsp;&nbsp;' + d.what + '</span>' : '&nbsp;&nbsp;' + d.title) + '</div>';
    });
    h += '<span style="color:#9aa"><b>Q / E</b> choose &middot; <b>Space</b> begin (or click it) &middot; ' + T + ' close' + (drillHC() ? ' &middot; HARDCORE' : '') + '</span>';
    return { h, role: 'menu' };
  }
  if (DRILL.on) {
    const d = DRILL.on;
    return {
      h: '<b style="color:#9fc3d6">DRILL - ' + d.title.toUpperCase() + '</b> <span style="color:#9aa">' + fmtT(DRILL.D.t) + (DRILL.D.hc ? ' &middot; HARDCORE' : '') + '</span><br>' + d.box(DRILL.D),
      pic: d.draw ? (g, w, h) => d.draw(DRILL.D, g, w, h) : null,
    };
  }
  if (DRILL.deb) {
    const b = DRILL.deb,
      col = b.v === 'EXCELLENT' ? '#8fe39a' : b.v === 'SATISFACTORY' ? '#ffd27a' : '#ff8a6a';
    return {
      h:
        '<b style="color:#9fc3d6">' + b.title.toUpperCase() + ' - ASSESSMENT</b>' + (b.hc ? ' <span style="color:#9aa">HARDCORE</span>' : '') +
        '<br><b style="font-size:17px;color:' + col + '">' + b.v + ' &middot; ' + b.score + '/100</b>' +
        b.lines.map((l) => '<br>' + l).join('') +
        '<br><span style="color:#9aa">' + (b.act ? '<b>G</b> your orders &middot; ' + T + ' training drills' : T + ' another drill') + '</span>',
    };
  }
  return null;
}
function drillBox(here) {
  const st = SHIP.stn,
    on = here && !paused && (st === 1 || st === 2);
  /* the station's other box (the repair jobs; the orders, in a drill too) */
  const live = on && !DRILL.menu ? DRILLP.find((p) => p.stn === st && p.show() && (!DRILL.on || p.inDrill)) : null;
  DRILL.click = live && live.click ? live.click : null;
  const now = performance.now();
  if (now - DRILL.boxT < 80 && on) return;
  DRILL.boxT = now;
  const D = on ? drillContent() : null,
    L = live && { h: live.html(), pic: live.draw && (!live.pic || live.pic()) ? live.draw : null, role: live.click ? 'live' : '' };
  if (st === 1) {
    /* the OOD: his orders on the left, a drill on the right, both at once; the one picture (the drill's, else the sonar plot) in its
       own box at the bottom in the middle (the user's, 2026-11-22: the plot once, not in both) */
    const pic = (D && D.pic) || (L && L.pic);
    dbShow('ordBox', L && { ...L, pic: null }, 'left');
    dbShow('drillBox', D && { ...D, pic: null }, L ? 'right' : 'left');
    dbShow('plotBox', pic ? { h: '', pic } : null, 'bottom');
  } else {
    dbShow('ordBox', null);
    dbShow('plotBox', null);
    dbShow('drillBox', L || D, 'mid');
  }
}
DRILLP.push({
  stn: 2,
  show: () => dcxLive(),
  html: () => '<b style="color:#ff8a6a">' + (DCX.L.every((j) => DCX_K[j.k]) ? 'ENGINE ROOM' : 'DAMAGE CONTROL - ENGINE ROOM') + '</b><br>' + dcxText(),
  draw: (g, w, h) => dcxDraw(g, w, h),
});
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
