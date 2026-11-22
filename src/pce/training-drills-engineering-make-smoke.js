/* ---- ENGINEERING DRILL: MAKE SMOKE. The bridge orders a smoke screen at standard speed. The engineer lights off the smoke generator
   aft (Space) and keeps the screen thick: the fog oil's flow (Q / E) must sit in the band the burner wants, and the band wanders as
   the load and the air change (too lean: thin smoke; too rich: oil wasted, a wet white smudge). After a minute the bridge orders
   SECURE SMOKE (Space shuts it down). Assessed on how soon it was lit and shut down and how much of the minute the screen was thick;
   the smoke pours off her stern. Hardcore: a narrower band that wanders faster ---- */
DRILLS.push({
  id: 'smoke',
  stn: 2,
  title: 'Make smoke',
  what: 'The bridge orders a smoke screen: light off the generator (Space), keep the fog oil flow (Q / E) in the band, secure on order.',
  start(D) {
    SHIP.tel = Math.max(SHIP.tel, 0.7);
    D.ph = 'wait';
    D.wait = 3 + Math.random() * 4;
    D.f = 0.2;
    D.c = 0.5;
    D.cv = 0;
    D.good = 0;
    D.lay = 0;
    D.puffT = 0;
    D.oil = 0;
  },
  step(D, dt) {
    if (D.ph === 'wait') {
      if ((D.wait -= dt) <= 0) ((D.ph = 'order'), (D.t0 = D.t), drillSay('BRIDGE', 'ENGINE ROOM, BRIDGE. MAKE SMOKE! MAKE SMOKE!'));
      return;
    }
    if (D.ph === 'on' || D.ph === 'secure') {
      smkBand(D, dt, D.hc); /* the band wanders */
      D.oil += D.f * dt;
      if (D.ph === 'on') {
        D.lay += dt;
        if (D.dens > 0.7) D.good += dt;
        if (D.lay > 60) ((D.ph = 'secure'), (D.t1 = D.t), drillSay('BRIDGE', 'SECURE SMOKE.'));
      } else if (D.t - D.t1 > 30) return this.finish(D);
      smkPuff(D, dt, false); /* the smoke off her stern */
    } else if (D.t - D.t0 > 30) return this.finish(D);
  },
  finish(D) {
    const lit = D.tOn === undefined ? 30 : D.tOn - D.t0,
      sec = D.tOff === undefined ? 30 : D.tOff - D.t1,
      thick = D.lay ? D.good / Math.min(60, D.lay) : 0;
    drillEnd(D, drillMark(lit, 4, 20, 20) + thick * 65 + (D.tOff === undefined ? 0 : drillMark(sec, 4, 20, 15)), [
      'LIT OFF ' + (D.tOn === undefined ? '<b style="color:#ff8a6a">NEVER</b>' : lit.toFixed(1) + ' S AFTER THE ORDER') + ' &middot; SECURED ' + (D.tOff === undefined ? '<b style="color:#ff8a6a">NOT ON ORDER</b>' : sec.toFixed(1) + ' S AFTER THE ORDER'),
      'THE SCREEN THICK <b>' + Math.round(thick * 100) + '%</b> OF THE MINUTE &middot; FOG OIL BURNED ' + ((D.oil * 80) / 3600).toFixed(1) + ' GAL',
    ]);
  },
  key(D, code, rep) {
    if (code !== 'Space' && code !== 'KeyQ' && code !== 'KeyE') return false;
    if (code === 'KeyQ' || code === 'KeyE') {
      if (D.ph === 'on' || D.ph === 'secure') D.f = Math.max(0, Math.min(1, D.f + (code === 'KeyE' ? 0.02 : -0.02)));
      return true;
    }
    if (rep) return true;
    if (D.ph === 'order') ((D.ph = 'on'), (D.tOn = D.t), note('SMOKE GENERATOR LIT OFF'), SND.tone(120, 160, 0.6, 0.1, 'sawtooth'));
    else if (D.ph === 'secure' && D.tOff === undefined) ((D.tOff = D.t), note('SMOKE SECURED'), this.finish(D));
    return true;
  },
  box(D) {
    if (D.ph === 'wait') return 'STAND BY AT THE SMOKE GENERATOR.';
    if (D.ph === 'order') return '<b style="font-size:16px;color:#ffd27a">MAKE SMOKE!</b> <b>Space</b>: LIGHT OFF THE GENERATOR.';
    return (
      (D.ph === 'secure' ? '<b style="font-size:16px;color:#ffd27a">SECURE SMOKE!</b> <b>Space</b>: SHUT IT DOWN.' : 'LAYING THE SCREEN: ' + Math.max(0, 60 - Math.round(D.lay)) + ' S TO GO') +
      '<br>FOG OIL FLOW <b>Q / E</b> &middot; SMOKE <b style="color:' + (D.dens > 0.7 ? '#8fe39a' : '#ff8a6a') + '">' + (D.dens > 0.7 ? 'THICK' : D.f > D.c ? 'TOO RICH' : 'THIN') + '</b>'
    );
  },
  draw(D, g, w, h) {
    if (D.ph === 'on' || D.ph === 'secure') smkBar(g, w, D, D.hc);
  },
});
