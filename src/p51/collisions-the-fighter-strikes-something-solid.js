/* COLLISIONS, the P-51D: her solid body for the collision layer (PHYS) and what striking something does. She is swept along her path
   each frame, so she cannot pass through a mast or a tower between two frames. Anything solid she meets wrecks her (a building, a
   tower, a ship, a parked aircraft, a vehicle, a bandit, a tree of the scenery): the crash, with what she struck named; what she
   struck takes the blow (PHYS: a target loses hit points by the energy, so at speed it is wrecked too). The ground and the sea are
   still the landing gear's business (touching the ground). */
SIMS.add({
  id: 'p51',
  body: () =>
    typeof plane !== 'undefined' && typeof model !== 'undefined' && model.visible && !crashed && !(typeof BL !== 'undefined' && BL.on)
      ? {
          o: plane,
          sweep: true,
          m: 4600 /* about 10,100 lb loaded */,
          name: 'P-51',
          D: 2,
          hit: (o, info) => {
            if (crashed) return;
            if (info.p && info.p.y > -1e5) pos.copy(info.p) /* where she struck it */;
            crash('COLLISION - ' + (o.name || 'OBSTACLE'));
          },
        }
      : null,
});
