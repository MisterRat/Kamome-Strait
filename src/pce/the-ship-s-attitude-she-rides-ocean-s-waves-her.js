/* the ship's attitude: she rides OCEAN's waves through the shared RIDE module (heave, pitch and roll with the lag of a heavy hull), plus a
   little heel outward in a turn. Places the model; her wake is OCEAN's foam trail (the P-51's painted wake is not used for her). */
RIDE.init(SHIPW, 24, 4.5, 8); /* her bow and stern samples 24 m out, the sides 4.5 m: about 0.43 of her 56 m and 0.45 of her 10 m beam */
function shipPose(dt) {
  const t = OCEAN.U.uTime.value;
  RIDE.step(SHIPW, pos.x, pos.z, -Math.sin(SHIP.hdg), -Math.cos(SHIP.hdg), dt, -SHIP.r * SHIP.u * 0.8);
  /* the Wave motion setting: the ship is eased level (and to the still waterline) when it is off, or off at the guns and the player is on one */
  const wm = FM.use('sea') ? 'on' : WAVE.mode /* Hardcore: the sea always moves her */,
    wk = wm === 'off' || (wm === 'guns' && GUN.cur && camMode == 1) ? 0 : 1;
  SHIPW.k += (wk - SHIPW.k) * Math.min(1, dt * 1.5);
  pos.y = SHIPM.Y + SHIPW.hv * SHIPW.k;
  SHIP.E.set(SHIPW.pi * SHIPW.k, SHIP.hdg, SHIPW.ro * SHIPW.k, 'YXZ');
  q.setFromEuler(SHIP.E);
  axes();
  /* her hull in the sea (OCEAN.hull): a manned ship, so no water anywhere inside her, with her bow wave and wake */
  const hh = SHIPM.hull || (SHIPM.hull = OCEAN.hull({ kind: 'pce', cut: 'all', foam: true, trail: true, fore: 27, aft: 26 }));
  OCEAN.place(hh, pos.x, pos.z, -Math.sin(SHIP.hdg), -Math.cos(SHIP.hdg), SHIP.u, SHIPM.Y, t);
  HULLM.uHM.value.set(pos.x, pos.z, SHIP.hdg, 1);
  const m = SHIPM.mesh;
  if (!m) return;
  m.matrixAutoUpdate = true; /* the scenery's matrices were frozen when it was built */
  m.position.copy(pos);
  m.quaternion.copy(q).multiply(SHIP.QB);
  if (SHIPM.wake) SHIPM.wake.visible = false;
}
let shipHudT = 0;
function shipOrder() {
  const t = SHIP.tel;
  if (t === 0) return 'ALL STOP';
  if (t < 0) return t > -0.17 ? 'BACK 1/3' : t > -0.34 ? 'BACK 2/3' : 'BACK FULL';
  return t < 0.3 ? 'AHEAD 1/3' : t < 0.55 ? 'AHEAD 2/3' : t < 0.85 ? 'AHEAD STANDARD' : t < 0.98 ? 'AHEAD FULL' : 'AHEAD FLANK';
}
function shipHUD() {
  const now = performance.now();
  if (now - shipHudT < 100) return;
  shipHudT = now;
  const kn = SHIP.u / 0.5144,
    hd = ((((-SHIP.hdg * 180) / Math.PI) % 360) + 360) % 360,
    rd = Math.round(SHIP.rud * 35),
    rs = rd === 0 ? 'AMIDSHIPS' : (rd > 0 ? 'RIGHT ' : 'LEFT ') + Math.abs(rd) + '&deg;';
  hud.innerHTML = MOB
    ? `<b>${kn.toFixed(1)}</b> kn &nbsp;HDG <b>${Math.round(hd).toString().padStart(3, '0')}</b>&deg;<br>${shipOrder()} &middot; ${rs}`
    : `SPEED <b>${kn.toFixed(1)}</b> kn<br>HEADING <b>${Math.round(hd).toString().padStart(3, '0')}</b>&deg;<br>ENGINES <b>${shipOrder()}</b><br>RUDDER <b>${rs}</b>`;
  if (GUN.cur && camMode == 1) hud.innerHTML += gunHUD();
  else if (camMode == 1 && !MOB) hud.innerHTML += stnHUD();
  helpBox();
  warn.style.display = SHIP.aground ? 'block' : 'none';
  warn.textContent = 'AGROUND - BACK HER OFF';
  $$('dmgHud').style.display = 'none';
  drawCompass(hd);
  tqf.style.height = tqh.style.bottom = Math.abs(SHIP.tel) * 100 + '%';
  tqv.textContent = SHIP.tel < 0 ? 'ASTERN' : Math.round(SHIP.tel * 100) + '%';
  if (MOB) updTouchUI();
}

