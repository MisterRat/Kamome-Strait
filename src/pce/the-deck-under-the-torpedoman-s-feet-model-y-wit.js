/* the deck under the torpedoman's feet (model y), with the ladder down at the break of the forecastle (frame 62.8) */
function tpDeck(f) {
  if (f < 62.3) return PCEM.hd(f) + 0.12;
  if (f > 63.3) return PCEM.hm(f) + 0.12;
  const a = PCEM.hd(62.3) + 0.12,
    b = PCEM.hm(63.3) + 0.12;
  return a + (b - a) * (f - 62.3);
}
