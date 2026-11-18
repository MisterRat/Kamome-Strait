/* =====================================================================================================================
   THE OCEAN (shared by every game since P-51 5.38 / PCE-842 0.55; built in PCE-842): a moving sea surface, first made for an eye 9 m
   above the water and also drawn under the P-51.
   The P-51 paints its water onto the flat terrain at -8 m (per pixel, from height maps) with an open-sea plane beyond. That stays,
   and this surface is laid over it:
     - one camera-centred polar grid out to the horizon (dense near the eye, coarse far away), drawn in the transparent pass;
     - five Gerstner waves (a long swell and wind waves) move the vertices near the eye; every pixel works out its own wave normal,
       so the far sea still glints and rolls after the geometry has gone flat;
     - the depth below sea level is read per pixel from the same height maps the shore shader uses (the home map's 12.7 m one, a
       coarser one for the far world): waves die away in shallow water and the surface turns clear over the shallows, so the
       painted coastline shows through exactly as before (no per-vertex shore edges);
     - the terrain stops painting deep water (SHORE_PAINT discards it) so the wave troughs are never cut by the flat paint;
     - foam: on steep crests, along the beaches, round the ship's hull (bow wave) and down her wake (a trail of her past positions).
   OCEAN.h(x, z, t) gives the same wave height on the CPU, so the ship rides the very waves you see.
   ===================================================================================================================== */
const OCEAN = (() => {
  const Y = SEA.Y /* still-water level: 3 cm above the terrain's painted water at -8 m, so the two never fight for the same depth */,
    G = 9.81;
  /* [direction (deg, the way the wave travels), wavelength m, amplitude m, phase]: sea state 3, trade wind from the east */
  const W = [
    [-100, 82, 0.42, 0.0],
    [-75, 51, 0.24, 1.7],
    [-125, 27, 0.12, 4.1],
    [-60, 14.5, 0.065, 2.3],
    [-140, 7.6, 0.035, 5.2],
  ].map(([deg, L, A, ph]) => {
    const r = (deg * Math.PI) / 180,
      k = (2 * Math.PI) / L;
    return { dx: Math.sin(r), dz: -Math.cos(r), L, A, k, w: Math.sqrt(G * k), ph, Q: 1.6 };
  });
  /* the far world's depth map (the home map has its own, SHORET): 1024 texels over 120 km, 8 bits over -64..+10 m like SHORET */
  const WN = 1024,
    WS = 120000,
    wd = new Uint8Array(WN * WN);
  for (let j = 0; j < WN; j++)
    for (let i = 0; i < WN; i++) {
      const h = WH(((i + 0.5) / WN - 0.5) * WS, ((j + 0.5) / WN - 0.5) * WS);
      wd[j * WN + i] = Math.round(255 * Math.max(0, Math.min(1, (h - SHORE_LO) / SHORE_RANGE)));
    }
  const wTex = new THREE.DataTexture(wd, WN, WN, THREE.LuminanceFormat, THREE.UnsignedByteType);
  wTex.magFilter = wTex.minFilter = THREE.LinearFilter;
  wTex.wrapS = wTex.wrapT = THREE.ClampToEdgeWrapping;
  wTex.generateMipmaps = false;
  wTex.needsUpdate = true;
  const NTR = 24;
  const U = {
    uTime: { value: 0 },
    shoreTex: SHORET,
    wTex: { value: wTex },
    uQ: { value: 2 } /* graphics tier: 0 low, 1 medium, 2 high */,
    uShip: { value: new THREE.Vector4(1e7, 1e7, 0, 0) } /* the player's ship: x, z, heading, speed m/s (far away when no one commands a ship, e.g. the P-51) */,
    uB0: { value: new THREE.Vector4(0, 0, 0, 0) } /* another hull the water keeps out of: x, z, heading (model +x), kind (1 PT-105, 2 the sled, 0 none) */,
    uB1: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBY: { value: new THREE.Vector2(0, 0) } /* their waterline heights: water is cut away inside them only above these (washing over the deck), never round the hull */,
    uTr: { value: Array.from({ length: NTR }, () => new THREE.Vector3(0, 0, -1)) } /* her wake: x, z, time laid (-1 = none) */,
    uWL: { value: PCEM.WL.slice() } /* her half-breadth at the waterline, 32 stations from stem to stern */,
  };
  const f = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v));
  /* the GLSL for the waves, unrolled from W so the CPU and the GPU always share one table */
  const glDepth =
    'float ocDepth(vec2 p){vec2 a=abs(p);float h=max(a.x,a.y)<12900.0?texture2D(shoreTex,(p+13000.0)/26000.0).r:texture2D(wTex,(p+' +
    f(WS / 2) + ')/' + f(WS) + ').r;return ' + f(Y) + '-(h*' + f(SHORE_RANGE) + '+(' + f(SHORE_LO) + '));}\n';
  let glV = '',
    glF = '';
  W.forEach((o) => {
    const th = `(${f(o.k)}*dot(vec2(${f(o.dx)},${f(o.dz)}),P)-${f(o.w)}*uTime+${f(o.ph)})`;
    glV += `{float ff=am*(1.0-smoothstep(${f(5 * o.L)},${f(8 * o.L)},dist));float t=${th};float c=cos(t);D.x+=${f(o.Q * o.A * o.dx)}*ff*c;D.z+=${f(o.Q * o.A * o.dz)}*ff*c;D.y+=${f(o.A)}*ff*sin(t);}\n`;
    glF += `{float ff=am*(1.0-smoothstep(${f(0.25 * o.L)},${f(0.6 * o.L)},fp));float t=${th};float c=cos(t),s=sin(t);nx-=${f(o.dx * o.k * o.A)}*ff*c;nz-=${f(o.dz * o.k * o.A)}*ff*c;ny-=${f(o.Q * o.k * o.A)}*ff*s;cr+=${f(o.A)}*ff*s;}\n`;
  });
  const ATOT = W.reduce((a, o) => a + o.A, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0.035, 0.11, 0.21),
    specular: new THREE.Color(0.75, 0.72, 0.62),
    shininess: 160,
    transparent: true,
    depthWrite: false,
  });
  mat.extensions = { derivatives: true };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;uniform sampler2D shoreTex;uniform sampler2D wTex;varying vec3 vOW;varying float vDep;\n' + glDepth)
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n{vec2 P=(modelMatrix*vec4(position,1.0)).xz;float dist=length(P-cameraPosition.xz);float dep=ocDepth(P);float am=smoothstep(0.4,4.0,dep);vec3 D=vec3(0.0);\n' +
          glV +
          /* over the shallows the terrain paints the water flat at -8 m (it stops at about 6 m deep): there the waves only rise, never
             trough below that paint, or it would show through the sea in patches the shape of this grid's triangles */
          'D.y=mix(max(D.y,0.0),D.y,smoothstep(9.0,12.0,dep));transformed+=D;vOW=vec3(P.x+D.x,' + f(Y) + '+D.y,P.y+D.z);vDep=dep;}',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec4 uB0;uniform vec4 uB1;uniform vec2 uBY;uniform float uTime;uniform float uQ;uniform vec4 uShip;uniform vec3 uTr[' + NTR + '];uniform float uWL[32];uniform sampler2D shoreTex;uniform sampler2D wTex;varying vec3 vOW;varying float vDep;\n' +
          glDepth +
          'float ohs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
          'float ovn(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.0-2.0*u);return mix(mix(ohs(i),ohs(i+vec2(1,0)),u.x),mix(ohs(i+vec2(0,1)),ohs(i+1.0),u.x),u.y);}' +
          'float ofb(vec2 p){return ovn(p)*0.55+ovn(p*2.13+vec2(5.2,1.3))*0.3+ovn(p*4.7-vec2(2.1,7.7))*0.15;}\n',
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n' +
          /* no water inside the other hulls either (PT-105, her sled): their outlines in their own frames */
          'for(int bi=0;bi<2;bi++){vec4 bb=bi==0?uB0:uB1;if(bb.w>0.5&&vOW.y>(bi==0?uBY.x:uBY.y)+0.35){vec2 d=vOW.xz-bb.xy;float bc=cos(bb.z),bs=sin(bb.z);float lx=d.x*bc-d.y*bs,lz=d.x*bs+d.y*bc;' +
          'if(bb.w<1.5){if(lx>-12.0&&lx<9.0){float hw=lx<-2.2?2.25:2.25*sqrt(max(0.0,1.0-pow(max(0.0,lx+2.2)/11.2,2.0)));if(abs(lz)<hw)discard;}}' + /* her waterline, well inside the flare of her topsides */
          'else if(abs(lx)<4.2&&abs(lz)<1.45)discard;}}\n' +
          'vec2 P=vOW.xz;float fp=length(fwidth(P));float dep=ocDepth(P);float am=smoothstep(0.4,4.0,dep);float nx=0.0,nz=0.0,ny=1.0,cr=0.0;\n' +
          glF +
          /* ripples: two drifting octaves of noise, only near the eye and above the lowest graphics tier */
          'if(uQ>0.5){float rk=(1.0-smoothstep(1.5,6.0,fp))*0.10;vec2 q1=P*0.55+vec2(uTime*0.35,uTime*0.12),q2=P*1.3-vec2(uTime*0.2,uTime*0.42);float e=0.15;' +
          'float a1=ovn(q1),a2=ovn(q2);nx+=rk*((ovn(q1+vec2(e,0.0))-a1)+(ovn(q2+vec2(e,0.0))-a2)*0.6)/e;nz+=rk*((ovn(q1+vec2(0.0,e))-a1)+(ovn(q2+vec2(0.0,e))-a2)*0.6)/e;}\n' +
          'vec3 ocN=normalize(vec3(nx,ny,nz));\n' +
          /* foam: steep crests, the beaches, the ship's bow wave and her wake */
          'float wc=uQ<0.5?0.0:smoothstep(' + f(0.6 * ATOT) + ',' + f(0.98 * ATOT) + ',cr)*smoothstep(0.62,0.8,ofb(P*0.11+vec2(uTime*0.04,0.0)));float fo=uQ>0.5?wc*0.6*(1.0-smoothstep(1.0,4.0,fp)):0.0;\n' +
          'if(dep<3.0){float sw=0.55+0.45*sin(uTime*0.9+ofb(P*0.02)*9.0);float band=smoothstep(0.15,0.45,dep)*(1.0-smoothstep(0.5+0.9*sw,1.4+1.2*sw,dep));fo=max(fo,band*0.7*smoothstep(0.3,0.7,ofb(P*0.3+vec2(uTime*0.08,-uTime*0.05))));}\n' +
          'float sp=abs(uShip.w);float sg=uShip.w<0.0?-1.0:1.0;vec2 rl=P-uShip.xy;float sd=length(rl);\n' +
          'if(sd<900.0){vec2 fw=vec2(-sin(uShip.z),-cos(uShip.z));vec2 rt=vec2(-fw.y,fw.x);float al=dot(rl,fw),ac=abs(dot(rl,rt));' +
          'float fq=clamp(((27.75-al)/0.6096-(' + f(PCEM.F_STEM) + '))/' + f(PCEM.F_END - PCEM.F_STEM) + '*31.0,0.0,30.999);int iq=int(fq);float hb=mix(uWL[iq],uWL[iq+1],fract(fq));' +
          /* no water inside the hull: the engine room and the bilges stay dry */
          "if(al>-28.0&&al<27.7&&ac<hb-0.12)discard;" +
          'float sk=clamp(sp/8.0,0.0,1.0);' +
          /* the bow wave builds at the end that leads: the bow going ahead, the stern going astern */
          'if(al>-29.0&&al<31.0){float bowK=sg>0.0?smoothstep(-5.0,24.0,al):smoothstep(5.0,-24.0,al);float wbw=0.4+3.2*sk*(0.25+0.75*bowK);float b=smoothstep(hb-0.3,hb+0.15,ac)*(1.0-smoothstep(hb+0.1,hb+wbw,ac));fo=max(fo,b*sk*(0.35+0.65*bowK)*smoothstep(0.25,0.6,ofb(P*0.6+vec2(0.0,uTime*1.2))));}' +
          'float tw=0.0;float nT=uQ<0.5?9.0:uQ<1.5?15.0:' + f(NTR - 1) + ';for(int i=0;i<' + (NTR - 1) + ';i++){if(float(i)>=nT)break;vec3 a=uTr[i],c=uTr[i+1];if(a.z<0.0||c.z<0.0)continue;vec2 ab=c.xy-a.xy;float l2=max(dot(ab,ab),1e-3);float h=clamp(dot(P-a.xy,ab)/l2,0.0,1.0);float d=length(P-a.xy-ab*h);float age=max(0.0,uTime-mix(a.z,c.z,h));float w=4.0+age*0.28;tw=max(tw,(1.0-smoothstep(w*0.25,w,d))*exp(-age/34.0));}' +
          '{float n=ofb(P*0.16+vec2(uTime*0.05,uTime*0.03));fo=max(fo,sk*smoothstep(0.15,0.95,tw*1.15+(n-0.5)*0.9)*min(1.0,tw*1.6));}}\n' +
          'fo=clamp(fo,0.0,1.0);\n' +
          /* the water's own colour: deep blue, a little greener and clearer where it shoals */
          'diffuseColor.rgb=mix(vec3(0.16,0.42,0.47),mix(vec3(0.06,0.2,0.27),diffuseColor.rgb,smoothstep(10.0,32.0,dep)),smoothstep(0.5,9.0,dep));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.88,0.92,0.94),fo);\n' +
          'diffuseColor.a=max(mix(0.38,0.95,smoothstep(1.5,12.0,dep))*smoothstep(0.05,0.6,dep),fo);\n',
      )
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=normalize((viewMatrix*vec4(ocN,0.0)).xyz);')
      /* the sun on the water: a surface reflects as Fresnel says (about 2% looking straight down, more at a slant), and the
         highlight is as sharp as the surface is smooth: calm water near the eye gives a small hard sun, while far off, where
         each pixel covers many ripples, the lobe widens into the glitter path (the normalised Blinn-Phong keeps the energy) */
      .replace(
        '#include <lights_phong_fragment>',
        '#include <lights_phong_fragment>\n{vec3 vd=normalize(vViewPosition);float c=clamp(dot(normal,vd),0.0,1.0);material.specularColor=vec3(0.75,0.72,0.62)*(0.06+0.94*pow(1.0-c,5.0));material.specularShininess=mix(1400.0,220.0,smoothstep(1.0,25.0,length(fwidth(vOW.xz))));}',
      )
      .replace(
        '#include <envmap_fragment>',
        '#include <envmap_fragment>\n{vec3 vd=normalize(vViewPosition);float ct=clamp(dot(normal,vd),0.0,1.0);float fr=(0.02+0.98*pow(1.0-ct,5.0))*(1.0-fo);\n' +
          '#ifdef USE_FOG\nvec3 sky=fogColor;\n#else\nvec3 sky=vec3(0.66,0.8,0.93);\n#endif\n' +
          'outgoingLight=mix(outgoingLight,sky*0.92,fr*0.85);diffuseColor.a=max(diffuseColor.a,fr*smoothstep(0.3,3.0,dep));}',
      );
  };
  mat.userData.key = 'ocean1';
  csApply(mat); /* cloud shadows fall on it like on the painted water */
  /* the grid: rings from 1.5 m out to 38 km, spaced in a geometric series */
  const NA = 192,
    NR = 120,
    R1 = 1.5,
    RMAX = 38000;
  let b = 0.05;
  for (let it = 0; it < 60; it++) b = Math.log(1 + (RMAX * (Math.exp(b) - 1)) / R1) / NR; /* solve R1 (e^(bN)-1)/(e^b-1) = RMAX for b */
  const a = R1 / (Math.exp(b) - 1),
    pos = new Float32Array((1 + NR * NA) * 3),
    idx = [];
  for (let j = 1; j <= NR; j++) {
    const r = a * (Math.exp(b * j) - 1);
    for (let i = 0; i < NA; i++) {
      const t = (i / NA) * Math.PI * 2,
        o = (1 + (j - 1) * NA + i) * 3;
      pos[o] = Math.cos(t) * r;
      pos[o + 2] = Math.sin(t) * r;
    }
  }
  for (let i = 0; i < NA; i++) idx.push(0, 1 + ((i + 1) % NA), 1 + i);
  for (let j = 1; j < NR; j++)
    for (let i = 0; i < NA; i++) {
      const i1 = (i + 1) % NA,
        p0 = 1 + (j - 1) * NA,
        p1 = 1 + j * NA;
      idx.push(p0 + i, p0 + i1, p1 + i, p0 + i1, p1 + i1, p1 + i);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1; /* first in the transparent pass: wakes, smoke and clouds are drawn over it */
  mesh.matrixAutoUpdate = false;
  /* it follows the eye, whichever camera is drawing (chase, bridge, roam, photo) */
  mesh.onBeforeRender = (rn, sc, c) => {
    mesh.matrixWorld.makeTranslation(c.position.x, Y, c.position.z);
  };
  scene.add(mesh);
  /* the CPU twin of the shader's wave height (the horizontal Gerstner shift is left out: the crests are only gently sharpened) */
  const depthAt = (x, z) => Y - (Math.max(Math.abs(x), Math.abs(z)) < 12900 ? HR(x, z) : WH(x, z));
  function h(x, z, t) {
    const dep = depthAt(x, z),
      am = dep <= 0.4 ? 0 : dep >= 4 ? 1 : ((u) => u * u * (3 - 2 * u))((dep - 0.4) / 3.6) /* the waves run in to the last few metres (the shader's am) */;
    let y = 0;
    if (am > 0) for (const o of W) y += o.A * am * Math.sin(o.k * (o.dx * x + o.dz * z) - o.w * t + o.ph);
    if (dep < 12) y = y + (Math.max(y, 0) - y) * (1 - (dep <= 9 ? 0 : ((u) => u * u * (3 - 2 * u))((dep - 9) / 3))) /* as the shader: only crests over the shallows */;
    return Y + y;
  }
  const trail = { last: -1e9 };
  /* lay the wake: a point every 2.5 s while she has way on */
  function wake(x, z, hdg, u, t) {
    U.uShip.value.set(x, z, hdg, u) /* signed: going astern, the wash builds at her stern and the wake trails from her bow */;
    const T = U.uTr.value;
    if (Math.abs(u) > 0.3 && t - trail.last > 2.5) {
      trail.last = t;
      for (let i = T.length - 1; i > 0; i--) T[i].copy(T[i - 1]);
    }
    const e = u >= 0 ? 26 : -27; /* the newest point is always under her trailing end: the stern going ahead, the bow going astern */
    if (Math.abs(u) > 0.3) T[0].set(x + Math.sin(hdg) * e, z + Math.cos(hdg) * e, t);
  }
  function clearWake() {
    U.uTr.value.forEach((v) => v.set(0, 0, -1));
    trail.last = -1e9;
  }
  return { Y, W, U, mesh, h, wake, clearWake, depthAt };
})();

