/* SIMS: every simulator plugs into the world through ONE role object, and the shared frame loop (the frame loop piece) knows nothing
   else about it. A new simulator is a folder of its own pieces (src/<id>/, its manifest) that ends with SIMS.add({ id, name, ... }); it
   fills in only the hooks it needs, every other one has a do-nothing default here. Several may be registered at once (Kamome Strait
   will register them all); SIMS.use(id) picks the one being played, SIMS.cur is it. Shared code never names a simulator: it asks
   SIMS.cur, or calls HOOKS.

   The role contract, in the order the frame loop calls it each frame:
     look()             true when the mouse is looking for a reason of the sim's own (the PCE's gun sight); orbit-dragging is shared
     canStep()          may the physics run (on top of started, not paused, not in a replay): e.g. not crashed, not bailed out
     step(h)            one physics sub-step of h seconds (at most 1/120 s); the loop splits the frame and calls it n times
     afterStep(dt)      once after the physics, before the attitude axes are refreshed (the P-51's bail-out)
     pose(dt)           the vehicle in the scene and its own systems that run every frame (stations, guns, practice targets)
     live(dt)           its part of the world while the game runs (weapons, enemies, missions), before the shared world updates
     liveLate(dt)       the same, after them (the PCE's shore guns)
     parts(dt)          its moving parts after the world has moved (control surfaces, propeller, cockpit levers)
     eye(P, D)          the first-person eye: set P (position) and D (line of sight) from pos, q, fwd, up, viewYaw, viewPitch;
                        returns a field-of-view hint for view()
     eyeUp()            the camera's up vector in first person
     chase(dt, cp, cu, T) the chase camera: ease cp (position) and cu (up) toward the sim's chase spot, set T (where it looks)
     orbitLift          metres above pos that the orbit camera looks at
     view(dt, fov)      after the vehicle's cameras: the field of view and sight overlays
     replay(dt)         while a replay is on (RPL.on): play it and set its camera
     overCam(dt)        a camera of its own that takes over (the P-51's parachute descent); busy() true while it does
     below()            may the eye go below the ground or the water (a ship's engine room)
     near()             the camera's near plane in first person
     shake()            camera shake in metres this frame
     hudEarly(dt), hud(dt), hudLate(dt)   its screen: before the shared clouds/world/weather updates, after them, after the minimap
     preRender()        last changes before the frame is drawn (the PCE's sealed engine room)
   and, outside the frame loop:
     resetBegin()       first thing in a reset: its own weapons and systems back to the start
     spawn()            put the vehicle at its start (position, attitude) when the game is reset
     ready()            make it ready after a reset (gear, which model shows, where the chase camera starts)
     resetEnd()         last thing in a reset: its missions and trainers
     aimY(), hit(a, b)  what the world's guns lay on (its height) and whether a round from a to b strikes it (b moved to the strike)
     afloat, struck(p)  a ship: torpedoes run at her, and struck(p) says whether a point at the sea is inside her hull;
                        torpedoed() is told when one hits her
     bind               its controls: rows [id, doc word, keyboard codes, controller button] (the controls piece builds BI, PB, KEYID)
     act, uiAct         what each binding does: flight/ship actions, and the menu and view actions; keyFirst(e), keyStation(e) its
                        own keys before the bindings (true: taken)
     facts: label (on photos), fileTag (photo file names), word ('Aircraft', 'Ship'), orbitDist (orbit camera, m), docsTab (the
     pause menu's first help page), canBail (the crew can bail out), showSelf(on) (photo mode shows or hides the vehicle),
     padMenu (controller button 8 opens the missions), r3() (what releasing the right stick does), touchUI() (its touch buttons' labels), bail() (the crew bails out: the controller's two bumpers, the pause menu)
     mouseDown(e), mouseUp(), mouseMove(e), wheel(e): its own use of the mouse (true: handled); dragLook(e) a drag its own camera takes;
     padStep(gp, edge, held, dt): its own controller buttons and sticks each frame, after the shared ones (in play, nothing open)
     touchBtn(id, down): its own meaning for a shared touch button (true: handled); thrTouch(v | null): the throttle slider moved
       (0..1) or let go, instead of setting the throttle; touchDown(e), touchMove(e), touchUp(e): a finger on the 3D view it takes
     noted(t)           a popup message (note) was shown: the sim may keep it (the PCE logs it on the radio paper)
     lookScale() how fast the mouse turns the head in first person; orbitMin the orbit camera's nearest distance
     voices(SND, { osc, filt, gain, noise, m }): build its own sounds into the shared sound when audio starts;
     sound(SND, { t, set, live, cockpit }): set them each frame
     kbDoc, padDoc, helpBody(box): its doc rows for the help, and how it fills its controls box
     missions, missionPick(it, first): its missions [id, title, what it is, ...] and what picking one does (first: the game just started)
     hcKeys             its Hardcore options (FM.use(key)); the switch takes them all; hcChanged() after the player changes them
     uiItems            its on-screen boxes for the display options [{ id, label, sel, g, sc }]; uiSet(id, on), uiInit() for a box with
                        behaviour of its own (the P-51's flight path guide)
   A simulator's pieces may each add their part: SIMS.add({ id, ... }) with an id already registered adds to that role. */
const SIMS = {
  list: [],
  cur: null,
  pick: null /* a page carrying several simulators names the one to play (Kamome Strait); else the first registered */,
  DEF: {
    id: '',
    name: '',
    look: () => false,
    canStep: () => true,
    step: () => {},
    afterStep: () => {},
    pose: () => {},
    live: () => {},
    liveLate: () => {},
    parts: () => {},
    eye: (P, D) => {
      P.copy(pos);
      D.copy(fwd);
      return 65;
    },
    eyeUp: () => up,
    chase: (dt, cp, cu, T) => {
      cp.lerp(SC.chase.set(0, 4, 14).applyQuaternion(q).add(pos), 1 - Math.exp(-5 * dt));
      cu.set(0, 1, 0);
      T.copy(pos);
    },
    orbitLift: 0,
    view: () => {},
    replay: () => {},
    overCam: () => {},
    busy: () => false,
    below: () => false,
    near: () => 0.12,
    shake: () => 0,
    hudEarly: () => {},
    hud: () => {},
    hudLate: () => {},
    preRender: () => {},
    resetBegin: () => {},
    spawn: () => {},
    ready: () => {},
    resetEnd: () => {},
    aimY: () => pos.y,
    hit: () => false,
    afloat: false,
    struck: () => false,
    coastOn: () => typeof ENEMY !== 'undefined' && ENEMY.has('shore') /* the coast guns fire (Settings > Enemy: Shore) */,
    subsOn: () => typeof ENEMY !== 'undefined' && ENEMY.has('subs') /* the enemy submarine, I-58, on patrol (SUBS): Settings > Enemy: Subs */,
    shipsOn: () => typeof ENEMY !== 'undefined' && ENEMY.has('ships') /* the enemy warships fight: the Ukuru escorts' guns, the T-14s' torpedo runs (Settings > Enemy: Ships) */,
    navAble: false /* an AI drives it, and it follows the player's route (WAYPOINT NAVIGATION, THE CHART) */,
    navContact: () => false /* an enemy held on its own sensors (the PCE's sonar): the route is suspended */,
    shelled: () => {} /* a shell has struck the player's vehicle, (calibre in mm): a coast gun's (76) or a warship's */,
    holdFire: () => false /* the player's own vehicle's AI gunners are ordered to hold their fire (the PCE's OOD) */,
    gunPri: () => '' /* the kind of target its AI gunners take first ('' their own choice; 'air', 'escort', 't14', 'cargo', 'coast', 'aa') */,
    oodCalls: () => false /* the player decides the vehicle's own calls for air support (the PCE with the player as OOD) */,
    screen: () => 0 /* how much smoke (0..1) lies between a gun at a and the player's vehicle at b, (a, b): the PCE's smoke screen */,
    torpedoed: () => {},
    label: '',
    fileTag: '',
    word: 'Vehicle',
    orbitDist: 30,
    docsTab: 'ctl',
    canBail: false,
    showSelf: () => {},
    padMenu: false,
    r3: () => {},
    touchUI: () => {},
    padStep: () => {},
    touchBtn: () => false,
    thrTouch: null,
    touchDown: () => false,
    touchMove: () => {},
    touchUp: () => {},
    bail: () => {},
    hcKeys: [],
    kbDoc: [],
    padDoc: [],
    helpBody: () => {},
    missions: [],
    missionPick: () => reset(),
    hcChanged: () => {},
    voices: () => {},
    sound: () => {},
    keyFirst: () => false,
    keyStation: () => false,
    mouseDown: () => false,
    mouseUp: () => {},
    mouseMove: () => false,
    wheel: () => false,
    noted: () => {},
    dragLook: () => false,
    lookScale: () => 1,
    orbitMin: 4,
    uiItems: [],
    uiSet: () => {},
    uiInit: () => {},
  },
  add(r) {
    const o = SIMS.get(r.id);
    if (o) return Object.assign(o, r);
    const s = Object.assign({}, SIMS.DEF, { bind: [], act: {}, uiAct: {} }, r);
    SIMS.list.push(s);
    if (!SIMS.cur || r.id === SIMS.pick) SIMS.cur = s;
    return s;
  },
  get: (id) => SIMS.list.find((x) => x.id === id),
  /* is this simulator the one being played? (a simulator's own load steps that only make sense for the one played) */
  on: (id) => !!SIMS.cur && SIMS.cur.id === id,
  use(id) {
    const s = SIMS.get(id);
    if (s) {
      SIMS.cur = s;
      if (typeof bindsUse === 'function') bindsUse(s);
    }
    return s;
  },
};
