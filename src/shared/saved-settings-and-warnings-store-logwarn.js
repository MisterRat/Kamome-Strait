/* SAVED SETTINGS and warnings (shared). store.get / store.set keep a game's settings in localStorage under its own prefix
   (GAME.key + name: 'p51snd', 'pce842snd', 'kamomesnd' ...), so games on the same site never share or overwrite each other's.
   Blocked storage (private window, cleared site data) is expected: reads fall back to the default, writes are skipped. */
const logWarn = (what, e) => console.warn('[' + GAME.name + '] ' + what + ':', (e && e.message) || e);
const store = {
  get(key, fallback) {
    let raw = null;
    try {
      raw = localStorage.getItem(GAME.key + key);
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
      localStorage.setItem(GAME.key + key, JSON.stringify(value));
    } catch (e) {
      /* storage blocked or full: settings simply will not persist */
    }
  },
};
