/* The pause button must never be lost (it leads to Exit, Resume and Reset positions): if the top bar is not fully on screen
   - after a window size change, a rotation, or a layout saved at another size - put every box back where it started. */
UI.ensureReachable = () => {
  const b = $$('tPause').getBoundingClientRect();
  if (!MOB || !b.width) return;
  const vw = innerWidth,
    vh = innerHeight;
  if (b.left < -1 || b.top < -1 || b.right > vw + 1 || b.bottom > vh + 1) {
    UI.resetPos();
    note('LAYOUT RESET - the pause button was off screen');
  }
};
UI.clampAll = () => {
  UI.MV.forEach(UI.clamp);
  UI.ensureReachable();
};
UI.resetPos = () => {
  UI.all[UI.key()] = {};
  UI.pos = UI.all[UI.key()];
  UI.applyAll();
  UI.savePos();
};
UI.MV.forEach((id) => $$(id).classList.add('mv'));
UI.loadPos();
UI.applyAll();
setTimeout(() => {
  UI.clampAll();
  UI.savePos();
}, 400);
{
  let rz = 0;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      UI.loadPos();
      UI.applyAll();
      UI.clampAll();
    }, 120);
  });
}
let mvDrag = null;
document.addEventListener(
  'pointerdown',
  (e) => {
    if (!UI.editing) return;
    const tg = e.target.closest ? e.target : null;
    if (!tg || tg.closest('#edBar')) return;
    e.preventDefault();
    e.stopPropagation();
    const t = tg.closest('.mv');
    if (!t || mvDrag) return;
    const o = UI.off(t.id);
    mvDrag = { id: t.id, pid: e.pointerId, x: e.clientX, y: e.clientY, ox: o[0], oy: o[1] };
  },
  true,
);
document.addEventListener(
  'pointermove',
  (e) => {
    if (!mvDrag || e.pointerId !== mvDrag.pid) return;
    e.preventDefault();
    UI.pos[mvDrag.id] = [Math.round(mvDrag.ox + e.clientX - mvDrag.x), Math.round(mvDrag.oy + e.clientY - mvDrag.y)];
    UI.applyPos(mvDrag.id);
  },
  true,
);
const mvEnd = (e) => {
  if (!mvDrag || e.pointerId !== mvDrag.pid) return;
  UI.clamp(mvDrag.id);
  UI.savePos();
  mvDrag = null;
};
document.addEventListener('pointerup', mvEnd, true);
document.addEventListener('pointercancel', mvEnd, true);
document.addEventListener(
  'click',
  (e) => {
    if (UI.editing && e.target.closest && !e.target.closest('#edBar')) {
      e.stopPropagation();
      e.preventDefault();
    }
  },
  true,
);
function editLayout(v) {
  v = !!v;
  if (v === UI.editing) return;
  UI.editing = v;
  document.body.classList.toggle('editing', v);
  if (v) {
    pmOpen = false;
    $$('pm').style.display = 'none';
    if (trn.mode === 'free')
      coach('MISSION COACH', 'Instructions for the trainers appear here.', 'Drag any box to move it.', 'ok');
  } else {
    mvDrag = null;
    UI.savePos();
    if (trn.mode === 'free') coachHide();
    pmOpen = true;
    $$('pm').style.display = 'flex';
    pmBuild();
  }
}
$$('pmMove').onclick = () => editLayout(true);
$$('pmRePos').onclick = () => UI.resetPos();
$$('edDone').onclick = () => editLayout(false);
$$('edReset').onclick = () => UI.resetPos();

