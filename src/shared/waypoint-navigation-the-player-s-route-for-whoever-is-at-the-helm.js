/* ---------- WAYPOINT NAVIGATION: the player's route for the AI at the helm (the user's, 2026-11-23) ----------
   Every simulator with an AI driving (the role's navAble: the PCE's helmsman now; the tank's driver and the submarine's helmsman to
   come) follows the player's route: a list of waypoints laid on THE CHART. NAV holds the route and decides where the AI steers; the
   simulator does the steering (NAV.aim(): the point to steer for, or null).
   ENGAGED   the player engages the route (Enter at the chart). The AI steers for the current waypoint; within NAV.R of it, the next.
             At the last one: round again if Loop is on, else the route is complete and disengages (the simulator stops).
   SUSPENDED an enemy in sight (NAV.threat: an enemy warship or torpedo boat seen, a submarine seen on the surface or held on the
             simulator's own sensors (the role's navContact), an enemy aircraft in sight) suspends it: the AI steers no more and the
             player or the AI in command fights. 30 s with nothing in sight and it re-engages by itself, for the waypoint it was making for.
   OFF       the player takes the helm himself (the simulator calls NAV.off) or disengages it at the chart. The route is kept.
   The route is saved for each simulator. It is drawn on the minimap too (dashed when not engaged). */
const NAV = (() => {
  const S = {
    pts: [] /* { x, z } */,
    i: 0 /* the waypoint being made for */,
    on: false /* engaged */,
    sus: false /* suspended: an enemy in sight */,
    clrT: 0 /* seconds clear of the enemy */,
    loop: false,
    sel: -1 /* the waypoint selected at the chart */,
    R: 250 /* arrived within this (m) */,
    chkT: 0,
    seen: false,
  };
  const key = () => 'nav_' + ((SIMS.cur && SIMS.cur.id) || '');
  const save = () => store.set(key(), { pts: S.pts.map((p) => [Math.round(p.x), Math.round(p.z)]), loop: S.loop });
  const load = () => {
    const d = store.get(key(), null);
    S.pts = d && Array.isArray(d.pts) ? d.pts.filter((p) => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])).map((p) => ({ x: p[0], z: p[1] })) : [];
    S.loop = !!(d && d.loop);
    S.i = 0;
    S.on = S.sus = false;
    S.sel = S.pts.length ? 0 : -1;
  };
  const able = () => !!(SIMS.cur && SIMS.cur.navAble);
  const say = (t) => (SIMS.cur.navSay ? SIMS.cur.navSay(t) : note(t));
  const brg = (p) => Math.round(((Math.atan2(p.x - pos.x, -(p.z - pos.z)) * 180) / Math.PI + 360) % 360);
  const fmtB = (p) => String(brg(p)).padStart(3, '0');
  /* ---- an enemy in sight ---- */
  const threat = () => {
    if (SIMS.cur.navContact && SIMS.cur.navContact()) return 'SUBMARINE CONTACT';
    const night = (WX.lt || 0) > 0.35,
      fogR = scene.fog && scene.fog.far ? scene.fog.far * 1.2 : 1e9;
    /* enemy warships and torpedo boats, as the minimap sees them (size, light, weather, horizon, hills), while the enemy's ships fight */
    if (SIMS.cur.shipsOn() && typeof ROE !== 'undefined')
      for (const q of T) {
        if (q.dead || q.side === 'us' || q.type !== 'ship' || !q.m || q.m.visible === false) continue;
        const k = ROE.tkind(q);
        if (k !== 'escort' && k !== 't14') continue;
        const w = q.m.getWorldPosition(new THREE.Vector3());
        if (MMSHIP.sees(q.m, w.x, w.z, (q.r || 0) > 12)) return k === 'escort' ? 'ENEMY WARSHIP IN SIGHT' : 'ENEMY TORPEDO BOATS IN SIGHT';
      }
    /* a submarine on the surface */
    if (typeof SUBS !== 'undefined')
      for (const s of SUBS.L) if (s.side === 'jp' && s.on && !s.sunk && s.d <= 1.5 && MMSHIP.sees(s.m, s.p.x, s.p.z, true)) return 'SUBMARINE IN SIGHT';
    /* enemy aircraft: by day 10 km, at night 3 km, never past the weather */
    const aR = Math.min(night ? 3000 : 10000, fogR),
      near = (p) => p && Math.hypot(p.x - pos.x, p.z - pos.z) < aR;
    if (typeof EN !== 'undefined') for (const e of EN) if (!e.dying && !e.drone && near(e.p)) return 'ENEMY AIRCRAFT IN SIGHT';
    if (typeof RAID !== 'undefined') for (const e of RAID.L) if (e.st !== 'down' && near(e.p)) return 'ENEMY AIRCRAFT IN SIGHT';
    if (typeof AIRSUP !== 'undefined') for (const u of AIRSUP.L) if (u.side === 'jp' && u.up && !u.down && near(u.p)) return 'ENEMY AIRCRAFT IN SIGHT';
    return '';
  };
  /* ---- each frame ---- */
  const tick = (dt) => {
    if (!able() || !started || paused || crashed || !S.on || !S.pts.length) return;
    if (S.i >= S.pts.length) S.i = 0;
    /* the lookouts: twice a second */
    if ((S.chkT -= dt) <= 0) {
      S.chkT = 0.5;
      const t = threat();
      if (t) {
        S.clrT = 0;
        if (!S.sus) {
          S.sus = true;
          say(t + ': ROUTE SUSPENDED. THE OOD HAS HER.');
        }
      } else if (S.sus && (S.clrT += 0.5) >= 30) {
        S.sus = false;
        say('ALL CLEAR: RESUMING THE ROUTE. COURSE ' + fmtB(S.pts[S.i]) + ' FOR WAYPOINT ' + (S.i + 1) + '.');
      }
    }
    if (S.sus) return;
    /* arrived: on to the next */
    const p = S.pts[S.i];
    if (Math.hypot(p.x - pos.x, p.z - pos.z) < S.R) {
      if (S.i + 1 < S.pts.length || S.loop) {
        const was = S.i;
        S.i = (S.i + 1) % S.pts.length;
        say('WAYPOINT ' + (was + 1) + ' REACHED. COURSE ' + fmtB(S.pts[S.i]) + ' FOR WAYPOINT ' + (S.i + 1) + '.');
      } else {
        S.on = false;
        S.i = 0;
        say('LAST WAYPOINT REACHED: ROUTE COMPLETE.');
        if (SIMS.cur.navDone) SIMS.cur.navDone();
      }
    }
  };
  HOOKS.tick.push(tick);
  /* ---- the route on the minimap: the legs ahead, solid when engaged ---- */
  HOOKS.mapDraw.push((g, lw) => {
    if (!able() || !started || !S.pts.length || (typeof NAVCHART !== 'undefined' && NAVCHART.drawing())) return; /* the chart draws its own */
    g.save();
    g.strokeStyle = S.on && !S.sus ? 'rgba(255,214,90,.95)' : 'rgba(255,214,90,.55)';
    g.lineWidth = lw(2);
    if (!(S.on && !S.sus)) g.setLineDash([lw(6), lw(5)]);
    g.beginPath();
    g.moveTo(pos.x, pos.z);
    for (let k = 0; k < S.pts.length; k++) {
      const p = S.pts[(S.i + k) % S.pts.length];
      if (!S.loop && (S.i + k) >= S.pts.length) break;
      g.lineTo(p.x, p.z);
    }
    g.stroke();
    g.setLineDash([]);
    for (let k = 0; k < S.pts.length; k++) {
      const p = S.pts[k];
      g.fillStyle = k === S.i ? '#ffd65a' : 'rgba(255,214,90,.6)';
      g.beginPath();
      g.arc(p.x, p.z, lw(k === S.i ? 4 : 3), 0, 7);
      g.fill();
    }
    g.restore();
  });
  /* ---- what the simulator and the chart call ---- */
  return Object.assign(S, {
    able,
    load,
    save,
    brg,
    threat,
    /* the point to steer for now, or null (not engaged, suspended, or no route) */
    aim: () => (able() && S.on && !S.sus && S.pts.length ? S.pts[Math.min(S.i, S.pts.length - 1)] : null),
    engage(v) {
      if (v && !S.pts.length) return say('NO ROUTE: LAY WAYPOINTS ON THE CHART FIRST.');
      S.on = !!v;
      S.sus = false;
      S.clrT = 0;
      S.chkT = 0;
      if (S.on) {
        if (S.i >= S.pts.length) S.i = 0;
        say('ROUTE ENGAGED. COURSE ' + fmtB(S.pts[S.i]) + ' FOR WAYPOINT ' + (S.i + 1) + '.');
        if (SIMS.cur.navGo) SIMS.cur.navGo();
      } else say('ROUTE DISENGAGED.');
    },
    /* the player takes the helm himself */
    off(why) {
      if (!S.on) return;
      S.on = false;
      S.sus = false;
      say(why || 'ROUTE DISENGAGED: THE OOD HAS HER.');
    },
    add(x, z, at) {
      const k = at == null || at > S.pts.length ? S.pts.length : Math.max(0, at);
      S.pts.splice(k, 0, { x, z });
      if (S.on && k <= S.i && S.pts.length > 1) S.i++;
      else if (!S.on) S.i = 0;
      S.sel = k;
      save();
      return k;
    },
    move(k, x, z) {
      if (!S.pts[k]) return;
      S.pts[k].x = x;
      S.pts[k].z = z;
    },
    del(k) {
      if (!S.pts[k]) return;
      S.pts.splice(k, 1);
      if (k < S.i || S.i >= S.pts.length) S.i = Math.max(0, Math.min(S.i - (k < S.i ? 1 : 0), S.pts.length - 1));
      S.sel = S.pts.length ? Math.min(k, S.pts.length - 1) : -1;
      if (!S.pts.length && S.on) S.off('ROUTE CLEARED.');
      save();
    },
    /* move waypoint k to place j in the order */
    reorder(k, j) {
      if (!S.pts[k] || j < 0 || j >= S.pts.length || j === k) return;
      const cur = S.pts[S.i],
        [p] = S.pts.splice(k, 1);
      S.pts.splice(j, 0, p);
      S.i = S.on ? Math.max(0, S.pts.indexOf(cur)) : 0 /* not engaged: she will start from the first */;
      S.sel = j;
      save();
    },
    clear() {
      S.pts = [];
      S.i = 0;
      S.sel = -1;
      if (S.on) S.off('ROUTE CLEARED.');
      save();
    },
    setLoop(v) {
      S.loop = !!v;
      save();
      say(S.loop ? 'ROUTE: LOOP ON (ROUND AGAIN AFTER THE LAST WAYPOINT).' : 'ROUTE: LOOP OFF (STOP AT THE LAST WAYPOINT).');
    },
    /* make waypoint k the one she steers for */
    goto(k) {
      if (!S.pts[k]) return;
      S.i = k;
      S.sel = k;
      if (S.on) say('COURSE ' + fmtB(S.pts[k]) + ' FOR WAYPOINT ' + (k + 1) + '.');
    },
  });
})();
