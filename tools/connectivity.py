#!/usr/bin/env python3
"""Kamome Strait model connectivity check: no part may hover in the air.

Every model is a list of parts; each part is an oriented box (its geometry's own bounding box through its matrix). Two parts are
joined when their oriented boxes touch or overlap (separating-axis test, tolerance TOL). The parts joined, directly or through others,
to the model's base (anything touching the ground, y <= GROUND, or for a boat the largest part, her hull) form the model; every other
group of parts is reported as floating, with its parts' colours, centres and sizes.

Usage: python3 tools/connectivity.py [build html] [model ...]     (default: every case below; exit status 1 if anything floats)
Cases: every MODELS entry (with the variants listed in CASES), the parked P-51D and Ki-84, and the airfield drums."""
import sys, json, os
from playwright.sync_api import sync_playwright

TOL, GROUND = 0.01, 0.06
html = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith('.html') else 'build/PCE-842.html'
only = [a for a in sys.argv[1:] if not a.endswith('.html') and not a.startswith('--')]
ALL = '--all' in sys.argv or '--scene' in sys.argv
SCENE = '--scene' in sys.argv  # multi-mesh objects (guns on pivots, boats with their fittings) assembled in world space  # also every part list the game builds (recorded by GX.Acc), grouped by the code that built it
CASES = {
    'crew-us-stand': "MODELS.get('crew','us','stand',0)", 'crew-us-walk': "MODELS.get('crew','us','walk',1)", 'crew-us-work': "MODELS.get('crew','us','work',2)",
    'crew-ja-kneel': "MODELS.get('crew','ja','kneel',0)", 'crew-jn-stand': "MODELS.get('crew','jn','stand',0)", 'crew-jn-work': "MODELS.get('crew','jn','work',1)",
    'us-quonset-std': "MODELS.get('us-quonset','std')", 'us-quonset-elephant': "MODELS.get('us-quonset','elephant')",
    'jp-mole': "MODELS.get('jp-mole',112,8,2.2,24,-6)", 'jp-decauville': "MODELS.get('jp-decauville',6)", 'jp-godown': "MODELS.get('jp-godown',24,14)",
    'jp-drum-dump': "MODELS.get('jp-drum-dump',7,4)", 'p51-parked': "AFLD.models.fighter(0xb7bcc2,0xb22a24,{stripes:1,ang:0.4})",
    'ki84-parked': "KI84.parked({body:0x55603a})", 'drums': "AFLD.models.drums()",
    'pt105': "__asm(PTB.build('105'))", 'ukuru': "__asm(SITE.patrol.e.m)",
    'p51-player': "typeof model !== 'undefined' ? __meshParts(model) : []", 'ki84-flying': "__asm(KI84.mesh({gear:'up'}))", 'ki84-gear': "__asm(KI84.mesh({gear:'down'}))", 'sled': "__asm(PTB.sled())", 'raft': "typeof ptMesh === 'function' ? __asm(ptMesh('raft')) : []", 'sleeve': "typeof ptMesh === 'function' ? __asm(ptMesh('sleeve')) : []", 'towplane': "typeof ptMesh === 'function' ? __asm(ptMesh('tug')) : []",
}
SKIP = {'crew', 'us-quonset', 'jp-mole', 'jp-decauville', 'jp-godown', 'jp-drum-dump'}  # covered by the variants above
LOOSE = {'jp-drum-dump', 'drums', 'jp-decauville', 'jp-rail-cart'}  # groups of separate objects on the ground (drums, sleepers)
BOATS = {'p51-player', 'ki84-flying', 'ki84-gear', 'sled', 'raft', 'towplane', 'sleeve', 'pt105', 'ukuru', 'pce842', 'jp-daihatsu', 'jp-lighter', 'jp-type2a', 'jp-type2tl', 'us-liberty', 'us-t2', 'jp-t14'}
JS = r"""
(cases) => {
  const TOL = %f, GROUND = %f, out = {};
  const obb = (q) => {
    if (!q.g.boundingBox) q.g.computeBoundingBox();
    const b = q.g.boundingBox, m = q.m || new THREE.Matrix4();
    const c = b.getCenter(new THREE.Vector3()).applyMatrix4(m), h = b.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const ax = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    m.extractBasis(ax[0], ax[1], ax[2]);
    const e = [h.x * ax[0].length(), h.y * ax[1].length(), h.z * ax[2].length()];
    ax.forEach((a) => a.normalize());
    const wb = new THREE.Box3().copy(b).applyMatrix4(m);
    return { c, ax, e, wb };
  };
  const sep = (A, B, L) => {
    if (L.lengthSq() < 1e-9) return false;
    L.normalize();
    const ra = A.e[0] * Math.abs(A.ax[0].dot(L)) + A.e[1] * Math.abs(A.ax[1].dot(L)) + A.e[2] * Math.abs(A.ax[2].dot(L)),
      rb = B.e[0] * Math.abs(B.ax[0].dot(L)) + B.e[1] * Math.abs(B.ax[1].dot(L)) + B.e[2] * Math.abs(B.ax[2].dot(L));
    /* a flat decal (a painted mark or a window pane, under 5 mm thick) may sit up to 3 cm off its surface (set proud against flicker) */
    const tol = Math.min(...A.e) < 0.0025 || Math.min(...B.e) < 0.0025 ? 0.03 : TOL;
    return Math.abs(B.c.clone().sub(A.c).dot(L)) > ra + rb + tol;
  };
  /* a part's real surface in the model frame (for concave parts: an extruded profile's box would fill in its steps and arches) */
  const surf = (q) => {
    if (q._s) return q._s;
    const g = q.g.index ? q.g.toNonIndexed() : q.g, p = g.attributes.position, m = q.m || new THREE.Matrix4(), T = [], V = [];
    for (let i = 0; i < p.count; i++) V.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m));
    for (let i = 0; i + 2 < V.length; i += 3) T.push(new THREE.Triangle(V[i], V[i + 1], V[i + 2]));
    return (q._s = { V, T });
  };
  /* surfaces within reach: a vertex of one near a face of the other, or an edge of one piercing a face of the other (interpenetrating slabs) */
  const near = (A, B, tol) => {
    const a = surf(A), b = surf(B), c = new THREE.Vector3(), x = new THREE.Vector3();
    const ba = new THREE.Box3().setFromPoints(a.V).expandByScalar(tol), bb = new THREE.Box3().setFromPoints(b.V).expandByScalar(tol);
    const tb = new THREE.Box3(), cut = (T, box) => T.filter((t) => box.intersectsBox(tb.setFromPoints([t.a, t.b, t.c])));
    const aT = cut(a.T, bb), bT = cut(b.T, ba);
    for (const v of b.V) if (ba.containsPoint(v)) for (const t of aT) if (t.closestPointToPoint(v, c).distanceTo(v) <= tol) return true;
    for (const v of a.V) if (bb.containsPoint(v)) for (const t of bT) if (t.closestPointToPoint(v, c).distanceTo(v) <= tol) return true;
    const pierce = (T1, T2) => {
      const r = new THREE.Ray();
      for (const t of T1)
        for (const [p, q] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
          const L = p.distanceTo(q);
          if (L < 1e-6) continue;
          r.origin.copy(p);
          r.direction.copy(q).sub(p).divideScalar(L);
          for (const u of T2) if (r.intersectTriangle(u.a, u.b, u.c, false, x) && p.distanceTo(x) <= L) return true;
        }
      return false;
    };
    return pierce(aT, bT) || pierce(bT, aT);
  };
  const concave = (q) => q.g.type === 'ExtrudeGeometry';
  let PQ = null; /* the current model's parts (for the surface test) */
  const touch = (A, B, i, j) => {
    if (!A.wb.clone().expandByScalar(0.03).intersectsBox(B.wb)) return false;
    const Ls = [...A.ax, ...B.ax];
    for (const a of A.ax) for (const b of B.ax) Ls.push(new THREE.Vector3().crossVectors(a, b));
    if (Ls.some((L) => sep(A, B, L.clone()))) return false;
    /* boxes touch; for a concave (extruded) part check the real surfaces too */
    if (PQ && i != null && (concave(PQ[i]) || concave(PQ[j]))) return near(PQ[i], PQ[j], Math.min(...A.e) < 0.0025 || Math.min(...B.e) < 0.0025 ? 0.03 : TOL + 0.005) || insideEither(PQ[i], PQ[j]);
    return true;
  };
  /* one part buried inside the other (no surface within reach, but enclosed): a ray from its centre crosses the other's surface an odd number of times */
  const insideEither = (P1, P2) => {
    const inside = (q, o) => {
      const s = surf(o), c = new THREE.Box3().setFromPoints(surf(q).V).getCenter(new THREE.Vector3()), r = new THREE.Ray(c, new THREE.Vector3(0.577, 0.577, 0.577)), x = new THREE.Vector3();
      let n = 0;
      for (const t of s.T) if (r.intersectTriangle(t.a, t.b, t.c, false, x)) n++;
      return (n & 1) === 1;
    };
    return inside(P1, P2) || inside(P2, P1);
  };
  /* an object's meshes (built by GX.Acc), all their parts relative to the object's own origin */
  window.__asm = (root) => {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P = [];
    root.traverse((m) => {
      if (!m.isMesh || !m.geometry || !m.geometry.userData.recs || !m.visible) return;
      for (const r of m.geometry.userData.recs) for (const q of r.parts) {
        const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
        if (r.T) M.multiply(r.T);
        if (q.m) M.multiply(q.m);
        P.push({ g: q.g, hex: q.hex, m: M, src: q.src });
      }
    });
    return P;
  };
  /* an object built from plain meshes: each mesh one part (its own geometry), relative to the object's origin */
  window.__meshParts = (root) => {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P = [];
    root.traverse((m) => {
      if (!m.isMesh || !m.geometry || !m.visible || (m.material && m.material.transparent && m.material.opacity < 0.5)) return;
      P.push({ g: m.geometry, hex: m.material && m.material.color ? m.material.color.getHex() : 0, m: new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld) });
    });
    return P;
  };
  for (const [id, ex, boat] of cases) {
    let P;
    try { P = typeof ex === 'number' ? window.__REC[ex].parts : typeof ex === 'string' && ex.startsWith('#') ? window.__ASM[+ex.slice(1)] : new Function('return (' + ex + ')')(); } catch (err) { out[id] = { error: String(err) }; continue; }
    const O = P.map(obb), n = O.length, par = O.map((_, i) => i);
    PQ = P;
    const f = (i) => (par[i] === i ? i : (par[i] = f(par[i])));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (f(i) !== f(j) && touch(O[i], O[j], i, j)) par[f(i)] = f(j);
    let base;
    if (boat) { let bv = -1; O.forEach((o, i) => { const v = o.e[0] * o.e[1] * o.e[2]; if (v > bv) (bv = v), (base = f(i)); }); }
    else { const g = O.map((o, i) => [o.wb.min.y, i]).sort((a, b) => a[0] - b[0]); base = f(g[0][1]); if (g[0][0] > GROUND && !id.startsWith('rec ') && !id.startsWith('obj ')) out[id] = { warn: 'lowest part at y = ' + g[0][0].toFixed(2) }; }
    const G = new Set([base]);
    /* loose groups (and every recorded list: a scene may hold many separate objects): any group resting on the list's own ground counts */
    const g0 = id.startsWith('rec ') || id.startsWith('obj ') ? Math.min(...O.map((o) => o.wb.min.y)) : 0;
    if ((cases.loose && cases.loose.includes(id)) || id.startsWith('rec ') || id.startsWith('obj ')) O.forEach((o, i) => o.wb.min.y <= Math.max(g0, 0) + GROUND && G.add(f(i))); /* y = 0 is where a placed list meets the ground */
    const fl = [];
    /* the gap from a floating part to the nearest grounded part (world boxes: [dx, dy, dz], 0 where they overlap on that axis) */
    const gapTo = (o) => {
      let best = null, bd = 1e9;
      O.forEach((q, j) => {
        if (!G.has(f(j))) return;
        const g = ['x', 'y', 'z'].map((k) => Math.max(0, q.wb.min[k] - o.wb.max[k], o.wb.min[k] - q.wb.max[k]));
        const d = Math.hypot(...g);
        if (d < bd) (bd = d), (best = g.map((v, k) => +(v * Math.sign((q.wb.min[['x', 'y', 'z'][k]] + q.wb.max[['x', 'y', 'z'][k]]) / 2 - (o.wb.min[['x', 'y', 'z'][k]] + o.wb.max[['x', 'y', 'z'][k]]) / 2)).toFixed(3)));
      });
      return best;
    };
    O.forEach((o, i) => { if (!G.has(f(i))) fl.push([i, '#' + (P[i].hex || 0).toString(16).padStart(6, '0'), o.c.toArray().map((v) => +v.toFixed(2)), o.e.map((v) => +(2 * v).toFixed(2)), f(i), [...(P[i].src || '').matchAll(/html:(\d+)/g)].map((m) => m[1]).join(','), gapTo(o)]); });
    /* strict: every part joined to the base; only the LOOSE groups (separate drums, sleepers) may stand on the ground on their own */
    out[id] = Object.assign(out[id] || {}, { parts: n, floating: fl });
  }
  return out;
}
""" % (TOL, GROUND)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'), args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'])
    pg = b.new_page(viewport={'width': 400, 'height': 300})
    pg.add_init_script("window.__REC = [];")
    pg.goto('file://' + os.path.abspath(html))
    pg.wait_for_timeout(2500)
    pg.evaluate("()=>document.getElementById('go').click()")
    pg.wait_for_timeout(6000)
    ids = pg.evaluate("()=>MODELS.ids()")
    cases = [(i, "MODELS.get('%s')" % i, i in BOATS) for i in ids if i not in SKIP] + [(k, v, k in BOATS) for k, v in CASES.items()]
    # the allied fleet off the home field (PT boats, PCEs) and the player's own ship, each assembled
    nships = pg.evaluate("()=>AFLD.a.filter(o=>o.kind==='ship').length")
    cases += [('fleet-%d' % i, "__asm(AFLD.a.filter(o=>o.kind==='ship')[%d].m)" % i, True) for i in range(nships)]
    if pg.evaluate("()=>typeof SHIPM!=='undefined'&&!!SHIPM.mesh"): cases.append(('player-ship', "__asm(SHIPM.mesh)", True))
    if ALL:
        recs = pg.evaluate(r"""()=>{const seen={};window.__REC.forEach((r,i)=>{const fr=r.at.split(' | ').map(l=>l.trim().replace(/^at /,'').replace(/\(?file:.*?\.html:/,'@').replace(/\)$/,''));
          const k=fr.slice(0,3).join(' < ');if(!(k in seen))seen[k]=i;});return seen}""")
        cases += [('rec ' + k, i, False) for k, i in recs.items()]
    if SCENE:
        cases = []
        names = pg.evaluate(r"""()=>{
          /* every object with two or more meshes built by GX.Acc: all their parts in world space, as one list */
          window.__ASM = []; const names = [];
          scene.updateMatrixWorld(true);
          const top = (o) => { while (o.parent && o.parent !== scene) o = o.parent; return o; };
          const groups = new Map();
          scene.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.userData.recs) { const t = top(o); if (!groups.has(t)) groups.set(t, []); groups.get(t).push(o); } });
          for (const [t, ms] of groups) {
            if (ms.length < 2 && ms[0].geometry.userData.recs.length < 2) continue;
            const P = [];
            for (const m of ms) for (const r of m.geometry.userData.recs) for (const q of r.parts) {
              const M = new THREE.Matrix4().copy(m.matrixWorld);
              if (r.T) M.multiply(r.T);
              if (q.m) M.multiply(q.m);
              P.push({ g: q.g, hex: q.hex, m: M });
            }
            if (P.length > 8000) continue;
            const at = ms[0].geometry.userData.recs[0].at.split(' | ').map((l) => l.trim().replace(/^at /, '').replace(/\(?file:.*?\.html:/, '@').replace(/\)$/, ''));
            names.push(['obj ' + window.__ASM.length + ' ' + at.slice(0, 3).join(' < '), '#' + window.__ASM.length]);
            window.__ASM.push(P);
          }
          return names; }""")
        cases = [(n, e, False) for n, e in names]
    if only: cases = [c for c in cases if c[0] in only]
    res = pg.evaluate(JS.replace('(cases) => {', '(cases) => { cases.loose = %s;' % json.dumps(sorted(LOOSE)), 1), cases)
    b.close()
# name each recorded list by its source pieces (build line -> src piece and line)
game = 'pce' if 'PCE' in html else 'p51'
pieces = [q.strip() for q in open(os.path.join('src', game + '.manifest')) if q.strip() and not q.startswith('#')]
spans, at = [], 1
for q in pieces:
    n = open(os.path.join('src', q), 'rb').read().count(b'\n')
    spans.append((at, at + n, q))
    at += n
import re
def src(m):
    L = int(m.group(1))
    for s0, e0, q in spans:
        if s0 <= L < e0: return '%s:%d' % (q.replace('shared/', '').split('-')[0:4] and '-'.join(q.replace('shared/', '').split('-')[:4]), L - s0 + 1)
    return m.group(0)
res = {re.sub(r'@(\d+):\d+', src, k): v for k, v in res.items()}
bad = 0
for k, r in res.items():
    fl = r.get('floating', [])
    print(f"{k:22s} {r.get('parts', '?'):>4} parts  " + ('OK' if not fl and 'error' not in r else f"{len(fl)} FLOATING" if fl else r.get('error')) + (f"  ({r['warn']})" if 'warn' in r else ''))
    for q in (fl if '--full' in sys.argv else fl[:12]): print('      part', q[0], q[1], 'centre', q[2], 'size', q[3], 'gap', q[6] if len(q) > 6 else '', ('at ' + ' < '.join(re.sub(r'@(\d+):\d+', src, '@%s:0' % L) for L in q[5].split(','))) if len(q) > 5 and q[5] else '')
    if len(fl) > 12 and '--full' not in sys.argv: print('      ...', len(fl) - 12, 'more')
    bad += bool(fl) or 'error' in r
sys.exit(1 if bad else 0)
