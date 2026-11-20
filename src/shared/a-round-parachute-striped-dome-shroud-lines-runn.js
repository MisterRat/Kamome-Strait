/* a round parachute: striped dome, shroud lines running down to the harness at the origin */
function makeChute(r, c1, c2) {
  const g = new THREE.Group(),
    geo = new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1, 0.62, 1);
  const pa = geo.attributes.position,
    col = new Float32Array(pa.count * 3),
    ca = new THREE.Color(c1),
    cb = new THREE.Color(c2);
  for (let i = 0; i < pa.count; i++) {
    const a = Math.atan2(pa.getZ(i), pa.getX(i)),
      c = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12) & 1 ? ca : cb;
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dome = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: 0x4a4a4a }),
  );
  dome.position.y = 6.4;
  g.add(dome);
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(r * Math.cos(a), 6.4, r * Math.sin(a), 0, 0.55, 0);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xdcdcdc })));
  return g;
}
