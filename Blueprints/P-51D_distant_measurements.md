# P-51D Mustang, parked: the distant form (beyond 1 km): game model measured against the references

Measured from the PCE-842 0.85 build by `tools/blueprint.py` (2026-11-20). Model box: 9.62 m long, 11.28 m wide, 4.09 m high (solid parts only, as drawn on the blueprint).

**Represents:** North American P-51D Mustang (simplified airfield model)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 9.83 m (32 ft 3 in) | P-51D, as the player's model | 9.62 m | -0.21 m (2%) | match |
| Span | 11.28 m (37 ft 0 in) | P-51D, as the player's model | 11.28 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Phase 5's distant form of the parked P-51 (P51DISP.parked): the parked form thinned by vertex clustering (GX.thin, 0.28 m cells), about 7% of its triangles. Swapped in beyond 1 km.

Blueprint: `P-51D_distant_blueprint.png`.
