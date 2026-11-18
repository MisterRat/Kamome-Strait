/* the K-guns' loaded arbors: each gun's arbor (the stem in the muzzle, the curved tray) and its Mk 6 charge lying fore and aft on
   the tray, drawn apart from the ship so a gun shows empty once she has fired it and loaded again when her crew have reloaded it */
function kgArbors() {
  if (!SHIPM.mesh || !PCEM.KG) return;
  if (!DC.arb) {
    const grey = new THREE.MeshLambertMaterial({ color: 0x55605a }),
      green = new THREE.MeshLambertMaterial({ color: 0x3f4a3a }),
      band = new THREE.MeshLambertMaterial({ color: 0x2e352b });
    DC.arb = PCEM.KG.map((k) => {
      const g = new THREE.Group(),
        s = k.s,
        dir = new THREE.Vector3(0, Math.SQRT1_2, s * Math.SQRT1_2),
        stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), grey);
      stem.position.set(...k.mz).addScaledVector(dir, 0.12);
      stem.rotation.x = s * (Math.PI / 4);
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.5, 14, 1, true, Math.PI, Math.PI).rotateZ(Math.PI / 2), grey);
      tray.position.set(k.ch[0], k.ch[1] - 0.02, k.ch[2]);
      tray.material = grey;
      tray.geometry.computeVertexNormals();
      const dg = new THREE.CylinderGeometry(0.224, 0.224, 0.7, 14).rotateZ(Math.PI / 2),
        ch = new THREE.Mesh(dg, green);
      ch.position.set(...k.ch);
      g.add(stem, tray, ch);
      for (const e of [-0.33, 0.33]) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.03, 14).rotateZ(Math.PI / 2), band);
        b.position.set(k.ch[0] + e, k.ch[1], k.ch[2]);
        g.add(b);
      }
      SHIPM.mesh.add(g);
      return g;
    });
  }
  /* KG is port forward, port aft, starboard forward, starboard aft: the same order as DC.kl */
  DC.arb.forEach((g, i) => (g.visible = !!DC.kl[i]));
}
