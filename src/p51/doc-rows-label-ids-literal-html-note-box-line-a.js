/* doc rows: [label, ids | literal html, note, box line] ; a string instead of an id list is literal text */
/* the P-51's doc rows for the help (the shared help piece builds the tables and the controls box from them) */
SIMS.add({
  id: 'p51',
  kbDoc: [
  ['Pitch', ['pitchUp', 'pitchDn'], '', 1],
  ['Roll', ['rollL', 'rollR'], '', 2],
  ['Rudder', ['rudL', 'rudR'], '', 2],
  [
    'Control surfaces',
    () =>
      'Ailerons, elevator, rudder, flaps and the cockpit stick and pedals all move with whatever you use (keys, controller, touch or tilt), including your sensitivity and invert settings. View the plane from outside (' +
      kbText('camera') +
      ') to watch them.',
    '',
    0,
  ],
  ['Throttle', ['thrUp', 'thrDn'], '', 3],
  ['Flaps', ['flapDn', 'flapUp'], '10&deg;&le;640 &middot; 20&deg;&le;440 &middot; 30/45&deg;&le;360 km/h', 3],
  ['Landing gear', ['gear'], '', 4],
  ['Wheel brakes', ['brake'], 'on the ground only', 4],
  ['Guns', ['guns'], '', 5],
  ['Rocket / bomb', ['rocket', 'bomb'], '', 5],
  ['Camera', ['camera', 'clear'], 'Y roams: the mouse moves the camera, the flight carries on', 4],
  ['Trim (Hardcore)', ['trimDn', 'trimUp', 'trimRL', 'trimRR', 'trimAL', 'trimAR', 'trimC'], 'elevator, rudder, aileron; hold to move the tab', 4],
  ['Bail out', ['bail'], 'press twice; controller: hold both bumpers (then drag the mouse to look)', 4],
  ['Photo mode', ['photo'], 'free camera and JPG snapshots (also in the pause menu)', 4],
  [
    'Mouse',
    () =>
      'Chase view: drag to circle the plane, wheel to zoom. ' +
      kbText('clear') +
      ' switches to the roam camera (left-drag looks, right-drag moves along the ground, middle-drag up and down, wheel in and out; hold ` for six times bigger steps) and back to chase. Cockpit view: drag to look around (release recenters)',
    '',
    0,
  ],
  ['Bandits', () => kbText('brake') + ' in the air calls a bandit; press it again to clear it', '', 6],
  ['Difficulty', ['diff1', 'diff2', 'diff3'], '', 6],
  ['Restart', ['restart'], '', 6],
  ['Menus', ['pause', 'missions', 'manual'], 'Tab or &larr; / &rarr; switch tabs', 7],
  ['Display', ['help', 'map', 'mapOut', 'mapIn', 'guide', 'coach', 'quality', 'mute'], '', 8],
],
  padDoc: [
  ['Pitch / roll', 'Right stick (pull back = climb)', '', 1],
  ['Rudder', ['rudL', 'rudR'], 'also steers on the ground', 1],
  ['Look around', 'Left stick: cockpit free-look, release to recenter', '', 2],
  ['Throttle', ['thrUp', 'thrDn'], '', 3],
  ['Flaps', ['flapDn', 'flapUp'], '', 3],
  ['Guns', ['guns'], '', 4],
  ['Rocket / bomb', ['rocket', 'bomb'], '', 4],
  ['Gear / brakes', ['gear', 'brake'], 'brakes work on the ground only', 5],
  ['Camera', ['camera'], '', 5],
  [
    'Trim (Hardcore)',
    () =>
      'Hold ' +
      padText('pause') +
      ' and use the D-pad (up = nose down, down = nose up; left / right = rudder), LB / RB = aileron, A = centre; tap ' +
      padText('pause') +
      ' alone for the pause menu',
    '',
    5,
  ],
  ['Bandits', () => padText('brake') + ' in the air calls a bandit; press it again to clear it', '', 6],
  ['Difficulty', () => 'Tap ' + padText('r3') + ' (press the right stick) to cycle', '', 6],
  ['Restart', ['restart'], 'any face button after a crash', 6],
  [
    'Menus',
    () =>
      padText('pause') +
      ' opens the pause menu &middot; LB / RB switch tabs &middot; D-pad up / down and A choose &middot; B closes &middot; right stick scrolls these pages &middot; ' +
      padText('manual') +
      ' opens this manual',
    '',
    0,
  ],
  ['Pause / manual', ['pause', 'manual'], '', 7, 'box'],
],
  helpBody: (box) => {
    $$('hkBody').innerHTML = box(
      '<b style="color:var(--acc)">CONTROLS &ndash; KEYBOARD</b> (' + kbText('help') + ' hides)',
      SIMS.cur.kbDoc,
      false,
      '<br>Mouse drag: circle the plane (chase) / look around (cockpit)',
    );
    $$('hpBody').innerHTML = box(
      '<b style="color:var(--acc)">CONTROLS &ndash; CONTROLLER</b> (' + kbText('help') + ' hides)',
      SIMS.cur.padDoc,
      true,
      '',
    );
  },
});
