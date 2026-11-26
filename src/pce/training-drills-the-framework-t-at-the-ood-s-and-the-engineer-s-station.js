/* the PCE-842's part of the shared training drills (training-drills-the-framework-every-simulator-s-stations-share.js): her drills at
   the OOD's (1) and the engineer's (2) stations, her voices, her Hardcore, the OOD's orders and the engine room's repair jobs in the
   drill box */
SIMS.add({
  id: 'pce',
  drillSay: (who, txt) => RADIO.add(who, txt, { own: true }),
  drillWho: (stn) => (stn === 2 ? 'CHIEF ENGINEER' : 'CAPTAIN'),
  drillHC: () => FM.use('orders') || FM.use('aa') || FM.use('walk') || FM.use('eng') /* Hardcore: any of its options */,
  drillTitle: (stn) => (stn === 2 ? 'ENGINEERING' : 'OFFICER OF THE DECK'),
  /* the OOD's orders, in a drill too (the user's, 2026-11-22): G opens them; while open they take Q / E / Space */
  drillKeyFirst: (code, rep) => SHIP.stn === 1 && DRILL.on && (code === 'KeyG' || OODO.menu) && ordKey(code, rep),
  drillKeyLast: (code, rep) => (dcxLive() ? dcxKey(code, rep) : SHIP.stn === 1 ? ordKey(code, rep) : false),
  /* the OOD: his orders on the left, a drill on the right */
  drillSplit: (stn) => stn === 1,
});
DRILLP.push({
  stn: 2,
  show: () => dcxLive(),
  html: () => '<b style="color:#ff8a6a">' + (DCX.L.every((j) => DCX_K[j.k]) ? 'ENGINE ROOM' : 'DAMAGE CONTROL - ENGINE ROOM') + '</b><br>' + dcxText(),
  draw: (g, w, h) => dcxDraw(g, w, h),
});
