# North American P-51D Mustang: the display form (AI copies): game model measured against the references

Measured from the P-51 Mustang FS 5.68 build by `tools/blueprint.py` (2026-11-20). Model box: 10.07 m long, 11.28 m wide, 5.47 m high (solid parts only, as drawn on the blueprint).

**Represents:** North American P-51D Mustang

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 9.83 m (32 ft 3 in) | 32 ft 3 in: USAF fact sheets and museum data (warbirdsresourcegroup.org; tnairmuseum.com) | 10.07 m | +0.24 m (2%) | match |
| Span | 11.28 m (37 ft 0 in) | 37 ft 0 in (same sources; the Canadian RCAF page gives 37 ft 1 in) | 11.28 m | -0.00 m (0%) | match |
| Height | - | 4.08 m (13 ft 4.5 in) tail wheel on the ground, propeller blade vertical; the flying model is drawn in flight attitude, so not compared | 5.468075455086203 | | |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- Phase 5's display form: made from the player's own model (P51DISP), the cockpit, pilot, light glows and aerial wire left out and the rest merged into one mesh per material, the propeller separate. Checked pixel for pixel against the player's exterior from the side, above and ahead: no difference.
- Its box is taller than the player's sheet (5.0 m against 3.7 m): the propeller's faint blur disc (3.4 m across), part of the exterior, is merged into the same mesh here and so counted.

Blueprint: `P-51D_display_blueprint.png`.
