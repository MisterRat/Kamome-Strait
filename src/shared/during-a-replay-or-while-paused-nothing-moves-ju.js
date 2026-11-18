/* during a replay or while paused nothing moves: just keep the beams and glare off the screen */
AA.hide = function () {
  this.bl.length = 0;
  abGeo.setDrawRange(0, 0);
  this.lamp.forEach((L) => {
    L.beam.visible = false;
    L.glow.visible = false;
    L.spl.visible = false;
  });
  const d = document.getElementById('dazzle');
  if (d) d.style.opacity = 0;
};
