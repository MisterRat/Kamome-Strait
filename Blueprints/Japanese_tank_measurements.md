# Japanese army tank (enemy target): game model measured against the references

Measured from the PCE-842 0.62 build by `tools/blueprint.py` (2026-11-18). Model box: 4.38 m long, 2.06 m wide, 3.57 m high (solid parts only, as drawn on the blueprint).

**Represents:** Type 95 Ha-Go light tank, assumed

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 4.38 m (14 ft 4 in) | 4.38 m (Wikipedia, Type 95 Ha-Go) | 4.38 m | +0.00 m (0%) | match |
| Width | 2.06 m (6 ft 9 in) | 2.06 m | 2.06 m | -0.00 m (0%) | match |
| Height | 2.13 m (7 ft 0 in) | 2.13 m | 2.13 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real type's size in the game (VM REAL in the vehicle models): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length, width and height.
- Height is measured on the body; the drawing's overall height also includes the aerial or staff where the model has one.

Blueprint: `Japanese_tank_blueprint.png`.
