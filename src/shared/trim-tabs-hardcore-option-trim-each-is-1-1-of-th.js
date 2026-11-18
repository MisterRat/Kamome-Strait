/* trim tabs (Hardcore option 'trim'): each is -1..1 of the 10 degree tab travel on the drawing.
   e: elevator, + = nose up (the speed the aircraft holds hands-off is TRIM_V0 * exp(-0.6 e));  r: rudder, + = right;
   a: aileron, + = right wing down */
const TRIM = { e: 0, r: 0, a: 0, warn: 0 },
  TRIM_V0 = 78;
function autoTrim(vias) {
  TRIM.e = Math.max(-1, Math.min(1, -Math.log(Math.max(25, vias) / TRIM_V0) / 0.6));
  TRIM.r = FM.use('torque') ? 0.35 : 0;
  TRIM.a = 0;
}
function trimGround() {
  TRIM.e = 0.3;
  TRIM.r = FM.use('torque') ? 0.4 : 0;
  TRIM.a = 0;
} /* take-off setting: a little nose-up, rudder trimmed right against the engine torque */
function trimUpd(dt, ep, rp, ap) {
  if (!FM.use('trim')) {
    if ((ep || rp || ap) && performance.now() - TRIM.warn > 4000) {
      TRIM.warn = performance.now();
      note('TRIM WORKS IN HARDCORE MODE ONLY');
    }
    return;
  }
  const k = 0.35 * dt,
    cl = (v) => Math.max(-1, Math.min(1, v));
  TRIM.e = cl(TRIM.e + ep * k);
  TRIM.r = cl(TRIM.r + rp * k);
  TRIM.a = cl(TRIM.a + ap * k);
}
