/* ---------- the cloud deck: a solid layer of cloud for overcast, rain and storm, with a bright top you can climb out onto ---------- */
const DECK = {
  cfg: {
    overcast: { base: 1700, thick: 450, cov: 0.95 },
    rain: { base: 1300, thick: 600, cov: 0.985 },
    storm: { base: 1000, thick: 900, cov: 0.998 },
  },
  N: 256,
  T: 12000,
  on: false,
  above: false,
  fogOn: false,
  base: 0,
  top: 0,
  thr: 0.5,
  ox: 0,
  oz: 0,
  k: 0,
  tc: 0,
  data: null,
  tex: null,
  mats: null,
  meshes: null,
  build() {
    const N = this.N,
      d = new Float32Array(N * N);
    let seed = 20261031;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    [
      [8, 0.55],
      [16, 0.3],
      [32, 0.15],
    ].forEach(([c, w]) => {
      const L = new Float32Array(c * c);
      for (let i = 0; i < L.length; i++) L[i] = rnd();
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const fx = (i / N) * c,
            fy = (j / N) * c,
            ix = Math.floor(fx),
            iy = Math.floor(fy);
          let tx = fx - ix,
            ty = fy - iy;
          tx = tx * tx * (3 - 2 * tx);
          ty = ty * ty * (3 - 2 * ty);
          const a = L[(iy % c) * c + (ix % c)],
            b = L[(iy % c) * c + ((ix + 1) % c)],
            e = L[((iy + 1) % c) * c + (ix % c)],
            f = L[((iy + 1) % c) * c + ((ix + 1) % c)];
          d[j * N + i] += w * ((a * (1 - tx) + b * tx) * (1 - ty) + (e * (1 - tx) + f * tx) * ty);
        }
    });
    const s = Array.from(d).sort((a, b) => a - b),
      lo = s[Math.floor(s.length * 0.02)],
      hi = s[Math.floor(s.length * 0.98)];
    this.data = new Uint8Array(N * N);
    for (let i = 0; i < d.length; i++) this.data[i] = Math.round(255 * Math.max(0, Math.min(1, (d[i] - lo) / (hi - lo))));
    this.tex = new THREE.DataTexture(this.data, N, N, THREE.LuminanceFormat, THREE.UnsignedByteType);
    this.tex.wrapS = this.tex.wrapT = THREE.RepeatWrapping;
    this.tex.magFilter = this.tex.minFilter = THREE.LinearFilter;
    this.tex.needsUpdate = true;
    /* the value below which the layer has a hole, for each coverage: worked out from the texture itself */
    const q = [];
    for (let j = 0; j < 96; j++) for (let i = 0; i < 96; i++) q.push(this.n(i * 125 + this.ox, j * 125 + this.oz));
    q.sort((a, b) => a - b);
    this.q = q;
    const vs = `varying vec3 vW;\n#include <common>\n#include <logdepthbuf_pars_vertex>\n#include <fog_pars_vertex>\nvoid main(){vec4 wp=modelMatrix*vec4(position,1.0);vW=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;\n#include <logdepthbuf_vertex>\n#include <fog_vertex>\n}`,
      fs = `uniform sampler2D uTex;uniform vec2 uOff;uniform float uT,uThr,uTop,uQ;uniform vec3 uCol,uCol2;varying vec3 vW;
#include <common>
#include <logdepthbuf_pars_fragment>
#include <fog_pars_fragment>
void main(){
#include <logdepthbuf_fragment>
vec2 uv=(vW.xz-uOff)/uT;
float n=0.72*texture2D(uTex,uv).r+0.28*texture2D(uTex,uv*3.7+vec2(0.31,0.57)).r;
float a=smoothstep(uThr-0.03,uThr+0.06,n);if(a<0.01)discard;
float th=clamp((n-uThr)/0.35,0.0,1.0);float dt=uQ>0.5?texture2D(uTex,uv*11.0+vec2(0.7,0.2)).r:0.5;
vec3 c=uTop>0.5?mix(uCol2*0.86,uCol2,dt*0.8+0.2*th):uCol*(1.0-0.4*th)*(0.92+0.16*dt);
gl_FragColor=vec4(c,a);
#include <fog_fragment>
}`;
    const mk = (top) =>
      new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTex: { value: this.tex },
            uOff: { value: new THREE.Vector2() },
            uT: { value: this.T },
            uThr: { value: 0.3 },
            uTop: { value: top },
            uQ: { value: 1 },
            uCol: { value: new THREE.Color(0xaab2bb) },
            uCol2: { value: new THREE.Color(0xffffff) },
          },
        ]),
        vertexShader: vs,
        fragmentShader: fs,
        fog: true,
        transparent: true,
        depthWrite: true,
        side: top ? THREE.FrontSide : THREE.BackSide,
      });
    this.mats = [mk(0), mk(1)];
    this.meshes = this.mats.map((m) => {
      const o = new THREE.Mesh(new THREE.PlaneGeometry(44000, 44000, 1, 1).rotateX(-Math.PI / 2), m);
      o.frustumCulled = false;
      o.visible = false;
      o.renderOrder = -2;
      scene.add(o);
      return o;
    });
  },
  tx(u, v) {
    const N = this.N;
    u -= Math.floor(u);
    v -= Math.floor(v);
    const x = u * N - 0.5,
      y = v * N - 0.5,
      x0 = Math.floor(x),
      y0 = Math.floor(y),
      fx = x - x0,
      fy = y - y0,
      D = this.data,
      g = (i, j) => D[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
    return ((g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy) / 255;
  },
  /* the cloud density at a world spot: the same sum the shader draws */
  n(x, z) {
    const u = (x - this.ox) / this.T,
      v = (z - this.oz) / this.T;
    return 0.72 * this.tx(u, v) + 0.28 * this.tx(u * 3.7 + 0.31, v * 3.7 + 0.57);
  },
  cover(x, z) {
    return this.on && this.n(x, z) > this.thr + 0.015;
  },
  /* the weather changed (or the game started): switch the layer on or off and set its height and holes */
  apply() {
    if (!this.data) this.build();
    const c = this.cfg[WX.wx];
    this.on = !!c;
    this.above = false;
    if (this.fogOn && this.dome) {
      this.dome.material.opacity = 1;
      this.dome.material.transparent = false;
      sky.visible = true;
    }
    this.fogOn = false;
    this.k = 0;
    this.meshes.forEach((m) => (m.visible = this.on));
    if (c) {
      this.base = c.base;
      this.top = c.base + c.thick;
      this.thr = this.q[Math.floor((1 - c.cov) * (this.q.length - 1))];
      this.mats.forEach((m) => (m.uniforms.uThr.value = this.thr));
    }
    WX.deckAbove = false;
  },
  /* distance along the ray to the first solid cloud (the layer's underside or top), or Infinity */
  hit(a, dx, dy, dz, len) {
    if (!this.on) return Infinity;
    const planes = [this.base, this.top];
    let best = Infinity;
    for (const yy of planes) {
      if (Math.abs(dy) < 1e-4) continue;
      const t = (yy - a.y) / dy;
      if (t > 0 && t < len && t < best && this.cover(a.x + dx * t, a.z + dz * t)) best = t;
    }
    if (a.y > this.base && a.y < this.top && this.cover(a.x, a.z)) return 0;
    return best;
  },
  inside(p) {
    return this.on && p.y > this.base && p.y < this.top && this.cover(p.x, p.z);
  },
  update(dt) {
    if (!this.data) this.apply();
    if (!this.on) return;
    const cp = cam.position,
      y = cp.y,
      cv = this.cover(cp.x, cp.z),
      mid = (this.base + this.top) / 2;
    this.ox += (WX.wx_ || 0) * 0.7 * dt;
    this.oz += (WX.wz_ || 0) * 0.7 * dt;
    this.mats.forEach((m) => {
      m.uniforms.uOff.value.set(this.ox, this.oz);
      m.uniforms.uQ.value = QL.t().fx > 0 ? 1 : 0;
    });
    this.meshes.forEach((m) => {
      m.position.set(cp.x, m.material === this.mats[0] ? this.base : this.top, cp.z);
    });
    /* above or below: the sky, light and rain follow, switched while the aircraft is hidden inside the layer */
    let ab = this.above;
    if (!ab && y > (cv ? mid : this.top + 60)) ab = true;
    else if (ab && y < (cv ? mid : this.base - 60)) ab = false;
    if (ab !== this.above) {
      this.above = ab;
      WX.deckAbove = ab;
      WX.rainK = ab ? 0 : WX_SET[WX.wx].rain;
      WX.paint();
    }
    /* colours: the underside takes the weather's cloud tint, the top is bright */
    this.tc -= dt;
    if (this.tc <= 0) {
      this.tc = 0.5;
      const dayK = Math.max(0, Math.min(1, (WXP.SD.y + 0.05) / 0.3));
      this.mats[0].uniforms.uCol.value.copy(WXP.CC).multiplyScalar(0.8);
      this.mats[1].uniforms.uCol2.value.setRGB(1, 1, 1).lerp(WXP.O.sc, 0.25).multiplyScalar(0.18 + 0.82 * dayK);
    }
    /* inside the layer: thick white-out, so you fly on the instruments */
    const dep = Math.min(y - this.base, this.top - y),
      ca = Math.max(0, Math.min(1, (this.n(cp.x, cp.z) - this.thr + 0.03) / 0.09)),
      k = Math.max(0, Math.min(1, (dep + 30) / 70)) * ca;
    this.k = k;
    if (k > 0.002) {
      const bs = this.above ? WX_SET.clear : WX_SET[WX.wx],
        c = this.mats[0].uniforms.uCol.value.clone().lerp(this.mats[1].uniforms.uCol2.value, 0.5);
      scene.fog.near = bs.fogN * Math.pow(3 / bs.fogN, k);
      scene.fog.far = bs.fogF * Math.pow(110 / bs.fogF, k);
      scene.fog.color.copy(WXP.O.hz).lerp(c, k);
      scene.background.copy(scene.fog.color);
      /* the sky dome fades out into the white-out (it is not fogged), and the sun, moon and stars go with it */
      const dm = this.dome || (this.dome = sky.children.find((o) => o.geometry === SKYD));
      if (dm) {
        dm.material.transparent = true;
        dm.material.opacity = Math.max(0, 1 - k * 1.6);
      }
      sky.visible = k < 0.62;
      this.fogOn = true;
    } else if (this.fogOn) {
      this.fogOn = false;
      if (this.dome) {
        this.dome.material.opacity = 1;
        this.dome.material.transparent = false;
      }
      sky.visible = true;
      WX.paint();
    }
  },
};
