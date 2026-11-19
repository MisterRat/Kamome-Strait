#!/usr/bin/env python3
"""Kamome Strait collision test: fast-forwards the movers (the allied fleet, the patrols, the barges, the airfield vehicles) and reports
how close every pair of bodies in COLL comes. Outlines are the circles COLL uses (radius r along each body's length).
  python3 tests/kamome_collisions.py [html] [minutes]
An overlap (clearance < 0) between two bodies is a collision: one went through the other."""
import sys, os, json
from playwright.sync_api import sync_playwright
html = next((a for a in sys.argv[1:] if a.endswith('.html')), 'build/PCE-842.html')
mins = float(next((a for a in sys.argv[1:] if not a.endswith('.html')), '20'))
JS = r"""(mins) => {
  if (SITE.far) for (const f of SITE.far) f.far = false; /* every far site's traffic moves too */
  if (SITE.civ) for (const c of SITE.civ) c.vis = true;
  const t0 = performance.now() / 1000;
  const B = COLL.B, dt = 0.1, N = Math.round(mins * 60 / dt), pairs = new Map();
  const circ = (o) => { const n = Math.max(1, Math.round(o.hl / Math.max(o.r * 1.5, 1))), c = Math.cos(o.yaw), s = -Math.sin(o.yaw), P = [];
    for (let i = -n; i <= n; i++) P.push([o.x + c * o.hl * i / n, o.z + s * o.hl * i / n]); return P; };
  for (let k = 0; k < N; k++) {
    AFLD.update(dt);
    if (SITE.pat) SITE.pat(dt);
    if (k % 5) continue;
    for (const o of B) if (o.get) o.get();
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], b = B[j];
      if (!!a.sea !== !!b.sea || (a.fixed && b.fixed) || a.on === false || b.on === false) continue;
      if ((a.v || 0) < 0.3 && (b.v || 0) < 0.3) continue;
      if (Math.abs(a.x - b.x) > a.hl + b.hl + 60 || Math.abs(a.z - b.z) > a.hl + b.hl + 60) continue;
      let m = Infinity; for (const p of circ(a)) for (const q of circ(b)) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]) - a.r - b.r);
      const key = i + '-' + j, w = pairs.get(key);
      if (!w || m < w.m) pairs.set(key, { m: +m.toFixed(1), a: [a.sea ? 'sea' : 'land', a.hl * 2, a.fixed ? 'fixed' : 'moving'], b: [b.sea ? 'sea' : 'land', b.hl * 2, b.fixed ? 'fixed' : 'moving'], at: [Math.round(a.x), Math.round(a.z)], t: Math.round(k * dt) });
    }
  }
  return { bodies: B.length, pairs: [...pairs.values()].sort((p, q) => p.m - q.m).slice(0, 25) };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'), args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'])
    pg = b.new_page(viewport={'width': 320, 'height': 200})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.abspath(html)); pg.wait_for_timeout(3000)
    pg.evaluate("()=>document.getElementById('go').click()"); pg.wait_for_timeout(5000)
    r = pg.evaluate(JS, mins)
    b.close()
print(f"{html}: {r['bodies']} bodies, {mins} min; page errors {errs[:2]}")
bad = [q for q in r['pairs'] if q['m'] < 0]
print(f"{len(bad)} pairs overlapped (collided)")
for q in r['pairs'][:15]: print('  ', 'COLLIDED' if q['m'] < 0 else 'closest ', q)
