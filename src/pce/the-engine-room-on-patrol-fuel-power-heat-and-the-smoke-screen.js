/* =====================================================================================================================
   THE ENGINE ROOM ON PATROL (the user's, 2026-11-21: finish the engineer's station). Besides answering the bells and the repairs:
     FUEL     her diesel oil, a fraction of a full load (ENG.fuel). A full load: 8,500 nmi at 12 kn; at more speed she burns more (the
              hotel load plus the propulsion, which goes as the cube of the speed). A shell or a torpedo can hole a fuel tank: the oil
              runs out of it (ENG.leak) until the tank is isolated and its oil transferred. Empty, the engines stop. Alongside an
              American base she is refuelled with the rearming.
     POWER    the ship's service generators and the main switchboard (ENG.pwr). A hit can trip it: the radar and the sonar go dead
              until the breakers are closed again, in order (the generator, the main bus, then the loads).
     HEAT     the cooling water (ENG.heat, the gauges). Run hard, the sea strainer clogs now and then (ENG.clog) and the engines heat;
              too hot they must be slowed, and stopped before they are ruined, until the standby strainer is cut in.
     SMOKE    the smoke generator aft (SMK), on the OOD's order: fog oil burned into a white screen that pours off her stern and lies
              on the water for a minute or two. An enemy gunner laying on her through it gets glimpses only (SIMS screen(): ROE, the coast
              batteries, the ground fire); through a thick part he cannot see her at all. The fog oil is refilled with the rearming.
   With the player in the engine room each of these is his job (the DCX mini-games: 'power', 'fuel', 'cool', 'smoke'); away from it
   the engine room's own crew (the AI) deals with it after a while, as the repair parties do with the battle damage.
   ===================================================================================================================== */
Object.assign(ENG, { fuel: 1, leak: 0, pwr: true, clog: false, lim: 1, stopT: 0, ai: {}, hitT: -1e9, warn: 1 });
const ENG_RANGE = 8500; /* nmi at 12 kn, a full load */
/* the fraction of a full load burned in an hour at v knots: at 12 kn a full load lasts 8,500 / 12 hours; a fifth of that is the
   hotel load (the generators), the rest the propulsion, as the cube of the speed */
const engBurn = (v) => (1 / (ENG_RANGE / 12)) * (0.2 + 0.8 * Math.pow(Math.max(0, v) / 12, 3));
/* the miles she has left at v knots (stopped: at 12) */
const engRange = (v) => {
  const k = v < 4 ? 12 : v;
  return (ENG.fuel / engBurn(k)) * k;
};
/* the power on the radar, the sonar and the rest of the ship's service loads */
const engPower = () => ENG.pwr !== false;
/* the player in the engine room (in first person, no drill): its troubles are his jobs */
const engHere = () => camMode == 1 && SHIP.stn === 2 && !DRILL.on && started && !RPL.on;
const engSay = (t) => RADIO.add('ENGINE ROOM', t, { own: true });
function engReset() {
  Object.assign(ENG, { fuel: 1, leak: 0, pwr: true, clog: false, lim: 1, stopT: 0, ai: {}, hitT: -1e9, warn: 1 });
  smkReset();
}
/* a hit (battle damage): kind 'small', 'shell' or 'torpedo'. It may trip the switchboard or hole a fuel tank */
function engHit(kind) {
  const r = Math.random;
  if (kind !== 'small') ENG.hitT = SHIP.t;
  const pw = kind === 'torpedo' ? 0.8 : kind === 'shell' ? 0.3 : kind === 'shell3' ? 0.15 : 0.03,
    fl = kind === 'torpedo' ? 0.6 : kind === 'shell' ? 0.15 : kind === 'shell3' ? 0.07 : 0;
  if (ENG.pwr && r() < pw) {
    ENG.pwr = false;
    ENG.ai.pwr = 25 + r() * 20;
    sdmSay('BRIDGE, DAMAGE CONTROL. THE MAIN SWITCHBOARD HAS TRIPPED. NO POWER TO THE RADAR AND THE SONAR.');
  }
  if (r() < fl) {
    ENG.leak = Math.max(ENG.leak, kind === 'torpedo' ? 0.04 : 0.02) /* of a full load a minute */;
    ENG.tank = Math.floor(r() * 4);
    ENG.ai.leak = 40 + r() * 30;
    sdmSay('BRIDGE, DAMAGE CONTROL. A FUEL TANK IS HOLED, WE ARE LOSING OIL.');
  }
}
/* the engines' limit: overheated, out of fuel */
function engLimit() {
  if (ENG.fuel <= 0 || ENG.stopT > 0) return 0;
  return ENG.heat > 1.1 ? 0.5 : 1;
}
/* each frame */
function engPatrol(dt) {
  if (!SIMS.on('pce') || !started || paused || crashed || RPL.on) return;
  const kn = Math.abs(SHIP.u) / 0.5144,
    here = engHere(),
    hc = drillHC();
  /* fuel: what she burns, and what runs out of a holed tank */
  ENG.fuel = Math.max(0, ENG.fuel - ((engBurn(kn) / 3600) * dt + (ENG.leak / 60) * dt));
  for (const w of [0.25, 0.1, 0]) {
    if (ENG.fuel <= w && ENG.warn > w) {
      ENG.warn = w;
      engSay(w ? 'BRIDGE, ENGINE ROOM. FUEL DOWN TO ' + Math.round(w * 100) + ' PERCENT.' : 'BRIDGE, ENGINE ROOM. OUT OF FUEL. THE ENGINES HAVE STOPPED.');
    }
  }
  /* heat: run hard, the sea strainer clogs now and then */
  const load = Math.abs(ENG.ans);
  if (!ENG.clog && SHIP.u > 1 && Math.random() < dt * (load > 0.85 ? 1 / 900 : 1 / 5400)) {
    ENG.clog = true;
    ENG.ai.clog = 20 + Math.random() * 20;
    engSay('BRIDGE, ENGINE ROOM. COOLING WATER TEMPERATURE RISING.');
  }
  if (ENG.heat > 1.1 && !ENG.hot) ((ENG.hot = true), engSay('BRIDGE, ENGINE ROOM. THE ENGINES ARE OVERHEATING. WE MUST SLOW THEM.'));
  if (ENG.heat > 1.6 && ENG.stopT <= 0) ((ENG.stopT = 30), engSay('BRIDGE, ENGINE ROOM. STOPPING THE ENGINES TO SAVE THEM.'));
  if (ENG.heat < 0.95) ENG.hot = false;
  ENG.stopT = Math.max(0, ENG.stopT - dt);
  /* the player's jobs, or the engine room crew's */
  if (here) {
    if (!ENG.pwr) dcxAdd('power', hc);
    if (ENG.leak > 0) dcxAdd('fuel', hc);
    if (ENG.clog && !DCX.L.some((j) => j.k === 'cool')) {
      const j = dcxAdd('cool', hc);
      if (j) {
        j.temp = j.peak = 60 + ENG.heat * 25;
        j.live = true;
        j.onDone = (j) => {
          ENG.clog = false;
          if (j.failed) ENG.stopT = Math.max(ENG.stopT, 30);
        };
      }
    }
    if (SMK.on) dcxAdd('smoke', hc);
    /* the smoke generator runs on: the repairs come first */
    if (DCX.L.length > 1 && DCX.L[0].k === 'smoke') DCX.L.push(DCX.L.shift());
  } else {
    const A = ENG.ai;
    if (!ENG.pwr && (A.pwr -= dt) <= 0) ((ENG.pwr = true), engSay('BRIDGE, ENGINE ROOM. POWER RESTORED.'));
    if (ENG.leak > 0 && (A.leak -= dt) <= 0) ((ENG.leak = 0), engSay('BRIDGE, ENGINE ROOM. THE HOLED TANK IS ISOLATED.'));
    if (ENG.clog && (A.clog -= dt) <= 0) ((ENG.clog = false), engSay('BRIDGE, ENGINE ROOM. SHIFTED TO THE STANDBY STRAINER.'));
  }
  /* the cooling-water job in hand: its temperature is the engines' */
  const cj = DCX.L.find((j) => j.k === 'cool' && j.live);
  if (cj) ENG.heat = (cj.temp - 60) / 25;
  /* refuelled alongside an American base, with the rearming */
  /* (from under 99%, so the sliver she burns lying there does not start it again and again) */
  if (typeof REARM !== 'undefined' && REARM.at && (ENG.fueling || ENG.fuel < 0.99) && Math.hypot(vel.x, vel.z) < 0.75) {
    if (!ENG.fueling) ((ENG.fueling = true), note('ALONGSIDE ' + REARM.at.title.toUpperCase() + ' - REFUELLING'));
    ENG.fuel = Math.min(1, ENG.fuel + dt / (120 * rldK()));
    SMK.oil = 1;
    ENG.leak = 0;
    ENG.fuel = Math.min(1, ENG.fuel);
    if (ENG.fuel >= 1) ((ENG.fueling = false), (ENG.warn = 1), note('REFUELLED'));
  }
  smkStep(dt);
}
HOOKS.tick.push(engPatrol);

/* ---- THE SMOKE SCREEN ---- */
var SMK = { on: false, f: 0.5, c: 0.5, cv: 0, dens: 0, puffT: 0, layT: 0, pts: [], oil: 1, by: '' };
function smkReset() {
  Object.assign(SMK, { on: false, f: 0.5, c: 0.5, cv: 0, dens: 0, puffT: 0, layT: 0, oil: 1, by: '' });
  SMK.pts.length = 0;
}
/* the fog oil burner: the band it wants wanders (the load and the air change); o.f the flow, o.c the band's middle; o.dens the
   smoke's thickness, 0..1 (the Make Smoke drill and the generator in action) */
function smkBand(o, dt, hc) {
  if (Math.random() < dt * 0.4) o.cv = (Math.random() - 0.5) * (hc ? 0.16 : 0.09);
  o.c = Math.max(0.2, Math.min(0.85, o.c + o.cv * dt));
  const half = hc ? 0.09 : 0.14,
    off = Math.abs(o.f - o.c);
  o.dens = Math.max(0, 1 - Math.max(0, off - half * 0.5) / half);
  return o.dens;
}
/* the smoke off her stern: white fog-oil smoke, thick or thin (too rich: a wet white smudge), drifting astern and rising slowly;
   lay: it lies on the water as a screen (the points smkScreen counts) */
function smkPuff(o, dt, lay) {
  if ((o.puffT -= dt) > 0) return;
  o.puffT = lay ? 0.6 : 0.12;
  const p = SHIPM.mesh.localToWorld(new THREE.Vector3(PCEM.XF(91), 2.2, 0));
  const col = o.f > o.c + 0.1 ? 0xf2f2ee : 0xd8d8d4;
  if (o.dens > 0.05 && !lay) fxAdd(p, col, 2 + 4 * o.dens, 12 + 30 * o.dens, 20, 0.4, false);
  /* the screen: a low bank that billows up and out as it drifts astern (two puffs, one riding higher) */
  if (o.dens > 0.05 && lay) {
    const R = Math.random,
      j = (k) => new THREE.Vector3((R() - 0.5) * k, (R() - 0.3) * k * 0.5, (R() - 0.5) * k);
    fxAdd(p.clone().add(j(4)), col, 3 + 4 * o.dens, (60 + 70 * o.dens) * (0.6 + 0.8 * R()), 60 + 20 * R(), 0.2 + 0.3 * R(), false);
    fxAdd(p.clone().add(j(6)).setY(p.y + 3 + 4 * R()), R() < 0.5 ? col : 0xc9c9c4, 2 + 3 * o.dens, (40 + 60 * o.dens) * (0.6 + 0.8 * R()), 45 + 20 * R(), 0.5 + 0.4 * R(), false);
  }
  if (lay && (SMK.layT -= o.puffT) <= 0) {
    SMK.layT = 1.2;
    SMK.pts.push({ x: p.x, z: p.z, t: 0, d: o.dens });
    if (SMK.pts.length > 220) SMK.pts.shift();
  }
}
/* MAKE SMOKE / SECURE SMOKE (the OOD's order) */
function smkOrder(on, by) {
  if (on === SMK.on) return false;
  if (on && SMK.oil <= 0) return note('NO FOG OIL LEFT'), false;
  SMK.on = on;
  SMK.by = by || '';
  if (on) ((SMK.f = SMK.c), SND.tone(120, 160, 0.6, 0.1, 'sawtooth'));
  else {
    const i = DCX.L.findIndex((j) => j.k === 'smoke');
    if (i >= 0) DCX.L.splice(i, 1);
  }
  RADIO.add('BRIDGE', on ? 'ENGINE ROOM, BRIDGE. MAKE SMOKE!' : 'ENGINE ROOM, BRIDGE. SECURE SMOKE.', { own: true });
  return true;
}
function smkStep(dt) {
  /* the screen lying on the water: it spreads and thins over a minute and a half (as the smoke you see does) */
  for (const q of SMK.pts) q.t += dt;
  while (SMK.pts.length && SMK.pts[0].t > 90) SMK.pts.shift();
  if (!SMK.on) return;
  const tended = engHere() && DCX.L[0] && DCX.L[0].k === 'smoke';
  /* nobody at the generator's valve (the AI): the flow follows the band */
  if (!tended) SMK.f += Math.max(-0.2 * dt, Math.min(0.2 * dt, SMK.c - SMK.f));
  smkBand(SMK, dt, drillHC() && tended);
  /* fog oil: about fifteen minutes at a full flow */
  SMK.oil = Math.max(0, SMK.oil - (SMK.f * dt) / 900);
  if (SMK.oil <= 0) {
    smkOrder(false, SMK.by);
    engSay('BRIDGE, ENGINE ROOM. THE FOG OIL IS GONE. NO MORE SMOKE.');
    return;
  }
  smkPuff(SMK, dt, true);
}
/* how much of the screen (0..1) lies across the line from a to b (seen from a gun at a; b is her) */
function smkScreen(a, b) {
  if (!SMK.pts.length) return 0;
  const dx = b.x - a.x,
    dz = b.z - a.z,
    L2 = dx * dx + dz * dz || 1;
  let T = 1;
  for (const q of SMK.pts) {
    const r = Math.min(60, 12 + 0.6 * q.t),
      u = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / L2)),
      d = Math.hypot(a.x + dx * u - q.x, a.z + dz * u - q.z);
    if (d < r) T *= 1 - 0.35 * q.d * (1 - q.t / 90) * (1 - d / r);
  }
  return 1 - T;
}

/* ---- THE ENGINEER'S JOBS ---- */
/* the switchboard: close the breakers in order: the generator, the main bus, then the loads (the radar, the sonar) */
const PWR_BRK = ['GENERATOR', 'MAIN BUS', 'RADAR', 'SONAR'];
dcxKind('power', {
  name: 'NO POWER',
  init: (j) => ((j.sel = 0), (j.on = [false, false, false, false])),
  step: (j) => (j.on.every((x) => x) ? ((ENG.pwr = true), engSay('BRIDGE, ENGINE ROOM. POWER RESTORED.'), 'done') : null),
  key(j, Q, E, SP, rep) {
    if (rep) return;
    if (Q || E) return void (j.sel = (j.sel + (E ? 1 : -1) + 4) % 4);
    if (j.on[j.sel]) return;
    const ok = j.sel === 0 || (j.sel === 1 ? j.on[0] : j.on[1]);
    if (ok) return void ((j.on[j.sel] = true), SND.tone(180, 160, 0.15, 0.12, 'square'));
    j.err++;
    SND.tone(140, 100, 0.3, 0.12, 'sawtooth');
    note('BREAKER TRIPS - ' + (j.on[0] ? 'CLOSE THE MAIN BUS FIRST' : 'CLOSE THE GENERATOR FIRST'));
    if (j.hc) j.on.fill(false); /* Hardcore: the surge trips the lot */
  },
  text: (j) => 'THE MAIN SWITCHBOARD HAS TRIPPED: THE RADAR AND THE SONAR ARE DEAD. <b>Q / E</b> CHOOSE A BREAKER, <b>Space</b> CLOSE IT: THE GENERATOR, THE MAIN BUS, THEN THE LOADS.',
  draw(g, w, h, j) {
    PWR_BRK.forEach((n, i) => {
      const x = 30 + i * ((w - 60) / 4),
        bw = (w - 60) / 4 - 14,
        sel = i === j.sel;
      g.fillStyle = '#26323a';
      g.fillRect(x, 20, bw, 90);
      g.strokeStyle = sel ? '#ffd27a' : '#55636b';
      g.lineWidth = sel ? 3 : 1;
      g.strokeRect(x, 20, bw, 90);
      g.fillStyle = j.on[i] ? '#8fe39a' : '#ff8a6a';
      g.fillRect(x + bw / 2 - 6, j.on[i] ? 34 : 70, 12, 26); /* the handle: up is closed */
      g.fillStyle = sel ? '#ffd27a' : '#b8c4c8';
      g.textAlign = 'center';
      g.fillText(n, x + bw / 2, 128);
      g.fillText(j.on[i] ? 'CLOSED' : 'OPEN', x + bw / 2, 143);
    });
    g.textAlign = 'left';
  },
});
/* the holed fuel tank: find it on the board (Q / E), isolate it and transfer its oil (Space) */
const FUEL_TK = ['NO. 1 PORT', 'NO. 1 STBD', 'NO. 2 PORT', 'NO. 2 STBD'];
dcxKind('fuel', {
  name: 'FUEL LEAK',
  init: (j) => ((j.sel = 0), (j.tank = ENG.tank || 0), (j.ph = 0), (j.x = 0)),
  step(j, dt) {
    if (j.ph === 1 && (j.x += dt / (j.hc ? 12 : 6)) >= 1) {
      ENG.leak = 0;
      if (j.hc) ENG.fuel = Math.max(0, ENG.fuel - 0.03); /* what was in the tank above the hole */
      return 'done';
    }
    return null;
  },
  key(j, Q, E, SP, rep) {
    if (rep || j.ph) return;
    if (Q || E) return void (j.sel = (j.sel + (E ? 1 : -1) + 4) % 4);
    if (j.sel === j.tank) ((j.ph = 1), note('TANK ISOLATED - TRANSFERRING ITS OIL'), SND.tone(260, 240, 0.25, 0.1, 'square'));
    else ((j.err += 1), note('THAT TANK IS SOUND - THE GAUGE THAT FALLS IS THE ONE'), SND.tone(140, 120, 0.15, 0.08, 'sawtooth'));
  },
  text: (j) =>
    j.ph === 0
      ? 'A FUEL TANK IS HOLED: WATCH THE GAUGES. <b>Q / E</b> CHOOSE THE TANK WHOSE LEVEL FALLS, <b>Space</b> ISOLATE IT AND TRANSFER ITS OIL.'
      : 'TRANSFERRING ' + Math.round(j.x * 100) + '%.',
  draw(g, w, h, j) {
    FUEL_TK.forEach((n, i) => {
      const x = 30 + i * ((w - 60) / 4),
        bw = (w - 60) / 4 - 14,
        lv = Math.max(0, Math.min(1, ENG.fuel - (i === j.tank ? (j.ph ? j.x * 0.4 : ((j.t * 0.37) % 1) * 0.2) : 0))),
        sel = i === j.sel && j.ph === 0;
      g.fillStyle = '#1c2a33';
      g.fillRect(x, 16, bw, 100);
      g.fillStyle = '#7a6a3a';
      g.fillRect(x, 16 + 100 * (1 - lv), bw, 100 * lv);
      g.strokeStyle = sel ? '#ffd27a' : '#55636b';
      g.lineWidth = sel ? 3 : 1;
      g.strokeRect(x, 16, bw, 100);
      g.fillStyle = sel ? '#ffd27a' : '#b8c4c8';
      g.textAlign = 'center';
      g.fillText(n, x + bw / 2, 134);
    });
    g.textAlign = 'left';
  },
});
/* the smoke generator in action: keep the fog oil flow in the band (Q / E) until the bridge secures it */
dcxKind('smoke', {
  name: 'MAKING SMOKE',
  init: () => {},
  step: () => (SMK.on ? null : 'done'),
  key(j, Q, E) {
    if (Q || E) SMK.f = Math.max(0, Math.min(1, SMK.f + (E ? 0.02 : -0.02)));
  },
  text: () => 'FOG OIL FLOW <b>Q / E</b> &middot; SMOKE <b style="color:' + (SMK.dens > 0.7 ? '#8fe39a' : '#ff8a6a') + '">' + (SMK.dens > 0.7 ? 'THICK' : SMK.f > SMK.c ? 'TOO RICH' : 'THIN') + '</b> &middot; FOG OIL ' + Math.round(SMK.oil * 100) + '%',
  draw: (g, w, h) => smkBar(g, w, SMK, drillHC()),
});
/* the burner's band and the flow (the drill's picture too) */
function smkBar(g, w, o, hc) {
  const x0 = 30,
    bw = w - 60,
    half = hc ? 0.09 : 0.14;
  g.fillStyle = '#1c2a33';
  g.fillRect(x0, 60, bw, 18);
  g.fillStyle = '#2f7d3f';
  g.fillRect(x0 + bw * (o.c - half), 60, bw * half * 2, 18);
  g.fillStyle = '#ffd27a';
  g.fillRect(x0 + bw * o.f - 2, 54, 4, 30);
  g.fillStyle = '#b8c4c8';
  g.font = '12px monospace';
  g.fillText('LEAN', x0, 100);
  g.textAlign = 'right';
  g.fillText('RICH', x0 + bw, 100);
  g.textAlign = 'left';
  g.fillText('FOG OIL FLOW (KEEP IT IN THE GREEN)', x0, 46);
  g.fillStyle = 'rgba(220,220,214,' + (0.15 + 0.7 * (o.dens || 0)) + ')';
  g.fillRect(x0, 112, bw * (o.dens || 0), 14);
}
/* the engineer's lines on the HUD */
const engHUD = () =>
  '<br>FUEL <b>' + Math.round(ENG.fuel * 100) + '%</b> (' + Math.round(engRange(Math.abs(SHIP.u) / 0.5144)) + ' nm)' + (ENG.leak > 0 ? ' <b style="color:#ff8a6a">LEAKING</b>' : '') +
  ' &middot; POWER ' + (ENG.pwr ? 'ON' : '<b style="color:#ff8a6a">OFF</b>') +
  (ENG.heat > 0.95 ? ' &middot; <b style="color:#ff8a6a">HOT</b>' : '') +
  (SMK.on ? ' &middot; <b>MAKING SMOKE</b>' : '');
