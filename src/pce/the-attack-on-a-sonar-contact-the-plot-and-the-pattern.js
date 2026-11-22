/* ---- THE ATTACK ON A SONAR CONTACT: what the OOD's attack drill, the OOD's attack in action (OODO) and the AI OOD all use.
   A point relative to her (ahead along her course, across to starboard, in yards); the pattern's best moment (the charges sink about
   8 ft a second, so the first, off the stern about 30 m abaft her middle, must go while he is still ahead by her run in that time);
   the depth set on every charge; the pattern the torpedomen roll (rack, starboard K-gun, port K-gun, rack over 14 s); the plot ---- */
function aswRelTo(p) {
  const fw = { x: -Math.sin(SHIP.hdg), z: -Math.cos(SHIP.hdg) },
    dx = p.x - pos.x,
    dz = p.z - pos.z;
  return { al: (dx * fw.x + dz * fw.z) / 0.9144, cr: (dx * -fw.z + dz * fw.x) / 0.9144 };
}
const aswBest = (ft) => (SHIP.u * (ft / 8) - 30) / 0.9144;
function aswArm(ft) {
  for (const k of ['rack', 'port', 'stbd']) ((DC.dep[k] = ft), (DC.arm[k] = true));
}
const ASWPAT = [
  ['rack', 0],
  ['stbd', 4],
  ['port', 8],
  ['rack', 14],
];
/* the pattern rolling: pat { t0, ... } marks each charge as it goes; true when all four are away */
function aswPatStep(pat, t) {
  for (const [k, at] of ASWPAT) if (t - pat.t0 >= at && !pat[k + at]) ((pat[k + at] = 1), dcFire(k));
  return t - pat.t0 >= 14;
}
/* the plot, ship's head up: her, the Hedgehog's landing ring 250 yd ahead, and E (a point: where sonar puts him), or nothing */
function aswHeadUp(g, w, h, E) {
  const cx = w / 2,
    cy = h * 0.8,
    sc = (h * 0.75) / 1400;
  g.strokeStyle = '#2c4250';
  for (const R of [250, 500, 1000]) {
    g.beginPath();
    g.arc(cx, cy, R * sc, Math.PI, 2 * Math.PI);
    g.stroke();
  }
  g.fillStyle = '#9fc3d6';
  g.fillRect(cx - 2, cy - 8, 4, 16);
  g.strokeStyle = 'rgba(255,210,122,.6)';
  g.beginPath();
  g.arc(cx, cy - 250 * sc, 13 * sc * 3, 0, Math.PI * 2);
  g.stroke();
  if (E) {
    const r = aswRelTo(E);
    g.fillStyle = '#ff8a6a';
    g.beginPath();
    g.arc(cx + r.cr * sc, cy - r.al * sc, 4, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#6a7a84';
  g.font = '10px monospace';
  g.fillText('250', cx + 3, cy - 250 * sc - 3);
  g.fillText('500', cx + 3, cy - 500 * sc - 3);
  g.fillText('1000 YD', cx + 3, cy - 1000 * sc - 3);
}
/* the assessment of an attack (the drill's and the OOD's in action): A { yd: the nearest charge to him (yd, 1e9 none), hits: the
   Hedgehog's, sunk, hh: where he was when it was fired (aswRelTo) or null, pat: { rel, best } or null, one: either weapon alone is
   enough (in action: the one used is marked for both; the drill wants both) } -> { v, s (0..100), lines } */
function aswAssess(A) {
  const yd = A.yd,
    v = A.sunk || A.hits > 0 || yd <= 25 ? 'KILL' : yd <= 60 ? 'DAMAGED' : 'MISSED',
    H = A.hh,
    P = A.pat;
  let s = v === 'KILL' ? 60 : v === 'DAMAGED' ? 35 : 0,
    w = 0;
  const k = A.one && !H !== !P ? 2 : 1,
    none = A.one ? '<span style="color:#9aa">NOT USED</span>' : null;
  /* the Hedgehog: he 200 to 300 yd ahead and on the bow; the pattern: her stern (about 50 yd abaft the bridge) over him */
  if (H) w += drillMark(Math.abs(H.al - 250), 40, 200, 12) * (Math.abs(H.cr) < 40 ? 1 : 0.4) + 8;
  if (P) w += drillMark(Math.abs(P.rel.al - P.best), 25, 200, 12) * (Math.abs(P.rel.cr) < 50 ? 1 : 0.4) + 8;
  s += w * k;
  return {
    v,
    s,
    lines: [
      'RESULT: <b>' + v + '</b>' + (A.hits ? ' (' + A.hits + ' HEDGEHOG HITS)' : '') + (yd < 1e8 ? ' &middot; NEAREST CHARGE ' + yd + ' YD' : ''),
      'HEDGEHOG: ' + (H ? 'FIRED WITH HIM ' + Math.round(H.al) + ' YD AHEAD, ' + Math.round(Math.abs(H.cr)) + ' YD ' + (H.cr < 0 ? 'TO PORT' : 'TO STARBOARD') + ' (BEST: 250 AHEAD, DEAD ON THE BOW)' : none || '<b style="color:#ff8a6a">NOT FIRED</b>'),
      'PATTERN: ' + (P ? 'ORDERED WITH HIM ' + Math.round(P.rel.al) + ' YD ' + (P.rel.al >= 0 ? 'AHEAD' : 'ASTERN') + ' (BEST AT HER SPEED AND HIS DEPTH: ' + Math.round(P.best) + ' ' + (P.best >= 0 ? 'AHEAD' : 'ASTERN') + ')' : none || '<b style="color:#ff8a6a">NOT ORDERED</b>'),
    ],
  };
}
