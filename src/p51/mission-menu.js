/* the P-51's missions: [id, title, what it is] (the shared mission menu shows them); picking one sets the mission and resets */
SIMS.add({
  id: 'p51',
  missions: [
  ['free', 'Free Flight', 'Fly around. A convoy runs on the road, with ground targets, flak guns and searchlights.'],
  ['takeoff', 'Takeoff Trainer', 'Step-by-step coaching from the runway to a safe climb.'],
  ['landing', 'Landing Trainer', 'Start on approach: gear, flaps, flare and stop. Scored.'],
  ['convoy', 'Convoy Strafing', 'Hunt the timed convoy between the depot and the base, under flak (Settings > Ground fire).'],
  ['bomb', 'Building Bombing', 'Destroy the depot and base buildings under flak (Settings > Ground fire). Ordnance resupplies itself.'],
  ['barrel', 'Barrel Roll', 'A coached corkscrew roll around a point ahead. Scored.'],
  ['immelmann', 'Immelmann Turn', 'Half loop up, half roll to level: reverse course and gain height. Hardcore needs more speed.'],
  ['splits', 'Split S', 'Roll inverted and pull through a half loop down. Needs height.'],
  ['wingover', 'Wingover', 'Climbing turn over the top and a diving turn back: reverse course at the same height.'],
  ['lowyoyo', 'Low Yo-Yo', 'Dive below a turning target to gain speed, then zoom up onto his tail.'],
  ['adf', 'ADF Navigation: Kamome Field', 'Fly 43 km out over the sea with the ADF radio compass, find the island airfield by its radio beacon and land there. Fuel is topped up.'],
  ['highyoyo', 'High Yo-Yo', 'Pull up out of a turn plane to bleed a speed excess, then drop onto his tail.'],
],
  missionPick: (it) => {
    trn.mode = it[0];
    reset();
  },
});
