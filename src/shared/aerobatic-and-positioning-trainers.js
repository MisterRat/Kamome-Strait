/* ---------- aerobatic and positioning trainers ----------
   Barrel roll, Immelmann, split S, wingover (attitude coaching) and low / high yo-yo (against a scripted drone).
   Each one is a list of steps: a title, what to do (adapted for Hardcore mode: more speed, more G, torque), a live hint, and a test for
   moving on. The coach reads pitch, bank, G, speed and the heading change; the yo-yos also read range, angle off and height. */
const AERO = {
  barrel: { name: 'BARREL ROLL', alt: 1800, std: 420, hc: 470 },
  immelmann: { name: 'IMMELMANN TURN', alt: 1800, std: 520, hc: 650 },
  splits: { name: 'SPLIT S', alt: 2400, std: 320, hc: 340 },
  wingover: { name: 'WINGOVER', alt: 1800, std: 460, hc: 520 },
  lowyoyo: { name: 'LOW YO-YO', alt: 1500, std: 400, hc: 430 },
  highyoyo: { name: 'HIGH YO-YO', alt: 1500, std: 500, hc: 540 },
};
const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
function aeroNew(m) {
  return {
    m,
    hc: FM.on,
    init: false,
    h0: new V(0, 0, -1),
    hdg0: 0,
    pb: 0,
    ph: 0,
    roll: 0,
    loop: 0,
    dh: 0,
    maxG: 0,
    minG: 9,
    minKmh: 1e9,
    maxKmh: 0,
    minAgl: 1e9,
    topKmh: 0,
    y0: 0,
    hold: 0,
    minRange: 1e9,
    dir: 0,
    bank: 0,
    hdg: 0,
    tgt: null,
  };
}
function aeroStart(m) {
  const d = AERO[m],
    kmh = FM.on ? d.hc : d.std,
    o = { sig: 1, a: 340.3, ps: 1 };
  if (FM.use('alt')) atmos(d.alt, o);
  placeAt(0, d.alt, 0, 0, -100000, kmh / 3.6 / Math.sqrt(o.sig));
  thr = 1;
  trn.a = aeroNew(m);
  if (m === 'lowyoyo' || m === 'highyoyo') {
    /* the drone flies a steady level turn to the left, ahead of you; you start behind it */
    const low = m === 'lowyoyo',
      b = buildEnemy(),
      kms = low ? (FM.on ? 430 : 400) : FM.on ? 430 : 390;
    const dp = new V(low ? -300 : -60, pos.y, low ? -1500 : -1250);
    Object.assign(b, {
      p: dp.clone(),
      fwd: new V(0, 0, -1),
      sp: kms / 3.6,
      hp: 1e9,
      dying: false,
      t: 0,
      ev: 0,
      side: -1,
      dive: false,
      bank: 0,
      fireT: 0,
      bt: 0,
      tr: 0,
      v: null,
      drone: true,
      alt: pos.y,
    });
    const f0 = b.fwd,
      r0 = new V().crossVectors(f0, UPV).normalize(),
      u0 = new V().crossVectors(r0, f0);
    m4.makeBasis(r0, u0, f0.clone().negate());
    b.q = new Q().setFromRotationMatrix(m4);
    b.v = f0.clone().multiplyScalar(b.sp);
    b.ctl = { p: 0, r: 0 };
    b.g.position.copy(dp);
    scene.add(b.g);
    EN.push(b);
  }
}
