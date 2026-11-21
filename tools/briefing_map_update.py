#!/usr/bin/env python3
"""Amend the aircrew briefing map (docs/P-51_Mustang_FS_Briefing_Map.pdf) with the sites built after its first edition.

  python3 tools/briefing_map_amend.py <first-edition.pdf> <out.pdf>

The first edition was drawn by a matplotlib script that is not in the repo, so the new sites are drawn on a transparent page in the
chart's own style and laid over it (pypdf). The chart's frame: 1 pt = 1 px at 72 dpi, the grid's squares 134.9 pt (11,000 yd), the
centre of square F6 (839, 889) on Fletcher Field (the world's origin), world x east and z south.
"""
import math
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle, Polygon
import re

from pypdf import PdfReader, PdfWriter
from pypdf.generic import StreamObject

W, H = 2592, 1728
S = 134.9 / 10058.4  # pt per metre
X0, Y0 = 839.0, 889.0
RED, BLUE, INK, CREAM = "#a81f1a", "#1f3a6e", "#2b2620", "#efe3c4"
SERIF = "DejaVu Serif"


def P(x, z):
    return X0 + x * S, Y0 + z * S


def grid(x, z):
    px, py = P(x, z)
    c = "ABCDEFGHIJK"[max(0, min(10, round((px - 164) / 134.9)))]
    r = max(0, min(10, round((py - 215) / 134.9))) + 1
    return f"{c}{r}"


def frm(x, z):
    b = (math.degrees(math.atan2(x, -z)) + 360) % 360
    return f"{b:03.0f}°T  {math.hypot(x, z) / 1852:.1f} nm"


fig = plt.figure(figsize=(W / 72, H / 72), dpi=72)
fig.patch.set_alpha(0)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W)
ax.set_ylim(H, 0)
ax.axis("off")
ax.patch.set_alpha(0)


def label(x, y, lines, col, tx, ty, size=12.5, anchor=None, weight="bold"):
    """a cream box with a coloured border at (tx, ty) (its left edge, its middle), and a leader to (x, y)"""
    t = ax.text(tx, ty, "\n".join(lines), fontsize=size, fontfamily=SERIF, fontweight=weight, color=col, va="center", ha="left",
                linespacing=1.15, zorder=6,
                bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.3", fc=CREAM, ec=col, lw=1.6))
    ax.plot([x, anchor[0] if anchor else tx], [y, anchor[1] if anchor else ty], color=col, lw=1.3, zorder=5)
    return t


def flak(x, y):
    ax.add_patch(Circle((x, y), 2778 * S, fc=(0.75, 0.15, 0.1, 0.10), ec=RED, lw=1.6, ls=(0, (5, 3)), zorder=3))
    for k in (0.62, 0.32):
        ax.add_patch(Circle((x, y), 2778 * S * k, fc="none", ec=RED, lw=0.8, ls=(0, (1, 2)), zorder=3))


def anchor_sym(x, y, col):
    ax.add_patch(Circle((x, y), 11, fc="#f6efe0", ec=col, lw=2.2, zorder=7))
    ax.text(x, y + 1, "⚓", fontsize=13, color=col, ha="center", va="center", zorder=8, fontfamily="DejaVu Sans")


def depot_sym(x, y, col):
    ax.add_patch(Rectangle((x - 9, y - 9), 18, 18, fc=col, ec=INK, lw=1.2, zorder=7))
    ax.text(x, y + 0.5, "D", fontsize=12, color="white", ha="center", va="center", zorder=8, fontweight="bold", fontstyle="italic",
            fontfamily="DejaVu Sans")


def route(pts, col, ls):
    xs, ys = zip(*[P(*p) for p in pts])
    ax.plot(xs, ys, color=col, lw=1.6, ls=ls, zorder=4)


# ---- the sites (positions from the game: FS.nav, FS.list air3, FS.chan, the freighters' routes) ----
UG = (2025, 19175)  # Port Ugaki (navjp): its shore point; the yard behind it
UGc = (2025, 19175 + 60)
KA = (-8185, 22542)  # Airbase Kakuta (air3): the runway's middle (d = -750 from O (-8185, 21792), S north)
HA = (1675, 10925 - 30)  # PT Base Halsey (navus)
NI = (8959, 11470 - 30)  # Depot Nimitz (navusd)
CH = ((1823, 18476), (773, 20634))
RUN_JP = [(2085, 18837), (2085, 17937), (1823, 18476), (773, 20634), (452, 25752), (1284, 26096)]
RUN_US = [(1825, 11262), (1825, 12162), (9109, 12707), (9109, 11807)]

# supply runs first (under the symbols)
route(RUN_JP, RED, (0, (6, 3, 1, 3)))
route(RUN_US, BLUE, (0, (6, 3, 1, 3)))
# the dredged channel: a double line, buoyed
(ax0, ay0), (ax1, ay1) = P(*CH[0]), P(*CH[1])
dx, dy = ax1 - ax0, ay1 - ay0
L = math.hypot(dx, dy)
nx, ny = -dy / L * 2.2, dx / L * 2.2
for s in (-1, 1):
    ax.plot([ax0 + nx * s, ax1 + nx * s], [ay0 + ny * s, ay1 + ny * s], color=INK, lw=1.0, zorder=5)
for k in range(0, 7):
    t = k / 6
    ax.add_patch(Circle((ax0 + dx * t + nx * 1.9, ay0 + dy * t + ny * 1.9), 1.4, fc="#b8302a", ec="none", zorder=6))
    ax.add_patch(Circle((ax0 + dx * t - nx * 1.9, ay0 + dy * t - ny * 1.9), 1.4, fc="#2f7a3a", ec="none", zorder=6))

# Port Ugaki: flak ring, the escort's racetrack, the anchor
ux, uy = P(*UGc)
flak(ux, uy)
rt = [P(2025 + a, 19175 - 900 + b) for a, b in [(-700, -150), (700, -150), (700, 150), (-700, 150)]]
ax.add_patch(Polygon(rt, closed=True, fc="none", ec=RED, lw=3.2, joinstyle="round", zorder=4))
ax.add_patch(Polygon(rt, closed=True, fc=(0.75, 0.15, 0.1, 0.12), ec="none", hatch="////", zorder=4))
anchor_sym(ux, uy, RED)
label(ux, uy, ["PORT UGAKI", "Naval base  ·  " + grid(*UGc)], RED, 905, 1118, anchor=(905, 1118))
kx, ky = P(2025, 19175 - 900)
label(kx, ky, ["IJN KUME (久米)", "Ukuru-class escort — coastal patrol", "Station: PORT UGAKI"], RED, 1040, 1168, size=9, weight="normal")

# Airbase Kakuta: flak ring, the runway east - west, the circle
kx, ky = P(*KA)
flak(kx, ky)
ax.add_patch(Circle((kx, ky), 13, fc="none", ec=RED, lw=2.4, zorder=7))
ax.plot([kx - 1200 * S / 2 * 1.0, kx + 1200 * S / 2], [ky, ky], color=INK, lw=4.5, solid_capstyle="butt", zorder=8)
label(kx, ky, ["AIRBASE KAKUTA", "Fighter airfield  ·  " + grid(*KA)], RED, 500, 1236, anchor=(660, 1236))

# PT Base Halsey and Depot Nimitz (Allied, blue)
hx, hy = P(*HA)
anchor_sym(hx, hy, BLUE)
label(hx, hy, ["PT BASE HALSEY", "US Navy PT-boat base  ·  " + grid(*HA)], BLUE, 880, 1000, anchor=(880, 1000))
nx_, ny_ = P(*NI)
depot_sym(nx_, ny_, BLUE)
label(nx_, ny_, ["DEPOT NIMITZ", "US Navy supply depot  ·  " + grid(*NI)], BLUE, 985, 1062, anchor=(985, 1062))

# the channel's and the runs' labels
mx, my = (ax0 + ax1) / 2, (ay0 + ay1) / 2
ax.text(mx - 8, my + 2, "Dredged channel\n(buoyed, 40 ft)", fontsize=9, fontstyle="italic", fontfamily=SERIF, color=INK, ha="right",
        va="center", zorder=6)
p = P(5200, 12500)
ax.text(p[0], p[1] + 10, "Liberty supply run", fontsize=9, fontstyle="italic", fontfamily=SERIF, color=BLUE, ha="center", zorder=6)
p = P(900, 23500)
ax.text(p[0] + 8, p[1], "Enemy supply run\n(freighter)", fontsize=9, fontstyle="italic", fontfamily=SERIF, color=RED, ha="left",
        va="center", zorder=6)

# IJN AGUNI's label, moved: Airbase Kakuta stands where it was (the first edition's is taken out of the page below)
ag = ax.text(812, 1306, "IJN AGUNI (粟国)\nUkuru-class escort — coastal patrol\nStation: DEPOT MIKAWA", fontsize=7.4, fontfamily=[SERIF, "Noto Serif CJK JP"],
             color=RED, va="center", ha="left", linespacing=1.2, zorder=6,
             bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.3", fc="#f3e9c9", ec=RED, lw=0.7))
ax.annotate("", xy=(841.8, 1237.4), xytext=(836, 1290), arrowprops=dict(arrowstyle="-|>", color=RED, lw=0.8, mutation_scale=8), zorder=5)

# ---- the amendment panel, in the open sea at the foot of the chart ----
px0, py0, pw, ph = 640, 1400, 600, 178
ax.add_patch(FancyBboxPatch((px0, py0), pw, ph, boxstyle="round,pad=0,rounding_size=4", fc=CREAM, ec=INK, lw=1.4, zorder=9))
ax.add_patch(Rectangle((px0 + 3, py0 + 3), pw - 6, ph - 6, fc="none", ec=INK, lw=0.6, zorder=9))
ax.text(px0 + 12, py0 + 17, "AMENDMENT No. 1  ·  APRIL 1945  ·  NEW AND CHANGED FACILITIES", fontsize=11.5, fontweight="bold",
        fontfamily=SERIF, color=INK, zorder=10)
rows = [
    ("PORT UGAKI", RED, "Naval base", grid(*UGc), frm(*UGc), "3 × 25 mm twin, 2 × 12 cm coast guns, 1 searchlight; 2 × T-14"),
    ("AIRBASE KAKUTA", RED, "Fighter airfield", grid(*KA), frm(*KA), "2 × 25 mm twin, 2 searchlights; Ki-84s, scramble to Port Ugaki"),
    ("PT BASE HALSEY", BLUE, "US Navy PT base", grid(*HA), frm(*HA), "Allied: PT boats; PCE-842's berth; rearm and refuel here"),
    ("DEPOT NIMITZ", BLUE, "US Navy depot", grid(*NI), frm(*NI), "Allied: supply depot; Liberty run to PT Base Halsey"),
]
cols = [px0 + 12, px0 + 128, px0 + 228, px0 + 262, px0 + 360]
for i, h in enumerate(["NAME", "TYPE", "GRID", "FROM FLETCHER", "DEFENCES / NOTES"]):
    ax.text(cols[i], py0 + 35, h, fontsize=7.5, fontfamily=SERIF, fontweight="bold", color=INK, zorder=10)
ax.plot([px0 + 10, px0 + pw - 10], [py0 + 40, py0 + 40], color=INK, lw=0.6, zorder=10)
for k, (n, c, t, g, f, d) in enumerate(rows):
    y = py0 + 52 + k * 14
    ax.text(cols[0], y, n, fontsize=8.5, fontfamily=SERIF, fontweight="bold", color=c, zorder=10)
    for j, v in enumerate([t, g, f]):
        ax.text(cols[j + 1], y, v, fontsize=7.5, fontfamily=SERIF, color=INK, zorder=10)
    ax.text(cols[4], y, d, fontsize=6.6, fontfamily=SERIF, color=INK, zorder=10)
notes = [
    "COAST GUNS  Every Japanese port now has two 12 cm/45 coast guns (15,000 m): Nagumo, Ugaki, and Kondō and Inoue (no longer unarmed).",
    "TORPEDO BOATS  Two Type T-14s each at Port Nagumo, Port Ugaki, Airbases Ōnishi and Fukudome, Depots Mikawa and Kurita.",
    "SUPPLY RUNS  Port Ugaki ↔ Depot Mikawa by freighter through a dredged, buoyed channel (it restocks the T-14s' torpedoes);",
    "    PT Base Halsey ↔ Depot Nimitz by Liberty ship. Sinking the freighter stops the enemy's resupply. Allied ships are not to be engaged.",
    "NAMES  Adm. Matome Ugaki, Adm. Kakuji Kakuta (IJN); Adm. William F. Halsey, Adm. Chester W. Nimitz (USN).",
]
for k, s in enumerate(notes):
    ax.text(px0 + 12, py0 + 116 + k * 12.5, s, fontsize=7.2, fontfamily=SERIF, color=INK, zorder=10)

fig.savefig("/tmp/_amend_overlay.pdf", transparent=True)

src, out = sys.argv[1], sys.argv[2]
w = PdfWriter(clone_from=src)
page = w.pages[0]
# take the first edition's IJN AGUNI label out: its leader and arrow, its box and its three lines of text, one run in the page's
# drawing that starts at the leader (its first point is unique) and ends after the label's third text block
data = page.get_contents().get_data().decode("latin-1")
a = data.rfind("1 J 0.8 w /DeviceRGB cs", 0, data.find("764.469775 511.698205 m"))
k = a
for _ in range(3):
    k = data.find("ET\nQ", data.find("cm\nBT", k)) + 4
assert 0 < a < k and k - a < 6000 and "D) 0.4886936497 (E) -0.1426587003 (P)" not in data[k:k + 50], (a, k)
cs = StreamObject()
cs.set_data((data[:a] + data[k:]).encode("latin-1"))
page.replace_contents(cs)
page.merge_page(PdfReader("/tmp/_amend_overlay.pdf").pages[0])
w.add_metadata({"/Title": "Aircrew briefing map, Chart No. 7, Amendment No. 1"})
with open(out, "wb") as f:
    w.write(f)
print("written", out)
