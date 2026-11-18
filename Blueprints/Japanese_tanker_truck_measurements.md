# Japanese army tanker truck (enemy target): game model measured against the references

Measured from the PCE-842 0.61 build by `tools/blueprint.py` (2026-11-18). Model box: 7.00 m long, 2.25 m wide, 2.82 m high (solid parts only, as drawn on the blueprint).

**Represents:** Isuzu Type 94 six-wheeled truck (tanker truck), assumed

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 5.40 m (17 ft 9 in) | 5.4 x 1.9 x 2.7 m (truck-encyclopedia.com, Isuzu Type 94) | 7.00 m | +1.60 m (30%) | **check** |
| Width | 1.90 m (6 ft 3 in) | 5.4 x 1.9 x 2.7 m (truck-encyclopedia.com, Isuzu Type 94) | 2.25 m | +0.35 m (19%) | **check** |
| Height | 2.70 m (8 ft 10 in) | 5.4 x 1.9 x 2.7 m (truck-encyclopedia.com, Isuzu Type 94) | 2.82 m | +0.12 m (4%) | close |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Enemy vehicles are fitted to their target's box in the game, so each one is scaled to that box rather than built to its own drawing.

Blueprint: `Japanese_tanker_truck_blueprint.png`.
