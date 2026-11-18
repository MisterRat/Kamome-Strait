/* runway */
{
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#3a3c40';
  g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#ddd';
  g.fillRect(30, 20, 4, 110);
  g.fillRect(2, 0, 2, 256);
  g.fillRect(60, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, (2300 / 256) * 0.5);
  const len = RW.zS - RW.zN,
    m = new THREE.Mesh(
      new THREE.PlaneGeometry(50, len).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: t }),
    );
  t.repeat.set(1, len / 512);
  m.position.set(0, 0.15, (RW.zS + RW.zN) / 2);
  scene.add(m);
}

