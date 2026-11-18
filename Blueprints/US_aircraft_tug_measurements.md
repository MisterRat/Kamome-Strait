# US aircraft tug (home airfield): game model measured against the references

Measured from the PCE-842 0.64 build by `tools/blueprint.py` (2026-11-18). Model box: 2.54 m long, 1.32 m wide, 1.42 m high (solid parts only, as drawn on the blueprint).

**Represents:** Clark Clarktor 6 aircraft tug

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 2.54 m (8 ft 4 in) | 2.54 x 1.32 x 1.42 m, vehicle research spec sheet (References) | 2.54 m | +0.00 m (0%) | match |
| Width | 1.32 m (4 ft 4 in) | 2.54 x 1.32 x 1.42 m, vehicle research spec sheet (References) | 1.32 m | +0.00 m (0%) | match |
| Height | 1.42 m (4 ft 8 in) | 2.54 x 1.32 x 1.42 m, vehicle research spec sheet (References) | 1.42 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Photo: References/Clarktor 6.jpg

Blueprint: `US_aircraft_tug_blueprint.png`.
