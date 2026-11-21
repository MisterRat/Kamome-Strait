/* bandit screen marker + lead indicator */
const bdE = $$('bd'),
  bdT = $$('bdt'),
  ldE = $$('lead');
function updBandit() {
  let best = null,
    bdist = 1e9;
  EN.forEach((e) => {
    if (e.dying) return;
    const d = e.p.distanceTo(pos);
    if (d < bdist) {
      bdist = d;
      best = e;
    }
  });
  if (!best || crashed || !started) {
    bdE.style.display = bdT.style.display = 'none';
    for (const e of LEADS) e.style.display = 'none';
    return;
  }
  const pr = best.p.clone().project(cam),
    behind = pr.z > 1;
  let x = pr.x,
    y = pr.y;
  if (behind) {
    x = -x;
    y = -y;
  }
  const off = behind || Math.abs(x) > 0.92 || Math.abs(y) > 0.88;
  if (off) {
    const m = Math.max(Math.abs(x) / 0.92, Math.abs(y) / 0.88, 1e-3);
    x /= m;
    y /= m;
  }
  const px = (x * 0.5 + 0.5) * innerWidth,
    py = (1 - (y * 0.5 + 0.5)) * innerHeight;
  bdE.style.display = bdT.style.display = 'block';
  bdE.className = off ? 'off' : '';
  bdE.style.left = bdT.style.left = px + 'px';
  bdE.style.top = bdT.style.top = py + 'px';
  bdE.style.transform = 'translate(-50%,-50%)' + (off ? ' rotate(' + Math.atan2(x, y) + 'rad)' : '');
  const dy = best.p.y - pos.y;
  bdT.textContent =
    'BANDIT ' +
    fmtD(bdist) +
    ' · ' +
    Math.round(best.sp * 3.6) +
    ' km/h · ALT ' +
    Math.round(best.p.y) +
    ' m (' +
    (dy >= 0 ? '\u25B2 ' : '\u25BC ') +
    Math.abs(Math.round(dy / 10) * 10) +
    ' m ' +
    (dy >= 0 ? 'above' : 'below') +
    ' you)';
  /* a lead ring on every bandit within 1,500 m (the user's, 2026-11-21): where to aim for the guns' rounds to meet it (the guns'
     time of flight, gravity drop, its motion against ours). The nearest keeps the first ring; the others have rings of their own */
  const L = [];
  for (const e of EN) if (!e.dying && e.p.distanceTo(pos) < 1500) L.push({ p: e.p, v: e.fwd.clone().multiplyScalar(e.sp) });
  if (typeof AIRSUP !== 'undefined') for (const u of AIRSUP.L) if (u.side === 'jp' && !u.down && u.p.distanceTo(pos) < 1500) L.push({ p: u.p, v: u.v });
  let n = 0;
  for (const b of L) {
    const d = b.p.distanceTo(pos),
      tt = d / 880,
      lp = b.p.clone().addScaledVector(b.v.clone().sub(vel), tt);
    lp.y += 4.9 * tt * tt;
    const lq = lp.project(cam);
    if (lq.z >= 1 || Math.abs(lq.x) > 1 || Math.abs(lq.y) > 1) continue;
    const el = n === 0 ? ldE : leadRing(n);
    n++;
    el.style.display = 'block';
    el.style.left = (lq.x * 0.5 + 0.5) * innerWidth + 'px';
    el.style.top = (1 - (lq.y * 0.5 + 0.5)) * innerHeight + 'px';
  }
  if (n === 0) ldE.style.display = 'none';
  for (let k = Math.max(1, n); k < LEADS.length; k++) LEADS[k].style.display = 'none';
}
/* the extra lead rings: copies of the first (same look), made as they are needed */
const LEADS = [ldE];
function leadRing(k) {
  while (LEADS.length <= k) {
    const e = ldE.cloneNode(true);
    e.removeAttribute('id');
    ldE.parentNode.appendChild(e);
    LEADS.push(e);
  }
  return LEADS[k];
}

