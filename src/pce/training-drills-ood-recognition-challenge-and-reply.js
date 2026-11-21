/* ---- OOD DRILL: RECOGNITION. Three contacts, one at a time. First a motor torpedo boat closing her: challenge her by light
   (Space flashes the day's challenge) and read her reply off her signal lamp (Morse): the day's reply, she is a friend; anything
   else, or nothing, she is not. Then two aircraft crossing ahead: look at them (X: the binoculars) and tell a P-51 from a Ki-84.
   Q: FRIEND - HOLD FIRE; E: ENEMY - GUNS FREE. Each contact is marked out of 33: right or wrong, and how soon (and for the boat,
   whether she was challenged before she was called). Normal: the signalman reads her lamp aloud; Hardcore: read it yourself ---- */
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
/* a lamp's flashes for a group of letters, repeated: [[on, seconds], ...] */
function morseSeq(txt) {
  const S = [];
  for (const ch of txt) {
    for (const c of MORSE[ch]) S.push([1, c === '.' ? 0.35 : 1.05], [0, 0.35]);
    S[S.length - 1][1] = 1.2;
  }
  S[S.length - 1][1] = 3;
  return S;
}
const RLET = 'ABDGHKMNRSUW';
const rLet = () => RLET[Math.floor(Math.random() * RLET.length)];
DRILLS.push({
  id: 'recog',
  stn: 1,
  title: 'Recognition',
  what: 'Challenge a closing boat by light and read her reply; then tell two aircraft apart. Q friend (hold fire), E enemy (guns free).',
  start(D) {
    D.ch = rLet() + rLet();
    do D.rp = rLet() + rLet();
    while (D.rp === D.ch);
    D.q = [{ k: 'boat', foe: Math.random() < 0.5 }, { k: 'air', foe: Math.random() < 0.5 }, { k: 'air', foe: Math.random() < 0.5 }];
    D.n = 0;
    D.res = [];
    D.wait = 2;
    drillSay('SIGNALMAN', "TODAY'S CHALLENGE " + D.ch.split('').join(' ') + ', REPLY ' + D.rp.split('').join(' ') + '.');
  },
  stop(D) {
    this.clear(D);
  },
  clear(D) {
    const c = D.c;
    if (!c) return;
    scene.remove(c.m);
    if (c.hull) OCEAN.unhull(c.hull);
    D.c = null;
  },
  spawn(D) {
    const it = D.q[D.n],
      V = THREE.Vector3,
      off = (Math.random() - 0.5) * 1.6,
      a = -SHIP.hdg + off /* bearing (rad, compass) off her bow */,
      dir = new V(Math.sin(a), 0, -Math.cos(a));
    const c = { ...it, t0: D.t, said: false };
    if (it.k === 'boat') {
      c.m = PTB.build('105');
      c.p = pos.clone().addScaledVector(dir, 3200);
      c.v = dir.clone().multiplyScalar(-15 * 0.5144);
      c.rp = it.foe ? (Math.random() < 0.4 ? '' : rLet() + rLet()) : D.rp; /* a foe answers wrong, or not at all */
      if (c.rp === D.rp) c.rp = 'AX';
      /* her signal lamp: a bright point on her bridge */
      const cv = document.createElement('canvas');
      cv.width = cv.height = 32;
      const g = cv.getContext('2d'),
        gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,255,240,1)');
      gr.addColorStop(1, 'rgba(255,255,200,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
      c.lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), sizeAttenuation: false, depthTest: false, transparent: true }));
      c.lamp.scale.set(0.03, 0.03, 1);
      c.lamp.position.set(0, 4, 0);
      c.lamp.visible = false;
      c.m.add(c.lamp);
      drillSay('LOOKOUT', 'SMALL CRAFT BEARING ' + raidBrg(c.p) + ', CLOSING FAST.');
    } else {
      /* an aircraft crossing ahead from one side to the other, 3 km out, 800 m up */
      const rt = new V(Math.cos(SHIP.hdg), 0, -Math.sin(SHIP.hdg)),
        fw = new V(-Math.sin(SHIP.hdg), 0, -Math.cos(SHIP.hdg)),
        s = Math.random() < 0.5 ? 1 : -1;
      c.m = it.foe ? buildEnemy().g : P51DISP.make({ gear: false }).g;
      c.p = pos.clone().addScaledVector(fw, 2600).addScaledVector(rt, s * 3500).setY(OCEAN.Y + 800);
      c.v = rt.clone().multiplyScalar(-s * 120);
      drillSay('LOOKOUT', 'AIRCRAFT BEARING ' + raidBrg(c.p) + ', LOW, CROSSING.');
    }
    scene.add(c.m);
    D.c = c;
  },
  step(D, dt) {
    if (!D.c) {
      if (D.n >= 3) return this.finish(D);
      if ((D.wait -= dt) <= 0) this.spawn(D);
      return;
    }
    const c = D.c;
    c.p.addScaledVector(c.v, dt);
    const r = Math.hypot(c.p.x - pos.x, c.p.z - pos.z);
    if (c.k === 'boat') {
      if (r < 700) c.v.set(0, 0, 0); /* she stops off our bow and waits */
      c.m.position.set(c.p.x, OCEAN.Y + 0.5, c.p.z);
      c.m.rotation.y = Math.atan2(c.p.z - pos.z, -(c.p.x - pos.x));
      OCEAN.place(c.hull || (c.hull = OCEAN.hull({ kind: 'pt', cut: 'deck' })), c.p.x, c.p.z, Math.cos(c.m.rotation.y), -Math.sin(c.m.rotation.y), c.v.length(), c.m.position.y, 0);
      /* her reply on the lamp, a few seconds after our challenge, over and over */
      if (c.chT !== undefined && D.t - c.chT > 3 && c.rp) {
        if (!c.seq) ((c.seq = morseSeq(c.rp)), (c.si = 0), (c.st = 0), (c.read = ''));
        c.st += dt;
        while (c.st > c.seq[c.si][1]) {
          c.st -= c.seq[c.si][1];
          c.si = (c.si + 1) % c.seq.length;
          if (c.si === 0 && c.read.length < c.rp.length) c.read = c.rp;
        }
        c.lamp.visible = c.seq[c.si][0] === 1;
        if (!D.hc && !c.said && c.si === 0 && c.read) ((c.said = true), drillSay('SIGNALMAN', 'SHE REPLIES ' + c.rp.split('').join(' ') + '.'));
      }
      if (c.chT !== undefined && !c.rp && !c.said && D.t - c.chT > 15 && !D.hc) ((c.said = true), drillSay('SIGNALMAN', 'NO REPLY TO OUR CHALLENGE.'));
      if (D.t - c.t0 > 150) this.call(D, null);
    } else {
      c.m.position.copy(c.p);
      c.m.rotation.set(0, Math.atan2(-c.v.x, -c.v.z), 0); /* the aircraft models face -z */
      if (D.t - c.t0 > 60) this.call(D, null);
    }
  },
  call(D, foe) {
    const c = D.c,
      t = D.t - c.t0,
      ok = foe === c.foe;
    let s = ok ? 25 + drillMark(t, c.k === 'boat' ? 25 : 10, 70, 8) : 0;
    if (c.k === 'boat' && c.chT === undefined) s = Math.max(0, s - 15);
    D.res.push({ k: c.k, foe: c.foe, said: foe, t, ok, ch: c.chT !== undefined, s });
    note(foe === null ? 'NO CALL MADE' : ok ? 'CORRECT' : 'WRONG');
    if (foe !== null) drillSay('CAPTAIN', ok ? 'VERY WELL.' : c.foe ? 'SHE WAS HOSTILE. WE WOULD HAVE TAKEN THE FIRST BLOW.' : 'THAT WAS A FRIEND. CHECK FIRE, CHECK FIRE.');
    this.clear(D);
    D.n++;
    D.wait = 5;
  },
  finish(D) {
    const nm = (r) => (r.k === 'boat' ? 'THE BOAT' : 'AN AIRCRAFT') + ' (' + (r.foe ? 'ENEMY' : 'FRIEND') + ')';
    drillEnd(
      D,
      D.res.reduce((a, r) => a + r.s, 0) + 1,
      D.res.map((r) => nm(r) + ': ' + (r.said === null ? '<b style="color:#ff8a6a">NO CALL</b>' : r.ok ? 'CALLED RIGHT' : '<b style="color:#ff8a6a">CALLED ' + (r.said ? 'ENEMY' : 'FRIEND') + '</b>') + ' IN ' + r.t.toFixed(0) + ' S' + (r.k === 'boat' ? (r.ch ? ', CHALLENGED' : ', <b style="color:#ff8a6a">NOT CHALLENGED</b>') : '') + ' &middot; <b>' + Math.round(r.s) + '</b>/33'),
    );
  },
  key(D, code, rep) {
    if (code !== 'Space' && code !== 'KeyQ' && code !== 'KeyE') return false;
    if (rep || !D.c) return true;
    const c = D.c;
    if (code === 'Space') {
      if (c.k === 'boat' && c.chT === undefined) ((c.chT = D.t), drillSay('SIGNALMAN', 'CHALLENGING: ' + D.ch.split('').join(' ') + '.'), SND.tone(1200, 1200, 0.2, 0.05, 'sine'));
      return true;
    }
    this.call(D, code === 'KeyE');
    return true;
  },
  box(D) {
    const c = D.c,
      card = "TODAY: CHALLENGE <b>" + D.ch + '</b> &middot; REPLY <b>' + D.rp + '</b>';
    if (!c) return card + '<br>STAND BY FOR THE NEXT CONTACT (' + D.n + '/3)';
    return (
      card +
      '<br>' + (c.k === 'boat' ? 'A <b>BOAT</b>' : 'AN <b>AIRCRAFT</b>') + ' BEARING ' + raidBrg(c.p) + '&deg;, ' + (Math.hypot(c.p.x - pos.x, c.p.z - pos.z) / 1000).toFixed(1) + ' KM' +
      (c.k === 'boat'
        ? '<br>' + (c.chT === undefined ? '<b>Space</b> CHALLENGE HER BY LIGHT' : 'HER LAMP: ' + (D.hc ? 'READ IT (MORSE BELOW)' : c.read ? '<b>' + c.read + '</b>' : c.rp ? 'FLASHING...' : D.t - c.chT > 15 ? '<b>NO REPLY</b>' : 'WATCHING...'))
        : '<br>' + kbText('gSight') + ' BINOCULARS: A <b>P-51</b> (FRIEND) OR A <b>KI-84 FRANK</b> (ENEMY)?') +
      '<br><b>Q</b> FRIEND - HOLD FIRE &middot; <b>E</b> ENEMY - GUNS FREE' +
      (D.hc && c.k === 'boat' ? '<br><span style="color:#9aa;font-size:11px">' + Object.entries(MORSE).filter(([k]) => RLET.includes(k) || k === 'X' || k === 'A').map(([k, v]) => k + ' ' + v).join(' &middot; ') + '</span>' : '')
    );
  },
});
