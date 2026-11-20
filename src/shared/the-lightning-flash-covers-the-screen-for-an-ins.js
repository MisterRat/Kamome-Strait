/* the lightning flash covers the screen for an instant */
const WXFL = document.createElement('div');
WXFL.style.cssText = 'position:fixed;inset:0;background:#dfe8ff;opacity:0;pointer-events:none;z-index:2';
document.body.appendChild(WXFL);
const FROST = document.createElement('div');
FROST.id = 'frost';
FROST.style.cssText =
  'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0;background:radial-gradient(ellipse at 50% 55%,rgba(225,238,248,0) 30%,rgba(225,238,248,.5) 68%,rgba(240,248,255,.92) 100%)';
document.body.appendChild(FROST);
Object.assign(WX, {
  oat(h) {
    return 15 + (WXOFF[this.wx] || 0) - 0.0065 * Math.max(0, h);
  },
  windNew() {
    const w = WXW[this.wx] || WXW.clear,
      k = WXWS[this.ws] === undefined ? 1 : WXWS[this.ws],
      from =
        this.wd === 'auto'
          ? Math.random() < 0.6
            ? (Math.random() < 0.5 ? 0 : 180) + (Math.random() - 0.5) * 70
            : Math.random() * 360
          : +this.wd;
    this.wnd = { from: (from + 360) % 360, spd: (w[0] + Math.random() * (w[1] - w[0])) * k, gust: w[2] * k };
  },
  setWind(from, spd, gust) {
    this.wnd = { from: (from + 360) % 360, spd, gust: gust || 0 };
  },
  setWd(v) {
    this.wd = v;
    this.save();
    this.windNew();
    note('WIND FROM ' + (v === 'auto' ? 'ANY DIRECTION' : v.padStart(3, '0') + '°'));
  },
  setWs(v) {
    this.ws = v;
    this.save();
    this.windNew();
    note('WIND STRENGTH: ' + v.toUpperCase());
  },
  setTime(v) {
    this.time = v;
    this.hour = v === 'local' ? this.localHour() : WX_HOUR[v];
    this.save();
    this.apply();
    note('TIME: ' + this.clock());
  },
  setWx(v) {
    this.wx = v;
    this.save();
    this.windNew();
    this.apply();
    note('WEATHER: ' + $$('wxWx').selectedOptions[0].textContent.toUpperCase());
  },
  localHour() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  },
  clock() {
    const h = Math.floor(this.hour) % 24,
      m = Math.floor((this.hour % 1) * 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },
  /* sky, fog, sun / moon, light colours and intensities, cloud tint, lights */
  paint() {
    const { O, SD, L, GREY, CC, cl, pal } = WXP,
      set = this.deckAbove ? WX_SET.clear : WX_SET[this.wx],
      a = ((this.hour - 6) / 12) * Math.PI;
    SD.set(Math.cos(a), Math.sin(a) * 0.75, 0.35).normalize();
    const e = SD.y;
    pal(e);
    const m = set.murk,
      lum = O.hz.r * 0.3 + O.hz.g * 0.59 + O.hz.b * 0.11;
    GREY.setRGB(lum, lum, lum * 1.04);
    O.hz.lerp(GREY, m * 0.85).multiplyScalar(1 - set.dark);
    O.zn.lerp(O.hz, m).multiplyScalar(1 - set.dark);
    const moon = e < -0.06;
    if (moon) L.set(-SD.x, Math.max(0.35, -SD.y), -SD.z).normalize();
    else {
      L.copy(SD);
      if (L.y < 0.04) L.y = 0.04;
      L.normalize();
    }
    sun.position.copy(L);
    sun.color.copy(O.sc);
    sun.intensity = Math.max(O.si * set.sunK, moon ? 0.1 : 0);
    hemi.color.copy(O.hs);
    hemi.groundColor.copy(O.hg);
    this.hemiBase = O.hi * set.hemiK;
    hemi.intensity = this.hemiBase + this.flash * 2.4;
    scene.fog.color.copy(O.hz);
    scene.fog.near = set.fogN;
    scene.fog.far = set.fogF;
    scene.background.copy(O.hz);
    CSH.sun.copy(L);
    if (CSH.sun.y < 0.3) {
      CSH.sun.y = 0.3;
      CSH.sun.normalize();
    }
    this.shK = set.shK * cl(e / 0.15);
    CSH.k.value = QL.t().shadow ? 0.28 * this.shK : 0;
    /* sky dome */
    HZC.copy(O.hz);
    ZNC.copy(O.zn);
    if (SKYD) {
      const p = SKYD.attributes.position,
        c = SKYD.attributes.color,
        R = 24000,
        t = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i) / R;
        if (y < 0) t.copy(HZC).multiplyScalar(0.9);
        else t.copy(HZC).lerp(ZNC, Math.min(1, Math.pow(y, 0.5) * 1.1));
        c.setXYZ(i, t.r, t.g, t.b);
      }
      c.needsUpdate = true;
    }
    const vis = 1 - m * 0.95;
    SUNSP.forEach((s) => {
      if (s.userData.op === undefined) s.userData.op = s.material.opacity;
      s.position.copy(SD).multiplyScalar(20000);
      s.material.color.copy(O.sc);
      s.material.opacity = s.userData.op * vis * cl((e + 0.08) / 0.1);
      s.visible = s.material.opacity > 0.01;
    });
    if (MOON) {
      MOON.position.set(-SD.x, Math.max(0.35, -SD.y), -SD.z).normalize().multiplyScalar(20000);
      MOON.material.opacity = cl(-e / 0.15) * (1 - m);
      MOON.visible = MOON.material.opacity > 0.01;
    }
    if (STARS) {
      STARS.material.opacity = cl((-e - 0.02) / 0.2) * (1 - m);
      STARS.visible = STARS.material.opacity > 0.01;
    }
    /* clouds take the light */
    const dayK = cl((e + 0.05) / 0.3);
    CC.set(set.col).multiplyScalar(0.22 + 0.78 * dayK);
    if (e < 0.3) CC.lerp(O.hz, 0.4 * (1 - cl(e / 0.3)));
    if (CLM) {
      CLM.mc.color.copy(CC);
      CLM.mr.color.copy(CC);
      CLM.mr.opacity = 0.7 * (1 - m * 0.6);
    }
    /* lights: dusk and night, and murky weather */
    const lt = Math.max(cl((0.1 - e) / 0.2), m > 0.4 ? 0.5 : 0);
    WX.lt = lt;
    BLDL.opacity = lt;
    T.forEach((t) => {
      if (t.lit) t.lit.visible = !t.dead && lt > 0.02;
    });
    AFL.visible = lt > 0.02;
    RWL.material.opacity = lt;
    RWL.visible = lt > 0.02;
    HOOKS.nightLights.forEach((n) => {
      n.material.opacity = lt;
      n.visible = lt > 0.02;
    });
    RAIN.m.material.opacity = 0.35 * (0.45 + 0.55 * dayK);
  },
  apply() {
    const set = WX_SET[this.wx],
      n = CLOUDS.length;
    CLOUDS.forEach((s, i) => {
      s.userData.wx = !DECK.cfg[this.wx] && i < Math.ceil(set.cover * n); /* a solid deck replaces the scattered clouds */
      s.scale.set(s.userData.sx * set.scale, s.userData.sy * set.scale, 1);
      s.updateMatrix();
    });
    DECK.apply();
    this.rainK = set.rain;
    this.wet = Math.max(this.wet, Math.min(1, set.rain));
    this.nextBolt = 4 + Math.random() * 6;
    this.paint();
    applyQuality();
  },
  update(dt) {
    const set = WX_SET[this.wx];
    this.tc = (this.tc || 0) + dt;
    this.t += dt;
    /* runway wetness: wets quickly in rain, dries slowly */
    const wt = Math.min(1, set.rain);
    if (this.wet < wt) this.wet = Math.min(wt, this.wet + dt / 20);
    else if (this.wet > wt) this.wet = Math.max(wt, this.wet - dt / 150);
    /* is the aircraft inside a cloud? (checked twice a second) */
    this.ct -= dt;
    if (this.ct <= 0) {
      this.ct = 0.5;
      let ic = false;
      if (started && FM.use('ice') && WX.wx !== 'fog') {
        const r = CSH.root.position;
        for (const c of CLOUDS) {
          if (!c.userData.wx) continue;
          if (
            Math.abs(c.position.y - pos.y) < 0.35 * c.scale.y &&
            Math.abs(c.position.x + r.x - pos.x) < 0.4 * c.scale.x &&
            Math.abs(c.position.z + r.z - pos.z) < 0.4 * c.scale.x
          ) {
            ic = true;
            break;
          }
        }
      }
      if (!ic && started && FM.use('ice') && DECK.inside(pos)) ic = true;
      this.inCloud = ic;
    }
    windNow(SC.w);
    if (WSOCK) {
      /* the windsock streams downwind and droops when the wind drops */
      const sp = FM.use('wind') ? this.sp : 0,
        d = this.dirTo,
        dr = Math.max(0, 1.25 * (1 - Math.min(1, sp / 7)));
      WSOCK.rotation.set(0, Math.atan2(Math.cos(d), Math.sin(d)), -dr);
      WSOCK.position.set(
        32 + 2 * Math.cos(dr) * Math.sin(d),
        8 - 2 * Math.sin(dr),
        300 - 2 * Math.cos(dr) * Math.cos(d),
      );
      WSOCK.updateMatrix();
    }
    const fz = $$('frost');
    if (fz)
      fz.style.opacity = FM.use('ice') && camMode === 1 && !PHOTO.on ? Math.min(0.85, FM.ice * 0.95).toFixed(2) : 0;
    if (this.flow && !(PHOTO.on && PHOTO.freeze)) {
      this.hour = (this.hour + dt / 60) % 24;
      this.tp = (this.tp || 0) + dt;
      if (this.tp > 0.5) {
        this.tp = 0;
        this.paint();
      }
    }
    if (this.tc > 1) {
      this.tc = 0;
      const el = $$('wxClock');
      if (el) el.textContent = '(' + this.clock() + ')';
    }
    /* lightning */
    if (set.storm && started && !paused) {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) {
        this.nextBolt = 6 + Math.random() * 10;
        this.flash = 1;
        SND.thunder(0.3 + Math.random() * 2.5);
      }
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 5);
      hemi.intensity = this.hemiBase + this.flash * 2.4;
      WXFL.style.opacity = (this.flash * 0.35).toFixed(3);
    }
    /* rain */
    const R = RAIN;
    if (set.rain > 0) {
      const tier = QL.t().fx,
        cnt = Math.min(R.N, Math.floor((tier === 0 ? 350 : tier === 1 ? 700 : 1000) * set.rain)),
        rx = -vel.x,
        ry = -14 - vel.y,
        rz = -vel.z,
        sp = Math.hypot(rx, ry, rz) || 1,
        len = Math.min(6, Math.max(0.6, sp * 0.045)),
        ux = (rx / sp) * len,
        uy = (ry / sp) * len,
        uz = (rz / sp) * len,
        pa = R.g.attributes.position.array,
        o = R.o;
      for (let i = 0; i < cnt; i++) {
        const k = i * 3;
        let x = o[k] + rx * dt,
          y = o[k + 1] + ry * dt,
          z = o[k + 2] + rz * dt;
        if (x > R.BX) x -= 2 * R.BX;
        else if (x < -R.BX) x += 2 * R.BX;
        if (y > R.BY) y -= 2 * R.BY;
        else if (y < -R.BY) y += 2 * R.BY;
        if (z > R.BX) z -= 2 * R.BX;
        else if (z < -R.BX) z += 2 * R.BX;
        o[k] = x;
        o[k + 1] = y;
        o[k + 2] = z;
        const j = i * 6;
        pa[j] = x;
        pa[j + 1] = y;
        pa[j + 2] = z;
        pa[j + 3] = x - ux;
        pa[j + 4] = y - uy;
        pa[j + 5] = z - uz;
      }
      R.g.setDrawRange(0, cnt * 2);
      R.g.attributes.position.needsUpdate = true;
      R.m.position.copy(cam.position);
      R.m.visible = true;
    } else R.m.visible = false;
  },
});
