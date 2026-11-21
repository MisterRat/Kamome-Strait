/* ---------- shared geometry kit ----------
   Models are written as lists of parts (GX.part: shape + colour + position/rotation/scale). A GX.Acc bakes any number of parts, each
   through its own transform, into ONE vertex-coloured geometry = one draw call. The trees, parked aircraft, vehicles, buildings and
   the compound fences all go through this, so a fix here reaches all of them. */
const GX = (() => {
  const M4 = THREE.Matrix4,
    V3 = THREE.Vector3,
    Q = THREE.Quaternion,
    E = THREE.Euler,
    cl = new THREE.Color();
  const cyl = (a, b, l, n) => new THREE.CylinderGeometry(a, b, l, n || 12),
    bx = (a, b, c) => new THREE.BoxGeometry(a, b, c),
    sph = (n) => new THREE.SphereGeometry(1, n || 12, 8);
  /* hex colour, or c:[r,g,b] floats; rotation in radians (x, y, z); scale defaults to 1 */
  const part = (g, hex, x, y, z, rx, ry, rz, sx, sy, sz) => ({
    g,
    hex,
    src: window.__REC ? new Error().stack.split('\n').slice(2, 5).join(' ') : undefined /* the checker's source lines for each part */,
    m: new M4().compose(
      new V3(x, y, z),
      new Q().setFromEuler(new E(rx || 0, ry || 0, rz || 0)),
      new V3(sx || 1, sy || 1, sz || 1),
    ),
  });
  /* a placement matrix: position, yaw about Y, uniform scale */
  const xf = (x, y, z, yaw, k) =>
    new M4().compose(
      new V3(x, y, z),
      new Q().setFromAxisAngle(new V3(0, 1, 0), yaw || 0),
      new V3(k || 1, k || 1, k || 1),
    );
  /* split a non-indexed geometry's triangles (in halves along their longest edge) until no edge is longer than e, at most 4 times
     over: a camouflaged panel needs vertices for its pattern to land on */
  const subdiv = (g, e) => {
    let p = Array.from(g.attributes.position.array),
      n = Array.from(g.attributes.normal.array);
    for (let pass = 0; pass < 4; pass++) {
      const P2 = [],
        N2 = [];
      let split = false;
      for (let i = 0; i < p.length; i += 9) {
        const v = [0, 1, 2].map((k) => p.slice(i + k * 3, i + k * 3 + 3)),
          w = [0, 1, 2].map((k) => n.slice(i + k * 3, i + k * 3 + 3)),
          L = [0, 1, 2].map((k) => Math.hypot(...v[k].map((c, j) => c - v[(k + 1) % 3][j])));
        const k = L.indexOf(Math.max(...L));
        if (L[k] <= e) {
          P2.push(...v[0], ...v[1], ...v[2]);
          N2.push(...w[0], ...w[1], ...w[2]);
          continue;
        }
        split = true;
        const a = k,
          b = (k + 1) % 3,
          c = (k + 2) % 3,
          m = v[a].map((x, j) => (x + v[b][j]) / 2),
          mn = w[a].map((x, j) => (x + w[b][j]) / 2);
        P2.push(...v[a], ...m, ...v[c], ...m, ...v[b], ...v[c]);
        N2.push(...w[a], ...mn, ...w[c], ...mn, ...w[b], ...w[c]);
      }
      p = P2;
      n = N2;
      if (!split) break;
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  };
  class Acc {
    constructor() {
      this.p = [];
      this.n = [];
      this.c = [];
    }
    add(parts, T) {
      /* the connectivity checker (tools/connectivity.py) sets window.__REC before load: every part list built is recorded with its caller */
      if (window.__REC && parts.length > 1) {
        const r = { parts, T: T ? T.clone() : null, at: new Error().stack.split('\n').slice(2, 6).join(' | ') };
        window.__REC.push(r);
        (this.recs || (this.recs = [])).push(r);
      }
      const kd = parts.keel; /* a fitted ship: her hull below the waterline (model y < 0) deepened to her real draught (GX.fit) */
      for (const q of parts) {
        const g = q.g.index ? q.g.toNonIndexed() : q.g.clone();
        if (kd) {
          if (q.m) g.applyMatrix4(q.m);
          const p = g.attributes.position.array;
          for (let i = 1; i < p.length; i += 3) if (p[i] < -kd.c) p[i] = -kd.c + (p[i] + kd.c) * kd.k; /* the top kd.c metres stay as built */
          g.computeVertexNormals();
          if (T) g.applyMatrix4(T);
        } else {
          const m = q.m && T ? new M4().multiplyMatrices(T, q.m) : q.m || T;
          if (m) g.applyMatrix4(m);
        }
        if (q.c) cl.setRGB(q.c[0], q.c[1], q.c[2]);
        else if (!q.vc) cl.setHex(q.hex);
        if (q.cf && q.cfE) subdiv(g, q.cfE);
        const p = g.attributes.position.array,
          n = g.attributes.normal.array;
        for (let i = 0; i < p.length; i++) {
          this.p.push(p[i]);
          this.n.push(n[i]);
        }
        if (q.cf) {
          /* a painted pattern (camouflage): colour per vertex from its position in the model's own frame (q.cf(x, y, z) -> hex) */
          const iT = T ? new M4().copy(T).invert() : null,
            v = new V3();
          for (let i = 0; i < p.length; i += 3) {
            v.set(p[i], p[i + 1], p[i + 2]);
            if (iT) v.applyMatrix4(iT);
            cl.setHex(q.cf(v.x, v.y, v.z));
            this.c.push(cl.r, cl.g, cl.b);
          }
        } else if (q.vc) {
          /* a part that carries its own colours (q.vc: its geometry's colour attribute, e.g. a copy of the player's aircraft, P51DISP) */
          const c = g.attributes.color.array;
          for (let i = 0; i < p.length; i++) this.c.push(c[i]);
        } else for (let i = 0; i < p.length; i += 3) this.c.push(cl.r, cl.g, cl.b);
        g.dispose();
      }
      return this;
    }
    geometry() {
      const g = new THREE.BufferGeometry();
      if (this.recs) {
        /* the checker assembles multi-mesh models from these: a later move of the geometry (translate, scale) moves its records too */
        g.userData.recs = this.recs.map((r) => ({ ...r }));
        const own = g.applyMatrix4;
        g.applyMatrix4 = function (m) {
          for (const r of this.userData.recs) r.T = r.T ? new M4().multiplyMatrices(m, r.T) : m.clone();
          return own.call(this, m);
        };
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.computeBoundingSphere();
      return g;
    }
  }
  /* REAL SIZE: fit a model (nose along +x, ground or waterline at y = 0) to the type it stands for.
     real = { L, W, H, D }: length, width (beam), height and, for a ship, draught, in metres. L and W are measured on the body, without
     aerials, masts and other thin parts (footprint under 0.15 m); H null keeps the model's proportion (scaled with the length).
     fitM gives the scale matrix (so a family of models can share one: the trucks on one chassis), fit applies it and, with D, sets
     the hull depth below the waterline (parts.keel, applied when baked). The blueprint tool checks the results (Blueprints/). */
  const body = (P, M) => {
    const b = new THREE.Box3(),
      t = new THREE.Box3(),
      I = new M4();
    for (const q of P) {
      if (!q.g.boundingBox) q.g.computeBoundingBox();
      t.copy(q.g.boundingBox).applyMatrix4(q.m || I);
      if (M) t.applyMatrix4(M);
      if (Math.max(t.max.x - t.min.x, t.max.z - t.min.z) < 0.15) continue;
      b.union(t);
    }
    return b;
  };
  const fitM = (P, r) => {
    const b = body(P),
      kl = r.L / (b.max.x - b.min.x);
    return new M4().makeScale(kl, r.H ? r.H / (b.max.y - Math.max(0, b.min.y)) : kl, r.W / (b.max.z - b.min.z));
  };
  const fit = (P, r, M) => {
    M = M || fitM(P, r);
    const out = P.map((q) => ({ ...q, m: new M4().multiplyMatrices(M, q.m || new M4()) }));
    if (r && r.D) {
      const k = body(out).min.y;
      if (k < -0.6) out.keel = { c: 0.5, k: (r.D - 0.5) / (-k - 0.5) };
    }
    return out;
  };
  /* a distant form by vertex clustering: every corner moves to the average of the corners in its cell (cell metres), and the
     triangles that collapse go; colours and normals averaged per cell. For a model built from many pieces with no single
     detail setting (the P-51); colours are kept apart (a corner merges only with corners of its own colour). A builder with one (the Ki-84's far) uses that instead. g: unindexed, with colour. */
  const thin = (g, cell) => {
    const p = g.attributes.position.array,
      n = g.attributes.normal.array,
      c = g.attributes.color.array,
      key = new Int32Array(p.length / 3),
      ids = new Map(),
      S = [];
    for (let i = 0; i < key.length; i++) {
      const k =
        Math.floor(p[i * 3] / cell) + ',' + Math.floor(p[i * 3 + 1] / cell) + ',' + Math.floor(p[i * 3 + 2] / cell) + ',' + Math.round(c[i * 3] * 31) + ',' + Math.round(c[i * 3 + 1] * 31) + ',' + Math.round(c[i * 3 + 2] * 31) /* corners of different colours never merge: no smeared paint */;
      let id = ids.get(k);
      if (id === undefined) ids.set(k, (id = S.length)), S.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const s = S[id];
      for (let a = 0; a < 3; a++) (s[a] += p[i * 3 + a]), (s[3 + a] += n[i * 3 + a]), (s[6 + a] += c[i * 3 + a]);
      s[9]++;
      key[i] = id;
    }
    const P = [],
      N = [],
      C = [];
    for (let t = 0; t < key.length; t += 3) {
      const a = key[t],
        b = key[t + 1],
        d = key[t + 2];
      if (a === b || b === d || a === d) continue;
      for (const id of [a, b, d]) {
        const s = S[id],
          k = s[9],
          l = Math.hypot(s[3], s[4], s[5]) || 1;
        P.push(s[0] / k, s[1] / k, s[2] / k);
        N.push(s[3] / l, s[4] / l, s[5] / l);
        C.push(s[6] / k, s[7] / k, s[8] / k);
      }
    }
    const o = new THREE.BufferGeometry();
    o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    o.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    o.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    o.computeBoundingSphere();
    return o;
  };
  return { M4, V3, Q, E, cyl, bx, sph, part, xf, Acc, body, fitM, fit, thin };
})();
