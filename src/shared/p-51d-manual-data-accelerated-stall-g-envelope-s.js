/* ---- P-51D manual data: accelerated-stall G envelope (SL-10k ft, 9000 lb), flap settings & speed limits ---- */
const GT = [
    [0, 0],
    [100, 1],
    [150, 1.9],
    [200, 3.2],
    [250, 4.8],
    [300, 6.7],
    [315, 7],
    [2000, 7],
  ],
  ANG_S = [0, 10, 20, 30, 45],
  FLIM_S = [999, 178.8, 122.9, 100.8, 100.8],
  /* the manual's flap settings and speed limits: 10 deg 400 mph, 20 deg 275, 30 deg 225, 40 deg 180, 50 deg 165 */
  ANG_H = [0, 10, 20, 30, 40, 50],
  FLIM_H = [999, 178.8, 122.9, 100.6, 80.5, 73.8];
let ANG = ANG_S,
  FLIM = FLIM_S,
  flapHC = false;
