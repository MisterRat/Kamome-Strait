/* every frame: tell the shader where the camera is; now and then (about every 5 m) refill the instances from a fixed hashed grid, so tufts never jump */
function updGrass(cx, cy, cz, force) {
  GRU.c.value.set(cx, cy, cz);
  const t = QL.t(),
    R = GR.lay[1].R * (t.grass || 0) * (0.55 + 0.45 * NT.k);
  const agl = cy - H(cx, cz);
  if (R < 8 || agl > 120) {
    if (GR.act) {
      GR.grass.count = GR.flow.count = 0;
      GR.act = false;
      GR.gx = 1e9;
    }
    return;
  }
  const mv = Math.hypot(cx - GR.gx, cz - GR.gz);
  if (!force && GR.act && mv < 5) return;
  GR.gx = cx;
  GR.gz = cz;
  GR.act = true;
  GRU.r.value = 1;
  let n = 0,
    nf = 0;
  const gm = GR.grass.instanceMatrix.array,
    fm = GR.flow.instanceMatrix.array,
    gc = GR.grass.instanceColor.array,
    fc = GR.flow.instanceColor.array;
  /* the fade radius is passed per layer through the geometry scale: layer 0 fades at its own R, layer 1 at R; the shader uses one radius, so layer 0 tufts carry a scale that is 0 beyond their ring */
  let rMax = 0;
  GR.lay.forEach((L, li) => {
    const Rl = Math.min(L.R * (t.grass || 0) * (0.55 + 0.45 * NT.k), L.R),
      r2 = Rl * Rl,
      inner = li ? GR.lay[0].R * (t.grass || 0) * (0.55 + 0.45 * NT.k) * 0.8 : 0,
      i0 = Math.floor((cx - Rl) / L.s),
      i1 = Math.floor((cx + Rl) / L.s),
      j0 = Math.floor((cz - Rl) / L.s),
      j1 = Math.floor((cz + Rl) / L.s);
    rMax = Math.max(rMax, Rl);
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const x = (i + GRG(i, j, 1 + li * 7)) * L.s,
          z = (j + GRG(i, j, 2 + li * 7)) * L.s,
          dx = x - cx,
          dz = z - cz,
          d2 = dx * dx + dz * dz;
        if (d2 > r2 || d2 < inner * inner) continue;
        const h = HMESH(x, z);
        if (!grassOK(x, z, h)) continue;
        const r = GRG(i, j, 3 + li * 7),
          flower = li === 0 && r > 0.93 && nf < GR.fcap,
          hh = L.h[0] + (L.h[1] - L.h[0]) * GRG(i, j, 4 + li * 7),
          ww = L.w[0] + (L.w[1] - L.w[0]) * GRG(i, j, 5 + li * 7);
        if (!flower && n >= GR.cap) continue;
        GRQ.setFromAxisAngle(GRY, GRG(i, j, 6 + li * 7) * 6.283);
        GRP.set(x, h - 0.04, z);
        GRS.set(ww, hh, ww);
        GRM.compose(GRP, GRQ, GRS);
        if (flower) {
          GRM.toArray(fm, nf * 16);
          const v = 0.85 + 0.15 * GRG(i, j, 8);
          fc[nf * 3] = fc[nf * 3 + 1] = fc[nf * 3 + 2] = v;
          nf++;
        } else {
          GRM.toArray(gm, n * 16);
          /* greens from yellowish dry to deep, with the odd brown straw */
          const q = GRG(i, j, 9 + li * 7),
            dry = GRG((i >> 3) + 77, (j >> 3) + 5, 3);
          GRC.setRGB(0.5 + q * 0.14 + dry * 0.16, 0.82 + q * 0.12 - dry * 0.08, 0.26 + q * 0.08);
          gc[n * 3] = GRC.r;
          gc[n * 3 + 1] = GRC.g;
          gc[n * 3 + 2] = GRC.b;
          n++;
        }
      }
  });
  GRU.r.value = Math.max(rMax, 8);
  GR.grass.count = n;
  GR.flow.count = nf;
  GR.grass.instanceMatrix.needsUpdate = GR.flow.instanceMatrix.needsUpdate = true;
  GR.grass.instanceColor.needsUpdate = GR.flow.instanceColor.needsUpdate = true;
}

