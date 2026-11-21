/* the Wave motion setting follows Hardcore (the Hardcore tab holds the Game / Hardcore switch) */
function modeSync() {
  const w = $$('wvMode');
  if (!w) return; /* not her page (another simulator is played) */
  w.disabled = FM.use('sea');
  w.title = FM.use('sea') ? 'Always on in Hardcore' : '';
  if (typeof hcSync === 'function') hcSync();
}
modeSync();
if ($$('wvMode')) {
  const w = $$('wvMode');
  w.value = WAVE.mode;
  w.onchange = () => {
    WAVE.mode = w.value;
    store.set('wave', WAVE.mode);
    note(WAVE.mode === 'on' ? 'WAVE MOTION ON' : WAVE.mode === 'off' ? 'WAVE MOTION OFF' : 'WAVE MOTION OFF AT THE GUNS');
  };
}
