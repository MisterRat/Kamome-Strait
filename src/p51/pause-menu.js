/* ---- pause menu ---- */
let pmOpen = false,
  pmPrev = false,
  pmTab = 'set',
  pmFocus = 0;
function pmBuild() {
  const l = $$('pmList');
  let h = '',
    g = '';
  for (const i of UI.items) {
    if (!UI.applies(i)) continue;
    if (i.g !== g) {
      g = i.g;
      h += '<div class="gh">' + g.toUpperCase() + '</div>';
    }
    h +=
      '<label><input type="checkbox" data-id="' +
      i.id +
      '" ' +
      ((i.id === 'guide' ? guide.on : UI.vis(i.id)) ? 'checked' : '') +
      '> ' +
      (MOB ? i.label.replace(/ \([A-Z]\)$/, '') : i.label) +
      '</label>';
  }
  l.innerHTML = h;
  l.querySelectorAll('input').forEach((c) => (c.onchange = () => UI.set(c.dataset.id, c.checked)));
  $$('pmGfx')
    .querySelectorAll('button')
    .forEach((b) => b.classList.toggle('on', b.dataset.q === QL.mode));
}
const PM_TABS = ['set', 'mis', 'about', 'ctl', 'ops', 'hc'],
  PM_PANE = { set: 'pmPaneS', mis: 'pmPaneM', about: 'pmPaneA', ctl: 'pmPaneC', ops: 'pmPaneO', hc: 'pmPaneH' },
  PM_BTN = { set: 'pmTabS', mis: 'pmTabM', about: 'pmTabA', ctl: 'pmTabC', ops: 'pmTabO', hc: 'pmTabH' },
  INFO_TABS = ['about', 'ctl', 'ops', 'hc'];
let pmInfo = 'about';
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
