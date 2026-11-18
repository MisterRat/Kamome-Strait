/* rudder: hinged on its vertical hinge line, deflects with the pedals (s.y) */
const pmatTab = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.6, metalness: 0.3 }); /* trim tabs */
const rudG = new THREE.Group();
rudG.position.set(0, FIN_H, RUD_Z);
model.add(rudG);
add(
  plate(
    [
      [0, 0],
      [fz(372) - RUD_Z, 0],
      [fz(376) - RUD_Z, -0.167],
      [fz(384.2) - RUD_Z, -1.037],
      [fz(387.3) - RUD_Z, -1.607],
      [fz(386.2) - RUD_Z, -1.8],
      [fz(381) - RUD_Z, -1.9],
      [fz(372) - RUD_Z, -1.92],
      [0, -1.92],
    ],
    0.1,
  ),
  metal2,
  0,
  0,
  0,
  rudG,
);
const RUD_AX = new THREE.Vector3(0, 1, 0);
const rudTab = new THREE.Group();
{
  const zte = (y) =>
      y > -1.037
        ? fz(376) - RUD_Z + ((fz(384.2) - fz(376)) * (-0.167 - y)) / 0.87
        : fz(384.2) - RUD_Z + ((fz(387.3) - fz(384.2)) * (-1.037 - y)) / 0.57,
    y0 = -1.5,
    y1 = -1.05,
    zh = zte((y0 + y1) / 2) - 0.15;
  rudTab.position.set(0, 0, zh);
  rudG.add(rudTab);
  add(
    plate(
      [
        [0, y0],
        [zte(y0) - zh, y0],
        [zte(y1) - zh, y1],
        [0, y1],
      ],
      0.11,
    ),
    pmatTab,
    0,
    0,
    0,
    rudTab,
  );
}
