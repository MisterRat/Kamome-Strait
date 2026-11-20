/* Hardcore 'ops': the real flap settings (6 steps up to 50 degrees) with their speed limits */
function syncFlaps() {
  const h = FM.use('ops');
  if (h === flapHC) return;
  flapHC = h;
  ANG = h ? ANG_H : ANG_S;
  FLIM = h ? FLIM_H : FLIM_S;
  FL = h ? FL_H : FL_S;
  flapLvl = Math.min(flapLvl, ANG.length - 1);
  const e = document.getElementById('flp6');
  if (e) e.style.display = h ? '' : 'none';
}
function gmax(v) {
  const m = v * 2.237;
  for (let i = 1; i < GT.length; i++)
    if (m <= GT[i][0]) {
      const a = GT[i - 1],
        b = GT[i];
      return a[1] + ((b[1] - a[1]) * (m - a[0])) / (b[0] - a[0]);
    }
  return 7;
}
