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
    bdE.style.display = bdT.style.display = ldE.style.display = 'none';
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
  if (!off && bdist < 1500) {
    const tt = bdist / 880,
      ev = best.fwd.clone().multiplyScalar(best.sp),
      lp = best.p.clone().addScaledVector(ev.sub(vel), tt);
    lp.y += 4.9 * tt * tt;
    const lq = lp.project(cam);
    if (lq.z < 1) {
      ldE.style.display = 'block';
      ldE.style.left = (lq.x * 0.5 + 0.5) * innerWidth + 'px';
      ldE.style.top = (1 - (lq.y * 0.5 + 0.5)) * innerHeight + 'px';
    } else ldE.style.display = 'none';
  } else ldE.style.display = 'none';
}

