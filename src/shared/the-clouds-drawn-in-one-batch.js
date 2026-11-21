/* THE CLOUDS IN ONE BATCH: every cumulus puff (CLOUDS, about 700 sprites) was a draw call of its own, most of the frame's. They are
   drawn here as one instanced billboard mesh instead, with the same look (the sprite's quad, its map, colour, opacity and fog), sorted
   far to near each frame as the sprites were (they overlap). The sprites stay as they were for everything else (the weather's cover
   and scale, the graphics tier's thinning, the inside-a-cloud check): they keep their visible flag and size, but the camera no longer
   draws them (layer 31). */
const CLOUDB = (() => {
  const n = CLOUDS.length,
    base = new THREE.PlaneGeometry(1, 1),
    g = new THREE.InstancedBufferGeometry(),
    OFF = new Float32Array(n * 3),
    SC = new Float32Array(n * 2);
  g.index = base.index;
  g.setAttribute('position', base.attributes.position);
  g.setAttribute('uv', base.attributes.uv);
  const aO = new THREE.InstancedBufferAttribute(OFF, 3).setUsage(THREE.DynamicDrawUsage),
    aS = new THREE.InstancedBufferAttribute(SC, 2).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('offset', aO);
  g.setAttribute('scl', aS);
  g.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, diffuse: { value: new THREE.Color() }, opacity: { value: 1 } }]),
    vertexShader: `attribute vec3 offset; attribute vec2 scl; varying vec2 vUv;
#include <fog_pars_vertex>
void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(offset, 1.0); mvPosition.xy += position.xy * scl; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform sampler2D map; uniform vec3 diffuse; uniform float opacity; varying vec2 vUv;
#include <fog_pars_fragment>
void main() { vec4 t = texture2D(map, vUv); gl_FragColor = vec4(diffuse * t.rgb, opacity * t.a);
#include <fog_fragment>
}`,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  mat.uniforms.map.value = CLM.mc.map;
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  const L = [],
    w = new THREE.Vector3(),
    cp = new THREE.Vector3();
  /* each frame, as it is drawn: the visible puffs, far to near, with their sizes; the material's colour and opacity as the sprites' */
  m.onBeforeRender = (r, s, c) => {
    mat.uniforms.diffuse.value.copy(CLM.mc.color);
    mat.uniforms.opacity.value = CLM.mc.opacity;
    c.getWorldPosition(cp);
    L.length = 0;
    for (const p of CLOUDS) if (p.visible) L.push([p, p.getWorldPosition(w).distanceToSquared(cp)]);
    L.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < L.length; i++) {
      const p = L[i][0];
      OFF[i * 3] = p.position.x;
      OFF[i * 3 + 1] = p.position.y;
      OFF[i * 3 + 2] = p.position.z;
      SC[i * 2] = p.scale.x;
      SC[i * 2 + 1] = p.scale.y;
    }
    g.instanceCount = L.length;
    aO.needsUpdate = aS.needsUpdate = true;
  };
  for (const p of CLOUDS) p.layers.set(31);
  CSH.root.add(m) /* in the clouds' own drifting frame, as the sprites are */;
  return { m };
})();
