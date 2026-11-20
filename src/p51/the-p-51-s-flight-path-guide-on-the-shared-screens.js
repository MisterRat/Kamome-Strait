/* the P-51's flight path guide on the shared screens: its path on the minimap, its target marked, its advice in the coach box (HOOKS) */
HOOKS.mapTarget.push((b) => guide.tgt === b && trn.mode === 'bomb');
HOOKS.coachInfo.push(() => (guide.on && guide.info && guide.pts.length > 1 ? guide.info : ''));
HOOKS.mapDraw.push((g, lw) => {
    if (guide.on && trn.mode !== 'free' && guide.pts.length > 1) {
      const P = guide.pts;
      g.lineWidth = lw(2.2);
      g.strokeStyle = '#55ff88';
      g.beginPath();
      let pf = false;
      P.forEach((q, i) => {
        if (q.fin && !pf) {
          g.stroke();
          g.strokeStyle = '#ffd24a';
          g.beginPath();
          g.moveTo(P[Math.max(0, i - 1)].x, P[Math.max(0, i - 1)].z);
          pf = true;
        }
        if (i) g.lineTo(q.x, q.z);
        else g.moveTo(q.x, q.z);
      });
      g.stroke();
    }
});
