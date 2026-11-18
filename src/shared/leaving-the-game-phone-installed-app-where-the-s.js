/* ---- leaving the game (phone / installed app, where the system gestures may be hidden by fullscreen) ---- */
function exitGame() {
  const bx = document.createElement('div');
  bx.style.cssText =
    'position:fixed;inset:0;z-index:99;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);color:#fff;font:15px system-ui,sans-serif';
  bx.innerHTML =
    '<div style="background:#0e1620;border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:18px 22px;text-align:center;max-width:80vw"><div style="font-size:17px;margin-bottom:14px">Exit the game?</div><button class="pri" id="xqYes">Exit</button> <button id="xqNo">Keep flying</button></div>';
  document.body.appendChild(bx);
  bx.querySelector('#xqNo').onclick = () => bx.remove();
  bx.querySelector('#xqYes').onclick = () => {
    bx.remove();
    leaveApp();
  };
}
function leaveApp() {
  paused = true;
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement)
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } catch (e) {
    logWarn('leave fullscreen', e);
  }
  try {
    if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  } catch (e) {
    logWarn('orientation unlock', e);
  }
  try {
    if (wake) wake.release();
    if (SND.ctx) SND.ctx.suspend();
  } catch (e) {
    logWarn('release screen and sound', e);
  }
  /* a page cannot always close itself: try to close, then go back in history, then show a plain "closed" screen */
  window.close();
  setTimeout(() => {
    if (history.length > 1) history.back();
    setTimeout(() => {
      const d = document.createElement('div');
      d.style.cssText =
        'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font:16px system-ui,sans-serif;text-align:center;padding:24px';
      d.innerHTML =
        '<div>Game closed.<br><br>Swipe up from the bottom of the screen (or open Recents and swipe this app away) to leave.<br><br><button class="pri" id="xqBack">Back to the game</button></div>';
      document.body.appendChild(d);
      d.querySelector('#xqBack').onclick = () => {
        d.remove();
        pauseMenu(true);
      };
    }, 600);
  }, 300);
}
function toggleFS() {
  const d = document.documentElement;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const f = d.requestFullscreen || d.webkitRequestFullscreen;
      if (f) {
        const p = f.call(d, { navigationUI: 'hide' });
        if (p && p.then)
          p.then(() => {
            try {
              screen.orientation.lock('landscape').catch(() => logWarn('orientation lock', 'not allowed here'));
            } catch (e) {
              logWarn('orientation lock', e);
            }
          }).catch(() => {});
      }
    } else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } catch (e) {
    logWarn('fullscreen', e);
  }
}
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
  $$('tFs').style.display = 'none';
}
const buzz = (p) => {
  try {
    if (MOB && navigator.vibrate) navigator.vibrate(p);
  } catch (e) {
    logWarn('vibration', e);
  }
};
