/* COLLISIONS, the M4A3: her solid body for the collision layer (PHYS). Something solid ahead of her (or astern, backing) stops her
   (a building, a vehicle, a parked aircraft, a tower); what she drives into takes the blow (PHYS: a light vehicle rammed is
   wrecked). The battle area's own walls and fields are still its own (BA.block). */
SIMS.add({
  id: 'm4a3',
  body: () =>
    TANK.mesh
      ? {
          o: TANK.mesh,
          m: 31600,
          name: 'M4A3',
          D: 2,
          hit: (o, info) => tankBump(info, true),
          touch: (o, info) => tankBump(info, false),
        }
      : null,
});
function tankBump(info, first) {
  if (!info.p) return;
  const fx = -Math.sin(TANK.hdg),
    fz = -Math.cos(TANK.hdg),
    dx = info.p.x - pos.x,
    dz = info.p.z - pos.z,
    l = Math.hypot(dx, dz) || 1,
    ahead = (dx * fx + dz * fz) / l;
  if ((ahead > 0.6 && DRV.v > 0) || (ahead < -0.6 && DRV.v < 0)) {
    if (first && Math.abs(DRV.v) > 1) note('COLLISION - ' + (info.name || 'OBSTACLE'));
    DRV.v = 0;
  }
}
