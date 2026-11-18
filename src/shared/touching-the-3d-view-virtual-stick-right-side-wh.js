/* ---- touching the 3D view: virtual stick (right side, when tilt is off), look around, pinch zoom, double-tap resets the view ---- */
const TP = new Map();
let tapT = 0,
  pinchPrev = 0;
function stickShow(x, y, kx, ky, v) {
  const b = $$('tBase'),
    k = $$('tKnob');
  b.style.display = k.style.display = v ? 'block' : 'none';
  if (v) {
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    k.style.left = kx + 'px';
    k.style.top = ky + 'px';
  }
}
cv.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' || docsOpen || menuOpen || UI.editing) return;
  e.preventDefault();
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {
    /* the pointer was already released: harmless */
  }
  const P = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), role: 'look' };
  const first = TP.size === 1 ? [...TP.values()][0] : null;
  if (TP.size === 0 && started && !(TC.cfg.on && TC.state === 'ok') && e.clientX > innerWidth * 0.42) P.role = 'stick';
  else if (
    first &&
    (first.role === 'look' || (first.role === 'stick' && Math.hypot(first.x - first.sx, first.y - first.sy) < 15))
  ) {
    /* a second finger = pinch (even if the first one only just touched the stick area) */
    if (first.role === 'stick') {
      TC.sr = TC.sp = 0;
      stickShow(0, 0, 0, 0, false);
    }
    P.role = 'pinch';
    first.role = 'pinch';
    pinchPrev = Math.hypot(P.x - first.x, P.y - first.y);
  }
  TP.set(e.pointerId, P);
  if (P.role === 'stick') stickShow(P.x, P.y, P.x, P.y, true);
});
cv.addEventListener('pointermove', (e) => {
  const P = TP.get(e.pointerId);
  if (!P) return;
  const dx = e.clientX - P.x,
    dy = e.clientY - P.y;
  P.x = e.clientX;
  P.y = e.clientY;
  if (P.role === 'stick') {
    const R = 58;
    let ox = P.x - P.sx,
      oy = P.y - P.sy;
    const l = Math.hypot(ox, oy);
    if (l > R) {
      ox *= R / l;
      oy *= R / l;
    }
    TC.sr = curve(ox / R) * (TC.cfg.invR ? -1 : 1);
    TC.sp = curve(oy / R) * (TC.cfg.invP ? -1 : 1);
    stickShow(P.sx, P.sy, P.sx + ox, P.sy + oy, true);
  } else if (P.role === 'pinch' && TP.size >= 2 && camMode != 1) {
    const o = [...TP.entries()].find(([k, q]) => k !== e.pointerId)[1],
      d = Math.hypot(P.x - o.x, P.y - o.y);
    if (pinchPrev > 0 && d > 0) chaseZ = Math.max(0.45, Math.min(5, (chaseZ * pinchPrev) / d));
    pinchPrev = d;
  }
}); /* pinch only changes how far behind the plane the camera sits: it never turns */
const tpEnd = (e) => {
  const P = TP.get(e.pointerId);
  if (!P) return;
  TP.delete(e.pointerId);
  if (P.role === 'stick') {
    TC.sr = TC.sp = 0;
    stickShow(0, 0, 0, 0, false);
  }
  if (P.role === 'pinch')
    TP.forEach((q) => {
      if (q.role === 'pinch') q.role = 'look';
    });
  if (P.role === 'look' && performance.now() - P.t < 250 && Math.hypot(P.x - P.sx, P.y - P.sy) < 12) {
    const n = performance.now();
    if (n - tapT < 320) {
      chaseZ = 1;
      if (orbitOn) orbReset();
      viewYaw = viewPitch = 0;
      tapT = 0;
    } else tapT = n;
  }
};
cv.addEventListener('pointerup', tpEnd);
cv.addEventListener('pointercancel', tpEnd);
cv.style.touchAction = 'none';
