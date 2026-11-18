# US jeep (home airfield): game model measured against the references

Measured from the PCE-842 0.61 build by `tools/blueprint.py` (2026-11-18). Model box: 3.70 m long, 1.92 m wide, 1.77 m high (solid parts only, as drawn on the blueprint).

**Represents:** Willys MB / Ford GPW jeep

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 3.36 m (11 ft 0 in) | 132.25 in (Wikipedia, Jeep MB) | 3.70 m | +0.34 m (10%) | **check** |
| Width | 1.57 m (5 ft 2 in) | 62 in | 1.92 m | +0.35 m (22%) | **check** |
| Height | 1.32 m (4 ft 4 in) | 52 in top down (1.77 m top up) | 1.77 m | +0.45 m (34%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

Blueprint: `US_jeep_blueprint.png`.
