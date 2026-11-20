# USS PCE-842, patrol craft escort (the player's ship): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-19). Model box: 56.64 m long, 12.12 m wide, 23.65 m high (solid parts only, as drawn on the blueprint).

**Represents:** PCE-842 class patrol craft escort, USN 1943-45

**Where she floats in the game:** the still water is 20.85 m below her highest point and 2.80 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 56.20 m (184 ft 5 in) | 184 ft 6 in (56.24 m) overall, DANFS / NavSource | 56.64 m | +0.44 m (1%) | match |
| Beam | 10.10 m (33 ft 2 in) | 33 ft 1 in (10.08 m) | 12.12 m | +2.02 m (20%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- The player's ship in the PCE-842 game (SHIPM), built by the PCE game's own hull code; drawn as she floats (still water marked).
- Width 12.1 m over the life rafts and gun tubs; the hull's own beam is about 10.1 m.

Blueprint: `PCE-842_patrol_craft_escort_blueprint.png`.
