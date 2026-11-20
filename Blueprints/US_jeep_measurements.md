# US jeep (home airfield): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 3.36 m long, 1.57 m wide, 1.77 m high (solid parts only, as drawn on the blueprint).

**Represents:** Willys MB / Ford GPW jeep

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 3.36 m (11 ft 0 in) | 3.36 x 1.57 x 1.77 m, vehicle research spec sheet (References) | 3.36 m | +0.00 m (0%) | match |
| Width | 1.57 m (5 ft 2 in) | 3.36 x 1.57 x 1.77 m, vehicle research spec sheet (References) | 1.57 m | +0.00 m (0%) | match |
| Height | 1.77 m (5 ft 10 in) | 3.36 x 1.57 x 1.77 m, vehicle research spec sheet (References) | 1.77 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Photo: References/Willys MB Jeep.jpg

Blueprint: `US_jeep_blueprint.png`.
