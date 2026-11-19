/* ---------- the far sites: two colonial harbours, two enemy airbases and two enemy convoy bases, each on a levelled pad of the far world ----------
   Every site has a frame: O is a point on its shore, S the unit vector out to sea, A along the coast, and (u, d) its own coordinates (u along the coast, d seaward, so d < 0 is inland),
   exactly like SITE for the home port. The pads are cut into WH itself, so collision, the terrain mesh and the scenery always agree. */
const FS = (() => {
  const mk = (id, kind, x, z, th, dOff) => {
    const S = { x: Math.cos(th), z: Math.sin(th) },
      A = { x: -S.z, z: S.x },
      o = { x: x + S.x * (dOff || 0), z: z + S.z * (dOff || 0) };
    return {
      id,
      kind,
      O: o,
      S,
      A,
      ryS: Math.atan2(-S.z, S.x),
      ryA: Math.atan2(-A.z, A.x),
      H: null,
      R: kind === 'air' ? 1500 : 600,
      w: (u, d) => [o.x + A.x * u + S.x * d, o.z + A.z * u + S.z * d],
      uv: (px, pz) => [(px - o.x) * A.x + (pz - o.z) * A.z, (px - o.x) * S.x + (pz - o.z) * S.z],
    };
  };
  const list = [
    mk('port1', 'port', -20951, -31510, 6.087),
    mk('port2', 'port', -11728, 17967, 5.301),
    mk('air1', 'air', -2308, -25961, 2.553),
    mk('air2', 'air', 28360, 33250, 0),
    mk('cv1', 'conv', 1472, 26239, 3.534, -300),
    mk('cv2', 'conv', -19632, -19023, 6.087, -300),
  ];
  const ssl = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  /* 1 on the pad, falling to 0 over its blend width */
  const wt = (s, x, z) => {
    const [u, d] = s.uv(x, z);
    if (s.kind === 'port') {
      const t = Math.max(Math.max(0, Math.abs(u) - 200) / 220, Math.max(0, -150 - d) / 220, Math.max(0, d - 52) / 60);
      return 1 - ssl(0, 1, t);
    }
    if (s.kind === 'air') return 1 - ssl(0, 230, Math.hypot(Math.max(0, Math.abs(u) - 780), Math.max(0, -1110 - d, d + 520)));
    return 1 - ssl(0, 120, Math.hypot(Math.max(0, Math.abs(u) - 200), Math.max(0, Math.abs(d) - 150)));
  };
  /* inside the pad (plus a margin m), where nothing of the rural world may be built */
  const near = (x, z, m) => {
    for (const s of list) {
      if (Math.abs(x - s.O.x) > s.R + 700 || Math.abs(z - s.O.z) > s.R + 700) continue;
      const [u, d] = s.uv(x, z);
      if (s.kind === 'port' ? Math.abs(u) < 260 + m && d > -210 - m && d < 120 + m : s.kind === 'air' ? Math.abs(u) < 830 + m && d > -1160 - m && d < -470 + m : Math.abs(u) < 260 + m && Math.abs(d) < 210 + m) return true;
    }
    return false;
  };
  return { list, wt, near, ssl, PORT_H: 1.4 };
})();
function WH0(x, z) {
  const ed = Math.max(Math.abs(x), Math.abs(z));
  if (ed > 51000) return -40;
  /* the same kind of noise as the home map's fbm, at about four times the scale: broad lands with long coasts, not scattered specks */
  let n = 0,
    a = 1,
    f = 1 / 12000;
  for (let i = 0; i < 6; i++) {
    n += vn(x * f + 17.3, z * f - 8.6) * a;
    a *= 0.5;
    f *= 2.1;
  }
  n = n / 1.6 + 0.5 * vn(x / 30000 + 4.2, z / 30000 - 9.1) - 0.04;
  n -= 0.85 * (1 - ss(15500, 19500, ed)); /* a channel of open sea round the home map */
  n -= 1.2 * ss(44000, 50000, ed); /* sea again at the edge of the world */
  n -= 1.0 * (1 - ss(4300, 6000, Math.hypot(x - ISL.F.x, z - ISL.F.z))); /* Kamome Field has its own island */
  if (n > 0) {
    /* broad gentle lowland first (farmland), then hills, then mountains */
    if (n < 0.2) return n * 150;
    if (n < 0.4) {
      const t = (n - 0.2) / 0.2;
      return 30 + 220 * t * t;
    }
    return Math.min(250 + 1150 * Math.pow((n - 0.4) / 0.6, 1.6), 1400);
  }
  return Math.max(n * 280, -64);
}
function WH(x, z) {
  let h = WH0(x, z);
  const L = FS.list;
  for (let i = 0; i < L.length; i++) {
    const s = L[i];
    if (Math.abs(x - s.O.x) > s.R + 900 || Math.abs(z - s.O.z) > s.R + 900) continue;
    if (s.H === null) {
      /* the pad height: a harbour is cut and filled to 3.2 m; an airbase or a compound sits at the mean level of its ground */
      if (s.kind === 'port') s.H = FS.PORT_H;
      else {
        let sum = 0,
          n = 0;
        const U = s.kind === 'air' ? [-600, 0, 600] : [-150, 0, 150],
          D = s.kind === 'air' ? [-1000, -850, -700] : [-120, 0, 120];
        for (const u of U)
          for (const d of D) {
            const [px, pz] = s.w(u, d);
            sum += WH0(px, pz);
            n++;
          }
        s.H = sum / n;
      }
    }
    const w = FS.wt(s, x, z);
    if (w > 0) h += (s.H - h) * w;
  }
  return h;
}
function HR(x, z) {
  const dz = Math.max(0, z - RW.zS, RW.zN - z),
    d = Math.hypot(Math.max(0, Math.abs(x) - 60), dz);
  const m = ss(150, 1600, d),
    n = fbm(x, z);
  let h = m * (n > 0 ? n * n * 1500 : n * 70);
  if (h > 0) {
    const cw = 1 - ss(600, 2200, Math.abs(x));
    if (cw > 0) h = h * (1 - cw) + Math.min(h, 20 + dz * 0.035) * cw;
  }
  let r = h < 0 ? h * 4 : h;
  const pw = 1 - ss(PL.R * 0.6, PL.R, Math.hypot(x - PL.cx, z - PL.cz));
  if (pw > 0)
    r =
      r * (1 - pw) + (30 + 15 * Math.sin(x * 0.0011 + 1) * Math.cos(z * 0.0013) + 6 * Math.sin((x + z) * 0.0021)) * pw;
  {
    /* the world beyond the terrain mesh is open sea (there is nothing to see there, so nothing to hit) */
    const ed = Math.max(Math.abs(x), Math.abs(z));
    /* the home land runs out into the sea along a wandering coast, not a straight line, so it meets the far world naturally */
    const ew = ed + 2600 * vn(x / 3300 + 3.1, z / 3300 - 7.7);
    if (ew > 9000) {
      const w = ss(9000, 11800, ew);
      r = r * (1 - w) + -64 * w; /* as deep as the far sea, so the water colour does not change at the edge */
    }
    if (ed > 12800) r = Math.min(r, SEA.PAINT);
    if (ed > 14500) r = WH(x, z);
    if (ed > 12000) {
      const o = ISL.h(x, z);
      if (o) r = o.h;
    }
  }
  const sp = SITE.pad(x, z);
  if (sp > 0) r = r * (1 - sp) + SITE.H0 * sp;
  const sq = SITE.pad2(x, z);
  if (sq > 0) r = r * (1 - sq) + SITE.H1 * sq;
  return r;
}
/* the ground as it is DRAWN: the terrain is a mesh of flat triangles on a 100 m grid, which sits up to a metre and more off the true
   height HR between its nodes (on crests and in hollows). Everything placed on the ground, and the ground physics, use H, so H is the
   mesh's height (HMESH, the next piece) once that is ready; until then the true height */
var HM_OK = false;
const H = (x, z) => (HM_OK ? HMESH(x, z) : Math.max(HR(x, z), SEA.PAINT));
const SZ = 26000,
  SEG = 260,
  MMT = document.createElement('canvas');
