/* distance along the unit direction (dx,dy,dz) from a to the first cloud in the way, or Infinity (the weather's clouds only, whatever the graphics setting) */
function aaCloudT(a, dx, dy, dz, len) {
  const r = CSH.root.position;
  let best = DECK.hit(a, dx, dy, dz, len); /* the solid layer first */
  for (const c of CLOUDS) {
    if (!c.userData.wx) continue;
    const ex = 0.4 * c.scale.x,
      ey = 0.3 * c.scale.y,
      ox = (a.x - (c.position.x + r.x)) / ex,
      oy = (a.y - c.position.y) / ey,
      oz = (a.z - (c.position.z + r.z)) / ex,
      qx = dx / ex,
      qy = dy / ey,
      qz = dz / ex,
      A = qx * qx + qy * qy + qz * qz,
      B = ox * qx + oy * qy + oz * qz,
      C = ox * ox + oy * oy + oz * oz - 1,
      D = B * B - A * C;
    if (D < 0) continue;
    const t = Math.max(0, (-B - Math.sqrt(D)) / A);
    if (t < best && t < len && (-B + Math.sqrt(D)) / A > 0) best = t;
  }
  return best;
}
function aaDir(y, e, o) {
  return o.set(Math.sin(y) * Math.cos(e), Math.sin(e), Math.cos(y) * Math.cos(e));
}
function aaWrap(d) {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
function aaSlew(a, b, r, dt) {
  const d = aaWrap(b - a);
  return a + Math.max(-r * dt, Math.min(r * dt, d));
}
const abPos = new Float32Array(200 * 6),
  abGeo = new THREE.BufferGeometry();
abGeo.setAttribute('position', new THREE.BufferAttribute(abPos, 3));
abGeo.setDrawRange(0, 0);
const abLines = new THREE.LineSegments(abGeo, new THREE.LineBasicMaterial({ color: 0xffb860, fog: false }));
abLines.frustumCulled = false;
scene.add(abLines);
