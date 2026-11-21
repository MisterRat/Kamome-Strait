# US driver, seated (every moving American vehicle): game model measured against the references

Measured from the PCE-842 0.101 build by `tools/blueprint.py` (2026-11-21). Model box: 0.82 m long, 0.55 m wide, 1.42 m high (solid parts only, as drawn on the blueprint).

**Represents:** USAAF / US Navy driver at the wheel, 1945 (MODELS.driven)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Height | 1.30 m (4 ft 3 in) | seated, about 1.3 m from the seat's floor to the top of the cap | 1.42 m | +0.12 m (9%) | **check** |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Each vehicle that moves gets a driver in its seat (SEATS in the crews piece); a parked one has none. The American vehicles drive on the left of the cab.

Blueprint: `US_seated_driver_blueprint.png`.
