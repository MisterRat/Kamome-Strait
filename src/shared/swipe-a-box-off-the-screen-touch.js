/* ---- swipe a box off the screen (touch) ---- */
function swipeAway(id) {
  const el = $$(id);
  let st = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || pmOpen || UI.editing) return;
    st = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, mv: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    st.dx = e.clientX - st.x;
    st.dy = e.clientY - st.y;
    if (!st.mv && Math.hypot(st.dx, st.dy) > 12) {
      st.mv = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* the pointer was already released: harmless */
      }
      el.style.transition = 'none';
    }
    if (st.mv) {
      const b = UI.off(id);
      el.style.translate = b[0] + st.dx + 'px ' + (b[1] + st.dy) + 'px';
      el.style.opacity = Math.max(0.2, 1 - Math.hypot(st.dx, st.dy) / 240);
    }
  });
  const end = (e) => {
    if (!st || (e && e.pointerId !== st.id)) return;
    const s = st;
    st = null;
    if (!s.mv) return;
    el._sw = true;
    setTimeout(() => {
      el._sw = false;
    }, 400);
    if (Math.hypot(s.dx, s.dy) > 70) {
      el.style.transition = 'translate .18s ease-in,opacity .18s';
      {
        const b = UI.off(id);
        el.style.translate = b[0] + s.dx * 5 + 'px ' + (b[1] + s.dy * 5) + 'px';
      }
      el.style.opacity = '0';
      setTimeout(() => {
        UI.set(id, false);
        el.style.transition = '';
        UI.applyPos(id);
        el.style.opacity = '';
        if (!UI.hint) {
          UI.hint = true;
          note('HIDDEN - bring it back from the pause menu');
        }
      }, 190);
    } else {
      el.style.transition = 'translate .15s,opacity .15s';
      UI.applyPos(id);
      el.style.opacity = '';
      setTimeout(() => {
        el.style.transition = '';
      }, 170);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener(
    'click',
    (e) => {
      if (el._sw) {
        e.stopImmediatePropagation();
        e.preventDefault();
        el._sw = false;
      }
    },
    true,
  );
}
['hud', 'cmp', 'mm', 'hz', 'adf', 'coach', 'help'].forEach(swipeAway);
refreshHelp();
