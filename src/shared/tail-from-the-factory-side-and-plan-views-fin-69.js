/* tail, from the factory side and plan views: fin 69 9/16 in above the reference line, rudder hinge at station 362, tailplane span 13 ft 2 1/8 in,
   elevator hinge at station 338.5 */
const FIN_H = 1.767,
  RUD_Z = fz(362),
  STB_Y = 0.12,
  EL_Z = fz(338.5);
add(
  plate(
    [
      [fz(300), 0.4],
      [fz(310.9), 0.5],
      [fz(327.2), 0.6],
      [fz(337.4), 1.14],
      [fz(344.5), 1.66],
      [fz(351.6), FIN_H],
      [RUD_Z, FIN_H],
      [RUD_Z, 0.12],
      [fz(300), 0.12],
    ],
    0.08,
  ),
  metal,
  0,
  0,
  0,
);
