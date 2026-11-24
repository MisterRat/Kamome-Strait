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
    /* the IJN base's fighter strip (the user's, 2026-11-21): west-south-west of Port Ugaki, about as far from it (10.8 km) as PT Base
       Halsey is from Fletcher Field (11.0 km), on the low ground there; its runway east - west. Inland: no escort patrol */
    Object.assign(mk('air3', 'air', -8185, 21792, -Math.PI / 2), { inland: true }),
  ];
  /* the two naval bases (user's choice of sites, 2026-11-20): the IJN base on the north tip of the long island (far world) and the US Navy
     PT-boat base on the west shore of the big eastern island (far world; moved there from the big island's south shore, 2026-11-22). Their pads (pu along the coast, from pi inland to po seaward, blend pb)
     are cut into WH (far) and HR (home) like the colonial ports'. */
  const nav = [
    mk('navjp', 'naval', 2025, 19175, -Math.PI / 2),
    /* PT Base Halsey moved (the user's, 2026-11-22) across the strait to the west shore of the big eastern island, 9.6 km east of Depot
       Nimitz: out of reach of the enemy's shore batteries and the IJN base's ships (18.5 km from the nearest battery, which opens fire
       inside 14 km), so the PCE can patrol in front of it without engaging them. Its sea to the west-south-west */
    mk('navus', 'naval', 18565, 10749, 2.725),
    /* the US Navy supply depot (the user's, 2026-11-21): on the south shore of the islet 9.6 km west of the PT base, across the strait */
    mk('navusd', 'naval', 8959, 11470, Math.PI / 2),
  ]; /* O on the waterline (the sea is at -8) */
  /* SUBMARINE BASE LOCKWOOD (the user's, 2026-11-23: the spot on the briefing map, north-east of PT Base Halsey; PLAN_Roncador_SS-301
     4): an atoll after Majuro, scaled down: a ring reef about 6.6 km across, awash, with low islets on it a metre or two above the sea,
     a lagoon 50 m deep and one deep pass, on the side toward PT Base Halsey. ATOLL.R(th) is the reef's radius at angle th (x east, z
     south); the islets are capsules on it: the base islet (its yard is the naval pad below), the airstrip islet (a straight chord on
     the north side, 1,700 m), the signal islet at the pass, and five small ones. */
  const ATOLL = (() => {
    const C = { x: 33300, z: -18200 },
      R = (th) => 3300 + 250 * Math.sin(3 * th + 0.7) + 150 * Math.sin(5 * th + 2.1),
      TP = Math.atan2(10749 - C.z, 18565 - C.x) /* the pass: toward PT Base Halsey */,
      on = (th, k = 0) => [C.x + Math.cos(th) * (R(th) + k), C.z + Math.sin(th) * (R(th) + k)],
      seg = (t0, t1, r, k = 0) => ({ a: on(t0, k), b: on(t1, k), r }),
      TB = TP + 0.85 /* the base islet, west of the pass */,
      TA0 = -Math.PI / 2 - 0.26,
      TA1 = -Math.PI / 2 + 0.26 /* the airstrip islet, north */;
    const isl = [
      seg(TB - 0.13, TB + 0.13, 190, -40) /* the base islet */,
      seg(TA0, TA1, 210, -60) /* the airstrip islet */,
      seg(TP - 0.16, TP - 0.11, 70) /* the signal islet, at the pass's east side */,
      seg(TP + 0.11, TP + 0.17, 60),
      seg(TB + 0.45, TB + 0.62, 80),
      seg(TA1 + 0.5, TA1 + 0.72, 90),
      seg(TA1 + 1.4, TA1 + 1.6, 70),
      seg(TP - 0.9, TP - 0.7, 80),
    ];
    return { C, R, TP, TB, TA0, TA1, on, isl, PW: 230 /* the pass's half width */ };
  })();
  /* the base's yard on the base islet's lagoon shore, its sea (S) into the lagoon */
  {
    const [bx, bz] = ATOLL.on(ATOLL.TB, -40 - 150);
    nav.push(Object.assign(mk('navsub', 'naval', bx, bz, ATOLL.TB + Math.PI), { navy: 'ussub', R: 500, pu: 150, pi: -120, po: 6, pb: 60, pbo: 25, ph: -5.5, title: 'Submarine Base Lockwood' }));
  }
  /* THE ARMY'S SITES on the land south of Port Ugaki (PLAN_M4A3_Sherman_Tank 4.1, 4.5): Beach Orange on the south shore of the bay
     (its sea north), Camp Buckner behind it on a levelled pad, Buckner Range's firing points on the rising ground to the south, and the
     front: the battalion behind phase line Able (x 10,500). Each a frame like the others; pu, d0, d1: the pad (Camp Buckner's only),
     R: the rural world keeps off */
  const army = [
    Object.assign(mk('beach', 'army', 13300, 26950, -Math.PI / 2), { R: 260, title: 'Beach Orange' }),
    Object.assign(mk('camp', 'army', 13100, 27700, -Math.PI / 2), { R: 330, pu: 190, d0: -130, d1: 140, pb: 90, title: 'Camp Buckner' }),
    Object.assign(mk('range', 'army', 13300, 28700, -Math.PI / 4 - Math.PI / 2), { R: 300, title: 'Buckner Range' }),
    Object.assign(mk('front', 'army', 11150, 26800, Math.PI), { R: 450, title: 'Phase Line Able' }),
  ];
  /* each yard is cut and filled to ph, 2.5 m above still water (SEA.Y -7.97); it meets the sea in a short bank (pbo) */
  Object.assign(nav[0], { navy: 'jp', R: 500, pu: 150, pi: -190, po: 6, pb: 110, pbo: 25, ph: -5.5 });
  Object.assign(nav[1], { navy: 'us', R: 500, pu: 160, pi: -150, po: 6, pb: 110, pbo: 25, ph: -5.5 });
  Object.assign(nav[2], { navy: 'usdep', R: 450, pu: 140, pi: -150, po: 6, pb: 100, pbo: 25, ph: -5.5 });
  /* their names (the briefing map's): the Japanese after IJN admirals, as the map's other sites; the American after US Navy admirals */
  nav[0].title = 'Port Ugaki';
  list.find((s) => s.id === 'air3').title = 'Airbase Kakuta';
  nav[1].title = 'PT Base Halsey';
  nav[2].title = 'Depot Nimitz';
  nav[1].store = 2; /* full loads of ammunition for the ships it serves (the PCE); the supply ship brings more */
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
    if (s.kind === 'naval') {
      const t = Math.max(Math.max(0, Math.abs(u) - s.pu) / s.pb, Math.max(0, s.pi - d) / s.pb, Math.max(0, d - s.po) / s.pbo);
      return 1 - ssl(0, 1, t);
    }
    if (s.kind === 'army') {
      if (!s.pu) return 0;
      const t = Math.max(Math.max(0, Math.abs(u) - s.pu) / s.pb, Math.max(0, s.d0 - d) / s.pb, Math.max(0, d - s.d1) / s.pb);
      return 1 - ssl(0, 1, t);
    }
    if (s.kind === 'air') return 1 - ssl(0, 230, Math.hypot(Math.max(0, Math.abs(u) - 780), Math.max(0, -1110 - d, d + 520)));
    return 1 - ssl(0, 120, Math.hypot(Math.max(0, Math.abs(u) - 200), Math.max(0, Math.abs(d) - 150)));
  };
  /* inside the pad (plus a margin m), where nothing of the rural world may be built */
  const near = (x, z, m) => {
    for (const s of army) if (Math.hypot(x - s.O.x, z - s.O.z) < s.R + m) return true;
    if (Math.hypot(x - ATOLL.C.x, z - ATOLL.C.z) < 4200 + m) return true; /* the atoll: its islets are the base's */
    for (const s of nav) {
      if (Math.abs(x - s.O.x) > s.R + 700 || Math.abs(z - s.O.z) > s.R + 700) continue;
      const [u, d] = s.uv(x, z);
      if (Math.abs(u) < s.pu + 40 + m && d > s.pi - 40 - m && d < 260 + m) return true; /* the yard, and the piers out to sea */
    }
    for (const s of list) {
      if (Math.abs(x - s.O.x) > s.R + 700 || Math.abs(z - s.O.z) > s.R + 700) continue;
      const [u, d] = s.uv(x, z);
      if (
        s.kind === 'port'
          ? Math.abs(u) < 260 + m && d > -210 - m && d < 120 + m
          : s.kind === 'air'
            ? Math.abs(u) < 830 + m && d > -1160 - m && d < -470 + m
            : Math.abs(u) < 260 + m && Math.abs(d) < 210 + m
      )
        return true;
    }
    return false;
  };
  /* dredged channels (the user's, 2026-11-21): a straight cut [a, b] w metres wide to depth y (world height), its sides sloping over
     40 m; cut into WH like the pads. The one through the bank between the IJN base and Depot Mikawa's bay (2-6 m of water over it),
     for the base's freighter (7.8 m draught) and anything else: 12 m deep */
  const chan = [{ a: [1823, 18476], b: [773, 20634], w: 60, y: -8.15 - 12 }];
  return { list, nav, army, ATOLL, chan, wt, near, ssl, PORT_H: 1.4 };
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
  return atollH(x, z, Math.max(n * 280, -64));
}
/* the atoll (FS.ATOLL) raised off the deep sea floor h: the reef ring awash (0.7 m under), its outer face falling to the sea floor over
   700 m and its inner one to the lagoon (-58: 50 m of water) over 350 m; the pass cut 18 m deep; the islets 3 m above the sea (Majuro's are about that) */
function atollH(x, z, h) {
  const A = FS.ATOLL;
  if (!A) return h;
  const dx = x - A.C.x,
    dz = z - A.C.z;
  if (Math.abs(dx) > 4700 || Math.abs(dz) > 4700) return h;
  const th = Math.atan2(dz, dx),
    f = Math.hypot(dx, dz) - A.R(th) /* + outside the ring */,
    S = FS.ssl;
  let r = f > 0 ? -8.7 + (-64 + 8.7) * S(140, 840, f) : -8.7 + (-58 + 8.7) * S(140, 490, -f);
  /* the pass: across the ring, PW wide, 18 m deep */
  const da = Math.atan2(Math.sin(th - A.TP), Math.cos(th - A.TP)),
    lat = Math.abs(da) * (A.R(th) + f);
  if (lat < A.PW + 120 && f > -700 && f < 900) r = Math.min(r, -26 + (r + 26) * S(A.PW, A.PW + 120, lat));
  /* the islets */
  for (const c of A.isl) {
    const bx = c.b[0] - c.a[0],
      bz = c.b[1] - c.a[1],
      k = Math.max(0, Math.min(1, ((x - c.a[0]) * bx + (z - c.a[1]) * bz) / (bx * bx + bz * bz))),
      d = Math.hypot(x - c.a[0] - bx * k, z - c.a[1] - bz * k);
    if (d < c.r + 60) r = Math.max(r, -5.0 + (r + 5.0) * S(c.r - 30, c.r + 60, d));
  }
  return Math.max(h, r);
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
  for (const s of FS.nav) {
    if (Math.abs(x - s.O.x) > s.R + 900 || Math.abs(z - s.O.z) > s.R + 900) continue;
    const w = FS.wt(s, x, z);
    if (w > 0) h += (s.ph - h) * w;
  }
  for (const s of FS.army) {
    if (!s.pu || Math.abs(x - s.O.x) > s.R + 400 || Math.abs(z - s.O.z) > s.R + 400) continue;
    if (s.H == null) {
      /* the pad at the mean of its ground */
      let sum = 0,
        n = 0;
      for (const u of [-s.pu, 0, s.pu])
        for (const d of [s.d0, (s.d0 + s.d1) / 2, s.d1]) {
          const [px, pz] = s.w(u, d);
          sum += WH0(px, pz);
          n++;
        }
      s.H = sum / n;
    }
    const w = FS.wt(s, x, z);
    if (w > 0) h += (s.H - h) * w;
  }
  for (const c of FS.chan) {
    /* a dredged channel: the seabed no higher than its floor across its width, sloping back up over 40 m */
    const ax = c.a[0],
      az = c.a[1],
      bx = c.b[0] - ax,
      bz = c.b[1] - az,
      L2 = bx * bx + bz * bz,
      k = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / L2)),
      dd = Math.hypot(x - ax - bx * k, z - az - bz * k);
    if (dd < c.w / 2 + 40) h = Math.min(h, c.y + (h - c.y) * FS.ssl(c.w / 2, c.w / 2 + 40, dd));
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
  if (pw > 0) r = r * (1 - pw) + (30 + 15 * Math.sin(x * 0.0011 + 1) * Math.cos(z * 0.0013) + 6 * Math.sin((x + z) * 0.0021)) * pw;
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
  if (Math.max(Math.abs(x), Math.abs(z)) <= 14500)
    for (const s of FS.nav) {
      /* a naval base on the home map: its pad cut into the home ground (beyond, WH has it already) */
      if (Math.abs(x - s.O.x) > s.R + 900 || Math.abs(z - s.O.z) > s.R + 900) continue;
      const w = FS.wt(s, x, z);
      if (w > 0) r += (s.ph - r) * w;
    }
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
