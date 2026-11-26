/* AIR SUPPORT, both sides (the user's, 2026-11-21): sea units and ground installations under fire call for air support from the nearest
   airbase of their side. Two fighters launch after the scramble (90 s), take off along the runway, climb and fly out at cruise speed;
   called in as reinforcements they go to the area first and engage nothing on the way. There: the player's vehicle first (a Japanese
   pair that reaches the player becomes the game's own bandits, EN, in the P-51, or a raid, RAID, on the PCE: they fight as those do),
   then enemy aircraft (a dogfight: they chase, and fire in bursts inside 450 m nose-on), then they strafe the enemy's ships, guns and
   vehicles near the call. Guns only: no drop tanks, no bombs. They disengage and fly home when low on ammunition (under 15%) or fuel
   (enough to get home and 10 minutes over), when damaged past half, or after five minutes with nothing to fight; at their field they
   land (gone). They can be shot down (every gun and the player's weapons strike them: hurt).
   One call a caller at a time (the user's, 2026-11-21): a caller whose flight is still answering (not broken off for home nor shot
   down; a pair handed to the bandits or raiders counts until those are gone) cannot call again until it has.
   P-51D: six .50s, 1,880 rounds (about 24 s of fire), 269 US gal inside (about 3 hours cruising; combat burns three times as fast);
   cruise 150 m/s. Ki-84-Ia: two 20 mm and two 12.7 mm (about 15 s of fire), about 2 hours inside; cruise 140 m/s.
   The fields: American, Fletcher Field and Kamome Field; Japanese, Airbases Yamamoto, Onishi, Fukudome and Kakuta (one with all its
   parked fighters destroyed sends none). var: the damage hook may ask before this piece has run. */
var AIRSUP = (() => {
  const V3 = THREE.Vector3,
    L = [],
    HAND = [] /* Japanese fighters handed to the game's own (bandits, raiders): still answering their caller */,
    SCRAMBLE = 90,
    AREA = 3000,
    SPEC = {
      us: { name: 'P-51', V: 150, VA: 175, ammo: 24, fuel: 3 * 3600, hit: 0.03, dmg: 3, alt: 1500, cs: 'PONY' },
      jp: { name: 'Ki-84', V: 140, VA: 170, ammo: 15, fuel: 2 * 3600, hit: 0.035, dmg: 5, alt: 1200, cs: 'FRANK' },
    };
  /* the fields: a place on the runway's middle, the runway's heading, the ground */
  const fields = (side) => {
    const F = [];
    if (side === 'us') {
      F.push({ name: 'FLETCHER FIELD', p: new V3(0, 0, 420), dir: new V3(0, 0, -1) });
      if (typeof ISL !== 'undefined') F.push({ name: 'KAMOME FIELD', p: new V3(ISL.F.x, 0, ISL.F.z), dir: new V3(Math.cos(0.4), 0, -Math.sin(0.4)) });
    } else {
      const ab = (S, name) => {
        const [x, z] = S.w(0, -750),
          [x1, z1] = S.w(100, -750);
        return { name, p: new V3(x, 0, z), dir: new V3(x1 - x, 0, z1 - z).normalize(), R: 1500 };
      };
      F.push(ab(SITE, 'AIRBASE YAMAMOTO'));
      for (const s of FS.list)
        if (s.kind === 'air') F.push(ab(s, { air1: 'AIRBASE ONISHI', air2: 'AIRBASE FUKUDOME', air3: 'AIRBASE KAKUTA' }[s.id] || 'AIRBASE'));
    }
    for (const f of F) f.p.y = H(f.p.x, f.p.z) + 2;
    return F;
  };
  /* a Japanese field sends fighters while any of its parked ones is left */
  const canSend = (side, f) =>
    side === 'us' || T.some((q) => q.type === 'plane' && !q.dead && q.side !== 'us' && Math.hypot(q.c.x - f.p.x, q.c.z - f.p.z) < 1600);
  const mesh = (side) => {
    if (side === 'us') {
      const D = P51DISP.make({ gear: false });
      return { g: D.g, prop: D.prop };
    }
    const b = buildEnemy();
    return { g: b.g, prop: b.prop };
  };
  const radio = (who, s) => typeof RADIO !== 'undefined' && RADIO.add(who, s);
  const busy = (who) => {
    if (L.some((u) => u.who === who && !u.down && u.st !== 'rtb')) return true;
    const now = WT;
    for (let i = HAND.length - 1; i >= 0; i--) {
      const h = HAND[i],
        e = h.e;
      const live =
        now < h.end &&
        (h.raid
          ? typeof RAID !== 'undefined' && RAID.L.includes(e) && e.st !== 'down'
          : typeof EN !== 'undefined' && EN.includes(e) && !e.dying);
      if (!live) HAND.splice(i, 1);
      else if (h.who === who) return true;
    }
    return false;
  };
  /* a call: side 'us' or 'jp', p the place, who says it (the caller's name) */
  const call = (side, p, who) => {
    if (!started || crashed || typeof P51DISP === 'undefined') return false;
    /* one call a caller: while its flight is still answering (not yet broken off for home, nor down), no other */
    if (busy(who)) return false;
    /* a flight of ours already on its way or there: no second call */
    if (L.some((u) => u.side === side && !u.down && u.st !== 'rtb' && u.area.distanceTo(p) < 6000)) return false;
    /* and no more than two flights of a side up at once (a fight would otherwise call flight after flight) */
    if (new Set(L.filter((u) => u.side === side && !u.down).map((u) => u.who)).size >= 2) return false;
    const F = fields(side).filter((f) => canSend(side, f));
    if (!F.length) return false;
    const f = F.reduce((a, b) => (b.p.distanceTo(p) < a.p.distanceTo(p) ? b : a));
    const S = SPEC[side],
      eta = Math.round((SCRAMBLE + f.p.distanceTo(p) / S.V + 40) / 60);
    for (let k = 0; k < 2; k++) {
      const m = mesh(side);
      m.g.visible = false;
      scene.add(m.g);
      L.push({
        side,
        S,
        ...m,
        f,
        area: p.clone(),
        who,
        st: 'wait',
        t: -SCRAMBLE - k * 8,
        p: f.p.clone(),
        v: new V3(),
        bank: 0,
        hp: 4,
        ammo: S.ammo,
        fuel: S.fuel,
        up: false,
        down: false,
        idle: 0,
        k,
        a: Math.random() * 6,
      });
    }
    if (side === 'us') {
      radio(who, 'KAMOME CONTROL, THIS IS ' + who + '. UNDER ATTACK, REQUEST AIR SUPPORT. OVER.');
      radio('KAMOME CONTROL', who + ', KAMOME CONTROL. ' + S.cs + ' FLIGHT, TWO P-51S, SCRAMBLING FROM ' + f.name + '. ETA ' + eta + ' MINUTES. OUT.');
    } else if (p.distanceTo(pos) < 20000) {
      note('INTERCEPT: ' + who + ' IS CALLING ' + f.name + ' FOR FIGHTERS');
      radio('INTERCEPT', who + ' CALLING ' + f.name + ' FOR FIGHTERS. EXPECT FRANKS IN ABOUT ' + eta + ' MINUTES.');
    }
    return true;
  };
  /* a hit on one (any gun's round, the player's weapons): home at half, down at none */
  const hurt = (u, d) => {
    if (u.down) return;
    u.hp -= d;
    if (u.hp <= 0) {
      u.down = true;
      if (u.p.distanceTo(cam.position) < 8000) note(u.side === 'us' ? 'A P-51 IS SHOT DOWN' : 'A FRANK IS SHOT DOWN');
      if (u.side === 'us') radio(u.S.cs + ' FLIGHT', u.S.cs + ' ' + (u.k + 1) + ' IS HIT, GOING IN!');
    } else if (u.hp <= 2 && u.st !== 'rtb') {
      u.st = 'rtb';
      if (u.side === 'us') radio(u.S.cs + ' FLIGHT', u.S.cs + ' ' + (u.k + 1) + ' HIT, RETURNING TO BASE.');
    }
  };
  const up = new V3(0, 1, 0),
    M = new THREE.Matrix4(),
    w = new V3(),
    q = new V3();
  const steer = (u, dir, sp, dt, rate = 0.45) => {
    const v0 = u.v.lengthSq() > 1 ? u.v.clone().normalize() : dir.clone(),
      ang = Math.acos(Math.max(-1, Math.min(1, v0.dot(dir)))),
      k = ang > 1e-4 ? Math.min(1, (rate * dt) / ang) : 1,
      v1 = v0.clone().lerp(dir, k).normalize(),
      side = Math.sign(v0.x * v1.z - v0.z * v1.x),
      rt = ang > 1e-4 ? Math.min(ang, rate * dt) / dt : 0,
      s0 = u.v.length();
    u.bank += (Math.atan((sp * rt) / 9.81) * side - u.bank) * Math.min(1, dt * 2);
    u.v.copy(v1).multiplyScalar(s0 + (sp - s0) * Math.min(1, dt * 0.4));
  };
  const pose = (u) => {
    u.g.position.copy(u.p);
    const d = u.v.lengthSq() > 1 ? w.copy(u.v).normalize() : w.set(0, 0, -1);
    M.lookAt(u.p, q.copy(u.p).add(d), up.clone().applyAxisAngle(d, -u.bank));
    u.g.quaternion.setFromRotationMatrix(M);
  };
  /* the enemy aircraft it can fight */
  const bogeys = (u) => {
    const B = [];
    if (u.side === 'us') {
      if (typeof EN !== 'undefined') for (const e of EN) if (!e.dying && !e.drone) B.push({ p: e.p, v: e.v || e.fwd.clone().multiplyScalar(e.sp || 0), en: e });
      if (typeof RAID !== 'undefined') for (const e of RAID.L) if (e.st !== 'down') B.push({ p: e.p, v: e.v, raid: e });
    }
    for (const o of L) if (o.side !== u.side && o.up && !o.down) B.push({ p: o.p, v: o.v, air: o });
    return B.filter((b) => b.p.distanceTo(u.area) < AREA + 2000);
  };
  /* the enemy's ships, guns and vehicles near the call (armed first) */
  const ground = (u) => {
    let best = null,
      bd = 1e9;
    for (const pass of [true, false])
      for (const t of T) {
        if (t.dead || t.m.visible === false || (u.side === 'us' ? t.side === 'us' : t.side !== 'us') || t.type === 'plane') continue;
        const armed = t.kind === 'aa' || (t.type === 'ship' && t.kind !== 'civ' && t.kind !== 'boat');
        if (armed !== pass) continue;
        const d = t.c.distanceTo(u.area);
        if (d < AREA && d < bd) ((bd = d), (best = t));
      }
    return best;
  };
  const home = (u) => {
    u.st = 'rtb';
    u.tg = null;
  };
  /* one burst's worth of fire for dt: tracers, the ammunition, and a chance to hit */
  const fire = (u, to, dt, hitK) => {
    u.ammo -= dt;
    u.fuel -= dt * 2;
    if (Math.random() < dt * 6) {
      const a = u.p.clone().addScaledVector(w.copy(u.v).normalize(), 6);
      fxAdd(a, 0xffd890, 0.8, 2.5, 0.06, 0, true);
      fxAdd(to.clone().add(new V3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6)), 0xffd080, 1, 3, 0.12, 0, true);
    }
    return Math.random() < (u.S.hit / 0.25) * dt * hitK;
  };
  const tick = (dt) => {
    for (let i = L.length - 1; i >= 0; i--) {
      const u = L[i],
        S = u.S;
      if (u.down) {
        u.v.y -= 9.8 * dt;
        u.p.addScaledVector(u.v, dt);
        u.bank += dt * 2;
        pose(u);
        if (Math.random() < dt * 8) fxAdd(u.p, 0x222222, 3, 10, 1.5, 1, false);
        if (u.p.y < Math.max(SEA.WL, H(u.p.x, u.p.z))) {
          explode(u.p.clone(), 10);
          scene.remove(u.g);
          L.splice(i, 1);
        }
        continue;
      }
      u.t += dt;
      u.prop.rotation.z += dt * 60;
      if (u.st === 'wait') {
        if (u.t < 0) continue;
        /* wheels rolling: down the runway */
        u.st = 'climb';
        u.up = true;
        u.p.copy(u.f.p).addScaledVector(u.f.dir, -400 + u.k * 60);
        u.v.copy(u.f.dir).multiplyScalar(55);
        u.g.visible = true;
      }
      u.fuel -= dt;
      const S2 = (u.p.distanceTo(u.f.p) / S.V) * 1.2 + 600; /* the fuel to get home, and ten minutes over */
      if (u.st !== 'rtb' && (u.ammo < S.ammo * 0.15 || u.fuel < S2)) {
        if (u.side === 'us')
          radio(S.cs + ' FLIGHT', S.cs + ' ' + (u.k + 1) + (u.ammo < S.ammo * 0.15 ? ', WINCHESTER' : ', BINGO FUEL') + '. RETURNING TO BASE.');
        home(u);
      }
      if (u.st === 'climb') {
        q.copy(u.area).setY(S.alt);
        steer(u, w.copy(q).sub(u.p).setY(0).normalize().setY(0.18).normalize(), S.V, dt, 0.25);
        if (u.p.y > u.f.p.y + 300) u.st = 'transit';
      } else if (u.st === 'transit') {
        /* reinforcements: to the area first, engaging nothing on the way */
        q.copy(u.area).setY(S.alt);
        steer(u, w.copy(q).sub(u.p).normalize(), S.V, dt);
        if (Math.hypot(u.p.x - u.area.x, u.p.z - u.area.z) < AREA) u.st = 'fight';
      } else if (u.st === 'fight') {
        /* a Japanese pair that has the player within reach: the game's own fighters take over */
        if (u.side === 'jp' && started && !crashed && u.p.distanceTo(pos) < 5000) {
          if (SIMS.cur.afloat && typeof raidSpawn === 'function' && typeof ENEMY !== 'undefined' && ENEMY.has('planes')) {
            const e = raidOne(u);
            if (e) HAND.push({ e, raid: true, who: u.who, end: WT + u.fuel });
            scene.remove(u.g);
            L.splice(i, 1);
            continue;
          }
          if (!SIMS.cur.afloat && typeof banditAt === 'function' && typeof ENEMY !== 'undefined' && ENEMY.has('planes')) {
            const e = banditAt(u.p.clone());
            e.scr = true;
            HAND.push({ e, raid: false, who: u.who, end: WT + u.fuel });
            scene.remove(u.g);
            L.splice(i, 1);
            continue;
          }
        }
        if ((u.ct = (u.ct || 0) - dt) <= 0) {
          u.ct = 1;
          const B = bogeys(u);
          u.tg = B.length ? B.reduce((a, b) => (b.p.distanceTo(u.p) < a.p.distanceTo(u.p) ? b : a)) : null;
          u.gt = u.tg ? null : ground(u);
          u.idle = u.tg || u.gt ? 0 : u.idle + 1;
          if (u.idle > 300) home(u);
        }
        const B = u.tg;
        if (B && (B.en ? B.en.dying : B.raid ? B.raid.st === 'down' : B.air.down)) u.tg = null;
        if (u.tg) {
          /* the dogfight: lead pursuit, a burst when inside 450 m and nose-on */
          q.copy(B.p).addScaledVector(B.v, Math.min(2, B.p.distanceTo(u.p) / 600));
          steer(u, w.copy(q).sub(u.p).normalize(), S.VA, dt, 0.6);
          u.fuel -= dt * 2;
          const to = q.sub(u.p),
            d = to.length();
          /* a hit's chance per second of firing (S.hit / 0.25: about 12% for the P-51s, 14% for the Ki-84s; it was 24% and 28%, and
             the fighters shot down everything they met: the user's, 2026-11-21), inside 450 m and within about 10 deg of her */
          if (d < 450 && to.normalize().dot(w.copy(u.v).normalize()) > 0.985 && fire(u, B.p, dt, 1)) {
            if (B.en) damageE(B.en, S.dmg);
            else if (B.raid) {
              if (++B.raid.dmg >= 2) ((B.raid.st = 'down'), (B.raid.sm = 0));
            } else hurt(B.air, 1.5);
          }
        } else if (u.gt && !u.gt.dead) {
          /* a strafing run: in low from 2 km, fire from 900 m to 300 m, pull up and round again */
          const t = u.gt,
            d = Math.hypot(t.c.x - u.p.x, t.c.z - u.p.z);
          if (d < 280) u.pull = 6;
          if ((u.pull = (u.pull || 0) - dt) > 0) steer(u, w.copy(u.v).setY(0).normalize().setY(0.5).normalize(), S.VA, dt, 0.6);
          else {
            q.copy(t.c).setY(t.c.y + 2);
            if (d > 2000) q.y = u.p.y > 400 ? u.p.y - 100 : 350;
            steer(u, w.copy(q).sub(u.p).normalize(), S.VA, dt, 0.5);
            const to = q.sub(u.p).normalize();
            if (d < 900 && d > 300 && to.dot(w.copy(u.v).normalize()) > 0.97 && fire(u, t.c, dt, 2.5)) damage(t, S.dmg);
          }
        } else {
          /* nothing to fight: an orbit over the area */
          u.a += (S.V / 1800) * dt;
          q.set(u.area.x + 1800 * Math.cos(u.a + u.k * 3), S.alt, u.area.z + 1800 * Math.sin(u.a + u.k * 3));
          steer(u, w.copy(q).sub(u.p).normalize(), S.V, dt);
        }
      } else if (u.st === 'rtb') {
        q.copy(u.f.p).setY(u.f.p.y + 400);
        steer(u, w.copy(q).sub(u.p).normalize(), S.V, dt);
        if (Math.hypot(u.p.x - u.f.p.x, u.p.z - u.f.p.z) < 700) {
          /* landed */
          scene.remove(u.g);
          L.splice(i, 1);
          continue;
        }
      }
      u.p.addScaledVector(u.v, dt);
      u.p.y = Math.max(u.p.y, H(u.p.x, u.p.z) + (u.st === 'climb' ? 0 : 60), SEA.WL + 30);
      pose(u);
    }
  };
  /* a Japanese fighter that reaches the player's ship joins a raid on her (one raider, from where it is: it fights on until hit) */
  const raidOne = (u) => {
    const n0 = RAID.L.length;
    raidSpawn(u.p.clone());
    /* raidSpawn sends a section of two: keep the one for this fighter, at its place */
    const add = RAID.L.slice(n0);
    if (add.length > 1) for (const e of add.slice(1)) ((e.st = 'down'), scene.remove(e.b.g), RAID.L.splice(RAID.L.indexOf(e), 1));
    if (add[0]) add[0].p.copy(u.p);
    return add[0];
  };
  HOOKS.tick.push((dt) => {
    if (started && !paused) tick(dt);
  });
  HOOKS.mapDraw.push((g, lw) => {
    for (const u of L)
      if (u.up && !u.down) {
        g.fillStyle = u.side === 'us' ? '#5aa8ff' : '#ff6a5a';
        g.beginPath();
        g.arc(u.p.x, u.p.z, lw(4), 0, 2 * Math.PI);
        g.fill();
      }
  });
  const clear = () => {
    for (const u of L) scene.remove(u.g);
    L.length = 0;
    HAND.length = 0;
  };
  /* who is calling: the named place nearest (a base, a port, a depot, an airbase), else the unit */
  const NAMES = {
    port1: 'PORT KONDO',
    port2: 'PORT INOUE',
    air1: 'AIRBASE ONISHI',
    air2: 'AIRBASE FUKUDOME',
    air3: 'AIRBASE KAKUTA',
    cv1: 'DEPOT MIKAWA',
    cv2: 'DEPOT KURITA',
  };
  /* the named places: [site, name] (a site has O, its shore point, and R; FS.nav's have navy 'jp', 'us' or 'usdep') */
  const places = () => [...FS.list.map((s) => [s, NAMES[s.id]]), ...FS.nav.map((s) => [s, (s.title || '').toUpperCase()]), ...(FS.army || []).map((s) => [s, s.title.toUpperCase()]), [SITE, 'PORT NAGUMO']];
  const whoAt = (p, side, ship) => {
    const S = places();
    for (const [s, n] of S) if (n && Math.hypot(p.x - s.O.x, p.z - s.O.z) < (s.R || 600) + 800) return n;
    return ship
      ? (side === 'us' ? 'US SHIP ' : 'SHIP ') + Math.round(p.x / 100) + '/' + Math.round(p.z / 100)
      : 'POSITION ' + Math.round(p.x / 100) + '/' + Math.round(p.z / 100);
  };
  /* a hit on a sea unit or a ground installation (damage()): it calls for air support */
  const hit = (q) => {
    if (!q || q.dead || q.type === 'plane' || q.kind === 'veh' || !q.c) return;
    const ship = q.type === 'ship';
    if (!ship && !(q.kind === 'aa' || q.kind === 'st' || q.kind === 'bld' || q.type === 'coast12')) return;
    const side = q.side === 'us' ? 'us' : 'jp';
    call(side, q.c.clone(), whoAt(q.c, side, ship));
  };
  /* enemy aircraft shooting at p (the raiders' bursts): an Allied unit or base near it calls */
  const underAir = (p) => {
    /* the player's own ship calls only when her OOD is the AI's (the player as OOD makes his own calls) */
    const near = T.some((q) => q.side === 'us' && !q.dead && q.c.distanceTo(p) < 1500) || (SIMS.cur.afloat && !SIMS.cur.oodCalls() && pos.distanceTo(p) < 1500);
    if (near) call('us', p.clone(), whoAt(p, 'us', true));
  };
  return { L, call, hit, underAir, hurt, clear, fields, busy, places, whoAt };
})();

/* the air-support fighters in the air are solid (PHYS): one that flies into anything is lost there */
if (typeof PHYS !== 'undefined')
  PHYS.flyers({
    name: 'AIRCRAFT',
    list: () => AIRSUP.L,
    live: (u) => u.up && !u.down,
    o: (u) => u.g,
    m: 4300,
    hit: (u, o, info) => {
      if (u.down) return;
      AIRSUP.hurt(u, 1e3);
      explode((info.p || u.p).clone(), 14);
    },
  });
