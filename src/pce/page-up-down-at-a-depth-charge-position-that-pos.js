/* Page Up / Down at a depth-charge position: that position's pistol depth (each has its own: set them all on the order) */
function dcDepth(d) {
  const tp = tpTp();
  if (!DC.dep[tp]) return note(tp === 'hh' ? 'THE HEDGEHOG HAS A CONTACT FUZE - NO DEPTH TO SET' : 'NOT AT A DEPTH-CHARGE POSITION');
  DC.dep[tp] = Math.max(50, Math.min(300, DC.dep[tp] + d));
  DC.depth = DC.dep[tp];
  note(TPNAME[tp] + ': DEPTH ' + DC.dep[tp] + ' FT');
}
