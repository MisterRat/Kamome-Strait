/* the relative bearing (rad, + to starboard) and range (m) of a point */
function cRel(x, z) {
  const [bow, stb] = cAxes(),
    ex = x - pos.x,
    ez = z - pos.z;
  return [Math.atan2(ex * stb[0] + ez * stb[1], ex * bow[0] + ez * bow[1]), Math.hypot(ex, ez)];
}
function cAt(b, r) {
  const [bow, stb] = cAxes(),
    ca = Math.cos(b),
    sa = Math.sin(b);
  return new THREE.Vector3(pos.x + (bow[0] * ca + stb[0] * sa) * r, 0, pos.z + (bow[1] * ca + stb[1] * sa) * r);
}
