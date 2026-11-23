/* ---------- loop ---------- */
/* WT: the world's clock (s). It runs only while the game is not paused, so everything timed by it (the ships on their runs, the
   craft working the harbours, the waves, the fighters' endurance) stops with the pause (the user's, 2026-11-23: ships had moved
   when he came out of the pause: they ran on the real clock) */
let WT = 0;
let last = performance.now(),
  pa = 0,
  tiltV = 0;
