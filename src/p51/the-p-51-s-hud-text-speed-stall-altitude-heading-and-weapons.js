/* the P-51's HUD text: speed, stall, altitude, heading, weapons */
let hudT = 0;
function updHUD() {
  const nowH = performance.now();
  if (nowH - hudT < 50) return;
  hudT = nowH;
  if (noseTally) noseTally();
  const v = spd(),
    hdg = ((Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI + 360) % 360,
    agl = pos.y - H(pos.x, pos.z) - 2;
  let wxl = '';
  if (FM.use('wind')) {
    const hl_ = Math.hypot(fwd.x, fwd.z) || 1,
      rl_ = Math.hypot(right.x, right.z) || 1,
      hw_ = (-(WX.wx_ * fwd.x + WX.wz_ * fwd.z) / hl_) * 3.6,
      xw_ = ((WX.wx_ * right.x + WX.wz_ * right.z) / rl_) * 3.6,
      from_ = ((((WX.dirTo * 180) / Math.PI + 180) % 360) + 360) % 360;
    wxl += `WIND <b>${Math.round(from_).toString().padStart(3, '0')}°</b> <b>${Math.round(WX.sp * 3.6)}</b> km/h · ${hw_ >= 0 ? 'HEAD' : 'TAIL'} <b>${Math.abs(Math.round(hw_))}</b> · X <b>${xw_ >= 0 ? 'L' : 'R'}${Math.abs(Math.round(xw_))}</b><br>`;
  }
  if (FM.use('trim'))
    wxl += `TRIM E <b>${TRIM.e >= 0 ? '+' : '-'}${Math.abs(TRIM.e * 10).toFixed(0)}</b>&deg; R <b>${TRIM.r >= 0 ? 'R' : 'L'}${Math.abs(TRIM.r * 10).toFixed(0)}</b>&deg; A <b>${TRIM.a >= 0 ? 'R' : 'L'}${Math.abs(TRIM.a * 10).toFixed(0)}</b>&deg;<br>`;
  if (FM.use('ice')) wxl += `OAT <b>${Math.round(WX.oat(pos.y))}</b>°C · ICE <b>${Math.round(FM.ice * 100)}</b>%<br>`;
  if (FM.use('wet') && WX.wet > 0.2 && onGround)
    wxl += `RUNWAY <b>${WX.wet > 0.6 ? 'WET' : 'DAMP'}</b>${FM.hyd ? ' · HYDROPLANING' : ''}<br>`;
  const mph = v * 2.237,
    rpm = Math.min(3300, Math.round(700 + thr * 2300 + Math.max(0, mph - 420) * 3)),
    mp = Math.round(12 + thr * 49),
    vs = Math.round(
      Math.sqrt((9.8 * (1 + (0.25 * ((2 - bmN) * 500 + (6 - rkN) * 135)) / 9000)) / ((1.23 + 0.2 * fl) * 0.004)) * 3.6,
    );
  hud.innerHTML = `SPEED <b>${((FM.ias || v) * 3.6).toFixed(0)}</b> km/h<br>STALL <b>${vs}</b> km/h<br>ALT &nbsp;<b>${Math.round(pos.y)}</b> m<br>AGL &nbsp;<b>${Math.round(Math.max(0, agl))}</b> m<br>V/S &nbsp;<b>${vel.y.toFixed(1)}</b> m/s<br>HDG &nbsp;<b>${hdg.toFixed(0).padStart(3, '0')}°</b><br>THR &nbsp;<b>${(thr * 100).toFixed(0)}</b>% · <b>${rpm}</b> rpm · <b>${Math.round(mp * 3.386)}</b> kPa<br>G &nbsp;&nbsp;&nbsp;&nbsp;<b>${gF.toFixed(1)}</b>${FM.use('gload') ? ` (limit +${FM.lim.pos.toFixed(1)} / ${FM.lim.neg.toFixed(1)})` : ''}${FM.use('fuel') ? ` · FUEL <b>${Math.round(FM.fuel * 100)}</b>%` : ''}${FM.use('heat') ? ` · TEMP <b>${Math.round(Math.min(1, FM.eT) * 100)}</b>%` : ''}<br>${wxl}FLAP <b>${FL[flapLvl]}</b><br>GEAR <b>${gearOn ? 'DOWN' : 'UP'}</b>${onGround ? ' · GROUND' : ''}${keys.KeyB || pad.brake ? ' · BRAKE' : ''}<br>GUNS <b>${ammoTot()}</b><br>RKT <b>${6 - rkN}</b> BMB <b>${2 - bmN}</b><br>TGT <b>${T.filter((x) => x.kind == 'st' && x.dead).length}/${T.filter((x) => x.kind == 'st').length}</b><br>HULL <b>${Math.max(0, Math.round(php))}</b>%<br>AIR <b>${EN.filter((e) => !e.dying).length}</b> · KILLS <b>${airKills}</b><br>SKILL <b>${DIFF.n} ${Math.round(DIFF.f * 100)}%</b><br>GFX <b>${QL.mode.toUpperCase()}</b> ${Math.round((QL.pr / QL.max) * 100)}% res`;
  if (MOB)
    hud.innerHTML = `<b>${((FM.ias || v) * 3.6).toFixed(0)}</b> km/h &nbsp;ALT <b>${Math.round(pos.y)}</b> m &nbsp;AGL <b>${Math.round(Math.max(0, agl))}</b><br>HDG <b>${hdg.toFixed(0).padStart(3, '0')}°</b> &nbsp;STALL <b>${vs}</b> &nbsp;V/S <b>${vel.y.toFixed(1)}</b><br>THR <b>${(thr * 100).toFixed(0)}</b>%${FM.use('fuel') ? ` &nbsp;FUEL <b>${Math.round(FM.fuel * 100)}</b>%` : ''} &nbsp;G <b>${gF.toFixed(1)}</b> &nbsp;FLAP <b>${FL[flapLvl]}</b> &nbsp;${gearOn ? 'GEAR DN' : 'GEAR UP'}<br>HULL <b>${Math.max(0, Math.round(php))}</b>% &nbsp;GUNS <b>${ammoTot()}</b> &nbsp;R<b>${6 - rkN}</b> B<b>${2 - bmN}</b>`;
  const ovs = FM.red > 470,
    hiG = FM.use('gload') ? gF > 0.9 * FM.lim.pos || gF < 0.9 * FM.lim.neg : gF > 6.5;
  warn.style.display =
    ((stalled && !onGround) ||
      (agl < 150 && vel.y < -12 && !onGround) ||
      ovs ||
      engOut ||
      hiG ||
      FM.spin ||
      FM.hot ||
      FM.ice > 0.5 ||
      FM.over > 1 ||
      (FM.use('fuel') && FM.fuel <= 0)) &&
    !crashed
      ? 'block'
      : 'none';
  warn.textContent =
    FM.over > 1
      ? 'OVERSTRESS - EASE OFF THE STICK'
      : FM.spin
        ? 'SPIN - OPPOSITE RUDDER, STICK FORWARD'
        : stalled
          ? 'STALL'
          : FM.hot
            ? 'ENGINE OVERHEAT - REDUCE POWER'
            : FM.ice > 0.5
              ? 'ICING - LEAVE THE CLOUD OR DESCEND'
              : FM.use('fuel') && FM.fuel <= 0
                ? 'OUT OF FUEL'
                : engOut
                  ? 'OIL PRESSURE - ROLL UPRIGHT'
                  : ovs
                    ? 'REDLINE - COMPRESSIBILITY'
                    : hiG
                      ? 'G LIMIT'
                      : 'PULL UP';
  const dh = $$('dmgHud');
  if (DM.on && DM.any() && !crashed) {
    dh.style.display = 'block';
    dh.textContent =
      'DAMAGE: ' + DM.text() + (php < 40 || DM.fire ? '  |  BAIL OUT: J twice / hold both bumpers / Pause menu' : '');
  } else dh.style.display = 'none';
  drawAH();
  drawCompass(hdg);
  const bk = $$('blk');
  if (blk > 0.02) {
    bk.style.display = 'block';
    bk.style.background = `radial-gradient(circle,rgba(0,0,0,${Math.max(0, (blk - 0.6) * 2.5)}) ${60 - blk * 55}%,rgba(0,0,0,${Math.min(1, 0.4 + blk)}) ${95 - blk * 40}%)`;
  } else bk.style.display = 'none';
  tqf.style.height = tqh.style.bottom = thr * 100 + '%';
  tqv.textContent = (thr * 100).toFixed(0) + '%';
  fli.forEach((e, i) => e.classList.toggle('on', i <= flapLvl));
  if (MOB) updTouchUI();
}

