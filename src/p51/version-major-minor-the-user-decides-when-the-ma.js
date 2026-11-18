/* VERSION: major.minor. The user decides when the major number changes; the minor number goes up with every change. */
const VERSION = '5.38';
document.querySelectorAll('.verTag').forEach((e) => (e.textContent = 'Version ' + VERSION));
const logWarn = (what, e) => console.warn('[P-51] ' + what + ':', (e && e.message) || e);
const store = {
  get(key, fallback) {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      return fallback; /* storage blocked */
    }
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      logWarn('ignoring corrupt saved setting ' + key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage blocked or full: settings simply will not persist */
    }
  },
};
