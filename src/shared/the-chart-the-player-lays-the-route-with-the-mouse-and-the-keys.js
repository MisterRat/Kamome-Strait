/* ---------- THE CHART: the player lays the route (WAYPOINT NAVIGATION) with the mouse and the keys (the user's, 2026-11-23) ----------
   One chart for every simulator with an AI driving: north up, the world's own map (the minimap's), a 1 km / 5 km grid, the named places,
   the ships in sight, the player's own vehicle and the route. A simulator shows the canvas where it belongs (the PCE: on the chart
   table in the pilothouse) and passes the mouse and the keys on, in the canvas's own pixels (NAVCHART.W x NAVCHART.H).
   MOUSE  click the sea: a waypoint at the end of the route; click on a leg: one put into that leg; drag a waypoint: move it; right-click
          a waypoint: remove it; drag the chart: pan; the wheel: zoom about the pointer. In the list at the side: click a row to select
          it, drag a row up or down to reorder; double-click a row: steer for that waypoint now.
   KEYS   Enter engage / disengage the route; Delete or Backspace remove the selected waypoint (Shift+Delete: clear the route);
          [ and ] move the selected waypoint earlier / later; Tab and Shift+Tab select the next / previous; L loop on / off;
          - and = zoom out / in; Home centre on her.
   A leg that crosses what the simulator cannot pass (the role's navLegOK: for a ship, land and shoal water) is drawn red. */
const NAVCHART = (() => {
  const W = 1024,
    H = 830,
    MW = 772 /* the chart; the route list beside it */,
    ZM = [2.5, 5, 10, 20, 40, 80] /* metres a pixel: the chart about 2 to 60 km across */,
    V = { x: null, z: null, zi: 2 },
    D = { k: null /* 'pt', 'pan', 'row' */, i: -1, x0: 0, y0: 0, moved: false, vx: 0, vz: 0, over: -1, lastRow: -1, lastT: 0 },
    legOK = new Map(),
    ROW = 26,
    LTOP = 118;
  let drawing = false;
  const m = () => ZM[V.zi];
  const toPx = (x, z) => [MW / 2 + (x - V.x) / m(), H / 2 + (z - V.z) / m()];
  const toW = (px, py) => [V.x + (px - MW / 2) * m(), V.z + (py - H / 2) * m()];
  const centre = () => ((V.x = pos.x), (V.z = pos.z));
  /* can the vehicle go along this leg? (cached by its ends) */
  const ok = (a, b) => {
    const k = a.x + ',' + a.z + ',' + b.x + ',' + b.z;
    if (!legOK.has(k)) {
      if (legOK.size > 400) legOK.clear();
      legOK.set(k, SIMS.cur.navLegOK ? SIMS.cur.navLegOK(a.x, a.z, b.x, b.z) : true);
    }
    return legOK.get(k);
  };
  const hitPt = (px, py) => {
    let best = -1,
      bd = 14;
    NAV.pts.forEach((p, k) => {
      const [x, y] = toPx(p.x, p.z),
        d = Math.hypot(x - px, y - py);
      if (d < bd) ((bd = d), (best = k));
    });
    return best;
  };
  /* a leg near the pixel: the index to put a new waypoint at (between k-1 and k), or -1 */
  const hitLeg = (px, py) => {
    for (let k = 1; k < NAV.pts.length; k++) {
      const [ax, ay] = toPx(NAV.pts[k - 1].x, NAV.pts[k - 1].z),
        [bx, by] = toPx(NAV.pts[k].x, NAV.pts[k].z),
        L2 = (bx - ax) ** 2 + (by - ay) ** 2,
        t = L2 ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2)) : 0;
      if (t > 0.05 && t < 0.95 && Math.hypot(ax + (bx - ax) * t - px, ay + (by - ay) * t - py) < 8) return k;
    }
    return -1;
  };
  const rowAt = (px, py) => (px >= MW && py >= LTOP ? Math.floor((py - LTOP) / ROW) : -1);
  const km = (a, b) => (Math.hypot(a.x - b.x, a.z - b.z) / 1000).toFixed(1);
  const bearing = (a, b) => String(Math.round(((Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI + 360) % 360)).padStart(3, '0');
  /* ---- the picture ---- */
  function draw(g) {
    if (V.x === null) centre();
    const s = 1 / m(),
      lw = (px) => px * m();
    g.save();
    g.fillStyle = '#d9cfb0';
    g.fillRect(0, 0, W, H);
    /* the chart */
    g.save();
    g.beginPath();
    g.rect(0, 0, MW, H);
    g.clip();
    g.fillStyle = '#183049';
    g.fillRect(0, 0, MW, H);
    g.translate(MW / 2, H / 2);
    g.scale(s, s);
    g.translate(-V.x, -V.z);
    g.imageSmoothingEnabled = true;
    if (typeof mmFar === 'function') {
      mmFar();
      g.drawImage(MMF, -MFS / 2, -MFS / 2, MFS, MFS);
    }
    if (typeof mmTiles === 'function' && V.zi <= 3) mmTiles(g, Math.max(MW, H) * m() * 0.75);
    if (typeof MMT !== 'undefined') g.drawImage(MMT, -SZ / 2, -SZ / 2, SZ, SZ);
    /* a paper wash over it, so the ink reads */
    g.fillStyle = 'rgba(235,225,195,.18)';
    g.fillRect(V.x - MW * m(), V.z - H * m(), 2 * MW * m(), 2 * H * m());
    /* the grid: 1 km close in, 5 km farther out */
    const gs = V.zi <= 2 ? 1000 : 5000,
      x0 = Math.floor((V.x - MW * m()) / gs) * gs,
      z0 = Math.floor((V.z - H * m()) / gs) * gs;
    g.strokeStyle = 'rgba(20,30,40,.28)';
    g.lineWidth = lw(1);
    g.beginPath();
    for (let x = x0; x < V.x + MW * m(); x += gs) (g.moveTo(x, V.z - H * m()), g.lineTo(x, V.z + H * m()));
    for (let z = z0; z < V.z + H * m(); z += gs) (g.moveTo(V.x - MW * m(), z), g.lineTo(V.x + MW * m(), z));
    g.stroke();
    /* the ships in sight and the rest of the minimap's marks (the route there is the chart's own, below) */
    drawing = true;
    for (const fn of HOOKS.mapDraw)
      try {
        fn(g, lw);
      } catch (e) {}
    drawing = false;
    /* the named places */
    if (typeof AIRSUP !== 'undefined' && AIRSUP.places) {
      g.font = lw(15) + 'px sans-serif';
      g.textAlign = 'center';
      for (const [site, name] of AIRSUP.places()) {
        if (!name || !site || !site.O) continue;
        g.fillStyle = 'rgba(15,20,25,.85)';
        g.fillText(name, site.O.x, site.O.z - lw(10));
        g.beginPath();
        g.arc(site.O.x, site.O.z, lw(3), 0, 7);
        g.fill();
      }
    }
    /* the route: legs (red where she cannot pass), the leg she is on from her, and the waypoints */
    const P = NAV.pts;
    g.lineWidth = lw(2.5);
    for (let k = 1; k < P.length + (NAV.loop && P.length > 2 ? 1 : 0); k++) {
      const a = P[k - 1],
        b = P[k % P.length];
      g.strokeStyle = ok(a, b) ? (k % P.length === NAV.i && NAV.on ? '#b8860b' : '#2b3a8c') : '#d0281e';
      if (k === P.length) g.setLineDash([lw(8), lw(6)]);
      g.beginPath();
      g.moveTo(a.x, a.z);
      g.lineTo(b.x, b.z);
      g.stroke();
      g.setLineDash([]);
    }
    if (P.length) {
      const t = P[Math.min(NAV.i, P.length - 1)];
      g.strokeStyle = NAV.on && !NAV.sus ? (ok(pos, t) ? '#b8860b' : '#d0281e') : 'rgba(43,58,140,.6)';
      g.setLineDash([lw(6), lw(5)]);
      g.beginPath();
      g.moveTo(pos.x, pos.z);
      g.lineTo(t.x, t.z);
      g.stroke();
      g.setLineDash([]);
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold ' + lw(13) + 'px sans-serif';
    P.forEach((p, k) => {
      const cur = k === NAV.i && NAV.on;
      g.fillStyle = cur ? '#ffd65a' : '#f3ecd6';
      g.strokeStyle = k === NAV.sel ? '#000' : '#2b3a8c';
      g.lineWidth = lw(k === NAV.sel ? 3 : 2);
      g.beginPath();
      g.arc(p.x, p.z, lw(11), 0, 7);
      g.fill();
      g.stroke();
      g.fillStyle = '#111';
      g.fillText(String(k + 1), p.x, p.z + lw(1));
    });
    /* her: a hull pointing her way */
    g.save();
    g.translate(pos.x, pos.z);
    g.rotate(Math.atan2(fwd.x, -fwd.z));
    g.scale(lw(1), lw(1));
    g.fillStyle = '#111';
    g.strokeStyle = '#fff';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, -13);
    g.lineTo(5, -3);
    g.lineTo(5, 9);
    g.lineTo(-5, 9);
    g.lineTo(-5, -3);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
    g.restore();
    /* the chart's frame, north arrow and scale */
    g.strokeStyle = '#3b3122';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, MW - 3, H - 3);
    g.fillStyle = '#1b1b1b';
    g.font = 'bold 22px serif';
    g.textAlign = 'center';
    g.fillText('N', 34, 30);
    g.beginPath();
    g.moveTo(34, 40);
    g.lineTo(26, 62);
    g.lineTo(34, 56);
    g.lineTo(42, 62);
    g.closePath();
    g.fill();
    const sb = [20000, 10000, 5000, 2000, 1000, 500].find((v) => v / m() <= 220) || 500,
      sw = sb / m();
    g.fillStyle = 'rgba(243,236,214,.85)';
    g.fillRect(14, H - 44, sw + 24, 32);
    g.fillStyle = '#1b1b1b';
    g.fillRect(26, H - 24, sw, 5);
    g.font = '15px sans-serif';
    g.textAlign = 'left';
    g.fillText(sb / 1000 + ' km', 26, H - 32);
    /* the route list */
    g.fillStyle = '#efe6c9';
    g.fillRect(MW, 0, W - MW, H);
    g.fillStyle = '#1b1b1b';
    g.font = 'bold 22px sans-serif';
    g.fillText('ROUTE', MW + 14, 30);
    g.font = 'bold 16px sans-serif';
    g.fillStyle = NAV.on ? (NAV.sus ? '#b3261e' : '#1f6b2a') : '#5a5a5a';
    g.fillText(NAV.on ? (NAV.sus ? 'SUSPENDED: ENEMY' : 'ENGAGED') : P.length ? 'NOT ENGAGED' : 'NO WAYPOINTS', MW + 14, 58);
    g.fillStyle = '#1b1b1b';
    g.font = '15px sans-serif';
    g.fillText('Loop ' + (NAV.loop ? 'ON' : 'OFF') + ' · ' + P.length + ' waypoint' + (P.length === 1 ? '' : 's'), MW + 14, 82);
    let tot = 0;
    for (let k = 1; k < P.length; k++) tot += Math.hypot(P[k].x - P[k - 1].x, P[k].z - P[k - 1].z);
    g.fillText('Total ' + (tot / 1000).toFixed(1) + ' km', MW + 14, 102);
    const rows = Math.floor((H - LTOP - 150) / ROW);
    for (let k = 0; k < Math.min(P.length, rows); k++) {
      const y = LTOP + k * ROW,
        from = k === 0 ? pos : P[k - 1];
      if (k === NAV.sel) {
        g.fillStyle = 'rgba(43,58,140,.22)';
        g.fillRect(MW + 4, y, W - MW - 8, ROW - 2);
      }
      g.fillStyle = k === NAV.i && NAV.on ? '#8a5a00' : '#1b1b1b';
      g.font = (k === NAV.i && NAV.on ? 'bold ' : '') + '16px monospace';
      g.fillText((k === NAV.i && NAV.on ? '▶' : ' ') + String(k + 1).padStart(2) + '  ' + bearing(from, P[k]) + '°  ' + km(from, P[k]).padStart(5) + ' km' + (k && !ok(P[k - 1], P[k]) ? ' !' : ''), MW + 10, y + 18);
    }
    if (D.k === 'row' && D.over >= 0) {
      g.fillStyle = '#2b3a8c';
      g.fillRect(MW + 6, LTOP + D.over * ROW - 2, W - MW - 12, 3);
    }
    if (P.length > rows) g.fillText('… ' + (P.length - rows) + ' more', MW + 14, LTOP + rows * ROW + 18);
    /* the keys */
    g.fillStyle = '#3b3122';
    g.font = '13px sans-serif';
    const help = [
      'Click sea: add · on a leg: insert',
      'Drag waypoint: move',
      'Right-click waypoint: remove',
      'Drag chart: pan · Wheel: zoom',
      'Drag a row: reorder',
      'Double-click row: steer for it',
      'Enter engage / disengage',
      'Del remove · Shift+Del clear',
      '[ ] earlier / later · Tab select',
      'L loop · - = zoom · Home: her',
    ];
    help.forEach((t, k) => g.fillText(t, MW + 10, H - 150 + k * 15));
    g.restore();
  }
  /* ---- the mouse, in the canvas's pixels ---- */
  function down(px, py, btn) {
    if (V.x === null) centre();
    const r = rowAt(px, py);
    if (px >= MW) {
      if (r >= 0 && r < NAV.pts.length) {
        const now = performance.now();
        if (r === D.lastRow && now - D.lastT < 400) NAV.goto(r);
        D.lastRow = r;
        D.lastT = now;
        NAV.sel = r;
        Object.assign(D, { k: 'row', i: r, over: -1, moved: false, x0: px, y0: py });
      }
      return true;
    }
    const k = hitPt(px, py);
    if (btn === 2) {
      if (k >= 0) NAV.del(k);
      return true;
    }
    if (k >= 0) {
      NAV.sel = k;
      Object.assign(D, { k: 'pt', i: k, moved: false, x0: px, y0: py });
    } else Object.assign(D, { k: 'pan', moved: false, x0: px, y0: py, vx: V.x, vz: V.z });
    return true;
  }
  function move(px, py) {
    if (!D.k) return false;
    if (Math.hypot(px - D.x0, py - D.y0) > 4) D.moved = true;
    if (D.k === 'pt' && D.moved) {
      const [x, z] = toW(Math.min(MW - 2, Math.max(2, px)), Math.min(H - 2, Math.max(2, py)));
      NAV.move(D.i, x, z);
    } else if (D.k === 'pan' && D.moved) {
      V.x = D.vx - (px - D.x0) * m();
      V.z = D.vz - (py - D.y0) * m();
    } else if (D.k === 'row' && D.moved) D.over = Math.max(0, Math.min(NAV.pts.length, Math.round((py - LTOP) / ROW)));
    return true;
  }
  function up(px, py) {
    if (!D.k) return false;
    if (D.k === 'pan' && !D.moved && px != null && px < MW) {
      const [x, z] = toW(px, py),
        L = hitLeg(px, py);
      NAV.add(x, z, L >= 0 ? L : null);
    } else if (D.k === 'pt' && D.moved) NAV.save();
    else if (D.k === 'row' && D.moved && D.over >= 0) NAV.reorder(D.i, D.over > D.i ? D.over - 1 : D.over);
    D.k = null;
    D.over = -1;
    return true;
  }
  function wheel(px, py, dy) {
    if (px >= MW) return true;
    const [x, z] = toW(px, py),
      zi = Math.max(0, Math.min(ZM.length - 1, V.zi + (dy > 0 ? 1 : -1)));
    if (zi === V.zi) return true;
    V.zi = zi;
    /* keep the point under the pointer where it is */
    V.x = x - (px - MW / 2) * m();
    V.z = z - (py - H / 2) * m();
    return true;
  }
  /* ---- the keys ---- */
  function key(code, shift) {
    const n = NAV.pts.length;
    switch (code) {
      case 'Enter':
      case 'NumpadEnter':
        NAV.engage(!NAV.on);
        return true;
      case 'Delete':
      case 'Backspace':
        if (shift && code === 'Delete') NAV.clear();
        else if (NAV.sel >= 0) NAV.del(NAV.sel);
        return true;
      case 'BracketLeft':
        if (NAV.sel > 0) NAV.reorder(NAV.sel, NAV.sel - 1);
        return true;
      case 'BracketRight':
        if (NAV.sel >= 0 && NAV.sel < n - 1) NAV.reorder(NAV.sel, NAV.sel + 1);
        return true;
      case 'Tab':
        if (n) NAV.sel = (NAV.sel + (shift ? n - 1 : 1) + n) % n;
        return true;
      case 'KeyL':
        NAV.setLoop(!NAV.loop);
        return true;
      case 'Minus':
      case 'NumpadSubtract':
        V.zi = Math.min(ZM.length - 1, V.zi + 1);
        return true;
      case 'Equal':
      case 'NumpadAdd':
        V.zi = Math.max(0, V.zi - 1);
        return true;
      case 'Home':
        centre();
        return true;
    }
    return false;
  }
  return { W, H, MW, V, draw, down, move, up, wheel, key, centre, drawing: () => drawing, toPx, toW };
})();
