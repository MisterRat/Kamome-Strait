/* the subject of the lesson: PT-108, the rafts */
const lesT = (k) => (PT.on ? PT.L.find((t) => t.kind === k) : null);
const lesRep = (L, kind, after) => {
  let n = 0;
  for (const [ref, m] of COMMS.rd.M) if ((!kind || ref.kind === kind) && m.k.some((q) => q.t >= after)) n++;
  return n;
};
const LES = {
  radar: () => [
    {
      sp: 1,
      h: 'RADAR SCHOOL',
      t: 'This is the <b>PPI scope</b> of the ship\'s SL surface-search radar. <b>We are the centre</b>; the top of the scope is <b>our bow</b> (the line from the centre, the <i>heading flash</i>). The aerial turns 15 times a minute: the <b>sweep</b> paints whatever the beam hits, and the paint fades until the next sweep comes round.',
      go: () => (RADAR.ri = 1),
    },
    {
      sp: 1,
      t: '<b>Range rings</b>: at the 5-mile scale they are 1&frac14; miles (2,500 yards) apart. <b>Land</b> paints as big solid shapes that stay put, and throws a <b>shadow</b>: nothing behind it can be seen. The speckle close round the centre is <b>sea clutter</b>, waves, not ships. Small round blobs out on the sea are <b>contacts</b>.',
    },
    { t: '<b>Page Up</b>: change to the <b>10-mile scale</b>. Watch the land and the contacts shrink toward the centre.', ok: () => RADAR.ri === 2 },
    { t: '<b>Page Down</b>: back to the <b>5-mile scale</b>.', ok: () => RADAR.ri === 1 },
    {
      t: '<b>Q / E</b> turn the orange <b>bearing cursor</b> (hold Shift for speed). Lay it on <b>PT-108</b>, the boat running round us at about a mile.',
      ok: () => {
        const p = lesT('ptboat');
        return p && Math.abs(angW(cRel(p.p.x, p.p.z)[0] - COMMS.rd.b)) < 0.05;
      },
    },
    {
      t: '<b>R / F</b> move the <b>range strobe</b> (the dotted ring and the small circle on the cursor) out and in. Put it on PT-108.',
      ok: () => {
        const p = lesT('ptboat');
        if (!p) return false;
        const [b, r] = cRel(p.p.x, p.p.z);
        return Math.abs(angW(b - COMMS.rd.b)) < 0.06 && Math.abs(r - COMMS.rd.r) < Math.max(150, 0.05 * r);
      },
    },
    {
      t: '<b>Space</b>: report the contact. The bearing goes out as <b>true</b> (degrees from north, not from our bow) and the range in <b>yards</b>. A yellow square marks it on the scope.',
      go: (L) => (L.a = SHIP.t),
      ok: (L) => lesRep(L, 'ptboat', L.a) > 0,
    },
    {
      t: 'Now the <b>rafts</b>. Two are close in, under 1,000 yards: <b>Page Down</b> to the <b>2-mile scale</b>, find them, and report both.',
      go: (L) => (L.a = SHIP.t),
      ok: (L) => {
        let n = 0;
        for (const [ref, m] of COMMS.rd.M) if (ref.kind === 'raft' && m.k.some((q) => q.t >= L.a) && cRel(ref.p.x, ref.p.z)[1] < 1000) n++;
        return n >= 2;
      },
    },
    {
      t: '<b>Tracking</b>: one report says where a contact <i>is</i>; two, at least 40 seconds apart, say where she is <i>going</i>. Go back to the 5-mile scale and <b>report PT-108 again</b> (wait if it is too soon). The plot works out her course and speed and draws her line.',
      go: (L) => (L.a = COMMS.rd.tr),
      ok: (L) => {
        const p = lesT('ptboat'),
          m = p && COMMS.rd.M.get(p);
        return m && m.trk && COMMS.rd.tr > L.a;
      },
    },
    {
      t: '<b>TEST</b>: report <b>every contact</b> within 5 miles (the rafts, PT-108, her sled, any ship) in <b>2 minutes</b>. Wrong reports count against you.',
      go: (L) => {
        L.a = SHIP.t;
        L.bad0 = COMMS.rd.bad;
        L.want = radarTargets().filter((c) => c.r < 9260).map((c) => c.ref);
      },
      ok: (L) => {
        const got = L.want.filter((ref) => {
          const m = COMMS.rd.M.get(ref);
          return m && m.k.some((q) => q.t >= L.a);
        }).length;
        L.prog = got + ' OF ' + L.want.length + ' REPORTED &middot; ' + Math.max(0, Math.ceil(120 - (SHIP.t - L.a))) + ' S LEFT';
        if (got >= L.want.length || SHIP.t - L.a > 120) {
          const bad = COMMS.rd.bad - L.bad0,
            sc = Math.max(0, Math.round((got / Math.max(1, L.want.length)) * 100 - bad * 10));
          L.res = 'RADAR TEST: ' + got + ' OF ' + L.want.length + ' CONTACTS REPORTED IN ' + Math.round(Math.min(120, SHIP.t - L.a)) + ' S, ' + bad + ' WRONG REPORT' + (bad === 1 ? '' : 'S') + '. SCORE ' + sc + '%.';
          RADIO.add('RADAR', L.res, { own: true });
          return true;
        }
        return false;
      },
    },
  ],
  sonar: () => [
    {
      sp: 1,
      h: 'SONAR SCHOOL',
      t: 'The <b>echo-ranging sonar</b> sends a <b>ping</b> of sound out in a narrow beam (about 10&deg; wide) and listens. Sound goes about 1,600 yards a second in water, out and back: an echo from 1,000 yards comes 1&frac14; seconds after the ping. The <b>range recorder</b> stylus runs down the paper as the sound travels and burns a mark where an echo comes.',
      go: () => {
        SONAR.ri = 1;
        const s = lesT('sub');
        if (s) {
          aswPlace(s, 1050, 0.6);
          s.o.d = 30.5;
          COMMS.est = null;
        }
        SHIP.tel = 1 / 3;
      },
    },
    {
      sp: 1,
      t: 'Listen: after each ping comes the <b>reverberation</b>, a fading hiss from the sea itself (the dark band at the top of the paper). An <b>echo</b> is a short, clear note after it. A woolly smear is the <b>bottom</b>, a <b>wake</b> or a shoal of fish.',
    },
    { t: '<b>SEARCH</b>: <b>Q / E</b> train the beam. A search covers from 80&deg; on one bow to 80&deg; on the other, 5&deg; a ping. Start on the port bow: train the beam <b>past 70&deg; to port</b>.', ok: () => SONAR.brg < -1.22 },
    {
      t: 'Now step to starboard: a short tap of <b>E</b> after each ping (about 5&deg;), and listen after every one. Stop when you hear an <b>echo</b> come back.',
      go: (L) => (L.a = SHIP.t),
      ok: (L) => COMMS.sn.echo && COMMS.sn.echo.t > L.a,
    },
    {
      sp: 1,
      t: '<b>CONTACT!</b> A clear echo that comes back on the same bearing and the same range ping after ping is a <b>target</b>. On the recorder its marks line up across the paper.',
    },
    {
      t: '<b>DOPPLER</b>: listen to the echo\'s pitch against the ping. <b>Higher</b> = <b>up Doppler</b>, he is closing; <b>lower</b> = <b>down Doppler</b>, opening; <b>the same</b> = <b>no Doppler</b>, crossing. Call it: <b>U</b> up, <b>B</b> down, <b>N</b> none.',
      go: (L) => (L.a = SHIP.t),
      ok: (L) => COMMS.sn.dc && COMMS.sn.dc.ok && COMMS.sn.dc.t > L.a,
    },
    {
      t: '<b>CUTS</b>: the beam is wide, so find his edges. Train <b>left</b> until the echo just stops and press <b>Z</b> (left cut); then train <b>right</b> across him until it just stops and press <b>X</b> (right cut). His <b>centre bearing</b> is halfway between.',
      go: (L) => (L.a = SHIP.t),
      ok: (L) => {
        const S = COMMS.sn,
          s = lesT('sub');
        if (!(S.L != null && S.R != null && S.tc > L.a && s)) return false;
        const c = S.L + angW(S.R - S.L) / 2,
          e = Math.abs(angW(c - cRel(s.p.x, s.p.z)[0]));
        if (e > 0.07 && S.R > S.L && !L.warn) (L.warn = 1), note('YOUR CUTS ARE ' + Math.round((e * 180) / Math.PI) + ' DEGREES OFF HIS CENTRE - TRY AGAIN');
        return e <= 0.07 && S.R > S.L;
      },
    },
    {
      sp: 1,
      t: '<b>RANGE RATE</b>: the slope of his marks on the recorder shows how fast the range is changing. Marks climbing up the paper: the range is <b>closing</b>. In an attack the range closes fast, and inside about <b>150 yards</b> the beam passes over him and the echo is lost.',
    },
    {
      t: '<b>REPORT</b>: <b>Space</b> sends his bearing (the centre of your cuts, or the beam\'s bearing if you have no fresh cuts) and range to the bridge.',
      go: (L) => (L.a = COMMS.sn.rep.length),
      ok: (L) => COMMS.sn.rep.length > L.a && COMMS.sn.rep[COMMS.sn.rep.length - 1].err < 5,
    },
    {
      t: '<b>TEST</b>: the OOD will now <b>attack on your reports</b>. Hold the contact: cut him and report <b>at least every 15 seconds</b>. The torpedomen fire on the OOD\'s orders. Lose him, or report him wrong, and the attack misses.',
      go: (L) => {
        L.atk = true;
        L.a = SHIP.t;
        L.r0 = COMMS.sn.rep.length;
        ASW.who = 'comms';
        ASW.ph = 'idle';
      },
      ok: (L) => {
        if (ASW.ph !== 'done') return false;
        const R = COMMS.sn.rep.slice(L.r0),
          me = R.length ? R.reduce((a, q) => a + q.err, 0) / R.length : 0;
        L.res = ASW.deb + ' SONAR: ' + R.length + ' REPORTS, AVERAGE BEARING ERROR ' + me.toFixed(1) + '&deg;, CONTACT HELD ' + Math.round((ASW.held || 0) * 100) + '% OF THE RUN.';
        return true;
      },
    },
  ],
  radio: () => {
    const post = (L, list) => list.forEach(([dt, from, txt], i) => COMMS.sched.push({ at: SHIP.t + dt, from, txt }));
    return [
      {
        sp: 1,
        h: 'RADIO SCHOOL',
        t: 'The radio room is the ship\'s <b>message centre</b>. Every message that comes in must be <b>acknowledged</b> (&ldquo;roger&rdquo;) within ' + (FM.use('comms') ? 12 : 20) + ' seconds. Any message about the ship\'s movements, the guns or the exercise must also be <b>routed to the bridge</b>' + (FM.use('comms') ? '' : ' (game mode marks them &#9654; BRIDGE)') + '. The printer keeps the log.',
        go: () => (COMMS.rq.length = 0),
      },
      {
        t: 'A message: read it. Nothing in it for the bridge, so <b>Space</b> acknowledges it.',
        go: (L) => ((L.a = SHIP.t), post(L, [[1, 'TOW TWO', 'FUEL FOR ONE MORE HOUR.']])),
        ok: (L) => COMMS.rq.some((m) => m.t0 >= L.a && m.st === 'ok'),
      },
      {
        t: 'This one tells the bridge about the exercise: <b>B</b> routes it to the bridge (that acknowledges it too).',
        go: (L) => ((L.a = SHIP.t), post(L, [[1, 'PT 105', 'TURNING FOR ANOTHER PASS. SLED 300 YARDS ASTERN.']])),
        ok: (L) => COMMS.rq.some((m) => m.t0 >= L.a && m.st === 'ok'),
      },
      {
        t: 'Now four messages, close together. Handle each: <b>Space</b> to acknowledge, <b>B</b> if the bridge needs it.',
        go: (L) => {
          L.a = SHIP.t;
          post(L, [
            [1, 'TOW ONE', 'ON STATION, 1,600 YARDS. SLEEVE STREAMED. COMMENCE FIRING WHEN READY.'],
            [7, 'PT 105', 'FUEL STATE GOOD. CAN STAY ANOTHER HOUR.'],
            [13, 'EXERCISE SUB', 'AT PERISCOPE DEPTH. WILL DIVE TO 150 FEET AND COMMENCE MY RUN.'],
            [19, 'TOW ONE', 'REQUEST FALL OF SHOT REPORT AFTER THIS RUN.'],
          ]);
        },
        ok: (L) => {
          const M = COMMS.rq.filter((m) => m.t0 >= L.a);
          if (M.length < 4 || M.some((m) => m.st === 'open')) return false;
          L.ok4 = M.filter((m) => m.st === 'ok').length;
          return true;
        },
      },
      {
        t: 'Sending: sonar has reported a contact, and the captain wants it sent to the escort commander. With no traffic waiting, <b>Space</b> sends our message.',
        go: (L) => ((L.a = COMMS.sent || 0), (COMMS.out = 'PCE 842 TO ESCORT COMMANDER: SOUND CONTACT BEARING ' + c3(cTrue(0.4)) + ' RANGE 1,200 YARDS. AM ATTACKING.')),
        ok: (L) => {
          if ((COMMS.sent || 0) <= L.a) return false;
          L.res = 'RADIO TEST: ' + L.ok4 + ' OF 4 MESSAGES HANDLED RIGHT, CONTACT REPORT SENT.';
          return true;
        },
      },
    ];
  },
};
