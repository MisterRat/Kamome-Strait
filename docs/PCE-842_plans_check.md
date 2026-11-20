# PCE-842 game model checked against the PCE-874/875 Booklet of General Plans

Version 0.37, 16 Nov 2026. The plans are BuShips PCE 874-S0103-426816, plates 3 to 8, for PCE-874/875. They are sister ships of PCE-842 and were drawn at 1/8 in = 1 ft.

**How it was measured.** Each plate was scanned at 100 dpi and its own frame marks were used as the scale: 24 in frame spacing, with frame 0 at the stem on the waterline.
- **Plate 4 (outboard profile):** 38.3 px a frame along the ship, and 66.5 px a metre in height (the 8 ft 4 in waterline to the baseline).
- **Plate 5 (upper deck and navigating bridge):** 39 px a frame along the ship. Athwartships it is scaled to the 33 ft 1 in beam. The scans are stretched slightly across the ship, so each axis has its own scale.
- **Accuracy:** about ±0.3 frame (±0.2 m) where a feature is drawn clearly.
- **Coordinates:** frame f lies x = 27.75 - 0.6096 f metres from amidships. Starboard is +z.

## Hull

| Item | Plans / published | Model before | Model now | Result |
|---|---|---|---|---|
| Length overall | 184 ft 6 in (56.24 m) published; plate 4 shows the stem head at frame -0.9 and the raked transom reaching frame ~91.2 at the deck | 55.67 m (square transom at frame 90.2) | **56.25 m** (stem -1.1, raked transom 90.0 to 91.16) | fixed |
| Length on the 8 ft 4 in waterline | 179 ft 4.5 in (54.67 m), plate 4 | 53.83 m (counter rising from frame 86) | **54.86 m** (counter knuckle at frame 90) | fixed |
| Beam (max, deck edge) | 33 ft 1 in (10.08 m) | 10.08 m | 10.08 m | match |
| Beam on the waterline | about 32 ft (plate 7) | 9.84 m | 9.84 m | match |
| Draft (design waterline above baseline) | 8 ft 4 in (2.54 m) | 2.54 m | 2.54 m | match |
| Forecastle deck at the stem | about 5.6 m above DWL (plate 4) | 5.77 m | 5.77 m | match (0.1 m) |
| Break of the forecastle | frame 62.7 (plate 4) | 62.8 | 62.8 | match |

## Structures and weapons (frame numbers)

| Item | Plans | Model before | Model now | Result |
|---|---|---|---|---|
| 3"/50 gun No. 1 | frame 15.8 (plate 5), 16.3 (plate 4) | 17.5 | **16.0** | fixed (0.9 m) |
| Hedgehog Mk 10 | frames 20.1 to 23.0, centre 21.6 (plate 5) | 22.2 | **21.6** | fixed |
| Forward 20 mm tubs (bridge wings) | frame 24.0, 3.2 m off centre (navigating bridge plan); 23.8 (plate 4) | 21.8, 3.45 m | **24.0, 3.2 m** | fixed (1.3 m) |
| Pilothouse (steering station) front | frame 25.0 (plates 4 and 5) | 23.8 | **25.0** | fixed (0.7 m) |
| Upper deckhouse (blower rooms) | frames ~25 to 37.7-38.6 | 26.6 to 43.4 (ran into the 20 mm tub) | 26.6 to **38.0** | fixed in 0.36 |
| Radar room / enclosure aft end | frame 34.9 (plate 4) | 35.8 | 35.8 | close (0.5 m) |
| After 20 mm tubs (bridge wings) | frame 35.3 (navigating bridge plan) | 34.6 | **35.3** | fixed |
| Mast | frame 39.9 (plate 5) | 39.8 | 39.8 | match |
| Life nets P&S | frames 40.6 to 46.5 (plate 5) | 43 to 48 | **40.6 to 46.5** | fixed |
| Starboard 20 mm (the player's) | frame 44.9 (plate 5), 45.0 (plate 4) | 44.7 | 44.7 | match |
| Deck gear locker and ventilation hood | frames 44.8 to 54.7 (plate 5) | 44.7 to 54.5 | same | match |
| Motor whaleboat (26 ft) | frames 44.5 to 57.4, 3.1 m to port (plate 5) | 46 to 57, 3.0 m | **44.5 to 57.4, 3.1 m** | fixed |
| 40 mm directors P&S (amidships) | frame 56.2 (plate 5), 56.8 (plate 4) | 55.7 | **56.5** | fixed |
| Twin 40 mm P&S (amidships) | frame 62.2, 2.8 m off centre, tub radius ~2.2 m (plate 5); 62.0 (plate 4) | 61.6 | **62.1** | fixed |
| K-guns (depth-charge projectors) | frames 64.8 and 73.5 (plate 6) | 64.6 and 73.7 | same | match |
| After 40 mm director (port) | frame 69.4 (plate 4), 69.7 (plate 6) | 66.4 | **69.5** | fixed (1.9 m) |
| After twin 40 mm on its platform | frame 76.2 (plate 4), 76.7 (plate 6) | 74.8 | **76.3** | fixed (0.9 m) |
| Depth-charge racks P&S | frames ~80 to 89.5 (plate 4) | 80.2 to 89.6 | same | match |

## Heights above the design waterline (model)

Forecastle deck at the stem 5.77 m, at the break 4.35 m. Main deck aft about 2.8 m. Navigating bridge deck 7.03 m. Open bridge 9.6 m. Masthead 21.1 m.

## Still open

- The radar room's after end is 0.5 m aft of the plate 4 outline.
- The after 20 mm tubs' distance off centre (4.35 m) is not clear on the navigating bridge plan.
- These are PCE-874's plans; PCE-842 herself may have differed in detail.

The game model's blueprint, drawn like every other model's: `Blueprints/PCE-842_blueprint.png`, with `Blueprints/PCE-842_measurements.md`.
