/* the gunner's eye and line of sight (world), for the camera: the eye rides the carriage (seated pointers) or the gun (the 20 mm) */
function gunCam(eye, dir, upv) {
  const G = GUN.cur,
    d = G.m.d,
    scope = G.s.sight === 'scope' && !GUN.look,
    e = G.los !== undefined ? G.los : G.el - G.se;
  if (scope) G.m.el.localToWorld(eye.set(0.3, 0.2, d.eye[2])); /* at the telescope's objective: the overlay is the eyepiece */
  else if (d.eyeEl) G.m.el.localToWorld(eye.set(...d.eye));
  else G.m.tr.localToWorld(eye.set(d.eye[0], d.eye[1] + (G.s.sight === 'scope' ? 0.16 : 0), d.eye[2])); /* the 3"/50 pointer lifts his head off the eyepiece */
  dir.set(Math.cos(e), Math.sin(e), 0).transformDirection(G.m.tr.matrixWorld);
  upv.set(-Math.sin(e), Math.cos(e), 0).transformDirection(G.m.tr.matrixWorld);
  return scope ? G.s.fov : 65;
}
