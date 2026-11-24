/* Wave motion setting (saved): 'on', 'guns' (off while the player is at a gun) or 'off' */
/* saved as 'wave2', Off at the guns by default (the user's, 2026-11-24; the old 'wave' key is left behind so everyone starts there) */
const WAVE = { mode: ['on', 'guns', 'off'].includes(store.get('wave2', 'guns')) ? store.get('wave2', 'guns') : 'guns' };
