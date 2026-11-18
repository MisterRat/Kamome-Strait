/* controller / keyboard focus inside the Settings tab */
const pmItems = () =>
  [...$$('pmPaneS').querySelectorAll('button,input[type=checkbox],select')].filter((e) => e.offsetParent !== null);
function pmMark() {
  const it = pmItems();
  it.forEach((e, i) => e.classList.toggle('padsel', i === pmFocus && pmUsePad));
}
let pmUsePad = false;
function pmNav(d) {
  pmUsePad = true;
  const it = pmItems();
  if (!it.length) return;
  pmFocus = (pmFocus + d + it.length) % it.length;
  pmMark();
  it[pmFocus].scrollIntoView({ block: 'nearest' });
}
function pmActivate() {
  const el = pmItems()[pmFocus];
  if (!el) return;
  if (el.tagName === 'SELECT') {
    el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
    el.dispatchEvent(new Event('change'));
  } else el.click();
}
$$('pmResume').onclick = () => pauseMenu(false);
PM_TABS.forEach((k) => {
  $$(PM_BTN[k]).onclick = () => pmSetTab(k);
});
$$('pmCloseM').onclick = () => pmShow(false);
$$('pmRestart').onclick = () => {
  pauseMenu(false);
  reset();
};
$$('pmDocs').onclick = () => pmSetTab('about');
$$('pmTilt').onclick = () => openTset(true);
$$('pmExit').onclick = () => exitGame();
