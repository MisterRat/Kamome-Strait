/* every frame: set the continuous voices from the flight state */
function audioUpd() {
  const S = SND;
  if (!S.ctx) return;
  const a = S.ctx,
    t = a.currentTime,
    set = (p, v, k) => p.setTargetAtTime(v, t, k || 0.08),
    live = started && !paused && !crashed,
    v = vel.length(),
    ias = FM.ias || v,
    dry = FM.use('fuel') && FM.fuel <= 0,
    alive = !engOut && !dry && !(DM.on && DM.eng >= 1),
    rpm = alive ? Math.min(3300, 700 + thr * 2300 + Math.max(0, v * 2.237 - 420) * 3) : 250 + v * 4,
    cockpit = camMode === 1;
  set(S.master.gain, S.on && !paused ? S.vol : 0, 0.05);
  const e = S.e,
    fire = (rpm / 60) * 6,
    rough = FM.hot || (DM.on && DM.eng > 0.3) ? 1.04 : 1;
  set(e.o1.frequency, fire);
  set(e.o2.frequency, fire * 1.012 * rough);
  set(e.o3.frequency, fire / 2);
  set(e.bl.frequency, (rpm / 60) * 3);
  set(e.lfo.frequency, 6 + (rpm / 60) * 0.4);
  set(e.lfoG.gain, 0.04 + 0.12 * (1 - thr) + (FM.hot ? 0.2 : 0));
  set(e.f.frequency, (220 + thr * 380 + (alive ? 0 : -100)) * (cockpit ? 0.75 : 1));
  set(e.raspG.gain, 0.05 + thr * 0.2);
  let lvl = alive ? (0.3 + 0.5 * thr) * S.eng * (1 - 0.35 * (DM.on ? DM.eng : 0)) : 0.04;
  if (alive && DM.on && DM.eng > 0.3 && Math.random() < 0.15 * DM.eng) lvl *= 0.4; /* coughing */
  if (alive && FM.use('fuel') && FM.fuel < 0.03 && Math.random() < 0.4) lvl *= 0.15; /* sputtering */
  set(e.out.gain, live ? lvl : 0, 0.12);
  const w = Math.min(1, Math.pow(ias / 150, 2)),
    extra = 1 + (gearOn ? 0.25 : 0) + (flapLvl > 0 ? 0.25 : 0) + Math.min(1, buffet) * 0.6;
  set(S.w.f.frequency, 350 + ias * 9);
  set(S.w.g.gain, live ? 0.55 * S.eng * w * extra * (cockpit ? 0.55 : 1) : 0, 0.1);
  set(S.r.g.gain, live && onGround ? Math.min(1, v / 35) * 0.55 : 0, 0.1);
  set(S.rn.g.gain, live ? 0.2 * Math.min(1.5, WX.rainK) * (cockpit ? 0.7 : 1) : 0, 0.3);
  set(S.gun.gain, live && performance.now() < S.gunUntil ? 0.45 : 0, 0.02);
  /* warning tone: spin > stall > redline > overstress */
  let wf = 0,
    wv = 0;
  const ph = t % 1;
  if (live && FM.spin) {
    wf = ph % 0.33 < 0.165 ? 420 : 620;
    wv = 0.06;
  } else if (live && stalled && !onGround) {
    wf = 480;
    wv = (ph * 6) % 1 < 0.5 ? 0.06 : 0;
  } else if (live && FM.red > 470) {
    wf = 880 + 60 * Math.sin(t * 20);
    wv = 0.05;
  } else if (live && FM.over > 1) {
    wf = 1250;
    wv = (ph * 4) % 1 < 0.4 ? 0.06 : 0;
  }
  if (wf) set(S.wo.frequency, wf, 0.01);
  set(S.wg.gain, wv, 0.01);
}
$$('go').onclick = () => {
  started = true;
  audio();
  $$('start').style.display = 'none';
};
addEventListener('keydown', () => {
  if (started) audio();
});

