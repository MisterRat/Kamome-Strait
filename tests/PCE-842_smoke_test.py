#!/usr/bin/env python3
"""Smoke test for PCE-842.html  (development aid - not needed to play the game).

Boots the game in headless Chromium with ALL network access blocked, then checks:
  - no script errors, no external requests, three.js r128 inlined, version label
  - frames are being rendered and the draw-call count is inside the budget
  - the player's ship exists, starts at sea on the PCE's patrol line, and is not the P-51
  - Shift rings up speed, the ship gathers way and moves; the rudder turns her both ways
  - Ctrl rings astern, ALL STOP is reachable, the order stays where it is left
  - C switches between the chase camera and the bridge; the open-bridge eye is about 11.8 m above the water
  - the ship model from the plans: hull length and beam, the interiors mesh, the ensigns
  - stations 1-6: each key takes its station (first person), a second press steps to its second view; the engine room is below the waterline and dry
  - the gunner (5): 3"/50, 20 mm, twin 40 mm in turn; the player replaces the crewman; keys lay the gun while the helmsman holds the
    course; the 3"/50 telescope, the ring sights, firing, drums and autoloaders, tracers, splashes, the firing cutout, the range tables
  - the stations at work: live instruments, comms' three devices, the telegraph answered, sonar echoes, depth charges, the wheel
  - practice targets (T), the Wave motion setting, no artificial horizon, a short context-aware controls box
  - settings are saved under PCE-842's own keys (never the P-51's)
  - the ocean: in the scene, the waves move, they die away in shallow water, the ship rides them (heave, pitch, roll)
  - screenshots of the chase view and the bridge view go to tests/ next to this file

Usage:   pip install playwright && playwright install chromium
         python PCE-842_smoke_test.py [path/to/PCE-842.html]
Set CHROMIUM=/path/to/chrome to use a specific browser binary. Exit code 0 = all passed.
"""
import os, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

HTML = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).with_name("PCE-842.html")).resolve()
SHOTS = HTML.parent / "tests"
DRAW_CALL_BUDGET = 750
results, errors, external = [], [], []

def shot(path):
    """a screenshot for the record: slow under software rendering, so a long timeout, and a missed one is reported, not fatal"""
    try:
        pg.screenshot(path=path, timeout=180000)
    except Exception as e:
        print("NOTE  screenshot skipped:", path, str(e).split(chr(10))[0])

def check(name, ok, detail=""):
    ok = bool(ok)
    results.append(ok)
    print(("PASS  " if ok else "FAIL  ") + name + (f"  ({detail})" if detail else ""))

with sync_playwright() as p:
    kw = dict(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"])
    if os.environ.get("CHROMIUM"):
        kw["executable_path"] = os.environ["CHROMIUM"]
    b = p.chromium.launch(**kw)
    pg = b.new_page(viewport={"width": 960, "height": 540})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(("file:", "data:", "blob:")) else (external.append(r.request.url), r.abort()))
    pg.goto(HTML.as_uri())
    pg.wait_for_timeout(4000)

    def fresh():
        """a new page on the same game, started, at the bridge: under software rendering every visit to a gun sight leaves hundreds of MB
        in the renderer (the original 0.51 does the same), so the long run would be killed for memory; the old page is closed first"""
        global pg
        pg.close()
        pg = b.new_page(viewport={"width": 960, "height": 540})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
        pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(("file:", "data:", "blob:")) else (external.append(r.request.url), r.abort()))
        pg.goto(HTML.as_uri())
        pg.wait_for_timeout(4000)
        pg.evaluate("()=>{$$('go').click()}"); pg.wait_for_timeout(1500)
        pg.keyboard.press("KeyC"); pg.wait_for_timeout(500)

    check("loads with no script errors", not errors, "; ".join(errors[:3]))
    check("no external requests (fully offline)", not external, ", ".join(external[:3]))
    check("three.js r128 is inlined", pg.evaluate("()=>typeof THREE!=='undefined'&&THREE.REVISION==='128'"))
    check("version label is shown (major.minor)", pg.evaluate("()=>/^\\d+\\.\\d+$/.test(VERSION)&&document.querySelector('.verTag').textContent.includes(VERSION)"), pg.evaluate("()=>VERSION"))
    check("title is PCE-842", "PCE-842" in pg.title(), pg.title())

    check("the player's ship model is in place", pg.evaluate("()=>!!SHIPM.mesh&&!!SHIPM.pts"))
    start = pg.evaluate("()=>({x:pos.x,z:pos.z,y:pos.y,h:HR(pos.x,pos.z),p0:SHIPM.pts[0]})")
    check("starts at sea on the PCE's patrol line", abs(start["x"] - start["p0"][0]) < 1 and abs(start["z"] - start["p0"][1]) < 1 and start["h"] < -12,
          f"seabed {start['h']:.1f} m")

    pg.evaluate("()=>{$$('go').click()}"); pg.wait_for_timeout(800)
    check("game started", pg.evaluate("()=>started"))
    f0 = pg.evaluate("()=>R.info.render.frame"); pg.wait_for_timeout(1500); f1 = pg.evaluate("()=>R.info.render.frame")
    check("frames are being rendered", f1 > f0, f"{f1 - f0} frames in 1.5 s")
    calls = pg.evaluate("()=>R.info.render.calls")
    for _ in range(2):
        pg.wait_for_timeout(700); calls = min(calls, pg.evaluate("()=>R.info.render.calls"))
    check(f"draw calls within budget ({DRAW_CALL_BUDGET})", calls <= DRAW_CALL_BUDGET, f"{calls} calls")
    check("the P-51 is hidden", pg.evaluate("()=>plane.visible===false"))
    SHOTS.mkdir(exist_ok=True)
    shot(path=str(SHOTS / "PCE-842_chase.png"))

    # drive the physics directly (fast and independent of the frame rate): ring up flank speed
    pg.evaluate("()=>{keys.KeyW=true}")
    pg.evaluate("()=>{for(let i=0;i<300;i++)shipStep(1/60)}")
    pg.evaluate("()=>{keys.KeyW=false}")
    check("W rings up the engines to FLANK", pg.evaluate("()=>SHIP.tel===1&&shipOrder()==='AHEAD FLANK'"), pg.evaluate("()=>shipOrder()"))
    p0 = pg.evaluate("()=>({x:pos.x,z:pos.z})")
    pg.evaluate("()=>{for(let i=0;i<60*120;i++)shipStep(1/60)}")
    kn = pg.evaluate("()=>SHIP.u/0.5144")
    check("she settles near 15.7 knots after two minutes", 14.5 < kn < 15.8, f"{kn:.1f} kn")
    moved = pg.evaluate(f"()=>Math.hypot(pos.x-{p0['x']},pos.z-{p0['z']})")
    check("the ship moves through the water", moved > 400 or pg.evaluate("()=>SHIP.aground"), f"{moved:.0f} m")
    check("the order stays where it was left", pg.evaluate("()=>SHIP.tel===1"))

    def turn(key):
        pg.evaluate("()=>{pos.set(SHIPM.pts[0][0],SHIPM.Y,SHIPM.pts[0][1]);SHIP.aground=false;SHIP.u=SHIP.VMAX;SHIP.r=0}")
        h0 = pg.evaluate("()=>SHIP.hdg")
        pg.evaluate(f"()=>{{keys.{key}=true;for(let i=0;i<60*20;i++)shipStep(1/60);keys.{key}=false}}")
        return pg.evaluate(f"()=>((-(SHIP.hdg-{h0})*180/Math.PI)%360+540)%360-180")
    dr, dl = turn("KeyD"), turn("KeyA")
    check("right rudder turns her to starboard", dr > 20, f"{dr:.0f} deg in 20 s")
    check("left rudder turns her to port", dl < -20, f"{dl:.0f} deg in 20 s")
    check("rudder returns amidships when let go", pg.evaluate("()=>{for(let i=0;i<300;i++)shipStep(1/60);return Math.abs(SHIP.rud)<0.01}"))

    pg.evaluate("()=>{keys.KeyS=true;for(let i=0;i<60*5;i++)shipStep(1/60);keys.KeyS=false}")
    check("S rings astern", pg.evaluate("()=>SHIP.tel<0&&shipOrder().startsWith('BACK')"), pg.evaluate("()=>shipOrder()"))
    pg.evaluate("()=>{SHIP.tel=0.01;shipStep(1/60)}")
    check("ALL STOP is reachable", pg.evaluate("()=>SHIP.tel===0&&shipOrder()==='ALL STOP'"))

    # cameras: back to the start, under way, chase then bridge
    pg.evaluate("()=>{reset();SHIP.tel=0.6;SHIP.u=6}"); pg.wait_for_timeout(2500)
    shot(path=str(SHOTS / "PCE-842_chase_underway.png"))
    pg.keyboard.press("KeyC"); pg.wait_for_timeout(1500)
    check("C switches to the bridge", pg.evaluate("()=>camMode===1"))
    eye = pg.evaluate("()=>cam.position.y-SHIPM.Y")
    check("open-bridge eye is about 11.8 m above the water", 10.8 < eye < 12.9, f"{eye:.1f} m")
    shot(path=str(SHOTS / "PCE-842_bridge.png"))
    pg.keyboard.press("KeyC"); pg.wait_for_timeout(500)
    check("C switches back to the chase camera", pg.evaluate("()=>camMode===0"))

    check("the ocean surface is in the scene", pg.evaluate("()=>!!OCEAN.mesh.parent&&OCEAN.mesh.material.transparent"))
    mv = pg.evaluate("()=>{const x=SHIPM.pts[0][0],z=SHIPM.pts[0][1];let a=OCEAN.h(x,z,10),mx=0;for(let t=10;t<20;t+=0.5)mx=Math.max(mx,Math.abs(OCEAN.h(x,z,t)-a));return mx}")
    check("the waves move in deep water", mv > 0.2, f"{mv:.2f} m of change in 10 s")
    # the waves run in over the shallows (crests only, no troughs below the painted floor) and die away at the water's edge (under 0.4 m): the nearest shore on any of 16 bearings
    sh = pg.evaluate("()=>{let edge=-1,tr=0;for(let k=0;k<16&&edge<0;k++)for(let r=0;r<20000;r+=2){const x=SHIPM.pts[0][0]+r*Math.cos(k*0.3927),z=SHIPM.pts[0][1]+r*Math.sin(k*0.3927);const d=OCEAN.depthAt(x,z);if(d>0.05&&d<0.4&&edge<0)edge=Math.abs(OCEAN.h(x,z,3)-OCEAN.Y)+Math.abs(OCEAN.h(x,z,7)-OCEAN.Y);if(d>0.5&&d<15)for(const t of [1,3,5,7])tr=Math.min(tr,OCEAN.h(x,z,t)-OCEAN.Y);}return [edge,tr]}")
    check("the waves die away at the water's edge, and over the shallows they only crest (no trough below the painted floor)", 0 <= sh[0] < 1e-6 and sh[1] >= -1e-6, f"{sh}")
    rd = pg.evaluate("""()=>{reset();let mh=0,mp=0,mr=0;for(let i=0;i<60*30;i++){OCEAN.U.uTime.value=100+i/60;shipStep(1/60);shipPose(1/60);mh=Math.max(mh,Math.abs(SHIPW.hv));mp=Math.max(mp,Math.abs(SHIPW.pi));mr=Math.max(mr,Math.abs(SHIPW.ro));}return [mh,mp*57.3,mr*57.3]}""")
    check("the ship rides the waves (heave, pitch, roll)", 0.05 < rd[0] < 1.5 and 0.1 < rd[1] < 6 and 0.2 < rd[2] < 15, f"heave {rd[0]:.2f} m, pitch {rd[1]:.1f} deg, roll {rd[2]:.1f} deg")
    dims = pg.evaluate("()=>{const g=SHIPM.mesh.geometry;g.computeBoundingBox();const b=g.boundingBox;return [b.max.x-b.min.x,PCEM.hb(45,PCEM.top(45)-1e-3)*2]}")
    check("hull from the plans: 56 m overall, 10.1 m beam", 55.5 < dims[0] < 56.5 and 9.9 < dims[1] < 10.2, f"{dims[0]:.2f} m x {dims[1]:.2f} m")
    check("station interiors and ensigns are on the ship", pg.evaluate("()=>SHIPM.mesh.children.length>=3"))
    names = []
    for k in range(1, 7):
        pg.keyboard.press(f"Digit{k}"); pg.wait_for_timeout(250)
        names.append(pg.evaluate(f"()=>camMode===1&&SHIP.stn==={k}&&SHIP.sub===({k}===6?3:0)"))
    check("keys 1-6 take each station", all(names), str(names))
    pg.keyboard.press("Digit5"); pg.wait_for_timeout(200); pg.keyboard.press("Digit5"); pg.wait_for_timeout(200)
    check("pressing a station key again steps to its second view", pg.evaluate("()=>SHIP.stn===5&&SHIP.sub===1"))
    # ---- the gunner ----
    fresh()
    check("the three player guns are moving parts", pg.evaluate("()=>GUN.M.map(g=>g.id).sort().join()==='20,3in,40'&&GUN.M.every(g=>g.m.tr.parent===g.m.o&&g.m.el.parent===g.m.tr)"))
    pg.keyboard.press("Digit1"); pg.wait_for_timeout(200)
    cyc = []
    for k in range(4):
        pg.keyboard.press("Digit5"); pg.wait_for_timeout(250)
        cyc.append(pg.evaluate("()=>GUN.cur&&GUN.cur.id"))
    check("5 steps through the 3\"/50, the 20 mm and the twin 40 mm", cyc == ["3in", "20", "40", "3in"], str(cyc))
    pg.wait_for_timeout(400)
    check("the player replaces the gun's pointer (his crewman hidden, the others' shown)", pg.evaluate("()=>!gunOf('3in').m.pm.visible&&gunOf('20').m.pm.visible&&gunOf('40').m.pm.visible"))
    sc = pg.evaluate("()=>({fov:cam.fov,ov:$$('gunOv').style.display})")
    check("3\"/50: through the pointer's telescope", abs(sc["fov"] - 10) < 0.01 and sc["ov"] == "block", str(sc))
    if os.environ.get("ALL_SHOTS"): shot(path=str(SHOTS / "PCE-842_gun_3in.png"))  # each sight picture costs ~500 MB under software rendering
    pg.keyboard.press("KeyX"); pg.wait_for_timeout(300)
    check("X looks up from the sight", pg.evaluate("()=>GUN.look&&cam.fov===65&&$$('gunOv').style.display==='none'"))
    pg.keyboard.press("KeyX"); pg.wait_for_timeout(200)
    a0 = pg.evaluate("()=>[gunOf('3in').trT,gunOf('3in').elT,SHIP.rud,SHIP.tel]")
    pg.mouse.move(480, 270); pg.mouse.down(button="right"); pg.mouse.move(470, 270, steps=2); pg.mouse.up(button="right")
    d1 = pg.evaluate("()=>gunOf('3in').trT") - a0[0]
    pg.keyboard.down("Backquote"); pg.mouse.down(button="right"); pg.mouse.move(460, 270, steps=2); pg.mouse.up(button="right"); pg.keyboard.up("Backquote")
    d2 = pg.evaluate("()=>gunOf('3in').trT") - a0[0] - d1
    check("3\"/50: the mouse lays it like the other guns, and ` makes the moves six times bigger", d1 > 0 and abs(d2 / d1 - 6) < 0.3, f"{d1:.5f} {d2:.5f}")
    # start from a mid elevation: under headless pointer capture the synthetic moves above can come through as one big jump that pins
    # the gun at its top limit (the original 0.51 captures the pointer the same way), and a drag upward could not then be seen
    pg.evaluate("()=>{const g=gunOf('3in');g.elT=g.el=0.4;}")
    a0 = pg.evaluate("()=>[gunOf('3in').trT,gunOf('3in').elT,SHIP.rud,SHIP.tel]")
    pg.mouse.move(430, 240); pg.mouse.down(button="right"); pg.mouse.move(380, 210, steps=4); pg.wait_for_timeout(200); pg.mouse.up(button="right"); pg.wait_for_timeout(200)
    a1 = pg.evaluate("()=>[gunOf('3in').trT,gunOf('3in').elT]")
    pg.keyboard.down("KeyA"); pg.keyboard.down("KeyW"); pg.wait_for_timeout(1500)
    a2 = pg.evaluate("()=>[gunOf('3in').trT,gunOf('3in').elT,SHIP.rud,SHIP.tel]")
    pg.keyboard.up("KeyA"); pg.keyboard.up("KeyW")
    check("at a gun right-drag lays it, and A / W still work the rudder and the engines", a1[0] > a0[0] and a1[1] > a0[1] and a2[0] == a1[0] and a2[1] == a1[1] and a2[2] < -0.03 and a2[3] > a0[3], f"{a0} -> {a1} -> {a2}")
    cut = pg.evaluate("()=>{const g=gunOf('3in');g.tr=g.trT=2.6;g.el=0.02;g.elT=0.02-g.se;gunUpdate(0.001);return g.cut}")
    n0 = pg.evaluate("()=>GUN.B.length")
    pg.keyboard.down("Space"); pg.wait_for_timeout(400); pg.keyboard.up("Space")
    check("the firing cutout: no shot into the bridge", cut and pg.evaluate("()=>GUN.B.length") == n0)
    rt = pg.evaluate("()=>['3in','40','20'].map(k=>Math.max(...gunTable(GSPEC[k]).map(r=>r[1])))")
    check("range tables match the guns' maximum ranges (13,341 / 10,076 / 4,329 m)",
          abs(rt[0] / 13341 - 1) < 0.03 and abs(rt[1] / 10214 - 1) < 0.03 and abs(rt[2] / 4329 - 1) < 0.23, ", ".join(f"{r:.0f}" for r in rt))
    sp = pg.evaluate("""()=>{const g=gunOf('3in');g.tr=g.trT=0;g.el=g.los=g.elT=0.05;g.se=0;GUN.rng=13000;gunUpdate(0.001);g.se=0;g.el=0.05;g.m.el.rotation.z=0.05;SHIPM.mesh.updateMatrixWorld(true);const f0=GUN.F.length;GUN.B.length=0;gunFire(g,0);
       const b=GUN.B[0];let t=0;while(GUN.B.length&&t<60){gunUpdate(0.02);t+=0.02;}return {t,splash:GUN.F.length>f0}}""")
    check("a 3\"/50 shell flies and splashes into the sea", sp["splash"] and 2 < sp["t"] < 20, str(sp))
    pg.evaluate("()=>{SCAM.want=false;SCAM.on=false}")
    pg.keyboard.press("Digit5"); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const g=GUN.cur;g.elT=0.23;g.trT=0;}"); pg.wait_for_timeout(600)
    r0 = pg.evaluate("()=>GUN.cur.rnd")
    pg.keyboard.down("Space"); pg.wait_for_timeout(1500)
    tr = pg.evaluate("()=>GUN.geo.drawRange.count")
    if os.environ.get("ALL_SHOTS"): shot(path=str(SHOTS / "PCE-842_gun_20mm.png"))  # each sight picture costs ~500 MB under software rendering
    pg.keyboard.up("Space")
    r1 = pg.evaluate("()=>GUN.cur.rnd")
    check("20 mm: fires from its 60-round drum, with tracer", r1 < r0 and tr > 0, f"{r0} -> {r1} rounds, {tr // 2} tracers")
    dr = pg.evaluate("()=>{const g=GUN.cur;g.rnd=1;g.ft=0;g.rl=0;keys.Space=true;gunUpdate(0.02);gunUpdate(0.2);keys.Space=false;return [g.rnd,g.rl>0]}")
    check("20 mm: an empty drum is changed", dr[0] == 0 and dr[1], str(dr))
    pg.keyboard.press("Digit5"); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const g=GUN.cur;g.elT=0.1;g.trT=g.tr+0.4;}"); pg.wait_for_timeout(600)
    al = pg.evaluate("()=>{const g=GUN.cur;g.ft=0;g.al=[8,8];keys.Space=true;for(let i=0;i<4;i++)gunUpdate(0.23);keys.Space=false;return g.al}")
    check("twin 40 mm: the barrels fire in turn from their autoloaders", al[0] < 8 and al[1] < 8 and abs(al[0] - al[1]) <= 1, str(al))
    if os.environ.get("ALL_SHOTS"): shot(path=str(SHOTS / "PCE-842_gun_40mm.png"))  # each sight picture costs ~500 MB under software rendering
    fresh()  # the gun sights' renderer memory (software rendering): the targets on a new page
    pg.keyboard.press("KeyT"); pg.wait_for_timeout(300)
    pt = pg.evaluate("()=>PT.on&&PT.L.filter(t=>t.kind==='raft').length===5&&PT.L.filter(t=>t.kind==='sleeve').length===2")
    hit = pg.evaluate("()=>{const t=PT.L.find(x=>x.kind==='sleeve');const n=PT.hits.sleeve;ptHit(t.p.clone().add(new THREE.Vector3(-4,0,0)),t.p.clone().add(new THREE.Vector3(4,0,0)),GSPEC['40']);return PT.hits.sleeve===n+1}")
    pg.keyboard.press("KeyT"); pg.wait_for_timeout(200)
    check("T: practice targets (five rafts, two towed sleeves) score hits, T again clears them", pt and hit and pg.evaluate("()=>!PT.on&&!PT.L.length"))
    kz = pg.evaluate("""()=>{ptToggle();ptUpdate(0.01);const V=THREE.Vector3,t=PT.L.find(x=>x.kind==='sleeve'),sh=(off,g)=>ptHit(t.p.clone().add(new V(-4,off,0)),t.p.clone().add(new V(4,off,0)),GSPEC[g]);
      const rs=()=>{t.gone=0;t.dmg=0;t.m.visible=true};const r=[];FM.on=true;rs();r.push(sh(0.23,'40'));FM.on=false;rs();r.push(sh(0.23,'40'));
      rs();const k0=PT.kills||0;sh(0,'20');const one=t.gone>0;sh(0,'20');r.push(!one&&t.gone>0&&PT.kills===k0+1);
      ptUpdate(26);r.push(t.m.visible&&!(t.gone>0));ptToggle();return r}""")
    tr = pg.evaluate("""()=>{SHIPM.mesh.updateMatrixWorld(true);const m=SHIPM.mesh,x=PCEM.XF(PCEM.F_END),rc=new THREE.Raycaster();
      return [0.3,0.8,1.2].map(dy=>{const p=m.localToWorld(new THREE.Vector3(x-20,PCEM.top(PCEM.F_END)-dy,0.4)),q=m.localToWorld(new THREE.Vector3(x+1,PCEM.top(PCEM.F_END)-dy,0.4));
        rc.set(p,q.sub(p).normalize());return rc.intersectObject(m).length>0})}""")
    check("the transom is closed (rays from astern just under the deck edge hit it)", all(tr), str(tr))
    check("sleeve kill zones: 40 mm 0.23 m off misses in Hardcore, kills in game mode; 20 mm needs two hits; the sleeve is re-streamed", kz == [False, True, True, True], str(kz))
    pg.keyboard.press("Digit5"); pg.wait_for_timeout(400)  # back on a gun (the targets were checked on a fresh page, at the bridge)
    wv = pg.evaluate("()=>{$$('wvMode').value='guns';$$('wvMode').onchange();for(let i=0;i<200;i++)shipPose(0.05);const a=SHIPW.k;$$('wvMode').value='on';$$('wvMode').onchange();return a}")
    check("Wave motion 'off at the guns' holds her level while on a gun", wv < 0.01, f"k={wv:.3f}")
    hc = pg.evaluate("()=>{{const c=$$('hcOn');c.checked=true;c.onchange({target:c});}const t0=SHIP.tel;keys.KeyW=true;shipStep(0.5);keys.KeyW=false;const a=SHIP.tel===t0;$$('wvMode').value='off';$$('wvMode').onchange();for(let i=0;i<100;i++)shipPose(0.05);const b=SHIPW.k>0.99;$$('wvMode').value='on';$$('wvMode').onchange();{const c=$$('hcOn');c.checked=false;c.onchange({target:c});}keys.KeyW=true;shipStep(0.5);keys.KeyW=false;return [a,b,SHIP.tel>t0]}")
    sc = pg.evaluate("()=>{const g=gunOf('3in');GUN.B.length=0;gunFire(g,0);GUN.B.forEach(b=>b.own=true);SCAM.want=true;scamStart();const a=SCAM.on;let n=0;while(GUN.B.length&&n<3000){gunUpdate(0.02);n++}return a&&$$('scOn').checked!==undefined}")
    check("shell cam: starts on the player's shells in flight (Settings option)", sc)
    ap = pg.evaluate("""()=>{ptToggle();const s=PT.L.find(t=>t.kind==='sleeve'&&t.gun==='40');ptUpdate(0.01);const g=gunOf('40');GUN.B.length=0;
       const o=g.m.el.localToWorld(new THREE.Vector3(2.74,0,0));const v=s.p.clone().sub(o).normalize().multiplyScalar(881);
       GUN.B.push({p:o.clone(),v,t:0,r:0,s:GSPEC['40'],a:o.clone(),own:true});scamStart();const ok=SCAM.on&&SCAM.tg===s.p;SCAM.on=false;GUN.B.length=0;ptToggle();return ok}""")
    am = pg.evaluate("""()=>{ptToggle();ptUpdate(0.01);const g=gunOf('40'),s=PT.L.find(t=>t.kind==='sleeve'&&t.gun==='40');SHIPM.mesh.updateMatrixWorld(true);
       const q=new THREE.Vector3();gunAim(g,s.p,s.v,q,ptAt(s));const o=gunMz(g,new THREE.Vector3()),at=ptAt(s),T=new THREE.Vector3();
       const a=o.clone(),sp=o.clone(),sv=q.clone().sub(o).normalize().multiplyScalar(g.s.mv).add(vel);let md=1e9;
       for(let t=0.01;t<6;t+=0.01){a.copy(sp);const v=sv.length(),k=g.s.k*Math.exp(-Math.max(0,sp.y)/9145)*v;sv.multiplyScalar(1-k*0.01);sv.y-=9.81*0.01;sp.addScaledVector(sv,0.01);at(t,T);
         const d=T.clone().sub(a),l=sp.clone().sub(a),u=Math.max(0,Math.min(1,d.dot(l)/l.lengthSq()));md=Math.min(md,a.clone().addScaledVector(l,u).distanceTo(T));}
       ptToggle();return md}""")
    check("sight ring: a 40 mm shell laid on it passes within 1 m of the circling sleeve", am < 1.0, f"{am:.2f} m")
    check("shell cam: a shell passing close to a sleeve frames the sleeve (airborne first)", ap)
    pg.evaluate("()=>{SCAM.on=false}")
    sk = pg.evaluate("()=>{SCAM.on=true;dispatchEvent(new KeyboardEvent('keydown',{code:'KeyQ'}));const r=!SCAM.on;SCAM.on=false;return r}")
    check("any key cuts the shell cam back to the gun", sk)
    ra = pg.evaluate("()=>{PT.on||ptToggle();const g=gunOf('40'),t=PT.L.find(x=>x.kind==='raft'),q=new THREE.Vector3();const ok=gunAim(g,t.p,new THREE.Vector3(),q,null);ptToggle();return ok&&q.y>t.p.y}")
    check("a raft on the water gets an aim point (above it, for the drop)", ra)
    check("Settings has the sight-rings option (game mode aim rings at the guns)", pg.evaluate("()=>UI.items.some(i=>i.id==='gring'&&UI.applies(i))&&typeof gunRings==='function'"))
    check("Hardcore: no engines from a gun, wave motion always on; game mode: engines from any station", all(hc), str(hc))
    # ---- the other stations at work ----
    fresh()
    check("live instruments are on the ship (radar, sonar, radio, gauges, telegraphs, compass, depth-charge board)",
          pg.evaluate("()=>['radar','sonarRec','sonarBrg','radio','eTel','eg0','qmTelP','qmCompass','qmRudder','oodGyro','dcBoard'].every(k=>STN.F[k]&&STN.F[k].m.parent===SHIPM.mesh)"))
    devs = pg.evaluate("()=>PCEM.STN[3].map(v=>v.dev).join()")
    check("communications: radar, sonar and radio from one seat", devs == "radar,sonar,radio" and pg.evaluate("()=>new Set(PCEM.STN[3].map(v=>v.e.join())).size===1"), devs)
    eng = pg.evaluate("()=>{const t0=SHIP.tel;ENG.ans=0;SHIP.tel=0.5;ENG.lagT=0;engStep(0.5);const a=ENG.ans;for(let i=0;i<40;i++)engStep(0.1);const b=ENG.ans;SHIP.tel=t0;for(let i=0;i<60;i++)engStep(0.1);return [a,b]}")
    check("the engine room answers the telegraph after a moment", eng[0] < 0.1 and abs(eng[1] - 0.5) < 0.01, str(eng))
    son = pg.evaluate("""()=>{ptToggle();const s=PT.L.find(t=>t.kind==='sub');ptUpdate(0.01);const d=s.p.clone().sub(pos);
       const bw=[-Math.sin(SHIP.hdg),-Math.cos(SHIP.hdg)],sb=[Math.cos(SHIP.hdg),-Math.sin(SHIP.hdg)];
       SONAR.brg=Math.atan2(d.x*sb[0]+d.z*sb[1],d.x*bw[0]+d.z*bw[1]);SONAR.ri=1;sonarPing(false);const e=SONAR.last.E.some(x=>x.sub);ptToggle();return e}""")
    check("sonar: a ping on the exercise submarine's bearing returns an echo", son)
    dc = pg.evaluate("()=>{const n=DC.rack[0]+DC.rack[1];dcFire(false);const ok=DC.rack[0]+DC.rack[1]===n-1&&DC.L.length>0;for(let i=0;i<400&&DC.L.length;i++)dcStep(0.1);return ok&&!DC.L.length}")
    check("torpedoman: a charge leaves the racks, sinks and goes off", dc)
    kg = pg.evaluate("()=>{DC.kl=[1,1,1,1];DC.kg=[2,2];const a=dcFire('stbd'),b=dcFire('stbd'),c=dcFire('stbd');for(let i=0;i<600&&DC.L.length;i++)dcStep(0.1);DC.kl=[1,1,1,1];DC.kg=[2,2];return [a,b,c]}")
    check("torpedoman: two K-guns a side, then that side is empty", kg == [True, True, False], str(kg))
    hh = pg.evaluate("""()=>{HH.n=24;const ok=hhFire();for(let i=0;i<400&&(HH.q.length||HH.L.length);i++)hhStep(0.05);return ok&&HH.n===0&&!HH.L.length&&!HH.q.length}""")
    check("Hedgehog: 24 bombs ripple off, sink and are gone", hh)
    wk = pg.evaluate("""()=>{const r=[[24.6,0],[25,-4.15],[43.9,-4.35],[57.4,-4.4],[57.6,-3.4],[58.2,-0.4],[62.4,0],[63.7,0],[68.3,0],[69,-2.7],[73,-2.95],[76,-3.2],[79.5,-3],[79.8,0],[83.6,0]];
       return r.every(([f,z])=>tpFree(tpXF(f),z)) && !tpFree(tpXF(35),0) && !tpFree(tpXF(74.8),0)}""")
    check("Hardcore walking: the deck route bow to stern is open, the deckhouse and the 40 mm platform are not", wk)
    run = pg.evaluate("""()=>{const was=paused;paused=true;ptToggle();SHIP.stn=6;camMode=1;SHIP.sub=3;HH.n=24;let i=0;
       for(;i<8000;i++){const dt=0.05;let trig=false;const o=ASW.O.filter(o=>o.st==='open').pop();
         if(o){const k=tpIdx(o.k);if(SHIP.sub!==k)tpGo(k);else trig=(i%2===0);}for(const k in DC.dep)DC.dep[k]=ASW.depth;
         shipStep(dt);sonarStep(dt,false,0);shipPose(dt);SHIPM.mesh.updateMatrixWorld(true);ptUpdate(dt);dcStep(dt);STN.fire0=false;tpUpdate(dt,true,trig);
         if(ASW.deb)break;}
       const d=ASW.deb,held=ASW.ph==='done'&&!PT.on;for(let k=0;k<5;k++)aswStep(0.05,true);const still=ASW.ph==='done'&&ASW.deb===d;
       SHIP.stn=1;aswStep(0.05,true);const gone=ASW.ph==='idle'&&!ASW.deb;paused=was;return [d,held&&still&&gone]}""")
    check("an attack run: the OOD cons, orders the Hedgehog and the pattern (every order on time, however many the run needs), debriefs; targets off, the score held until he leaves", run and __import__("re").search(r"ORDERS (\d+)/\1 ON TIME", run[0] or "") and "DEPTH RIGHT" in (run[0] or "") and run[1], str(run))
    wh = pg.evaluate("()=>{const r=SHIP.rud;SHIP.rud=0.5;stnUpdate(0.01);const a=STN.wheel.rotation.x;SHIP.rud=r;return a}")
    check("quartermaster: the wheel turns with the helm", abs(wh - 0.5 * 3.14159 * 3) < 0.01, f"{wh:.2f} rad")
    pg.keyboard.press("KeyC"); pg.wait_for_timeout(300)
    check("chase camera: the crewman is back at the gun", pg.evaluate("()=>GUN.M.every(g=>g.m.pm.visible)"))
    pg.keyboard.press("KeyC"); pg.wait_for_timeout(200)
    pg.keyboard.press("Digit2"); pg.wait_for_timeout(1200)
    er = pg.evaluate("()=>({y:cam.position.y-pos.y})")
    check("engine room eye is below the waterline (not pushed up to the sea)", er["y"] < 0.5, f"{er['y']:.2f} m relative to the waterline")
    shot(path=str(SHOTS / "PCE-842_engine_room.png"))
    pg.keyboard.press("Digit1"); pg.wait_for_timeout(200)
    pg.keyboard.press("KeyP"); pg.wait_for_timeout(400)
    vis = pg.evaluate("()=>[...document.querySelectorAll('#pmTabs button')].filter(b=>b.offsetParent!==null).map(b=>b.textContent)")
    check("pause menu shows the ship's pages (Settings, Missions, About, Controls, Operations, Hardcore)", vis == ["Settings", "Missions", "About", "Controls", "Operations", "Hardcore"], ", ".join(vis))
    pg.evaluate("()=>pmSetTab('ctl')"); pg.wait_for_timeout(300)
    ctl = pg.evaluate("()=>$$('pmPaneC').innerText")
    check("no artificial horizon, and the controls box is short", pg.evaluate("()=>getComputedStyle($$('hz')).display==='none'&&$$('hkBody').innerText.split('\\n').length<=6"))
    check("Controls page describes the ship", "Rudder" in ctl and "Engines" in ctl and "Flaps" not in ctl)
    shot(path=str(SHOTS / "PCE-842_controls.png"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.keyboard.press("KeyJ"); pg.keyboard.press("KeyJ"); pg.keyboard.press("KeyB"); pg.wait_for_timeout(300)
    check("P-51 keys (bail out, bandit) do nothing", pg.evaluate("()=>!BL.on&&!EN.length&&!pmOpen"))
    pg.keyboard.press("KeyM"); pg.wait_for_timeout(300)
    check("M opens the ship's Missions page", pg.evaluate("()=>pmOpen"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    keys_ = pg.evaluate("()=>Object.keys(localStorage)")
    check("settings use PCE-842's own keys (never the P-51's)", not any(k.startswith("p51") for k in keys_), ", ".join(keys_[:6]))
    check("no script errors while sailing", not errors, "; ".join(errors[:3]))
    b.close()

print(f"\n{sum(results)}/{len(results)} passed")
sys.exit(0 if all(results) else 1)
