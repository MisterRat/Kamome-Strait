/* the pilot's own eyes: free look in every direction, down at the ground and up at the canopy */
function bailCam(dt) {
  if (pad.lx || pad.ly) {
    BL.yaw += pad.lx * 2.6 * dt;
    BL.pitch -= pad.ly * 1.8 * dt;
  }
  BL.pitch = Math.max(-1.53, Math.min(1.53, BL.pitch));
  BL.yaw = ((((BL.yaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  const cp2 = Math.cos(BL.pitch),
    d = BLV.set(Math.sin(BL.yaw) * cp2, Math.sin(BL.pitch), -Math.cos(BL.yaw) * cp2);
  BL.upK += ((BL.ph >= 2 ? 1 : 0) - BL.upK) * Math.min(1, 1.5 * dt);
  cam.up.lerpVectors(up, UPV, BL.upK).normalize();
  if (BL.ph === 3) cam.up.applyAxisAngle(d, BL.sway * 0.6);
  cam.position.copy(BL.head);
  if (BL.ph >= 2) {
    /* eyes just in front of the torso, so looking straight down shows the legs and the ground rather than his own shoulders */
    cam.position.x += Math.sin(BL.body) * 0.17;
    cam.position.z -= Math.cos(BL.body) * 0.17;
    cam.position.y += 0.05;
  }
  const sh = (BL.ph < 2 ? 0.05 : 0) + BL.jolt * 0.12;
  if (sh) {
    cam.position.x += (Math.random() - 0.5) * sh;
    cam.position.y += (Math.random() - 0.5) * sh;
    cam.position.z += (Math.random() - 0.5) * sh;
  }
  cam.lookAt(SC.aim.copy(d).multiplyScalar(50).add(cam.position));
}
function bailPress() {
  if (!started || crashed || paused) return;
  const t = performance.now();
  if (t < DM.bailArm) bailOut();
  else {
    DM.bailArm = t + 2000;
    note('PRESS BAIL OUT AGAIN TO JUMP');
  }
}
function updEnemies(dt) {
  for (let i = EN.length - 1; i >= 0; i--) {
    const e = EN[i];
    if (e.dying) {
      e.t += dt;
      e.v.y -= 14 * dt;
      e.p.addScaledVector(e.v, dt);
      e.fwd.copy(e.v).normalize();
      e.inner.rotation.z += dt * 6;
      e.tr += dt;
      if (e.tr > 0.05) {
        e.tr = 0;
        fxAdd(e.p, 0x222222, 4, 15, 1.8, 2, false);
        if (Math.random() < 0.5) fxAdd(e.p, 0xff7a20, 3, 8, 0.3, 0, true);
      }
      if (e.p.y < H(e.p.x, e.p.z) + 3 || e.t > 9) {
        explode(e.p.clone(), 24);
        if (e.p.y < H(e.p.x, e.p.z) + 30 && !RPL.on && !RPL.busy) AF.wreck(e.p, 0.9, 100);
        scene.remove(e.g);
        EN.splice(i, 1);
        continue;
      }
    } else if (e.drone) {
      /* trainer drone: a steady level left turn at constant speed, never fires, cannot be hurt */
      const om = (9.8 * Math.tan(0.6)) / Math.max(e.sp, 30);
      e.yaw = (e.yaw || 0) + om * dt;
      e.fwd.set(-Math.sin(e.yaw), 0, -Math.cos(e.yaw));
      e.q.setFromAxisAngle(UPV, e.yaw).multiply(new Q().setFromAxisAngle(new V(0, 0, 1), 0.6));
      e.v.copy(e.fwd).multiplyScalar(e.sp);
      e.p.addScaledVector(e.v, dt);
      e.p.y = e.alt;
      e.prop.rotation.z += dt * 70;
    } else {
      e.fwd.set(0, 0, -1).applyQuaternion(e.q);
      const toP = pos.clone().sub(e.p),
        dist = toP.length(),
        dir = toP.clone().divideScalar(Math.max(dist, 1));
      if (dist < 11 && !crashed) {
        explode(e.p.clone(), 16);
        scene.remove(e.g);
        EN.splice(i, 1);
        crash('MIDAIR COLLISION');
        continue;
      }
      if (e.ev <= 0 && dist < 160 && e.fwd.dot(dir) > 0.3) {
        e.ev = 1.4;
        e.side = Math.random() < 0.5 ? -1 : 1;
        e.dive = false;
      }
      if (e.ev <= 0 && dist < 1000 && fwd.dot(dir.clone().negate()) > 0.94 && Math.random() < dt * 1.6) {
        e.ev = 2 + Math.random() * 1.6;
        e.side = Math.random() < 0.5 ? -1 : 1;
        e.dive = Math.random() < 0.25;
      }
      const right = new V().crossVectors(e.fwd, UPV).normalize();
      let d;
      if (e.ev > 0) {
        e.ev -= dt;
        d = e.fwd
          .clone()
          .addScaledVector(right, e.side * 1.6)
          .addScaledVector(UPV, e.dive ? -0.25 : 0.45)
          .normalize();
      } else {
        const tp = pos.clone().addScaledVector(vel, Math.min(1.2, dist / 900));
        tp.y += 12;
        d = tp.sub(e.p).normalize();
        if (dist < 1000 && d.y < -0.25) {
          d.y = -0.25;
          d.normalize();
        }
      }
      /* RULES OF ENGAGEMENT, once a second: damaged past half, or (a fighter scrambled to defend a base fights on until damaged)
         outgunned under half the strength against it within 5 km, the bandit breaks off for the nearest Japanese airbase, climbing;
         far enough off it is gone */
      if (e.hp0 && (e.roeT = (e.roeT || 0) + dt) > 1) {
        e.roeT = 0;
        if (!e.run && (e.hp < 0.5 * e.hp0 || (!e.scr && !e.duel && typeof ROE !== 'undefined' && ROE.ratio('jp', e.p) < 0.5))) {
          e.run = true;
          const A = FS.list.filter((s) => s.kind === 'air');
          e.home = A.length ? A.reduce((a, b) => (Math.hypot(b.O.x - e.p.x, b.O.z - e.p.z) < Math.hypot(a.O.x - e.p.x, a.O.z - e.p.z) ? b : a)).O : { x: e.p.x, z: e.p.z - 20000 };
          note('BANDIT BREAKING OFF');
        }
      }
      if (e.run) {
        d = new V(e.home.x - e.p.x, 0, e.home.z - e.p.z).normalize();
        d.y = 0.12;
        d.normalize();
        if (dist > 7000) {
          scene.remove(e.g);
          EN.splice(i, 1);
          note('THE BANDIT GOT AWAY');
          continue;
        }
      }
      let avoid = false,
        tmax = H(e.p.x, e.p.z);
      for (const L of [300, 600, 1000, 1500, 2200]) {
        const q2 = e.p.clone().addScaledVector(e.fwd, L);
        tmax = Math.max(tmax, H(q2.x, q2.z) - L * 0.2);
      }
      if (e.p.y < tmax + 160) {
        avoid = true;
        d.y = Math.max(d.y, 0.35);
        d.normalize();
      }
      /* ---- the bandit is a rigid body flown with the SAME aerodynamics as the player: lift from angle of attack, stall, induced drag, pitch/roll rates ---- */
      const F = DIFF.f,
        qi = e.q.clone().invert(),
        vl = e.v.clone().applyQuaternion(qi),
        v = e.v.length(),
        fs = Math.max(-vl.z, 0),
        upv = new V(0, 1, 0).applyQuaternion(e.q),
        rgt = new V(1, 0, 0).applyQuaternion(e.q);
      const alpha = Math.atan2(-vl.y, Math.max(fs, 1)),
        aa = Math.abs(alpha),
        am = 0.256,
        CL = aa <= am ? 4.8 * alpha : Math.sign(alpha) * Math.max(0.5, 1.23 - 3 * (aa - am));
      const ea = FM.use('alt') ? atmos(e.p.y, SC.ea) : SC.ea0 /* the bandit flies in the same thin air */,
        efs = fs * Math.sqrt(ea.sig),
        lift = Math.max(-34.3, Math.min((efs > 58 ? gmax(efs) : 99) * 9.8, CL * 0.004 * fs * fs * ea.sig)),
        nG = lift / 9.8;
      /* pilot: roll the lift vector onto the target, then pull - within the g, stall and speed limits */
      if (!avoid && e.p.y > H(e.p.x, e.p.z) + 300 && fs < 56) {
        d.y = -0.35;
        d.normalize();
      }
      if (!avoid && d.y > (fs < 80 ? 0.25 : 0.5)) {
        d.y = fs < 80 ? 0.25 : 0.5;
        d.normalize();
      }
      const tl = d.clone().applyQuaternion(qi),
        angOff = Math.acos(Math.max(-1, Math.min(1, -tl.z))),
        err = Math.atan2(tl.x, tl.y),
        bank = Math.atan2(-rgt.y, upv.y);
      let tr, tp;
      if (avoid) {
        tr = -bank * 2.2;
        tp = 0.8;
      } else if (angOff > 0.07) {
        tr = err * 2.2;
        tp = Math.min(1, angOff * 2.4) * Math.max(0, Math.cos(err));
      } else {
        tr = -bank * 2.2;
        tp = Math.max(-0.3, Math.min(0.3, (d.y - e.fwd.y) * 2.5));
      }
      const gx = gmax(Math.max(efs, 20)),
        nlim = Math.sqrt(1 + F * F * (gx * gx - 1)),
        gM = Math.max(0, Math.min(1, (nlim - nG) / 0.5)),
        stM = Math.max(0, Math.min(1, (am * 0.88 - aa) / (am * 0.22)));
      if (tp > 0) tp *= Math.min(gM, stM);
      if (fs < 50 && tp > 0) tp = 0;
      tr = Math.max(-1, Math.min(1, tr)) * Math.max(0.55, F);
      tp = Math.max(-1, Math.min(1, tp));
      e.ctl.p += (tp - e.ctl.p) * Math.min(1, 5 * dt);
      e.ctl.r += (tr - e.ctl.r) * Math.min(1, 5 * dt);
      const eff = Math.max(0.12, Math.min(1, fs / 70)),
        eff2 = eff / (1 + Math.pow(fs / 160, 2)),
        beta = vl.x / Math.max(fs, 20);
      const thrust =
        Math.min(3.4, 2.095 * F * F + 0.0464 / (F * F) + 0.16 + DIFF.kb * Math.max(0, Math.max(100 * F, 60) - v)) *
        ea.ps;
      const acc = new V(0, -9.8, 0);
      acc.addScaledVector(upv, lift);
      acc.addScaledVector(rgt, -vl.x * 1.5);
      acc.addScaledVector(e.fwd, thrust);
      if (v > 0.1)
        acc.addScaledVector(
          e.v,
          -(
            ea.sig * ((0.000054 + (FM.use('perf') ? FM.perf.drag : 0)) * v + 0.0003 * CL * CL * v) +
            ((0.01 / (F * F)) * Math.pow(Math.max(0, v - (FM.use('perf') ? FM.perf.vw : 193) * F), 2)) / Math.max(v, 1)
          ),
        );
      e.v.addScaledVector(acc, dt);
      let rx =
        e.ctl.p * 0.9 * eff2 -
        (alpha - Math.min(0.17, 9.8 / (0.0192 * Math.max(fs, 30) ** 2))) * 0.9 * Math.min(1, fs / 40);
      if (aa > am && v > 8) rx -= 0.3 * Math.sign(alpha);
      e.q
        .multiply(
          new Q().setFromEuler(
            new E(rx * dt, -beta * 2 * Math.min(1, fs / 40) * dt, -e.ctl.r * 1.8 * eff2 * dt, 'YXZ'),
          ),
        )
        .normalize();
      e.p.addScaledVector(e.v, dt);
      e.fwd.set(0, 0, -1).applyQuaternion(e.q);
      e.sp = e.v.length();
      e.nG = nG;
      e.al = alpha;
      e.prop.rotation.z += dt * 70;
      if (e.p.y < H(e.p.x, e.p.z) + 4) {
        explode(e.p.clone(), 24);
        scene.remove(e.g);
        EN.splice(i, 1);
        airKills++;
        note('BANDIT CRASHED');
        continue;
      }
      e.bt += dt;
      e.fireT -= dt;
      if (
        e.ev <= 0 &&
        dist < DIFF.rng &&
        e.fwd.dot(dir) > DIFF.cone &&
        e.bt % 3 < DIFF.burst &&
        e.fireT <= 0 &&
        !e.run &&
        !crashed
      ) {
        e.fireT = 0.07;
        eFire(e, dist);
      }
    }
    e.g.position.copy(e.p);
    if (e.dying) {
      const r = new V().crossVectors(e.fwd, UPV);
      if (r.lengthSq() < 1e-4) r.set(1, 0, 0);
      r.normalize();
      const u = new V().crossVectors(r, e.fwd);
      m4.makeBasis(r, u, e.fwd.clone().negate());
      e.g.quaternion.setFromRotationMatrix(m4);
    } else {
      e.g.quaternion.copy(e.q);
      e.inner.rotation.z = 0;
    }
  }
  for (let i = EB.length - 1; i >= 0; i--) {
    const b = EB[i],
      a = b.p.clone();
    b.t += dt;
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    let dead = b.t > 1.6 || b.p.y < H(b.p.x, b.p.z);
    if (!dead && !crashed && a.distanceToSquared(pos) < 3600 && segHit(a, b.p, pos, 6)) {
      dead = true;
      playerHit();
    }
    if (dead) EB.splice(i, 1);
  }
  for (let i = 0; i < EB.length; i++) {
    const b = EB[i],
      o = i * 6;
    epos[o] = b.p.x;
    epos[o + 1] = b.p.y;
    epos[o + 2] = b.p.z;
    epos[o + 3] = b.p.x - b.v.x * 0.025;
    epos[o + 4] = b.p.y - b.v.y * 0.025;
    epos[o + 5] = b.p.z - b.v.z * 0.025;
  }
  egeo.setDrawRange(0, EB.length * 2);
  egeo.attributes.position.needsUpdate = true;
  hitF = Math.max(0, hitF - dt * 2.5);
  $$('flash').style.opacity = hitF;
}
