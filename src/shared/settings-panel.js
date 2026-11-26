/* ---- settings panel ---- */
let pausedBeforeT = false;
function openTset(v) {
  const was = $$('tset').style.display === 'flex';
  $$('tset').style.display = v ? 'flex' : 'none';
  if (v && !was) {
    pausedBeforeT = paused;
    paused = true;
  }
  if (!v && was) paused = pausedBeforeT;
  if (v) tcUI();
}
function tcUI() {
  const st = $$('tsStatus');
  if (!st) return;
  const m = {
    off: 'Tilt is off.',
    asking: 'Waiting for permission...',
    waiting: 'Move the phone: waiting for sensor data...',
    ok: 'Tilt sensors working.',
    denied: 'Permission was denied. On iPhone: Settings > Safari > Motion &amp; Orientation Access, then reload.',
    none: 'No sensor data. The page may be inside a frame that blocks sensors: open it in its own browser tab, or use the touch stick instead.',
  };
  st.innerHTML =
    (m[TC.state] || '') +
    ' Graphics: ' +
    QL.mode.toUpperCase() +
    (QL.mode === 'auto' ? ' (now ' + QL.tier().toUpperCase() + ')' : '') +
    ' ' +
    Math.round((QL.pr / QL.max) * 100) +
    '% resolution.';
  $$('tsOn').checked = TC.cfg.on;
  $$('tsGain').value = Math.round(TC.cfg.gain * 100);
  $$('tsYaw').value = Math.round(TC.cfg.yaw * 100);
  $$('tsInv').checked = TC.cfg.invP;
  $$('tsInvR').checked = TC.cfg.invR;
  const gt = $$('goTilt');
  if (gt) {
    gt.dataset.l = gt.dataset.l || gt.textContent; /* each simulator's own words on its start screen */
    gt.textContent = gt.dataset.l + (TC.state === 'ok' ? ' (ready)' : '');
  }
}
$$('tsOn').onchange = (e) => {
  TC.cfg.on = e.target.checked;
  saveCfg();
  if (TC.cfg.on) enableTilt();
  tcUI();
};
$$('tsGain').oninput = (e) => {
  TC.cfg.gain = e.target.value / 100;
  saveCfg();
};
$$('tsYaw').oninput = (e) => {
  TC.cfg.yaw = e.target.value / 100;
  saveCfg();
};
$$('tsInv').onchange = (e) => {
  TC.cfg.invP = e.target.checked;
  saveCfg();
};
$$('tsInvR').onchange = (e) => {
  TC.cfg.invR = e.target.checked;
  saveCfg();
};
$$('tsCal').onclick = () => {
  if (TC.state === 'ok') calibrate();
  else
    enableTilt().then((ok) => {
      if (ok) calibrate();
    });
};
$$('tsClose').onclick = () => openTset(false);
$$('goTilt').onclick = () => {
  enableTilt().then((ok) => {
    if (ok) setTimeout(calibrate, 50);
    $$('go').click();
  });
};
$$('go').addEventListener('click', () => {
  reqWake();
  /* phone: go fullscreen when the flight starts (this tap is the user gesture the browser requires); the pause menu can switch it off */
  if (MOB && store.get('fs', true) && !(document.fullscreenElement || document.webkitFullscreenElement)) toggleFS();
  if (MOB && TC.state === 'ok') setTimeout(calibrate, 60);
  if (MOB && innerHeight > innerWidth) {
    const r = $$('rot');
    r.style.display = 'block';
    setTimeout(() => (r.style.display = 'none'), 6000);
  }
});
$$('rot').onclick = () => ($$('rot').style.display = 'none');
$$('msg').addEventListener('click', () => {
  if (MOB && crashed) reset();
});
$$('coach').addEventListener('click', () => {
  if (MOB) coachMin = !coachMin;
});
