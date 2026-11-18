/* the convoy road: out of the gate of Airbase Yamamoto, along the enemy road past the coast, and in to Depot Tanaka (the last leg doubles back on the start of the depot road) */
const CVC = new THREE.CatmullRomCurve3(
    [
      SITE.w(-320, -990), SITE.w(-480, -990), SITE.w(-650, -990), SITE.w(-740, -990),
      [1680, -5720], [1680, -5120], [1680, -4520], [1680, -3920], [1800, -3640], [2150, -3280], [2650, -2900], [3100, -2600], [3450, -2400], [3680, -2400],
      [3796, -2316], [3822, -2262], [3844, -2217], [3858, -2190], [3835, -2165], [3790, -2140], [3745, -2118], [3700, -2100],
    ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
    false,
    'catmullrom',
    0.5,
  ),
  CLEN = CVC.getLength(),
  LPC = new THREE.CatmullRomCurve3(
    [
      SITE.w(-740, -990),
      [1680, -5720], [1680, -5120], [1680, -4520], [1680, -3920], [1800, -3640], [2150, -3280], [2650, -2900], [3100, -2600], [3450, -2400], [3680, -2400],
      [3796, -2316], [3822, -2262], [3844, -2217], [3861, -2181], [3990, -2260], [4150, -2350], [4600, -2800], [4750, -3400], [4950, -3950], [5150, -4250],
      [5311, -4363], [5317, -4397], [5323, -4432], [5285, -4480], [5220, -4535], [5160, -4580], [4680, -5060], [4200, -5540], [3600, -5720],
      SITE.w(900, -1500), SITE.w(820, -1000), SITE.w(800, -640), SITE.w(600, -590), SITE.w(300, -500), SITE.w(260, -300), SITE.w(180, -200), SITE.w(120, -135), SITE.w(95, -110), SITE.w(75, -105), SITE.w(58, -105), SITE.w(40, -110),
      SITE.w(30, -140), SITE.w(-20, -168), SITE.w(-100, -215), SITE.w(-220, -300), SITE.w(-560, -520), SITE.w(-740, -760),
    ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
    true,
    'catmullrom',
    0.5,
  ),
  LLEN = LPC.getLength(),
  CVE = (() => {
    /* the meeting point for the strafing mission: on the straight leg heading south-east, where the pilot comes in from behind */
    let b = 0, bd = 1e9;
    for (let s = 0; s < CLEN; s += 10) {
      const p = CVC.getPointAt(s / CLEN), d = Math.hypot(p.x - 2650, p.z + 2900);
      if (d < bd) { bd = d; b = s; }
    }
    return b;
  })();
const RLEN = ROADC.getLength(),
  RP = ROADC.getSpacedPoints(Math.ceil(RLEN / 18)),
  DEPOT = [3700, -2100],
  BASE = [5400, -4350];
function nearRoad(x, z, d) {
  for (let i = 0; i < RP.length; i += 2) {
    const dx = RP[i].x - x,
      dz = RP[i].z - z;
    if (dx * dx + dz * dz < d * d) return true;
  }
  for (const L of [RP2, RP3, RSPUR])
    for (let i = 0; i < L.length; i += 2) {
      const dx = L[i].x - x,
        dz = L[i].z - z;
      if (dx * dx + dz * dz < d * d) return true;
    }
  return false;
}
