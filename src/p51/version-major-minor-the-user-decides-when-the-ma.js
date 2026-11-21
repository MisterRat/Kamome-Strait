/* VERSION: major.minor. The user decides when the major number changes; the minor number goes up with every change. */
const VERSION = '5.68';
document.querySelectorAll('.verTag').forEach((e) => (e.textContent = 'Version ' + VERSION));
/* GAME: which game this build is: its name in messages and the prefix of its saved settings (the only place either is written) */
const GAME = { id: 'p51', name: 'P-51', key: 'p51' };
