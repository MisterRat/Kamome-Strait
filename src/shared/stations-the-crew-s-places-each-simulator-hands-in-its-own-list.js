/* STATION: the crew's places, shared by every simulator with stations (the PCE-842's five, the M4A3's). A station is a number (the key
   1-6 that takes it) with a list of views; pressing the same key again steps to its next view. The shared part knows nothing of ships or
   tanks: each simulator hands in its own list and puts the eye there, through its role:
     stations()                 its stations: { n: [view, ...] }, each view at least { name } (shown in a note when taken)
     stationTake(n, view, sub)  put the eye at that view (and anything the simulator does on arriving: a gun taken, a helmsman told)
     stationBlock(n)            optional: a message instead of taking it (the key does nothing else), else null
     stationFirst(n, list)      optional: the view a station taken afresh starts at (default the first)
   STATION.take(n): what the key does: false if the simulator has no station n. Taking one puts the camera in first person with the
   head straight ahead. STATION.stn, STATION.sub: where the player is (the station, its view); STATION.view(): that view. */
const STATION = {
  stn: 1,
  sub: 0,
  list(n) {
    const L = SIMS.cur && SIMS.cur.stations();
    return L ? L[n] : null;
  },
  view() {
    const l = STATION.list(STATION.stn);
    return l ? l[STATION.sub] : null;
  },
  take(n) {
    const R = SIMS.cur,
      list = STATION.list(n);
    if (!list || !list.length) return false;
    const msg = R.stationBlock(n);
    if (msg) return note(msg), true;
    STATION.sub = camMode == 1 && STATION.stn === n ? (STATION.sub + 1) % list.length : R.stationFirst(n, list);
    STATION.stn = n;
    const st = list[STATION.sub];
    viewYaw = viewPitch = 0;
    camMode = 1;
    R.stationTake(n, st, STATION.sub);
    note(st.name);
    return true;
  },
};
