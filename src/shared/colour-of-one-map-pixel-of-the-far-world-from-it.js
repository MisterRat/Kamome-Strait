/* colour of one map pixel of the far world from its height, its slope and where it is (field patches give the land the same mottled look as the home map) */
function mmCol(h, sl, x, z, d, o) {
  let r, g, b;
  if (h < -5.5) {
    /* the sea colour by depth, measured from the detailed home picture so the two pictures meet without a seam */
    const dp = -h;
    let k = 0;
    while (k < MMW.length - 2 && dp > MMW[k + 1][0]) k++;
    const t = Math.max(0, Math.min(1, (dp - MMW[k][0]) / (MMW[k + 1][0] - MMW[k][0])));
    (r = MMW[k][1] + (MMW[k + 1][1] - MMW[k][1]) * t), (g = MMW[k][2] + (MMW[k + 1][2] - MMW[k][2]) * t), (b = MMW[k][3] + (MMW[k + 1][3] - MMW[k][3]) * t);
  } else {
    const k = Math.min(1, Math.max(0, (h - 100) / 600)),
      f1 = vn(x / 650 + 5.1, z / 650 - 2.3),
      f2 = vn(x / 170 + 1.7, z / 170 + 8.4),
      lo = h < 60 ? 1 : 0.35, /* the lowlands are patchwork farmland, the hills are more even */
      tone = 1 + lo * (0.7 * f1 + 0.3 * f2) + (1 - lo) * 0.25 * f1,
      sh = Math.max(0.55, Math.min(1.3, 1 + sl * 2.4));
    (r = 101 + 30 * k + 38 * lo * f1), (g = 140 - 25 * k), (b = 54 + 36 * k);
    (r *= tone * sh), (g *= (1 + 0.55 * (tone - 1)) * sh), (b *= tone * sh);
    if (h > 900) (r += 40 * (h - 900) / 400), (g += 40 * (h - 900) / 400), (b += 40 * (h - 900) / 400);
  }
  d[o] = Math.min(255, r);
  d[o + 1] = Math.min(255, g);
  d[o + 2] = Math.min(255, b);
  d[o + 3] = 255;
}
const mmHt = (x, z) => HR(x, z); /* HR is the height of the whole world: the home terrain, the far world and Kamome Field's island */
function mmFar() {
  /* the terrain picture of the whole world (the detailed one only covers the home area), drawn once from the height function */
  if (mmFd) return;
  mmFd = true;
  const cv = MMF,
    cx = cv.getContext('2d');
  cv.width = cv.height = MFN;
  const im = cx.createImageData(MFN, MFN),
    hh = new Float32Array(MFN * MFN),
    st = MFS / MFN;
  for (let j = 0; j < MFN; j++) for (let i = 0; i < MFN; i++) hh[j * MFN + i] = mmHt((i + 0.5) * st - MFS / 2, (j + 0.5) * st - MFS / 2);
  for (let j = 0; j < MFN; j++)
    for (let i = 0; i < MFN; i++) {
      const hx = hh[j * MFN + Math.min(MFN - 1, i + 1)] - hh[j * MFN + Math.max(0, i - 1)],
        hz = hh[Math.min(MFN - 1, j + 1) * MFN + i] - hh[Math.max(0, j - 1) * MFN + i];
      mmCol(hh[j * MFN + i], (hx * 0.5 + hz * 0.4) / (2 * st), (i + 0.5) * st - MFS / 2, (j + 0.5) * st - MFS / 2, im.data, (j * MFN + i) * 4);
    }
  cx.putImageData(im, 0, 0);
}
