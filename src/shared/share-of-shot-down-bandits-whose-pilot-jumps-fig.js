/* Share of shot-down bandits whose pilot jumps. Fighter pilots hit in the air mostly did not get out: in the Battle of Britain
   about 43% of the pilots of lost aircraft were killed, and roughly half of those hit by Bf 109s, so well under half bailed out. */
const BAIL_ENEMY = 0.35;
const BL = { on: false, fin: false, cm0: 0 },
  CH = [],
  bailPil = makePilot(),
  bailCh = makeChute(4.5, 0xf08a24, 0xf2efe6),
  BLV = new V(),
  BLW = new V();
let bailCanM = null;
bailPil.visible = false;
bailPil.userData.head.visible = false; /* first person: his own head is where the camera is */
bailCh.visible = false;
bailPil.add(bailCh);
scene.add(bailPil);
