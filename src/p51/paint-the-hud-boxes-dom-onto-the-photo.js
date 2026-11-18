/* ---- paint the HUD boxes (DOM) onto the photo ---- */
function photoHud(x, sf) {
  const rr = (r, rad) => {
    const w = r.width,
      h = r.height,
      m = Math.min(rad, w / 2, h / 2);
    x.beginPath();
    x.moveTo(r.left + m, r.top);
    x.arcTo(r.right, r.top, r.right, r.bottom, m);
    x.arcTo(r.right, r.bottom, r.left, r.bottom, m);
    x.arcTo(r.left, r.bottom, r.left, r.top, m);
    x.arcTo(r.left, r.top, r.right, r.top, m);
    x.closePath();
  };
  const radius = (cs, r) => {
    const v = cs.borderTopLeftRadius || '0';
    return v.includes('%') ? (parseFloat(v) / 100) * Math.min(r.width, r.height) : parseFloat(v) || 0;
  };
  const text = (n, cs) => {
    const t = n.nodeValue;
    if (!t || !t.trim()) return;
    const up = cs.textTransform === 'uppercase',
      rg = document.createRange();
    x.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    x.fillStyle = cs.color;
    x.textBaseline = 'middle';
    if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    let run = '',
      rx = 0,
      ry = 0,
      rh = 0,
      last = -1e9;
    const flush = () => {
      if (run) x.fillText(up ? run.toUpperCase() : run, rx, ry + rh / 2);
      run = '';
    };
    for (let i = 0; i < t.length; i++) {
      rg.setStart(n, i);
      rg.setEnd(n, i + 1);
      const r = rg.getClientRects()[0];
      if (!r || r.width === 0) continue;
      if (run && Math.abs(r.top - last) > 3) flush();
      if (!run) {
        rx = r.left;
        ry = r.top;
        rh = r.height;
      }
      last = r.top;
      run += t[i];
    }
    flush();
  };
  const paint = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const rad = radius(cs, r),
      bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      x.fillStyle = bg;
      rr(r, rad);
      x.fill();
    } else if (el.id === 'tqf') {
      const g = x.createLinearGradient(0, r.bottom, 0, r.top);
      g.addColorStop(0, '#6cd86c');
      g.addColorStop(0.7, '#ffb43a');
      g.addColorStop(1, '#ff4a3a');
      x.fillStyle = g;
      rr(r, rad);
      x.fill();
    }
    const bw = parseFloat(cs.borderTopWidth) || 0;
    if (bw > 0 && cs.borderTopStyle !== 'none' && cs.borderTopColor !== 'rgba(0, 0, 0, 0)') {
      x.strokeStyle = cs.borderTopColor;
      x.lineWidth = bw;
      rr(r, rad);
      x.stroke();
    }
    if (el.tagName === 'CANVAS') {
      x.save();
      rr(r, rad);
      x.clip();
      x.drawImage(el, r.left, r.top, r.width, r.height);
      x.restore();
      return;
    }
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) text(n, cs);
      else if (n.nodeType === 1) paint(n);
    });
  };
  x.save();
  x.scale(sf, sf);
  document.querySelectorAll('.p, #cross, #fd, #fpm, #ccip, #rkip, #bd, #bdt, #lead').forEach((el) => {
    if (['ph', 'start', 'pm'].includes(el.id)) return;
    paint(el);
    if (el.id === 'fpm' && getComputedStyle(el).display !== 'none') {
      /* the flight-path marker's wings and fin are drawn with ::before / ::after, which the painter cannot see */
      const r = el.getBoundingClientRect();
      x.strokeStyle = '#fff';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(r.left - 14, r.top + r.height / 2);
      x.lineTo(r.left - 3, r.top + r.height / 2);
      x.moveTo(r.right + 3, r.top + r.height / 2);
      x.lineTo(r.right + 14, r.top + r.height / 2);
      x.moveTo(r.left + r.width / 2, r.top - 11);
      x.lineTo(r.left + r.width / 2, r.top - 2);
      x.stroke();
    }
  });
  x.restore();
}
function photoStamp(x, W, Hh, sf) {
  const d = new Date(),
    p2 = (n) => (n < 10 ? '0' : '') + n,
    alt = Math.round(pos.y),
    kmh = Math.round(vel.length() * 3.6),
    dmg = DM.on && DM.any() ? ' | damage: ' + DM.text() : '',
    ln =
      'P-51 FS v' +
      VERSION +
      ' | ' +
      d.getFullYear() +
      '-' +
      p2(d.getMonth() + 1) +
      '-' +
      p2(d.getDate()) +
      ' ' +
      p2(d.getHours()) +
      ':' +
      p2(d.getMinutes()) +
      ' | mode ' +
      trn.mode +
      ' | pos ' +
      Math.round(pos.x) +
      ', ' +
      alt +
      ', ' +
      Math.round(pos.z) +
      ' | ' +
      kmh +
      ' km/h | game time ' +
      WX.clock() +
      ' ' +
      WX.wx +
      ' | hardcore ' +
      (FM.on ? 'on' : 'off') +
      ' | gfx ' +
      QL.mode +
      dmg;
  const fs = Math.max(11, Math.round(12 * sf));
  x.font = fs + 'px monospace';
  const tw = Math.min(W - 8 * sf, x.measureText(ln).width + 12 * sf),
    bh = fs + 8 * sf;
  x.fillStyle = 'rgba(0,0,0,.6)';
  x.fillRect(4 * sf, Hh - bh - 4 * sf, tw, bh);
  x.fillStyle = '#fff';
  x.textBaseline = 'middle';
  x.fillText(ln, 10 * sf, Hh - bh / 2 - 4 * sf, tw - 12 * sf);
}
function photoCapture() {
  PHOTO.shot = false;
  const w = innerWidth,
    h = innerHeight,
    pr0 = R.getPixelRatio(),
    target = [0, 2560, 3840][PHOTO.res] || 0,
    big = target > cv.width;
  if (big) {
    R.setPixelRatio(Math.min(4, target / w));
    R.setSize(w, h);
    R.render(scene, cam);
  }
  const out = document.createElement('canvas');
  out.width = cv.width;
  out.height = cv.height;
  const x = out.getContext('2d');
  x.drawImage(cv, 0, 0);
  if (big) {
    R.setPixelRatio(pr0);
    R.setSize(w, h);
  }
  const sf = out.width / w;
  try {
    if (PHOTO.hud) photoHud(x, sf);
  } catch (e) {
    logWarn('photo hud', e);
  }
  if (PHOTO.stamp) photoStamp(x, out.width, out.height, sf);
  const d = new Date(),
    p2 = (n) => (n < 10 ? '0' : '') + n,
    name =
      'P51_v' +
      VERSION +
      '_' +
      d.getFullYear() +
      p2(d.getMonth() + 1) +
      p2(d.getDate()) +
      '_' +
      p2(d.getHours()) +
      p2(d.getMinutes()) +
      p2(d.getSeconds()) +
      '.jpg';
  const fl = $$('phFlash');
  fl.style.transition = 'none';
  fl.style.opacity = '0.8';
  requestAnimationFrame(() => {
    fl.style.transition = 'opacity .3s';
    fl.style.opacity = '0';
  });
  SND.burst(5000, 2000, 0.03, 0.25, 1, 'bandpass');
  SND.burst(3000, 1200, 0.05, 0.2, 1, 'bandpass', 0.06);
  out.toBlob(
    (b) => {
      if (!b) {
        $$('phMsg').textContent = 'The photo could not be saved.';
        return;
      }
      PHOTO.last = { name, w: out.width, h: out.height, bytes: b.size, type: b.type, blob: b };
      const done = () => {
        $$('phMsg').textContent = 'Saved ' + name + ' (' + out.width + 'x' + out.height + ')';
      };
      const viaLink = () => {
        const u = URL.createObjectURL(b),
          a = document.createElement('a');
        a.href = u;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 5000);
        done();
      };
      /* inside the Claude viewer the page saves through its downloads capability; opened as a file it uses a normal download */
      const cl = window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null);
      cl.then((dl) => {
        if (!dl) return viaLink();
        return dl.save({ filename: name, data: b }).then(done, (er) => {
          $$('phMsg').textContent =
            er && er.code === 'declined' ? 'Save cancelled.' : 'Could not save: ' + ((er && er.code) || 'error');
        });
      }, viaLink);
    },
    'image/jpeg',
    PHOTO.q,
  );
}
