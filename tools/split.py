"""One-off splitter for Kamome Strait phase 3, step 1 (kept for the record; do not re-run on edited sources).
Cuts each frozen game file into pieces at section boundaries, puts pieces identical in both games into src/shared/
and the rest into src/<game>/, and writes src/<game>.manifest (one piece path per line, in file order)."""
import re, os, sys, hashlib
ROOT = sys.argv[1]
GAMES = [('p51', sys.argv[2]), ('pce', sys.argv[3])]
TAG = re.compile(r'^\s*<(/?)(script|style)\b')

def cut(text):
    L = text.split('\n')  # the file ends with '\n', so the last element is ''
    starts = [0]
    in_js = False
    for i, l in enumerate(L):
        if i == 0: continue
        m = TAG.match(l)
        if m:
            starts.append(i)
            # the line after a closing tag starts a new piece too
            if m[1] == '/' and i + 1 < len(L): starts.append(i + 1)
            in_js = (m[2] == 'script' and not m[1] and '</script>' not in l)
            continue
        if in_js and l.startswith('/*'):
            starts.append(i)
    starts = sorted(set(starts))
    pieces = []
    for k, s in enumerate(starts):
        e = starts[k + 1] if k + 1 < len(starts) else len(L)
        pieces.append(L[s:e])
    # every piece is its lines joined with '\n' and followed by '\n'; the final '' element supplies the file's last newline
    out = []
    for p in pieces:
        if p and p[-1] == '' and p is pieces[-1]:
            p = p[:-1]
        out.append('\n'.join(p) + '\n')
    assert ''.join(out) == text, 'cut does not reassemble'
    return out

def slug(piece, kind):
    first = next((l for l in piece.split('\n') if l.strip() and not re.fullmatch(r'[/*= \-]*', l.strip())), 'piece')
    first = re.sub(r'<[^>]+>', ' ', first) if kind == 'html' else first
    s = re.sub(r'[^a-z0-9]+', '-', first.lower()).strip('-')
    s = re.sub(r'^(const|let|var|function)-', '', s)
    return (s[:48].strip('-') or 'piece')

def kind_of(piece):
    f = piece.lstrip()
    if f.startswith('<style'): return 'css'
    if f.startswith('<'): return 'html'
    return 'js'

cuts = {g: cut(open(f, encoding='utf-8', newline='').read()) for g, f in GAMES}
hashes = {g: [hashlib.sha1(p.encode()).hexdigest() for p in cuts[g]] for g in cuts}
shared_h = set(hashes['p51']) & set(hashes['pce'])
names = {}   # hash -> path
used = set()
def name_for(h, piece, folder):
    if h in names: return names[h]
    ext = {'css': 'css', 'html': 'html', 'js': 'js'}[kind_of(piece)]
    base = slug(piece, kind_of(piece))
    n, k = f'{folder}/{base}.{ext}', 2
    while n in used:
        n, k = f'{folder}/{base}-{k}.{ext}', k + 1
    used.add(n); names[h] = n
    return n
for g in ('p51', 'pce'):
    man = []
    for p, h in zip(cuts[g], hashes[g]):
        folder = 'shared' if h in shared_h else g
        path = name_for(h if folder == 'shared' else g + h, p, folder)
        full = os.path.join(ROOT, 'src', path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'w', encoding='utf-8', newline='') as fh: fh.write(p)
        man.append(path)
    with open(os.path.join(ROOT, 'src', g + '.manifest'), 'w', encoding='utf-8', newline='') as fh:
        fh.write('\n'.join(man) + '\n')
    print(g, len(man), 'pieces,', sum(1 for m in man if m.startswith('shared/')), 'shared')
