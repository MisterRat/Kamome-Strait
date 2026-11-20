/* =====================================================================================================================
   THE STATIONS AT WORK - the live instruments in each station and the duties behind them (the gunner is THE GUNNER above).
   Each face from PCEM.FACES is a canvas painted by the game: they are drawn about 15 times a second while the player is at
   that station (once otherwise). W / S (engines) and A / D (rudder) work from every station; away from the bridge (1 OOD,
   4 Quartermaster), when the rudder is let go the helmsman holds the course.
     1 OOD: gyro-compass repeater; X raises the 7 x 50 binoculars (drag to look round).
     2 Engineering: the engine-order telegraph repeater (red = the bridge's order, black = what the engine room answers)
       and the gauge board (engine rpm, shaft rpm, lube oil, fresh water, exhaust, fuel, scavenge air, load). The bridge
       rings an order with a bell; the
       engineer answers in a second or two. The ship's speed follows what the engine room answers.
     3 Communications, one seat, three devices (3 again steps between them):
       radar - a surface-search PPI, ship's head up, sweeping; land, ships and the practice rafts paint; Page Up / Down range.
       sonar - the range recorder (each ping a line of stylus marks across the paper) and the bearing repeater; Q / E train
       the transducer, Page Up / Down the range scale; you hear the ping and the echo (its pitch shifts with the target's
       motion: up for closing, down for opening). When the player is elsewhere the operator searches by himself.
       radio - the receiver prints the traffic: orders, the target tugs, contact reports.
     4 Quartermaster: the wheel turns with the helm, the rudder-angle indicator, the gyro compass card in the binnacle,
       the two engine-order telegraphs, the two rpm indicators and the clock.
     6 Torpedoman: the depth-charge board; Page Up / Down set the depth (50 to 300 ft), Space releases a charge from the
       stern racks (port and starboard in turn), or at the K-gun view fires a K-gun (port, then starboard). Charges sink
       to their depth and go off.
   Figures marked (est.) are first-pass game figures, not researched yet.
   ===================================================================================================================== */
const STN_OF = (id) => (/^radar|^sonar|^radio/.test(id) ? 3 : /^e/.test(id) ? 2 : /^qm/.test(id) ? 4 : id === 'oodGyro' ? 1 : id === 'dcBoard' ? 6 : 0);
function stnInit() {
  if (STN.init || !SHIPM.mesh) return;
  STN.init = true;
  const big = { radar: [512, 512], sonarRec: [512, 430], radio: [512, 434], dcBoard: [512, 374] };
  for (const f of PCEM.FACES) {
    const [w, h] = big[f.id] || [256, 256],
      c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const tex = new THREE.CanvasTexture(c),
      mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !big[f.id] || f.id === 'radar' });
    mat.userData.cs = 1;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.h), mat),
      n = new THREE.Vector3(...f.n).normalize(),
      u = new THREE.Vector3(...f.up),
      x = new THREE.Vector3().crossVectors(u, n).normalize(),
      y = new THREE.Vector3().crossVectors(n, x);
    m.matrix.makeBasis(x, y, n).setPosition(...f.p);
    m.matrixAutoUpdate = false;
    SHIPM.mesh.add(m);
    STN.F[f.id] = { m, c, g: c.getContext('2d'), tex, st: STN_OF(f.id), id: f.id };
  }
  {
    const a = new GX.Acc();
    a.add(PCEM.WHEEL.parts, null);
    const m = new THREE.Mesh(a.geometry(), PCEM.intMaterial);
    m.position.set(...PCEM.WHEEL.pivot);
    SHIPM.mesh.add(m);
    STN.wheel = m;
  }
  {
    /* the OOD on the open bridge: there unless the player has the watch there himself */
    const a = new GX.Acc();
    a.add(PCEM.OOD.parts, null);
    STN.ood = new THREE.Mesh(a.geometry(), PCEM.material);
    SHIPM.mesh.add(STN.ood);
  }
  RADIO.add('CTU 75.4', 'PCE 842 TAKE PATROL STATION ABLE OFF THE PT BASE. REPORT ALL CONTACTS.');
  for (const id in STN.F) stnDraw(STN.F[id]);
}
