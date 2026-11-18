/* PCE-842: the P-51's six tabs, rewritten for the ship: Settings, Missions, About, Controls, Operations, Hardcore */
const PM_TABS = ['set', 'mis', 'about', 'ctl', 'ops', 'hc'],
  PM_PANE = { set: 'pmPaneS', mis: 'pmPaneM', about: 'pmPaneA', ctl: 'pmPaneC', ops: 'pmPaneO', hc: 'pmPaneH' },
  PM_BTN = { set: 'pmTabS', mis: 'pmTabM', about: 'pmTabA', ctl: 'pmTabC', ops: 'pmTabO', hc: 'pmTabH' },
  INFO_TABS = ['about', 'ctl', 'ops', 'hc'];
let pmInfo = 'ctl';
function pmSetTab(tab) {
  pmTab = tab;
  if (INFO_TABS.includes(tab)) pmInfo = tab;
  menuOpen = pmOpen && tab === 'mis';
  for (const k of PM_TABS) {
    $$(PM_PANE[k]).style.display = k === tab ? '' : 'none';
    $$(PM_BTN[k]).classList.toggle('on', k === tab);
  }
  $$('pm').classList.add('wide'); /* every tab uses the wide box, so the whole tab row fits */
  $$('pmBox').scrollTop = 0;
  try {
    $$(PM_BTN[tab]).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } catch (e) {
    logWarn('tab scroll', e);
  }
  if (tab === 'set') {
    pmBuild();
    pmFocus = 0;
    pmMark();
  } else if (tab === 'mis')
    menuHi(
      Math.max(
        0,
        MENU.findIndex((m) => m[0] === trn.mode),
      ),
    );
}
function pmCycle(d) {
  pmSetTab(PM_TABS[(PM_TABS.indexOf(pmTab) + d + PM_TABS.length) % PM_TABS.length]);
}
function pmShow(v, tab) {
  if (v) {
    if (docsOpen) return;
    if (!pmOpen) {
      pmPrev = paused;
      paused = true;
      pmOpen = true;
      $$('pm').style.display = 'flex';
    }
    pmSetTab(tab || pmTab);
  } else if (pmOpen) {
    pmOpen = false;
    menuOpen = false;
    $$('pm').style.display = 'none';
    paused = pmPrev;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
}
function pauseMenu(v) {
  v = !!v;
  if (v) {
    if (!started) return;
    pmShow(true, 'set');
  } else pmShow(false);
}
