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
