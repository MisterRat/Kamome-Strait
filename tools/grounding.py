#!/usr/bin/env python3
"""Kamome Strait grounding check: does every object sit ON the ground, neither floating above it nor sunk into it?

  python3 tools/grounding.py [html] [--full] [--tol 0.05]

Boots the built game headless with window.__REC set (GX.Acc records every part list it bakes, with its transform; see
tools/connectivity.py), then:
  - the GROUND is every upward-facing triangle (normal y > 0.25) of every static mesh in the scene as it is actually drawn: the home
    terrain mesh, the far-world chunks, aprons, runways, draped yards and roads, decks, floors, and the tops of other objects. It is
    hashed into 4 m cells; the sea surfaces, sky, clouds and anything transparent are left out;
  - an OBJECT is each recorded part list in place (mesh.matrixWorld x its transform), each mesh built without records, and each
    instance of an instanced mesh (trees, palms);
  - its BASE is its lowest vertices (within 3 cm of its lowest point), up to 24 of them spread over its footprint;
  - for each base point the surface nearest in height straight above or below it is found, the object's own triangles excluded
    (its own vertices are hashed, a triangle whose three corners are all its own is skipped);
  - it TOUCHES if any base point is within tol (5 cm) of a surface; it FLOATS if every base point is above its surface by more than
    tol; it is SUNK if every base point is below by more than tol. Objects afloat (base at the sea surface over deep water) and
    anything in the air are skipped.
Prints one line per building site (the source lines that built it), worst first; --full lists every object."""
import sys, os, json, re
from playwright.sync_api import sync_playwright

html = next((a for a in sys.argv[1:] if a.endswith('.html')), 'build/PCE-842.html')
TOL = float(sys.argv[sys.argv.index('--tol') + 1]) if '--tol' in sys.argv else 0.05
FULL = '--full' in sys.argv
chrome = os.environ.get('CHROME', '/usr/bin/google-chrome')

JS = r"""(TOL) => {
  const V = THREE.Vector3, M4 = THREE.Matrix4, C = 4;
  const skipMesh = (o) => {
    const m = o.material;
    if (!o.visible) return true;
    if (Array.isArray(m)) return true;
    if (!m || m.transparent || m.type === 'ShaderMaterial' || m.type === 'RawShaderMaterial' || m.type === 'SpriteMaterial' || m.type === 'PointsMaterial') return true;
    if (o.isSprite || o.isPoints || o.isLine) return true;
    let p = o; while (p) { if (!p.visible || p === window.model || (typeof SHIPM !== 'undefined' && p === SHIPM.mesh) || SHIPS.has(p)) return true; p = p.parent; }
    return false;
  };
  scene.updateMatrixWorld(true);
  /* ships and boats are judged by the connectivity checker (on their own decks), not here */
  const SHIPS = new Set();
  if (typeof AFLD !== 'undefined') for (const o of AFLD.a) if (o.kind === 'ship') SHIPS.add(o.m);
  if (typeof T !== 'undefined') for (const t of T) if (t.type === 'ship') SHIPS.add(t.m);
  if (typeof SITE !== 'undefined' && SITE.anch) for (const a of SITE.anch) SHIPS.add(a.m);
  /* the ground: upward-facing triangles, hashed by xz cell */
  const G = new Map(), tris = [];
  const cell = (x, z) => ((Math.floor(x / C) + 50000) * 100003 + (Math.floor(z / C) + 50000));
  const a = new V(), b = new V(), c = new V(), u = new V(), w = new V(), M = new M4(), MI = new M4();
  const addTri = (A, B, Cc, gnd) => {
    u.subVectors(B, A); w.subVectors(Cc, A); const n = new V().crossVectors(u, w); const L = n.length(); if (L < 1e-9) return;
    if (Math.abs(n.y) / L < 0.25) return; /* steep: a wall, not something to stand on */
    const t = tris.length; OWNR.push(CUR); tris.push([A.x, A.y, A.z, B.x, B.y, B.z, Cc.x, Cc.y, Cc.z, gnd ? 1 : 0]);
    const x0 = Math.floor(Math.min(A.x, B.x, Cc.x) / C), x1 = Math.floor(Math.max(A.x, B.x, Cc.x) / C), z0 = Math.floor(Math.min(A.z, B.z, Cc.z) / C), z1 = Math.floor(Math.max(A.z, B.z, Cc.z) / C);
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 200000) return;
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = (i + 50000) * 100003 + (j + 50000); if (!NEED.has(k)) continue; let l = G.get(k); if (!l) G.set(k, (l = [])); l.push(t); }
  };
  const meshes = [], OWNR = []; let CUR = null;
  scene.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && !skipMesh(o)) meshes.push(o); });
  let nT = 0;
  const NEED = new Set(), PEND = [];
  const buildGround = () => {
  for (const o of meshes) {
    const g = o.geometry, p = g.attributes.position; if (!p) continue;
    const idx = g.index ? g.index.array : null, nt = (idx ? idx.length : p.count) / 3;
    const mats = o.isInstancedMesh ? Array.from({ length: Math.min(o.count, 4000) }, (_, i) => { const m = new M4(); o.getMatrixAt(i, m); return new M4().multiplyMatrices(o.matrixWorld, m); }) : [o.matrixWorld];
    if (o.isInstancedMesh) continue; /* trees and palms are objects, not ground */
    /* is this mesh GROUND (terrain, a slab, an apron, a yard, a decal laid over the ground), as SURF counts it, or an object (whose top
       is still somewhere to stand, a deck or a quay, but not a surface that a thing beside it must sit on top of)? */
    if (!g.boundingBox) g.computeBoundingBox();
    const gb = g.boundingBox.clone().applyMatrix4(o.matrixWorld), gsx = gb.max.x - gb.min.x, gsz = gb.max.z - gb.min.z, gsy = gb.max.y - gb.min.y;
    CUR = o;
    const gnd = !!(o.userData.surface || (o.material.polygonOffset && Math.max(gsx, gsz) > 4) || (gsy < 0.6 && Math.max(gsx, gsz) > 6) || (Math.max(gsx, gsz) > 2000));
    for (const mw of mats)
      for (let t = 0; t < nt; t++) {
        const i0 = idx ? idx[3 * t] : 3 * t, i1 = idx ? idx[3 * t + 1] : 3 * t + 1, i2 = idx ? idx[3 * t + 2] : 3 * t + 2;
        a.fromBufferAttribute(p, i0).applyMatrix4(mw); b.fromBufferAttribute(p, i1).applyMatrix4(mw); c.fromBufferAttribute(p, i2).applyMatrix4(mw);
        addTri(a.clone(), b.clone(), c.clone(), gnd); nT++;
      }
  }
  };
  const key = (x, y, z) => Math.round(x * 50) + ',' + Math.round(y * 50) + ',' + Math.round(z * 50);
  /* surfaces at (x, z): heights of the triangles over that point, skipping the object's own */
  const heights = (x, z, own) => {
    const l = G.get(cell(x, z)) || [], H = [], HG = [];
    H.g = HG;
    for (const t of l) {
      const q = tris[t];
      const d = (q[5] - q[8]) * (q[0] - q[6]) + (q[6] - q[3]) * (q[2] - q[8]);
      if (Math.abs(d) < 1e-12) continue;
      const l1 = ((q[5] - q[8]) * (x - q[6]) + (q[6] - q[3]) * (z - q[8])) / d, l2 = ((q[8] - q[2]) * (x - q[6]) + (q[0] - q[6]) * (z - q[8])) / d, l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      if (own && own.has(key(q[0], q[1], q[2])) && own.has(key(q[3], q[4], q[5])) && own.has(key(q[6], q[7], q[8]))) continue;
      H.push(l1 * q[1] + l2 * q[4] + l3 * q[7]); HG.push(q[9]);
    }
    if (typeof HMESH === 'function') { const h = HMESH(x, z); if (h > SEA.Y + 0.05) H.push(h), HG.push(1); } /* the terrain mesh as drawn (home grid or far chunk), loaded or not */
    return H;
  };
  /* objects */
  const objs = [];
  const fromVerts = (name, V3s) => {
    if (V3s.length < 3) return;
    let lo = Infinity; for (const v of V3s) lo = Math.min(lo, v.y);
    const own = new Set(V3s.filter((v) => v.y < lo + 0.6).map((v) => key(v.x, v.y, v.z)));
    let base = V3s.filter((v) => v.y < lo + 0.03);
    /* spread the samples: the base's extreme corners first, then evenly */
    if (base.length > 24) {
      const ex = [0, 1, 2, 3].map((k) => base.reduce((m, v) => ((k === 0 ? v.x : k === 1 ? -v.x : k === 2 ? v.z : -v.z) < (k === 0 ? m.x : k === 1 ? -m.x : k === 2 ? m.z : -m.z) ? v : m), base[0]));
      const st = Math.ceil(base.length / 20); base = ex.concat(base.filter((_, i) => i % st === 0));
    }
    let bb = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, y1: -Infinity };
    for (const v of V3s) { bb.x0 = Math.min(bb.x0, v.x); bb.x1 = Math.max(bb.x1, v.x); bb.z0 = Math.min(bb.z0, v.z); bb.z1 = Math.max(bb.z1, v.z); bb.y1 = Math.max(bb.y1, v.y); }
    for (const v of base) NEED.add(cell(v.x, v.z));
    PEND.push(() => evalObj(name, lo, base, own, bb));
  };
  const evalObj = (name, lo, base, own, bb) => {
    const ds = [];
    for (const v of base) {
      const H = heights(v.x, v.z, own);
      if (!H.length) { ds.push(null); continue; }
      /* it stands on the TOPMOST surface there (a slab, an apron, a deck laid over the ground), not whichever is nearest: a wheel
         inside the concrete but just above the soil is sunk. Surfaces more than 0.5 m above it (a roof, a wing) are not under it. */
      let best = null;
      for (const h of H) { const d = v.y - h; if (best === null || Math.abs(d) < Math.abs(best)) best = d; }
      const top = H.filter((h, i) => H.g[i] && h <= v.y + 0.5);
      if (top.length && v.y - Math.max(...top) < -TOL) best = v.y - Math.max(...top); /* inside a slab or apron, above the soil under it */
      ds.push(best);
    }
    const D = ds.filter((d) => d !== null);
    if (!D.length) return objs.push({ name, lo, state: 'nothing under it', d: null, n: base.length, at: [(bb.x0 + bb.x1) / 2, lo, (bb.z0 + bb.z1) / 2], size: [bb.x1 - bb.x0, bb.y1 - lo, bb.z1 - bb.z0] });
    const touch = D.some((d) => Math.abs(d) <= TOL), up = D.every((d) => d > TOL), dn = D.every((d) => d < -TOL);
    let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
    for (const v of base) (bx0 = Math.min(bx0, v.x)), (bx1 = Math.max(bx1, v.x)), (bz0 = Math.min(bz0, v.z)), (bz1 = Math.max(bz1, v.z));
    const planted = Math.max(bx1 - bx0, bz1 - bz0) < 1.2 && D.every((d) => d < TOL && d > -0.35); /* a trunk or a post: rooted in the ground */
    const state = touch || planted ? 'ok' : up ? 'FLOATS' : dn ? 'SUNK' : 'straddles';
    objs.push({ name, lo, state, d: up ? Math.min(...D) : dn ? Math.max(...D) : Math.min(...D.map(Math.abs)), dmax: Math.max(...D), dmin: Math.min(...D), n: base.length, nd: D.length, at: [(bb.x0 + bb.x1) / 2, lo, (bb.z0 + bb.z1) / 2], size: [bb.x1 - bb.x0, bb.y1 - lo, bb.z1 - bb.z0] });
  };
  const GROUPS = new Map();
  const site = (at) => at.split(' | ').map((l) => l.trim().replace(/^at /, '').replace(/\(?file:.*?\.html:/, '@').replace(/:\d+\)?$/, '')).slice(0, 3).join(' < ');
  for (const o of meshes) {
    const g = o.geometry;
    if (o.isInstancedMesh) {
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox, m = new M4();
      if (bb.min.y > 0.3) continue; /* an upper part (a canopy, a crown): it stands on its own trunk */
      const nm = 'instanced ' + (o.userData.at ? site(o.userData.at) : g.uuid.slice(0, 6)) + ' (geometry base ' + bb.min.y.toFixed(2) + ')';
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); const mw = new M4().multiplyMatrices(o.matrixWorld, m);
        /* the instance's origin is where it is planted: it must be on the ground (its geometry may go below, a root or a buried rock) */
        const pO = new V(0, 0, 0).applyMatrix4(mw);
        fromVerts(nm + ' #' + i, [pO, pO.clone().setX(pO.x + 0.01), pO.clone().setZ(pO.z + 0.01)]);
      }
      continue;
    }
    const recs = g.userData && g.userData.recs;
    /* a mesh inside a group (a gun's turret on its base, a lamp on its carriage, a ship's fittings): the group is the object */
    let root = o; while (root.parent && root.parent !== scene) root = root.parent;
    if (root !== o) {
      const gr = GROUPS.get(root) || { P: [], at: o.userData.at || (recs && recs[0] && recs[0].at) };
      GROUPS.set(root, gr);
      const pp = g.attributes.position;
      for (let i = 0; i < pp.count; i++) gr.P.push(new V().fromBufferAttribute(pp, i).applyMatrix4(o.matrixWorld));
      continue;
    }
    if (recs && recs.length) {
      for (const r of recs) {
        const T = new M4().multiplyMatrices(o.matrixWorld, r.T || new M4()), P = [];
        for (const q of r.parts) {
          const m = q.m ? new M4().multiplyMatrices(T, q.m) : T, pa = q.g.attributes.position;
          const gi = q.g.index ? q.g.toNonIndexed() : q.g, pp = gi.attributes.position;
          for (let i = 0; i < pp.count; i++) P.push(new V().fromBufferAttribute(pp, i).applyMatrix4(m));
        }
        fromVerts(site(r.at), P);
      }
    } else {
      if (!g.boundingBox) g.computeBoundingBox();
      const s = g.boundingBox.getSize(new V());
      if (s.x > 80 || s.z > 80) continue; /* a ground surface itself */
      const pp = g.attributes.position, P = [];
      for (let i = 0; i < pp.count; i++) P.push(new V().fromBufferAttribute(pp, i).applyMatrix4(o.matrixWorld));
      let nm = o.name || ''; let pr = o.parent; while (!nm && pr) { nm = pr.name || ''; pr = pr.parent; }
      fromVerts('mesh ' + (o.userData.at ? site(o.userData.at) : (nm || o.geometry.type) + ' ' + g.uuid.slice(0, 6)), P);
    }
  }
  for (const [root, gr] of GROUPS) fromVerts('group ' + (root.name || '') + ' ' + (gr.at ? site(gr.at) : root.uuid.slice(0, 6)), gr.P);
  buildGround();
  for (const f of PEND) f();
  if (window.__GAT) { const out = []; for (const [x, z] of window.__GAT) { const l = G.get(cell(x, z)) || []; for (const t of l) { const q = tris[t]; const d = (q[5] - q[8]) * (q[0] - q[6]) + (q[6] - q[3]) * (q[2] - q[8]); if (Math.abs(d) < 1e-12) continue; const l1 = ((q[5] - q[8]) * (x - q[6]) + (q[6] - q[3]) * (z - q[8])) / d, l2 = ((q[8] - q[2]) * (x - q[6]) + (q[0] - q[6]) * (z - q[8])) / d, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue; const o = OWNR[t]; const bb = new THREE.Box3().setFromObject(o); out.push([x, z, +(l1 * q[1] + l2 * q[4] + l3 * q[7]).toFixed(2), q[9], o.geometry.type, o.material.type, o.material.polygonOffset ? 1 : 0, [Math.round(bb.max.x - bb.min.x), +(bb.max.y - bb.min.y).toFixed(2), Math.round(bb.max.z - bb.min.z)], (o.userData.at || '').slice(0, 80)]); } out.push([x, z, 'HMESH', HMESH(x, z)]); } window.__GOUT = out; }
  return { nT, nTri: tris.length, objs };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'])
    pg = b.new_page(viewport={'width': 640, 'height': 360})
    pg.add_init_script("""window.__REC = [];
      let _T; Object.defineProperty(window, 'THREE', { configurable: true,
        get() { if (_T && !_T.__w && _T.InstancedMesh && _T.Mesh) { _T.__w = 1; const IM = _T.InstancedMesh, MM = _T.Mesh;
            const at = () => new Error().stack.split('\\n').slice(2, 6).join(' | ');
            _T.InstancedMesh = class extends IM { constructor(...a) { super(...a); this.userData.at = at(); } };
            _T.Mesh = class extends MM { constructor(...a) { super(...a); this.userData.at = at(); } }; }
          return _T; },
        set(v) { _T = v; } });""")
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.abspath(html))
    pg.wait_for_timeout(3000)
    pg.evaluate("()=>document.getElementById('go').click()")
    pg.wait_for_timeout(9000)
    pg.evaluate("()=>{ if (typeof SITE!=='undefined') SITE.vis=()=>{}; scene.traverse(q=>q.layers.mask=1); }")
    if '--at' in sys.argv: pg.evaluate('(a)=>{window.__GAT=a}', json.loads(sys.argv[sys.argv.index('--at') + 1]))
    res = pg.evaluate(JS, TOL)
    if '--at' in sys.argv:
        for r in pg.evaluate('()=>window.__GOUT'): print('AT', r)
    sea = pg.evaluate("()=>typeof SEA!=='undefined'?SEA.Y:-8")
    b.close()

objs = res['objs']
print(f"{html}: {res['nTri']} ground triangles from {res['nT']}; {len(objs)} objects; page errors {errs[:3]}")
# afloat (boats, piles in the sea): base at or below the sea surface with only seabed under it; in the air: base more than 4 m up
def kind(o):
    if o['state'] == 'ok': return 'ok'
    if o['lo'] < sea + 0.4: return 'afloat'
    if o['state'] == 'FLOATS' and o['d'] > 4: return 'air'
    return o['state']
groups = {}
for o in objs:
    k = kind(o)
    g = groups.setdefault(o['name'].split(' #')[0], {'n': 0, 'bad': []})
    g['n'] += 1
    if k not in ('ok', 'afloat', 'air'): g['bad'].append((k, o))
bad = sorted(((n, g) for n, g in groups.items() if g['bad']), key=lambda t: -max(abs(o['d'] or 9) for _, o in t[1]['bad']))
tot = sum(len(g['bad']) for _, g in bad)
print(f"{tot} objects not on the ground, in {len(bad)} groups")
for n, g in bad:
    ks = {}
    for k, o in g['bad']: ks[k] = ks.get(k, 0) + 1
    w = max(g['bad'], key=lambda t: abs(t[1]['d'] or 9))[1]
    print(f"  {n[:150]:150s} {len(g['bad'])}/{g['n']} {ks} worst {w['state']} d={w['d'] if w['d'] is None else round(w['d'], 3)} at {[round(v, 1) for v in w['at']]} size {[round(v, 1) for v in w['size']]}")
    if FULL:
        for k, o in g['bad'][:40]: print(f"      {k:10s} d={o['d'] if o['d'] is None else round(o['d'], 3)} range [{round(o.get('dmin', 0) or 0, 2)}, {round(o.get('dmax', 0) or 0, 2)}] at {[round(v, 1) for v in o['at']]} size {[round(v, 1) for v in o['size']]}")
