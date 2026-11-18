/* =====================================================================================================================
   THE TORPEDOMAN AT WORK: the Hedgehog forward, the K-guns each side and the racks at the stern, fired on the OOD's orders
   through a real attack run on the exercise submarine.
   The OOD (the AI, while the player is the torpedoman) cons the ship: he opens out, turns in on the sonar contact and runs over the
   sub, and gives his orders over the sound-powered phone in the real sequence: set depth, stand by Hedgehog, fire Hedgehog, stand
   by charges, fire one, fire the K-guns each side, fire two. The player has to be at the right weapon, with the right depth set,
   on time. The positions are 60 m apart, so a full run means rushing the length of the ship. Game mode: 6 steps through the
   positions and J jumps to the one the order needs. Hardcore: walk the deck with W A S D (Shift runs). The torpedoman cannot conn
   the ship (he cannot see the target, it is underwater): at his station W / S and A / D do not reach the engines or the rudder.
   After each run a debrief: orders on time, depth setting, Hedgehog hits, the closest charge, and the exercise sub's verdict.
   The Hedgehog (Mk 10): 24 contact-fuzed bombs ripple-fired about 200 m ahead in a circle about 40 m across; they sink and only
   go off if they strike the hull, so a miss is silent. Loading is the torpedoman's job (hold R at the Hedgehog), and the
   cradles roll with the ship, so firing on the roll throws the pattern off to one side. All figures are first-pass (see the plan).
   ===================================================================================================================== */
const tpXF = (f) => 27.75 - 0.6096 * f,
  tpFX = (x) => (27.75 - x) / 0.6096;
const tpList = () => PCEM.STN[6];
const tpIdx = (tp) => tpList().findIndex((s) => s.tp === tp);
const TPNAME = { hh: 'HEDGEHOG', port: 'PORT K-GUNS', stbd: 'STARBOARD K-GUNS', rack: 'RACKS' };
