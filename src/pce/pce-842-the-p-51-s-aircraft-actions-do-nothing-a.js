/* PCE-842: the P-51's aircraft actions do nothing aboard the ship (their keys stay reserved until the ship's own systems use them) */
['gear', 'rocket', 'bomb', 'brake', 'flapDn', 'flapUp', 'trimC'].forEach((k) => (SIMS.get('pce').act[k] = () => {}));
SIMS.add({ id: 'pce', uiAct: {
  missions: () => toggleMenu(),
  coach: () => (coachMin = !coachMin),
  map: () => {
    UI.toggle('mm');
    mmT = 0;
  },
  mapOut: () => {
    mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ + 1));
    mmT = 0;
  },
  mapIn: () => {
    mmZ = Math.max(0, Math.min(MMR.length - 1, mmZ - 1));
    mmT = 0;
  },
  photo: () => photoToggle(),
  mute: () => {
    SND.setOn(!SND.on);
    $$('sndOn').checked = SND.on;
    note('SOUND ' + (SND.on ? 'ON' : 'OFF'));
  },
  quality: () => {
    QL.mode = QMODES[(QMODES.indexOf(QL.mode) + 1) % QMODES.length];
    applyQuality();
    note('GRAPHICS: ' + QL.mode.toUpperCase());
  },
} });
['bail', 'guide', 'coach'].forEach((k) => (SIMS.get('pce').uiAct[k] = () => {})); /* PCE-842: no bail-out or path guide */
