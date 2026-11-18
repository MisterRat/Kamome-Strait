/* wing: tapered laminar-flow planform with dihedral and rounded tips. The box ends at the hinge line; flaps and ailerons make up the rest. */
{
  const g = new THREE.BoxGeometry(1, 1, 1, 28, 1, 6),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i) * 11.28,
      u = Math.min(1, Math.abs(X) / WSEMI),
      zl = wzle(u),
      zh = wzh(u);
    let ch = zh - zl;
    if (u > 0.88) ch *= Math.sqrt(Math.max(0.2, 1 - Math.pow((u - 0.88) / 0.12, 2) * 0.55));
    const th = 0.38 - 0.24 * u,
      vz = p.getZ(i),
      vy = p.getY(i);
    p.setXYZ(i, X, WR + vy * th * (1 - 0.75 * Math.pow(2 * vz, 2)) + u * WD, zh - ch + (vz + 0.5) * ch);
  }
  g.computeVertexNormals();
  add(g, metal, 0, 0, 0);
}
