# USAAF ground crewman, jointed walker (CREW_RIG): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-20). Model box: 0.92 m long, 0.55 m wide, 1.70 m high (solid parts only, as drawn on the blueprint).

**Represents:** USAAF mechanic, 1945, as he walks (the airfield's walkers and the repair mechanic)

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Height | 1.75 m (5 ft 9 in) | a typical serviceman, about 1.75 m | 1.70 m | -0.05 m (3%) | close |
| Stride | 1.5 | two steps of 0.75 m at a brisk walk, 1.4 m/s | - | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Drawn mid-stride (a quarter of the way through the cycle: the leading leg forward, the trailing knee bent, arms swung against the legs).
- The same torso and head as MODELS 'crew'; thighs, shins and boots, upper arms and forearms are separate meshes hung from their joints (eleven small meshes).
- step(dist, speed) poses him from the metres actually walked, so the feet do not skate: legs about 26 degrees either way at a walk, the knee bending as the leg comes through, the boots kept near level with a toe-off behind, the body rising over each step; standing, he eases to attention.

Blueprint: `Ground_crewman_walking_blueprint.png`.
