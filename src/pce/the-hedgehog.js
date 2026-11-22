/* ---------- the Hedgehog ---------- */
function hhFire() {
  if (HH.q.length || HH.L.length > 40) return false;
  if (HH.n <= 0) {
    note(HH.loading ? 'HEDGEHOG STILL LOADING (' + HH.n + ' OF 24)' : 'HEDGEHOG NOT LOADED - ' + kbText('hhLoad') + ' TO LOAD');
    return false;
  }
  const n = HH.n;
  HH.n = 0;
  HH.ld = 0;
  /* the cradles roll with the ship: the pattern goes off to the side by about the roll angle times the throw */
  const roll = SHIPW.ro * SHIPW.k;
  for (let i = 0; i < n; i++) HH.q.push({ t: (i >> 1) * 0.1, i, roll });
  SND.burst(1200, 300, 0.25, 0.35, 0.6);
  note('HEDGEHOG FIRED - ' + n + ' BOMBS');
  return true;
}
