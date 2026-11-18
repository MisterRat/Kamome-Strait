/* ---------- sound: everything is synthesised with the Web Audio API (no files). SND holds the settings and the sounds:
   continuous voices (engine, wind, tyres, guns, warning tone) are set every frame by audioUpd(); one-shot effects are
   methods (boom, rocket, bomb, hit, gear, flaps, touch, beep). Settings (saved): sound on/off and volume. ---------- */
const SND = {
  on: true,
  vol: 0.6,
  eng: 0.1 /* engine and wind volume, 0-1 (100% = the original 3.06 loudness) */,
  ctx: null,
  gunUntil: 0,
  load() {
    const c = store.get('p51snd', null);
    if (c && typeof c === 'object') {
      this.on = c.on !== false;
      if (c.ver === 2 && typeof c.vol === 'number') this.vol = Math.max(0, Math.min(1, c.vol));
      if (c.ver === 2 && typeof c.eng === 'number') this.eng = Math.max(0, Math.min(1, c.eng));
    }
  },
  save() {
    store.set('p51snd', { on: this.on, vol: this.vol, eng: this.eng, ver: 2 });
  },
  /* the permanent voices */
  build(a) {
    this.ctx = a;
    const m = a.createGain();
    m.gain.value = 0;
    const comp = a.createDynamicsCompressor();
    m.connect(comp);
    comp.connect(a.destination);
    this.master = m;
    const nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate),
      ch = nb.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    this.nb = nb;
    const noise = () => {
        const n = a.createBufferSource();
        n.buffer = nb;
        n.loop = true;
        n.start();
        return n;
      },
      osc = (type, f) => {
        const o = a.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.start();
        return o;
      },
      gain = (v) => {
        const g = a.createGain();
        g.gain.value = v;
        return g;
      },
      filt = (type, f, q) => {
        const b = a.createBiquadFilter();
        b.type = type;
        b.frequency.value = f;
        b.Q.value = q || 1;
        return b;
      };
    /* engine: a V12's firing rate (saw waves), a sub tone, the propeller beat, an exhaust rasp and a slow burble */
    this.e = {
      o1: osc('sawtooth', 70),
      o2: osc('sawtooth', 71),
      o3: osc('square', 35),
      bl: osc('sine', 115),
      lfo: osc('sine', 12),
    };
    this.e.f = filt('lowpass', 600, 0.7);
    this.e.pop = gain(0.8);
    this.e.out = gain(0);
    const mix = gain(0.5),
      blG = gain(0.35),
      lfoG = gain(0.2),
      rasp = filt('bandpass', 260, 0.9),
      raspG = gain(0.5);
    this.e.lfoG = lfoG;
    this.e.o1.connect(mix);
    this.e.o2.connect(mix);
    this.e.o3.connect(mix);
    this.e.bl.connect(blG);
    blG.connect(mix);
    noise().connect(rasp);
    rasp.connect(raspG);
    raspG.connect(mix);
    this.e.raspG = raspG;
    mix.connect(this.e.f);
    this.e.f.connect(this.e.pop);
    this.e.pop.connect(this.e.out);
    this.e.lfo.connect(lfoG);
    lfoG.connect(this.e.pop.gain);
    this.e.out.connect(m);
    /* wind, tyre rumble, gun fire (noise pulsed at 13 Hz = six guns at ~800 rounds a minute), warning tone */
    this.w = { f: filt('bandpass', 600, 0.6), g: gain(0) };
    noise().connect(this.w.f);
    this.w.f.connect(this.w.g);
    this.w.g.connect(m);
    this.rn = { f: filt('highpass', 1500, 0.5), f2: filt('lowpass', 8000, 0.5), g: gain(0) };
    noise().connect(this.rn.f);
    this.rn.f.connect(this.rn.f2);
    this.rn.f2.connect(this.rn.g);
    this.rn.g.connect(m);
    this.r = { f: filt('lowpass', 150, 0.7), g: gain(0) };
    noise().connect(this.r.f);
    this.r.f.connect(this.r.g);
    this.r.g.connect(m);
    const gf = filt('bandpass', 1700, 0.7),
      gf2 = filt('lowpass', 380, 0.7),
      pulse = gain(0.5),
      gate = gain(0),
      gl = osc('square', 13.3),
      glG = gain(0.5);
    gl.connect(glG);
    glG.connect(pulse.gain);
    const gn = noise();
    gn.connect(gf);
    gn.connect(gf2);
    gf.connect(pulse);
    gf2.connect(pulse);
    pulse.connect(gate);
    gate.connect(m);
    this.gun = gate;
    this.wo = osc('square', 450);
    this.wg = gain(0);
    this.wo.connect(this.wg);
    this.wg.connect(m);
  },
  /* one-shot helpers */
  burst(f0, f1, dur, vol, q, type, delay) {
    const a = this.ctx;
    if (!a || !this.on) return;
    const t0 = a.currentTime + (delay || 0),
      n = a.createBufferSource(),
      f = a.createBiquadFilter(),
      g = a.createGain();
    n.buffer = this.nb;
    f.type = type || 'lowpass';
    f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    n.connect(f);
    f.connect(g);
    g.connect(this.master);
    n.start(t0, Math.random() * 1.5, dur + 0.05);
  },
  tone(f0, f1, dur, vol, type, delay) {
    const a = this.ctx;
    if (!a || !this.on) return;
    const t0 = a.currentTime + (delay || 0),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  },
  /* explosion at world point p: louder when near, and the sound arrives late at 340 m/s */
  boom(p, size) {
    const d = p.distanceTo(pos),
      v = Math.min(1, (0.55 + size * 0.02) / (1 + d / 300)),
      dl = Math.min(2.5, d / 340);
    this.burst(1100, 60, 1.2 + size * 0.04, v, 0.7, 'lowpass', dl);
    this.tone(95, 26, 1.1, v * 0.9, 'sine', dl);
  },
  rocket() {
    this.burst(500, 3200, 0.5, 0.3, 1, 'bandpass');
    this.burst(1800, 250, 1.3, 0.22, 0.6, 'lowpass', 0.08);
  },
  bomb() {
    this.burst(700, 200, 0.15, 0.3);
    this.tone(1500, 380, 3.6, 0.04, 'sine', 0.15);
  },
  flak(p) {
    const d = p.distanceTo(pos),
      v = Math.min(0.22, 0.26 / (1 + d / 350)),
      dl = Math.min(3, d / 340);
    if (v < 0.01) return;
    this.burst(1500, 260, 0.09, v, 1, 'lowpass', dl);
    this.burst(5200, 1800, 0.04, v * 0.5, 2, 'bandpass', dl);
  },
  hit() {
    this.burst(3200, 1200, 0.09, 0.3, 2, 'bandpass');
    this.tone(2200, 1500, 0.12, 0.08, 'triangle');
  },
  gear(down) {
    this.burst(260, 70, 0.45, 0.35, 1, 'lowpass', 1.1);
    this.tone(down ? 140 : 190, down ? 190 : 140, 1.2, 0.025, 'sawtooth');
  },
  flaps() {
    this.tone(280, 250, 0.9, 0.022, 'sawtooth');
  },
  touch(sink, speed) {
    const v = Math.min(1, 0.25 + sink * 0.12);
    this.burst(320, 60, 0.3, v);
    this.burst(2600, 1200, 0.18, 0.12 * v, 1.5, 'bandpass');
    /* the tyres meet the runway at speed: a chirp and a short squeal of burning rubber */
    const k = Math.min(1, (speed - 20) / 35);
    if (k > 0) {
      const d = 0.25 + 0.6 * k;
      this.burst(2100, 1500, d, 0.3 * k, 9, 'bandpass', 0.02);
      this.burst(3300, 2400, d * 0.7, 0.14 * k, 7, 'bandpass', 0.05);
      this.tone(1500, 1250, d * 0.8, 0.05 * k, 'triangle', 0.03);
      this.tone(2250, 1900, d * 0.6, 0.03 * k, 'triangle', 0.06);
      this.burst(900, 500, d * 1.2, 0.12 * k, 1.2, 'bandpass', 0.05); /* the scuff of rubber */
    }
  },
  thunder(delay) {
    this.burst(240, 35, 2.4, 0.8, 0.7, 'lowpass', delay);
    this.burst(130, 30, 3.2, 0.5, 0.7, 'lowpass', delay + 0.25);
  },
  beep(f, d) {
    this.tone(f, f, d, 0.05);
  },
  guns(any) {
    if (any) this.gunUntil = performance.now() + 110;
  },
  setOn(b) {
    this.on = b;
    this.save();
  },
  setEng(v) {
    this.eng = Math.max(0, Math.min(1, v));
    this.save();
  },
  setVol(v) {
    this.vol = Math.max(0, Math.min(1, v));
    this.save();
  },
};
SND.load();
