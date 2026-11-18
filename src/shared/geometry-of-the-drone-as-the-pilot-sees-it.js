/* geometry of the drone as the pilot sees it */
function aeroTgt() {
  const e = EN.find((x) => x.drone && !x.dying);
  if (!e) return null;
  const to = e.p.clone().sub(pos),
    d = Math.max(1, to.length()),
    dir = to.clone().divideScalar(d),
    rel = vel.clone().sub(e.v);
  return {
    e,
    d,
    ata: Math.acos(Math.max(-1, Math.min(1, fwd.dot(dir)))) * 57.3,
    dy: e.p.y - pos.y /* + = he is above you */,
    closing: rel.dot(dir) * 3.6,
    his: e.v.length() * 3.6,
    asp: Math.acos(Math.max(-1, Math.min(1, e.fwd.dot(dir.clone().negate())))) * 57.3,
    side: fwd.clone().cross(dir).y > 0 ? 'left' : 'right',
    elev: (Math.asin(Math.max(-1, Math.min(1, dir.y))) - Math.asin(Math.max(-1, Math.min(1, fwd.y)))) * 57.3 /* + = he is above your nose */,
    cl: (() => {
      const tb = dir.clone().applyQuaternion(q.clone().invert());
      return (Math.round((Math.atan2(tb.x, -tb.z) * 57.3) / 30) + 12) % 12 || 12;
    })(),
  };
}
