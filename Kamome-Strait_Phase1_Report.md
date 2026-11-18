# Kamome Strait: Phase 1 report, P-51 5.34 against PCE-842 0.51

Written 2026-11-17 by the Kamome session, for the user's review. Read-only: nothing in either game was changed.

## How the comparison was done

- **Files:** `C:\Code\Arcade\P-51_Mustang_FS.html` (5.34) and `C:\Code\Arcade\PCE-842\PCE-842.html` (0.51). Both are byte-identical to GitHub (`f243b93` and `ecd4197`).
- **Which side is newer** comes from the git history, not from guessing. PCE-842 0.01 was forked from P-51 **5.28** (commit `60a7f1b`). Comparing each frozen file against 5.28 shows exactly what each game changed after the fork. Wherever only one side changed something, that side is newer.
- **three.js:** both files inline the same r128 block, byte-identical. The CSS (lines 28-257) is identical too.

## 1. Summary

- **24,923 lines are identical** in the two files: 92% of the P-51 and 79% of the PCE-842.
- **Since the fork, the P-51 changed in 23 places.** The PCE-842 made 17 of those changes identically (the shared 5.30-5.34 work: the Ki-84, the coast batteries, the 25 mm ground fire). That leaves 6 changes made only in the P-51: the version, the Ki-84 row in its manual, where the Ki-84 block sits, the ship-models block (5.29), numbered hulls, and the allied fleet.
- **Since the fork, the PCE-842 changed in 171 places**, grouped in section 3.
- **Nothing shared was changed two different ways.** A three-way merge of the two games leaves only 9 overlapping regions:
  - 6 are the same code sitting at a different place in each file (the Ki-84, PCE-842 and PT-105 models);
  - 3 are genuinely per-game: the version number, the manual pages, and how the PCE-842 is placed in the world.
- Every diverged section therefore has one clear newer side. The decisions for you (section 4) are about what the P-51 should take from the PCE-842, not about which version is right.

## 2. Already the same in both (becomes shared code as it is)

- **Framework:** the store and error helpers, Hardcore framework (`FM`), weather and time of day (`WX`), battle damage (`DM`), the sound engine core (`SND`), quality tiers (`QL`), touch, pause-menu framework, gamepad, photo mode, mini-map.
- **The world:** terrain and the far world, roads, farmland, hedgerows, villages, vegetation and grass, flags (`FLG`), airfields (`AFLD`, the working airfield, airfield detail), ports and airbases (`WORLD`), buildings, compounds and the convoy.
- **Sky:** sky dome, sun, clouds, cloud shadows, cloud deck.
- **Models:** `GX`, the Ki-84 (`KI84`), the P-51 and its cockpit (the PCE-842 carries them but never shows them), vehicle and target models.
- **Combat:** effects, the 25 mm ground fire (`AA`, `aaSees`, `updAA`; the per-game target hooks are already in place), the coast batteries (`COAST`), targets and weapons code.
- **The PT-105 (`PTB`) and the PCE-842 model (`PCEM`, stations' interiors included):** identical except the hull number (row 1 below).

## 3. Differences, which is newer, and what I recommend

| # | Area | P-51 5.34 | PCE-842 0.51 | Newer | Recommendation |
|---|---|---|---|---|---|
| 1 | Ship models: hull numbers | `PCEM.build(num)` and `PTB.build(num)` take the number, so every hull wears its own (digits 0-9) | 842 and 105 painted in, fixed | **P-51** (5.29, made after the model was copied from the PCE) | Use the P-51's version for both. The PCE-842 calls `build()`, which defaults to 842 / 105, so she looks the same. Check her bow with one screenshot. |
| 2 | The ocean | Painted sea on the terrain at -8 m, open-sea plane at -8.4 m | `OCEAN` block (Gerstner waves, foam, wake, depth-aware shallows, sun glare), terrain stops painting deep water (`if(shH<-14.0)discard;`), sea plane at -11.8 m (also in roam, photo and high view), sea detail follows the graphics tier, wave clock updated every frame | **PCE** | `OCEAN` becomes one shared module with an on / off switch. During the split the P-51 keeps its painted sea, so the byte check holds. Switching it on in the P-51 is its own later step: it was built for an eye 9 m above the water, so it must be checked from altitude, at speed, and with the performance test, with screenshots for you first. **Decision A.** |
| 3 | Shallow-water colour | `vec3(0.50,0.66,0.72)`: still the 5.28 value | `vec3(0.34,0.53,0.58)`, toned down | **PCE** | Give the P-51 the PCE's colour. The plan says both games were toned down, but the P-51 never got it. This is a visible change to a released game, so screenshots before release. **Decision B.** |
| 4 | Hull cut-out (`HULLM`) | Not present | The sea and the painted water are cut away inside the player's hull, in every cloud-shadowed shader (`csApply`), so water never shows inside her rooms | **PCE** | Shared. It does nothing unless a hull is set, so it is harmless in the P-51. Note for later: it handles one hull only, and multiplayer needs one per manned ship. |
| 5 | Allied fleet at sea | PT-105, PCE-843, PCE-842, PT-106 (5.29 replaced the US freighter and tanker) | US freighter and tanker (the 5.28 fleet); the PCE-842 is handed to the player | **P-51** | One fleet for the whole world: the P-51's. Whichever ship a player commands is taken out of the AI list. **Decision D**, in case you want the freighter and tanker kept for later convoy missions. |
| 6 | Saved settings | 12 keys, `p51…` | 15 keys, `pce842…` (3 of them PCE-only: `enemy`, `wave`, `scam2`) | n/a | During the split keep them as they are. Then switch to one prefix per game, and `kamome…` for the combined game (plan section 8). **Decision C:** should Kamome Strait pick up players' existing saved settings? |
| 7 | Coast batteries read the ocean | The block uses `OCEAN.Y` in three places without checking that the ocean exists. No bug today, because the P-51 never runs `coastUpdate`. | Same code (it has an ocean) | Same | Small fix in the clean-up step: one guard, or the world always has an `OCEAN`. |
| 8 | Version, title, manual and About pages | P-51 text | PCE text | Per game | Stay per game. |
| 9 | Player code written inside shared functions | P-51 original | The PCE replaces the P-51's behaviour in place in about 60 spots: the main loop, `reset`, mission menu, controls (`BIND` / `ACT`), help box, HUD box list, pause tabs, chase and orbit camera, photo mode, sound mixing, bail-out guard, gamepad R3, the camera allowed below the waterline in the engine room | Not versions of the same thing: the PCE role replacing the P-51 role | These become **role hooks**: each simulator supplies its own controls, camera, HUD, sound mix, missions and per-frame update, and the shared loop calls the active role's. This is the core of phase 3's clean-up step and of plan section 8. Until then they stay per-game pieces. |
| 10 | P-51 code the PCE carries but never runs | Flight model, weapons, enemies, trainers, guidance, P-51 HUD | Present, switched off | n/a | In the combined game this is the P-51 role. The stand-alone PCE-842 build can leave it out later, which saves size, but only after the split works. |
| 11 | New PCE-only code | None | The player's ship, the gunner, PT-105 tow and target practice, the air raids, the stations at work, the torpedoman and Hedgehog, the PCE's own engine sounds, the Enable enemy setting, the PCE missions | **PCE** | Goes to `src/pce/` as it is. Note for multiplayer: the raids and practice targets read the one player ship directly (`SHIP.pos` / `vel`), which becomes a unit lookup later. |

### The 9 overlapping regions in the three-way merge

| # | What | Resolution |
|---|---|---|
| 1 | Manual: weapons table | Per game |
| 2 | `VERSION` | Per game |
| 3-4, 6-8 | The Ki-84, PCE-842 and PT-105 model blocks sit at different places in the two files | Same code: one shared copy (with row 1's hull numbers) |
| 5 | The PCE-842 model's fittings and the stations' interiors, again placement | Same code |
| 9 | Allied ships, and placing the player's PCE-842 | Rows 5 and 9 |

## 4. Decisions for you

**Decided by the user, 2026-11-17:** A yes (the improved PCE ocean), B yes (the PCE colour), C new game, new save file, D the P-51's fleet, with the freighter and tanker models kept for later improvement and use. Recorded in the plan, phase 2.


- **A. The ocean in the P-51.** My recommendation: yes, it gets the PCE's ocean, as its own step after the split works, with screenshots and the performance test before release.
- **B. Shallow-water colour in the P-51.** My recommendation: yes, the PCE's toned-down colour, with screenshots first.
- **C. Saved settings.** My recommendation: Kamome Strait starts fresh with its own `kamome…` settings, and the two stand-alone games keep theirs untouched.
- **D. The allied fleet.** My recommendation: the P-51's fleet (PT-105, PCE-843, PCE-842, PT-106) everywhere, minus the ship the player commands. Say if you want the freighter and tanker kept for convoy work later.

Everything else follows from the rule already in the plan: the newer side wins, and the newer side is clear in every case.

## 5. What phase 3 looks like with these results

1. **Split:** cut both files into pieces. Anything identical goes to `src/shared/`, and everything else stays as per-game pieces. Rebuild, and the output must be byte-identical to 5.34 and 0.51. No game testing is needed for this step: the byte compare is the test.
2. **Take in the newer shared code**, one block at a time, each with targeted checks: rows 1, 4 and 7, then rows 2, 3 and 5 as you decide.
3. **Role hooks** (row 9), block by block, towards the one-world / many-players design in plan section 8.
