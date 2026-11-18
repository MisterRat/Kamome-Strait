/* convoy: one at a time, timed */
const CV = { pre: 0, list: [], q: [], st: 'idle', tm: 8, gap: 20, spd: 18, sp: 0, total: 0, destroyed: 0, escaped: 0 };
function convoyClear() {
  CV.list.forEach((v) => {
    scene.remove(v.m);
    v.m.material.dispose(); /* the geometry is shared per model type; only the per-vehicle material is released */
    const i = T.indexOf(v);
    if (i >= 0) T.splice(i, 1);
  });
  CV.list = [];
  CV.q = [];
}
function updConvoy(dt) {
  if (trn.mode !== 'free' && trn.mode !== 'convoy') return;
  if (CV.st === 'idle') {
    CV.tm -= dt;
    if (CV.tm <= 0) {
      CV.st = 'run';
      CV.q = ['jeep', 'supply', 'supply', 'tanker', 'supply', 'apc'];
      CV.list = [];
      CV.sp = 0;
      CV.total = 0;
      if (trn.mode === 'convoy') note('CONVOY ON THE ROAD FROM AIRBASE YAMAMOTO TO DEPOT TANAKA');
      if (CV.pre > 0) {
        /* the mission starts with the convoy already under way, so the run meets it on the straight leg */
        const n = Math.round(CV.pre * 10);
        CV.pre = 0;
        for (let k = 0; k < n; k++) updConvoy(0.1);
      }
    }
  } else if (CV.st === 'run') {
    CV.sp -= dt;
    if (CV.q.length && CV.sp <= 0) {
      const c0 = (trn.mode === 'convoy' ? CVC : LPC).getPointAt(0),
        v = mkT(CV.q.shift(), c0.x, c0.z, 0, 'veh');
      v.s = 0;
      /* small Japanese flags on the antennas of the lead and the rear vehicle */
      if (CV.total === 0 || !CV.q.length) {
        /* the flag is hung from the tip of the vehicle's own whip antenna (its highest point) */
        const ps = v.m.geometry.attributes.position;
        let ty = -1e9, tx = 0, tz = 0;
        for (let i = 0; i < ps.count; i++) if (ps.getY(i) > ty) (ty = ps.getY(i)), (tx = ps.getX(i)), (tz = ps.getZ(i));
        v.m.add(FLG.flagOnly('jn', 0.5, tx, ty - 0.06, tz, Math.PI / 2));
      }
      CV.list.push(v);
      CV.total++;
      CV.sp = 1.7;
    }
    const lp = trn.mode !== 'convoy', C = lp ? LPC : CVC, L = lp ? LLEN : CLEN;
    for (const v of CV.list) {
      if (v.dead) continue;
      v.s += CV.spd * dt;
      if (lp) v.s %= L; /* outside the mission the convoy circles the roads for ever */
      else if (v.s >= L) {
        v.dead = true;
        v.gone = true;
        v.m.visible = false;
        CV.escaped++;
        continue;
      }
      const u = v.s / L,
        p = C.getPointAt(u),
        tg = C.getTangentAt(u);
      v.m.position.set(p.x, H(p.x, p.z) + 0.12 + v.s1 / 2, p.z);
      v.m.rotation.y = Math.atan2(tg.x, tg.z);
    }
    if (!CV.q.length && CV.list.every((v) => v.dead)) {
      const k = CV.list.filter((v) => !v.gone).length,
        e = CV.total - k;
      CV.destroyed += k;
      CV.st = 'wreck';
      CV.tm = 7;
      if (trn.mode === 'convoy') note(e === 0 ? 'CONVOY DESTROYED!' : k + ' DESTROYED, ' + e + ' ESCAPED');
    }
  } else if (CV.st === 'wreck') {
    CV.tm -= dt;
    if (CV.tm <= 0) {
      convoyClear();
      CV.st = 'idle';
      CV.tm = CV.gap;
    }
  }
}
