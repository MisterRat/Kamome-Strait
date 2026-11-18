/* RIDE: every hull rides the ocean's waves (shared by every game; first written for the PCE-842 player's ship in shipPose).
   Heave is the mean of the sea under the bow, the stern and both sides (a long hull averages out the short waves); pitch and roll
   follow the slope of the sea along and across her, with the lag of a heavy hull; roll has the hull's own period and light damping.
   RIDE.init(s, along, across, period) sets up a state: the sample points 'along' metres fore and aft of amidships and 'across'
   metres to each side (about 0.43 x length and 0.45 x beam), the roll period in seconds.
   RIDE.step(s, x, z, fx, fz, dt, heel) moves it on: (fx, fz) is her bow direction (unit), heel an extra roll target (a turn).
   Results: s.hv heave above still water (m), s.pi pitch (bow up +), s.ro roll (port side up +), radians. Without an ocean all stay 0. */
const RIDE = {
  init(s, along, across, period) {
    return Object.assign(s, { along, across, T: period || 8, hv: s.hv || 0, pi: s.pi || 0, ro: s.ro || 0, vr: s.vr || 0 });
  },
  make(along, across, period) {
    return this.init({}, along, across, period);
  },
  step(s, x, z, fx, fz, dt, heel) {
    if (typeof OCEAN === 'undefined') return s;
    const t = OCEAN.U.uTime.value,
      A = s.along,
      C = s.across,
      hB = OCEAN.h(x + fx * A, z + fz * A, t),
      hS = OCEAN.h(x - fx * A, z - fz * A, t),
      hP = OCEAN.h(x + fz * C, z - fx * C, t) /* port side */,
      hR = OCEAN.h(x - fz * C, z + fx * C, t),
      hv = (hB + hS + hP + hR) / 4 - OCEAN.Y,
      k = Math.min(1, dt * 2.2);
    s.hv += (hv - s.hv) * k;
    s.pi += (Math.atan2(hB - hS, 2 * A) * 0.85 - s.pi) * Math.min(1, dt * 1.6);
    const rT = Math.atan2(hP - hR, 2 * C) * 0.9 + (heel || 0),
      w0 = (2 * Math.PI) / s.T;
    s.vr += (w0 * w0 * (rT - s.ro) - 2 * 0.18 * w0 * s.vr) * dt;
    s.ro += s.vr * dt;
    return s;
  },
};
