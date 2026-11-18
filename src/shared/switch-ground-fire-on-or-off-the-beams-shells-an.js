/* switch ground fire on or off: the beams, shells and glare go with it */
AA.apply = function () {
  if (!this.on) {
    this.bl.length = 0;
    abGeo.setDrawRange(0, 0);
    this.lamp.forEach((L) => {
      L.beam.visible = false;
      L.glow.visible = false;
      L.spl.visible = false;
      L.lens.material.color.set(0x8c9bb0);
      L.lit = false;
      L.mode = 'search';
    });
    this.lit = 0;
    this.dz = 0;
    const d = document.getElementById('dazzle');
    if (d) d.style.opacity = 0;
  }
};
