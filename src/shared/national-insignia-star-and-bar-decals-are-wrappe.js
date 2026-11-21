/* national insignia (star-and-bar): shapes wrapped onto the real surface so they never clip or float */
{
  const wingY = (X, z, sg) => {
    const u = Math.min(1, Math.abs(X) / WSEMI),
      zl = wzle(u),
      vz = Math.max(-0.5, Math.min(0.5, (z - zl) / (wzh(u) - zl) - 0.5));
    return WR + sg * 0.5 * (0.38 - 0.24 * u) * (1 - 0.75 * Math.pow(2 * vz, 2)) + u * WD;
  };
  /* the star-and-bar as shapes, not a picture: drawn on a 256 x 128 sheet (the old decal's layout), cut into regions that do not
     overlap (the bar's blue border, the white bar, the blue disc round the star, the white star), triangulated, the triangles split
     until they are small enough to follow the skin, and each corner laid on the surface by the decal's own wrap fn(u, v). Vertex
     coloured, so a copy of the aircraft (P51DISP) carries the markings in its one mesh. */
  const blue = 0x1c3a7a,
    white = 0xf2f2f2,
    CX = 128,
    CY = 64,
    RD = 60;
  const ring = (n, r) => Array.from({ length: n }, (_, i) => [CX + r * Math.cos((i / n) * 2 * Math.PI), CY + r * Math.sin((i / n) * 2 * Math.PI)]);
  const star = Array.from({ length: 10 }, (_, i) => {
    const an = -Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 15 : 38;
    return [CX + Math.cos(an) * r, CY + Math.sin(an) * r];
  });
  /* a strip x0..x1, y0..y1 across the disc, less the disc: its left and right pieces */
  const strip = (x0, y0, x1, y1) => {
    const xs = (y) => Math.sqrt(RD * RD - (y - CY) * (y - CY)),
      L = [[x0, y0]],
      Rr = [[x1, y1]];
    for (let k = 0; k <= 8; k++) {
      const y = y0 + ((y1 - y0) * k) / 8;
      L.push([CX - xs(y), y]);
    }
    L.push([x0, y1]);
    for (let k = 0; k <= 8; k++) {
      const y = y1 - ((y1 - y0) * k) / 8;
      Rr.push([CX + xs(y), y]);
    }
    Rr.push([x1, y0]);
    return [L, Rr];
  };
  const REGIONS = [
    [white, star, []],
    [blue, ring(48, RD), [star]],
    ...strip(12, 52, 244, 76).map((p) => [white, p, []]),
    ...strip(6, 46, 250, 52).map((p) => [blue, p, []]),
    ...strip(6, 76, 250, 82).map((p) => [blue, p, []]),
    [blue, [[6, 52], [12, 52], [12, 76], [6, 76]], []],
    [blue, [[244, 52], [250, 52], [250, 76], [244, 76]], []],
  ];
  const im = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  /* out: the side the marking faces (every triangle is turned to face it, so a copy drawn one-sided keeps it) */
  const decal = (nu, nv, fn, out) => {
    const P = [],
      C = [],
      col = new THREE.Color(),
      put = (a) => {
        const q = fn(a[0] / 256, 1 - a[1] / 128);
        P.push(q[0], q[1], q[2]);
        C.push(col.r, col.g, col.b);
      };
    const tri = (a, b, c) => {
      const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]),
        ab = d(a, b),
        bc = d(b, c),
        ca = d(c, a),
        m = Math.max(ab, bc, ca);
      if (m <= 9) {
        const A = fn(a[0] / 256, 1 - a[1] / 128),
          B = fn(b[0] / 256, 1 - b[1] / 128),
          Cc = fn(c[0] / 256, 1 - c[1] / 128),
          ux = B[0] - A[0],
          uy = B[1] - A[1],
          uz = B[2] - A[2],
          vx = Cc[0] - A[0],
          vy = Cc[1] - A[1],
          vz = Cc[2] - A[2];
        return (uy * vz - uz * vy) * out[0] + (uz * vx - ux * vz) * out[1] + (ux * vy - uy * vx) * out[2] < 0 ? (put(a), put(c), put(b)) : (put(a), put(b), put(c));
      }
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (m === ab) tri(a, mid(a, b), c), tri(mid(a, b), b, c);
      else if (m === bc) tri(a, b, mid(b, c)), tri(a, mid(b, c), c);
      else tri(a, b, mid(c, a)), tri(mid(c, a), b, c);
    };
    for (const [hex, outer, holes] of REGIONS) {
      col.setHex(hex);
      const V2 = (p) => new THREE.Vector2(p[0], p[1]),
        all = outer.concat(...holes);
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(outer.map(V2), holes.map((h) => h.map(V2)))) tri(all[a], all[b], all[c]);
    }
    const gm = new THREE.BufferGeometry();
    gm.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    gm.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    gm.computeVertexNormals();
    gm.computeBoundingSphere();
    return add(gm, im, 0, 0, 0);
  };
  /* fuselage sides: follow the tapering round body */
  [1, -1].forEach((s) => {
    const z0 = 1.85,
      z1 = 2.85,
      f0 = 0.6;
    decal(16, 6, (u, v) => {
      const z = s > 0 ? z1 - u * (z1 - z0) : z0 + u * (z1 - z0),
        ph = (v - 0.5) * 2 * f0,
        q = fusPt(z, ph, 0.008);
      return [s * q[0], q[1], z];
    }, [s, 0, 0]);
  });
  /* upper left wing: follows taper, dihedral and airfoil thickness */
  decal(16, 8, (u, v) => {
    const X = -4.25 + u * 1.5,
      z = wmid(3.5 / WSEMI) + 0.375 - v * 0.75;
    return [X, wingY(X, z, 1) + 0.012, z];
  }, [0, 1, 0]);
  /* lower right wing, inboard of the ordnance stations */
  decal(16, 8, (u, v) => {
    const X = 2.5 - u * 1.5,
      z = wmid(1.75 / WSEMI) + 0.375 - v * 0.75;
    return [X, wingY(X, z, -1) - 0.012, z];
  }, [0, -1, 0]);
  /* ---- nose art (chosen in the pause menu): painted decals wrapped onto the cowling, plus a victory tally under the cockpit ---- */
  {
    const NW = 1024,
      NH = 240,
      CH = 320,
      TW = 512,
      TH = 96,
      fam =
        '"Brush Script MT","Segoe Script","Snell Roundhand","Apple Chancery","Lucida Handwriting","URW Chancery L",cursive';
    const mk = (w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };
    const sides = [],
      tallies = [];
    const wrap = (s, z0, z1, phc, phh, cv, off, rf) => {
      const tx = new THREE.CanvasTexture(cv);
      tx.anisotropy = 4;
      const mat = new THREE.MeshLambertMaterial({
          map: tx,
          transparent: true,
          alphaTest: 0.06,
          side: THREE.DoubleSide,
        }),
        gm = new THREE.PlaneGeometry(1, 1, 40, 6),
        uv = gm.attributes.uv,
        p = gm.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i),
          v = uv.getY(i),
          z = s > 0 ? z1 - u * (z1 - z0) : z0 + u * (z1 - z0),
          ph = phc + (v - 0.5) * 2 * phh,
          q = rf ? rf(z, ph) : fusPt(z, ph, off);
        p.setXYZ(i, s * q[0], q[1], z);
      }
      gm.computeVertexNormals();
      gm.computeBoundingSphere();
      const m = add(gm, mat, 0, 0, 0);
      return { m, tx, cv };
    };
    const mouths = [],
      MH = 452,
      mouthR = (z, ph) => fusPt(z, ph, 0.012);
    [-1, 1].forEach((s) => {
      mouths.push({ s, ...wrap(s, fz(28), -1.95, -0.265, 0.885, mk(NW, MH), 0, mouthR) });
      sides.push({ s, ...wrap(s, fz(46), -1.95, -0.36, 0.46, mk(NW, CH), 0.012) });
      tallies.push({ s, ...wrap(s, -1.5, -0.35, 0.09, 0.17, mk(TW, TH), 0.012) });
    });
    const star = (g, x, y, r, fill, stroke) => {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5,
          rr = i % 2 ? r * 0.42 : r;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath();
      g.fillStyle = fill;
      g.fill();
      if (stroke) {
        g.lineWidth = 3;
        g.strokeStyle = stroke;
        g.stroke();
      }
    };
    const script = (g, txt, cx, cy, maxW, maxH) => {
      let sz = maxH;
      g.font = 'italic bold ' + sz + 'px ' + fam;
      while (g.measureText(txt).width > maxW && sz > 20) {
        sz -= 4;
        g.font = 'italic bold ' + sz + 'px ' + fam;
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineJoin = 'round';
      g.lineWidth = sz * 0.2;
      g.strokeStyle = 'rgba(20,5,5,.9)';
      g.strokeText(txt, cx + sz * 0.035, cy + sz * 0.05);
      g.lineWidth = sz * 0.12;
      g.strokeStyle = '#161212';
      g.strokeText(txt, cx, cy);
      const gr = g.createLinearGradient(0, cy - sz / 2, 0, cy + sz / 2);
      gr.addColorStop(0, '#fff7c4');
      gr.addColorStop(0.55, '#ffd53a');
      gr.addColorStop(1, '#ff8a1c');
      g.fillStyle = gr;
      g.fillText(txt, cx, cy);
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(255,255,255,.55)';
      g.strokeText(txt, cx, cy - sz * 0.01);
    };
    const qb = (a, b, c, t) => [
      (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
      (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
    ];
    function shark(g) {
      const W = NW,
        H = MH,
        A0 = [0, 92],
        AU = [360, 96],
        AT = [935, 290],
        B0 = [0, 446],
        BU = [420, 424]; /* upper lip, rear corner, lower lip: a wedge that is tallest at the nose */
      g.lineJoin = 'round';
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(...A0);
      g.quadraticCurveTo(...AU, ...AT);
      g.quadraticCurveTo(...BU, ...B0);
      g.closePath();
      const gr = g.createLinearGradient(0, 80, 0, 452);
      gr.addColorStop(0, '#030303');
      gr.addColorStop(0.46, '#0b0b0c');
      gr.addColorStop(0.52, '#7c0b13');
      gr.addColorStop(0.74, '#c2141f');
      gr.addColorStop(1, '#6f0910');
      g.fillStyle = gr;
      g.fill();
      g.save();
      g.clip();
      g.fillStyle = 'rgba(255,120,120,.20)';
      g.beginPath();
      g.ellipse(300, 330, 230, 34, -0.12, 0, 7);
      g.fill();
      g.restore(); /* wet highlight on the tongue */
      const teeth = (P0, P1, P2, n, sg, L0) => {
        for (let i = 0; i < n; i++) {
          const t0 = (i + 0.06) / n,
            t1 = (i + 0.94) / n,
            a = qb(P0, P1, P2, t0),
            c = qb(P0, P1, P2, t1),
            m = qb(P0, P1, P2, (t0 + t1) / 2),
            dx = c[0] - a[0],
            dy = c[1] - a[1],
            l = Math.hypot(dx, dy) || 1,
            len = L0 * (1 - 0.62 * (i / n)) * (i % 2 ? 0.82 : 1);
          g.beginPath();
          g.moveTo(...a);
          g.lineTo(m[0] - (dy / l) * sg * len, m[1] + (dx / l) * sg * len);
          g.lineTo(...c);
          g.closePath();
          g.fillStyle = '#fbfaf4';
          g.fill();
          g.lineWidth = 4;
          g.strokeStyle = '#0c0c0c';
          g.stroke();
        }
      };
      teeth(A0, AU, AT, 11, 1, 92);
      teeth(B0, BU, AT, 10, -1, 78);
      g.beginPath();
      g.moveTo(...A0);
      g.quadraticCurveTo(...AU, ...AT);
      g.quadraticCurveTo(...BU, ...B0);
      g.lineWidth = 10;
      g.strokeStyle = '#0c0c0c';
      g.stroke();
      /* the eye: above the mouth, slanted so that its inner end (toward the nose) is lower, black pupil tucked under the lid */
      const ex = 300,
        ey = 40;
      g.save();
      g.translate(ex, ey);
      g.rotate(0.22);
      g.beginPath();
      g.moveTo(-62, 4);
      g.quadraticCurveTo(-8, -34, 62, -14);
      g.quadraticCurveTo(10, 30, -62, 4);
      g.closePath();
      g.fillStyle = '#fdfdfb';
      g.fill();
      g.lineWidth = 7;
      g.strokeStyle = '#0c0c0c';
      g.stroke();
      g.save();
      g.clip();
      g.beginPath();
      g.arc(-26, 2, 21, 0, 7);
      g.fillStyle = '#0c0c0c';
      g.fill();
      g.restore();
      g.beginPath();
      g.moveTo(-70, -4);
      g.quadraticCurveTo(-8, -46, 70, -24);
      g.lineWidth = 11;
      g.strokeStyle = '#0c0c0c';
      g.stroke();
      g.restore();
    }
    function flames(g) {
      const T = [
        [990, 120, 52],
        [900, 70, 40],
        [900, 172, 40],
        [760, 34, 32],
        [760, 208, 32],
        [620, 100, 30],
        [620, 142, 30],
        [480, 56, 24],
        [480, 186, 24],
      ];
      const tongue = (len, yc, hw, sc) => {
        len *= sc;
        hw *= sc;
        g.beginPath();
        g.moveTo(0, yc - hw);
        g.bezierCurveTo(len * 0.3, yc - hw * 1.5, len * 0.65, yc - hw * 0.4, len, yc - hw * 2.1);
        g.bezierCurveTo(len * 0.78, yc + hw * 0.1, len * 0.45, yc + hw * 0.9, len * 0.2, yc + hw * 1.15);
        g.lineTo(0, yc + hw);
        g.closePath();
      };
      T.forEach(([len, yc, hw], i) => {
        tongue(len, yc, hw, 1);
        g.fillStyle = '#d3221a';
        g.fill();
        g.lineWidth = 7;
        g.lineJoin = 'round';
        g.strokeStyle = '#14100e';
        g.stroke();
        tongue(len, yc, hw, 0.78);
        const gr = g.createLinearGradient(0, 0, len, 0);
        gr.addColorStop(0, '#ffb21a');
        gr.addColorStop(1, '#ff5a1f');
        g.fillStyle = gr;
        g.fill();
        tongue(len, yc, hw, 0.5);
        g.fillStyle = '#ffe45a';
        g.fill();
      });
    }
    function checks(g, name) {
      const sq = 30,
        rows = 3,
        cols = Math.floor((NW - 16) / sq),
        y0 = NH - rows * sq - 10;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          g.fillStyle = (r + c) % 2 ? '#d3221a' : '#f6f6f2';
          g.fillRect(8 + c * sq, y0 + r * sq, sq, sq);
        }
      g.lineWidth = 6;
      g.strokeStyle = '#141414';
      g.strokeRect(8, y0, cols * sq, rows * sq);
      script(g, name, NW / 2, y0 / 2 + 4, NW - 100, y0 - 4);
    }
    function wings(g, name, nl) {
      const ex = nl ? 190 : NW - 190,
        ey = 120;
      for (const sd of [-1, 1])
        for (let k = 0; k < 6; k++) {
          const len = 170 - k * 20,
            y = ey - 52 + k * 19,
            x0 = ex + sd * 40;
          g.beginPath();
          g.moveTo(x0, y);
          g.quadraticCurveTo(x0 + sd * len * 0.6, y - 18 - k * 2, x0 + sd * len, y - 4 + k * 5);
          g.quadraticCurveTo(x0 + sd * len * 0.55, y + 16, x0, y + 14);
          g.closePath();
          const gr = g.createLinearGradient(x0, 0, x0 + sd * len, 0);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(1, '#bfc9d8');
          g.fillStyle = gr;
          g.fill();
          g.lineWidth = 4;
          g.lineJoin = 'round';
          g.strokeStyle = '#14233f';
          g.stroke();
        }
      g.beginPath();
      g.arc(ex, ey, 60, 0, 7);
      g.fillStyle = '#1c3a7a';
      g.fill();
      g.lineWidth = 6;
      g.strokeStyle = '#f2f2f2';
      g.stroke();
      star(g, ex, ey + 3, 42, '#f2f2f2', '#14233f');
      const x0 = nl ? ex + 190 : 20,
        x1 = nl ? NW - 20 : ex - 190;
      script(g, name, (x0 + x1) / 2, ey, x1 - x0, 120);
    }
    function drawMouth(cv, nl) {
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, NW, MH);
      g.save();
      if (!nl) {
        g.translate(NW, 0);
        g.scale(-1, 1);
      }
      shark(g);
      g.restore();
    }
    function drawArt(cv, o, nl) {
      const g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, NW, CH);
      g.setTransform(1, 0, 0, CH / NH, 0, 0);
      const st = o.style,
        nm = (o.name || '').trim() || 'Mustang';
      if (st === 'name') script(g, nm, NW / 2, NH / 2 + 6, NW - 110, 200);
      else if (st === 'checks') checks(g, nm);
      else if (st === 'wings') wings(g, nm, nl);
      else if (st === 'flames') {
        g.save();
        if (!nl) {
          g.translate(NW, 0);
          g.scale(-1, 1);
        }
        flames(g);
        g.restore();
      }
    }
    const planeIcon = (g, x, y, s, col, rev) => {
      g.save();
      g.translate(x, y);
      if (rev) g.scale(-1, 1);
      g.scale(s, s);
      g.fillStyle = col;
      g.strokeStyle = '#111';
      g.lineWidth = 0.07;
      g.lineJoin = 'round';
      g.beginPath();
      [
        [0.5, 0],
        [0.26, 0.07],
        [0.12, 0.07],
        [-0.1, 0.46],
        [-0.22, 0.46],
        [-0.14, 0.07],
        [-0.34, 0.06],
        [-0.42, 0.2],
        [-0.5, 0.2],
        [-0.46, 0],
        [-0.5, -0.2],
        [-0.42, -0.2],
        [-0.34, -0.06],
        [-0.14, -0.07],
        [-0.22, -0.46],
        [-0.1, -0.46],
        [0.12, -0.07],
        [0.26, -0.07],
      ].forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    };
    const tankIcon = (g, x, y, s, col, rev) => {
      g.save();
      g.translate(x, y);
      if (rev) g.scale(-1, 1);
      g.scale(s, s);
      g.fillStyle = col;
      g.strokeStyle = '#111';
      g.lineWidth = 0.07;
      g.fillRect(-0.45, -0.08, 0.9, 0.24);
      g.strokeRect(-0.45, -0.08, 0.9, 0.24);
      g.fillRect(-0.2, -0.28, 0.38, 0.22);
      g.strokeRect(-0.2, -0.28, 0.38, 0.22);
      g.fillRect(0.18, -0.24, 0.36, 0.07);
      g.strokeRect(0.18, -0.24, 0.36, 0.07);
      g.restore();
    };
    const NAT = { air: -1, gnd: -1, on: true };
    const AK = () => {
      try {
        return [airKills, killed];
      } catch (e) {
        return [0, 0];
      }
    }; /* these counters are declared further down the file */
    noseTally = (force) => {
      const [A, K] = AK();
      if (!force && NAT.air === A && NAT.gnd === K) return;
      NAT.air = A;
      NAT.gnd = K;
      tallies.forEach((t) => {
        const g = t.cv.getContext('2d'),
          rev = t.s > 0;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, TW, TH);
        if (NAT.on) {
          const row = (n, fn, col, y) => {
            const max = 13,
              sz = 34;
            for (let i = 0; i < Math.min(n, max); i++) fn(g, rev ? TW - 24 - i * 37 : 24 + i * 37, y, sz, col, rev);
            if (n > max) {
              g.font = 'bold 20px sans-serif';
              g.fillStyle = '#fff';
              g.strokeStyle = '#111';
              g.lineWidth = 4;
              g.textAlign = rev ? 'right' : 'left';
              g.textBaseline = 'middle';
              const tx = rev ? TW - 24 - max * 37 : 24 + max * 37;
              g.strokeText('+' + (n - max), tx, y);
              g.fillText('+' + (n - max), tx, y);
            }
          };
          row(A, planeIcon, '#f4f4f0', 26);
          row(K, tankIcon, '#e8c030', 70);
        }
        t.tx.needsUpdate = true;
      });
    };
    noseArtApply = (o) => {
      NAT.on = o.tally !== false;
      const sh = o.style === 'shark';
      sides.forEach((sd) => {
        sd.m.visible = !sh;
        if (!sh) {
          drawArt(sd.cv, o, sd.s < 0);
          sd.tx.needsUpdate = true;
        }
      });
      mouths.forEach((mo) => {
        mo.m.visible = sh;
        if (sh) {
          drawMouth(mo.cv, mo.s < 0);
          mo.tx.needsUpdate = true;
        }
      });
      noseTally(true);
    };
    noseArtApply({ style: 'none', name: '', tally: true });
    /* ---- weathering: exhaust soot streaming back from the stacks, gun-blast soot behind the wing ports ---- */
    {
      const rnd = (() => {
        let s = 11;
        return () => (s = (s * 16807) % 2147483647) / 2147483647;
      })();
      const EW = 1024,
        EH = 150,
        exh = [mk(EW, EH), mk(EW, EH)];
      [0, 1].forEach((si) => {
        const g = exh[si].getContext('2d');
        g.clearRect(0, 0, EW, EH);
        g.save();
        if (si === 1) {
          g.translate(EW, 0);
          g.scale(-1, 1);
        }
        for (let i = 0; i < 6; i++) {
          const zs = fz(38 + 8 * i),
            x0 = ((zs - fz(34)) / 2.2) * EW,
            y0 = 78 + (rnd() - 0.5) * 6,
            L = (200 + rnd() * 300) * (1 - 0.07 * i),
            w0 = 11 + rnd() * 5;
          const gr = g.createLinearGradient(x0, 0, x0 + L, 0);
          gr.addColorStop(0, 'rgba(14,10,8,.66)');
          gr.addColorStop(0.35, 'rgba(24,18,12,.42)');
          gr.addColorStop(1, 'rgba(30,22,14,0)');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(x0, y0 - w0 * 0.5);
          g.bezierCurveTo(
            x0 + L * 0.3,
            y0 - w0 * 0.9 - 3,
            x0 + L * 0.7,
            y0 - w0 * 1.6 - 9 + rnd() * 6,
            x0 + L,
            y0 - w0 * 1.9 - 10,
          );
          g.lineTo(x0 + L, y0 + w0 * 1.5 - 6);
          g.bezierCurveTo(x0 + L * 0.7, y0 + w0 * 1.4, x0 + L * 0.3, y0 + w0 * 0.9, x0, y0 + w0 * 0.5);
          g.closePath();
          g.fill();
          g.strokeStyle = 'rgba(78,48,20,.25)';
          g.lineWidth = 2.5;
          for (let k = 0; k < 2; k++) {
            g.beginPath();
            g.moveTo(x0 + 10, y0 + 8 + k * 7);
            g.quadraticCurveTo(x0 + L * 0.5, y0 + 10 + k * 9, x0 + L * (0.55 + rnd() * 0.3), y0 + k * 9 - 6);
            g.stroke();
          }
        }
        g.restore();
      });
      [-1, 1].forEach((s) => {
        const e = wrap(s, fz(34), fz(34) + 2.2, 0.26, 0.2, exh[s < 0 ? 0 : 1], 0.006);
        const m = e.m.material;
        m.alphaTest = 0.02;
        m.depthWrite = false;
        m.polygonOffset = true;
        m.polygonOffsetFactor = -1;
        m.polygonOffsetUnits = -1;
        e.m.renderOrder = 1;
      });
      /* gun soot on the upper wing: a black fan streaming back from each barrel, following the swept leading edge */
      const WW = 512,
        WH = 256,
        x0 = 2.0,
        x1 = 4.1,
        za = -1.3,
        zb = -2.4,
        wc = mk(WW, WH),
        wg = wc.getContext('2d');
      [2.3, 3.0, 3.7].forEach((ax) => {
        const px = ((ax - x0) / (x1 - x0)) * WW,
          zle = wzle(Math.min(1, ax / WSEMI)),
          py = (1 - (za - zle) / (za - zb)) * WH;
        wg.lineCap = 'round';
        const hz = wg.createLinearGradient(0, py, 0, py + 110);
        hz.addColorStop(0, 'rgba(10,8,6,.34)');
        hz.addColorStop(1, 'rgba(10,8,6,0)');
        wg.fillStyle = hz;
        wg.beginPath();
        wg.ellipse(px, py + 40, 22, 62, 0, 0, 7);
        wg.fill(); /* soft haze */
        for (let k = 0; k < 9; k++) {
          const dx = (rnd() - 0.5) * 30,
            L = 48 + rnd() * 70,
            sw = (rnd() - 0.5) * 10,
            lw = 2.2 + rnd() * 4.2,
            gr = wg.createLinearGradient(0, py, 0, py + L);
          gr.addColorStop(0, 'rgba(6,5,4,.8)');
          gr.addColorStop(0.6, 'rgba(12,9,7,.4)');
          gr.addColorStop(1, 'rgba(14,11,8,0)');
          wg.strokeStyle = gr;
          wg.lineWidth = lw;
          wg.beginPath();
          wg.moveTo(px + dx * 0.35, py + 2);
          wg.quadraticCurveTo(px + dx * 0.8 + sw * 0.3, py + L * 0.5, px + dx + sw, py + L);
          wg.stroke();
        }
        wg.fillStyle = 'rgba(5,4,3,.85)';
        wg.beginPath();
        wg.ellipse(px, py + 1, 12, 5.5, 0, 0, 7);
        wg.fill();
      });
      const wtx = new THREE.CanvasTexture(wc);
      wtx.anisotropy = 4;
      const wmat = new THREE.MeshLambertMaterial({
        map: wtx,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      [-1, 1].forEach((sd) => {
        const gm = new THREE.PlaneGeometry(1, 1, 20, 10),
          uv = gm.attributes.uv,
          p = gm.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const u = uv.getX(i),
            v = uv.getY(i),
            X = sd * (x0 + u * (x1 - x0)),
            zr = za + (zb - za) * v;
          p.setXYZ(i, X, wingY(X, zr, 1) + 0.016, zr);
        } /* v=1 is the leading-edge side */
        gm.computeVertexNormals();
        gm.computeBoundingSphere();
        const m = add(gm, wmat, 0, 0, 0);
        m.renderOrder = 1;
      });
    }
  }
  /* ---- near detail on the player's aircraft: engraved panel lines and rivets on the wings and fuselage, gun barrels, pitot tube, fuel caps, static wicks.
     Everything here is hidden when the camera is more than ~45 m away (and on Low), where it could not be seen anyway ---- */
  {
    const PD = [];
    PDET.list = PD;
    const line = (g, x0, y0, x1, y1, w) => {
      g.strokeStyle = 'rgba(18,18,20,.62)';
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.22)'; /* the lit edge of the engraved line */
      g.lineWidth = w * 0.6;
      g.beginPath();
      g.moveTo(x0 + 1.4, y0 + 1.6);
      g.lineTo(x1 + 1.4, y1 + 1.6);
      g.stroke();
    };
    const rivets = (g, x0, y0, x1, y1, step, off) => {
      const n = Math.max(1, Math.floor(Math.hypot(x1 - x0, y1 - y0) / step)),
        nx = -(y1 - y0),
        ny = x1 - x0,
        nl = Math.hypot(nx, ny) || 1;
      g.fillStyle = 'rgba(30,30,32,.5)';
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        g.beginPath();
        g.arc(x0 + (x1 - x0) * t + (nx / nl) * off, y0 + (y1 - y0) * t + (ny / nl) * off, 1.35, 0, 7);
        g.fill();
      }
    };
    const tex = (c) => {
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8;
      return t;
    };
    const decalMat = (c) =>
      new THREE.MeshLambertMaterial({
        map: tex(c),
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    /* wing: u across the span (root to tip), v from the leading edge (0) to the trailing edge (1), so the lines follow the taper */
    const WW = 2048,
      WH = 512,
      wc = document.createElement('canvas');
    wc.width = WW;
    wc.height = WH;
    {
      const g = wc.getContext('2d');
      [0.1, 0.3, 0.62].forEach((t) => {
        line(g, 0, t * WH, WW, t * WH, 2.2);
        rivets(g, 0, t * WH, WW, t * WH, 15, 6);
        rivets(g, 0, t * WH, WW, t * WH, 15, -6);
      });
      [0.18, 0.42, 0.7, 0.9].forEach((u) => {
        line(g, u * WW, 0.1 * WH, u * WW, 0.62 * WH, 2);
        rivets(g, u * WW, 0.1 * WH, u * WW, 0.62 * WH, 16, 5);
      });
      for (let k = 0; k < 16; k++) {
        const u = 0.05 + k * 0.058;
        line(g, u * WW, 0.62 * WH, u * WW, WH - 4, 1.4); /* ribs under the fabric-like control surfaces */
      }
      line(g, 0.4 * WW, 0.62 * WH, 0.4 * WW, WH, 2.6); /* flap / aileron split */
      line(g, 4, 0, 4, WH, 2);
      g.strokeStyle = 'rgba(18,18,20,.5)';
      g.lineWidth = 2;
      g.strokeRect(0.12 * WW, 0.34 * WH, 0.09 * WW, 0.2 * WH); /* access hatch */
      g.strokeRect(0.5 * WW, 0.15 * WH, 0.07 * WW, 0.13 * WH);
    }
    const wmat = decalMat(wc);
    const wingPatch = (sd, sg) => {
      const gm = new THREE.PlaneGeometry(1, 1, 40, 12),
        uv = gm.attributes.uv,
        p = gm.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i),
          v = 1 - uv.getY(i),
          X = sd * (0.7 + u * 4.8),
          uu = Math.min(1, Math.abs(X) / WSEMI),
          zr = wzle(uu) + v * (wzh(uu) - wzle(uu));
        p.setXYZ(i, X, wingY(X, zr, sg) + sg * 0.012, zr);
      }
      gm.computeVertexNormals();
      gm.computeBoundingSphere();
      const m = add(gm, wmat, 0, 0, 0);
      m.renderOrder = 2;
      PD.push(m);
    };
    [-1, 1].forEach((sd) => [1, -1].forEach((sg) => wingPatch(sd, sg)));
    /* fuselage sides and back: former seams, long seams, hatches and rivet rows between the cowling and the tail */
    const FW = 2048,
      FH = 512,
      fc = document.createElement('canvas'),
      FZ0 = -1.4,
      FZ1 = 4.6,
      FP = 1.25; /* z range and the half-angle covered */
    fc.width = FW;
    fc.height = FH;
    {
      const g = fc.getContext('2d');
      for (let z = FZ0 + 0.35; z < FZ1; z += 0.62) {
        const x = ((z - FZ0) / (FZ1 - FZ0)) * FW;
        line(g, x, 0, x, FH, 2);
        rivets(g, x, 0, x, FH, 14, 5);
        rivets(g, x, 0, x, FH, 14, -5);
      }
      [0.3, 0.5, 0.72].forEach((t) => {
        line(g, 0, t * FH, FW, t * FH, 1.8);
        if (t !== 0.5) rivets(g, 0, t * FH, FW, t * FH, 16, 5);
      });
      g.strokeStyle = 'rgba(18,18,20,.55)';
      g.lineWidth = 2.2;
      g.strokeRect(0.3 * FW, 0.34 * FH, 0.07 * FW, 0.12 * FH);
      g.strokeRect(0.44 * FW, 0.54 * FH, 0.09 * FW, 0.14 * FH);
      g.strokeRect(0.7 * FW, 0.34 * FH, 0.06 * FW, 0.1 * FH);
      g.fillStyle = 'rgba(18,18,20,.5)';
      for (const [u, v] of [
        [0.335, 0.4],
        [0.485, 0.61],
        [0.73, 0.39],
      ]) {
        g.beginPath(); /* latch */
        g.arc(u * FW, v * FH, 5, 0, 7);
        g.fill();
      }
    }
    const fmat = decalMat(fc);
    [1, -1].forEach((sd) => {
      const gm = new THREE.PlaneGeometry(1, 1, 60, 14),
        uv = gm.attributes.uv,
        p = gm.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i),
          v = uv.getY(i),
          z = FZ0 + u * (FZ1 - FZ0),
          lim = z >= SILL_Z[0] - 0.05 && z <= SILL_Z[2] ? Math.min(FP, sillAng(z) - 0.04) : FP,
          ph = (v - 0.5) * 2 * lim,
          q = fusPt(z, ph, 0.005);
        p.setXYZ(i, sd * q[0], q[1], z);
      }
      gm.computeVertexNormals();
      gm.computeBoundingSphere();
      const m = add(gm, fmat, 0, 0, 0);
      m.renderOrder = 2;
      PD.push(m);
    });
    /* small parts */
    const grp = new THREE.Group();
    model.add(grp);
    PD.push(grp);
    const gadd = (g, m, x, y, z, rx, ry) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      if (rx) o.rotation.x = rx;
      if (ry) o.rotation.y = ry;
      grp.add(o);
      return o;
    };
    const steel = PH(0x3a3d40, 40, 0x555555);
    [-1, 1].forEach((sd) => {
      /* six .50 cal barrels per wing: three poke out of the leading edge, with a blast tube; and the ejection ports underneath */
      [2.3, 3.0, 3.7].forEach((ax, i) => {
        const X = sd * ax,
          zle = wzle(Math.min(1, ax / WSEMI)),
          y = wingY(X, zle + 0.12, 0) + 0.02;
        gadd(new THREE.CylinderGeometry(0.022, 0.022, 0.42 - i * 0.04, 10), steel, X, y, zle - 0.14, Math.PI / 2);
        gadd(new THREE.CylinderGeometry(0.03, 0.026, 0.07, 10), dark, X, y, zle - 0.36 + i * 0.04, Math.PI / 2);
        gadd(new THREE.BoxGeometry(0.09, 0.012, 0.13), dark, X, wingY(X, zle + 0.75, -1) - 0.012, zle + 0.75);
      });
      /* fuel filler caps: flat discs with a rim, on the upper wing */
      const cx = sd * 1.7,
        cz = wmid(1.7 / WSEMI);
      gadd(new THREE.CylinderGeometry(0.1, 0.1, 0.014, 18), metal2, cx, wingY(cx, cz, 1) + 0.005, cz);
      gadd(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), dark, cx, wingY(cx, cz, 1) + 0.009, cz);
      /* static discharge wicks along the trailing edge of the tip and the ailerons */
      [4.6, 5.0, 5.4].forEach((wx) => {
        const X = sd * wx,
          zt = wzte(wx / WSEMI);
        gadd(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), dark, X, wingY(X, zt - 0.02, 0) - 0.02, zt + 0.08, Math.PI / 2);
      });
    });
    /* pitot tube on the left wing, with its mast */
    {
      const X = -4.4,
        zle = wzle(4.4 / WSEMI),
        y = wingY(X, zle, 0) - 0.14;
      gadd(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 8), steel, X, y, zle - 0.1, Math.PI / 2);
      gadd(new THREE.CylinderGeometry(0.006, 0.014, 0.1, 8), steel, X, y, zle - 0.34, Math.PI / 2);
      gadd(new THREE.BoxGeometry(0.012, 0.1, 0.04), steel, X, y + 0.05, zle + 0.04);
    }
    mergeGroup(grp);
    grp.visible = false;
  }
}
