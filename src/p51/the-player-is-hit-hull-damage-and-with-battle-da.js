/* the player is hit: hull damage, and (with battle damage on) one system is hurt */
function playerHit(k, sysP) {
  php -= DIFF.dmg * (k || 1);
  hitF = 0.9;
  buzz(35);
  SND.hit();
  if (DM.on && (sysP == null || Math.random() < sysP)) {
    const r = Math.random(),
      d = 0.18 + Math.random() * 0.2,
      up = (k) => (DM[k] = Math.min(1, DM[k] + d));
    let msg;
    if (r < 0.3) {
      up('eng');
      msg = DM.eng >= 1 ? 'ENGINE DESTROYED' : 'ENGINE HIT';
    } else if (r < 0.5) {
      up('wl');
      msg = 'LEFT WING HIT - AILERON DAMAGED';
    } else if (r < 0.7) {
      up('wr');
      msg = 'RIGHT WING HIT - AILERON DAMAGED';
    } else if (r < 0.85) {
      up('tail');
      msg = 'TAIL HIT - ELEVATOR AND RUDDER DAMAGED';
    } else if (r < 0.93) {
      DM.leak = true;
      msg = 'FUEL TANK HIT - LEAKING';
    } else {
      DM.hyd = true;
      msg = 'HYDRAULICS HIT - FLAPS JAMMED, GEAR WILL NOT RETRACT';
    }
    DM.healT = 0;
    note(msg);
    if (!DM.fire && (DM.eng > 0.6 || php < 30) && Math.random() < 0.4) {
      DM.fire = true;
      DM.snuff = 0;
      note('ENGINE FIRE - DIVE TO PUT IT OUT, OR BAIL OUT (J twice)');
    }
  }
  if (php <= 0) {
    php = 0;
    crash('SHOT DOWN');
  }
}
