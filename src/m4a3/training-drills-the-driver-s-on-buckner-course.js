/* THE DRIVER'S TRAINING DRILLS (station 4, PLAN_M4A3_Sherman_Tank 11), on the shared drill framework (DRILLS, drillEnd, drillMark): at
   the driver's station T opens the list. All three on Buckner Course (BA.CO: the track runs east along d = 0 from u -200 to +200; its
   stations BA.STN).
     course    the driving course: the ditch, the step, the slope, the wall gap, the paddy and the terraces, end to end. Time against the
               par, collisions (what the collision layer reports), stalls (Hardcore gears), time off the track
     buttoned  the same through the M6 periscope only (station 4's second view): time spent head out or down at the panel costs marks
     hulldown  a target board 290 m east of the course's hull-down berm (BA.CO.berm), on the course's level ground: drive up the berm until only the turret shows over
               its crest toward it, and stop. Judged by lines of sight from the board to her hull (the glacis's top corners, the nose) and to her gun
   Normal: the par is easy and the box says whether the hull shows; Hardcore (any of the tank's Hardcore options): a tighter par, no
   hint in the box. */
const DRV_DRILL = {
  /* to the start: the course's west end, facing east along the track, stopped, in neutral (Hardcore 'start': cold) */
  start() {
    pos.set(BA.CO.x - 212, 0, BA.CO.z);
    TANK.hdg = -Math.PI / 2;
    dtReset();
    BA.update(pos, true);
    tankSettle();
  },
  u: () => pos.x - BA.CO.x,
  d: () => pos.z - BA.CO.z,
  /* the stations in order (the lane is the way back, not a station) */
  stn: () => BA.STN.filter((s) => !s[0].startsWith('7')),
};
/* the course and the buttoned-up course share their measures */
function crsStart(D, btn) {
  DRV_DRILL.start();
  D.hits0 = DRV.hits || 0;
  D.stalls0 = DRV.stalls || 0;
  D.off = 0;
  D.out = 0 /* buttoned: seconds not at the periscope */;
  D.next = 0;
  D.btn = btn;
  D.par = (btn ? 85 : 65) * (D.hc ? 0.85 : 1);
  if (btn && !(camMode == 1 && STATION.stn === 4 && STATION.sub === 1)) STATION.take(4);
  drillSay('COMMANDER', btn ? 'DRIVER, BUTTON UP. MOVE OUT, TAKE HER THROUGH THE COURSE ON THE PERISCOPE.' : 'DRIVER, MOVE OUT. TAKE HER THROUGH THE COURSE.');
}
function crsStep(D, dt) {
  const u = DRV_DRILL.u(),
    d = DRV_DRILL.d(),
    S = DRV_DRILL.stn();
  if (u > -205 && u < 205 && Math.abs(d) > 13) D.off += dt;
  if (D.btn && STATION.sub !== 1) {
    if (D.out === 0) drillSay('COMMANDER', 'DRIVER, BUTTONED UP: ON THE PERISCOPE!');
    D.out += dt;
  }
  while (D.next < S.length && u > S[D.next][2]) D.next++;
  if (u > 205 || D.t > 420) {
    const hits = (DRV.hits || 0) - D.hits0,
      stalls = (DRV.stalls || 0) - D.stalls0,
      late = u <= 205,
      sc = (late ? 0 : drillMark(D.t, D.par, D.par * 2.5, D.btn ? 35 : 45)) + 25 * Math.max(0, 1 - hits / 3) + 15 * Math.max(0, 1 - stalls / 2) + drillMark(D.off, 2, 25, 15) + (D.btn ? drillMark(D.out, 0, 30, 10) : 0);
    drillEnd(D, sc, [
      late ? 'Time ran out at the ' + (S[D.next] ? S[D.next][0].replace(/^\d /, '').toLowerCase() : 'end') : 'Time ' + fmtT(D.t) + ' (par ' + fmtT(D.par) + ')',
      'Collisions ' + hits,
      'Stalls ' + stalls,
      'Off the track ' + Math.round(D.off) + ' s',
      ...(D.btn ? ['Not on the periscope ' + Math.round(D.out) + ' s'] : []),
    ]);
  }
}
function crsBox(D) {
  const S = DRV_DRILL.stn(),
    n = S[D.next];
  return (
    (n ? 'Next: <b>' + n[0] + '</b>' : 'Next: <b>THE FINISH</b>') +
    ' &middot; par ' + fmtT(D.par) +
    '<br>Collisions ' + ((DRV.hits || 0) - D.hits0) + ' &middot; stalls ' + ((DRV.stalls || 0) - D.stalls0) + ' &middot; off the track ' + Math.round(D.off) + ' s' +
    (D.btn ? ' &middot; head out ' + Math.round(D.out) + ' s' : '') +
    '<br><span style="color:#9aa">W / S / A / D drive' + (dtHC() ? ' &middot; E / Q gears, Shift the clutch' : '') + ' &middot; T ends it</span>'
  );
}
DRILLS.push(
  {
    id: 'course',
    stn: 4,
    title: 'Driving course',
    what: 'Buckner Course end to end: the ditch, the step, the slope, the wall gap, the paddy and the terraces. Time, collisions, stalls.',
    start: (D) => crsStart(D, false),
    step: crsStep,
    box: crsBox,
  },
  {
    id: 'buttoned',
    stn: 4,
    title: 'Buttoned up',
    what: 'The course again, buttoned up: drive it on the M6 periscope only.',
    start: (D) => crsStart(D, true),
    step: crsStep,
    box: crsBox,
  },
  {
    id: 'hulldown',
    stn: 4,
    title: 'Hull-down',
    what: 'A target board 290 m beyond the berm: bring her up it until only the turret shows over its crest, and stop.',
    start(D) {
      DRV_DRILL.start();
      pos.set(BA.CO.x - 215, 0, BA.CO.z + BA.CO.berm.d);
      BA.update(pos, true);
      tankSettle();
      const x = BA.CO.x + 150 /* on the course's own level ground, 290 m beyond the crest */,
        z = BA.CO.z + BA.CO.berm.d;
      D.T = new THREE.Vector3(x, BA.GH(x, z) + 1.0, z) /* a gun's eye, about a 47 mm's */;
      /* the board: the range's own target model */
      const m = new THREE.Mesh(new GX.Acc().add(MODELS.get('us-target'), GX.xf(x, BA.GH(x, z), z, Math.PI / 2)).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
      scene.add(m);
      D.board = m;
      D.moved = 0;
      D.still = 0;
      D.x0 = pos.x;
      drillSay('COMMANDER', 'DRIVER, TARGET EAST, THREE HUNDRED. TAKE HER UP THE BERM HULL DOWN. STOP WHEN I CAN JUST SEE IT.');
    },
    stop: (D) => D.board && (scene.remove(D.board), D.board.geometry.dispose()),
    step(D, dt) {
      D.moved = Math.max(D.moved, Math.abs(pos.x - D.x0));
      D.still = Math.abs(DRV.v) < 0.05 && D.moved > 5 ? D.still + dt : 0;
      D.seen = hdSeen(D.T);
      if (D.still > 2.5 || D.t > 240) {
        const [hull, gun] = D.seen,
          sc = (gun ? 30 : 0) + (gun ? 40 * (1 - hull / 3) : 0) + drillMark(D.t, 40, 150, 30);
        drillEnd(D, sc, [
          gun ? 'The gun sees the target' : 'Too low: the gun cannot see the target',
          hull === 0 ? 'Hull down: none of the hull shows' : 'Hull exposed: ' + hull + ' of 3 points show',
          'Time ' + fmtT(D.t),
        ]);
      }
    },
    box(D) {
      const s = D.seen || [3, false];
      return (
        'Target: the board 290 m beyond the berm &middot; stop with only the turret over it' +
        (D.hc ? '' : '<br>Hull <b>' + (s[0] ? 'SHOWS (' + s[0] + '/3)' : 'HIDDEN') + '</b> &middot; gun <b>' + (s[1] ? 'SEES IT' : 'BLIND') + '</b>') +
        '<br><span style="color:#9aa">W / S drive &middot; stop and hold 2 s to be judged &middot; T ends it</span>'
      );
    },
  },
);
/* lines of sight from the target (T) to her hull (the glacis's top corners and the nose) and to her gun; the ground between, sampled
   every 2 m, hides them: [hull points seen (0..3), the gun seen] */
function hdSeen(T) {
  const V = new THREE.Vector3(),
    see = (lx, ly, lz) => {
      TANK.toW(V.set(lx, ly, lz)).add(pos);
      const L = T.distanceTo(V),
        n = Math.ceil(L / 2);
      for (let i = 1; i < n; i++) {
        const f = i / n,
          x = T.x + (V.x - T.x) * f,
          z = T.z + (V.z - T.z) * f,
          y = T.y + (V.y - T.y) * f;
        if (BA.GH(x, z) > y) return false;
      }
      return true;
    };
  const hull = [see(1.53, 1.89, -1.25), see(1.53, 1.89, 1.25), see(2.46, 1.02, 0)].filter(Boolean).length;
  return [hull, see(M4A3.G.gunX + M4A3.K.TX, M4A3.K.FIRE, 0)];
}
