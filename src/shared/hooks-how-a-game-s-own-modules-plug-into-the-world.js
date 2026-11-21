/* HOOKS: how a game's own modules plug into the shared world without the shared code knowing about them (Kamome Strait is
   modular everywhere: new ships, aircraft, units, enemies, regions and missions arrive as their own pieces). Shared code calls the
   handlers listed here; a game's pieces add theirs (HOOKS.<name>.push(fn)) before the world is built. */
const HOOKS = {
  /* claimShip(kind, num, o): the allied fleet offers each ship as it is placed (o is its AFLD entry, mesh o.m). A handler that
     returns true takes her as a player's ship: she leaves the AI fleet and gets no AI gun crews. */
  claimShip: [],
  /* mapDraw(g, lw): draw on the minimap after the world's marks (the canvas context in world metres, lw(px) a line width) */
  mapDraw: [],
  /* mapTarget(b): true if building b is the current mission's target (the minimap marks it orange) */
  mapTarget: [],
  /* coachInfo(): an extra line for the mission coach box (e.g. the flight path guide's advice), or '' */
  coachInfo: [],
  /* nightLights: meshes whose opacity follows the dusk (WX.paint): the vehicles' own navigation lights */
  nightLights: [],
  /* collJoin(C): once a frame, add a simulator's own bodies to collision avoidance (C is COLL; C.pl holds the player's own body) */
  collJoin: [],
  /* tick(dt): once a frame while the game runs (not paused, not a replay), after the simulator's own live update: modules that
     are neither the world nor a simulator (Kamome Strait's crossovers, say) run here */
  tick: [],
};
