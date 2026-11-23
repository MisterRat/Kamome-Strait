# M4A3 Sherman: Tank Simulator Plan

Written 2026-11-23 by the Kamome Strait session, at the user's request: "start bringing an in depth plans for tank simulation. find the
resources. Plan everything, including allied and enemy bases, hedgerows, road, and fields to fight in. which stations to include and what
they will looks like, how they will be played in training and live missions." Nothing in this plan is built yet. It is a proposal for
the user to approve or change; the open questions are in section 15.

The working rules in `PLAN_Kamome-Strait.md` section 7 apply unchanged: versions on every change, screenshots of visual changes, no
floating parts, blueprints, quick tests, shared code in `src/shared`, the single-page games kept, and a sync to `C:\Code\Kamome-Strait`.
`PLAN_Roncador_SS-301.md` section 11 moves the PCE's drill and station frameworks to `src/shared`; this plan relies on that move too.
Whichever simulator is started first does that move.

---

## 1. The idea in one paragraph

The player is the crew of a US M4A3 Sherman medium tank in the Kamome Strait world, mid-1945. The tank comes ashore from an LCM at the
Allied beachhead on the long island. It works with an infantry company through farmland of small fields boxed in by hedgerow banks,
sunken lanes, coral-walled villages under windbreak trees, rice paddies and terraced slopes. In front is a Japanese defence of hidden
47 mm anti-tank guns, mines, dug-in Chi-Ha tanks, tank-hunting squads with satchel charges and lunge mines, and caves in the ridges.
As in PCE-842, the player can take any of the five crew stations and the AI crew mans the rest. One game can be played as the
commander fighting the tank, as the gunner laying the 75 mm, or as the driver picking a way along a hedgerow.

### Why the Pacific, and why hedgerows there

The world is a South Pacific strait with a Japanese enemy, so the tank fights there. That is also history: Shermans were the
infantry's close-support weapon on Okinawa, Iwo Jima, Luzon and the other islands in 1945. Their 75 mm fire knocked out Japanese pillboxes and road blocks
on Okinawa. The farmland the user asks for existed there too: Kakazu was
a town of tiled houses walled in by hedges and stone, each one a ready-made strongpoint,
and the ground near Uchitomari and Ginowan was paddy and terraced fields that funnelled the tanks and blocked wide flank moves.
Okinawan villages were planted with windbreaks: a traditional village is wrapped in several belts of planted trees,
and the houses had rows of fukugi trees and coral stone walls around them.

The field hedgerows this plan models, earth banks with dense hedges on top, are the Normandy bocage. Normandy fields were
boxed in by dense hedges of hawthorn, bramble and small trees, up to about 15 ft high, growing on earth banks several feet thick.
The plan puts that kind of bank-and-hedge field boundary into the long island's farmland, mixed with Okinawan coral walls and windbreak
belts. It is a game world, not a copy of either place. Section 15 asks the user whether that blend is right, or whether a separate
Normandy map with a German enemy is wanted later. Section 13 shows how the engine can carry either.

---

## 2. Sources

| Source | What it gives us |
|---|---|
| **FM 17-12, Armored Force Field Manual: Tank Gunnery, 22 April 1943** (War Department; a copy is on theshermantank.com's downloads page) | The gunner's and commander's procedure for the 75 mm M3: fire commands, sight use, range estimation, adjustment by observation of tracer and burst, battle sight, machine-gun fire. By the site's account it covers nearly everything about firing the Sherman's 75 mm. To read in full before phase T2. |
| **FM 17-30 Tank Platoon (22 Oct 1942)** and **FM 17-33 Tank Battalion (19 Dec 1944)** (archive.org; afvdatabase bibliography) | Platoon formations, movement by bounds, overwatch, signals; the battalion working with infantry. The 1942 FM 17-30 is on archive.org. |
| **TM 9-759 Medium Tank M4A3** (1942, Combined Arms Research Library) | The vehicle: the crew seats, periscopes, hatches, controls, instruments. For example, the assistant driver's and the gunner's periscopes carry telescopes, the other three are plain vision periscopes. |
| **TM 9-752** (HyperWar) and the **M3 gun data sheet** (theshermantank.com) | Gun, ammunition and ballistics. |
| **Wikipedia, 75 mm gun M2-M6; WWII Vehicle and Gun Database** | Ammunition figures: the M61 APC left the M3 at about 617 m/s and went through about 81 mm of plate at 500 yd, face-on; the M48 HE came with a normal and a supercharge propellant load. A per-range table of flight time and penetration for the M3 (wwiitanks.co.uk) gives the ballistic test values. |
| **theshermantank.com** (crew stations, fire control, turret, communications) | The commander sat at the turret's right rear, behind the gunner; the loader on the left of the gun; the gunner's late-war periscope sight held two telescopes, each with its own reticle; the loader had his own rotating periscope, and so did the commander in his hatch; the driver's hood stowage. Tank-infantry communication: the tank sets and the infantry's sets worked on different bands, so they could not talk. |
| **Wikipedia, M4 Sherman** | Crew of 5 (commander, gunner, loader, driver, assistant driver and bow gunner); the gyrostabilizer was too coarse to shoot on the move, but kept the gun near the target so she could fire soon after halting. |
| **Okinawa: The Last Battle** (US Army in WWII, ch. V, HyperWar) | The farmland battlefield and how the fighting went: the Kakazu hill mass and gorge, rice paddies and terraces, walled towns, tank ditches, mines. Japanese doctrine wanted hidden guns to open up by surprise at short range. One hidden 47 mm gun near Mashiki fired some 20 rounds and burned three medium tanks. At Red Hill Japanese soldiers went at the tanks with satchel charges and burning rags; the aim was to cut the tanks off from their infantry with sudden fire, then close in. |
| **6th Marine Division Special Action Reports, Okinawa** (USMC University) | Japanese tank-hunters waited hidden until a tank was level with them, then ran out with a satchel charge, throwing it or jamming it into the running gear; the radio organisation of the tank battalion (company and platoon frequencies). |
| **Huber, *Japan's Battle of Okinawa*** (Leavenworth Papers 18, CGSC) | Its chapters "Okinawa Terrain", "Tanks Versus Caves", "Japanese Antitank Tactics" and "American Anticave Tactics". I could not open the chapter text this session (the fetch waited for an approval nobody answered); read before phase T5. |
| **Marine tank sources** (Alexander, *The Final Campaign*, NPS; Gilbert; Zaloga) | Tank telephones on the hull, the infantry covering the tanks; the 1st Tank Battalion's M4A2s and the 6th's M4A3s. Marine tank-infantry teamwork cut tank losses: with those tactics and open ground, close assaults cost the Marines almost no tanks. |
| **Japanese weapons** (Wikipedia; Lone Sentry; Pacific Wrecks) | Type 1 47 mm AT gun (about 2,300 were built); the Type 97 Shinhoto Chi-Ha with the 47 mm tank gun, which could hurt light tanks, and a Sherman from the side or the rear. |
| **Hedgerow fighting** (Wikipedia "Rhino tank"; US National Museum of the US Army; dday-overlord.com) | Field size (usually under about 90 m on a side); hedges of about 5 m (about five metres on average in 1944); the Culin cutter; the tactic 'one squad, one tank, one field'. |
| **The user's references** (`References/`) | M4A3 Sherman.jpg, M3A1 Half-Track.jpg, GMC CCKW 353.jpg, M2 Cletrac.jpg, Type 95 Ha-Go.jpg, Bluejacket's Manuals; `docs/research_1945_bases.md` already gives the M4A3's size (5.90 x 2.62 x 2.74 m) and the Ha-Go's. |

---

## 3. The tank

M4A3(75)W, the Ford GAA V-8 Sherman with the 75 mm M3 gun and wet ammunition stowage, as used by the 6th Tank Battalion on Okinawa.

| System | Real | What the game models |
|---|---|---|
| Size and weight | 5.90 x 2.62 x 2.74 m; about 31 t | Its body for collision, crossing (trench, step), bogging and toppling |
| Engine and drive | Ford GAA V-8, 500 hp gasoline; 5-speed synchromesh gearbox and reverse; controlled differential steered by two laterals; about 26 mph on roads | Engine rpm and torque, gears (the driver shifts, or automatic in game mode), lateral steering (one track braked), braking, fuel (range), engine heat; the sounds |
| Running gear | VVSS, three bogies a side, 16.5 in tracks | Per-wheel ground contact on the terrain mesh, pitch and roll, track tension; a track thrown by a mine or a hard turn on rock |
| Armour | Glacis 2.5 in at 47 deg (the wet hull), turret front 3 in, sides 1.5 in, rear 1.5 in, roof and belly thin | An armour map by zone (thickness, slope) for the penetration rule (section 8); the belly exposed when she climbs a bank |
| Main gun | 75 mm M3 L/40 in the M34A1 mount; M61 APC, M48 HE (normal and supercharge), M89 smoke, M64 WP; about 104 rounds | The shared shell ballistics with the M3's table; the ready rack and the wet racks under the floor; loading time by where the round comes from |
| Secondary | .30 cal coaxial; .30 cal bow MG; .50 cal M2 on the turret roof | Belts, rates of fire, the .50 fired by the commander head out |
| Fire control | Gunner: periscope M4A1 with telescope M38A2 and the direct telescope M70F; power and hand traverse; elevation handwheel; foot switches; the one-axis gyrostabilizer | Two sight views (periscope 1.44x wide, telescope 3x), the reticle with range lines, traverse and elevation rates, the stabilizer holding elevation on the move (roughly) |
| Vision | Commander's vision cupola (M4A3 late) or split hatch with a rotating periscope; M6 periscopes for the others | Each station's view slits and periscopes; head out or buttoned up |
| Radio | SCR-508/528 FM set in the turret bustle; interphone for the crew; an external tank-infantry telephone on the rear hull | The company and platoon nets; the crew interphone (the orders between stations); the infantry phone |
| Smoke and extras | 2 in mortar (smoke) in the turret roof; a hedgerow cutter (Culin type) optional | Smoke screens; breaching banks |

---

## 4. The battlefield: the long island

The long island runs north-south through the Kamome world. The IJN base (Port Ugaki) is on its north tip, and Airbase Kakuta is
10.8 km west-south-west of the port, on low inland ground. The tank simulator fights over the island's southern and central farmland,
and ends at Kakuta and the ridges in front of Port Ugaki. The user chooses the exact places on the briefing map, as for Halsey (section 15).

### 4.1 A ground-level world

The present terrain is built for an aircraft and ships: the far world's chunks have about 100 m between height samples, and the
home map is built for a pilot's view. A tank crew looks out at two metres above the ground at hedges 30 m away. So the tank
simulator adds a **battle area**: a region about 6 x 8 km, cut into `WH` like the far sites' pads, built at 2 m resolution in 64 m tiles
that stream in around the tank (near tiles full detail, farther tiles simpler, beyond 3 km the existing far world). It carries:

- **Field boundaries** (section 4.2) as real geometry and collision, not texture.
- **Roads and lanes**: a coral road (the island's main road, two-lane, 6 m), farm tracks (3 m), sunken lanes between banks.
- **Fields**: cane fields (tall: hide infantry and guns), sweet potato and vegetable plots (low), rice paddies (water and mud: a tank
  bogs), terraces on slopes (steps of 1-2 m), grass and scrub on the ridges.
- **Villages**: houses under tile roofs, each plot boxed by a coral stone wall with a windbreak tree belt (fukugi), and a lane grid
  between them.
- **Tombs**: the big Okinawan turtle-back family tombs on the hill slopes, which the Japanese used as strongpoints (Tomb Hill).
- **Ridges and caves**: limestone ridges with cave mouths and firing ports (the reverse-slope defence).
- **Gorges, ditches and minefields**: a brush-filled gorge (impassable to the tank), an anti-tank ditch with wire.

The battle area is a shared module: it is ground, so the P-51 strafes the same hedges and the PCE's guns can reach the shore part of it.

### 4.2 Hedgerows

Every field boundary is one of four kinds, chosen per edge by the region generator and fixed by position (like the hamlets):

| Kind | Build | What it does to a tank |
|---|---|---|
| **Bank hedge** (bocage type) | Earth bank 1-1.5 m high, 1-3 m thick at the base, on it a hedge of shrubs and small trees 3-5 m tall; gaps at gates | Blocks sight. A tank can climb it slowly, nose high, belly exposed for 2-4 s (the hidden gun's chance); with a hedgerow cutter or an engineer charge she breaks through low. Infantry move along it in cover |
| **Coral wall** | Rough coral blocks 1-1.8 m high, 0.6-1 m thick; around houses and some fields | Stops infantry and hides them; a tank can push a short stretch down (slow, noisy) or knock a gap with HE |
| **Windbreak belt** | Two or three rows of fukugi trees, 6-10 m tall, dense to the ground, around village plots | Blocks sight completely; a tank cannot pass between the trunks except at a lane |
| **Paddy dyke** | Low earth dyke 0.5 m, water both sides | Low, but the paddy on either side bogs a tank (section 6) |

Gates and lane mouths are the places a tank can cross easily, and the defender knows it: the AT guns are sited on them (section 9).
Fields are small: 60-120 m a side in the hedgerow country, as in Normandy, larger in the cane land. A field is a "box" for the tank and its
squad: the tactic "one squad, one tank, one field" is how the training teaches it (section 11).

### 4.3 Roads

The main coral road runs the length of the battle area from the beachhead to Kakuta, with a bridge over the gorge (a target, and a
mission: section 12). Farm tracks link the villages and fields; sunken lanes run between banks, a metre or two below the fields, so a
tank in one sees nothing but the banks. Road traffic is part of the world: CCKW trucks, jeeps and half-tracks on the Allied side
(their models exist), Type 94 trucks and Kurogane cars on the Japanese side.

### 4.4 Allied bases

| Base | Where | What it is | How it is played |
|---|---|---|---|
| **Beachhead "Blue"** | A beach on the long island's south-west shore, inside a reef gap | Pontoon causeway, LCMs coming in from Depot Nimitz with one Sherman each (an LCM-3 carries one medium tank), dumps of ammunition and fuel, a CP tent, an aid station | The landing (mission 1), resupply (drive back for ammunition and fuel) |
| **Camp Buckner tank park** (after Lt Gen Simon B. Buckner, Tenth Army, Okinawa; the name is a proposal) | 2-3 km inland from the beachhead | The tank battalion's park: tanks in revetments, the maintenance tent with an M32 recovery vehicle and an A-frame, the ordnance and fuel dumps (jerrycans, 75 mm crates), a CCKW fuel truck, the company CP | Start and end of every live mission; repair and rearm between missions; the training ground next to it |
| **Gunnery range** | Beside the tank park, toward the sea | Firing points, target boards and hulks at 400-1,500 yd, a moving target on a cable sled, range flags and a tower | Gunnery training (section 11) |
| **Driving course** | Behind the tank park | A course with a ditch, a step, a slope, a bank hedge with a gap, a paddy, a coral wall, a narrow lane | Driver training |
| **Forward lines** | Moving: the front line advances as missions are won | Infantry foxholes and a battalion CP, a 4.2 in mortar platoon, an aid station, a jeep track | Where live missions start; the infantry company's commander is here |

### 4.5 Enemy bases and positions

| Position | Where | What it is |
|---|---|---|
| **The outpost line** | Across the island's waist | Rifle pits and MG nests in the hedges, a mined road block, one 47 mm gun on the road |
| **The main line ("Ushijima Line", name a proposal)** | Along a limestone ridge with a village in front | Reverse-slope caves and tunnels, mortar pits behind the crest, 47 mm guns sited on the gates and lanes (flanking fire, never frontal), an anti-tank ditch with wire and mines across the open ground, tombs used as pillboxes, a dug-in Chi-Ha as a pillbox |
| **The tank company** | A palm grove behind the ridge | Type 97 Shinhoto Chi-Ha and Type 95 Ha-Go (the Ha-Go model exists) in camouflaged revetments; the counterattack force |
| **Artillery** | Behind the ridge | A battery of 75 mm field guns and a 150 mm howitzer firing on registered points (fields, crossroads) by observers on the ridge |
| **Airbase Kakuta** (exists) | Inland, west-south-west of Port Ugaki | The final objective: its AA guns, revetments, hangars and the guns that cover the approaches |
| **Port Ugaki** (exists) | North tip | Its coast guns can fire at tanks on the shore road within reach (ROE.reach) |

---

## 5. Stations

The PCE's pattern carries over: numbered stations on keys 1-5 (and 6 for the outside view), a first-person eye at each, the live
instruments drawn where they are, the AI crew at every station the player is not at, the interphone for the orders between them.
The interior is one model built from the TM's drawings and photographs (blueprints and measurements kept, as for every model).

### 5.1 Station 1: Commander

- **Where:** right rear of the turret, standing on the floor or the seat, head in the cupola, or head out.
- **What it looks like:** the cupola's ring of vision blocks (or the split hatch and a rotating M6 periscope), the turret's interior
  below him (breech, the gunner's back, the loader), the radio in the bustle behind, the .50 on the roof when head out, binoculars.
  Head out: the world all round, the hatch ring at chest height, the .50's spade grips.
- **What the player does:** watches, finds targets, gives the fire commands to the gunner (or lays the gun himself with the
  commander's override traverse), orders the driver (the interphone: "driver, move out", "left", "right", "stop", "back up",
  "gear", "speed"), talks on the radio to the platoon and the infantry, fires the .50 head out, decides head out or buttoned (head out
  sees far more and is the most dangerous place in the tank), calls for artillery and air support through the infantry or the net.
- **Orders box:** the PCE's Orders window reused: fire commands as a menu (target, ammunition, range), driver's orders, radio calls,
  smoke, hold fire, priorities.

### 5.2 Station 2: Gunner

- **Where:** right front of the turret, seated, face at the sight.
- **What it looks like:** two sight views switched by a key. The periscope gives a wide 1.44x picture with the ballistic reticle, the
  direct telescope M70F a 3x picture with range lines for each ammunition. Around them, when he looks up: the power traverse handle,
  the elevation handwheel, the azimuth indicator, the firing switches, the stabilizer switch.
- **What the player does:** lays the gun on the commander's target (traverse with the handle: speed by deflection; fine with the hand
  wheel), sets range on the reticle line for the ammunition loaded, fires the 75 or the coax, senses the shot (tracer, burst, dust) and
  corrects (FM 17-12's adjustment), keeps the stabilizer on the move. In game mode the range lines are labelled and a lead mark is
  shown on moving targets; Hardcore, the bare reticle.

### 5.3 Station 3: Loader

- **Where:** left of the gun, standing on the turret basket floor.
- **What it looks like:** the breech with its opening lever, the ready rack in the turret, the wet racks under the floor, the coax
  feed, the radio, a periscope.
- **What the player does:** loads what is called (AP, HE, smoke, WP) from the nearest rack: the time depends on where the round is
  (the ready rack quick, under the floor slow, with the turret turned to reach it), clears misfires, feeds the coax, keeps the count,
  refills the ready rack in a lull. Game mode: a mini-game of a few keys. Hardcore: each round is lifted and rammed, and a wrong round
  loaded stays in the gun until fired.

### 5.4 Station 4: Driver

- **Where:** left front of the hull.
- **What it looks like:** head out, the hatch rim and the glacis, the road ahead; buttoned up, a single M6 periscope's narrow view.
  Inside: the two lateral levers, the clutch and accelerator pedals, the gear lever, the instrument panel (rpm, speed, oil pressure, temperature,
  fuel, ammeter), the hand throttle, the siren and lights switches.
- **What the player does:** drives on the commander's orders or his own route: gears, revs, laterals to steer, the clutch; reads the
  ground (a bank to climb, a paddy to avoid, a lane too narrow); keeps her hull-down when told; watches the engine temperature.
  Game mode: automatic gears and a simple steer; Hardcore: the gearbox, the clutch, stalling, a thrown track from a careless turn.

### 5.5 Station 5: Assistant driver / bow gunner

- **Where:** right front of the hull.
- **What it looks like:** the .30 cal bow MG in its ball mount with the M6 periscope above it, the ammunition boxes, the second set
  of driving controls (in some marks), the hull radio for a command tank.
- **What the player does:** fires the bow MG at infantry in the hedges ahead (hosing the hedgerow before the tank crosses it), spots
  for the driver, takes over driving if the driver is hit, hands ammunition forward.

### 5.6 Station 6: Outside

A third-person view of the tank (the existing chase and orbit views) for game mode and for the infantry's eye: where the tank is
in the field, where the squad is. In Hardcore the outside view is off in live missions, as in the PCE.

### 5.7 Moving between stations

One key jumps, as in the PCE. Hardcore keeps the PCE's rule that a station has its own body: the commander's head out can be hit; a
crewman wounded leaves his station to the AI only if the AI has someone left to put there (a crew of fewer than five works slower:
the commander loads, the bow gunner drives).

---

## 6. Moving over the ground

- **Ground types** each with a bearing strength and a rolling resistance: road, track, dry field, cane, paddy (mud), sand, coral rock,
  scrub. Rain (the existing weather) softens fields and turns paddies to a bog; a bogged tank needs a tow (the M32) or her own tricks.
- **Slopes and steps:** the climb limit (about 60%), steps up to 0.6 m, trenches up to 2.3 m; a bank hedge is a step plus a slope, and
  climbing it lifts her bow until she tips over the top.
- **Hedges and walls:** collision with the bank, the hedge's resistance; a gap made when she pushes through, which stays.
- **Mines:** a mine under a track throws it and stops her; the bow wheels and bogies damaged.
- The **physics** extends the ship and car code in `src/shared`: a rigid body on per-wheel springs over the battle area's mesh.

---

## 7. Fighting the tank: the crew drill

### 7.1 Fire commands

The commander's fire command follows FM 17-12 (to be checked word for word against the 1943 manual before phase T2): the alert
("GUNNER"), the ammunition ("AP" / "HE"), the target ("TANK" / "GUN" / "TROOPS"), the direction (traverse, or "STEADY ON"), the range
("EIGHT HUNDRED"), the command to fire ("FIRE"). The gunner answers "ON THE WAY", the commander senses the burst and corrects ("UP
TWO", "LEFT ONE", "TARGET"). The loader calls "UP" when the gun is loaded. In the game every station hears these on the interphone; the
player at any station does his part of it, and the AI does the rest at the same cadence.

### 7.2 Tactics the game teaches and scores

- **Tank and infantry together:** infantry keep the tank-hunters off; the tank kills what stops the infantry. The tank never goes
  through a gate or a lane mouth without the squad having looked at the next field. Separated, the tank is in danger. That is what the
  Japanese doctrine tried to do: to cut the tanks off from their infantry with sudden fire, then close in.
- **Hedgerows:** the bow MG and the coax hose the far hedge; HE into the corners where guns hide; the tank crosses at a new gap
  (cutter or engineers), not at the gate.
- **Hull-down and overwatch:** one tank moves while one covers; firing from behind a bank with only the turret showing.
- **Against caves:** "corkscrew and blowtorch": the tank fires into the cave mouth to keep the defenders down while the infantry close
  with flamethrowers and charges.
- **Against a hidden gun:** turn the thick front to it, smoke, reverse out, call fire.

---

## 8. Hits and damage

- **Shells:** the shared ballistics (`GSPEC`'s pattern) with the 75 mm M3's flight times; the Japanese 47 mm, 37 mm, 75 mm field gun.
- **Penetration:** thickness along the shell's path (the plate's slope and the angle of the hit) against the shell's penetration at
  that range, with a band of chance either side (the tables are 50% values). Not penetrated: a ringing hit, maybe a broken periscope, a
  jammed turret, a frightened crew.
- **Penetrated:** what is behind: a crewman, the gun, the radio, the engine, the fuel, the ammunition (wet stowage lowers the chance
  of an ammunition fire); fire inside: bail out. Each part has a damage-control job (the PCE's `DCX_K` jobs reused): a jammed turret
  ring freed by hand, a radio switched to the spare set, a fire put out with the extinguishers.
- **Close assault:** a satchel charge on the deck or in the running gear, a lunge mine on the side: a big local charge that can throw a
  track or open the thin armour; the defence is the infantry, the coax and bow MG, the .50, buttoning up, and another tank covering.
- **Mines:** a thrown track and damaged bogies; a belly mine through the floor.

---

## 9. The enemy

| Enemy | Behaviour |
|---|---|
| **Type 1 47 mm AT gun** | Dug in and camouflaged in a hedge or a tomb, sited for a flank shot on a gate or a lane; holds fire until a tank is close and side-on; fires fast; moves only if it must. Its first shot decides much: the game gives it a chance to miss, and gives the crew the muzzle flash and dust to spot it |
| **Type 97 Shinhoto Chi-Ha / Type 95 Ha-Go** | Dug in as pillboxes, or a counterattack of 3-5 tanks with infantry at dusk; the 47 mm is dangerous to a Sherman's side and rear; the 37 mm of the Ha-Go only at very close range |
| **Tank-hunting squads** | Hide in cane, ditches and hedges near a gate; wait for a tank separated from its infantry; rush with satchel charges and lunge mines; one man may throw himself under the tank. The coax and bow MG, the infantry and a covering tank are the defence |
| **Riflemen and MGs** | In the hedges and walls; pin the US infantry; fire at a commander head out |
| **Mortars and artillery** | Registered on crossroads, gates and fields; called by observers on the ridges; a hit on the deck damages the engine, the tracks and anyone head out |
| **Mines and obstacles** | Belts across open ground and roads; tank ditch with wire; log road blocks covered by fire |
| **Aircraft** | Rare: a Ki-84 strafing; the AIRSUP rules of the PCE apply (only when called by a unit under fire) |

Each one reads the sighting and alert rules already in the game (SIGHT, ROE): a position that has seen the tank warns the others near it.

---

## 10. Friendly forces and support

- **The infantry company:** squads of 12 that move with the tank: crossing a field by bounds, clearing a hedge, calling the tank onto a
  target by the tank-infantry telephone on the rear hull (an infantryman's voice on the interphone: "tank, bunker in the far corner,
  left of the tree, fire"). Their AI is new and the biggest piece of work in this plan (section 14).
- **The platoon:** four other Shermans under the platoon leader (AI), on the platoon net; formations (column, wedge, line), overwatch.
- **Artillery and mortars:** called through the infantry or the net; the 4.2 in mortars smoke and HE.
- **Air support:** P-51s called by the tank radio (the shared AIRSUP's US side: "PCE 842" becomes "TANK" in the calls), with the P-51
  player able to answer the call in Kamome Strait (section 12).
- **Engineers:** with demolitions for hedges, walls and cave mouths; mine clearing (a lane marked with tape).
- **Recovery:** the M32 tows a disabled tank back to the park.

---

## 11. Training

Training uses the PCE's drill framework (moved to shared: `DRILLP`, `drillReport`, the Orders and Drill boxes side by side, the picture
box), on the gunnery range, the driving course and the fields next to Camp Buckner, which the enemy never reaches. Each drill names
the manual paragraph it teaches.

| Station | Drill | What it trains | Score |
|---|---|---|---|
| 4 Driver | **Driving course** | Gears and laterals through the course: ditch, step, slope, gap in a bank, coral wall, paddy edge, narrow lane | Time, collisions, stalls, thrown tracks |
| 4 | **Hull-down** | Bring her up behind a bank until only the turret shows, on the commander's word | Hull exposure, time |
| 4 | **Buttoned up** | Drive the course by the periscope only | Time, collisions |
| 2 Gunner | **Range estimation** | Read ranges by the reticle and the target's size on the range | Range error |
| 2 | **Stationary targets** | Fire on boards at 400-1,500 yd, sensing and correcting | Hits, rounds used, time to first hit |
| 2 | **Moving target** | The sled target crossing; lead | Hits |
| 2 | **Battle sight** | Fast engagement at short range on surprise targets | Time to hit |
| 2 | **Stabilizer** | Keep the gun on a target while the tank moves, then fire on the halt | Lay error at the halt, time to fire |
| 3 Loader | **Loading drill** | Called rounds against the clock, from each rack; a misfire | Time per round, wrong rounds |
| 5 Bow gunner | **Hedgerow fire** | Hose the far hedge in bursts while the tank crosses | Coverage, ammunition |
| 1 Commander | **Fire commands** | Give the command in order (alert, ammunition, target, direction, range, fire) and correct | Order and speed; gunner's hits |
| 1 | **Driving orders** | Bring the tank across country by orders to an AI driver | Time, exposure |
| 1 | **Spot the gun** | A hidden 47 mm opens fire on the range: find the flash, turn the front to it, smoke, back out, engage | Time to spot, hits taken |
| All | **Crew drill** | A full engagement on the range: every station's part, the AI doing the others | The crew report |
| All | **Bail out** | Fire inside: out by the hatches in order, under the timer | Time; crew saved |
| 1 + infantry | **Tank and infantry** | One squad, one tank, one field: the squad leads, the tank follows and fires on the phone's calls | Squad losses, time, enemy positions cleared |
| 1 | **Radio procedure** | Report, call for fire, call for air support in the right form | Items right |

Each station has a qualification card, as in the Roncador plan; all live missions are open in free play.

---

## 12. Live missions

| # | Mission | What happens |
|---|---|---|
| 1 | **The landing** | Ashore from an LCM at Beachhead Blue (the PCE may escort the LCMs in Kamome Strait); off the beach, through the reef gap, to the assembly area; a mined beach exit |
| 2 | **Hedgerow advance** | With an infantry company across six fields to a road junction; MGs in the hedges, one 47 mm on a gate, tank-hunters in the cane |
| 3 | **The village** | Clear a coral-walled village under its windbreak trees, lane by lane, with the squads; houses used as strongpoints |
| 4 | **Tomb Hill** | Support the attack on a hill of tombs and caves: corkscrew and blowtorch with the engineers |
| 5 | **The ditch** | A tank ditch and minefield in front of the ridge: escort the engineers who bridge it, under artillery |
| 6 | **Counterattack at dusk** | Chi-Ha tanks and infantry come out of the palm grove; hold the line with the platoon |
| 7 | **The bridge** | Take the coral road's bridge over the gorge before it is blown |
| 8 | **Recovery** | Get to a disabled tank in no man's land and tow it back, covered by smoke |
| 9 | **Kakuta** | The final attack on the airbase with the battalion and air support |
| 10 | **Rain** | Any of the above in the rains: paddies bog, sight shortens, the infantry slow |

A **campaign** links them: the front line moves as missions are won, damaged tanks come back from the park repaired or not, the crew
keeps its experience.

### Kamome Strait links

- **PCE-842 escorts the LCMs** to Beachhead Blue (a new PCE mission), and her guns can support the tanks on the shore road.
- **P-51 close air support:** the tank's call for air support brings P-51s (AI, or the P-51 player in Kamome Strait), with the tank
  marking the target with smoke (WP) as was done.
- **Roncador lifeguard** has no part here; the sighting reports (SIGHT) work on land too: a Japanese observer who sees the tank alerts
  the guns near him.

---

## 13. What is reused, what is new

### Reused as is

Terrain functions (`WH`, `H`), the far world and its rural network, weather and time of day, the ocean and the shore, `ROE`, `SIGHT`,
`AIRSUP`, `COAST`, the LCM-3, CCKW, jeep, half-track, Ha-Go, Type 94 and Kurogane models, the crews' figures, the minimap, the
briefing map tool, settings and Hardcore, the mission menu, the radio paper and its colours, the sound engine.

### Moved to `src/shared` (once, for the Roncador and the tank alike)

The drill and station frameworks, the damage-control jobs, the gun crews and ballistics, the orders box, the interphone pattern
(the PCE's phone box generalised).

### New

- `src/m4a3/` with `src/m4a3.manifest`, `SIMS.add({ id: 'm4a3', ... })`, the menu card, the help, the bindings.
- **The battle area** (shared): high-resolution ground in tiles, field boundaries, roads, villages, tombs, caves, paddies and terraces;
  its streaming and LOD; collision for ground vehicles and infantry.
- **Ground vehicle physics** (shared): tracked and wheeled bodies on the battle area's mesh; the Allied and Japanese trucks get it too
  (they drive the roads instead of fixed paths).
- **Infantry** (shared): figures and AI for squads on both sides; it will serve the other simulators too (the bases' guards, landing
  parties).
- **Models:** the M4A3(75)W exterior and its interior (5 stations), the M32 recovery vehicle, the Type 97 Shinhoto Chi-Ha, the Type 1
  47 mm AT gun, the 75 mm Type 90 field gun, an Okinawan house, a coral wall, a fukugi belt, a bank hedge, a turtle-back tomb, cave
  mouths, the tank park's tents, revetments and dumps, the gunnery range's targets. Each with its blueprint and measurements.
- The fire commands, the interphone, the tank-infantry phone, the penetration rule, the crew's casualties.

### A Normandy map later

The battle area is a generator with a region description (field size, boundary kinds and their mix, villages, ground types). A
Normandy region would be a new description, new house and church models and a German enemy (Pak 40, Panzer IV, Panzerfaust), with the
tank and its stations unchanged. That is a separate decision for the user (section 15).

---

## 14. Phases

Each phase ends with a playable build, screenshots of everything visual, blueprints updated, the quick tests, and the sync.

| Phase | Content | Playable at the end |
|---|---|---|
| **T0 Groundwork** | The shared frameworks moved (if the Roncador has not done it); `src/m4a3` stub; menu card | Kamome's menu offers the tank; she stands at the tank park |
| **T1 The ground** | The battle area: tiles, LOD, field boundaries (the four kinds), roads, ground types; a first region next to the tank park | Drive anywhere over the new ground in the outside view |
| **T2 Driving** | Track physics, the driver's station (4) and its interior, the driving course, the driving drills | The driving drills |
| **T3 Gunnery** | Gun, ammunition, ballistics, sights; stations 2 (gunner) and 3 (loader); the gunnery range and drills; the fire commands | The gunnery drills |
| **T4 Command** | Station 1 (commander, head out and buttoned), station 5 (bow gunner), the interphone, the radio, the orders box | Crew drills |
| **T5 The enemy** | 47 mm guns, Chi-Ha and Ha-Go, tank-hunters, mines, mortars, the penetration rule, damage, bail out | Fight on the range's "hidden gun" and the first hedgerow field |
| **T6 Infantry** | Squads on both sides, the tank-infantry phone, "one squad, one tank, one field" | Mission 2 |
| **T7 The island** | The whole battle area: villages, tombs, ridges and caves, the ditch, the bridge, Camp Buckner, Beachhead Blue, the enemy line | Missions 1-8 |
| **T8 Campaign and links** | The campaign, missions 9-10, PCE escort of the LCMs, P-51 close air support | The full game |
| **T9 Polish** | Sounds (the engine, the tracks, the gun in the turret, hits ringing on the armour), Hardcore details, help text | Release candidate |

T1 to T5 go in order; T6 and T7 can overlap.

---

## 15. Open questions for the user

1. **Pacific or Normandy:** the plan puts the tank on the long island against the Japanese, with bocage-type hedgerows blended into
   Okinawan farmland. Is that right, or do you want a separate Normandy map with Germans (or both, Normandy later)?
2. **Which Sherman:** the M4A3(75)W (Okinawa, 6th Tank Battalion) as planned, or the M4A3(105) howitzer tank or the 76 mm?
   A flame tank (the POA-CWS-H1 Sherman, Okinawa) as a second vehicle later?
3. **Where on the long island:** the beachhead, Camp Buckner and the battle area marked on the briefing map, as for Halsey.
4. **Names:** Camp Buckner, Beachhead Blue, the Ushijima Line: keep, or other names?
5. **Version line:** "M4A3 0.01" with a Kamome bump on each change?
6. **First playable:** the driver (T2) first, or the gunner (T3) first?
7. **How much infantry:** squads as full figures with their own AI (planned), or a lighter version first (squads as groups)?

---

## 16. Sources (links)

- FM 17-12 Tank Gunnery 1943: https://www.theshermantank.com/downloads-page-the-place-for-things-to-big-to-post-like-manuals/
- FM 17-30 Tank Platoon 1942: https://ia902706.us.archive.org/2/items/FM17-301942/FM17-301942.pdf
- FM list: https://afvdatabase.com/bibliography.html
- TM 9-759 Medium Tank M4A3: https://webarchive.library.unt.edu/web/20121010045806/http:/usacac.army.mil/cac2/cgsc/carl/wwIItms/TM9_759_1942.pdf
- TM 9-752: https://www.ibiblio.org/hyperwar/USA/ref/TM/pdfs/TM9-752.pdf
- M3 gun data: https://www.theshermantank.com/wp-content/uploads/M3-gun-Data.pdf
- 75 mm gun M2-M6: https://en.wikipedia.org/wiki/75_mm_gun_M2%E2%80%93M6
- Gun database (M3 75 mm): https://wwiitanks.co.uk/FORM-Gun_Data.php?I=238
- Sherman fire control: https://www.theshermantank.com/?p=4714 ; crew: https://theshermantank.com/?p=137 ; tank-infantry communication: https://www.theshermantank.com/?p=164
- M4 Sherman: https://wikipedia.com/wiki/M4A3E2
- Okinawa: The Last Battle, ch. V: https://ibiblio.org/hyperwar/USA/USA-P-Okinawa/USA-P-Okinawa-5.html
- 6th Marine Division SAR (phase 4): https://www.usmcu.edu/Portals/218/Okinawa-6th%20Marine%20Division%20Special%20Action%20Report%2C%20Phase%204%2C%20Volume%204%2C%2030%20June%201945_PART%20B.pdf
- Huber, Japan's Battle of Okinawa: https://www.ibiblio.org/hyperwar/USA/CSI/CSI-Okinawa/ and https://apps.dtic.mil/sti/tr/pdf/ADA322748.pdf
- Marines at Okinawa (Alexander): https://www.nps.gov/parkhistory/online_books/wapa/extcontent/usmc/pcn-190-003135-00/sec6a.htm
- Marine tanks at Okinawa: https://nationalinterest.org/node/138897
- Separate tank battalions on Okinawa: https://erenow.org/ww/infantrys-armor-u-s-armys-separate-tank-battalions-in-world-war-ii/16.php
- Type 1 47 mm AT gun: https://en.wikipedia.org/wiki/Type_1_47_mm_anti-tank_gun ; Type 97 Shinhoto Chi-Ha: https://en.wikipedia.org/wiki/Type_97_ShinH%C5%8Dt%C5%8D_Chi-Ha_medium_tank
- Fukugi villages: https://www.jstage.jst.go.jp/article/kaiganrin/10/2/10_79/_article/-char/en ; https://ethnobiomed.biomedcentral.com/articles/10.1186/s13002-021-00434-3/figures/2
- Hedgerows: https://en.wikipedia.org/wiki/Rhino_tank ; https://www.dday-overlord.com/en/battle-of-normandy/tactics/hedgerow-warfare ; https://community.battlefront.com/topic/86003-bocagenormandy
