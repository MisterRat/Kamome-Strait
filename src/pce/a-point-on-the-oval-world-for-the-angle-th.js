/* a point on the oval (world), for the angle th */
function ptTowAt(o, th, v) {
  return v.copy(o.c).addScaledVector(o.u, PTOW.A * Math.cos(th)).addScaledVector(o.w, PTOW.B * Math.sin(th));
}
