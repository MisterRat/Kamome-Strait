/* THE LOADER (station 3; PLAN_M4A3_Sherman_Tank 5.3; FM 17-67 par. 17 and 20). He stands on the turret basket left of the in-game gun: the
   breech (the M3's semi-automatic sliding wedge, horizontal in the M34A1: it recoils with the in-game gun and its guard), the coaxial .30 on the
   right of the in-game gun, the turret's ready rack at his feet, the floor bins below. While the player is the loader he loads every round
   himself:
     the in-game gun empty, the round called on the box: Space takes one (from the ready rack, quick, else from the floor bins, slow);
     then the ram: Space when the marker is in the green (the shared drill framework's timing bar); a fumble costs a second and a half;
     "UP" when it is home.
   Hardcore 'load': the loader's real times (game mode about half), and he takes the kind Q / E point at (his own choice, which may not
   be the round called): a wrong round stays in the in-game gun until it is fired. The model is the turret's inside, seen only from here: the
   tank's outside is not drawn while he is in it. */
const LDR = { g: null, br: null, rnd: null, ph: 'idle', t: 0, B: null, pick: 'HE', fum: 0 };
function ldrBuild() {
  if (LDR.g || !TANK.tur) return;
  const { part, bx, cyl } = GX,
    WH_ = 0xd9d6c8,
    GR = 0x6b6b62,
    DK = 0x2a2a26,
    BR = 0xb89a4a /* brass */,
    mat = () => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x34332d }),
    mesh = (P) => new THREE.Mesh(new GX.Acc().add(P, new GX.M4()).geometry(), mat());
  /* the turret's inside (its frame: forward +x, left -z; the ring 0.88 m round, the roof 0.71 m over the hull's deck), the basket's floor
     0.95 m below the deck, the ready rack on the basket floor at his left, the radio behind him in the bustle */
  const P = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    P.push(part(bx(0.36, 1.66, 0.04), WH_, Math.cos(a) * 0.86, -0.12, Math.sin(a) * 0.86, 0, -a + Math.PI / 2, 0));
  }
  P.push(part(cyl(0.9, 0.9, 0.04, 20), WH_, 0, 0.72, 0), part(cyl(0.86, 0.86, 0.04, 20), GR, 0, -0.95, 0));
  P.push(part(bx(0.5, 0.32, 0.36), 0x5a5a50, -0.95, 0.15, 0) /* the radio in the bustle */);
  P.push(part(bx(0.5, 0.26, 0.42), 0x55524a, -0.25, -0.7, -0.5) /* the ready rack */);
  for (let i = 0; i < 4; i++) P.push(part(cyl(0.045, 0.045, 0.66, 10), BR, -0.25, -0.53, -0.66 + i * 0.1, 0, 0, Math.PI / 2));
  P.push(part(cyl(0.03, 0.03, 1.1, 8), GR, -0.2, -0.4, 0.55, 0, 0, 0) /* the gunner's seat post */);
  LDR.g = mesh(P);
  LDR.g.visible = false;
  TANK.tur.add(LDR.g);
  /* the breech, its guard and the coax: on the in-game gun (they recoil and elevate with it); its frame: the tube along +x, the breech face
     0.95 m behind the trunnions */
  const Q = [
    part(bx(0.42, 0.3, 0.3), GR, -0.75, 0, 0) /* the breech ring and block */,
    part(bx(0.06, 0.24, 0.22), DK, -0.97, 0, 0) /* the block's face */,
    part(bx(0.7, 0.04, 0.04), WH_, -1.3, 0.2, -0.24),
    part(bx(0.7, 0.04, 0.04), WH_, -1.3, 0.2, 0.24),
    part(bx(0.04, 0.04, 0.52), WH_, -1.64, 0.2, 0) /* the recoil guard */,
    part(bx(0.6, 0.11, 0.1), DK, -0.45, 0.02, 0.26) /* the coax's receiver */,
    part(bx(0.18, 0.16, 0.12), 0x4a4d3a, -0.5, -0.12, 0.26) /* its ammunition box */,
  ];
  LDR.br = mesh(Q);
  LDR.br.visible = false;
  TANK.gun.add(LDR.br);
  /* the round in his hands */
  LDR.rnd = new THREE.Mesh(new GX.Acc().add([part(cyl(0.045, 0.045, 0.66, 10), BR, 0, 0, 0, 0, 0, Math.PI / 2), part(cyl(0.035, 0.045, 0.2, 10), 0x6a6050, 0.42, 0, 0, 0, 0, Math.PI / 2)], new GX.M4()).geometry(), mat());
  LDR.rnd.visible = false;
  TANK.tur.add(LDR.rnd);
}
const ldrHere = () => camMode == 1 && STATION.stn === 3 && !PHOTO.on && !ROAM.on;
/* Space at the loader's station: take a round, or ram it */
function ldrSpace() {
  if (LDR.ph === 'idle') {
    if (G75.loaded || G75.loading) return note('LOADER: THE GUN IS LOADED');
    const id = FM.use('load') ? LDR.pick : G75.call,
      fromReady = G75.ready[id] > 0;
    if (!fromReady && G75.floor[id] <= 0) return note('NO ' + id + ' LEFT');
    if (fromReady) G75.ready[id]--;
    else G75.floor[id]--;
    LDR.id = id;
    LDR.ph = 'take';
    LDR.t = (fromReady ? 1.6 : 4.8) * (FM.use('load') ? 1 : 0.6);
    LDR.from = fromReady ? 'READY RACK' : 'FLOOR';
    return;
  }
  if (LDR.ph === 'ram') {
    if (barHit(LDR.B)) {
      G75.loaded = LDR.id;
      LDR.ph = 'idle';
      say75('LOADER', 'UP');
      if (LDR.id !== G75.call) note('LOADER: ' + LDR.id + ' UP - THE CALL WAS ' + G75.call);
    } else ((LDR.ph = 'fumble'), (LDR.t = 1.5), note('LOADER: FUMBLED THE RAM'));
  }
}
/* each frame: the player's loading, the inside shown only from his station, the round in his hands */
function ldrStep(dt) {
  const here = ldrHere();
  if (here && !LDR.g) ldrBuild();
  G75.playerLoads = here;
  if (!LDR.g) return;
  LDR.g.visible = LDR.br.visible = here;
  if (here) TANK.mesh.material.visible = TANK.tur.material.visible = TANK.gun.material.visible = false;
  else if (!DCOMP.g || !DCOMP.g.visible) TANK.mesh.material.visible = true;
  if (LDR.ph === 'take' && (LDR.t -= dt) <= 0) (LDR.ph = 'ram'), (LDR.B = barMake({ hc: FM.use('load') }, 0.22));
  if (LDR.ph === 'fumble' && (LDR.t -= dt) <= 0) (LDR.ph = 'ram'), (LDR.B = barMake({ hc: FM.use('load') }, 0.22));
  if (LDR.ph === 'ram') barStep(LDR.B, dt);
  if (!here && LDR.ph !== 'idle') {
    /* he left with a round in his hands: it goes back */
    if (G75.ready[LDR.id] < G75.READY) G75.ready[LDR.id]++;
    else G75.floor[LDR.id]++;
    LDR.ph = 'idle';
  }
  LDR.rnd.visible = here && LDR.ph !== 'idle';
  if (LDR.rnd.visible) {
    const f = LDR.ph === 'take' ? 0.3 : 1;
    LDR.rnd.position.set(-0.25 + f * 0.0, -0.53 + f * 0.85, -0.55 + f * 0.45);
  }
  dbShow('loadBox', here && started && !paused && !DRILL.menu ? { h: ldrText(), pic: LDR.ph === 'ram' ? (g, w, h) => drillBar(g, w, h, 70, LDR.B, 'RAM IT HOME: SPACE IN THE GREEN') : null } : null, 'bottom');
}
function ldrText() {
  const hc = FM.use('load');
  return (
    '<b style="color:#9fc3d6">LOADER</b> &middot; CALL <b>' + G75.call + '</b>' + (hc ? ' &middot; YOUR HAND ON <b>' + LDR.pick + '</b> (Q / E)' : '') +
    '<br>' +
    (G75.loaded ? '<b style="color:#9fe39a">' + G75.loaded + ' UP</b> - wait for the shot' : LDR.ph === 'take' ? 'Taking ' + LDR.id + ' from the ' + LDR.from + '...' : LDR.ph === 'ram' ? 'Ram it home: <b>Space</b> in the green' : LDR.ph === 'fumble' ? 'Fumbled: again...' : '<b>Space</b> takes a round')
  );
}
/* Q / E at the loader's station in Hardcore: which kind his hand goes to */
function ldrPick(d) {
  const i = (G75.ORDER.indexOf(LDR.pick) + d + 3) % 3;
  LDR.pick = G75.ORDER[i];
  note('LOADER: HAND ON ' + LDR.pick);
}
