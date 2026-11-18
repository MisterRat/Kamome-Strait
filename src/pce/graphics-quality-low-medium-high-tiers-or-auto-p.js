/* ---------- graphics quality: LOW / MEDIUM / HIGH tiers, or AUTO (picks a tier and scales the resolution to hold the frame rate).
   Every heavy visual feature reads its setting from QL.t() (the active tier's row in QT), so new effects join the system
   by adding a field to QT. N cycles AUTO / LOW / MEDIUM / HIGH. The choice is saved. ---------- */
const QT = {
  low: { trees: 0.4, near: [0, 0], grass: 0, detail: 0, clouds: 0.5, shadow: false, res: 1, fx: 0 },
  medium: { trees: 0.7, near: [240, 110], grass: 0.6, detail: 1, clouds: 1, shadow: true, res: 1.25, fx: 1 },
  high: { trees: 1, near: [440, 300], grass: 1, detail: 1, clouds: 1, shadow: true, res: 2, fx: 2 },
};
const QMODES = ['auto', 'low', 'medium', 'high'];
const QL = {
  mode: QMODES.includes(store.get('pce842gfx', 'auto')) ? store.get('pce842gfx', 'auto') : 'auto',
  t() {
    return QT[this.mode === 'auto' ? (this.lite ? 'low' : 'high') : this.mode];
  },
  pr: Math.min(window.devicePixelRatio || 1, 2),
  max: Math.min(window.devicePixelRatio || 1, 2),
  acc: 0,
  n: 0,
  good: 0,
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
  if (QL.mode !== 'auto') NT.k = 1;
  NT.gx = 1e9;
  GR.gx = 1e9;
  if (typeof WORLD !== 'undefined') WORLD.setQ();
  CLOUDS.forEach((s, i) => {
    s.visible = (t.clouds >= 1 || i % 2 === 0) && s.userData.wx !== false;
  });
  CSH.rebuild();
  CSH.k.value = t.shadow ? 0.28 * WX.shK : 0;
  if (QL.mode !== 'auto') setPR(Math.min(QL.max, t.res));
  else if (QL.lite) setPR(1);
  store.set('pce842gfx', QL.mode);
}
function adaptRes(ms) {
  if (QL.mode !== 'auto' || ms > 120) return;
  QL.acc += ms;
  if (++QL.n >= 90) {
    const avg = QL.acc / QL.n;
    QL.acc = 0;
    QL.n = 0;
    if (avg > 27 && NT.k > 0.4 && NT.R > 0) {
      /* slow: first shrink the zone of detailed trees, then the resolution */
      NT.k = Math.max(0.3, NT.k - 0.35);
      NT.gx = 1e9;
      QL.good = 0;
    } else if (avg > 27 && QL.pr > 0.6) {
      setPR(QL.pr - 0.25);
      QL.good = 0;
    } else if (avg > 27 && !QL.lite) {
      QL.lite = true;
      applyQuality();
    } else if (avg < 19 && QL.pr < QL.max) {
      if (++QL.good >= 3) {
        setPR(QL.pr + 0.25);
        QL.good = 0;
      }
    } else if (avg < 19 && NT.k < 1 && NT.R > 0) {
      if (++QL.good >= 3) {
        NT.k = Math.min(1, NT.k + 0.35);
        NT.gx = 1e9;
        QL.good = 0;
      }
    } else QL.good = 0;
  }
}
applyQuality(); /* apply the saved choice at start-up */
