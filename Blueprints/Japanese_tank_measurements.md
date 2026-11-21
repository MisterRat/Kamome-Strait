# Japanese army tank (enemy target): game model measured against the references

Measured from the PCE-842 0.87 build by `tools/blueprint.py` (2026-11-20). Model box: 4.34 m long, 2.10 m wide, 2.38 m high (solid parts only, as drawn on the blueprint).

**Represents:** Type 95 Ha-Go light tank

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 4.30 m (14 ft 1 in) | 4.30 x 2.07 x 2.28 m, vehicle research spec sheet (References) | 4.34 m | +0.04 m (1%) | match |
| Width | 2.07 m (6 ft 9 in) | 4.30 x 2.07 x 2.28 m, vehicle research spec sheet (References) | 2.10 m | +0.03 m (2%) | match |
| Height | 2.28 m (7 ft 6 in) | 4.30 x 2.07 x 2.28 m, vehicle research spec sheet (References) | 2.28 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Height is measured on the body; the drawing's overall height also includes any aerial or staff.
- Photo: References/Type 95 Ha-Go.jpg

Blueprint: `Japanese_tank_blueprint.png`.
