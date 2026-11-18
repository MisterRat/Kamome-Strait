# Japanese army light car (enemy target): game model measured against the references

Measured from the PCE-842 0.62 build by `tools/blueprint.py` (2026-11-18). Model box: 3.60 m long, 1.52 m wide, 2.27 m high (solid parts only, as drawn on the blueprint).

**Represents:** Kurogane Type 95 scout car, assumed

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 3.60 m (11 ft 10 in) | 3,600 mm (Wikipedia, Kurogane Type 95) | 3.60 m | -0.00 m (0%) | match |
| Width | 1.52 m (5 ft 0 in) | 1,520 mm (Wikipedia) | 1.52 m | -0.00 m (0%) | match |
| Height | 1.68 m (5 ft 6 in) | 1,680 mm (Wikipedia) | 1.68 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real type's size in the game (VM REAL in the vehicle models): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length, width and height.
- Height is measured on the body; the drawing's overall height also includes the aerial or staff where the model has one.

Blueprint: `Japanese_scout_car_blueprint.png`.
