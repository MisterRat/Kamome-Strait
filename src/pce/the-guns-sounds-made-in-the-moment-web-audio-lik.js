/* the guns' sounds, made in the moment (Web Audio, like the P-51's): near ones loud and at once, far ones late */
function gunSnd(what, p, k) {
  if (!SND.ctx) return;
  const d = p ? p.distanceTo(cam.position) : 0,
    dl = Math.min(4, d / 340),
    v = 1 / (1 + d / 250);
  if (what === '3in') {
    SND.burst(2400, 70, 0.9, 0.95, 0.7);
    SND.tone(80, 28, 0.6, 0.6, 'sine');
    SND.burst(5000, 1500, 0.08, 0.4, 1, 'bandpass');
  } else if (what === '40') {
    SND.burst(1300, 90, 0.32, 0.6, 0.8);
    SND.tone(120, 45, 0.22, 0.35, 'sine');
  } else if (what === '20') {
    SND.burst(3000, 300, 0.08, 0.38, 1.2, 'bandpass');
    SND.burst(700, 90, 0.11, 0.3);
  } else if (what === 'splash') {
    if (v * k < 0.004) return;
    SND.burst(900, 120, 0.35 + k * 0.6, Math.min(0.5, v * k), 0.8, 'lowpass', dl);
  } else if (what === 'burst') {
    if (v * k < 0.004) return;
    SND.burst(1100, 60, 0.4 + k, Math.min(0.8, v * k * 1.4), 0.7, 'lowpass', dl);
  }
}
function gunFire(G, i) {
  const s = G.s,
    mz = G.m.d.muzzles[i],
    p = G.m.el.localToWorld(new V(mz[0], mz[1], mz[2])),
    d = GUN.V[0].set(1, 0, 0).transformDirection(G.m.el.matrixWorld);
  d.x += (Math.random() - 0.5) * 2 * s.spread;
  d.y += (Math.random() - 0.5) * 2 * s.spread;
  d.z += (Math.random() - 0.5) * 2 * s.spread;
  d.normalize();
  GUN.B.push({ p, v: d.clone().multiplyScalar(s.mv).add(vel), t: 0, r: 0, s, a: p.clone(), own: G === GUN.cur });
  G.rec = s.rec;
  G.fl[i].visible = true;
  G.fl[i].material.rotation = Math.random() * 6;
  G.flT = 0.05;
  if (FM.use('smoke')) gunFx(GUN.V[1].copy(p).addScaledVector(d, s.flash * 0.6), 0xb8b8b4, s.flash * 0.6, s.flash * 3, 1.2 + s.flash * 0.4, 0.4, false); /* muzzle smoke: Hardcore only (in game mode smoke never hides the target) */
  gunSnd(G.id, null, 1);
}
