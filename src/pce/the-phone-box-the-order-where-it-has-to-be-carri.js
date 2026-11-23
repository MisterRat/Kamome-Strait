/* the phone box: the order, where it has to be carried out, how long is left */
function aswBox(here) {
  let el = $$('aswBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aswBox';
    el.style.cssText =
      'position:fixed;top:96px;left:50%;transform:translateX(-50%);width:min(520px,90vw);background:rgba(12,20,28,.84);color:#dfe6e8;font:13px/1.45 ui-monospace,Consolas,monospace;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.16);pointer-events:none;z-index:20;display:none';
    document.body.appendChild(el);
  }
  const show = here && SHIP.stn === 5 && !paused;
  el.style.display = show ? 'block' : 'none';
  if (!show) return;
  const now = performance.now();
  if (now - (ASW.boxT || 0) < 100) return;
  ASW.boxT = now;
  const at = tpAt(),
    atN = at >= 0 && tpList()[at] ? TPNAME[tpList()[at].tp] : 'ON DECK',
    W = FM.use('orders') ? 4 : 6;
  let h = '<b style="color:#9fc3d6">PHONE - BRIDGE</b>';
  if (ASW.ph === 'done')
    h +=
      '<br><b style="color:#8fe39a">' + ASW.deb + '</b>' + (ASW.plot ? '<br><img src="' + ASW.plot + '" style="width:220px;height:220px;margin-top:6px;border-radius:4px">' : '') +
      '<br>EXERCISE COMPLETE. <b>' + kbText('targets') + '</b>: ANOTHER RUN.';
  else if (!PT.on && !ASW.live) h += '<br>NO CONTACT. <b>' + kbText('targets') + '</b>: PRACTICE TARGETS (THE EXERCISE SUB).';
  else {
    const o = ASW.O.filter((o) => o.st === 'open').pop();
    if (o) {
      const left = Math.max(0, W - (ASW.t - o.t0)),
        there = at >= 0 && tpList()[at].tp === o.k;
      h +=
        '<br><b style="font-size:17px;color:' + (left > 0 ? '#ffd27a' : '#ff8a6a') + '">' + o.txt + '</b>' +
        '<br>' + (there ? '<b style="color:#8fe39a">AT THE ' + TPNAME[o.k] + '</b>' : 'GO TO THE <b>' + TPNAME[o.k] + '</b>' + (FM.use('walk') ? '' : ' &middot; <b>' + kbText('tpJump') + '</b> jumps there')) +
        '<div style="height:5px;background:rgba(255,255,255,.12);margin-top:4px"><div style="height:5px;width:' + (left / W) * 100 + '%;background:' + (left > 0 ? '#ffd27a' : '#ff8a6a') + '"></div></div>';
    } else h += '<br>' + (ASW.msg || '');
    const tpc = at >= 0 && tpList()[at] ? tpList()[at].tp : null,
      dv = DC.dep[tpc],
      run = ASW.ph === 'run' || ASW.live,
      dOK = !dv || !run || dv === ASW.depth;
    h +=
      '<br><span style="color:#9aa">YOU: ' + atN + (dv ? ' &middot; DEPTH <b style="color:' + (dOK ? '#dfe6e8' : '#ff8a6a') + '">' + dv + ' FT</b>' + (run ? ' (ORDERED ' + ASW.depth + ')' : '') + ' &middot; <b style="color:' + (DC.arm[tpc] ? '#8fe39a' : '#ffb27a') + '">' + (DC.arm[tpc] ? 'ARMED' : 'SAFE') + '</b>' + (DC.arm[tpc] ? '' : ' (<b>' + kbText('gSight') + '</b> arms)') : '') +
      ' &middot; HEDGEHOG ' + HH.n + '/24' + (HH.ld > 0 && HH.n < 24 ? ' LOADING' : '') + '</span>';
  }
  el.innerHTML = h;
}
