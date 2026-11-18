/* ---------- ground service: repair + rearm ---------- */
let svcT = 0;
const SVC = 4;
function updService(dt) {
  const need =
    php < 100 ||
    DM.any() ||
    (FM.use('fuel') && FM.fuel < 0.98) ||
    FM.str > 0 ||
    ammo.some((a, i) => a < AMMO0[i]) ||
    rkN > 0 ||
    bmN > 0;
  if (crashed || !onGround || vel.length() > 2 || thr > 0.2 || !need) {
    if (svcT > 0 && need && !crashed && vel.length() > 2) note('SERVICE INTERRUPTED');
    svcT = 0;
    return;
  }
  svcT = Math.min(SVC, svcT + dt);
  const f = svcT / SVC;
  php = Math.max(php, 100 * f);
  FM.fuel = Math.max(FM.fuel, f);
  FM.str = Math.min(FM.str, 1 - f);
  FM.ice = Math.min(FM.ice, 1 - f);
  for (let i = 0; i < 6; i++) ammo[i] = Math.max(ammo[i], Math.floor(AMMO0[i] * f));
  rkN = Math.min(rkN, Math.round(6 * (1 - f)));
  bmN = Math.min(bmN, Math.round(2 * (1 - f)));
  for (let k = 0; k < 6; k++) rkMesh[ORD[k]].visible = k >= rkN;
  for (let k = 0; k < 2; k++) bmMesh[k].visible = k >= bmN;
  if (f >= 1) {
    php = 100;
    FM.fuel = 1;
    FM.str = 0;
    DM.reset();
    ammo = AMMO0.slice();
    rkN = 0;
    bmN = 0;
    svcT = 0;
    note('REPAIRED, REARMED & REFUELLED - READY');
  } else note('SERVICING (REPAIR, REARM, REFUEL) ' + Math.round(f * 100) + '%');
}
