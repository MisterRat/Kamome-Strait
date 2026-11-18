/* wind by weather: [min, max, gust] in m/s; strength settings; turbulence by weather; air temperature offset from the standard day */
const WXW = {
    clear: [2, 6, 2],
    partly: [3, 8, 3],
    overcast: [5, 10, 4],
    rain: [7, 13, 5],
    storm: [12, 19, 10],
    fog: [0, 3, 1],
  },
  WXWS = { normal: 1, calm: 0, light: 0.5, strong: 1.6, extreme: 2.4 },
  WXT = { clear: 0.06, partly: 0.18, overcast: 0.3, rain: 0.55, storm: 1, fog: 0.08 },
  WXOFF = { clear: 0, partly: -2, overcast: -8, rain: -10, storm: -14, fog: -6 };
const WX = {
  time: 'midday',
  wx: 'partly',
  flow: false,
  hour: 13,
  shK: 1 /* cloud-shadow strength */,
  rainK: 0,
  flash: 0,
  wd: 'auto' /* wind direction setting: auto or a bearing */,
  ws: 'normal' /* wind strength setting */,
  wnd: { from: 0, spd: 0, gust: 0 } /* the weather's wind: direction it blows FROM (deg), speed, gust size (m/s) */,
  wet: 0 /* runway wetness 0..1 */,
  t: 0,
  tI: 0 /* turbulence intensity now */,
  inCloud: false,
  ct: 0,
  sp: 0,
  dirTo: 0,
  wx_: 0,
  wz_: 0,
  cdx: 5.5,
  cdz: 1.8,
  load() {
    const c = store.get('wx', null);
    if (c && typeof c === 'object') {
      if (c.time === 'local' || WX_HOUR[c.time] !== undefined) this.time = c.time;
      if (WX_SET[c.wx]) this.wx = c.wx;
      this.flow = c.flow === true;
      if (c.wd === 'auto' || /^(0|90|180|270)$/.test(c.wd)) this.wd = c.wd;
      if (WXWS[c.ws] !== undefined) this.ws = c.ws;
    }
  },
  save() {
    store.set('wx', { time: this.time, wx: this.wx, flow: this.flow, wd: this.wd, ws: this.ws });
  },
};
WX.load();
