/* the P-51's on-screen boxes for the display options (the shared UI piece shows, hides and remembers them) */
SIMS.add({
  id: 'p51',
  uiItems: [
    { id: 'hud', label: 'Flight readout', sel: '#hud', g: 'Instruments' },
    { id: 'cmp', label: 'Compass strip', sel: '#cmp', g: 'Instruments' },
    { id: 'mm', label: 'Minimap (O)', sel: '#mm', g: 'Instruments' },
    { id: 'hz', label: 'Artificial horizon', sel: '#hz', g: 'Instruments' },
    { id: 'adf', label: 'ADF radio compass (free flight and the ADF trainer; click it to change station)', sel: '#adf', g: 'Instruments' },
    { id: 'coach', label: 'Mission coach panel', sel: '#coach', g: 'Instruments' },
    { id: 'tq', label: 'Throttle and flaps gauge', sel: '#tq', g: 'Instruments', sc: 'desk' },
    { id: 'help', label: 'Controls help (H)', sel: '#help', g: 'Instruments' },
    { id: 'bandit', label: 'Bandit marker and lead ring', sel: '#bd,#bdt,#lead', g: 'Aids' },
    { id: 'guide', label: 'Flight path guide in trainers (L); ADF radio compass on/off in free flight (L)', g: 'Aids' },
    { id: 'cross', label: 'Guns', sel: '#cross', g: 'Sight rings' },
    { id: 'rkring', label: 'Rockets', sel: '#rkip', g: 'Sight rings' },
    { id: 'bmring', label: 'Bombs', sel: '#ccip', g: 'Sight rings' },
    { id: 'tThr', label: 'Throttle slider', sel: '#tThr', g: 'Touch controls', sc: 'mob' },
    { id: 'tL', label: 'Gear, flap and brake buttons', sel: '#tL', g: 'Touch controls', sc: 'mob' },
    { id: 'trud', label: 'Rudder arrows', sel: '#tRL,#tRR', g: 'Touch controls', sc: 'mob' },
    { id: 'tweap', label: 'Fire, rocket and bomb buttons', sel: '#tFire,#tRkt,#tBmb', g: 'Touch controls', sc: 'mob' },
    {
      id: 'tbar',
      label: 'Top bar buttons (the pause button stays)',
      sel: '#tBar .tb:not(#tPause)',
      g: 'Touch controls',
      sc: 'mob',
    },
  ],
  uiSet: (id, v) => {
    if (id === 'guide') guide.on = v;
  },
  uiInit: () => {
    if (UI.hid.guide) guide.on = false;
  },
});
