/* the raider's guns: a burst from its four guns at the aim point, each round thrown off by the gun's spread and the pilot's
   aim; a round inside the ship's hull or superstructure is a hit, the rest go into the sea */
function raidShoot(e, dt) {
  e.ft -= dt;
  if (e.ft > 0) return;
  e.ft = 0.07;
  const q = new THREE.Vector3(),
    L = new THREE.Vector3(),
    o = e.p.clone().addScaledVector(e.fwd, 6),
    rng = e.p.distanceTo(pos),
    sp = 0.006 + 0.004 * (1 - Math.min(1, e.p.y / 600)) /* the pilot's aim wanders more in the pull-out */;
  /* along the line of fire: where it meets the water, or the ship */
  const dir = e.fwd.clone();
  dir.x += (Math.random() - 0.5) * 2 * sp;
  dir.y += (Math.random() - 0.5) * 2 * sp;
  dir.z += (Math.random() - 0.5) * 2 * sp;
  dir.normalize();
  let hit = false;
  for (let t = Math.max(0, rng - 120); t < rng + 400; t += 2) {
    q.copy(o).addScaledVector(dir, t);
    if (shipStruck(q)) {
      hit = true;
      break;
    }
    if (q.y <= OCEAN.Y) break;
  }
  RAID.tr.push({ a: o.clone(), b: q.clone(), t: 0 });
  BASEAIR.usFire(q); /* near PT Base Halsey, the base calls for fighters */
  if (RAID.tr.length > 60) RAID.tr.shift();
  if (hit) {
    RAID.hits++;
    sdmHit('small');
    gunFx(q, 0xffd080, 1.2, 3, 0.15, 0, true);
    if (Math.random() < 0.3) gunFx(q, 0x3a3a38, 1, 4, 0.8, 0.6, false);
  } else gunSplash(q, { splash: 0.18 });
  if (Math.random() < 0.5) {
    const d = e.p.distanceTo(cam.position);
    SND.burst(1600, 220, 0.06, Math.min(0.6, 0.5 / (1 + d / 300)), 1.1, 'bandpass', Math.min(3, d / 340));
  }
}
function raidUpdate(dt) {
  const want = typeof ENEMY !== 'undefined' && ENEMY.has('planes') && !crashed;
  if (!want) {
    if (RAID.L.length) raidClear();
    return;
  }
  if (!RAID.L.length) {
    RAID.next -= dt;
    if (RAID.next <= 0) {
      RAID.next = 180 + Math.random() * 120;
      raidSpawn();
    }
  }
  const tgt = new THREE.Vector3(),
    w = new THREE.Vector3(),
    home = raidHome();
  for (let i = RAID.L.length - 1; i >= 0; i--) {
    const e = RAID.L[i];
    e.t += dt;
    e.b.prop.rotation.z += dt * 70;
    if (e.st === 'down') {
      /* shot down: burning, falling into the sea */
      e.v.y -= 9.81 * dt;
      e.v.multiplyScalar(1 - 0.08 * dt);
      e.p.addScaledVector(e.v, dt);
      e.fwd.copy(e.v).normalize();
      e.bank += dt * 2.5;
      raidPose(e);
      if ((e.sm -= dt) <= 0) {
        e.sm = 0.06;
        gunFx(e.p, 0x222222, 4, 16, 2.5, 2, false);
        if (Math.random() < 0.6) gunFx(e.p, 0xff7a20, 3, 7, 0.3, 0, true);
      }
      if (e.p.y <= OCEAN.Y + 1) {
        gunSplash(e.p, { splash: 2.2 });
        gunFx(e.p, 0xffa040, 8, 20, 0.6, 0, true);
        for (let k = 0; k < 4; k++) gunFx(new THREE.Vector3(e.p.x, OCEAN.Y + 3 + k * 4, e.p.z), 0x2a2a2a, 8, 24, 10, 1.5, false);
        scene.remove(e.b.g);
        RAID.L.splice(i, 1);
      }
      continue;
    }
    const toS = w.copy(pos).sub(e.p),
      hd = Math.hypot(toS.x, toS.z),
      alt = e.p.y - OCEAN.Y;
    if (e.st === 'in') {
      /* inbound at height toward a point 3 km short of her, then roll in */
      if (e.t < e.lag) tgt.copy(e.p).addScaledVector(e.fwd, 100);
      else tgt.set(pos.x, OCEAN.Y + RAIDV.ALT, pos.z);
      tgt.y = OCEAN.Y + RAIDV.ALT;
      raidSteer(e, w.copy(tgt).sub(e.p).normalize(), RAIDV.CRU, dt);
      if (hd < 3200 && e.t > e.lag) {
        e.st = 'run';
        e.runs++;
        if (e.k === 0 && e.runs === 1) RADIO.add('LOOKOUT', 'BANDITS ROLLING IN, BEARING ' + raidBrg(e.p) + '!');
      }
    } else if (e.st === 'run') {
      /* the strafing dive: aim at where she will be, a little short (the gunsight's lead), fire inside 900 m */
      const rng = e.p.distanceTo(pos),
        tl = rng / 700;
      tgt.copy(pos).addScaledVector(vel, tl);
      tgt.y = OCEAN.Y + 2;
      const dw = w.copy(tgt).sub(e.p).normalize();
      if (dw.y > -0.25 && rng > 1400) dw.y = Math.min(dw.y, -0.12) /* not too shallow */;
      raidSteer(e, dw.normalize(), RAIDV.ATK, dt);
      const on = e.fwd.dot(w.copy(tgt).sub(e.p).normalize()) > Math.cos(0.06);
      if (rng < 900 && rng > 250 && on) raidShoot(e, dt);
      if (rng < 260 || alt < 90) {
        e.st = 'out';
        e.t = 0;
      }
    } else if (e.st === 'out') {
      /* pull out and run out low past her, climbing, then come round */
      const f = e.fwd.clone();
      f.y = Math.max(0.15, f.y);
      if (alt < 120) f.y = 0.35;
      raidSteer(e, f.normalize(), RAIDV.ATK, dt);
      if (e.t > 9 || hd > 3000) {
        if (e.runs >= 3) {
          e.st = 'home';
          if (e.k === 0) RADIO.add('LOOKOUT', 'BANDITS OPENING TO THE ' + ['NORTH', 'EAST', 'SOUTH', 'WEST'][Math.round(((Math.atan2(home.x - pos.x, -(home.z - pos.z)) / (Math.PI / 2)) % 4) + 4) % 4] + '.');
        } else {
          e.st = 'turn';
          e.t = 0;
        }
      }
    } else if (e.st === 'turn') {
      /* run out away from her, climbing, to 3.5 km and 1,200 m; then come round, level, until she is ahead; then the next pass */
      if (!e.back) {
        w.set(e.p.x - pos.x, 0, e.p.z - pos.z).normalize();
        w.y = alt < 1200 ? 0.3 : 0;
        raidSteer(e, w.normalize(), RAIDV.CRU, dt);
        if (hd > 3500 && alt > 1000) e.back = true;
      } else {
        w.set(pos.x - e.p.x, 0, pos.z - e.p.z).normalize();
        raidSteer(e, w, RAIDV.CRU, dt);
        if (e.fwd.dot(w) > 0.95) {
          e.back = false;
          e.st = 'run';
          e.runs++;
        }
      }
    } else if (e.st === 'home') {
      tgt.copy(home);
      tgt.y = OCEAN.Y + RAIDV.ALT;
      raidSteer(e, w.copy(tgt).sub(e.p).normalize(), RAIDV.CRU, dt);
      if (hd > 12000) {
        scene.remove(e.b.g);
        RAID.L.splice(i, 1);
        continue;
      }
    }
    e.p.addScaledVector(e.v, dt);
    if (e.p.y < OCEAN.Y + 25) e.p.y = OCEAN.Y + 25;
    raidPose(e);
  }
  if (!RAID.L.length && RAID.was) {
    RAID.was = false;
    note('RAID OVER - ' + RAID.hits + ' HITS ON THE SHIP, ' + RAID.kills + ' SHOT DOWN');
  }
  if (RAID.L.length) RAID.was = true;
  /* the tracers: short dashes running from the guns to the impact */
  let n = 0;
  const P = RAID.trP;
  for (let i = RAID.tr.length - 1; i >= 0; i--) {
    const r = RAID.tr[i];
    r.t += dt;
    const len = r.a.distanceTo(r.b),
      tt = r.t / (len / 750);
    if (tt > 1) {
      RAID.tr.splice(i, 1);
      continue;
    }
    if (n >= 120) continue;
    const a = w.copy(r.a).lerp(r.b, tt),
      b = tgt.copy(r.a).lerp(r.b, Math.min(1, tt + 18 / len));
    P.set([a.x, a.y, a.z, b.x, b.y, b.z], n * 6);
    n++;
  }
  RAID.lines.geometry.attributes.position.needsUpdate = true;
  RAID.lines.geometry.setDrawRange(0, n * 2);
}
