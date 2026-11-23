/* ---- ENGINEERING DRILL: DAMAGE CONTROL. Four casualties in the engine room, one after another (drawn from a burst pipe, a hole,
   a fire, a list and the cooling water: the jobs of DAMAGE CONTROL AT STATION 2). Each job is marked out of 25: its time against
   the par, its mistakes, and for the fire, the list and the cooling water how far it got; a job not held scores nothing ---- */
const DC_PAR = { pipe: 14, flood: 16, fire: 15, list: 18, cool: 6 };
DRILLS.push({
  id: 'dc',
  stn: 2,
  title: 'Damage control',
  what: 'Four casualties in the engine room: burst pipes, holes, fires, a list, the cooling water. Work each one to the end.',
  start(D) {
    DCX.L.length = 0;
    const K = ['pipe', 'flood', 'fire', 'list', 'cool'].sort(() => Math.random() - 0.5);
    D.q = K.slice(0, 4);
    D.done = [];
    D.wait = 3;
  },
  stop() {
    DCX.L.length = 0;
  },
  step(D, dt) {
    if (!DCX.L.length) {
      if (D.done.length >= 4) return this.finish(D);
      if ((D.wait -= dt) <= 0) {
        const j = dcxAdd(D.q[D.done.length], D.hc);
        j.onDone = (j) => {
          D.done.push(j);
          D.wait = 5;
        };
        drillSay('ENGINE ROOM', 'CASUALTY: ' + DCX_NAME[j.k] + '!');
      }
      return;
    }
    dcxStep(dt);
  },
  finish(D) {
    let sc = 0;
    const lines = D.done.map((j) => {
      let m = 0;
      if (!j.failed) {
        m = drillMark(j.t, DC_PAR[j.k], DC_PAR[j.k] * 3, 17) + Math.max(0, 8 - 3 * j.err);
        if (j.k === 'fire') m -= 6 * Math.max(0, j.peak - 0.5);
        if (j.k === 'list') m -= Math.max(0, j.peak - 9);
        if (j.k === 'cool') m -= 0.6 * Math.max(0, j.peak - 85);
      }
      m = Math.max(0, Math.min(25, m));
      sc += m;
      const extra = j.k === 'fire' ? ', PEAK ' + Math.round(j.peak * 100) + '%' : j.k === 'cool' ? ', PEAK ' + Math.round(j.peak) + '&deg;C' : j.k === 'list' ? ', WORST ' + j.peak.toFixed(1) + '&deg;' : '';
      return DCX_NAME[j.k] + ': ' + (j.failed ? '<b style="color:#ff8a6a">NOT HELD</b>' : fmtT(j.t) + ' (PAR ' + fmtT(DC_PAR[j.k]) + ')' + (j.err ? ', ' + j.err + ' SLIPS' : '') + extra) + ' &middot; <b>' + Math.round(m) + '</b>/25';
    });
    drillEnd(D, sc, lines);
  },
  key(D, code, rep) {
    return dcxKey(code, rep);
  },
  box(D) {
    return DCX.L.length ? dcxText() : D.done.length >= 4 ? 'ALL CASUALTIES DEALT WITH.' : 'STAND BY... (' + D.done.length + '/4 DONE)';
  },
  draw(D, g, w, h) {
    dcxDraw(g, w, h);
  },
});
/* ---- in action: her battle damage brings the jobs to the player when he is in the engine room (sdmHit calls this) ---- */
/* a repair job for the damage she has, with what it mends when done (each tells the bridge what it did) */
function dcxJob(k) {
  const hc = drillHC(),
    j = dcxAdd(k, hc);
  if (!j) return;
  const fix = {
    flood: () => {
      SDM.holes = Math.max(0, SDM.holes - (hc ? 0.6 : 1.5));
      SDM.pump = hc ? 20 : 40; /* the pumps the player started */
      return SDM.holes > 0 ? 'HOLE SHORED, PUMPS ON. MORE HOLES TO SHORE.' : 'ALL HOLES SHORED, PUMPS ON.';
    },
    fire: () => {
      SDM.fire = hc ? SDM.fire * 0.3 : 0;
      if (SDM.fire < 0.05) SDM.fire = 0;
      return SDM.fire ? 'FIRE KNOCKED DOWN.' : 'THE FIRE IS OUT.';
    },
    pipe: () => {
      SDM.eng = Math.max(0, SDM.eng - (hc ? 0.15 : 0.3));
      return SDM.eng > 0 ? 'ENGINE REPAIRED IN PART: ' + Math.round(SDM.eng * 100) + '% DAMAGE LEFT.' : 'ENGINES REPAIRED. FULL POWER AVAILABLE.';
    },
  }[k];
  j.onDone = (j) => !j.failed && sdmSay('BRIDGE, ENGINE ROOM. ' + fix());
}
function dcxFromHit(kind, fire, eng) {
  if (SHIP.stn !== 2 || camMode != 1 || DRILL.on || !DM.on) return;
  if (kind !== 'small') dcxJob('flood');
  if (fire) dcxJob('fire');
  if (eng) dcxJob('pipe');
  if (DCX.msgT <= 0) ((DCX.msgT = 20), drillSay('ENGINE ROOM', 'DAMAGE IN THE ENGINE ROOM. YOU HAVE THE REPAIRS.'));
}
/* each frame in action: the jobs at station 2; leave it and the repair parties take them over */
function dcxLiveStep(dt) {
  DCX.msgT = Math.max(0, DCX.msgT - dt);
  if (DRILL.on) return;
  if (SHIP.stn !== 2 || camMode != 1) {
    if (DCX.L.length) DCX.L.length = 0;
    return;
  }
  /* the damage she already has (from before the player came down, or left after a job): a job for each kind of it, until it is
     all mended (the user's, 2026-11-23: arriving after the hits, there were no jobs for them and nothing was mended) */
  if (DM.on && started && !SDM.lost && (DCX.chk = (DCX.chk || 0) - dt) <= 0) {
    DCX.chk = 1;
    if (SDM.holes > 0.05) dcxJob('flood');
    if (SDM.fire > 0) dcxJob('fire');
    if (SDM.eng > 0.02) dcxJob('pipe');
  }
  /* a heavy list: counter-flood */
  if (SDM.flood > 0.15 && !SDM.cf && !DCX.L.some((j) => j.k === 'list') && started && !SDM.lost) {
    const j = dcxAdd('list', drillHC());
    j.L = (SDM.lst || 1) * (4 + 20 * sdmList());
    j.onDone = (j) => !j.failed && (SDM.cf = drillHC() ? 0.6 : 0.85);
  }
  if (DCX.L.length && started && !paused) dcxStep(dt);
}
