#!/usr/bin/env node
/* Kamome Strait build: joins the source pieces listed in each game's manifest (src/<game>.manifest, one path under src/ per
   line, in order) and writes the finished single-file game to build/. No dependencies: plain Node.

     node build.js            build every game
     node build.js p51        build one game
     node build.js --check    build, then compare each game byte for byte with its baseline (exit code 1 on any difference)

   Never hand-edit a file in build/: the next build overwrites it. Edit the pieces in src/. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const GAMES = {
  p51: { out: 'P-51_Mustang_FS.html', baseline: 'baseline/P-51_Mustang_FS_5.34.html' },
  pce: { out: 'PCE-842.html', baseline: 'baseline/PCE-842_0.51.html' },
};

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));
const ids = only.length ? only : Object.keys(GAMES);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

let failed = false;
fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
for (const id of ids) {
  const g = GAMES[id];
  if (!g) {
    console.error(`unknown game "${id}" (known: ${Object.keys(GAMES).join(', ')})`);
    process.exit(2);
  }
  const list = fs
    .readFileSync(path.join(ROOT, 'src', id + '.manifest'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const parts = list.map((p) => {
    const f = path.join(ROOT, 'src', p);
    if (!fs.existsSync(f)) {
      console.error(`${id}: missing piece src/${p}`);
      process.exit(2);
    }
    return fs.readFileSync(f);
  });
  const out = Buffer.concat(parts);
  const dest = path.join(ROOT, 'build', g.out);
  fs.writeFileSync(dest, out);
  let line = `${id}: build/${g.out}  ${out.length} bytes  ${list.length} pieces (${list.filter((p) => p.startsWith('shared/')).length} shared)  sha ${sha(out)}`;
  if (check) {
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
