/* ---- interior detail: interior-green tub, consoles with levers and trim wheels, switch panel, pedals, harness, gun sight ---- */
{
  const ig = new THREE.MeshLambertMaterial({ color: 0x6f7d4b, side: 2 }),
    ig2 = new THREE.MeshLambertMaterial({ color: 0x56633d, side: 2 }),
    blk = new THREE.MeshLambertMaterial({ color: 0x0e0e0f }),
    bel = new THREE.MeshLambertMaterial({ color: 0x8d8059, side: 2 }),
    chr = PH(0xc4c8cc, 90, 0xffffff),
    blu = new THREE.MeshLambertMaterial({ color: 0x2a58b8 }),
    tog = PH(0xd8dadc, 80, 0xffffff),
    Z = Math.PI / 2;
  const A = (g, m, x, y, z, rx, ry, rz, p) => {
    const o = add(g, m, x, y, z, p || ck);
    o.rotation.set(rx || 0, ry || 0, rz || 0);
    return o;
  };
  [-1, 1].forEach((sd) => {
    A(new THREE.BoxGeometry(0.16, 0.035, 0.72), ig2, sd * 0.45, 0.352, -0.48); /* console tops */
    ckPedU[sd] = A(new THREE.BoxGeometry(0.13, 0.12, 0.02), blk, sd * 0.17, 0.09, -1.3, -0.4);
    A(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), chr, sd * 0.17, -0.03, -1.4, 0.5);
    ckPed[sd] = A(new THREE.BoxGeometry(0.11, 0.012, 0.16), blk, sd * 0.17, -0.02, -1.05); /* rudder pedals + arms */
    bar([sd * 0.15, 1.136, -0.2], [sd * 0.1, 0.436, -0.43], 0.04, bel);
    A(new THREE.BoxGeometry(0.05, 0.03, 0.03), chr, sd * 0.1, 0.436, -0.43);
  }); /* harness straps + buckles */
  A(new THREE.BoxGeometry(0.5, 0.02, 0.08), bel, 0, 0.401, -0.52); /* lap belt */
  A(new THREE.BoxGeometry(0.1, 0.012, 0.3), blk, -0.43, 0.372, -0.53); /* throttle quadrant slot plate */
  A(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), chr, -0.43, 0.47, -0.56, 0, 0, 0.1);
  A(new THREE.SphereGeometry(0.03, 10, 8), blu, -0.44, 0.5695, -0.56); /* prop lever (blue), on top of its shaft */
  A(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), chr, -0.43, 0.45, -0.64, 0, 0, -0.08);
  A(new THREE.SphereGeometry(0.026, 10, 8), red, -0.4236, 0.53, -0.64); /* mixture (red), on top of its shaft */
  /* trim wheels: black knurled wheels set in a shelf on the left wall, rims sticking up through slots, with a placard */
  {
    const rub = new THREE.MeshLambertMaterial({ color: 0x1b1b1d });
    A(new THREE.BoxGeometry(0.075, 0.03, 0.42), ig2, -0.545, 0.36, -0.27); /* the shelf */
    A(new THREE.BoxGeometry(0.06, 0.006, 0.38), blk, -0.545, 0.377, -0.27);
    [-0.4, -0.27, -0.14].forEach((z, i) => {
      const w = new THREE.Group();
      w.position.set(-0.545, 0.352, z);
      ck.add(w);
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.05, 0.024, 16).rotateZ(Z), rub);
      w.add(wh);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10).rotateZ(Z), chr);
      w.add(hub);
      w.rotation.x = 0.4 * (i - 1);
    });
    const pc = document.createElement('canvas');
    pc.width = 512;
    pc.height = 96;
    const pg2 = pc.getContext('2d');
    pg2.fillStyle = '#0d0d0e';
    pg2.fillRect(0, 0, 512, 96);
    pg2.fillStyle = '#e6e6e0';
    pg2.font = 'bold 26px sans-serif';
    pg2.textAlign = 'center';
    pg2.fillText('RUDDER    AILERON    ELEVATOR', 256, 38);
    pg2.font = '20px sans-serif';
    pg2.fillText('T R I M   T A B S', 256, 72);
    pg2.strokeStyle = '#aaa';
    pg2.lineWidth = 3;
    pg2.strokeRect(4, 4, 504, 88);
    const plate = A(
      new THREE.PlaneGeometry(0.42, 0.08),
      new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(pc) }),
      -0.567,
      0.27,
      -0.27,
      0,
      1.5708,
      0,
    );
    plate.material.side = 2;
  }
  /* right side: a switch panel tilted up toward the pilot, with toggle switches that flip UP and DOWN */
  {
    const sp = new THREE.Group();
    sp.position.set(0.47, 0.4, -0.4);
    sp.rotation.z = 0.9;
    ck.add(sp);
    add(new THREE.BoxGeometry(0.15, 0.025, 0.5), blk, 0, 0, 0, sp);
    for (let i = 0; i < 7; i++) {
      const sx = -0.03,
        t = add(new THREE.CylinderGeometry(0.007, 0.007, 0.04, 6), tog, sx, 0.026, -0.22 + i * 0.07, sp);
      t.rotation.z = i % 3 ? 0.5 : -0.5; /* lever tilts along the panel's up/down direction */
      add(
        new THREE.SphereGeometry(0.009, 8, 6),
        tog,
        sx + Math.sin(t.rotation.z) * -0.02,
        0.026 + Math.cos(t.rotation.z) * 0.02,
        -0.22 + i * 0.07,
        sp,
      );
      add(new THREE.CylinderGeometry(0.013, 0.013, 0.01, 10), i % 2 ? red : chr, 0.045, 0.016, -0.22 + i * 0.07, sp);
    }
    mergeGroup(sp);
    {
      const lc = document.createElement('canvas');
      lc.width = 128;
      lc.height = 512;
      const lg = lc.getContext('2d');
      lg.fillStyle = '#0b0c0d';
      lg.fillRect(0, 0, 128, 512);
      lg.fillStyle = '#d8dadc';
      lg.font = 'bold 26px sans-serif';
      lg.textAlign = 'center';
      lg.textBaseline = 'middle';
      ['GEN', 'BATT', 'GUN HT', 'PITOT', 'POS LT', 'RECOG', 'COCKPT'].forEach((t, i) =>
        lg.fillText(t, 64, ((0.03 + 0.07 * i) / 0.5) * 512),
      );
      const lb = new THREE.Mesh(
        new THREE.PlaneGeometry(0.07, 0.5),
        new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(lc), side: 2 }),
      );
      lb.rotation.x = -Math.PI / 2;
      lb.position.set(0.008, 0.0135, 0);
      sp.add(lb);
    }
  }
  /* the red canopy release arm: runs along the right sill, inside the glass, from the windscreen bow forward toward the instrument panel */
  {
    const redM = new THREE.MeshLambertMaterial({ color: 0xc41d14 }),
      zA = fz(150) + 0.02,
      zB = fz(150) - 0.34,
      pA = [sillX(zA) - 0.05, sillY(zA) + 0.07, zA],
      pB = [sillX(zB) - 0.07, sillY(zB) + 0.16, zB];
    add(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 12).rotateZ(Z), blk, pA[0], pA[1], pA[2], ckW); /* hinge block */
    bar(pA, pB, 0.022, redM, ckW);
    add(new THREE.SphereGeometry(0.024, 10, 8), redM, pB[0], pB[1], pB[2], ckW);
  }
  /* left wall: a red lever (undercarriage/flaps) and a floor of dark red with two foot plates; the stick gets a rubber boot */
  {
    /* landing gear control (60): a lever with a wheel-shaped knob, tilts with the gear */
    const gg = new THREE.Group();
    gg.position.set(-0.55, 0.3, -0.95);
    ck.add(gg);
    bar([0, 0, 0], [0.05, 0.22, -0.1], 0.022, red, gg);
    A(new THREE.CylinderGeometry(0.035, 0.035, 0.014, 14).rotateZ(Z), red, 0.05, 0.22, -0.1, 0, 0, 0, gg);
    ckLev.gear = gg;
  }
  A(new THREE.BoxGeometry(0.98, 0.02, 1.7), new THREE.MeshLambertMaterial({ color: 0x4a1f19 }), 0, -0.12, -0.62);
  [-1, 1].forEach((sd) =>
    A(
      new THREE.BoxGeometry(0.24, 0.006, 0.36),
      new THREE.MeshLambertMaterial({ color: 0x1c1c1e }),
      sd * 0.2,
      -0.106,
      -1.05,
    ),
  );
  A(
    new THREE.CylinderGeometry(0.035, 0.095, 0.2, 14),
    new THREE.MeshLambertMaterial({ color: 0x3d3b2f }),
    0,
    0.15,
    -0.82,
  );
  /* ---- the manual's consoles (figures 3 and 4): side shelves with the placards, the left console controls, the right radios ---- */
  {
    const n0b = ck.children.length;
    const mk = (pw, ph, fn) => {
      const c = document.createElement('canvas');
      c.width = pw;
      c.height = ph;
      fn(c.getContext('2d'), pw, ph);
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 4;
      return new THREE.MeshLambertMaterial({ map: t, side: 2 });
    };
    const plate = (g, pw, ph, bg, fg) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, pw, ph);
      g.strokeStyle = fg;
      g.lineWidth = 6;
      g.strokeRect(8, 8, pw - 16, ph - 16);
      g.fillStyle = fg;
      g.textBaseline = 'middle';
    };
    const dark = 0x1b1d1a;
    /* raised side shelves above each console, tilted in toward the pilot */
    const shelf = {};
    [-1, 1].forEach((sd) => {
      const sh = A(new THREE.BoxGeometry(0.02, 0.2, 0.64), ig, sd * 0.55, 0.455, -0.46);
      sh.rotation.z = -sd * 0.15;
      if (sd > 0) {
        sh.position.y = 0.56; /* raised clear of the switch panel below it, and stood up straighter so it stays inside the skin */
        sh.rotation.z = -0.1;
      }
      shelf[sd] = sh;
    });
    const onShelf = (sd, g, m, w, h, z, y) => {
      const o = A(new THREE.PlaneGeometry(w, h), m, -sd * 0.0108, y || 0, z, 0, (-sd * Math.PI) / 2, 0, shelf[sd]);
      return o;
    };
    /* left shelf: airplane restriction plate (51), fuel system diagram (52), map case (53) */
    onShelf(
      -1,
      null,
      mk(1024, 420, (g, w, h) => {
        plate(g, w, h, '#d6d3c4', '#16160f');
        g.textAlign = 'center';
        g.font = 'bold 58px sans-serif';
        g.fillText('AIRPLANE RESTRICTION PLATE', w / 2, 62);
        g.font = 'bold 46px sans-serif';
        g.fillText('MAX. DIVING SPEED 505 I.A.S.', w / 2, 140);
        g.fillText('MAX. DIVING R.P.M. 3240', w / 2, 200);
        g.font = 'bold 42px sans-serif';
        g.fillText('FLAP RESTRICTIONS  (MAX. I.A.S.)', w / 2, 270);
        g.font = 'bold 40px sans-serif';
        g.fillText('10° 400   20° 275   30° 225   40° 180   50° 165', w / 2, 322);
        g.font = 'bold 40px sans-serif';
        g.fillText('DO NOT LOWER LANDING GEAR ABOVE 170 I.A.S.', w / 2, 380);
      }),
      0.2,
      0.085,
      0.17,
    );
    onShelf(
      -1,
      null,
      mk(512, 420, (g, w, h) => {
        plate(g, w, h, '#cfd0c2', '#16160f');
        g.textAlign = 'center';
        g.font = 'bold 40px sans-serif';
        g.fillText('FUEL SYSTEM', w / 2, 48);
        g.strokeStyle = '#16160f';
        g.lineWidth = 6;
        const bx = (x, y, t) => {
          g.strokeRect(x, y, 130, 56);
          g.font = 'bold 28px sans-serif';
          g.fillText(t, x + 65, y + 30);
        };
        bx(40, 90, 'L. MAIN');
        bx(330, 90, 'R. MAIN');
        bx(185, 180, 'FUS. TANK');
        g.beginPath();
        g.arc(w / 2, 290, 34, 0, 7);
        g.stroke();
        g.font = 'bold 22px sans-serif';
        g.fillText('SELECTOR', w / 2, 290);
        g.beginPath();
        g.moveTo(105, 146);
        g.lineTo(105, 215);
        g.lineTo(w / 2 - 36, 285);
        g.moveTo(395, 146);
        g.lineTo(395, 215);
        g.lineTo(w / 2 + 36, 285);
        g.moveTo(250, 236);
        g.lineTo(250, 256);
        g.moveTo(w / 2, 324);
        g.lineTo(w / 2, 384);
        g.stroke();
        g.font = 'bold 26px sans-serif';
        g.fillText('TO ENGINE', w / 2, 400);
      }),
      0.1,
      0.085,
      -0.02,
    );
    A(new THREE.BoxGeometry(0.035, 0.07, 0.15), ig2, -0.012, 0, -0.26, 0, 0, 0, shelf[-1]); /* map case pocket */
    onShelf(
      -1,
      null,
      mk(256, 96, (g, w, h) => {
        plate(g, w, h, '#2a2c26', '#e6e6dc');
        g.textAlign = 'center';
        g.font = 'bold 40px sans-serif';
        g.fillText('MAP CASE', w / 2, h / 2);
      }),
      0.07,
      0.026,
      -0.26,
    ).position.x -= 0.03;
    /* right shelf: engine limitations plate (63) and the SCR-522 radio control box (64) */
    onShelf(
      1,
      null,
      mk(1024, 520, (g, w, h) => {
        plate(g, w, h, '#d6d3c4', '#16160f');
        g.textAlign = 'center';
        g.font = 'bold 52px sans-serif';
        g.fillText('PACKARD V-1650-7   100 OCT.', w / 2, 60);
        g.textAlign = 'left';
        g.font = 'bold 36px sans-serif';
        g.fillText('R.P.M.   M.P.', 330, 118);
        g.font = 'bold 34px sans-serif';
        [
          ['TAKE OFF ONLY', '3000', '61'],
          ['WAR EMERG. 5 MIN.', '3000', '67'],
          ['MILITARY 15 MIN.', '3000', '61'],
          ['MAX. CONTINUOUS', '2700', '46'],
          ['CRUISE-MAX', '2400', '36'],
        ].forEach((r, i) => {
          g.fillText(r[0], 36, 170 + i * 52);
          g.fillText(r[1], 380, 170 + i * 52);
          g.fillText(r[2], 540, 170 + i * 52);
        });
        g.font = 'bold 30px sans-serif';
        g.fillText('COOLANT   121 MAX.   100-110', 36, 460);
        g.fillText('OIL TEMP.   90 MAX.   70-80', 36, 500);
        g.fillText('OIL PRESS.  90 MAX.  70-80  (MIN. 50)', 520, 460);
        g.fillText('FUEL PRESS.  19 MAX.  12-16', 520, 500);
        g.fillText('TAKE-OFF: OIL 15°C MIN.', 640, 170);
        g.fillText('COOLANT 60°C MIN.', 640, 215);
        g.fillText('MAX. DIVE 3240 RPM', 640, 260);
      }),
      0.27,
      0.11,
      0.16,
    );
    A(
      new THREE.BoxGeometry(0.05, 0.1, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x4d5240 }),
      -0.02,
      0,
      -0.2,
      0,
      0,
      0,
      shelf[1],
    );
    onShelf(
      1,
      null,
      mk(256, 128, (g, w, h) => {
        plate(g, w, h, '#16171a', '#d8dadc');
        g.textAlign = 'center';
        g.font = 'bold 32px sans-serif';
        g.fillText('SCR-522', w / 2, 36);
        g.font = 'bold 20px sans-serif';
        g.fillText('A  B  C  D', w / 2, 96);
      }),
      0.08,
      0.04,
      -0.2,
    ).position.x -= 0.045;
    [-0.23, -0.17].forEach((z) =>
      A(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10).rotateZ(Z), chr, -0.047, -0.03, z, 0, 0, 0, shelf[1]),
    );
    /* the left console (figure 3): switches (45-49), friction lock (42-43), flap control (54), carburettor air (55), bomb control (61, 62) */
    A(new THREE.BoxGeometry(0.15, 0.006, 0.07), blk, -0.45, 0.371, -0.8);
    for (let i = 0; i < 5; i++) {
      const x = -0.505 + i * 0.027,
        t = A(new THREE.CylinderGeometry(0.0055, 0.0055, 0.03, 6), tog, x, 0.387, -0.8, i % 2 ? 0.5 : -0.5);
      A(new THREE.SphereGeometry(0.008, 8, 6), tog, x, 0.4, -0.8 - Math.sin(t.rotation.x) * 0.012);
    }
    bar([-0.505, 0.372, -0.47], [-0.505, 0.43, -0.43], 0.012, blk);
    A(new THREE.SphereGeometry(0.014, 8, 6), blk, -0.505, 0.43, -0.43); /* friction lock lever */
    A(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 12), blk, -0.46, 0.38, -0.26); /* carburettor air control knob */
    {
      const fg =
        new THREE.Group(); /* wing flap control (54): a lever with a round knob at the aft end of the pedestal */
      fg.position.set(-0.5, 0.372, -0.2);
      ck.add(fg);
      bar([0, 0, 0], [0, 0.1, 0], 0.014, blk, fg);
      A(
        new THREE.SphereGeometry(0.02, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0xe6e4dc }),
        0,
        0.105,
        0,
        0,
        0,
        0,
        fg,
      );
      ckLev.flap = fg;
    }
    bar(
      [-0.52, 0.36, -0.9],
      [-0.52, 0.42, -0.86],
      0.016,
      new THREE.MeshLambertMaterial({ color: 0xc41d14 }),
    ); /* bomb control handle (61) */
    A(new THREE.BoxGeometry(0.05, 0.03, 0.02), blk, -0.52, 0.375, -0.9); /* antisalvo guard (62) */
    /* a placard for the left switches */
    A(
      new THREE.PlaneGeometry(0.15, 0.025),
      mk(512, 90, (g, w, h) => {
        plate(g, w, h, '#14151a', '#c8cac6');
        g.textAlign = 'center';
        g.font = 'bold 30px sans-serif';
        ['FLUOR', 'LAND', 'OIL', 'COOL', 'COCKPIT'].forEach((t, i) => g.fillText(t, 50 + i * 103, 46));
      }),
      -0.45,
      0.373,
      -0.84,
      -Math.PI / 2,
      0,
      0,
    );
    /* right console: detonator switches with red DANGER guards (65), the SCR-695 radio box (83), seat adjustment handle (82), oxygen regulator (72) */
    A(new THREE.BoxGeometry(0.1, 0.006, 0.07), blk, 0.43, 0.371, -0.8);
    [-0.025, 0.025].forEach((dx) =>
      A(
        new THREE.BoxGeometry(0.03, 0.03, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xc41d14 }),
        0.43 + dx,
        0.385,
        -0.8,
      ),
    );
    A(
      new THREE.PlaneGeometry(0.1, 0.02),
      mk(256, 52, (g, w, h) => {
        plate(g, w, h, '#a31812', '#f2eee2');
        g.textAlign = 'center';
        g.font = 'bold 34px sans-serif';
        g.fillText('DANGER', w / 2, h / 2);
      }),
      0.43,
      0.373,
      -0.745,
      -Math.PI / 2,
      0,
      0,
    );
    A(
      new THREE.BoxGeometry(0.07, 0.07, 0.11),
      new THREE.MeshLambertMaterial({ color: 0x4d5240 }),
      0.5,
      0.4,
      -0.16,
    ); /* SCR-695 box */
    A(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 10).rotateX(Z), chr, 0.5, 0.41, -0.105);
    bar([0.24, 0.1, -0.42], [0.27, 0.18, -0.34], 0.014, blk);
    A(new THREE.SphereGeometry(0.016, 8, 6), blk, 0.27, 0.18, -0.34); /* seat adjustment handle */
    A(
      new THREE.BoxGeometry(0.06, 0.06, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x4a4f44 }),
      0.5,
      0.3,
      -1.32,
    ); /* oxygen regulator */
    A(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12).rotateX(Z), chr, 0.5, 0.31, -1.29);
    const mgp = new THREE.Group(); /* the plain parts of the consoles are merged to save draw calls */
    ck.add(mgp);
    ck.children.slice(n0b).forEach((o) => {
      if (o.isMesh && !Array.isArray(o.material) && !o.material.map && !o.children.length) mgp.add(o); /* meshes that carry children (the shelves and their plates) stay as they are */
    });
    mergeGroup(mgp);
  }
  /* the side walls: riveted olive plate with placards */
  {
    const wc = document.createElement('canvas');
    wc.width = 1024;
    wc.height = 256;
    const g = wc.getContext('2d');
    g.fillStyle = '#6a7847';
    g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = 'rgba(20,24,12,.55)';
    g.lineWidth = 2;
    for (let x = 0; x <= 1024; x += 170) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    g.fillStyle = 'rgba(30,34,20,.6)';
    for (let x = 6; x < 1024; x += 17)
      for (const y of [10, 246]) {
        g.beginPath();
        g.arc(x, y, 2.2, 0, 7);
        g.fill();
      }
    for (const [x0, w] of [
      [90, 170],
      [520, 230],
    ]) {
      g.fillStyle = '#101011';
      g.fillRect(x0, 70, w, 110);
      g.fillStyle = '#d8d8d0';
      for (let k = 0; k < 5; k++) g.fillRect(x0 + 10, 82 + k * 20, w - 20 - ((k * 37) % 60), 6);
    }
    g.fillStyle = '#b32018';
    g.fillRect(300, 200, 150, 8);
    tubM.map = new THREE.CanvasTexture(wc);
    tubM.color.set(0xffffff);
    tubM.needsUpdate = true;
    ig.map = new THREE.CanvasTexture(wc);
    ig.map.anisotropy = 4;
    ig.color.set(0xffffff);
    ig.needsUpdate = true;
  }
  {
    const gl = new THREE.MeshBasicMaterial({
      color: 0xaed8ff,
      transparent: true,
      opacity: 0.14,
      side: 2,
      depthWrite: false,
    });
    A(new THREE.BoxGeometry(0.11, 0.1, 0.003), gl, 0, 1.149, -1.55, 0.75);
    A(new THREE.BoxGeometry(0.125, 0.008, 0.012), blk, 0, 1.112, -1.584);
    A(new THREE.BoxGeometry(0.02, 0.075, 0.02), blk, 0, 1.074, -1.6);
  } /* reflector sight glass */
  A(new THREE.BoxGeometry(0.05, 0.11, 0.055), blk, 0, 0.585, 0, 0, 0, 0, ckStick);
  A(new THREE.SphereGeometry(0.013, 8, 6), red, 0, 0.64, -0.01, 0, 0, 0, ckStick);
  A(new THREE.BoxGeometry(0.012, 0.04, 0.02), chr, 0, 0.6, -0.04, 0, 0, 0, ckStick);
  /* the wall shelves and panels sit a little too close to the skin: keep them inside it */
  ck.children.forEach((o) => {
    if (Math.abs(o.position.x) >= 0.53) o.position.x -= Math.sign(o.position.x) * 0.065;
  });
  /* the instrument panel, glare shield and gun sight come back toward the pilot: the eye was about 0.9 m from the panel, the real one is nearer 0.7 m */
  ck.children.forEach((o) => {
    if (o.position.z < -1.45 && o.position.y > 0.7) o.position.z += 0.27;
  });
} /* stick grip, button, trigger */
