/* the naval bases call for fighters when they come under fire (the user's, 2026-11-21: each naval base can call for air support when
   under fire). Port Ugaki (the IJN base): a hit on anything of it (damage()) and it calls Airbase Kakuta, its fighter strip; a minute
   later two Ki-84s take off there and come for the attacker: the P-51 meets them as bandits (EN), the PCE as a raid (RAID). Our radio
   intelligence hears the call. One call in ten minutes; none if Kakuta's parked fighters have all been destroyed. PT Base Halsey (the
   US base): raiders shooting within 3 km of it and it calls Kamome Control for P-51s from Fletcher Field (the air support crossover,
   CAP, the PCE's air support). The current simulator brings the Ki-84s on (its role's scramble(p)). */
/* var: reset() and damage() may run before this piece has (typeof on a const not yet set throws) */
var BASEAIR = (() => {
  const DELAY = 60 /* s from the call to the fighters in the air */,
    AGAIN = 600; /* s before the base calls again */
  let t = 0,
    due = -1,
    last = -1e9;
  const jp = () => FS.nav.find((s) => s.navy === 'jp'),
    us = () => FS.nav.find((s) => s.navy === 'us'),
    field = () => FS.list.find((s) => s.id === 'air3');
  /* Kakuta's fighters still on the field (its parked Ki-84s, targets of their own) */
  const fightersLeft = (A) => T.some((q) => q.type === 'plane' && !q.dead && q.side !== 'us' && Math.hypot(q.c.x - A.O.x, q.c.z - A.O.z) < A.R + 500);
  return {
    /* a target hit: is it Port Ugaki's? */
    hit(q) {
      const B = jp(),
        A = field();
      if (!B || !A || !q || !q.c || q.side === 'us' || due >= 0 || t - last < AGAIN) return;
      if (Math.hypot(q.c.x - B.O.x, q.c.z - B.O.z) > B.R + 300) return;
      last = t;
      if (!fightersLeft(A)) return note('INTERCEPT: ' + B.title.toUpperCase() + ' CALLS ' + A.title.toUpperCase() + ' - NO ANSWER');
      due = t + DELAY;
      note('INTERCEPT: ' + B.title.toUpperCase() + ' IS CALLING ' + A.title.toUpperCase() + ' FOR FIGHTERS');
      if (typeof RADIO !== 'undefined')
        RADIO.add('INTERCEPT', B.title.toUpperCase() + ' UNDER ATTACK, CALLING ' + A.title.toUpperCase() + ' FOR FIGHTERS. EXPECT FRANKS IN ABOUT A MINUTE.');
    },
    /* enemy aircraft shooting at p: within 3 km of PT Base Halsey, it calls for P-51s */
    usFire(p) {
      const B = us();
      if (!B || Math.hypot(p.x - B.O.x, p.z - B.O.z) > 3000) return;
      if (typeof CAP !== 'undefined' && CAP.call) CAP.call(B.title.toUpperCase());
    },
    tick(dt) {
      t += dt;
      if (due >= 0 && t >= due) {
        due = -1;
        const A = field();
        if (!A || !fightersLeft(A) || !SIMS.cur.scramble) return;
        const [x, z] = A.w(0, -750);
        SIMS.cur.scramble(new THREE.Vector3(x, A.H + 150, z));
      }
    },
    reset() {
      due = -1;
      last = -1e9;
    },
  };
})();
HOOKS.tick.push((dt) => BASEAIR.tick(dt));
