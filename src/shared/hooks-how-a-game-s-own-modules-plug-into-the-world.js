/* HOOKS: how a game's own modules plug into the shared world without the shared code knowing about them (Kamome Strait is
   modular everywhere: new ships, aircraft, units, enemies, regions and missions arrive as their own pieces). Shared code calls the
   handlers listed here; a game's pieces add theirs (HOOKS.<name>.push(fn)) before the world is built. */
const HOOKS = {
  /* claimShip(kind, num, o): the allied fleet offers each ship as it is placed (o is its AFLD entry, mesh o.m). A handler that
     returns true takes her as a player's ship: she leaves the AI fleet and gets no AI gun crews. */
  claimShip: [],
};
