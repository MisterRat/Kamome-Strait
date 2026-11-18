# US tanker (kept for later): game model measured against the references

Measured from the PCE-842 0.63 build by `tools/blueprint.py` (2026-11-18). Model box: 159.60 m long, 20.70 m wide, 36.38 m high (solid parts only, as drawn on the blueprint).

**Represents:** T2-SE-A1 tanker, kept for later (generic shape, real size)

**Where she floats in the game:** the still water is 27.18 m below her highest point and 9.20 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 159.60 m (523 ft 7 in) | 159.6 x 20.7 m, 9.2 m draught, vehicle research spec sheet (References) | 159.60 m | +0.00 m (0%) | match |
| Beam | 20.70 m (67 ft 11 in) | 159.6 x 20.7 m, 9.2 m draught, vehicle research spec sheet (References) | 20.70 m | +0.00 m (0%) | match |
| Draught | 9.20 m (30 ft 2 in) | 159.6 x 20.7 m, 9.2 m draught, vehicle research spec sheet (References) | 9.20 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Hull below the waterline deepened to the real draught (the top 0.5 m as built).

Blueprint: `US_tanker_blueprint.png`.
