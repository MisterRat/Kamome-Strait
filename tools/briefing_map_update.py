#!/usr/bin/env python3
"""Bring the aircrew briefing map (P-51_Mustang_FS_Briefing_Map.pdf in the project root) up to date with the sites built after its first edition,
as part of the chart itself (the user, 2026-11-21: no amendment panel; the information included as normal).

  python3 tools/briefing_map_update.py <first-edition.pdf> <out.pdf>

The first edition was drawn by a matplotlib script that is not in the repo. This one takes that page, removes from its drawing what
must change (the right-hand column's tables and notes, and IJN AGUNI's label, which Airbase Kakuta now sits under), and lays over it,
in the chart's own fonts, colours and rules: the new sites on the map, two legend rows, and the column redrawn with the new rows. The chart's frame: 1 pt = 1 px at 72 dpi, the grid's squares 134.9 pt (11,000 yd), the
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


def label(x, y, lines, col, tx, ty, size=10.5, anchor=None, weight="bold"):
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
HA = (18592, 10737)  # PT Base Halsey (navus; moved 2026-11-22 to the big eastern island's west shore, its sea to the west; 30 m inland of O)
NI = (8959, 11470 - 30)  # Depot Nimitz (navusd)
CH = ((1823, 18476), (773, 20634))
RUN_JP = [(2085, 18837), (2085, 17937), (1823, 18476), (773, 20634), (452, 25752), (1284, 26096)]
RUN_US = [(18317, 11023), (17494, 11387), (9109, 12707), (9109, 11807)]
I58 = (21065, -9251)  # I-58's patrol circle (SUBS patrolC: 2.5 km round water at least 30 m deep, 6-20 km from the US base, clear of the enemy sites' guns)

# supply runs first (under the symbols)
LANE = "#2e4a66"  # the chart's merchant shipping lane: dashed slate blue
route(RUN_JP, LANE, (0, (5, 4)))
route(RUN_US, LANE, (0, (5, 4)))
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
rt = [P(2025 + u, 19175 - d) for u, d in [(-350, 520), (1000, 520), (1000, 640), (-350, 640)]]  # her racetrack (S is north here)
ax.add_patch(Polygon(rt, closed=True, fc="none", ec=RED, lw=3.2, joinstyle="round", zorder=4))
ax.add_patch(Polygon(rt, closed=True, fc=(0.75, 0.15, 0.1, 0.12), ec="none", hatch="////", zorder=4))
anchor_sym(ux, uy, RED)
label(ux, uy, ["PORT UGAKI", "Naval base  ·  " + grid(*UGc)], RED, 905, 1118, anchor=(905, 1118))
kx, ky = P(2025 + 325, 19175 - 580)
label(kx, ky, ["IJN KUME (久米)", "Ukuru-class escort — coastal patrol", "Station: PORT UGAKI"], RED, 1040, 1168, size=7.4, weight="normal")

# Airbase Kakuta: flak ring, the runway east - west, the circle
kx, ky = P(*KA)
flak(kx, ky)
ax.add_patch(Circle((kx, ky), 13, fc="none", ec=RED, lw=2.4, zorder=7))
ax.plot([kx - 1200 * S / 2 * 1.0, kx + 1200 * S / 2], [ky, ky], color=INK, lw=4.5, solid_capstyle="butt", zorder=8)
label(kx, ky, ["AIRBASE KAKUTA", "Fighter airfield  ·  " + grid(*KA)], RED, 500, 1236, anchor=(660, 1236))

# PT Base Halsey and Depot Nimitz (Allied, blue)
hx, hy = P(*HA)
anchor_sym(hx, hy, BLUE)
label(hx, hy, ["PT BASE HALSEY", "US Navy PT-boat base  ·  " + grid(*HA)], BLUE, hx + 70, hy + 6, anchor=(hx + 70, hy + 6))
nx_, ny_ = P(*NI)
depot_sym(nx_, ny_, BLUE)
label(nx_, ny_, ["DEPOT NIMITZ", "US Navy supply depot  ·  " + grid(*NI)], BLUE, 985, 1062, anchor=(985, 1062))

# the channel's and the runs' labels
mx, my = (ax0 + ax1) / 2, (ay0 + ay1) / 2
ax.text(mx - 8, my + 2, "Dredged channel\n(buoyed, 40 ft)", fontsize=9, fontstyle="italic", fontfamily=SERIF, color=INK, ha="right",
        va="center", zorder=6)
p = P(13900, 10450)  # in the strait, above the run and clear of Depot Nimitz's label
ax.text(p[0], p[1] + 10, "Liberty supply run", fontsize=8, fontstyle="italic", fontfamily=SERIF, color=LANE, ha="center", zorder=6)
p = P(900, 23500)
ax.text(p[0] + 8, p[1], "Freighter run", fontsize=8, fontstyle="italic", fontfamily=SERIF, color=LANE, ha="left", va="center", zorder=6)

# I-58's patrol area: a red dashed circle 2.5 km across, the submarine symbol (a hull and tower) and her label
ix, iy = P(*I58)
ax.add_patch(Circle((ix, iy), 2500 * S, fc=(0.75, 0.15, 0.1, 0.06), ec=RED, lw=1.6, ls=(0, (4, 3)), zorder=4))
sy = iy + 16  # the symbol in the circle's lower part (IJN UKURU's label lies over its middle)
ax.add_patch(Polygon([(ix - 13, sy), (ix - 9, sy - 2.6), (ix + 11, sy - 2.6), (ix + 14, sy), (ix + 11, sy + 2.6), (ix - 9, sy + 2.6)], closed=True, fc=RED, ec="none", zorder=7))
ax.add_patch(Polygon([(ix - 2, sy - 2.6), (ix - 1, sy - 7), (ix + 4, sy - 7), (ix + 5, sy - 2.6)], closed=True, fc=RED, ec="none", zorder=7))
label(ix, sy, ["I-58  SUBMARINE", "Type B3, six kaiten  ·  submerged patrol  ·  " + grid(*I58)], RED, ix + 48, sy + 22, size=8.6, anchor=(ix + 48, sy + 22))
# Camp Buckner (the M4A3 Sherman battalion's tank park, PLAN_M4A3_Sherman_Tank 4.5) and Beach Orange below it: Allied, blue
CB = (13100, 27700)
BO = (13300, 27200)
cx_, cy_ = P(*CB)
depot_sym(cx_, cy_, BLUE)
label(cx_, cy_, ["CAMP BUCKNER", "US Army tank park, M4A3 Shermans  ·  " + grid(*CB), "Beach Orange (landing) 500 yd north"], BLUE, cx_ + 92, cy_ - 34,
      size=8.6, anchor=(cx_ + 92, cy_ - 34))
# Submarine Base Lockwood (PLAN_Roncador_SS-301 4: an atoll, a ring reef 6-8 km across; planned): the only open water 25-35 km from PT Base
# Halsey that is 30 km from every enemy site and clear of their guns lies north-east of it (tools: the site search of 2026-11-23)
SB = (33300, -18200)
sx_, sy_ = P(*SB)
ax.add_patch(Circle((sx_, sy_), 3500 * S, fc=(0.12, 0.23, 0.43, 0.08), ec=BLUE, lw=1.6, ls=(0, (4, 3)), zorder=4))  # the atoll's reef, planned
anchor_sym(sx_, sy_, BLUE)
ss = sy_ + 22
ax.add_patch(Polygon([(sx_ - 13, ss), (sx_ - 9, ss - 2.6), (sx_ + 11, ss - 2.6), (sx_ + 14, ss), (sx_ + 11, ss + 2.6), (sx_ - 9, ss + 2.6)], closed=True, fc=BLUE, ec="none", zorder=7))
ax.add_patch(Polygon([(sx_ - 2, ss - 2.6), (sx_ - 1, ss - 7), (sx_ + 4, ss - 7), (sx_ + 5, ss - 2.6)], closed=True, fc=BLUE, ec="none", zorder=7))
label(sx_, sy_, ["SUBMARINE BASE LOCKWOOD", "US Navy submarine base (atoll, planned)  ·  " + grid(*SB), "USS Roncador's base  ·  tender in the lagoon"], BLUE,
      sx_ + 50, sy_ - 40, size=8.6, anchor=(sx_ + 50, sy_ - 40))

# IJN UKURU's label drawn again over I-58's patrol area, where the first edition has it (box 1098.3 - 1235.8 by 735.4 - 765.0): the circle
# passes behind it
ax.text(1100.9, 750.2, "IJN UKURU (鵜来)\nUkuru-class escort — coastal patrol\nStation: PORT NAGUMO", fontsize=7.4, fontfamily=[SERIF, "Noto Serif CJK JP"],
        color=RED, va="center", ha="left", linespacing=1.2, zorder=8,
        bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.3", fc="#f3e9c9", ec=RED, lw=0.7))

# IJN AGUNI's label, moved: Airbase Kakuta stands where it was (the first edition's is taken out of the page below)
ag = ax.text(812, 1306, "IJN AGUNI (粟国)\nUkuru-class escort — coastal patrol\nStation: DEPOT MIKAWA", fontsize=7.4, fontfamily=[SERIF, "Noto Serif CJK JP"],
             color=RED, va="center", ha="left", linespacing=1.2, zorder=6,
             bbox=dict(boxstyle="round,pad=0.35,rounding_size=0.3", fc="#f3e9c9", ec=RED, lw=0.7))
ax.annotate("", xy=(841.8, 1237.4), xytext=(836, 1290), arrowprops=dict(arrowstyle="-|>", color=RED, lw=0.8, mutation_scale=8), zorder=5)

# ---- the legend: two rows more, under its last (31 pt apart, as the chart's) ----
LY = 532.8 + 30.96
anchor_sym(1692 - 9, LY, BLUE)
depot_sym(1692 + 13, LY, BLUE)
ax.text(1728, LY, "Allied naval base / supply depot", fontsize=7.8, fontfamily=SERIF, color=INK, va="center", zorder=6)
ax.plot([2117, 2160], [LY - 2.2, LY - 2.2], color=INK, lw=1.0, zorder=6)
ax.plot([2117, 2160], [LY + 2.2, LY + 2.2], color=INK, lw=1.0, zorder=6)
for k in range(4):
    ax.add_patch(Circle((2120 + k * 13, LY - 4.2), 1.4, fc="#b8302a", ec="none", zorder=6))
    ax.add_patch(Circle((2120 + k * 13, LY + 4.2), 1.4, fc="#2f7a3a", ec="none", zorder=6))
ax.text(2174, LY, "Dredged channel (buoyed)", fontsize=7.8, fontfamily=SERIF, color=INK, va="center", zorder=6)

# ---- the right-hand column, redrawn with the new rows (the first edition's fonts, sizes, colours and rules) ----
C0, C1 = 1659.6, 2552.4
MONO, SERIFB = "Liberation Mono", "DejaVu Serif"


def T(x, y, s, size, col=INK, fam=SERIF, w="normal", st="normal", **k):
    ax.text(x, y, s, fontsize=size, fontfamily=fam, fontweight=w, fontstyle=st, color=col, va="baseline", ha=k.get("ha", "left"), zorder=6)


def heading(y, s):
    T(C0, y, s, 14.125, w="bold")
    ax.plot([C0, C1], [y + 8.6, y + 8.6], color=INK, lw=1.0, zorder=6)
    ax.plot([C0, C1], [y + 11.5, y + 11.5], color=INK, lw=0.4, zorder=6)


def rule(y):
    ax.plot([C0, C1], [y, y], color=INK, lw=0.3, alpha=0.8, zorder=6)


ENEMY = [
    ("AIRBASE YAMAMOTO", "Adm. Isoroku Yamamoto", "Airbase", "F5", "021°T  3.4 nm", "2 × Type 96 25 mm twin, 1 searchlight"),
    ("AIRBASE ŌNISHI", "Adm. Takijirō Ōnishi", "Airbase", "F3", "356°T  14.0 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("AIRBASE FUKUDOME", "Adm. Shigeru Fukudome", "Airbase", "I9", "141°T  23.5 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("AIRBASE KAKUTA", "Adm. Kakuji Kakuta", "Airbase", grid(*KA), frm(*KA), "2 × Type 96 25 mm twin, 2 searchlights"),
    ("DEPOT TANAKA", "Adm. Raizō Tanaka", "Depot", "F6", "067°T  2.1 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("DEPOT KUSAKA", "Adm. Ryūnosuke Kusaka", "Depot", "G6", "055°T  3.6 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("DEPOT MIKAWA", "Adm. Gunichi Mikawa", "Depot", "F9", "176°T  14.6 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("DEPOT KURITA", "Adm. Takeo Kurita", "Depot", "D4", "313°T  14.7 nm", "2 × Type 96 25 mm twin, 2 searchlights"),
    ("PORT NAGUMO", "Adm. Chūichi Nagumo", "Naval harbour", "F5", "017°T  3.7 nm", "2 × Type 96 25 mm twin, 1 searchlight, 8 cm coast gun"),
    ("PORT UGAKI", "Adm. Matome Ugaki", "Naval base", grid(*UGc), frm(*UGc), "3 × Type 96 25 mm twin, 1 searchlight, 8 cm coast gun"),
    ("PORT KONDŌ", "Adm. Nobutake Kondō", "Colonial harbour", "D3", "326°T  20.2 nm", "2 × 8 cm coast guns"),
    ("PORT INOUE", "Adm. Shigeyoshi Inoue", "Colonial harbour", "E8", "212°T  11.9 nm", "2 × 8 cm coast guns"),
]
ALLIED = [
    ("FLETCHER FIELD", "USAAF fighter strip; N–S runway 7,500 ft; P-51 Mustangs. Base of departure.", "F6", "—"),
    ("KAMOME FIELD", "Island emergency strip; runway 07/25, 4,300 ft; tower, two hangars, KMM beacon.", "E2", "341°T  22.9 nm"),
    ("PT BASE HALSEY", "US Navy PT-boat base: PT-107, 108 and 110; PCE-842's berth. Ships rearm and refuel here.", grid(*HA), frm(*HA)),
    ("DEPOT NIMITZ", "US Navy supply depot; its Liberty ship supplies PT Base Halsey.", grid(*NI), frm(*NI)),
    ("USS PCE-842", "US Navy patrol craft escort (PCE-842 class, 184 ft), working the coast off PT Base Halsey.", grid(*HA), "—"),
    ("USS RONCADOR", "US Navy fleet submarine (SS-301, Balao class, 312 ft), based at Sub Base Lockwood.", grid(*SB), frm(*SB)),
    ("CAMP BUCKNER", "US Army tank park: M4A3 Shermans (75 mm), M32 recovery; Beach Orange and Buckner Range by it.", grid(*CB), frm(*CB)),
    ("SUB BASE LOCKWOOD", "US Navy submarine base on an atoll (planned): Fulton-class tender, fleet boats, airstrip.", grid(*SB), frm(*SB)),
]
PATROL = [
    ("UKURU", "鵜来", "PORT NAGUMO", "F5", "1.0 nm  ·  16 kt"),
    ("AMAMI", "奄美", "AIRBASE ŌNISHI", "F3", "0.7 nm  ·  16 kt"),
    ("OKINAWA", "沖縄", "AIRBASE FUKUDOME", "I9", "1.0 nm  ·  16 kt"),
    ("AGUNI", "粟国", "DEPOT MIKAWA", "F9", "0.3 nm  ·  16 kt"),
    ("SHINNAN", "新南", "DEPOT KURITA", "D4", "0.3 nm  ·  16 kt"),
    ("KUME", "久米", "PORT UGAKI", grid(*UGc), "0.7 nm  ·  16 kt"),
]
NOTES = [
    "GRID  Squares of 11,000 yards: columns A–K west to east, rows 1–11 north to south. Bearings are true, taken from Fletcher Field.",
    "FLAK  Red rings show the 1.5 nm range of each armed site. The twin 25 mm guns are hand-trained and poor beyond about 2,200 yards.",
    "COAST  The ports' 8 cm/40 coast guns reach 10,000 m by day (about 3,000 m at night); dual purpose, they also fire on aircraft.",
    "LIGHTS  Each airbase and depot has two searchlights, reach about 4 nm at night.",
    "PATROLS  Escorts patrol a racetrack of 0.3–1.0 nm off their station at 16 kt (ship symbols enlarged so they can be read).",
    "ROADS  Depots and airbases are linked by paved road; harbours are linked to the villages by native track. Bases across open water",
    "       are supplied by sea (Port Ugaki from Depot Mikawa by freighter, through a dredged, buoyed channel); a bridge only over a short span.",
    "FLAGS  The Rising Sun is the Japanese flag; the Stars and Stripes is the American flag.",
]
y = 596.0
heading(y, "ENEMY FACILITIES")
for x, h in zip([C0, 1879.2, 2016.0, 2073.6, 2163.6], ["NAME", "TYPE", "GRID", "FROM FLETCHER", "DEFENCES"]):
    T(x, y + 28.5, h, 8.362, fam=MONO, w="bold")
y += 49.5
for n, adm, ty, g, fr, d in ENEMY:
    T(C0, y, n, 10.509, col=RED, w="bold")
    T(C0, y + 9.4, adm, 7.232, st="italic")
    T(1879.2, y - 0.4, ty, 9.04)
    T(2016.0, y - 0.5, g, 9.718, fam=MONO, w="bold")
    T(2073.6, y - 0.7, fr, 8.588, fam=MONO)
    T(2163.6, y - 0.8, d, 7.232)
    rule(y + 12.4)
    y += 21.6  # (23.2 in the first edition: tightened for I-58 and Roncador)
y += 2
heading(y, "ALLIED FACILITIES")
y += 31.5
for n, desc, g, fr in ALLIED:
    T(C0, y, n, 10.509, col=BLUE, w="bold")
    T(1814.4, y - 0.7, desc, 7.797)
    T(2250.0, y - 0.5, g, 9.718, fam=MONO, w="bold")
    T(2300.4, y - 0.9, fr, 8.362, fam=MONO)
    rule(y + 9.0)
    y += 16.8
y += 6
heading(y, "ENEMY COASTAL PATROL VESSELS  (Ukuru-class kaibōkan)")
for x, h in zip([C0, 1846.8, 2098.8, 2235.6], ["SHIP", "STATION", "PATROL AREA", "RACETRACK"]):
    T(x, y + 29.5, h, 8.362, fam=MONO, w="bold")
y += 50.5
for n, kj, st, g, rt_ in PATROL:
    T(C0, y, n, 10.509, col=RED, w="bold")
    T(1764.0, y + 1.1, kj, 10.17, col=RED, fam="Noto Serif CJK JP")
    T(1846.8, y - 0.4, st, 9.04)
    T(2098.8, y - 0.6, g, 9.718, fam=MONO, w="bold")
    T(2235.6, y - 0.5, rt_, 8.588, fam=MONO)
    rule(y + 9.0)
    y += 17.5
y += 3.0
T(C0, y, "Ukuru class escort: 940 tons, 255 ft, 19.5 kt; three 12 cm DP guns, Type 96 25 mm twin AA, depth charges; crew about 150.", 7.458, st="italic")
T(C0, y + 11.5, "Type T-14 motor torpedo boats, two at each of Port Nagumo, Port Ugaki, Airbases Ōnishi and Fukudome, Depots Mikawa and Kurita: 15 m, 33 kt; two 45 cm torpedoes, one 25 mm.", 7.458, st="italic")
T(C0, y + 23.0, "Submarine I-58 (Type B3, 357 ft, May 1945): six kaiten on deck, snorkel; patrols submerged at 4 kt in " + grid(*I58) + ", attacks with 53 cm Type 95 torpedoes from 3,300 yd.", 7.458, st="italic")
y += 46.0
heading(y, "NOTES")
y += 29.5
for s in NOTES:
    T(C0, y, s, 7.91, fam=MONO)
    y += 11.4
COL_END = y - 11.4
assert COL_END < 1406, COL_END  # clear of the ENGAGEMENT box (its top at 1412.6)
print("column ends at", round(COL_END, 1))
# ---- WEATHERING (the user's, 2026-11-23: more wear at the edges): a map carried in a flight-suit pocket and pinned to briefing-room
# walls. Over everything, as one translucent layer: the edges browned and scuffed (deepest at the corners), small nicks and tears along
# them, two water tide-marks, foxing spots near the edges, and the fold lines worn where they meet the edge. Seeded: the same each time.
def weathering():
    import numpy as np
    from scipy.ndimage import gaussian_filter, zoom
    rng = np.random.default_rng(1945)
    h, w = H // 2, W // 2  # drawn at half size, smoothed up

    def noise(sc, amp=1.0):
        n = rng.random((h // sc + 2, w // sc + 2))
        return zoom(n, (h / n.shape[0] + 0.01, w / n.shape[1] + 0.01), order=3)[:h, :w] * amp

    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    edge = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy])
    corner = np.minimum.reduce([np.hypot(xx, yy), np.hypot(w - xx, yy), np.hypot(xx, h - yy), np.hypot(w - xx, h - yy)])
    n1 = noise(40) * 0.6 + noise(12) * 0.3 + noise(4) * 0.1
    # browning: a ragged band 30-75 px (full size) in from the edge, darker at the corners
    band = 28 + 36 * n1 + np.clip(80 - corner / 5, 0, 60)
    a = np.clip(1 - edge / band, 0, 1) ** 1.35 * 0.78
    a = np.maximum(a, np.clip(1 - edge / 3.5, 0, 1) * 0.85)  # the very edge, worn dark
    # scuffs: lighter, rubbed patches just inside the brown, where the ink has worn
    rub = np.clip(1 - np.abs(edge - band * 1.3) / 10, 0, 1) * (noise(25) > 0.62) * 0.18
    # nicks and short tears: dark notches into the edge
    tear = np.zeros((h, w))
    for _ in range(80):
        side = rng.integers(4)
        t = rng.random()
        L = rng.uniform(5, 26)
        wd = rng.uniform(1.5, 5)
        if side == 0:
            cx, cy, dx, dy = t * w, 0, 0, 1
        elif side == 1:
            cx, cy, dx, dy = t * w, h - 1, 0, -1
        elif side == 2:
            cx, cy, dx, dy = 0, t * h, 1, 0
        else:
            cx, cy, dx, dy = w - 1, t * h, -1, 0
        ang = rng.uniform(-0.5, 0.5)
        ux, uy = dx * np.cos(ang) - dy * np.sin(ang), dx * np.sin(ang) + dy * np.cos(ang)
        along = (xx - cx) * ux + (yy - cy) * uy
        across = np.abs(-(xx - cx) * uy + (yy - cy) * ux)
        tear = np.maximum(tear, ((along > 0) & (along < L) & (across < wd * (1 - along / L) + 0.6)).astype(float))
    tear = gaussian_filter(tear, 0.6)
    # water stains: tide-mark rings with a faint fill (one near the lower left, one on the upper right margin)
    stain = np.zeros((h, w))
    for (sx, sy, r) in [(w * 0.10, h * 0.86, 70), (w * 0.93, h * 0.12, 55), (w * 0.62, h * 0.97, 40)]:
        d = np.hypot(xx - sx, (yy - sy) * 1.15) / (r * (0.85 + 0.3 * noise(30)))
        stain = np.maximum(stain, np.clip(1 - np.abs(d - 1) * 14, 0, 1) * 0.35 + (d < 1) * 0.07)
    # foxing: small brown spots, thicker near the edges
    fox = np.zeros((h, w))
    for _ in range(900):
        x, y = rng.random() * w, rng.random() * h
        e = min(x, y, w - x, h - y)
        if rng.random() > np.exp(-e / 140):
            continue
        r = rng.uniform(0.6, 2.4)
        y0, y1, x0, x1 = int(max(0, y - 4)), int(min(h, y + 5)), int(max(0, x - 4)), int(min(w, x + 5))
        fox[y0:y1, x0:x1] = np.maximum(fox[y0:y1, x0:x1], np.clip(1 - np.hypot(xx[y0:y1, x0:x1] - x, yy[y0:y1, x0:x1] - y) / r, 0, 1) * rng.uniform(0.2, 0.5))
    # the folds (the first edition's thirds and halves) worn where they reach the edges
    fold = np.zeros((h, w))
    for fx in (w / 3, 2 * w / 3):
        fold = np.maximum(fold, np.clip(1 - np.abs(xx - fx) / 2.5, 0, 1) * np.clip(1 - np.minimum(yy, h - yy) / 120, 0, 1) * 0.35)
    fy = h / 2
    fold = np.maximum(fold, np.clip(1 - np.abs(yy - fy) / 2.5, 0, 1) * np.clip(1 - np.minimum(xx, w - xx) / 120, 0, 1) * 0.35)
    alpha = np.clip(np.maximum.reduce([a, tear * 0.85, stain, fox, fold]) * (0.85 + 0.3 * noise(6)), 0, 0.9)
    col = np.zeros((h, w, 3))
    brown = np.array([0.36, 0.24, 0.12])
    col[:] = brown
    col = col * (1 - 0.35 * tear[..., None])  # the tears darker (the board behind)
    img = np.dstack([col, alpha])
    # the rubbed patches: a pale layer
    img2 = np.dstack([np.ones((h, w, 3)) * np.array([0.93, 0.88, 0.75]), rub])
    up = lambda im: zoom(im, (2, 2, 1), order=1)
    ax.imshow(up(img2), extent=(0, W, H, 0), zorder=19, interpolation="bilinear")
    ax.imshow(up(img), extent=(0, W, H, 0), zorder=20, interpolation="bilinear")


weathering()
fig.savefig("/tmp/_map_overlay.pdf", transparent=True)

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
data = data[:a] + data[k:]
# take the right-hand column out (its tables and notes, between the legend and the ENGAGEMENT box): every text block and every path
# lying wholly in that box; the page's background, the fold lines and the faint compass rose cross it and stay
X0C, Y0C, Y1C = 1645.0, H - 1410.0, H - 548.0  # PDF coordinates (origin bottom left)
NUM = r"-?[\d.]+"
keep, i, removed = [], 0, 0
txt = re.compile(r"q\n1 0 -?0 1 (" + NUM + r") (" + NUM + r") cm\nBT\n.*?ET\nQ\n", re.S)
path = re.compile(r"((?:" + NUM + r" ){2,6}(?:m|l|c|v|y)\n|(?:" + NUM + r" ){4}re\n|h\n|\n)+(S|s|f\*?|F|B\*?|b\*?|n)\n")
inbox = lambda x, y: x >= X0C and Y0C <= y <= Y1C
while i < len(data):
    m = txt.match(data, i)
    if m:
        if inbox(float(m.group(1)), float(m.group(2))):
            removed += 1
        else:
            keep.append(m.group(0))
        i = m.end()
        continue
    m = path.match(data, i)
    if m and m.group(0).strip():
        nums = [float(v) for v in re.findall(NUM, m.group(0))]
        pts = list(zip(nums[0::2], nums[1::2]))
        if pts and all(inbox(x, y) for x, y in pts) and " re\n" not in m.group(0):
            removed += 1
        else:
            keep.append(m.group(0))
        i = m.end()
        continue
    j = data.find("\n", i) + 1 or len(data)
    keep.append(data[i:j])
    i = j
data = "".join(keep)
print("removed from the first edition:", removed)
cs = StreamObject()
cs.set_data(data.encode("latin-1"))
page.replace_contents(cs)
page.merge_page(PdfReader("/tmp/_map_overlay.pdf").pages[0])
w.add_metadata({"/Title": "Aircrew briefing map, Chart No. 7"})
with open(out, "wb") as f:
    w.write(f)
print("written", out)
