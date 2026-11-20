/* the cockpit opening edge (the sill): drops from the windscreen base to the front frame, then climbs to the turtle deck */
const SILL_Z = [fz(129), fz(150), fz(222)];
function sillY(z) {
  if (z <= SILL_Z[0]) return 0.5;
  if (z >= SILL_Z[2]) return 0.575;
  if (z < SILL_Z[1]) {
    const u = (z - SILL_Z[0]) / (SILL_Z[1] - SILL_Z[0]);
    return 0.5 - 0.22 * u * u * (3 - 2 * u);
  }
  return 0.28 + ((z - SILL_Z[1]) / (SILL_Z[2] - SILL_Z[1])) * 0.295;
}
function sillAng(z) {
  const s = fusSec(z),
    f = Math.max(-0.995, Math.min(0.995, (sillY(z) - s.yc) / s.hh));
  return Math.asin(Math.sign(f) * Math.abs(f) ** (s.n / 2));
}
const sillX = (z) => fusPt(z, sillAng(z))[0];
function fusPatch(zA, zB, t0, t1, off, mat, nz, nt) {
  const P = [],
    I = [];
  for (let i = 0; i <= nz; i++) {
    const z = zA + ((zB - zA) * i) / nz;
    for (let j = 0; j <= nt; j++) {
      const q = fusPt(z, t0 + ((t1 - t0) * j) / nt, off);
      P.push(q[0], q[1], z);
    }
  }
  for (let i = 0; i < nz; i++)
    for (let j = 0; j < nt; j++) {
      const a = i * (nt + 1) + j,
        c = a + nt + 1;
      I.push(a, a + 1, c, a + 1, c + 1, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  return add(g, mat, 0, 0, 0);
}
const tubM = new THREE.MeshLambertMaterial({ color: 0x6f7d4b, side: 2 }); /* the cockpit tub (gets its wall texture with the interior) */
const bodyM = metal.clone();
bodyM.side = THREE.DoubleSide;
{
  /* body: rings from the nose to the tail; in the cockpit stretch the top of the ring is left out above the sill */
  const nU = 24,
    nL = 40,
    nR = nU + nL,
    ST = [];
  for (let x = 27; x <= 387; x += 3) ST.push(fz(x));
  const iA = (129 - 27) / 3,
    iB = (222 - 27) / 3,
    P = [],
    I = [],
    TU = [],
    TI = [];
  ST.forEach((z) => {
    const ts = sillAng(z);
    for (let j = 0; j < nU; j++) {
      const q = fusPt(z, ts + ((Math.PI - 2 * ts) * j) / nU);
      P.push(q[0], q[1], z);
    }
    for (let k = 0; k < nL; k++) {
      const q = fusPt(z, Math.PI - ts + ((Math.PI + 2 * ts) * k) / nL);
      P.push(q[0], q[1], z);
    }
  });
  for (let i = 0; i < ST.length - 1; i++)
    for (let j = 0; j < nR; j++) {
      if (i >= iA && i + 1 <= iB && j < nU) continue;
      const a = i * nR + j,
        b = i * nR + ((j + 1) % nR),
        c = a + nR,
        d = b + nR;
      I.push(a, b, c, b, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  add(g, bodyM, 0, 0, 0);
  /* the nose face behind the spinner */
  {
    const q = [0, fusSec(ST[0]).yc, ST[0]],
      F = [],
      Q = [...q];
    for (let j = 0; j < nR; j++) Q.push(P[j * 3], P[j * 3 + 1], P[j * 3 + 2]);
    for (let j = 0; j < nR; j++) F.push(0, 1 + ((j + 1) % nR), 1 + j);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(Q, 3));
    cg.setIndex(F);
    cg.computeVertexNormals();
    add(cg, dark, 0, 0, 0);
  }
  /* the cockpit tub: the inside of the skin below the sill, with its own colour and wall texture */
  for (let i = iA; i < iB; i++) {
    for (let k = 0; k <= nL; k++) {
      [i, i + 1].forEach((ii) => {
        const z = ST[ii],
          ts = sillAng(z),
          q = fusPt(z, Math.PI - ts + ((Math.PI + 2 * ts) * k) / nL, -0.012);
        TU.push(q[0], q[1], z);
      });
    }
  }
  const m = iB - iA;
  const UV = [];
  for (let i = 0; i < m; i++)
    for (let k = 0; k <= nL; k++) {
      UV.push(i / m, k / nL, (i + 1) / m, k / nL);
    }
  for (let i = 0; i < m; i++)
    for (let k = 0; k < nL; k++) {
      const a = (i * (nL + 1) + k) * 2,
        b = a + 2,
        c = a + 1,
        d = a + 3;
      TI.push(a, c, b, b, c, d);
    }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(TU, 3));
  tg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  tg.setIndex(TI);
  tg.computeVertexNormals();
  add(tg, tubM, 0, 0, 0);
}
fusPatch(fz(27), fz(47), 0, Math.PI * 2, 0.006, red, 6, 40); /* red cowl band */
fusPatch(fz(52), fz(128), Math.PI / 2 - 0.9, Math.PI / 2 + 0.9, 0.004, olive, 14, 16); /* anti-glare panel */
add(new THREE.BoxGeometry(0.3, 0.1, 0.03), dark, 0, -0.43, fz(29), model); /* the chin air intake */
