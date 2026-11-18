/* ---- cloud shadows: every cumulus puff is painted into a map that the ground, trees and buildings sample; the whole cloud field drifts with the wind ---- */
const CSH = {
  tex: null,
  off: { value: new THREE.Vector2() },
  k: { value: 0.28 },
  root: new THREE.Group(),
  wt: 0,
  sun: new THREE.Vector3(2, 3, 1).normalize(),
};
scene.add(CSH.root);
const CSZ = 512,
  csc = document.createElement('canvas');
csc.width = csc.height = CSZ;
const csx = csc.getContext('2d');
csx.fillStyle = '#000';
csx.fillRect(0, 0, CSZ, CSZ);
function csBlob(x, y, z, k) {
  const sx = x - (y * CSH.sun.x) / CSH.sun.y,
    sz = z - (y * CSH.sun.z) / CSH.sun.y,
    r = ((k * 0.5) / 26000) * CSZ; /* where this puff's shadow falls on the ground */
  for (const ox of [-1, 0, 1])
    for (const oz of [-1, 0, 1]) {
      const px = (sx / 26000 + 0.5) * CSZ + ox * CSZ,
        pz = (sz / 26000 + 0.5) * CSZ + oz * CSZ;
      if (px < -r || px > CSZ + r || pz < -r || pz > CSZ + r) continue;
      const g = csx.createRadialGradient(px, pz, r * 0.15, px, pz, r);
      g.addColorStop(0, 'rgba(255,255,255,.2)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      csx.fillStyle = g;
      csx.fillRect(px - r, pz - r, r * 2, r * 2);
    }
}
function csApply(m) {
  if (
    !m ||
    m.userData.cs ||
    !(m.isMeshLambertMaterial || m.isMeshBasicMaterial || m.isMeshPhongMaterial || m.isMeshStandardMaterial)
  )
    return;
  m.userData.cs = 1;
  const prev = m.onBeforeCompile,
    pk = (prev ? prev.toString() : '') + (m.userData.key || '');
  m.onBeforeCompile = (sh, rn) => {
    if (prev) prev(sh, rn);
    sh.uniforms.csTex = { value: CSH.tex };
    sh.uniforms.csOff = CSH.off;
    sh.uniforms.csK = CSH.k;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vCS;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n{vec4 cw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\ncw=instanceMatrix*cw;\n#endif\nvCS=(modelMatrix*cw).xz;}',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D csTex;uniform vec2 csOff;uniform float csK;varying vec2 vCS;',
      )
      .replace(
        '#include <fog_fragment>',
        'gl_FragColor.rgb*=1.0-csK*texture2D(csTex,(vCS-csOff)/26000.0+0.5).r*(1.0-smoothstep(7000.0,12500.0,length(vCS-cameraPosition.xz)));\n#include <fog_fragment>',
      );
  };
  m.customProgramCacheKey = () => 'cs' + pk;
  m.needsUpdate = true;
}
const csTree = (o) =>
  o.traverse((c) => {
    if (c.isMesh && !c.isSprite) (Array.isArray(c.material) ? c.material : [c.material]).forEach(csApply);
  });
function driftClouds(dt) {
  TWIND.value += dt;
  const r = CSH.root;
  r.position.x += (FM.use('wind') ? WX.cdx : 5.5) * dt;
  r.position.z += (FM.use('wind') ? WX.cdz : 1.8) * dt;
  r.updateMatrix(); /* the scene's matrices were frozen: the cloud field must still drift */
  CSH.off.value.set(r.position.x, r.position.z);
  CSH.k.value = QL.t().shadow ? 0.28 * WX.shK : 0;
  CSH.wt -= dt;
  if (CSH.wt <= 0) {
    CSH.wt = 2;
    const H2 = 13000,
      px = cam.position.x,
      pz = cam.position.z;
    /* the field follows the aircraft: a cloud that falls more than half a tile away is moved a whole tile (26 km) across,
       so there are clouds wherever you fly and the shadow map (which repeats every tile) still lines up */
    const wrap = (s, ox, oz) => {
      const wx = s.position.x + ox - px,
        wz = s.position.z + oz - pz;
      let ch = false;
      if (Math.abs(wx) > H2) (s.position.x -= 26000 * Math.round(wx / 26000)), (ch = true);
      if (Math.abs(wz) > H2) (s.position.z -= 26000 * Math.round(wz / 26000)), (ch = true);
      if (ch) s.updateMatrix();
    };
    for (const s of CLOUDS) wrap(s, r.position.x, r.position.z);
    for (const s of CIRRUS) wrap(s, 0, 0);
  }
}
{
  const mkTex = (w, h, fn) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    fn(c.getContext('2d'), w, h);
    return new THREE.CanvasTexture(c);
  };
  const cum = mkTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 56, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.97)');
    gr.addColorStop(0.55, 'rgba(250,252,255,.7)');
    gr.addColorStop(1, 'rgba(240,246,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, 30, 0, 128);
    sh.addColorStop(0, 'rgba(150,165,195,0)');
    sh.addColorStop(1, 'rgba(120,135,170,.6)');
    g.fillStyle = sh;
    g.fillRect(0, 0, w, h);
  });
  const cir = mkTex(256, 64, (g, w, h) => {
    const gr = g.createRadialGradient(128, 32, 2, 128, 32, 128);
    gr.addColorStop(0, 'rgba(255,255,255,.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save();
    g.scale(1, 0.25);
    g.translate(0, 96);
    g.fillStyle = gr;
    g.fillRect(0, -96, w, h * 4);
    g.restore();
  });
  const mc = new THREE.SpriteMaterial({ map: cum, transparent: true, depthWrite: false }),
    mr = new THREE.SpriteMaterial({ map: cir, transparent: true, depthWrite: false, opacity: 0.7 });
  CLM = { mc, mr };
  for (let i = 0; i < 75; i++) {
    const cx = (Math.random() - 0.5) * 24000,
      cz = (Math.random() - 0.5) * 24000,
      cy = 900 + Math.random() * 1900,
      R = 300 + Math.random() * 500;
    if (cy < 2000 && Math.hypot(cx, cz) < 1800) continue;
    for (let j = 0, m = 7 + ((Math.random() * 6) | 0); j < m; j++) {
      const a = Math.random() * 6.28,
        d = Math.random() * R,
        s = new THREE.Sprite(mc),
        k = 450 + Math.random() * 750 * (1 - d / (R * 1.4));
      s.position.set(cx + Math.cos(a) * d, cy + Math.random() * R * 0.45 * (1 - d / (R * 1.2)), cz + Math.sin(a) * d);
      s.scale.set(k, k * 0.8, 1);
      s.userData.sx = s.scale.x;
      s.userData.sy = s.scale.y;
      CSH.root.add(s);
      CLOUDS.push(s);
      csBlob(s.position.x, s.position.y, s.position.z, k);
    }
  }
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(mr);
    s.position.set((Math.random() - 0.5) * 26000, 5500 + Math.random() * 1800, (Math.random() - 0.5) * 26000);
    s.scale.set(7000 + Math.random() * 4000, 1300, 1);
    scene.add(s);
    CIRRUS.push(s);
  }
  CSH.tex = new THREE.CanvasTexture(csc);
  CSH.tex.wrapS = CSH.tex.wrapT = THREE.RepeatWrapping;
  CSH.tex.needsUpdate = true;
}

