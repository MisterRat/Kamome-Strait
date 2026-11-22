/* ---------- the radio: what the receiver prints ----------
   The paper keeps the last 300 entries: the traffic, and every message that popped up on the screen (note) wherever the player was, so
   what was missed at another station can be read back here (the user's, 2026-11-22). At the radio the mouse wheel, Page Up / Down,
   Home and End scroll it (RADIO.scroll); scrolled back, it stays where it is while new traffic prints below. */
const RADIO = { log: [], sd: [], dirty: true, off: 0 /* lines scrolled back from the newest */, nl: 0 /* lines on the paper at the last print */, rec: [] /* [text, time] lately printed */ };
const RADIO_MAX = 300;
RADIO.stamp = () => {
  const h = Math.floor(WX.hour || 0),
    m = Math.floor(((WX.hour || 0) % 1) * 60);
  return String(h).padStart(2, '0') + String(m).padStart(2, '0');
};
RADIO.put = function (line, sd, txt) {
  this.log.push(line);
  this.sd.push(sd) /* whose it is about: its colour on the paper */;
  while (this.log.length > RADIO_MAX) (this.log.shift(), this.sd.shift());
  const now = performance.now();
  this.rec.push([String(txt).toUpperCase(), now]);
  while (this.rec.length && now - this.rec[0][1] > 5000) this.rec.shift();
  this.dirty = true;
};
RADIO.add = function (from, txt, o) {
  /* traffic from outside the ship comes to the radio operator (the player at the radio, or the AI operator) */
  if (!(o && o.own) && !['SONAR', 'RADAR', 'PCE 842', 'BRIDGE'].includes(from) && typeof radioIn === 'function') radioIn(from, txt);
  this.put(this.stamp() + ' ' + from + ': ' + txt, msgSide(txt, from), txt);
};
/* a popup message (note): printed too, unless the same words were printed in the last few seconds */
RADIO.note = function (t) {
  const u = String(t || '').toUpperCase().trim();
  if (!u) return;
  const now = performance.now();
  if (this.rec.some(([r, at]) => now - at < 5000 && (r === u || r.includes(u) || u.includes(r)))) return;
  this.put(this.stamp() + ' > ' + u, msgSide(u), u);
};
/* scroll the paper n lines (+ older, - newer) */
RADIO.scroll = function (n) {
  this.off = Math.max(0, this.off + n);
  this.dirty = true;
};
/* is the player at the radio, looking at the paper */
function radioAt() {
  if (!(camMode == 1 && SHIP.stn === 3) || (typeof GUN !== 'undefined' && GUN.cur)) return false;
  const st = PCEM.STN[3] && PCEM.STN[3][SHIP.sub];
  return !!(st && st.dev === 'radio');
}
function radioDraw(f) {
  const g = f.g,
    W = 512,
    H = 434;
  g.fillStyle = '#efe9d2';
  g.fillRect(0, 0, W, H);
  g.font = 'bold 19px monospace';
  g.textAlign = 'left';
  const lines = [],
    INK = { jp: '#a81f1a', us: '#1f3a6e', '': '#2a2a2a' } /* red: the enemy; blue: the allies */;
  RADIO.log.forEach((l, k) => {
    const c = INK[RADIO.sd[k] || ''];
    let s = l;
    while (s.length > 40) {
      let i = s.lastIndexOf(' ', 40);
      if (i < 10) i = 40;
      lines.push([s.slice(0, i), c]);
      s = '      ' + s.slice(i + 1);
    }
    lines.push([s, c], ['', c]);
  });
  /* scrolled back: keep the same lines in view while new ones print below */
  if (RADIO.off > 0 && lines.length > RADIO.nl) RADIO.off += lines.length - RADIO.nl;
  RADIO.nl = lines.length;
  const N = 18,
    maxOff = Math.max(0, lines.length - N);
  RADIO.off = Math.min(RADIO.off, maxOff);
  const back = RADIO.off > 0,
    n = back ? N - 1 : N /* scrolled back: the last line says so */,
    end = lines.length - RADIO.off,
    show = lines.slice(Math.max(0, end - n), end);
  show.forEach(([l, c], i) => ((g.fillStyle = c), g.fillText(l, 14, 26 + i * 22.5)));
  g.font = 'bold 15px monospace';
  g.textAlign = 'right';
  if (back) {
    const newer = lines.slice(end).filter((l) => l[0] && !/^ {6}/.test(l[0])).length;
    g.fillStyle = '#d9cfae';
    g.fillRect(0, H - 40, W, 28);
    g.fillStyle = '#5a1a10';
    g.textAlign = 'center';
    g.fillText('▼ ' + newer + ' NEWER  -  WHEEL / PG DN, END: LATEST', W / 2, H - 20);
  }
  g.fillStyle = '#7a1a10';
  g.fillRect(0, H - 12, W, 12);
  if (!back && end - n > 0) {
    /* more above: say how to read it, in the paper's red edge */
    g.fillStyle = '#e8c9a0';
    g.font = 'bold 10px monospace';
    g.textAlign = 'right';
    g.fillText('▲ OLDER: WHEEL / PG UP', W - 8, H - 3);
  }
}
