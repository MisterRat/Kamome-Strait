/* the engraved panel lines, rivets and small parts of the player's aircraft: only drawn when the camera is near (never on Low) */
function updPlaneDetail(d) {
  const on = QL.t().detail > 0 && d < 45;
  if (on !== PDET.on && PDET.list) {
    PDET.on = on;
    PDET.list.forEach((o) => (o.visible = on));
  }
}
