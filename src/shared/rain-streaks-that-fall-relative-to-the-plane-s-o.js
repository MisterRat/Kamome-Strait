/* rain: streaks that fall relative to the plane's own motion */
const RAIN = (() => {
  const N = 1400,
    BX = 70,
    BY = 45,
    o = new Float32Array(N * 3),
    g = new THREE.BufferGeometry();
  for (let i = 0; i < N; i++)
    o.set([(Math.random() * 2 - 1) * BX, (Math.random() * 2 - 1) * BY, (Math.random() * 2 - 1) * BX], i * 3);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  const m = new THREE.LineSegments(
    g,
    new THREE.LineBasicMaterial({ color: 0xbcc8d6, transparent: true, opacity: 0.35, fog: false, depthWrite: false }),
  );
  m.frustumCulled = false;
  m.visible = false;
  scene.add(m);
  return { N, BX, BY, o, g, m, n: 0 };
})();
