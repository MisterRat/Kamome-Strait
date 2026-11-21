/* BATTLE DAMAGE, the PCE-842 (Settings > Battle damage, DM.on, on by default): what the hits do to her. Until now they were only
   counted. Each hit holes her hull (water comes in through the holes), may start a fire and may damage her engines:
     a 25 mm or machine-gun round (the ground fire, the escort, the raiders)   a small hole; now and then a fire
     a 12 cm shell (the coast battery)                                         a real hole; often a fire; sometimes the engines
     a torpedo (the T-14s)                                                     a great hole, the engine room flooding, a fire
   Damage control fights back: the pumps clear 0.12% of her reserve buoyancy a second, the repair parties shore the holes up and put
   the fires out (a big fire spreads faster than they can, and reaches the engines). Flooding settles her and lists her and slows
   her (with the engine damage, SHIP.dmgK); if it takes all her reserve buoyancy she is lost: she goes down and the game ends.
   Calibrated so that one torpedo sinks her in about three and a half minutes, two 12 cm hits leave her low but afloat, and a
   strafing run holes her a little. SDM (the ship state piece) holds it; sdmText() for the HUD; a restart mends her. */
function sdmReset() {
  Object.assign(SDM, { holes: 0, flood: 0, fire: 0, eng: 0, lost: false, sink: 0, smokeT: 0, msgT: 0, shaft: 1, pump: 0, cf: 0 });
  if (typeof DCX !== 'undefined' && DCX) DCX.L.length = 0; /* var DCX: a restart can come before its piece loads */
}
const sdmSay = (txt) => RADIO.add('DAMAGE CONTROL', txt, { own: true });
/* a hit: kind 'small', 'shell' or 'torpedo' */
function sdmHit(kind) {
  if (!DM.on || SDM.lost || !SIMS.on('pce')) return;
  const r = Math.random,
    f0 = SDM.fire,
    e0 = SDM.eng;
  if (kind === 'small') {
    SDM.holes += 0.04;
    if (r() < 0.04) SDM.fire = Math.max(SDM.fire, 0.15);
  } else if (kind === 'shell') {
    SDM.holes += 0.8;
    if (r() < 0.35) SDM.fire = Math.max(SDM.fire, 0.35);
    if (r() < 0.25) {
      SDM.eng = Math.min(1, SDM.eng + 0.3);
      sdmSay('BRIDGE, DAMAGE CONTROL. HIT IN THE ENGINE ROOM. ONE ENGINE DAMAGED, SPEED REDUCED.');
    } else sdmSay('BRIDGE, DAMAGE CONTROL. SHELL HIT, HOLED ABOVE THE WATERLINE. REPAIR PARTIES ON IT.');
  } else if (kind === 'torpedo') {
    SDM.holes += 3.5;
    SDM.eng = Math.min(1, SDM.eng + 0.5);
    SDM.fire = Math.max(SDM.fire, 0.5);
    sdmSay('BRIDGE, DAMAGE CONTROL. TORPEDO HIT AMIDSHIPS. ENGINE ROOM FLOODING. ALL PUMPS ON IT.');
  }
  /* the player in the engine room: the repairs are his jobs (DAMAGE CONTROL AT STATION 2) */
  dcxFromHit(kind, SDM.fire > f0, SDM.eng > e0);
}
/* each frame: the water, the fires, the damage control, her settling, her loss */
function sdmStep(dt) {
  if (!SIMS.on('pce')) return;
  if (SDM.lost) {
    /* she goes down: she settles until her decks are under, then she is gone */
    SDM.sink += dt;
    if (SHIPM.mesh && SDM.sink > 40) SHIPM.mesh.visible = false;
    return;
  }
  if (!SDM.holes && !SDM.flood && !SDM.fire) return;
  /* Hardcore with the player in the engine room on his jobs: he is the repair party, so nothing is shored or put out but by him
     (DAMAGE CONTROL AT STATION 2); the pumps he started (SDM.pump) clear the water faster */
  const own = dcxManned();
  SDM.pump = Math.max(0, (SDM.pump || 0) - dt);
  SDM.flood = Math.max(0, SDM.flood + (0.002 * SDM.holes - 0.0012 - (SDM.pump > 0 ? 0.004 : 0)) * dt);
  if (!own) SDM.holes = Math.max(0, SDM.holes - 0.004 * dt); /* shored up */
  if (SDM.fire > 0) {
    SDM.fire = Math.max(0, Math.min(1, SDM.fire + (0.012 * SDM.fire - (own ? 0 : 0.006)) * dt)); /* a small one is put out, a big one spreads */
    if (SDM.fire > 0.6) SDM.eng = Math.min(1, SDM.eng + 0.004 * dt);
    if ((SDM.smokeT -= dt) <= 0) {
      SDM.smokeT = 0.35;
      const p = pos.clone().add(new V((Math.random() - 0.5) * 8, 5 + Math.random() * 2, (Math.random() - 0.5) * 8));
      fxAdd(p, 0x2e2c2a, 2 + 6 * SDM.fire, 10 + 20 * SDM.fire, 5, 2.5, false);
      if (Math.random() < 0.5) fxAdd(p, 0xff8a30, 1 + 2 * SDM.fire, 3, 0.4, 0.5, true);
    }
    if (SDM.fire === 0) sdmSay('BRIDGE, DAMAGE CONTROL. THE FIRE IS OUT.');
  }
  SHIP.dmgK = Math.min(SDM.shaft, (1 - 0.85 * SDM.eng) * (1 - 0.6 * SDM.flood));
  SDM.msgT -= dt;
  if (SDM.flood > 0.5 && SDM.msgT <= 0) {
    SDM.msgT = 60;
    sdmSay('BRIDGE, DAMAGE CONTROL. SHE IS SETTLING. WATER GAINING ON THE PUMPS.');
  }
  if (SDM.flood >= 1) {
    SDM.lost = true;
    SHIP.dmgK = 0;
    sdmSay('BRIDGE, DAMAGE CONTROL. WE CANNOT HOLD HER.');
    RADIO.add('BRIDGE', 'ABANDON SHIP. ABANDON SHIP.', { own: true });
    crashed = true;
    const m = $$('msg');
    m.innerHTML =
      'PCE-842 IS LOST<br><small style="font-size:14px;color:#fff">' +
      (MOB ? 'Tap here to restart' : 'Press Enter, or A / Start on the controller, to restart') +
      '</small>';
    m.style.display = 'block';
  }
}
/* how far she has settled (m) and her list (rad), for her attitude */
function sdmSettle() {
  return SDM.lost ? Math.min(12, 2.6 + SDM.sink * 0.25) : 2.6 * SDM.flood;
}
function sdmList() {
  return SDM.lost ? Math.min(0.9, 0.25 + SDM.sink * 0.02) : 0.25 * SDM.flood * (1 - (SDM.cf || 0)) /* counter-flooded: the engineer's job */;
}
function sdmText() {
  const l = [];
  if (SDM.flood > 0.02) l.push('FLOODING ' + Math.round(SDM.flood * 100) + '%');
  if (SDM.fire > 0) l.push('FIRE');
  if (SDM.eng > 0) l.push('ENGINES ' + Math.round(SDM.eng * 100) + '%');
  return l.join(' &middot; ');
}
