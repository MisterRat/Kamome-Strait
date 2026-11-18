# P-51D Mustang, parked (home airfield): game model measured against the references

Measured from the PCE-842 0.61 build by `tools/blueprint.py` (2026-11-18). Model box: 10.71 m long, 10.80 m wide, 3.15 m high (solid parts only, as drawn on the blueprint).

**Represents:** North American P-51D Mustang (simplified airfield model)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 9.83 m (32 ft 3 in) | 32 ft 3 in: USAF fact sheets and museum data (warbirdsresourcegroup.org; tnairmuseum.com) | 10.71 m | +0.88 m (9%) | **check** |
| Span | 11.28 m (37 ft 0 in) | 37 ft 0 in (same sources; the Canadian RCAF page gives 37 ft 1 in) | 10.80 m | -0.48 m (4%) | close |
| Height | 4.08 m (13 ft 5 in) | 13 ft 4.5 in, tail wheel on the ground, propeller blade vertical (tnairmuseum.com) | 3.15 m | -0.93 m (23%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- The simpler model used for parked aircraft at the airfields; the player's aircraft is the detailed one (P-51D_blueprint.png).

Blueprint: `P-51D_parked_blueprint.png`.
