/* ---------- the far world: terrain chunks that are built just beyond the fog and dropped when you leave ----------
   The home map is one 26 km terrain mesh built at load. Past it the land comes from WH() and is cut into chunks of about 6.4 km. A chunk
   is only built when its nearest edge is 20 km away (the fog is solid by 15 km, so it cannot be seen being built), the work is done a few
   milliseconds at a time (a time budget per frame, never more), and it is only added to the scene once it is complete. Chunks leave again
   beyond 27 km. Their buffers are pooled and reused, so nothing is allocated or garbage collected while you fly. All sea chunks are
   skipped altogether. The shore colours are painted per pixel from a height map, exactly as on the home map. */
/* NEARCUT: a square of the far world's ground (centre x, y = world x, z; z the half-size; w 1 on) left undrawn because the battle area's own fine ground is drawn
   there instead (the tank simulator; BA). w = 0: off, every chunk drawn whole (every other simulator) */
const NEARCUT = { value: new THREE.Vector4(0, 0, 0, 0) };
const WORLD = (() => {
  let PBX = null;
  const SEGC = 64,
    NV = (SEGC + 1) * (SEGC + 1),
    TEXN = 194,
    /* The fog is measured along the view direction, so near the screen corners ground can still be seen out to about 1.6 times the fog distance:
       chunks are built from 34 km out, so they are complete long before that, and dropped beyond 38 km. A chunk within 19 km (the clear-air fog distance is 18 km) is built in full at once. */
    BUILD_R = 34000,
    DROP_R = 38000,
    NEED_R = 19000;
  const AX = [];
  for (let k = 5; k >= 0; k--) AX.push([-13000 - 6400 * (k + 1), -13000 - 6400 * k]);
  for (let i = 0; i < 4; i++) AX.push([-13000 + 6500 * i, -13000 + 6500 * (i + 1)]);
  for (let k = 0; k < 6; k++) AX.push([13000 + 6400 * k, 13000 + 6400 * (k + 1)]);
  const MID = (a) => a[0] >= -13000 && a[1] <= 13000;
  const CH = [];
  for (const ax of AX)
    for (const az of AX) {
      if (MID(ax) && MID(az)) continue;
      CH.push({ x0: ax[0], x1: ax[1], z0: az[0], z1: az[1], cx: (ax[0] + ax[1]) / 2, cz: (az[0] + az[1]) / 2, st: 0, mesh: null, job: null, it: null });
    }
  const CHI = new Map();
  CH.forEach((c) => CHI.set(AX.findIndex((a) => a[0] === c.x0) * 32 + AX.findIndex((a) => a[0] === c.z0), c));

  /* ---------- the rural network: hamlets, farms and the roads that join them ----------
     Everything is a fixed function of position. A hamlet may stand in each 8 km square; a farm may stand in each 1.5 km square on good level farmland and must have a road to a
     hamlet (directly, or through the nearer farms on the way): a farm that cannot be reached over dry, not-too-steep ground is not built. Hamlets are joined to their two nearest
     neighbours. So every road joins two places, and no road runs into the sea or up a cliff. */
  const NET = (() => {
    const RG = 6000,
      FC = 1200,
      hm = new Map(),
      fm = new Map(),
      pm = new Map(),
      am = new Map(),
      tnAt = (x, z) => Math.hypot(WH(x + 30, z) - WH(x - 30, z), WH(x, z + 30) - WH(x, z - 30)) / 60;
    const hamlet = (ri, rj) => {
      const key = ri * 4096 + rj;
      let v = hm.get(key);
      if (v !== undefined) return v;
      v = null;
      for (let k = 0; k < 12 && !v; k++) {
        const x = (ri + 0.1 + 0.8 * hg(ri, rj, 100 + k * 2)) * RG,
          z = (rj + 0.1 + 0.8 * hg(ri, rj, 101 + k * 2)) * RG,
          h = WH(x, z);
        if (h < 6 || h > 90 || FS.near(x, z, 260) || tnAt(x, z) > 0.04 || Math.max(Math.abs(x), Math.abs(z)) < 13500 || Math.max(Math.abs(x), Math.abs(z)) > 49000) continue;
        let dry = true;
        for (let a = 0; a < 8 && dry; a++) if (WH(x + Math.cos(a * 0.785) * 160, z + Math.sin(a * 0.785) * 160) < 2) dry = false;
        if (dry && forestF(x, z) < 0.5) v = { x, z, h, id: 'h' + key, hamlet: true, yaw: hg(ri, rj, 99) * 6.283 };
      }
      hm.set(key, v);
      return v;
    };
    const farm = (ci, cj) => {
      const key = ci * 4096 + cj;
      let v = fm.get(key);
      if (v !== undefined) return v;
      v = null;
      if (hg(ci, cj, 120) < 0.8) {
        const x = (ci + 0.2 + 0.6 * hg(ci, cj, 121)) * FC,
          z = (cj + 0.2 + 0.6 * hg(ci, cj, 122)) * FC,
          h = WH(x, z);
        if (h >= 5 && h <= 85 && !FS.near(x, z, 170) && Math.max(Math.abs(x), Math.abs(z)) > 13500 && Math.max(Math.abs(x), Math.abs(z)) < 49000) {
          const tn = tnAt(x, z);
          if (tn < 0.05 && farmK(x, z, h, tn) > 0.3) v = { x, z, h, id: 'f' + key, ci, cj, yaw: 0, par: undefined };
        }
      }
      fm.set(key, v);
      return v;
    };
    /* the road between a and b: a gentle bend, fixed by the two ends */
    const bend = (a, b) => {
      const k = a.x < b.x || (a.x === b.x && a.z < b.z) ? 1 : -1,
        len = Math.hypot(b.x - a.x, b.z - a.z);
      return k * (hg(Math.floor(Math.min(a.x, b.x)), Math.floor(Math.min(a.z, b.z)), 130) - 0.5) * 0.14 * len;
    };
    const pathPt = (a, b, t, out) => {
      const dx = b.x - a.x,
        dz = b.z - a.z,
        len = Math.hypot(dx, dz) || 1,
        off = bend(a, b) * Math.sin(Math.PI * t);
      out[0] = a.x + dx * t - (dz / len) * off;
      out[1] = a.z + dz * t + (dx / len) * off;
      return out;
    };
    const P2 = [0, 0];
    const pathOK = (a, b) => {
      const key = a.id < b.id ? a.id + b.id : b.id + a.id;
      let v = pm.get(key);
      if (v !== undefined) return v;
      const len = Math.hypot(b.x - a.x, b.z - a.z),
        n = Math.max(2, Math.ceil(len / 60));
      v = true;
      let ph = null;
      for (let i = 0; i <= n && v; i++) {
        pathPt(a, b, i / n, P2);
        const h = WH(P2[0], P2[1]);
        if (h < 1.5 || h > 450 || FS.near(P2[0], P2[1], 40) || (ph !== null && Math.abs(h - ph) / (len / n) > 0.11)) v = false;
        ph = h;
      }
      /* a road never runs through the yard of a farm or the green of a hamlet that is not one of its ends */
      if (v) {
        const n2 = Math.max(2, Math.ceil(len / 40));
        for (let i = 0; i <= n2 && v; i++) {
          pathPt(a, b, i / n2, P2);
          const x = P2[0],
            z = P2[1];
          for (let ci = Math.floor((x - 80) / FC); ci <= Math.floor((x + 80) / FC) && v; ci++)
            for (let cj = Math.floor((z - 80) / FC); cj <= Math.floor((z + 80) / FC) && v; cj++) {
              const f = farm(ci, cj);
              if (f && f !== a && f !== b && Math.hypot(f.x - x, f.z - z) < 80) v = false;
            }
          for (let ri = Math.floor((x - 110) / RG); ri <= Math.floor((x + 110) / RG) && v; ri++)
            for (let rj = Math.floor((z - 110) / RG); rj <= Math.floor((z + 110) / RG) && v; rj++) {
              const h = hamlet(ri, rj);
              if (h && h !== a && h !== b && Math.hypot(h.x - x, h.z - z) < 110) v = false;
            }
        }
      }
      pm.set(key, v);
      return v;
    };
    const nearHamlets = (x, z) => {
      const ri = Math.floor(x / RG),
        rj = Math.floor(z / RG),
        out = [];
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++) {
          const h = hamlet(ri + a, rj + b);
          if (h) out.push(h);
        }
      return out.sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z));
    };
    /* a farm's place in the road tree: its hamlet, and the road it joins (to the hamlet or to a nearer farm on the way) */
    const live = (f) => {
      if (f.par !== undefined) return f.par !== null;
      f.par = null;
      const hs = nearHamlets(f.x, f.z),
        H = hs[0];
      if (!H || Math.hypot(H.x - f.x, H.z - f.z) > 7000 || Math.hypot(H.x - f.x, H.z - f.z) < 300) return false;
      f.H = H;
      const dH = Math.hypot(H.x - f.x, H.z - f.z),
        cand = [H];
      for (let a = -2; a <= 2; a++)
        for (let b = -2; b <= 2; b++) {
          const o = farm(f.ci + a, f.cj + b);
          if (o && o !== f && Math.hypot(H.x - o.x, H.z - o.z) < dH - 250) cand.push(o);
        }
      cand.sort((p, q) => Math.hypot(p.x - f.x, p.z - f.z) - Math.hypot(q.x - f.x, q.z - f.z));
      for (const p of cand) {
        if (Math.hypot(p.x - f.x, p.z - f.z) > 3200 && p !== H) continue;
        if (!pathOK(f, p)) continue;
        if (!p.hamlet && !live(p)) continue;
        f.par = p;
        f.yaw = Math.atan2(p.x - f.x, p.z - f.z);
        return true;
      }
      return false;
    };
    /* the (up to two) hamlets this one is joined to */
    const links = (A) => {
      let v = am.get(A.id);
      if (v) return v;
      v = [];
      const ri = Math.floor(A.x / RG),
        rj = Math.floor(A.z / RG),
        c = [];
      for (let a = -2; a <= 2; a++)
        for (let b = -2; b <= 2; b++) {
          const h = hamlet(ri + a, rj + b);
          if (h && h !== A) c.push(h);
        }
      c.sort((p, q) => Math.hypot(p.x - A.x, p.z - A.z) - Math.hypot(q.x - A.x, q.z - A.z));
      for (const B of c) {
        if (v.length >= 2) break;
        if (Math.hypot(B.x - A.x, B.z - A.z) < 14000 && pathOK(A, B)) v.push(B);
      }
      am.set(A.id, v);
      return v;
    };
    return { RG, FC, hamlet, farm, live, links, pathPt, bend, pathOK };
  })();
  /* one index buffer for every chunk */
  const idx = new Uint16Array(SEGC * SEGC * 6);
  {
    let k = 0;
    for (let j = 0; j < SEGC; j++)
      for (let i = 0; i < SEGC; i++) {
        const a = i + (SEGC + 1) * j,
          b = a + SEGC + 1;
        idx[k++] = a;
        idx[k++] = b;
        idx[k++] = a + 1;
        idx[k++] = b;
        idx[k++] = b + 1;
        idx[k++] = a + 1;
      }
  }
  const pool = [];
  const TCAP = [
    ['con', 3400],
    ['oak', 1600],
    ['shr', 800],
    ['palm', 250],
  ];

  /* ---------- the buildings: a farmstead (house, barn, silo, tractor, cows, sheep, pen, hay) and a hamlet (a ring of cottages round a green, and a church) ---------- */
  const PROPS = (() => {
    const { part, bx, cyl, sph, Acc, xf } = GX;
    const prismG = (w, h, l) => {
      const A = [-w / 2, 0, -l / 2], B = [w / 2, 0, -l / 2], C = [0, h, -l / 2], D = [-w / 2, 0, l / 2], E = [w / 2, 0, l / 2], F = [0, h, l / 2];
      const tr = [[D, E, F], [B, A, C], [A, D, F], [A, F, C], [E, B, C], [E, C, F]];
      const p = [], n = [];
      for (const t of tr) {
        const u = new THREE.Vector3().fromArray(t[1]).sub(new THREE.Vector3().fromArray(t[0])),
          v = new THREE.Vector3().fromArray(t[2]).sub(new THREE.Vector3().fromArray(t[0])),
          nn = u.cross(v).normalize(),
          cen = new THREE.Vector3().fromArray(t[0]).add(new THREE.Vector3().fromArray(t[1])).add(new THREE.Vector3().fromArray(t[2])).multiplyScalar(1 / 3).sub(new THREE.Vector3(0, h / 3, 0));
        if (nn.dot(cen) < 0) {
          const tmp = t[1];
          t[1] = t[2];
          t[2] = tmp;
          nn.negate();
        }
        for (const q of t) {
          p.push(...q);
          n.push(nn.x, nn.y, nn.z);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
      return g;
    };
    /* the yard: a rectangle of beaten gravel with soft, faded edges (like the ground at the bases), one quad with a gravel texture whose alpha falls away to nothing at the border.
       Every other part of the prototype takes its colour from the opaque white corner of the same texture (uv 0.95, 0.95). */
    const YARD = (() => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const g = cv.getContext('2d'),
        im = g.createImageData(128, 128),
        d = im.data;
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const i = (y * 128 + x) * 4;
          let r = 255, gg = 255, b = 255, a = 255;
          if (x < 104 && y >= 24) {
            const ex = Math.min(x, 103 - x),
              ey = Math.min(y - 24, 127 - y),
              e = Math.min(ex, ey) / 22,
              t = Math.max(0, Math.min(1, e)),
              n = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1,
              v = 0.85 + 0.3 * n;
            r = 168 * v;
            gg = 146 * v;
            b = 108 * v;
            a = 255 * t * t * (3 - 2 * t) * 0.92;
          }
          d[i] = r;
          d[i + 1] = gg;
          d[i + 2] = b;
          d[i + 3] = a;
        }
      g.putImageData(im, 0, 0);
      const t = new THREE.CanvasTexture(cv);
      t.minFilter = t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    })();
    const withYard = (geo, cx, cz, hx, hz) => {
      const y = 0.14,
        P = [cx - hx, y, cz - hz, cx + hx, y, cz - hz, cx + hx, y, cz + hz, cx - hx, y, cz + hz],
        UV = [0, 0.8125, 0.8125, 0.8125, 0.8125, 0, 0, 0],
        ID = [0, 2, 1, 0, 3, 2],
        np = [],
        nn = [],
        nc = [],
        nu = [];
      for (const k of ID) {
        np.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]);
        nn.push(0, 1, 0);
        nc.push(1, 1, 1);
        nu.push(UV[k * 2], UV[k * 2 + 1]);
      }
      const A0 = geo.attributes,
        n0 = A0.position.count,
        cat = (a, b) => {
          const o = new Float32Array(a.length + b.length);
          o.set(b, 0);
          o.set(a, b.length);
          return o;
        },
        g = new THREE.BufferGeometry(),
        u0 = new Float32Array(n0 * 2).fill(0.95);
      /* the yard goes first, so everything else is drawn over it */
      g.setAttribute('position', new THREE.BufferAttribute(cat(A0.position.array, np), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(cat(A0.normal.array, nn), 3));
      g.setAttribute('color', new THREE.BufferAttribute(cat(A0.color.array, nc), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(cat(u0, nu), 2));
      g.computeBoundingSphere();
      geo.dispose();
      return g;
    };
    const Z = Math.PI / 2;
    /* ---- WWII South Pacific: a plantation (copra and gardens) and native villages of thatched huts on posts; no European farms ---- */
    const post = (x, z, h, c) => part(cyl(0.2, 0.2, h, 6), c || 0x5a4630, x, h / 2, z);
    /* a village hut: a stilt house of the islands, woven walls on a floor of split palm on six posts, a steep thatched roof with a
       dark ridge pole and crossed gable horns, a window, a door and a pole ladder up to it; (x, z) turned by yaw */
    const hut = (x, z, yaw, w, d) => {
      const fl = 1.3,
        wt = fl + 2.05,
        THATCH = 0xa38c46,
        P = [];
      for (const px of [-w / 2 + 0.3, w / 2 - 0.3]) for (const pz of [-d / 2 + 0.3, 0, d / 2 - 0.3]) P.push(post(px, pz, fl + 0.02));
      P.push(part(bx(w, 0.16, d), 0x7a6240, 0, fl, 0)); /* the floor */
      P.push(part(bx(w - 0.3, 2.0, d - 0.3), 0xb8a070, 0, fl + 1.07, 0) /* woven walls, standing on the floor */, part(bx(w - 0.2, 0.12, d - 0.2), 0x8a7048, 0, wt - 0.03, 0) /* the wall plate */);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(part(cyl(0.09, 0.09, 2.1, 5), 0x5a4630, sx * (w / 2 - 0.2), fl + 1.05, sz * (d / 2 - 0.2))); /* corner poles */
      P.push(part(prismG(w + 1.6, 2.9, d + 1.6), THATCH, 0, wt - 0.06, 0)); /* the thatch, on the wall plate */
      for (const s2 of [-1, 1]) P.push(part(bx(0.2, 0.22, d + 1.6), 0x8a7238, s2 * (w + 1.4) / 2, wt + 0.04, 0, 0, 0, s2 * -0.9)); /* the thatch's thick eave edges */
      const ry = wt - 0.06 + 2.9;
      P.push(part(cyl(0.1, 0.1, d + 2.0, 5), 0x4a3a28, 0, ry, 0, Z, 0, 0)); /* ridge pole */
      for (const zr of [-(d + 1.6) / 2, (d + 1.6) / 2]) P.push(GX.rod([-0.55, ry - 0.55, zr], [0.45, ry + 0.75, zr], 0.05, 0x4a3a28, 0.04, 4), GX.rod([0.55, ry - 0.55, zr], [-0.45, ry + 0.75, zr], 0.05, 0x4a3a28, 0.04, 4)); /* crossed gable horns */
      P.push(part(bx(0.9, 1.6, 0.1), 0x3a2a1c, 0, fl + 0.88, d / 2 - 0.1) /* door */, part(bx(0.04, 0.6, 0.8), 0x2a2018, w / 2 - 0.15, fl + 1.3, 0) /* window, in the wall face */);
      /* the pole ladder from the ground to the door sill */
      for (const lx of [-0.28, 0.28]) P.push(GX.rod([lx, 0, d / 2 + 0.75], [lx, fl + 0.06, d / 2 - 0.02], 0.045, 0x6a5236, 0.04, 4));
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        P.push(part(bx(0.62, 0.05, 0.05), 0x6a5236, 0, (fl + 0.06) * t, d / 2 + 0.75 - 0.77 * t));
      }
      return { P, T: xf(x, 0, z, yaw) };
    };
    /* the planter's house: whitewashed walls raised on posts, a verandah all round with its posts and rail, shuttered windows, a
       hipped roof of corrugated iron over house and verandah, steps up to the door */
    const bungalow = (x, z, yaw, w, d) => {
      const P = [],
        fl = 2.2,
        wt = 5.1,
        ow = (w + 2) / 2,
        od = (d + 2.4) / 2,
        ex = ow + 0.4,
        ez = od + 0.4,
        run = ez,
        pitch = 0.45,
        ey = wt - pitch * (ez - d / 2) /* the eaves, so the roof meets the walls' top */;
      for (const px of [-w / 2 + 0.3, 0, w / 2 - 0.3]) for (const pz of [-d / 2 + 0.3, d / 2 - 0.3]) P.push(post(px, pz, fl, 0x6a5a46));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(post(sx * (ow - 0.15), sz * (od - 0.15), fl, 0x6a5a46));
      P.push(part(bx(w + 2, 0.22, d + 2.4), 0x7a6a50, 0, fl, 0)); /* the verandah floor */
      P.push(part(bx(w, wt - 0.025 - (fl + 0.09), d), 0xe6e0c8, 0, (wt - 0.025 + fl + 0.09) / 2, 0)); /* the walls, their top 2.5 cm under the roof (no flicker) */
      P.push(GX.hipRoof(-ex, ex, -ez, ez, ey, pitch * Math.min(ex, run), 0x9ea4a4));
      /* verandah posts from the floor to the eaves, and the rail between them */
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(part(bx(0.14, ey - fl, 0.14), 0xe6e0c8, sx * (ow - 0.15), (ey + fl) / 2, sz * (od - 0.15)));
      for (const px of [-ow / 2, ow / 2]) for (const sz of [-1, 1]) P.push(part(bx(0.14, ey - fl, 0.14), 0xe6e0c8, px, (ey + fl) / 2, sz * (od - 0.15)));
      const rl = ow - 0.15 - 0.9; /* the front and back rails: a run either side of the steps' gap */
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) P.push(part(bx(rl, 0.07, 0.07), 0xe6e0c8, sx * (0.9 + rl / 2), fl + 0.95, sz * (od - 0.15)));
      for (const sx of [-1, 1]) P.push(part(bx(0.07, 0.07, 2 * od - 0.3), 0xe6e0c8, sx * (ow - 0.15), fl + 0.95, 0));
      /* the door and four shuttered windows on the front, two on each end */
      P.push(part(bx(1.2, 2.0, 0.12), 0x3a2a1c, 0, fl + 1.11, d / 2 + 0.05));
      const win = (wx, wz, ry) => {
        const c = Math.cos(ry),
          sn = Math.sin(ry);
        P.push(part(bx(1.2, 1.1, 0.1), 0x2a3640, wx, fl + 1.6, wz, 0, ry));
        for (const k of [-1, 1]) P.push(part(bx(0.6, 1.1, 0.1), 0x3f6a4a, wx + c * k * 0.92, fl + 1.6, wz - sn * k * 0.92, 0, ry)); /* shutters, folded back flat on the wall */
      };
      for (const wx of [-w * 0.3, w * 0.3]) win(wx, d / 2 + 0.04, 0), win(wx, -d / 2 - 0.04, Math.PI);
      for (const wz of [-d * 0.22, d * 0.22]) win(w / 2 + 0.04, wz, Math.PI / 2), win(-w / 2 - 0.04, wz, -Math.PI / 2);
      /* the verandah steps, from the ground up to the floor (2.2 m) */
      for (let k = 0; k < 3; k++) P.push(part(bx(1.6, 2.1 - k * 0.7, 0.6), 0x6a5236, 0, (2.1 - k * 0.7) / 2, od + 0.3 + k * 0.6));
      return { P, T: xf(x, 0, z, yaw) };
    };
    /* a village pig: a round body on four legs, head and snout, ears, a curly tail (head toward +z) */
    const pig = (x, z, yaw, c) => {
      const P = [part(sph(8), c, 0, 0.62, 0, 0, 0, 0, 0.42, 0.36, 0.68), part(sph(8), c, 0, 0.68, 0.78, 0, 0, 0, 0.24, 0.24, 0.26), part(cyl(0.1, 0.1, 0.12, 8), 0xc98a8a, 0, 0.64, 1.06, Z, 0, 0)];
      for (const s of [-1, 1]) P.push(part(bx(0.1, 0.14, 0.04), c, s * 0.13, 0.9, 0.76, -0.4, 0, s * 0.4));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(part(cyl(0.06, 0.055, 0.46, 5), 0x4a3a34, sx * 0.22, 0.23, sz * 0.42));
      P.push(GX.rod([0, 0.7, -0.66], [0, 0.8, -0.8], 0.025, c, 0.02, 4));
      return { P, T: xf(x, 0, z, yaw) };
    };
    /* a hen: body, head with comb and beak, tail feathers, two legs (facing +z) */
    const hen = (x, z, yaw) => {
      const P = [
        part(sph(8), 0xf0ece0, 0, 0.32, 0, 0, 0, 0, 0.16, 0.15, 0.22),
        part(sph(6), 0xf0ece0, 0, 0.48, 0.17, 0, 0, 0, 0.085, 0.085, 0.085),
        part(bx(0.02, 0.06, 0.08), 0xb83a2a, 0, 0.57, 0.17),
        part(new THREE.ConeGeometry(0.025, 0.07, 5), 0xc9a227, 0, 0.48, 0.27, Z, 0, 0),
        part(bx(0.04, 0.16, 0.12), 0xe0dcd0, 0, 0.42, -0.2, -0.5, 0, 0),
      ];
      for (const s of [-1, 1]) P.push(part(cyl(0.015, 0.015, 0.21, 4), 0xc9a227, s * 0.05, 0.105, 0));
      return { P, T: xf(x, 0, z, yaw) };
    };
    const handcart = (x, z, yaw) => {
      const k = 0x1f1f1f;
      const P = [
        part(bx(2.2, 0.45, 1.2), 0x7a5a38, 0, 1.05, 0),
        part(bx(2.2, 0.35, 0.1), 0x6a4a2a, 0, 1.4, 0.55),
        part(bx(2.2, 0.35, 0.1), 0x6a4a2a, 0, 1.4, -0.55),
        ...GX.tyre(0, 0.5, 0.7, 0.5, 0.12, 0x4a3a28, 0x6a5236, 16) /* iron-shod wooden wheels */,
        ...GX.tyre(0, 0.5, -0.7, 0.5, 0.12, 0x4a3a28, 0x6a5236, 16),
        part(cyl(0.05, 0.05, 1.52, 6), 0x3a3a34, 0, 0.5, 0, Z, 0, 0) /* the axle, through both wheels */,
        part(bx(0.3, 0.34, 0.9), 0x5a4630, 0, 0.67, 0) /* the cart's bed on its axle */,
        part(bx(1.8, 0.08, 0.08), 0x5a4630, -2.0, 1.0, 0),
        part(bx(0.5, 0.4, 0.45), 0xcdbb88, 0.2, 1.45, 0),
      ];
      return { P, T: xf(x, 0, z, yaw) };
    };
    PBX = { prismG, post, hut, bungalow, pig, hen, handcart }; /* the far sites reuse these */
    const farm = () => {
      const A = new Acc(),
        add = (o) => A.add(o.P, o.T);
      add(bungalow(-21, 8, 0.1, 9, 7));
      /* the copra shed: an open drying floor under a corrugated roof, heaps of split coconut */
      {
        const P = [];
        for (const px of [-8.4, 0, 8.4]) for (const pz of [-4.6, 4.6]) P.push(part(cyl(0.25, 0.25, 4, 6), 0x5a4630, px, 2, pz));
        P.push(
          part(bx(17.4, 0.22, 9.2), 0x7a6240, 0, 0.9, 0),
          part(prismG(11.4, 3.4, 19.6), 0x8e9494, 0, 4, 0, 0, Z),
          part(sph(8), 0xd8c690, -5.5, 1.01, 0.6, 0, 0, 0, 1.7, 0.5, 1.2) /* heaps of split coconut drying on the floor */,
          part(sph(8), 0xc9b47a, 1.0, 1.01, -1.2, 0, 0, 0, 1.3, 0.42, 1.0),
          part(sph(8), 0xd8c690, 6.2, 1.01, 1.4, 0, 0, 0, 1.5, 0.46, 1.1),
        );
        A.add(P, xf(17, 0, -8, 0));
      }
      /* a water tank on a stand where the silo was */
      A.add(
        [
          post(-1.2, -1.2, 3.6),
          post(1.2, -1.2, 3.6),
          post(-1.2, 1.2, 3.6),
          post(1.2, 1.2, 3.6),
          part(cyl(1.9, 1.9, 3.0, 14), 0xa0a6a8, 0, 5.1, 0),
          part(cyl(0, 2.1, 0.9, 14), 0x7e8588, 0, 7.05, 0),
        ],
        xf(31, 0, 4, 0),
      );
      add(handcart(9, 12, 0.5));
      /* the pig pen */
      const px = 4,
        pz = -34,
        pw = 26,
        pd = 15,
        wood = 0x6e5a40;
      A.add(
        [
          part(bx(pw, 0.12, 0.12), wood, 0, 0.55, -pd / 2),
          part(bx(pw, 0.12, 0.12), wood, 0, 1.05, -pd / 2),
          part(bx(pw, 0.12, 0.12), wood, 0, 0.55, pd / 2),
          part(bx(pw, 0.12, 0.12), wood, 0, 1.05, pd / 2),
          part(bx(0.12, 0.12, pd), wood, -pw / 2, 0.55, 0),
          part(bx(0.12, 0.12, pd), wood, -pw / 2, 1.05, 0),
          part(bx(0.12, 0.12, pd), wood, pw / 2, 0.55, 0),
          part(bx(0.12, 0.12, pd), wood, pw / 2, 1.05, 0),
          part(bx(0.25, 1.3, 0.25), wood, -pw / 2, 0.65, -pd / 2),
          part(bx(0.25, 1.3, 0.25), wood, pw / 2, 0.65, -pd / 2),
          part(bx(0.25, 1.3, 0.25), wood, -pw / 2, 0.65, pd / 2),
          part(bx(0.25, 1.3, 0.25), wood, pw / 2, 0.65, pd / 2),
          part(bx(0.25, 1.3, 0.25), wood, 0, 0.65, -pd / 2),
          part(bx(0.25, 1.3, 0.25), wood, 0, 0.65, pd / 2),
        ],
        xf(px, 0, pz, 0),
      );
      const coats = [0xd9a0a0, 0x3a2e2a, 0xe8c4b8, 0x8a6a5a];
      for (let i = 0; i < 4; i++) add(pig(px - 8 + i * 4.5, pz + (i % 2 ? -2.5 : 2.2), 0.4 + i * 1.7, coats[i]));
      for (let i = 0; i < 4; i++) add(hen(px + 5 + (i % 2) * 3, pz - 3.5 + (i >> 1) * 4, 0.9 + i * 1.3));
      /* sacks of copra by the shed */
      for (let i = 0; i < 3; i++) A.add([part(bx(0.9, 0.55, 0.6), 0xb8a070, 0, 0.3, 0)], xf(28 + i * 1.6, 0, -9 + (i % 2) * 1.2, i * 0.4));
      return withYard(A.geometry(), 6, 3, 40, 26);
    };
    const hamlet = () => {
      const A = new Acc();
      /* a village: eight thatched huts round the clearing, a small mission chapel, a fire pit */
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.2832 + (i % 3) * 0.12,
          r = 28 + (i % 2) * 4,
          o = hut(Math.sin(a) * r, Math.cos(a) * r, a + Math.PI, 5 + (i % 3) * 0.5, 4 + (i % 2) * 0.5);
        A.add(o.P, o.T);
      }
      A.add(
        [
          part(bx(6.8, 0.4, 11.8), 0x9a9488, 0, 0.2, 0) /* the coral-block plinth */,
          part(bx(6.4, 2.8, 11.4), 0xf0ece0, 0, 1.8, 0) /* whitewashed walls */,
          part(prismG(7.6, 2.6, 12.4), 0x8e9494, 0, 3.2, 0) /* the iron roof */,
          part(bx(1.4, 2.3, 0.12), 0x4a3426, 0, 1.55, 5.75),
          part(bx(2.4, 0.2, 1.2), 0x9a9488, 0, 0.1, 6.4) /* the step */,
          ...[-3.4, -1.1, 1.2, 3.5].flatMap((z) => [part(bx(0.08, 1.3, 0.7), 0x3a4a5a, 3.22, 2.1, z), part(bx(0.08, 1.3, 0.7), 0x3a4a5a, -3.22, 2.1, z)]) /* side windows */,
          part(bx(0.12, 1.0, 0.12), 0x6a5236, 0, 6.2, 5.6), part(bx(0.6, 0.12, 0.12), 0x6a5236, 0, 6.4, 5.6) /* the cross over the door gable */,
          part(bx(0.3, 4.6, 0.3), 0x5a4630, -1.1, 2.3, -8.2),
          part(bx(0.3, 4.6, 0.3), 0x5a4630, 1.1, 2.3, -8.2),
          part(bx(2.7, 0.3, 0.3), 0x5a4630, 0, 4.5, -8.2),
          part(cyl(0, 0.55, 0.9, 8), 0x8a6a2a, 0, 3.9, -8.2) /* the bell, hung from the beam */,

        ],
        xf(0, 0, -64, 0),
      );
      A.add([part(cyl(1.3, 1.3, 0.4, 10), 0x3a3834, 0, 0.2, 0), part(cyl(0.8, 0.8, 0.5, 8), 0x1c1a18, 0, 0.3, 0)], xf(0, 0, 0, 0));
      return withYard(A.geometry(), 0, 0, 17, 17);
    };
    const mat = () => {
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, map: YARD, transparent: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      return m;
    };
    return { farm: farm(), hamlet: hamlet(), mat: mat() };
  })();
  const RV = 9000,
    RI = 27000,
    GN = 326,
    GC = 20,
    RNOR = new THREE.BufferAttribute(new Float32Array(RV * 3).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3),
    ROADM = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const hg = (i, j, k) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 2147483629)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  /* where the land is farmed: low, nearly level ground in broad patches, away from the forest */
  const forestF = (x, z) => vn(x * 0.0011 + 9.3, z * 0.0011 - 4.1) + 0.5 * vn(x * 0.004, z * 0.004),
    farmK = (x, z, h, tn) => {
      if (h < 3.5 || h > 75 || tn > 0.1) return 0;
      const zone = vn(x * 0.00028 + 5.5, z * 0.00028 - 2.2);
      if (zone < 0.05) return 0;
      return Math.min(1, (zone - 0.05) * 5) * ss(0.4, 0.1, forestF(x, z)) * ss(0.1, 0.04, tn);
    },
    FA = 0.31,
    FCA = Math.cos(FA),
    FSA = Math.sin(FA),
    FCS = 340;
  const M4 = new THREE.Matrix4(),
    Q4 = new THREE.Quaternion(),
    V3 = new THREE.Vector3(),
    S3 = new THREE.Vector3(),
    Y3 = new THREE.Vector3(0, 1, 0);
  /* the fields: a tilted grid of 340 m plots, six in ten rice paddies, the rest cane, sweet potato and red-earth fallow, each with its rows;
     earth dykes between the paddies, pale coral walls round the dry fields (the same look as the home farms; the Pacific: no hedgerows) */
  /* the plots' hash: whole numbers only, exact in 32-bit floats, so the battle area (BA) works out in JS exactly what the shader paints
     (a paddy, cane, its walls) */
  const FH_GL = 'float fh(vec2 c,float k){float n=mod(c.x*37.0+c.y*113.0+k*59.0,251.0);n=mod(n*n*7.0+n*13.0+5.0,251.0);n=mod(n*n*3.0+n*29.0+11.0,251.0);return n/251.0;}\n';
  const md = (a, b) => ((a % b) + b) % b;
  const fhJ = (cx, cz, k) => {
    let n = md(cx * 37 + cz * 113 + k * 59, 251);
    n = md(n * n * 7 + n * 13 + 5, 251);
    n = md(n * n * 3 + n * 29 + 11, 251);
    return n / 251;
  };
  const FARM_PAINT =
    '{float fk0=vFarm*(1.0-watK);if(fk0>0.003){vec2 u=vec2(vWP.x*' + FCA.toFixed(5) + '+vWP.z*' + FSA.toFixed(5) + ',-vWP.x*' + FSA.toFixed(5) + '+vWP.z*' + FCA.toFixed(5) + ')/' + FCS.toFixed(1) + ';' +
    'vec2 fi=floor(u),ff=fract(u);float r1=fh(fi,1.0),r2=fh(fi,2.0),r3=fh(fi,3.0);float th=0.25+0.5*fh(fi,4.0);float fk=smoothstep(th-0.3,th+0.3,vFarm)*(1.0-watK);' /* each plot fades in on its own as the farmland thickens, so the edge of a farm area is soft and does not follow the mesh triangles */ +
    'float pd=step(r1,0.6);vec3 cp=r1<0.6?(r2<0.3?mix(vec3(0.20,0.32,0.36),vec3(0.24,0.38,0.40),r2/0.3):mix(vec3(0.26,0.46,0.18),vec3(0.42,0.48,0.20),(r2-0.3)/0.7)):(r1<0.8?mix(vec3(0.32,0.48,0.16),vec3(0.38,0.54,0.20),r2):(r1<0.92?mix(vec3(0.16,0.32,0.12),vec3(0.20,0.38,0.15),r2):mix(vec3(0.44,0.26,0.17),vec3(0.50,0.31,0.20),r2)));' +
    'cp*=0.9+0.2*fh(fi,5.0);float dq=length(vWP-cameraPosition);float sk=1.0-smoothstep(500.0,2200.0,dq);' +
    'float row=(r3<0.5?u.x:u.y)*' + FCS.toFixed(1) + '/19.0;cp*=1.0-(0.14-0.08*pd)*sk*smoothstep(0.35,0.65,sin(row*6.2832)*0.5+0.5);' +
    'vec2 e=min(ff,1.0-ff)*' + FCS.toFixed(1) + ';float hl=(1.0-smoothstep(1.2,3.2,min(e.x,e.y)))*(1.0-smoothstep(2500.0,6000.0,dq));cp=mix(cp,mix(vec3(0.62,0.60,0.53),vec3(0.30,0.32,0.18),pd),hl*0.8);' +
    'float wpd=pd*step(r2,0.3);vec3 Vd=normalize(cameraPosition-vWP);cp=mix(cp,vec3(0.40,0.52,0.62),wpd*(0.35+0.5*pow(1.0-clamp(Vd.y,0.0,1.0),3.0)));' /* flooded paddies show the sky */ +
    'diffuseColor.rgb=mix(diffuseColor.rgb,cp*0.68,fk);}}\n';
  /* =====================================================================================================================
     THE ROUTES: dirt roads from the two colonial ports to the nearest villages, and paved roads between the enemy bases.
     The paved roads may cross water on a bridge only where the gap is small (700 m or less); bases that would need a longer
     crossing are not linked and keep to the sea lanes. Everything is fixed by position alone (planned once, at load).
     A route is a polyline sampled every 12 m; the chunks drape it on the ground like any other road, so scenery keeps clear of it.
     ===================================================================================================================== */
  const RT = (() => {
    const CELL = 160,
      WET = -5.5,
      cfg = { maxb: 700, wc: 25 },
      STEP = 12,
      MAXG = 0.11;
    let routes = null;
    const siteBlock = (x, z, own) => {
      for (const s of FS.list) {
        if (own.includes(s.id)) continue;
        if (Math.hypot(x - s.O.x, z - s.O.z) < s.R + 250) return true;
      }
      return false;
    };
    const ruralBlock = (x, z, gx, gz) => {
      const FC = NET.FC,
        RG = NET.RG;
      for (let ci = Math.floor((x - 110) / FC); ci <= Math.floor((x + 110) / FC); ci++)
        for (let cj = Math.floor((z - 110) / FC); cj <= Math.floor((z + 110) / FC); cj++) {
          const f = NET.farm(ci, cj);
          if (f && Math.hypot(f.x - x, f.z - z) < 110) return true;
        }
      for (let ri = Math.floor((x - 140) / RG); ri <= Math.floor((x + 140) / RG); ri++)
        for (let rj = Math.floor((z - 140) / RG); rj <= Math.floor((z + 140) / RG); rj++) {
          const h = NET.hamlet(ri, rj);
          if (h && Math.hypot(h.x - x, h.z - z) < 140 && Math.hypot(h.x - gx, h.z - gz) > 20) return true;
        }
      return false;
    };
    /* cost of moving from p to q (a short hop); Infinity when not allowed */
    const hop = (x1, z1, h1, x2, z2, h2, paved, own, gx, gz) => {
      const d = Math.hypot(x2 - x1, z2 - z1);
      if (h2 > 420 || siteBlock(x2, z2, own) || ruralBlock(x2, z2, gx, gz)) return Infinity;
      const w1 = h1 < WET,
        w2 = h2 < WET;
      if (w1 || w2) return paved ? d * (w2 ? cfg.wc : 1) : Infinity;
      const g = Math.abs(h2 - h1) / d;
      if (g > MAXG) return Infinity;
      return d * (1 + 60 * g * g);
    };
    const astar = (ax, az, bx, bz, paved, own) => {
      const dist = Math.hypot(bx - ax, bz - az),
        M = dist * 0.35 + 4500,
        x0 = Math.max(-48500, Math.min(ax, bx) - M),
        z0 = Math.max(-48500, Math.min(az, bz) - M),
        x1 = Math.min(48500, Math.max(ax, bx) + M),
        z1 = Math.min(48500, Math.max(az, bz) + M),
        nx = Math.ceil((x1 - x0) / CELL) + 1,
        nz = Math.ceil((z1 - z0) / CELL) + 1,
        N = nx * nz,
        hA = new Float32Array(N).fill(NaN),
        gS = new Float32Array(N).fill(Infinity),
        from = new Int32Array(N).fill(-1),
        done = new Uint8Array(N);
      const hAt = (k) => {
        let v = hA[k];
        if (v !== v) {
          v = WH(x0 + (k % nx) * CELL, z0 + Math.floor(k / nx) * CELL);
          hA[k] = v;
        }
        return v;
      };
      const cellOf = (x, z) => Math.max(0, Math.min(nx - 1, Math.round((x - x0) / CELL))) + nx * Math.max(0, Math.min(nz - 1, Math.round((z - z0) / CELL)));
      const s = cellOf(ax, az),
        t = cellOf(bx, bz);
      /* binary heap of [f, k] */
      const hf = [],
        hk = [];
      const push = (f, k) => {
        let i = hf.length;
        hf.push(f);
        hk.push(k);
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (hf[p] <= f) break;
          hf[i] = hf[p];
          hk[i] = hk[p];
          i = p;
        }
        hf[i] = f;
        hk[i] = k;
      };
      const pop = () => {
        const k0 = hk[0],
          fl = hf.pop(),
          kl = hk.pop();
        const n = hf.length;
        if (n) {
          let i = 0;
          for (;;) {
            let c = 2 * i + 1;
            if (c >= n) break;
            if (c + 1 < n && hf[c + 1] < hf[c]) c++;
            if (hf[c] >= fl) break;
            hf[i] = hf[c];
            hk[i] = hk[c];
            i = c;
          }
          hf[i] = fl;
          hk[i] = kl;
        }
        return k0;
      };
      gS[s] = 0;
      push(0, s);
      let it = 0;
      while (hf.length && it++ < 400000) {
        const k = pop();
        if (done[k]) continue;
        done[k] = 1;
        if (k === t) break;
        const ki = k % nx,
          kj = (k - ki) / nx,
          cx = x0 + ki * CELL,
          cz = z0 + kj * CELL,
          ch = hAt(k);
        for (let a = -1; a <= 1; a++)
          for (let b = -1; b <= 1; b++) {
            if (!a && !b) continue;
            const ni = ki + a,
              nj = kj + b;
            if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
            const k2 = ni + nj * nx;
            if (done[k2]) continue;
            const x2 = x0 + ni * CELL,
              z2 = z0 + nj * CELL;
            const c = k2 === t ? Math.hypot(x2 - cx, z2 - cz) : hop(cx, cz, ch, x2, z2, hAt(k2), paved, own, bx, bz);
            if (c === Infinity) continue;
            const g2 = gS[k] + c;
            if (g2 < gS[k2]) {
              gS[k2] = g2;
              from[k2] = k;
              push(g2 + Math.hypot(bx - x2, bz - z2), k2);
            }
          }
      }
      if (!done[t]) return null;
      const pts = [];
      for (let k = t; k >= 0; k = from[k]) {
        pts.push([x0 + (k % nx) * CELL, z0 + Math.floor(k / nx) * CELL]);
        if (k === s) break;
      }
      pts.reverse();
      pts[0] = [ax, az];
      pts[pts.length - 1] = [bx, bz];
      return pts;
    };
    /* cost of a straight run (sampled every 40 m) between two points, under the same rules */
    const segCost = (p, q, paved, own, gx, gz) => {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]),
        n = Math.max(1, Math.ceil(L / 40));
      let c = 0,
        px = p[0],
        pz = p[1],
        ph = WH(px, pz);
      for (let i = 1; i <= n; i++) {
        const x = p[0] + ((q[0] - p[0]) * i) / n,
          z = p[1] + ((q[1] - p[1]) * i) / n,
          h = WH(x, z),
          k = hop(px, pz, ph, x, z, h, paved, own, gx, gz);
        if (k === Infinity) return Infinity;
        c += k;
        px = x;
        pz = z;
        ph = h;
      }
      return c;
    };
    const smooth = (pts, paved, own, gx, gz) => {
      const n = pts.length,
        pre = [0];
      for (let i = 1; i < n; i++) {
        const c = segCost(pts[i - 1], pts[i], paved, own, gx, gz);
        pre.push(pre[i - 1] + (isFinite(c) ? c : 1e9));
      }
      const out = [pts[0]];
      let i = 0;
      while (i < n - 1) {
        let j = Math.min(n - 1, i + 45),
          took = false;
        for (; j > i + 1; j--) {
          const c = segCost(pts[i], pts[j], paved, own, gx, gz);
          if (c <= (pre[j] - pre[i]) * 1.03 + 40) {
            took = true;
            break;
          }
        }
        if (!took) j = i + 1;
        out.push(pts[j]);
        i = j;
      }
      return out;
    };
    const chaikin = (pts, times) => {
      let P = pts;
      for (let r = 0; r < times; r++) {
        const Q = [P[0]];
        for (let i = 0; i < P.length - 1; i++) {
          const a = P[i],
            b = P[i + 1];
          Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
        }
        Q.push(P[P.length - 1]);
        P = Q;
      }
      return P;
    };
    const resample = (pts) => {
      const xs = [pts[0][0]],
        zs = [pts[0][1]];
      let carry = 0;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1],
          b = pts[i],
          L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        let s = STEP - carry;
        while (s <= L) {
          xs.push(a[0] + ((b[0] - a[0]) * s) / L);
          zs.push(a[1] + ((b[1] - a[1]) * s) / L);
          s += STEP;
        }
        carry = L - (s - STEP);
      }
      xs.push(pts[pts.length - 1][0]);
      zs.push(pts[pts.length - 1][1]);
      return [xs, zs];
    };
    /* plan one route; returns {paved, x, z, y (deck height or NaN), ...} or null */
    const make = (A, B, paved, own, hamEnd) => {
      let raw = astar(A[0], A[1], B[0], B[1], paved, own);
      if (!raw) return null;
      raw = smooth(raw, paved, own, B[0], B[1]);
      let xs, zs;
      for (let pass = 0; pass < 2; pass++) {
        const P = pass === 0 ? chaikin(raw, 2) : raw;
        [xs, zs] = resample(P);
        /* the rounded line must still obey the rules */
        let ok = true;
        for (let k = 1; k < xs.length && ok; k += 2) {
          const h = WH(xs[k], zs[k]);
          if (h > 420 || siteBlock(xs[k], zs[k], own) || (!paved && h < WET) || ruralBlock(xs[k], zs[k], B[0], B[1])) ok = false;
        }
        if (ok) break;
        if (pass === 1) return null;
      }
      /* a village end stops at its ring road */
      if (hamEnd) {
        while (xs.length > 2 && Math.hypot(xs[xs.length - 1] - hamEnd.x, zs[zs.length - 1] - hamEnd.z) < 50) {
          xs.pop();
          zs.pop();
        }
        const lx = xs[xs.length - 1],
          lz = zs[zs.length - 1],
          dd = Math.hypot(lx - hamEnd.x, lz - hamEnd.z);
        if (dd > 50) {
          xs.push(hamEnd.x + ((lx - hamEnd.x) * 49.5) / dd);
          zs.push(hamEnd.z + ((lz - hamEnd.z) * 49.5) / dd);
        }
      }
      const n = xs.length,
        wet = new Uint8Array(n);
      for (let k = 0; k < n; k++) wet[k] = WH(xs[k], zs[k]) < WET ? 1 : 0;
      const y = new Float32Array(n).fill(NaN);
      let bridges = 0,
        longest = 0;
      if (paved) {
        for (let k = 0; k < n; k++) {
          if (!wet[k]) continue;
          let e = k;
          while (e + 1 < n && (wet[e + 1] || (e + 3 < n && (wet[e + 2] || wet[e + 3])))) e++;
          const a = Math.max(0, k - 3),
            b = Math.min(n - 1, e + 3),
            ya = WH(xs[a], zs[a]),
            yb = WH(xs[b], zs[b]);
          longest = Math.max(longest, (b - a) * STEP);
          for (let q = a; q <= b; q++) y[q] = Math.max(-1.5, ya + ((yb - ya) * (q - a)) / Math.max(1, b - a)) + 0.3;
          bridges++;
          k = b;
        }
        if (longest > cfg.maxb) return null;
      } else if (wet.some((v) => v)) return null;
      let x0 = 1e9,
        x1 = -1e9,
        z0 = 1e9,
        z1 = -1e9;
      for (let k = 0; k < n; k++) {
        x0 = Math.min(x0, xs[k]);
        x1 = Math.max(x1, xs[k]);
        z0 = Math.min(z0, zs[k]);
        z1 = Math.max(z1, zs[k]);
      }
      return { paved, x: Float64Array.from(xs), z: Float64Array.from(zs), y, n, x0, x1, z0, z1, bridges, longest, len: n * STEP };
    };
    const gate = (s) => (s.kind === 'air' ? s.w(0, -1045) : s.kind === 'conv' ? s.w(0, -138) : s.w(0, -150));
    const plan = () => {
      const out = [],
        info = [];
      /* dirt roads: each colonial port to its (up to two) nearest villages */
      for (const s of FS.list.filter((q) => q.kind === 'port')) {
        const g = gate(s),
          ri = Math.floor(s.O.x / NET.RG),
          rj = Math.floor(s.O.z / NET.RG),
          cand = [];
        for (let a = -3; a <= 3; a++)
          for (let b = -3; b <= 3; b++) {
            const h = NET.hamlet(ri + a, rj + b);
            if (h && Math.hypot(h.x - s.O.x, h.z - s.O.z) < 20000) cand.push(h);
          }
        cand.sort((p, q) => Math.hypot(p.x - s.O.x, p.z - s.O.z) - Math.hypot(q.x - s.O.x, q.z - s.O.z));
        let got = 0;
        for (const h of cand.slice(0, 5)) {
          if (got >= 2) break;
          const r = make(g, [h.x, h.z], false, [s.id], h);
          if (r) {
            r.from = s.id;
            r.to = h.id;
            out.push(r);
            got++;
          }
        }
        info.push([s.id, 'dirt', cand.length, got]);
      }
      /* paved roads between the enemy bases: shortest links first, only those that join separate groups, bridges only over small gaps */
      const en = FS.list.filter((q) => q.kind !== 'port'),
        pairs = [];
      for (let i = 0; i < en.length; i++) for (let j = i + 1; j < en.length; j++) pairs.push([en[i], en[j], Math.hypot(en[i].O.x - en[j].O.x, en[i].O.z - en[j].O.z)]);
      pairs.sort((p, q) => p[2] - q[2]);
      const grp = new Map(en.map((s) => [s.id, s.id]));
      const root = (id) => (grp.get(id) === id ? id : root(grp.get(id)));
      for (const [a, b, d] of pairs) {
        if (root(a.id) === root(b.id) || d > 60000) continue;
        const r = make(gate(a), gate(b), true, [a.id, b.id], null);
        info.push([a.id + '-' + b.id, 'paved', (d / 1000).toFixed(1) + 'km', r ? 'ok ' + (r.len / 1000).toFixed(1) + 'km, ' + r.bridges + ' bridges, longest ' + r.longest + ' m' : 'no land route (ships only)']);
        if (r) {
          r.from = a.id;
          r.to = b.id;
          out.push(r);
          grp.set(root(a.id), root(b.id));
        }
      }
      /* THE ARMY'S CORAL ROAD (PLAN_M4A3_Sherman_Tank 4.2, 4.4; the user's, 2026-11-23): from Beach Orange up to Camp Buckner, west
         across the island to Depot Mikawa's gate, and north up the neck to Port Ugaki; a spur south to Buckner Range. Crushed coral,
         6 m wide, bridged where it must */
      {
        const A_ = (id) => FS.army.find((q) => q.id === id),
          BO = A_('beach'),
          CB = A_('camp'),
          RG = A_('range'),
          MK = FS.list.find((q) => q.id === 'cv1'),
          UG = FS.nav.find((q) => q.navy === 'jp');
        const ar = (a, b, own, from, to) => {
          const r = make(a, b, true, own, null);
          info.push([from + '-' + to, 'coral', r ? 'ok ' + (r.len / 1000).toFixed(1) + 'km, ' + r.bridges + ' bridges, longest ' + r.longest + ' m' : 'no land route']);
          if (r) out.push(Object.assign(r, { coral: true, from, to }));
        };
        if (BO && CB && RG && MK && UG) {
          ar(BO.w(0, -120), CB.w(0, 150), [], 'beach', 'camp');
          ar(CB.w(-215, 0), gate(MK), ['cv1'], 'camp', 'cv1');
          ar(gate(MK), UG.w(0, -150), ['cv1'], 'cv1', 'navjp');
          ar(CB.w(0, -140), RG.w(0, 70), [], 'camp', 'range');
        }
      }
      routes = out;
      routes.info = info;
      return out;
    };
    /* is (x, z) within d of a route? (used by the site fences so a road gets its gate) */
    /* the routes' points in 64 m cells, made once (the fences ask this for every panel: it walked every route's points each time) */
    let NG = null,
      NGr = null;
    const ngKey = (i, j) => i * 100003 + j;
    const near = (x, z, d) => {
      const L = list();
      if (NGr !== L) {
        NGr = L;
        NG = new Map();
        for (const R of L)
          for (let k = 0; k < R.n; k++) {
            const key = ngKey(Math.floor(R.x[k] / 64), Math.floor(R.z[k] / 64));
            let c = NG.get(key);
            if (!c) NG.set(key, (c = []));
            c.push(R.x[k], R.z[k]);
          }
      }
      const i0 = Math.floor((x - d) / 64),
        i1 = Math.floor((x + d) / 64),
        j0 = Math.floor((z - d) / 64),
        j1 = Math.floor((z + d) / 64);
      for (let i = i0; i <= i1; i++)
        for (let j = j0; j <= j1; j++) {
          const c = NG.get(ngKey(i, j));
          if (c) for (let k = 0; k < c.length; k += 2) if (Math.abs(c[k] - x) < d && Math.abs(c[k + 1] - z) < d && Math.hypot(c[k] - x, c[k + 1] - z) < d) return true;
        }
      return false;
    };
    const list = () => routes || plan();
    return { list, near, STEP, cfg, plan, astar, gate, make };
  })();

  /* the far world's ground shader: its paint, detail, fields and shore; cut = obey NEARCUT (the chunks do, the battle area's own tiles do not) */
  const groundShade = (mat, tex, O, cut) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.chTex = { value: tex };
      sh.uniforms.chO = { value: O };
      sh.uniforms.uDet = DETU;
      sh.uniforms.nearC = NEARCUT;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;varying vec3 vWN;attribute float farm;varying float vFarm;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFarm=farm;vWP=(modelMatrix*vec4(transformed,1.0)).xyz;vWN=normalize(mat3(modelMatrix)*normal);');
      /* the same ground detail as the home map (blades, tufts, layered rock), without the farm fields */
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;varying vec3 vWN;varying float vFarm;float hf(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' + FH_GL + 'uniform vec4 nearC;uniform sampler2D chTex;uniform vec4 chO;uniform float uDet;\n' + TERR_NOISE)
        .replace(
          '#include <map_fragment>',
          (cut ? 'if(nearC.w>0.0&&abs(vWP.x-nearC.x)<nearC.z&&abs(vWP.z-nearC.y)<nearC.z)discard;' : '') +
            'float shH=texture2D(chTex,(vWP.xz-chO.xy)/chO.zw).r*47.0-41.0;float shM=1.0-smoothstep(-8.8,-6.2,shH);float watK=shM;float vLand=1.0;\n' +
            'float wpd=0.0;' + TERR_DETAIL.slice(TERR_DETAIL.indexOf('float dd=')) /* no farm texture out here: no paddy water from it */,
        )
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + FARM_PAINT + SHORE_PAINT);
    };
    mat.userData.key = cut ? 'worldchunk4' : 'worldground4';
    csApply(mat); /* the clouds' shadows fall on it like on the home map */
    return mat;
  };
  const mkItem = () => {
    const g = new THREE.BufferGeometry(),
      pos = new Float32Array(NV * 3),
      nor = new Float32Array(NV * 3),
      col = new Float32Array(NV * 3),
      td = new Uint8Array(TEXN * TEXN),
      tex = new THREE.DataTexture(td, TEXN, TEXN, THREE.LuminanceFormat, THREE.UnsignedByteType),
      O = new THREE.Vector4(),
      hs = new Float32Array(NV),
      farm = new Float32Array(NV),
      rg = new Uint8Array(GN * GN),
      rpos = new Float32Array(RV * 3),
      rcol = new Uint8Array(RV * 3),
      ridx = new Uint16Array(RI),
      rgeo = new THREE.BufferGeometry(),
      mat = new THREE.MeshLambertMaterial({ vertexColors: true }),
      TR = {};
    for (const [k, cap] of TCAP) {
      const geo = GEO[k],
        tg2 = new THREE.BufferGeometry();
      for (const a in geo.attributes) tg2.setAttribute(a, geo.attributes[a]);
      if (geo.index) tg2.setIndex(geo.index);
      const src = { key: k, cap, n: 0, mats: new Float32Array(cap * 16), cols: new Float32Array(cap * 3), grid: new Map() },
        im = new THREE.InstancedMesh(tg2, TMAT[k], 1); /* its own matrix array is replaced by the shared one below */
      im.instanceMatrix = new THREE.InstancedBufferAttribute(src.mats, 16);
      im.instanceColor = new THREE.InstancedBufferAttribute(src.cols, 3);
      im.count = 0;
      im.matrixAutoUpdate = false;
      TR[k] = { src, im, on: false };
    }
    rgeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
    rgeo.setAttribute('normal', RNOR);
    rgeo.setAttribute('color', new THREE.BufferAttribute(rcol, 3, true));
    rgeo.setIndex(new THREE.BufferAttribute(ridx, 1));
    rgeo.setDrawRange(0, 0);
    const roadMesh = new THREE.Mesh(rgeo, ROADM);
    roadMesh.matrixAutoUpdate = false;
    const mkInst = (geo, cap) => {
      const im = new THREE.InstancedMesh(geo, PROPS.mat, 1),
        mats = new Float32Array(cap * 16),
        cols = new Float32Array(cap * 3);
      im.instanceMatrix = new THREE.InstancedBufferAttribute(mats, 16);
      im.instanceColor = new THREE.InstancedBufferAttribute(cols, 3);
      im.count = 0;
      im.matrixAutoUpdate = false;
      return { im, mats, cols, cap, n: 0, on: false };
    };
    const FM = mkInst(PROPS.farm.clone(), 60),
      HM = mkInst(PROPS.hamlet.clone(), 4);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('farm', new THREE.BufferAttribute(farm, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    groundShade(mat, tex, O, true);
    const mesh = new THREE.Mesh(g, mat);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = true;
    return { g, pos, nor, col, td, tex, O, mat, mesh, hs, farm, TR, rg, rgeo, rpos, rcol, ridx, roadMesh, FM, HM, RSA: new Float64Array(40000), nR: 0, rOn: false };
  };
  const clr = [0, 0, 0];
  const paint = (h, ny, x, z, o) => {
    if (h < SEA.PAINT) {
      clr[0] = 0.17;
      clr[1] = 0.43;
      clr[2] = 0.66;
      return clr;
    }
    const r = hash(x * 0.01, z * 0.01) * 0.1,
      pm = Math.max(0, vn(x * 0.0009 + 3.1, z * 0.0009 - 1.7)) * 0.9;
    let R = 0.27 + r + (0.5 + r - 0.27 - r) * pm,
      G = 0.45 + r + (0.47 - 0.45 - r) * pm,
      B = 0.17 + (0.22 - 0.17) * pm;
    if (h < 420) {
      const f = ss(0.1, 0.5, vn(x * 0.0011 + 9.3, z * 0.0011 - 4.1)) * 0.85;
      R += (0.1 - R) * f;
      G += (0.23 - G) * f;
      B += (0.09 - B) * f;
    }
    if (h > 150) {
      const f = ss(150, 300, h);
      R += (0.36 - R) * f;
      G += (0.34 - G) * f;
      B += (0.2 - B) * f;
    }
    const f = Math.max(ss(0.93, 0.78, ny), ss(300, 650, h));
    R += (0.42 + r - R) * f;
    G += (0.4 + r - G) * f;
    B += (0.36 - B) * f;
    if (h > 650) {
      const f2 = ss(650, 800, h);
      R = 0.5 + (0.95 - 0.5) * f2;
      G = 0.48 + (0.97 - 0.48) * f2;
      B = 0.44 + (1 - 0.44) * f2;
    }
    clr[0] = R;
    clr[1] = G;
    clr[2] = B;
    return clr;
  };
  /* the building of one chunk, as a generator: it yields every so often, and the manager decides how long to keep going each frame */
  function* build(c, it) {
    const hs = it.hs,
      dx = (c.x1 - c.x0) / SEGC,
      dz = (c.z1 - c.z0) / SEGC;
    let mx = -1e9;
    /* every farmstead and hamlet stands on a level platform (the mesh is 100 m a cell, so a flat green or yard on a slope would be cut off by the ground): the ground is
       levelled to the height at the centre out to R0 and eased back to the natural ground by R1; the list is the same for every chunk that touches one, so seams match */
    const PL = [];
    {
      const RGN = NET.RG,
        FCN = NET.FC,
        mg = 330;
      for (let a = Math.floor((c.x0 - mg) / RGN); a <= Math.floor((c.x1 + mg) / RGN); a++)
        for (let b = Math.floor((c.z0 - mg) / RGN); b <= Math.floor((c.z1 + mg) / RGN); b++) {
          const h = NET.hamlet(a, b);
          if (h && h.x > c.x0 - mg && h.x < c.x1 + mg && h.z > c.z0 - mg && h.z < c.z1 + mg) PL.push(h.x, h.z, 150, 330, WH(h.x, h.z));
        }
      for (let a = Math.floor((c.x0 - mg) / FCN); a <= Math.floor((c.x1 + mg) / FCN); a++) {
        for (let b = Math.floor((c.z0 - mg) / FCN); b <= Math.floor((c.z1 + mg) / FCN); b++) {
          const f = NET.farm(a, b);
          if (f && f.x > c.x0 - mg && f.x < c.x1 + mg && f.z > c.z0 - mg && f.z < c.z1 + mg && NET.live(f)) PL.push(f.x, f.z, 110, 260, WH(f.x, f.z));
          yield 1;
        }
      }
    }
    const WHP = (x, z) => {
      let h = WH(x, z);
      for (let q = 0; q < PL.length; q += 5) {
        const d = Math.hypot(x - PL[q], z - PL[q + 1]);
        if (d < PL[q + 3]) {
          const t = d <= PL[q + 2] ? 0 : (d - PL[q + 2]) / (PL[q + 3] - PL[q + 2]),
            w = 1 - t * t * (3 - 2 * t);
          h += (PL[q + 4] - h) * w;
        }
      }
      return h;
    };
    for (let j = 0; j <= SEGC; j++) {
      for (let i = 0; i <= SEGC; i++) {
        const h = PL.length ? WHP(c.x0 + i * dx, c.z0 + j * dz) : WH(c.x0 + i * dx, c.z0 + j * dz);
        hs[i + (SEGC + 1) * j] = h;
        if (h > mx) mx = h;
      }
      yield 1;
    }
    let mn = 1e9;
    for (let j = 0; j <= SEGC; j++) {
      for (let i = 0; i <= SEGC; i++) {
        const k = i + (SEGC + 1) * j,
          x = c.x0 + i * dx,
          z = c.z0 + j * dz,
          h = hs[k],
          /* at the edge of the chunk the slope is taken across it, so the lighting has no seam where two chunks meet */
          hl = i > 0 ? hs[i - 1 + (SEGC + 1) * j] : WHP(x - dx, z),
          hr = i < SEGC ? hs[i + 1 + (SEGC + 1) * j] : WHP(x + dx, z),
          hu = j > 0 ? hs[i + (SEGC + 1) * (j - 1)] : WHP(x, z - dz),
          hd = j < SEGC ? hs[i + (SEGC + 1) * (j + 1)] : WHP(x, z + dz);
        let nx = -(hr - hl) / (2 * dx),
          nz = -(hd - hu) / (2 * dz),
          nl = Math.hypot(nx, 1, nz);
        nx /= nl;
        nz /= nl;
        let ny = 1 / nl;
        it.farm[k] = h < 7 ? 0 : farmK(x, z, h, Math.sqrt(1 - ny * ny) / ny) * Math.min(1, (h - 7) / 6); /* no field on the beach: they start 7 m up and are full strength at 13 m */
        if (h < 1) {
          /* the shore stays flat-lit: a vertex on the shore ramp facing away from the sun made a dark outline */
          nx = nz = 0;
          ny = 1;
        }
        const y = Math.max(h, SEA.PAINT);
        if (y < mn) mn = y;
        it.pos[k * 3] = x;
        it.pos[k * 3 + 1] = y;
        it.pos[k * 3 + 2] = z;
        it.nor[k * 3] = nx;
        it.nor[k * 3 + 1] = ny;
        it.nor[k * 3 + 2] = nz;
        const q = paint(h, ny, x, z);
        it.col[k * 3] = q[0];
        it.col[k * 3 + 1] = q[1];
        it.col[k * 3 + 2] = q[2];
      }
      yield 2;
    }
    /* the height map the fragment shader paints the shore from */
    /* one texel of margin all round, so the colours match across the border of two chunks */
    const sx = (c.x1 - c.x0) / (TEXN - 2),
      sz = (c.z1 - c.z0) / (TEXN - 2);
    for (let j = 0; j < TEXN; j++) {
      for (let i = 0; i < TEXN; i++) {
        const h = WH(c.x0 + (i - 0.5) * sx, c.z0 + (j - 0.5) * sz);
        it.td[j * TEXN + i] = Math.round(255 * Math.max(0, Math.min(1, (h + 41) / 47))); /* -41..+6 m in 8 bits (0.18 m steps): finer than before, so a gently sloping coast has no terraces */
      }
      yield 3;
    }
    it.O.set(c.x0 - sx, c.z0 - sz, TEXN * sx, TEXN * sz);
    /* ---- the rural network inside this chunk: roads (a ribbon draped on the ground), farmsteads, hamlets; what is built is also marked in a coarse grid, so no tree or tuft grows on it ---- */
    it.rg.fill(0);
    it.FM.n = 0;
    it.HM.n = 0;
    let rv = 0,
      ri = 0;
    {
      const row = SEGC + 1,
        meshH0 = (x, z) => {
          const u = (x - c.x0) / dx,
            v = (z - c.z0) / dz,
            a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
            b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
            fx = Math.min(1, Math.max(0, u - a)),
            fz = Math.min(1, Math.max(0, v - b)),
            k0 = a + row * b,
            ha = Math.max(hs[k0], SEA.PAINT),
            hd = Math.max(hs[k0 + 1], SEA.PAINT),
            hb = Math.max(hs[k0 + row], SEA.PAINT),
            hc = Math.max(hs[k0 + row + 1], SEA.PAINT);
          return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
        };
      const mark = (x, z, r, val) => {
        const gi0 = Math.floor((x - r - c.x0) / GC),
          gi1 = Math.floor((x + r - c.x0) / GC),
          gj0 = Math.floor((z - r - c.z0) / GC),
          gj1 = Math.floor((z + r - c.z0) / GC);
        for (let gj = Math.max(0, gj0); gj <= Math.min(GN - 1, gj1); gj++)
          for (let gi = Math.max(0, gi0); gi <= Math.min(GN - 1, gi1); gi++) {
            const ddx = c.x0 + (gi + 0.5) * GC - x,
              ddz = c.z0 + (gj + 0.5) * GC - z;
            if (ddx * ddx + ddz * ddz < (r + GC * 0.7) * (r + GC * 0.7)) it.rg[gj * GN + gi] |= val;
          }
      };
      const P2 = [0, 0],
        PA = [0, 0],
        PB = [0, 0];
      /* every road sample near this chunk (x, z pairs): what buildings must keep clear of */
      const RS = it.RSA;
      let rsn = 0;
      let prevV = -1,
        lrx = 1e9,
        lrz = 1e9;
      const DIRT = 0x6e695d;
      const emit = (x, z, tx, tz, hw = 2.6, col = DIRT, yv = NaN) => {
        const inside = x >= c.x0 - 30 && x < c.x1 + 30 && z >= c.z0 - 30 && z < c.z1 + 30;
        if (x >= c.x0 - 100 && x < c.x1 + 100 && z >= c.z0 - 100 && z < c.z1 + 100) {
          /* the samples are 4 m apart at most, so a building cannot slip between them */
          if (prevV >= 0 || lrx < 1e8) {
            const gl = Math.hypot(x - lrx, z - lrz),
              ng = Math.floor(gl / 4);
            if (lrx < 1e8 && gl < 40) for (let q = 1; q <= ng && rsn < 39990; q++) {
              RS[rsn++] = lrx + ((x - lrx) * q) / (ng + 1);
              RS[rsn++] = lrz + ((z - lrz) * q) / (ng + 1);
            }
          }
          if (rsn < 39990) {
            RS[rsn++] = x;
            RS[rsn++] = z;
          }
          lrx = x;
          lrz = z;
        }
        if (!inside) {
          prevV = -1;
          lrx = 1e9;
          return;
        }
        if (rv + 2 > RV || ri + 6 > RI) return;
        const lx = x - tz * hw,
          lz = z + tx * hw,
          rx = x + tz * hw,
          rz = z - tx * hw,
          yo = col === DIRT ? 0.3 : 0.36;
        it.rpos[rv * 3] = lx;
        it.rpos[rv * 3 + 1] = yv === yv ? yv : meshH0(lx, lz) + yo;
        it.rpos[rv * 3 + 2] = lz;
        it.rpos[rv * 3 + 3] = rx;
        it.rpos[rv * 3 + 4] = yv === yv ? yv : meshH0(rx, rz) + yo;
        it.rpos[rv * 3 + 5] = rz;
        for (let q = 0; q < 2; q++) {
          it.rcol[(rv + q) * 3] = (col >> 16) & 255;
          it.rcol[(rv + q) * 3 + 1] = (col >> 8) & 255;
          it.rcol[(rv + q) * 3 + 2] = col & 255;
        }
        if (prevV >= 0) {
          it.ridx[ri++] = prevV;
          it.ridx[ri++] = rv;
          it.ridx[ri++] = prevV + 1;
          it.ridx[ri++] = prevV + 1;
          it.ridx[ri++] = rv;
          it.ridx[ri++] = rv + 1;
        }
        prevV = rv;
        rv += 2;
        mark(x, z, 6, 1);
      };
      /* a road from a to b; where an end is a hamlet the road stops at the village ring road (50 m out), finely stepped so it meets the ring */
      const road = (a, b) => {
        const len = Math.hypot(b.x - a.x, b.z - a.z),
          ts = [0];
        let t = 0;
        while (t < 1) {
          NET.pathPt(a, b, t, P2);
          const near = Math.min(Math.hypot(P2[0] - a.x, P2[1] - a.z), Math.hypot(P2[0] - b.x, P2[1] - b.z));
          t = Math.min(1, t + (near < 85 ? 4 : 22) / len);
          ts.push(t);
        }
        prevV = -1;
        lrx = 1e9;
        for (let k = 0; k < ts.length; k++) {
          NET.pathPt(a, b, ts[k], P2);
          const x = P2[0],
            z = P2[1];
          if (Math.hypot(x - a.x, z - a.z) < (a.hamlet ? 49 : 26) || Math.hypot(x - b.x, z - b.z) < (b.hamlet ? 49 : 26)) {
            prevV = -1;
            lrx = 1e9;
            continue;
          }
          NET.pathPt(a, b, ts[Math.max(0, k - 1)], PA);
          NET.pathPt(a, b, ts[Math.min(ts.length - 1, k + 1)], PB);
          let tx = PB[0] - PA[0],
            tz = PB[1] - PA[1];
          const tl = Math.hypot(tx, tz) || 1;
          emit(x, z, tx / tl, tz / tl);
        }
      };
      const ring = (h) => {
        prevV = -1;
        lrx = 1e9;
        for (let k = 0; k <= 36; k++) {
          const an = (k / 36) * 6.2832;
          emit(h.x + Math.cos(an) * 50, h.z + Math.sin(an) * 50, -Math.sin(an), Math.cos(an));
        }
      };
      /* do these footprints (local rectangles: x, z, half width, half depth), put down at (px, pz) turned by yaw, keep 6 m clear of every road? returns how many points hit */
      const clash = (px, pz, yaw, mir, rects, sc, RL, nRL) => {
        const cy = Math.cos(yaw),
          sy = Math.sin(yaw);
        let bad = 0;
        for (let ri2 = 0; ri2 < rects.length; ri2++) {
          const rc = rects[ri2],
            rx = rc[0] * sc,
            rz = rc[1] * sc,
            hw = rc[2] * sc,
            hd = rc[3] * sc,
            su = Math.max(2, hw / Math.ceil(hw / 4)),
            sv = Math.max(2, hd / Math.ceil(hd / 4));
          for (let u = -hw; u <= hw + 0.01; u += su)
            for (let v = -hd; v <= hd + 0.01; v += sv) {
              const lx = (rx + u) * mir,
                lz = rz + v,
                wx = px + lx * cy + lz * sy,
                wz = pz - lx * sy + lz * cy;
              for (let q = 0; q < nRL; q += 2) {
                const ddx = RL[q] - wx,
                  ddz = RL[q + 1] - wz;
                if (ddx * ddx + ddz * ddz < 36) {
                  bad++;
                  break;
                }
              }
            }
        }
        return bad;
      };
      const RLB = new Float64Array(16384);
      let nRL = 0;
      const nearRoads = (ox, oz) => {
        nRL = 0;
        for (let q = 0; q < rsn && nRL < 16382; q += 2)
          if (Math.abs(RS[q] - ox) < 120 && Math.abs(RS[q + 1] - oz) < 120) {
            RLB[nRL++] = RS[q];
            RLB[nRL++] = RS[q + 1];
          }
      };
      const hamlets = [],
        farms = [],
        RGN = NET.RG,
        FCN = NET.FC;
      /* hamlets and the roads between them */
      {
        const r0 = Math.floor((c.x0 - 14000) / RGN),
          r1 = Math.floor((c.x1 + 14000) / RGN),
          s0 = Math.floor((c.z0 - 14000) / RGN),
          s1 = Math.floor((c.z1 + 14000) / RGN);
        for (let a = r0; a <= r1; a++) {
          for (let b = s0; b <= s1; b++) {
            const A = NET.hamlet(a, b);
            if (!A) continue;
            if (A.x > c.x0 - 130 && A.x < c.x1 + 130 && A.z > c.z0 - 130 && A.z < c.z1 + 130) {
              hamlets.push(A);
              ring(A);
            }
            for (const B of NET.links(A)) {
              if (!(A.id < B.id || !NET.links(B).includes(A))) continue;
              if (Math.max(A.x, B.x) < c.x0 - 60 || Math.min(A.x, B.x) > c.x1 + 60 || Math.max(A.z, B.z) < c.z0 - 60 || Math.min(A.z, B.z) > c.z1 + 60) {
                /* the bend can carry the road a little outside the ends' box */
                const m = Math.abs(NET.bend(A, B)) + 60;
                if (Math.max(A.x, B.x) + m < c.x0 || Math.min(A.x, B.x) - m > c.x1 || Math.max(A.z, B.z) + m < c.z0 || Math.min(A.z, B.z) - m > c.z1) continue;
              }
              road(A, B);
            }
          }
          yield 4;
        }
      }
      /* the routes: dirt roads from the colonial ports to the villages, paved roads between the enemy bases (a bridge where one crosses a small gap) */
      {
        const PAVE = 0x3b3b3e,
          CONC = 0xa4a49c,
          DARK = 0x5e5e5a,
          sRL = { pv: -1 },
          sRR = { pv: -1 },
          sFL = { pv: -1 },
          sFR = { pv: -1 },
          sts = [sRL, sRR, sFL, sFR];
        const rib = (st, ax, ay, az, bx, by, bz, col) => {
          if (rv + 2 > RV || ri + 6 > RI) {
            st.pv = -1;
            return;
          }
          const o = rv * 3;
          it.rpos[o] = ax;
          it.rpos[o + 1] = ay;
          it.rpos[o + 2] = az;
          it.rpos[o + 3] = bx;
          it.rpos[o + 4] = by;
          it.rpos[o + 5] = bz;
          for (let q = 0; q < 2; q++) {
            it.rcol[o + q * 3] = (col >> 16) & 255;
            it.rcol[o + q * 3 + 1] = (col >> 8) & 255;
            it.rcol[o + q * 3 + 2] = col & 255;
          }
          if (st.pv >= 0) {
            it.ridx[ri++] = st.pv;
            it.ridx[ri++] = rv;
            it.ridx[ri++] = st.pv + 1;
            it.ridx[ri++] = st.pv + 1;
            it.ridx[ri++] = rv;
            it.ridx[ri++] = rv + 1;
          }
          st.pv = rv;
          rv += 2;
        };
        for (const R of RT.list()) {
          if (R.x1 < c.x0 - 130 || R.x0 > c.x1 + 130 || R.z1 < c.z0 - 130 || R.z0 > c.z1 + 130) continue;
          const hw = R.coral ? 3.0 : R.paved ? 3.4 : 2.6,
            col = R.coral ? 0xa59e88 /* crushed coral, weathered */ : R.paved ? PAVE : DIRT;
          prevV = -1;
          lrx = 1e9;
          for (const st of sts) st.pv = -1;
          let b0 = -1;
          for (let k = 0; k < R.n; k++) {
            const x = R.x[k],
              z = R.z[k];
            if (x < c.x0 - 100 || x >= c.x1 + 100 || z < c.z0 - 100 || z >= c.z1 + 100) {
              prevV = -1;
              lrx = 1e9;
              for (const st of sts) st.pv = -1;
              continue;
            }
            const ka = Math.max(0, k - 1),
              kb = Math.min(R.n - 1, k + 1);
            let tx = R.x[kb] - R.x[ka],
              tz = R.z[kb] - R.z[ka];
            const tl = Math.hypot(tx, tz) || 1;
            tx /= tl;
            tz /= tl;
            const y = R.y[k];
            emit(x, z, tx, tz, hw, col, y);
            if (y === y && x >= c.x0 - 30 && x < c.x1 + 30 && z >= c.z0 - 30 && z < c.z1 + 30) {
              if (b0 < 0) b0 = k;
              const lx = x - tz * (hw + 0.1),
                lz = z + tx * (hw + 0.1),
                rx = x + tz * (hw + 0.1),
                rz = z - tx * (hw + 0.1);
              rib(sRL, lx, y, lz, lx, y + 0.95, lz, CONC);
              rib(sRR, rx, y, rz, rx, y + 0.95, rz, CONC);
              rib(sFL, lx, y, lz, lx, y - 1.5, lz, DARK);
              rib(sFR, rx, y, rz, rx, y - 1.5, rz, DARK);
              if ((k - b0) % 4 === 0) {
                const pst = { pv: -1 };
                rib(pst, lx, y - 1.5, lz, lx, -9.5, lz, DARK);
                rib(pst, rx, y - 1.5, rz, rx, -9.5, rz, DARK);
              }
            } else {
              for (const st of sts) st.pv = -1;
              if (y !== y) b0 = -1;
            }
          }
          prevV = -1;
          lrx = 1e9;
        }
      }
      /* farms and their roads */
      {
        const f0 = Math.floor((c.x0 - 7200) / FCN),
          f1 = Math.floor((c.x1 + 7200) / FCN),
          g0 = Math.floor((c.z0 - 7200) / FCN),
          g1 = Math.floor((c.z1 + 7200) / FCN);
        for (let a = f0; a <= f1; a++) {
          for (let b = g0; b <= g1; b++) {
            if (b % 3 === 0) yield 4;
            const f = NET.farm(a, b);
            if (!f || !NET.live(f)) continue;
            if (f.x > c.x0 - 60 && f.x < c.x1 + 60 && f.z > c.z0 - 60 && f.z < c.z1 + 60) farms.push(f);
            const p = f.par,
              m = Math.abs(NET.bend(f, p)) + 60;
            if (Math.max(f.x, p.x) + m < c.x0 || Math.min(f.x, p.x) - m > c.x1 || Math.max(f.z, p.z) + m < c.z0 || Math.min(f.z, p.z) - m > c.z1) continue;
            road(f, p);
          }
        }
      }
      /* the buildings */
      const put = (T, o, x, z, yaw, k, tint) => {
        if (T.n >= T.cap) return;
        const y = meshH0(Math.min(c.x1 - 1, Math.max(c.x0, x)), Math.min(c.z1 - 1, Math.max(c.z0, z)));
        Q4.setFromAxisAngle(Y3, yaw);
        M4.compose(V3.set(x, y, z), Q4, S3.set(k, k, k));
        M4.toArray(T.mats, T.n * 16);
        T.cols[T.n * 3] = tint;
        T.cols[T.n * 3 + 1] = tint;
        T.cols[T.n * 3 + 2] = tint;
        T.n++;
      };
      /* the buildings stand clear of every road: the layout is turned (and mirrored) until none of it lies within 6 m of a road */
      const FR = [[-21, 8, 5.5, 4.5], [17, -8, 9.5, 5.5], [31, 4, 2.6, 2.6], [4, -34, 13, 7.5], [9, 12, 1.8, 2], [30, -8.5, 3.5, 2]],
        HR2 = [[0, -66, 3.8, 9], [0, -73, 2.4, 2.4], ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [Math.sin((i / 8) * 6.2832 + (i % 3) * 0.12) * (28 + (i % 2) * 4), Math.cos((i / 8) * 6.2832 + (i % 3) * 0.12) * (28 + (i % 2) * 4), 4.5, 4])];
      W.FR = FR;
      W.HR2 = HR2;
      for (const f of farms) {
        yield 4;
        mark(f.x, f.z, 38, 2);
        if (f.x >= c.x0 && f.x < c.x1 && f.z >= c.z0 && f.z < c.z1) {
nearRoads(f.x, f.z);
          let best = 1e9,
            by = f.yaw,
            bm = 1,
            bs = 1;
          const kf = 0.92 + 0.2 * hg(f.ci, f.cj, 140);
          /* first the usual size, turned and mirrored; if a road runs through the yard, a smaller farmstead */
          for (let v = 0; v < 24 && best > 0; v++) {
            const yw = f.yaw + (v & 7) * 0.7854,
              mr = 1 /* never mirrored: a mirrored instance has flipped faces, which the lighting turns upside down */,
              sc = [1, 0.72, 0.52][(v >> 3) % 3],
              bd = clash(f.x, f.z, yw, mr, FR, sc * kf, RLB, nRL);
            if (bd < best) {
              best = bd;
              by = yw;
              bm = mr;
              bs = sc;
            }
          }
          const k = kf * bs;
          put(it.FM, 0, f.x, f.z, by, k, 0.9 + 0.2 * hg(f.ci, f.cj, 141));
          if (bm < 0) it.FM.mats[(it.FM.n - 1) * 16] *= -1, it.FM.mats[(it.FM.n - 1) * 16 + 1] *= -1, it.FM.mats[(it.FM.n - 1) * 16 + 2] *= -1;
        }
      }
      it.hamYaw = new Map();
      for (const h of hamlets) {
        yield 4;
        mark(h.x, h.z, 78, 2);
        if (h.x >= c.x0 && h.x < c.x1 && h.z >= c.z0 && h.z < c.z1) {
nearRoads(h.x, h.z);
          let best = 1e9,
            by = h.yaw;
          for (let v = 0; v < 16 && best > 0; v++) {
            const yw = h.yaw + v * 0.3927,
              bd = clash(h.x, h.z, yw, 1, HR2, 1, RLB, nRL);
            if (bd < best) {
              best = bd;
              by = yw;
            }
          }
          it.hamYaw.set(h, by);
          put(it.HM, 0, h.x, h.z, by, 1, 1);
        }
      }
      it.farmsList = farms;
      it.hamletList = hamlets;
    }
    it.nR = ri;
    it.nV = rv;
    it.rgeo.setDrawRange(0, ri);
    it.rgeo.attributes.position.needsUpdate = true;
    it.rgeo.attributes.color.needsUpdate = true;
    it.rgeo.index.needsUpdate = true;
    {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let q = 0; q < rv; q++) {
        x0 = Math.min(x0, it.rpos[q * 3]);
        x1 = Math.max(x1, it.rpos[q * 3]);
        y0 = Math.min(y0, it.rpos[q * 3 + 1]);
        y1 = Math.max(y1, it.rpos[q * 3 + 1]);
        z0 = Math.min(z0, it.rpos[q * 3 + 2]);
        z1 = Math.max(z1, it.rpos[q * 3 + 2]);
      }
      if (rv) it.rgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 10);
    }
    for (const T of [it.FM, it.HM]) {
      T.im.count = T.n;
      T.im.instanceMatrix.needsUpdate = true;
      T.im.instanceColor.needsUpdate = true;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = -1e9;
      for (let q = 0; q < T.n; q++) {
        x0 = Math.min(x0, T.mats[q * 16 + 12]);
        x1 = Math.max(x1, T.mats[q * 16 + 12]);
        z0 = Math.min(z0, T.mats[q * 16 + 14]);
        z1 = Math.max(z1, T.mats[q * 16 + 14]);
        y1 = Math.max(y1, T.mats[q * 16 + 13]);
      }
      if (T.n) T.im.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, y1, (z0 + z1) / 2), Math.hypot(x1 - x0, z1 - z0) / 2 + 150);
    }
    /* the trees: a jittered grid, the same rules as the home map (forest noise, height, slope), fixed by position alone;
       dense woods where a second noise says so, and a palm here and there along the field walls */
    for (const k in it.TR) {
      it.TR[k].src.n = 0;
      it.TR[k].src.grid.clear();
    }
    {
      const CT = 64,
        row = SEGC + 1;
      /* the height of the chunk mesh (what the trees stand on) */
      const meshH = (x, z) => {
        const u = (x - c.x0) / dx,
          v = (z - c.z0) / dz,
          a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
          b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
          fx = Math.min(1, Math.max(0, u - a)),
          fz = Math.min(1, Math.max(0, v - b)),
          k0 = a + row * b,
          ha = Math.max(hs[k0], SEA.PAINT),
          hd = Math.max(hs[k0 + 1], SEA.PAINT),
          hb = Math.max(hs[k0 + row], SEA.PAINT),
          hc = Math.max(hs[k0 + row + 1], SEA.PAINT);
        return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
      };
      const slopeAt = (x, z) => {
        const u = (x - c.x0) / dx,
          v = (z - c.z0) / dz,
          a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
          b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
          k0 = a + row * b;
        return 40 * Math.hypot((hs[k0 + 1] - hs[k0]) / dx, (hs[k0 + row] - hs[k0]) / dz);
      };
      /* write one tree into its list */
      const put = (kind, x, z, hm, sd, sd2) => {
        const T = it.TR[kind].src;
        if (T.n >= T.cap || FS.near(x, z, 14)) return;
        const q1 = hg(sd, sd2, 5),
          q2 = hg(sd, sd2, 6),
          q3 = hg(sd, sd2, 7),
          q4 = hg(sd, sd2, 8),
          q5 = hg(sd, sd2, 9),
          q6 = hg(sd, sd2, 10);
        let sc, scy, cr, cg, cb;
        if (kind === 'con') {
          sc = 0.7 + q1 * 0.9;
          scy = 0.9 + q2 * 0.5;
        } else if (kind === 'oak') {
          sc = 0.75 + q1 * 0.7;
          scy = 0.9 + q2 * 0.35;
        } else if (kind === 'shr') {
          sc = 0.8 + q1 * 1.4;
          scy = 0.8 + q2 * 0.5;
        } else {
          sc = 0.85 + q1 * 0.4;
          scy = 1;
        }
        /* evergreen: no autumn-tinted trees in the tropics (the user's, 2026-11-23) */
        cr = 0.82 + q3 * 0.38;
        cg = 0.82 + q4 * 0.38;
        cb = 0.82 + q5 * 0.38;
        const n = T.n++;
        Q4.setFromAxisAngle(Y3, hg(sd, sd2, 11) * 6.283);
        M4.compose(V3.set(x, hm, z), Q4, S3.set(sc, scy, sc));
        M4.toArray(T.mats, n * 16);
        T.cols[n * 3] = cr;
        T.cols[n * 3 + 1] = cg;
        T.cols[n * 3 + 2] = cb;
      };
      /* one candidate place: which kind of tree (if any) grows here */
      const place = (x, z, i, j, k, dense) => {
        if (x < c.x0 || x >= c.x1 || z < c.z0 || z >= c.z1) return;
        if (it.rg[Math.floor((z - c.z0) / GC) * GN + Math.floor((x - c.x0) / GC)]) return;
        const hm = meshH(x, z);
        if (hm < 0.6) return;
        const sl = slopeAt(x, z),
          f = forestF(x, z),
          sd = i + k * 7919,
          sd2 = j + k * 104729,
          r = hg(sd, sd2, 3),
          r2 = hg(sd, sd2, 4);
        const fk = farmK(x, z, hm, sl / 40);
        if (hm >= 9 && hm <= 420 && f > 0.12 && sl <= 22) {
          if (fk > 0.4) return;
          if (dense ? r > 0.85 : r > 0.1 + 0.8 * ss(0.12, 1.0, f)) return;
          put(hm > 150 || (f > 0.5 && r2 < (dense ? 0.78 : 0.62)) || r2 < 0.3 ? 'con' : 'oak', x, z, hm, sd, sd2);
        } else if (!dense && fk <= 0.4 && hm >= 3 && hm <= 420 && sl < 18 && f > -0.15 && r < 0.12) put('shr', x, z, hm, sd, sd2);
        else if (!dense && hm <= 6.5 && r < 0.3) {
          const ia = Math.round((x - c.x0) / dx),
            ib = Math.round((z - c.z0) / dz);
          let wet = false;
          for (let q = 0; q < 4 && !wet; q++) {
            const ni = Math.max(0, Math.min(SEGC, ia + (q === 0 ? -1 : q === 1 ? 1 : 0))),
              nj = Math.max(0, Math.min(SEGC, ib + (q === 2 ? -1 : q === 3 ? 1 : 0)));
            if (hs[ni + row * nj] < -1) wet = true;
          }
          if (wet) put('palm', x, z, hm, sd, sd2);
        }
      };
      const i0 = Math.floor(c.x0 / CT),
        i1 = Math.floor(c.x1 / CT),
        j0 = Math.floor(c.z0 / CT),
        j1 = Math.floor(c.z1 / CT);
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const x = (i + hg(i, j, 1)) * CT,
            z = (j + hg(i, j, 2)) * CT,
            cx = (i + 0.5) * CT,
            cz = (j + 0.5) * CT;
          /* a wood: a small blob of forest where trees stand four times as close */
          const dense = cx >= c.x0 && cx < c.x1 && cz >= c.z0 && cz < c.z1 && ss(0.3, 0.6, vn(cx * 0.0035 + 11.1, cz * 0.0035 - 3.3)) > 0.5 && forestF(cx, cz) > 0.45;
          place(x, z, i, j, 0, dense);
          if (dense)
            for (let k = 1; k < 4; k++) place((i + (k & 1) * 0.5 + 0.5 * hg(i, j, 20 + k)) * CT, (j + (k >> 1) * 0.5 + 0.5 * hg(i, j, 24 + k)) * CT, i, j, k, true);
        }
        yield 4;
      }
      /* palms along the field walls and dykes, now and then (no hedgerow oaks: the Pacific, the user's, 2026-11-23) */
      {
        const ca = FCA,
          sa = FSA,
          pu = (x, z) => (x * ca + z * sa) / FCS,
          pv = (x, z) => (-x * sa + z * ca) / FCS;
        let u0 = 1e9,
          u1 = -1e9,
          v0 = 1e9,
          v1 = -1e9;
        for (const [x, z] of [
          [c.x0, c.z0],
          [c.x1, c.z0],
          [c.x0, c.z1],
          [c.x1, c.z1],
        ]) {
          u0 = Math.min(u0, pu(x, z));
          u1 = Math.max(u1, pu(x, z));
          v0 = Math.min(v0, pv(x, z));
          v1 = Math.max(v1, pv(x, z));
        }
        for (let dir = 0; dir < 2; dir++) {
          const a0 = Math.floor(dir ? v0 : u0),
            a1 = Math.ceil(dir ? v1 : u1),
            b0 = Math.floor(dir ? u0 : v0),
            b1 = Math.ceil(dir ? u1 : v1);
          for (let a = a0; a <= a1; a++) {
            for (let b = b0; b < b1; b++) {
              /* the segment from (a, b) to (a, b+1) in field units (swapped for the other direction) */
              if (hg(a, b, 40 + dir) >= 0.56) continue;
              const mu = dir ? b + 0.5 : a,
                mv = dir ? a : b + 0.5,
                mxw = (mu * ca - mv * sa) * FCS,
                mzw = (mu * sa + mv * ca) * FCS;
              if (mxw < c.x0 - 400 || mxw >= c.x1 + 400 || mzw < c.z0 - 400 || mzw >= c.z1 + 400) continue;
              if (mxw < c.x0 || mxw >= c.x1 || mzw < c.z0 || mzw >= c.z1) continue;
              const hmid = meshH(mxw, mzw);
              if (hmid < 4 || farmK(mxw, mzw, hmid, slopeAt(mxw, mzw) / 40) < 0.5) continue;
              for (let d = 20; d < FCS - 20; d += 55 + hg(a, b, 50 + dir) * 40) {
                const t = (dir ? b : b) + d / FCS,
                  uu = dir ? t : a,
                  vv = dir ? a : t,
                  x = (uu * ca - vv * sa) * FCS + (hg(a, b, 60 + (d | 0)) - 0.5) * 4,
                  z = (uu * sa + vv * ca) * FCS + (hg(a, b, 70 + (d | 0)) - 0.5) * 4;
                if (x < c.x0 || x >= c.x1 || z < c.z0 || z >= c.z1) continue;
                if (hg(a, b, 80 + (d | 0)) > 0.25) continue;
                if (it.rg[Math.floor((z - c.z0) / GC) * GN + Math.floor((x - c.x0) / GC)]) continue;
                const hm = meshH(x, z);
                if (hm < 3.5) continue;
                put('palm', x, z, hm, a * 131 + (d | 0), b * 977 + dir);
              }
            }
            if (a % 2 === 0) yield 4;
          }
        }
      }
      /* shade trees round the farmsteads and the hamlets */
      for (const f of it.farmsList)
        for (let k = 0; k < 7; k++) {
          const a = hg(f.ci, f.cj, 150 + k) * 6.283,
            r = 41 + hg(f.ci, f.cj, 160 + k) * 22,
            x = f.x + Math.sin(a) * r,
            z = f.z + Math.cos(a) * r;
          if (x < c.x0 || x >= c.x1 || z < c.z0 || z >= c.z1 || it.rg[Math.floor((z - c.z0) / GC) * GN + Math.floor((x - c.x0) / GC)]) continue;
          put(k % 4 === 3 ? 'oak' : 'palm', x, z, meshH(x, z), f.ci * 37 + k, f.cj * 53 + k);
        }
      for (const h of it.hamletList)
        for (let k = 0; k < 14; k++) {
          const a = hg(h.x | 0, h.z | 0, 170 + k) * 6.283,
            r = 82 + hg(h.x | 0, h.z | 0, 190 + k) * 40,
            x = h.x + Math.sin(a) * r,
            z = h.z + Math.cos(a) * r;
          if (x < c.x0 || x >= c.x1 || z < c.z0 || z >= c.z1 || it.rg[Math.floor((z - c.z0) / GC) * GN + Math.floor((x - c.x0) / GC)]) continue;
          put(k % 4 === 3 ? 'oak' : 'palm', x, z, meshH(x, z), k * 61 + (h.x | 0), k * 71 + (h.z | 0));
        }
      /* people plant trees by their huts: a coconut palm between every hut of a village and the next */
      for (const [h, yw] of it.hamYaw) {
        const cy = Math.cos(yw),
          sy = Math.sin(yw);
        for (let i = 0; i < 8; i++) {
          const a0 = (i / 8) * 6.2832 + (i % 3) * 0.12,
            a1 = ((i + 1) / 8) * 6.2832 + ((i + 1) % 3) * 0.12,
            am = (a0 + a1) / 2,
            r0 = 28 + (i % 2) * 4,
            r1 = 28 + (((i + 1) % 8) % 2) * 4,
            rr = (r0 + r1) / 2 + 1.5,
            lx = Math.sin(am) * rr,
            lz = Math.cos(am) * rr,
            x = h.x + lx * cy + lz * sy,
            z = h.z - lx * sy + lz * cy;
          put('palm', x, z, meshH(x, z), 300 + i + ((h.x | 0) % 997), 400 + i + ((h.z | 0) % 991));
        }
      }
      yield 4;
      for (const k in it.TR) {
        const T = it.TR[k].src;
        for (let n = 0; n < T.n; n++) {
          const gk = (Math.floor(T.mats[n * 16 + 12] / NT.cell) + 512) * 1024 + Math.floor(T.mats[n * 16 + 14] / NT.cell) + 512;
          let bb = T.grid.get(gk);
          if (!bb) T.grid.set(gk, (bb = []));
          bb.push(n);
          if (n % 500 === 499) yield 5;
        }
      }
      yield 5;
    }
    it.g.attributes.position.needsUpdate = it.g.attributes.normal.needsUpdate = it.g.attributes.color.needsUpdate = it.g.attributes.farm.needsUpdate = true;
    it.tex.needsUpdate = true;
    it.g.boundingSphere = new THREE.Sphere(new THREE.Vector3(c.cx, (mx + mn) / 2, c.cz), Math.hypot((c.x1 - c.x0) * 0.72, (mx - mn) / 2) + 20);
    it.g.boundingBox = null;
    for (const k in it.TR) {
      const T = it.TR[k];
      /* a tight sphere round this kind of tree, so a chunk whose trees are out of view costs no draw call */
      let x0 = 1e9,
        x1 = -1e9,
        y0 = 1e9,
        y1 = -1e9,
        z0 = 1e9,
        z1 = -1e9;
      const ma = T.src.mats;
      for (let n = 0; n < T.src.n; n++) {
        const o = n * 16;
        x0 = Math.min(x0, ma[o + 12]);
        x1 = Math.max(x1, ma[o + 12]);
        y0 = Math.min(y0, ma[o + 13]);
        y1 = Math.max(y1, ma[o + 13]);
        z0 = Math.min(z0, ma[o + 14]);
        z1 = Math.max(z1, ma[o + 14]);
      }
      T.im.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2 + 12, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0 + 24, z1 - z0) / 2 + 16);
      T.im.geometry.boundingBox = null;
      T.im.instanceMatrix.needsUpdate = true;
      T.im.instanceColor.needsUpdate = true;
    }
    W.setItemQ(it);
  }
  /* the levelled platforms round the farmsteads and hamlets touching chunk c, [x, z, R0, R1, h] each (the same list the chunk's build
     makes, a little at a time), and the height of the ground with them (WHP in the build) */
  const chunkPL = (c) => {
    if (c.pl) return c.pl;
    const PL = [],
      RGN = NET.RG,
      FCN = NET.FC,
      mg = 330;
    for (let a = Math.floor((c.x0 - mg) / RGN); a <= Math.floor((c.x1 + mg) / RGN); a++)
      for (let b = Math.floor((c.z0 - mg) / RGN); b <= Math.floor((c.z1 + mg) / RGN); b++) {
        const h = NET.hamlet(a, b);
        if (h && h.x > c.x0 - mg && h.x < c.x1 + mg && h.z > c.z0 - mg && h.z < c.z1 + mg) PL.push(h.x, h.z, 150, 330, WH(h.x, h.z));
      }
    for (let a = Math.floor((c.x0 - mg) / FCN); a <= Math.floor((c.x1 + mg) / FCN); a++)
      for (let b = Math.floor((c.z0 - mg) / FCN); b <= Math.floor((c.z1 + mg) / FCN); b++) {
        const f = NET.farm(a, b);
        if (f && f.x > c.x0 - mg && f.x < c.x1 + mg && f.z > c.z0 - mg && f.z < c.z1 + mg && NET.live(f)) PL.push(f.x, f.z, 110, 260, WH(f.x, f.z));
      }
    return (c.pl = PL);
  };
  const whp = (PL, x, z) => {
    let h = WH(x, z);
    for (let q = 0; q < PL.length; q += 5) {
      const d = Math.hypot(x - PL[q], z - PL[q + 1]);
      if (d < PL[q + 3]) {
        const t = d <= PL[q + 2] ? 0 : (d - PL[q + 2]) / (PL[q + 3] - PL[q + 2]),
          w = 1 - t * t * (3 - 2 * t);
        h += (PL[q + 4] - h) * w;
      }
    }
    return h;
  };
  const W = {
    PB: PBX,
    CH,
    NET,
    RT,
    live: 0,
    busy: 0,
    worst: 0,
    stepMax: 0,
    mkMax: 0,
    slow: [],
    stepAt: 0,
    finMax: 0,
    t: 0,
    queue: [],
    /* coarse test: is there any land in this chunk at all? sea chunks cost nothing */
    anyLand(c) {
      for (let j = 0; j <= 16; j++) for (let i = 0; i <= 16; i++) if (WH(c.x0 + ((c.x1 - c.x0) * i) / 16, c.z0 + ((c.z1 - c.z0) * j) / 16) > -45) return true;
      return false;
    },
    /* the density setting (Low / Medium / High) thins the far trees as it does the home ones */
    setItemQ(it) {
      const k = QL.t().trees;
      for (const n in it.TR) it.TR[n].im.count = Math.floor(it.TR[n].src.n * k);
    },
    /* every frame: a chunk lying wholly beyond the fog (measured along the view direction, with a margin for a turn of the head) is not drawn: it could not be seen anyway */
    cull() {
      const m = cam.matrixWorld.elements,
        fx = -m[8],
        fy = -m[9],
        fz = -m[10],
        lim = scene.fog.far + 900;
      for (const c of CH) {
        if (c.st !== 2) continue;
        const hx = (c.x1 - c.x0) / 2,
          hz = (c.z1 - c.z0) / 2,
          dp = (c.cx - m[12]) * fx + (400 - m[13]) * fy + (c.cz - m[14]) * fz - (Math.abs(fx) * hx + Math.abs(fy) * 900 + Math.abs(fz) * hz),
          vis = dp < lim;
        /* roads and buildings are sub-pixel and 85% fogged beyond this, so they are not drawn there */
        const pv = dp < scene.fog.far * 0.88;
        if (pv !== c.pv) {
          c.pv = pv;
          c.it.roadMesh.visible = pv;
          c.it.FM.im.visible = c.it.HM.im.visible = pv;
        }
        if (vis !== c.vis) {
          c.vis = vis;
          c.mesh.visible = vis;
          for (const k in c.it.TR) c.it.TR[k].im.visible = vis;
        }
      }
    },
    setQ() {
      for (const c of CH) if (c.it) W.setItemQ(c.it);
    },
    /* is this spot on a road, a farmyard or a hamlet (no grass there)? */
    onRoad(x, z) {
      let ia = -1,
        ib = -1;
      for (let k = 0; k < AX.length; k++) {
        if (x >= AX[k][0] && x < AX[k][1]) ia = k;
        if (z >= AX[k][0] && z < AX[k][1]) ib = k;
      }
      const c = ia >= 0 && ib >= 0 ? CHI.get(ia * 32 + ib) : null;
      return !!(c && c.st === 2 && c.it && c.it.rg[Math.floor((z - c.z0) / GC) * GN + Math.floor((x - c.x0) / GC)]);
    },
    /* the chunk mesh's own surface at x, z as it is drawn: [height, r, g, b, farm, nx, ny, nz] in out (the battle area's fine ground is
       made from it, so the two are the same ground); null until that chunk is built */
    surf(x, z, out) {
      let ia = -1,
        ib = -1;
      for (let k = 0; k < AX.length; k++) {
        if (x >= AX[k][0] && x < AX[k][1]) ia = k;
        if (z >= AX[k][0] && z < AX[k][1]) ib = k;
      }
      const c = ia >= 0 && ib >= 0 ? CHI.get(ia * 32 + ib) : null;
      if (!c || c.st !== 2 || !c.it) return null;
      const row = SEGC + 1,
        u = (x - c.x0) / ((c.x1 - c.x0) / SEGC),
        v = (z - c.z0) / ((c.z1 - c.z0) / SEGC),
        a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
        b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
        fx = Math.min(1, Math.max(0, u - a)),
        fz = Math.min(1, Math.max(0, v - b)),
        ka = a + row * b,
        kd = ka + 1,
        kb = ka + row,
        kc = kb + 1;
      /* the mesh's own triangles: (a, d, b) and (b, c, d) */
      let wa, wd, wb, wc;
      if (fx + fz <= 1) (wa = 1 - fx - fz), (wd = fx), (wb = fz), (wc = 0);
      else (wa = 0), (wb = 1 - fx), (wd = 1 - fz), (wc = fx + fz - 1);
      const P = c.it.pos,
        C = c.it.col,
        N = c.it.nor,
        F = c.it.farm,
        m = (A, k, o) => A[ka * k + o] * wa + A[kd * k + o] * wd + A[kb * k + o] * wb + A[kc * k + o] * wc;
      out[0] = m(P, 3, 1);
      out[1] = m(C, 3, 0);
      out[2] = m(C, 3, 1);
      out[3] = m(C, 3, 2);
      out[4] = m(F, 1, 0);
      out[5] = m(N, 3, 0);
      out[6] = m(N, 3, 1);
      out[7] = m(N, 3, 2);
      return out;
    },
    /* the field plot at x, z as the ground shader paints it (FARM_PAINT): its cell, where in it (0..1), and its kind: paddy (flooded or
       not), dry crop (cane, sweet potato) or fallow; th is the farm strength at which it appears */
    plot(x, z) {
      const u = (x * FCA + z * FSA) / FCS,
        v = (-x * FSA + z * FCA) / FCS,
        ci = Math.floor(u),
        cj = Math.floor(v),
        r1 = fhJ(ci, cj, 1),
        r2 = fhJ(ci, cj, 2);
      return { ci, cj, fu: u - ci, fv: v - cj, paddy: r1 < 0.6, flooded: r1 < 0.6 && r2 < 0.3, kind: r1 < 0.6 ? 'paddy' : r1 < 0.8 ? 'potato' : r1 < 0.92 ? 'cane' : 'fallow', th: 0.25 + 0.5 * fhJ(ci, cj, 4) };
    },
    FA,
    FCS,
    groundShade: (mat, tex, O) => groundShade(mat, tex, O, false),
    /* the height of the chunk mesh at x, z (trees and grass stand on it) */
    hm(x, z) {
      let ia = -1,
        ib = -1;
      for (let k = 0; k < AX.length; k++) {
        if (x >= AX[k][0] && x < AX[k][1]) ia = k;
        if (z >= AX[k][0] && z < AX[k][1]) ib = k;
      }
      const c = ia >= 0 && ib >= 0 ? CHI.get(ia * 32 + ib) : null;
      if (!c) return Math.max(WH(x, z), SEA.PAINT);
      if (c.st !== 2 || !c.it) {
        /* not built yet: the heights its mesh WILL have (the same grid nodes, levelled round its farmsteads and hamlets) */
        const PL = chunkPL(c),
          dx = (c.x1 - c.x0) / SEGC,
          dz = (c.z1 - c.z0) / SEGC,
          u = (x - c.x0) / dx,
          v = (z - c.z0) / dz,
          a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
          b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
          fx = Math.min(1, Math.max(0, u - a)),
          fz = Math.min(1, Math.max(0, v - b)),
          hq = (i, j) => Math.max(whp(PL, c.x0 + i * dx, c.z0 + j * dz), SEA.PAINT),
          ha = hq(a, b),
          hd = hq(a + 1, b),
          hb = hq(a, b + 1),
          hc = hq(a + 1, b + 1);
        return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
      }
      const hs = c.it.hs,
        row = SEGC + 1,
        u = (x - c.x0) / ((c.x1 - c.x0) / SEGC),
        v = (z - c.z0) / ((c.z1 - c.z0) / SEGC),
        a = Math.max(0, Math.min(SEGC - 1, Math.floor(u))),
        b = Math.max(0, Math.min(SEGC - 1, Math.floor(v))),
        fx = Math.min(1, Math.max(0, u - a)),
        fz = Math.min(1, Math.max(0, v - b)),
        k0 = a + row * b,
        ha = Math.max(hs[k0], SEA.PAINT),
        hd = Math.max(hs[k0 + 1], SEA.PAINT),
        hb = Math.max(hs[k0 + row], SEA.PAINT),
        hc = Math.max(hs[k0 + row + 1], SEA.PAINT);
      return fx + fz <= 1 ? ha + fx * (hd - ha) + fz * (hb - ha) : hc + (1 - fx) * (hb - hc) + (1 - fz) * (hd - hc);
    },
    near(c, x, z) {
      return Math.hypot(Math.max(0, c.x0 - x, x - c.x1), Math.max(0, c.z0 - z, z - c.z1));
    },
    finish(c) {
      if (W.onFinish) W.onFinish(c);
      const it = c.it;
      it.mesh.updateMatrix();
      scene.add(it.mesh);
      for (const k in it.TR) {
        const T = it.TR[k];
        if (!T.src.n) continue;
        scene.add(T.im);
        T.on = true;
        const sp = NT.sp.find((s) => s.key === k);
        if (sp) sp.src.push(T.src);
      }
      if (it.nR > 0) {
        scene.add(it.roadMesh);
        it.rOn = true;
      }
      for (const T of [it.FM, it.HM])
        if (T.n) {
          scene.add(T.im);
          T.on = true;
        }
      NT.gx = 1e9;
      c.vis = true;
      c.pv = true;
      it.roadMesh.visible = it.FM.im.visible = it.HM.im.visible = true;
      c.mesh = it.mesh;
      c.st = 2;
      c.job = null;
      W.live++;
    },
    drop(c) {
      if (c.mesh) {
        scene.remove(c.mesh);
        W.live--;
        for (const k in c.it.TR) {
          const T = c.it.TR[k];
          if (!T.on) continue;
          scene.remove(T.im);
          T.on = false;
          const sp = NT.sp.find((s) => s.key === k);
          if (sp) sp.src = sp.src.filter((q) => q !== T.src);
        }
        const it0 = c.it;
        if (it0.rOn) {
          scene.remove(it0.roadMesh);
          it0.rOn = false;
        }
        for (const T of [it0.FM, it0.HM])
          if (T.on) {
            scene.remove(T.im);
            T.on = false;
          }
        NT.gx = 1e9;
      }
      if (c.it) pool.push(c.it);
      c.it = c.mesh = c.job = null;
      c.st = 0;
    },
    update(dt, force) {
      /* in photo mode the world is built round the photo camera, not the frozen aircraft */
      const ph = (typeof PHOTO !== 'undefined' && PHOTO.on) || (typeof ROAM !== 'undefined' && ROAM.on),
        t0 = performance.now(),
        px = ph ? PHOTO.pos.x : pos.x,
        pz = ph ? PHOTO.pos.z : pos.z;
      W.t -= dt;
      W.cull();
      if (W.t <= 0 || force) {
        W.t = 0.25;
        W.queue.length = 0;
        /* a free camera high above the map sees far more of it: build (and keep) more of the world the higher it goes */
        const hi = ph ? Math.max(0, Math.min(45000, (cam.position.y - 3000) * 0.9)) : 0,
          bR = BUILD_R + hi,
          dR = DROP_R + hi;
        let probes = force || !started ? 99 : 3; /* the sea-or-land test of a chunk is spread over scans, a few at a time */
        for (const c of CH) {
          const d = W.near(c, px, pz);
          if ((c.st === 0 || c.st === 1) && d < bR) {
            if (c.empty === undefined) {
              if (probes-- <= 0) continue;
              c.empty = !W.anyLand(c);
            }
            if (!c.empty) W.queue.push([d, c]);
          } else if ((c.st === 1 || c.st === 2) && d > dR) W.drop(c);
        }
        W.queue.sort((a, b) => a[0] - b[0]);
      }
      /* anything that should already be there (a start or a jump to a new place) is built at once, in full: it cannot wait */
      const budget = force || !started ? 12 : ph ? 40 : 1.0;
      let first = true;
      for (let qi = 0; qi < W.queue.length; qi++) {
        const c = W.queue[qi][1];
        if (c.st === 0) {
          const tm = performance.now();
          c.it = pool.pop() || mkItem();
          W.mkMax = Math.max(W.mkMax, performance.now() - tm);
          c.job = build(c, c.it);
          c.st = 1;
        }
        if (c.st !== 1) continue;
        const urgent = W.near(c, px, pz) < NEED_R;
        for (;;) {
          const ts = performance.now(),
            rs = c.job.next(),
            td = performance.now() - ts;
          if (td > 2 && W.slow.length < 400) W.slow.push([rs.value, Math.round(td * 10) / 10, W.live]);
          if (td > W.stepMax) {
            W.stepMax = td;
            W.stepAt = rs.value;
          }
          if (rs.done) {
            const tf = performance.now();
            W.finish(c);
            const tdf = performance.now() - tf;
            if (tdf > W.finMax) W.finMax = tdf;
            break;
          }
          if (!urgent && performance.now() - t0 > budget) break;
        }
        if (!urgent && performance.now() - t0 > budget) break;
        if (first && !urgent) first = false;
      }
      if (W.t > 0.24) {
        let nb = 0;
        for (const c of CH) if (c.st === 1) nb++;
        W.busy = nb;
      }
      const ms = performance.now() - t0;
      if (ms > W.worst) W.worst = ms;
    },
  };
  return W;
})();
