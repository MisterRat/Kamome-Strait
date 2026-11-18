/* ---------- the attack: the OOD's conning and his orders ---------- */
function aswSay(txt, k, fire) {
  const o = { txt, k: k || null, t0: ASW.t, st: fire ? 'open' : 'info' };
  ASW.O.push(o);
  ASW.msg = txt;
  SND.tone(420, 420, 0.12, 0.18, 'square');
  SND.tone(420, 420, 0.12, 0.18, 'square', 0.18);
  return o;
}
