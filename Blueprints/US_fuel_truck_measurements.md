# US fuel bowser (home airfield): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 6.60 m long, 2.24 m wide, 2.83 m high (solid parts only, as drawn on the blueprint).

**Represents:** GMC CCKW 2½-ton 6x6 chassis, fuel truck

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 6.51 m (21 ft 4 in) | CCKW 353 6.51 x 2.24 m, vehicle research spec sheet (References) | 6.60 m | +0.09 m (1%) | match |
| Width | 2.24 m (7 ft 4 in) | CCKW 353 6.51 x 2.24 m, vehicle research spec sheet (References) | 2.24 m | +0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Built to the real size in the game (GX.fit): the body, without aerials, flag staffs and other thin parts, is scaled to the reference length and width (and height where given; otherwise heights stay in proportion).
- Shares the cargo truck's scale (one CCKW chassis).

Blueprint: `US_fuel_truck_blueprint.png`.
