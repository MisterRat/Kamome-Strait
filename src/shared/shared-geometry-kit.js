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
  class Acc {
    constructor() {
      this.p = [];
      this.n = [];
      this.c = [];
    }
    add(parts, T) {
      for (const q of parts) {
        const g = q.g.index ? q.g.toNonIndexed() : q.g.clone();
        const m = q.m && T ? new M4().multiplyMatrices(T, q.m) : q.m || T;
        if (m) g.applyMatrix4(m);
        if (q.c) cl.setRGB(q.c[0], q.c[1], q.c[2]);
        else cl.setHex(q.hex);
        const p = g.attributes.position.array,
          n = g.attributes.normal.array;
        for (let i = 0; i < p.length; i++) {
          this.p.push(p[i]);
          this.n.push(n[i]);
        }
        for (let i = 0; i < p.length; i += 3) this.c.push(cl.r, cl.g, cl.b);
        g.dispose();
      }
      return this;
    }
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.computeBoundingSphere();
      return g;
    }
  }
  return { M4, V3, Q, E, cyl, bx, sph, part, xf, Acc };
})();
