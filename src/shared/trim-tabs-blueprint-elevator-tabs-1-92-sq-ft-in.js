/* trim tabs (blueprint: elevator tabs 1.92 sq ft in all, rudder tab 0.81, aileron tab 1.46; each travels 10 degrees) */
const elevTabs = [],
  TABK = 0.1745; /* 10 degrees */
{
  const zr = fz(354.5) - EL_Z,
    zt = fz(347) - EL_Z,
    zte = (x) => zr + ((zt - zr) * (Math.abs(x) - 0.11)) / 1.898;
  [-1, 1].forEach((sd) => {
    const x0 = 0.35,
      x1 = 1.1,
      zh = zte((x0 + x1) / 2) - 0.13,
      tg = new THREE.Group();
    tg.position.set(0, 0, zh);
    elevG.add(tg);
    add(
      slab(
        [
          [sd * x0, 0],
          [sd * x1, 0],
          [sd * x1, zte(x1) - zh],
          [sd * x0, zte(x0) - zh],
        ],
        0.09,
      ),
      pmatTab,
      0,
      0,
      0,
      tg,
    );
    elevTabs.push(tg);
  });
}
