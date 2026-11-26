/* ---------- graphics quality: LOW / MEDIUM / HIGH tiers, or AUTO (picks a tier and scales the resolution to hold the frame rate).
   Every heavy visual feature reads its setting from QL.t() (the active tier's row in QT), so new effects join the system
   by adding a field to QT. N cycles AUTO / LOW / MEDIUM / HIGH. The choice is saved. ---------- */
const QT = {
  low: { trees: 0.4, near: [0, 0], grass: 0, detail: 0, clouds: 0.5, shadow: false, res: 1, fx: 0 },
  medium: { trees: 0.7, near: [240, 110], grass: 0.6, detail: 1, clouds: 1, shadow: true, res: 1.25, fx: 1 },
  high: { trees: 1, near: [440, 300], grass: 1, detail: 1, clouds: 1, shadow: true, res: 2, fx: 2 },
};
const QMODES = ['auto', 'low', 'medium', 'high'];
/* AUTO's ladder (the user's, 2026-11-25: on a cheap PC auto went below Low, yet Low played fine). It steps through the tiers first and
   never goes below Low itself: [tier, pixel ratio (capped at the screen's)]. */
const QLAD = [
  ['high', 2],
  ['high', 1.5],
  ['medium', 1.25],
  ['medium', 1],
  ['low', 1],
];
const QL = {
  mode: QMODES.includes(store.get('gfx', 'auto')) ? store.get('gfx', 'auto') : 'auto',
  lv: Math.max(0, Math.min(QLAD.length - 1, store.get('gfxlv', 0) | 0)) /* AUTO: where it stands on the ladder (it starts where it last settled) */,
  t() {
    return QT[this.mode === 'auto' ? QLAD[this.lv][0] : this.mode];
  },
  /* the tier in force (for the settings panel) */
  tier() {
    return this.mode === 'auto' ? QLAD[this.lv][0] : this.mode;
  },
  pr: Math.min(window.devicePixelRatio || 1, 2),
  max: Math.min(window.devicePixelRatio || 1, 2),
  F: [] /* AUTO: the frame times of the window being measured */,
  wait: 8 /* AUTO: seconds to let pass before judging (shaders compiling, the world building) */,
  up: 0 /* AUTO: good windows in a row */,
  ceil: Infinity /* AUTO: a step that proved too much is not tried again for a while */,
  ceilT: 0,
};
function setPR(p) {
  p = Math.max(0.6, Math.min(QL.max, p));
  if (Math.abs(p - QL.pr) > 0.01) {
    QL.pr = p;
    R.setPixelRatio(p);
    R.setSize(innerWidth, innerHeight);
  }
}
function applyQuality() {
  const t = QL.t();
  TREEM.forEach((o) => {
    o.m.count = Math.floor(o.full * t.trees);
  });
  DETU.value = t.detail;
  OCEAN.U.uQ.value = t.fx; /* the sea's ripples and detail follow the graphics tier */
  NT.R = t.near[0]; /* the radius of the detailed trees, and how many of them at most */
  NT.cap = t.near[1];
  NT.k = 1;
  NT.gx = 1e9;
  GR.gx = 1e9;
  if (typeof WORLD !== 'undefined') WORLD.setQ();
  CLOUDS.forEach((s, i) => {
    s.visible = (t.clouds >= 1 || i % 2 === 0) && s.userData.wx !== false;
  });
  CSH.rebuild();
  CSH.k.value = t.shadow ? 0.28 * WX.shK : 0;
  setPR(Math.min(QL.max, QL.mode === 'auto' ? QLAD[QL.lv][1] : t.res));
  store.set('gfx', QL.mode);
  if (QL.mode === 'auto') store.set('gfxlv', QL.lv);
}
/* AUTO: every frame's time; judged on windows of 120 frames by the median (a loading hitch or two does not count), after the first
   seconds. Slower than 36 fps: a step down the ladder. Faster than 60 fps for three windows running: a step up, unless that step
   proved too slow in the last minute. Only while the game runs (a paused or hidden page does not count). */
function adaptRes(ms) {
  if (QL.mode !== 'auto' || ms <= 0 || ms > 250 || (typeof started !== 'undefined' && !started) || (typeof paused !== 'undefined' && paused)) return;
  if (QL.wait > 0) return void (QL.wait -= ms / 1000);
  QL.F.push(ms);
  if (QL.F.length < 120) return;
  const F = QL.F.sort((a, b) => a - b),
    med = F[F.length >> 1];
  QL.F = [];
  const now = performance.now() / 1000;
  if (now - QL.ceilT > 60) QL.ceil = Infinity;
  if (med > 27.5 && QL.lv < QLAD.length - 1) {
    QL.ceil = QL.lv;
    QL.ceilT = now;
    QL.lv++;
    QL.up = 0;
    applyQuality();
    QL.wait = 3;
  } else if (med < 16.5 && QL.lv > 0 && (QL.ceil === Infinity || QL.lv - 1 > QL.ceil)) {
    if (++QL.up >= 3) {
      QL.lv--;
      QL.up = 0;
      applyQuality();
      QL.wait = 3;
    }
  } else QL.up = 0;
}
applyQuality(); /* apply the saved choice at start-up */
