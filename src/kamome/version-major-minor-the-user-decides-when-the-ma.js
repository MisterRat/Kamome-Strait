/* VERSION: major.minor. The user decides when the major number changes; the minor number goes up with every change. */
const VERSION = '1.11';
document.querySelectorAll('.verTag').forEach((e) => (e.textContent = 'Version ' + VERSION));
/* GAME: Kamome Strait. Its saved settings are its own (rule C), and each simulator's are kept apart: 'kamomep51', 'kamomepce' */
const GAME = { id: 'kamome', name: 'Kamome Strait', key: 'kamome' + KS_SIM };
