/* THE CHART TABLE (station 1, press 1 again): the OOD leans over the chart in the pilothouse and lays the route the helmsman follows
   (WAYPOINT NAVIGATION, THE CHART). The mouse works on the chart where it lies: the pointer's ray meets the table's plane, and that
   point, in the chart canvas's pixels, goes to NAVCHART (a drag carries on past the table's edge). The keys go to NAVCHART too;
   the helm (A / D) and the engines (W / S) still answer. */
const CHT = { lx: 0, ly: 0, in: false };
const chartAt = () => {
  const st = camMode == 1 && SHIP.stn === 1 && PCEM.STN[1][SHIP.sub];
  return !!(st && st.dev === 'chart' && started && !paused && !PHOTO.on && !ROAM.on && !orbitOn && !docsOpen && !pmOpen);
};
/* the pointer on the chart, in its canvas's pixels: [px, py, inside] or null */
const chartPx = (e) => {
  const F = STN.F && STN.F.qmChart;
  if (!F) return null;
  const r = cv.getBoundingClientRect(),
    nd = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1),
    ray = new THREE.Raycaster();
  cam.updateMatrixWorld();
  ray.setFromCamera(nd, cam);
  F.m.updateMatrixWorld(true);
  const M = F.m.matrixWorld,
    n = new THREE.Vector3().setFromMatrixColumn(M, 2).normalize(),
    o = new THREE.Vector3().setFromMatrixPosition(M),
    pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, o),
    hit = ray.ray.intersectPlane(pl, new THREE.Vector3());
  if (!hit) return null;
  const L = hit.applyMatrix4(new THREE.Matrix4().copy(M).invert()),
    gp = F.m.geometry.parameters,
    px = (L.x / gp.width + 0.5) * NAVCHART.W,
    py = (0.5 - L.y / gp.height) * NAVCHART.H;
  return [px, py, px >= 0 && py >= 0 && px <= NAVCHART.W && py <= NAVCHART.H];
};
const chartDown = (e) => {
  if (!chartAt()) return false;
  const p = chartPx(e);
  if (!p || !p[2]) return false; /* off the chart: the drag looks round */
  [CHT.lx, CHT.ly] = p;
  CHT.in = true;
  NAVCHART.down(p[0], p[1], e.button);
  orbDrag = false;
  e.preventDefault();
  return true;
};
const chartMove = (e) => {
  if (!CHT.in) return false;
  const p = chartPx(e);
  if (p) {
    [CHT.lx, CHT.ly] = p;
    NAVCHART.move(p[0], p[1]);
  }
  return true;
};
const chartUp = () => {
  if (!CHT.in) return;
  CHT.in = false;
  NAVCHART.up(CHT.lx, CHT.ly);
};
const chartWheel = (e) => {
  if (!chartAt()) return false;
  const p = chartPx(e);
  if (!p || !p[2]) return false;
  e.preventDefault();
  NAVCHART.wheel(p[0], p[1], e.deltaY);
  return true;
};
const chartKey = (e) => {
  if (!chartAt() || !NAVCHART.key(e.code, e.shiftKey)) return false;
  e.preventDefault();
  return true;
};
/* her route: what can she pass (the leg in water deeper than her draft and a margin, as the grounding test), and what the helmsman does */
SIMS.add({
  id: 'pce',
  navAble: true,
  navContact: () => {
    const C = ordContact();
    return !!(C && ordEnemySub(C)) /* an enemy submarine held on sonar (not the exercise boat) */;
  },
  navSay: (t) => note('NAVIGATOR: ' + t),
  navLegOK: (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 80));
    for (let k = 0; k <= n; k++) if (HR(x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n) > SHIPM.Y - 3.5) return false;
    return true;
  },
  /* engaged: under way at two-thirds if she was stopped or nearly so */
  navGo: () => {
    if (SHIP.tel < 0.3) SHIP.tel = 0.67;
  },
  /* the last waypoint: all stop, and steady where she heads */
  navDone: () => {
    SHIP.tel = 0;
    SHIP.hold = SHIP.hdg;
  },
});
if (SIMS.on('pce')) NAV.load();
