/* PCE-842's missions: [id, title, what it is, station, view there, practice targets out] */
const MENU = [
  ['patrol', 'Free Patrol', 'The ship is yours: conn her from the open bridge, answer the bells, keep watch. No targets out.', 1, 0, false],
  ['gun3', 'Gunnery Practice: 3"/50', 'The forward 3"/50 with the target rafts out to 6,000 yards, PT-108 and her target sled, and the towed sleeves.', 5, 0, true],
  ['gun20', 'Gunnery Practice: 20 mm', 'The 20 mm amidships: the rafts inside 1,000 yards, the sleeve that passes close, and the sled on PT-108\'s passes.', 5, 1, true],
  ['gun40', 'Gunnery Practice: Twin 40 mm', 'The twin 40 mm aft against the towed sleeves and the target sled.', 5, 2, true],
  ['asw', 'Antisubmarine Attack Run', 'The torpedoman\'s station with the exercise submarine out: the OOD runs in on him and phones the orders. Hedgehog, K-guns and racks. Scored.', 6, -1, true],
  ['sonar', 'Sonar Watch', 'Communications, with the exercise submarine out: find him on the sonar and the radar.', 3, 1, true],
];
let menuOpen = false,
  menuSel = 0; /* menuOpen = the pause popup is showing its Missions tab */
const menuList = $$('menuList');
MENU.forEach((it, i) => {
  const b = document.createElement('button');
  b.innerHTML = '<b>' + it[1] + '</b><span>' + it[2] + '</span>';
  b.onclick = () => menuPick(i);
  b.onmouseenter = () => menuHi(i);
  menuList.appendChild(b);
});
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
  trn.mode = 'free';
  pmOpen = false;
  menuOpen = false;
  $$('pm').style.display = 'none';
  pmPrev = false;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (!started) {
    started = true;
    audio();
    $$('start').style.display = 'none';
    reset();
  }
  paused = false;
  /* the practice targets out (or in) as the mission wants them, then the station and the view there */
  if (!!PT.on !== it[5]) ptToggle();
  const list = PCEM.STN[it[3]] || [];
  camMode = 1;
  SHIP.stn = it[3] === 6 ? 1 : it[3];
  SHIP.sub = it[4] < 0 ? 0 : (it[4] - 1 + list.length) % Math.max(1, list.length);
  shipStation(it[3]);
  note(it[1].toUpperCase());
}
$$('goMenu').onclick = () => toggleMenu();

reset();

