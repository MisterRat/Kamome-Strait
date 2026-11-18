# US freighter (kept for later): game model measured against the references

Measured from the PCE-842 0.63 build by `tools/blueprint.py` (2026-11-18). Model box: 134.60 m long, 17.30 m wide, 37.62 m high (solid parts only, as drawn on the blueprint).

**Represents:** Liberty ship EC2-S-C1, kept for later (generic shape, real size)

**Where she floats in the game:** the still water is 29.12 m below her highest point and 8.50 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 134.60 m (441 ft 7 in) | 134.6 x 17.3 m, 8.5 m draught, vehicle research spec sheet (References) | 134.60 m | -0.00 m (0%) | match |
| Beam | 17.30 m (56 ft 9 in) | 134.6 x 17.3 m, 8.5 m draught, vehicle research spec sheet (References) | 17.30 m | -0.00 m (0%) | match |
| Draught | 8.50 m (27 ft 11 in) | 134.6 x 17.3 m, 8.5 m draught, vehicle research spec sheet (References) | 8.50 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Hull below the waterline deepened to the real draught (the top 0.5 m as built).

Blueprint: `US_freighter_blueprint.png`.
