/* the enemy roads: from the port quay round the west end of the airbase (a spur turns in at its gate) and on to the depot where the convoy starts;
   and from the second base, where the convoy ends, back to the port */
const ROAD2C = new THREE.CatmullRomCurve3(
    [
      SITE.w(40, 5),
      SITE.w(40, -60),
      SITE.w(40, -115),
      SITE.w(30, -140),
      SITE.w(-20, -168),
      SITE.w(-100, -215),
      SITE.w(-220, -300),
      SITE.w(-560, -520),
      SITE.w(-740, -760),
      SITE.w(-740, -990),
      [1680, -5720],
      [1680, -5120],
      [1680, -4520],
      [1680, -3920],
      [1800, -3640],
      [2150, -3280],
      [2650, -2900],
      [3100, -2600],
      [3450, -2400],
      [3680, -2400],
      [3796, -2316],
      [3822, -2262],
      [3844, -2217],
      [3861, -2181],
    ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
    false,
    'catmullrom',
    0.5,
  ),
  RP2 = ROAD2C.getSpacedPoints(Math.ceil(ROAD2C.getLength() / 18)),
  ROAD3C = new THREE.CatmullRomCurve3(
    [
      [5311, -4363],
      [5317, -4397],
      [5323, -4432],
      [5285, -4480],
      [5220, -4535],
      [5160, -4580],
      [4680, -5060],
      [4200, -5540],
      [3600, -5720],
      SITE.w(900, -1500),
      SITE.w(820, -1000),
      SITE.w(800, -640),
      SITE.w(600, -590),
      SITE.w(300, -500),
      SITE.w(260, -300),
      SITE.w(180, -200),
      SITE.w(120, -135),
      SITE.w(95, -110),
      SITE.w(75, -105),
      SITE.w(58, -105),
      SITE.w(40, -105),
    ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
    false,
    'catmullrom',
    0.5,
  ),
  RP3 = ROAD3C.getSpacedPoints(Math.ceil(ROAD3C.getLength() / 18)),
  RSPUR = (() => {
    const o = [];
    for (let i = 0; i <= 14; i++) {
      const [x, z] = SITE.w(-740 + (i * 90) / 14, -990);
      o.push(new THREE.Vector3(x, 0, z));
    }
    for (let i = 1; i <= 6; i++) {
      const [x, z] = SITE.w(-650 + (i * 330) / 6, -990);
      o.push(new THREE.Vector3(x, 0, z));
    }
    return o;
  })();

