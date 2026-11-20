# Japanese army half-track (enemy target): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 4.65 m long, 2.23 m wide, 2.43 m high (solid parts only, as drawn on the blueprint).

**Represents:** Isuzu Type 98 Ko-Hi half-track prime mover

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 4.65 m (15 ft 3 in) | 4.65 x 1.90 x 2.15 m, vehicle research spec sheet (References) | 4.65 m | -0.00 m (0%) | match |
| Width | 1.90 m (6 ft 3 in) | 4.65 x 1.90 x 2.15 m, vehicle research spec sheet (References) | 2.23 m | +0.33 m (17%) | **check** |
| Height | 2.15 m (7 ft 1 in) | 4.65 x 1.90 x 2.15 m, vehicle research spec sheet (References) | 2.15 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Height is measured on the body; the drawing's overall height also includes any aerial or staff.

Blueprint: `Japanese_halftrack_blueprint.png`.
