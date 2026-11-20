/* ---- nose art options ---- */
const NAO = (() => {
  const o = { style: 'shark', name: 'Miss Mustang', tally: true };
  Object.assign(o, store.get('art', {}));
  return o;
})();
function naSave() {
  store.set('art', NAO);
}
function naSync() {
  $$('naStyle').value = NAO.style;
  $$('naName').value = NAO.name;
  $$('naTally').checked = NAO.tally !== false;
  $$('naName').style.display = NAO.style === 'name' || NAO.style === 'checks' || NAO.style === 'wings' ? '' : 'none';
}
$$('naStyle').onchange = (e) => {
  NAO.style = e.target.value;
  naSave();
  noseArtApply(NAO);
  naSync();
};
$$('naName').oninput = (e) => {
  NAO.name = e.target.value.slice(0, 18);
  naSave();
  noseArtApply(NAO);
};
$$('naTally').onchange = (e) => {
  NAO.tally = e.target.checked;
  naSave();
  noseArtApply(NAO);
};
naSync();
noseArtApply(NAO);
