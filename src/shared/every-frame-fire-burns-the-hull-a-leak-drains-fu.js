/* every frame: fire burns the hull, a leak drains fuel, damaged parts smoke */
const _dv = new V();
function updDamage(dt) {
  if (!DM.on || !started || crashed || paused || !DM.any()) return;
  if (DM.fire) {
    php -= 1.5 * dt;
    if (vel.length() > 150 && vel.y < -20) DM.snuff += dt;
    else DM.snuff = Math.max(0, DM.snuff - dt);
    if (DM.snuff > 3) {
      DM.fire = false;
      note('FIRE OUT');
    }
    if (php <= 0) {
      php = 0;
      crash('BURNED UP');
      return;
    }
  }
  if (DM.leak && FM.use('fuel')) FM.fuel = Math.max(0, FM.fuel - 0.004 * dt);
  DM.puffT += dt;
  if (DM.puffT < 0.1) return;
  DM.puffT = 0;
  const puff = (x, y, z, col, s0, s1, life, glow) =>
    fxAdd(model.localToWorld(_dv.set(x, y, z)), col, s0, s1, life, 2, glow);
  if (DM.eng > 0.25 || DM.fire)
    puff(0, 0.35, -3.2, DM.eng > 0.6 ? 0x111111 : 0x555555, 1.2, 5 + DM.eng * 3, 2.4, false);
  if (DM.fire) {
    puff(0, 0.3, -3.0, 0xff7a20, 1.6, 3.5, 0.45, true);
    puff(0.3, 0.4, -2.6, 0xffd070, 1, 2, 0.3, true);
  }
  if (DM.wl > 0.3) puff(-4, 0.3, 0.6, 0x666666, 0.8, 3, 1.6, false);
  if (DM.wr > 0.3) puff(4, 0.3, 0.6, 0x666666, 0.8, 3, 1.6, false);
  if (DM.leak) puff(Math.random() < 0.5 ? -2.5 : 2.5, -0.1, 0.8, 0xe8e8e8, 0.5, 2.2, 1.4, false);
}
