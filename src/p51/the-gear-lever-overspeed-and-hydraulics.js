/* the gear lever: up or down, refused when overspeed (Hardcore) or the hydraulics are shot */
function toggleGear() {
  const was = gearOn;
  if (DM.on && DM.hyd && gearOn && !onGround) return note('HYDRAULICS - GEAR WILL NOT RETRACT');
  if (!onGround && !gearOn && FM.use('ops') && (FM.ias || spd()) > 76)
    return note('GEAR OVERSPEED - SLOW BELOW 273 KM/H');
  if (!onGround) gearOn = !gearOn;
  else if (spd() < 1) gearOn = true;
  if (gearOn !== was) SND.gear(gearOn);
}
