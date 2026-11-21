/* ---------- the faces ---------- */
function stnDraw(f, dt) {
  const g = f.g,
    s = 256,
    kn = Math.abs(SHIP.u) / 0.5144,
    rpm = Math.abs(ENG.ans) * 744 /* 12-278A full rpm (est.) */,
    hd = ((((-SHIP.hdg * 180) / Math.PI) % 360) + 360) % 360;
  switch (f.id) {
    case 'radar':
      radarDraw(f, dt || 0);
      break;
    case 'sonarRec':
      sonarRecDraw(f);
      break;
    case 'sonarBrg':
      sonarBrgDraw(f);
      break;
    case 'radio':
      radioDraw(f);
      break;
    case 'dcBoard':
      dcBoardDraw(f);
      break;
    case 'qmCompass': {
      /* the compass card turns under the lubber line: the ship's head is at the top */
      const T = [];
      for (let d = 0; d < 360; d += 5) T.push([((d - hd) * Math.PI) / 180, d % 30 ? '' : String(d / 10).padStart(2, '0'), d % 10 === 0]);
      dialFace(g, s, T, '');
      g.fillStyle = '#b01a10';
      g.fillRect(s / 2 - 2, 6, 4, s * 0.2);
      g.font = 'bold 30px monospace';
      g.fillStyle = '#111';
      g.fillText(String(Math.round(hd) % 360).padStart(3, '0'), s / 2, s / 2);
      break;
    }
    case 'qmRudder': {
      const T = [];
      for (let d = -40; d <= 40; d += 5) T.push([(d * 2.8 * Math.PI) / 180, d % 10 ? '' : String(Math.abs(d)), d % 10 === 0]);
      dialFace(g, s, T, 'RUDDER');
      needle(g, s, (SHIP.rud * 35 * 2.8 * Math.PI) / 180, '#111');
      break;
    }
    case 'qmTelP':
    case 'qmTelS':
    case 'eTel':
      telDial(g, s, telIdx(SHIP.tel), telIdx(ENG.ans));
      break;
    case 'qmRpmP':
    case 'qmRpmS':
    case 'eg0':
      gauge(g, s, rpm, 0, 800, 100, 'ENGINE RPM');
      break;
    case 'eg1':
      gauge(g, s, rpm / 2.0, 0, 400, 50, 'SHAFT RPM');
      break;
    case 'eg2':
      gauge(g, s, rpm > 30 ? 30 + rpm * 0.035 : 5, 0, 100, 20, 'LUBE PSI');
      break;
    case 'eg3':
      gauge(g, s, 120 + ENG.heat * 60, 100, 220, 20, 'WATER F');
      break;
    case 'eg4':
      gauge(g, s, 200 + rpm * 0.75 + ENG.heat * 80, 0, 1000, 200, 'EXHAUST F');
      break;
    case 'eg5':
      gauge(g, s, rpm > 30 ? 28 + rpm * 0.01 : 2, 0, 60, 10, 'FUEL PSI');
      break;
    case 'eg6':
      gauge(g, s, rpm * 0.0075, 0, 8, 1, 'SCAV AIR');
      break;
    case 'eg7':
      gauge(g, s, kn, 0, 20, 4, 'KNOTS');
      break;
    case 'qmClock': {
      const T = [];
      for (let i = 0; i < 12; i++) T.push([(i * Math.PI) / 6, String(i || 12), true]);
      dialFace(g, s, T, '');
      const h = WX.hour || 0;
      needle(g, s, ((h % 12) / 12) * Math.PI * 2, '#111', 0.26);
      needle(g, s, (h % 1) * Math.PI * 2, '#111', 0.4);
      break;
    }
  }
  f.tex.needsUpdate = true;
}
