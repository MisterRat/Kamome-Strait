/* controls: the lookup tables (BI by id, PB controller buttons, KEYID key code to id) built from the current simulator's bindings
   (each simulator's own table is its role's `bind`, in its control-bindings piece), and the key and button names for the help */
const BI = {},
  PB = {},
  KEYID = {};
/* the current simulator's bindings into the lookup tables (SIMS.use calls it again when another simulator is picked) */
function bindsUse(sim) {
  for (const o of [BI, PB, KEYID]) for (const k in o) delete o[k];
  sim.bind.forEach(([id, word, kc, pb]) => {
    BI[id] = { id, word, kb: kc, pad: pb };
    if (pb !== null) PB[id] = pb;
    kc.forEach((c) => (KEYID[c] = id));
  });
}
bindsUse(SIMS.cur);
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
