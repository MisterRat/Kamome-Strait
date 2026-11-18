/* BATTLE DAMAGE (Settings checkbox, saved, on by default). Enemy hits damage one system at a time; each has a visible and
   a flying effect. eng/wl/wr/tail are 0..1 (1 = destroyed). Repaired by landing and stopping at idle. */
const DM = {
  on: true,
  eng: 0,
  wl: 0,
  wr: 0,
  tail: 0,
  leak: false,
  hyd: false,
  fire: false,
  snuff: 0 /* seconds of fast diving, which blows a fire out */,
  puffT: 0,
  healT: 0,
  bailArm: 0 /* time until which a second press of the bail-out key counts */,
  bailHold: 0,
  load() {
    this.on = store.get('dmg', true) !== false;
  },
  reset() {
    this.eng = this.wl = this.wr = this.tail = 0;
    this.leak = this.hyd = this.fire = false;
    this.snuff = this.puffT = this.healT = this.bailArm = this.bailHold = 0;
  },
  any() {
    return this.eng > 0 || this.wl > 0 || this.wr > 0 || this.tail > 0 || this.leak || this.hyd || this.fire;
  },
  /* slow field repair (the trainers): everything is mended after 8 s */
  heal(dt) {
    if (!this.any()) return;
    this.healT += dt;
    if (this.healT > 8) this.reset();
  },
  text() {
    const l = [];
    if (this.eng > 0) l.push('ENGINE ' + Math.round(this.eng * 100) + '%');
    if (this.wl > 0) l.push('L WING ' + Math.round(this.wl * 100) + '%');
    if (this.wr > 0) l.push('R WING ' + Math.round(this.wr * 100) + '%');
    if (this.tail > 0) l.push('TAIL ' + Math.round(this.tail * 100) + '%');
    if (this.leak) l.push('FUEL LEAK');
    if (this.hyd) l.push('HYDRAULICS');
    if (this.fire) l.push('FIRE');
    return l.join(' · ');
  },
};
DM.load();
