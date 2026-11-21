# PT-105: the distant form (AI copies beyond 1 km): game model measured against the references

Measured from the PCE-842 0.89 build by `tools/blueprint.py` (2026-11-20). Model box: 25.55 m long, 6.74 m wide, 8.64 m high (solid parts only, as drawn on the blueprint).

**Represents:** Elco 80 ft motor torpedo boat (PT-103 class), as PT-105 / PT-106 / PT-108

**Where she floats in the game:** the still water is 7.04 m below her highest point and 1.60 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 24.38 m (80 ft 0 in) | 80 ft (NavSource PT-104 / PT-108 pages) | 25.55 m | +1.17 m (5%) | close |
| Beam | 6.30 m (20 ft 8 in) | 20 ft 8 in (NavSource) | 6.74 m | +0.44 m (7%) | close |
| Draught | - | 5 ft (1.52 m) NavSource; 3 ft 6 in aft per Pacific Wrecks | 1.6017262268066412 | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Phase 5's distant form of the AI PT boats (GX.far): the hull and its big parts thinned by vertex clustering (GX.thin, 0.2 m cells), about 23% of their triangles; swapped in by itself beyond 1 km.

Blueprint: `PT-105_distant_blueprint.png`.
