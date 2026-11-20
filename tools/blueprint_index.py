#!/usr/bin/env python3
"""Writes Blueprints/README.md: one line per model from the measurement reports tools/blueprint.py wrote (and the PCE-842's own).
Run after tools/blueprint.py:  python3 tools/blueprint_index.py"""
import os, re, json, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'Blueprints')
CAT = json.load(open(os.path.join(ROOT, 'tools', 'blueprints.json')))
rows = []
for e in CAT:
    md = os.path.join(B, e['file'] + '_measurements.md')
    if not os.path.exists(md):
        rows.append((e, None, 'not drawn'))
        continue
    t = open(md).read()
    m = re.search(r'Model box: ([\d.]+) m long, ([\d.]+) m wide, ([\d.]+) m high', t)
    res = re.findall(r'\| (match|close|\*\*check\*\*) \|', t)
    worst = '**check**' if '**check**' in res else 'close' if 'close' in res else 'match' if res else 'no reference yet'
    rows.append((e, m.groups() if m else None, worst))
L = ['# Blueprints of the Kamome Strait models', '',
     'Orthographic drawings of every real-world model in the game (profile, plan and front at one scale) and a measurement check against',
     'the references. Drawn by `tools/blueprint.py` from the built game; the catalogue of models, with the reference figures and their',
     'sources, is `tools/blueprints.json`. Redraw after a model changes: `python3 tools/blueprint.py <id>`, then `python3 tools/blueprint_index.py`.', '',
     'The PCE-842\'s frame-by-frame check against the PCE-874 plans is in `docs/PCE-842_plans_check.md`.', '',
     '| Model | Represents | Length x width x height (m) | Check | Files |', '|---|---|---|---|---|']
for e, dims, worst in rows:
    d = ' x '.join(dims) if dims else '-'
    L.append(f"| {e['title']} | {e.get('type', '')} | {d} | {worst} | `{e['file']}_blueprint.png`, `{e['file']}_measurements.md` |")
L += ['', 'Check: the worst result in that model\'s table (match within 3%, close within 8%, **check** beyond).']
open(os.path.join(B, 'README.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[-len(rows) - 2:]))
