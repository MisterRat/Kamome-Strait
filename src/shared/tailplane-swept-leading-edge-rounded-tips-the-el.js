/* tailplane: swept leading edge, rounded tips; the elevator is the part behind the hinge line */
add(
  slab(
    [
      [-2.008, fz(318.5)],
      [-1.93, fz(317.5)],
      [-0.12, fz(307.2)],
      [0.12, fz(307.2)],
      [1.93, fz(317.5)],
      [2.008, fz(318.5)],
      [2.008, EL_Z],
      [-2.008, EL_Z],
    ],
    0.07,
  ),
  metal,
  0,
  STB_Y,
  0,
);
