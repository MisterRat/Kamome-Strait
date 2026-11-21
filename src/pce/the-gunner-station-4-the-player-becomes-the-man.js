/* =====================================================================================================================
   THE GUNNER - station 4. The player becomes the man who lays and fires the gun: the 3"/50 forward (the pointer, seated on the
   left of the mount, at his telescope), the 20 mm on the starboard side amidships (the gunner, standing in the shoulder rests,
   at the cartwheel ring sight) and the twin 40 mm aft (the pointer, seated on the left, at his ring sight). Press 4 again for
   the next gun. Meanwhile the helmsman holds her course and the engine order stands.
   Laying: move the mouse (the pointer is captured while on the gun; click once if the browser refused, Esc frees it),
   (a controller: the left stick); W / S and A / D still work the engines and the rudder; the 3"/50 and the 40 mm follow at their mounts'
   rates, the free-swinging 20 mm follows the gunner's body. Fire: Space, either mouse button or the trigger.
   X looks up from the sight (drag to look round) and back. 3"/50: the sight-setter sets the range on the sight; in the standard
   game he ranges on the point of aim (wherever the cross-wires meet the sea), in Hardcore you set it (Page Up / Down or the wheel).
   Ring sights: the rings are the lead for crossing targets at 100, 200 and 300 knots; there is no range setting, so watch the
   tracer (20 mm and 40 mm) and walk it on.
   Firing cutouts: a gun will not fire while its line of fire passes through the ship (PCEM.solid).
   Ballistics (GSPEC): muzzle velocity, rate of fire, magazines and the mounts' limits and rates are the real guns' figures
   (NavWeaps / OP 945); drag is a = -k (air density) |v| v with k fitted so each gun's maximum range comes out right.
   ===================================================================================================================== */
const GSPEC = {
  '3in': {
    name: '3"/50 Mk 22',
    mv: 823 /* 2,700 ft/s */,
    k: 1.53e-4 /* fitted: 14,590 yd (13,341 m) at 43 deg */,
    dt: 60 / 17.5 /* 15 - 20 rounds a minute, hand loaded: the average (game mode: half the time) */,
    hand: true,
    trR: 20 * D2R,
    elR: 15 * D2R /* hand wheels: manual training and elevating only (rates estimated) */,
    elMin: -15 * D2R,
    elMax: 85 * D2R,
    trLim: 155 * D2R /* train stops either side of ahead */,
    sight: 'scope',
    fov: 10 /* the pointer's telescope (field estimated) */,
    life: 60,
    spread: 0.0007,
    kr: [0.48, 2.39] /* the kill zone round the sleeve (m), Hardcore / game: a VT burst only kills if the shell passes this close (see ptHit) */,
    h2k: 1,
    tracer: 0,
    vt: 22 /* AA common with the VT (proximity) fuze: bursts within this many metres of an aircraft */,
    hit: 14,
    blast: [10, 30],
    splash: 1,
    flash: 3.2,
    rec: 0.28 /* recoil, m */,
  },
  20: {
    name: '20 mm Oerlikon Mk 4',
    mv: 835 /* 2,725 ft/s, an average gun (OP 945) */,
    k: 5.96e-4 /* fitted: 4,734 yd (4,329 m) at 35.3 deg */,
    dt: 60 / 450 /* 450 rounds a minute cyclic */,
    mag: 60 /* the drum */,
    reload: 7.5 /* a drum change by a trained loader, 5 - 10 s: the average (game mode: half) */,
    trR: 120 * D2R,
    elR: 100 * D2R /* free swinging: the gunner swings it with his body */,
    free: true,
    elMin: -5 * D2R,
    elMax: 87 * D2R /* Mk 4 mount */,
    trLim: 170 * D2R,
    sight: 'ring',
    fov: 65,
    life: 14,
    spread: 0.0028,
    kr: [0.085, 0.42] /* the kill zone round the sleeve (m), Hardcore / game */,
    h2k: 2 /* a quarter-pound shell: it takes two hits */,
    tracer: [1, 0.36, 0.2],
    trOut: 2000 /* tracer burn-out, m (estimated) */,
    hit: 1.5,
    blast: null,
    splash: 0.2,
    flash: 0.75,
    rec: 0.02,
  },
  40: {
    name: 'twin 40 mm Bofors Mk 1',
    mv: 881 /* 2,890 ft/s */,
    k: 2.22e-4 /* fitted: 11,019 yd (10,076 m) at 42 deg */,
    dt: 0.5 /* 120 rounds a minute a barrel; the two barrels fire alternately */,
    auto: 8 /* each autoloader holds two four-round clips */,
    feed: 2.67 /* a loader puts in a clip every 2.67 s: the 80 - 100 rounds a minute a barrel a good crew kept up (game mode: half the time; the gun's 120 a minute still caps it) */,
    trR: 26 * D2R,
    elR: 24 * D2R /* power drive */,
    elMin: -15 * D2R,
    elMax: 90 * D2R,
    trLim: 160 * D2R,
    sight: 'ring',
    fov: 65,
    life: 22,
    spread: 0.0012,
    kr: [0.185, 0.91] /* the kill zone round the sleeve (m), Hardcore / game */,
    h2k: 1,
    tracer: [1, 0.55, 0.22],
    trOut: 4570 /* the tracer burns out at 5,000 yd */,
    sd: 4100 /* HE-SD: self-destructs at 4,000 - 5,000 yd */,
    hit: 4,
    blast: [4, 8],
    splash: 0.45,
    flash: 1.5,
    rec: 0.07,
  },
};
