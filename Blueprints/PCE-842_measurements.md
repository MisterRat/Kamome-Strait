# USS PCE-842, patrol craft escort (the player's ship): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 56.64 m long, 12.12 m wide, 23.65 m high (solid parts only, as drawn on the blueprint).

**Represents:** PCE-842 class patrol craft escort, USN 1943-45

**Where she floats in the game:** the still water is 20.87 m below her highest point and 2.78 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 56.24 m (184 ft 6 in) | 184 ft 6 in overall (published; PCE-874/875 plans, plate 4) | 56.64 m | +0.40 m (1%) | match |
| Beam of the hull | 10.08 | 33 ft 1 in at the deck edge (the drawn width also takes in the life rafts and gun tubs, 12.1 m) | - | | |
| Draught to the baseline | 2.54 | 8 ft 4 in design waterline above the baseline (plate 4); the model's 2.79 m below the still water is to the bottom of her propellers, which reach below the keel | - | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- The player's ship in the PCE-842 game (SHIPM), built by the PCE game's own hull code; drawn as she floats (still water marked).
- Her hull, structures and weapons were checked frame by frame against the PCE-874/875 Booklet of General Plans: see docs/PCE-842_plans_check.md (length, waterline length, beam, draught and every major item's frame match within about 0.5 m).

Blueprint: `PCE-842_blueprint.png`.
