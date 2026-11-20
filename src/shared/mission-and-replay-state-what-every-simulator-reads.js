/* the mission and replay state every simulator reads: which mission (trn.mode, 'free' for free play), and whether a replay is on.
   A simulator with missions or a replay of its own adds its fields to these (the P-51's trainers and replay pieces do) */
const trn = { mode: 'free', t: 0, done: false, sum: '', title: '', step: 0 };
const RPL = { on: false, busy: false, keep: false, pause: false };
