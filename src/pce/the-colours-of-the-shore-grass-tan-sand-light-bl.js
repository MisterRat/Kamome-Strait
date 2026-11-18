/* The colours of the shore (grass, tan sand, light-blue shallows, deep blue) are worked out per pixel from this height map instead of per
   100 m vertex, so every transition follows the real coastline smoothly. 8 bits over -64..+10 m (0.3 m steps), 12.7 m texels, linear filter. */
const SHORE_LO = -64,
  SHORE_RANGE = 74;
const SHORET = (() => {
  const N = 2048,
    d = new Uint8Array(N * N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const h = HR(((i + 0.5) / N - 0.5) * SZ, ((j + 0.5) / N - 0.5) * SZ);
      d[j * N + i] = Math.round(255 * Math.max(0, Math.min(1, (h - SHORE_LO) / SHORE_RANGE)));
    }
  const t = new THREE.DataTexture(d, N, N, THREE.LuminanceFormat, THREE.UnsignedByteType);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return { value: t };
})();
const SHORE_PAINT =
  'if(shH<-14.0)discard;' /* PCE-842: deep water is drawn by OCEAN, so its wave troughs are never cut by this flat paint */ +
  '{float air=(1.0-smoothstep(300.0,400.0,abs(vWP.x)))*smoothstep(-2300.0,-2200.0,vWP.z)*(1.0-smoothstep(1000.0,1100.0,vWP.z));' +
  'float ed=mix(3.0,-3.2,air);float bm=1.0-smoothstep(ed-1.5,ed+1.5,shH);' +
  'vec3 sandC=vec3(0.64,0.56,0.40)+(vn2(vWP.xz*0.035)-0.5)*0.05+(vn2(vWP.xz*0.35)-0.5)*0.025;' +
  'sandC=mix(sandC,vec3(0.56,0.48,0.34),1.0-smoothstep(-8.0,-3.0,shH));' +
  'vec3 wc=mix(vec3(0.07,0.15,0.29),vec3(0.15,0.29,0.46),smoothstep(-60.0,-22.0,shH));' +
  'wc=mix(wc,vec3(0.34,0.53,0.58),smoothstep(-28.0,-8.0,shH));' +
  'vec3 col=mix(diffuseColor.rgb,sandC,bm);col=mix(col,wc,shM);diffuseColor.rgb=col;}\n';
const tmat = new THREE.MeshLambertMaterial({ vertexColors: true, map: fieldTex() });
tmat.onBeforeCompile = (sh) => {
  sh.uniforms.uTime = terrU.uTime;
  sh.vertexShader = sh.vertexShader
    .replace(
      '#include <common>',
      '#include <common>\nattribute float land;attribute float wat;varying float vLand;varying float vWat;varying vec3 vWP;varying vec3 vWN;',
    )
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvLand=land;vWat=wat;vWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);',
    );
  sh.uniforms.farmTex = FARMU;
  sh.uniforms.farmG = FARMG;
  sh.uniforms.shoreTex = SHORET;
  sh.uniforms.uDet = DETU;
  sh.fragmentShader = sh.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nuniform float uTime;varying float vLand;varying float vWat;varying vec3 vWP;varying vec3 vWN;uniform sampler2D farmTex;uniform vec4 farmG;uniform float uDet;uniform sampler2D shoreTex;\n' +
        TERR_NOISE,
    )
    .replace(
      '#include <map_fragment>',
      'float shH=texture2D(shoreTex,(vWP.xz+13000.0)/26000.0).r*74.0-64.0;shH=max(shH,-41.0);float shM=1.0-smoothstep(-8.8,-6.2,shH);float watK=shM;' +
        'vec4 tc=texture2D(map,vUv);diffuseColor.rgb*=mix(vec3(1.0),tc.rgb,vLand);' +
        'float wv=(sin(dot(vWP.xz,vec2(.7,.7))*.05+uTime*1.1)+sin(dot(vWP.xz,vec2(-.5,.86))*.083-uTime*1.3)+sin(dot(vWP.xz,vec2(.2,-.98))*.131+uTime*.9))/3.0;diffuseColor.rgb*=1.0+watK*.03*wv;diffuseColor.rgb+=watK*vec3(.025)*smoothstep(.6,1.0,wv);' +
        TERR_DETAIL,
    )
    .replace('#include <color_fragment>', '#include <color_fragment>\n' + SHORE_PAINT);
};
{
  const TN = 4,
    per = SEG / TN,
    W1 = SEG + 1,
    pp = tg.attributes.position;
  for (let ty = 0; ty < TN; ty++)
    for (let tx = 0; tx < TN; tx++) {
      const idx = [];
      let y0 = 1e9,
        y1 = -1e9;
      for (let iy = ty * per; iy < (ty + 1) * per; iy++)
        for (let ix = tx * per; ix < (tx + 1) * per; ix++) {
          const a = ix + W1 * iy,
            b = ix + W1 * (iy + 1),
            c = ix + 1 + W1 * (iy + 1),
            d = ix + 1 + W1 * iy;
          idx.push(a, b, d, b, c, d);
        }
      for (let iy = ty * per; iy <= (ty + 1) * per; iy++)
        for (let ix = tx * per; ix <= (tx + 1) * per; ix++) {
          const y = pp.getY(ix + W1 * iy);
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      const g = new THREE.BufferGeometry();
      for (const k in tg.attributes) g.setAttribute(k, tg.attributes[k]);
      g.setIndex(idx);
      const cx = -SZ / 2 + ((tx + 0.5) * SZ) / TN,
        cz = -SZ / 2 + ((ty + 0.5) * SZ) / TN,
        hw = SZ / TN / 2;
      g.boundingSphere = new THREE.Sphere(new V(cx, (y0 + y1) / 2, cz), Math.hypot(hw * 1.42, (y1 - y0) / 2) + 20);
      const m = new THREE.Mesh(g, tmat);
      scene.add(m);
    }
}
