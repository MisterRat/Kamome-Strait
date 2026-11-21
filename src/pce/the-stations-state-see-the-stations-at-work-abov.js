/* the stations' state (see THE STATIONS AT WORK above the loop) */
const STN = {
  F: {} /* faces by id: { m (mesh), c (canvas), g (2d), tex, st (station) } */,
  wheel: null,
  t: 0,
  init: false,
  bino: false /* the OOD's binoculars */,
  fire0: false,
};
const ENG = { ans: 0 /* the engine room's answer, -0.5 .. 1 */, rung: 0, ringT: 0, lagT: 0, heat: 0.3, man: null /* the player's throttle lever (a telegraph sector), in the Answer the Bells drill */ };
const DC = { depth: 100 /* ft */, rack: [8, 8], kg: [2, 2], dep: { rack: 100, port: 100, stbd: 100 } /* each position's pistol depth setting, ft */, arm: { rack: false, port: false, stbd: false } /* safety forks out */, kl: [1, 1, 1, 1] /* K-guns loaded: port fwd, port aft, stbd fwd, stbd aft */, kt: [0, 0, 0, 0] /* their crews' reload timers */, next: 0, nk: 0, L: [], lastTxt: '' };
