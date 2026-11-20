/* ---------- flight-path guidance: a Dubins path (turn radius from the plane's own speed and a 35 deg bank) joined to a final line with its own dive/glide angle ---------- */
const mod2 = (a) => {
  a %= Math.PI * 2;
  return a < 0 ? a + Math.PI * 2 : a;
};
function dubins(x0, y0, th0, x1, y1, th1, rho) {
  const dx = x1 - x0,
    dy = y1 - y0,
    d = Math.hypot(dx, dy) / rho,
    phi = Math.atan2(dy, dx),
    al = mod2(th0 - phi),
    be = mod2(th1 - phi),
    sa = Math.sin(al),
    sb = Math.sin(be),
    ca = Math.cos(al),
    cb = Math.cos(be),
    cab = Math.cos(al - be);
  let best = null;
  const add = (type, t, p, q) => {
    const L = t + p + q;
    if (!best || L < best.L) best = { type, t, p, q, L, rho, x0, y0, th0 };
  };
  {
    const ps = 2 + d * d - 2 * cab + 2 * d * (sa - sb);
    if (ps >= 0) {
      const tm = Math.atan2(cb - ca, d + sa - sb);
      add('LSL', mod2(-al + tm), Math.sqrt(ps), mod2(be - tm));
    }
  }
  {
    const ps = 2 + d * d - 2 * cab + 2 * d * (sb - sa);
    if (ps >= 0) {
      const tm = Math.atan2(ca - cb, d - sa + sb);
      add('RSR', mod2(al - tm), Math.sqrt(ps), mod2(-be + tm));
    }
  }
  {
    const ps = -2 + d * d + 2 * cab + 2 * d * (sa + sb);
    if (ps >= 0) {
      const p = Math.sqrt(ps),
        tm = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p);
      add('LSR', mod2(-al + tm), p, mod2(-mod2(be) + tm));
    }
  }
  {
    const ps = d * d - 2 + 2 * cab - 2 * d * (sa + sb);
    if (ps >= 0) {
      const p = Math.sqrt(ps),
        tm = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p);
      add('RSL', mod2(al - tm), p, mod2(be - tm));
    }
  }
  {
    const t0 = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8;
    if (Math.abs(t0) <= 1) {
      const phi = Math.atan2(ca - cb, d - sa + sb),
        p = mod2(2 * Math.PI - Math.acos(t0)),
        t = mod2(al - phi + mod2(p / 2)),
        q = mod2(al - be - t + mod2(p));
      add('RLR', t, p, q);
    }
  }
  {
    const t0 = (6 - d * d + 2 * cab + 2 * d * (sb - sa)) / 8;
    if (Math.abs(t0) <= 1) {
      const phi = Math.atan2(ca - cb, d + sa - sb),
        p = mod2(2 * Math.PI - Math.acos(t0)),
        t = mod2(mod2(-al) - phi + mod2(p / 2)),
        q = mod2(mod2(-al) - mod2(-be) - t + mod2(p));
      add('LRL', t, p, q);
    }
  }
  return best;
}
function dubinsSample(P, step) {
  const out = [{ x: P.x0, y: P.y0, th: P.th0 }];
  let x = P.x0,
    y = P.y0,
    th = P.th0;
  for (const [k, len] of [
    [P.type[0], P.t],
    [P.type[1], P.p],
    [P.type[2], P.q],
  ]) {
    const arc = len * P.rho,
      n = Math.max(1, Math.ceil(arc / step)),
      ds = arc / n;
    for (let i = 0; i < n; i++) {
      if (k === 'S') {
        x += Math.cos(th) * ds;
        y += Math.sin(th) * ds;
      } else {
        const dir = k === 'L' ? 1 : -1,
          dth = (dir * ds) / P.rho;
        x += P.rho * dir * (Math.sin(th + dth) - Math.sin(th));
        y += P.rho * dir * (Math.cos(th) - Math.cos(th + dth));
        th += dth;
      }
      out.push({ x, y, th });
    }
  }
  return out;
}
const guide = { on: true, t: 0, pts: [], marks: [], info: '', look: null, hdg: null, tgt: null, kind: '' };
const gSpr = [],
  gRing = [];
let gLine, gLineG;
{
  const mk = () => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x55ff88,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    s.visible = false;
    s.renderOrder = 5;
    scene.add(s);
    return s;
  };
  for (let i = 0; i < 150; i++) gSpr.push(mk());
  const rc = document.createElement('canvas');
  rc.width = rc.height = 128;
  const rx = rc.getContext('2d');
  rx.shadowColor = '#fff';
  rx.shadowBlur = 10;
  rx.strokeStyle = '#fff';
  rx.lineWidth = 9;
  rx.beginPath();
  rx.arc(64, 64, 50, 0, 7);
  rx.stroke();
  const ringTex = new THREE.CanvasTexture(rc);
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: ringTex,
        color: 0x55ff88,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    s.visible = false;
    s.renderOrder = 5;
    scene.add(s);
    gRing.push(s);
  }
  gLineG = new THREE.BufferGeometry();
  gLineG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 700), 3));
  gLineG.setDrawRange(0, 0);
  gLine = new THREE.Line(
    gLineG,
    new THREE.LineBasicMaterial({ color: 0x55ff88, transparent: true, opacity: 0.55, fog: false }),
  );
  gLine.frustumCulled = false;
  scene.add(gLine);
}
const RSM = [];
{
  const ds = 25,
    n0 = Math.ceil(1800 / ds),
    N = Math.ceil(RLEN / ds) + n0 * 2 + 1;
  for (let i = 0; i < N; i++) {
    const s = (i - n0) * ds;
    let p;
    if (s <= 0) {
      const p0 = ROADC.getPointAt(0),
        t0 = ROADC.getTangentAt(0);
      p = { x: p0.x + t0.x * s, z: p0.z + t0.z * s };
    } else if (s >= RLEN) {
      const p1 = ROADC.getPointAt(1),
        t1 = ROADC.getTangentAt(1);
      p = { x: p1.x + t1.x * (s - RLEN), z: p1.z + t1.z * (s - RLEN) };
    } else {
      const q = ROADC.getPointAt(s / RLEN);
      p = { x: q.x, z: q.z };
    }
    RSM.push(p);
  }
  const minR = () => {
    let m = 1e9;
    for (let i = 4; i < N - 4; i += 2) {
      const a = RSM[i - 4],
        b = RSM[i],
        c = RSM[i + 4],
        ab = Math.hypot(b.x - a.x, b.z - a.z),
        bc = Math.hypot(c.x - b.x, c.z - b.z),
        ca = Math.hypot(a.x - c.x, a.z - c.z),
        ar = Math.abs((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z)) / 2;
      if (ar > 0.5) m = Math.min(m, (ab * bc * ca) / (4 * ar));
    }
    return m;
  };
  for (let it = 0; it < 1500 && minR() < 1250; it++) {
    const q = RSM.map((p) => ({ x: p.x, z: p.z }));
    for (let i = 1; i < N - 1; i++) {
      RSM[i].x = 0.25 * q[i - 1].x + 0.5 * q[i].x + 0.25 * q[i + 1].x;
      RSM[i].z = 0.25 * q[i - 1].z + 0.5 * q[i].z + 0.25 * q[i + 1].z;
    }
  }
  RSM.n0 = n0;
  RSM.ds = ds;
}
function roadAt(s) {
  const f = s / RSM.ds + RSM.n0,
    i = Math.max(0, Math.min(RSM.length - 2, Math.floor(f))),
    u = Math.max(0, Math.min(1, f - i));
  return { x: RSM[i].x + (RSM[i + 1].x - RSM[i].x) * u, z: RSM[i].z + (RSM[i + 1].z - RSM[i].z) * u };
}
function roadDir(s) {
  const a = roadAt(s - 30),
    b = roadAt(s + 30);
  let x = b.x - a.x,
    z = b.z - a.z;
  const l = Math.hypot(x, z) || 1;
  return { x: x / l, z: z / l };
}
