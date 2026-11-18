/* ---------- control bindings: the ONE place that says which key / button does what ----------
   The code below reads these (kb(), PB.x, KEYID) and the on-screen controls box and the Controls tab of the
   pause menu are generated from them, so the help can never disagree with the controls.
   To change a control: edit its row here. Menu navigation (arrows, Tab, D-pad in menus) is documented as text. */
const BIND = [
  /* id, doc word, keyboard codes, controller button (null = none) */
  ['pitchUp', 'pull up', [], null],
  ['pitchDn', 'push down', [], null],
  ['rollL', 'left', ['KeyA', 'ArrowLeft'], null],
  ['rollR', 'right', ['KeyD', 'ArrowRight'], null],
  ['rudL', 'left', [], 4],
  ['rudR', 'right', [], 5],
  ['thrUp', 'more ahead', ['KeyW', 'ArrowUp'], 12],
  ['thrDn', 'more astern', ['KeyS', 'ArrowDown'], 13],
  ['sTrL', 'train left', ['KeyQ'], null],
  ['sTrR', 'train right', ['KeyE'], null],
  ['flapDn', 'down', ['KeyF'], 15],
  ['flapUp', 'up', ['KeyV'], 14],
  ['gear', '', ['KeyG'], 0],
  ['brake', 'hold', ['KeyB'], 1] /* on the ground: wheel brakes. In the air: calls / clears a bandit */,
  ['guns', 'hold', ['Space'], 7],
  ['rocket', '', [], 6],
  ['hhLoad', 'reload (20 mm drum, the Hedgehog)', ['KeyR'], null],
  ['tpJump', 'Torpedoman: go to the ordered weapon', ['KeyJ'], null],
  ['bomb', '', ['KeyZ'], 2],
  ['camera', 'chase / bridge', ['KeyC'], 3],
  ['clear', 'chase / roam camera', ['KeyY'], null],
  ['st1', 'OOD', ['Digit1', 'Numpad1'], null],
  ['st2', 'Engineering', ['Digit2', 'Numpad2'], null],
  ['st3', 'Communications', ['Digit3', 'Numpad3'], null],
  ['st4', 'Quartermaster', ['Digit4', 'Numpad4'], null],
  ['st5', 'Gunner', ['Digit5', 'Numpad5'], null],
  ['st6', 'Torpedoman', ['Digit6', 'Numpad6'], null],
  ['gSight', 'on the sight / look round', ['KeyX'], null],
  ['targets', 'practice targets on / off', ['KeyT'], null],
  ['gRngUp', 'sight range up', ['PageUp'], null],
  ['gRngDn', 'sight range down', ['PageDown'], null],
  ['r3', '', [], 11] /* tap: difficulty */,
  ['restart', '', ['Enter'], 9],
  ['pause', 'pause menu', ['KeyP', 'Escape'], 8],
  ['manual', 'manual', ['KeyI'], 10],
  ['missions', 'missions', ['KeyM'], null],
  ['help', 'controls box', ['KeyH'], null],
  ['map', 'minimap', ['KeyO'], null],
  ['mapOut', 'zoom out', ['Minus', 'NumpadSubtract'], null],
  ['mapIn', 'zoom in', ['Equal', 'NumpadAdd'], null],
  ['guide', 'path guide / ADF on-off', ['KeyL'], null],
  ['coach', 'shrink coach panel', ['KeyK'], null],
  ['quality', 'graphics: Auto / Low / Medium / High', ['KeyN'], null],
  ['mute', 'sound on / off', ['KeyU'], null],
  ['bail', 'bail out (press twice)', [], null],
  ['trimDn', 'nose down', ['BracketLeft'], null],
  ['trimUp', 'nose up', ['BracketRight'], null],
  ['trimRL', 'left', ['Comma'], null],
  ['trimRR', 'right', ['Period'], null],
  ['trimAL', 'left wing down', ['Semicolon'], null],
  ['trimAR', 'right wing down', ['Quote'], null],
  ['trimC', 'centre all trim', ['Backspace'], null],
  ['photo', 'photo mode', ['F9'], null],
];
const BI = {},
  PB = {},
  KEYID = {};
BIND.forEach(([id, word, kc, pb]) => {
  BI[id] = { id, word, kb: kc, pad: pb };
  if (pb !== null) PB[id] = pb;
  kc.forEach((c) => (KEYID[c] = id));
});
const KNAME = {
  ArrowUp: '&uarr;',
  ArrowDown: '&darr;',
  ArrowLeft: '&larr;',
  ArrowRight: '&rarr;',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  Escape: 'Esc',
  Minus: '-',
  NumpadSubtract: '-',
  Equal: '=',
  NumpadAdd: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Period: '.',
  Semicolon: ';',
  Quote: "'",
};
const PNAME = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'Back',
  'Start',
  'L3',
  'R3',
  'D-pad &uarr;',
  'D-pad &darr;',
  'D-pad &larr;',
  'D-pad &rarr;',
];
const keyName = (c) => KNAME[c] || c.replace(/^Key|^Digit|^Numpad/, '');
const kbText = (id) => [...new Set(BI[id].kb.map(keyName))].join(' / ');
const padText = (id) => PNAME[BI[id].pad];
const bindText = (ids, pad) =>
  ids
    .map((id) => {
      const w = BI[id].word,
        s = pad ? padText(id) : kbText(id);
      return w ? s + ' ' + w : s;
    })
    .join(ids.every((id) => !BI[id].word) ? ' / ' : ' &middot; ');
