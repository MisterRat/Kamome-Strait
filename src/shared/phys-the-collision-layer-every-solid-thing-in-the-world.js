/* ---------- PHYS: the collision layer. Every solid thing in the world, and what happens when two of them meet ----------
   (the user's, 2026-11-25: "the lack of collisions and consequences bothers me equally everywhere"; Rapier rather than our own.)
   Rapier (RAPIER, inlined) does the geometry: which shapes touch, and where a moving one first strikes. It runs no dynamics here:
   every collider is placed where our own code put the thing it stands for, and our own code decides what a collision does.

   WHAT IS SOLID (each a "solid": its colliders, convex hulls built from the model's own triangles, cached per geometry)
     - every target in T (buildings, hangars, towers, parked aircraft, vehicles, ships and boats: what the guns strike), as it is added;
       a dead one is no longer solid (its wreck is passed through);
     - scenery merged by a GX.Acc that says so (acc.solid = true): each item merged is its own solid (a hut, a tank, a palm), except
       the flat ones (pads, aprons) and the small (drums, crates). Scenery that leaves the scene (a far site dropped) leaves with it;
     - any object marked o.userData.solid = { name, m, mov } (or true), once it is in the scene (a parked P-51);
     - the fields (PHYS.field): things too many to keep as solids (the trees), made solid round each active as it comes near;
     - PHYS.box(x, z, yaw, hl, hw, top): a pier, a mole, a jetty: a box from the sea bed up to its deck (top, or SURF there);
     - the player's own vehicle (its role's body()) and the flying AI aircraft (PHYS.flyers sources).
   MOVERS: a solid whose thing moves (t.mov, a ship of the fleet, a flyer) has its colliders put where the thing is each frame (the
   ones far from anything that can strike them only when one comes within 3 km).
   WHAT STRIKES (actives, checked once a frame on HOOKS.tick, after everything has moved)
     - a sweep active (an aircraft) is swept along its path since the last frame (Rapier's shape cast), so it cannot pass through a
       mast between two frames; an overlap active (a ship, a tank) is checked where it stands;
     - a new contact calls its hit(other, info) (info: { v closing speed m/s, E impact energy J, p the point, n the normal (from the
       other, toward it), name }); while it lasts, touch(other, info) each frame. An active that meets an active calls both;
     - what was struck takes the blow: a target in T loses hit points by the impact energy per kilogram of it (strike, PHYS.EK).
   The masses: an aircraft its own (the P-51 4.6 t), a ship from her length (0.005 t a cubic metre of it: the PCE 880 t, a T-14 17 t),
   a vehicle 5 t, scenery, piers and buildings immovable. The energy is that of the closing speed and the two masses together.
   PHYS.show(on): every collider drawn in green (checks and screenshots); PHYS.n(): how many solids and colliders. */
const PHYS = (() => {
  const V = THREE.Vector3,
    QT = THREE.Quaternion;
  let R = null,
    W = null,
    ready = false,
    broken = false;
  const WAIT = [] /* solids registered before Rapier was ready */,
    SOL = new Set(),
    byH = new Map() /* collider handle -> solid */,
    CACHE = new WeakMap() /* geometry -> Map(scale key -> parts) */,
    ACT = new Set() /* the actives */,
    LATER = [] /* boxes whose deck height is read from SURF on the first frame (the world is built by then) */,
    SRC = [] /* the flyer sources */,
    EK = { ship: 1.25, other: 20 } /* joules a kilogram of what is struck that wreck it (strike) */;
  let nid = 0;
  const inScene = (o) => {
    while (o.parent) o = o.parent;
    return typeof scene !== 'undefined' && o === scene;
  };
  /* ---- shapes: the triangles of a model, in its own frame (its world scale baked in), into convex cells ---- */
  const _m = new THREE.Matrix4(),
    _i = new THREE.Matrix4(),
    _p = new V(),
    _q = new QT(),
    _s = new V(),
    _v = new V(),
    ZERO = { x: 0, y: 0, z: 0 };
  const skip = (m) => {
    if (!m.isMesh || m.isSprite || m.isPoints || m.isLine || m.isInstancedMesh || m.userData.wake || m.userData.noSolid) return true;
    const mt = m.material;
    if (!mt) return true;
    const one = Array.isArray(mt) ? mt[0] : mt;
    return !!(one.transparent && one.opacity < 0.9) || one.type === 'ShaderMaterial' || one.type === 'SpriteMaterial';
  };
  /* the triangle soup (9 numbers a triangle) of o and its meshes, in o's frame with o's world scale (plain array maths: this runs
     for every new model) */
  const soup = (o) => {
    o.updateMatrixWorld(true);
    o.matrixWorld.decompose(_p, _q, _s);
    _i.compose(_p, _q, _v.set(1, 1, 1)).invert();
    const chunks = [];
    let total = 0;
    const take = (m) => {
      const g = (m.userData && m.userData.near) || m.geometry;
      if (!g || !g.attributes || !g.attributes.position) return;
      _m.multiplyMatrices(_i, m.matrixWorld);
      const e = _m.elements,
        P = g.attributes.position,
        A = P.array,
        st = P.isInterleavedBufferAttribute ? P.data.stride : P.itemSize,
        of = P.isInterleavedBufferAttribute ? P.offset : 0,
        ix = g.index ? g.index.array : null,
        n = ix ? ix.length : P.count,
        out = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        const j = (ix ? ix[k] : k) * st + of,
          x = A[j],
          y = A[j + 1],
          z = A[j + 2];
        out[k * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
        out[k * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        out[k * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      }
      chunks.push(out);
      total += out.length;
    };
    const walk = (m) => {
      if (m.isLOD) {
        const l0 = m.levels && m.levels[0];
        if (l0 && l0.object) {
          if (!skip(l0.object)) take(l0.object);
          for (const c of l0.object.children) walk(c);
        }
        return;
      }
      if (!skip(m)) take(m);
      for (const c of m.children) walk(c);
    };
    walk(o);
    if (chunks.length === 1) return chunks[0];
    const S = new Float32Array(total);
    let at = 0;
    for (const c of chunks) (S.set(c, at), (at += c.length));
    return S;
  };
  /* triangles -> convex cells: the model's box cut into up to D a side (D from its size: a hut 1, a ship up to 6), each cell's points
     (the corners and points spread over the larger triangles) a hull. A point near a cell's side goes to both, so no gaps open. */
  const cells = (S, D) => {
    if (S.length < 9) return [];
    let x0 = 1e9,
      y0 = 1e9,
      z0 = 1e9,
      x1 = -1e9,
      y1 = -1e9,
      z1 = -1e9;
    for (let i = 0; i < S.length; i += 3) {
      const x = S[i],
        y = S[i + 1],
        z = S[i + 2];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
    const ex = [x1 - x0, y1 - y0, z1 - z0],
      mx = Math.max(...ex);
    D = D || Math.max(1, Math.min(6, Math.round(mx / 10)));
    const c = Math.max(mx / D, 0.5),
      n = ex.map((e) => Math.max(1, Math.min(D, Math.round(e / c)))),
      cs = ex.map((e, k) => Math.max(e / n[k], 1e-3)),
      o = [x0, y0, z0],
      C = new Map(),
      pad = 0.2,
      qd = Math.max(0.05, mx / 300) /* points closer than this are one */,
      lo = [0, 0, 0],
      hi = [0, 0, 0],
      put = (x, y, z) => {
        const ax = (x - o[0]) / cs[0],
          ay = (y - o[1]) / cs[1],
          az = (z - o[2]) / cs[2];
        lo[0] = Math.max(0, Math.min(n[0] - 1, Math.floor(ax - pad)));
        hi[0] = Math.max(0, Math.min(n[0] - 1, Math.floor(ax + pad)));
        lo[1] = Math.max(0, Math.min(n[1] - 1, Math.floor(ay - pad)));
        hi[1] = Math.max(0, Math.min(n[1] - 1, Math.floor(ay + pad)));
        lo[2] = Math.max(0, Math.min(n[2] - 1, Math.floor(az - pad)));
        hi[2] = Math.max(0, Math.min(n[2] - 1, Math.floor(az + pad)));
        const pk = Math.round(x / qd) * 73856093 + Math.round(y / qd) * 19349663 + Math.round(z / qd) * 83492791;
        for (let i = lo[0]; i <= hi[0]; i++)
          for (let j = lo[1]; j <= hi[1]; j++)
            for (let k = lo[2]; k <= hi[2]; k++) {
              const key = i + 64 * (j + 64 * k);
              let L = C.get(key);
              if (!L) C.set(key, (L = { s: new Set(), p: [] }));
              if (L.s.has(pk)) continue;
              L.s.add(pk);
              L.p.push(x, y, z);
            }
      };
    const step = Math.max(0.25, 0.4 * Math.min(...cs.map((s, k) => (n[k] > 1 ? s : 1e9)), c));
    let budget = 40000;
    for (let i = 0; i + 8 < S.length; i += 9) {
      const ax = S[i],
        ay = S[i + 1],
        az = S[i + 2],
        bx = S[i + 3],
        by = S[i + 4],
        bz = S[i + 5],
        cx = S[i + 6],
        cy = S[i + 7],
        cz = S[i + 8];
      put(ax, ay, az);
      put(bx, by, bz);
      put(cx, cy, cz);
      const e = Math.max(Math.hypot(bx - ax, by - ay, bz - az), Math.hypot(cx - bx, cy - by, cz - bz), Math.hypot(ax - cx, ay - cy, az - cz));
      if (e <= step || budget <= 0) continue;
      const k = Math.min(24, Math.ceil(e / step));
      for (let u = 0; u <= k; u++)
        for (let v = 0; v <= k - u; v++) {
          if ((u === 0 && v === 0) || (u === k && v === 0) || (u === 0 && v === k)) continue;
          const a = u / k,
            b = v / k,
            w = 1 - a - b;
          put(ax * w + bx * a + cx * b, ay * w + by * a + cy * b, az * w + bz * a + cz * b);
          budget--;
        }
    }
    const out = [];
    for (const L of C.values()) if (L.p.length >= 12) out.push(new Float32Array(L.p));
    return out;
  };
  /* the shape of o: cached by geometry (and scale) for a plain mesh; else measured */
  const shapeOf = (o, D) => {
    const g = !o.children.length && o.isMesh ? (o.userData && o.userData.near) || o.geometry : null;
    let key = null;
    if (g) {
      o.updateMatrixWorld(true);
      o.matrixWorld.decompose(_p, _q, _s);
      key = _s.x.toFixed(3) + ',' + _s.y.toFixed(3) + ',' + _s.z.toFixed(3) + ',' + (D || 0);
      const m = CACHE.get(g);
      if (m && m.has(key)) return m.get(key);
    }
    const parts = cells(soup(o), D);
    if (g) {
      if (!CACHE.has(g)) CACHE.set(g, new Map());
      CACHE.get(g).set(key, parts);
    }
    return parts;
  };
  /* a collider for a cell: its hull, or (flat: Rapier finds no hull) the box round its points */
  const desc = (pts) => {
    let d = null;
    try {
      d = R.ColliderDesc.convexHull(pts);
    } catch (e) {
      d = null;
    }
    return d || box(pts);
  };
  const box = (pts) => {
    let a = [1e9, 1e9, 1e9],
      b = [-1e9, -1e9, -1e9];
    for (let i = 0; i < pts.length; i += 3) for (let k = 0; k < 3; k++) ((a[k] = Math.min(a[k], pts[i + k])), (b[k] = Math.max(b[k], pts[i + k])));
    return R.ColliderDesc.cuboid(...[0, 1, 2].map((k) => Math.max(0.1, (b[k] - a[k]) / 2))).setTranslation(...[0, 1, 2].map((k) => (a[k] + b[k]) / 2));
  };
  /* a primitive in world space: { cap: [a, b] (V3 ends), r } a capsule, or { ball: c (V3), r } a ball */
  const _up = new V(0, 1, 0),
    _ax = new V();
  const prim = (d) => {
    if (d.ball) return R.ColliderDesc.ball(d.r).setTranslation(d.ball.x, d.ball.y, d.ball.z);
    const [a, b] = d.cap;
    _ax.copy(b).sub(a);
    const L = _ax.length() || 0.01;
    _q.setFromUnitVectors(_up, _ax.divideScalar(L));
    return R.ColliderDesc.capsule(L / 2, d.r)
      .setTranslation((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
      .setRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w });
  };
  /* ---- solids ---- */
  /* s: { o (Object3D), parts (point arrays in o's frame) | box {hx, hy, hz}, at (a fixed pose { p, q } instead of o's), name, kind,
     t (its target in T), mov (moves: posed each frame), m (mass kg, Infinity immovable), act (an active: { sweep, hit, touch }) } */
  const make = (s) => {
    if (broken) return;
    if (!ready) return void WAIT.push(s);
    try {
      const P = s.at || pose(s, {});
      s.cols = [];
      if (s.box) s.cols.push(W.createCollider(R.ColliderDesc.cuboid(s.box.hx, s.box.hy, s.box.hz).setTranslation(P.p.x, P.p.y, P.p.z).setRotation(P.q)));
      else if (s.prims) for (const d of s.prims) s.cols.push(W.createCollider(prim(d)));
      else
        for (const pts of s.parts || []) {
          let d = desc(pts),
            c = null;
          /* a hull Rapier cannot make (the points of a cell all in one plane) fails only here: then the box round them */
          for (let k = 0; k < 2 && !c; k++) {
            if (k) d = box(pts);
            const t = d.translation;
            if (t && (t.x || t.y || t.z)) (d.setTranslation(0, 0, 0), (d.off = new V(t.x, t.y, t.z)));
            try {
              c = W.createCollider(d);
            } catch (e) {
              c = null;
            }
          }
          if (!c) continue;
          if (d.off) c.off = d.off;
          s.cols.push(c);
        }
      if (!s.box && !s.prims) place(s, P);
      for (const c of s.cols) byH.set(c.handle, s);
      s.p0 = P.p.clone ? P.p.clone() : new V(P.p.x, P.p.y, P.p.z);
      s.v = new V();
      s.id = ++nid;
      if (s.act) {
        let r2 = 0;
        for (const pts of s.parts || []) for (let i = 0; i < pts.length; i += 3) r2 = Math.max(r2, pts[i] * pts[i] + pts[i + 1] * pts[i + 1] + pts[i + 2] * pts[i + 2]);
        s.rad = Math.sqrt(r2) + 0.5;
      }
      SOL.add(s);
      if (s.act) ACT.add(s);
    } catch (e) {
      s.cols = s.cols || [];
      s.err = String((e && e.message) || e) /* kept for checks */;
    }
  };
  const drop = (s) => {
    if (!s || !SOL.has(s)) {
      const i = WAIT.indexOf(s);
      if (i >= 0) WAIT.splice(i, 1);
      return;
    }
    for (const c of s.cols) {
      byH.delete(c.handle);
      try {
        W.removeCollider(c, false);
      } catch (e) {}
    }
    s.cols = [];
    SOL.delete(s);
    ACT.delete(s);
  };
  /* where a solid's thing is now: { p (V3), q (Rapier quaternion) } */
  const pose = (s, out) => {
    const o = s.o;
    o.updateWorldMatrix(true, false);
    o.matrixWorld.decompose(_p, _q, _s);
    out.p = out.p || new V();
    out.p.copy(_p);
    out.q = { x: _q.x, y: _q.y, z: _q.z, w: _q.w };
    return out;
  };
  const place = (s, P) => {
    for (const c of s.cols) {
      if (c.off) {
        _v.copy(c.off).applyQuaternion(_q.set(P.q.x, P.q.y, P.q.z, P.q.w)).add(P.p);
        c.setTranslation(_v);
      } else c.setTranslation(P.p);
      c.setRotation(P.q);
    }
  };
  /* a target's mass: a ship's from her length, an aircraft's, a vehicle's, anything else (a building, a tower, a fuel tank) 50 kg a
     cubic metre of its box */
  const massOf = (t, bb) => {
    const L = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z),
      vol = (bb.max.x - bb.min.x) * (bb.max.y - bb.min.y) * (bb.max.z - bb.min.z);
    return t.type === 'ship' ? 5 * Math.pow(L, 3) : t.type === 'plane' ? 4000 : t.mov || t.kind === 'veh' ? 5000 : Math.max(2000, 50 * vol);
  };
  const nameOf = (t) =>
    !t ? '' : t.name || (t.type === 'ship' ? 'SHIP' : t.type === 'plane' ? 'AIRCRAFT' : t.kind === 'bld' || t.type === 'hangar' ? 'BUILDING' : t.type === 'tower' ? 'TOWER' : t.kind === 'veh' || t.mov ? 'VEHICLE' : 'OBSTACLE');
  /* ---- the work of making things solid is queued and done a little at a time (at most BUDGET ms a frame, the nearest to what can
     strike them first; on the start screen in the background), so a site coming into range never shows as a hitch ---- */
  const JOBS = [],
    BUDGET = 2;
  const job = (x, z, f) => JOBS.push({ x, z, f });
  const work = (ms) => {
    if (!JOBS.length) return;
    const t0 = performance.now();
    /* the ones near an active first */
    if (ACT.size && JOBS.length > 1) {
      const A = [...ACT];
      const d = (j) => Math.min(...A.map((a) => Math.abs(a.p0.x - j.x) + Math.abs(a.p0.z - j.z)));
      for (const j of JOBS) j.d = d(j);
      JOBS.sort((a, b) => a.d - b.d);
    }
    let i = 0;
    while (i < JOBS.length && performance.now() - t0 < ms) {
      try {
        JOBS[i].f();
      } catch (e) {}
      i++;
    }
    JOBS.splice(0, i);
  };
  setInterval(() => {
    if (!ready || broken || (typeof started !== 'undefined' && started && !paused)) return;
    try {
      discover();
      work(12);
    } catch (e) {}
  }, 60);
  /* a target in T: solid as it is */
  const fromT = (t) => {
    if (!t || !t.m || t.dead || t.solid) return;
    const parts = shapeOf(t.m);
    if (!parts.length) return;
    const bb = new THREE.Box3().setFromObject(t.m);
    t.solid = { o: t.m, parts, t, name: nameOf(t), kind: t.type || t.kind, mov: true /* posed when something can strike it: SURF.settle may move it after it was made */, m: massOf(t, bb) };
    make(t.solid);
  };
  /* merged scenery: a GX.Acc with acc.solid set records each item it merges (its vertex range); the mesh made from it, once in the
     scene, makes each item a solid in world space */
  {
    const add0 = GX.Acc.prototype.add,
      geo0 = GX.Acc.prototype.geometry;
    GX.Acc.prototype.add = function (parts, T) {
      const s = this.p.length,
        r = add0.call(this, parts, T);
      if (this.solid) (this.items || (this.items = [])).push([s, this.p.length]);
      return r;
    };
    GX.Acc.prototype.geometry = function () {
      const g = geo0.call(this);
      if (this.items && this.items.length) g.userData.solids = this.items.slice();
      return g;
    };
  }
  const DONE = new WeakSet(),
    NEW = [];
  {
    const a0 = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function (...a) {
      for (const o of a) if (o && (o.isMesh || (o.children && o.children.length))) NEW.push(o);
      if (NEW.length > 20000) NEW.splice(0, 10000);
      return a0.apply(this, a);
    };
  }
  const scenery = (m) => {
    if (DONE.has(m) || !m.geometry || !m.geometry.userData.solids) return;
    DONE.add(m);
    m.updateMatrixWorld(true);
    const A = m.geometry.attributes.position.array,
      e = m.matrixWorld.elements;
    /* each item its own job: its corners into world space, its size judged, its cells made */
    for (const [a, b] of m.geometry.userData.solids)
      job(e[12] + A[a], e[14] + A[a + 2], () => {
        if (!inScene(m) || b - a < 9) return;
        const S = new Float32Array(b - a);
        let x0 = 1e9,
          y0 = 1e9,
          z0 = 1e9,
          x1 = -1e9,
          y1 = -1e9,
          z1 = -1e9;
        for (let i = a, k = 0; i + 2 < b; i += 3, k += 3) {
          const x = A[i],
            y = A[i + 1],
            z = A[i + 2],
            X = e[0] * x + e[4] * y + e[8] * z + e[12],
            Y = e[1] * x + e[5] * y + e[9] * z + e[13],
            Z = e[2] * x + e[6] * y + e[10] * z + e[14];
          S[k] = X;
          S[k + 1] = Y;
          S[k + 2] = Z;
          if (X < x0) x0 = X;
          if (X > x1) x1 = X;
          if (Y < y0) y0 = Y;
          if (Y > y1) y1 = Y;
          if (Z < z0) z0 = Z;
          if (Z > z1) z1 = Z;
        }
        const h = y1 - y0,
          w = Math.max(x1 - x0, z1 - z0);
        if (h < 0.7 || (h < 2.2 && w < 1.6)) return; /* flat (a pad, a road) or small (a drum, a crate): not an obstacle */
        const cx = (x0 + x1) / 2,
          cy = (y0 + y1) / 2,
          cz = (z0 + z1) / 2;
        for (let i = 0; i < S.length; i += 3) ((S[i] -= cx), (S[i + 1] -= cy), (S[i + 2] -= cz));
        const parts = cells(S, w > 25 || h > 25 ? 0 : 1);
        if (parts.length) make({ o: m, parts, at: { p: new V(cx, cy, cz), q: { x: 0, y: 0, z: 0, w: 1 } }, name: 'OBSTACLE', kind: 'scenery', m: Infinity, scen: true });
      });
  };
  /* an object marked solid (o.userData.solid = { name, m } or true): solid as it stands once it is in the scene (a parked aircraft) */
  const marked = (o) => {
    const u = o.userData.solid === true ? {} : o.userData.solid,
      parts = shapeOf(o, u.D);
    if (parts.length) make({ o, parts, name: u.name || 'OBSTACLE', kind: u.kind || 'scenery', m: u.m || Infinity, scen: true, mov: !!u.mov });
  };
  /* ---- the actives: the player's vehicle, and the flyers ---- */
  let me = null /* the player's body as a solid */;
  const playerBody = () => {
    const b = typeof SIMS !== 'undefined' && SIMS.cur && SIMS.cur.body ? SIMS.cur.body() : null;
    if (!b || !b.o) {
      if (me) (drop(me), (me = null));
      return;
    }
    if (me && me.o === b.o) {
      me.act = b;
      return;
    }
    if (me) drop(me);
    const parts = shapeOf(b.o, b.D);
    if (!parts.length) return;
    me = { o: b.o, parts, name: b.name || 'YOU', kind: 'player', mov: true, m: b.m || 1e5, act: b, own: true };
    make(me);
  };
  const flyers = () => {
    for (const src of SRC) {
      const L = src.list() || [];
      const live = new Set();
      for (const e of L) {
        if (!src.live(e)) continue;
        live.add(e);
        if (src.S.has(e)) continue;
        const o = src.o(e);
        if (!o) continue;
        const parts = shapeOf(o, 1);
        if (!parts.length) continue;
        const s = {
          o,
          parts,
          name: src.name || 'AIRCRAFT',
          kind: 'air',
          mov: true,
          m: src.m || 4000,
          e,
          act: { sweep: true, hit: (other, info) => src.hit(e, other, info), air: true },
        };
        src.S.set(e, s);
        make(s);
      }
      for (const [e, s] of src.S) if (!live.has(e)) (drop(s), src.S.delete(e));
    }
  };
  /* new targets and new scenery: their solids queued */
  const discover = () => {
    /* new targets, new scenery */
    if (typeof T !== 'undefined') {
      for (; nT < T.length; nT++) {
        const t = T[nT];
        if (t && t.m) job(t.m.position.x, t.m.position.z, () => fromT(t));
      }
      for (const s of SOL) if (s.t && s.t.dead) (drop(s), (s.t.solid = null));
    }
    if (NEW.length) {
      const L = NEW.splice(0, NEW.length),
        keep = [];
      for (const o of L) {
        if (!inScene(o)) {
          if (!o.parent) keep.push(o);
          continue;
        }
        o.traverse((m) => {
          if (m.userData.solid && !DONE.has(m)) (DONE.add(m), job(m.position.x, m.position.z, () => inScene(m) && marked(m)));
          else if (m.isMesh && m.geometry && m.geometry.userData.solids && !DONE.has(m)) {
            const bs = m.geometry.boundingSphere;
            job(bs ? bs.center.x : 0, bs ? bs.center.z : 0, () => inScene(m) && scenery(m));
          }
        });
      }
      NEW.push(...keep.slice(-5000));
    }
  };
  /* ---- fields: things too many to hold as solids all the time (the trees): made solid round each active, a little ahead of it, and
     let go when nothing is near. A field is { name, kind, near(x, z, R, emit) }: near calls emit(key, () => [primitives]) for each
     thing within R of (x, z) */
  const FLD = [],
    FS_ = new Map() /* key -> solid */;
  let fT = 0,
    fGen = 0;
  const fields = (dt) => {
    if (!FLD.length || (fT += dt) < 0.2) return;
    fT = 0;
    fGen++;
    for (const a of ACT) {
      /* high above the ground nothing a field holds can be met (the tallest tree is about 30 m) */
      if (typeof H === 'function' && a.p0.y - H(a.p0.x, a.p0.z) > 60 + (a.v ? Math.max(0, -a.v.y) * 0.4 : 0)) continue;
      /* where it will be over the next refresh: round the middle of that stretch, out to its ends */
      const sp = a.v ? Math.hypot(a.v.x, a.v.z) : 0,
        R2 = (a.rad || 2) + sp * 0.15 + 25,
        cx = a.p0.x + (a.v ? a.v.x * 0.1 : 0),
        cz = a.p0.z + (a.v ? a.v.z * 0.1 : 0);
      for (const f of FLD)
        f.near(cx, cz, R2, (key, build) => {
          const k = f.name + key;
          const s = FS_.get(k);
          if (s) return void (s.gen = fGen);
          const prims = build();
          if (!prims || !prims.length) return;
          const ns = { prims, name: f.name, kind: f.kind || 'field', m: Infinity, gen: fGen, at: { p: prims[0].ball || prims[0].cap[0], q: { x: 0, y: 0, z: 0, w: 1 } }, fk: k };
          FS_.set(k, ns);
          make(ns);
        });
    }
    for (const [k, s] of FS_) if (fGen - s.gen > 2) (drop(s), FS_.delete(k));
  };
  /* ---- the frame ---- */
  const P = {},
    prev = {},
    _a = new V(),
    _d = new V();
  let tSweep = 0,
    tCheck = 0,
    nT = 0;
  const NEAR = 3000;
  const mine = (s) => (c) => byH.get(c.handle) !== s;
  const ST = { n: 0, sum: 0, max: 0 } /* the pass's cost, ms: PHYS.stat() */;
  const tick = (dt) => {
    if (!ready || broken || dt <= 0) return;
    const t0 = performance.now();
    try {
      for (const f of LATER.splice(0, LATER.length)) f();
      discover();
      playerBody();
      flyers();
      fields(dt);
      work(BUDGET);
      /* scenery or targets taken out of the scene (a far site dropped): no longer solid */
      if ((tCheck += dt) > 1) {
        tCheck = 0;
        for (const s of SOL) if (s.o && !s.own && !inScene(s.o)) (drop(s), s.t && (s.t.solid = null), s.scen && DONE.delete(s.o));
      }
      /* the movers near an active go where they are now; the actives too (where they were kept for the sweep) */
      const A = [...ACT];
      for (const s of SOL) {
        if (!s.mov) continue;
        if (!s.act) {
          let nr = false;
          for (const a of A) if (Math.abs(a.p0.x - s.p0.x) < NEAR && Math.abs(a.p0.z - s.p0.z) < NEAR) ((nr = true), 0);
          if (!nr) continue;
        }
        pose(s, P);
        s.pp = s.pp || new V();
        s.pp.copy(s.p0);
        s.v.copy(P.p).sub(s.p0).divideScalar(dt);
        s.p0.copy(P.p);
        s.q0 = P.q;
        place(s, P);
      }
      W.step();
      /* each active: what it strikes. The candidates are the colliders whose boxes meet the box round its path (Rapier's index);
         then only those pairs are tested, collider against collider (no shape is rebuilt): a sweep casts its colliders from where
         they were last frame along the way it went; every active is tested where it stands now */
      const seen = new Set();
      for (const a of A) {
        if (!SOL.has(a) || !a.cols.length) continue;
        const now = new Map();
        const q = a.q0 || { x: 0, y: 0, z: 0, w: 1 };
        const sw = a.act.sweep && a.pp && (_d.copy(a.p0).sub(a.pp)).lengthSq() > 1e-6;
        if (!sw) _d.set(0, 0, 0);
        const r = a.rad || 1;
        _a.copy(a.p0).addScaledVector(_d, -0.5);
        const cand = new Set();
        W.collidersWithAabbIntersectingAabb(_a, { x: Math.abs(_d.x) / 2 + r, y: Math.abs(_d.y) / 2 + r, z: Math.abs(_d.z) / 2 + r }, (k) => {
          const o = byH.get(k.handle);
          if (o && o !== a) cand.add(o);
          return true;
        });
        if (cand.size) {
          if (sw) {
            /* back to where it was, cast along its way, then where it is */
            for (const c of a.cols) {
              const off = c.off ? _v.copy(c.off).applyQuaternion(_q.set(q.x, q.y, q.z, q.w)) : _v.set(0, 0, 0);
              c.setTranslation(_s.copy(a.pp).add(off));
            }
            for (const o of cand)
              for (const k of o.cols)
                for (const c of a.cols) {
                  const h = c.castCollider(_d, k, ZERO, 0, 1, true);
                  if (h && (!now.has(o) || now.get(o).t > h.time_of_impact)) now.set(o, { t: h.time_of_impact, p: a.pp.clone().addScaledVector(_d, h.time_of_impact), n: _d.clone().normalize().negate() });
                }
            place(a, { p: a.p0, q });
          }
          for (const o of cand) {
            if (now.has(o)) continue;
            for (const k of o.cols) {
              let hit = null;
              for (const c of a.cols) {
                const ct = c.contactCollider(k, 0.02);
                if (ct && ct.distance <= 0.02) {
                  hit = { t: 0, p: new V(ct.point2.x, ct.point2.y, ct.point2.z), n: new V(ct.normal2.x, ct.normal2.y, ct.normal2.z) };
                  break;
                }
              }
              if (hit) {
                now.set(o, hit);
                break;
              }
            }
          }
        }
        const was = a.hit0 || new Map();
        for (const [o, h] of now) {
          const info = impact(a, o, h);
          if (!was.has(o)) {
            const key = Math.min(a.id, o.id) + ',' + Math.max(a.id, o.id);
            if (seen.has(key)) continue;
            seen.add(key);
            if (o.act) (o.hit0 || (o.hit0 = new Map())).set(a, h); /* the other active has met this one too: not again from its side */
            try {
              if (a.act.hit) a.act.hit(o, info);
              if (o.act && o.act.hit) o.act.hit(a, impact(o, a, h));
              strike(o, info);
              strike(a, impact(o, a, h), true);
            } catch (e) {}
          } else if (a.act.touch) a.act.touch(o, info);
        }
        a.hit0 = now;
      }
    } catch (e) {
      if (!tick.err) ((tick.err = e), typeof console !== 'undefined' && console.warn('PHYS', e));
    }
    const ms = performance.now() - t0;
    ST.n++;
    ST.sum += ms;
    ST.max = Math.max(ST.max, ms);
  };
  /* the blow: closing speed, energy (the reduced mass of the two), the point and the normal */
  const impact = (a, o, h) => {
    const rv = _v.copy(a.v || _v.set(0, 0, 0)).sub(o.v || new V());
    const v = rv.length(),
      ma = a.m || 1e5,
      mo = o.m || Infinity,
      mu = mo === Infinity ? ma : (ma * mo) / (ma + mo);
    return { v, E: 0.5 * mu * v * v, p: h.p, n: h.n, name: o.name, t: o.t || null, other: o };
  };
  /* what was struck takes the blow: a target loses the share of its hit points that the energy per kilogram of it says (a ship's
     frame takes PHYS.EK.ship joules a kilogram to wreck; a building, a vehicle or an aircraft PHYS.EK.other): a PCE at 8 knots
     dents a freighter by about 40% and cuts a T-14 in two; a P-51 at 30 m/s wrecks a parked aircraft, at speed a hangar; a tank at
     walking pace dents a truck, at full speed wrecks it */
  const strike = (o, info) => {
    const t = o.t;
    if (!t || t.dead || typeof damage !== 'function' || !(info.E > 0)) return;
    const m = o.m === Infinity || !o.m ? 1e6 : o.m,
      f = info.E / m / (t.type === 'ship' ? EK.ship : EK.other);
    damage(t, f * (t.hp0 || t.hp || 1));
  };
  /* ---- the debug view: every collider in green ---- */
  let dbg = null;
  const show = (on) => {
    if (dbg) (scene.remove(dbg), dbg.geometry.dispose(), (dbg = null));
    if (!on || !ready) return;
    W.step();
    const b = W.debugRender();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.vertices, 3));
    dbg = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x40ff60, depthTest: false, transparent: true, opacity: 0.85 }));
    dbg.renderOrder = 10;
    dbg.frustumCulled = false;
    dbg.userData.noSolid = true;
    scene.add(dbg);
  };
  if (typeof RAPIER !== 'undefined')
    RAPIER.init()
      .then(() => {
        R = RAPIER;
        W = new R.World({ x: 0, y: 0, z: 0 });
        ready = true;
        for (const s of WAIT.splice(0, WAIT.length)) make(s);
      })
      .catch((e) => {
        broken = true;
        if (typeof console !== 'undefined') console.warn('PHYS: Rapier did not start', e);
      });
  else broken = true;
  if (typeof HOOKS !== 'undefined') HOOKS.tick.push((dt) => tick(dt));
  return {
    EK,
    get ready() {
      return ready;
    },
    /* a pier, a mole, a jetty: a box centred at (x, z), yaw as COLL's, hl along it, hw across, from the sea bed to top (or SURF) */
    box(x, z, yaw, hl, hw, top, name) {
      const t = top == null ? null : top,
        s = { box: null, name: name || 'PIER', kind: 'pier', m: Infinity };
      const go = () => {
        const y1 = t == null ? (typeof SURF === 'function' ? SURF(x, z) : SEA.Y + 2) : t,
          y0 = SEA.PLANE - 6;
        s.box = { hx: hl, hy: (y1 - y0) / 2, hz: hw };
        const qq = new QT().setFromAxisAngle(new V(0, 1, 0), yaw);
        s.at = { p: new V(x, (y0 + y1) / 2, z), q: { x: qq.x, y: qq.y, z: qq.z, w: qq.w } };
        s.p0 = s.at.p.clone();
        make(s);
      };
      if (t == null) LATER.push(go);
      else go();
      return s;
    },
    /* a source of flying AI aircraft: { name, list() the array, live(e), o(e) its Object3D, hit(e, other, info) what striking does, m } */
    flyers(src) {
      src.S = new Map();
      SRC.push(src);
    },
    solid: (s) => (make(s), s),
    /* a field of things made solid only round the actives (the trees): { name, kind, near(x, z, R, emit(key, build)) } */
    field: (f) => FLD.push(f),
    drop,
    shapeOf,
    cells,
    tick,
    show,
    /* the pass's cost since the last call: { frames, avg, max } ms (and reset) */
    stat: () => {
      const r = { frames: ST.n, avg: ST.n ? +(ST.sum / ST.n).toFixed(2) : 0, max: +ST.max.toFixed(1) };
      ST.n = ST.sum = ST.max = 0;
      return r;
    },
    n: () => ({ queued: JOBS.length, solids: SOL.size, colliders: byH.size, actives: ACT.size, waiting: WAIT.length, ready, broken }),
    /* the solids whose colliders' boxes meet a box (centre x, y, z, half sizes): [{ name, kind, x, y, z }] (checks, and AI that looks) */
    near(x, y, z, hx, hy, hz) {
      if (!ready) return [];
      const out = new Set();
      W.collidersWithAabbIntersectingAabb({ x, y, z }, { x: hx, y: hy, z: hz }, (k) => (byH.has(k.handle) && out.add(byH.get(k.handle)), true));
      return [...out].map((s) => ({ name: s.name, kind: s.kind, x: Math.round(s.p0.x), y: Math.round(s.p0.y), z: Math.round(s.p0.z) }));
    },
    /* what the player's body touches now (names): for checks */
    touching: () => (me && me.hit0 ? [...me.hit0.keys()].map((o) => o.name) : []),
  };
})();
