/* Hardcore: walking the deck. W / S forward and back, A / D sidestep, Shift runs, the mouse (drag) turns his head */
function tpWalk(dt) {
  SHIP.look[0] += viewYaw;
  SHIP.look[1] = Math.max(-1.2, Math.min(1.0, SHIP.look[1] + viewPitch));
  viewYaw = viewPitch = 0;
  const a = SHIP.look[0],
    fw = kb('thrUp') - kb('thrDn') + (pad.ly ? -pad.ly : 0),
    sd = kb('rollR') - kb('rollL'),
    p = TPW.p;
  if (fw || sd) {
    const n = Math.hypot(fw, sd),
      sp = (keys.ShiftLeft || keys.ShiftRight ? 3.6 : 1.5) * (1 - 0.4 * Math.min(1, Math.abs(SHIPW.ro * SHIPW.k) * 5)) /* the roll slows him */,
      dx = ((Math.cos(a) * fw - Math.sin(a) * sd) / n) * sp * dt,
      dz = ((Math.sin(a) * fw + Math.cos(a) * sd) / n) * sp * dt;
    if (tpFree(p.x + dx, p.y + dz)) p.set(p.x + dx, p.y + dz);
    else if (tpFree(p.x + dx, p.y)) p.x += dx;
    else if (tpFree(p.x, p.y + dz)) p.y += dz;
    TPW.bob += sp * dt * 2.2;
  }
  const f = tpFX(p.x);
  SHIP.EYE.set(p.y, tpDeck(f) + 1.65 + Math.sin(TPW.bob * 2) * 0.03, -p.x);
  const at = tpNear();
  if (at !== TPW.at && at >= 0) note(tpList()[at].name), tpFill(at);
  TPW.at = at;
  if (at >= 0) SHIP.sub = at;
}

