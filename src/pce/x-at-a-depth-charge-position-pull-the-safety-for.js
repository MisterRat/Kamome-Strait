/* X at a depth-charge position: pull the safety forks (armed) or put them back (safe). A safe charge does not go off */
function tpArm() {
  const tp = tpTp();
  if (DC.arm[tp] === undefined) return note('NOT AT A DEPTH-CHARGE POSITION');
  DC.arm[tp] = !DC.arm[tp];
  note(TPNAME[tp] + (DC.arm[tp] ? ': ARMED - SAFETY FORKS OUT' : ': SAFE - SAFETY FORKS IN'));
}
