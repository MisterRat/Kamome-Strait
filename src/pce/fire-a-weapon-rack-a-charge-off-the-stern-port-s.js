/* fire a weapon: 'rack' (a charge off the stern), 'port' / 'stbd' (a K-gun that side); true / false as before (port K-gun / rack) */
function dcFire(kind) {
  if (kind === true) kind = 'port';
  if (!kind) kind = 'rack';
  const m = SHIPM.mesh;
  let p, v;
  if (kind === 'rack') {
    let s = DC.next;
    if (DC.rack[s] <= 0) s = 1 - s;
    if (DC.rack[s] <= 0) return note('RACKS EMPTY'), false;
    DC.rack[s]--;
    DC.next = 1 - s;
    p = m.localToWorld(new V(PCEM.XF(89.8), 2.9, s ? 1.95 : -1.95));
    v = vel.clone().multiplyScalar(0.3);
  } else {
    const s = kind === 'stbd' ? 1 : 0,
      g = DC.kl[s * 2] ? 0 : DC.kl[s * 2 + 1] ? 1 : -1; /* the forward gun first, then the after one */
    if (g < 0) return note((s ? 'STARBOARD' : 'PORT') + ' K-GUNS EMPTY'), false;
    DC.kl[s * 2 + g] = 0;
    DC.kg[s] = DC.kl[s * 2] + DC.kl[s * 2 + 1];
    const z = s ? 4.0 : -4.0,
      kg = PCEM.KG && PCEM.KG[s * 2 + g];
    p = m.localToWorld(kg ? new V(...kg.ch) : new V(PCEM.XF(g ? 73.7 : 64.6), 3.9, z)) /* she throws the charge from the arbor */;
    v = new V(0, 0, z > 0 ? 1 : -1).transformDirection(m.matrixWorld).multiplyScalar(19).add(vel);
    v.y = 15; /* thrown about 60 yards abeam */
    SND.burst(1600, 120, 0.5, 0.6, 0.8);
    if (FM.use('smoke')) gunFx(p, 0xb8b8b4, 1.5, 6, 2, 0.5, false);
  }
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.224, 0.224, 0.7, 12), new THREE.MeshLambertMaterial({ color: 0x3f4a3a }));
  mesh.position.copy(p);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
  const ft = DC.dep[kind],
    armed = DC.arm[kind];
  DC.L.push({ m: mesh, p: p.clone(), v, wet: false, d: ft * 0.3048, armed });
  note((kind !== 'rack' ? (kind === 'stbd' ? 'STARBOARD' : 'PORT') + ' K-GUN FIRED' : 'CHARGE AWAY') + ' - ' + ft + ' FT' + (armed ? '' : ' - ON SAFE!'));
  return true;
}
function dcStep(dt) {
  for (let i = DC.L.length - 1; i >= 0; i--) {
    const c = DC.L[i];
    if (!c.wet) {
      c.v.y -= 9.81 * dt;
      c.p.addScaledVector(c.v, dt);
      if (c.p.y < OCEAN.Y) {
        c.wet = true;
        c.v.set(0, -2.4, 0); /* a Mk 6 sinks at about 8 ft/s (est.) */
        gunSplash(c.p, { splash: 0.5, blast: null });
      }
    } else c.p.addScaledVector(c.v, dt);
    c.m.position.copy(c.p);
    const bottom = HR(c.p.x, c.p.z);
    if (c.wet && c.armed === false && (c.p.y < OCEAN.Y - c.d || c.p.y < bottom + 0.5)) {
      /* fired on safe: the pistol never fires and the charge goes on down, a dud */
      scene.remove(c.m);
      DC.L.splice(i, 1);
      note('DUD - THAT CHARGE WAS ON SAFE');
      aswEv('dud', c.p);
      continue;
    }
    if (c.wet && (c.p.y < OCEAN.Y - c.d || c.p.y < bottom + 0.5)) {
      scene.remove(c.m);
      DC.L.splice(i, 1);
      aswEv('dc', c.p);
      /* Hardcore: a shallow charge going off under her own stern at slow speed damages her (shafts, rudder, plating) */
      if (FM.use('dmg') && c.d < 23.5) {
        const st = pos.clone().addScaledVector(new V(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)), PCEM.XF(90));
        if (Math.hypot(c.p.x - st.x, c.p.z - st.z) < 45 && SHIP.u < 10 * 0.5144) {
          SHIP.dmgK = Math.min(SHIP.dmgK || 1, 0.6);
          SDM.shaft = 0.6; /* the battle damage keeps it */
          SHIPW.vr += 0.25;
          ASW.dmg = true;
          note('SHALLOW CHARGE UNDER THE STERN - SHAFTS DAMAGED, SPEED REDUCED');
          RADIO.add('ENGINEERING', 'BRIDGE, ENGINE ROOM. HEAVY SHOCK AFT. SHAFT BEARINGS RUNNING HOT. CAN GIVE YOU TWO THIRDS AT MOST.');
        }
      }
      /* the charge goes off: a dome, then a column of water */
      const top = new V(c.p.x, OCEAN.Y, c.p.z),
        k = Math.max(0.35, 1 - (OCEAN.Y - c.p.y) / 120);
      for (let j = 0; j < 9; j++) gunFx(new V(c.p.x + (Math.random() - 0.5) * 8, OCEAN.Y + j * 3 * k, c.p.z + (Math.random() - 0.5) * 8), 0xeef3f4, 6 * k, 22 * k, 3.5, 14 * k * (1 - j * 0.08), false);
      gunFx(top, 0xf6f8f8, 20 * k, 50 * k, 2.5, 0, false);
      const d = top.distanceTo(cam.position);
      SND.burst(700, 40, 2.2, Math.min(1, 1.6 / (1 + d / 200)), 0.6, 'lowpass', Math.min(2, d / 1500));
      SND.tone(55, 25, 1.6, Math.min(0.8, 1.2 / (1 + d / 200)), 'sine', Math.min(2, d / 1500));
      SUBS.burst(c.p); /* the enemy's boat (I-58): sunk, hurt or driven deep */
      /* the practice attack: how close it went off to the exercise submarine */
      if (PT.on) {
        const sub = PT.L.find((t) => t.kind === 'sub');
        if (sub) {
          const yd = Math.round(sub.p.distanceTo(c.p) / 0.9144);
          if (ASW.ph === 'run' || ASW.drill) ASW.best = Math.min(ASW.best, yd); /* the torpedoman's run, or the OOD's attack drill */
          DC.lastTxt = yd < 25 ? 'WITHIN LETHAL RANGE (' + yd + ' YD)' : yd < 60 ? 'CLOSE - ' + yd + ' YD' : 'MISSED BY ' + yd + ' YD';
          note('PRACTICE ATTACK: ' + DC.lastTxt);
          if (yd < 60) RADIO.add('EXERCISE SUB', 'CHARGE ' + yd + ' YDS FROM ME. ' + (yd < 25 ? 'YOU GOT ME.' : 'CLOSE.'));
        }
      }
    }
  }
}
