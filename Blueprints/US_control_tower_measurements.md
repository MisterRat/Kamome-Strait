# Steel-angle control tower (US airfields): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 7.46 m long, 8.04 m wide, 19.25 m high (solid parts only, as drawn on the blueprint).

**Represents:** Bolted steel-angle airfield control tower, open braced frame, cab at 12 m

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Height | 15.00 m (49 ft 3 in) | 12-15 m, 3-4 storeys, docs/research_1945_bases.md (US structures in detail) | 15.27 m | +0.27 m (2%) | match |
| Width | 6.80 m (22 ft 4 in) | legs 6.8 m apart at the footings, 5.2 m at the cab deck (game design, from period photographs of steel-angle towers) | 6.76 m | -0.04 m (1%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Rebuilt 5.56: an open frame of four tapering angle-iron legs (6.8 m apart at the footings, 5.2 m at the top) on concrete footings, girts at every 3 m and X-bracing on every face of every storey; every member drawn joint to joint, so legs, girts, braces, landings and deck all meet.
- An outside switchback stair on the -z face: four flights (stringers, eleven treads each, handrail on posts) turning on landings bolted to the face; the top flight arrives at a gap in the catwalk rail.
- Cab on a 5.4 m catwalk deck at 12 m: low wall, green-tinted glass leaning out on four posts, roof with overhang, mast and Aldis lamp.
- Height measured to the cab roof (without the mast); Width between the outer faces of the legs at the footings.

Blueprint: `US_control_tower_blueprint.png`.
