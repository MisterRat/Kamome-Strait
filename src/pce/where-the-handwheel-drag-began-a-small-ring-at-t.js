/* where the handwheel drag began: a small ring at the press point, the cursor's distance from it is the rate */
function hwInd(on) {
  let el = $$('hwInd');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hwInd';
    el.style.cssText = 'position:fixed;width:14px;height:14px;margin:-8px 0 0 -8px;border:2px solid rgba(255,210,122,.85);border-radius:50%;pointer-events:none;z-index:21;display:none';
    document.body.appendChild(el);
  }
  el.style.display = on ? 'block' : 'none';
  if (on) (el.style.left = GUN.d0[0] + 'px'), (el.style.top = GUN.d0[1] + 'px');
}
