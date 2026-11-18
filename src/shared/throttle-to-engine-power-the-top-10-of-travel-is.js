/* throttle to engine power: the top 10% of travel is war emergency power (1,720 hp against 1,490 hp), so full throttle
   keeps its old performance and 90% is the normal maximum */
const smooth = (a, b, x) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const power = (t) => (FM.use('wep') ? (t <= 0.9 ? t * 0.962 : 0.866 + (t - 0.9) * 1.34) : t);
