/* ---- OOD DRILL: NAVIGATION FIX (the quartermaster's work, now the OOD's). Three landmarks are named; take a bearing on each:
   lay the middle of the view (X: the binoculars) on it and press Space. The three lines of position are crossed on the chart
   (carried on for her run between the bearings, as a running fix is) and the fix compared with where she really was. Assessed on
   the fix's error, the size of the cocked hat (the small triangle three lines make) and the time. Normal: a marker ring on each
   landmark; Hardcore: find them yourself ---- */
/* the landmarks a navigator here would know from the chart: the bases, the airfields, the depots */
function navMarks() {
  const L = [];
  for (const s of FS.nav) L.push({ name: s.title.toUpperCase(), x: s.O.x, z: s.O.z });
  for (const s of FS.list) if (s.title) L.push({ name: s.title.toUpperCase(), x: s.O.x, z: s.O.z });
  L.push({ name: 'FLETCHER FIELD', x: 0, z: 0 });
  if (typeof ISL !== 'undefined') L.push({ name: 'KAMOME FIELD', x: ISL.F.x, z: ISL.F.z });
  if (typeof SITE !== 'undefined') L.push({ name: 'THE HOME PORT', x: SITE.O.x, z: SITE.O.z });
  return L;
}
/* the bearing (deg, true) of the middle of the view */
const viewBrg = () => {
  const d = cam.getWorldDirection(new THREE.Vector3());
  return (((Math.atan2(d.x, -d.z) * 180) / Math.PI) % 360 + 360) % 360;
};
DRILLS.push({
  id: 'fix',
  stn: 1,
  title: 'Navigation fix',
  what: 'Take bearings on three landmarks (X for the binoculars, Space for each bearing). Your fix is checked against her position.',
  start(D) {
    /* three landmarks in sight range, as well spread round her as can be (the best cut is near 60 deg apart) */
    const M = navMarks()
      .map((m) => ({ ...m, r: Math.hypot(m.x - pos.x, m.z - pos.z), b: Math.atan2(m.x - pos.x, -(m.z - pos.z)) }))
      .filter((m) => m.r > 1500 && m.r < 26000)
      .sort((a, b) => a.r - b.r)
      .slice(0, 7);
    let best = null,
      bs = -1;
    for (let i = 0; i < M.length; i++)
      for (let j = i + 1; j < M.length; j++)
        for (let k = j + 1; k < M.length; k++) {
          const T = [M[i], M[j], M[k]],
            sep = (a, b) => Math.abs(Math.sin(a.b - b.b)),
            s = Math.min(sep(T[0], T[1]), sep(T[1], T[2]), sep(T[0], T[2])) - (T[0].r + T[1].r + T[2].r) / 2e5;
          if (s > bs) ((bs = s), (best = T));
        }
    D.L = best || M.slice(0, 3);
    if (D.L.length < 3) return drillEnd(D, 0, ['<b style="color:#ff8a6a">NOT ENOUGH LANDMARKS IN SIGHT.</b> CLOSE THE COAST (WITHIN ABOUT 25 KM OF THREE OF THEM) AND TRY AGAIN.']);
    D.i = 0;
    D.took = [];
    D.rings = [];
    if (!D.hc)
      for (const m of D.L) {
        const r = ptRingSprite();
        r.position.set(m.x, 30, m.z);
        scene.add(r);
        D.rings.push(r);
      }
    drillSay('CAPTAIN', 'GIVE ME A FIX. BEARINGS ON ' + D.L.map((m) => m.name).join(', ') + '.');
  },
  stop(D) {
    for (const r of D.rings || []) scene.remove(r);
  },
  step(D, dt) {
    D.rings.forEach((r, i) => (r.visible = i === D.i));
    if (D.t > 600) this.finish(D);
  },
  key(D, code, rep) {
    if (code !== 'Space') return false;
    if (rep || D.i >= 3) return true;
    const b = viewBrg();
    D.took.push({ b, p: pos.clone(), t: D.t });
    SND.tone(880, 880, 0.1, 0.08, 'sine');
    note(D.L[D.i].name + ' BEARS ' + String(Math.round(b)).padStart(3, '0'));
    D.i++;
    if (D.i >= 3) this.finish(D);
    return true;
  },
  finish(D) {
    if (D.took.length < 3) return drillEnd(D, 0, ['<b style="color:#ff8a6a">TEN MINUTES AND NO FIX.</b>']);
    /* each line of position carried on by her run since it was taken (a running fix: the navigator knows his course and speed) */
    const P = pos.clone(),
      lines = D.took.map((k, i) => {
        const m = D.L[i],
          a = (k.b * Math.PI) / 180,
          u = { x: Math.sin(a), z: -Math.cos(a) } /* along the line, from her toward the mark */,
          run = { x: P.x - k.p.x, z: P.z - k.p.z };
        return { x: m.x + run.x, z: m.z + run.z, u };
      });
    /* the fix: the point nearest all three lines (least squares) */
    let a11 = 0,
      a12 = 0,
      a22 = 0,
      b1 = 0,
      b2 = 0;
    for (const l of lines) {
      const nx = -l.u.z,
        nz = l.u.x,
        c = nx * l.x + nz * l.z;
      a11 += nx * nx;
      a12 += nx * nz;
      a22 += nz * nz;
      b1 += nx * c;
      b2 += nz * c;
    }
    const det = a11 * a22 - a12 * a12,
      fx = (b1 * a22 - b2 * a12) / det,
      fz = (a11 * b2 - a12 * b1) / det,
      err = Math.hypot(fx - P.x, fz - P.z);
    /* the cocked hat: the largest distance between the lines' crossings */
    const X = [];
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++) {
        const A = lines[i],
          B = lines[j],
          dd = A.u.x * B.u.z - A.u.z * B.u.x;
        if (Math.abs(dd) < 1e-6) continue;
        const t = ((B.x - A.x) * B.u.z - (B.z - A.z) * B.u.x) / dd;
        X.push({ x: A.x + A.u.x * t, z: A.z + A.u.z * t });
      }
    let hat = 0;
    for (let i = 0; i < X.length; i++) for (let j = i + 1; j < X.length; j++) hat = Math.max(hat, Math.hypot(X[i].x - X[j].x, X[i].z - X[j].z));
    D.res = { fx, fz, err, hat, lines, P };
    const errs = D.took.map((k, i) => {
      const m = D.L[i],
        tb = (((Math.atan2(m.x - k.p.x, -(m.z - k.p.z)) * 180) / Math.PI) % 360 + 360) % 360;
      return Math.abs(((k.b - tb + 540) % 360) - 180);
    });
    const s = drillMark(err, 60, 600, 60) + drillMark(hat, 60, 500, 15) + drillMark(D.took[2].t, 60, 300, 25);
    drillEnd(D, s, [
      'FIX <b>' + Math.round(err) + ' M</b> FROM HER TRUE POSITION &middot; COCKED HAT ' + Math.round(hat) + ' M',
      'BEARINGS OFF BY ' + errs.map((e, i) => D.L[i].name + ' ' + e.toFixed(1) + '&deg;').join(', '),
      'THREE BEARINGS IN ' + fmtT(D.took[2].t),
    ]);
  },
  box(D) {
    const m = D.L[D.i];
    return (
      (m ? 'BEARING ON <b style="font-size:16px;color:#ffd27a">' + m.name + '</b> (' + (D.i + 1) + ' OF 3)' + (D.hc ? '' : ' - THE RING MARKS IT') : 'PLOTTING...') +
      '<br>THE MIDDLE OF YOUR VIEW BEARS <b>' + String(Math.round(viewBrg())).padStart(3, '0') + '&deg;</b> &middot; <b>' + kbText('gSight') + '</b> BINOCULARS &middot; <b>Space</b> TAKE THE BEARING' +
      (D.took.length ? '<br><span style="color:#9aa">' + D.took.map((k, i) => D.L[i].name + ' ' + String(Math.round(k.b)).padStart(3, '0') + '&deg;').join(' &middot; ') + '</span>' : '')
    );
  },
  draw(D, g, w, h) {
    /* the chart: her position (dead reckoning), the landmarks, the lines of position */
    const sc = Math.min(w, h * 3) / 2 / 26000,
      cx = w / 2,
      cy = h / 2,
      X = (x) => cx + (x - pos.x) * sc,
      Z = (z) => cy + (z - pos.z) * sc;
    g.fillStyle = '#10202b';
    g.fillRect(0, 0, w, h);
    g.font = '10px monospace';
    D.L.forEach((m, i) => {
      g.fillStyle = i === D.i ? '#ffd27a' : '#b8c4c8';
      g.fillRect(X(m.x) - 3, Z(m.z) - 3, 6, 6);
      g.fillText(m.name, X(m.x) + 5, Z(m.z) - 4);
    });
    g.strokeStyle = 'rgba(143,227,154,.8)';
    D.took.forEach((k, i) => {
      const m = D.L[i],
        a = (k.b * Math.PI) / 180;
      g.beginPath();
      g.moveTo(X(m.x), Z(m.z));
      g.lineTo(X(m.x - Math.sin(a) * 30000), Z(m.z + Math.cos(a) * 30000));
      g.stroke();
    });
    g.fillStyle = '#9fc3d6';
    g.beginPath();
    g.arc(cx, cy, 3, 0, Math.PI * 2);
    g.fill();
  },
});
