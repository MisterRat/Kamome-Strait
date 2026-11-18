/* ---------- COMMUNICATIONS: the operators' work, and the Comms school (T at station 3) ----------
   Radar: a bearing cursor (Q / E) and a range strobe (R / F) laid on a contact; Space reports it (true bearing, range in yards).
   Two marks of the same contact at least 40 s apart give its course and speed (the plot).
   Sonar: Q / E train the beam; Z and X take the left and right cuts (the echo's edges): their centre is his bearing; Space reports
   bearing and range to the bridge; U / B / N call the Doppler (up, down, none). The OOD attacks on the sonar operator's reports:
   COMMS.est is what the bridge believes about the submarine. When the player is not on the sonar, an AI operator holds contact and
   reports (small errors, contact lost inside about 150 yards as she passes over him).
   Radio: incoming practice traffic must be acknowledged (Space) and, if it concerns the ship, the guns or the exercise, routed to the
   bridge (B). Away from the radio an AI operator handles it. */
const COMMS = {
  rd: { b: 0, r: 3000, M: new Map(), n: 0, good: 0, bad: 0, tr: 0 },
  sn: { L: null, R: null, tc: 0, echo: null, rep: [], good: 0 },
  est: null,
  rq: [],
  sched: [],
  out: null,
  gen: 40,
  les: null,
};
const cTrue = (b) => (((((-SHIP.hdg + b) * 180) / Math.PI) % 360) + 360) % 360;
const c3 = (d) => String(Math.round(d) % 360).padStart(3, '0');
const cYd = (m) => (Math.round(m / 0.9144 / 25) * 25).toLocaleString('en-US');
function cAxes() {
  return [
    [-Math.sin(SHIP.hdg), -Math.cos(SHIP.hdg)],
    [Math.cos(SHIP.hdg), -Math.sin(SHIP.hdg)],
  ];
}
