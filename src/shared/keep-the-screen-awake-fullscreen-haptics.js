/* ---- keep the screen awake, fullscreen, haptics ---- */
let wake = null;
async function reqWake() {
  try {
    if (navigator.wakeLock && !wake) {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => (wake = null));
    }
  } catch (e) {
    logWarn('screen wake lock', e);
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && started) reqWake();
});
