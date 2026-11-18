/* near detail on the landing gear (hidden when the camera is far, like the rest of the aircraft's detail): tread rings, hub bolts, brake discs, chrome oleo pistons, tail-wheel fork */
{
  const gd = new THREE.Group(),
    chrome = PH(0xd8dade, 90, 0xffffff),
    tread = new THREE.MeshLambertMaterial({ color: 0x2c2c2e }),
    bolt = PH(0x55595d, 40, 0x666666);
  gear.add(gd);
  gd.visible = false;
  PDET.list.push(gd);
  gd.userData.merge = true;
  const put = (g, m, x, y, z, rz) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    if (rz) o.rotation.z = rz;
    gd.add(o);
    return o;
  };
  [-1, 1].forEach((sd) => {
    const wx = sd * GEAR.mainX,
      wy0 = GEAR.mainY,
      wz = GEAR.mainZ;
    [-0.06, 0, 0.06].forEach((dx) =>
      put(new THREE.TorusGeometry(GEAR.mainR - 0.004, 0.017, 6, 36).rotateY(Math.PI / 2), tread, wx + dx, wy0, wz),
    );
    for (let k = 0; k < 8; k++) {
      const th = (k / 8) * 6.283;
      put(
        new THREE.CylinderGeometry(0.014, 0.014, 0.03, 6).rotateZ(Math.PI / 2),
        bolt,
        wx + sd * 0.115,
        wy0 + Math.cos(th) * 0.12,
        wz + Math.sin(th) * 0.12,
      );
    }
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12).rotateZ(Math.PI / 2), chrome, wx + sd * 0.12, wy0, wz);
    put(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 24).rotateZ(Math.PI / 2), bolt, wx - sd * 0.12, wy0, wz);
    const ga = gearTop(sd),
      gb = gearAxle(sd);
    GV.set(gb[0] - ga[0], gb[1] - ga[1], gb[2] - ga[2]);
    const gl = GV.length();
    GV.normalize();
    const pst = put(
      new THREE.CylinderGeometry(0.036, 0.036, 0.5, 10),
      chrome,
      gb[0] - GV.x * 0.32,
      gb[1] - GV.y * 0.32,
      gb[2] - GV.z * 0.32,
    );
    pst.quaternion.setFromUnitVectors(GY, GV);
    const bl = put(new THREE.CylinderGeometry(0.01, 0.01, gl * 0.8, 5), dark, ga[0] + (gb[0] - ga[0]) * 0.5, ga[1] + (gb[1] - ga[1]) * 0.5, ga[2] + 0.1);
    bl.quaternion.setFromUnitVectors(GY, GV);
  });
  [-1, 1].forEach((sd) => put(new THREE.BoxGeometry(0.018, 0.16, 0.045), metal2, sd * 0.065, -0.6, GEAR.tailZ));
  mergeGroup(gd);
}
let gearOn = true;
