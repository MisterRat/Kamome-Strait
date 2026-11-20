/* the mission coach box (a mission's instructions and hints) and the mission clock's format: every simulator's missions use them */
const coachEl = $$('coach'),
  coachT = $$('coachT'),
  coachS = $$('coachS'),
  coachH = $$('coachH');
let coachMin = false;
function coach(title, text, hint, lvl) {
  coachEl.style.display = 'block';
  coachT.textContent = title;
  const gi = HOOKS.coachInfo.map((fn) => fn()).filter(Boolean).join('\n');
  coachS.textContent = coachMin ? gi : text + (gi ? '\n' + gi : '');
  coachH.textContent = hint || '';
  coachH.className = lvl || '';
  coachH.style.display = hint ? 'block' : 'none';
}
function coachHide() {
  coachEl.style.display = 'none';
}
const fmtT = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
