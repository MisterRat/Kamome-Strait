/* against a bandit: the point where the bandit has to be NOW for this rocket to meet it (the rocket's drop and the bandit's own flight are both allowed for) */
function rocketAimBandit() {
  const m = rkMesh[ORD[rkN]];
  if (!m) return null;
  let e = null,
    bd = 3000;
  for (const x of EN) {
    if (x.dying || !x.v) continue;
    const d = x.p.distanceTo(pos);
    if (d < bd && fwd.dot(x.p.clone().sub(pos).normalize()) > 0.2) (bd = d), (e = x);
  }
  if (!e) return null;
  const p = worldOf(m),
    p0 = p.clone(),
    v = vel.clone().addScaledVector(fwd, 60),
    d = fwd.clone(),
    h = 1 / 60;
  let t = 0;
  while (t < 6) {
    t += h;
    if (t < 1.2) v.addScaledVector(d, 300 * h);
    v.y -= 9.8 * h * (t > 0.5 ? 1 : 0.3);
    p.addScaledVector(v, h);
    const bx = e.p.x + e.v.x * t - p0.x,
      by = e.p.y + e.v.y * t - p0.y,
      bz = e.p.z + e.v.z * t - p0.z;
    if (p.distanceToSquared(p0) >= bx * bx + by * by + bz * bz)
      return new V(p.x - e.v.x * t, p.y - e.v.y * t, p.z - e.v.z * t);
  }
  return null;
}
function drawRkip() {
  const el = $$('rkip');
  if (!started || crashed || paused || rkN >= 6 || BL.on) {
    el.style.display = 'none';
    return;
  }
  const ab = rocketAimBandit(),
    im = ab ? { x: ab.x, y: ab.y - 2, z: ab.z } : rocketImpact();
  if (!im) {
    el.style.display = 'none';
    return;
  }
  cam.updateMatrixWorld();
  const p = new V(im.x, im.y + 2, im.z).project(cam);
  if (p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) {
    el.style.display = 'block';
    el.style.left = (p.x * 0.5 + 0.5) * innerWidth + 'px';
    el.style.top = (1 - (p.y * 0.5 + 0.5)) * innerHeight + 'px';
  } else el.style.display = 'none';
}
function drawGuide() {
  drawCcip();
  drawRkip();
  drawAim();
  const on = guide.on && trn.mode !== 'free' && guide.pts.length > 1 && !crashed && started && !trn.done;
  const fd = $$('fd'),
    fpm = $$('fpm');
  if (!on) {
    fpm.style.display = 'none';
    gSpr.forEach((s) => (s.visible = false));
    gRing.forEach((s) => (s.visible = false));
    gLineG.setDrawRange(0, 0);
    fd.style.display = 'none';
    return;
  }
  const G = guideState(),
    ilsOnly = trn.mode === 'landing' || trn.mode === 'takeoff' || !!(PRE_MODES[trn.mode] && PP.out && PP.key === ppKey() && !RPL.busy) /* with the pilot's recording there is no drawn path (no dots, rings or markers), just the green ring */,
    pts = ilsOnly ? [] : guide.pts,
    bi = ilsOnly ? 0 : G.bi;
  // glowing dots + a tunnel of rings along the path, from the aircraft forward
  let n = 0,
    next = 0,
    nr = 0,
    nextR = 120;
  const s0 = G.s,
    gs = gSpr;
  for (let i = bi; i < pts.length && (n < gs.length || nr < gRing.length); i++) {
    const q = pts[i],
      col = q.fin ? 0xffd24a : 0x55ff88,
      ds = q.s - s0;
    if (ds >= next && n < gs.length) {
      const sp = gs[n++],
        dist = Math.hypot(q.x - pos.x, q.y + 2 - pos.y, q.z - pos.z);
      sp.visible = dist > 70;
      sp.position.set(q.x, q.y + 2, q.z);
      sp.material.color.setHex(col);
      sp.scale.setScalar(Math.max(3, Math.min(34, dist * 0.011)));
      next = ds + (ds < 1200 ? 36 : 90);
    }
    if (ds >= nextR && nr < gRing.length) {
      const rg = gRing[nr++],
        dist = Math.hypot(q.x - pos.x, q.y + 2 - pos.y, q.z - pos.z);
      rg.visible = dist > 170;
      rg.position.set(q.x, q.y + 2, q.z);
      rg.material.color.setHex(col);
      rg.scale.setScalar(70);
      nextR = ds + (ds < 2500 ? 250 : 500);
    }
  }
  const relP = guide.kind === 'bomb' ? liveRelease() : null;
  for (const m of ilsOnly ? [] : guide.marks) {
    if (n >= gs.length) break;
    if (m.t === 'rel' && guide.kind === 'bomb') {
      if (!relP) continue;
      m.p = { x: relP.x, y: relP.y, z: relP.z };
    }
    const sp = gs[n++];
    sp.visible = true;
    sp.position.set(m.p.x, m.p.y + 2, m.p.z);
    const dist = sp.position.distanceTo(pos);
    sp.material.color.setHex(
      m.t === 'gate' ? 0x44ddff : m.t === 'rel' || m.t === 'fire' ? 0xff5544 : m.t === 'pull' ? 0xff9a2e : 0xffffff,
    );
    sp.scale.setScalar(Math.max(14, Math.min(110, dist * 0.035)));
  }
  for (; n < gs.length; n++) gs[n].visible = false;
  for (; nr < gRing.length; nr++) gRing[nr].visible = false;
  const arr = gLineG.attributes.position.array;
  let k = 0;
  for (let i = bi; i < pts.length && k < 700; i++) {
    arr[k * 3] = pts[i].x;
    arr[k * 3 + 1] = pts[i].y + 2;
    arr[k * 3 + 2] = pts[i].z;
    k++;
  }
  gLineG.setDrawRange(0, k);
  gLineG.attributes.position.needsUpdate = true;
  // flight director ring on the HUD
  cam.updateMatrixWorld();
  const pr = new V(G.rx, G.ry + 2, G.rz).project(cam),
    behind = pr.z > 1;
  let x = pr.x,
    y = pr.y;
  if (behind) {
    x = -x;
    y = -y;
  }
  const off = behind || Math.abs(x) > 0.9 || Math.abs(y) > 0.85;
  if (off) {
    const mm = Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.85, 1e-3);
    x /= mm;
    y /= mm;
  }
  {
    const sp = vel.length();
    if (sp > 5) {
      cam.updateMatrixWorld();
      const pv = new V().copy(vel).normalize().multiplyScalar(400).add(pos).project(cam);
      if (pv.z < 1 && Math.abs(pv.x) < 1.05 && Math.abs(pv.y) < 1.05) {
        fpm.style.display = 'block';
        fpm.style.left = (pv.x * 0.5 + 0.5) * innerWidth + 'px';
        fpm.style.top = (1 - (pv.y * 0.5 + 0.5)) * innerHeight + 'px';
      } else fpm.style.display = 'none';
    }
  }
  fd.style.display = 'block';
  fd.className = off ? 'off' : '';
  fd.style.left = (x * 0.5 + 0.5) * innerWidth + 'px';
  fd.style.top = (1 - (y * 0.5 + 0.5)) * innerHeight + 'px';
  fd.style.transform = 'translate(-50%,-50%)' + (off ? ' rotate(' + Math.atan2(x, y) + 'rad)' : '');
}
function updGuide(dt) {
  guide.t -= dt;
  if (guide.t <= 0) {
    guide.t = 0.25;
    if (trn.mode === 'free' || trn.done || crashed) {
      guide.pts = [];
      guide.marks = [];
    } else planGuide();
  }
}

