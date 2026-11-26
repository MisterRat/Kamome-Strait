/* COLLISIONS, the M4A3: her solid body for the collision layer (PHYS). Something solid ahead of her (or astern, backing) stops her
   (a building, a vehicle, a parked aircraft, a tower); what she drives into takes the blow (PHYS: a light vehicle rammed is
   wrecked). The coral walls are solid the same way (CORAL.mesh), the battle area's included. Something within about 70 degrees of her
   nose (or of her tail, backing) stops her and she is eased back off it; touching it beside her she can still slide along it. */
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
  if ((ahead > 0.3 && DRV.v > 0) || (ahead < -0.3 && DRV.v < 0)) {
    if (first && Math.abs(DRV.v) > 1) note('COLLISION - ' + (info.name || 'OBSTACLE')), (DRV.hits = (DRV.hits || 0) + 1) /* counted for the drills */;
    DRV.v = 0;
    pos.x -= (dx / l) * 0.03;
    pos.z -= (dz / l) * 0.03;
  }
}
