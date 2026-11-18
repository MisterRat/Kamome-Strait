/* Roam camera (Y): a free camera that works like photo mode's, but the flight carries on and every flight key still works.
   Only the mouse moves it: left-drag looks, right-drag moves along the ground, middle-drag up and down, wheel in and out
   (hold ` = six times bigger steps; there is no wheel zoom). It shares its position and angles with PHOTO. */
const ROAM = { on: false, fov0: 65 };
function roamEnter() {
  if (ROAM.on || PHOTO.on || !started || BL.on || RPL.on) return;
  ROAM.on = true;
  ROAM.fov0 = cam.fov;
  camMode = 0;
  orbitOn = false;
  PHE.setFromQuaternion(cam.quaternion, 'YXZ');
  PHOTO.pos.copy(cam.position);
  PHOTO.yaw = PHE.y;
  PHOTO.pitch = PHE.x;
  PHOTO.fov = cam.fov;
  note('ROAM CAMERA - MOUSE MOVES IT, ' + kbText('clear') + ' RETURNS TO CHASE');
}
function roamExit(quiet) {
  if (!ROAM.on) return;
  ROAM.on = false;
  PHOTO.drag = false;
  cam.fov = ROAM.fov0;
  cam.far = 40000;
  cam.near = 1;
  cam.updateProjectionMatrix();
  if (SEAP) {
    SEAP.position.set(0, -11.8, 0);
    SEAP.scale.set(1, 1, 1);
    SEAP.updateMatrix();
  }
  WX.apply();
  orbReset();
  camMode = 0;
  if (!quiet) note('CHASE CAMERA');
}
const PHE_R = new THREE.Euler();
function roamCam() {
  cam.position.copy(PHOTO.pos);
  cam.quaternion.setFromEuler(PHE_R.set(PHOTO.pitch, PHOTO.yaw, 0, 'YXZ'));
  if (Math.abs(cam.fov - PHOTO.fov) > 0.01) {
    cam.fov = PHOTO.fov;
    cam.updateProjectionMatrix();
  }
}
cv.addEventListener('mousedown', (e) => {
  if (PHOTO.on || ROAM.on) {
    PHOTO.drag = e.button === 2 ? 2 : e.button === 1 ? 3 : 1; /* left drag looks around, right drag moves the camera along the ground, middle drag moves it up and down */
    e.preventDefault();
    return;
  }
  if (docsOpen || UI.editing || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
  orbDrag = true;
  if (camMode == 1 && GUN.cur) {
    /* at a gun: the pointer is captured and plain mouse movement lays the gun (all three guns); the left button fires, and the right
       button held also lays it as the mouse is dragged */
    if (e.button === 2) {
      GUN.drag = true;
      GUN.d0 = [e.clientX, e.clientY];
      GUN.dd = [0, 0];
    }
    else if (e.button === 0) GUN.rmb = true;
    if (document.pointerLockElement !== cv) gunLock(true);
    orbDrag = false;
    e.preventDefault();
    return;
  }
  if (camMode != 1) orbitOn = true;
  e.preventDefault();
});
addEventListener('mouseup', () => {
  orbDrag = false;
  GUN.rmb = false;
  GUN.drag = false;
  PHOTO.drag = false;
});
addEventListener('mousemove', (e) => {
  if (PHOTO.on || ROAM.on) {
    if (PHOTO.drag === 2 || PHOTO.drag === 3) {
      /* right-drag moves the camera horizontally (sideways and forward / back along the ground, whichever way it is looking),
         middle-drag moves it up and down; the picture follows the cursor. Steps are a fraction of the distance to the aircraft or
         the ground, whichever is nearer, so they stay fine near the ground; holding ` makes each one six times bigger */
      const ref = Math.max(
          0.3,
          Math.min(cam.position.distanceTo(pos), cam.position.y - H(cam.position.x, cam.position.z) + 1.5),
        ),
        k = ((2 * Math.tan((PHOTO.fov * Math.PI) / 360) * ref) / innerHeight) * (keys.Backquote ? 6 : 1) /* hold ` for six times bigger steps (Shift and Ctrl are the throttle) */,
        sy = Math.sin(PHOTO.yaw),
        cy = Math.cos(PHOTO.yaw);
      if (PHOTO.drag === 2) {
        PHOTO.pos.x += cy * -e.movementX * k + -sy * e.movementY * k;
        PHOTO.pos.z += -sy * -e.movementX * k + -cy * e.movementY * k;
      } else PHOTO.pos.y += e.movementY * k;
      PHOTO.pos.y = Math.max(PHOTO.pos.y, H(PHOTO.pos.x, PHOTO.pos.z) + 0.4);
    } else if (PHOTO.drag) {
      const k = 0.0035 * (PHOTO.fov / 65);
      PHOTO.yaw -= e.movementX * k;
      PHOTO.pitch = Math.max(-1.55, Math.min(1.55, PHOTO.pitch - e.movementY * k));
    }
    return;
  }
  if (camMode == 1 && GUN.cur && !docsOpen && !pmOpen && started) {
    /* at a gun: the mouse moves the gun (no button needed; the pointer is captured while on station), finer through the telescope;
       looking up from the sight (X) it turns the head */
    if (GUN.look) {
      viewYaw += e.movementX * 0.0045;
      viewPitch = Math.max(-1.2, Math.min(1.2, viewPitch - e.movementY * 0.0045));
    } else if (GUN.drag || document.pointerLockElement === cv) {
      /* finer through the telescope (scaled by the field of view); hold ` for six times bigger moves, as in Roam */
      const k = ((0.0025 * cam.fov) / 65) * (keys.Backquote ? 6 : 1);
      gunLay(-e.movementX * k, -e.movementY * k);
    }
    return;
  }
  if (!orbDrag || docsOpen) return;
  if (BL.on) {
    BL.yaw += e.movementX * 0.0045;
    BL.pitch = Math.max(-1.53, Math.min(1.53, BL.pitch - e.movementY * 0.0045));
  } else if (camMode == 1) {
    const k = STN.bino ? 0.0045 * (7.1 / 65) : 0.0045;
    viewYaw += e.movementX * k;
    viewPitch = Math.max(-1.2, Math.min(1.2, viewPitch - e.movementY * k));
    return;
    viewYaw += e.movementX * 0.0045;
    viewPitch = Math.max(-1.2, Math.min(1.2, viewPitch - e.movementY * 0.0045));
  } /* cockpit: free look */
  else {
    orbYaw -= e.movementX * 0.006;
    orbEl = Math.max(-1.45, Math.min(1.45, orbEl + e.movementY * 0.006));
  }
});
cv.addEventListener(
  'wheel',
  (e) => {
    if (PHOTO.on || ROAM.on) {
      e.preventDefault();
      {
        /* the wheel flies the camera along the view line in small steps (a few percent of the distance to the aircraft or to the
           ground, whichever is nearer, so it stays fine near the ground); holding ` makes the steps six times bigger */
        const ref = Math.max(
            0.3,
            Math.min(cam.position.distanceTo(pos), cam.position.y - H(cam.position.x, cam.position.z) + 1.5),
          ),
          dd = ref * (Math.exp(Math.max(-150, Math.min(150, e.deltaY)) * 0.0004 * (keys.Backquote ? 6 : 1)) - 1);
        PHOTO.pos.addScaledVector(PHV1.set(0, 0, -1).applyQuaternion(cam.quaternion), -dd);
      }
      return;
    }
    if (!docsOpen && camMode == 1 && GUN.cur) {
      e.preventDefault();
      gunRange(e.deltaY < 0 ? 91.44 : -91.44); /* 100 yd a notch */
      return;
    }
    if (docsOpen || camMode == 1) return;
    e.preventDefault();
    orbitOn = true;
    orbDist = Math.max(25, Math.min(900, orbDist * Math.exp(e.deltaY * 0.0015)));
  },
  { passive: false },
);
cv.addEventListener('contextmenu', (e) => e.preventDefault());
