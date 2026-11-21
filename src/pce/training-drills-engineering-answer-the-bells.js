/* ---- ENGINEERING DRILL: ANSWER THE BELLS. The bridge rings a string of engine orders on the telegraph; the player is the throttleman:
   W / S move the engine room's answering lever a sector at a time (BACK FULL to FLANK) and the engines follow it. Each order is
   timed from its bell to the moment the answer matches it: within 4 s is smart, within 8 s acceptable (Hardcore: 3 and 6), and a
   lever put the wrong way first is counted. Ten orders. While the player holds the lever the engine room's own answer (engStep) is
   his, not the AI's ---- */
const TELV = [-0.5, -0.25, -0.1, 0, 0.2, 0.45, 0.7, 0.9, 1] /* a value in each telegraph sector (telIdx) */;
DRILLS.push({
  id: 'bells',
  stn: 2,
  title: 'Answer the bells',
  what: 'The bridge rings ten engine orders. Answer each with W / S on the throttle lever, quickly and the right way.',
  start(D) {
    D.n = 0;
    D.res = [];
    D.wait = 3;
    ENG.man = telIdx(ENG.ans); /* the lever, where the engines are now */
    D.prev = ENG.man;
  },
  stop() {
    ENG.man = null;
  },
  ring(D) {
    /* a new order: never the same sector, mostly ahead, now and then astern or stop */
    let i;
    do i = Math.random() < 0.7 ? 4 + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 4);
    while (i === telIdx(SHIP.tel));
    SHIP.tel = TELV[i];
    D.o = { i, t0: D.t, wrong: false, from: ENG.man };
    D.n++;
  },
  step(D, dt) {
    if (!D.o) {
      if ((D.wait -= dt) <= 0) this.ring(D);
      return;
    }
    const o = D.o,
      lim = D.hc ? [3, 6] : [4, 8];
    if (ENG.man === o.i) {
      const s = D.t - o.t0;
      D.res.push({ s, wrong: o.wrong });
      note(s <= lim[0] ? 'ANSWERED - SMART' : s <= lim[1] ? 'ANSWERED' : 'ANSWERED - SLOW');
      D.o = null;
      D.wait = 4 + Math.random() * 6;
      if (D.n >= 10) this.finish(D);
    } else if (D.t - o.t0 > 20) {
      D.res.push({ s: 20, wrong: o.wrong, miss: true });
      note('NOT ANSWERED');
      ENG.man = o.i; /* the chief takes the lever */
      D.o = null;
      D.wait = 4;
      if (D.n >= 10) this.finish(D);
    }
  },
  finish(D) {
    const lim = D.hc ? [3, 6] : [4, 8],
      R = D.res,
      smart = R.filter((r) => !r.miss && r.s <= lim[0]).length,
      ok = R.filter((r) => !r.miss && r.s > lim[0] && r.s <= lim[1]).length,
      slow = R.filter((r) => !r.miss && r.s > lim[1]).length,
      miss = R.filter((r) => r.miss).length,
      wrong = R.filter((r) => r.wrong).length,
      avg = R.reduce((a, r) => a + r.s, 0) / R.length;
    drillEnd(D, smart * 10 + ok * 7 + slow * 3 - wrong * 3, [
      'ORDERS ' + R.length + ': <b>' + smart + '</b> SMART, ' + ok + ' ACCEPTABLE, ' + slow + ' SLOW' + (miss ? ', <b style="color:#ff8a6a">' + miss + ' NOT ANSWERED</b>' : ''),
      'AVERAGE ' + avg.toFixed(1) + ' S TO ANSWER (SMART WITHIN ' + lim[0] + ' S)' + (wrong ? ' &middot; <b style="color:#ff8a6a">' + wrong + ' TIMES THE WRONG WAY FIRST</b>' : ''),
    ]);
  },
  key(D, code, rep) {
    if (code !== 'KeyW' && code !== 'KeyS' && code !== 'ArrowUp' && code !== 'ArrowDown') return false;
    if (rep) return true;
    const up = code === 'KeyW' || code === 'ArrowUp',
      was = ENG.man;
    ENG.man = Math.max(0, Math.min(8, ENG.man + (up ? 1 : -1)));
    SND.tone(420, 400, 0.08, 0.06, 'square');
    if (D.o && Math.abs(ENG.man - D.o.i) > Math.abs(was - D.o.i)) D.o.wrong = true;
    return true;
  },
  box(D) {
    const o = D.o;
    return (
      (o ? 'BELL: <b style="font-size:17px;color:#ffd27a">' + TEL[o.i].replace('\n', ' ') + '</b> &middot; ' + (D.t - o.t0).toFixed(1) + ' S' : 'STAND BY FOR THE NEXT BELL') +
      '<br>YOUR LEVER: <b>' + TEL[ENG.man].replace('\n', ' ') + '</b> &middot; ORDER ' + D.n + '/10 &middot; <b>W / S</b> MOVE THE LEVER'
    );
  },
  draw(D, g, w, h) {
    /* the two dials side by side: the bridge's order and the answer */
    for (const [k, lab, i] of [
      [0, 'BRIDGE ORDER', D.o ? D.o.i : telIdx(SHIP.tel)],
      [1, 'YOUR ANSWER', ENG.man],
    ]) {
      const cx = w * (0.28 + k * 0.44),
        cy = h * 0.62,
        r = h * 0.48;
      g.strokeStyle = '#6a7a84';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, r, Math.PI, 2 * Math.PI);
      g.stroke();
      for (let j = 0; j < 9; j++) {
        const a = Math.PI + ((j + 0.5) / 9) * Math.PI;
        g.fillStyle = j === i ? (k ? '#8fe39a' : '#ffd27a') : '#55636b';
        g.font = (j === i ? 'bold ' : '') + '10px monospace';
        g.textAlign = 'center';
        g.fillText(TEL[j].replace('\n', ' '), cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78 + 4);
      }
      const a = Math.PI + ((i + 0.5) / 9) * Math.PI;
      g.strokeStyle = k ? '#8fe39a' : '#ffd27a';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      g.stroke();
      g.fillStyle = '#b8c4c8';
      g.font = '11px monospace';
      g.fillText(lab, cx, h - 4);
    }
    g.textAlign = 'left';
  },
});
