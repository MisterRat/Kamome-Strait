/* doc rows: [label, ids | literal html, note, box line] ; a string instead of an id list is literal text */
/* the PCE's doc rows for the help (the shared help piece builds the tables from them; her controls box is helpBox) */
SIMS.add({
  id: 'pce',
  kbDoc: [
  ['Rudder', ['rollL', 'rollR'], 'hold, from any station; let go and she steadies', 1],
  ['Engines', ['thrUp', 'thrDn'], 'from any station; the order stays set', 1],
  ['Stations', ['st1', 'st2', 'st3', 'st4', 'st5'], 'press again for the next view', 2],
  ['At a gun', 'the mouse aims &middot; Space or click fires &middot; ' + 'X sight / look round &middot; 4 next gun &middot; Page Up / Down 3"/50 sight range (Hardcore)', '', 0],
  ['Targets', ['targets'], 'rafts for the 3"/50, towed sleeves for the 40 mm and 20 mm', 0],
  ['Camera', ['camera', 'clear'], '', 2],
  ['Photo mode', ['photo'], '', 2],
  ['Mouse', 'chase: drag to circle, wheel to zoom &middot; station: drag to look round &middot; gun: left click fires, right-drag lays it (the 20 mm and 40 mm also follow plain movement)', '', 0],
  ['Restart', ['restart'], '', 3],
  ['Menus', ['pause', 'manual'], '', 3],
  ['Display', ['help', 'map', 'mapOut', 'mapIn', 'quality', 'mute'], '', 4],
],
  padDoc: [
  ['Rudder', 'Right stick left / right (at the radar, sonar and radio it works the set instead)', 'let go and she steadies', 0],
  ['Engines', 'D-pad up / down', 'the order stays where you leave it', 0],
  ['Stations', 'LB / RB: the station before / after; from the chase view, back to her station', '', 0],
  ['Look around', 'Left stick (at a gun it aims; at the chart table it moves the cursor)', '', 0],
  ['Camera', ['camera'], 'chase / station', 0],
  ...pcePadDoc(),
  ['Restart', ['restart'], '', 0],
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
  ['Pause / manual', ['pause', 'manual'], '', 3, 'box'],
],
  helpBody: () => {
    helpCtx = '';
    helpBox();
  },
});
