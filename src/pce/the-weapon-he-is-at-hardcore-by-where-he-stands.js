/* the weapon he is at: Hardcore by where he stands, game mode by the position he jumped to */
const tpAt = () => (FM.use('walk') ? TPW.at : SHIP.sub);
