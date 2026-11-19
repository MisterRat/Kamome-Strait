#!/usr/bin/env python3
"""Map a line of a built game back to its source piece: python3 tools/buildline.py <pce|p51> <line> [line ...]
(build.js concatenates the manifest's pieces byte for byte, so the pieces' line counts add up.)"""
import sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
game = sys.argv[1]
pieces = [p.strip() for p in open(os.path.join(root, 'src', game + '.manifest')) if p.strip() and not p.startswith('#')]
spans, at = [], 1
for p in pieces:
    n = open(os.path.join(root, 'src', p), 'rb').read().count(b'\n')
    spans.append((at, at + n, p))
    at += n
for a in sys.argv[2:]:
    L = int(a)
    for s, e, p in spans:
        if s <= L < e or (s == e == L):
            print(a, p, 'line', L - s + 1)
            break
