/* air support for the PCE-842, on the OOD's call. She has no standing air cover. When the radar picks up enemy aircraft (a raider or
   a Japanese fighter inside 18 km) Comms reports them to the bridge; the OOD decides whether he wants air support (the AI's OOD for
   now: the player's OOD is on hold, like every station nobody mans): he asks for it, and Comms radios Kamome Control. The fighters
   are the shared air support (AIRSUP: two P-51s from the nearest American field, Fletcher or Kamome): they fly out to her, fight, and
   go home when low on ammunition or fuel. Her being hit calls for it too (any sea unit under fire: AIRSUP.hit). */
const CAP = (() => {
  const DETECT = 18000; /* the radar's reach for low aircraft, m */
  const S = { raid: false, t: 0 };
  const brg = (p) => String(Math.round(((((Math.atan2(p.x - pos.x, -(p.z - pos.z)) * 180) / Math.PI) % 360) + 360) % 360) % 360).padStart(3, '0');
  const live = () => [
    ...(typeof RAID !== 'undefined' ? RAID.L.filter((e) => e.st !== 'down') : []),
    ...AIRSUP.L.filter((u) => u.side === 'jp' && u.up && !u.down),
  ];
  const tick = (dt) => {
    if (!SIMS.on('pce') || crashed || !started) return;
    const R0 = live(),
      seen = R0.find((e) => e.p.distanceTo(pos) < DETECT);
    /* a new raid on the radar: Comms reports it, the OOD decides (he asks), Comms calls */
    if (seen && !S.raid) {
      S.raid = true;
      RADIO.add(
        'RADAR',
        'BRIDGE, COMMS: RADAR CONTACT, ENEMY AIRCRAFT BEARING ' + brg(seen.p) + ', ' + (seen.p.distanceTo(pos) / 1852).toFixed(0) + ' MILES, CLOSING.',
        { own: true },
      );
      if (!AIRSUP.L.some((u) => u.side === 'us' && !u.down && u.st !== 'rtb')) {
        RADIO.add('BRIDGE', 'COMMS, BRIDGE: REQUEST AIR SUPPORT FROM KAMOME CONTROL.', { own: true });
        note('OOD: REQUEST AIR SUPPORT');
        AIRSUP.call('us', pos.clone(), 'PCE 842');
      }
    }
    if (!R0.length) S.raid = false;
  };
  HOOKS.tick.push(tick);
  return { S, call: (who) => AIRSUP.call('us', pos.clone(), who) };
})();
