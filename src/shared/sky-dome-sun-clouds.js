/* ---------- sky dome, sun, clouds ---------- */
let SKYD = null,
  MOON = null,
  STARS = null,
  CLM = null;
const SUNSP = [];
const HZC = new THREE.Color(0xbcd6ee),
  ZNC = new THREE.Color(0x3f7cc4),
  sky = new THREE.Group();
scene.add(sky);
scene.fog.color.copy(HZC);
scene.background = HZC.clone();
{
  const R = 24000,
    g = new THREE.SphereGeometry(R, 32, 16),
    p = g.attributes.position,
    cs = new Float32Array(p.count * 3),
    c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / R;
    if (y < 0) c.copy(HZC).multiplyScalar(0.9);
    else c.copy(HZC).lerp(ZNC, Math.min(1, Math.pow(y, 0.5) * 1.1));
    cs.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cs, 3));
  const d = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  d.renderOrder = -10;
  sky.add(d);
  SKYD = g;
  const tc = document.createElement('canvas');
  tc.width = tc.height = 128;
  const x = tc.getContext('2d'),
    gr = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.12, 'rgba(255,250,225,.95)');
  gr.addColorStop(0.35, 'rgba(255,235,170,.35)');
  gr.addColorStop(1, 'rgba(255,220,150,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  const st = new THREE.CanvasTexture(tc),
    sd = new THREE.Vector3(2, 3, 1).normalize().multiplyScalar(20000);
  [
    [2600, 1],
    [9000, 0.45],
  ].forEach((a) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: st,
        color: 0xfff4d0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        fog: false,
        opacity: a[1],
      }),
    );
    s.scale.set(a[0], a[0], 1);
    s.position.copy(sd);
    s.renderOrder = -9;
    sky.add(s);
    SUNSP.push(s);
  });
  /* moon and stars (shown at night) */
  const mcv = document.createElement('canvas');
  mcv.width = mcv.height = 128;
  const mx = mcv.getContext('2d'),
    mg = mx.createRadialGradient(64, 64, 8, 64, 64, 64);
  mg.addColorStop(0, 'rgba(245,248,255,1)');
  mg.addColorStop(0.3, 'rgba(235,240,255,.95)');
  mg.addColorStop(0.38, 'rgba(200,215,255,.25)');
  mg.addColorStop(1, 'rgba(180,200,255,0)');
  mx.fillStyle = mg;
  mx.fillRect(0, 0, 128, 128);
  MOON = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(mcv),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      fog: false,
    }),
  );
  MOON.scale.set(1500, 1500, 1);
  MOON.renderOrder = -9;
  sky.add(MOON);
  const sp = new Float32Array(1100 * 3);
  for (let i = 0; i < 1100; i++) {
    const u = Math.random(),
      a = Math.random() * 6.2832,
      y = 0.02 + 0.98 * u,
      r = Math.sqrt(1 - y * y) * 23000;
    sp.set([Math.cos(a) * r, y * 23000, Math.sin(a) * r], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  STARS = new THREE.Points(
    sg,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    }),
  );
  STARS.renderOrder = -9;
  sky.add(STARS);
}
