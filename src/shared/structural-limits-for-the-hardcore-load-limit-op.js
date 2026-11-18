/* structural limits for the hardcore load-limit option: +8 / -4 G at the 8,000 lb design weight, scaled down as the aircraft
   gets heavier, reduced a further 15% from 400 to 505 mph indicated, and weakened by earlier overstress */
function gLimits(iw, iasMph, o) {
  const k = Math.min(1, (8000 * iw) / 9000),
    sp = 1 - 0.15 * Math.max(0, Math.min(1, (iasMph - 400) / 105)),
    dm = 1 - 0.35 * FM.str;
  o.pos = 8 * k * sp * dm;
  o.neg = -4 * k * sp * dm;
  return o;
}
const V = THREE.Vector3,
  Q = THREE.Quaternion,
  E = THREE.Euler;
const cv = $$('c');
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, logarithmicDepthBuffer: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const SKY = 0xa9cdee;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 3000, 15000);
const cam = new THREE.PerspectiveCamera(65, 1, 1, 40000);
let SEAP = null; /* the open-sea plane (set where it is built) */
function rs() {
  R.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
addEventListener('resize', rs);
rs();
const hemi = new THREE.HemisphereLight(0xdfeeff, 0x55663a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 0.9);
sun.position.set(2, 3, 1);
scene.add(sun);

