/* a practice target's position t seconds ahead: tugs and sleeves fly their circle */
function ptAt(tg) {
  if (tg && tg.kind === 'sled') {
    /* the sled's future is the boat's track: in t seconds it will be where she was (300 m - her speed x t) ahead of it */
    const tb = PT.L.find((t) => t.kind === 'ptboat'),
      o = tg.o;
    return (t, v) => {
      const spd = Math.max(1, Math.hypot(tb.v.x, tb.v.z)),
        d = PTOW.TOW - spd * t;
      if (d >= 0) ptTrail(o, d, v);
      else v.copy(o.trail[0].p).addScaledVector(tb.v, -d / spd);
      return ((v.y = tg.p.y), v);
    };
  }
  if (!tg || !tg.o || tg.kind === 'sub' || tg.kind === 'ptboat') return null;
  const o = tg.o,
    a0 = tg.kind === 'tug' ? o.a : o.a - 450 / o.R;
  return (t, v) => {
    const a = a0 + (o.v / o.R) * t;
    const c = o.c || PT.c,
      k = o.fol ? t : 0; /* a circle that keeps station on the ship moves on with her */
    return v.set(c.x + vel.x * k + Math.cos(a) * o.R, tg.p.y, c.z + vel.z * k - Math.sin(a) * o.R);
  };
}
function gunRings() {
  const c = $$('gunRing'),
    G = GUN.cur,
    on = !!(
      G &&
      !FM.use('rings') &&
      UI.vis('ring' + G.id) &&
      camMode == 1 &&
      !PHOTO.on &&
      !ROAM.on &&
      !orbitOn &&
      !SCAM.on
    ); /* the manned gun's own rings (Settings > Sight rings) */
  if (!on) {
    if (c.dataset.on) {
      c.getContext('2d').clearRect(0, 0, c.width, c.height);
      delete c.dataset.on;
    }
    return;
  }
  c.dataset.on = 1;
  if (c.width !== innerWidth || c.height !== innerHeight) {
    c.width = innerWidth;
    c.height = innerHeight;
  }
  const g = c.getContext('2d'),
    W = c.width,
    H = c.height,
    L = [],
    zero = GUN.V[1].set(0, 0, 0);
  g.clearRect(0, 0, W, H);
  if (PT.on)
    for (const t of PT.L)
      if (t.kind === 'raft' || t.kind === 'sled' || (t.kind === 'sleeve' && !(t.gone > 0))) L.push([t.p, t.kind === 'raft' || !t.v ? zero : t.v, ptAt(t), t.m.children.find((c) => c.userData.ptRing)]);
  for (const e of EN) if (!e.dying && e.p) L.push([e.p, e.v || (e.fwd ? e.fwd.clone().multiplyScalar(e.sp || 0) : zero)]);
  for (const e of RAID.L) if (e.st !== 'down') L.push([e.p, e.v]);
  /* the enemies on the water and ashore within the gun's reach: the warships (the T-14s, the escort: not the civilian ships) and the
     guns and searchlights; their motion measured frame to frame for the lead */
  {
    const reach = G.id === '20' ? 4000 : G.id === '40' ? 9000 : 13340,
      now = performance.now() / 1000;
    for (const t of T) {
      if (t.dead || t.side === 'us' || !(t.kind === 'aa' || (t.type === 'ship' && t.kind !== 'civ')) || !t.m.visible) continue;
      const p = t.ringP || (t.ringP = new V()),
        v = t.ringV || (t.ringV = new V());
      /* steadied (the 3"/50's ring jittered on the warships): the aim point held at her waterline, not riding her pitch and heave, and
         her speed measured over the frames and smoothed, level (a frame-to-frame speed from a bobbing hull swung the lead about) */
      p.copy(t.c);
      p.y = t.kind === 'aa' ? t.c.y + 1.5 : SEA.Y + 2;
      if (t.ringT && now - t.ringT < 0.5 && now > t.ringT) {
        const k = Math.min(1, (now - t.ringT) * 1.5),
          dt = now - t.ringT;
        v.x += ((p.x - t.ringL.x) / dt - v.x) * k;
        v.z += ((p.z - t.ringL.z) / dt - v.z) * k;
        v.y = 0;
      } else v.set(0, 0, 0);
      (t.ringL || (t.ringL = new V())).copy(p);
      t.ringT = now;
      if (p.distanceTo(cam.position) <= reach) L.push([p, v]);
    }
  }
  /* the gun's effective range: the 20 mm's was about 1,000 yd (NavWeaps); the 40 mm out to its tracer burn-out and self-destruct, about
     4,000 yd; the 3"/50 its full range, 14,590 yd (13,340 m). Beyond it no sight ring: only a grey ring on the target itself (the user's,
     2026-11-21) */
  const effR = G.id === '20' ? 914 : G.id === '40' ? 3650 : 13340,
    q = new V(),
    rd = Math.min(W, H) * 0.028;
  g.lineWidth = 2.5;
  g.strokeStyle = 'rgba(255,170,40,0.95)';
  g.font = 'bold ' + Math.round(H * 0.018) + 'px monospace';
  g.textAlign = 'center';
  const now = performance.now() / 1000;
  for (const [tp, tv, at, mark] of L) {
    const dist = tp.distanceTo(cam.position),
      far = dist > effR;
    const out = far || !gunAim(G, tp, tv, q, at);
    if (out) {
      /* out of range: no sight ring; the target's own ring turns grey (a practice target's marker), or, with no marker, a grey ring
         on the target itself: one ring only (the user's, 2026-11-21) */
      if (mark) {
        mark.userData.outT = now;
        continue;
      }
      q.copy(tp);
    } else {
      /* the ring goes where the sight must be laid for the bore to point at the aim point: the sight looks parallel to the bore from the
       pointer's eye, a metre or two to one side of the barrels, so the ring is drawn along the muzzle-to-aim-point line from the eye
       (drawn from the eye straight at the aim point, the shells passed that metre or two wide: enough to miss a sleeve). The 3"/50's
       line of sight also lies the sight's superelevation below the bore */
      const d = q.clone().sub(gunMz(G, GUN.V[3]));
      if (G.se) d.applyAxisAngle(GUN.V[2].set(0, 0, 1).transformDirection(G.m.tr.matrixWorld), -G.se);
      q.copy(cam.position).add(d);
    }
    const v = q.project(cam);
    if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue;
    const x = ((v.x + 1) / 2) * W,
      y = ((1 - v.y) / 2) * H;
    g.strokeStyle = out ? 'rgba(190,190,190,0.85)' : 'rgba(255,170,40,0.95)'; /* grey: out of the gun's range */
    g.beginPath();
    g.arc(x, y, rd, 0, Math.PI * 2);
    g.moveTo(x - rd * 0.25, y);
    g.lineTo(x + rd * 0.25, y);
    g.moveTo(x, y - rd * 0.25);
    g.lineTo(x, y + rd * 0.25);
    g.stroke();
  }
}
