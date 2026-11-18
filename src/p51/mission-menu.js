/* mission menu */
const MENU = [
  ['free', 'Free Flight', 'Fly around. A convoy runs on the road, with ground targets, flak guns and searchlights.'],
  ['takeoff', 'Takeoff Trainer', 'Step-by-step coaching from the runway to a safe climb.'],
  ['landing', 'Landing Trainer', 'Start on approach: gear, flaps, flare and stop. Scored.'],
  ['convoy', 'Convoy Strafing', 'Hunt the timed convoy between the depot and the base, under flak (Settings > Ground fire).'],
  ['bomb', 'Building Bombing', 'Destroy the depot and base buildings under flak (Settings > Ground fire). Ordnance resupplies itself.'],
  ['barrel', 'Barrel Roll', 'A coached corkscrew roll around a point ahead. Scored.'],
  ['immelmann', 'Immelmann Turn', 'Half loop up, half roll to level: reverse course and gain height. Hardcore needs more speed.'],
  ['splits', 'Split S', 'Roll inverted and pull through a half loop down. Needs height.'],
  ['wingover', 'Wingover', 'Climbing turn over the top and a diving turn back: reverse course at the same height.'],
  ['lowyoyo', 'Low Yo-Yo', 'Dive below a turning target to gain speed, then zoom up onto his tail.'],
  ['adf', 'ADF Navigation: Kamome Field', 'Fly 43 km out over the sea with the ADF radio compass, find the island airfield by its radio beacon and land there. Fuel is topped up.'],
  ['highyoyo', 'High Yo-Yo', 'Pull up out of a turn plane to bleed a speed excess, then drop onto his tail.'],
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
  trn.mode = MENU[i][0];
  pmOpen = false;
  menuOpen = false;
  $$('pm').style.display = 'none';
  pmPrev = false;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  if (!started) {
    started = true;
    audio();
    $$('start').style.display = 'none';
  }
  reset();
}
$$('goMenu').onclick = () => toggleMenu();

function reset() {
  try {
    roamExit(true);
  } catch (e) {}
  resetWeapons();
  paused = false;
  invT = 0;
  blk = 0;
  engOut = false;
  FM.reset();
  DM.reset();
  buffet = 0;
  flapLvl = 0;
  fl = 0;
  pos.set(0, 2, 420);
  vel.set(0, 0, 0);
  q.identity();
  thr = 0;
  s = { p: 0, r: 0, y: 0 };
  trimGround();
  crashed = false;
  bailReset();
  gearOn = true;
  model.visible = true;
  $$('msg').style.display = 'none';
  cp.copy(pos).add(new V(0, 4, 14));
  trainerReset();
  PP.ix = 0;
  if (started && !RPL.busy && !RPL.keep && PRE_MODES[trn.mode] && PP.key !== ppKey()) rpPrefly();
}
reset();

