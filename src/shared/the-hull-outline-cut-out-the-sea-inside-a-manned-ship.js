/* The hull outline at the waterline of the ship a player commands (shared by every game). Every csApply'd world surface near sea
   level (the terrain's painted water, the open-sea plane) is cut away inside it, so nothing flat at sea level can ever show inside
   the ship's rooms. The ship's role sets it each frame (PCE-842: shipPose); with no manned ship uHM.w stays 0 and nothing is cut.
   One outline is enough, in multiplayer too: only the hull the camera is aboard needs the painted water cut out of her rooms; every
   other ship keeps the sea out through OCEAN.hull. */
const HULLM = { uHM: { value: new THREE.Vector4(0, 0, 0, 0) }, uHW: { value: PCEM.WL.slice() } };
const HULLM_GL =
  '{vec2 hr=vCS-uHM.xy;if(uHM.w>0.5&&vCSy<-6.0&&vCSy>-12.5&&dot(hr,hr)<900.0){vec2 fw=vec2(-sin(uHM.z),-cos(uHM.z));float al=dot(hr,fw),ac=abs(dot(hr,vec2(-fw.y,fw.x)));' +
  'if(al>-28.0&&al<28.3){float fq=clamp(((27.75-al)/0.6096-(' + PCEM.F_STEM.toFixed(3) + '))/' + (PCEM.F_END - PCEM.F_STEM).toFixed(3) + '*31.0,0.0,30.999);int iq=int(fq);' +
  'if(ac<mix(uHW[iq],uHW[iq+1],fract(fq))-0.1)discard;}}}';
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
    sh.uniforms.uHM = HULLM.uHM;
    sh.uniforms.uHW = HULLM.uHW;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vCS;varying float vCSy;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n{vec4 cw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\ncw=instanceMatrix*cw;\n#endif\nvec4 cww=modelMatrix*cw;vCS=cww.xz;vCSy=cww.y;}',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D csTex;uniform vec2 csOff;uniform float csK;varying vec2 vCS;varying float vCSy;uniform vec4 uHM;uniform float uHW[32];',
      )
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + HULLM_GL)
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

