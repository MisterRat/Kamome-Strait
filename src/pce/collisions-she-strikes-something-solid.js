/* COLLISIONS, the PCE-842: her solid body for the collision layer (PHYS) and what striking something does. She stops where she
   strikes (she cannot go on into it: each frame she is in contact her way toward it is taken off, and she is eased out a little); a
   blow harder than a nudge holes her (BATTLE DAMAGE: holes by the energy of the closing speed with the two masses: 1 m/s against
   a pier a scrape, 3 m/s a hole like a shell's, 8 m/s (15 knots) against a pier or a big ship as bad as a torpedo), and the other
   takes it too (PHYS: a boat she rams at speed is sunk). Coming alongside her berth (RETURN TO BASE) her pier does not count. */
const PCOL = { t: -1e9 } /* when she last took a collision's damage (one blow at a time: 2 s apart) */;
SIMS.add({
  id: 'pce',
  body: () =>
    SHIPM.mesh && !SDM.lost
      ? {
          o: SHIPM.mesh,
          m: 8.8e5 /* about 850 long tons loaded */,
          name: 'PCE-842',
          D: 6,
          hit: (o, info) => {
            if (RTB.on && o.kind === 'pier') return;
            pceBlock(info);
            if (info.v < 0.3 || WT - PCOL.t < 2) return;
            PCOL.t = WT;
            note('COLLISION - ' + (o.name || 'OBSTACLE'));
            if (!DM.on || SDM.lost) return;
            const h = Math.min(3.5, (info.E / 1e6) * 0.35);
            SDM.holes += h;
            if (h > 0.6 && Math.random() < 0.3) SDM.fire = Math.max(SDM.fire, 0.25);
            sdmSay(
              h > 2
                ? 'BRIDGE, DAMAGE CONTROL. COLLISION! SHE IS STOVE IN, FLOODING FAST. ALL PUMPS ON IT.'
                : h > 0.4
                  ? 'BRIDGE, DAMAGE CONTROL. COLLISION, HOLED. REPAIR PARTIES ON IT.'
                  : 'BRIDGE, DAMAGE CONTROL. WE TOUCHED, SOME PLATING SPRUNG. SHORING IT.',
            );
          },
          touch: (o, info) => {
            if (RTB.on && o.kind === 'pier') return;
            pceBlock(info);
          },
        }
      : null,
});
/* her way toward what she touches is taken off (ahead or astern, by where it lies), and she is eased out 5 cm a frame */
function pceBlock(info) {
  if (!info.p) return;
  const fx = -Math.sin(SHIP.hdg),
    fz = -Math.cos(SHIP.hdg),
    dx = info.p.x - pos.x,
    dz = info.p.z - pos.z,
    ahead = dx * fx + dz * fz;
  if ((ahead > 0 && SHIP.u > 0) || (ahead < 0 && SHIP.u < 0)) ((SHIP.u = 0), (SHIP.r *= 0.5));
  const l = Math.hypot(dx, dz) || 1;
  pos.x -= (dx / l) * 0.05;
  pos.z -= (dz / l) * 0.05;
}
