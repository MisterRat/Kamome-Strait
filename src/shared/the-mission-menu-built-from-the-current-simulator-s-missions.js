/* the mission menu: built from the current simulator's missions (its role's missions: [id, title, what it is, ...]); picking one
   closes the menu, starts the game the first time, and hands the mission to the role (missionPick) */
let MENU = [],
  menuOpen = false,
  menuSel = 0; /* menuOpen = the pause popup is showing its Missions tab */
const menuList = $$('menuList');
function menuBuild() {
  MENU = SIMS.cur.missions;
  menuList.innerHTML = '';
  MENU.forEach((it, i) => {
    const b = document.createElement('button');
    b.innerHTML = '<b>' + it[1] + '</b><span>' + it[2] + '</span>';
    b.onclick = () => menuPick(i);
    b.onmouseenter = () => menuHi(i);
    menuList.appendChild(b);
  });
}
menuBuild();
function menuHi(i) {
  menuSel = (i + MENU.length) % MENU.length;
  [...menuList.children].forEach((b, j) => b.classList.toggle('sel', j === menuSel));
}
function menuMove(d) {
  menuHi(menuSel + d);
}
function toggleMenu() {
  if (docsOpen) return;
  if (pmOpen && pmTab === 'mis') pmShow(false);
  else pmShow(true, 'mis');
}
function menuPick(i) {
  const it = MENU[i];
  pmOpen = false;
  menuOpen = false;
  $$('pm').style.display = 'none';
  pmPrev = false;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  const first = !started;
  if (first) {
    started = true;
    audio();
    $$('start').style.display = 'none';
  }
  SIMS.cur.missionPick(it, first);
}
$$('goMenu').onclick = () => toggleMenu();

reset();
