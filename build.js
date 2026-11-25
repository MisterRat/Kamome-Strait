#!/usr/bin/env node
/* Kamome Strait build: joins the source pieces listed in each game's manifest (src/<game>.manifest, one path under src/ per
   line, in order) and writes the finished single-file game to build/. No dependencies: plain Node.

     node build.js            build every game
     node build.js p51        build one game
     node build.js --check    build, then compare each game byte for byte with its baseline (exit code 1 on any difference)
     node build.js --dev      also build the games in development (their menu-card.json "status": "dev") into dev/, which git
                              leaves out: the production pages in build/ never carry them until the user releases the game (the
                              user's, 2026-11-24: "in production" means released on GitHub; in-development games stay out until he
                              gives the OK, which is changing the card's status)

   Never hand-edit a file in build/: the next build overwrites it. Edit the pieces in src/. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const GAMES = {
  p51: {
    out: 'P-51_Mustang_FS.html',
    baseline: 'baseline/P-51_Mustang_FS_5.34.html',
  },
  pce: { out: 'PCE-842.html', baseline: 'baseline/PCE-842_0.51.html' },
  /* the M4A3 Sherman (PLAN_M4A3_Sherman_Tank): in development, its own page in dev/ only */
  m4a3: { out: 'M4A3_Sherman.html', dev: true },
  /* Kamome Strait: every simulator in one page, its manifest made from theirs (see combined()) */
  kamome: {
    out: 'Kamome_Strait.html',
    sims: ['p51', 'pce', 'm4a3'] /* the released ones only, unless --dev (status() below) */,
    /* the crossovers: pieces that use more than one simulator, loaded after all of them */
    cross: [] /* the PCE's air support was one; the P-51's display form is shared now, so it is the PCE's own */,
  },
};

const args = require.main === module ? process.argv.slice(2) : [];
const check = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));
const ids = only.length ? only : Object.keys(GAMES);
const dev = args.includes('--dev');
/* a simulator's release status, from its menu card: 'dev' while in development (left out of the production build), else released */
const status = (s) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'src', s, 'menu-card.json'), 'utf8')).status || 'released';
  } catch (e) {
    return 'released';
  }
};
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

function manifest(id) {
  return fs
    .readFileSync(path.join(ROOT, 'src', id + '.manifest'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/* A page with several simulators: their manifests merged in order (each shared piece once, every simulator's own pieces
   after the shared piece they follow). A simulator's page pieces (PAGE) are the combined page's own, from src/<id>/; its
   body goes into a <template id="sim-<sim>"> and the picker after the last one puts the chosen body in the page. */
const PAGE = ['head-the-page-title.html', 'what-this-file-is-and-how-it-is-organised.js', 'version-major-minor-the-user-decides-when-the-ma.js'];
/* the two lists in order, the pieces they have in common (longest common run, repeats included) once */
function merge(a, b) {
  const L = Array.from({ length: a.length + 1 }, () => new Int32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const r = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) (r.push(a[i]), i++, j++);
    else if (j >= b.length || (i < a.length && L[i + 1][j] >= L[i][j + 1])) r.push(a[i++]);
    else r.push(b[j++]);
  }
  return r;
}
/* the main menu's cards: each simulator's src/<sim>/menu-card.json (title, kind, line, order) and its picture src/<sim>/menu.jpg */
function menuCards(id, sims) {
  const cards = sims
    .map((s) => {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', s, 'menu-card.json'), 'utf8'));
      return Object.assign(c, { id: s, img: 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'src', s, 'menu.jpg')).toString('base64') });
    })
    .sort((a, b) => (a.order || 99) - (b.order || 99));
  const v = (fs.readFileSync(path.join(ROOT, 'src', id, 'version-major-minor-the-user-decides-when-the-ma.js'), 'utf8').match(/VERSION = '([^']+)'/) || [])[1];
  return (
    "<script>\n/* the main menu's cards (made by build.js from each simulator's menu-card.json and menu.jpg) and the page's version */\nvar KS_MENU = " +
    JSON.stringify(cards) +
    ',\n  KS_VERSION = ' +
    JSON.stringify(v) +
    ';\n</script>\n'
  );
}
function combined(id, sims) {
  let out = [];
  for (const s of sims) out = merge(out, manifest(s));
  const own = (p) => PAGE.includes(path.basename(p)) && sims.some((s) => p.startsWith(s + '/'));
  const res = [];
  for (const p of out) {
    if (own(p)) {
      const q = id + '/' + path.basename(p);
      if (!res.includes(q)) res.push(q);
    } else if (sims.some((s) => p === s + '/body.html')) {
      if (p !== sims[0] + '/body.html') continue;
      for (const s of sims)
        res.push({ text: `<template id="sim-${s}">\n` }, s + '/body.html', {
          text: '</template>\n',
        });
      res.push({ text: menuCards(id, sims) }, id + '/which-simulator-this-visit-plays.html');
    } else res.push(p);
    if (p === 'shared/sims-every-simulator-plugs-into-the-world-through-one-role.js') res.push(id + '/the-simulator-picked-for-this-visit.js');
  }
  /* the simulators load their shared pieces in different orders: a script piece would load twice (fix the manifests' order) */
  const js = res.filter((p) => typeof p === 'string' && p.endsWith('.js')),
    twice = js.filter((p, i) => js.indexOf(p) !== i);
  if (twice.length) throw new Error(`${id}: the simulators' manifests order these shared pieces differently: ${twice.join(', ')}`);
  const end = res.lastIndexOf('shared/script-close.html');
  res.splice(end, 0, ...((GAMES[id] && GAMES[id].cross) || []), id + '/the-start-screen-s-way-back-to-the-main-menu.js');
  return res;
}

module.exports = { GAMES, manifest, combined };
if (require.main === module) {
  let failed = false;
  /* the jobs: each game's production page in build/ (the released simulators only); with --dev, a game in development gets its own
     page and every combined page a dev copy with all of them, both in dev/ (git leaves dev/ out) */
  const jobs = [];
  for (const id of ids) {
    const g = GAMES[id];
    if (!g) {
      console.error(`unknown game "${id}" (known: ${Object.keys(GAMES).join(', ')})`);
      process.exit(2);
    }
    if (g.dev) {
      if (dev || only.includes(id)) jobs.push({ id, g, dir: 'dev', out: g.out, list: manifest(id) });
      continue;
    }
    if (g.sims) {
      const rel = g.sims.filter((s) => status(s) !== 'dev');
      jobs.push({ id, g, dir: 'build', out: g.out, list: combined(id, rel) });
      if (dev && rel.length < g.sims.length) jobs.push({ id, g, dir: 'dev', out: g.out.replace(/\.html$/, '_dev.html'), list: combined(id, g.sims), noBase: true });
    } else jobs.push({ id, g, dir: 'build', out: g.out, list: manifest(id) });
  }
  for (const { id, g, dir, out: name, list, noBase } of jobs) {
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
    const parts = list.map((p) => {
      if (typeof p === 'object') return Buffer.from(p.text);
      const f = path.join(ROOT, 'src', p);
      if (!fs.existsSync(f)) {
        console.error(`${id}: missing piece src/${p}`);
        process.exit(2);
      }
      return fs.readFileSync(f);
    });
    const out = Buffer.concat(parts);
    const dest = path.join(ROOT, dir, name);
    fs.writeFileSync(dest, out);
    let line = `${id}: ${dir}/${name}  ${out.length} bytes  ${list.length} pieces (${list.filter((p) => typeof p === 'string' && p.startsWith('shared/')).length} shared)  sha ${sha(out)}`;
    if (check && g.baseline && !noBase) {
      const base = fs.readFileSync(path.join(ROOT, g.baseline));
      if (Buffer.compare(base, out) === 0) line += '  == baseline';
      else {
        failed = true;
        let i = 0;
        while (i < out.length && i < base.length && out[i] === base[i]) i++;
        line += `  DIFFERS from ${g.baseline} (${base.length} bytes) at byte ${i}`;
      }
    }
    console.log(line);
  }
  process.exit(failed ? 1 : 0);
}
