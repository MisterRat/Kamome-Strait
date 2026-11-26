/* the M4A3's role: how the tank plugs into the shared frame loop (the role contract is in the SIMS piece). Registered right after SIMS:
   every hook only looks up the tank's code when it is called. T0 (the groundwork): the tank stands in the first revetment of Camp
   Buckner's tank park, her platoon in the next ones; the chase and orbit cameras look at her, the first-person eye is the commander
   head out in his cupola. She does not move yet: driving comes in T2. */
const TANK = {
  mesh: null /* the player's tank: the hull and running gear, with the turret and gun as children */,
  tur: null,
  gun: null,
  park: null /* the platoon's display copies in the next revetments (one baked geometry) */,
  hdg: 0 /* her heading: the yaw of q (0 = nose north, -z) */,
  trav: 0 /* the turret's traverse, radians (left positive) */,
  elev: 0 /* the gun's elevation, radians */,
  YAX: new THREE.Vector3(0, 1, 0),
  /* the model's frame (nose +x, the MODELS convention) turned into the vehicle's (nose -z: the shared fwd, as every vehicle's pos / q
     / fwd / right / up): the mesh is q times this; points given in the model's frame go through toW() */
  MQ: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2),
  toW: (v) => v.applyQuaternion(TANK.MQ).applyQuaternion(q),
  EYE: new THREE.Vector3(-0.25, 3.33, 0.42) /* the current station's eye, the model's frame (nose +x, right +z); set by stationTake */,
  look: [0, 0] /* the station's own look: yaw (+ to the left), pitch */,
  peri: false /* looking through a periscope */,
  /* the crew's stations (the shared STATION): key n, its views; e the eye in the model's frame. The driver's large hatch is on the
     glacis at the hull's front left (the model: 1.2 m ahead of centre, 0.52 m left, the hull roof 1.89 m); his own periscope in the hatch
     is just ahead of it. The other stations come with their phases (gunner and loader T3, bow gunner T4) */
  STN: {
    1: [{ name: 'COMMANDER - HEAD OUT', e: [-0.25, 3.33, 0.42] /* standing in the cupola, his eyes 0.4 m over its rim */ }],
    4: [
      { name: 'DRIVER - HEAD OUT', e: [1.2, 2.58, -0.52] /* his seat up, his head out of the hatch */ },
      { name: 'DRIVER - BUTTONED UP: M6 PERISCOPE', e: [1.1, 2.12, -0.4], peri: true /* the seat down, the hatch shut, his eyes at the periscope's window */ },
    ],
  },
};
/* the camp's frame and the tank park's revetments (the far sites piece and the army sites: ten in a row, open toward +S) */
function tankPark() {
  const F = FS.army.find((f) => f.id === 'camp');
  return { F, at: (i) => F.w(-150 + i * 33, -70.6) /* the tank 0.6 m back from the revetment bay's centre */, yaw: F.ryS, y: F.H + 0.12 };
}
/* bake a list of parts into one mesh */
function tankMesh(P) {
  const a = new GX.Acc();
  a.add(P, new GX.M4());
  const m = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
  m.matrixAutoUpdate = true;
  return m;
}
function tankBuild() {
  if (TANK.mesh) return;
  const K = M4A3.K;
  TANK.mesh = tankMesh([...M4A3.hull(), ...M4A3.gear(-1), ...M4A3.gear(1)]);
  TANK.tur = tankMesh(M4A3.turret());
  TANK.tur.position.set(K.TX, K.DECK, 0);
  TANK.gun = tankMesh(M4A3.gun());
  TANK.gun.position.set(M4A3.G.gunX, M4A3.G.gunY, 0);
  TANK.tur.add(TANK.gun);
  TANK.mesh.add(TANK.tur);
  scene.add(TANK.mesh);
  /* the platoon: four more tanks in revetments 2 to 5, their turrets at bearings of their own (one geometry, one draw call) */
  const pk = tankPark(),
    a = new GX.Acc(),
    whole = MODELS.get('us-m4a3');
  for (let i = 1; i <= 4; i++) {
    const [x, z] = pk.at(i);
    a.add(whole, GX.xf(x, pk.y, z, pk.yaw));
  }
  TANK.park = new THREE.Mesh(a.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: 2 }));
  TANK.park.matrixAutoUpdate = false;
  TANK.park.updateMatrix();
  scene.add(TANK.park);
}
/* the drive train, the tracks on the ground and the hull on its springs: the-drive-train-and-the-tracks.js (DRV, tankDrive, tankSettle) */
/* the tank's pose each frame: her mesh at pos with her heading; the turret and gun at their angles */
function tankPose() {
  if (!TANK.mesh) return;
  TANK.mesh.position.copy(pos);
  TANK.mesh.quaternion.copy(q).multiply(TANK.MQ);
  TANK.tur.rotation.set(0, TANK.trav, 0);
  TANK.gun.rotation.set(0, 0, TANK.elev);
}
SIMS.add({
  id: 'm4a3',
  name: 'M4A3 Sherman',
  label: 'M4A3 Sherman',
  fileTag: 'M4A3',
  word: 'Tank',
  orbitDist: 14,
  orbitMin: 5,
  orbitLift: 1.6,
  docsTab: 'about',
  canStep: () => true,
  step: (h) => tankDrive(h),
  live: () => BA.update(pos),
  pose: () => tankPose(),
  /* first person: the station's eye (TANK.EYE), turned by its own look and the head. Through the driver's M6 periscope the head turns the
     periscope (it rotates in the hatch) and tilts it a little for near or far; the field is narrow (the window mask: tankHudLate) */
  eye: (P, D) => {
    const e = TANK.EYE;
    TANK.toW(P.set(e.x, e.y, e.z)).add(pos);
    if (TANK.peri) viewPitch = Math.max(-0.2, Math.min(0.12, viewPitch));
    const yw = viewYaw + TANK.look[0],
      pt = viewPitch + TANK.look[1],
      cp = Math.cos(pt);
    TANK.toW(D.set(cp * Math.cos(yw), Math.sin(pt), -cp * Math.sin(yw)));
    return TANK.peri ? 30 : 65;
  },
  /* the stations: the shared STATION with the tank's own list */
  stations: () => TANK.STN,
  stationTake: (n, st) => {
    TANK.EYE.set(st.e[0], st.e[1], st.e[2]);
    TANK.look[0] = st.yaw || 0;
    TANK.look[1] = st.pitch || 0;
    TANK.peri = !!st.peri;
    orbReset() /* out of the orbit view, as the camera key does going to first person */;
  },
  hudLate: () => tankHudLate(),
  /* the chase camera: behind her and above, level */
  chase: (dt, cp, cu, T) => {
    cp.lerp(TANK.toW(SC.chase.set(-15 * chaseZ, 7 * chaseZ, 0)).add(pos), 1 - Math.exp(-4 * dt));
    cu.set(0, 1, 0);
    T.copy(fwd).multiplyScalar(8).add(pos);
    T.y = pos.y + 1.8;
  },
  near: () => 0.08,
  spawn: () => {
    tankBuild();
    const pk = tankPark(),
      [x, z] = pk.at(0);
    TANK.hdg = pk.yaw - Math.PI / 2 /* the park's yaw is the model's (nose +x along the revetment's open end) */;
    pos.set(x, pk.y, z);
    DRV.v = 0;
    tankSettle();
    BA.update(pos, true) /* the ground round her, all at once */;
    TANK.trav = 0;
    TANK.elev = 0;
  },
  ready: () => {
    camMode = 0;
    tankPose();
    /* the chase camera starts at its spot behind her (else it eases in from wherever it was) */
    cp.copy(pos).add(TANK.toW(new V(-15, 7, 0)));
  },
  showSelf: (on) => {
    if (TANK.mesh) TANK.mesh.visible = on;
  },
  aimY: () => pos.y + 1.6,
  bind: [
    /* id, doc word, keyboard codes, controller button (null = none). The tank's own controls arrive with each phase; the shared rows
       (camera, menus, map, sound, graphics, photo) work from the start */
    ['pitchUp', '', [], null],
    ['pitchDn', '', [], null],
    ['rollL', 'turn left', ['KeyA', 'ArrowLeft'], null],
    ['rollR', 'turn right', ['KeyD', 'ArrowRight'], null],
    ['rudL', '', [], null],
    ['rudR', '', [], null],
    ['thrUp', 'forward', ['KeyW', 'ArrowUp'], null],
    ['thrDn', 'back', ['KeyS', 'ArrowDown'], null],
    ['flapDn', '', [], null],
    ['flapUp', '', [], null],
    ['gear', '', [], null],
    ['brake', '', [], null],
    ['guns', '', [], null],
    ['rocket', '', [], null],
    ['bomb', '', [], null],
    ['camera', 'chase / commander head out', ['KeyC'], 3],
    ['clear', 'chase / roam camera', ['KeyY'], null],
    ['r3', '', [], null],
    ['restart', '', ['Enter'], 9],
    ['pause', 'pause menu', ['KeyP', 'Escape'], 8],
    ['manual', 'manual', ['KeyI'], 10],
    ['missions', 'missions', ['KeyM'], null],
    ['help', 'controls box', ['KeyH'], null],
    ['map', 'minimap', ['KeyO'], null],
    ['mapOut', 'zoom out', ['Minus', 'NumpadSubtract'], null],
    ['mapIn', 'zoom in', ['Equal', 'NumpadAdd'], null],
    ['guide', '', [], null],
    ['coach', 'shrink coach panel', ['KeyK'], null],
    ['quality', 'graphics: Auto / Low / Medium / High', ['KeyN'], null],
    ['mute', 'sound on / off', ['KeyU'], null],
    ['bail', '', [], null],
    ['trimDn', '', [], null],
    ['trimUp', '', [], null],
    ['trimRL', '', [], null],
    ['trimRR', '', [], null],
    ['trimAL', '', [], null],
    ['trimAR', '', [], null],
    ['trimC', '', [], null],
    ['photo', 'photo mode', ['F9'], null],
    ['st1', 'commander', ['Digit1', 'Numpad1'], null],
    ['st2', 'gunner', ['Digit2', 'Numpad2'], null],
    ['st3', 'loader', ['Digit3', 'Numpad3'], null],
    ['st4', 'driver (again: buttoned up)', ['Digit4', 'Numpad4'], null],
    ['st5', 'bow gunner', ['Digit5', 'Numpad5'], null],
  ],
  act: {
    camera: () => {
      if (ROAM.on) return roamExit();
      camMode ^= 1;
      if (camMode == 1) orbReset();
    },
    clear: () => (ROAM.on ? roamExit() : roamEnter()),
    st1: () => STATION.take(1),
    st2: () => STATION.take(2) || note('GUNNER - COMES WITH THE GUNNERY (T3)'),
    st3: () => STATION.take(3) || note('LOADER - COMES WITH THE GUNNERY (T3)'),
    st4: () => STATION.take(4),
    st5: () => STATION.take(5) || note('BOW GUNNER - COMES WITH COMMAND (T4)'),
  },
  uiAct: {
    missions: () => toggleMenu(),
    coach: () => (coachMin = !coachMin),
    map: () => {
      UI.toggle('mm');
      mmT = 0;
    },
    mapOut: () => {
      mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ + 1));
      mmT = 0;
    },
    mapIn: () => {
      mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ - 1));
      mmT = 0;
    },
    photo: () => photoToggle(),
    mute: () => {
      SND.setOn(!SND.on);
      $$('sndOn').checked = SND.on;
      note('SOUND ' + (SND.on ? 'ON' : 'OFF'));
    },
    quality: () => {
      QL.mode = QMODES[(QMODES.indexOf(QL.mode) + 1) % QMODES.length];
      applyQuality();
      note('GRAPHICS: ' + QL.mode.toUpperCase());
    },
    bail: () => {},
    guide: () => {},
  },
  /* the on-screen boxes (the shared display options): the minimap, the compass strip and the controls box for now; the page's other
     boxes (the PCE's, the P-51's) are not the tank's (sc 'none'). The tank's own readout comes with driving (T2) */
  uiItems: [
    { id: 'cmp', label: 'Compass strip', sel: '#cmp', g: 'Instruments', sc: 'none' /* comes with the tank's own readout (T2) */ },
    { id: 'mm', label: 'Minimap (O)', sel: '#mm', g: 'Instruments' },
    { id: 'help', label: 'Controls help (H)', sel: '#help', g: 'Instruments' },
    { id: 'hud', label: 'Tank readout', sel: '#hud', g: 'Instruments', sc: 'none' },
    { id: 'hz', label: '', sel: '#hz', g: 'Instruments', sc: 'none' },
    { id: 'adf', label: '', sel: '#adf', g: 'Instruments', sc: 'none' },
    { id: 'coach', label: '', sel: '#coach', g: 'Instruments', sc: 'none' },
    { id: 'tq', label: '', sel: '#tq', g: 'Instruments', sc: 'none' },
    { id: 'bandit', label: '', sel: '#bd,#bdt,#lead', g: 'Aids', sc: 'none' },
    { id: 'cross', label: '', sel: '#cross', g: 'Aids', sc: 'none' },
    { id: 'rkring', label: '', sel: '#rkip', g: 'Aids', sc: 'none' },
    { id: 'bmring', label: '', sel: '#ccip', g: 'Aids', sc: 'none' },
    { id: 'tThr', label: '', sel: '#tThr', g: 'Touch controls', sc: 'none' },
    { id: 'tCtx', label: '', sel: '#tCtx', g: 'Touch controls', sc: 'none' },
    { id: 'tStn', label: '', sel: '#tStn', g: 'Touch controls', sc: 'none' },
    { id: 'trud', label: '', sel: '#tRL,#tRR', g: 'Touch controls', sc: 'none' },
    { id: 'tweap', label: '', sel: '#tFire', g: 'Touch controls', sc: 'none' },
    { id: 'tbar', label: 'Top bar buttons (the pause button stays)', sel: '#tBar .tb:not(#tPause)', g: 'Touch controls', sc: 'mob' },
  ],
  kbDoc: [],
  padDoc: [],
});
/* the driver's view through the M6 periscope: a narrow window (about 40 by 13 degrees) in black; and the driver's readout (gear, speed,
   engine) while he drives, until the instrument panel comes with his compartment */
function tankHudLate() {
  let m = document.getElementById('tkPeri'),
    r = document.getElementById('tkDrv');
  if (!m) {
    m = document.createElement('div');
    m.id = 'tkPeri';
    m.style.cssText = 'position:fixed;left:50%;top:44%;width:86vw;height:24vw;transform:translate(-50%,-50%);border-radius:1.2vw;box-shadow:0 0 0 200vmax #050505,inset 0 0 3vw rgba(0,0,0,.8);pointer-events:none;z-index:40;display:none';
    document.body.appendChild(m);
    r = document.createElement('div');
    r.id = 'tkDrv';
    r.style.cssText = 'position:fixed;left:12px;bottom:64px;font:600 13px/1.35 monospace;color:#f4f0dc;background:rgba(0,0,0,.45);padding:5px 9px;border-radius:4px;pointer-events:none;z-index:41;display:none';
    document.body.appendChild(r);
  }
  const fp = camMode == 1 && !PHOTO.on && !ROAM.on && !paused,
    drv = fp && STATION.stn === 4;
  m.style.display = fp && TANK.peri ? '' : 'none';
  r.style.display = (drv || camMode != 1) && started && !paused && !PHOTO.on ? '' : 'none';
  if (r.style.display === '') {
    const G = ['R', 'N', '1st', '2nd', '3rd', '4th', '5th'][DRV.gear];
    r.innerHTML = G + (DRV.shift > 0 ? ' &middot; SHIFTING' : '') + ' &middot; ' + Math.round(Math.abs(DRV.v) * 3.6) + ' km/h &middot; ' + Math.round(DRV.rpm / 10) * 10 + ' rpm' + (DRV.park && Math.abs(DRV.v) < 0.1 ? ' &middot; PARKED' : '');
  }
}
