/* the Comms box: what the operator needs, and the instructor */
function commsBox(here) {
  let el = $$('commsBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'commsBox';
    el.style.cssText =
      'position:fixed;top:214px;right:12px;width:min(430px,38vw);background:rgba(12,20,28,.86);color:#dfe6e8;font:13px/1.45 ui-monospace,Consolas,monospace;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.16);pointer-events:none;z-index:20;display:none';
    document.body.appendChild(el);
  }
  const st = PCEM.STN[3] && PCEM.STN[3][SHIP.sub],
    show = here && SHIP.stn === 3 && st && !paused;
  el.style.display = show ? 'block' : 'none';
  if (!show) return;
  /* clear of the instruments: beside the radar scope; under the sonar's dial and recorder and the radio's printer */
  const pl = st.dev === 'radar' ? 'r' : 'b';
  if (el.dataset.pl !== pl) {
    el.dataset.pl = pl;
    Object.assign(el.style, pl === 'r' ? { top: '214px', right: '12px', left: '', bottom: '', width: 'min(430px,38vw)' } : { top: '', right: '', left: 'max(400px,32vw)', bottom: '16px', width: 'min(540px,calc(100vw - 660px))' });
  }
  const now = performance.now();
  if (now - (COMMS.boxT || 0) < 120) return;
  COMMS.boxT = now;
  const L = COMMS.les,
    bk = FM.use('comms');
  let h = '';
  if (L) {
    const s = L.st[L.i];
    h += '<b style="color:#9fc3d6">COMMS SCHOOL - ' + L.dev.toUpperCase() + (L.done ? ' - COMPLETE' : ' - STEP ' + (L.i + 1) + ' OF ' + L.st.length) + '</b><br>';
    if (L.done) {
      const last = L.st[L.st.length - 1];
      h += '<b style="color:#8fe39a">' + (last.res || L.res || 'WELL DONE.') + '</b>' + (L.dev === 'sonar' && ASW.plot ? '<br><img src="' + ASW.plot + '" style="width:200px;height:200px;margin-top:6px;border-radius:4px">' : '') + '<br><b>' + kbText('targets') + '</b> ends the school.';
    } else if (s) {
      h += s.t + (s.sp ? '<br><b style="color:#ffd27a">Space</b> to go on.' : '') + (L.prog ? '<br><b style="color:#ffd27a">' + L.prog + '</b>' : '');
    }
    for (const q of L.st) if (q.res) L.res = q.res;
    h += '<hr style="border:0;border-top:1px solid rgba(255,255,255,.15);margin:6px 0">';
  } else h += '<span style="color:#9aa"><b>' + kbText('targets') + '</b>: Comms school for this set.</span><br>';
  if (st.dev === 'radar') {
    const R = COMMS.rd;
    h += 'RADAR ' + RADAR.R[RADAR.ri] + ' NM &middot; CURSOR <b>' + c3(cTrue(R.b)) + '&deg;T</b> (' + c3(((R.b * 180) / Math.PI + 360) % 360) + '&deg; REL) &middot; STROBE <b>' + cYd(R.r) + ' YD</b><br><span style="color:#9aa">Q / E cursor &middot; R / F strobe &middot; Space report &middot; reports ' + R.good + (R.bad ? ', ' + R.bad + ' wrong' : '') + '</span>';
  } else if (st.dev === 'sonar') {
    const S = COMMS.sn,
      e = S.echo,
      ping = (2 * SONAR.R[SONAR.ri] * 0.9144) / 1500 + 0.4,
      fresh = e && SHIP.t - e.t < ping * 1.5,
      E = subEst();
    h += 'SONAR ' + SONAR.R[SONAR.ri] + ' YD &middot; BEAM <b>' + c3(cTrue(SONAR.brg)) + '&deg;T</b>';
    if (fresh) h += ' &middot; <b style="color:#8fe39a">ECHO ' + cYd(e.r) + ' YD' + (bk ? '' : ' ' + (e.dop > 0.8 ? 'UP' : e.dop < -0.8 ? 'DOWN' : 'NO') + ' DOPPLER') + '</b>';
    if (S.L != null || S.R != null) h += '<br>CUTS ' + (S.L != null ? 'L ' + c3(cTrue(S.L)) : 'L -') + ' &middot; ' + (S.R != null ? 'R ' + c3(cTrue(S.R)) : 'R -') + (S.L != null && S.R != null ? ' &middot; CENTRE <b>' + c3(cTrue(S.L + angW(S.R - S.L) / 2)) + '</b>' : '');
    if (ASW.who === 'comms' && ASW.ph !== 'idle' && ASW.ph !== 'done')
      h += '<br><b style="color:#ffd27a">BRIDGE: ' + (ASW.msg || '') + '</b><br>LAST REPORT <b style="color:' + (E && E.age < 15 ? '#8fe39a' : '#ff8a6a') + '">' + (E && E.src === 'you' ? Math.round(E.age) + ' S AGO' : 'NONE') + '</b>';
    h += '<br><span style="color:#9aa">Q / E train &middot; Z / X left / right cut &middot; Space report &middot; U / B / N Doppler</span>';
  } else {
    const open = COMMS.rq.filter((m) => m.st === 'open'),
      W = bk ? 12 : 20;
    h += 'RADIO &middot; ' + (open.length ? open.length + ' WAITING' : 'NO TRAFFIC WAITING') + (COMMS.out ? ' &middot; <b style="color:#ffd27a">TO SEND: ' + COMMS.out + '</b>' : '');
    for (const m of open)
      h += '<br><b>' + m.from + ':</b> ' + m.txt + (m.route && !bk ? ' <b style="color:#ffd27a">&#9654; BRIDGE</b>' : '') + ' <span style="color:' + (W - (SHIP.t - m.t0) > 5 ? '#9aa' : '#ff8a6a') + '">' + Math.max(0, Math.ceil(W - (SHIP.t - m.t0))) + ' S</span>';
    const done = COMMS.rq.filter((m) => m.st !== 'open'),
      ok = done.filter((m) => m.st === 'ok').length;
    h += '<br><span style="color:#9aa">Space acknowledge (or send) &middot; B route to the bridge &middot; handled ' + ok + '/' + done.length + '</span>';
  }
  el.innerHTML = h;
}

