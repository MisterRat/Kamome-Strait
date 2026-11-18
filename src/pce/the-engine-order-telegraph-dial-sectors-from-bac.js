/* the engine-order telegraph dial: sectors from BACK FULL (left) through STOP (top) to FLANK (right) */
const TEL = ['BK\nFULL', 'BK\n2/3', 'BK\n1/3', 'STOP', '1/3', '2/3', 'STD', 'FULL', 'FLNK'];
const telIdx = (t) => (t < -0.34 ? 0 : t < -0.17 ? 1 : t < 0 ? 2 : t === 0 ? 3 : t < 0.3 ? 4 : t < 0.55 ? 5 : t < 0.85 ? 6 : t < 0.98 ? 7 : 8);
function telDial(g, s, ord, ans) {
  g.clearRect(0, 0, s, s);
  g.fillStyle = '#f2efe2';
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2);
  g.fill();
  const A = (i) => -1.35 + (2.7 * i) / 8;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < 9; i++) {
    const a = A(i);
    g.fillStyle = i < 3 ? '#9a2018' : i === 3 ? '#111' : '#1d3d6a';
    g.font = 'bold ' + Math.round(s * 0.055) + 'px monospace';
    TEL[i].split('\n').forEach((t, k) => g.fillText(t, s / 2 + Math.sin(a) * s * 0.36, s / 2 - Math.cos(a) * s * 0.36 + (k - 0.3) * s * 0.06));
  }
  needle(g, s, A(ord), '#b01a10', 0.44);
  needle(g, s, A(ans), '#111', 0.3);
}
