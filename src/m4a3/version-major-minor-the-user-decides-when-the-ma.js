/* VERSION: major.minor. The user decides when the major number changes; the minor number goes up with every change. The tank's own
   line starts at 0.01 (the user's, 2026-11-24: "M4A3 0.01", with a Kamome Strait bump on each tank change) */
const VERSION = '0.09';
document.querySelectorAll('.verTag').forEach((e) => (e.textContent = 'Version ' + VERSION));
/* GAME: which game this build is: its name in messages and the prefix of its saved settings (the only place either is written) */
const GAME = { id: 'm4a3', name: 'M4A3 Sherman', key: 'm4a3' };
