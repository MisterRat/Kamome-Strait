/* ---------- the open sea and Kamome Field (the distant island airfield) ---------- */
{
  /* open sea out to 60 km under everything: the terrain mesh ends at 13 km and the world beyond is water */
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120000, 120000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: new THREE.Color(0.11, 0.22, 0.375) /* the colour the shore shader paints at -40 m, so the sea is seamless */ }));
  sea.position.y = SEA.PLANE; /* under the ocean's troughs and below a ship's keel (it must never show inside her engine room) */
  sea.frustumCulled = false;
  sea.renderOrder = -3;
  sea.material.polygonOffset = true; /* pushed back in depth, so it never z-fights with the chunks' water at a long distance (horizontal stripes) */
  sea.material.polygonOffsetFactor = 4;
  sea.material.polygonOffsetUnits = 60;
  csApply(sea.material); /* the clouds' shadows fall on the open sea like on the chunks' water, so the two match */
  scene.add(sea);
  SEAP = sea;
  const SEGI = 256 /* 25 m cells */,
    SIZE = 6400,
    ig = new THREE.PlaneGeometry(SIZE, SIZE, SEGI, SEGI);
  ig.rotateX(-Math.PI / 2);
  const ip = ig.attributes.position,
    icol = new Float32Array(ip.count * 3),
    c1 = new THREE.Color(),
    c2 = new THREE.Color();
  for (let i = 0; i < ip.count; i++) {
    const x = ip.getX(i) + ISL.F.x,
      z = ip.getZ(i) + ISL.F.z,
      o = ISL.h(x, z),
      h = o ? o.h : -40,
      r = hash(x * 0.01, z * 0.01) * 0.08;
    ip.setY(i, Math.max(h, SEA.PAINT));
    /* the vertices carry only the grass: sand, shallows and deep water are painted per pixel from a height map (as on the main map) */
    c1.setRGB(0.27 + r, 0.45 + r, 0.17).lerp(c2.setRGB(0.33, 0.5, 0.2), o && o.e < 0.5 ? 1 : 0);
    icol[i * 3] = c1.r;
    icol[i * 3 + 1] = c1.g;
    icol[i * 3 + 2] = c1.b;
  }
  ig.setAttribute('color', new THREE.BufferAttribute(icol, 3));
  ig.computeVertexNormals();
  {
    /* the shore stays flat-lit (a vertex on the shore ramp facing away from the sun made a dark outline) */
    const nn = ig.attributes.normal;
    for (let i = 0; i < ip.count; i++) if (ip.getY(i) < 1) nn.setXYZ(i, 0, 1, 0);
  }
  /* island height map, 6.25 m texels: the fragment shader works the shore colours out from it, exactly as on the main map (SHORE_PAINT) */
  const IT = 1024,
    idat = new Uint8Array(IT * IT);
  for (let j = 0; j < IT; j++)
    for (let i = 0; i < IT; i++) {
      const o = ISL.h(ISL.F.x + ((i + 0.5) / IT - 0.5) * SIZE, ISL.F.z + ((j + 0.5) / IT - 0.5) * SIZE),
        h = o ? o.h : -40;
      idat[j * IT + i] = Math.round(255 * Math.max(0, Math.min(1, (h + 64) / 100)));
    }
  const itex = new THREE.DataTexture(idat, IT, IT, THREE.LuminanceFormat, THREE.UnsignedByteType);
  itex.magFilter = itex.minFilter = THREE.LinearFilter;
  itex.wrapS = itex.wrapT = THREE.ClampToEdgeWrapping;
  itex.generateMipmaps = false;
  itex.needsUpdate = true;
  const imat = new THREE.MeshLambertMaterial({ vertexColors: true });
  imat.onBeforeCompile = (sh) => {
    sh.uniforms.isTex = { value: itex };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;uniform sampler2D isTex;\n' + TERR_NOISE)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat shH=texture2D(isTex,(vWP.xz-vec2(' + ISL.F.x.toFixed(1) + ',' + ISL.F.z.toFixed(1) + '))/' + SIZE.toFixed(1) + '+0.5).r*100.0-64.0;shH=max(shH,-41.0);float shM=1.0-smoothstep(-8.8,-6.2,shH);\n' + SHORE_PAINT,
      );
  };
  const isl = new THREE.Mesh(ig, imat);
  isl.position.set(ISL.F.x, 0, ISL.F.z);
  scene.add(isl);
  /* the runway: one painted slab (edge lines, centre dashes, threshold bars and the numbers 07 / 25) */
  const cv = document.createElement('canvas');
  cv.width = 2048;
  cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#3a3c3f';
  g.fillRect(0, 0, 2048, 128);
  for (let i = 0; i < 1800; i++) {
    const v = (48 + Math.random() * 26) | 0;
    g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
    g.fillRect(Math.random() * 2048, Math.random() * 128, 3, 2);
  }
  g.fillStyle = '#e6e6dc';
  g.fillRect(0, 5, 2048, 3);
  g.fillRect(0, 120, 2048, 3);
  for (let x = 120; x < 1930; x += 70) g.fillRect(x, 62, 38, 4);
  for (const e of [0, 1])
    for (let k = 0; k < 8; k++) g.fillRect(e ? 2048 - 78 : 20, 14 + k * 13, 56, 6);
  g.font = 'bold 54px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.save();
  g.translate(190, 64);
  g.rotate(Math.PI / 2);
  g.fillText('07', 0, 0);
  g.restore();
  g.save();
  g.translate(2048 - 190, 64);
  g.rotate(-Math.PI / 2);
  g.fillText('25', 0, 0);
  g.restore();
  const rt = new THREE.CanvasTexture(cv);
  rt.anisotropy = 8;
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(ISL.len, ISL.wid).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rt }));
  rw.position.set(0, ISL.H0 + 0.15, 0);
  /* buildings, taxiway and the radio beacon mast, all merged into one mesh */
  const { part, bx, cyl } = GX,
    P = [],
    add = (x, y, z, w, h, d, hex) => P.push(part(bx(1, 1, 1), hex, x, y + h / 2, z, 0, 0, 0, w, h, d)),
    Y0 = ISL.H0;
  /* local frame: x along the runway (u), z across it (v, negative on the apron side); runway v -20..20 */
  const Yp = Y0 + 0.14,
    slab = (u, v, w, d, hex) => add(u, Y0 + 0.04, v, w, 0.1, d, hex),
    TXI = 0x55575a,
    APR = 0x626468,
    Zr = Math.PI / 2;
  slab(0, -48, 1100, 14, TXI); /* the parallel taxiway */
  for (const u of [-540, -20, 540]) slab(u, -30, 14, 24, TXI); /* three links from it to the runway: both ends and the middle */
  slab(-40, -102, 290, 96, APR); /* the apron, flush with the taxiway */
  slab(135, -108, 70, 60, 0x8a887c); /* gravel fuel yard beside it */
  add(0, Yp - 0.02, -48, 1100, 0.04, 0.35, 0xc9b23a); /* taxiway centre line */
  for (const u of [-540, -20, 540]) add(u, Yp - 0.02, -30, 0.35, 0.04, 22, 0xc9b23a);
  add(-40, Yp - 0.02, -66, 280, 0.04, 0.35, 0xc9b23a); /* apron taxi line */
  /* two arched hangars on the back of the apron, doors facing the runway */
  for (const u of [-150, -80]) {
    add(u, Y0 + 0.14, -135, 44, 7, 30, 0x8a929a);
    P.push(part(cyl(15, 15, 44, 20), 0x7b848c, u, Y0 + 7.14, -135, 0, 0, Zr, 0.42, 1, 1));
    add(u, Y0 + 0.14, -119.8, 28, 5.6, 0.4, 0x23272b);
  }
  add(-20, Y0 + 0.14, -142, 24, 5, 12, 0xb8b4a4); /* operations building */
  add(-20, Y0 + 5.14, -142, 26, 0.5, 14, 0x6b6f66);
  /* control tower at the east end of the apron */
  add(75, Y0 + 0.14, -138, 5, 14, 5, 0xb8bcc0);
  add(75, Y0 + 14.14, -138, 9, 4, 9, 0x9aa0a6);
  add(75, Y0 + 14.9, -138, 9.2, 2.4, 9.2, 0x4a6a80);
  add(75, Y0 + 18.14, -138, 10.5, 0.6, 10.5, 0x2b2e32);
  for (let k = 0; k < 3; k++) P.push(part(cyl(5, 5, 7, 14), 0xc9c9c0, 118 + k * 14, Yp + 3.5, -128)); /* the fuel tanks, on their gravel yard */
  add(104, Yp, -118, 3, 1.2, 3, 0x3a3d40); /* pump */
  P.push(part(cyl(0.4, 0.6, 34, 8), 0x8a2a20, 140, Y0 + 17, 100)); /* the KMM beacon mast */
  add(140, Y0, 108, 6, 3.2, 5, 0x8a8a84);
  P.push(...FLG.pole('us', 10, 2.6, 62, Y0 + 0.14, -122, 0.4)); /* the Stars and Stripes at Kamome Field */
  /* a windsock beside the runway */
  P.push(part(cyl(0.15, 0.15, 8, 8), 0xdddddd, 20, Y0 + 4, 30));
  P.push(part(cyl(0.6, 0.2, 3, 10), 0xff6a00, 22.2, Y0 + 7.6, 30, 0, 0, Zr));
  /* the parked fighters, noses toward the runway, and the vehicles on the apron (the same models as at the home field) */
  const MD = AFLD.models,
    park = (m, u, v, yaw) => P.push(...m.map((q) => ({ g: q.g, hex: q.hex, m: new THREE.Matrix4().multiplyMatrices(GX.xf(u, Yp, v, yaw), q.m) })));
  [
    [-165, 0xb7bcc2, 0xb22a24, {}],
    [-150, 0x5d6341, 0xd9b92a, { ang: 0.7 }],
    [-135, 0xb7bcc2, 0x222d5a, { stripes: 1, ang: 1.1 }],
    [-120, 0x5d6341, 0xb22a24, { ang: 0.2 }],
    [-105, 0xb7bcc2, 0xd9b92a, { tanks: 1, ang: 0.9 }],
    [-90, 0x5d6341, 0x1e4fa3, { ang: 0.4 }],
  ].forEach((a, i) => park(MD.fighter(a[1], a[2], a[3]), a[0], -92, -Zr + (i % 3 - 1) * 0.03));
  park(MD.cargoTruck(), 30, -82, 0.4);
  park(MD.jeep(), 45, -92, -0.3);
  park(MD.tug(), -60, -78, Zr);
  park(MD.fuelTruck(0x9aa0a6), 108, -108, 0, 0);
  park(MD.drums(), 98, -128, 0);
  const acc = new GX.Acc();
  acc.add(P, GX.xf(0, 0, 0, 0));
  const bm = new THREE.Mesh(acc.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  const grp = new THREE.Group();
  grp.add(rw, bm);
  grp.position.set(ISL.F.x, 0, ISL.F.z);
  grp.rotation.y = Math.atan2(-ISL.uz, ISL.ux);
  grp.updateMatrix();
  scene.add(grp);
  /* the moving ones, each with a reason: the bowser fuels the fighters one by one, the jeep inspects the runway */
  const wp = (u, v) => ISL.w(u, v);
  AFLD.add(MD.fuelTruck(0x56603f), [wp(112, -106), wp(-90, -106), wp(-105, -106), wp(-120, -106), wp(-135, -106), wp(-150, -106), wp(-165, -106)], 4, 12, 'veh', { stops: 9, y: Yp });
  AFLD.add(MD.jeep(), [wp(-500, -48), wp(500, -48)], 7, 25, 'veh', { y: Yp });
  ISL.bx = ISL.w(140, 100)[0]; /* the beacon */
  ISL.bz = ISL.w(140, 100)[1];
}
