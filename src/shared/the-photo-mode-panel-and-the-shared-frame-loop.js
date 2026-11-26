/* the photo mode panel */
$$('pmPhoto').onclick = () => photoEnter();
$$('phShot').onclick = () => (PHOTO.shot = true);
$$('phExit').onclick = () => photoExit();
$$('phHud').onclick = () => {
  PHOTO.hud = !PHOTO.hud;
  photoSave();
  photoSync();
};
$$('phAc').onclick = () => {
  PHOTO.showPlane = !PHOTO.showPlane;
  photoSave();
  photoSync();
};
$$('phFz').onclick = () => {
  PHOTO.freeze = !PHOTO.freeze;
  paused = PHOTO.freeze;
  photoSync();
};
$$('phFov').oninput = (e) => photoFov(+e.target.value);
$$('phTime').onchange = (e) => {
  WX.time = e.target.value;
  WX.hour = WX.time === 'local' ? WX.localHour() : WX_HOUR[WX.time];
  WX.apply();
  photoSync();
};
$$('phHour').oninput = (e) => {
  WX.hour = +e.target.value;
  WX.paint();
  $$('phHourV').textContent = WX.clock();
};
$$('phWx').onchange = (e) => {
  WX.wx = e.target.value;
  WX.apply();
};
$$('phRes').onchange = (e) => {
  PHOTO.res = +e.target.value;
  photoSave();
};
$$('phQ').onchange = (e) => {
  PHOTO.q = +e.target.value;
  photoSave();
};
$$('phSpd').onchange = (e) => (PHOTO.spd = +e.target.value);
$$('phStamp').onchange = (e) => {
  PHOTO.stamp = e.target.checked;
  photoSave();
};
$$('phGrid').onchange = (e) => {
  PHOTO.grid = e.target.checked;
  photoSave();
  photoSync();
};
$$('ph')
  .querySelectorAll('button[data-s]')
  .forEach((b) => (b.onclick = () => photoSpot(b.dataset.s)));
$$('ph').addEventListener('change', () => {
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
});
$$('ph').addEventListener('pointerup', () => {
  if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
});
/* the frame loop: shared by every simulator. What belongs to one simulator is asked of its role (SIMS.cur, the SIMS piece) */
function frame(now) {
  requestAnimationFrame(frame);
  const R_ = SIMS.cur,
    dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  adaptRes(now - last);
  last = now;
  if (!paused) WT += dt;
  pollPad();
  touchUpdate();
  if ((orbDrag || R_.look()) && camMode == 1 && !pad.lx && !pad.ly) {
    /* mouse is looking */
  } else if (pad.lx || pad.ly) {
    viewYaw += pad.lx * 3.2 * dt;
    viewPitch = Math.max(-1.2, Math.min(1.2, viewPitch - pad.ly * 1.8 * dt));
  } else {
    viewYaw += (((-viewYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, 6 * dt);
    viewPitch += (0 - viewPitch) * Math.min(1, 6 * dt);
  }
  viewYaw = ((((viewYaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  /* the frame's time is split into equal sub-steps of at most 1/120 s: physics stays accurate at any frame rate
     and the vehicle still moves exactly as far as the real time that passed, so there is no stutter */
  if (started && !paused && !RPL.on && R_.canStep()) {
    const n = Math.max(1, Math.ceil(dt / PH_DT - 1e-6));
    for (let i = 0; i < n && R_.canStep(); i++) R_.step(dt / n);
  }
  R_.afterStep(dt);
  axes();
  R_.pose(dt);
  if (started && !paused && !RPL.on) {
    R_.live(dt);
    updConvoy(dt);
    AF.update(dt);
    _afT += dt * 6;
    AFLD.update(dt);
    if (SITE.pat) SITE.pat(dt);
    R_.liveLate(dt);
    for (const h of HOOKS.tick) h(dt);
  } else if (RPL.on) {
    AA.hide();
    AF.hide();
  }
  R_.parts(dt);
  const lookOn = !!(pad.lx || pad.ly) || Math.abs(viewYaw) > 0.03 || Math.abs(viewPitch) > 0.03;
  lb += ((camMode == 1 || lookOn ? 1 : 0) - lb) * Math.min(1, 10 * dt);
  const cockPos = SC.cockPos,
    dv = tmp,
    fovHint = R_.eye(cockPos, dv);
  const cockT = SC.cockT.copy(dv).multiplyScalar(50).add(cockPos);
  if (camMode == 1) {
    cam.position.copy(cockPos);
    cam.up.copy(R_.eyeUp());
    cam.lookAt(cockT);
    cp.copy(cockPos);
  } else {
    const chaseT = SC.chaseT;
    R_.chase(dt, cp, cu, chaseT);
    if (lb < 0.01) {
      cam.position.copy(cp);
      cam.up.copy(cu);
      cam.lookAt(chaseT);
    } else {
      cam.position.lerpVectors(cp, cockPos, lb);
      cam.up.lerpVectors(cu, up, lb).normalize();
      cam.lookAt(SC.aim.lerpVectors(chaseT, cockT, lb));
    }
  }
  if (orbitOn) {
    const ce = Math.cos(orbEl);
    cam.position
      .copy(pos)
      .add(
        SC.orb
          .set(orbDist * Math.sin(orbYaw) * ce, orbDist * Math.sin(orbEl), orbDist * Math.cos(orbYaw) * ce)
          .applyQuaternion(q),
      );
    cam.up.set(0, 1, 0);
    cam.lookAt(R_.orbitLift ? SC.aim.copy(pos).setY(pos.y + R_.orbitLift) : pos);
  }
  R_.view(dt, fovHint);
  if (RPL.on) R_.replay(dt);
  R_.overCam(dt);
  if (PHOTO.on) photoCam(dt);
  else if (ROAM.on) {
    if (R_.busy() || RPL.on) roamExit(true);
    else {
      roamCam();
      highView();
    }
  }
  {
    const gh = H(cam.position.x, cam.position.z) + (PHOTO.on || ROAM.on ? 0.3 : 1);
    if (cam.position.y < gh && !(camMode == 1 && !PHOTO.on && !ROAM.on && !orbitOn && R_.below())) cam.position.y = gh;
  }
  sun.target.position.copy(pos);

  sky.position.copy(cam.position);
  terrU.uTime.value = WT;
  OCEAN.U.uTime.value = WT;
  {
    const nn = PHOTO.on || ROAM.on ? Math.max(0.3, Math.max(0, PHOTO.pos.y) * 0.004) : !orbitOn && (camMode == 1 || lb > 0.3) ? R_.near() : 1;
    if (cam.near !== nn) {
      cam.near = nn;
      cam.updateProjectionMatrix();
    }
  }
  {
    const b2 = R_.shake();
    if (b2 > 0) {
      cam.position.x += (Math.random() - 0.5) * b2;
      cam.position.y += (Math.random() - 0.5) * b2;
      cam.position.z += (Math.random() - 0.5) * b2;
    }
  }
  cam.updateMatrixWorld();
  updNearTrees(cam.position.x, cam.position.y, cam.position.z);
  updGrass(cam.position.x, cam.position.y, cam.position.z);
  R_.hudEarly(dt);
  driftClouds(dt);
  WORLD.update(dt);
  updWX(dt);
  R_.hud(dt);
  drawMinimap();
  R_.hudLate(dt);
  audioUpd();
  R_.preRender();
  fogCut();
  R.render(scene, cam);
  fogUncut();
  if (PHOTO.shot) photoCapture();
}
// Nothing past the fog can be seen, so a mesh whose nearest edge lies beyond
// fog.far is left out of this one draw (its own visible flag is put back
// straight after, so nothing else in the game notices). Only plain meshes that
// take the fog are judged; instanced meshes, groups and the sky are left alone.
const FOGCUT = { on: true, list: [], n: 0 };
const _fcV = new THREE.Vector3();
function fogCut() {
  const L = FOGCUT.list, f = scene.fog;
  L.length = 0;
  if (!FOGCUT.on || !f || !(f.far > 0)) return;
  const cx = cam.matrixWorld.elements[12], cy = cam.matrixWorld.elements[13], cz = cam.matrixWorld.elements[14];
  const ch = scene.children;
  for (let i = 0; i < ch.length; i++) {
    const o = ch[i];
    if (!o.visible || !o.isMesh || o.isInstancedMesh) continue;
    const m = o.material;
    if (!m || m.fog === false || Array.isArray(m)) continue;
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const sp = g.boundingSphere;
    _fcV.copy(sp.center).applyMatrix4(o.matrixWorld);
    const r = sp.radius * o.matrixWorld.getMaxScaleOnAxis();
    const dx = _fcV.x - cx, dy = _fcV.y - cy, dz = _fcV.z - cz, d = f.far + r;
    if (dx * dx + dy * dy + dz * dz > d * d) ((o.visible = false), L.push(o));
  }
  FOGCUT.n = L.length;
}
function fogUncut() {
  const L = FOGCUT.list;
  for (let i = 0; i < L.length; i++) L[i].visible = true;
  L.length = 0;
}
requestAnimationFrame(frame);
