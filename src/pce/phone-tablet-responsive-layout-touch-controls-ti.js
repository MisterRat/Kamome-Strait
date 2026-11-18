/* ---------- phone / tablet: responsive layout, touch controls, tilt (gyro) flying ---------- */
const HM = { pad: false }; /* which controls-help text is showing: controller or not */
const TC = {
  state: 'off',
  ev: 0,
  u: null,
  cal: null,
  last: null,
  yawAng: 0,
  tp: 0,
  tr: 0,
  ty: 0,
  sp: 0,
  sr: 0,
  btnY: 0,
  oP: 0,
  oR: 0,
  oY: 0,
  pl: false,
  cfg: { on: true, gain: 1, yaw: 1, invP: false, invR: false },
};
let MOB = false,
  coachMinSet = false,
  chaseZ = 1;
const D2R = Math.PI / 180,
  clampU = (v) => Math.max(-1, Math.min(1, v));
const curve = (v, d = 0.08) => {
  const n = Math.max(0, (Math.abs(v) - d) / (1 - d));
  return Math.sign(v) * Math.min(1, 0.35 * n + 0.65 * n * n);
};
function loadCfg() {
  Object.assign(TC.cfg, store.get('pce842tc', {}));
}
function saveCfg() {
  store.set('pce842tc', TC.cfg);
}
loadCfg();
function setMob(on) {
  MOB = on;
  document.body.classList.toggle('mob', on);
  if (on) {
    QL.max = Math.min(window.devicePixelRatio || 1, 1.5);
    applyQuality();
    if (!coachMinSet) {
      coachMin = true;
      coachMinSet = true;
    }
    if (!document.querySelector('link[rel=apple-touch-icon]')) {
      const c = document.createElement('canvas');
      c.width = c.height = 180;
      const x = c.getContext('2d');
      x.fillStyle = '#16324f';
      x.fillRect(0, 0, 180, 180);
      x.fillStyle = '#ffb43a';
      x.font = 'bold 110px sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('✈', 90, 98);
      const l = document.createElement('link');
      l.rel = 'apple-touch-icon';
      l.href = c.toDataURL();
      document.head.appendChild(l);
    }
  }
  try {
    if (typeof UI !== 'undefined' && on && !UI.hid._mob) {
      UI.hid._mob = 1;
      UI.set('cmp', false);
    }
  } catch (e) {
    logWarn('phone layout', e);
  }
  try {
    refreshHelp();
  } catch (e) {
    logWarn('help mode', e);
  }
  rs();
}
{
  let m = false;
  try {
    m =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ||
      (matchMedia('(pointer:coarse)').matches && matchMedia('(hover:none)').matches) ||
      /[?&]touch=1/.test(location.search);
  } catch (e) {
    logWarn('touch detection', e);
  }
  if (m) setMob(true);
  else
    addEventListener(
      'touchstart',
      () => {
        if (!MOB) setMob(true);
      },
      { passive: true, once: true },
    );
}
const kd = (code, down) =>
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }));
