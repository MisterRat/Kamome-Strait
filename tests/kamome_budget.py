#!/usr/bin/env python3
"""Kamome Strait render budget probe: draw calls, triangles, geometries/textures held, and frame time (headless, software GL,
so frame times are only good for before/after comparison) at fixed spots: the player's start, over the home airfield, over the
Japanese port. Prints one JSON line per game.

Usage: python3 tests/kamome_budget.py [html ...]   (default: both builds)"""
import sys, json, os
from playwright.sync_api import sync_playwright

files = sys.argv[1:] or ['build/P-51_Mustang_FS.html', 'build/PCE-842.html']
chrome = os.environ.get('CHROME', '/usr/bin/google-chrome')
PROBE = """async (spot) => {
  const cam = window.__KC;
  if (spot) { cam.position.set(...spot.eye); cam.lookAt(...spot.look); cam.updateMatrixWorld(); window.__KU = true; }
  else window.__KU = false;
  await new Promise((r) => setTimeout(r, 2500));
  let calls = 0, tris = 0, n = 0; const t0 = performance.now(); let f0 = window.__frames;
  await new Promise((r) => setTimeout(r, 3000));
  const ms = (performance.now() - t0) / Math.max(1, window.__frames - f0);
  return { calls: R.info.render.calls, tris: R.info.render.triangles, geos: R.info.memory.geometries, tex: R.info.memory.textures, ms: +ms.toFixed(1) };
}"""
out = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'])
    for f in files:
        pg = b.new_page(viewport={'width': 960, 'height': 540})
        err = []
        pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto('file://' + os.path.abspath(f))
        pg.wait_for_timeout(3000)
        pg.evaluate("()=>document.getElementById('go').click()")
        pg.wait_for_timeout(6000)
        pg.evaluate("""()=>{const o=R.render.bind(R);window.__frames=0;window.__KC=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.5,90000);window.__KU=false;
          R.render=(s,c)=>{window.__frames++;o(s,window.__KU?window.__KC:c);};}""")
        res = {'start': pg.evaluate(PROBE, None)}
        # over the home airfield and the Japanese port: the player is moved there first so the scenery streams in
        for name, js in [('airfield', "(()=>{const a=AFLD&&AFLD.c?AFLD.c:{x:-130,z:400};return [a.x,a.z]})()"), ('port', "SITE.w(0,220)")]:
            try:
                c = pg.evaluate("()=>" + js)
                pg.evaluate("(c)=>{clearInterval(window.__pi);window.__pi=setInterval(()=>{try{pos.set(c[0]-250,220,c[1]-250)}catch(e){}},10)}", c)
                pg.wait_for_timeout(8000)
                res[name] = pg.evaluate(PROBE, {'eye': [c[0] + 260, 140, c[1] + 260], 'look': [c[0], 0, c[1]]})
            except Exception as e:
                res[name] = str(e)[:120]
        res['errors'] = err[:5]
        out[f] = res
        pg.close()
    b.close()
for f, r in out.items():
    print(os.path.basename(f), json.dumps(r))
