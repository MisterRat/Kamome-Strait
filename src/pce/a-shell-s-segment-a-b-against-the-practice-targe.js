/* a shell's segment a-b against the practice targets. The towed sleeves are scored as kills, sized to the US Navy's wartime
   figures for rounds expended per aircraft destroyed (standard attacks): 3"/50 with VT fuzes 338, 40 mm 3,361, 20 mm 7,152.
   Each gun has a kill zone round the sleeve, calibrated by simulating a gunner who lays on the sight ring with about 3 mils of
   tracking error (with the game's own ballistics and dispersion): Hardcore meets those figures; game mode runs at 1/24 of
   real time (about 14, 140 and 300 rounds a kill: 47, 35 and 40 seconds of fire).
   The 3"/50's VT fuze still bursts within 22 m (most bursts are near misses); the 20 mm needs two hits. A sleeve shot away is
   re-streamed by the tow plane after 25 s. The rafts and the tow plane keep their plain hit radius */
function ptHit(a, b, s) {
  if (!PT.on) return false;
  for (const t of PT.L) {
    if (t.kind === 'sub' || t.gone > 0) continue;
    const air = t.kind === 'tug' || t.kind === 'sleeve',
      sl = t.kind === 'sleeve',
      kr = sl && s.kr ? s.kr[FM.use('aa') ? 0 : 1] : t.r,
      r = s.vt && air ? s.vt : kr;
    if (a.distanceToSquared(t.p) > (r + 200) ** 2) continue;
    if (!segHit(a, b, t.p, r)) continue;
    if (t.kind === 'ptboat') {
      note('CEASE FIRE - YOU HIT PT 105!');
      RADIO.add('PT 105', 'CHECK FIRE CHECK FIRE. YOU ARE HITTING THE BOAT, NOT THE SLED.');
      gunBurst(b, s, true);
      return true;
    }
    if (t.kind === 'tug') {
      note('CEASE FIRE - YOU HIT THE TOW PLANE!');
      RADIO.add('TOW ONE', 'CEASE FIRE CEASE FIRE. YOU ARE HITTING THE TUG.');
      gunBurst(b, s, true);
      return true;
    }
    if (sl) {
      if (s.vt) {
        /* the VT burst: a kill only if the shell's path passes inside the kill zone */
        gunBurst(b, s, true);
        const u = GUN.V[3].copy(b).sub(a).normalize(),
          w = GUN.V[2].copy(t.p).sub(a);
        if (w.addScaledVector(u, -w.dot(u)).length() > kr) return true;
      } else gunBurst(b, s, true);
      PT.hits.sleeve++;
      t.dmg = (t.dmg || 0) + 1;
      if (t.dmg < (s.h2k || 1)) {
        note('HIT ON THE SLEEVE (' + t.dmg + ' OF ' + s.h2k + ')');
        return true;
      }
      t.dmg = 0;
      t.gone = 25;
      t.m.visible = false;
      PT.kills = (PT.kills || 0) + 1;
      note('SLEEVE SHOT AWAY! (' + PT.kills + ')');
      RADIO.add('TOW ' + (t.gun === '20' ? 'TWO' : 'ONE'), 'SLEEVE SHOT AWAY. NICE SHOOTING. STREAMING A NEW ONE.');
      return true;
    }
    PT.hits[t.kind] = (PT.hits[t.kind] || 0) + 1;
    note('HIT ON THE ' + (t.kind === 'sled' ? 'SLED' : 'RAFT') + ' (' + PT.hits[t.kind] + ')');
    gunFx(b, 0xffb040, 3, 9, 0.3, 0, true);
    return true;
  }
  return false;
}
