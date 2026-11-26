/* THE GUNNER'S SIGHTS (station 2; PLAN_M4A3_Sherman_Tank 5.2; References/M4A3/Fire control/Fire control notes.md and its pictures 09 and
   17). Press 2 for the gunner, again for the next sight:
     M10C periscope, 1x   42 deg field: a rounded box, the 75-M61 lines for 400 and 1,600 yd only, for fast laying (picture 09, right)
     M10C periscope, 6x   11.3 deg: the full scale (picture 09, left)
     M70F telescope, 3x   12.3 deg, in the in-game gun's mount (picture 17)
   THE RETICLE 75-M61: the cross at the centre is the in-game gun's line (battle sight); the range lines below it, labelled 8, 16, 24, 32, 42
   (hundreds of yards) with unlabelled lines between, each where the M61 needs its elevation for that range (gunRange: the same flight
   as the shells, so a line on the target puts an M61 on it); short lead marks at 5 and 10 mils each side of the labelled lines. HE flies
   slower and needs more: on the real reticle the gunner corrects from his range card. Game mode: the lines labelled in yards, HE's own
   marks on the right when HE is up, and a lead mark on a moving target. Hardcore 'sights': the bare reticle.
   LAYING: the mouse lays the in-game gun (click once to capture the pointer; Esc frees it): the turret and the in-game gun follow at the mount's rates,
   finer at 6x and through the telescope. FIRE: Space or the left button (the 75); F or the right button held (the coax). Z the
   stabilizer. Q / E the round to call. The sights see along the in-game gun; the turret is not drawn from inside it. */
const GSIGHT = { cv: null, g: null, sm: 0 };
/* the sight's eye, in the turret (the periscope's head on the roof, right of the in-game gun) or on the in-game gun (the telescope, right of the tube) */
function gsightEye(st, P) {
  TANK.mesh.updateMatrixWorld(true);
  return st.sight === 't3' ? TANK.gun.localToWorld(P.set(0.4, 0.14, 0.34)) : TANK.tur.localToWorld(P.set(0.62, 0.84, 0.42));
}
const gsightOn = () => {
  const v = camMode == 1 && STATION.stn === 2 && STATION.view();
  return v && v.sight && !PHOTO.on && !ROAM.on ? v : null;
};
/* the mouse lays the in-game gun: so many radians a pixel, finer in the narrow sights */
function gsightMouse(e) {
  const v = gsightOn();
  if (!v || document.pointerLockElement !== cv) return false;
  const k = 0.0011 * (v.fov / 42);
  G75.trD -= e.movementX * k;
  G75.elW = Math.max(-0.3, Math.min(0.5, G75.elW - e.movementY * k));
  return true;
}
/* the reticle and the field's edge, drawn over the view each frame */
function gsightHud() {
  const v = gsightOn();
  if (!GSIGHT.cv) {
    const c = document.createElement('canvas');
    c.id = 'tkSight';
    c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:5;display:none /* under the drill box (6) */';
    document.body.appendChild(c);
    GSIGHT.cv = c;
    GSIGHT.g = c.getContext('2d');
    const r = document.createElement('div');
    r.id = 'tkGun';
    r.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);font:600 13px/1.4 monospace;color:#f4f0dc;background:rgba(0,0,0,.5);padding:5px 10px;border-radius:4px;pointer-events:none;z-index:41;display:none;white-space:nowrap';
    document.body.appendChild(r);
    GSIGHT.box = r;
  }
  const c = GSIGHT.cv;
  c.style.display = v ? '' : 'none';
  /* the turret and in-game gun are not drawn from inside them */
  if (TANK.tur) TANK.tur.material.visible = TANK.gun.material.visible = !v && !ldrHere();
  const showBox = v || (camMode == 1 && STATION.stn === 3 && !PHOTO.on);
  GSIGHT.box.style.display = showBox && started && !paused ? '' : 'none';
  if (showBox) GSIGHT.box.innerHTML = gsightText();
  if (!v) return;
  const W = innerWidth,
    H = innerHeight;
  if (c.width !== W || c.height !== H) (c.width = W), (c.height = H);
  const g = GSIGHT.g,
    hc = FM.use('sights'),
    ppr = H / 2 / Math.tan((v.fov * D2R_) / 2) /* pixels a radian */,
    cx = W / 2,
    cy = H / 2,
    R = H * 0.47,
    mil = 1 / 1018.6;
  g.clearRect(0, 0, W, H);
  /* the field: a round window (the 1x periscope: a wider oblong) */
  g.fillStyle = '#050505';
  g.beginPath();
  g.rect(0, 0, W, H);
  if (v.sight === 'p1') g.roundRect ? g.roundRect(cx - R * 1.35, cy - R * 0.8, R * 2.7, R * 1.6, R * 0.12) : g.rect(cx - R * 1.35, cy - R * 0.8, R * 2.7, R * 1.6);
  else g.arc(cx, cy, R, 0, 7);
  g.fill('evenodd');
  const ink = v.sight === 't3' ? 'rgba(10,10,10,.9)' : 'rgba(20,16,10,.85)';
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = Math.max(1.5, H / 500);
  g.font = 'bold ' + Math.round(H / 48) + 'px monospace';
  g.textBaseline = 'middle';
  const line = (x0, y0, x1, y1) => (g.beginPath(), g.moveTo(x0, y0), g.lineTo(x1, y1), g.stroke());
  /* the cross: the in-game gun's line */
  const cs = H * 0.025;
  line(cx - cs, cy, cx + cs, cy);
  line(cx, cy - cs, cx, cy + cs);
  /* the dashed centre line and the range lines (hundreds of yards) */
  const ranges = v.sight === 'p1' ? [4, 16] : [4, 8, 12, 16, 20, 24, 28, 32, 36, 42],
    lab = v.sight === 'p1' ? [4, 16] : [8, 16, 24, 32, 42],
    yOf = (id, hy) => cy + Math.tan(gunRange(id, hy * 91.44)) * ppr;
  g.setLineDash([H / 120, H / 160]);
  line(cx, cy + cs, cx, yOf('AP', ranges[ranges.length - 1]) + 6);
  g.setLineDash([]);
  for (const r of ranges) {
    const y = yOf('AP', r),
      big = lab.includes(r),
      w = (big ? 0.07 : 0.035) * H;
    if (y > cy + R - 10) continue;
    line(cx - w, y, cx + w, y);
    if (big) {
      for (const m of [5, 10]) {
        const dx = m * mil * ppr;
        line(cx - dx, y - H * 0.008, cx - dx, y + H * 0.008);
        line(cx + dx, y - H * 0.008, cx + dx, y + H * 0.008);
      }
      g.fillText(hc ? String(r) : r * 100 + '', cx - w - H * (hc ? 0.03 : 0.06), y);
    }
  }
  if (v.sight === 'p1') {
    g.strokeRect(cx - H * 0.1, cy - H * 0.05, H * 0.2, yOf('AP', 16) - cy + H * 0.08);
    g.fillText('75-M61', cx + H * 0.11, cy - H * 0.035);
  }
  /* game mode: HE's own marks when HE is up (it needs nearly twice the M61's elevation) */
  const up = G75.loaded || G75.loading || G75.call;
  if (!hc && up === 'HE')
    for (const r of [4, 8, 12, 16, 20])
      if (yOf('HE', r) < cy + R - 10) {
        const y = yOf('HE', r);
        g.strokeStyle = g.fillStyle = 'rgba(190,80,20,.9)';
        line(cx + H * 0.02, y, cx + H * 0.06, y);
        g.fillText('HE ' + r * 100, cx + H * 0.065, y);
        g.strokeStyle = g.fillStyle = ink;
      }
  /* game mode: the lead mark on a moving target a drill names (G75.lead: { p, v } its place and velocity) */
  if (!hc && G75.lead) {
    const L = G75.lead,
      e = gsightEye(v, V_()),
      dist = e.distanceTo(L.p),
      tof = gunFlight(G75.R[up || 'AP'], gunRange(up || 'AP', dist))[1],
      rt = V_().copy(g75Dir(V_())).cross(new THREE.Vector3(0, 1, 0)).normalize(),
      lead = (L.v.dot(rt) * tof) / dist,
      y = cy + Math.tan(gunRange(up || 'AP', dist)) * ppr,
      x = cx - lead * ppr;
    g.strokeStyle = 'rgba(30,120,40,.95)';
    g.beginPath();
    g.moveTo(x, y - 8);
    g.lineTo(x + 8, y);
    g.lineTo(x, y + 8);
    g.lineTo(x - 8, y);
    g.closePath();
    g.stroke();
  }
}
/* the gunner's (and the loader's) readout: the round in the in-game gun, the call, the racks, the stabilizer */
function gsightText() {
  const L = (id) => id + ' ' + G75.ready[id] + '/' + G75.floor[id];
  return (
    (G75.loaded ? '<b style="color:#9fe39a">' + G75.loaded + ' UP</b>' : G75.loading ? 'LOADING <b>' + G75.loading + '</b> ' + Math.max(0, G75.load).toFixed(1) + ' s' : '<b style="color:#ff8a6a">EMPTY</b>') +
    ' &middot; CALL <b>' + G75.call + '</b> (Q/E) &middot; ready/floor ' + ['AP', 'HE', 'SMK'].map(L).join(' ') +
    ' &middot; .30 ' + G75.coax.n +
    ' &middot; STAB ' + (G75.stab ? 'ON' : 'OFF') + ' (Z)' +
    (STATION.stn === 2 ? ' &middot; ' + (document.pointerLockElement === cv ? 'Space / click fire, F / right coax' : 'CLICK TO LAY THE GUN') : '')
  );
}
