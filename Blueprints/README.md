# Blueprints of the Kamome Strait models

Orthographic drawings of every real-world model in the game (profile, plan and front at one scale) and a measurement check against
the references. Drawn by `tools/blueprint.py` from the built game; the catalogue of models, with the reference figures and their
sources, is `tools/blueprints.json`. Redraw after a model changes: `python3 tools/blueprint.py <id>`, then `python3 tools/blueprint_index.py`.

The PCE-842 has her own, more detailed drawings and frame-by-frame check against the PCE-874 plans: `PCE-842_blueprint_profile.png`,
`PCE-842_blueprint_plan.png`, `PCE-842_measurements.md`.

| Model | Represents | Length x width x height (m) | Check | Files |
|---|---|---|---|---|
| North American P-51D Mustang (the player's aircraft) | North American P-51D Mustang | 9.84 x 11.28 x 3.72 | match | `P-51D_blueprint.png`, `P-51D_measurements.md` |
| P-51D Mustang, parked (home airfield) | North American P-51D Mustang (simplified airfield model) | 10.71 x 10.80 x 3.15 | **check** | `P-51D_parked_blueprint.png`, `P-51D_parked_measurements.md` |
| Nakajima Ki-84-Ia Hayate (bandit and raider) | Nakajima Ki-84-Ia Hayate ("Frank") | 9.92 x 11.27 x 3.58 | match | `Ki-84_blueprint.png`, `Ki-84_measurements.md` |
| Nakajima Ki-84-Ia Hayate, parked | Nakajima Ki-84-Ia Hayate ("Frank"), parked | 9.76 x 11.27 x 3.81 | **check** | `Ki-84_parked_blueprint.png`, `Ki-84_parked_measurements.md` |
| Target-towing aircraft (gunnery practice) | Generic target-towing aircraft (no specific type yet) | 10.20 x 14.00 x 2.67 | no reference yet | `Target-tug_aircraft_blueprint.png`, `Target-tug_aircraft_measurements.md` |
| PT-105, 80 ft Elco motor torpedo boat | Elco 80 ft motor torpedo boat (PT-103 class), as PT-105 / PT-106 / PT-108 | 25.55 x 6.74 x 8.64 | close | `PT-105_blueprint.png`, `PT-105_measurements.md` |
| Target sled (towed by PT-108) | Gunnery target sled (generic) | 11.71 x 3.55 x 5.43 | no reference yet | `Target_sled_blueprint.png`, `Target_sled_measurements.md` |
| Battle-practice target raft | Battle-practice target raft with screen (generic) | 12.00 x 5.00 x 8.40 | no reference yet | `Target_raft_blueprint.png`, `Target_raft_measurements.md` |
| Towed target sleeve | Towed aerial target sleeve (generic) | 9.00 x 1.40 x 1.40 | no reference yet | `Target_sleeve_blueprint.png`, `Target_sleeve_measurements.md` |
| Ukuru-class kaibokan (Japanese coastal escort) | Ukuru-class kaibokan (escort ship) | 79.26 x 11.84 x 22.33 | **check** | `Ukuru-class_blueprint.png`, `Ukuru-class_measurements.md` |
| Japanese freighter | Japanese cargo ship (generic, 95 m) | 94.76 x 14.20 x 22.45 | no reference yet | `Japanese_freighter_blueprint.png`, `Japanese_freighter_measurements.md` |
| Japanese tanker | Japanese tanker (generic, 112 m) | 111.55 x 17.20 x 20.90 | no reference yet | `Japanese_tanker_blueprint.png`, `Japanese_tanker_measurements.md` |
| Japanese patrol boat | Japanese patrol boat (generic, 32 m) | 32.04 x 6.00 x 10.80 | no reference yet | `Japanese_patrol_boat_blueprint.png`, `Japanese_patrol_boat_measurements.md` |
| US freighter (kept for later) | US cargo ship (generic, 95 m), kept for later | 94.76 x 14.20 x 22.45 | no reference yet | `US_freighter_blueprint.png`, `US_freighter_measurements.md` |
| US tanker (kept for later) | US tanker (generic, 112 m), kept for later | 111.55 x 17.20 x 20.90 | no reference yet | `US_tanker_blueprint.png`, `US_tanker_measurements.md` |
| 12 cm/45 3rd Year Type gun in its coast emplacement | 12 cm/45 3rd Year Type naval gun on a coast-defence pedestal | 9.20 x 9.20 x 3.47 | close | `12cm-45_coast_gun_blueprint.png`, `12cm-45_coast_gun_measurements.md` |
| Type 96 25 mm twin AA gun in its emplacement | Type 96 25 mm twin mount (Navy, on land) in a sandbagged pit | 9.80 x 9.80 x 3.14 | no reference yet | `Type96_25mm_twin_blueprint.png`, `Type96_25mm_twin_measurements.md` |
| 150 cm searchlight in its emplacement | 150 cm searchlight (Type 96 class) | 7.00 x 7.00 x 3.20 | no reference yet | `150cm_searchlight_blueprint.png`, `150cm_searchlight_measurements.md` |
| Japanese army cargo truck (enemy target) | Isuzu Type 94 six-wheeled truck (cargo truck), assumed | 5.40 x 1.90 x 2.55 | close | `Japanese_cargo_truck_blueprint.png`, `Japanese_cargo_truck_measurements.md` |
| Japanese army supply truck, covered (enemy target) | Isuzu Type 94 six-wheeled truck (covered supply truck), assumed | 5.40 x 1.90 x 2.70 | match | `Japanese_supply_truck_blueprint.png`, `Japanese_supply_truck_measurements.md` |
| Japanese army tanker truck (enemy target) | Isuzu Type 94 six-wheeled truck (tanker truck), assumed | 5.40 x 1.90 x 2.17 | **check** | `Japanese_tanker_truck_blueprint.png`, `Japanese_tanker_truck_measurements.md` |
| Japanese army light car (enemy target) | Kurogane Type 95 scout car, assumed | 3.60 x 1.52 x 2.27 | match | `Japanese_scout_car_blueprint.png`, `Japanese_scout_car_measurements.md` |
| Japanese army armoured carrier (enemy target) | Type 1 Ho-Ha half-track, assumed | 6.10 x 2.10 x 3.78 | match | `Japanese_halftrack_blueprint.png`, `Japanese_halftrack_measurements.md` |
| Japanese army tank (enemy target) | Type 95 Ha-Go light tank, assumed | 4.38 x 2.06 x 3.57 | match | `Japanese_tank_blueprint.png`, `Japanese_tank_measurements.md` |
| US fuel bowser (home airfield) | US 2½-ton 6x6 fuel truck (GMC CCKW class), assumed | 7.28 x 2.55 x 3.20 | **check** | `US_fuel_truck_blueprint.png`, `US_fuel_truck_measurements.md` |
| US cargo truck (home airfield) | GMC CCKW 353 2½-ton 6x6 cargo truck, assumed | 7.90 x 2.55 x 3.85 | **check** | `US_cargo_truck_blueprint.png`, `US_cargo_truck_measurements.md` |
| US jeep (home airfield) | Willys MB / Ford GPW jeep | 3.70 x 1.92 x 1.77 | **check** | `US_jeep_blueprint.png`, `US_jeep_measurements.md` |
| US aircraft tug (home airfield) | US aircraft tug (tractor), generic | 4.00 x 1.70 x 2.10 | no reference yet | `US_aircraft_tug_blueprint.png`, `US_aircraft_tug_measurements.md` |
| US ground crewman (figure) | US ground crewman | 0.32 x 0.82 x 1.84 | no reference yet | `Ground_crewman_blueprint.png`, `Ground_crewman_measurements.md` |

Check: the worst result in that model's table (match within 3%, close within 8%, **check** beyond).
