/* a shell's segment a-b against the raiders: like the sleeves, a kill zone round the aircraft sized to the rounds per kill. own: fired
   by the player's gun (game mode's larger zones); the AI crews' rounds always use the real figures, Hardcore's (the user's,
   2026-11-21: the AI gunners shot down every raider) */
function raidHit(a, b, s, own) {
  for (const e of RAID.L) {
    if (e.st === 'down') continue;
    const kr = (RAIDKR[Object.keys(GSPEC).find((k) => GSPEC[k] === s)] || [6, 6])[FM.use('aa') || !own ? 0 : 1],
      r = s.vt || kr;
    if (a.distanceToSquared(e.p) > (r + 200) ** 2) continue;
    if (!segHit(a, b, e.p, r)) continue;
    gunBurst(b, s, true);
    if (s.vt) {
      const u = GUN.V[3].copy(b).sub(a).normalize(),
        w = GUN.V[2].copy(e.p).sub(a);
      if (w.addScaledVector(u, -w.dot(u)).length() > kr) return true;
    }
    e.dmg++;
    if (e.dmg < (s.h2k || 1)) {
      note('HIT ON THE FRANK');
      return true;
    }
    e.st = 'down';
    e.sm = 0;
    RAID.kills++;
    note('FRANK SHOT DOWN! (' + RAID.kills + ')');
    RADIO.add('LOOKOUT', 'SPLASH ONE! SPLASH ONE BANDIT!');
    return true;
  }
  return false;
}
