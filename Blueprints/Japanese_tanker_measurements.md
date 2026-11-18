# Japanese tanker: game model measured against the references

Measured from the PCE-842 0.63 build by `tools/blueprint.py` (2026-11-18). Model box: 153.50 m long, 20.00 m wide, 35.25 m high (solid parts only, as drawn on the blueprint).

**Represents:** Type 2TL wartime standard tanker (generic shape, real size)

**Where she floats in the game:** the still water is 26.15 m below her highest point and 9.10 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 153.50 m (503 ft 7 in) | 153.5 x 20.0 m, 9.1 m draught, vehicle research spec sheet (References) | 153.50 m | +0.00 m (0%) | match |
| Beam | 20.00 m (65 ft 7 in) | 153.5 x 20.0 m, 9.1 m draught, vehicle research spec sheet (References) | 20.00 m | +0.00 m (0%) | match |
| Draught | 9.10 m (29 ft 10 in) | 153.5 x 20.0 m, 9.1 m draught, vehicle research spec sheet (References) | 9.10 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Hull below the waterline deepened to the real draught (the top 0.5 m as built).

Blueprint: `Japanese_tanker_blueprint.png`.
