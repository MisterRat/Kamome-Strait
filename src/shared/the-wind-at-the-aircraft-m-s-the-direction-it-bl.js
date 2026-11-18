/* the wind at the aircraft (m/s, the direction it blows TOWARD), into o; sets turbulence intensity WX.tI.
   Wind and gusts need the Hardcore wind option; the vertical bumps need the turbulence option. */
function windNow(o) {
  o.set(0, 0, 0);
  WX.tI = 0;
  const hw = FM.use('wind'),
    agl = Math.max(0, pos.y - Math.max(0, H(pos.x, pos.z))),
    n = WX.wnd,
    t = WX.t;
  if (hw) {
    const g = Math.max(0, wnz(t * 0.45, 1)),
      sp = (n.spd + n.gust * g) * (0.7 + 0.5 * Math.min(1, agl / 500)),
      dir = ((n.from + 180 + 12 * wnz(t * 0.2, 5)) * Math.PI) / 180;
    o.set(Math.sin(dir) * sp, 0, -Math.cos(dir) * sp);
    WX.sp = sp;
    WX.dirTo = dir;
    WX.wx_ = o.x;
    WX.wz_ = o.z;
    WX.cdx = Math.sin(dir) * n.spd * 0.7;
    WX.cdz = -Math.cos(dir) * n.spd * 0.7;
  } else {
    WX.sp = WX.wx_ = WX.wz_ = 0;
  }
  if (FM.use('turb')) {
    const mech = hw ? Math.min(1, n.spd / 14) * Math.max(0, 1 - agl / 400) * 0.5 : 0;
    WX.tI = Math.min(1.4, (WXT[WX.wx] || 0) + mech);
    if (!onGround) o.y = 5 * WX.tI * (0.7 * wnz(t * 1.1, 2) + 0.4 * wnz(t * 3.3, 7));
  }
  return o;
}
function updWX(dt) {
  WX.update(dt);
  DECK.update(dt);
  /* photo mode: the fog is measured from the ground, so a camera high above the map still sees the whole of it instead of a white-out */
  if ((PHOTO.on || ROAM.on) && !DECK.fogOn) {
    const fs = WX.deckAbove ? WX_SET.clear : WX_SET[WX.wx],
      ay = Math.max(0, PHOTO.pos.y - 400);
    scene.fog.near = fs.fogN + ay * 4;
    scene.fog.far = fs.fogF + ay * 6;
  }
  if (SITE.vis) SITE.vis(dt);
}
WX.hour = WX.time === 'local' ? WX.localHour() : WX_HOUR[WX.time];
WX.windNew();
WX.apply();
