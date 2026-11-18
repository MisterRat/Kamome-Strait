/* ---- cloud shadows: every cumulus puff is painted into a map that the ground, trees and buildings sample; the whole cloud field drifts with the wind ---- */
const CSH = {
  tex: null,
  off: { value: new THREE.Vector2() },
  k: { value: 0.28 },
  root: new THREE.Group(),
  wt: 0,
  sun: new THREE.Vector3(2, 3, 1).normalize(),
};
scene.add(CSH.root);
const CSZ = 512,
  csc = document.createElement('canvas');
csc.width = csc.height = CSZ;
const csx = csc.getContext('2d');
csx.fillStyle = '#000';
csx.fillRect(0, 0, CSZ, CSZ);
function csBlob(x, y, z, k) {
  const sx = x - (y * CSH.sun.x) / CSH.sun.y,
    sz = z - (y * CSH.sun.z) / CSH.sun.y,
    r = ((k * 0.5) / 26000) * CSZ; /* where this puff's shadow falls on the ground */
  for (const ox of [-1, 0, 1])
    for (const oz of [-1, 0, 1]) {
      const px = (sx / 26000 + 0.5) * CSZ + ox * CSZ,
        pz = (sz / 26000 + 0.5) * CSZ + oz * CSZ;
      if (px < -r || px > CSZ + r || pz < -r || pz > CSZ + r) continue;
      const g = csx.createRadialGradient(px, pz, r * 0.15, px, pz, r);
      g.addColorStop(0, 'rgba(255,255,255,.2)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      csx.fillStyle = g;
      csx.fillRect(px - r, pz - r, r * 2, r * 2);
    }
}
