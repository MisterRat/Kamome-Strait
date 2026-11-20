/* the PCE's machinery and sea voices, built into the shared sound (SND) by its role's voices hook */
SIMS.add({
  id: 'pce',
  voices: (S, { osc, filt, gain, noise, m }) => {
    /* THE PCE'S MACHINERY AND THE SEA (audioUpd sets them): two GM 12-278A two-stroke diesels, port and starboard, each a V-12 firing
       12 times a revolution (a sawtooth at the firing rate, a square an octave down for the throb, a lumpiness at the revolution
       rate), their Roots blowers' whine, the exhaust's low rumble, the propellers' beat in the water aft, the wash along the hull
       (swelling slowly with the sea) and the wind over the deck (the old wind voice) */
    const D = { eng: [] };
    for (let k = 0; k < 2; k++) {
      const v = {
        o: osc('sawtooth', 60),
        q: osc('square', 30),
        lf: osc('sine', 5),
        wh: osc('triangle', 500),
        f: filt('lowpass', 500, 0.8),
        amp: gain(0),
        lfG: gain(0.25),
        whG: gain(0),
      };
      const mx = gain(0.5),
        qG = gain(0.6),
        body = gain(1);
      v.o.connect(mx);
      v.q.connect(qG);
      qG.connect(mx);
      mx.connect(v.f);
      v.f.connect(body);
      v.lf.connect(v.lfG);
      v.lfG.connect(body.gain);
      body.connect(v.amp);
      v.amp.connect(m);
      v.wh.connect(v.whG);
      v.whG.connect(m);
      D.eng.push(v);
    }
    D.ex = { f: filt('lowpass', 160, 0.7), g: gain(0) };
    noise().connect(D.ex.f);
    D.ex.f.connect(D.ex.g);
    D.ex.g.connect(m);
    D.pr = { f: filt('lowpass', 110, 0.8), g: gain(0), mod: gain(0), lfo: osc('square', 10), body: gain(0.5) };
    noise().connect(D.pr.f);
    D.pr.f.connect(D.pr.body);
    D.pr.lfo.connect(D.pr.mod);
    D.pr.mod.connect(D.pr.body.gain);
    D.pr.body.connect(D.pr.g);
    D.pr.g.connect(m);
    D.wa = { f: filt('bandpass', 700, 0.5), f2: filt('lowpass', 2500, 0.5), g: gain(0), sw: gain(1), lfo: osc('sine', 0.13), lfoG: gain(0.35) };
    noise().connect(D.wa.f);
    D.wa.f.connect(D.wa.f2);
    D.wa.f2.connect(D.wa.sw);
    D.wa.lfo.connect(D.wa.lfoG);
    D.wa.lfoG.connect(D.wa.sw.gain);
    D.wa.sw.connect(D.wa.g);
    D.wa.g.connect(m);
    S.d = D;
  },
});
