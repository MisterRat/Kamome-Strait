#!/usr/bin/env python3
"""Kamome Strait quick check: boots a built game headless, reports page errors and draw calls, and takes screenshots
from given camera positions (the game keeps running; only the camera used for drawing is ours).

Usage: python3 kamome_shot.py <html> <out-prefix> [shots.json]
shots.json: [{"name": "bow", "at": "JS returning [[eye],[look]] (optional)", "eye": [x,y,z] | "eyeRel": [x,y,z], "look": [x,y,z] | "lookRel": [x,y,z], "fov": 50,
              "js": "optional code run first", "wait": ms}]
"Rel" positions are relative to the player's ship (PCE-842: SHIPM.mesh) or aircraft (pos).
Prints JSON: {"errors": [...], "calls": n, "shots": [...]}"""
import sys, json, os
from playwright.sync_api import sync_playwright

html, prefix = sys.argv[1], sys.argv[2]
shots = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else []
chrome = os.environ.get('CHROME', '/usr/bin/google-chrome')
out = {'errors': [], 'shots': []}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'])
    pg = b.new_page(viewport={'width': 960, 'height': 540})
    pg.on('pageerror', lambda e: out['errors'].append(str(e)))
    pg.goto('file://' + os.path.abspath(html))
    pg.wait_for_timeout(3000)
    pg.evaluate("()=>document.getElementById('go').click()")
    pg.wait_for_timeout(6000)
    out['calls'] = pg.evaluate("()=>R.info.render.calls")
    out['version'] = pg.evaluate("()=>VERSION")
    pg.evaluate("""()=>{const o=R.render.bind(R);window.__KC=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.5,90000);window.__KU=false;
      R.render=(s,c)=>o(s,window.__KU?window.__KC:c);}""")
    pg.add_style_tag(content='body > *:not(canvas#c){visibility:hidden!important}')
    for s in shots:
        if s.get('js'): pg.evaluate("()=>{" + s['js'] + "}")
        if s.get('at'): s['eye'], s['look'] = pg.evaluate("()=>{" + s['at'] + "}")  # JS returning [[eye], [look]] (absolute)
        r = pg.evaluate("""(s)=>{const ships=AFLD.a.filter(o=>o.kind==='ship');
          const base=s.ship!=null?ships[s.ship].m.position.clone():(typeof SHIPM!=='undefined'&&SHIPM.mesh)?SHIPM.mesh.position.clone():pos.clone();
          const v=(a,rel)=>a?(rel?base.clone().add(new THREE.Vector3(...a)):new THREE.Vector3(...a)):null;
          const loc=(a)=>a&&typeof SHIPM!=='undefined'&&SHIPM.mesh?SHIPM.mesh.localToWorld(new THREE.Vector3(...a)):null;
          const e=v(s.eye,0)||v(s.eyeRel,1)||loc(s.eyeLocal),l=v(s.look,0)||v(s.lookRel,1)||loc(s.lookLocal);const c=window.__KC;c.fov=s.fov||50;c.aspect=innerWidth/innerHeight;
          c.position.copy(e);c.lookAt(l);c.updateProjectionMatrix();c.updateMatrixWorld();window.__KU=true;
          if(typeof camMode!=='undefined'){} return [e.x,e.y,e.z,base.x,base.y,base.z]}""", s)
        pg.wait_for_timeout(s.get('wait', 2500))
        f = f"{prefix}_{s['name']}.png"
        pg.screenshot(path=f)
        out['shots'].append({'name': s['name'], 'file': f, 'eye': r})
    out['errors'] = out['errors'][:10]
    b.close()
print(json.dumps(out))
