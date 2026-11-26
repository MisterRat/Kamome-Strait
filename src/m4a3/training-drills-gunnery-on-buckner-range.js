/* GUNNERY DRILLS ON BUCKNER RANGE (PLAN_M4A3_Sherman_Tank 7.1, 11; T3), on the shared drill framework: at the gunner's station (2) or
   the loader's (3), T opens the list. The tank is put on the firing line (the range's frame: u across, d toward the targets' side is
   -d), stopped, the in-game gun empty, the racks full.
   THE FIRE COMMAND (FM 17-12, the order the plan gives): the alert "GUNNER", the ammunition ("AP" / "HE"), the target ("TANK" /
   "TROOPS"), the direction ("TRAVERSE LEFT" / "RIGHT", "STEADY", "ON"), the range ("EIGHT HUNDRED"), "FIRE". The gunner answers
   "ON THE WAY"; the commander senses each burst and corrects ("SHORT, UP TWO HUNDRED", "OVER, DOWN ONE HUNDRED", "LEFT, RIGHT FIVE"
   in mils) or calls "TARGET". The AI loader loads what is called (the player loads at station 3).
     stationary   the range's boards the firing line can see (tank fronts at 400, 600, 800, 1,000 and 1,200 yd: the 1,500 yd board
                  stands behind a crest from the firing line), AP, three rounds each at most
     moving       a board on a sled crossing at about 550 yd at 4 m/s (9 mph), eight rounds AP: lead it (game mode: the lead mark)
     battlesight  boards popping up at 150-350 yd for 12 s each, HE on the battle sight (the cross), five of them
     rangeest     a board at an unknown range: read it with the reticle, Q / E set your estimate (100 yd), Space reports it; five
     stabilizer   the driver brings her toward the firing line at a walk with the in-game gun to be kept on a board at 800 yd; at "DRIVER STOP"
                  fire within four seconds: the lay at the halt, the time to fire, the hit
     loading      (station 3) eight rounds called against the clock while the AI gunner fires them at the 600 yd board
   (The fire port drill comes with the practice cave, T5.) */
const RNG = {
  F: () => FS.army.find((f) => f.id === 'range'),
  /* the range's boards where the range's own scenery stands them: [yd, u] (the last, 1,500 yd, is hidden from the firing line) */
  YD: [
    [400, -30],
    [600, 40],
    [800, -60],
    [1000, 20],
    [1200, -20],
    [1500, 50],
  ],
  /* a board's panel for the shells: centre, normal, across; the scenery's: 3 x 2.4 m, its centre 2 m up */
  board(u, d, id) {
    const F = RNG.F(),
      [x, z] = F.w(u, d),
      ry = F.ryS;
    return { id, c: new THREE.Vector3(x, WORLD.hm(x, z) + 2.0, z), n: new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)), u: new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)) /* across */, w: 3, h: 2.4 };
  },
  /* a board of the drill's own (it pops up, it moves): the range's target model */
  mesh(B) {
    const F = RNG.F(),
      m = new THREE.Mesh(new GX.Acc().add(MODELS.get('us-target'), GX.xf(0, 0, 0, F.ryS)).geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    m.position.set(B.c.x, B.c.y - 2.0, B.c.z);
    scene.add(m);
    B.m = m;
    return B;
  },
  drop(B) {
    if (B && B.m) (scene.remove(B.m), B.m.geometry.dispose(), (B.m = null));
  },
  /* the tank on the firing line, facing down range, stopped, the in-game gun fore and aft and empty */
  /* ammo: the round the drill begins with, called before the loader loads (else he loads what was called last) */
  start(D, u, d, ammo) {
    const F = RNG.F(),
      [x, z] = F.w(u, d),
      [x1, z1] = F.w(u, d - 10);
    pos.set(x, 0, z);
    TANK.hdg = Math.atan2(-(x1 - x), -(z1 - z));
    dtReset();
    g75Reset();
    G75.call = ammo || 'AP';
    BA.update(pos, true);
    tankSettle();
    D.shots0 = G75.shots || 0;
    D.unhook = G75.hook((s, hit) => D.imp && D.imp(s, hit));
  },
  stop(D) {
    if (D.unhook) D.unhook();
    G75.boards = [];
    G75.lead = null;
    DRV.ai = null;
    for (const B of D.own || []) RNG.drop(B);
    if (D.B) RNG.drop(D.B);
  },
};
/* the range in the commander's words: 800 "EIGHT HUNDRED", 1,000 "ONE THOUSAND", 1,200 "TWELVE HUNDRED" */
const yWords = (yd) => {
  const n = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'],
    h = Math.round(yd / 100);
  return h === 10 ? 'ONE THOUSAND' : n[h] + ' HUNDRED';
};
/* the fire command for a board: the bearing from the in-game gun's line decides the traverse word */
function fireCmd(B, ammo, tgt, battle) {
  const p = TANK.mesh.position,
    a = Math.atan2(-(B.c.x - p.x), -(B.c.z - p.z)),
    g = g75Dir(V_()),
    ag = Math.atan2(-g.x, -g.z),
    off = ((a - ag + Math.PI * 3) % (Math.PI * 2)) - Math.PI,
    yd = Math.round(p.distanceTo(B.c) / 0.9144 / 100) * 100;
  G75.call = ammo;
  const dir = Math.abs(off) < 0.05 ? 'STEADY - ON' : off > 0 ? 'TRAVERSE LEFT - STEADY - ON' : 'TRAVERSE RIGHT - STEADY - ON';
  return 'GUNNER - ' + ammo + ' - ' + tgt + ' - ' + dir + ' - ' + (battle ? 'BATTLE SIGHT' : yWords(yd)) + ' - FIRE!';
}
/* the commander's sensing of a burst against board B: "TARGET", or over / short and left / right with the correction */
function senseBurst(B, hit) {
  if (hit.board === B) return 'TARGET!';
  const p = TANK.mesh.position,
    to = B.c.clone().sub(p).setY(0),
    L = to.length(),
    f = to.clone().normalize(),
    q = hit.p.clone().sub(p).setY(0),
    along = q.dot(f) - L,
    across = q.x * -f.z + q.z * f.x /* + to the right of the line */,
    mils = Math.round(((across / L) * 1018.6) / 5) * 5,
    w = [];
  if (Math.abs(along) > 6) w.push(along < 0 ? 'SHORT, UP ' + yWords(Math.max(100, Math.round(-along / 0.9144 / 100) * 100)) : 'OVER, DOWN ' + yWords(Math.max(100, Math.round(along / 0.9144 / 100) * 100)));
  if (Math.abs(mils) >= 5) w.push(mils > 0 ? 'RIGHT, LEFT ' + mils / 5 : 'LEFT, RIGHT ' + -mils / 5);
  return w.length ? w.join(' - ') : 'LINE, A LITTLE ' + (along < 0 ? 'SHORT' : 'OVER');
}
const shotsOf = (D) => (G75.shots || 0) - D.shots0;
/* the drills' common box: the order, the sensing, the count */
const gBox = (D, extra) => '<b>' + (D.cmd || '') + '</b>' + (D.sense ? '<br>COMMANDER: <b style="color:#ffd27a">' + D.sense + '</b>' : '') + '<br>' + (extra || '') + '<br><span style="color:#9aa">2 again: the next sight &middot; click to lay, Space fires &middot; T ends it</span>';
DRILLS.push(
  {
    id: 'stationary',
    stn: 2,
    title: 'Stationary targets',
    what: 'The range\'s boards, 400 to 1,200 yd: AP on each on the commander\'s fire command, three rounds at most a board.',
    start(D) {
      RNG.start(D, -20, 6);
      D.i = 0;
      D.hits = 0;
      D.rnd = 0;
      D.first = [];
      D.next = () => {
        if (D.i >= 5) {
          const t = D.first.length ? D.first.reduce((a, b) => a + b, 0) / D.first.length : 30;
          return drillEnd(D, (D.hits / 5) * 60 + drillMark(shotsOf(D), 5, 15, 20) + drillMark(t, 8, 30, 20), ['Hits ' + D.hits + ' of 5', 'Rounds ' + shotsOf(D), 'Time to a hit (average) ' + t.toFixed(1) + ' s']);
        }
        const [yd, u] = RNG.YD[D.i];
        if (D.B) RNG.drop(D.B);
        D.B = RNG.mesh(RNG.board(u, -yd * 0.9144, 'b' + D.i)) /* a board of its own: the range's standing targets are not at these distances */;
        G75.boards = [D.B];
        D.rnd = 0;
        D.t0 = D.t;
        D.cmd = fireCmd(D.B, 'AP', 'TANK');
        drillSay('COMMANDER', D.cmd);
      };
      D.imp = (s, hit) => {
        D.rnd++;
        D.sense = senseBurst(D.B, hit);
        if (hit.board === D.B) (D.hits++, D.first.push(D.t - D.t0), (D.wait = 2));
        else if (D.rnd >= 3) ((D.sense += ' - CEASE FIRE'), (D.wait = 2));
      };
      D.wait = 2;
    },
    step(D, dt) {
      if (D.wait > 0 && (D.wait -= dt) <= 0) (D.sense = ''), D.B ? (D.i++, D.next()) : D.next();
    },
    stop: (D) => RNG.stop(D),
    box: (D) => gBox(D, 'Board ' + Math.min(5, D.i + 1) + ' of 5 &middot; hits ' + D.hits + ' &middot; rounds ' + shotsOf(D)),
  },
  {
    id: 'moving',
    stn: 2,
    title: 'Moving target',
    what: 'A board crossing on its sled at about 550 yd, 9 mph: eight rounds of AP. Lead it.',
    start(D) {
      RNG.start(D, -20, 6);
      D.B = RNG.mesh(RNG.board(-120, -500, 'sled'));
      D.own = [D.B];
      D.su = -120;
      D.dir = 1;
      G75.boards = [D.B];
      D.hits = 0;
      D.cmd = fireCmd(D.B, 'AP', 'MOVING TANK') + ' (8 ROUNDS)';
      drillSay('COMMANDER', D.cmd);
      D.imp = (s, hit) => {
        D.sense = senseBurst(D.B, hit);
        if (hit.board === D.B) D.hits++;
      };
    },
    step(D, dt) {
      D.su += D.dir * 4 * dt;
      if (Math.abs(D.su) > 140) D.dir = -D.dir;
      const F = RNG.F(),
        [x, z] = F.w(D.su, -500),
        [x1, z1] = F.w(D.su + D.dir, -500);
      D.B.c.set(x, WORLD.hm(x, z) + 2, z);
      D.B.m.position.set(x, D.B.c.y - 2, z);
      G75.lead = { p: D.B.c, v: new THREE.Vector3(x1 - x, 0, z1 - z).normalize().multiplyScalar(4) };
      if (shotsOf(D) >= 8 && !G75.shells.some((s) => !s.R.bullet)) drillEnd(D, (D.hits / 8) * 100, ['Hits ' + D.hits + ' of 8']);
    },
    stop: (D) => RNG.stop(D),
    box: (D) => gBox(D, 'Rounds ' + shotsOf(D) + ' of 8 &middot; hits ' + D.hits),
  },
  {
    id: 'battlesight',
    stn: 2,
    title: 'Battle sight',
    what: 'Boards pop up at 150 to 350 yd for 12 s each: HE on the battle sight (the cross), as fast as you can. Five of them.',
    start(D) {
      RNG.start(D, -20, 6, 'HE');
      D.n = 0;
      D.hits = 0;
      D.times = [];
      D.own = [];
      D.gap = 2;
      D.imp = (s, hit) => {
        if (!D.B) return;
        D.sense = senseBurst(D.B, hit);
        if (hit.board === D.B) (D.hits++, D.times.push(D.t - D.t0), RNG.drop(D.B), (D.B = null), (G75.boards = []), (D.gap = 2));
      };
    },
    step(D, dt) {
      if (D.B && D.t - D.t0 > 12) (RNG.drop(D.B), (D.B = null), (G75.boards = []), (D.gap = 2), (D.sense = 'TOO SLOW - IT IS DOWN'));
      if (!D.B && (D.gap -= dt) <= 0) {
        if (D.n >= 5) {
          const t = D.times.length ? D.times.reduce((a, b) => a + b, 0) / D.times.length : 12;
          return drillEnd(D, (D.hits / 5) * 60 + (D.hits ? drillMark(t, 4, 12, 40) : 0), ['Hits ' + D.hits + ' of 5', 'Time to a hit (average) ' + t.toFixed(1) + ' s']);
        }
        D.n++;
        const yd = 150 + Math.random() * 200,
          u = (Math.random() - 0.5) * 2 * yd * 0.9144 * 0.25;
        D.B = RNG.mesh(RNG.board(u, -yd * 0.9144, 'pop' + D.n));
        D.own.push(D.B);
        G75.boards = [D.B];
        D.t0 = D.t;
        D.sense = '';
        D.cmd = fireCmd(D.B, 'HE', 'TROOPS', true);
        drillSay('COMMANDER', D.cmd);
      }
    },
    stop: (D) => RNG.stop(D),
    box: (D) => gBox(D, 'Target ' + D.n + ' of 5 &middot; hits ' + D.hits),
  },
  {
    id: 'rangeest',
    stn: 2,
    title: 'Range estimation',
    what: 'A board at an unknown range: read it with the reticle (a tank front is 3 m across), Q / E set your estimate, Space reports it. Five.',
    start(D) {
      RNG.start(D, -20, 6);
      D.n = 0;
      D.err = [];
      D.own = [];
      D.est = 800;
      D.next = () => {
        RNG.drop(D.B);
        if (D.n >= 5) {
          const e = D.err.reduce((a, b) => a + b, 0) / D.err.length;
          return drillEnd(D, drillMark(e, 50, 400, 100), ['Average error ' + Math.round(e) + ' yd', ...D.err.map((x, i) => 'Board ' + (i + 1) + ': off by ' + Math.round(x) + ' yd')]);
        }
        D.n++;
        D.yd = Math.round(300 + Math.random() * 1000);
        D.B = RNG.mesh(RNG.board((Math.random() - 0.5) * 120, -D.yd * 0.9144, 'est'));
        D.own.push(D.B);
        D.cmd = 'GUNNER - TANK - ' + (Math.random() < 0.5 ? 'LEFT FRONT' : 'RIGHT FRONT') + ' - HOW FAR?';
        drillSay('COMMANDER', D.cmd);
      };
      D.next();
    },
    key(D, code) {
      if (code === 'KeyQ' || code === 'KeyE') return (D.est = Math.max(100, Math.min(2000, D.est + (code === 'KeyE' ? 100 : -100)))), true;
      if (code === 'Space') {
        const e = Math.abs(D.est - D.yd);
        D.err.push(e);
        D.sense = 'YOU SAID ' + D.est + ' - IT WAS ' + D.yd + ' YD';
        D.next();
        return true;
      }
      return false;
    },
    step() {},
    stop: (D) => RNG.stop(D),
    box: (D) => gBox(D, 'Board ' + D.n + ' of 5 &middot; your estimate <b>' + D.est + ' yd</b> (Q / E, Space reports)'),
  },
  {
    id: 'stabilizer',
    stn: 2,
    title: 'Stabilizer',
    what: 'The driver brings her toward the firing line at a walk: keep the gun on the board at 800 yd; at DRIVER STOP, fire within 4 s.',
    start(D) {
      RNG.start(D, -20, 120);
      D.B = RNG.board(-60, -800 * 0.9144, 'b2');
      G75.boards = [D.B];
      G75.call = 'AP';
      G75.stab = true;
      D.ph = 'move';
      D.cmd = 'STABILIZER ON. DRIVER, MOVE OUT. ' + fireCmd(D.B, 'AP', 'TANK').replace(' - FIRE!', ' - FIRE ON THE HALT');
      drillSay('COMMANDER', D.cmd);
      D.imp = (s, hit) => {
        if (D.ph !== 'halt') return;
        D.sense = senseBurst(D.B, hit);
        D.res = [hit.board === D.B, D.t - D.th];
        D.ph = 'done';
        D.endT = D.t + 1.5;
      };
    },
    step(D, dt) {
      const F = RNG.F(),
        [, dd] = F.uv(pos.x, pos.z);
      if (D.ph === 'move') {
        DRV.ai = { fw: dd > 30 ? 0.35 : 0, tu: 0 };
        if (dd <= 30) (D.ph = 'halt'), (D.th = D.t), (DRV.ai = { fw: -0.6 }), (D.lay = gLayErr(D.B)), (D.cmd = 'DRIVER STOP!'), drillSay('COMMANDER', 'DRIVER STOP!');
      } else if (D.ph === 'halt') {
        if (Math.abs(DRV.v) < 0.05) DRV.ai = { fw: 0 };
        if (D.t - D.th > 4 && !G75.shells.some((s) => !s.R.bullet)) (D.res = [false, 4]), (D.ph = 'done'), (D.endT = D.t), (D.sense = 'TOO LATE');
      } else if (D.ph === 'done' && D.t >= D.endT) {
        const [hit, tf] = D.res;
        drillEnd(D, drillMark(D.lay, 2, 25, 40) + drillMark(tf, 1.5, 4, 30) + (hit ? 30 : 0), ['Lay at the halt: ' + D.lay.toFixed(1) + ' mils off', 'Fired ' + tf.toFixed(1) + ' s after the halt', hit ? 'A hit' : 'A miss']);
      }
    },
    stop: (D) => RNG.stop(D),
    box: (D) => gBox(D, D.ph === 'move' ? 'Moving: keep the cross on the board (the stabilizer holds the elevation)' : D.ph === 'halt' ? '<b>FIRE!</b> ' + Math.max(0, 4 - (D.t - D.th)).toFixed(1) + ' s' : ''),
  },
  {
    id: 'loading',
    stn: 3,
    title: 'Loading drill',
    what: 'Eight rounds called against the clock while the gunner fires them at the 600 yd board: take each (Space) and ram it home.',
    start(D) {
      RNG.start(D, -20, 6);
      D.B = RNG.board(40, -600 * 0.9144, 'b1');
      G75.boards = [D.B];
      D.n = 0;
      D.times = [];
      D.wrong = 0;
      D.callNext = () => {
        if (D.n >= 8) {
          const t = D.times.reduce((a, b) => a + b, 0) / D.times.length;
          return drillEnd(D, drillMark(t, FM.use('load') ? 6 : 3.5, 14, 80) + 20 * Math.max(0, 1 - D.wrong / 2), ['Average load ' + t.toFixed(1) + ' s', 'Wrong rounds ' + D.wrong]);
        }
        D.n++;
        G75.call = Math.random() < 0.55 ? 'HE' : Math.random() < 0.85 ? 'AP' : 'SMK';
        D.t0 = D.t;
        D.cmd = 'LOADER - ' + G75.call + '!';
        drillSay('GUNNER', D.cmd);
      };
      D.callNext();
    },
    step(D, dt) {
      /* the AI gunner lays on the board and fires a second and a half after UP */
      const p = TANK.mesh.position;
      const L = Math.hypot(D.B.c.x - p.x, D.B.c.z - p.z);
      G75.trD = Math.atan2(-(D.B.c.x - p.x), -(D.B.c.z - p.z)) - TANK.hdg;
      G75.elW = Math.atan2(D.B.c.y - p.y - 2.2, L) + gunRange(G75.loaded || G75.call, L);
      if (G75.loaded) {
        if (D.up == null) (D.up = D.t), D.times.push(D.t - D.t0), G75.loaded !== G75.call && D.wrong++;
        if (D.t - D.up > 1.5 && g75Fire()) (D.up = null), D.callNext() /* the next round is called as the shot goes */;
      }
    },
    stop: (D) => RNG.stop(D),
    box: (D) => '<b>' + D.cmd + '</b><br>Round ' + D.n + ' of 8 &middot; ' + (G75.loaded ? 'UP' : 'loading') + ' &middot; ' + (D.t - D.t0).toFixed(1) + ' s<br><span style="color:#9aa">Space takes the round, Space again in the green rams it &middot; T ends it</span>',
  },
);
/* how far the in-game gun's line is off the board's centre at its range, in mils (the elevation the range needs allowed for) */
function gLayErr(B) {
  const p = g75Muzzle(V_()),
    to = B.c.clone().sub(p),
    L = to.length(),
    want = to.normalize(),
    el = gunRange(G75.loaded || G75.call, L),
    d = g75Dir(V_());
  /* the in-game gun should sit el above the line to the target */
  const wantEl = Math.asin(want.y) + el,
    hasEl = Math.asin(d.y),
    az = Math.atan2(-want.x, -want.z) - Math.atan2(-d.x, -d.z);
  return Math.hypot(((az + Math.PI * 3) % (Math.PI * 2)) - Math.PI, hasEl - wantEl) * 1018.6;
}
