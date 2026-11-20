# 1,000-barrel bolted steel fuel tank (US PT-boat base): game model measured against the references

Measured from the PCE-842 0.78 build by `tools/blueprint.py` (2026-11-20). Model box: 7.18 m long, 7.18 m wide, 5.80 m high (solid parts only, as drawn on the blueprint).

**Represents:** 1,000-barrel bolted steel tank (API 12B), the Seabees' gasoline tank

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Diameter | 6.57 m (21 ft 7 in) | 21 ft 6 1/2 in inside diameter, API 12B bolted tank table (usgr.com) | 6.58 m | +0.01 m (0%) | match |
| Shell height | 4.90 m (16 ft 1 in) | 16 ft 1 in, two rings of staves, API 12B bolted tank table (usgr.com) | 4.90 m | +0.00 m (0%) | match |
| Capacity | - | 1,000 bbl (42,000 US gal); 'one-thousand-barrel tanks are used for gasoline storage' (Navy Steelworker manual, tpub.com) | - | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Shell with three bolted seam bands, a low cone roof with its manhole, an access ladder; on a tamped earth grade about a foot wider than the tank.
- Four stand in the PT-boat base's tank farm, piped along the yard and the fuel jetty.
- Shell height is measured from the top of the grade (0.3 m).

Blueprint: `US_fuel_tank_blueprint.png`.
