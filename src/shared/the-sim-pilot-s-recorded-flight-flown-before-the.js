/* ---------- the sim pilot's recorded flight, flown before the mission starts ----------
   The pilot (same plane, same physics as the player) flies the mission once, hidden, and its path is kept in PP.out. The green
   ring is a point a little way ahead on that path, so putting the white flight-path marker in the ring puts the player back on
   the pilot's line. The same recording is the pilot's flight in the replay afterwards. */
const PRE_MODES = { takeoff: 1, landing: 1, bomb: 1, convoy: 1, barrel: 1, immelmann: 1, splits: 1, wingover: 1, lowyoyo: 1, highyoyo: 1 };
const PP = { key: '', out: null, ok: false, ix: 0, simSum: '', simT: 0, why: '' };
function ppKey() {
  return trn.mode + (FM.on ? 'H' : 'S') + Object.keys(FM.opt).map((k) => (FM.opt[k] ? 1 : 0)).join('');
}
function ringShown() {
  return !!(PRE_MODES[trn.mode] && PP.out && PP.key === ppKey() && !RPL.busy);
}
function ppAhead(L) {
  if (trn.mode === 'convoy' && guide.kind === 'strafe') return null; /* the planned re-attack turn is the route now */
  if (RPL.busy || !PP.out || PP.key !== ppKey() || !PRE_MODES[trn.mode]) return null;
  const o = PP.out,
    n = o.length;
  if (AERO_DEF[trn.mode] && AERO_DEF[trn.mode].drone) {
    /* the yo-yos chase a moving drone, so a fixed line in space is no use: the ring is the point the sim pilot steers at in each
       step (it flew the recorded maneuver by steering at exactly this point), and it moves as the drone does */
    const A = trn.a;
    if (A && A.aim && A.aim.dir) return { ahead: { x: pos.x + A.aim.dir.x * 500, y: pos.y - 2 + A.aim.dir.y * 500, z: pos.z + A.aim.dir.z * 500 }, lat: 0, vert: 0 };
    return null;
  }
  let bi = PP.ix,
    bd = 1e18;
  for (let i = Math.max(0, PP.ix - 12); i < Math.min(n, PP.ix + 160); i++) {
    const d = o[i].p.distanceToSquared(pos);
    if (d < bd) (bd = d), (bi = i);
  }
  if (bd > 1500 * 1500) {
    /* far from where the search was looking (a long way off the line): look at the whole recording */
    for (let i = 0; i < n; i++) {
      const d = o[i].p.distanceToSquared(pos);
      if (d < bd) (bd = d), (bi = i);
    }
  }
  PP.ix = bi;
  /* bombing: the recording is the first building's attack; after it the old planned route takes over for the next building */
  if (trn.mode === 'bomb' && bi >= n - 6) return null;
  if (AERO[trn.mode] && bi >= n - 3) {
    /* the pilot has finished the maneuver: from here the ring just says "fly level on the new heading" from where you are */
    const e1 = o[n - 1].p,
      e0 = o[Math.max(0, n - 6)].p;
    let hx = e1.x - e0.x,
      hz = e1.z - e0.z;
    const hl = Math.hypot(hx, hz) || 1;
    hx /= hl;
    hz /= hl;
    return { ahead: { x: pos.x + hx * L, y: pos.y - 2, z: pos.z + hz * L }, lat: 0, vert: 0 };
  }
  const a = o[bi].p,
    b0 = o[Math.min(n - 1, bi + 4)].p;
  let tx = b0.x - a.x,
    tz = b0.z - a.z;
  const tl = Math.hypot(tx, tz) || 1;
  tx /= tl;
  tz /= tl;
  let acc = 0,
    k = bi;
  while (k < n - 1 && acc < L) {
    acc += o[k].p.distanceTo(o[k + 1].p);
    k++;
  }
  const e = o[k].p;
  let ex = e.x,
    ey = e.y,
    ez = e.z;
  if (acc < L && k > 1) {
    /* past the end of the recording: carry on in the direction it was heading */
    const d0 = o[k].p.clone().sub(o[k - 1].p).normalize(),
      r = L - acc;
    if (AERO[trn.mode]) (d0.y = 0), d0.normalize(); /* after the maneuver: carry on level */
    ex += d0.x * r;
    ey += d0.y * r;
    ez += d0.z * r;
  }
  return { ahead: { x: ex, y: ey - 2, z: ez }, lat: (pos.x - a.x) * -tz + (pos.z - a.z) * tx, vert: pos.y - a.y };
}
function rpPrefly(retry) {
  const m = trn.mode;
  if (!retry) PP.tries = 0;
  if (!PRE_MODES[m] || RPL.busy || !started || PP.off) return;
  PP.key = '';
  PP.out = null;
  PP.ix = 0;
  RPL.mc = { m, pre: true, bn: m === 'bomb' ? 1 : 0, cn: 0, srcRec: null, rec: [], sum: '' };
  RPL.busy = true;
  RPL.on = true;
  RPL.keep = true;
  RPL.snd = SND.on;
  SND.on = false;
  coachHide();
  reset();
  started = true;
  RPL.keep = false;
  RPL.sim = { m, i: 0, out: [], t0: performance.now() };
  $$('rplW').style.display = 'flex';
  $$('rplWt').textContent = 'The sim pilot is flying this mission first, to record the line you will follow...';
  requestAnimationFrame(rpSimChunk);
}
function guideState(dtOv) {
  const pts = guide.pts,
    pr = projectOnPath(pts),
    a = pts[pr.i],
    b = pts[pr.i + 1];
  let tx = b.x - a.x,
    tz = b.z - a.z;
  const tl = Math.hypot(tx, tz) || 1;
  tx /= tl;
  tz /= tl;
  let lat = (pos.x - pr.x) * -tz + (pos.z - pr.z) * tx,
    vert = pos.y - 2 - pr.y;
  const v = Math.max(45, vel.length());
  guide.Ls += ((AERO[trn.mode] ? Math.max(70, Math.min(330, v * 0.7)) : Math.max(250, Math.min(700, v * 4))) - guide.Ls) * 0.08;
  let lk = pathAt(pts, pr.s + guide.Ls);
  const pp = ppAhead(guide.Ls);
  if (pp) {
    /* the sim pilot's recorded flight is the route: the ring is a point ahead on it, and the offsets are measured from it */
    lk = pp.ahead;
    lat = pp.lat;
    vert = pp.vert;
  }
  let rx = lk.x,
    rz = lk.z,
    ry = lk.y,
    dh = 0;
  if (!(pp && AERO[trn.mode])) {
    const dxz = Math.max(150, Math.hypot(rx - pos.x, rz - pos.z)),
      trk = Math.atan2(-vel.x, -vel.z),
      brg = Math.atan2(-(rx - pos.x), -(rz - pos.z));
    dh = Math.atan2(Math.sin(brg - trk), Math.cos(brg - trk));
    dh = 0.5 * Math.tanh(dh / 0.5);
    {
      const b2 = trk + dh;
      rx = pos.x - Math.sin(b2) * dxz;
      rz = pos.z - Math.cos(b2) * dxz;
    }
    const dl = pp ? 0.3 : Math.min((guide.F && guide.F.descLim) || 0.1, 0.2) /* the pilot's own dives are steeper than the planned routes */,
      py = pos.y - 2,
      dn = dxz * dl,
      up = dxz * (pp ? 0.2 : 0.12),
      dy = ry - py;
    ry = py + (dy < 0 ? -dn * Math.tanh(-dy / dn) : up * Math.tanh(dy / up));
  }
  const nowT = performance.now(),
    dt = dtOv !== undefined ? dtOv : Math.min(0.2, (nowT - (guide.lastT || nowT)) / 1000);
  guide.lastT = nowT;
  const k = 1 - Math.exp(-dt / 0.18);
  if (!guide.rs) {
    guide.rs = { x: rx, y: ry, z: rz };
    guide.rsPlan = guide.plan;
  } else {
    if (guide.rsPlan !== guide.plan) {
      guide.rsPlan = guide.plan;
      guide.blend = 1;
    }
    guide.blend = Math.max(0, (guide.blend || 0) - dt / 1.6);
    const k2 = 1 - Math.exp(-dt / (0.18 + 0.9 * guide.blend));
    guide.rs.x += (rx - guide.rs.x) * k2;
    guide.rs.y += (ry - guide.rs.y) * k2;
    guide.rs.z += (rz - guide.rs.z) * k2;
  }
  guide.look = { x: guide.rs.x, y: guide.rs.y, z: guide.rs.z };
  guide.info =
    'PATH: ' +
    (Math.abs(lat) < 15
      ? 'on line'
      : Math.round(Math.abs(lat)) + ' m ' + (lat > 0 ? 'right' : 'left') + ' of the line') +
    ' | ' +
    (Math.abs(vert) < 12 ? 'on height' : Math.round(Math.abs(vert)) + ' m ' + (vert > 0 ? 'above' : 'below')) +
    ' | ' +
    (Math.abs(dh) < 0.07
      ? 'track good'
      : 'turn ' + (dh > 0 ? 'left' : 'right') + ' ' + Math.round(Math.abs(dh) * 57.3) + ' deg');
  if (pp && AERO[trn.mode]) guide.info = '';
  guide.vertErr = vert;
  guide.latErr = lat;
  return { bi: pr.i, s: pr.s, lat, vert, rx: guide.rs.x, ry: guide.rs.y, rz: guide.rs.z };
}
function drawCcip() {
  const cc = $$('ccip');
  if (!started || crashed || paused || (trn.done && trn.mode === 'bomb') || bmN >= 2) {
    cc.style.display = 'none';
    return;
  }
  cam.updateMatrixWorld();
  const im = bombImpact(),
    p = new V(im.x, im.y + 2, im.z).project(cam);
  if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) {
    cc.style.display = 'block';
    cc.style.left = (p.x * 0.5 + 0.5) * innerWidth + 'px';
    cc.style.top = (1 - (p.y * 0.5 + 0.5)) * innerHeight + 'px';
  } else cc.style.display = 'none';
}
