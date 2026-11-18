# PCE-842 gun calibration: a simulated gunner lays each gun on the sight ring with about 3 mils of tracking error (the game's own
# ballistics and dispersion) and records each shell's closest approach to the target. The miss distances size the kill zones
# (see ptHit / GSPEC kr) so rounds per kill match the US Navy wartime figures (Hardcore) and 1/24 of them (game mode).
# Usage: python PCE-842_gun_calibration.py PCE-842.html 1500   (needs playwright and Chrome; CHROMIUM path below)
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
JS = r"""([gid, sig, N]) => {
  const V3 = THREE.Vector3, g = gunOf(gid), s = g.s;
  const tg = PT.L.find(t => t.kind === 'sleeve' && t.gun === (gid === '20' ? '20' : '40'));
  const eff = { '20': 914, '40': 3650, '3in': 12000 }[gid];
  let ex = 0, ey = 0, tA = 0, ft = 0; const q = new V3(), B = [], d = [], o = new V3();
  const inv = new THREE.Matrix4(); const gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(6.2832 * Math.random());
  vel.set(0, 0, 0);
  let fired = 0, guard = 0;
  while (fired < N && guard++ < 400000) {
    const dt = 0.02; ptUpdate(dt);
    const a = Math.exp(-dt / 1.5); ex = ex * a + sig * Math.sqrt(1 - a * a) * gauss(); ey = ey * a + sig * Math.sqrt(1 - a * a) * gauss();
    const rng = tg.p.distanceTo(cam.position);
    if ((tA -= dt) <= 0) { tA = 0.2; g.ok = gunAim(g, tg.p, tg.v, q, ptAt(tg)); }
    if (g.ok) {
      const dd = q.clone().sub(gunMz(g, o)); inv.copy(g.m.tr.parent.matrixWorld).invert();
      const l = dd.transformDirection(inv);
      g.tr = Math.atan2(-l.z, l.x) + ex; g.el = Math.asin(l.y) + ey; g.m.tr.rotation.y = g.tr; g.m.el.rotation.z = g.el; SHIPM.mesh.updateMatrixWorld(true);
      if ((ft -= dt) <= 0 && rng < eff && rng > 300) {
        ft = 0.15; fired++;
        const p = gunMz(g, new V3()), dir = new V3(1, 0, 0).transformDirection(g.m.el.matrixWorld);
        dir.x += (Math.random() - 0.5) * 2 * s.spread; dir.y += (Math.random() - 0.5) * 2 * s.spread; dir.z += (Math.random() - 0.5) * 2 * s.spread; dir.normalize();
        B.push({ p, v: dir.multiplyScalar(s.mv), t: 0, m: 1e9 });
      }
    }
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i], a0 = b.p.clone(), sp = b.v.length(), r = s.k * Math.exp(-Math.max(0, b.p.y) / 9145) * sp;
      b.v.multiplyScalar(1 - r * dt); b.v.y -= 9.81 * dt; b.p.addScaledVector(b.v, dt); b.t += dt;
      const ab = b.p.clone().sub(a0), w = tg.p.clone().sub(a0), u = Math.max(0, Math.min(1, w.dot(ab) / ab.lengthSq()));
      b.m = Math.min(b.m, w.sub(ab.multiplyScalar(u)).length());
      if (b.t > 12) { d.push(b.m); B.splice(i, 1); }
    }
  }
  d.sort((a, b) => a - b);
  const qn = (f) => d[Math.floor(f * d.length)];
  return { n: d.length, q01: qn(0.01), q05: qn(0.05), q10: qn(0.1), q50: qn(0.5) };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"])
    pg = b.new_page(viewport={"width":900,"height":500})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(Path(sys.argv[1]).as_uri()); pg.wait_for_timeout(3500)
    pg.evaluate("()=>{$$('go').click()}"); pg.wait_for_timeout(800)
    pg.keyboard.press("KeyT"); pg.wait_for_timeout(300)
    pg.keyboard.press("Digit5"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{paused=true}")
    for gid in ['20','40','3in']:
        r = pg.evaluate(JS, [gid, 0.003, int(sys.argv[2])])
        print(gid, json.dumps(r))
    print(errs[:3]); b.close()
