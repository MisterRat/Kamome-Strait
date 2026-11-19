# Kamome Strait: Project Plan

Written 2026-11-17 for the new Kamome Strait session and the PCE-842 session; section 2 and the freeze record in section 6 updated the same evening by the PCE-842 session; section 8 (future expansion) added by the Kamome session. Read this before changing shared code.

**Ownership (2026-11-17):** the Kamome Strait session owns this project and this plan and is team lead. The P-51 and PCE-842 sessions report to it: they do not edit this plan except to add their own lines in section 6, and anything touching shared code, the freeze, or the merge goes through Kamome.

## 1. Concept

**Kamome Strait** is the combined game: the P-51D Mustang flight sim and the PCE-842 Patrol Craft Escort ship game, in one WWII South Pacific world. It is named after Kamome Field, the island in that world.

- You choose how to play: fly the P-51 or command the PCE-842.
- Both share one world: the same islands, ocean, sky, weather, airfields, ports and ships.
- The ships in each game are the real ships of the other: the P-51 game's allied PCEs and PT boats are the vessels you can command in the PCE game, and the PCE game gets AI P-51s and enemy bandits.
- Later: missions that use both (fly cover for a convoy, then take the ship) and two-player play, one flying and one commanding. Two-player needs multiplayer, which is a separate effort (see the FATED multiplayer plan).

The finished product ships as a single offline HTML file with three.js inlined, like both current games.

## 2. Where things stand (updated 2026-11-17 evening by the PCE-842 session, at the freeze)

**Both games are frozen** and pushed. The baseline is what is on GitHub now; the copies in `C:\Code\Arcade` are byte-identical to it.

| | P-51 Mustang FS | PCE-842 |
|---|---|---|
| Folder | `C:\Code\Arcade` (`P-51_Mustang_FS.html`) | `C:\Code\Arcade\PCE-842` (`PCE-842.html`) |
| Repo | `MisterRat/P51-Mustang-FS` (`index.html`) | `MisterRat/PCE-842_Patrol_Craft` (`PCE-842.html`) |
| Frozen version | **5.34**, commit `f243b93` | **0.51**, commit `ecd4197` (stays below 1 until the user says) |
| State | Released | Alpha; kept off the MrRat Gaming landing page until ready |
| Size | 1,753,930 bytes, 27,149 lines | 1,934,463 bytes, 31,475 lines |
| Change log | 5.30-5.34: in `PCE-842/PLAN_PCE-842.md` (entries 0.45-0.51) | `PCE-842/PLAN_PCE-842.md`, every version 0.01-0.51 |

- **P-51 is no longer 5.29.** The PCE-842 session made 5.30-5.34 on top of 5.29 (commit 040a377) to share code with PCE-842: the Ki-84 rebuilt from scale drawings (the bandits and the parked fighters), the parked Ki-84s standing on the apron, the coast batteries at the Japanese ports, and one shared 25 mm ground-fire model. They are logged in the PCE plan, not in a P-51 plan.
- PCE-842 began as a straight copy of the P-51 code, so most of its file is still the P-51's (world, sky and weather, settings, and flight code that PCE-842 leaves switched off).
- Both contain `GX` (geometry helpers: part, Acc, xf, bx, cyl, sph), `PCEM` (the PCE-842 model) and `PTB` (the PT boat).

### Already shared: identical in both files today

Each of these has a header and an end comment, so it lifts out as a module unchanged; a diff of the block between the two files comes back empty:

| Block | Globals | Notes |
|---|---|---|
| `===== THE KI-84 HAYATE` ... `end of THE KI-84 HAYATE` | `KI84` (parts, blades, parked, mesh, CONTACT, HUB) | Built from the drawings in `PCE-842/References/Ki-84`. The bandits (`buildEnemy`) and the parked fighters (`AFLD.models.ki84`) in both games, the raiders in PCE-842. Needs `GX`. |
| `===== THE COAST BATTERIES` ... `end of THE COAST BATTERIES` | `COAST`, `coastFly`, `coastSolve`, `coastUpdate` | Two 12 cm/45 3rd Year Type guns per Japanese port, placed from `harbour()` by `COAST.port(F, r, taken, use)`. P-51: targets only (it never calls `coastUpdate`; the gun cannot elevate past 33 deg). PCE-842: they fire at the ship. Uses `OCEAN` only if it exists. |
| `aaSees`, the hooks, `updAA` (guns and shells) | `AA`, `updAA`, `aaSees` | The Type 96 25 mm ground fire, one realistic spread model for any target. The per-game part is only the target: `AA.aimY()` and `AA.hit(a, b)`. Both files define the P-51 default (the aircraft, `playerHit`) just before `updAA`; PCE-842 overrides it in its AIR RAIDS block (her hull, a hit counter). |

### Known divergences

- **Ocean.** PCE-842 has `OCEAN` (block "THE OCEAN (PCE-842)": Gerstner waves, foam, wake, depth-aware shallows, Fresnel sun specular, crests-only over the shallows). P-51 paints its water on the terrain at -8 m. In PCE-842 the terrain shader `SHORE_PAINT` discards water deeper than about 6 m (`if(shH<-14.0)discard;`) and the open-sea plane is at -11.8 m, so `OCEAN` shows; P-51 paints all its water. These three go together. Winner: PCE's ocean.
- **Shallow-water colour** was toned down in both earlier at the user's request; the two `SHORE_PAINT` strings should match apart from the discard line.
- **Main loop.** PCE-842's `frame()` leaves the P-51's weapons, enemies, missions and guidance off and runs the ship, stations, guns, `RAID`, `updAA` (when Shore is on) and `coastUpdate`. P-51's runs the flight systems and `updAA`. The combined game needs one loop that switches on the player's role.
- **PCE-only blocks:** THE OCEAN, THE PLAYER'S SHIP, THE GUNNER (`GSPEC`, `ptHit`, practice targets `PT`), THE STATIONS AT WORK (radar, sonar, radio, `COMMS`, lessons), the torpedoman (`DC`, Hedgehog), THE AIR RAIDS (`RAID`, `raidUpdate`, `raidHit`, `shipStruck`; reads the ship's `pos` and `vel` directly), and Settings > Enable enemy (`ENEMY`: none, planes, ships, shore, subs, all; key `pce842enemy`).
- **Settings keys:** PCE-842 stores under `pce842...` keys, P-51 under its own.

### Tests and calibration

- P-51: `P-51_Mustang_FS_smoke_test.py`, `P-51_Mustang_FS_perf_test.py`.
- PCE-842: `PCE-842/PCE-842_smoke_test.py`, `PCE-842/PCE-842_gun_calibration.py` (sleeve kill zones), `PCE-842/PCE-842_raid_calibration.py` (Ki-84 kill zones, `RAIDKR`).
- The user's rule: every aircraft type is calibrated with the simulated gunner (US Navy rounds per kill in Hardcore, 1/24 in game mode). If the split touches `GSPEC`, `ptHit`, `raidHit` or the raiders' flight, re-run the calibration scripts and expect the same kill zones.

## 3. The approach: shared modules and a build step

Today every change is made inside one huge HTML file per game, so each fix has to be made twice and the copies drift. Instead:

- Code both games use lives **once**, in its own source files (for example `ocean`, `sky`, `weather`, `world`, `ships`, `settings`, `guidance`).
- Each game keeps its own source files for what only it needs (the P-51 flight model, the PCE-842 stations, damage, gunnery).
- A build script (`node build.js`) joins the pieces, inlines three.js, and writes the finished single HTML files: `P-51_Mustang_FS.html`, `PCE-842.html`, and later `Kamome_Strait.html`.
- The finished files still run offline and host on GitHub Pages exactly as today. The built files are committed to the repo so Pages keeps working.
- Rule once the build exists: **never hand-edit a built file.** The next build overwrites it.

## 4. Phases

1. **Compare (read-only).** *Done 2026-11-17: `Kamome-Strait_Phase1_Report.md` (awaiting the user's review).* Confirm both files use the same three.js version, then diff `P-51_Mustang_FS.html` against `PCE-842.html` section by section. Sort the code into: identical; shared but changed (which side wins, for example the ocean: the PCE version); unique to one game. Output a list with a proposed winner for every diverged section; change nothing.
2. **Agree the rules.** *Decided 2026-11-17 (Phase 1 report, section 4): A. the PCE ocean goes into the P-51 (its own step after the split, screenshots and the performance test first); B. the PCE's toned-down shallow-water colour for both; C. Kamome Strait starts with its own new saved settings (`kamome…`), the stand-alone games keep theirs; D. the P-51's allied fleet (PT-105, PCE-843, PCE-842, PT-106) everywhere, minus the ship the player commands; the US freighter and tanker models are kept in the shared code, to be improved and used later. Every other difference: the newer side, as listed in the report.*
   Original wording: One shared source folder, one folder per game, and a winner for every diverged section. The user approves the winners list from phase 1.
3. **Split and build.** *Step 1 done 2026-11-17: both games cut into pieces and rebuilt byte-identical (`node build.js --check` reports `== baseline` for both). See "Source layout" below. Step 2 done 2026-11-17 (accepted 2026-11-19: every build since has been made on it and played): see the step 2 log below. Next: step 3, the role hooks.*
   Original wording: Cut the code into modules and write the build script. Rebuild both games and prove they play the same as before: screenshots, page errors expected `[]`, the existing test scripts. Nothing replaces a released file until this passes.
4. **Combine.** Add a start menu (fly the P-51 or command the PCE-842), then the crossover features from section 1.

**Development freeze (decided 2026-11-17):** no new development in the P-51 or PCE-842 sessions until the split works. Both games are frozen as they are now; the split starts from those versions. Only fixes for a game-breaking bug are allowed, and each one is logged in section 6 so Kamome can carry it over.

## 5. Folder and repo (proposed)

### Source layout (in place since phase 3, step 1)

- `src/shared/`: pieces identical in every game (177 files: three.js, the CSS, the world, sky, models, AA, coast batteries ...).
- `src/p51/`, `src/pce/`: pieces only that game has, or that still differ (P-51 41 files, PCE 146; 40 names exist in both and are the step 2 and 3 work list).
- `src/<game>.manifest`: the pieces of that game in file order, one path per line (`#` starts a comment). Reordering or swapping a piece is a manifest edit.
- `build.js`: `node build.js` writes `build/P-51_Mustang_FS.html` and `build/PCE-842.html`; `node build.js --check` also compares them with `baseline/` byte for byte. No dependencies.
- `baseline/`: the frozen P-51 5.34 and PCE-842 0.51, untouched. Once a game deliberately changes, `--check` reports the difference: that is expected, and a new baseline is taken only when the user accepts a release.
- `Blueprints/`: diagrams generated from our models (plan and profile views, measurement reports), checked into the repo. Put each new model's blueprints here, named after the model.
- Blueprint tool: `python3 tools/blueprint.py [ids]` draws every real-world model (catalogue `tools/blueprints.json`: how to build it, the reference figures and their sources) into `Blueprints/` with a measurement report each; `python3 tools/blueprint_index.py` rebuilds `Blueprints/README.md`. A new model gets a catalogue entry when it is added; redraw after a model changes.
- `References/`: outside documents for research accuracy (plans, manuals, photographs; one folder per subject where there are several files, such as `P-51/`, `Ki-84/`, `Ukuru-class/`). The one reference library for the whole world: everything moved here from `PCE-842/` and `P-51/` on 2026-11-18. Kept in the local folder only (git-ignored: third-party material, about 670 MB). Docs and code comments that say "References" mean this folder.
- `tools/split.py`: the one-off splitter used for step 1, kept for the record. Do not re-run it on edited sources.
- Pieces are named after their first comment line. Edit pieces, never `build/`.


- Folder: `C:\Code\Arcade\Kamome-Strait`
- Repo: `MisterRat/Kamome-Strait` (created 2026-11-17; private until Kamome Strait is out of alpha (the user's call); `build/` is git-ignored until Kamome Strait has a playable build of its own)
- Layout: `src/shared/`, `src/p51/`, `src/pce/`, `build.js`, `PLAN_Kamome-Strait.md`, `README.md`, tests, and the built HTML files.
- The existing P-51 and PCE-842 folders and repos stay as they are until the merge is ready. The rebuilt `P-51_Mustang_FS.html` and `PCE-842.html` live only in Kamome-Strait until the user signs off; then they are copied over to their own folders and repos.
- Versions: Kamome Strait starts at 0.01 and stays below 1 until the user says. The rebuilt P-51 and PCE-842 keep 5.34 and 0.51 until something actually changes in them.
- Tests: copy the P-51 and PCE-842 smoke, perf and calibration scripts into `tests/` and point them at the built files.
- The license stays PolyForm Noncommercial 1.0.0, like the other games.

### Phase 3 step 2 log (2026-11-17)

Built files in `build/` only; the released games in `C:\Code\Arcade` are untouched. `--check` now differs from `baseline/` on purpose.

| Version | Change | Check |
|---|---|---|
| PCE-842 0.52 | One shared copy of the PCE-842 and PT-105 models (the P-51's: numbered hulls); PTB placed as in the P-51 | Bow screenshot unchanged; page errors `[]` |
| P-51 5.35 | Shared hull cut-out (`HULLM`) in the cloud-shadow shaders; does nothing without a manned ship | Screenshots unchanged; page errors `[]` |
| P-51 5.36, PCE-842 0.53 | `coastSea()`: the coast batteries use the ocean if the world has one, else the painted sea (5.34 threw `OCEAN is not defined` if `coastUpdate` ran) | 600 `coastUpdate` steps in both, no error |
| P-51 5.37, PCE-842 0.54 | One allied fleet (PT-105, PCE-843, PCE-842, PT-106) for the world; `HOOKS` registry (shared piece after the version piece); the PCE game claims the PCE-842 with `HOOKS.claimShip`; freighter and tanker models kept | Fleet positions as before; the player's PCE-842 on the same patrol line; screenshots |
| P-51 5.38, PCE-842 0.55 | The PCE ocean, toned-down shallows and open-sea plane (-11.8 m) shared; the P-51 drives the ocean clock and graphics tier | Screenshots at 30, 300, 1,500 and 5,000 m; ditching unchanged; draw calls about the same; software-rendered frame time about +30% with the sea filling the screen low down, about the same at 1,500 m |
| P-51 5.39, PCE-842 0.56 | Shared `RIDE` module: every hull rides the ocean's waves (heave, pitch, roll); the PCE-842's `shipPose` and every AI fleet ship use it. The PCE game's tow boat is now PT-108 (a PTRon 5 squadron mate of PT-105, in service to November 1945) | `RIDE.step` matches the old `shipPose` maths exactly (max difference 0 over 600 steps); AI ships ride; PT-108 screenshot |
| PCE-842 0.57 | The PT-108 tow boat and her sled ride the waves through `RIDE` | Screenshot; page errors `[]` |
| P-51 5.40, PCE-842 0.58 | `SEA`: the world's sea levels (painted water, still water, waterline, open-sea plane) in one shared piece; the Japanese escorts and merchant ships ride the waves (`RIDE`) | Ditching, coast batteries, fleet and escort riding checked |
| P-51 5.41, PCE-842 0.59 | `GAME` (id, name, settings prefix) per game; the shared `store` saves under `GAME.key` + name (same saved names as before, so players keep their settings); `tools/dedupe.py` moved 9 now-identical pieces into shared | Saved settings read back in both games |
| P-51 5.42, PCE-842 0.60 | Ocean hull list: `OCEAN.hull / place / unhull / clearTrail` for any number of ships (the 6 nearest drawn, the 2 nearest wakes); the player's PCE, the AI fleet, PT-108 and the sled all use it; `HULLM` stays one outline (only the camera's own ship needs it) | The player's wake and bow-wave uniforms identical to 0.59 over 600 steps; no shader errors; hulls join and leave |
| P-51 5.43, PCE-842 0.61 | The far ports' sea-lane finder renamed `LANES` (it shadowed the shared `SEA`); one References library under Kamome-Strait. |
| P-51 5.44, PCE-842 0.62 | Japanese ships float on their waterline: the Ukuru escort, the port freighter, tanker and patrol boat and the civil ships put the model's y = 0 at `SEA.WL` (keel below, wakes on the water); a ship restored after a restart goes back to her waterline. Enemy vehicles built to real size (`VM REAL`: Type 94 truck, Kurogane Type 95, Type 1 Ho-Ha, Type 95 Ha-Go; body without aerials scaled per axis); target boxes and the parked compound vehicles match. Blueprints redrawn; vehicle heights measured on the body. |
| P-51 5.45, PCE-842 0.63 | One model per role: Japanese patrol = Ukuru-class (the port's generic 32 m boat replaced by a second Ukuru), Japanese aircraft = Ki-84, American patrol = PT boat and PCE-842, American aircraft = P-51D (the gunnery tow plane is now a P-51D). Shared `GX.fit` (geometry kit) builds a model to its real length, width, height and draught; every vehicle and cargo ship uses it, sized from `References/vehicle research spec sheet.pdf`: Type 94 truck family, Kurogane, Type 98 Ko-Hi (replaces the Ho-Ha), Ha-Go; CCKW 353 (and the fuel truck on its chassis), Willys MB, Clarktor 6, parked P-51D; Type 2A freighter 137 m, Type 2TL tanker 153.5 m, Liberty and T2 kept for later. Ukuru deepened to 3.06 m. Home port pier lengthened to 270 m so the big ships lie alongside clear of the beach. Blueprints redrawn (the generic patrol boat's removed); vehicle photos in References linked from the catalogue. |
| P-51 5.46, PCE-842 0.64 | Models programme steps 1-2 and part of 6: `MODELS` registry and model tools (profile extrusion, hull loft, per-vertex camouflage with subdivision, stars, wheels); reference-built Japanese army vehicles (Type 94 cargo, supply and fuel, Kurogane, Ko-Hi and Ha-Go in three-tone, Kato/Komatsu tractor), US vehicles (CCKW cargo and F-2A fuel, Willys MB, Clarktor 6, M5 bomb trailer, C-10 cart), cargo ships (Type 2A and Type 2TL in grey-green with dark bands, Liberty in Measure 13, T2 in Measure 22); ground crews in 1945 uniforms (USAAF, IJAAF, IJNAS) with the Japanese army crews and a tractor at each Japanese airbase. Old generic builders removed. Blueprints redrawn and added (crew-ja, jp-tug). |
| P-51 5.47, PCE-842 0.65 | Step 3, US airfield buildings at real size (MODELS, the US airfield buildings piece): Butler combat hangar (3 at Fletcher Field, doors where they were; 2 at Kamome Field), Stran-Steel Quonset huts (ops huts by the towers, six barracks north of Fletcher's apron) and an Elephant hut store, steel-angle control tower (both fields; night lights moved to the new cab), Marston-mat apron at Kamome Field (shared canvas texture), M5 bomb trailer train and C-10 starter carts on Fletcher's line. Blueprint tool: `__partsSize` measures a building's skin alone. Budget vs 5.45: draw calls level or lower (airfield 263 -> 224 P-51), triangles +3-7%. |
| P-51 5.48, PCE-842 0.66 | Step 4, ports and anchorages rebuilt: coral mole (replaces the pier) with Decauville track, rail carts, A-frame derricks, godowns and a drum dump; Daihatsu barges and lighters; freighter and tanker anchored on the seabed (`anchorD`, raw seabed `HR`) and riding the swell; a Daihatsu shuttle between ship and mole; far harbours anchored the same way; Japanese navy dock hands. Blueprints for every new model. |
| P-51 5.49, PCE-842 0.67 | Connectivity review (user: no part may hover): `tools/connectivity.py` checks every model and every recorded scenery list (oriented-box contact, union-find, grounded parts). Trucks rebuilt on real chassis (frame rails on springs over axles, bonnet sides to the rails, fenders to the bonnet, bed on bolsters); windscreens stand in their cowls; steering columns, stair flights, derrick rods, ship fittings, gun mounts and the PCE's deck gear all joined. |
| P-51 5.50, PCE-842 0.68 | Checker: real-surface test for extruded (concave) parts, whose boxes hid gaps (vertex-to-face reach, edges piercing faces, enclosed parts). Fixed what it found: Type 94 / Ko-Hi / Kurogane headlamps on stalks, Type 94 windscreen in the raked cab front, Kurogane top meets the windscreen frame and the spare sits on the body, Ha-Go rivets on the superstructure, both tractors' steering columns from the floor, Clarktor seat on a pedestal, Willys bumper, jerrycan and spare on the body, PCE pilothouse corner panes. Both builds clean; the remaining recorded flags are verified false positives (fence wires, terrain-draped jetty decks, fragment lists that pass assembled). |
| P-51 5.51, PCE-842 0.69 | Step 5, Type T-14 motor torpedo boat (MODELS 'jp-t14', its own piece): 15.0 x 3.60 m, 0.72 m draught, lofted hard-chine hull (26 stations), pilothouse with raked windscreen, cockpit under a canvas hood, signal mast, two 45 cm torpedoes on side-drop cradles, Type 96 25 mm single aft, four depth charges on stern rails, ensign; dark grey or mottled green; 2,801 triangles without crew. In the world: two moored rafted on the mole's east face, two on an inshore patrol (18 kn racetrack) at the home port, two on an inner track at each far site's patrol; targets (30 hp), riding the waves, a scaled wake, and the sea kept out of the hull (OCEAN kind 't14': the PT outline at 0.66). Blueprint added. Budget: port draw calls 297 / 284 (P-51 / PCE). |
| P-51 5.52, PCE-842 0.70 | Step 6 continued (user: rebuild the generic block models from the references, joined parts, then round wheels). Parked P-51D (MODELS 'us-p51d') rebuilt from the player's factory tables: lofted fuselage, bubble canopy, laminar wing planform, tail, belly scoop, carb intake, exhausts, four-blade prop, oleo legs and doors, three-point attitude; also the tow plane. Japanese base buildings from docs/research_1945_bases.md: timber HQ on piers with veranda and hipped iron roof; earth-covered concrete bunker with portal; timber-framed corrugated hangar with sliding doors and lean-to; buried fuel cistern with drums under frond netting. Far harbours: the box sheds become godowns, the box derricks timber A-frame derricks, the canoes Pacific outrigger canoes (MODELS 'pac-canoe'); unused schooner, European farmhouse, cows, sheep and tractor deleted. Village: stilt huts with gable horns and pole ladders, the planter's bungalow with hipped roof and verandah, pigs, hens, mission chapel, copra heaps. Round wheels everywhere (GX.tyre: lathed tyre, rim discs, hub; GX.wheel uses it): trucks (twin rear tyres on the Type 94), jeeps, tractors, tanks' road wheels, sprockets and idlers, carts, the searchlight carriage, the P-51D and Ki-84 gear. Checker covers the buildings and village models; both builds clean but for the known false positives. Blueprints added or redrawn for all of them. Budget vs 5.51: airfield triangles about +10 %, draw calls level or lower. |
| P-51 5.53, PCE-842 0.71 | User: objects sit on the ground, not over or under it; vehicles on surfaces; collision detection and ships navigating around each other. Ground height H is now the drawn terrain mesh (HMESH, cached home grid; far chunks interpolate before they are built). GROUNDAT seats a footprint on its lowest point or tilts a vehicle. SURF = topmost surface (decals, plates, aprons) by cached downward raycast; vehicles, walkers, fences, posts and convoy trucks ride on it. Daihatsu well floor raised and an OCEAN 'rect' hull keeps the sea out of open craft; 't14' hull for the T-14. New COLL module: every ship, boat and ground mover is a body that looks ahead, picks the cheaper side of an obstacle, commits to it, checks the new lane, slows or holds, and never slides sideways into a ship alongside; patrol tracks are laid clear of anchored hulls; shuttles hold while a ship crosses. Runway edge lights are globes on stems. Tools: tools/grounding.py (every mesh vs ground), tests/kamome_collisions.py (30 min fast-forward incl. far traffic, minimum clearance per pair): no ship collisions in either build; the only overlap is the scripted mechanic under the repair plane's wing. |
| P-51 5.54, PCE-842 0.72 | User: tyres see-through at some angles. GX.tyre's lathe section was listed top to bottom, so the tyre was built inside out and only its far inner wall drew; section reversed (bottom to top) so it faces outward. Every wheeled model shares it. |
| P-51 5.55, PCE-842 0.73 | User: the T-14 must use its weapons; check the three objects. T-14 weapons (each boat: hull, wake, 25 mm turret and barrel, one torpedo mesh; PCE start view 346 -> 401 draw calls): the 25 mm single trains and elevates and fires as an AA.gun entry (Ground Fire option; at the aircraft in the P-51, at the ship in the PCE-842); torpedoes (PCE-842, Ground Fire on): within 3 km a boat leaves her patrol, runs in at 30 kn on an exact intercept course (crew aim error by difficulty), holds course and drops both fish 1 s apart at about 1,200 m only when the whole run is over 2 m deep, turns away, rejoins, re-arms after 5 min; fish run 2,000 m at 42 kn with a narrow bubble track, ground in the shallows, and a hit on the hull is counted (no battle damage yet). Off her track a boat keeps to deep water. Depth charges stay as scenery (no Allied submarines). Collisions: COLL.intrudes (a mover holds rather than take a pose inside another hull, turns included), a forward check in steer/avoid, and a stand-off rule (stopped 6 s beside a bigger ship, the smaller backs off astern); T-14 sidestep capped at 40 m. Ground: SURF caches each cell's surface offset over the ground, not a height (on slopes it was up to 27 cm wrong); GROUNDAT tilts on the wheel points and lifts the exact drawn body clear (a truck on a 20 degree hill had a wheel 11 cm under); harbour stacks sit on the coral yard (were 12 cm inside it). The palms' trunks 5-7 cm into the ground are by design. Tests: 90 min collision runs x 8 clean but for the scripted mechanic; no stuck traffic over 60 min; torpedo runs against a 14 kn ship: hits on most salvos, misses pass ~30 m off. |
| P-51 5.56, PCE-842 0.74 | User: US airfield tower janky; objects still sinking (bomb train, Ki-84s and vehicles on the aprons). Tower rebuilt as an open steel frame: legs drawn joint to joint (they leaned outward before), girts and X-bracing on every face of every storey, an outside switchback stair (stringers, treads, handrail, landings on the face), concrete footings, cab on the catwalk deck. Sinking: (1) the checker compared each point with the NEAREST surface, so a wheel inside a slab but just above the soil passed: it now takes the topmost ground-type surface (terrain, slab, apron, decal) when that is above, and the nearest surface otherwise; thin planted things (trunks, posts) may be up to 35 cm in. (2) SURF missed surfaces: added inside groups (now every Object3D.add is noted), draped aprons (stale bounding spheres, now recomputed), and far sites' meshes kept off the camera's layer (the ray now tests all layers). (3) The flight reset put every target back at bare-ground height + half its height, undoing surface placement and tilt: targets now remember where they were set down (y0); wrecks squash onto it. (4) Placement everywhere on SURF: GX.standY (footprint of the parts that reach the base), targets, mkT, site scenery, Fletcher Field's buildings and kit, ground-fire guns and lights (re-seated in SURF.settle if a pad is laid after them), coast guns. Checker: both builds clean but for the hangars straddling the apron edge and the fuel hose. |
| P-51 5.57, PCE-842 0.75 | User: right-angled water along the shore (then: 'beautiful and perfect'). Causes: the shallows' flat paint lay 3 cm under the sea, lost by the depth buffer a few hundred metres off (a band of paint with wave crests poking up); and the terrain's 100 m triangles rise above the sea up to ~60 m before the true shoreline, cutting the sea surface along straight grid lines. Fixes: over the paint the sea rides a little higher with distance (4 cm + 1.5 mm/m); the sea fades out where the home mesh rises out of the paint (tmTex: the mesh's node heights) and thins in the last metres of depth; over the shallows (to 16 m) the sea takes the very colour the ground paints there, so its opacity changing changes nothing; the paint now reaches 16 m and fades into the open-sea plane's colour before it stops (waves only crest over it). |
| P-51 5.58, PCE-842 0.76 | User: give the NPCs a walking animation. CREW_RIG(side, v): the ground crew figure jointed at the hips, knees, ankles, shoulders and elbows (eleven small meshes, the same torso and head as MODELS 'crew'). step(dist, speed) poses it from the metres actually walked, so the feet do not skate: a 1.5 m stride, legs about 26 degrees either way, the knee bending as the leg comes through, boots kept near level with a toe-off behind, arms swinging against the legs, the body rising over each step; standing, it eases to attention. The airfield's walkers and the repair mechanic use it (AFLD takes a rig in place of parts; the joints are kept out of the post-build freeze). |

Notes from step 2:
- `HOOKS` (`src/shared/hooks-...js`) is the pattern for every new module: shared code calls `HOOKS.<name>` handlers, a game's own piece registers them. Add hooks there, never game names in shared code.
- Hull outlines exist for the PCE, the 80 ft Elco and the sled. A new ship class needs its outline added to `OCEAN` (kind) to keep the sea out of her above the waterline; until then she simply is not registered.
- Modules for new work: `HOOKS` (game pieces plug in), `SEA` (levels), `RIDE` (hulls on the waves), `OCEAN.hull` (hulls in the sea), `GAME` + `store` (identity and settings). Run `python3 tools/dedupe.py` after a change that makes per-game pieces identical.

## 6. Freeze log and notes for the P-51 and PCE-842 sessions (they report to Kamome)

- Both sessions stop new development now. Finish what is in progress only if it leaves the game working, and say where you stopped.
- The PCE session records here its current version and which of its ocean changes are in the file, so Kamome knows what the baseline is.
- ~~The P-51 baseline is v5.29 (commit 040a377 on `MisterRat/P51-Mustang-FS`).~~ Superseded: the P-51 baseline is **v5.34 (commit f243b93)**; see section 2.
- If a game-breaking bug must be fixed during the freeze, add one line here: game, version, what changed.
- Do not start the module split in either session. It is Kamome's job.

**PCE-842 session, freeze record (2026-11-17):**
- PCE-842 is frozen at **0.51** (commit `ecd4197`), P-51 at **5.34** (commit `f243b93`); both pushed, both identical to the files in `C:\Code\Arcade`. Nothing is in progress.
- Ocean changes in the baseline: everything up to 0.51. 0.51 is the last one: sun glare on the shallows (Fresnel specular, sharpness by pixel footprint), waves running in to about 4 m deep, crests only over the painted shallows (fixes the pale triangle patches), plus the CPU twin `OCEAN.h` matching it.
- How the PCE session worked, which may help the split:
  - Shared code kept in headed blocks, linked to game-only features through small hooks (`AA.aimY` / `AA.hit`, `COAST` checking for `OCEAN`) rather than globals.
  - To check a shared block, extract it between its header and end comments from both files and `diff` them, e.g. `awk '/===== THE KI-84 HAYATE/{f=1} f{print} /end of THE KI-84 HAYATE/{exit}' file`.
  - Testing: headless Chromium with `--use-gl=swiftshader --enable-unsafe-swiftshader`, click `#go`, collect `pageerror` (expected `[]`). For screenshots, override `R.render` to draw with your own camera. Swiftshader runs far slower than real time, so step game functions by hand (`raidUpdate(dt)`, `coastUpdate(dt)`) to test behaviour.
  - Load order matters: some code runs during load (for example `shipReset` runs before THE AIR RAIDS block, hence `var RAID`). Keep it in mind when the build joins modules.
- The PCE-842 README says Alpha, and the game stays off the MrRat Gaming landing page until the user says so.

## 7. Working rules (apply to all sessions)

- Bump the version on every change. Show screenshots of every visual change.
- Update the copy in `C:\Code\Arcade` whenever a file is delivered.
- Push to GitHub only when the user says "push"; never force-push. If a push is rejected, run `git pull --rebase origin main` first.
- Scenery building and dropping must never be noticeable in play.
- Testing: test only the section a change touches (targeted checks, page errors `[]`, the relevant calibration script if gunnery or raids changed). Run the full smoke tests about once a week, not per change. A build that is byte-identical to its target needs no game testing at all; the byte compare is the test.
- When debugging or walking through setup, give one instruction per message and wait for the result.
- Companion files use the `P-51_Mustang_FS_` prefix (P-51) or the matching prefix for each game.
- Commit messages end with the Claude co-author and session lines.

## 8. Designing for future expansion (added 2026-11-17 by the Kamome session)

The end goal is a large multiplayer game, and more simulators will join later (far future). This update does not build any of that, but the split must not lock the code into one player and two games. Keep these in mind in phases 2-4:

- **The first build recreates the frozen files exactly.** Phase 3 first splits the code into pieces and rebuilds P-51 5.34 and PCE-842 0.51 byte-for-byte. Only then are duplicates merged into single shared copies and the code below reshaped, one block at a time, each step checked with screenshots, page errors `[]` and the test and calibration scripts. Never split and restructure in the same step.
- **The build glues pieces together in order.** The games rely on globals and on code that runs during load, so `build.js` concatenates the source files in a fixed order. Converting to ES modules is a later clean-up, if ever.
- **An ever-expanding world: modular everywhere (user, 2026-11-17).** Not only simulators: new regions and islands, new ships, aircraft and ground units, new enemy types and new missions each arrive as their own module (a piece plus a manifest line), registered with the shared world rather than written into it. Shared code never needs editing to add one.
- **N simulators, not two.** Shared code must not assume "P-51 or PCE". Each simulator is a folder (`src/p51/`, `src/pce/`, later others) that plugs into the shared world through a small, fixed set of hooks (spawn, update, controls, HUD, what can hit it), following the `AA.aimY` / `AA.hit` pattern. Adding a simulator should mean a new folder and a build entry, not edits to shared code.
- **The world is separate from the player.** The world (ocean, weather, time of day, AI ships, raids, coast batteries) runs on its own; players sit inside it. The single main loop from section 2 is designed as "one world, many players", even while there is only one player.
- **Every vehicle is a unit.** The player's P-51, AI P-51s, the PCE, PT boats, bandits and enemy ships share one unit record: id, type, position, velocity, damage, owner (player or AI). Code looks units up instead of assuming one player ship (for example `RAID` reading the ship's `pos` and `vel` directly).
- **State is separate from rendering.** Each unit's state is plain data; the three.js mesh only reads it. Networking later then sends state, not meshes.
- **Repeatable simulation.** Gun spread, AI decisions and wave motion use seeded random numbers and a fixed timestep, so the same inputs give the same result on any machine.
- **Settings.** One namespace (`kamome...`) with a section per simulator. Decide whether players' existing P-51 and PCE-842 settings are carried over.
- **Not now:** networking, servers, lobbies, accounts. Multiplayer is its own later effort (see also the FATED multiplayer plan).

## 9. Models and graphics programme (approved by the user 2026-11-18)

**Rules**
- **One model per role.** Japanese: Ukuru-class kaibokan (escort and patrol), Type T-14 motor torpedo boat (Gyoraitei, their PT boat), Nakajima Ki-84 Hayate (aircraft). American: Elco 80 ft PT boat and PCE-842 (patrol craft), P-51D (aircraft). Every ship, boat and aircraft in the world is one of these unless the user adds a type.
- **No generic blocky shapes where we have reference data or photos.** A model is rebuilt from its references (References/, `References/vehicle research spec sheet.pdf`, digest in `docs/research_1945_bases.md`) and built to its real size with `GX.fit`; `tools/blueprint.py` checks it (Blueprints/).
- **Every object has an up-to-date blueprint (user, 2026-11-18).** Each design change redraws its blueprint, each new design gets one (`tools/blueprints.json` entry, `python3 tools/blueprint.py <id>`, `tools/blueprint_index.py`). By the end of this phase every object in the world is in Blueprints/: vehicles, ships, boats, aircraft, guns, buildings, crew figures and port structures.
- **Browser budget (CPU and memory).** Static models bake into one vertex-coloured geometry each (`GX.Acc`, one draw call); repeated models share one geometry (cached, or instanced when there are many); no image textures on vehicles and ships (vertex colour and painted bands only; small canvas textures only where a pattern is the point, shared between models). Rough triangle budgets: vehicle 1,500 plus about 200 for each round wheel (user, 2026-11-19: wheels must be round; GX.tyre), small boat 3,000, cargo ship 6,000, building 1,500, crew figure 300. Far copies use a cheaper shape or are dropped by distance. Check draw calls, triangles and frame time before and after each step (`tests/kamome_budget.py`; baseline at 5.45: start 678 / 377 draw calls, airfield 263 / 293, port 298 / 273 for P-51 / PCE), and keep scenery loading unnoticeable.

**Order of work (approved)**
1. **Paint schemes** (1945, from the research): Japanese army vehicles khaki-brown, the Ha-Go three-tone (khaki-yellow, olive green, red-brown), Japanese navy equipment grey; Japanese cargo ships light grey-green with dark-green disruptive bands, red-brown below the waterline under a thin black boot-topping; US vehicles lusterless olive drab with white stars, the tug chrome yellow; US Liberty haze grey, T2 Navy Blue below the main deck and haze grey above, deck blue decks.
2. **Ground crew uniforms:** US herringbone-twill sage or OD #7 with the A-3 cap; Japanese army khaki-tan with field cap, Japanese navy blue-grey (white singlet and headband in the heat). Each side's airfield uses its own.
3. **US airfield buildings at their real sizes:** Quonset huts (Stran-Steel 6.10 x 14.63 m, 13 ribs; Elephant 12.19 x 30.48 m), Butler steel-arch hangar (39.62 x 48.77 x 11.89 m), steel-angle control tower (12-15 m, glazed cab, catwalk), Marston mat (PSP) surfaces; support kit: M5 bomb trailer, C-10 generator cart.
4. **Ports and anchorages rebuilt as needed:** Japanese outer-island practice: deep-draught ships at anchor offshore, unloaded by Daihatsu barges; narrow coral-block jetties (6-10 m wide) for small craft; timber A-frame derricks; camouflaged godowns; drums under netting. The home port's long pier (5.45) gives way to a stone jetty and an anchorage in deep water.
5. **Type T-14 motor torpedo boat** (Japanese PT boat): 15.0 x 3.60 m, 0.72 m draught, 14.5 t, 33-35 kn; wooden hard-chine planing hull, dark grey or mottled green; low open or canvas-hooded pilothouse forward of amidships, short signal mast; two 45 cm torpedoes on side-drop cradles; one 25 mm (or 13.2 mm) on the after deck; 2-4 depth charges at the stern. Rides the waves (`RIDE`) and enters the ocean hull list like the PT boats.
6. **Rebuild the generic models from references:** Japanese vehicles (Type 94 truck family, Kurogane, Ko-Hi, Ha-Go), US vehicles (CCKW and its fuel truck, Willys MB, Clarktor 6), the cargo ships (Type 2A, Type 2TL; Liberty and T2 kept for later), the parked P-51D.

## 10. Open questions for the user

- Which version wins wherever the games differ, beyond the ocean? Answered by the winners list in phases 1-2.
- Should the merged game replace the two existing games on the landing page, or sit beside them? *Answered 2026-11-19: there should always be single-page games. The P-51 and PCE-842 stay on the landing page as their own single-page games, and Kamome Strait is a single page beside them.*
