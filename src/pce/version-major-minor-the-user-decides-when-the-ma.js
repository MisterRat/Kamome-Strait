/* VERSION: major.minor. The user decides when the major number changes; the minor number goes up with every change. */
const VERSION = '0.57';
document.querySelectorAll('.verTag').forEach((e) => (e.textContent = 'Version ' + VERSION));
