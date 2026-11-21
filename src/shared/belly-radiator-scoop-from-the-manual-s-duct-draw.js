/* belly radiator scoop (from the manual's duct drawing): a shallow lip, a diffuser that deepens to the radiator, then a nozzle
   that closes up to the exit flap. One lofted body, rounded section, dark mouth and exit. */
{
  const T = [
      [fz(157), -0.95, 0.24],
      [fz(160), -1.04, 0.29],
      [fz(170), -1.12, 0.33],
      [fz(185), -1.135, 0.34],
      [fz(200), -1.12, 0.335],
      [fz(215), -1.06, 0.32],
      [fz(230), -0.98, 0.3],
      [fz(245), -0.82, 0.27],
      [fz(252), -0.74, 0.25],
    ],
    nt = 20,
    nz = 28,
    top = -0.42,
    P = [],
    I = [];
  const sec = (z) => {
    let i = 0;
    while (i < T.length - 2 && z > T[i + 1][0]) i++;
    const u = Math.max(0, Math.min(1, (z - T[i][0]) / (T[i + 1][0] - T[i][0]))),
      k = u * u * (3 - 2 * u);
    return [T[i][1] + (T[i + 1][1] - T[i][1]) * k, T[i][2] + (T[i + 1][2] - T[i][2]) * k];
  };
  const ring = (z) => {
    const [yb, hw] = sec(z),
      R = [];
    for (let j = 0; j < nt; j++) {
      const t = (Math.PI * 2 * j) / nt,
        c = Math.cos(t),
        n = Math.sin(t),
        e = 2 / 3.2;
      R.push([hw * Math.sign(c) * Math.abs(c) ** e, (top + yb) / 2 + ((top - yb) / 2) * Math.sign(n) * Math.abs(n) ** e, z]);
    }
    return R;
  };
  for (let i = 0; i <= nz; i++) ring(T[0][0] + ((T[T.length - 1][0] - T[0][0]) * i) / nz).forEach((p) => P.push(...p));
  for (let i = 0; i < nz; i++)
    for (let j = 0; j < nt; j++) {
      const a = i * nt + j,
        b = i * nt + ((j + 1) % nt),
        c = a + nt,
        d = b + nt;
      I.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  const scM = metal.clone();
  scM.side = THREE.DoubleSide;
  add(g, scM, 0, 0, 0);
  const cap = (z, flip) => {
    const R = ring(z),
      C = [0, top * 0.5 + sec(z)[0] * 0.5, z],
      Q = [...C],
      F = [];
    R.forEach((p) => Q.push(...p));
    for (let j = 0; j < nt; j++) F.push(0, 1 + j, 1 + ((j + 1) % nt));
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(Q, 3));
    cg.setIndex(flip ? F.map((v, i, A) => A[i - (i % 3) + ((3 - (i % 3)) % 3)]) : F);
    cg.computeVertexNormals();
    return cg;
  };
  const dk = new THREE.MeshLambertMaterial({ color: 0x0c0c0d, side: THREE.DoubleSide });
  add(cap(fz(157)), dk, 0, 0, 0); /* the intake mouth */
  add(cap(fz(252)), dk, 0, 0, 0); /* the exit */
  add(new THREE.BoxGeometry(0.5, 0.025, 0.36), metal2, 0, -0.66, fz(252) + 0.12, model).rotation.x = 0.5; /* exit flap, hanging down and aft */
  add(new THREE.BoxGeometry(0.5, 0.03, 0.05), metal2, 0, -0.95, fz(157), model); /* the sharp intake lip */
} /* exit flap */
