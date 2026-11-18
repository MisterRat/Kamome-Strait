/* the ground fire's target in this game is the ship (THE GROUND FIRE in the P-51 world lays on the aircraft): they lay on her hull,
   3 m above the water, and a round anywhere through her hull or upperworks strikes her (counted until battle damage comes) */
AA.aimY = () => OCEAN.Y + 3;
AA.hit = (a, b) => {
  if (a.distanceToSquared(pos) > 10000) return false;
  for (const f of [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1])
    if (shipStruck(_aaS.copy(a).lerp(b, f))) {
      b.copy(_aaS);
      AA.hits = (AA.hits || 0) + 1;
      fxAdd(b, 0xffd080, 1.2, 3, 0.15, 0, true);
      return true;
    }
  return false;
};
