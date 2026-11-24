/* the on-screen controls box: short, and only what applies where the player is (sailing, at a station, at a gun) */
let helpCtx = '';
function helpBox() {
  const gun = typeof GUN !== 'undefined' && GUN.cur && camMode == 1 ? GUN.cur.id : '',
    stn = typeof SHIP !== 'undefined' ? SHIP.stn : 1,
    dev = (PCEM.STN[stn] && PCEM.STN[stn][SHIP.sub] && PCEM.STN[stn][SHIP.sub].dev) || '',
    ctx = gun || (camMode == 1 ? 's' + stn + dev + SHIP.sub + (stn === 5 && FM.use('walk') ? 'h' : '') : 'c');
  if (ctx === helpCtx) return;
  helpCtx = ctx;
  const mk = (pad) => {
    const t = (id) => (pad ? padText(id) : kbText(id));
    let l;
    if (pad) l = pcePadHelp(pceCtx()) /* the controller: from THE CONTROLLER AND TOUCH's table */;
    else if (gun)
      l = pad
        ? ['<b>Aim</b> stick &middot; <b>Fire</b> trigger']
        : [
            '<b>Aim</b> mouse (hold <b>`</b> for big moves)' + ' &middot; <b>Fire</b> Space or left click &middot; <b>W / S</b> engines &middot; <b>A / D</b> rudder',
            '<b>' + kbText('gSight') + '</b> ' + (gun === '3in' ? 'telescope / look round' : 'sight / look round') + ' &middot; <b>4</b> next gun' + (gun === '20' ? ' &middot; <b>' + kbText('hhLoad') + '</b> new drum' : ''),
            gun === '3in' ? '<b>Page Up / Down</b> sight range (Hardcore)' : 'Rings: lead for 100, 200, 300 knots',
            '<b>' + kbText('targets') + '</b> practice targets &middot; <b>Esc</b> frees the mouse',
          ];
    else if (camMode == 1 && stn === 2) l = ['<b>W / S</b> engines &middot; <b>A / D</b> rudder', 'Red needle: the order &middot; black: the answer', 'Gauges: rpm, shaft, oil, water, exhaust, fuel, air, knots', 'Fuel, power, heat, smoke: the jobs come to you here', '<b>' + kbText('targets') + '</b> training drills'];
    else if (camMode == 1 && stn === 3)
      l = [
        dev === 'radar' ? '<b>Q / E</b> cursor &middot; <b>R / F</b> strobe &middot; <b>Space</b> report &middot; <b>Page Up / Down</b> scale' : dev === 'sonar' ? '<b>Q / E</b> train &middot; <b>Z / X</b> cuts &middot; <b>Space</b> report &middot; <b>U / B / N</b> Doppler' : '<b>Space</b> acknowledge &middot; <b>B</b> route to the bridge',
        '<b>3</b> next: radar, sonar, radio &middot; <b>T</b> Comms school',
      ];
    else if (camMode == 1 && stn === 5)
      l = [
        FM.use('walk') ? '<b>W A S D</b> walk the deck &middot; <b>Shift</b> run &middot; drag to look' : '<b>5</b> next position &middot; <b>' + t('tpJump') + '</b> go to the ordered one',
        '<b>' + (pad ? t('guns') : 'Space') + '</b> fire the weapon you are at',
        '<b>Page Up / Down</b> its depth &middot; <b>' + t('gSight') + '</b> arm / safe',
        '<b>' + t('hhLoad') + '</b> load the Hedgehog (at it) &middot; <b>' + t('targets') + '</b> the exercise sub',
      ];
    else
      l = [
        '<b>Rudder</b> ' + (pad ? 'right stick' : 'A / D') + ' &middot; <b>Engines</b> ' + (pad ? t('thrUp') + ' / ' + t('thrDn') : 'W / S'),
        pad ? '' : '<b>Stations</b> 1 OOD &middot; 2 Eng &middot; 3 Comms &middot; 4 Guns &middot; 5 DC',
        camMode == 1 && stn === 1 ? '<b>' + kbText('orders') + '</b> orders &middot; <b>' + kbText('gSight') + '</b> binoculars &middot; <b>' + kbText('targets') + '</b> training drills' : '',
      ];
    l.push('<b>' + t('camera') + '</b> ' + (camMode == 1 ? 'chase view' : 'to station') + ' &middot; <b>' + t('pause') + '</b> menu');
    return '<b style="color:var(--acc)">CONTROLS</b> (' + kbText('help') + ' hides)<br>' + l.filter(Boolean).join('<br>');
  };
  $$('hkBody').innerHTML = mk(false);
  $$('hpBody').innerHTML = mk(true);
}
if (SIMS.on('pce')) buildHelp();
