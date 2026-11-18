/* the gunner's lines on the HUD */
function gunHUD() {
  const G = GUN.cur;
  if (!G) return '';
  const s = G.s,
    brg = ((((-(G.m.d.ry0 + G.tr) * 180) / Math.PI) % 360) + 360) % 360,
    el = (G.el * 180) / Math.PI;
  let st = G.cut ? '<span style="color:#ff8a6a">CUTOUT</span>' : 'READY';
  if (s.mag) st = G.rl > 0 ? 'NEW DRUM ' + Math.ceil(G.rl) + 's' : G.cut ? st : G.rnd + ' / ' + s.mag;
  if (s.auto) st = (G.cut ? 'CUTOUT &middot; ' : '') + 'LOADED ' + G.al[0] + ' &middot; ' + G.al[1];
  if (s.sight === 'scope' && !G.cut && G.ft > 0.15) st = 'LOADING';
  const rng = s.sight === 'scope' ? '<br>SIGHT <b>' + Math.round(GUN.rng / 0.9144 / 50) * 50 + '</b> yd' + (FM.use('range') ? ' (you set it)' : '') : '';
  return MOB
    ? `<br>${s.name}: ${Math.round(brg).toString().padStart(3, '0')}&deg; ${el.toFixed(0)}&deg; ${st}`
    : `<br><b>${s.name}</b><br>TRAIN <b>${Math.round(brg).toString().padStart(3, '0')}</b>&deg; rel &middot; ELEV <b>${el.toFixed(1)}</b>&deg;<br>${st}${rng}`;
}
