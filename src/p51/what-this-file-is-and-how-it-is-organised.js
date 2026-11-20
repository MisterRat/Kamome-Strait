/* =====================================================================================================================
   P-51D MUSTANG FLIGHT SIMULATOR - one file, no external requests (three.js r128 is inlined above this script).

   HOW THIS SCRIPT IS ORGANISED
   The script runs once, top to bottom. A section may only use things defined ABOVE it (const/let/class are not usable
   before their line runs), so keep new code below whatever it depends on. The order, and what each part provides:

     1. renderer, scene, camera, lights          R, scene, cam, V (= THREE.Vector3), helpers
     2. terrain + shaders                        H(x,z) / HR(x,z) heights, tmat, terrain tiles
     3. mission area, farmland, hedgerows        ROADC / RP (road), DEPOT, BASE, nearRoad(), inCompound(), FARM
     4. GX shared geometry kit                   GX.part / GX.Acc / GX.xf: build a model from parts, bake to ONE geometry
     5. vegetation (trees, near and far levels)  TREEM, NT, growTree(), addSpecies()
     6. runway, airfield dressing + detail       RW, parked aircraft, markings
     7. sky, clouds, cloud shadows               CSH, csApply(), csTree(), driftClouds()
     8. "scenery freeze" traverse                everything above never moves: matrices are frozen here
     9. P-51 model, cockpit interior             plane, model, ck, drawPanel() (live instrument texture)
    10. state, armament, targets (mkT, VM)       T (targets), VM (vehicle/building models, one shared geometry per type)
    11. effects, weapons, enemies, service        FX, B, EN, updWeapons(), updEnemies()
    12. buildings, compounds, convoy, trainers   BLD, CV, trn (mission state), updConvoy()
    13. guidance (Dubins path), minimap          planGuide(), drawGuide(), drawCcip()
    14. quality, phone/touch, pause menu, UI     QL, TC, UI, pmShow()
    15. gamepad, audio, physics, HUD, loop       pollPad(), step physics, frame(now) = the per-frame driver

   SHARED STATE (module-level, mutated from several sections - check before renaming):
     flight:   pos, vel, q, fwd, right, up, thr, flapLvl, gearOn, onGround, crashed, started, paused
     camera:   camMode (0 chase / 1 cockpit), viewYaw, viewPitch, orbitOn
     mission:  trn (mode/steps/score), CV (convoy), T (ground targets), EN (enemies)
     display:  UI (which boxes are shown), QL (graphics quality)
   Persistent settings use store names ui, pos, art, tc, saved under GAME.key (always through the store helper).

   CONVENTIONS
     - Models are lists of GX.part(...) baked with GX.Acc; never create one mesh per small piece.
     - Anything that changes per frame lives in frame(now) or an update function it calls; static scenery is frozen at step 8.
     - Controls: change a key or button ONLY in the BIND table; the help box and the Controls tab are generated from it.
     - Missions: each one is a method of TRAINERS (updTrainer builds the shared context); add a mission = add a method + MENU entry.
     - Errors: use store.get / store.set for settings and logWarn for optional features; no empty catch blocks.
     - Physics runs in sub-steps of at most PH_DT; ground geometry comes from GEAR; per-frame scratch objects live in SC.
     - Test with P-51_Mustang_FS_smoke_test.py (boots the game offline, checks for errors, draw-call budget, every mission mode, cockpit panel).
   ===================================================================================================================== */

