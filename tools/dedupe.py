"""Move pieces that have become identical in every game into src/shared/ and point the manifests at the shared copy.
Run from the repo root: python3 tools/dedupe.py  (prints what it moved; safe to run any time)."""
import os, glob, subprocess
games = [os.path.basename(m)[:-9] for m in glob.glob('src/*.manifest')]
names = set.intersection(*[set(os.listdir('src/' + g)) for g in games])
moved = []
for n in sorted(names):
    texts = [open(f'src/{g}/{n}', 'rb').read() for g in games]
    if all(t == texts[0] for t in texts) and not os.path.exists('src/shared/' + n):
        open('src/shared/' + n, 'wb').write(texts[0])
        for g in games:
            os.remove(f'src/{g}/{n}')
            man = f'src/{g}.manifest'
            L = open(man).read().split('\n')
            open(man, 'w').write('\n'.join('shared/' + n if l == f'{g}/{n}' else l for l in L))
        moved.append(n)
print(len(moved), 'pieces now shared:', *moved, sep='\n  ')
