/* PCE-842's missions: [id, title, what it is, station, view there, practice targets out] (the shared mission menu shows them) */
SIMS.add({
  id: 'pce',
  missions: [
  ['patrol', 'Free Patrol', 'The ship is yours: conn her from the open bridge, answer the bells, keep watch. No targets out.', 1, 0, false],
  ['gun3', 'Gunnery Practice: 3"/50', 'The forward 3"/50 with the target rafts out to 6,000 yards, PT-108 and her target sled, and the towed sleeves.', 5, 0, true],
  ['gun20', 'Gunnery Practice: 20 mm', 'The 20 mm amidships: the rafts inside 1,000 yards, the sleeve that passes close, and the sled on PT-108\'s passes.', 5, 1, true],
  ['gun40', 'Gunnery Practice: Twin 40 mm', 'The twin 40 mm aft against the towed sleeves and the target sled.', 5, 2, true],
  ['asw', 'Antisubmarine Attack Run', 'The torpedoman\'s station with the exercise submarine out: the OOD runs in on him and phones the orders. Hedgehog, K-guns and racks. Scored.', 6, -1, true],
  ['sonar', 'Sonar Watch', 'Communications, with the exercise submarine out: find him on the sonar and the radar.', 3, 1, true],
],
  /* free play (trn.mode), reset only the first time; the practice targets out (or in) as the mission wants them, then the station and the view there */
  missionPick: (it, first) => {
    trn.mode = 'free';
    if (first) reset();
    paused = false;
    if (!!PT.on !== it[5]) ptToggle();
    const list = PCEM.STN[it[3]] || [];
    camMode = 1;
    SHIP.stn = it[3] === 6 ? 1 : it[3];
    SHIP.sub = it[4] < 0 ? 0 : (it[4] - 1 + list.length) % Math.max(1, list.length);
    shipStation(it[3]);
    note(it[1].toUpperCase());
  },
});
