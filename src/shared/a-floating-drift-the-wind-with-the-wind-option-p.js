/* a floating drift: the wind (with the wind option), plus a slow wander so the descent is never dead still */
function chuteDrift(o, t) {
  windNow(o);
  o.y = 0;
  o.x += Math.sin(t * 0.11) * 1.2;
  o.z += Math.cos(t * 0.13) * 1.2;
}
function spawnChutist(p, v) {
  const g = new THREE.Group(),
    pil = makePilot(),
    ch = makeChute(4.5, 0xe6e2d6, 0x7f8b96);
  ch.visible = false;
  g.add(pil);
  g.add(ch);
  g.position.copy(p);
  scene.add(g);
  if (CH.length >= 4) scene.remove(CH.shift().g);
  CH.push({ g, pil, ch, p: p.clone(), v: v.clone(), t: 0, ot: 1.6 + Math.random() * 0.8, open: 0, down: 0 });
}
function updChutists(dt) {
  for (let i = CH.length - 1; i >= 0; i--) {
    const c = CH[i];
    c.t += dt;
    if (c.down) {
      c.down += dt;
      c.ch.scale.y = Math.max(0.15, 1 - c.down * 1.5); /* the canopy collapses */
      if (c.down > 10) {
        scene.remove(c.g);
        CH.splice(i, 1);
      }
      continue;
    }
    if (c.t < c.ot) {
      const sp = c.v.length();
      c.v.y -= 9.81 * dt;
      c.v.addScaledVector(c.v, -0.0032 * sp * dt);
      c.pil.rotation.z += dt * 2.2;
      c.pil.rotation.x += dt * 1.1;
    } else {
      c.open = Math.min(1, c.open + dt / 1.3);
      if (!c.ch.visible) {
        c.ch.visible = true;
        poseHang(c.pil);
        c.pil.rotation.set(0, 0, 0);
      }
      chuteDrift(BLW, c.t);
      const k = Math.min(1, 2.4 * c.open * dt);
      c.v.x += (BLW.x - c.v.x) * k;
      c.v.z += (BLW.z - c.v.z) * k;
      c.v.y += (-5.5 - c.v.y) * k;
      c.ch.scale.setScalar(0.06 + 0.94 * c.open * c.open * (3 - 2 * c.open));
      c.g.rotation.z = Math.sin(c.t * 0.9) * 0.07 * c.open;
    }
    c.p.addScaledVector(c.v, dt);
    c.g.position.copy(c.p);
    const gh = H(c.p.x, c.p.z);
    if (c.p.y <= gh + 1.15) {
      c.p.y = gh + 1.15;
      c.g.position.y = c.p.y;
      c.down = 0.001;
      if (HR(c.p.x, c.p.z) < -7 || !c.ch.visible) {
        scene.remove(c.g);
        CH.splice(i, 1);
      }
    } else if (c.p.distanceTo(pos) > 9000) {
      scene.remove(c.g);
      CH.splice(i, 1);
    }
  }
}
