/* ---------- the radio: what the receiver prints ---------- */
const RADIO = { log: [], dirty: true };
RADIO.add = function (from, txt, o) {
  /* traffic from outside the ship comes to the radio operator (the player at the radio, or the AI operator) */
  if (!(o && o.own) && !['SONAR', 'RADAR', 'PCE 842', 'BRIDGE'].includes(from) && typeof radioIn === 'function') radioIn(from, txt);
  const h = Math.floor(WX.hour || 0),
    m = Math.floor(((WX.hour || 0) % 1) * 60);
  this.log.push(String(h).padStart(2, '0') + String(m).padStart(2, '0') + ' ' + from + ': ' + txt);
  (this.sd || (this.sd = [])).push(msgSide(txt, from)) /* whose it is about: its colour on the paper */;
  if (this.sd.length > 30) this.sd.shift();
  if (this.log.length > 30) this.log.shift();
  this.dirty = true;
};
function radioDraw(f) {
  const g = f.g,
    W = 512,
    H = 434;
  g.fillStyle = '#efe9d2';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2a2a';
  g.font = 'bold 19px monospace';
  g.textAlign = 'left';
  const lines = [],
    INK = { jp: '#a81f1a', us: '#1f3a6e', '': '#2a2a2a' } /* red: the enemy; blue: the allies */;
  RADIO.log.forEach((l, k) => {
    const c = INK[(RADIO.sd && RADIO.sd[k]) || ''];
    let s = l;
    while (s.length > 40) {
      let i = s.lastIndexOf(' ', 40);
      if (i < 10) i = 40;
      lines.push([s.slice(0, i), c]);
      s = '      ' + s.slice(i + 1);
    }
    lines.push([s, c], ['', c]);
  });
  const show = lines.slice(-18);
  show.forEach(([l, c], i) => ((g.fillStyle = c), g.fillText(l, 14, 26 + i * 22.5)));
  g.fillStyle = '#7a1a10';
  g.fillRect(0, H - 12, W, 12);
}
