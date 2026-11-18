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
3. **Split and build.** *Step 1 done 2026-11-17: both games cut into pieces and rebuilt byte-identical (`node build.js --check` reports `== baseline` for both). See "Source layout" below. Step 2 done 2026-11-17 (awaiting the user's review, nothing released): see the step 2 log below. Next: step 3, the role hooks.*
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

## 9. Open questions for the user

- Which version wins wherever the games differ, beyond the ocean? Answered by the winners list in phases 1-2.
- Should the merged game replace the two existing games on the landing page, or sit beside them?
