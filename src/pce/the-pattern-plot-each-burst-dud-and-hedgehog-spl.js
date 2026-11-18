/* the pattern plot: each burst, dud and Hedgehog splash, recorded relative to the sub at that moment (his heading up) */
function aswEv(k, p) {
  if (ASW.ph !== 'run' || !PT.on) return;
  const sub = PT.L.find((t) => t.kind === 'sub');
  if (!sub) return;
  const h = Math.atan2(sub.v.x, -sub.v.z) /* his heading: 0 = north (-z) */,
    dx = p.x - sub.p.x,
    dz = p.z - sub.p.z,
    c = Math.cos(h),
    s = Math.sin(h);
  (ASW.ev || (ASW.ev = [])).push({ k, x: dx * c + dz * s, y: dx * s - dz * c /* ahead of him is +y */ });
}
function aswPlot() {
  const W = 220,
    cv = document.createElement('canvas');
  cv.width = cv.height = W;
  const g = cv.getContext('2d'),
    k = W / 240 /* 240 m across */,
    X = (x) => W / 2 + x * k,
    Y = (y) => W / 2 - y * k;
  g.fillStyle = '#0d1a24';
  g.fillRect(0, 0, W, W);
  g.strokeStyle = 'rgba(255,255,255,.12)';
  for (let r = 50; r <= 100; r += 50) (g.beginPath(), g.arc(X(0), Y(0), r * k, 0, 6.3), g.stroke());
  g.setLineDash([3, 3]);
  g.strokeStyle = '#8fe39a';
  g.beginPath();
  g.arc(X(0), Y(0), 23 * k, 0, 6.3); /* lethal: about 25 yards */
  g.stroke();
  g.setLineDash([]);
  /* the sub: 64 m long, heading up */
  g.fillStyle = '#5d6b74';
  g.fillRect(X(-3.5), Y(32), 7 * k, 64 * k);
  g.fillRect(X(-1.5), Y(8), 3 * k, 7 * k);
  for (const e of ASW.ev || []) {
    const x = X(e.x),
      y = Y(e.y);
    if (x < 0 || y < 0 || x > W || y > W) continue;
    if (e.k === 'dc') (g.fillStyle = '#ffb040'), g.beginPath(), g.arc(x, y, 4.5, 0, 6.3), g.fill();
    else if (e.k === 'dud') (g.strokeStyle = '#aaa'), g.beginPath(), g.moveTo(x - 4, y - 4), g.lineTo(x + 4, y + 4), g.moveTo(x + 4, y - 4), g.lineTo(x - 4, y + 4), g.stroke();
    else if (e.k === 'hh') (g.fillStyle = '#7fd3ff'), g.fillRect(x - 1.5, y - 1.5, 3, 3);
    else if (e.k === 'hit') (g.fillStyle = '#ff5050'), g.beginPath(), g.arc(x, y, 4, 0, 6.3), g.fill();
  }
  g.fillStyle = '#9aa';
  g.font = '10px monospace';
  g.fillText('PATTERN ON THE SUB (100 M RINGS)', 6, 12);
  g.fillText('o CHARGE  x DUD  . HEDGEHOG  RED HIT', 6, W - 6);
  return cv.toDataURL();
}
function aswDebrief() {
  const F = ASW.O.filter((o) => o.st !== 'info'),
    ok = F.filter((o) => o.st === 'ok').length,
    late = F.filter((o) => o.st === 'late').length,
    miss = F.filter((o) => o.st === 'miss').length,
    yd = ASW.best,
    v = ASW.hh > 0 || yd <= 25 ? 'KILL' : yd <= 60 ? 'DAMAGED' : ASW.lost ? 'LOST CONTACT, NO ATTACK' : 'MISSED';
  ASW.lost = false;
  ASW.deb =
    'ATTACK ' + ASW.run + ': ' + v + '. ORDERS ' + ok + '/' + F.length + ' ON TIME' + (late ? ', ' + late + ' LATE' : '') + (miss ? ', ' + miss + ' MISSED' : '') + (ASW.un ? ', ' + ASW.un + ' FIRED WITHOUT ORDERS' : '') + '. ' + (ASW.bad ? 'WRONG DEPTH SETTING. ' : 'DEPTH RIGHT. ') + 'HEDGEHOG ' + (ASW.hh ? ASW.hh + ' HIT' + (ASW.hh > 1 ? 'S' : '') : 'NO HITS') + '. CLOSEST CHARGE ' + (yd < 1e8 ? yd + ' YD' : 'NONE') + '.';
  if (v === 'LOST CONTACT, NO ATTACK') ASW.deb = 'ATTACK ' + ASW.run + ': LOST CONTACT - NO ATTACK MADE. SONAR MUST REPORT HIM AT LEAST EVERY 15 SECONDS.';
  if (ASW.dmg) ASW.deb += ' A SHALLOW CHARGE DAMAGED OUR STERN.';
  ASW.dmg = false;
  ASW.plot = aswPlot();
  ASW.debT = performance.now();
  RADIO.add('EXERCISE SUB', v === 'KILL' ? 'YOU GOT ME. SURFACING. EXERCISE COMPLETE.' : v === 'DAMAGED' ? 'CLOSE. I WOULD BE DAMAGED. SURFACING. EXERCISE COMPLETE.' : 'YOU MISSED ME. SURFACING. EXERCISE COMPLETE.');
  note(ASW.deb);
  /* one run a time: the exercise ends (practice targets off) and the score stays up until T is pressed again or the player leaves.
     The crew reload the K-guns, restock the racks and put the safety forks back in */
  DC.kl = [1, 1, 1, 1];
  DC.kg = [2, 2];
  DC.rack = [8, 8];
  DC.arm = { rack: false, port: false, stbd: false };
  ASW.O = [];
  ASW.msg = '';
  SHIP.hold = SHIP.hdg;
  ASW.ph = 'done';
  if (PT.on && ASW.who !== 'comms') ptToggle();
}
