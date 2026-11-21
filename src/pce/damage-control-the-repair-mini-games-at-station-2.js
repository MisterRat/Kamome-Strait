/* =====================================================================================================================
   DAMAGE CONTROL AT STATION 2 (the user's, 2026-11-21): the engineer's repair jobs, as quick mini-games. Used by the Damage
   Control drill and, in action, whenever her battle damage (SDM) brings a job while the player is in the engine room; away from
   it the repair parties (the AI) do the work as before.
     pipe   a burst pipe: find its valve (Q / E, Space shuts it), then the wrench: three good turns (Space in the green)
     flood  a hole: two timbers wedged home (Space in the green), then the pumps (Space)
     fire   the hose: keep the nozzle (Q / E) on the flames until they are out
     list   counter-flooding: Q / E open the port or starboard tank valves; bring her upright and shut them
     cool   the cooling water: the sea strainer clogs; shift to the standby strainer (Space) before the engines cook
   Normal: a finished job is a finished repair. Hardcore, the real system: the water and the fire keep growing while you work,
   the windows are narrow, a slip costs, a job only partly mends her (the holes, the fire and the engines in SDM), and while the
   player has the engine room the repair parties leave it to him.
   ===================================================================================================================== */
var DCX = { L: [] /* the jobs waiting, the first being worked: { k, ph, t, ... } */, msgT: 0 };
const DCX_NAME = { pipe: 'BURST PIPE', flood: 'FLOODING', fire: 'FIRE', list: 'LIST', cool: 'COOLING WATER' };
const DCX_PIPES = ['FIRE MAIN', 'LUBE OIL', 'SALT WATER', 'FUEL OIL'];
/* a new job; o: { hc } (the drill's or the game's Hardcore) */
function dcxAdd(k, hc) {
  if (DCX.L.some((j) => j.k === k)) return;
  const j = { k, ph: 0, t: 0, hc: !!hc, err: 0, peak: 0 };
  if (k === 'pipe') ((j.pipe = Math.floor(Math.random() * 4)), (j.sel = 0), (j.turns = 0));
  if (k === 'flood') ((j.water = 0.15), (j.tim = 0));
  if (k === 'fire') ((j.fire = 0.5), (j.fx = Math.random()), (j.nz = 0.5), (j.fv = 0.15));
  if (k === 'list') ((j.L = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 4)), (j.v = 0), (j.ok = 0));
  if (k === 'cool') ((j.temp = 82), (j.peak = 82));
  if (k === 'pipe' || k === 'flood') j.bar = barMake({ hc: j.hc }, 0.22);
  DCX.L.push(j);
  SND.tone(520, 380, 0.4, 0.1, 'sawtooth');
  return j;
}
/* the live jobs (in action) are shown when the player is in the engine room and no drill is running */
const dcxLive = () => SHIP.stn === 2 && camMode == 1 && !DRILL.on && DCX.L.length > 0;
/* Hardcore and the player in the engine room with jobs: he is the damage control party (sdmStep leaves the repairs to him) */
const dcxManned = () => dcxLive() && drillHC();
/* each frame: the job being worked; returns it when it is done (the caller scores it) */
function dcxStep(dt) {
  const j = DCX.L[0];
  if (!j) return null;
  j.t += dt;
  const hc = j.hc;
  if (j.bar) barStep(j.bar, dt);
  if (j.k === 'pipe') {
    if (hc) j.spill = (j.spill || 0) + dt; /* the water pours in until it is shut */
  } else if (j.k === 'flood') {
    if (j.ph < 2) j.water = Math.min(1, j.water + (hc ? 0.012 : 0.005) * dt);
    else if ((j.water -= (hc ? 0.03 : 0.08) * dt) <= 0) return dcxDone(j);
  } else if (j.k === 'fire') {
    j.fx = Math.max(0.05, Math.min(0.95, j.fx + j.fv * dt));
    if (Math.random() < dt * 0.5) j.fv = (Math.random() - 0.5) * (hc ? 0.5 : 0.3);
    const on = Math.abs(j.nz - j.fx) < 0.09;
    j.fire = Math.max(0, Math.min(1, j.fire + (on ? -(hc ? 0.09 : 0.16) : hc ? 0.05 : 0.02) * dt));
    j.peak = Math.max(j.peak, j.fire);
    if (j.fire <= 0) return dcxDone(j);
    if (j.fire >= 1 && hc) return dcxDone(j, true); /* out of hand: the compartment is closed off and smothered */
  } else if (j.k === 'list') {
    j.L += (j.v * 0.9 + Math.sin(j.t * 0.7) * 0.15) * dt;
    if (Math.abs(j.L) < 1 && j.v === 0) {
      if ((j.ok += dt) > 3) return dcxDone(j);
    } else j.ok = 0;
    j.peak = Math.max(j.peak, Math.abs(j.L));
  } else if (j.k === 'cool') {
    if (j.ph === 0) j.temp += (hc ? 1.3 : 0.9) * dt;
    else if ((j.temp -= 2.5 * dt) <= 72) return dcxDone(j);
    j.peak = Math.max(j.peak, j.temp);
    if (j.temp >= 100) return dcxDone(j, true); /* the engines are stopped to save them */
  }
  return null;
}
function dcxDone(j, failed) {
  DCX.L.shift();
  j.failed = !!failed;
  SND.tone(failed ? 300 : 660, failed ? 200 : 990, 0.25, 0.1, failed ? 'sawtooth' : 'sine');
  note(DCX_NAME[j.k] + (failed ? ' - NOT HELD' : ' - DONE'));
  if (j.onDone) j.onDone(j);
  return j;
}
/* the keys for the job being worked: true when used */
function dcxKey(code, rep) {
  const j = DCX.L[0];
  if (!j) return false;
  const Q = code === 'KeyQ',
    E = code === 'KeyE',
    SP = code === 'Space';
  if (!Q && !E && !SP) return false;
  if (j.k === 'fire') {
    if (Q || E) j.nz = Math.max(0, Math.min(1, j.nz + (E ? 0.035 : -0.035)));
    return true;
  }
  if (rep) return true;
  if (j.k === 'pipe') {
    if (j.ph === 0) {
      if (Q || E) j.sel = (j.sel + (E ? 1 : -1) + 4) % 4;
      else if (j.sel === j.pipe) ((j.ph = 1), note('VALVE SHUT - NOW THE WRENCH'), SND.tone(300, 260, 0.2, 0.08, 'square'));
      else ((j.err += 1), (j.t += j.hc ? 6 : 3), note('WRONG VALVE - THAT IS THE ' + DCX_PIPES[j.sel]));
    } else if (SP) {
      if (barHit(j.bar)) ((j.turns += 1), SND.tone(200, 180, 0.12, 0.12, 'square'), (j.bar.c = 0.2 + Math.random() * 0.6));
      else ((j.err += 1), j.hc && j.turns > 0 && (j.turns -= 1), SND.tone(140, 120, 0.15, 0.08, 'sawtooth'));
      if (j.turns >= 3) dcxFinish(j);
    }
  } else if (j.k === 'flood') {
    if (j.ph === 0 && SP) {
      if (barHit(j.bar)) ((j.tim += 1), SND.tone(160, 150, 0.12, 0.12, 'square'), (j.bar.c = 0.2 + Math.random() * 0.6));
      else ((j.err += 1), SND.tone(140, 120, 0.15, 0.08, 'sawtooth'));
      if (j.tim >= 2) ((j.ph = 1), note('SHORED - START THE PUMPS'));
    } else if (j.ph === 1 && SP) ((j.ph = 2), note('PUMPS ON'), SND.tone(90, 110, 0.6, 0.12, 'sawtooth'));
  } else if (j.k === 'list') {
    if (Q || E) j.v = Math.max(-3, Math.min(3, j.v + (E ? 1 : -1)));
  } else if (j.k === 'cool') {
    if (SP && j.ph === 0) ((j.ph = 1), (j.resp = j.t), note('SHIFTED TO THE STANDBY STRAINER'), SND.tone(300, 320, 0.2, 0.08, 'square'));
  }
  return true;
}
/* a job's last step done: it is scored by whoever set it */
function dcxFinish(j) {
  if (DCX.L[0] === j) dcxDone(j);
}
/* the words for the job being worked */
function dcxText() {
  const j = DCX.L[0];
  if (!j) return 'ALL JOBS DONE.';
  const more = DCX.L.length > 1 ? ' <span style="color:#9aa">(' + (DCX.L.length - 1) + ' MORE WAITING)</span>' : '';
  const H = '<b style="font-size:16px;color:#ff8a6a">' + DCX_NAME[j.k] + '</b>' + more + '<br>';
  if (j.k === 'pipe')
    return H + (j.ph === 0 ? 'BURST: THE <b>' + DCX_PIPES[j.pipe] + '</b> LINE. <b>Q / E</b> FIND ITS VALVE, <b>Space</b> SHUT IT.' : 'THE WRENCH: <b>Space</b> WHEN THE MARKER IS IN THE GREEN. TURNS ' + j.turns + '/3.');
  if (j.k === 'flood')
    return H + (j.ph === 0 ? 'SHORE THE HOLE: <b>Space</b> IN THE GREEN TO DRIVE EACH TIMBER HOME. TIMBERS ' + j.tim + '/2.' : j.ph === 1 ? '<b>Space</b>: START THE PUMPS.' : 'PUMPING OUT. WATER ' + Math.round(j.water * 100) + '%.');
  if (j.k === 'fire') return H + 'THE HOSE: <b>Q / E</b> KEEP THE NOZZLE ON THE FLAMES. FIRE ' + Math.round(j.fire * 100) + '%.';
  if (j.k === 'list') return H + 'COUNTER-FLOOD: <b>Q / E</b> OPEN THE PORT / STARBOARD TANKS. BRING HER UPRIGHT, THEN SHUT THEM. LIST ' + Math.abs(j.L).toFixed(1) + '&deg; ' + (j.L < 0 ? 'PORT' : 'STBD') + '.';
  if (j.k === 'cool') return H + (j.ph === 0 ? 'THE ENGINES ARE HEATING: THE SEA STRAINER IS CLOGGED. <b>Space</b>: SHIFT TO THE STANDBY STRAINER.' : 'COOLING DOWN.') + ' WATER OUT ' + Math.round(j.temp) + '&deg;C.';
  return H;
}
/* the job's picture */
function dcxDraw(g, w, h) {
  const j = DCX.L[0];
  if (!j) return;
  g.font = '12px monospace';
  g.textAlign = 'left';
  if (j.k === 'pipe') {
    /* four lines across the bulkhead, each with its valve wheel; the burst one sprays */
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * ((w - 80) / 3),
        sel = j.ph === 0 && i === j.sel;
      g.strokeStyle = '#6a7a84';
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(x, 10);
      g.lineTo(x, h - 40);
      g.stroke();
      g.strokeStyle = sel ? '#ffd27a' : i === j.pipe && j.ph > 0 ? '#8fe39a' : '#b8c4c8';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, 55, 13, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = sel ? '#ffd27a' : '#b8c4c8';
      g.textAlign = 'center';
      g.fillText(DCX_PIPES[i], x, h - 24);
      if (i === j.pipe && j.ph === 0)
        for (let k = 0; k < 14; k++) {
          g.fillStyle = 'rgba(190,220,255,' + (0.4 + Math.random() * 0.5) + ')';
          g.fillRect(x + 6 + Math.random() * 40, 85 + (Math.random() - 0.5) * 30, 3, 3);
        }
    }
    g.textAlign = 'left';
    if (j.ph === 1) {
      g.fillStyle = 'rgba(11,18,24,.85)';
      g.fillRect(0, h - 38, w, 38);
      drillBar(g, w, h, h - 18, j.bar, 'WRENCH - TURN ' + (j.turns + 1) + ' OF 3');
    }
  } else if (j.k === 'flood') {
    g.fillStyle = '#1d4766';
    g.fillRect(0, h * (1 - j.water * 0.8), w, h);
    g.fillStyle = '#5a4630';
    for (let i = 0; i < j.tim; i++) g.fillRect(w * 0.42 + i * 26, 20, 14, h * 0.5);
    g.fillStyle = '#0b0f12';
    g.beginPath();
    g.arc(w * 0.5, h * 0.4, 18, 0, Math.PI * 2);
    g.fill();
    if (j.ph === 0) drillBar(g, w, h, h - 18, j.bar, 'DRIVE TIMBER ' + (j.tim + 1) + ' OF 2');
  } else if (j.k === 'fire') {
    const fx = 20 + j.fx * (w - 40),
      nx = 20 + j.nz * (w - 40);
    for (let k = 0; k < 30 * j.fire + 4; k++) {
      g.fillStyle = 'rgba(255,' + Math.floor(90 + Math.random() * 120) + ',30,' + (0.3 + Math.random() * 0.5) + ')';
      g.fillRect(fx + (Math.random() - 0.5) * (30 + 60 * j.fire), h - 20 - Math.random() * 70 * (0.3 + j.fire), 5, 5);
    }
    g.strokeStyle = 'rgba(200,230,255,.8)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(nx, 0);
    g.lineTo(nx, h - 30);
    g.stroke();
    g.fillStyle = '#9fc3d6';
    g.fillRect(nx - 8, 0, 16, 10);
  } else if (j.k === 'list') {
    const a = (j.L * Math.PI) / 180;
    g.save();
    g.translate(w / 2, h * 0.62);
    g.rotate(a);
    g.fillStyle = '#6a7a84';
    g.fillRect(-90, -10, 180, 30);
    g.fillRect(-20, -45, 40, 35);
    g.restore();
    g.strokeStyle = '#2f7d3f';
    g.beginPath();
    g.moveTo(w / 2, 6);
    g.lineTo(w / 2, h - 6);
    g.stroke();
    g.fillStyle = '#b8c4c8';
    g.fillText('PORT TANKS ' + (j.v < 0 ? 'OPEN ' + -j.v : 'SHUT'), 10, 16);
    g.textAlign = 'right';
    g.fillText('STBD TANKS ' + (j.v > 0 ? 'OPEN ' + j.v : 'SHUT'), w - 10, 16);
    g.textAlign = 'left';
  } else if (j.k === 'cool') {
    const f = Math.max(0, Math.min(1, (j.temp - 60) / 45));
    g.fillStyle = '#1c2a33';
    g.fillRect(40, h - 30, w - 80, 16);
    g.fillStyle = j.temp > 92 ? '#ff6a4a' : j.temp > 85 ? '#ffd27a' : '#8fe39a';
    g.fillRect(40, h - 30, (w - 80) * f, 16);
    g.fillStyle = '#b8c4c8';
    g.fillText('COOLING WATER OUT ' + Math.round(j.temp) + ' C   (ALARM 85, STOP ENGINES 100)', 40, h - 38);
  }
}
