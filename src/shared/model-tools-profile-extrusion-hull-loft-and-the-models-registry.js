/* ---------- model tools: profile extrusion, hull lofting and the MODELS registry ----------
   Every reference-built model (vehicles, ships, boats, crews, buildings) is a list of GX parts, nose or bow along +x, ground or
   waterline at y = 0, port side at -z. Each family lives in its own piece and registers here (MODELS.add), so a new type is a new
   piece plus a manifest line; the game code asks MODELS.get(id). Budgets (PLAN section 9): vehicle ~1,500 triangles, small boat
   ~3,000, cargo ship ~6,000, building ~1,500, crew figure ~300. Paint is vertex colour only (no image textures). */
const MODELS = (() => {
  const R = {};
  return {
    add: (id, fn, info) => ((R[id] = { fn, info: info || {} }), id),
    has: (id) => !!R[id],
    get: (id, ...a) => R[id].fn(...a),
    info: (id) => (R[id] ? R[id].info : null),
    ids: () => Object.keys(R),
  };
})();
(() => {
  const { part } = GX;
  /* a side profile (x along the length, y up), extruded across the width (z), centred on z = zc */
  GX.ext = (pts, w, hex, zc, o) => {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: !!(o && o.bevel), bevelSize: (o && o.bevel) || 0, bevelThickness: (o && o.bevel) || 0, bevelSegments: 1, curveSegments: 4 });
    g.translate(0, 0, -w / 2 + (zc || 0));
    return part(g, hex, 0, 0, 0);
  };
  /* a plan (x along the length, z across), extruded upward from y0 by h */
  GX.plan = (pts, h, hex, y0) => {
    const sh = new THREE.Shape();
    pts.forEach((p, i) => (i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1])));
    const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0 || 0, 0);
    return part(g, hex, 0, 0, 0);
  };
  /* a quad strip surface from rows of points (each row the same length): one part */
  GX.grid = (rows, hex) => {
    const J = rows.length,
      I = rows[0].length,
      pos = [],
      idx = [];
    for (const r of rows) for (const p of r) pos.push(p[0], p[1], p[2]);
    for (let j = 0; j < J - 1; j++)
      for (let i = 0; i < I - 1; i++) {
        const a = j * I + i,
          b = a + 1,
          c = a + I + 1,
          d = a + I;
        idx.push(a, b, c, a, c, d);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return part(g, hex, 0, 0, 0);
  };
  /* HULL LOFT. spec: { L, X0 (stern x), N (stations), sect(t) -> [[y, z], ...] half-section from the keel (z = 0) up to the deck
     edge (starboard, z >= 0), the same count of points at every station; paint(yMid) -> colour for the band between two section
     points; deck: colour (or null); transom: colour (or null, for a pointed or cruiser stern) }. t runs 0 (stern) .. 1 (stem).
     Returns parts: both sides, the deck and the transom. A station's points may close to z = 0 at the stem. */
  GX.loft = (s) => {
    const P = [],
      st = [];
    for (let i = 0; i < s.N; i++) {
      const t = i / (s.N - 1),
        x = s.X0 + s.L * t;
      st.push(s.sect(t).map(([y, z]) => [x, y, z]));
    }
    const K = st[0].length;
    for (let k = 0; k < K - 1; k++) {
      const ym = (st[(s.N / 2) | 0][k][1] + st[(s.N / 2) | 0][k + 1][1]) / 2,
        c = s.paint(ym, k);
      const a = st.map((r) => r[k]),
        b = st.map((r) => r[k + 1]),
        m = (p) => [p[0], p[1], -p[2]];
      P.push(GX.grid([a, b], c), GX.grid([b.map(m), a.map(m)], c));
    }
    if (s.deck != null) {
      const e = st.map((r) => r[K - 1]);
      P.push(GX.grid([e, e.map((p) => [p[0], p[1], -p[2]])], s.deck)); /* upward-facing */
    }
    if (s.transom != null) {
      const r = st[0],
        pts = [...r.map((p) => [p[2], p[1]]), ...r.slice().reverse().map((p) => [-p[2], p[1]])];
      const sh = new THREE.Shape();
      pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
      const g = new THREE.ShapeGeometry(sh);
      g.rotateY(-Math.PI / 2);
      g.translate(s.X0, 0, 0);
      P.push(part(g, s.transom, 0, 0, 0));
    }
    return P;
  };
  /* a part seen from both sides (a thin skin or wall): the part and a copy facing the other way */
  GX.both = (q) => {
    const g = (q.g.index ? q.g.toNonIndexed() : q.g.clone()),
      p = g.attributes.position.array;
    for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) [p[i + 3 + k], p[i + 6 + k]] = [p[i + 6 + k], p[i + 3 + k]];
    g.computeVertexNormals();
    return [q, { ...q, g }];
  };
  /* a round rod from point a to point b ([x, y, z] each), radius r (r1 at b if given): stays, columns, legs that must end where they attach */
  GX.rod = (a, b, r, hex, r1, n) => {
    const A = new THREE.Vector3(...a),
      B = new THREE.Vector3(...b),
      d = B.clone().sub(A),
      l = d.length(),
      q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
      m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    return { g: GX.cyl(r1 == null ? r : r1, r, l, n || 6), hex, m };
  };
  /* a box beam from point a to point b, w wide and h deep (its width across, in the horizontal plane when it can be) */
  GX.beam = (a, b, w, h, hex) => {
    const A = new THREE.Vector3(...a),
      B = new THREE.Vector3(...b),
      d = B.clone().sub(A),
      l = d.length(),
      q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize()),
      m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    return { g: GX.bx(l, h, w), hex, m };
  };
  /* a road wheel or tyre with a painted hub, axis across (z) */
  GX.wheel = (x, y, z, r, w, tyre, hub, n) => [
    part(GX.cyl(r, r, w, n || 12), tyre || 0x1c1c1c, x, y, z, Math.PI / 2),
    part(GX.cyl(r * 0.55, r * 0.55, w + 0.02, 8), hub, x, y, z, Math.PI / 2),
  ];
  /* a white five-pointed star decal (US), flat, facing +z unless turned */
  GX.star = (x, y, z, r, ry, rx, hex) => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        q = i % 2 ? r * 0.38 : r;
      i ? sh.lineTo(Math.cos(a) * q, Math.sin(a) * q) : sh.moveTo(Math.cos(a) * q, Math.sin(a) * q);
    }
    return part(new THREE.ShapeGeometry(sh), hex || 0xe8e8e2, x, y, z, rx || 0, ry || 0, 0);
  };
  /* a flat disc decal (a circle in a ring, roundels, the Hinomaru), facing +z unless turned */
  GX.disc = (x, y, z, r, hex, ry, rx) => part(new THREE.CircleGeometry(r, 16), hex, x, y, z, rx || 0, ry || 0, 0);
  /* camouflage: a deterministic blob pattern over the model's own frame, pal = [base, second, third], sc = blob size (m). Only the
     parts whose colour is in `base` take it, per vertex (GX.Acc q.cf), so give camouflaged panels a few segments. */
  GX.camo = (P, base, pal, sc, seed) => {
    const f = (x, y, z) => {
      const k = Math.sin(x / sc + seed) * Math.cos(y / (sc * 0.7) - seed * 0.7) + 0.7 * Math.sin((x - z * 0.8 + y) / (sc * 0.55) + seed * 1.3);
      return pal[k < -0.5 ? 1 : k > 0.55 ? 2 : 0];
    };
    P.forEach((q) => base.includes(q.hex) && ((q.cf = f), (q.cfE = sc * 0.45)));
    return P;
  };
})();
