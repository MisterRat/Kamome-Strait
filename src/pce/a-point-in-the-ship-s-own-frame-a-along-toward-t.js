/* a point in the ship's own frame: a (along, + toward the bow), b (across, + to starboard), c (above the waterline) */
function raidShipLocal(p, out) {
  const dx = p.x - pos.x,
    dz = p.z - pos.z,
    s = Math.sin(SHIP.hdg),
    c = Math.cos(SHIP.hdg);
  return out.set(-dx * s - dz * c, p.y - OCEAN.Y, dx * c - dz * s);
}
