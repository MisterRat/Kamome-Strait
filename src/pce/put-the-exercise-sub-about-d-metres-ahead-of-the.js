/* put the exercise sub about d metres ahead of the ship, within 25 degrees of the bow, on a fresh circle of his own */
function aswPlace(sub, d, rb) {
  const o = sub.o,
    b = SHIP.hdg - (rb != null ? rb : (Math.random() - 0.5) * 0.9) /* rb: his bearing from our bow, + to starboard */,
    P = new THREE.Vector3(pos.x - Math.sin(b) * d, 0, pos.z - Math.cos(b) * d);
  o.a = Math.random() * Math.PI * 2;
  o.c = new THREE.Vector3(P.x - Math.cos(o.a) * o.R, 0, P.z + Math.sin(o.a) * o.R);
  sub.p.set(P.x, OCEAN.Y - o.d, P.z);
}
