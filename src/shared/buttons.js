/* ---- buttons ---- */
/* a simulator may give a button its own meaning (its role's touchBtn(id, down): true = handled); a page without the button skips it */
function holdBtn(id, down, up) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (e) => {
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {
        /* the pointer was already released: harmless */
      }
      el.classList.add('on');
      if (!SIMS.cur.touchBtn(id, true)) down();
    },
    off = () => {
      if (el.classList.contains('on')) {
        el.classList.remove('on');
        if (!SIMS.cur.touchBtn(id, false)) up();
      }
    };
  el.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, off));
}
function tapBtn(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.classList.add('on');
    if (!SIMS.cur.touchBtn(id, true)) fn();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    el.addEventListener(ev, () => el.classList.remove('on')),
  );
}
holdBtn(
  'tFire',
  () => kd(BI.guns.kb[0], true),
  () => kd(BI.guns.kb[0], false),
);
holdBtn(
  'tBrk',
  () => kd(BI.brake.kb[0], true),
  () => kd(BI.brake.kb[0], false),
);
holdBtn(
  'tRL',
  () => (TC.btnY = -1),
  () => {
    if (TC.btnY < 0) TC.btnY = 0;
  },
);
holdBtn(
  'tRR',
  () => (TC.btnY = 1),
  () => {
    if (TC.btnY > 0) TC.btnY = 0;
  },
);
tapBtn('tRkt', () => {
  kd(BI.rocket.kb[0], true);
  kd(BI.rocket.kb[0], false);
});
tapBtn('tBmb', () => {
  kd(BI.bomb.kb[0], true);
  kd(BI.bomb.kb[0], false);
});
tapBtn('tGear', () => {
  kd(BI.gear.kb[0], true);
  kd(BI.gear.kb[0], false);
});
tapBtn('tFlU', () => {
  kd(BI.flapUp.kb[0], true);
  kd(BI.flapUp.kb[0], false);
});
tapBtn('tFlD', () => {
  kd(BI.flapDn.kb[0], true);
  kd(BI.flapDn.kb[0], false);
});
tapBtn('tMenu', () => {
  kd(BI.missions.kb[0], true);
  kd(BI.missions.kb[0], false);
});
tapBtn('tPause', () => {
  kd(BI.pause.kb[0], true);
  kd(BI.pause.kb[0], false);
});
tapBtn('tCam', () => {
  kd(BI.camera.kb[0], true);
  kd(BI.camera.kb[0], false);
});
tapBtn('tCal', () => {
  if (TC.state === 'ok') {
    calibrate();
  } else note('TILT IS OFF - open the settings');
});
tapBtn('tSet', () => openTset(true));
tapBtn('tFs', () => toggleFS());
