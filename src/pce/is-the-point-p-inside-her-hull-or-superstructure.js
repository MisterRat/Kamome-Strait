/* is the point p inside her hull or superstructure (a box hull with a tapered bow and stern, the bridge block higher)? */
function shipStruck(p) {
  const L = raidShipLocal(p, _shipL);
  return Math.abs(L.x) < 27 && Math.abs(L.z) < 4.8 - Math.max(0, Math.abs(L.x) - 18) * 0.35 && L.y > -0.5 && L.y < (Math.abs(L.x + 4) < 9 ? 8 : 4.5);
}
const _shipL = new THREE.Vector3();
