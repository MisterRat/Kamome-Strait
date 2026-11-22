/* every ping: the operator's echo (the player's), or the AI operator's report to the bridge */
function commsEcho(E, here) {
  const sub = E.find((e) => e.sub);
  if (here) {
    if (sub) COMMS.sn.echo = { r: sub.r, dop: sub.dop, b: sub.b, beam: SONAR.brg, t: SHIP.t };
    return;
  }
  /* the AI operator: a fresh fix each echo (about 1 degree and 10 yards of error), none inside about 150 yards */
  if (sub && sub.r > 140) {
    const b = sub.b + (Math.random() - 0.5) * 0.035,
      r = sub.r + (Math.random() - 0.5) * 18,
      s = sub.t;
    COMMS.est = { p: cAt(b, r), v: s ? s.v.clone() : new THREE.Vector3(), t: SHIP.t, src: 'ai' };
  }
}
