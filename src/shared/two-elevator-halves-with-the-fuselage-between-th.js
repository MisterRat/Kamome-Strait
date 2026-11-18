/* two elevator halves with the fuselage between them (blueprint: 13.05 sq ft with tabs) */
[-1, 1].forEach((sd) =>
  add(
    slab(
      [
        [sd * 0.11, 0],
        [sd * 2.008, 0],
        [sd * 2.008, fz(347) - EL_Z],
        [sd * 1.9, fz(348.5) - EL_Z],
        [sd * 0.11, fz(354.5) - EL_Z],
      ],
      0.08,
    ),
    metal2,
    0,
    0,
    0,
    elevG,
  ),
);
