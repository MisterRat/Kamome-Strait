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
  EYE: new THREE.Vector3(-0.25, 3.33, 0.42) /* the commander head out: standing in the cupola, his eyes 0.4 m over its rim */,
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
/* THE PLACEHOLDER DRIVE (T1: to try the battle area's ground; the track physics, the gears and the laterals replace it in T2). W / S
   forward and back (up to 7 m/s, 25 km/h; 2.5 m/s astern), A / D turn her (0.45 rad/s, on the spot too). She sits on the ground under
   her four track corners, pitched and rolled to it; a wall or a windbreak ahead stops her. */
const DRV = { v: 0, pitch: 0, roll: 0, E: new THREE.Euler(0, 0, 0, 'YXZ'), P: [[-1.05, -2.0], [1.05, -2.0], [-1.05, 2.0], [1.05, 2.0]] };
/* a point (lx, lz) of the vehicle's own frame (nose -z, right +x) at heading h: its world x, z */
const tankAt = (lx, lz, h) => [pos.x + Math.cos(h) * lx + Math.sin(h) * lz, pos.z - Math.sin(h) * lx + Math.cos(h) * lz];
function tankSettle() {
  const hd = TANK.hdg,
    y = DRV.P.map(([lx, lz]) => {
      const [x, z] = tankAt(lx, lz, hd);
      return BA.GH(x, z);
    });
  DRV.pitch = Math.atan((y[0] + y[1] - y[2] - y[3]) / 2 / 4.0);
  DRV.roll = Math.atan((y[1] + y[3] - y[0] - y[2]) / 2 / 2.1);
  pos.y = (y[0] + y[1] + y[2] + y[3]) / 4;
  q.setFromEuler(DRV.E.set(DRV.pitch, hd, DRV.roll, 'YXZ'));
}
function tankDrive(h) {
  const fw = kb('thrUp') - kb('thrDn') + (pad.ly ? -pad.ly : 0),
    tu = kb('rollR') - kb('rollL') + (pad.lx || 0),
    vt = fw > 0 ? 7 * Math.min(1, fw) : fw < 0 ? 2.5 * Math.max(-1, fw) : 0;
  DRV.v += Math.max(-2.2 * h, Math.min(1.6 * h, vt - DRV.v)) /* she gathers way slowly and stops a little quicker */;
  const nh = TANK.hdg - tu * 0.45 * h,
    dz = -DRV.v * h /* forward is -z in her own frame */;
  /* the points of her hull she would push into something: the front corners going ahead, the rear going astern */
  const pts = DRV.v >= 0 ? [[-1.25, -3.1], [1.25, -3.1], [0, -3.1]] : [[-1.25, 3.1], [1.25, 3.1]];
  const ox = pos.x,
    oz = pos.z;
  pos.x += Math.sin(nh) * dz;
  pos.z += Math.cos(nh) * dz;
  for (const [lx, lz] of pts) {
    const [x, z] = tankAt(lx, lz, nh),
      b = BA.block(x, z, 0.25);
    if (b) {
      pos.x = ox;
      pos.z = oz;
      DRV.v = 0;
      break;
    }
  }
  TANK.hdg = nh;
  tankSettle();
}
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
  /* first person: the commander head out in his cupola (the turret's frame), looking with the head */
  eye: (P, D) => {
    const e = TANK.EYE;
    TANK.toW(P.set(e.x, e.y, e.z)).add(pos);
    const cp = Math.cos(viewPitch);
    TANK.toW(D.set(cp * Math.cos(viewYaw), Math.sin(viewPitch), -cp * Math.sin(viewYaw)));
    return 65;
  },
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
  ],
  act: {
    camera: () => {
      if (ROAM.on) return roamExit();
      camMode ^= 1;
      if (camMode == 1) orbReset();
    },
    clear: () => (ROAM.on ? roamExit() : roamEnter()),
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
