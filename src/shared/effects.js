/* effects */
function fxAdd(p, col, s0, s1, life, vy, addv) {
  if (FX.length > 260) {
    const o = FX.shift();
    scene.remove(o.s);
    o.s.material.dispose();
  }
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: col,
      transparent: true,
      depthWrite: false,
      blending: addv ? THREE.AdditiveBlending : THREE.NormalBlending,
    }),
  );
  s.position.copy(p);
  s.scale.set(s0, s0, 1);
  scene.add(s);
  FX.push({ s, t: 0, life, s0, s1, vy });
}
/* each frame: the effects grow, fade and go (every simulator calls it from its role's frame) */
function fxStep(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i];
    f.t += dt;
    const k = f.t / f.life;
    if (k >= 1) {
      scene.remove(f.s);
      f.s.material.dispose();
      FX.splice(i, 1);
      continue;
    }
    const s = f.s0 + (f.s1 - f.s0) * k;
    f.s.scale.set(s, s, 1);
    f.s.material.opacity = 1 - k;
    f.s.position.y += f.vy * dt;
  }
}
function explode(p, size) {
  fxAdd(p, 0xff9a30, size * 0.5, size * 3, 0.7, 0, true);
  fxAdd(p, 0xffe0a0, size * 0.3, size * 1.6, 0.35, 0, true);
  for (let i = 0; i < 4; i++)
    fxAdd(
      p.clone().add(new V((Math.random() - 0.5) * size, Math.random() * size * 0.5, (Math.random() - 0.5) * size)),
      0x333333,
      size * 0.8,
      size * 3.2,
      3.5,
      6,
      false,
    );
  SND.boom(p, size);
}
const spark = (p) => fxAdd(p, 0xffc060, 1.5, 4, 0.2, 0, true);
