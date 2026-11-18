/* ---- per-frame glue ---- */
function touchUpdate() {
  const act = started && !menuOpen && !pmOpen && !docsOpen && !crashed;
  const tiltOn = TC.cfg.on && TC.state === 'ok';
  let p = 0,
    r = 0,
    y = 0;
  if (act) {
    if (tiltOn) {
      p = TC.tp;
      r = TC.tr;
      y = TC.ty;
    } else {
      p = TC.sp;
      r = TC.sr;
    }
    y += TC.btnY;
  }
  TC.oP = clampU(p);
  TC.oR = clampU(r);
  TC.oY = clampU(y);
  if (started !== TC.pl) {
    TC.pl = started;
    document.body.classList.toggle('play', started);
  }
}
let tuT = 0;
function updTouchUI() {
  const n = performance.now();
  if (n - tuT < 80) return;
  tuT = n;
  $$('tThrF').style.height = $$('tThrH').style.bottom = thr * 100 + '%';
  $$('tThrL').textContent = 'THR ' + Math.round(thr * 100) + '%';
  $$('tGear').innerHTML = '<i>' + (gearOn ? '▼' : '▲') + '</i>GEAR ' + (gearOn ? 'DN' : 'UP');
  $$('tFlU').innerHTML = '<i>▲</i>FLAP ' + FL[flapLvl];
  $$('tTd').style.transform = 'translate(' + TC.oR * 13 + 'px,' + TC.oP * 13 + 'px)';
}

if (
  MOB &&
  TC.cfg.on &&
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission !== 'function'
) {
  addEventListener('deviceorientation', onOri, true);
  TC.listening = true;
  TC.state = 'waiting';
  setTimeout(() => {
    if (TC.ev === 0 && TC.state !== 'ok') {
      TC.state = 'none';
      tcUI();
    }
  }, 2500);
}
tcUI();
