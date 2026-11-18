/* close up, the far world is drawn in 4 km tiles at 64 m a pixel, made a few at a time as they come into view */
const MMTL = new Map(),
  MTS = 4096,
  MTN = 64;
function mmTile(tx, tz) {
  const N = MTN + 2,
    st = MTS / MTN,
    cv = document.createElement('canvas'),
    cx = cv.getContext('2d');
  cv.width = cv.height = N;
  const im = cx.createImageData(N, N),
    hh = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) hh[j * N + i] = mmHt(tx * MTS + (i - 0.5) * st, tz * MTS + (j - 0.5) * st);
  for (let j = 1; j <= MTN; j++)
    for (let i = 1; i <= MTN; i++) {
      const hx = hh[j * N + i + 1] - hh[j * N + i - 1],
        hz = hh[(j + 1) * N + i] - hh[(j - 1) * N + i];
      mmCol(hh[j * N + i], (hx * 0.5 + hz * 0.4) / (2 * st), tx * MTS + (i - 0.5) * st, tz * MTS + (j - 0.5) * st, im.data, (j * N + i) * 4);
    }
  for (let i = 0; i < N; i++) for (const j of [0, N - 1]) for (const [a, b] of [[i, j], [j, i]]) {
    const q = (Math.max(1, Math.min(MTN, b)) * N + Math.max(1, Math.min(MTN, a))) * 4,
      o = (b * N + a) * 4;
    im.data[o] = im.data[q]; im.data[o + 1] = im.data[q + 1]; im.data[o + 2] = im.data[q + 2]; im.data[o + 3] = 255;
  }
  cx.putImageData(im, 0, 0);
  return cv;
}
const MMC = document.createElement('canvas'),
  MCN = 10; /* the tiles are laid into one picture, pixel for pixel, so there are no tile edges to show */
let mmCk = '';
function mmTiles(g, Rm) {
  const x0 = Math.floor((pos.x - Rm) / MTS),
    x1 = Math.floor((pos.x + Rm) / MTS),
    z0 = Math.floor((pos.z - Rm) / MTS),
    z1 = Math.floor((pos.z + Rm) / MTS),
    cx0 = Math.floor(pos.x / MTS) - 4,
    cz0 = Math.floor(pos.z / MTS) - 4;
  let made = 0;
  const want = [];
  for (let tz = z0; tz <= z1; tz++) for (let tx = x0; tx <= x1; tx++) want.push([tx, tz, Math.hypot((tx + 0.5) * MTS - pos.x, (tz + 0.5) * MTS - pos.z)]);
  want.sort((a, b) => a[2] - b[2]);
  let dirty = false;
  for (const [tx, tz] of want) {
    const key = tx + ',' + tz;
    if (!MMTL.has(key)) {
      if (made >= 3) continue;
      made++;
      MMTL.set(key, mmTile(tx, tz));
      if (MMTL.size > 160) MMTL.delete(MMTL.keys().next().value);
      dirty = true;
    }
  }
  const k = cx0 + ',' + cz0;
  if (k !== mmCk) (mmCk = k), (dirty = true);
  if (dirty) {
    const c = MMC.getContext('2d');
    MMC.width = MMC.height = MCN * MTN;
    for (let j = 0; j < MCN; j++)
      for (let i = 0; i < MCN; i++) {
        const t = MMTL.get(cx0 + i + ',' + (cz0 + j));
        if (t) c.drawImage(t, 1, 1, MTN, MTN, i * MTN, j * MTN, MTN, MTN);
      }
  }
  g.imageSmoothingEnabled = false;
  g.drawImage(MMC, cx0 * MTS, cz0 * MTS, MCN * MTS, MCN * MTS);
  g.imageSmoothingEnabled = true;
}
