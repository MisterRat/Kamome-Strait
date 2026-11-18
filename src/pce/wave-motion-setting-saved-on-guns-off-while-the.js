/* Wave motion setting (saved): 'on', 'guns' (off while the player is at a gun) or 'off' */
const WAVE = { mode: ['on', 'guns', 'off'].includes(store.get('wave', 'on')) ? store.get('wave', 'on') : 'on' };
