/* ---- throttle slider ---- */
{
  const el = $$('tThr'),
    set = (e) => {
      const r = el.getBoundingClientRect();
      let v = 1 - (e.clientY - r.top) / r.height;
      if (v < 0.06) v = 0;
      if (v > 0.94) v = 1;
      thr = Math.max(0, Math.min(1, v));
    };
  let on = false;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {
      /* the pointer was already released: harmless */
    }
    on = true;
    set(e);
  });
  el.addEventListener('pointermove', (e) => {
    if (on) set(e);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, () => (on = false)));
}
