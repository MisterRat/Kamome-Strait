/* the PCE's voices each frame: her two diesels, blowers, exhaust, screws, the wash and the wind over the deck, mixed by station */
SIMS.add({
  id: 'pce',
  sound: (S, { t, set, live, cockpit }) => {
    set(S.e.out.gain, 0, 0.1) /* the Merlin's voices are not hers */;
    /* THE PCE: her two diesels follow the engine room's answer from about 300 rpm (stop, declutched) to 744 at full ahead (or
       astern), firing 12 times a revolution, the port engine a little off the starboard so the two beat slowly against each other.
       What you hear depends on where you are: the engine room is all engines and blowers; the bridge and the guns hear the exhaust,
       the wash and the wind, the after stations the screws */
    {
      const D = S.d,
        a = Math.min(1, Math.abs(ENG.ans)),
        rpm = 300 + 444 * a,
        sp = Math.min(1.2, Math.abs(SHIP.u) / SHIP.VMAX),
        sub = SHIP.sub || 0,
        st = camMode === 1 ? SHIP.stn : 0,
        /* the mix by station: engines, their muffling (low-pass Hz), blower whine, exhaust, screws, wash, wind */
        MX = {
          0: [0.55, 650, 0.1, 0.7, 0.5, 1.0, 0.8] /* outside, the chase camera */,
          1: [0.4, 360, 0.08, 0.35, 0.12, 0.4, 0.25] /* the OOD in the pilothouse */,
          2: [1.6, 2400, 1.0, 0.25, 0.35, 0.12, 0.0] /* the forward engine room */,
          3: [0.45, 320, 0.1, 0.25, 0.15, 0.25, 0.08] /* communications */,
          4: [
            [0.3, 450, 0.03, 0.4, 0.1, 1.1, 1.0] /* the 3"/50 on the forecastle */,
            [0.65, 650, 0.12, 0.8, 0.3, 0.8, 0.9] /* the 20 mm amidships */,
            [0.5, 600, 0.08, 0.6, 0.9, 0.7, 0.9] /* the 40 mm aft */,
          ],
          5: [
            [0.3, 450, 0.03, 0.4, 0.1, 1.1, 1.0] /* the Hedgehog forward */,
            [0.55, 600, 0.1, 0.6, 0.9, 0.8, 0.9] /* the K-guns aft */,
            [0.55, 600, 0.1, 0.6, 0.9, 0.8, 0.9],
            [0.4, 520, 0.05, 0.5, 1.3, 0.8, 0.9] /* the stern racks */,
          ],
        },
        mx0 = MX[st] || MX[0],
        mx = Array.isArray(mx0[0]) ? mx0[Math.min(sub, mx0.length - 1)] : mx0,
        on = live ? S.eng : 0;
      D.eng.forEach((g, k) => {
        const r = rpm * (k ? 1.006 : 1) * (1 + 0.004 * Math.sin(t * (0.21 + k * 0.07))) /* the governors hunt a little */,
          rev = r / 60;
        set(g.o.frequency, rev * 12);
        set(g.q.frequency, rev * 6);
        set(g.lf.frequency, rev);
        set(g.lfG.gain, 0.12 + 0.18 * (1 - a));
        set(g.wh.frequency, rev * 52 * (k ? 1.004 : 1));
        set(g.f.frequency, mx[1] * (0.75 + 0.45 * a));
        set(g.amp.gain, on * mx[0] * (0.35 + 0.65 * a) * 0.55, 0.25);
        set(g.whG.gain, on * mx[2] * (0.04 + 0.1 * a) * 0.35, 0.25);
      });
      set(D.ex.g.gain, on * mx[3] * (0.25 + 0.75 * a) * 0.5, 0.25);
      /* the screws: three blades, the shafts geared down about 2.5:1, a beat of 6 to 15 a second in the water aft */
      set(D.pr.lfo.frequency, ((rpm / 2.5) / 60) * 3);
      set(D.pr.mod.gain, 0.4);
      set(D.pr.g.gain, on * mx[4] * (0.08 + 0.92 * a) * 0.8, 0.3);
      /* the wash along the hull: a slop of sea at rest, a rush that builds with speed */
      set(D.wa.f.frequency, 450 + 500 * sp);
      set(D.wa.g.gain, on * mx[5] * (0.05 + 0.6 * Math.pow(sp, 1.5)) * 0.9, 0.3);
      /* the wind over the deck: the true wind (the weather's) less the ship's own way through the water */
      const n = WX.wnd || { spd: 0, from: 0 },
        wd = ((n.from + 180) * Math.PI) / 180,
        wx = (WX.wx_ || Math.sin(wd) * n.spd) + Math.sin(SHIP.hdg) * SHIP.u,
        wz = (WX.wz_ || -Math.cos(wd) * n.spd) + Math.cos(SHIP.hdg) * SHIP.u,
        rel = Math.hypot(wx, wz);
      set(S.w.f.frequency, 300 + rel * 22);
      set(S.w.g.gain, on * mx[6] * Math.min(1, Math.pow(rel / 16, 2)) * 0.5, 0.2);
    }
    set(S.r.g.gain, 0, 0.1) /* nor the tyres' rumble */;
    set(S.wg.gain, 0, 0.01) /* nor the warning horns */;
  },
});
