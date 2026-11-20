/* flaps (animated) and ailerons: each hinges on the wing's trailing hinge line, so the group is turned to lie along it */
const flapP = [],
  ailP = [],
  pmat = metal2,
  WDIH = Math.atan(WD / WSEMI);
let ailTab = null;
const ctlSurf = (s, x0, x1, cf, th, tabSide) => {
  const xm = (x0 + x1) / 2,
    z0 = wzh(x0 / WSEMI),
    z1 = wzh(x1 / WSEMI),
    m = (z1 - z0) / (x1 - x0),
    o = new THREE.Group();
  o.position.set(s * xm, wy(xm) - 0.01, (z0 + z1) / 2);
  o.rotation.set(0, -Math.atan(s * m), s * WDIH);
  model.add(o);
  const hg = new THREE.Group();
  o.add(hg);
  /* planform follows the wing: the front edge is the hinge, the back edge is the wing's own trailing edge (so it fits at every point, kink included) */
  const L = Math.hypot(x1 - x0, z1 - z0),
    N = 10,
    back = [];
  for (let k = N; k >= 0; k--) {
    const lx = (k / N - 0.5) * L /* along the hinge, local */,
      X = xm + s * lx /* span position (always outboard-positive) */,
      f = (X - x0) / (x1 - x0),
      dep = wzte(X / WSEMI) - (z0 + (z1 - z0) * f);
    back.push([lx, Math.max(0.05, dep - 0.004)]);
  }
  add(slab([[-L / 2, 0], [L / 2, 0], ...back], th), pmat, 0, 0, 0, hg);
  if (tabSide === s) {
    /* trim tab on the trailing edge (left aileron only, as on the real aircraft): 0.6 m wide, 0.2 m deep */
    const Xm = 3.95,
      lxm = s * (Xm - xm),
      zteL = (lx) => wzte((xm + s * lx) / WSEMI) - (z0 + (z1 - z0) * ((xm + s * lx - x0) / (x1 - x0))),
      tg = new THREE.Group(),
      a0 = lxm - 0.3,
      a1 = lxm + 0.3,
      zh = Math.min(zteL(a0), zteL(a1)) - 0.2;
    tg.position.set(0, 0, zh);
    hg.add(tg);
    add(
      slab(
        [
          [a0, 0],
          [a1, 0],
          [a1, zteL(a1) - 0.004 - zh],
          [a0, zteL(a0) - 0.004 - zh],
        ],
        th + 0.006,
      ),
      pmatTab,
      0,
      0,
      0,
      tg,
    );
    ailTab = tg;
  }
  return hg;
};
[-1, 1].forEach((s) => {
  flapP.push(ctlSurf(s, 0.45, 3.31, 0.5, 0.05));
  ailP.push([ctlSurf(s, 3.36, 5.35, 0.3, 0.045, -1), s]);
});
