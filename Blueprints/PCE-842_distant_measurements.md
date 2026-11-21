# PCE-842: the distant form (AI copies beyond 1 km): game model measured against the references

Measured from the PCE-842 0.111 build by `tools/blueprint.py` (2026-11-21). Model box: 56.24 m long, 10.64 m wide, 23.46 m high (solid parts only, as drawn on the blueprint).

**Represents:** PCE-842 class patrol craft escort, USN 1943-45

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 56.24 m (184 ft 6 in) | 184 ft 6 in overall (published; PCE-874/875 plans, plate 4) | 56.24 m | -0.00 m (0%) | match |
| Beam of the hull | 10.08 | 33 ft 1 in at the deck edge (the drawn width also takes in the life rafts and gun tubs, 12.1 m) | - | | |
| Draught to the baseline | 2.54 | 8 ft 4 in design waterline above the baseline (plate 4); the model's 2.79 m below the still water is to the bottom of her propellers, which reach below the keel | - | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Phase 5's distant form of the AI PCEs (GX.far): her display mesh thinned by vertex clustering (GX.thin, cells of length / 120 m, colours kept apart), about 15% of its triangles; swapped in by itself beyond 1 km. The ship the player commands keeps her full detail.

Blueprint: `PCE-842_distant_blueprint.png`.
