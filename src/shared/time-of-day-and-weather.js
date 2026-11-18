/* ---------- time of day and weather ----------
   WX.hour (0-24) sets the sun: its height picks the sky, fog and light colours from the PAL table; WX_SET (the weather) then
   greys, darkens and thins it. paint() recolours the sky and lights (cheap, repeated while time passes); apply() also resizes the
   cloud field and sets up rain. Night has moon, stars, runway lights and wingtip lights. */
const WXP = (() => {
  const row = (e, hz, zn, sc, si, hs, hg, hi) => ({
    e,
    hz: new THREE.Color(hz),
    zn: new THREE.Color(zn),
    sc: new THREE.Color(sc),
    si,
    hs: new THREE.Color(hs),
    hg: new THREE.Color(hg),
    hi,
  });
  const PAL = [
      row(-0.3, 0x0d1626, 0x02050f, 0x9db4e0, 0.3, 0x4a5f8a, 0x1a2230, 0.85),
      row(-0.12, 0x3a3558, 0x0e1438, 0x9db4e0, 0.14, 0x5a5a88, 0x24262e, 0.8),
      row(0.02, 0xf0996a, 0x40608f, 0xff9a55, 0.45, 0xc9a08c, 0x4a4234, 0.65),
      row(0.12, 0xf3c79a, 0x4a78b8, 0xffd09a, 0.75, 0xdfd2c8, 0x55603a, 0.8),
      row(0.35, 0xbcd6ee, 0x3f7cc4, 0xfff2d8, 0.9, 0xdfeeff, 0x55663a, 0.9),
    ],
    O = {
      hz: new THREE.Color(),
      zn: new THREE.Color(),
      sc: new THREE.Color(),
      hs: new THREE.Color(),
      hg: new THREE.Color(),
      si: 0,
      hi: 0,
    },
    SD = new THREE.Vector3(),
    L = new THREE.Vector3(),
    GREY = new THREE.Color(),
    CC = new THREE.Color(),
    cl = (x) => Math.min(1, Math.max(0, x));
  function pal(e) {
    let i = 0;
    while (i < PAL.length - 2 && e > PAL[i + 1].e) i++;
    const a = PAL[i],
      b = PAL[i + 1],
      t = cl((e - a.e) / (b.e - a.e));
    for (const k of ['hz', 'zn', 'sc', 'hs', 'hg']) O[k].copy(a[k]).lerp(b[k], t);
    O.si = a.si + (b.si - a.si) * t;
    O.hi = a.hi + (b.hi - a.hi) * t;
  }
  return { O, SD, L, GREY, CC, cl, pal };
})();
