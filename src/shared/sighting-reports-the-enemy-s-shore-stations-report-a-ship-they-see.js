/* ---------- sighting reports: the enemy's shore stations report a ship they see ----------
   (The user's, 2026-11-23.) Every Japanese shore station (the ports, the airbases, the convoy depots, the IJN base: AIRSUP.places) keeps a
   lookout. When the player's ship comes into its view (by day 12 km, at night 4 km, with no hill between: the station's lookout 30 m up,
   her upperworks 10 m) it reports her, once, and again every 10 minutes while she stays in view. A report does not bring aircraft (only a
   unit under fire calls for them: AIRSUP); it puts the enemy's sea forces within 15 km of where she was seen on the alert for 20 minutes
   (SIGHT.alert): the escorts patrol at action speed, the torpedo boats go out for her from farther off, and Port Ugaki's torpedo boats
   put to sea. US radio intelligence hears the report: the radio prints it (in red).
   Only with the enemy's ships on (the role's shipsOn), and only for a ship (the role's afloat). Timed by the world's clock (WT). */
const SIGHT = (() => {
  const DAY = 12000,
    NIGHT = 4000,
    AREA = 15000,
    LIFE = 1200,
    AGAIN = 600,
    EYE = 30,
    MAST = 10;
  const L = [] /* the reports: { x, z, t, who } */,
    seen = {} /* name -> { in: in view at the last look, t: its last report } */;
  let tk = 0;
  /* the line of sight from a station at (sx, sz) to (x, z): no ground above it along the way */
  const clear = (sx, sz, x, z) => {
    const e0 = Math.max(H(sx, sz), SEA.Y) + EYE,
      e1 = SEA.Y + MAST,
      r = Math.hypot(x - sx, z - sz),
      n = Math.max(2, Math.ceil(r / 250));
    for (let i = 1; i < n; i++) {
      const f = i / n;
      if (H(sx + (x - sx) * f, sz + (z - sz) * f) > e0 + (e1 - e0) * f) return false;
    }
    return true;
  };
  const enemy = (s) => s.navy ? s.navy === 'jp' : true /* FS.list's and the home port are all Japanese */;
  const step = (dt) => {
    if ((tk += dt) < 2) return;
    tk = 0;
    while (L.length && WT - L[0].t > LIFE) L.shift();
    const R_ = SIMS.cur;
    if (!started || !R_.afloat || !(R_.shipsOn && R_.shipsOn()) || crashed) return;
    const range = (WX.lt || 0) > 0.35 ? NIGHT : DAY;
    for (const [s, name] of AIRSUP.places()) {
      if (!name || !enemy(s) || (s.dead && s.dead())) continue;
      const S = seen[name] || (seen[name] = { in: false, t: -1e9 }),
        d = Math.hypot(pos.x - s.O.x, pos.z - s.O.z),
        sees = d < range && clear(s.O.x, s.O.z, pos.x, pos.z);
      if (sees && (!S.in || WT - S.t > AGAIN)) {
        S.t = WT;
        L.push({ x: pos.x, z: pos.z, t: WT, who: name });
        if (typeof RADIO !== 'undefined')
          RADIO.add('INTERCEPT', name + ' REPORTING AN ENEMY SHIP IN SIGHT. EXPECT HIS SHIPS IN THAT AREA ON THE ALERT.', { own: true });
      }
      S.in = sees;
    }
  };
  /* the live report whose area holds (x, z), or null */
  const alert = (x, z) => {
    for (let i = L.length - 1; i >= 0; i--) {
      const r = L[i];
      if (WT - r.t < LIFE && Math.hypot(x - r.x, z - r.z) < AREA) return r;
    }
    return null;
  };
  const reset = () => {
    L.length = 0;
    for (const k in seen) delete seen[k];
  };
  HOOKS.tick.push(step);
  return { L, alert, reset, AREA, LIFE };
})();
/* is (x, z) in the area of a live sighting report: the enemy's sea forces there are on the alert (a function, so the coast's ships,
   built earlier in the page, can ask it) */
function sightAt(x, z) {
  return !!SIGHT.alert(x, z);
}
