/* distance to the nearest line of a grid of spacing s (in metres) */
float iL(float u, float s){ float f = fract(u / s); return min(f, 1.0 - f) * s; }
bool iIs(vec3 c, vec3 k){ return distance(c, k) < 0.012; }
`, body: `
{
  /* the rooms' own surfaces, told apart by their paint: painted steel bulkheads (seams, welds, frames, scuffs), linoleum tiles or
     diamond tread plate underfoot, and the deckhead's beams over cork insulation. Fittings keep their colours, with a little wear */
  vec3 col = vColor;
  vec3 N = normalize(vMn);
  float fl = (vMp.x > IERX0 && vMp.x < IERX1 && vMp.y < 2.6) ? -1.55 : vMp.y < IY3 - 0.2 ? IY2 : IY3; /* the deck of the room the point is in (the engine room by its length along the ship, not its height: by height, the engine room's walls above -0.5 m were taken for the pilothouse's and darkened, which drew a false waterline round them) */
  float h = vMp.y - fl;
  float m = 1.0;
  if (iIs(col, vec3(IW)) || iIs(col, vec3(IEW))) {
    bool side = abs(N.z) > 0.5;
    float u = side ? vMp.x : vMp.z, v = vMp.y;
    /* plates about 1.8 x 1.2 m, butt-welded: a dark seam with a bright bead either side */
    float dv = iL(u - 0.3, 1.83), dh = iL(v - fl - 0.05, 1.22);
    float d = min(dv, dh);
    m *= 1.0 - 0.32 * (1.0 - smoothstep(0.003, 0.009, d)) + 0.07 * (smoothstep(0.009, 0.013, d) - smoothstep(0.013, 0.022, d));
    /* the frames (every 24 in) behind the side bulkheads: a soft shadow and a lit edge on each */
    if (side) { float f = fract((vMp.x - 27.75) / 0.6096); m *= 1.0 - 0.07 * smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.05, 0.11, f)) + 0.04 * smoothstep(0.88, 0.97, f) * (1.0 - smoothstep(0.97, 1.0, f)); }
    /* a row of rivet heads along each vertical seam */
    { float r = length(vec2(dv - 0.045, iL(v, 0.085))); m *= 1.0 - 0.22 * (1.0 - smoothstep(0.006, 0.011, r)) + 0.12 * (1.0 - smoothstep(0.0, 0.006, r)); }
    /* paint: a slow mottle, runs, and grime and scuffing near the deck */
    m *= 0.95 + 0.08 * iF(vec2(u, v) * 2.2);
    m *= 1.0 - 0.05 * smoothstep(0.55, 0.9, iN(vec2(u * 9.0, v * 0.6)));
    m *= mix(0.62, 1.0, smoothstep(0.02, 0.38, h)) * (1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.1, h)) * iN(vec2(u * 14.0, 3.0)));
    /* a dark kick strip at the foot of the bulkhead */
    if (h < 0.1) m *= 0.55;
  } else if (iIs(col, vec3(IF))) {
    /* 9 in linoleum tiles, each a slightly different shade, with worn paths */
    vec2 t = vMp.xz / 0.2286;
    vec2 id = floor(t);
    float d = min(iL(vMp.x, 0.2286), iL(vMp.z, 0.2286));
    m *= 0.9 + 0.2 * iH(id);
    m *= 1.0 - 0.3 * (1.0 - smoothstep(0.002, 0.006, d));
    m *= 1.0 + 0.16 * (iF(vMp.xz * 0.9) - 0.5);
    m *= 1.0 - 0.1 * smoothstep(0.6, 0.85, iN(vMp.xz * 11.0));
  } else if (iIs(col, vec3(IEF))) {
    /* steel floor plates with a diamond tread, bolted down at the edges */
    vec2 r = mat2(0.7071, 0.7071, -0.7071, 0.7071) * vMp.xz;
    vec2 g = fract(r / 0.035) - 0.5;
    float k = 1.0 - smoothstep(0.08, 0.2, abs(g.x * 0.35 + g.y * 1.0) * abs(g.x - g.y * 0.35));
    float br = step(0.5, fract(floor(r.x / 0.035) * 0.5 + floor(r.y / 0.035) * 0.5));
    m *= 0.88 + 0.22 * k * (br > 0.5 ? 1.0 : 0.6);
    float d = min(iL(vMp.x, 1.2), iL(vMp.z, 0.9));
    m *= 1.0 - 0.45 * (1.0 - smoothstep(0.004, 0.012, d));
    float b = length(vec2(iL(vMp.x, 1.2) - 0.04, iL(vMp.z, 0.3) )); m *= 1.0 - 0.3 * (1.0 - smoothstep(0.006, 0.012, b));
    m *= 0.88 + 0.22 * iF(vMp.xz * 1.6);
    m *= 1.0 - 0.18 * smoothstep(0.55, 0.85, iN(vMp.xz * 3.0 + 5.0)); /* oil */
  } else if (iIs(col, vec3(IC))) {
    /* the deckhead: a beam under every frame, cork insulation between */
    float f = fract((vMp.x - 27.75) / 0.6096);
    float beam = 1.0 - smoothstep(0.0, 0.03, min(f, 1.0 - f) * 0.6096 - 0.035);
    m *= mix(0.86 + 0.12 * iN(vMp.xz * 38.0) + 0.06 * iN(vMp.xz * 7.0), 0.94, beam);
    m *= 1.0 - 0.25 * (smoothstep(0.035, 0.045, min(f, 1.0 - f) * 0.6096) - smoothstep(0.045, 0.09, min(f, 1.0 - f) * 0.6096));
  } else if (vMp.y < 2.6 && vMp.x > IERX0 && vMp.x < IERX1) {
    /* the engine room's machinery: soot and oil. Dirtier toward the bilge, oil runs down the sides, black blotches round the joints and
       a brown film over everything */
    float u = vMp.x + vMp.z * 0.7;
    float hh = vMp.y + 1.55;
    float run = smoothstep(0.55, 0.85, iN(vec2(u * 11.0, vMp.y * 0.7))) * smoothstep(0.3, 0.7, iN(vec2(u * 2.5, 4.0)));
    float blot = smoothstep(0.55, 0.8, iF(vec2(u, vMp.y) * 2.6 + N.xz));
    float g = clamp(0.32 + 0.5 * (1.0 - smoothstep(0.0, 1.7, hh)) + 0.6 * run + 0.5 * blot, 0.0, 0.92);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.13, 0.09) * (0.7 + 0.6 * iN(vec2(u, vMp.y) * 30.0)), g * 0.85);
    m *= 0.9 + 0.12 * iF(vec2(u, vMp.y) * 6.0);
  } else {
    /* fittings: a little handling wear */
    m *= 0.95 + 0.08 * iF(vMp.xy * 3.0 + vMp.zz * 2.0);
  }
  diffuseColor.rgb *= m;
}
`
      .replace(/vec3\(IW\)/g, 'vec3(' + v(INT_W) + ')').replace(/vec3\(IEW\)/g, 'vec3(' + v(ENG_W) + ')')
      .replace(/vec3\(IF\)/g, 'vec3(' + v(INT_F) + ')').replace(/vec3\(IEF\)/g, 'vec3(' + v(ENG_F) + ')')
      .replace(/vec3\(IC\)/g, 'vec3(' + v(INT_C) + ')').replace(/IERX0/g, ER.x0.toFixed(3)).replace(/IERX1/g, ER.x1.toFixed(3)).replace(/IY2/g, Y2.toFixed(3)).replace(/IY3/g, Y3.toFixed(3)) };
  })();
  intMaterial.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMp;\nvarying vec3 vMn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMp = position;\nvMn = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + IGLSL.head)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + IGLSL.body)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance*=diffuseColor.rgb;');
  };
  function buildInterior() {
    const acc = new GX.Acc();
    for (const [parts, T, intr] of groups) if (intr) acc.add(parts, T);
    const m = new THREE.Mesh(acc.geometry(), intMaterial);
    m.frustumCulled = false;
    return m;
  }
  /* is a point (model frame) inside the ship's own hull or upperworks? A coarse shape for the guns' firing cutouts: the hull up to its
     rails, the deckhouse and bridge (frames 23.6 to 43.4), the mast, the ventilation hood (the stack) and the aft 40 mm platform */
  function solid(x, y, z) {
    const f = (27.75 - x) / FR;
    if (f < F_STEM || f > F_END || y < -3) return false;
    const az = Math.abs(z);
    if (y < top(f) + 1.0 && az < hb(f, Math.min(y, top(f))) + 0.05) return true;
    if (f > 23.6 && f < 43.4 && az < 4.6 && y < 10.9) return true;
    if (Math.abs(x - XF(40)) < 0.45 && az < 0.45 && y < 17) return true;
    if (f > 44.7 && f < 54.5 && az < 1.3 && y < hd(48) + 4.4) return true;
    return false;
  }
  /* the player's guns as moving parts, children of the ship's mesh (model frame): for each mount an object at its place (o),
     the training carriage (tr, turned by rotation.y from the rest bearing), the elevating guns (el, at the trunnions, rotation.z),
     the crewman the player replaces (pm) and, where fitted, the pointer's ring sight on its linkage (sg, at the eye) */
  function mounts(mesh) {
    const mk = (parts) => {
      const a = new GX.Acc();
      a.add(parts, null);
      return new THREE.Mesh(a.geometry(), material);
    };
    return MNT.map((d) => {
      const o = new THREE.Object3D();
      o.matrixAutoUpdate = false;
      o.matrix.copy(d.T);
      mesh.add(o);
      const tr = mk(d.train),
        el = mk(d.elev),
        pm = mk(d.pm);
      o.add(tr);
      tr.add(pm);
      el.position.set(...d.pivot);
      tr.add(el);
      let sg = null;
      if (d.sight) {
        sg = mk(d.sight);
        sg.position.set(...d.eye);
        tr.add(sg);
      }
      return { id: d.id, d, o, tr, el, pm, sg };
    });
  }
  /* the ensigns: the Stars and Stripes at the gaff (under way) and on the stern staff, as children of the ship */
  function flags(mesh) {
    if (typeof FLG === 'undefined') return;
    mesh.add(FLG.flagOnly('us', 1.6, XF(39.8) - 0.55, 16.25, 0, PI));
    mesh.add(FLG.flagOnly('us', 1.25, XF(89.7) - 0.04, hm(89.7) + 0.12 + 3.35, 0, PI));
  }
  return { XF, hb, top, WL, F_STEM, F_END, STN, ER, build, buildInterior, flags, mounts, solid, material, intMaterial, FACES, WHEEL, OOD, Y2, Y3, hd, hm,
    /* for other craft (PT-105): a 20 mm Oerlikon on its Mk 4 mount with gunner and loader, a twin 40 mm, and a crewman, as parts at their own origins */
    oer20: () => oer20(),
    twin40: (k) => twin40(k),
    /* the K-guns' loaded arbors: for each gun (port forward, port aft, starboard forward, starboard aft) the muzzle (where the arbor
       sits) and the charge's centre on the arbor's tray, model frame */
    KG: [-1, 1].flatMap((s) =>
      [64.6, 73.7].map((f) => {
        const x = XF(f),
          z = s * (hb(f, hm(f)) - 0.75),
          py = hm(f) + 0.12 + 0.32 /* ym(f) + 0.32, as the model */,
          c45 = Math.SQRT1_2;
        return { f, s, mz: [x, py + c45 * 0.96, z + s * c45 * 0.96], ch: [x, py + c45 * 1.32 + 0.12, z + s * c45 * 1.32] };
      }),
    ),
    single40: (k) => single40(k) /* the single 40 mm (Army M1 / Navy Mk 3 type) for small craft */,
    oer20pt: () => oer20(true) /* the 20 mm on the four-legged Mk 10 pedestal, for small craft */,
    crew: (x, y, z, yaw, pose, arms) => grab(() => man(x, y, z, yaw, pose, arms)) };
})();

