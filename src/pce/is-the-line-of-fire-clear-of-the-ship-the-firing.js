/* is the line of fire clear of the ship? (the firing cutout cam): steps along the bore from the muzzle, in the model frame */
function gunClear(G) {
  const d = G.m.d,
    c = Math.cos(G.el),
    s = Math.sin(G.el),
    a = G.m.d.ry0 + G.tr,
    ca = Math.cos(a),
    sa = Math.sin(a),
    T = d.T.elements,
    mz = d.muzzles[0];
  /* the muzzle in the training frame, then the mount's place */
  const lx = d.pivot[0] + mz[0] * c,
    ly = d.pivot[1] + mz[0] * s,
    lz = mz[2];
  const ox = T[12] + lx * ca + lz * sa,
    oy = T[13] + ly,
    oz = T[14] - lx * sa + lz * ca;
  const dx = c * ca,
    dy = s,
    dz = -c * sa;
  for (let r = 0.5; r < 70; r += 0.7) if (PCEM.solid(ox + dx * r, oy + dy * r, oz + dz * r)) return false;
  return true;
}
function gunFx(p, col, s0, s1, life, vy, add) {
  if (GUN.F.length > 220) {
    const o = GUN.F.shift();
    scene.remove(o.s);
    o.s.material.dispose();
  }
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }),
  );
  s.position.copy(p);
  s.scale.set(s0, s0, 1);
  scene.add(s);
  GUN.F.push({ s, t: 0, life, s0, s1, vy });
}
