/* ---- tilt (gyro) controls ---- */
function oriMatrix(a, b, g) {
  const cA = Math.cos(a),
    sA = Math.sin(a),
    cB = Math.cos(b),
    sB = Math.sin(b),
    cG = Math.cos(g),
    sG = Math.sin(g);
  return [
    [cA * cG - sA * sB * sG, -cB * sA, cG * sA * sB + cA * sG],
    [cG * sA + cA * sB * sG, cA * cB, sA * sG - cA * cG * sB],
    [-cB * sG, sB, cB * cG],
  ];
} /* device -> earth (W3C Z-X'-Y'') */
function calibrate() {
  const u = TC.u;
  if (!u) return;
  const rx = Math.hypot(u[0], u[1]);
  let up, rt;
  if (rx > 0.35) {
    up = [u[0] / rx, u[1] / rx, 0];
    rt = [up[1], -up[0], 0];
  } /* the way you hold it: screen "up" is gravity projected on the screen */
  else {
    const ang =
      ((((screen.orientation && screen.orientation.angle) != null
        ? screen.orientation.angle
        : window.orientation || 0) %
        360) +
        360) %
      360;
    up = ang === 90 ? [1, 0, 0] : ang === 180 ? [0, -1, 0] : ang === 270 ? [-1, 0, 0] : [0, 1, 0];
    rt = [up[1], -up[0], 0];
  }
  const ux = u[0] * rt[0] + u[1] * rt[1],
    uy = u[0] * up[0] + u[1] * up[1];
  TC.cal = { up, rt, roll: Math.atan2(-ux, uy), pitch: Math.asin(clampU(u[2])) };
  TC.yawAng = 0;
  note('TILT CALIBRATED');
  tcUI();
}
function onOri(e) {
  if (e.alpha == null && e.beta == null && e.gamma == null) return;
  TC.ev++;
  const R = oriMatrix((e.alpha || 0) * D2R, (e.beta || 0) * D2R, (e.gamma || 0) * D2R),
    u = [R[2][0], R[2][1], R[2][2]],
    t = e.timeStamp || performance.now();
  TC.u = u;
  if (TC.state !== 'ok') {
    TC.state = 'ok';
    tcUI();
  }
  if (TC.last && TC.cal) {
    const P = TC.last.R,
      dt = Math.max(0.004, Math.min(2, (t - TC.last.t) / 1000)),
      rr = (i, j) => P[0][i] * R[0][j] + P[1][i] * R[1][j] + P[2][i] * R[2][j],
      a = TC.cal.up,
      wx = (rr(2, 1) - rr(1, 2)) / 2,
      wy = (rr(0, 2) - rr(2, 0)) / 2,
      wz = (rr(1, 0) - rr(0, 1)) / 2,
      dpsi =
        wx * a[0] +
        wy * a[1] +
        wz * a[2]; /* twist about the screen's own up axis, counter-clockwise from above is +  */
    TC.yawAng = TC.yawAng * Math.exp(-dt / 3) - dpsi;
  } /* washes out over ~3 s; twisting right is + */
  TC.last = { R, t };
  if (!TC.cal) calibrate();
  const C = TC.cal,
    ux = u[0] * C.rt[0] + u[1] * C.rt[1],
    uy = u[0] * C.up[0] + u[1] * C.up[1],
    g = TC.cfg.gain;
  let roll = TC.rollPrev || 0;
  if (Math.hypot(ux, uy) > 0.2) roll = Math.atan2(-ux, uy);
  TC.rollPrev = roll;
  let dr = roll - C.roll;
  dr = Math.atan2(Math.sin(dr), Math.cos(dr));
  const dp = -(Math.asin(clampU(u[2])) - C.pitch);
  const tr = curve(dr / ((30 * D2R) / g)) * (TC.cfg.invR ? -1 : 1),
    tp = curve(dp / ((22 * D2R) / g)) * (TC.cfg.invP ? -1 : 1),
    ty = TC.cfg.yaw > 0 ? curve(TC.yawAng / ((25 * D2R) / TC.cfg.yaw), 0.1) : 0;
  TC.tr += (tr - TC.tr) * 0.45;
  TC.tp += (tp - TC.tp) * 0.45;
  TC.ty += (ty - TC.ty) * 0.45;
}
async function enableTilt() {
  if (TC.state === 'ok') {
    TC.cfg.on = true;
    saveCfg();
    tcUI();
    return true;
  }
  TC.cfg.on = true;
  saveCfg();
  TC.state = 'asking';
  tcUI();
  try {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== 'granted') {
        TC.state = 'denied';
        tcUI();
        return false;
      }
    }
  } catch (err) {
    TC.state = 'denied';
    tcUI();
    return false;
  }
  if (!TC.listening) {
    addEventListener('deviceorientation', onOri, true);
    TC.listening = true;
  }
  TC.state = 'waiting';
  tcUI();
  TC.ev = 0;
  await new Promise((r) => setTimeout(r, 1800));
  if (TC.ev === 0 && TC.state !== 'ok') {
    TC.state = 'none';
    tcUI();
    return false;
  }
  return true;
}
addEventListener('orientationchange', () => {
  TC.cal = null;
});
if (screen.orientation)
  screen.orientation.addEventListener('change', () => {
    TC.cal = null;
  });
