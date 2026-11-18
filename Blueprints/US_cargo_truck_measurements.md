# US cargo truck (home airfield): game model measured against the references

Measured from the PCE-842 0.61 build by `tools/blueprint.py` (2026-11-18). Model box: 7.90 m long, 2.55 m wide, 3.85 m high (solid parts only, as drawn on the blueprint).

**Represents:** GMC CCKW 353 2½-ton 6x6 cargo truck, assumed

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 6.51 m (21 ft 4 in) | 6.51 m (dday-overlord.com) | 7.90 m | +1.39 m (21%) | **check** |
| Width | 2.24 m (7 ft 4 in) | 2.24 m | 2.55 m | +0.31 m (14%) | **check** |
| Height | 2.80 m (9 ft 2 in) | 2.80 m with the canvas top | 3.85 m | +1.05 m (37%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

Blueprint: `US_cargo_truck_blueprint.png`.
