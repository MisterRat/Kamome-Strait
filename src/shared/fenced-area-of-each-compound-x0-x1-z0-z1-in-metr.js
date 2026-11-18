/* fenced area of each compound: [x0, x1, z0, z1] in metres from DEPOT / BASE (the compounds are not centred on those points) */
const DEPF = [-160, 10, -95, 105],
  BASEF = [-42, 138, -98, 102];
function inCompound(x, z) {
  const m = 45;
  return (
    SITE.inside(x, z, 30) ||
    FS.near(x, z, 12) ||
    (x > DEPOT[0] + DEPF[0] - m &&
      x < DEPOT[0] + DEPF[1] + m &&
      z > DEPOT[1] + DEPF[2] - m &&
      z < DEPOT[1] + DEPF[3] + m) ||
    (x > BASE[0] + BASEF[0] - m &&
      x < BASE[0] + BASEF[1] + m &&
      z > BASE[1] + BASEF[2] - m &&
      z < BASE[1] + BASEF[3] + m)
  );
}
