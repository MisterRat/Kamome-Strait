/* the easter egg: the weapon the torpedoman arrives at is fully loaded at once (both modes) */
function tpFill(i) {
  const st = tpList()[i];
  if (!st) return;
  if (st.tp === 'hh' && !HH.q.length) (HH.n = 24), (HH.loading = false), (HH.ld = 0);
  if (st.tp === 'port') (DC.kl[0] = DC.kl[1] = 1), (DC.kt[0] = DC.kt[1] = 0);
  if (st.tp === 'stbd') (DC.kl[2] = DC.kl[3] = 1), (DC.kt[2] = DC.kt[3] = 0);
  if (st.tp === 'rack') DC.rack = [8, 8];
  DC.kg = [DC.kl[0] + DC.kl[1], DC.kl[2] + DC.kl[3]];
}
function tpGo(i) {
  const st = tpList()[i];
  if (!st) return;
  SHIP.sub = i;
  SHIP.EYE.set(st.e[2], st.e[1], -st.e[0]);
  SHIP.look[0] = st.yaw;
  SHIP.look[1] = st.pitch;
  viewYaw = viewPitch = 0;
  TPW.p.set(st.e[0], st.e[2]);
  TPW.at = i;
  tpFill(i);
  note(st.name);
}
