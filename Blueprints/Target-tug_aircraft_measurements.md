# Target-towing aircraft: P-51D (gunnery practice): game model measured against the references

Measured from the PCE-842 0.85 build by `tools/blueprint.py` (2026-11-20). Model box: 9.84 m long, 11.28 m wide, 3.49 m high (solid parts only, as drawn on the blueprint).

**Represents:** North American P-51D Mustang (simplified airfield model, gear up)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 9.83 m (32 ft 3 in) | P-51D, as the player's model | 9.84 m | +0.01 m (0%) | match |
| Span | 11.28 m (37 ft 0 in) | P-51D, as the player's model | 11.28 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).

Blueprint: `Target-tug_aircraft_blueprint.png`.
