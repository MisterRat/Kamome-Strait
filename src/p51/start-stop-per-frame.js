/* start / stop / per frame */
function rpStart() {
  const m = trn.mode,
    aero = !!AERO[m],
    A = aero ? trn.a : trn;
  if (RPL.on || !rpAvail()) return;
  if (!aero) {
    /* a finished run: the sim pilot flies the mission first, then the replay opens with its path */
    if (trn.rec && trn.rec.length > 4 && (trn.done || crashed || trn.rpReady) && (!RPL.mc || RPL.mc.srcRec !== trn.rec)) {
      rpMissionStart();
      return;
    }
    RPL.built = rpBuildGen(m);
  } else if (!RPL.built || RPL.A !== A) RPL.built = rpBuild(m, A);
  if (!RPL.built) return;
  rpInit();
  const rec = RPL.rec,
    I = RPL.ideal;
  const fill = (k, pts) => {
    const arr = rpG.line[k].geometry.attributes.position.array,
      n = Math.min(pts.length, 1500);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = pts[i].x;
      arr[i * 3 + 1] = pts[i].y;
      arr[i * 3 + 2] = pts[i].z;
    }
    rpG.line[k].geometry.setDrawRange(0, n);
    rpG.line[k].geometry.attributes.position.needsUpdate = true;
    rpG.line[k].visible = true;
    const D = rpG.dots[k],
      step = Math.max(1, Math.ceil(pts.length / D.length));
    D.forEach((sp, i) => {
      const p = pts[i * step];
      sp.visible = !!p;
      if (p) sp.position.copy(p);
    });
  };
  fill(0, rec.map((s) => s.p));
  if (I) fill(1, I.length > 1500 ? I.filter((o, i) => i % Math.ceil(I.length / 1500) === 0).map((o) => o.p) : I.map((o) => o.p));
  else if (RPL.gpl) fill(1, RPL.gpl);
  else (rpG.line[1].visible = false), rpG.dots[1].forEach((sp) => (sp.visible = false));
  const dr = rec.filter((s) => s.d).map((s) => s.d);
  if (dr.length > 2) fill(2, dr);
  else rpG.line[2].visible = false, rpG.dots[2].forEach((s) => (s.visible = false));
  rpG.ghostD.g.visible = dr.length > 2;
  rpG.ghostP.g.visible = true;
  rpG.ghostI.g.visible = !!I;
  rpG.ghostI.glow.visible = !!I;
  const hasGap = !!RPL.gap && (!RPL.ideal || RPL.gap.j !== undefined),
    gp = hasGap ? RPL.rec[RPL.gap.i].p : new V(),
    gi = hasGap ? (I ? I[RPL.gap.j].p : RPL.gap.gi) : new V();
  rpG.mark.position.copy(gp);
  rpG.mark.visible = hasGap;
  const ga = rpG.gapL.geometry.attributes.position.array;
  ga.set([gp.x, gp.y, gp.z, gi.x, gi.y, gi.z]);
  rpG.gapL.geometry.attributes.position.needsUpdate = true;
  rpG.gapL.visible = hasGap;
  RPL.on = true;
  RPL.pause = false;
  RPL.t = 0;
  RPL.view = 0;
  RPL.az = 0;
  plane.visible = false;
  coachHide();
  document.body.classList.add('phHide');
  aimE.style.display = aimT.style.display = 'none';
  $$('rpl').style.display = 'block';
  $$('rplX').style.display = 'block';
  $$('rplT').innerHTML = AERO[m] ? 'REPLAY &mdash; <span style="color:#ffa020">your path</span> vs <span style="color:#55ff88">best path</span> <span style="color:#ddd">&middot; drone</span> <span style="color:#ff6655">&middot; red = biggest gap</span>' : 'REPLAY &mdash; <span style="color:#ffa020">your flight</span> <span style="color:#55ff88">&middot; green = best path (sim pilot)</span> <span style="color:#ddd">&middot; grey = bandit</span>' + (RPL.gap ? ' <span style="color:#ff6655">&middot; red = biggest gap</span>' : '');
  $$('rplX').innerHTML = '<b>' + (AERO[m] ? 'WHERE TO IMPROVE' : 'FLIGHT SUMMARY') + '</b><br>' + RPL.tips.map((x) => '&bull; ' + x).join('<br>');
  $$('rplS').max = String(Math.round(RPL.T * 10));
  rpUi();
}
function rpStop() {
  if (!RPL.on) return;
  RPL.on = false;
  plane.visible = true;
  document.body.classList.remove('phHide');
  $$('rpl').style.display = 'none';
  $$('rplX').style.display = 'none';
  if (rpG.init) {
  rpG.line.forEach((l) => (l.visible = false));
  rpG.dots.forEach((D) => D.forEach((s) => (s.visible = false)));
  [rpG.ghostP, rpG.ghostI, rpG.ghostD].forEach((b) => ((b.g.visible = false), (b.glow.visible = false)));
  rpG.mark.visible = false;
  rpG.gapL.visible = false;
  }
  cp.copy(pos).add(new V(0, 4, 14));
}
function rpUi() {
  $$('rplPlay').textContent = RPL.pause ? 'Play' : 'Pause';
  $$('rplSpd').textContent = RPL.spd + 'x';
  $$('rplView').textContent = 'View: ' + RPV[RPL.view];
}
function rpGhost(b, p, qq, d) {
  b.g.position.copy(p);
  b.g.quaternion.copy(qq);
  b.g.scale.setScalar(Math.max(1, Math.min(30, cam.position.distanceTo(p) / 70)));
  if (b.glow) {
    b.glow.visible = b.g.visible;
    b.glow.position.copy(p);
    b.glow.scale.setScalar(Math.max(8, cam.position.distanceTo(p) * 0.035));
  }
  b.prop.rotation.z += 0.9;
}
function rpUpdate(dt) {
  if (!RPL.on || RPL.busy) return;
  if (!RPL.pause) RPL.t += dt * RPL.spd;
  if (RPL.t >= RPL.T + 1.5) RPL.t = RPL.T + 1.5 - 1e-3, (RPL.pause = true), rpUi();
  RPL.az += dt * 0.12;
  const t = Math.min(RPL.t, RPL.T),
    rec = RPL.rec,
    I = RPL.ideal;
  coachHide();
  let s = rpSamp(rec, t),
    pP = s.a.p.clone().lerp(s.b.p, s.k),
    qP = s.a.q.clone().slerp(s.b.q, s.k);
  rpGhost(rpG.ghostP, pP, qP);
  if (rpG.ghostD.g.visible && s.a.d && s.b.d) {
    const pD = s.a.d.clone().lerp(s.b.d, s.k);
    rpGhost(rpG.ghostD, pD, s.a.dq.clone().slerp(s.b.dq, s.k));
  }
  if (I) {
    var si = rpSamp(I, t),
      pI = si.a.p.clone().lerp(si.b.p, si.k),
      fI = si.a.f.clone().lerp(si.b.f, si.k),
      uI = si.a.u.clone().lerp(si.b.u, si.k);
    rpGhost(rpG.ghostI, pI, rpQ(fI, uI));
    var dist = pP.distanceTo(pI),
      vI = (si.a.v || 0) * (1 - si.k) + (si.b.v || 0) * si.k;
  }
  $$('rplL').innerHTML =
    '<span style="color:#ffa020">YOU</span> ' + Math.round(s.a.k) + ' km/h ' + s.a.g.toFixed(1) + ' G &nbsp; ' + (I ? '<span style="color:#55ff88">BEST</span> ' + (vI ? Math.round(vI * 3.6) + ' km/h' : '') + ' &nbsp; gap ' + Math.round(dist) + ' m &nbsp; ' : 'alt ' + Math.round(pP.y) + ' m &nbsp; ') + t.toFixed(1) + ' / ' + RPL.T.toFixed(1) + ' s';
  if (document.activeElement !== $$('rplS')) $$('rplS').value = String(Math.round(RPL.t * 10));
  /* dot sizes follow the distance */
  [0, 1, 2].forEach((k) => {
    rpG.dots[k].forEach((sp) => sp.visible && sp.scale.setScalar(Math.max(4, cam.position.distanceTo(sp.position) * 0.012)));
  });
  rpG.mark.scale.setScalar(Math.max(20, cam.position.distanceTo(rpG.mark.position) * 0.05));
  plane.position.copy(pP);
}
function rpCam() {
  if (!RPL.on || RPL.busy) return;
  const R = RPL,
    a = 0.5 * Math.sin(R.az),
    c = R.ctr;
  cam.up.set(0, 1, 0);
  if (R.view === 0) {
    cam.position.copy(c).addScaledVector(R.rt, R.dist * Math.cos(a)).addScaledVector(R.H, R.dist * Math.sin(a)).addScaledVector(UPV, R.dist * 0.15);
  } else if (R.view === 1) {
    cam.position.copy(c).addScaledVector(UPV, R.dist * 1.25);
    cam.up.copy(R.H);
  } else {
    cam.position.copy(c).addScaledVector(R.H, -R.dist * Math.cos(a)).addScaledVector(R.rt, R.dist * Math.sin(a)).addScaledVector(UPV, R.dist * 0.12);
  }
  cam.lookAt(c);
}
window.addEventListener(
  'keydown',
  (e) => {
    if (RPL.busy) {
      if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'Enter') {
        rpSimCancel();
        if (e.code !== 'Enter') (e.preventDefault(), e.stopImmediatePropagation());
      }
      return;
    }
    if (RPL.on) {
      if (e.code === 'Enter') return rpStop(); /* the normal Enter then restarts the trainer */
      if (e.target && e.target.id === 'rplS') return;
      let h = true;
      if (e.code === 'Escape' || e.code === 'Backspace') rpStop();
      else if (e.code === 'Space') (RPL.pause = !RPL.pause), rpUi();
      else if (e.code === 'ArrowLeft') RPL.t = Math.max(0, RPL.t - 1);
      else if (e.code === 'ArrowRight') RPL.t = Math.min(RPL.T, RPL.t + 1);
      else if (e.code === 'Backslash') RPL.t = 0;
      else if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') (RPL.view = +e.code.slice(5) - 1), rpUi();
      else h = false;
      if (h) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    } else if (e.code === 'Backslash' && (trn.done || crashed || trn.rpReady || (RPL.mc && RPL.mc.m === trn.mode && trn.t < 10)) && rpAvail()) {
      e.preventDefault();
      rpStart();
    }
  },
  true,
);
{
  const on = (id, f) => ($$(id).onclick = f);
  on('rplPlay', () => ((RPL.pause = !RPL.pause), rpUi()));
  on('rplSpd', () => ((RPL.spd = RPL.spd === 1 ? 0.5 : RPL.spd === 0.5 ? 0.25 : 1), rpUi()));
  on('rplView', () => ((RPL.view = (RPL.view + 1) % 3), rpUi()));
  on('rplRst', () => ((RPL.t = 0), (RPL.pause = false), rpUi()));
  on('rplExit', () => rpStop());
  $$('rplS').oninput = () => ((RPL.t = +$$('rplS').value / 10), (RPL.pause = true), rpUi());
}

