/* the gun elevation that puts a shell into the sea at range R (m) */
function gunSE(s, R) {
  const T = s.tab || (s.tab = gunTable(s));
  if (R <= T[1][1]) return (T[1][0] * R) / T[1][1];
  for (let i = 2; i < T.length; i++)
    if (R <= T[i][1]) return T[i - 1][0] + ((T[i][0] - T[i - 1][0]) * (R - T[i - 1][1])) / (T[i][1] - T[i - 1][1]);
  return T[T.length - 1][0];
}
function gunInit() {
  if (GUN.M.length || !SHIPM.mesh) return;
  const fm = new THREE.SpriteMaterial({ map: glowTex, color: 0xffb050, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  GUN.M = PCEM.mounts(SHIPM.mesh).map((m) => {
    const s = GSPEC[m.id],
      G = {
        id: m.id,
        m,
        s,
        tr: 0,
        el: m.id === '3in' ? 0.08 : m.id === '40' ? 0.18 : 0.3 /* at rest */,
        trT: 0,
        elT: 0 /* where the pointer lays the line of sight */,
        se: 0 /* the sight's superelevation: the gun lies this far above the line of sight */,
        ft: 0,
        rnd: s.mag || 0,
        rl: 0,
        al: [s.auto || 0, s.auto || 0],
        feedT: [0, 0],
        bar: 0,
        rec: 0,
        cut: false,
        fl: [],
        flT: 0,
      };
    G.elT = G.el;
    for (const mz of m.d.muzzles) {
      const f = new THREE.Sprite(fm);
      f.position.set(mz[0] + s.flash * 0.35, mz[1], mz[2]);
      f.scale.set(s.flash, s.flash, 1);
      f.visible = false;
      m.el.add(f);
      G.fl.push(f);
    }
    return G;
  });
  /* tracers: a line per shell, from the shell back along its path */
  const N = 600;
  GUN.pos = new Float32Array(N * 6);
  GUN.col = new Float32Array(N * 6);
  GUN.geo = new THREE.BufferGeometry();
  GUN.geo.setAttribute('position', new THREE.BufferAttribute(GUN.pos, 3).setUsage(THREE.DynamicDrawUsage));
  GUN.geo.setAttribute('color', new THREE.BufferAttribute(GUN.col, 3).setUsage(THREE.DynamicDrawUsage));
  GUN.geo.setDrawRange(0, 0);
  const L = new THREE.LineSegments(
    GUN.geo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
  );
  L.frustumCulled = false;
  L.userData.cs = 1;
  scene.add(L);
}
const gunOf = (id) => GUN.M.find((g) => g.id === id) || null;
