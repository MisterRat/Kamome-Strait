/* ---------- replay: an outside camera shows the path you flew against the best path ----------
   While a maneuver is flown the trainer records the aircraft ten times a second (and the drone for the yo-yos). On completion the
   best path for the same entry is built from geometry (loop radius for a good G, barrel radius, turn radius, a chord with a dip or climb)
   and both are replayed together, with the biggest gap marked and notes on where to improve. */
Object.assign(RPL, { on: false, pause: false, t: 0, spd: 1, view: 0, az: 0, built: false, rec: null, ideal: null, dev: null, tips: [], gap: null, rad: 100, ctr: new V(), dist: 500, T: 0, kP: null, kI: null, kD: null });
const RPV = ['SIDE', 'TOP', 'BEHIND'];
const rpG = { line: [], dots: [], ghostP: null, ghostI: null, ghostD: null, mark: null, gapL: null, init: false };
function rpInit() {
  if (rpG.init) return;
  rpG.init = true;
  const ln = (col, op) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 1500), 3));
    g.setDrawRange(0, 0);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, fog: false }));
    l.frustumCulled = false;
    l.visible = false;
    l.renderOrder = 6;
    scene.add(l);
    return l;
  };
  rpG.line = [ln(0xffa020, 0.95), ln(0x55ff88, 0.95), ln(0xcccccc, 0.6)];
  const cols = [0xffa020, 0x55ff88, 0xdddddd];
  cols.forEach((c, k) => {
    rpG.dots[k] = [];
    for (let i = 0; i < 90; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
      sp.visible = false;
      sp.renderOrder = 7;
      scene.add(sp);
      rpG.dots[k].push(sp);
    }
  });
  const gh = (col, op) => {
    const b = buildEnemy();
    b.g.traverse((o) => {
      if (o.material) {
        o.material = o.material.clone();
        o.material.color.setHex(col);
        o.material.transparent = true;
        o.material.opacity = op;
      }
    });
    b.pilot.visible = false;
    b.g.visible = false;
    scene.add(b.g);
    return b;
  };
  rpG.ghostP = gh(0xffa020, 0.95);
  rpG.ghostI = gh(0x55ff88, 0.7);
  rpG.ghostD = gh(0xcccccc, 0.7);
  rpG.glow = [0xffa020, 0x55ff88, 0xdddddd].map((c) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.visible = false;
    sp.renderOrder = 9;
    scene.add(sp);
    return sp;
  });
  rpG.ghostP.glow = rpG.glow[0];
  rpG.ghostI.glow = rpG.glow[1];
  rpG.ghostD.glow = rpG.glow[2];
  rpG.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff3322, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
  rpG.mark.visible = false;
  rpG.mark.renderOrder = 8;
  scene.add(rpG.mark);
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  rpG.gapL = new THREE.Line(gg, new THREE.LineBasicMaterial({ color: 0xff3322, fog: false, depthTest: false }));
  rpG.gapL.frustumCulled = false;
  rpG.gapL.visible = false;
  rpG.gapL.renderOrder = 8;
  scene.add(rpG.gapL);
}
