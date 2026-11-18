/* is the line from a to b clear of the hills? (the AA crews and the coast batteries need to see their target) */
const _aaS = new THREE.Vector3();
function aaSees(a, b) {
  for (let k = 1; k < 24; k++) {
    const f = k / 24,
      x = a.x + (b.x - a.x) * f,
      z = a.z + (b.z - a.z) * f,
      y = a.y + (b.y - a.y) * f;
    if (H(x, z) > y) return false;
  }
  return true;
}
