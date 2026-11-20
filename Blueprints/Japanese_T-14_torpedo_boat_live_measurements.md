# Type T-14 motor torpedo boat as she patrols (moving 25 mm, droppable torpedoes): game model measured against the references

Measured from the PCE-842 0.77 build by `tools/blueprint.py` (2026-11-19). Model box: 15.67 m long, 3.67 m wide, 5.43 m high (solid parts only, as drawn on the blueprint).

**Represents:** Type T-14 (No. 538 class) motor torpedo boat, IJN 1944-45: the patrol model (MODELS 'jp-t14' with live = true)

**Where she floats in the game:** the still water is 4.71 m below her highest point and 0.72 m above her keel (her draught in the game).

| Item | Reference | Source | Model | Difference | Result |
|---|---|---|---|---|---|
| Length | 15.00 m (49 ft 3 in) | 15.0 m (as jp-t14) | 15.00 m | +0.00 m (0%) | match |
| Beam | 3.60 m (11 ft 10 in) | 3.60 m (as jp-t14) | 3.60 m | -0.00 m (0%) | match |

Results: match within 3%, close within 8%, **check** beyond that. The box takes in everything drawn: guns, aerials, flags, rigging and figures. Hull-only or body-only sizes can be smaller, so check a **check** result against the drawing before rebuilding anything.

## Notes

- The hull is MODELS 'jp-t14' built live (without the torpedoes and the 25 mm's moving parts); T14.gunParts() gives the turret (carriage, trunnion arms, hand-wheels) and the barrel group (receiver, barrel, flash hider, magazine, shoulder rest) in the ground-fire frame (+z along the barrel); T14.torp(z) gives a torpedo in its cradle.
- In the game the gun is an AA.gun entry (Ground Fire option) and the two torpedoes are one mesh whose shape is swapped as they go over the side (both, the port one, none).
- Sizes as jp-t14; assembled, she matches the jp-t14 sheet.

Blueprint: `Japanese_T-14_torpedo_boat_live_blueprint.png`.
