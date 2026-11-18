/* ---------- minimap ---------- */
const mmC = $$('mmc'),
  mmx = mmC.getContext('2d'),
  MMR = [2000, 4000, 8000, 16000];
let mmZ = 1,
  mmT = 0,
  mmOn = true;
$$('mm').onclick = () => {
  mmZ = (mmZ + 1) % MMR.length;
};
