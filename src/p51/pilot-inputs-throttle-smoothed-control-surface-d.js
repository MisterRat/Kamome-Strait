/* pilot inputs: throttle, smoothed control-surface deflections, flap limits, the inverted-flight oil limit */
function readControls(dt) {
  trimUpd(
    dt,
    kb('trimUp') - kb('trimDn') + pad.trE,
    kb('trimRR') - kb('trimRL') + pad.trR,
    kb('trimAR') - kb('trimAL') + pad.trA,
  );
  thr = Math.min(1, Math.max(0, thr + (kb('thrUp') - kb('thrDn') + pad.thr) * 0.4 * dt));
  const cl = (v) => Math.max(-1, Math.min(1, v)),
    tp = cl(kb('pitchUp') - kb('pitchDn') + pad.p + TC.oP),
    tr = cl(kb('rollR') - kb('rollL') + pad.r + TC.oR),
    ty = cl(kb('rudR') - kb('rudL') + pad.y + TC.oY);
  const a = Math.min(1, 5 * dt);
  s.p += (tp - s.p) * a;
  s.r += (tr - s.r) * a;
  s.y += (ty - s.y) * a;
  syncFlaps();
  while (flapLvl > 0 && v0() > FLIM[flapLvl]) {
    flapLvl--;
    note('FLAPS OVERSPEED - RETRACTED');
  }
  fl += Math.max(-0.5 * dt, Math.min(0.5 * dt, ANG[flapLvl] / 45 - fl));
  axes();
  if (!onGround && up.y < -0.2) invT += dt;
  else invT = Math.max(0, invT - dt * 0.5);
  if (invT > 10 && !engOut) {
    engOut = true;
    note('OIL PRESSURE LOST - ROLL UPRIGHT');
  }
  if (invT < 7) engOut = false;
}
