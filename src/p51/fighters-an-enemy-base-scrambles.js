/* fighters an enemy base has scrambled (BASEAIR): two Ki-84s from their airfield, bandits that come for the player (as many as come:
   the one-bandit limit is for the bandits the player calls up himself) */
SIMS.add({
  id: 'p51',
  scramble: (p) => {
    if (!started || crashed) return;
    for (let k = 0; k < 2; k++) banditAt(p.clone().add(new THREE.Vector3(k * 60, k * 30, k * 40))).scr = true; /* defending its base: it fights on until damaged */
    note('BANDITS - FRANKS UP FROM AIRBASE KAKUTA');
    SND.beep(880, 0.15);
  },
});
