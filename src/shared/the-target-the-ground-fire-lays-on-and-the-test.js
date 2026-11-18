/* the target the ground fire lays on and the test for a round that strikes it. P-51 Mustang FS: the player's aircraft; PCE-842 sets
   its own (her hull) in THE AIR RAIDS block */
AA.aimY = () => pos.y;
AA.hit = (a, b) => {
  if (a.distanceToSquared(pos) > 6400 || !segHit(a, b, pos, 6.5)) return false;
  playerHit(AA.litT > 20 ? 4 : 2, 0.4); /* held in the beams for over 20 s: hit about twice as hard */
  return true;
};
function updAA(dt) {
  if (!AA.on) return;
  AA.t += dt;
  AA.msgT = Math.max(0, AA.msgT - dt);
  AA.fT = Math.max(0, AA.fT - dt);
  const night = WX.lt || 0,
    hot = started && !crashed && !RPL.busy && (trn.mode === 'free' || trn.mode === 'convoy' || trn.mode === 'bomb');
  const wxs = WX_SET[WX.wx] || WX_SET.clear,
    lightVis = AAV[WX.wx] || 8000,
    gunVis = Math.min(2500, wxs.fogF * 0.45); /* by day the crews see about this far */
  /* ----- searchlights ----- */
  let dzT = 0,
    litAny = 0;
  const trk = AA.lamp.some((L) => L.mode === 'track' && L.on);
  for (const L of AA.lamp) {
    L.on = !L.t.dead && night > 0.3 && (!L.site || trn.mode === 'free');
    if (L.site) L.grp.visible = trn.mode === 'free';
    L.lit = false;
    if (!L.on) {
      L.beam.visible = false;
      L.glow.visible = false;
      L.spl.visible = false;
      L.lens.material.color.set(0x8c9bb0);
      continue;
    }
    const dx = pos.x - L.p.x,
      dy = pos.y - L.p.y,
      dz = pos.z - L.p.z,
      hd = Math.hypot(dx, dz),
      R = Math.hypot(hd, dy),
      elP = Math.atan2(dy, hd),
      yawP = Math.atan2(dx, dz);
    aaDir(L.yaw, L.el, _aaF);
    const ang = R > 1 ? Math.acos(Math.max(-1, Math.min(1, (_aaF.x * dx + _aaF.y * dy + _aaF.z * dz) / R))) : 9,
      cue = !L.fr && hot && R < 8000 && elP > 0.1; /* the airfield's own light only sweeps for show */
    if (L.mode === 'search') {
      /* the beam crossing you, or the sound locators giving the crews a bearing once you have been in earshot for a few seconds */
      if (cue && R < 4800) L.cue += dt * (trk ? 2 : 1);
      else L.cue = Math.max(0, L.cue - dt);
      if (cue && (ang < 0.07 || L.cue > 5)) {
        L.mode = 'track';
        L.lost = 0;
      }
    }
    if (L.mode === 'track') {
      if (!cue || ang > 0.14) L.lost += dt;
      else L.lost = Math.max(0, L.lost - dt);
      if (!cue || L.lost > 1.8) {
        L.mode = 'search';
        L.cue = 0;
        L.wy = L.yaw;
        L.we = L.el;
      } else {
        const tl = 0.1,
          px = dx + vel.x * tl,
          py = dy + vel.y * tl,
          pz = dz + vel.z * tl;
        L.yaw = aaSlew(L.yaw, Math.atan2(px, pz), 0.45, dt);
        L.el = Math.max(0.12, Math.min(1.5, aaSlew(L.el, Math.atan2(py, Math.hypot(px, pz)), 0.45, dt)));
      }
    }
    if (L.mode === 'search') {
      if (Math.abs(aaWrap(L.wy - L.yaw)) < 0.05 && Math.abs(L.we - L.el) < 0.05) {
        L.wy = L.home + (Math.random() - 0.5) * 2.6;
        L.we = 0.45 + Math.random() * 0.8;
      }
      L.yaw = aaSlew(L.yaw, L.wy, 0.22, dt);
      L.el = aaSlew(L.el, L.we, 0.16, dt);
    }
    aaDir(L.yaw, L.el, _aaF);
    L.head.rotation.y = L.yaw;
    L.pit.rotation.x = -L.el;
    L.beam.rotation.set(-L.el, L.yaw, 0);
    L.beam.position.set(L.p.x, L.p.y + 0.5, L.p.z).addScaledVector(_aaF, 1.0);
    L.beam.visible = true;
    /* the beam stops at the first cloud (and lights its underside), and fog or rain shorten it */
    if ((L.ct -= dt) <= 0) {
      L.ct = 0.15;
      L.cloudAxis = aaCloudT(L.p, _aaF.x, _aaF.y, _aaF.z, 8000);
      L.occ = R > 1 && aaCloudT(L.p, dx / R, dy / R, dz / R, R) < R; /* a cloud between the light and you */
    }
    const reach = Math.min(8000, lightVis),
      bl = Math.max(20, Math.min(reach, L.cloudAxis));
    L.beam.scale.set(1, 1, bl / 8000);
    L.spl.visible = L.cloudAxis < reach;
    if (L.spl.visible) {
      L.spl.position.copy(L.beam.position).addScaledVector(_aaF, bl);
      L.spl.scale.set(180 + bl * 0.12, 180 + bl * 0.12, 1);
    }
    const bm = Math.min(1, (night - 0.3) / 0.4) * (1 - (DECK.k || 0)); /* a beam is lost in the white-out */
    L.beam.children.forEach((m, i) => (m.material.opacity = [0.075, 0.085, 0.1][i] * bm));
    L.glow.position.copy(L.beam.position);
    L.glow.visible = true;
    L.glow.material.opacity = bm;
    L.spl.material.opacity = 0.5 * bm;
    L.lens.material.color.set(0xeaf6ff);
    /* is the beam on you? */
    aaDir(L.yaw, L.el, _aaF);
    const ang2 = R > 1 ? Math.acos(Math.max(-1, Math.min(1, (_aaF.x * dx + _aaF.y * dy + _aaF.z * dz) / R))) : 9;
    if (!L.fr && hot && R < reach && !L.occ && ang2 < 0.03) {
      L.lit = true;
      litAny++;
      dzT = Math.max(dzT, (1 - ang2 / 0.03) * Math.min(1, 2200 / R) * Math.max(0.3, Math.min(1, 1.5 - pos.y / 2800))); /* the glare is worst below about 1,200 m */
    }
  }
  AA.lit = litAny;
  AA.litT = litAny ? (AA.litT || 0) + dt : Math.max(0, (AA.litT || 0) - dt * 0.5); /* seconds held in the beams */
  if (hot && litAny && AA.msgT <= 0) {
    note('SEARCHLIGHT: YOU ARE ILLUMINATED');
    AA.msgT = 12;
  }
  AA.dz += (dzT - AA.dz) * Math.min(1, 6 * dt);
  const dzE = document.getElementById('dazzle');
  if (dzE) dzE.style.opacity = AA.dz * 0.55;
  /* ----- guns ----- */
  for (const g of AA.gun) {
    const dead = g.t.dead || (g.site && trn.mode !== 'free');
    if (g.site) g.grp.visible = trn.mode === 'free';
    let can = false,
      R = 1e9;
    const dx = pos.x - g.piv.x,
      dy = AA.aimY() - g.piv.y /* the point they lay on: the aircraft, or the ship's hull */,
      dz = pos.z - g.piv.z;
    if (!dead) {
      R = Math.hypot(dx, dy, dz);
      if ((g.ct = (g.ct || 0) - dt) <= 0) {
        g.ct = 0.2;
        g.occ = R > 1 && aaCloudT(g.piv, dx / R, dy / R, dz / R, R) < R; /* cloud between the gun and you: they cannot see you */
      }
      /* by day they see as far as the weather lets them; at night they need a beam on you (which reaches only as far as the weather lets it) or you close in */
      const sight = night < 0.35 ? gunVis : litAny > 0 ? Math.min(gunVis > 0 ? 2500 : 0, lightVis) : Math.min(800, gunVis);
      /* and they need a clear line to the target past the hills (checked once a second) */
      if ((g.lt = (g.lt || 0) - dt) <= 0) (g.lt = 1), (g.los = aaSees(g.piv, _aaS.set(pos.x, AA.aimY(), pos.z)));
      can = hot && R < Math.min(2500, sight) && !g.occ && g.los && AA.aimY() > H(pos.x, pos.z) + 2;
      g.v.lerp(vel, Math.min(1, 1.3 * dt));
      const tt = R / 840,
        ax = dx + g.v.x * tt * 0.9,
        ay = dy + g.v.y * tt * 0.9 + 4.9 * tt * tt,
        az = dz + g.v.z * tt * 0.9,
        wy = Math.atan2(ax, az),
        we = Math.atan2(ay, Math.hypot(ax, az));
      if (can) {
        g.acq += dt;
        g.yaw = aaSlew(g.yaw, wy, 0.9, dt);
        g.pit = Math.max(-0.17, Math.min(1.45, aaSlew(g.pit, we, 0.7, dt))) /* the Type 96 mount: -10 to +85 deg */;
      } else {
        g.acq = Math.max(0, g.acq - 2 * dt);
        g.pit = aaSlew(g.pit, 0.55, 0.3, dt);
      }
      const err = Math.hypot(aaWrap(wy - g.yaw) * Math.cos(g.pit), we - g.pit);
      g.rec = Math.max(0, g.rec - dt * 6);
      g.rl = Math.max(0, g.rl - dt);
      if (g.mag <= 0 && g.rl <= 0) g.mag = 30;
      if (can && g.acq > 1.0 && err < 0.07 && g.rl <= 0) {
        g.cd -= dt;
        while (g.cd <= 0 && g.mag > 0) {
          g.cd += 0.27; /* about 220 rounds a minute cyclic; with the magazine changes about 110 a minute, as the real gun managed */
          g.mag--;
          g.side = -g.side;
          aaDir(g.yaw, g.pit, _aaF);
          _aaR.set(Math.cos(g.yaw), 0, -Math.sin(g.yaw));
          _aaU.crossVectors(_aaR, _aaF).normalize();
          /* where the rounds go: the gun's own dispersion (about 2 mils) and the layers' (3: hand-cranked, on a shaking mount), plus the
             crew's errors, which come from the target's motion, not from who is shooting at what: the lead (their guess of its speed
             across the line of sight, about 35% out, times the shell's flight time), the lag of a hand-cranked mount tracking it (about
             0.5 s of its angular rate) and
             the range guess (15% out, in the shell's drop). A fast crossing aircraft comes out at tens of metres, a ship at a few. The
             crews' skill follows the difficulty setting (low 1.6x, medium 1x, hard 0.8x the crew errors) */
          const u = R > 1 ? 1 / R : 0,
            vr = (g.v.x * dx + g.v.y * dy + g.v.z * dz) * u * u,
            vp = Math.hypot(g.v.x - dx * vr, g.v.y - dy * vr, g.v.z - dz * vr),
            tof = R / 840,
            crew = 0.6 + DIFF.spread * 8,
            s = Math.hypot(0.002, 0.003, crew * Math.hypot((0.35 * vp * tof) / Math.max(R, 50), (0.5 * vp) / Math.max(R, 50)), (crew * 0.15 * 4.9 * tof * tof) / Math.max(R, 50)),
            gz = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2,
            sg = g.bias,
            d = _aaF.clone().addScaledVector(_aaR, gz() * s + sg.x * 0.012).addScaledVector(_aaU, gz() * s + sg.y * 0.012).normalize(),
            mp = g.piv.clone().addScaledVector(_aaF, 3.3).addScaledVector(_aaR, g.side * 0.2);
          if (AA.bl.length < 190) AA.bl.push({ p: mp, v: d.multiplyScalar(870), t: 0, tr: g.nr++ % 4 === 0 /* one round in four is a tracer */ });
          fxAdd(mp, 0xffd890, 1.3, 3.8, 0.07, 0, true);
          g.rec = 1;
        }
        if (g.mag <= 0) {
          g.rl = 6;
          g.bias.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0); /* each fresh magazine: the crew's estimate of speed and range is a little off */
        }
        if (AA.fT <= 0 && R < 3000) {
          note('GROUND FIRE!');
          AA.fT = 14;
        }
        if ((g.snd -= dt) <= 0) {
          g.snd = 0.16;
          SND.flak(g.piv);
        }
      }
    }
    g.tur.rotation.y = g.yaw;
    g.bar.rotation.x = -g.pit;
    g.bar.position.z = -0.12 * g.rec;
  }
  /* ----- shells ----- */
  for (let i = AA.bl.length - 1; i >= 0; i--) {
    const b = AA.bl[i],
      a = b.p.clone();
    b.t += dt;
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    let dead = b.t > 3.6 || b.p.y < H(b.p.x, b.p.z);
    if (!dead && hot && AA.hit(a, b.p)) dead = true; /* the target's own test: the aircraft, or the ship (see AA.hit) */
    if (dead && b.t > 3.5 && Math.random() < 0.3) fxAdd(b.p, 0x555555, 2, 7, 1.2, 0, false);
    if (dead) AA.bl.splice(i, 1);
  }
  let nt = 0;
  for (let i = 0; i < AA.bl.length; i++) {
    const b = AA.bl[i];
    if (!b.tr) continue;
    const o = nt++ * 6;
    abPos[o] = b.p.x;
    abPos[o + 1] = b.p.y;
    abPos[o + 2] = b.p.z;
    abPos[o + 3] = b.p.x - b.v.x * 0.06;
    abPos[o + 4] = b.p.y - b.v.y * 0.06;
    abPos[o + 5] = b.p.z - b.v.z * 0.06;
  }
  abGeo.setDrawRange(0, nt * 2);
  abGeo.attributes.position.needsUpdate = true;
}

