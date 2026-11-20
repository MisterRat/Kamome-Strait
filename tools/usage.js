#!/usr/bin/env node
/* Kamome Strait: who uses what. Parses a game's script (its .js pieces joined in manifest order, as the build does), finds every
   top-level name (function, const, let, var, class, window.X) and the piece that defines it, and every use of a name and the piece it
   is in. Then walks the uses from each simulator's own pieces (src/<id>/) plus the shared core, and reports the shared pieces only one
   simulator reaches: those belong in that simulator's folder (PLAN section 4, phase 4: no shared code that only one simulator uses).

     node tools/usage.js                 the report for every game in the manifests
     node tools/usage.js --piece <file>  who uses the names a piece defines, piece by piece

   Scope-aware (eslint-scope): a local variable that shares a global's name is not a use of the global.
   Needs acorn, acorn-walk and eslint-scope (npm install acorn acorn-walk eslint-scope, anywhere on NODE_PATH). A development aid, not part of any game. */
"use strict";
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const walk = require("acorn-walk");
const eslintScope = require("eslint-scope");

const ROOT = path.join(__dirname, "..");
/* the shared core: generic pieces every simulator runs through (the registry, the frame loop, reset, controls); they are roots for each */
const CORE = [
  "shared/hooks-how-a-game-s-own-modules-plug-into-the-world.js",
  "shared/sims-every-simulator-plugs-into-the-world-through-one-role.js",
  "shared/the-photo-mode-panel-and-the-shared-frame-loop.js",
  "shared/reset-the-game-the-shared-part-each-simulator-places-and-readies-its-own-vehicle.js",
  "shared/controls-the-lookup-tables-and-key-names-built-from-the-current-simulator.js",
];
const SKIP = [
  "shared/license.js",
  "shared/pwa-only-when-served-over-http-s-e-g-github-page.js",
];

function analyse(game, mf) {
  const B = require(path.join(ROOT, "build.js")),
    G = B.GAMES[game];
  const list = (
    mf
      ? fs
          .readFileSync(mf, "utf8")
          .split("\n")
          .map((l) => l.trim())
      : G && G.sims
        ? B.combined(game, G.sims)
        : B.manifest(game)
  ).filter(
    (l) => typeof l === "string" && l.endsWith(".js") && !SKIP.includes(l),
  );
  let src = "";
  const at = [];
  for (const p of list) {
    at.push([src.length, p]);
    src += fs.readFileSync(path.join(ROOT, "src", p), "utf8");
  }
  const pieceAt = (o) => {
    let lo = 0,
      hi = at.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (at[m][0] <= o) lo = m;
      else hi = m - 1;
    }
    return at[lo][1];
  };
  const ast = acorn.parse(src, {
    ecmaVersion: "latest",
    sourceType: "script",
    allowReturnOutsideFunction: true,
    ranges: true,
  });
  const def = new Map(); /* name -> piece */
  const add = (n, o) => {
    if (!def.has(n)) def.set(n, pieceAt(o));
  };
  for (const st of ast.body) {
    if (st.type === "FunctionDeclaration" || st.type === "ClassDeclaration")
      add(st.id.name, st.start);
    else if (st.type === "VariableDeclaration")
      for (const d of st.declarations)
        if (d.id.type === "Identifier") add(d.id.name, d.start);
  }
  walk.simple(ast, {
    AssignmentExpression(n) {
      const l = n.left;
      if (
        l.type === "MemberExpression" &&
        !l.computed &&
        l.object.type === "Identifier" &&
        l.object.name === "window"
      )
        add(l.property.name, n.start);
    },
  });
  /* uses: every reference that resolves to a global (scope-aware), or an undeclared name that a window.X assignment defines */
  const uses = new Map(); /* piece -> Set(names) */
  const sm = eslintScope.analyze(ast, {
      ecmaVersion: 2022,
      sourceType: "script",
    }),
    gs = sm.globalScope;
  const use = (name, o) => {
    if (!def.has(name)) return;
    const pc = pieceAt(o);
    if (def.get(name) === pc) return;
    if (!uses.has(pc)) uses.set(pc, new Set());
    uses.get(pc).add(name);
  };
  for (const v of gs.variables)
    for (const r of v.references)
      if (r.identifier.start !== undefined) use(v.name, r.identifier.start);
  for (const r of gs.through) use(r.identifier.name, r.identifier.start);
  const through = new Set(
    gs.through.map((r) => r.identifier.name).filter((n) => !def.has(n)),
  );
  return { list, def, uses, through };
}

/* every piece reached from the roots by following the names they use to the pieces that define them (from: how each was reached) */
function reach(A, roots, from) {
  const seen = new Set(roots.filter((r) => A.list.includes(r))),
    todo = [...seen];
  while (todo.length) {
    const p = todo.shift();
    for (const n of A.uses.get(p) || []) {
      const q = A.def.get(n);
      if (q && !seen.has(q)) {
        (seen.add(q), todo.push(q));
        if (from) from.set(q, [p, n]);
      }
    }
  }
  return seen;
}

const games = fs
  .readdirSync(path.join(ROOT, "src"))
  .filter((f) => f.endsWith(".manifest"))
  .map((f) => f.replace(".manifest", ""));
const ui = process.argv.indexOf("--undeclared");
if (ui > 0) {
  /* node tools/usage.js --undeclared <game>: names the game uses that nothing in it declares (filter out the browser's own globals) */
  const A = analyse(process.argv[ui + 1]);
  console.log([...A.through].sort().join(" "));
  process.exit(0);
}
const ti = process.argv.indexOf("--try");
if (ti > 0) {
  /* node tools/usage.js --try <game> <file of pieces to leave out>: does the game still parse without them, and which names go missing */
  const g = process.argv[ti + 1],
    out = fs
      .readFileSync(process.argv[ti + 2], "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    mf = path.join(ROOT, "src", g + ".manifest"),
    tmp = path.join(require("os").tmpdir(), "try.manifest");
  fs.writeFileSync(
    tmp,
    fs
      .readFileSync(mf, "utf8")
      .split("\n")
      .filter((l) => !out.includes(l.trim()))
      .join("\n"),
  );
  const A = analyse(g),
    B = analyse(g, tmp),
    miss = new Map();
  for (const n of B.through) if (!A.through.has(n)) miss.set(n, []);
  for (const [p, ns] of A.uses)
    for (const n of ns)
      if (miss.has(n) && !out.includes(p))
        miss.get(n).push(p.replace(/^.*\//, "").slice(0, 30));
  console.log(
    `${g} without ${out.length} pieces: parses; ${miss.size} names go missing`,
  );
  for (const [n, ps] of miss)
    console.log(`  ${n}: ${[...new Set(ps)].join(", ")}`);
  process.exit(0);
}
const wi = process.argv.indexOf("--why");
if (wi > 0) {
  /* node tools/usage.js --why <game> <piece substring>: the chain of uses by which that game's own code reaches the piece */
  const g = process.argv[wi + 1],
    want = process.argv[wi + 2],
    A = analyse(g),
    from = new Map();
  reach(A, [...A.list.filter((p) => p.startsWith(g + "/")), ...CORE], from);
  for (const p of A.list.filter((x) => x.includes(want))) {
    const chain = [];
    let q = p;
    while (from.has(q)) {
      const [a, n] = from.get(q);
      chain.push(`${a.replace(/\.js$/, "")} -[${n}]->`);
      q = a;
    }
    console.log(
      p +
        (chain.length
          ? "\n   " + chain.reverse().join("\n   ")
          : "  (a root, or not reached)"),
    );
  }
  process.exit(0);
}
const ei = process.argv.indexOf("--edges");
if (ei > 0) {
  /* node tools/usage.js --edges <game>: the shared names that game's own pieces and the core use, by the shared piece defining them */
  const g = process.argv[ei + 1],
    A = analyse(g),
    by = new Map();
  for (const [p, ns] of A.uses) {
    if (!(p.startsWith(g + "/") || CORE.includes(p))) continue;
    for (const n of ns) {
      const q = A.def.get(n);
      if (!q || !q.startsWith("shared/") || CORE.includes(q)) continue;
      if (!by.has(q)) by.set(q, new Map());
      const m = by.get(q);
      if (!m.has(n)) m.set(n, new Set());
      m.get(n).add(p.replace(/^.*\//, "").slice(0, 28));
    }
  }
  for (const [q, m] of by)
    console.log(
      q.replace("shared/", "") +
        ": " +
        [...m].map(([n, ps]) => n + " (" + [...ps].join(", ") + ")").join("; "),
    );
  process.exit(0);
}
const pi = process.argv.indexOf("--piece");
if (pi > 0) {
  const want = process.argv[pi + 1];
  for (const g of games) {
    const A = analyse(g);
    const mine = [...A.def].filter(([, p]) => p.endsWith(want)).map(([n]) => n);
    console.log(`${g}: ${want} defines ${mine.join(" ")}`);
    for (const [p, ns] of A.uses) {
      const hit = [...ns].filter((n) => mine.includes(n));
      if (hit.length) console.log(`   used by ${p}: ${hit.join(" ")}`);
    }
  }
  process.exit(0);
}
const R = {};
for (const g of games) {
  const A = analyse(g);
  R[g] = {
    A,
    reach: reach(A, [...A.list.filter((p) => p.startsWith(g + "/")), ...CORE]),
  };
}
/* a shared piece reached by only one game's own code (through the core too) belongs to that game */
for (const g of games) {
  const others = games.filter((h) => h !== g);
  const only = R[g].A.list.filter(
    (p) =>
      p.startsWith("shared/") &&
      R[g].reach.has(p) &&
      others.every((h) => !R[h].reach.has(p)),
  );
  console.log(`\nshared pieces only ${g} reaches (${only.length}):`);
  for (const p of only) console.log("  " + p);
}
const none = R[games[0]].A.list.filter(
  (p) => p.startsWith("shared/") && games.every((g) => !R[g].reach.has(p)),
);
console.log(
  `\nshared pieces no simulator reaches by name (load-time world building, data; ${none.length}):`,
);
for (const p of none) console.log("  " + p);
