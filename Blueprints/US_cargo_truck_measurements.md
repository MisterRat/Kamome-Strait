# US cargo truck (home airfield): game model measured against the references

Measured from the PCE-842 0.64 build by `tools/blueprint.py` (2026-11-18). Model box: 6.51 m long, 2.24 m wide, 2.80 m high (solid parts only, as drawn on the blueprint).

**Represents:** GMC CCKW 353 2½-ton 6x6 cargo truck

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 6.51 m (21 ft 4 in) | 6.51 x 2.24 x 2.80 m over the canvas bows, vehicle research spec sheet (References) | 6.51 m | -0.00 m (0%) | match |
| Width | 2.24 m (7 ft 4 in) | 6.51 x 2.24 x 2.80 m over the canvas bows, vehicle research spec sheet (References) | 2.24 m | +0.00 m (0%) | match |
| Height | 2.80 m (9 ft 2 in) | 6.51 x 2.24 x 2.80 m over the canvas bows, vehicle research spec sheet (References) | 2.80 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Photo: References/GMC CCKW 353.jpg

Blueprint: `US_cargo_truck_blueprint.png`.
