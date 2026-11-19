# Blueprints of the Kamome Strait models

Orthographic drawings of every real-world model in the game (profile, plan and front at one scale) and a measurement check against
the references. Drawn by `tools/blueprint.py` from the built game; the catalogue of models, with the reference figures and their
sources, is `tools/blueprints.json`. Redraw after a model changes: `python3 tools/blueprint.py <id>`, then `python3 tools/blueprint_index.py`.

The PCE-842 has her own, more detailed drawings and frame-by-frame check against the PCE-874 plans: `PCE-842_blueprint_profile.png`,
`PCE-842_blueprint_plan.png`, `PCE-842_measurements.md`.

| Model | Represents | Length x width x height (m) | Check | Files |
|---|---|---|---|---|
| North American P-51D Mustang (the player's aircraft) | North American P-51D Mustang | 9.84 x 11.28 x 3.72 | match | `P-51D_blueprint.png`, `P-51D_measurements.md` |
| P-51D Mustang, parked (home airfield) | North American P-51D Mustang (simplified airfield model) | 9.83 x 11.28 x 2.89 | match | `P-51D_parked_blueprint.png`, `P-51D_parked_measurements.md` |
| Nakajima Ki-84-Ia Hayate (bandit and raider) | Nakajima Ki-84-Ia Hayate ("Frank") | 9.92 x 11.27 x 3.58 | match | `Ki-84_blueprint.png`, `Ki-84_measurements.md` |
| Nakajima Ki-84-Ia Hayate, parked | Nakajima Ki-84-Ia Hayate ("Frank"), parked | 9.76 x 11.27 x 3.81 | **check** | `Ki-84_parked_blueprint.png`, `Ki-84_parked_measurements.md` |
| Target-towing aircraft: P-51D (gunnery practice) | North American P-51D Mustang (simplified airfield model, gear up) | 9.83 x 11.28 x 2.86 | match | `Target-tug_aircraft_blueprint.png`, `Target-tug_aircraft_measurements.md` |
| PT-105, 80 ft Elco motor torpedo boat | Elco 80 ft motor torpedo boat (PT-103 class), as PT-105 / PT-106 / PT-108 | 25.55 x 6.74 x 8.64 | close | `PT-105_blueprint.png`, `PT-105_measurements.md` |
| Target sled (towed by PT-108) | Gunnery target sled (generic) | 11.70 x 3.50 x 5.73 | no reference yet | `Target_sled_blueprint.png`, `Target_sled_measurements.md` |
| Battle-practice target raft | Battle-practice target raft with screen (generic) | 12.00 x 5.00 x 8.40 | no reference yet | `Target_raft_blueprint.png`, `Target_raft_measurements.md` |
| Towed target sleeve | Towed aerial target sleeve (generic) | 9.00 x 1.40 x 1.40 | no reference yet | `Target_sleeve_blueprint.png`, `Target_sleeve_measurements.md` |
| Ukuru-class kaibokan (Japanese coastal escort) | Ukuru-class kaibokan (escort ship) | 79.26 x 11.81 x 23.66 | **check** | `Ukuru-class_blueprint.png`, `Ukuru-class_measurements.md` |
| Daihatsu landing barge (Japanese harbours) | Daihatsu (Type A) landing barge | 14.94 x 3.35 x 4.18 | match | `Japanese_Daihatsu_barge_blueprint.png`, `Japanese_Daihatsu_barge_measurements.md` |
| Wooden lighter (Japanese harbours) | wooden cargo lighter (unpowered barge) | 12.00 x 4.20 x 2.40 | close | `Japanese_lighter_blueprint.png`, `Japanese_lighter_measurements.md` |
| Timber A-frame derrick (home port T-head) | hand-cranked timber A-frame derrick (shear legs) | 11.66 x 4.87 x 11.20 | match | `Japanese_A-frame_derrick_blueprint.png`, `Japanese_A-frame_derrick_measurements.md` |
| Coral-block mole with timber T-head (home port) | coral-block mole (stone jetty) with a timber T-head | 112.00 x 25.09 x 9.07 | match | `Japanese_coral_mole_blueprint.png`, `Japanese_coral_mole_measurements.md` |
| Decauville hand cart on 600 mm track (home port) | 600 mm Decauville track and hand-pushed cart | 6.90 x 1.00 x 1.39 | match | `Japanese_Decauville_cart_blueprint.png`, `Japanese_Decauville_cart_measurements.md` |
| Fuel drums under palm-frond netting (home port) | 200-litre drums under camouflage netting | 6.94 x 5.08 x 2.40 | match | `Japanese_drum_dump_blueprint.png`, `Japanese_drum_dump_measurements.md` |
| Timber godown (Japanese ports and bases) | low gable-roofed timber warehouse, mottled camouflage | 26.40 x 16.56 x 7.58 | match | `Japanese_godown_blueprint.png`, `Japanese_godown_measurements.md` |
| Japanese navy dock hand (home port) | IJNAS / naval base working rig, 1945: blue-grey trousers, white singlet, white headband | 0.30 x 0.55 x 1.68 | match | `Japanese_navy_dock_hand_blueprint.png`, `Japanese_navy_dock_hand_measurements.md` |
| Japanese freighter | Type 2A wartime standard cargo ship | 137.00 x 18.20 x 25.24 | match | `Japanese_freighter_blueprint.png`, `Japanese_freighter_measurements.md` |
| Japanese tanker | Type 2TL wartime standard tanker | 153.50 x 20.00 x 24.77 | match | `Japanese_tanker_blueprint.png`, `Japanese_tanker_measurements.md` |
| US freighter (kept for later) | Liberty ship EC2-S-C1, kept for later | 134.60 x 17.30 x 30.20 | match | `US_freighter_blueprint.png`, `US_freighter_measurements.md` |
| US tanker (kept for later) | T2-SE-A1 tanker, kept for later | 159.60 x 20.70 x 26.07 | match | `US_tanker_blueprint.png`, `US_tanker_measurements.md` |
| 12 cm/45 3rd Year Type gun in its coast emplacement | 12 cm/45 3rd Year Type naval gun on a coast-defence pedestal | 9.20 x 9.20 x 3.47 | close | `12cm-45_coast_gun_blueprint.png`, `12cm-45_coast_gun_measurements.md` |
| Type 96 25 mm twin AA gun in its emplacement | Type 96 25 mm twin mount (Navy, on land) in a sandbagged pit | 9.80 x 9.80 x 3.14 | no reference yet | `Type96_25mm_twin_blueprint.png`, `Type96_25mm_twin_measurements.md` |
| 150 cm searchlight in its emplacement | 150 cm searchlight (Type 96 class) | 7.00 x 7.00 x 3.20 | no reference yet | `150cm_searchlight_blueprint.png`, `150cm_searchlight_measurements.md` |
| Japanese army cargo truck (enemy target) | Isuzu Type 94 six-wheeled truck (cargo truck) | 5.40 x 1.90 x 2.25 | match | `Japanese_cargo_truck_blueprint.png`, `Japanese_cargo_truck_measurements.md` |
| Japanese army supply truck, covered (enemy target) | Isuzu Type 94 six-wheeled truck (covered supply truck) | 5.40 x 1.94 x 2.42 | match | `Japanese_supply_truck_blueprint.png`, `Japanese_supply_truck_measurements.md` |
| Japanese army tanker truck (enemy target) | Isuzu Type 94 six-wheeled truck (tanker truck) | 5.40 x 1.90 x 2.30 | match | `Japanese_tanker_truck_blueprint.png`, `Japanese_tanker_truck_measurements.md` |
| Japanese army light car (enemy target) | Kurogane Type 95 scout car | 3.38 x 1.52 x 1.68 | match | `Japanese_scout_car_blueprint.png`, `Japanese_scout_car_measurements.md` |
| Japanese army half-track (enemy target) | Isuzu Type 98 Ko-Hi half-track prime mover | 4.65 x 1.90 x 2.15 | match | `Japanese_halftrack_blueprint.png`, `Japanese_halftrack_measurements.md` |
| Japanese army tank (enemy target) | Type 95 Ha-Go light tank | 4.30 x 2.07 x 2.28 | match | `Japanese_tank_blueprint.png`, `Japanese_tank_measurements.md` |
| US fuel bowser (home airfield) | GMC CCKW 2½-ton 6x6 chassis, fuel truck | 6.60 x 2.24 x 2.83 | match | `US_fuel_truck_blueprint.png`, `US_fuel_truck_measurements.md` |
| US cargo truck (home airfield) | GMC CCKW 353 2½-ton 6x6 cargo truck | 6.51 x 2.24 x 2.80 | match | `US_cargo_truck_blueprint.png`, `US_cargo_truck_measurements.md` |
| US jeep (home airfield) | Willys MB / Ford GPW jeep | 3.36 x 1.57 x 1.77 | match | `US_jeep_blueprint.png`, `US_jeep_measurements.md` |
| US aircraft tug (home airfield) | Clark Clarktor 6 aircraft tug | 2.54 x 1.32 x 1.42 | match | `US_aircraft_tug_blueprint.png`, `US_aircraft_tug_measurements.md` |
| Butler combat hangar (US airfields) | Butler steel-arch combat hangar, 130 x 160 ft | 54.97 x 41.62 x 12.29 | match | `US_Butler_hangar_blueprint.png`, `US_Butler_hangar_measurements.md` |
| Quonset hut, Stran-Steel 20 x 48 ft (US airfields) | Stran-Steel Quonset hut, 20 x 48 ft | 15.63 x 6.90 x 3.21 | match | `US_Quonset_hut_blueprint.png`, `US_Quonset_hut_measurements.md` |
| Quonset Elephant hut, 40 x 100 ft (Fletcher Field store) | Stran-Steel Quonset Elephant hut / warehouse, 40 x 100 ft | 31.48 x 12.99 x 6.26 | match | `US_Quonset_Elephant_hut_blueprint.png`, `US_Quonset_Elephant_hut_measurements.md` |
| Steel-angle control tower (US airfields) | Bolted steel-angle airfield control tower, 4 storeys | 7.00 x 7.00 x 19.24 | match | `US_control_tower_blueprint.png`, `US_control_tower_measurements.md` |
| M5 bomb trailer with two 500 lb bombs (Fletcher Field) | M5 2-ton bomb trailer | 3.60 x 1.54 x 1.14 | match | `US_M5_bomb_trailer_blueprint.png`, `US_M5_bomb_trailer_measurements.md` |
| C-10 auxiliary power unit (Fletcher Field) | C-10 auxiliary power unit (starter cart) | 1.49 x 0.92 x 1.10 | match | `US_C10_power_cart_blueprint.png`, `US_C10_power_cart_measurements.md` |
| Japanese aircraft tractor (Japanese airbases) | Kato 4-ton tractor (IJAAF) / Komatsu G40 (IJN) | 3.40 x 1.60 x 1.64 | **check** | `Japanese_aircraft_tractor_blueprint.png`, `Japanese_aircraft_tractor_measurements.md` |
| Japanese airfield control tower (Japanese airbases) | low reinforced-concrete bunker tower, two storeys | 9.07 x 8.08 x 13.15 | close | `Japanese_control_tower_blueprint.png`, `Japanese_control_tower_measurements.md` |
| USAAF ground crewman (home airfield) | USAAF mechanic, 1945: herringbone-twill fatigues (OD #7), A-3 cap | 0.30 x 0.55 x 1.76 | match | `Ground_crewman_blueprint.png`, `Ground_crewman_measurements.md` |
| Japanese army ground crewman (Japanese airbases) | IJAAF mechanic, 1945: khaki-tan coveralls, field cap with neck flaps, puttees, tabi | 0.30 x 0.55 x 1.68 | match | `Japanese_army_ground_crewman_blueprint.png`, `Japanese_army_ground_crewman_measurements.md` |
| Type T-14 motor torpedo boat (Gyoraitei) | Type T-14 (No. 538 class) motor torpedo boat, IJN 1944-45 | 15.67 x 3.67 x 5.43 | match | `Japanese_T-14_torpedo_boat_blueprint.png`, `Japanese_T-14_torpedo_boat_measurements.md` |

Check: the worst result in that model's table (match within 3%, close within 8%, **check** beyond).
