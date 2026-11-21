# P-51D Mustang, parked (home airfield): game model measured against the references

Measured from the PCE-842 0.85 build by `tools/blueprint.py` (2026-11-20). Model box: 9.69 m long, 11.28 m wide, 4.11 m high (solid parts only, as drawn on the blueprint).

**Represents:** North American P-51D Mustang (the player's exterior, parked form)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 9.83 m (32 ft 3 in) | P-51D, as the player's model | 9.69 m | -0.14 m (1%) | match |
| Span | 11.28 m (37 ft 0 in) | P-51D, as the player's model | 11.28 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- The player's own aircraft in its parked form (P51DISP.parts): the same airframe and markings, recoloured to its livery (body and trim), canopy glass opaque, the texture overlays (nose art, soot, panel lines) left on the player's aircraft; sitting in the factory three-point attitude (GEAR.sit).

Blueprint: `P-51D_parked_blueprint.png`.
