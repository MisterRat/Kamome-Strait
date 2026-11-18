/* HARDCORE SIMULATION MODE (off by default: the sim is fun first). A master switch plus six separate options, all saved:
   torque    engine torque + P-factor + propwash over the tail
   spin      wing drop and spins at the stall (snap rolls can spin)
   alt       air density, supercharger power, service ceiling, indicated airspeed, Mach redline
   heat      engine overheating from long full-throttle running
   fuel      fuel burn, weight change, fuselage-tank centre of gravity
   wep       the top 10% of throttle is war emergency power
   gload     structural load limits: +8 / -4 G (less when heavy or fast); overstress bends the airframe, far too much breaks the wing
   perf      real-aircraft performance: extra drag so top speed, cruise, climb and glide match the P-51D (~610 km/h at sea level, glide ratio ~14)
   wind      the weather's wind and gusts: crosswind and headwind on take-off and landing, drift in the air
   turb      turbulence: bumps and rolls in rough weather and low down in strong wind
   wet       wet runway in rain: weaker brakes, weaker steering, hydroplaning at speed
   ice       airframe icing in cloud below freezing: less lift, more drag, less thrust
   ops       the real flap settings (10 to 50 degrees) and speed limits, and a landing gear speed limit (170 mph)
   pwr       engine power limits: war emergency power for 5 minutes, and no more than 3240 rpm in a dive
   trim      working trim tabs: elevator, rudder and aileron trim set the speed the aircraft holds hands-off (keyboard and controller only)
   FM.use(name) is true only when the master switch AND that option are on. */
const HC_KEYS = [
  /* PCE-842: the ship's own Hardcore parts (the Hardcore tab) */
  'eng',
  'sea',
  'range',
  'rings',
  'aa',
  'reload',
  'smoke',
  'walk',
  'orders',
  'dmg',
  'comms',
  /* the P-51's (kept for the flight code the fork still carries; not shown) */
  'torque',
  'spin',
  'alt',
  'heat',
  'fuel',
  'wep',
  'perf',
  'gload',
  'wind',
  'turb',
  'wet',
  'ice',
  'ops',
  'pwr',
  'trim',
];
const FM = {
  on: false,
  opt: {
    eng: true,
    sea: true,
    range: true,
    rings: true,
    aa: true,
    reload: true,
    smoke: true,
    walk: true,
    orders: true,
    dmg: true,
    comms: true,
    torque: true,
    spin: true,
    alt: true,
    heat: true,
    fuel: true,
    wep: true,
    perf: true,
    gload: true,
    wind: true,
    turb: true,
    wet: true,
    ice: true,
    ops: true,
    pwr: true,
    trim: true,
  },
  lim: { pos: 7, neg: -3.5 } /* current structural limits in G (weight and speed dependent) */,
  over: 0 /* load / limit when over the limit, else 0 */,
  str: 0 /* airframe damage from overstress, 0..1; repaired on the ground */,
  perf: { drag: 2.65e-5, vw: 186, ind: 0.00017, dip: 0.22, alt: 2.8, altp: 3.2 } /* extra drag coefficient, and the speed where compressibility drag starts (m/s) */,
  use(k) {
    return this.on && this.opt[k];
  },
  save() {
    store.set('pce842hc', { on: this.on, opt: this.opt });
  },
  eT: 0 /* engine heat 0..1.2; 1 = overheated */,
  wepT: 0 /* seconds spent at war emergency power (5 minutes allowed) */,
  wepW: false,
  wepX: false,
  rpmT: 0 /* seconds above 3240 rpm */,
  ice: 0 /* airframe ice 0..1 */,
  iceW: 0,
  hyd: false /* hydroplaning on a wet runway */,
  hot: false,
  spin: false,
  dir: 0 /* +1 = left, -1 = right: which way the stall / spin goes */,
  spinT: 0 /* builds while stalled with rudder on */,
  recT: 0 /* builds while the recovery inputs are held */,
  was: false /* was stalled on the previous sub-step */,
  warnT: 0,
  warnS: 0,
  ias: 0 /* indicated airspeed, m/s */,
  red: 0 /* redline measure, mph equivalent: over 470 is the redline */,
  fuel: 1 /* internal fuel, 0..1 of 269 US gal (the fuselage tank is the last 31.6%, burned first) */,
  lowT: 0,
  reset() {
    this.str = this.over = this.warnS = 0;
    this.fuel = 1;
    this.lowT = 0;
    this.eT = 0;
    this.ice = this.iceW = 0;
    this.hyd = false;
    this.hot = this.spin = this.was = false;
    this.dir = this.spinT = this.recT = this.warnT = 0;
  },
};
