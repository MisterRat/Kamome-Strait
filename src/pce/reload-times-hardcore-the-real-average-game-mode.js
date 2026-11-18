/* reload times: Hardcore the real average, game mode half of it */
function rldK() {
  return FM.use('reload') ? 1 : 0.5;
}
