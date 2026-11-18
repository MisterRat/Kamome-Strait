/* the shadow map is painted from the puffs that are really shown: change the weather (or the graphics level) and it is painted again, so there is never a shadow without its cloud */
CSH.rebuild = () => {
  if (!CSH.tex) return;
  csx.globalCompositeOperation = 'source-over';
  csx.fillStyle = '#000';
  csx.fillRect(0, 0, CSZ, CSZ);
  for (const s of CLOUDS) if (s.visible) csBlob(s.position.x, s.position.y, s.position.z, s.scale.x);
  CSH.tex.needsUpdate = true;
};
