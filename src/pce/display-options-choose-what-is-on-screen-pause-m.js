/* the PCE-842's on-screen boxes for the display options (the shared UI piece shows, hides and remembers them) */
SIMS.add({
  id: 'pce',
  uiItems: [
    { id: 'hud', label: 'Ship readout', sel: '#hud', g: 'Instruments' },
    { id: 'cmp', label: 'Compass strip', sel: '#cmp', g: 'Instruments' },
    { id: 'mm', label: 'Minimap (O)', sel: '#mm', g: 'Instruments' },
    { id: 'hz', label: 'Artificial horizon', sel: '#hz', g: 'Instruments', sc: 'none' },
    { id: 'adf', label: 'ADF radio compass (free flight and the ADF trainer; click it to change station)', sel: '#adf', g: 'Instruments', sc: 'none' },
    { id: 'coach', label: 'Mission coach panel', sel: '#coach', g: 'Instruments', sc: 'none' },
    { id: 'tq', label: 'Engine order gauge', sel: '#tq', g: 'Instruments', sc: 'desk' },
    { id: 'help', label: 'Controls help (H)', sel: '#help', g: 'Instruments' },
    /* at a gun, where to aim at every enemy in its reach (game mode): each gun's own switch, all on by default */
    { id: 'ring3in', label: 'The 3-inch gun', g: 'Sight rings' },
    { id: 'ring40', label: '40 mm', g: 'Sight rings' },
    { id: 'ring20', label: '20 mm', g: 'Sight rings' },
    { id: 'bandit', label: 'Bandit marker and lead ring', sel: '#bd,#bdt,#lead', g: 'Aids', sc: 'none' },
    { id: 'cross', label: 'Guns', sel: '#cross', g: 'Sight rings', sc: 'none' },
    { id: 'rkring', label: 'Rockets', sel: '#rkip', g: 'Sight rings', sc: 'none' },
    { id: 'bmring', label: 'Bombs', sel: '#ccip', g: 'Sight rings', sc: 'none' },
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
});
