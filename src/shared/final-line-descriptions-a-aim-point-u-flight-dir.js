/* final-line descriptions: A = aim point, u = flight direction, alt(d) = height at distance d before A */
function pickBldg(left) {
  let tg = left[0],
    bs = 1e18;
  const hd = Math.atan2(-fwd.x, -fwd.z);
  for (const b of left) {
    const dx = b.c.x - pos.x,
      dz = b.c.z - pos.z,
      d = Math.hypot(dx, dz),
      off = Math.abs(Math.atan2(Math.sin(hd - Math.atan2(-dx, -dz)), Math.cos(hd - Math.atan2(-dx, -dz))));
    const sc = d + (1800 * off) / Math.PI;
    if (sc < bs) {
      bs = sc;
      tg = b;
    }
  }
  return tg;
}
function finalLineFor() {
  const m = trn.mode;
  if (m === 'landing') {
    return {
      kind: 'land',
      A: { x: 0, z: 400 },
      u: { x: 0, z: -1 },
      alt: (d) => (d > 0 ? d * 0.0524 : 0.5),
      dEnd: -900,
      Dg: 3600,
      Dmin: 1500,
      Dmax: 9000,
      descLim: 0.09,
      marks: [{ d: 0, t: 'touch' }],
    };
  }
  if (m === 'adf') {
    /* after station passage the green ring leads a circuit onto the island runway: a turn to a straight final on a 3 degree slope */
    if (trn.step !== 3) {
      trn.adfE = undefined;
      return null;
    }
    if (trn.adfE === undefined) {
      const hv = Math.atan2(vel.x, -vel.z),
        h07 = ISL.hdg;
      trn.adfE = Math.cos(hv - h07) >= Math.cos(hv - h07 - Math.PI) ? 1 : -1; /* 1: land on 07 (heading 070), -1: land on 25 */
    }
    const e = trn.adfE,
      A = ISL.w(-e * 500, 0);
    return {
      kind: 'land',
      A: { x: A[0], z: A[1] },
      u: { x: e * ISL.ux, z: e * ISL.uz },
      alt: (d) => ISL.H0 + (d > 0 ? d * 0.0524 : 0.5),
      dEnd: -900,
      Dg: 3600,
      Dmin: 1500,
      Dmax: 9000,
      descLim: 0.16,
      bank: 35,
      lin: true,
      marks: [{ d: 0, t: 'touch' }],
    };
  }
  if (m === 'convoy') {
    /* the first pass follows the pilot's recorded line; once the player is past its end the ring leads a flyable turn round to a
       new run from behind the rear vehicle (a planned route, not a point on the old line, which swung round faster than the plane can turn) */
    const al = CV.list.filter((v) => !v.dead),
      nPP = PP.out && PP.key === ppKey() && !RPL.busy ? PP.out.length : 0;
    if (nPP && PP.ix >= nPP - 8 && CV.st === 'run') guide.cvRe = true;
    if (!guide.cvRe || CV.st !== 'run' || !al.length) return null;
    const cvAt = (s) => {
      const c = Math.max(0, Math.min(CLEN, s)),
        p = CVC.getPointAt(c / CLEN);
      if (s >= 0 && s <= CLEN) return { x: p.x, z: p.z };
      const t = CVC.getTangentAt(s < 0 ? 0 : 1);
      return { x: p.x + t.x * (s - c), z: p.z + t.z * (s - c) };
    };
    let tv = al[0];
    for (const v of al) if (v.s < tv.s) tv = v; /* the rear-most vehicle, so the rest of the convoy lines up ahead */
    const vh = Math.max(60, Math.hypot(vel.x, vel.z));
    let sp = tv.s;
    for (let i = 0; i < 3; i++) {
      const p = cvAt(sp),
        dd = Math.hypot(p.x - pos.x, p.z - pos.z);
      sp = Math.min(CLEN - 60, tv.s + (CV.spd * Math.max(0, dd - 300)) / Math.max(30, vh - CV.spd));
    }
    const pF = cvAt(sp),
      pB = cvAt(sp - 500);
    let ux = pF.x - pB.x,
      uz = pF.z - pB.z;
    const l = Math.hypot(ux, uz) || 1;
    ux /= l;
    uz /= l;
    const hF = H(pF.x, pF.z),
      sA = sp,
      Lc = Math.max(...al.map((v) => v.s)) - tv.s,
      dP = Math.max(-420, -Lc - 60); /* pull up only after the FRONT vehicle */
    const dirAt = (d) => {
      const a = cvAt(sA - d - 30),
        b = cvAt(sA - d + 30);
      let x = a.x - b.x,
        z = a.z - b.z;
      const k = Math.hypot(x, z) || 1;
      return { x: -x / k, z: -z / k };
    };
    return {
      kind: 'strafe',
      A: { x: pF.x, z: pF.z },
      u: { x: ux, z: uz },
      line: (d) => cvAt(sA - d),
      dir: dirAt,
      alt: (d) => (d >= dP ? hF + 140 + (d - dP) * 0.176 : hF + 140 + (dP - d) * 0.26),
      dEnd: -(Lc + 700),
      Dg: 2000,
      Dmin: 1000,
      Dmax: 8200,
      descLim: 0.32,
      marks: [
        { d: 550, t: 'fire' },
        { d: dP, t: 'pull' },
      ],
    };
  }
  if (m === 'bomb') {
    const left = BLD.filter((b) => !b.dead);
    if (!left.length) return null;
    const tg =
        guide.tgt && !guide.tgt.dead && Math.hypot(guide.tgt.c.x - pos.x, guide.tgt.c.z - pos.z) > 600
          ? guide.tgt
          : pickBldg(left),
      td = Math.hypot(tg.c.x - pos.x, tg.c.z - pos.z);
    if (guide.tgt !== tg) {
      guide.tgt = tg;
      guide.hdg = null;
    }
    if (!guide.hdg) {
      let dx = tg.c.x - pos.x,
        dz = tg.c.z - pos.z;
      if (td < 1500) {
        dx = vel.x;
        dz = vel.z;
      }
      const l = Math.hypot(dx, dz) || 1;
      guide.hdg = { x: dx / l, z: dz / l };
    }
    const ht = H(tg.c.x, tg.c.z),
      v = Math.max(100, Math.min(170, vel.length())),
      th = (25 * Math.PI) / 180,
      vy = -v * Math.sin(th),
      tf = (vy + Math.sqrt(vy * vy + 19.6 * 450)) / 9.8,
      dRel = v * Math.cos(th) * tf,
      tn = Math.tan(th),
      dRI = dRel + 450 / tn;
    return {
      kind: 'bomb',
      A: { x: tg.c.x, z: tg.c.z },
      u: guide.hdg,
      alt: (d) =>
        d >= dRI
          ? ht + 900
          : d >= dRel
            ? ht + 450 + (d - dRel) * tn
            : ht + Math.max(260, 450 - (dRel - d) * tn) + (d < dRel - 190 / tn ? (dRel - 190 / tn - d) * 0.3 : 0),
      dEnd: -(dRel - 190 / tn) - 500,
      Dg: dRI + 800,
      Dmin: dRI + 300,
      Dmax: dRI + 6800,
      descLim: 0.5,
      marks: [
        { d: dRel, t: 'rel' },
        { d: dRel - 190 / tn, t: 'pull' },
      ],
    };
  }
  if (m === 'takeoff') {
    return {
      kind: 'take',
      A: { x: 0, z: -60 },
      u: { x: 0, z: -1 },
      alt: (d) => (d > 0 ? 0.6 : 0.6 - d * 0.1228),
      dEnd: -12000,
      Dg: 260,
      Dmax: 1e9,
      descLim: 0.1,
      marks: [
        { d: 200, t: 'rot' },
        { d: 0, t: 'lift' },
      ],
      ground: true,
    };
  }
  return null;
}
function buildPlan(F) {
  const px = pos.x,
    pz = pos.z,
    vh = Math.max(45, Math.hypot(vel.x, vel.z)),
    vp = Math.max(vh, F.kind === 'land' ? 70 : 100),
    R = F.ground ? 260 : Math.max(300, (vp * vp) / (9.8 * Math.tan(((F.bank || (F.kind === 'land' ? 30 : F.kind === 'strafe' ? 50 : 38)) * Math.PI) / 180)));
  const psi = Math.atan2(-fwd.x, -fwd.z);
  let psiF = Math.atan2(-F.u.x, -F.u.z);
  let dAlong = -((px - F.A.x) * F.u.x + (pz - F.A.z) * F.u.z),
    lat = (px - F.A.x) * -F.u.z + (pz - F.A.z) * F.u.x;
  if (F.line) {
    let bl = 1e18,
      bdd = 0;
    for (let d = F.dEnd; d <= Math.min(F.Dmax, 6500); d += 25) {
      const q = F.line(d),
        l2 = (q.x - px) * (q.x - px) + (q.z - pz) * (q.z - pz);
      if (l2 < bl) {
        bl = l2;
        bdd = d;
      }
    }
    dAlong = bdd;
    lat = Math.sqrt(bl);
    const ud = F.dir(bdd);
    psiF = Math.atan2(-ud.x, -ud.z);
  }
  const hErr = Math.abs(Math.atan2(Math.sin(psi - psiF), Math.cos(psi - psiF)));
  let aligned =
    Math.abs(lat) < (F.ground ? 6 : 70) && hErr < (F.ground ? 0.1 : 0.17) && dAlong < F.Dmax && dAlong > F.dEnd + 50;
  const P = (d) => (F.line ? F.line(d) : { x: F.A.x - F.u.x * d, z: F.A.z - F.u.z * d }),
    uAt = (d) => (F.dir ? F.dir(d) : F.u),
    pts = [],
    step = F.ground ? 30 : 45;
  let pre = [],
    altStart = pos.y - 2;
  if (F.ground && pos.y - 2 - H(px, pz) < 3) altStart = 0.6;
  let dStart, preAlt;
  if (aligned) {
    dStart = dAlong;
  } else {
    dStart = F.Dg;
    let bt = 1e18,
      bd = null;
    const D0 = F.Dmin || F.Dg;
    for (let k = 0; k <= (F.ground ? 0 : 45); k++) {
      const Dg = F.ground ? F.Dg : D0 + k * 300;
      if (!F.ground && (Dg > F.Dmax || Dg > D0 + 9000)) break;
      const g = P(Dg),
        uh = uAt(Dg),
        dub = dubins(px, -pz, Math.atan2(-fwd.z, fwd.x), g.x, -g.z, Math.atan2(-uh.z, uh.x), R);
      if (dub) {
        const Lm = dub.L * R,
          drop = altStart - F.alt(Dg);
        if (!F.ground && ((drop > 0 && drop > F.descLim * Lm) || (drop < 0 && -drop > 0.12 * Lm))) continue;
        const tot = Lm + Dg + (Math.max(dub.t, dub.q, dub.type[1] === 'S' ? 0 : dub.p) > 3.6 ? 3000 : 0);
        if (tot < bt) {
          bt = tot;
          bd = dub;
          dStart = Dg;
        }
      }
    }
    if (!bd) {
      const g = P(F.Dg),
        uh = uAt(F.Dg),
        dub = dubins(px, -pz, Math.atan2(-fwd.z, fwd.x), g.x, -g.z, Math.atan2(-uh.z, uh.x), R);
      if (dub) {
        bd = dub;
        dStart = F.Dg;
      }
    }
    if (bd) pre = dubinsSample(bd, step).map((q) => ({ x: q.x, z: -q.y }));
  }
  // altitude profile
  const lim = F.descLim,
    altGate = F.alt(dStart);
  let acc = 0;
  for (let i = 0; i < pre.length; i++) {
    if (i > 0) acc += Math.hypot(pre[i].x - pre[i - 1].x, pre[i].z - pre[i - 1].z);
    pre[i].s = acc;
  }
  const Lpre = acc || 1;
  pre.forEach((q) => {
    const lin = altStart + ((altGate - altStart) * q.s) / Lpre;
    let y = lin;
    if (F.lin) y = lin; /* a steady descent the whole way round, not a dive and then level flight */
    else if (altGate < altStart) y = Math.max(altGate, altStart - lim * q.s);
    else if (altGate > altStart) y = Math.min(altGate, altStart + 0.12 * q.s);
    q.y = F.ground ? y : Math.max(y, H(q.x, q.z) + 30);
  });
  pts.push(...pre);
  const dEnd = F.dEnd;
  for (let d = dStart; d >= dEnd; d -= step) {
    const p = P(d);
    let y = F.alt(d);
    if (aligned) {
      const along = dStart - d;
      if (altStart > F.alt(dStart)) y = Math.max(y, altStart - lim * along);
      else y = Math.min(y, altStart + 0.12 * along);
    }
    if (F.ground) y = Math.max(y, 0.6);
    else y = Math.max(y, H(p.x, p.z) + 12);
    pts.push({ x: p.x, z: p.z, y, fin: true });
  }
  if (F.ground)
    pre.forEach((q) => {
      q.y = Math.max(0.6, q.y);
    });
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pts[i].s = s;
  }
  const marks = [{ p: { x: P(dStart).x, z: P(dStart).z, y: F.alt(dStart) }, t: 'gate' }].concat(
    F.marks.map((m) => {
      const q = P(m.d);
      return { p: { x: q.x, z: q.z, y: F.alt(m.d) }, t: m.t };
    }),
  );
  if (aligned) marks.shift();
  return { pts, marks, F };
}
function closestIdx(pts) {
  let bi = 0,
    bd = 1e18;
  for (let i = 0; i < pts.length; i++) {
    const dx = pts[i].x - pos.x,
      dz = pts[i].z - pos.z,
      dy = (pts[i].y + 2 - pos.y) * 0.5,
      dd = dx * dx + dz * dz + dy * dy;
    if (dd < bd) {
      bd = dd;
      bi = i;
    }
  }
  return [bi, Math.sqrt(bd)];
}
