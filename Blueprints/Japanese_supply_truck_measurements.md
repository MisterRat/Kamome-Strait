# Japanese army supply truck, covered (enemy target): game model measured against the references

Measured from the PCE-842 0.64 build by `tools/blueprint.py` (2026-11-18). Model box: 5.40 m long, 1.90 m wide, 2.41 m high (solid parts only, as drawn on the blueprint).

**Represents:** Isuzu Type 94 six-wheeled truck (covered supply truck)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 5.40 m (17 ft 9 in) | 5.40 x 1.90 m, vehicle research spec sheet (References) | 5.40 m | -0.00 m (0%) | match |
| Width | 1.90 m (6 ft 3 in) | 5.40 x 1.90 m, vehicle research spec sheet (References) | 1.90 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Height is measured on the body; the drawing's overall height also includes any aerial or staff.
- Shares the cargo truck's scale (one Type 94 chassis), so its own length and height follow its shape.

Blueprint: `Japanese_supply_truck_blueprint.png`.
