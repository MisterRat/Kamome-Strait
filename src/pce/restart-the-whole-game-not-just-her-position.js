/* Restart (the pause menu, the restart key): the whole game again, not just the ship back at her start (the user, 2026-11-21: reset()
   only moved her; the enemies, her damage, the magazines, the targets and the clock went on). The page is loaded afresh and the same
   patrol or mission started again: the one picked last is kept for the reload in sessionStorage (this tab only; nothing remembered
   past it) */
SIMS.add({
  id: 'pce',
  restart: () => {
    try {
      sessionStorage.setItem('pceRestart', SIMS.cur.lastMis || 'go');
    } catch (e) {}
    location.reload();
  },
});
if (SIMS.on('pce')) {
  const pick = SIMS.cur.missionPick;
  SIMS.cur.missionPick = (it, first) => {
    SIMS.cur.lastMis = it[0];
    pick(it, first);
  };
  let again = null;
  try {
    again = sessionStorage.getItem('pceRestart');
    sessionStorage.removeItem('pceRestart');
  } catch (e) {}
  if (again)
    addEventListener('load', () =>
      setTimeout(() => {
        const i = MENU.findIndex((m) => m[0] === again);
        if (i >= 0) menuPick(i);
        else $$('go').click();
      }, 0),
    );
}
