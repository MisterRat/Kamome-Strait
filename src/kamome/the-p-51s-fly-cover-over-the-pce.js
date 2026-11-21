/* CROSSOVER: P-51s fly cover over the PCE-842 (Kamome Strait page only: it needs both simulators). Two Mustangs (the P-51's
   display form, P51DISP) hold a combat air patrol circle over the ship; when the PCE's raiders come (Settings > Enemy: Planes),
   each goes after the nearest Frank and, holding it in its sights, has a fair chance of shooting it down every second. Their
   kills are theirs, not the ship's (RAID.kills is hers). They show on the minimap in blue. */
const CAP = (() => {
  const R = 1800 /* the circle's radius round the ship, m */,
    ALT = 700 /* above the sea */,
    V_CAP = 125,
    V_ATK = 165 /* m/s */,
    TURN = 0.45 /* rad/s */,
    L = [];
  let said = false;
  const up = new THREE.Vector3(0, 1, 0),
    w = new THREE.Vector3(),
    M = new THREE.Matrix4(),
    tgt = new THREE.Vector3();
  const spawn = () => {
    for (let k = 0; k < 2; k++) {
      const D = P51DISP.make({ gear: false }),
        a = k * Math.PI,
        f = {
          g: D.g,
          prop: D.prop,
          a,
          p: new THREE.Vector3(pos.x + R * Math.cos(a), SEA.Y + ALT, pos.z + R * Math.sin(a)),
          v: new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(V_CAP),
          bank: 0,
          tgt: null,
          aim: 0,
        };
      scene.add(f.g);
      L.push(f);
    }
  };
  /* turn the velocity toward w at most TURN rad/s, at speed sp; the bank follows the turn */
  const steer = (f, dir, sp, dt) => {
    const v0 = f.v.clone().normalize(),
      ang = Math.acos(Math.max(-1, Math.min(1, v0.dot(dir)))),
      k = ang > 1e-4 ? Math.min(1, (TURN * dt) / ang) : 1,
      v1 = v0.clone().lerp(dir, k).normalize(),
      side = Math.sign(v0.x * v1.z - v0.z * v1.x);
    const rate = ang > 1e-4 ? Math.min(ang, TURN * dt) / dt : 0;
    f.bank += (Math.atan((sp * rate) / 9.81) * side - f.bank) * Math.min(1, dt * 2);
    const s0 = f.v.length();
    f.v.copy(v1).multiplyScalar(s0 + (sp - s0) * Math.min(1, dt * 0.5));
  };
  const pose = (f) => {
    f.g.position.copy(f.p);
    const d = w.copy(f.v).normalize(),
      u = up.clone().applyAxisAngle(d, -f.bank);
    M.lookAt(f.p, tgt.copy(f.p).add(d), u);
    f.g.quaternion.setFromRotationMatrix(M);
  };
  const tick = (dt) => {
    const on = SIMS.on('pce') && !crashed;
    if (!on) {
      for (const f of L) f.g.visible = false;
      return;
    }
    if (!L.length) spawn();
    if (!said) {
      said = true;
      RADIO.add('CAP', 'TWO P-51S ON STATION OVER YOU, ANGELS TWO. WE HAVE YOUR BACK.');
    }
    const live = typeof RAID !== 'undefined' ? RAID.L.filter((e) => e.st !== 'down' && e.p.distanceTo(pos) < 9000) : [];
    for (const f of L) {
      f.g.visible = !PHOTO.on || PHOTO.showPlane !== false;
      f.prop.rotation.z += dt * 60;
      if (f.tgt && (f.tgt.st === 'down' || !live.includes(f.tgt))) f.tgt = null;
      if (!f.tgt && live.length) f.tgt = live.reduce((b, e) => (e.p.distanceTo(f.p) < b.p.distanceTo(f.p) ? e : b));
      if (f.tgt) {
        const e = f.tgt;
        tgt.copy(e.p).addScaledVector(e.v, Math.min(3, e.p.distanceTo(f.p) / 300));
        steer(f, w.copy(tgt).sub(f.p).normalize(), V_ATK, dt);
        const to = tgt.sub(f.p),
          dist = to.length();
        if (dist < 450 && to.normalize().dot(w.copy(f.v).normalize()) > 0.985) {
          f.aim += dt;
          if (f.aim >= 1) {
            f.aim = 0;
            if (Math.random() < 0.3) {
              e.st = 'down';
              e.sm = 0;
              note('THE P-51S SPLASH A FRANK');
              RADIO.add('CAP', 'SPLASH ONE FRANK! RETURNING TO STATION.');
            }
          }
        } else f.aim = 0;
      } else {
        /* the circle: aim a little ahead of our place on it, back up at patrol height */
        f.a += (V_CAP / R) * dt;
        tgt.set(pos.x + R * Math.cos(f.a + 0.35), SEA.Y + ALT, pos.z + R * Math.sin(f.a + 0.35));
        steer(f, w.copy(tgt).sub(f.p).normalize(), V_CAP, dt);
      }
      f.p.addScaledVector(f.v, dt);
      f.p.y = Math.max(f.p.y, SEA.Y + 60);
      pose(f);
    }
  };
  HOOKS.tick.push(tick);
  HOOKS.mapDraw.push((g, lw) => {
    if (!SIMS.on('pce')) return;
    g.fillStyle = '#5aa8ff';
    for (const f of L) {
      g.beginPath();
      g.arc(f.p.x, f.p.z, lw(4), 0, 2 * Math.PI);
      g.fill();
    }
  });
  return { L };
})();
