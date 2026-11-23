# M4A3 Sherman: Tank Simulator Plan

Written 2026-11-23 by the Kamome Strait session, at the user's request: "start bringing an in depth plans for tank simulation. find the
resources. Plan everything, including allied and enemy bases, hedgerows, road, and fields to fight in. which stations to include and what
they will looks like, how they will be played in training and live missions." Revised the same day with the user's answers: **the
setting is the Pacific; coral walls may replace the hedgerows; the locations and names are left to this plan; the tank is the M4A3 with
the 75 mm main gun, the .50 on the turret and the .30s inside (coaxial and bow)**; and Huber's *Japan's Battle of Okinawa* was added to
`References/`. Nothing in this plan is built yet. The remaining open questions are in section 15.

The working rules in `PLAN_Kamome-Strait.md` section 7 apply unchanged: versions on every change, screenshots of visual changes, no
floating parts, blueprints, quick tests, shared code in `src/shared`, the single-page games kept, and a sync to `C:\Code\Kamome-Strait`.
`PLAN_Roncador_SS-301.md` section 11 moves the PCE's drill and station frameworks to `src/shared`; this plan relies on that move too.
Whichever simulator is started first does that move.

---

## 1. The idea in one paragraph

The player is the crew of a US M4A3 Sherman medium tank in the Kamome Strait world in mid-1945. The tank comes ashore from an LCM at an
Allied beachhead on the east shore of the land south of Port Ugaki. It works with an infantry company westward across farmland of small
fields boxed in by coral walls, villages under windbreak trees, cane fields, rice paddies and terraced slopes. In front is a Japanese
defence on the Okinawa pattern: hidden 47 mm anti-tank guns in cave pillboxes, reverse-slope caves, mines, a few Chi-Ha tanks dug in or
held back for a counterattack, and tank-hunting squads with satchel charges. The goal is Depot Mikawa on the west shore and finally
Port Ugaki on the north tip. As in PCE-842, the player can take any of the five crew stations and the AI crew mans the rest. One game
can be played as the commander fighting the tank, as the gunner laying the 75 mm, or as the driver picking a way between the walls.

### Why it plays like Okinawa

The world is a South Pacific strait with a Japanese enemy, and the Okinawa campaign of April to June 1945 is the best-recorded tank
fighting against that enemy. Huber's study of the Japanese side makes the tank the centre of the American answer to the caves. Infantry
alone could hardly make progress against the cave positions; the tank, protected by its infantry, could duel with the gun-port caves,
which were protected by theirs. So each side's basic unit was a strongpoint with infantry round it: the Americans' moved and could be
hurt, the Japanese ones could not move but could hardly be hurt. That is the game: tank and squad against cave and squad.

---

## 2. Sources

| Source | What it gives us |
|---|---|
| **Huber, *Japan's Battle of Okinawa, April-June 1945*** (Leavenworth Papers No. 18, CGSC 1990; the user's `References/` copy, 160 pages; chapter 3, pp. 65-73: "Okinawa Terrain", "Cave War Tactics", "Tanks Versus Caves", "Japanese Antitank Tactics", "American Anticave Tactics") | The battlefield and the enemy's method, sections 4 and 9: broken, hilly ground with only short fields of fire; caves with fire ports on reverse slopes and roads; the 32d Army's directive that fighting the Americans meant fighting M4 tanks; the three-step anti-tank method; the 47 mm gun; mines in tank tracks; the attack on stalled tanks; "Blowtorch and Corkscrew"; the dead angles round a cave. |
| **FM 17-12, Armored Force Field Manual: Tank Gunnery, 22 April 1943** (War Department; a copy is on theshermantank.com's downloads page) | The gunner's and commander's procedure for the 75 mm M3: fire commands, sight use, range estimation, adjustment by observing tracer and burst, battle sight, machine-gun fire. By the site's account it covers nearly everything about firing the Sherman's 75 mm. To be read in full before phase T3. |
| **FM 17-30 Tank Platoon (22 Oct 1942)** and **FM 17-33 Tank Battalion (19 Dec 1944)** (archive.org; afvdatabase bibliography) | Platoon formations, movement by bounds, overwatch, signals; the battalion working with infantry. |
| **TM 9-759 Medium Tank M4A3** (1942, Combined Arms Research Library) | The vehicle: the crew seats, periscopes, hatches, controls and instruments. For example, the assistant driver's and the gunner's periscopes carry telescopes, and the other three are plain vision periscopes. |
| **TM 9-752** (HyperWar) and the **M3 gun data sheet** (theshermantank.com) | Gun, ammunition and ballistics. |
| **Wikipedia, 75 mm gun M2-M6; WWII Vehicle and Gun Database** | The M61 APC left the M3 at about 617 m/s and went through about 81 mm of plate face-on at 500 yd; the M48 HE came with a normal and a supercharge propellant load. A per-range table of flight times and penetration for the M3 (wwiitanks.co.uk) gives the ballistic test values. |
| **theshermantank.com, small arms page** (the user's link) | The machine guns and their mounts: the .50 M2HB on the turret roof of all US Shermans, with its tripod carried and a rear turret bracket holding it (barrel off) when not used; the .30 M1919A4s for coax and bow (crews had two or three guns but one tripod); 450-550 rounds a minute for both; the later stowage of 600 rounds of .50 and 6,250 of .30; the crew's five M3 sub-machine guns with 600 rounds of .45, pistols and grenades. Section 3. |
| **theshermantank.com** (crew stations, fire control, turret, communications) | The commander at the turret's right rear behind the gunner, the loader on the left of the gun; the gunner's late-war periscope sight with two telescopes, each with its own reticle; the loader's own rotating periscope and the commander's in his hatch; the driver's hood stowage. Tank-infantry talk: the tank sets and the infantry's sets worked on different bands. |
| **Wikipedia, M4 Sherman** | Crew of five; the gyrostabilizer was too coarse to shoot on the move, but kept the gun near the target so the tank could fire soon after halting. |
| **Okinawa: The Last Battle** (US Army in WWII, ch. V, HyperWar) | Kakazu: a town of tiled houses walled in by hedges and stone, each one a ready-made strongpoint; the ground near Uchitomari and Ginowan: paddy and terraced fields that funnelled the tanks and blocked wide flank moves; a brush-filled gorge the tanks could not cross; tank ditches, wire and mines; a hidden 47 mm near Mashiki that fired some 20 rounds and burned three medium tanks; Japanese soldiers going at the tanks with satchel charges and burning rags at Red Hill. |
| **6th Marine Division Special Action Reports, Okinawa** (USMC University) | Japanese tank-hunters hiding until a tank was level with them, then running out with a satchel charge to throw it or jam it into the running gear; the tank battalion's radio nets (company and platoon frequencies). |
| **Marine tank sources** (Alexander, *The Final Campaign*, NPS; Gilbert; Zaloga) | Tank telephones on the hull; the infantry covering the tanks; with those tactics and open ground, close assaults cost the Marines almost no tanks. |
| **Japanese weapons** (Wikipedia; Lone Sentry; Pacific Wrecks) | Type 1 47 mm AT gun (about 2,300 built); the Type 97 Shinhoto Chi-Ha with the 47 mm tank gun, dangerous to light tanks and to a Sherman's side and rear. |
| **Okinawan villages** (Chen and Nakama, J. Japanese Society of Coastal Forest 2011; Chen and Akamine 2021) | Villages wrapped in several planted belts of windbreak trees (fukugi), houses with rows of fukugi and coral stone walls round them, lanes in a grid. |
| **The user's references** (`References/`) | M4A3 Sherman.jpg, M3A1 Half-Track.jpg, GMC CCKW 353.jpg, M2 Cletrac.jpg, Type 95 Ha-Go.jpg; `docs/research_1945_bases.md` gives the M4A3's size (5.90 x 2.62 x 2.74 m) and the Ha-Go's. |

---

## 3. The tank

M4A3(75)W: the Ford GAA V-8 Sherman with the 75 mm M3 gun and wet ammunition stowage, the type the 6th Tank Battalion took to Okinawa.

| System | Real | What the game models |
|---|---|---|
| Size and weight | 5.90 x 2.62 x 2.74 m; about 31 t | Its body for collision, crossing (trench, step), bogging and toppling |
| Engine and drive | Ford GAA V-8, 500 hp gasoline; 5-speed synchromesh gearbox and reverse; controlled differential steered by two laterals; about 26 mph on roads | Engine rpm and torque, gears (the driver shifts, or automatic in game mode), lateral steering (one track braked), braking, fuel (range), engine heat; the sounds |
| Running gear | VVSS, three bogies a side, 16.5 in tracks | Per-wheel ground contact, pitch and roll, track tension; a track thrown by a mine, a satchel charge or a hard turn on rock |
| Armour | Glacis 2.5 in at 47 deg (the wet hull), turret front 3 in, sides 1.5 in, rear 1.5 in, roof and belly thin | An armour map by zone (thickness and slope) for the penetration rule (section 8); the belly exposed when she climbs a wall or a terrace |
| **Main gun** | **75 mm M3 L/40** in the M34A1 mount; M61 APC, M48 HE (normal and supercharge), M89 smoke, M64 WP; about 104 rounds | The shared shell ballistics with the M3's table; the ready rack and the wet racks under the floor; loading time by where the round comes from |
| **Turret machine gun** | **.50 cal M2HB on the turret roof**; 450-550 rounds a minute; 600 rounds; its tripod carried, a rear bracket to stow it | Fired by the commander head out (or the loader standing in his hatch, as crews did); the gunner exposed while he fires it; against infantry, cave mouths and aircraft; stowed on the bracket for travel |
| **Internal machine guns** | **.30 cal M1919A4 coaxial** beside the 75, fired by the gunner; **.30 cal M1919A4 in the bow ball mount**, fired by the assistant driver; 450-550 rounds a minute; 6,250 rounds for the .30s | Belts, bursts, barrel heat (a coax barrel can burn out in a long fight and is changed); the spare M1919A4 and its one tripod for a dismounted gun |
| Crew arms | Five M3 sub-machine guns (600 rounds of .45), M1911A1 pistols, grenades | For bailing out and fighting beside a stalled tank (Hardcore) |
| Fire control | Gunner: periscope M4A1 with telescope M38A2 and the direct telescope M70F; power and hand traverse; elevation handwheel; foot switches; the one-axis gyrostabilizer | Two sight views (periscope 1.44x wide, telescope 3x), the reticle with range lines, traverse and elevation rates, the stabilizer holding elevation roughly on the move |
| Vision | Commander's vision cupola (late M4A3) or split hatch with a rotating periscope; M6 periscopes for the others | Each station's periscopes and blocks; head out or buttoned up |
| Radio | SCR-508/528 FM set in the turret bustle; interphone for the crew; an external tank-infantry telephone on the rear hull | The company and platoon nets; the crew interphone; the infantry phone |
| Smoke | 2 in mortar (smoke) in the turret roof; WP from the 75 | Screens; marking targets for aircraft |

---

## 4. The battlefield: the land south of Port Ugaki

### 4.1 Where

The heights below are from the world's terrain (`WH`, sampled every 1 km; the sea is at about -8). The land south and south-east of
Port Ugaki runs from the north tip (Ugaki, x 2,025, z 19,175) down a neck at x 2-3, z 22-24, then widens into rolling farmland about
10 km across (x 1-12, z 24-33, heights 0-30 m), with a small hilly peninsula to the north-east (x 7-12, z 19-23) and steep mountains to
the south-east (x 13-17, z 29-36, up to 540 m). Depot Mikawa (cv1, x 1,472, z 26,239) is on the west shore. Airbase Kakuta is on the
other side of the water to the west and is not on this land, so it is not a tank objective (the first version of this plan had it wrong).

| Place | Name | Where (x, z) | Why there |
|---|---|---|---|
| Allied landing beach | **Beach Orange** | 13,300, 27,200 (the east shore) | Open beach on the east coast; reached by LCMs from Depot Nimitz (9 km north across the strait) round the east of the hilly peninsula, never inside the Ugaki battery's 10 km |
| Tank park and camp | **Camp Buckner** (after Lt Gen Simon B. Buckner Jr., Tenth Army, Okinawa) | 13,100, 27,700 (just behind the beach) | Level ground 9 m up; outside every enemy post's reach (12.3 km from Depot Mikawa's posts, 13.9 km from Port Ugaki's battery) |
| Gunnery range | **Buckner Range** | firing points at 13,300, 28,700, targets on the slopes to the south-east (400-1,500 yd) | Rising ground for a backstop, toward the empty mountains; outside every enemy reach |
| Driving course | **Buckner Course** | 12,950, 28,250 | Beside the camp; outside every enemy reach |
| Front line at the start | **Phase line Able** | north-south along x 10,500, z 24,000-29,000 | 2.6 km west of the camp, inside the enemy's reach: the front |
| Enemy outpost line | Villages **Uezato** and **Tabaru**, the cane land between | x 9,000-10,000, z 24,500-28,500 | The first fight: walls, cane, MG nests, one 47 mm |
| Enemy main line | **Kagi Ridge** (24 m, x 7,000-8,000, z 26,000-28,500) and **Hill 56** (x 5,000, z 29,000) | The reverse-slope caves and the 47 mm pillboxes; the tank ditch across the open ground in front |
| Japanese tank company | **Tomari grove** | 4,500, 26,500 | Palms behind the ridge; Chi-Ha revetments |
| Japanese guns | **Nakama gun line** | 3,000, 24,500 | Field guns and mortars behind the line |
| Objective 1 | **Depot Mikawa** (exists) | 1,472, 26,239 | The convoy depot on the west shore |
| Objective 2 | **Port Ugaki** (exists) | 2,025, 19,175 | The IJN base, reached up the neck at x 2-3, z 22-24, under its battery and its 25 mm guns |

The beach, the camp, the range and the course were checked against every enemy post's reach (ROE.reach, the test used for Halsey) at
these coordinates: none is inside one; the build repeats the test. The names are this plan's choice (the user left them to it): Buckner for the Allied side, as the Navy sites are
named after admirals; invented Okinawan-style village and ridge names for the Japanese side.

### 4.2 A ground-level world

The present terrain is built for an aircraft and ships: the far world's chunks have about 100 m between height samples. A tank crew looks
out at two metres above the ground at walls 30 m away. So the tank simulator adds a **battle area**: the farmland above (about 12 x 10 km),
built at 2 m resolution in 64 m tiles that stream in around the tank (near tiles full detail, farther tiles simpler, beyond 3 km the
existing far world). It carries:

- **Field boundaries** (section 4.3) as real geometry and collision, not texture.
- **Roads and lanes:** a coral road (the main road, 6 m) from Beach Orange across the island to Depot Mikawa and north up the neck to
  Port Ugaki, with a bridge over the gorge; farm tracks (3 m); sunken lanes cut a metre or two into the coral between walls.
- **Fields:** sugar cane (tall: it hides infantry and guns), sweet potato and vegetable plots (low), rice paddies (water and mud: a tank
  bogs), terraces on slopes (steps of 1-2 m), grass and scrub on the ridges.
- **Villages:** Uezato, Tabaru, Tomari, Nakama: houses under red tile roofs, each plot boxed by a coral wall with a windbreak tree belt
  (fukugi), a grid of sandy lanes between them.
- **Tombs:** the big turtle-back family tombs on hill slopes, which the Japanese used as strongpoints.
- **Ridges and caves:** limestone ridges (Kagi Ridge, Hill 56) with cave mouths and fire ports on the reverse slopes and covering the
  roads; air shafts on the crests.
- **A gorge, a ditch and minefields:** a brush-filled gorge across the island's middle (impassable to a tank except at the bridge), an
  anti-tank ditch with wire in front of Kagi Ridge, mine belts on the roads and in the gaps.

The ground is what Huber describes: rolling and hilly, broken by terraces, escarpments and ravines, with countless short fields of fire
and no long ones. Most fights are at 50-400 m. That decides the game's feel: surprise, close, fast.

The battle area is a shared module: it is ground, so the P-51 strafes the same walls and the PCE's guns can reach its shore.

### 4.3 Field boundaries (coral walls instead of hedgerows)

With the user's agreement, the hedgerow banks of the first version are gone. Every field boundary is one of three kinds, fixed by
position (like the hamlets) by the region generator:

| Kind | Build | What it does to a tank |
|---|---|---|
| **Coral wall** | Rough coral blocks 1-1.8 m high, 0.6-1 m thick; round house plots, many fields and along the lanes | Stops infantry and hides them; a tank can push a short stretch down (slow, noisy, nose up and belly shown for a moment) or knock a gap with HE |
| **Windbreak belt** | Two or three rows of fukugi trees 6-10 m tall, dense to the ground, round villages and plots | Blocks sight completely; a tank cannot pass between the trunks except at a lane; the village's "hedgerow" |
| **Paddy dyke** | Low earth dyke 0.5 m, water on either side | Low, but the paddy bogs a tank |

Gates, lane mouths and road gaps are the easy crossings, and the defender knows it: the 47 mm guns are sited on them. Fields are small,
50-120 m a side in the walled farmland, larger in the cane land.

### 4.4 Roads

The main coral road and the farm tracks are above. Road traffic is part of the world: CCKW trucks, jeeps and half-tracks on the Allied
side (their models exist), Type 94 trucks and Kurogane cars on the Japanese side.

### 4.5 Allied bases

| Base | What it is | How it is played |
|---|---|---|
| **Beach Orange** | A beach inside a reef gap; a pontoon causeway; LCMs from Depot Nimitz with one Sherman each (an LCM-3 carries one medium tank); dumps of ammunition and fuel; a beachmaster's post; an aid station | The landing (mission 1); resupply |
| **Camp Buckner** | The tank battalion's park: tanks in revetments, the maintenance tent with an M32 recovery vehicle and an A-frame, ordnance and fuel dumps (jerrycans, 75 mm crates), a CCKW fuel truck, the company CP, tents | Start and end of every live mission; repair and rearm between them |
| **Buckner Range** | Firing points, target boards and hulks at 400-1,500 yd, a moving target on a cable sled, range flags, a tower | Gunnery training |
| **Buckner Course** | A ditch, a step, a slope, a coral wall with a gap, a paddy, a terrace, a narrow lane between windbreaks | Driver training |
| **The front** | Infantry foxholes and a battalion CP behind phase line Able, a 4.2 in mortar platoon, an aid station, a jeep track; moves west as missions are won | Where live missions start; the infantry company commander is here |

### 4.6 Enemy positions

| Position | What it is |
|---|---|
| **Outpost line** (Uezato, Tabaru) | Rifle pits and MG nests behind the walls and in the windbreaks, the cane full of men, a mined road block, one 47 mm on the road gap |
| **Kagi Ridge and Hill 56** | Reverse-slope caves with fire ports and side and rear exits, the 47 mm guns in cave pillboxes sited on the gates, lanes and the road; mortar pits behind the crest; tombs as pillboxes; a dug-in Chi-Ha as a pillbox; foxholes in front of the caves manned even under bombardment (section 9); the tank ditch with wire and mines in front |
| **Tomari grove** | Type 97 Shinhoto Chi-Ha and Type 95 Ha-Go in revetments (the Ha-Go model exists): the counterattack force |
| **Nakama gun line** | A battery of 75 mm field guns and mortars firing on registered points (fields, crossroads, gaps) by observers on the ridges |
| **Depot Mikawa** (exists) | Its 25 mm guns and buildings; a last defence of walls and caves round it |
| **Port Ugaki** (exists) | Its coast battery can fire on tanks on the shore road and the neck; its 25 mm guns; the T-14s and the escort in harbour |

---

## 5. Stations

The PCE's pattern carries over: numbered stations on keys 1-5 (and 6 for the outside view), a first-person eye at each, the live
instruments drawn where they are, the AI crew at every station the player is not at, the interphone for the orders between them.
The interior is one model built from the TM's drawings and photographs (blueprints and measurements kept, as for every model).

### 5.1 Station 1: Commander

- **Where:** right rear of the turret, standing on the floor or the seat, head in the cupola, or head out.
- **What it looks like:** the cupola's ring of vision blocks (or the split hatch and a rotating M6 periscope), the turret's interior
  below him (breech, the gunner's back, the loader), the radio in the bustle behind, binoculars. Head out: the world all round, the hatch
  ring at chest height, the **.50 M2HB's spade grips and ring** in front of him.
- **What the player does:** watches, finds targets, gives the fire commands to the gunner (or lays the gun himself with the commander's
  override traverse), orders the driver on the interphone ("driver, move out", "left", "right", "stop", "back up", "gear", "speed"),
  talks to the platoon and the infantry, **fires the .50 head out**, decides head out or buttoned (head out sees far more and is the
  place the Japanese aimed at), calls for artillery, mortars and air support.
- **Orders box:** the PCE's Orders window reused: fire commands as a menu (target, ammunition, range), driver's orders, radio calls,
  smoke, hold fire, priorities.

### 5.2 Station 2: Gunner

- **Where:** right front of the turret, seated, face at the sight.
- **What it looks like:** two sight views switched by a key. The periscope gives a wide 1.44x picture with the ballistic reticle; the
  direct telescope M70F gives a 3x picture with range lines for each ammunition. Around them, when he looks up: the power traverse
  handle, the elevation handwheel, the azimuth indicator, the firing switches (75 and coax), the stabilizer switch.
- **What the player does:** lays the gun on the commander's target (traverse with the handle, its speed set by how far it is pushed;
  fine with the handwheel), sets the range on the reticle line for the ammunition loaded, fires the 75 or the **coaxial .30**, senses
  the shot (tracer, burst, dust) and corrects (FM 17-12's adjustment), keeps the stabilizer on while moving. In game mode the range
  lines are labelled and a lead mark is shown on moving targets; in Hardcore, the bare reticle.

### 5.3 Station 3: Loader

- **Where:** left of the gun, standing on the turret basket floor.
- **What it looks like:** the breech with its opening lever, the ready rack in the turret, the wet racks under the floor, the coax's feed
  and belt box, the radio, a periscope; his hatch overhead.
- **What the player does:** loads what is called (AP, HE, smoke, WP) from the nearest rack (the ready rack quick, under the floor slow,
  with the turret turned to reach it), clears misfires, feeds and reloads the coax and changes its hot barrel, keeps the count, refills
  the ready rack in a lull, and can stand in his hatch to fire the .50 when the commander is busy. Game mode: a mini-game of a few keys.
  Hardcore: each round is lifted and rammed, and a wrong round stays in the gun until fired.

### 5.4 Station 4: Driver

- **Where:** left front of the hull.
- **What it looks like:** head out, the hatch rim and the glacis, the road ahead; buttoned up, a single M6 periscope's narrow view.
  Inside: the two lateral levers, the clutch and accelerator pedals, the gear lever, the instrument panel (rpm, speed, oil pressure,
  temperature, fuel, ammeter), the hand throttle, the siren and light switches.
- **What the player does:** drives on the commander's orders or his own route: gears, revs, laterals to steer, the clutch; reads the
  ground (a wall to push through, a paddy to avoid, a lane too narrow, a terrace step); keeps her hull-down when told; avoids old tread
  marks (the Japanese mined them at night); watches the engine temperature. Game mode: automatic gears and a simple steer; Hardcore: the
  gearbox, the clutch, stalling, a thrown track from a careless turn.

### 5.5 Station 5: Assistant driver / bow gunner

- **Where:** right front of the hull.
- **What it looks like:** the **.30 M1919A4 in its ball mount** with the M6 periscope above it, the ammunition boxes, the spare .30 and
  its tripod in their stowage.
- **What the player does:** fires the bow gun at infantry ahead (hosing the far wall and the cane before the tank crosses), watches the
  tank's flanks for tank-hunters, spots for the driver, takes over driving if the driver is hit, passes ammunition.

### 5.6 Station 6: Outside

A third-person view of the tank (the existing chase and orbit views) for game mode and for an infantryman's view: where the tank is in
the field, where the squad is. In Hardcore the outside view is off in live missions, as in the PCE.

### 5.7 Moving between stations

One key jumps, as in the PCE. Hardcore keeps the PCE's rule that a station has its own body: the commander head out can be hit; a
wounded crewman's station goes to the AI only if someone is left to fill it (with fewer than five the tank works slower: the commander
loads, the bow gunner drives). Bailing out puts the crew on the ground with their M3s and pistols beside the tank.

---

## 6. Moving over the ground

- **Ground types**, each with a bearing strength and rolling resistance: road, track, dry field, cane, paddy (mud), sand, coral rock,
  scrub. Rain (the existing weather) softens the fields and turns the paddies into a bog; a bogged tank needs a tow from the M32.
- **Slopes and steps:** the climb limit (about 60%), steps up to 0.6 m, trenches up to 2.3 m; a terrace or a wall lifts her bow until she
  tips over the top.
- **Walls and trees:** collision with the wall; pushing it down; a gap that stays. Windbreak trunks stop her.
- **Mines:** a mine under a track throws it and stops her, damaging the bogies. A stopped tank is the enemy's chance (section 9).
- The **physics** extends the ship and car code in `src/shared`: a rigid body on per-wheel springs over the battle area's mesh.

---

## 7. Fighting the tank: the crew drill

### 7.1 Fire commands

The commander's fire command follows FM 17-12 (to be checked word for word against the 1943 manual before phase T3): the alert
("GUNNER"), the ammunition ("AP" / "HE"), the target ("TANK" / "GUN" / "TROOPS"), the direction (traverse, or "STEADY ON"), the range
("EIGHT HUNDRED"), the command to fire ("FIRE"). The gunner answers "ON THE WAY", the commander senses the burst and corrects ("UP TWO",
"LEFT ONE", "TARGET"). The loader calls "UP" when the gun is loaded. Every station hears these on the interphone; the player at any
station does his part, and the AI does the rest at the same pace.

### 7.2 Tactics the game teaches and scores

- **Tank and squad together.** The infantry keep the tank-hunters off; the tank kills what stops the infantry. The tank does not go
  through a gate or a lane mouth before the squad has looked at the next field. A tank that leaves its infantry is what the Japanese
  method waits for (section 9).
- **Walls and windbreaks.** The bow gun and the coax hose the far wall and the cane; HE into the corners and the gaps where guns hide;
  the tank crosses at a new gap it makes, not at the gate.
- **Hull-down and overwatch.** One tank moves while another covers; fire from behind a wall or a terrace with only the turret showing.
- **Blowtorch and Corkscrew** (Huber, pp. 71-73). The artillery drives the cave's surface infantry under cover; tank and squad close in;
  the tank's main gun, machine guns (or a flame tank) keep the gunners away from the fire port while the infantry slip into its dead
  angle; the infantry take the crest above the cave (outside the port's arc, and covering its exits) and the rear exits; charges,
  white phosphorus or smoke go down the air shaft. The tank's part is to hold the fire port and kill anyone in the foxholes round it.
- **Against a hidden gun:** turn the thick front to it, smoke, reverse out, call fire on it.
- **A stalled tank:** the crew stay with it if they can and the platoon covers it; it is recovered before dark if at all possible,
  and the tow route is checked for new mines (section 9).

---

## 8. Hits and damage

- **Shells:** the shared ballistics (`GSPEC`'s pattern) with the 75 mm M3's flight times; the Japanese 47 mm, 37 mm and 75 mm field gun.
- **Penetration:** thickness along the shell's path (the plate's slope and the angle of the hit) against the shell's penetration at that
  range, with a band of chance either side (the tables are 50% values). Not penetrated: a ringing hit, maybe a broken periscope, a
  jammed turret ring, a shaken crew.
- **Penetrated:** what is behind: a crewman, the gun, the radio, the engine, the fuel, the ammunition (wet stowage lowers the chance
  of an ammunition fire); fire inside: bail out. Each part has a damage-control job (the PCE's `DCX_K` jobs reused): a jammed turret ring
  freed by hand, the radio switched over, a fire put out with the extinguishers, a burnt-out coax barrel changed.
- **Close assault:** satchel charges, reinforced grenades and mines were, by Huber's account, mostly strong enough to break a track or
  the bogie wheels and stop a tank, not to breach the hull. The game models them that way: a thrown track, damaged bogies, maybe the
  engine deck. A stopped tank is then attacked with fire bottles, which can set the engine deck burning.
- **Mines:** a thrown track and damaged bogies; a larger charge under the floor.

---

## 9. The enemy

Huber (pp. 68-71) gives the Japanese method as three steps, and the AI follows them:

1. **Kill the tank with the anti-tank gun.** Every weapon held fire until the tank team was close, then opened at once: the guns at
   the tank, small arms and mortars at its infantry. The 47 mm gun was usually in a cave pillbox, not moved about. Its muzzle velocity
   was about 2,700 ft/s; it weighed about 1,600 lb on rubber tyres. A Japanese assessment had it penetrating a Sherman at all ranges up
   to 800 yd; the 37 mm did little to a Sherman.
2. **Drive off the infantry and close with the tank.** Small arms and mortars drove the American infantry away from the tank, leaving
   it "blind"; then hidden men rushed it with satchel charges, reinforced grenades and mines. A tank commander standing in his hatch was
   a target of his own.
3. **Stop it and finish it later.** A tank stopped by a mine or a charge was burned with fire bottles at leisure; engineers were sent to
   blow up stalled tanks before dark, when their crews hoped to recover them; mines were laid round a damaged tank, on the likely towing
   route, and in tread tracks at night where tanks would pass again.

| Enemy | Behaviour |
|---|---|
| **Type 1 47 mm AT gun** | In a cave pillbox or dug into a tomb or a wall gap, sited on a gate, a lane or the road for a flank shot; holds fire until the tank is close; its first shot decides much: the game gives it a chance to miss, and gives the crew the muzzle flash and dust to spot it |
| **Type 97 Shinhoto Chi-Ha / Type 95 Ha-Go** | Dug in as pillboxes, or a counterattack of 3-5 tanks with infantry at dusk; the 47 mm dangerous to a Sherman's side and rear; the Ha-Go's 37 mm only at very close range |
| **Tank-hunting squads** | Hide in the cane, ditches, tombs and behind walls near a gap; wait for a tank parted from its infantry; rush with satchel charges and reinforced grenades; some throw themselves under the tank |
| **Riflemen, MGs and knee mortars** | Behind the walls and in the windbreaks; foxholes in front of the caves, about a third of a company kept outside even under bombardment and back on the surface the moment it stops; quick counterattacks by a platoon on any Americans who have just got a foothold |
| **Caves** | Fire ports facing the front on reverse slopes and roads, exits at the sides and rear, air shafts on top; riflemen firing at angles off the port's line to cover its blind sides; occupants who cannot see far, like a tank's |
| **Artillery** | Field guns and mortars on registered points (gaps, crossroads, fields), called by observers on the ridges; not aimed at individual tanks, because the front-line units had no radio link to the guns (Huber). No bazookas |
| **Mines and obstacles** | Belts across open ground and roads; mines in old tread marks; the tank ditch with wire; log road blocks covered by fire |
| **Aircraft** | Rare: a Ki-84 strafing, only when called by a unit under fire (AIRSUP's rule) |

Every position reads the sighting and alert rules already in the game (SIGHT, ROE): one that has seen the tank alerts those near it.

---

## 10. Friendly forces and support

- **The infantry company:** squads of 12 that move with the tank: crossing a field by bounds, clearing a wall line, calling the tank onto
  a target by the tank-infantry telephone on the rear hull (an infantryman's voice on the interphone: "tank, cave in the bank, left of the
  tomb, fire"). Their AI is new and the biggest piece of work in this plan (section 14).
- **The platoon:** four other Shermans under the platoon leader (AI), on the platoon net; column, wedge, line; overwatch.
- **Artillery and mortars:** called through the infantry or the net; the 4.2 in mortars for smoke and HE.
- **Air support:** P-51s called by the tank's radio (the shared AIRSUP's US side), the target marked with WP; the P-51 player can answer
  the call in Kamome Strait (section 12).
- **Engineers:** demolitions for walls, caves and the ditch; mine lanes marked with tape.
- **Recovery:** the M32 tows a disabled tank back to Camp Buckner.

---

## 11. Training

Training uses the PCE's drill framework (moved to shared: `DRILLP`, `drillReport`, the Orders and Drill boxes side by side, the picture
box), on Buckner Range, Buckner Course and the fields next to Camp Buckner, where the enemy never comes. Each drill names the manual
paragraph or the source it teaches.

| Station | Drill | What it trains | Score |
|---|---|---|---|
| 4 Driver | **Driving course** | Gears and laterals through the course: ditch, step, slope, a wall gap, terrace, paddy edge, a lane between windbreaks | Time, collisions, stalls, thrown tracks |
| 4 | **Hull-down** | Bring her up behind a wall until only the turret shows, on the commander's word | Hull exposure, time |
| 4 | **Buttoned up** | Drive the course by the periscope only | Time, collisions |
| 2 Gunner | **Range estimation** | Read ranges with the reticle and the target's size | Range error |
| 2 | **Stationary targets** | Fire on boards at 400-1,500 yd, sensing and correcting | Hits, rounds, time to first hit |
| 2 | **Moving target** | The sled target crossing; lead | Hits |
| 2 | **Battle sight** | Fast engagement of surprise targets at short range (the island's normal range) | Time to hit |
| 2 | **Fire port** | Put HE and coax into a cave fire port on the range's bank and keep it suppressed for a squad's approach | Hits on the port, time the port was covered |
| 2 | **Stabilizer** | Keep the gun on a target while moving, then fire on the halt | Lay error at the halt, time to fire |
| 3 Loader | **Loading drill** | Called rounds against the clock, from each rack; a misfire; a coax barrel change | Time per round, wrong rounds |
| 5 Bow gunner | **Wall fire** | Hose the far wall and the cane in bursts while the tank crosses | Coverage, ammunition |
| 1 Commander | **Fire commands** | Give the command in order and correct | Order and speed; gunner's hits |
| 1 | **The .50** | Head out: engage infantry and a low aircraft with the .50, then down and buttoned up when fired on | Hits; time exposed |
| 1 | **Driving orders** | Bring the tank across country by orders to an AI driver | Time, exposure |
| 1 | **Spot the gun** | A hidden 47 mm opens fire on the range: find the flash, turn the front to it, smoke, back out, engage | Time to spot, hits taken |
| All | **Crew drill** | A full engagement on the range: every station's part, the AI doing the others | The crew report |
| All | **Bail out** | Fire inside: out by the hatches in order, under the timer | Time; crew saved |
| 1 + infantry | **Tank and squad** | One squad, one tank, one field: the squad leads, the tank follows and fires on the phone's calls | Squad losses, time, positions cleared |
| 1 + infantry | **Blowtorch and Corkscrew** | A practice cave on the range: suppress the port, the squad into the dead angle and onto the crest | Time; squad losses |
| 1 | **Radio procedure** | Report, call for fire, call for air support in the right form | Items right |

Each station has a qualification card, as in the Roncador plan; all live missions are open in free play.

---

## 12. Live missions

| # | Mission | What happens |
|---|---|---|
| 1 | **The landing** | Ashore from an LCM at Beach Orange (the PCE may escort the LCMs in Kamome Strait), off the beach through the reef gap to Camp Buckner; a mined beach exit |
| 2 | **Uezato** | With an infantry company across the walled fields into Uezato: MGs behind the walls, one 47 mm on the road gap, tank-hunters in the cane |
| 3 | **Tabaru and the cane** | Clear Tabaru lane by lane under its windbreaks; a counterattack by a Japanese platoon on the squads' new foothold |
| 4 | **The tombs** | Support an attack on a slope of tombs used as pillboxes |
| 5 | **The ditch** | Escort the engineers who bridge the tank ditch in front of Kagi Ridge, under mortar and artillery fire |
| 6 | **Kagi Ridge** | Blowtorch and Corkscrew on the ridge's caves with the squads and engineers |
| 7 | **Counterattack at dusk** | Chi-Ha tanks and infantry come out of Tomari grove; hold the ridge with the platoon |
| 8 | **The stalled tank** | A Sherman stopped by a mine in front of the line: hold it until the M32 arrives, before dark, against the engineers sent to blow it up; the tow route mined |
| 9 | **Hill 56** | The southern anchor: caves on three sides, mines in the gaps |
| 10 | **The bridge** | Take the coral road's bridge over the gorge before it is blown |
| 11 | **Depot Mikawa** | The depot on the west shore, with air support |
| 12 | **Port Ugaki** | Up the neck under the battery to the IJN base, with naval gunfire (the PCE) and air support |
| - | **Rain** | Any of the above in the rains: paddies bog, sight shortens, the infantry slow |

A **campaign** links them: the front moves west as missions are won, damaged tanks come back from the park repaired or not, the crew
keeps its experience.

### Kamome Strait links

- **PCE-842 escorts the LCMs** from Depot Nimitz to Beach Orange round the east of the hilly peninsula (a new PCE mission), and gives
  gunfire on the shore road and Port Ugaki's battery in mission 12.
- **P-51 close air support:** the tank's call for air support brings P-51s (AI, or the P-51 player), with the tank marking the target
  with WP.
- **Sighting reports** (SIGHT) work on land too: a Japanese observer who sees the tank alerts the guns near him.

---

## 13. What is reused, what is new

### Reused as is

Terrain functions (`WH`, `H`), the far world and its rural network, weather and time of day, the ocean and the shore, `ROE`, `SIGHT`,
`AIRSUP`, `COAST`, Port Ugaki and Depot Mikawa, Depot Nimitz, the LCM-3, CCKW, jeep, half-track, Ha-Go, Type 94 and Kurogane models, the
crews' figures, the minimap, the briefing map tool, settings and Hardcore, the mission menu, the radio paper and its colours, the sound
engine.

The route and the chart (`NAV`, `NAVCHART`, added 2026-11-23 for every simulator with an AI driving): the commander lays the driver's
route on the chart (a map board in the turret, station 1's second position). The AI driver follows it; an enemy in sight suspends it,
and 30 s clear re-engages it. The tank's role supplies `navAble`, `navContact` (its own spotting), `navLegOK` (no leg through deep
water, cliffs or the coral walls' gaps it cannot cross) and the driver's steering for `NAV.aim()`.

### Moved to `src/shared` (once, for the Roncador and the tank alike)

The drill and station frameworks, the damage-control jobs, the gun crews and ballistics, the orders box, the interphone pattern (the
PCE's phone box generalised).

### New

- `src/m4a3/` with `src/m4a3.manifest`, `SIMS.add({ id: 'm4a3', ... })`, the menu card, the help, the bindings.
- **The battle area** (shared): high-resolution ground in tiles, the three boundary kinds, roads and lanes, villages, tombs, caves,
  paddies and terraces, the gorge and the ditch; its streaming and LOD; collision for ground vehicles and infantry.
- **Ground vehicle physics** (shared): tracked and wheeled bodies on the battle area's mesh; the Allied and Japanese trucks get it too.
- **Infantry** (shared): figures and AI for squads on both sides; it will serve the other simulators too (base guards, landing parties).
- **Models:** the M4A3(75)W exterior and interior (five stations, the .50 on its roof mount and stowage bracket, the coax and the bow ball
  mount), the M32 recovery vehicle, the Type 97 Shinhoto Chi-Ha, the Type 1 47 mm AT gun, a 75 mm field gun, an Okinawan house, coral
  walls, a fukugi belt, a turtle-back tomb, cave mouths and fire ports, the camp's tents, revetments and dumps, the range's targets. Each
  with its blueprint and measurements.
- The fire commands, the interphone, the tank-infantry phone, the penetration rule, the crew's casualties.

---

## 14. Phases

Each phase ends with a playable build, screenshots of everything visual, blueprints updated, the quick tests, and the sync.

| Phase | Content | Playable at the end |
|---|---|---|
| **T0 Groundwork** | The shared frameworks moved (if the Roncador has not done it); `src/m4a3` stub; menu card | Kamome's menu offers the tank; she stands at Camp Buckner |
| **T1 The ground** | The battle area: tiles, LOD, coral walls, windbreaks, paddies, roads, ground types; first round Camp Buckner, the range and the course | Drive over the new ground in the outside view |
| **T2 Driving** | Track physics, the driver's station (4) and its interior, the driving drills | The driving drills |
| **T3 Gunnery** | Gun, ammunition, ballistics, sights; stations 2 and 3; Buckner Range and the gunnery drills; the fire commands | The gunnery drills |
| **T4 Command** | Station 1 (head out and buttoned, the .50), station 5 (bow gun), the interphone, the radio, the orders box | Crew drills |
| **T5 The enemy** | 47 mm guns, caves, Chi-Ha and Ha-Go, tank-hunters, mines, mortars, the penetration rule, damage, bail out | The range's hidden gun and practice cave; mission 2 without infantry |
| **T6 Infantry** | Squads on both sides, the tank-infantry phone, Blowtorch and Corkscrew | Missions 2-3 |
| **T7 The island** | The whole battle area: villages, tombs, Kagi Ridge, Hill 56, the gorge and bridge, the ditch, Beach Orange, the enemy line | Missions 1-10 |
| **T8 Campaign and links** | The campaign, missions 11-12, PCE escort of the LCMs and gunfire, P-51 close air support | The full game |
| **T9 Polish** | Sounds (engine, tracks, the gun in the turret, hits ringing on the armour), Hardcore details, help text | Release candidate |

T1 to T5 go in order; T6 and T7 can overlap.

---

## 15. Open questions for the user

Answered on 2026-11-23: the Pacific; coral walls instead of hedgerows; locations and names chosen by this plan; the M4A3 with the 75 mm,
the .50 on the turret and the .30s inside. Still open:

1. **Version line:** "M4A3 0.01" with a Kamome bump on each change?
2. **First playable:** the driver (T2) first, or the gunner (T3) first?
3. **How much infantry:** squads as full figures with their own AI (planned), or a lighter version first (squads as groups)?
4. **A flame tank** (the POA-CWS-H1 Sherman used on Okinawa) as a second vehicle later, for Blowtorch?

---

## 16. Sources (links)

- Huber, *Japan's Battle of Okinawa*: the user's `References/Leavenworth papers No. 18 ... Huber.pdf`; online https://www.ibiblio.org/hyperwar/USA/CSI/CSI-Okinawa/ and https://apps.dtic.mil/sti/tr/pdf/ADA322748.pdf
- Sherman machine guns: https://www.theshermantank.com/about/sherman-lee-and-variants-gun-data/m4-sherman-tank-small-arms-page-the-machineguns-and-their-mounts-used-on-the-m4-series/
- FM 17-12 Tank Gunnery 1943: https://www.theshermantank.com/downloads-page-the-place-for-things-to-big-to-post-like-manuals/
- FM 17-30 Tank Platoon 1942: https://ia902706.us.archive.org/2/items/FM17-301942/FM17-301942.pdf ; FM list: https://afvdatabase.com/bibliography.html
- TM 9-759 Medium Tank M4A3: https://webarchive.library.unt.edu/web/20121010045806/http:/usacac.army.mil/cac2/cgsc/carl/wwIItms/TM9_759_1942.pdf
- TM 9-752: https://www.ibiblio.org/hyperwar/USA/ref/TM/pdfs/TM9-752.pdf
- M3 gun data: https://www.theshermantank.com/wp-content/uploads/M3-gun-Data.pdf ; 75 mm gun M2-M6: https://en.wikipedia.org/wiki/75_mm_gun_M2%E2%80%93M6 ; gun database: https://wwiitanks.co.uk/FORM-Gun_Data.php?I=238
- Sherman fire control: https://www.theshermantank.com/?p=4714 ; crew: https://theshermantank.com/?p=137 ; tank-infantry communication: https://www.theshermantank.com/?p=164
- M4 Sherman: https://wikipedia.com/wiki/M4A3E2
- Okinawa: The Last Battle, ch. V: https://ibiblio.org/hyperwar/USA/USA-P-Okinawa/USA-P-Okinawa-5.html
- 6th Marine Division SAR (phase 4): https://www.usmcu.edu/Portals/218/Okinawa-6th%20Marine%20Division%20Special%20Action%20Report%2C%20Phase%204%2C%20Volume%204%2C%2030%20June%201945_PART%20B.pdf
- Marines at Okinawa (Alexander): https://www.nps.gov/parkhistory/online_books/wapa/extcontent/usmc/pcn-190-003135-00/sec6a.htm ; Marine tanks at Okinawa: https://nationalinterest.org/node/138897
- Separate tank battalions on Okinawa: https://erenow.org/ww/infantrys-armor-u-s-armys-separate-tank-battalions-in-world-war-ii/16.php
- Type 1 47 mm AT gun: https://en.wikipedia.org/wiki/Type_1_47_mm_anti-tank_gun ; Type 97 Shinhoto Chi-Ha: https://en.wikipedia.org/wiki/Type_97_ShinH%C5%8Dt%C5%8D_Chi-Ha_medium_tank
- Fukugi villages: https://www.jstage.jst.go.jp/article/kaiganrin/10/2/10_79/_article/-char/en ; https://ethnobiomed.biomedcentral.com/articles/10.1186/s13002-021-00434-3/figures/2
