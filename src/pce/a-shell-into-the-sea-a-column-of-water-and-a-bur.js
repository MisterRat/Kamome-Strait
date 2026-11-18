/* a shell into the sea: a column of water (and a burst for the 3"/50's point-detonating fuze) */
function gunSplash(p, s) {
  const k = s.splash,
    y = OCEAN.Y;
  for (let i = 0; i < 1 + Math.round(k * 4); i++)
    gunFx(GUN.sp.set(p.x + (Math.random() - 0.5) * k * 3, y + i * k * 3.2, p.z + (Math.random() - 0.5) * k * 3), 0xe9eef0, k * 4, k * 13, 1.2 + k * 1.6, k * 9 * (1 - i * 0.12), false);
  gunFx(GUN.sp.set(p.x, y + 0.5, p.z), 0xf4f7f8, k * 10, k * 24, 0.9 + k, 0, false);
  if (s.blast) gunFx(GUN.sp.set(p.x, y + 1, p.z), 0xffa040, k * 3, k * 9, 0.25, 0, true);
  gunSnd('splash', p, k);
}
function gunBurst(p, s, air) {
  gunFx(p, 0xffb040, s.splash * 6, s.splash * 16, 0.3, 0, true);
  if (FM.use('smoke')) gunFx(p, air ? 0x1c1c1c : 0x4a4038, s.splash * 6, s.splash * 26, air ? 6 : 3, air ? 0.3 : 2, false);
  else gunFx(p, air ? 0x303030 : 0x4a4038, s.splash * 3, s.splash * 7, 0.8, 0, false) /* game mode: a small, short puff */;
  if (s.blast) blast(p, s.blast[0], s.blast[1]);
  gunSnd('burst', p, s.splash);
}
