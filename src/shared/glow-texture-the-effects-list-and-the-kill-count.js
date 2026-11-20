/* the glow sprite texture (muzzle flashes, lights, bursts), the list of live visual effects (effects.js) and the count of targets
   destroyed: used by every simulator's weapons and the world's */
const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,.7)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const FX = [];
let killed = 0;
