/* Wave motion setting (saved): 'on', 'guns' (off while the player is at a gun) or 'off' */
const WAVE = { mode: ['on', 'guns', 'off'].includes(store.get('pce842wave', 'on')) ? store.get('pce842wave', 'on') : 'on' };
