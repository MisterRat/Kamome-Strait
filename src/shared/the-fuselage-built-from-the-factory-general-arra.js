/* ---------- the fuselage, built from the factory general-arrangement drawing ----------
   Stations are inches from the spinner tip (1 in = 0.0254 m). One table gives half-width, top, bottom and squareness at each station.
   The body, the cockpit opening, the glass, the rails and every decal read it, so they always fit each other. */
const FUS_N = -4.88; /* z of the spinner tip */
const fz = (x) => FUS_N + x * 0.0254;
const FUS_T = [
  [27, 0.37, 0.42, -0.4, 2.3],
  [35, 0.385, 0.455, -0.55, 2.4],
  [50, 0.4, 0.495, -0.66, 2.5],
  [70, 0.42, 0.533, -0.735, 2.6],
  [90, 0.445, 0.56, -0.77, 2.6],
  [110, 0.455, 0.577, -0.775, 2.6],
  [130, 0.46, 0.585, -0.775, 2.6],
  [180, 0.46, 0.585, -0.765, 2.6],
  [222, 0.41, 0.577, -0.74, 2.6],
  [250, 0.34, 0.545, -0.6, 2.5],
  [280, 0.3, 0.52, -0.53, 2.4],
  [300, 0.28, 0.525, -0.47, 2.3],
  [320, 0.25, 0.5, -0.41, 2.2],
  [340, 0.2, 0.4, -0.33, 2.2],
  [360, 0.14, 0.27, -0.18, 2.2],
  [380, 0.06, 0.12, -0.04, 2.1],
  [387, 0.0, 0.05, 0.0, 2.0],
].map((r) => [fz(r[0]), r[1], r[2], r[3], r[4]]);
