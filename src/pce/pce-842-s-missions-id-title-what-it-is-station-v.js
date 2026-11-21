/* PCE-842's missions: [id, title, what it is, station, view there, practice targets out, the training drill (optional)] (the shared mission menu shows them) */
SIMS.add({
  id: 'pce',
  missions: [
  ['patrol', 'Free Patrol', 'The ship is yours: conn her from the pilothouse, answer the bells, keep watch. No targets out.', 1, 0, false],
  ['gun3', 'Gunnery Practice: 3"/50', 'The forward 3"/50 with the target rafts out to 6,000 yards, PT-108 and her target sled, and the towed sleeves.', 4, 0, true],
  ['gun20', 'Gunnery Practice: 20 mm', 'The 20 mm amidships: the rafts inside 1,000 yards, the sleeve that passes close, and the sled on PT-108\'s passes.', 4, 1, true],
  ['gun40', 'Gunnery Practice: Twin 40 mm', 'The twin 40 mm aft against the towed sleeves and the target sled.', 4, 2, true],
  ['asw', 'Antisubmarine Attack Run', 'The torpedoman\'s station with the exercise submarine out: the OOD runs in on him and phones the orders. Hedgehog, K-guns and racks. Scored.', 5, -1, true],
  ['sonar', 'Sonar Watch', 'Communications, with the exercise submarine out: find him on the sonar and the radar.', 3, 1, true],
  /* the training drills (the user's, 2026-11-21): the last field is the drill (TRAINING DRILLS); T at the station lists them all */
  ['d-mob', 'OOD Drill: Man Overboard', 'A man goes over the side at standard speed: the Williamson turn back to him, then stop alongside. Assessed.', 1, 0, false, 'mob'],
  ['d-fix', 'OOD Drill: Navigation Fix', 'Bearings on three landmarks with the binoculars; your fix is checked against her true position. Assessed.', 1, 0, false, 'fix'],
  ['d-recog', 'OOD Drill: Recognition', 'Challenge a closing boat by light and read her reply; tell two aircraft apart. Friend or enemy? Assessed.', 1, 0, false, 'recog'],
  ['d-asw', 'OOD Drill: Antisubmarine Attack', 'Con the attack on the exercise sub yourself from sonar\'s reports; order the Hedgehog and the pattern on time. Assessed.', 1, 0, true, 'asw-ood'],
  ['d-along', 'OOD Drill: Coming Alongside', 'From 700 m off PT Base Halsey: bring her in and stop alongside her pier, parallel and gently. Assessed.', 1, 0, false, 'along'],
  ['d-bells', 'Engineering Drill: Answer the Bells', 'The engine room: answer ten engine orders on the throttle, quickly and the right way. Assessed.', 2, 0, false, 'bells'],
  ['d-smoke', 'Engineering Drill: Make Smoke', 'Light off the smoke generator on the bridge\'s order and keep the screen thick for a minute. Assessed.', 2, 0, false, 'smoke'],
  ['d-dc', 'Engineering Drill: Damage Control', 'Four casualties in the engine room: burst pipes, holes, fires, a list, the cooling water. Assessed.', 2, 0, false, 'dc'],
],
  /* free play (trn.mode), reset only the first time; the practice targets out (or in) as the mission wants them, then the station and the view there */
  missionPick: (it, first) => {
    trn.mode = 'free';
    if (first) reset();
    paused = false;
    if (!!PT.on !== it[5]) ptToggle();
    const list = PCEM.STN[it[3]] || [];
    camMode = 1;
    SHIP.stn = it[3] === 5 ? 1 : it[3];
    SHIP.sub = it[4] < 0 ? 0 : (it[4] - 1 + list.length) % Math.max(1, list.length);
    shipStation(it[3]);
    note(it[1].toUpperCase());
    if (it[6]) drillStart(it[6]);
  },
});
