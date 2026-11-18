/* everything built so far is scenery that never moves: stop re-computing its matrices every frame */
scene.traverse((o) => {
  if (o === sky || o.parent === sky || o.isLight) return;
  o.updateMatrix();
  o.matrixAutoUpdate = false;
  if (o.isMesh && !o.isSprite) (Array.isArray(o.material) ? o.material : [o.material]).forEach(csApply);
});
