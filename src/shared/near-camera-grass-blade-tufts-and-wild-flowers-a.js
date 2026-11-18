/* ---------- near-camera grass: blade tufts and wild flowers around the camera (nothing is drawn far away; the ground shader paints the far grass) ---------- */
const PDET = { list: null, on: null };
const GR = { R: 0, k: 1, gx: 1e9, gz: 0, act: false, grass: null, flow: null, cap: 8000, fcap: 900, lay: [] };
const GRU = { c: { value: new THREE.Vector3() }, r: { value: 1 } };
{
  const hashG = (i, j, k) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483629)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  /* one texture per kind: a fan of curved blades (alpha cut); the flower kind has coloured heads on some stems. The colour is kept in the clear pixels too, so the mip-maps do not darken the edges. */
  const bladeTex = (flowers) => {
    const S = 128,
      c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.lineCap = 'round';
    const n = flowers ? 5 : 11;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5,
        x0 = S / 2 + u * S * 0.5 + (hashG(i, 3, flowers ? 9 : 1) - 0.5) * 8,
        lean = u * S * (flowers ? 0.35 : 0.8) + (hashG(i, 5, 2) - 0.5) * 18,
        hgt = S * (flowers ? 0.62 + hashG(i, 7, 3) * 0.3 : 0.55 + hashG(i, 7, 3) * 0.42),
        xt = x0 + lean,
        yt = S - hgt;
      g.strokeStyle = flowers ? '#a8d890' : '#fff';
      g.lineWidth = flowers ? 3 : 7 - hashG(i, 9, 4) * 2;
      g.beginPath();
      g.moveTo(x0, S);
      g.quadraticCurveTo(x0 + lean * 0.1, S - hgt * 0.6, xt, yt);
      g.stroke();
      if (!flowers) {
        /* the blade narrows to a point */
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(xt - 2, yt + 6);
        g.lineTo(xt + lean * 0.05, yt - 3);
        g.stroke();
      } else {
        const hc = ['#fff4c0', '#ffd23a', '#fff', '#f2a0c8', '#c9a8ff'][i % 5];
        g.fillStyle = hc;
        g.beginPath();
        g.arc(xt, yt, 7 + hashG(i, 11, 5) * 3, 0, 6.3);
        g.fill();
        g.fillStyle = '#e8a020';
        g.beginPath();
        g.arc(xt, yt, 2.4, 0, 6.3);
        g.fill();
      }
    }
    const im = g.getImageData(0, 0, S, S).data,
      d = new Uint8Array(S * S * 4);
    for (let i = 0; i < S * S; i++) {
      const a = im[i * 4 + 3];
      /* un-premultiply is not needed for opaque strokes; clear pixels get a plain leaf colour */
      if (a > 8) {
        d[i * 4] = im[i * 4];
        d[i * 4 + 1] = im[i * 4 + 1];
        d[i * 4 + 2] = im[i * 4 + 2];
      } else {
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = flowers ? 190 : 255;
      }
      d[i * 4 + 3] = a;
    }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    t.flipY = false;
    t.needsUpdate = true;
    return t;
  };
  /* a tuft is three crossed cards (6 triangles); the vertex colour is dark at the root and bright at the tip, the normals point up so every card is lit like the ground */
  const tuftGeo = () => {
    const P = [],
      U = [],
      C = [],
      N = [],
      I = [];
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3,
        cx = Math.cos(a) * 0.5,
        cz = Math.sin(a) * 0.5,
        b = P.length / 3;
      P.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz);
      U.push(0, 1, 1, 1, 1, 0, 0, 0);
      C.push(0.5, 0.55, 0.45, 0.5, 0.55, 0.45, 1.15, 1.15, 1.1, 1.15, 1.15, 1.1);
      N.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setIndex(I);
    return g;
  };
  /* tufts shrink to nothing towards the edge of the zone; they also vanish over crop fields and tracks (the farm texture), and on sand */
  const grassMat = (map, key) => {
    const m = new THREE.MeshLambertMaterial({ map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uGC = GRU.c;
      sh.uniforms.uGR = GRU.r;
      sh.uniforms.farmTex = FARMU;
      sh.uniforms.farmG = FARMG;
      /* the cards are seen from both sides: keep the up-pointing normal (no back-face flip) so they are lit like the ground */
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        '#include <normal_fragment_begin>\nnormal=normalize(vNormal);',
      );
      sh.vertexShader = sh.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uGC;uniform float uGR;uniform sampler2D farmTex;uniform vec4 farmG;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n{vec3 ip=instanceMatrix[3].xyz;float dd=distance(ip.xz,uGC.xz);float ky=1.0-smoothstep(0.62*uGR,uGR,dd);' +
            'vec2 fuv=(ip.xz-farmG.xy)/(farmG.z*2.0)+0.5;float inF=step(0.0,fuv.x)*step(fuv.x,1.0)*step(0.0,fuv.y)*step(fuv.y,1.0);' +
            'float fa=texture2D(farmTex,fuv).a*inF;ky*=1.0-smoothstep(0.15,0.4,fa);transformed*=ky;}',
        );
    };
    m.customProgramCacheKey = () => key;
    return m;
  };
  const geo = tuftGeo();
  const mk = (map, key, cap) => {
    const im = new THREE.InstancedMesh(geo, grassMat(map, key), cap);
    im.frustumCulled = false;
    im.setColorAt(
      0,
      new THREE.Color(1, 1, 1),
    ); /* the colour buffer is sized from count, so create it at full size first */
    im.count = 0;
    scene.add(im);
    return im;
  };
  GR.grass = mk(bladeTex(false), 'grass', GR.cap);
  GR.flow = mk(bladeTex(true), 'flower', GR.fcap);
  /* two rings of tufts: small and dense close by, bigger and sparser further out */
  GR.lay = [
    { s: 0.85, R: 24, h: [0.32, 0.55], w: [0.45, 0.7] },
    { s: 3.2, R: 130, h: [0.7, 1.15], w: [1.0, 1.6] },
  ];
}
const GRM = new THREE.Matrix4(),
  GRQ = new THREE.Quaternion(),
  GRP = new THREE.Vector3(),
  GRS = new THREE.Vector3(),
  GRY = new THREE.Vector3(0, 1, 0),
  GRC = new THREE.Color();
const GRG = (i, j, k) => {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483629)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
