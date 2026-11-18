/* the torpedoman's station each frame: walk (Hardcore), fire what he is at, load the Hedgehog, and the attack */
function tpUpdate(dt, here, trig) {
  const at6 = here && SHIP.stn === 6;
  if (at6 && FM.use('walk')) tpWalk(dt);
  if (at6) {
    const i = tpAt(),
      tp = i >= 0 && tpList()[i] ? tpList()[i].tp : null;
    if (trig && !STN.fire0) {
      if (!tp) note('NOT AT A WEAPON');
      else if (tp === 'hh') hhFire() && aswFired('hh');
      else if (dcFire(tp)) aswFired(tp);
    }
    /* loading the Hedgehog by hand: 24 bombs in about 3 minutes, a bomb every 7.5 s (game mode: half) */
    if (tp === 'hh' && HH.loading && HH.n < 24 && !HH.q.length) {
      HH.ld += dt;
      if (HH.ld > 7.5 * rldK()) {
        HH.ld = 0;
        HH.n++;
        SND.burst(1800, 400, 0.06, 0.2, 0.7);
        if (HH.n === 24) (HH.loading = false), note('HEDGEHOG LOADED');
      }
    }
  }
  /* the K-gun crews reload a fired gun in about a minute (game mode: half) */
  for (let i = 0; i < 4; i++)
    if (!DC.kl[i] && (DC.kt[i] = (DC.kt[i] || 0) + dt) >= 60 * rldK()) {
      DC.kl[i] = 1;
      DC.kt[i] = 0;
      DC.kg = [DC.kl[0] + DC.kl[1], DC.kl[2] + DC.kl[3]];
    }
  kgArbors();
  hhStep(dt);
  aswStep(dt, here);
  aswBox(here);
  commsBox(here);
}

function dcBoardDraw(f) {
  const g = f.g,
    W = 512,
    H = 374;
  g.fillStyle = '#1e2226';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8e2c8';
  g.font = 'bold 30px monospace';
  g.textAlign = 'center';
  g.fillText('DEPTH CHARGES', W / 2, 44);
  g.font = 'bold 64px monospace';
  g.fillStyle = '#ffd36a';
  g.fillText(DC.dep.rack + ' FT', W / 2, 128);
  g.font = 'bold 30px monospace';
  g.fillStyle = '#e8e2c8';
  g.fillText('RACKS  P ' + DC.rack[0] + '   S ' + DC.rack[1], W / 2, 196);
  g.fillText('K-GUNS P ' + DC.kg[0] + '   S ' + DC.kg[1], W / 2, 246);
  g.font = '22px monospace';
  g.fillStyle = '#9fd0a0';
  g.fillText(DC.lastTxt || (DC.L.length ? 'CHARGES SINKING: ' + DC.L.length : 'READY'), W / 2, 318);
}
