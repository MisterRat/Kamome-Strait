#!/usr/bin/env python3
"""Kamome Strait blueprint tool: draws orthographic blueprints of the game's models and measures them.

  python3 tools/blueprint.py [ids...]          every model in tools/blueprints.json, or only the ids given

For each model in the catalogue (tools/blueprints.json) it boots the built game headless (the entry's "game": p51 or pce,
default pce), builds the model with the entry's "make" JavaScript (a function body returning a THREE.Object3D in the model's
own frame), turns it so its bow / nose points along +x (entry "fwd": "+x", "-x", "+z", "-z"), and renders three orthographic
views at one scale: profile (from starboard, bow to the right), plan (from above, bow to the right) and front (from ahead).
It writes Blueprints/<File>_blueprint.png (the sheet) and Blueprints/<File>_measurements.md (the model's measured size against
the entry's reference figures). Needs Playwright and Chrome (the same as the other tests) and Pillow.

Catalogue entry: {"id", "file", "title", "game", "make", "fwd", "kind" ("ship" draws the waterline at y = 0),
  "labels": [[text, x, y, z], ...] (model frame after turning), "ref": [[item, value m or null, source], ...] (items named
  "Length", "Beam", "Span", "Width", "Height" are compared with the measured box), "measure": {item: "JS expression"},
  "notes": [...], "type": the real type it represents}"""
import sys, os, json, base64, io, math, datetime
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = json.load(open(os.path.join(ROOT, 'tools', 'blueprints.json')))
OUT = os.path.join(ROOT, 'Blueprints')
BUILDS = {'p51': 'build/P-51_Mustang_FS.html', 'pce': 'build/PCE-842.html'}
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONTB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
PAPER, INK, DIM, RED, BLUE = (247, 247, 242), (20, 30, 60), (25, 45, 110), (170, 30, 30), (30, 90, 200)

PAGE_JS = r"""
window.__bake = (P) => new THREE.Mesh(new GX.Acc().add(P, GX.xf(0, 0, 0, 0)).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
/* a placed object (and any separate scene objects that belong to it, e.g. a gun on its emplacement) back in the object's own frame */
window.__local = (base, extra) => {
  window.__WL = SEA.Y - base.position.y; /* where the still water is, in the object's own frame */
  const w = new THREE.Group(), inner = new THREE.Group();
  for (const o of [base, ...(extra || [])]) { const c = o.clone(true); c.visible = true; c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); inner.add(c); }
  inner.position.copy(base.position).negate();
  w.add(inner);
  w.rotation.y = -base.rotation.y;
  return w;
};
window.__target = (type, kind) => T.find((t) => t.type === type && (!kind || t.kind === kind) && !t.dead);
/* the size of an object (and what it holds) in its own frame, whatever its place and turn */
window.__size = (obj) => {
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert(), b = new THREE.Box3(), t = new THREE.Box3();
  obj.traverse((o) => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); t.copy(o.geometry.boundingBox).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); b.union(t); } });
  return b.getSize(new THREE.Vector3());
};
window.__BP = (e) => {
  window.__WL = null; window.__M = {};
  const obj = new Function(e.make)();
  const root = new THREE.Group(), turn = new THREE.Group();
  turn.add(obj);
  turn.rotation.y = { '+x': 0, '-x': Math.PI, '+z': Math.PI / 2, '-z': -Math.PI / 2 }[e.fwd || '+x'];
  root.add(turn);
  root.traverse((o) => (o.matrixAutoUpdate = true)); /* the scenery's matrices are frozen after the build */
  root.updateMatrixWorld(true);
  /* the box of the solid parts only (no sprites, lines or glow) */
  const box = new THREE.Box3(), tmp = new THREE.Box3();
  root.traverse((o) => {
    if (o.isSprite || o.isPoints || o.isLine) { o.visible = false; return; }
    if (o.isMesh && o.material && o.material.transparent && o.material.depthWrite === false) { o.visible = false; return; } /* wakes, glow */
    if (o.isMesh && o.visible && o.geometry) {
      o.geometry.computeBoundingBox();
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(tmp);
    }
    o.frustumCulled = false;
  });
  const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0xf7f7f2);
  sc.add(root, new THREE.AmbientLight(0xffffff, 0.62));
  const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(0.4, 1, 0.7); sc.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, 0.25); dl2.position.set(-0.5, 0.4, -0.8); sc.add(dl2);
  const PPM = e.ppm, pad = 0.04 * Math.max(sz.x, sz.y, sz.z) + 0.2;
  const cv = document.createElement('canvas');
  const rr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  rr.setPixelRatio(1);
  const views = {};
  const shot = (name, w, h, pos, up, look) => {
    const W = Math.round((w + 2 * pad) * PPM), H = Math.round((h + 2 * pad) * PPM);
    rr.setSize(W, H, false);
    const cam = new THREE.OrthographicCamera(-W / 2 / PPM, W / 2 / PPM, H / 2 / PPM, -H / 2 / PPM, 0.01, 5000);
    cam.layers.enableAll(); cam.position.copy(c).add(pos); cam.up.copy(up); cam.lookAt(c); cam.updateMatrixWorld();
    rr.render(sc, cam);
    views[name] = { png: cv.toDataURL('image/png'), W, H };
  };
  const D = 1000;
  shot('profile', sz.x, sz.y, new THREE.Vector3(0, 0, D), new THREE.Vector3(0, 1, 0));
  shot('plan', sz.x, sz.z, new THREE.Vector3(0, D, 0), new THREE.Vector3(0, 0, -1));
  shot('front', sz.z, sz.y, new THREE.Vector3(D, 0, 0), new THREE.Vector3(0, 1, 0));
  rr.dispose();
  const meas = {};
  for (const [k, ex] of Object.entries(e.measure || {})) { try { meas[k] = new Function('box', 'root', 'return (' + ex + ')')(box, root); } catch (err) { meas[k] = 'error: ' + err.message; } }
  let wl = window.__WL;
  if (e.wl) wl = new Function('box', 'return (' + e.wl + ')')(box);
  for (const [k, v] of Object.entries(window.__M || {})) meas[k] = v;
  return { wl, min: box.min.toArray(), max: box.max.toArray(), size: sz.toArray(), pad, views, meas, version: VERSION };
};
"""

K = 1.0
def font(sz, bold=False):
    return ImageFont.truetype(FONTB if bold else FONT, max(10, int(sz * K)))

def ft(m):
    inch = round(m / 0.0254)
    return f"{inch // 12} ft {inch % 12} in"

def dim_h(d, x0, x1, y, text, col=DIM):
    d.line([(x0, y), (x1, y)], fill=col, width=max(2, int(2 * K)))
    for x in (x0, x1):
        d.line([(x, y - 9 * K), (x, y + 9 * K)], fill=col, width=max(2, int(2 * K)))
    f = font(22, True)
    tw = d.textlength(text, font=f)
    xm = (x0 + x1) / 2
    d.rectangle([xm - tw / 2 - 8, y - 16 * K, xm + tw / 2 + 8, y + 16 * K], fill=PAPER)
    d.text((xm - tw / 2, y - 14 * K), text, font=f, fill=col)

def dim_v(d, x, y0, y1, text, col=DIM):
    d.line([(x, y0), (x, y1)], fill=col, width=max(2, int(2 * K)))
    for y in (y0, y1):
        d.line([(x - 9 * K, y), (x + 9 * K, y)], fill=col, width=max(2, int(2 * K)))
    d.text((x + 14 * K, (y0 + y1) / 2 - 12 * K), text, font=font(20, True), fill=col)

def sheet(e, r):
    ppm = e['ppm']
    V = {k: Image.open(io.BytesIO(base64.b64decode(v['png'].split(',')[1]))).convert('RGB') for k, v in r['views'].items()}
    mn, mx, sz, pad = r['min'], r['max'], r['size'], r['pad']
    pr, pl, fr = V['profile'], V['plan'], V['front']
    M = 70
    W = max(pr.width + fr.width + 3 * M + 260, 1500)
    H = 130 + pr.height + pl.height + 3 * M + 180
    global K
    K = max(1.0, W / 2400) * 1.25
    M = int(70 * K)
    W = max(pr.width + fr.width + 3 * M + int(260 * K), 1500)
    H = int(130 * K) + pr.height + pl.height + 3 * M + int(220 * K)
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.text((M, 30), e['title'], font=font(40, True), fill=INK)
    d.text((M, int(30 * K) + 52 * K), f"Kamome Strait game model, {r['game_name']} {r['version']} build  -  orthographic, one scale for all views  -  {datetime.date.today().isoformat()}", font=font(20), fill=(90, 90, 90))
    # profile
    px, py = M, int(140 * K) + 20
    img.paste(pr, (px, py))
    d.text((px, py - 34 * K), 'PROFILE (starboard side, bow / nose to the right)', font=font(22, True), fill=INK)
    to_px = lambda x: px + (x - mn[0] + pad) * ppm
    to_py = lambda y: py + (mx[1] + pad - y) * ppm
    wl = r.get('wl')
    if wl is None and e.get('kind') == 'ship':
        wl = 0
    if wl is not None and e.get('kind') == 'ship' and mn[1] - 1 < wl < mx[1] + 1:
        yw = to_py(wl)
        d.line([(px - 20, yw), (px + pr.width + 20, yw)], fill=BLUE, width=max(2, int(2 * K)))
        d.text((px, yw + 4 * K), 'still water (where the game floats her)', font=font(16), fill=BLUE)
    for lab in e.get('labels', []):
        t, x, y, z = lab
        X, Y = to_px(x), to_py(y)
        ty = py + 14 + (hash(t) % 3) * 26
        d.line([(X, ty + 22), (X, Y)], fill=RED, width=1)
        f = font(17)
        tw = d.textlength(t, font=f)
        d.rectangle([X - tw / 2 - 4, ty, X + tw / 2 + 4, ty + 22], fill=(255, 245, 245), outline=RED)
        d.text((X - tw / 2, ty + 1), t, font=f, fill=RED)
    yb = py + pr.height + 30 * K
    dim_h(d, to_px(mn[0]), to_px(mx[0]), yb, f"{'Length' if e.get('kind') != 'aircraft' else 'Length'} {sz[0]:.2f} m  ({ft(sz[0])})")
    dim_v(d, px + pr.width + 14, to_py(mx[1]), to_py(mn[1]), f"{sz[1]:.2f} m")
    # front view to the right of the profile
    fx, fy = int(px + pr.width + M + 180 * K), py
    img.paste(fr, (fx, fy))
    d.text((fx, fy - 34 * K), 'FRONT (from ahead)', font=font(22, True), fill=INK)
    dim_h(d, fx + pad * ppm, fx + fr.width - pad * ppm, fy + fr.height + 30 * K, f"{sz[2]:.2f} m")
    # plan
    qx, qy = M, int(yb + 90 * K)
    d.text((qx, qy - 34 * K), 'PLAN (from above, bow / nose to the right, starboard at the bottom)', font=font(22, True), fill=INK)
    img.paste(pl, (qx, qy))
    dim_v(d, qx + pl.width + 14, qy + pad * ppm, qy + pl.height - pad * ppm, f"{'Span' if e.get('kind') == 'aircraft' else 'Beam' if e.get('kind') == 'ship' else 'Width'} {sz[2]:.2f} m ({ft(sz[2])})")
    # scale bar
    sy = qy + pl.height + 70 * K
    step = next(s for s in (0.5, 1, 2, 5, 10, 20, 50) if s * ppm >= 60)
    n = max(4, min(10, int(min(sz[0], 120) / step)))
    for i in range(n):
        d.rectangle([qx + i * step * ppm, sy, qx + (i + 1) * step * ppm, sy + 12 * K], fill=INK if i % 2 == 0 else PAPER, outline=INK)
        d.text((qx + i * step * ppm - 6, sy + 18 * K), f"{i * step:g}", font=font(16), fill=INK)
    d.text((qx + n * step * ppm - 6, sy + 18 * K), f"{n * step:g} m", font=font(16), fill=INK)
    if e.get('type'):
        d.text((qx, sy + 60 * K), 'Represents: ' + e['type'], font=font(18), fill=(70, 70, 70))
    return img

def report(e, r):
    sz = r['size']
    if r.get('wl') is not None:
        r['mx_wl'] = r['max'][1] - r['wl']
        r['wl_keel'] = r['wl'] - r['min'][1]
    got = {'Draught': r.get('wl_keel'), 'Length': sz[0], 'Height': sz[1], 'Beam': sz[2], 'Span': sz[2], 'Width': sz[2]}
    got.update({k: v for k, v in r['meas'].items()})
    L = [f"# {e['title']}: game model measured against the references", '',
         f"Measured from the {r['game_name']} {r['version']} build by `tools/blueprint.py` ({datetime.date.today().isoformat()}). Model box: "
         f"{sz[0]:.2f} m long, {sz[2]:.2f} m wide, {sz[1]:.2f} m high (solid parts only, as drawn on the blueprint).", '']
    if e.get('type'):
        L += [f"**Represents:** {e['type']}", '']
    if r.get('wl') is not None and e.get('kind') == 'ship':
        L += [f"**Where she floats in the game:** the still water is {r['mx_wl']:.2f} m below her highest point and {r['wl_keel']:.2f} m above her keel (her draught in the game).", '']
    L += ['| Item | Reference | Source | Model | Difference | Result |', '|---|---|---|---|---|---|']
    for item, val, src in e.get('ref', []):
        m = got.get(item)
        if isinstance(m, (int, float)) and isinstance(val, (int, float)):
            diff = m - val
            pct = abs(diff) / val * 100 if val else 0
            res = 'match' if pct <= 3 else 'close' if pct <= 8 else '**check**'
            L.append(f"| {item} | {val:.2f} m ({ft(val)}) | {src} | {m:.2f} m | {diff:+.2f} m ({pct:.0f}%) | {res} |")
        else:
            L.append(f"| {item} | {val if val is not None else '-'} | {src} | {m if m is not None else '-'} | | |")
    L += ['', 'Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.', '']
    if e.get('notes'):
        L += ['## Notes', ''] + ['- ' + n for n in e['notes']] + ['']
    L += [f"Blueprint: `{e['file']}_blueprint.png`."]
    return '\n'.join(L) + '\n'

def main():
    ids = sys.argv[1:]
    todo = [e for e in CAT if not ids or e['id'] in ids]
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'])
        pages = {}
        for e in todo:
            g = e.get('game', 'pce')
            if g not in pages:
                pg = b.new_page(viewport={'width': 800, 'height': 450})
                errs = []
                pg.on('pageerror', lambda x, errs=errs: errs.append(str(x)))
                pg.goto('file://' + os.path.join(ROOT, BUILDS[g]), timeout=120000)
                pg.wait_for_timeout(3000)
                pg.evaluate("()=>document.getElementById('go').click()")
                pg.wait_for_timeout(5000)
                pg.evaluate(PAGE_JS + "\n;true")
                pages[g] = (pg, errs)
            pg, errs = pages[g]
            e.setdefault('ppm', 60)
            try:
                r = pg.evaluate('(e)=>window.__BP(e)', e)
            except Exception as ex:
                print(f"{e['id']}: FAILED {ex}")
                continue
            r['game_name'] = {'p51': 'P-51 Mustang FS', 'pce': 'PCE-842'}[g]
            # keep the sheet a sensible size: re-render at a scale that makes the profile about 2000 px wide
            want = max(4, min(500, 1500 / max(r['size'][0], r['size'][2], 0.5)))
            if abs(want - e['ppm']) / want > 0.05:
                e['ppm'] = want
                r2 = pg.evaluate('(e)=>window.__BP(e)', e)
                r2['game_name'] = r['game_name']
                r = r2
            sheet(e, r).save(os.path.join(OUT, e['file'] + '_blueprint.png'), optimize=True)
            open(os.path.join(OUT, e['file'] + '_measurements.md'), 'w').write(report(e, r))
            print(f"{e['id']}: {r['size'][0]:.2f} x {r['size'][2]:.2f} x {r['size'][1]:.2f} m  meas {r['meas']}  errors {errs[:2]}")
        b.close()

if __name__ == '__main__':
    main()
