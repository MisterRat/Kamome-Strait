/* every frame: the continuous voices: the master volume, the rain, the guns; the vehicle's own voices are its role's (sound) */
function audioUpd() {
  const S = SND;
  if (!S.ctx) return;
  const a = S.ctx,
    t = a.currentTime,
    set = (p, v, k) => p.setTargetAtTime(v, t, k || 0.08),
    live = started && !paused && !crashed,
    cockpit = camMode === 1;
  set(S.master.gain, S.on && !paused ? S.vol : 0, 0.05);
  SIMS.cur.sound(S, { t, set, live, cockpit }) /* the vehicle's own voices */;
  set(S.rn.g.gain, live ? 0.2 * Math.min(1.5, WX.rainK) * (cockpit ? 0.7 : 1) : 0, 0.3);
  set(S.gun.gain, live && performance.now() < S.gunUntil ? 0.45 : 0, 0.02);
}
$$('go').onclick = () => {
  started = true;
  audio();
  $$('start').style.display = 'none';
};
addEventListener('keydown', () => {
  if (started) audio();
});

