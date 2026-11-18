# Japanese freighter: game model measured against the references

Measured from the PCE-842 0.63 build by `tools/blueprint.py` (2026-11-18). Model box: 137.00 m long, 18.20 m wide, 37.44 m high (solid parts only, as drawn on the blueprint).

**Represents:** Type 2A wartime standard cargo ship (generic shape, real size)

**Where she floats in the game:** the still water is 29.64 m below her highest point and 7.80 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 137.00 m (449 ft 6 in) | 137.0 x 18.2 m, 7.8 m draught, vehicle research spec sheet (References) | 137.00 m | +0.00 m (0%) | match |
| Beam | 18.20 m (59 ft 9 in) | 137.0 x 18.2 m, 7.8 m draught, vehicle research spec sheet (References) | 18.20 m | +0.00 m (0%) | match |
| Draught | 7.80 m (25 ft 7 in) | 137.0 x 18.2 m, 7.8 m draught, vehicle research spec sheet (References) | 7.80 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Hull below the waterline deepened to the real draught (the top 0.5 m as built).

Blueprint: `Japanese_freighter_blueprint.png`.
