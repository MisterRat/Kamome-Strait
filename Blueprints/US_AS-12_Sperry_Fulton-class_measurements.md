# USS Sperry (AS-12), Fulton-class submarine tender, 1945: game model measured against the references

Measured from the PCE-842 0.144 build by `tools/blueprint.py` (2026-11-24). Model box: 162.58 m long, 22.38 m wide, 46.83 m high (solid parts only, as drawn on the blueprint).

**Represents:** Fulton-class submarine tender (Mare Island, commissioned 1 May 1942)

**Where she floats in the game:** the still water is 40.00 m below her highest point and 6.83 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 161.73 m (530 ft 7 in) | 530 ft 7 in overall (HAER CA-342 on Sperry, References/Fulton-class/uss sperry 3612d.pdf) | 161.73 m | -0.00 m (0%) | match |
| Beam | 22.35 m (73 ft 4 in) | 73 ft 4 in (HAER CA-342) | 22.35 m | +0.00 m (0%) | match |
| Draught | 6.83 m (22 ft 5 in) | 22 ft 5 in (HAER CA-342) | 6.83 m | -0.00 m (0%) | match |
| Stem head above water | 13.40 m (44 ft 0 in) | 44 ft, References/Fulton-class/Fulton_class__schematic.jpg (ONI profile with a height scale in feet) | 13.30 m | -0.10 m (1%) | match |
| Funnel top above water | 22.90 m (75 ft 2 in) | 75 ft, References/Fulton-class/Fulton_class__schematic.jpg (ONI profile with a height scale in feet) | 23.00 m | +0.10 m (0%) | match |
| Director tower top above water | 27.40 m (89 ft 11 in) | 90 ft, References/Fulton-class/Fulton_class__schematic.jpg (ONI profile with a height scale in feet) | 27.40 m | -0.00 m (0%) | match |
| Foremast top above water | 40.20 m (131 ft 11 in) | about 132 ft, References/Fulton-class/Fulton_class__schematic.jpg (ONI profile with a height scale in feet) | 40.00 m | -0.20 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Rebuilt 2026-11-24 from the user's References/Fulton-class: the HAER report on Sperry (sizes, where the cranes, derricks, guns and boats were), the ONI Fulton-class profile (heights and fore-and-aft places), the 1941 Fulton profile print, the class model and photographs of Sperry. as1ga1914.pdf is the 1914 USS Fulton (AS-1), not this class: not used.
- Submarine Base Lockwood's tender, moored in the lagoon with a nest of fleet boats alongside (PLAN_Roncador_SS-301 4.2).
- Flush hull with a fine, flared bow and a cruiser stern; two galleried decks of shops and berthing from the stern guns to the bridge; the bridge a third of the way back from the bow, the lattice director tower and foremast (with the two 5-ton derricks) abaft it, one tall narrow funnel amidships, the two 20-ton cranes and the mainmast aft, launches on chocks on the top deck.
- Four single 5"/38 (two on the bow, two on the stern, each pair one above the other), four twin 40 mm in tubs on the superstructure deck, two Mk 51 directors on the bridge. Measure 22.
- Length and beam measured on the hull alone. Every part rests on the part below it (tools/connectivity.py and a support check, 2026-11-24).

Blueprint: `US_AS-12_Sperry_Fulton-class_blueprint.png`.
