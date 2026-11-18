/* near/far tree levels fade into each other with a dither: mode 1 = the cheap far tree (fades in beyond the band), mode 2 = the detailed near tree (fades out) */
const NTU = { c: { value: new THREE.Vector3() }, a: { value: -2 }, b: { value: -1 } };
function treeMat(mode, opt) {
  const m = new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, opt || {}));
  mode = mode || 0;
  if (mode) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uNC = NTU.c;
      sh.uniforms.uNA = NTU.a;
      sh.uniforms.uNB = NTU.b;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vFade;')
        .replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)>vFade)discard;',
        );
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uNC;uniform float uNA,uNB;varying float vFade;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n{vec3 ip=vec3(0.0);\n#ifdef USE_INSTANCING\nip=instanceMatrix[3].xyz;\n#endif\nfloat dd=distance(ip,uNC);vFade=' +
            (mode === 1 ? 'smoothstep(uNA,uNB,dd)' : '1.0-smoothstep(uNA,uNB,dd)') +
            ';}',
        )
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nif(vFade<0.003)gl_Position=vec4(2.0,2.0,2.0,1.0);',
        );
    };
    m.userData.key = 'tree' + mode + (opt && opt.map ? 'm' : '') + (opt && opt.alphaTest ? 'a' : '');
    m.customProgramCacheKey = () => m.userData.key;
  }
  return m;
}
const NT = { max: 700, R: 0, cap: 0, k: 1, gx: 1e9, gy: 0, gz: 0, sp: [], act: false, cell: 150 },
  UPV0 = new THREE.Vector3(0, 1, 0);
