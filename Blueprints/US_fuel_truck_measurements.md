# US fuel bowser (home airfield): game model measured against the references

Measured from the PCE-842 0.61 build by `tools/blueprint.py` (2026-11-18). Model box: 7.28 m long, 2.55 m wide, 3.20 m high (solid parts only, as drawn on the blueprint).

**Represents:** US 2½-ton 6x6 fuel truck (GMC CCKW class), assumed

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 6.51 m (21 ft 4 in) | 6.51 m (GMC CCKW 353 cargo, dday-overlord.com; the tanker body is about the same length) | 7.28 m | +0.77 m (12%) | **check** |
| Width | 2.24 m (7 ft 4 in) | 2.24 m | 2.55 m | +0.31 m (14%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

Blueprint: `US_fuel_truck_blueprint.png`.
