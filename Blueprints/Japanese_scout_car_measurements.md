# Japanese army light car (enemy target): game model measured against the references

Measured from the PCE-842 0.63 build by `tools/blueprint.py` (2026-11-18). Model box: 3.38 m long, 1.52 m wide, 2.27 m high (solid parts only, as drawn on the blueprint).

**Represents:** Kurogane Type 95 scout car

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 3.38 m (11 ft 1 in) | 3.38 x 1.52 x 1.68 m, vehicle research spec sheet (References) | 3.38 m | +0.00 m (0%) | match |
| Width | 1.52 m (5 ft 0 in) | 3.38 x 1.52 x 1.68 m, vehicle research spec sheet (References) | 1.52 m | -0.00 m (0%) | match |
| Height | 1.68 m (5 ft 6 in) | 3.38 x 1.52 x 1.68 m, vehicle research spec sheet (References) | 1.68 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Height is measured on the body; the drawing's overall height also includes any aerial or staff.

Blueprint: `Japanese_scout_car_blueprint.png`.
