/* instrument panel: low, tilted toward the pilot's eye, sitting right behind the firewall */
{
  const pg = new THREE.Group();
  pg.position.set(0, 0.719, -1.465); /* the top edge stays where it was; the panel now reaches lower, like the real one */
  pg.rotation.x = -0.45;
  ck.add(pg);
  /* the panel is narrower at the top so it fits inside the windscreen: sloped shoulders over the upper 40% */
  const trap = (hw, hh, k, fl) => {
    const yb = hh - 0.4 * 2 * hh,
      sh = new THREE.Shape([
        new THREE.Vector2(-hw, -hh),
        new THREE.Vector2(hw, -hh),
        new THREE.Vector2(hw, yb),
        new THREE.Vector2(hw * k, hh),
        new THREE.Vector2(-hw * k, hh),
        new THREE.Vector2(-hw, yb),
      ]);
    return fl
      ? (() => {
          const g = new THREE.ShapeGeometry(sh),
            u = g.attributes.uv,
            ps = g.attributes.position;
          for (let q = 0; q < ps.count; q++) u.setXY(q, ps.getX(q) / (2 * hw) + 0.5, ps.getY(q) / (2 * hh) + 0.5);
          return g;
        })()
      : new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }).translate(0, 0, -0.025);
  };
  add(trap(0.48, 0.3, 0.74, false), pmatD, 0, 0, 0, pg);
  add(trap(0.45, 0.28125, 0.74, true), new THREE.MeshBasicMaterial({ map: ptex }), 0, 0, 0.028, pg);
  {
    const gc = document.createElement('canvas');
    gc.width = gc.height = 64;
    const gx = gc.getContext('2d'),
      gr = gx.createLinearGradient(0, 0, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.38, 'rgba(255,255,255,0)');
    gr.addColorStop(0.46, 'rgba(255,255,255,.55)');
    gr.addColorStop(0.52, 'rgba(255,255,255,.08)');
    gr.addColorStop(0.6, 'rgba(255,255,255,.3)');
    gr.addColorStop(0.66, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    gx.fillStyle = gr;
    gx.fillRect(0, 0, 64, 64);
    add(
      trap(0.45, 0.28125, 0.74, true),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(gc),
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      }),
      0,
      0,
      0.031,
      pg,
    );
  }
  add(new THREE.BoxGeometry(0.76, 0.03, 0.08), pmatD, 0, 0.295, 0.02, pg);
  add(new THREE.BoxGeometry(1.0, 0.02, 0.05), pmatD, 0, -0.295, 0.02, pg); /* bezel lips */
  [-1, 1].forEach((sd) => add(new THREE.BoxGeometry(0.03, 0.36, 0.07), pmatD, sd * 0.495, -0.12, 0.02, pg));
}
{
  /* glare shield: the corners are cut on diagonals so it stays inside the canopy */
  const gs = new THREE.Shape([
    new THREE.Vector2(-0.34, 0.08),
    new THREE.Vector2(0.34, 0.08),
    new THREE.Vector2(0.34, 0.04),
    new THREE.Vector2(0.25, -0.08),
    new THREE.Vector2(-0.25, -0.08),
    new THREE.Vector2(-0.34, 0.04),
  ]);
  add(
    new THREE.ExtrudeGeometry(gs, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.015, 0),
    dark,
    0,
    0.994,
    -1.66,
    ck,
  ).rotation.x = -0.08; /* joins the cowl top */
}
add(new THREE.BoxGeometry(0.07, 0.04, 0.1), dark, 0, 1.029, -1.66, ck); /* gunsight housing */
add(
  new THREE.PlaneGeometry(0.07, 0.05),
  new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.12, side: 2, depthWrite: false }),
  0,
  1.099,
  -1.6,
  ck,
).rotation.x = 0.9;
