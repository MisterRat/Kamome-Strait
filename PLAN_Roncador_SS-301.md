# USS Roncador (SS-301): Simulator Plan

Written 2026-11-22 by the Kamome Strait session, at the user's request ("start bringing an in depth plan for the Roncador simulation...
plan everything, including a sub base based on Naval Base Majuro, which stations to include and what they will look like, how they will
be played in training and live missions"). The user said on 2026-11-21 that the SS-301 is the next simulator. Nothing in this plan is
built yet; it is a proposal for the user to approve or change. The open questions are in section 13.

Read `PLAN_Kamome-Strait.md` first: the working rules in its section 7 (versions, screenshots, no floating parts, blueprints, quick tests,
shared code in `src/shared`, sync to `C:\Code\Kamome-Strait`) apply to this simulator unchanged.

---

## 1. The idea in one paragraph

The player is the crew of a US fleet submarine in mid-1945. They take USS Roncador out of a Majuro-style atoll submarine base, through
the swept channel behind an escort, across to the enemy side of Kamome Strait, and make a war patrol: find a convoy, track it on the
surface at night by radar, get ahead, dive, make a periscope approach, set up the Torpedo Data Computer, fire a spread, go deep and survive
the escorts' depth charges, then come back and do it again. Between patrols there is lifeguard duty for the P-51 strikes, reconnaissance
of the Japanese ports, and the hunt for I-58. As in PCE-842, the player can take any station and the AI crew mans the rest, so the same
boat can be played as the captain at the periscope or as the man on the bow planes.

### Historical honesty

Roncador was commissioned on 27 March 1945, trained at New London, Key West and off the Panama Canal Zone, and the war ended before her
first war patrol (NavSource; uboat.net; Wikipedia). Majuro's submarine base was at its busiest in 1944; Bushnell left it in February 1945.
So the game is a "what if": Roncador reaches the Pacific in summer 1945 and is based on a Majuro-like atoll in the Kamome world. The boat,
her fittings and the doctrine are real; her patrols are invented. The menu card and the help should say so in one line.

---

## 2. Sources reviewed

| Source | What it gives us |
|---|---|
| **War Instructions, United States Navy, 1944** (FTP 143(A)), the user's scanned copy (`References/War Instructions USN 1944 U.S. Fleet.pdf`, 134 pages, OCR'd to text in the session; the same text is on HyperWar) | Chapter 9 *Employment of Submarines* (PDF pages 53-57): characteristics, tactics, target priority, the firing bearing of 70-110 deg, patrol and commerce attack, scouting, mining, lifeguard/aircraft support, sanctuary areas and recognition. Chapter 5: radio silence, contact reports, recognition and identification (a submerged boat identifies by pyrotechnics and sonar), aviation personnel rescue. Chapter 3: protection of a base (nets, offshore patrol, swept channels, anchorage placement). Chapter 7: what surface escorts do against submarines (zigzag, speed changes, hunt and attack). Chapter 11: sortie and entry (submarines leave first, swept channels 500 yd wide, entrance patrols, friendly subs cleared so any other is hostile). |
| **Current Doctrine, Submarines, USF 25(A), Commander Submarine Force Pacific Fleet, February 1944** (HyperWar) | The procedures the game should drill: diving and surfacing sequences, lookout rules, sound and radar use, the patrol day, the approach and attack (periscope exposure, depths, torpedo depth settings, spreads, volume of fire), night radar attacks, retirement, defence against depth charges, screens and aircraft, lifeguard duty. Section 6 below is built from it. |
| **A Visual Guide to the U.S. Fleet Submarines**, D. L. Johnston, Part 3 (the user's `References/Balao Class/guide 3.pdf`) and Part 5 *Balao class* (pigboats.com) | The conning tower as the attack centre (helm, chart table, both periscopes, radar, sonar and the TDC, up to 12 men at battle stations); the SJ/SD mast arrangements; the 4"/50 giving way to the 5"/25; Cramp's late boats completed in the Type 1A mast configuration. |
| **Roncador's Booklet of General Plans, 1945** (the user's `References/Balao Class/ss301bogp1945v2.pdf`, 9 plates on A0, scanned) | Plate 1: photograph as commissioned. Plate 5: main deck at 1/8 in = 1 ft: the 5"/25 aft of the fairwater, the escape hatches and torpedo loading hatches fore and aft, capstans, marker buoys, the bow buoyancy vent, the life lines. The other plates (profiles, platform decks, sections) are the source for the interiors (section 5). The exterior model (`models-us-submarine-roncador-ss-301.js`) is already built from it. |
| **USS Cod: TDC and conning tower pages** (usscod.org), **Pampanito TDC restoration** (Naval Submarine League), **Torpedo Data Computer** (Wikipedia, OP 1056 via Lone Sentry) | The TDC Mk III: a position keeper (fed own course from the gyro and own speed from the pitometer log; target length, speed and angle on the bow set by hand cranks; a sound bearing converter) and an angle solver whose gyro angle goes to the torpedo rooms continuously. The conning tower: an 8 ft cylinder over the control room with both periscopes, the helm forward, the firing buttons for the 10 tubes, the SJ and ST radars, the sonar console and the TDC. |
| **Naval Base Majuro** (Wikipedia; *Building the Navy's Bases*, via the Micronesian Seminar/CSU Marshall Islands pages), **USS Bushnell (AS-15)** and **USS Sperry (AS-12)** (DANFS, Wikipedia, tendertale.com), **Pacific Wrecks: Majuro Airfield**, ww2db Majuro timeline | The base for section 4: the lagoon (150-210 ft deep, few coral heads), the 400 ft timber pier and seaplane ramp on Darrit, the pontoon pier, the 5,800 ft coral runway on Dalop and the 4,000 ft strip on Uliga joined by causeways, the signal station and harbour entrance control on Calalin at the pass, the 750-man submarine recuperation camp, the fleet recreation centre, the 150-bed hospital, the avgas depot, the distillation plant; tenders Bushnell, Sperry, Argonne and Howard W. Gilmore, destroyer tenders Prairie and Markab; the base depended entirely on the tender. |
| **Japanese ASW** (US Naval Technical Mission to Japan S-24 via NavWeaps; *Japanese Submarine Losses* WDR-58 via HyperWar; naval-encyclopedia; warhistory.org on the kaibokan) | The enemy for section 8: escorts with Type 93 sonar (roughly the early US QC of 1937), depth charges as the main weapon, patterns of up to 36 on a sure contact, no way to measure a submarine's depth so patterns covered all depth settings, a deepest setting short of a fleet boat's test depth; the Type C/D kaibokan with about 120 charges and 12 throwers. |
| **Torpedoes** (Wikipedia, NavWeaps, *Naval Ordnance and Gunnery*, Naval Submarine League) | Mk 14/23 steam: 46 kn, 4,500 yd (Mk 14 also 31-32 kn, 9,000 yd), wake; Mk 18 electric: about 29 kn, 4,000 yd, wakeless, battery sensitive to temperature, must be pulled for charging; by 1945 the Mk 18 was most of what was fired in the Pacific. |

The War Instructions and Current Doctrine are complementary: the War Instructions say what a submarine is for and how she fits the
fleet; Current Doctrine says how she does it. Both are quoted by paragraph in the game's help so a player can look the rule up.

---

## 3. The boat

USS Roncador (SS-301), Balao class, Cramp Shipbuilding, Philadelphia; laid down 21 April 1943, launched 14 May 1944, commissioned
27 March 1945, Cdr. Earl R. Crawford. 311 ft 9 in x 27 ft 3 in (95.0 x 8.31 m), 16 ft 10 in draught max; 10 officers and 70-71 men.

| System | What it is | What the game models |
|---|---|---|
| Hull | Pressure hull of high-tensile steel, test depth 400 ft (Wikipedia; guide 3 gives the HTS boats' figure; to check against the plates). Main ballast, safety, negative, bow buoyancy, variable/trim tanks, fuel ballast tanks | Buoyancy and trim per tank group, depth, angle, the crush depth well below test depth (damage first), the "Christmas tree" of hull openings |
| Propulsion | Four diesels driving generators (diesel-electric), two shafts, two main motors per shaft; two 126-cell batteries | Surface speed up to about 20 kn (War Instructions: 17-21 kn surfaced, about 14 awash); submerged about 8-9 kn for an hour on a full battery, or 2 kn for about 90 miles and 45 hours (WI 900); charging on the surface in the evening routine; battery gravity, temperature and hydrogen; fuel (the endurance of a patrol) |
| Torpedoes | Ten 21 in tubes, six forward and four aft, 24 torpedoes | Mk 14/23 and Mk 18 mixes; per-tube state (loaded, flooded, outer door, gyro angle set, depth and speed set); reloads (minutes, below 100 ft if possible, per Current Doctrine); duds and prematures in Hardcore at 1945 rates (small) |
| Fire control | TDC Mk III (position keeper and angle solver), Mk 8 angle solver ("banjo"), stadimeter in the periscope, is-was, plot | The real TDC loop: observations in, a solution, the generated bearing checked against the next observation, the gyro angles sent to the tubes |
| Periscopes | Two: the No. 1 (search/air, larger head, some late-war with the ST range radar) and the No. 2 (attack, thin head) | Raising, height above the water, exposure time (and the feather the enemy can see), low and high power (1.5x and 6x), the stadimeter, the bearing ring, the ST range when fitted |
| Radar | SJ surface search (on the aft periscope shear in the Type 1A layout; PPI and A-scope), SD air search (non-directional, used 5 s at a time) | SJ range and bearing on ships, the lobe-switching range; SD as an aircraft warning that can be detected; the enemy's radar warning |
| Sonar | JK/QC (port, double-faced: JK listening, QC echo ranging), QB (starboard), JP (topside line hydrophone near the gun) | Listening bearings and screw counts, one ping for range (Current Doctrine: about 2,500-3,000 yd, sparingly), the sound bearing converter into the TDC |
| Guns | 5"/25 Mk 17 aft of the fairwater (plate 5); a 40 mm forward and a 20 mm aft on the fairwater decks (the exterior model) | Battle surface against small craft and luggers, AA on the surface; ammunition passed up through the hatches |
| Radio | HF/LF receivers, the VLF loop, a voice set for aircraft | Contact reports, the Fox schedule (ULTRA-style contact messages), lifeguard voice with the strike aircraft |

---

## 4. The base: Submarine Base Lockwood (after Naval Base Majuro)

A new site in the Kamome world, named in the game's pattern (PT Base Halsey, Depot Nimitz) after Vice Admiral Charles Lockwood,
COMSUBPAC. The name is a proposal (section 13).

### 4.1 Where

An atoll in the far world on the Allied side, far enough from every enemy airbase and battery that it is a sanctuary (WI 930), and
far enough from the patrol areas that the passage out is a real part of a patrol. Chosen (the user's, 2026-11-23, on the briefing map): about 33 km north-east of PT Base Halsey at (33,300, -18,200), the
only open water 25-35 km from Halsey that is 30 km from every enemy site and clear of their guns (36 km from the nearest), in
water over 30 m deep for 5 km round. The first proposal was south-east of PT Base Halsey, 25-35
km from it, at least 30 km from Port Ugaki, the IJN base and every enemy airfield. The user chooses the spot on the briefing map as
they did for Halsey; `ROE.reach` and the airbases' ranges are checked automatically (a test like `halsey.py`).

The atoll is cut into `WH` like the far sites' pads: a ring reef 6-8 km across (Majuro is about 40 km long; this is scaled down to fit
the world), low islets on the reef (a metre or two above the sea, palms), and a lagoon 45-65 m deep (150-210 ft at Majuro) with a few
coral heads. One deep pass on the lee side is the only way in.

### 4.2 What is there (each from Majuro)

| Place | At Majuro | In the game |
|---|---|---|
| The pass and its island | Calalin: signal station and harbour entrance control | Signal tower with a light and flags, the entrance control hut, a net (WI 303: anchorages protected by nets and patrols) with a gate vessel; challenge and reply when entering (the recognition drill) |
| The swept channel | Channels swept 500 yd wide (WI 1104), entrance patrols (WI 1103) | Buoyed channel outside the pass; a PCE on patrol off it (USS PCE-842 herself when the PCE player is in the world; otherwise an AI PCE) |
| The tender anchorage | Bushnell, Sperry, Argonne, Howard W. Gilmore in turn; "entirely dependent upon the tender" | A Fulton-class tender (Sperry, AS-12) moored in the lagoon with a nest of two or three fleet boats alongside; the boat refits alongside her. New model: Fulton-class tender (529 ft) from published plans |
| The fleet anchorage | Battleships and carriers in the lagoon in 1944 (ww2db) | A few transient ships at anchor: an oiler, a destroyer tender (Prairie) with two destroyers, an escort carrier now and then (distant forms only) |
| The submarine camp | A 750-man recuperation camp and the fleet recreation centre | On a lagoon islet: Quonset huts and tents under palms, a mess hall, a beer garden, a baseball diamond, a boat landing. Where the crew goes between patrols (the menu's "rest" screen and the debrief) |
| The piers | Darrit's 400 ft timber pier and seaplane ramp; a pontoon pier | Timber pier with warehouses and a seaplane ramp; a pontoon pier for the tender's boats; LCMs (the LCM-3 model exists) running between |
| The airfield | Dalop: 5,800 ft coral runway, Marine SBDs, NATS transports; Uliga: 4,000 ft strip; causeways joining them | One coral strip (the shared airfield code) with SBDs and a PBY ramp; the P-51 can land there; the causeway as a road |
| Services | Avgas depot, distillation plant, 150-bed hospital, Seabee shops | Dressing: tank farm, water tower, the hospital's red cross, shops (shared building models) |

### 4.3 How the base is played

- **Start of a patrol:** the boat lies alongside the tender, reloaded and fuelled. The captain receives the operation order (patrol
  area, special tasks, the friendly lanes and sanctuary times, recognition signals) on a briefing sheet, like the P-51's briefing map.
- **Sortie:** the player casts off, conns out through the lagoon to the pass, gives the challenge's reply to the signal station,
  passes the gate, and meets the escort at the channel's outer buoy. The escort takes her out along the lane (WI 928-929: boats move to
  and from stations through set lanes at set times, escorted near the base) and leaves her at the lane's end. Lane discipline matters:
  outside it a friendly aircraft may attack her (WI 927, 935-938).
- **Return:** the reverse, with the identification on approach, entry at the given time, the escort met at the lane's end, and the
  boat brought alongside the tender (a coming-alongside drill like the PCE's at Halsey).
- **Refit:** a short screen at the tender: damage repaired (time depends on damage), torpedoes loaded (choice of Mk 14/23/18 mix),
  fuel, food, crew rested at the camp; awards and the patrol report.

---

## 5. Stations

The PCE pattern carries over: stations numbered and keyed, a first-person eye at each, the live instruments drawn where they really are,
the AI crew working every station the player is not at, and the OOD's orders (here the captain's) reaching every station. Nine stations,
keys 1-9. Each needs its own interior model built from the booklet's plates; the space names below are the boat's own.

### 5.1 Station 1: Bridge (Officer of the Deck), surfaced

- **Where:** the open bridge on the fairwater: the OOD forward, three lookouts on the periscope shears (WI: a fleet boat needs at least
  three), the 40 mm and 20 mm on their decks.
- **What it looks like:** the bridge's steel rail at chest height, the bridge speaker and the voice tube, the TBT (target bearing
  transmitter) pedestal with binoculars, the gyro repeater, the diving alarm handle, the conning tower hatch at the feet. The sea is
  close: spray comes over in a head sea.
- **What the player does:** steers (orders to the helm below), rings engine orders (two to four engines on propulsion or charging),
  uses the binoculars and the TBT to mark bearings into the TDC, keeps lookouts reporting (aircraft, smoke, masts, periscopes), sounds
  the diving alarm (two blasts). Night surface attacks are fought from here: radar ranges from below, TBT bearings from here, firing
  from the bridge.
- **Doctrine it enforces (Current Doctrine 2501):** dive for aircraft; turn toward a periscope forward of the beam, away from one abaft
  it, at flank speed; turn away from small craft; turn toward targets. One tube forward and one aft at 40 ft by day, 10 ft at night.
- **Orders box:** the PCE's Orders window reused: course, speed, engines (propulsion/charge split), dive, battle stations, gun action,
  lookout reports.

### 5.2 Station 2: Conning tower, periscope (Captain / Approach Officer)

- **Where:** the conning tower, the 8 ft cylinder over the control room: both periscope wells, the helm forward, the TDC on the
  starboard side aft, the sonar console, the SJ PPI, the chart desk, the firing panel.
- **What it looks like:** a cramped red- or white-lit steel tube; the periscope barrel in the middle with its training handles; around
  it, the men at their posts (all modelled and animated from the shared crew figures).
- **The periscope view:** a circular eyepiece view of the sea at the scope's height above the water (the waves wash over it at
  periscope depth); a bearing scale and the stadimeter's split image; low power (1.5x, wide) and high power (6x); the ST range in the
  No. 1 scope's head when fitted. Raising and lowering take time; every second up is counted (the feather and the scope can be seen,
  more in a calm sea and in sunlight). "Up scope... bearing, mark!... range, mark!... down scope" are real actions that put a bearing
  and range into the TDC.
- **What the player does:** the approach (gets ahead, keeps the angle on the bow and the track angle in mind), observes, calls the
  angle on the bow, orders depth and speed, chooses tubes and the spread, orders "fire" (or lets the TDC officer fire on his word),
  watches the hits, goes deep.
- **Doctrine it enforces:** exposures under 30 s, two short better than one long; slow before raising; deep (keel 140 ft or more, below
  100 ft for safety from aircraft) between looks; train the scope to the bearing before raising it; low-power sweep for aircraft first.

### 5.3 Station 3: Fire control (TDC operator)

- **Where:** the TDC Mk III in the conning tower.
- **What it looks like:** the TDC face as a working instrument panel: the position keeper's dials (own course and speed fed in
  automatically; target course, speed, range and bearing), the hand cranks for target speed, angle on the bow, range and length;
  the angle solver's dials for the gyro angle and track angle of the forward and after tubes; the "generated bearing" against the
  "observed bearing" check lamps. Next to it the firing panel: ten tube lamps (ready, flooded, door open) and the firing keys.
- **What the player does:** sets up the problem from the observations, cranks the solution until the generated bearings match the
  observed ones at every new observation, applies spread, and fires on order; or uses the "banjo" (Mk 8 angle solver) and the is-was
  as the backup when the TDC is damaged.
- **The model underneath:** the TDC in code is a real position keeper (integrating the target's motion from its believed course and
  speed) and a real angle solver (gyro angle and track angle for a straight-running torpedo, parallax for the tube's position, the
  torpedo's speed and reach). The solution is only as good as the inputs: a wrong angle on the bow is a miss.

### 5.4 Station 4: Sound and radar (conning tower)

- **Sound (JK/QC, QB):** a headset view: the training handwheel and bearing dial, the listening picture as a bearing/time waterfall
  of the screws heard, screw count per minute (target speed), the QC's single ping and its range. Shared with the PCE's sonar code
  (the echo-ranging and its mistakes), turned round: the sub's operator mostly listens. In a depth-charge attack he calls the escorts'
  bearings, their speed changes and "he's pinging... he's starting his run".
- **Radar (SJ, SD):** the SJ's PPI and A-scope as the PCE's radar code with a submarine's mast height; ranges into the TDC; the SD's
  aircraft warning (on for about 5 s at irregular intervals no more than a minute apart, Current Doctrine 2402/2507). An APR-style
  search receiver that hears the enemy's radar (Current Doctrine: radar-frequency reconnaissance).

### 5.5 Station 5: Diving station (control room)

- **Where:** the control room under the conning tower: the bow and stern planesmen's wheels on the port side, the depth gauges and
  the bubble (inclinometer) in front of them, the "Christmas tree" hull-opening indicator, the high-pressure air manifold, the
  vent and flood levers (the hydraulic manifold), the trim manifold and the trim pump, the gyrocompass.
- **What it looks like:** green and red lamps of the Christmas tree, two big wheels, the depth gauges' needles, the bubble.
- **What the player does:** the dive (the real sequence from Current Doctrine 2104: vents open, bow planes rigged out on full dive, at
  45 ft vents shut and two-thirds, at 90 ft blow negative, at 100 ft level off, one-third, trim), holding periscope depth within a foot
  in a seaway, trimming with pumps between tanks (and pumping bilges to the tanks, not overboard, by day), the quick dive, surfacing
  (blow safety and bow buoyancy, then the low-pressure blower for 15 min), and keeping depth while the torpedoes leave (the boat gets
  light by the tube's weight). Diving officer and chief of the boat are the AI when the player is elsewhere.
- **Measure of skill:** time from the alarm to periscope depth (a fleet boat's quick dive was well under a minute; to be set from the
  sources in phase R1), and the depth error at periscope depth.

### 5.6 Station 6: Maneuvering room and engines

- **Where:** the maneuvering room aft (the electrician's control cubicle: the big levers for the main motors and generators, the
  ammeters) and the two engine rooms (two diesels each).
- **What it looks like:** the cubicle's levers and meters; through the door, the engines' rocker covers and gauges. Hot and loud on
  the surface, silent submerged.
- **What the player does:** answers the bells (the PCE's Answer-the-bells drill turned into motor and generator settings), puts
  engines on propulsion or on charge, keeps the battery's charge, gravity and temperature in limits, ventilates the battery
  (hydrogen), silent running (stopping noisy auxiliaries, Current Doctrine 5308), and the damage control of the after spaces (the
  PCE's damage-control jobs reused: leaks, fires, a jammed stern plane put in hand).

### 5.7 Station 7: Torpedo rooms (forward and after)

- **Where:** the forward torpedo room (six tubes, the reloads in racks, bunks over them) and the after torpedo room (four tubes).
- **What they look like:** the tube doors in two vertical rows, the gyro setting spindles and indicator, the depth setting and speed
  setting, the firing valves, the reloads on their skids with the chain falls.
- **What the player does:** the torpedo officer's routine (tubes ready, outer doors on order, depth set per target type, Current
  Doctrine: merchant 12 ft by day and 10 at night, destroyers 6 ft), the reload under time pressure (the reload takes minutes;
  the AI crew does it in game mode, the player does it as a mini-game in Hardcore), the Mk 18 charging routine (pulling them from
  the tubes), and the torpedo room's own damage control.

### 5.8 Station 8: The guns (battle surface)

- **Where:** the 5"/25 aft of the fairwater, the 40 mm forward and the 20 mm aft on the fairwater decks.
- **What it looks like:** the PCE's gun stations reused: the gunner's eye, the sight, the shells (the shared ballistics with the 5"/25's
  table), the crew passing ammunition up through the hatch.
- **What the player does:** battle surface on a lugger, a picket boat or a small escort (Current Doctrine 5602: only small craft, and
  only when worth the risk), AA when caught on the surface; the guns are stowed before diving (20 mm about 30 min before, Current
  Doctrine 2501.8) and a crew below decks takes time (the hatch and the gun to clear before the dive).

### 5.9 Station 9: Radio

- **Where:** the radio room forward of the control room.
- **What it looks like:** the PCE's radio paper and comms box reused with the submarine's sets.
- **What the player does:** copies the Fox (contact messages from the shore, ULTRA-style: "convoy of 6 marus, 3 escorts, at X at
  2200 course 040 speed 8"), sends contact and patrol reports (WI 506-512: presence, location, composition, direction first; facts
  only; time when true), and in lifeguard duty talks to the strike aircraft on the voice set. Transmitting can be heard by the enemy's
  direction finders (WI 916): every transmission raises the escorts' alertness in the area for a while.

### 5.10 Getting around

The stations are first person, linked like the PCE's: one key jumps there. Hardcore keeps the PCE's walking mode: the player can walk
the boat's length through the watertight doors (forward torpedo room, forward battery (officers' country), control room and pump room
under it, after battery (crew's mess and berthing), forward and after engine rooms, maneuvering, after torpedo room). The ladders to the
conning tower and the bridge are the only way up. Shut doors when rigged for depth charge make the walk longer.

---

## 6. How a patrol day runs (from Current Doctrine 2501.8)

1. Before dawn: sanitary tanks blown about an hour before diving; 20 mm stowed about 30 min before.
2. Dive at first light; the day submerged in the patrol area: periscope looks at the captain's interval, sound manned throughout.
3. A contact: begin the approach at once.
4. Sunset: rig for red forward of the forward engine room, lookouts dark-adapted, SJ warmed up.
5. Surface after dark; with the captain's permission the evening routine: battery and air charges, bilges, trash, guns rigged.
6. The night on the surface: radar search, lookouts, end-around runs on contacts.

The game runs this clock with time compression (the shared mission clock), dropping to normal speed whenever anything happens. The
battery and the air are the boat's two clocks: a day's submerged running drains the battery and fouls the air; a bad night's charge means
a short day.

---

## 7. Fighting the boat (the rules the AI and the game score by)

### 7.1 Approach and attack (Current Doctrine IV, War Instructions 904-908)

- Get ahead of the target on the surface while undetected; dive about 30-40 miles ahead of a large force (scaled to the world).
- Normal approach course for an angle on the bow over 15 deg; head 30-45 deg ahead of the target for an angle under 15 deg.
- Track angle 70-110 deg best overall, 90 when the target's course and speed are well known; firing bearing 70-110 relative (WI 908).
- Firing range: as close as is effective, not under 500 yd (the torpedo must settle at its depth); short runs, since errors grow with
  run time; large gyro angles unreliable inside about 1,500 yd.
- Straight shots preferred; for angled shots the order small-stern, small-bow, large-bow, large-stern parallax.
- Always a spread: at least 80% of the target's length, up to 200% when the solution is doubtful.
- Volume of fire (a guide): merchant, small auxiliaries 3-4 torpedoes; destroyer or submarine 3; cruiser 6; carrier 6-10.
- Target priority (WI 912 and Current Doctrine IV): heavy warships and loaded transports and tankers first; a worthwhile target is
  never passed up waiting for a better one.
- The best conditions (WI 907): sea astern, out of the sun, away from the moon, the target silhouetted, from the least screened side.
- Twilight: nearly undetectable, distances overestimated; night: on the surface as long as possible, radar depth, then periscope depth
  only when the target can be seen.

### 7.2 After firing

Assume discovery; clear the firing point on a course away from the counter-attack; fast when the enemy is noisy, slow when quiet; use
the enemy's wakes; reload below 100 ft; keep the initiative.

### 7.3 Defence (Current Doctrine V)

- Depth charges: explosions above, not below; damage rings from the War Instructions' figures for a 300 lb charge (within 14 ft the
  hull ruptures, within 28 ft serious disablement, within 60 ft a shaking); rig for depth charge (outer doors shut, auxiliaries
  stopped, loose gear stowed, hands in their bunks); course and speed changes against an echo-ranging escort; the knuckle; going under
  a thermal layer.
- Screens: pass under a screening ship on an opposite course at slow speed and about 120 ft; present bow or stern; silent when they
  slow to listen.
- Aircraft: dive before being seen; treat every plane as hostile that has seen you; below 100 ft at slow speed; radar search before
  surfacing.
- Small craft: submerge in time; at night outrun them on the surface.

---

## 8. The enemy

| Enemy | Source | Behaviour |
|---|---|---|
| Convoys | Type 2A cargo ship and Type 2TL tanker models exist (MODELS) | 3-8 ships in columns, zigzagging by day (WI 702-707), radical course change after dark (WI 709), speed 7-10 kn; scatter when hit |
| Escorts | New model: Type C kaibokan (and a Type D); the T-14s for inshore | A screen ahead and on the bows; Type 93 sonar at early-QC quality; listening and pinging; a hunt on a torpedo hit or a contact; depth-charge runs with throwers and racks, patterns of up to 36 on a sure contact, all depth settings because they cannot measure depth, deepest setting short of the boat's test depth (the reason going deep works); hold-down tactics (staying over the last contact for hours) |
| Aircraft | Ki-84s exist; new: a patrol type (e.g. a floatplane or a Betty-class bomber, distant forms only at first) | Air patrols over the convoy route by day; magnetic detection and radar on a minority (S-24); bombs on a surfaced or shallow boat |
| I-58 | Exists (SUBS) | Patrols as now; the sub hunts her (WI 923: friendly submarines force enemy submarines down by day) |
| Shore | Coast batteries, the IJN base, the radar stations | Batteries fire at a surfaced boat within reach (ROE.reach); harbour entrances netted and patrolled |
| Mines | New | Known fields marked on the operation order; unknown ones on the approaches to the ports |

The escorts need the most work: they are the challenge. Their skill rises with the difficulty setting (screw-noise detection range,
pinging accuracy, the depth spread of their patterns, how long they hold down).

---

## 9. Training

Training is the PCE's drill framework (`DRILLP` panels, `drillReport`, the Orders and Drill windows side by side, the picture box at the
bottom centre), moved to `src/shared` so the submarine uses the same code (section 11). Each drill has an instructor's text, a score, a
report and the doctrine paragraph it teaches. Training takes place in the lagoon and the exercise area outside the base, which is
sanctuary (WI 930): the enemy never comes there.

| Station | Drill | What it trains | How it is scored |
|---|---|---|---|
| 5 Diving | **The trim dive** | The full dive sequence by the book, a trim at 100 ft | Each step in order, the trim within limits after N minutes |
| 5 | **Quick dive** | The alarm to periscope depth from flank speed | Seconds; overshoot depth |
| 5 | **Hold periscope depth** | Depth within a foot in a seaway, at slow speed, while the captain makes looks | Depth error, broaching |
| 5 | **Torpedoes away** | Holding trim while firing a spread (the boat gets light) | Depth excursion |
| 1 Bridge | **Lookout and dive** | Spot the aircraft, the alarm, clear the bridge | Time to under 100 ft after the plane appears |
| 1 | **Recognition** | Challenge and reply entering the pass (the PCE's recognition drill reused) | Right reply in time |
| 1 | **Coming alongside the tender** | Bringing a 95 m boat alongside the nest (the PCE's coming-alongside drill reused) | Speed at contact, angle, time |
| 1 | **Night surface attack** | Radar tracking, TBT bearings, firing from the bridge on an escorted target | Hits, detection |
| 2 Periscope | **Periscope school** | Stadimeter range and angle on the bow on a target ship at known ranges | Error in range and AOB |
| 2 + 3 | **Approach school (the "attack teacher")** | A full submerged approach on a target ship with exercise torpedoes (practice heads that float and are recovered) | Track angle, range at firing, periscope exposure total, hits |
| 2 + 3 | **Attack on an escorted target** | Approach through a screen (the exercise escort is a PCE: when the PCE player is on, the escort is them) | As above, plus detection |
| 3 TDC | **TDC check problem** | The daily check problem (Current Doctrine 2502-2507) and setting up a solution from given observations | Solution error |
| 4 Sound | **Sound bearings** | Identify and track several screws; count turns for speed | Bearing and speed error |
| 4 + 2 | **Sound attack** | Deep attack on sound bearings alone (Current Doctrine: straight shots on a course normal to the target's) | Hits |
| 4 Radar | **Radar plot** | SJ ranges and bearings onto the plot; course and speed of a contact | Course and speed error |
| 6 | **Answer the bells / charge** | Motor orders; a battery charge within limits | Response time; charge within gravity and temperature |
| 6 + 7 | **Rig for depth charge, damage control** | The rig list (Current Doctrine 5308) against the clock; then leaks and fires from exercise charges | Time; jobs done |
| 7 | **Reload** | A reload of the forward tubes | Time |
| 8 | **Battle surface** | Surface, man the 5"/25, engage a target sled (PT-105's sled reused), clear and dive | Hits; time to dive after "cease fire" |
| 9 | **Contact report** | A report with the right items in the right order | Items right |
| 1 + 4 + 9 | **Lifeguard** | Search a spiral rectangle for a raft (Current Doctrine section 9: about 15 kn, slower in whitecaps, drift about 4% of the wind), pick up the pilot (check his nationality first, a three-man party, a life ring on a heaving line) | Time to find; pick-up without washing the raft away |
| all | **Evasion** | A PCE hunts the boat with practice charges (when the PCE player is on, they hunt) | Time held, "kills" scored by the hunter |

A **qualification** card per station (like the Navy's submarine qualification) ticks off as drills pass; a fully qualified crew is
the prerequisite for the first war patrol in the campaign mode, but every live mission is open in free play.

---

## 10. Live missions

### 10.1 The war patrol (the main mode)

A patrol is a chain: sortie from the base, the lane, the passage (compressed time, with aircraft and contact events), the patrol area
(a sector of the strait or the enemy coast, chosen by the operation order), contacts (from the Fox, from lookouts, from radar or sound),
attacks, evasion, the patrol day's rhythm, and the return when the torpedoes or the fuel run out or the order recalls the boat. Score:
tonnage sunk (confirmed by the debrief), damage taken, crew lost, doctrine kept (exposures, lanes, radio discipline). The patrol report is
written up automatically from the log, in the style of the real ones, and saved.

### 10.2 Single missions (the mission menu)

| Mission | What happens | Doctrine |
|---|---|---|
| **Convoy at night** | A convoy reported by the Fox; track on the surface by radar, end around, attack on the surface or at radar depth | CD IV.8, WI 906 |
| **Daylight submerged attack** | A convoy zigzagging by day; periscope approach through the screen | CD IV.5-6 |
| **Wolf pack** | Two AI boats and the player on one convoy, attacks in succession | WI 905 |
| **Lifeguard** | Station off the enemy coast during a P-51 strike; aviators ditch; rescue under fire | WI 534-541, CD III.9 |
| **Reconnaissance** | Periscope photographs of Port Ugaki or the IJN base: periscope visual and photographic recce, a sketch report | CD III.7 |
| **Minelaying** | Lay Mk 12-type mines through the tubes off a harbour at night, in fields of 10-12, irregular intervals, 100-150 ft of water | CD III.6 |
| **Landing party** | Put a party ashore by rubber boat at night and recover it | CD III.7 |
| **Hunt I-58** | Find and sink the enemy submarine (she patrols as now) | WI 923 |
| **Hold-down** | Survive a long depth-charge hunt with a failing battery and fouling air | CD V |
| **Gun action** | A sampan or picket boat line; battle surface | CD 5602 |
| **Run the gauntlet** | Into a defended anchorage for a ship at anchor (the Mk 14's low-speed setting) | WI 913 |

### 10.3 Kamome Strait (the combined game)

- **The PCE escorts the sub out:** with the PCE player in the world, PCE-842 is the sub's escort down the lane (a new PCE mission).
- **Lifeguard for the P-51:** a P-51 pilot who ditches near the enemy coast is picked up by Roncador (AI or player). This makes the
  P-51's bail-out over the sea a story instead of an end.
- **Exercises:** the PCE's ASW training and the sub's evasion drill are the same exercise from two sides.
- **Two players** (later, with the multiplayer effort): one on the sub, one on the PCE hunting her in an exercise, or on the escort.

---

## 11. What is reused, what is moved, what is new

Rule: no duplicated code. Anything both ship simulators need moves to `src/shared` first, in its own commit, with the PCE re-tested
(rolecheck, the drill tests) before the sub uses it.

### 11.1 Reused as is

`OCEAN` and the waves, `SEA`, the wake, `MODELS` us-roncador (exterior, near and far), `SUBS` (depth, the periscope's feather, sinking,
the distant forms), `ROE`, `COAST`, the air raids and the Ki-84s, `RADIO`'s paper and `msgSide` colours, collision avoidance, the time of
day and weather, the mission menu and coach box, the briefing map tool, the settings and Hardcore switch, the shared crew figures.

The route and the chart (`NAV`, `NAVCHART`, added 2026-11-23 for every simulator with an AI driving): the navigator's chart in the
control room or conning tower carries the patrol route the helmsman follows. Enemy in sight (or on sound or radar, the role's
`navContact`) suspends it; 30 s clear re-engages it. `navLegOK` keeps legs off land and out of water too shallow to dive.

### 11.2 To move from `src/pce` to `src/shared`

| Piece | Why |
|---|---|
| The drill framework (`DRILLP`, `dbEl`, `dbShow`, `drillReport`, the Orders/Drill/picture boxes, `DCX_K` jobs) | Every training drill of both ships |
| The stations framework (station keys, first-person eyes, the AI at unmanned stations, the phone box) | Nine stations on the sub |
| Sonar (echo-ranging and listening, its errors) | The sub's JK/QC and the escorts' Type 93 |
| Radar (PPI, head-up, ranges) | The SJ |
| Damage control jobs and the engine-room model's pieces (`ENG`) | The sub's machinery and damage |
| The depth-charge burst and its damage | The escorts' charges on the sub (the PCE's charges on I-58 already work) |
| The gun crews and ballistics (`GSPEC`) | The 5"/25, 40 mm and 20 mm |
| Coming alongside | The tender |

### 11.3 New

- `src/ss301/` with `src/ss301.manifest` and `SIMS.add({ id: 'ss301', ... })`, the menu card, the help rows, the bindings.
- The boat's dynamics: buoyancy per tank group, planes, trim, depth, the diesel-electric plant, battery, air, fuel.
- The TDC (position keeper, angle solver), the periscopes and their eyepiece view, the stadimeter.
- Torpedoes: Mk 14/23/18 as a shared torpedo runner (the Type 95 and the T-14s' torpedoes already run in `SITE.torps`; one runner for
  all, with gyro angle, depth, speed, the wake or none).
- Interiors from the booklet's plates: conning tower, control room, the torpedo rooms, maneuvering, the walk-through spaces.
- Enemy: the kaibokan model and its ASW AI, convoy formation and zigzag plans, patrol aircraft, mines.
- The base: the atoll in `WH`, the tender model (Fulton class), the nest, the camp, the piers, the airfield, the net and gate.
- The patrol log and report, the qualification cards.

---

## 12. Phases

Each phase ends with a playable build, screenshots of everything visual, the blueprints updated, and the sync. The quick tests are
written per phase (`tests/`), as for the PCE.

| Phase | Content | Playable at the end |
|---|---|---|
| **R0 Groundwork** | Move the drill and station frameworks, sonar, radar, damage control and depth-charge code to `src/shared` (PCE re-tested after each move). `src/ss301` stub: the role, the menu card, the build. | Kamome's menu offers Roncador; the boat floats at a fixed spot |
| **R1 Handling** | Surface and submerged dynamics, the dive and surface sequences, the planes and trim, the diesels and battery; stations 1 (bridge), 5 (diving), 6 (maneuvering) with their interiors | Take her out, dive, hold depth, surface, charge |
| **R2 Attack** | Periscopes and eyepiece view, the TDC, the torpedo runner, stations 2, 3, 7; a lone target ship | Sink an unescorted freighter by the book |
| **R3 The enemy** | Station 4 (sound and radar), the kaibokan and its ASW AI, convoys with zigzag plans, depth-charge damage on the boat, rig for depth charge | Attack an escorted convoy and survive the counter-attack |
| **R4 The base** | Submarine Base Lockwood: the atoll, pass, net, tender and nest, camp, piers, airfield; sortie and entry with the escort and the lane; refit screen | A patrol starts and ends at the base |
| **R5 Guns and radio** | Station 8 (battle surface, AA) and station 9 (Fox, reports, voice); aircraft patrols; DF | Gun actions, the radio's part in contacts |
| **R6 Training** | All the drills in section 9, qualification cards | The training menu complete |
| **R7 Live missions** | The single missions and the war patrol with its log and report | The full game |
| **R8 Kamome links** | PCE escort and exercise missions, P-51 lifeguard, the briefing map with the base and the lanes | The three simulators share missions |
| **R9 Polish** | Sounds (the diving alarm, the klaxon, the screws through the hull, pinging on the hull, charges), walk-through Hardcore, help text with doctrine paragraph references | Release candidate |

The order R1-R3 is fixed (each needs the last); R4-R6 can go in any order the user prefers.

---

## 13. Open questions for the user

1. **The base's name:** Submarine Base Lockwood? (Or another name; or "Majuro" itself if the user wants the real name in the world.)
2. **Where the atoll goes:** a spot on the briefing map, as for Halsey (the proposal is south-east of Halsey, section 4.1).
3. **Versioning:** a version line of its own for Roncador, starting at 0.01 like the PCE's 0.xxx, plus a Kamome bump on each change?
4. **Which station first after R1:** periscope and TDC (the captain's game) or the diving station (the crew's game)?
5. **How much Hardcore:** the full by-hand reload and walking in Hardcore only, with the AI crew doing it in game mode (as the PCE)?
6. **Torpedo load:** the 1945 historical mix (mostly Mk 18 with some Mk 14/23) by default, chosen at the tender?
7. **The war's end:** keep the "what if" honest line on the menu card (section 1)?

---

## 14. Sources (links)

- War Instructions, United States Navy, 1944 (FTP 143(A)): the user's PDF; text at https://ibiblio.org/hyperwar/USN/ref/WarInst/index.html (chapters 3, 5, 7, 9, 11) and the NHHC reading room page https://www.history.navy.mil/research/library/online-reading-room/title-list-alphabetically/w/war-instructions-united-states-navy-1944.html
- Current Doctrine, Submarines, USF 25(A), February 1944: https://ibiblio.org/hyperwar/USN/ref/SS-Doct/index.html (chapters II-V)
- USS Roncador: https://navsource.org/archives/08/08301.htm, https://uboat.net/allies/warships/ship/3047.html, https://en.wikipedia.org/wiki/USS_Roncador, DANFS https://history.navy.mil/research/histories/ship-histories/danfs/r/roncador.html
- Roncador's Booklet of General Plans, 1945 (the user's `References/Balao Class/ss301bogp1945v2.pdf`)
- D. L. Johnston, A Visual Guide to the U.S. Fleet Submarines, Part 3 (the user's `guide 3.pdf`) and Part 5: https://pigboats.com/images/2/2d/A_VISUAL_GUIDE_TO_THE_FLEET_SUBMARINES_PART_5_Balao_class.pdf
- TDC: https://www.usscod.org/tdc.html, https://archive.navalsubleague.org/?p=2747, https://en.wikipedia.org/wiki/Torpedo_Data_Computer, https://www.lonesentry.com/blog/?p=7169
- Conning tower: https://usscod.org/conningtower.html, https://www.bowfin.org/?p=1813
- Majuro: https://en.wikipedia.org/wiki/Naval_Base_Majuro, https://micronesia.csu.edu.au/Marshalls/html/WWII/Majuro_Base.html, https://pacificwrecks.com/airfield/marshalls/majuro/index.html, https://ww2db.com/event/timeline/place/Marshall-Islands/_Majuro
- Tenders: https://en.wikipedia.org/wiki/USS_Bushnell_(AS-15), https://tendertale.com/tenders/115/115.html, https://historycentral.com/navy/AS/sperry.html
- Japanese ASW: https://navweaps.com/Weapons/WAMJAP_ASW.php, https://ibiblio.org/hyperwar/USN/rep/WDR/WDR58/WDR58-3.html, https://warhistory.org/fr/article/kaibo-kan-escorts?amp=0
- Torpedoes: https://en.wikipedia.org/wiki/Mark_18_torpedo, https://archive.navalsubleague.org/?p=1095, https://eugeneleeslover.com/USNAVY/CHAPTER-12-I.html
