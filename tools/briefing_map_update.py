#!/usr/bin/env python3
"""Bring the aircrew briefing map (docs/P-51_Mustang_FS_Briefing_Map.pdf) up to date with the sites built after its first edition,
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
HA = (1675, 10925 - 30)  # PT Base Halsey (navus)
NI = (8959, 11470 - 30)  # Depot Nimitz (navusd)
CH = ((1823, 18476), (773, 20634))
RUN_JP = [(2085, 18837), (2085, 17937), (1823, 18476), (773, 20634), (452, 25752), (1284, 26096)]
RUN_US = [(1825, 11262), (1825, 12162), (9109, 12707), (9109, 11807)]

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
label(hx, hy, ["PT BASE HALSEY", "US Navy PT-boat base  ·  " + grid(*HA)], BLUE, 880, 1000, anchor=(880, 1000))
nx_, ny_ = P(*NI)
depot_sym(nx_, ny_, BLUE)
label(nx_, ny_, ["DEPOT NIMITZ", "US Navy supply depot  ·  " + grid(*NI)], BLUE, 985, 1062, anchor=(985, 1062))

# the channel's and the runs' labels
mx, my = (ax0 + ax1) / 2, (ay0 + ay1) / 2
ax.text(mx - 8, my + 2, "Dredged channel\n(buoyed, 40 ft)", fontsize=9, fontstyle="italic", fontfamily=SERIF, color=INK, ha="right",
        va="center", zorder=6)
p = P(5200, 12500)
ax.text(p[0], p[1] + 10, "Liberty supply run", fontsize=8, fontstyle="italic", fontfamily=SERIF, color=LANE, ha="center", zorder=6)
p = P(900, 23500)
ax.text(p[0] + 8, p[1], "Freighter run", fontsize=8, fontstyle="italic", fontfamily=SERIF, color=LANE, ha="left", va="center", zorder=6)

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
    ("PORT NAGUMO", "Adm. Chūichi Nagumo", "Naval harbour", "F5", "017°T  3.7 nm", "2 × Type 96 25 mm twin, 1 searchlight, 12 cm coast gun"),
    ("PORT UGAKI", "Adm. Matome Ugaki", "Naval base", grid(*UGc), frm(*UGc), "3 × Type 96 25 mm twin, 1 searchlight, 12 cm coast gun"),
    ("PORT KONDŌ", "Adm. Nobutake Kondō", "Colonial harbour", "D3", "326°T  20.2 nm", "2 × 12 cm coast guns"),
    ("PORT INOUE", "Adm. Shigeyoshi Inoue", "Colonial harbour", "E8", "212°T  11.9 nm", "2 × 12 cm coast guns"),
]
ALLIED = [
    ("FLETCHER FIELD", "USAAF fighter strip; N–S runway 7,500 ft; P-51 Mustangs. Base of departure.", "F6", "—"),
    ("KAMOME FIELD", "Island emergency strip; runway 07/25, 4,300 ft; tower, two hangars, KMM beacon.", "E2", "341°T  22.9 nm"),
    ("PT BASE HALSEY", "US Navy PT-boat base: PT-107, 108 and 110; PCE-842's berth. Ships rearm and refuel here.", grid(*HA), frm(*HA)),
    ("DEPOT NIMITZ", "US Navy supply depot; its Liberty ship supplies PT Base Halsey.", grid(*NI), frm(*NI)),
    ("USS PCE-842", "US Navy patrol craft escort (PCE-842 class, 184 ft), working the coast off PT Base Halsey.", grid(*HA), "—"),
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
    "COAST  The ports' 12 cm/45 coast guns reach 15,000 m by day (about 3,000 m at night) and engage shipping only.",
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
    rule(y + 12.6)
    y += 23.2
y += 6
heading(y, "ALLIED FACILITIES")
y += 31.5
for n, desc, g, fr in ALLIED:
    T(C0, y, n, 10.509, col=BLUE, w="bold")
    T(1814.4, y - 0.7, desc, 7.797)
    T(2250.0, y - 0.5, g, 9.718, fam=MONO, w="bold")
    T(2300.4, y - 0.9, fr, 8.362, fam=MONO)
    rule(y + 10.2)
    y += 20.5
y += 10
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
    rule(y + 9.4)
    y += 19.5
y += 4.5
T(C0, y, "Ukuru class escort: 940 tons, 255 ft, 19.5 kt; three 12 cm DP guns, Type 96 25 mm twin AA, depth charges; crew about 150.", 7.458, st="italic")
T(C0, y + 11.5, "Type T-14 motor torpedo boats, two at each of Port Nagumo, Port Ugaki, Airbases Ōnishi and Fukudome, Depots Mikawa and Kurita: 15 m, 33 kt; two 45 cm torpedoes, one 25 mm.", 7.458, st="italic")
y += 37
heading(y, "NOTES")
y += 29.5
for s in NOTES:
    T(C0, y, s, 7.91, fam=MONO)
    y += 12.6
COL_END = y - 12.6
assert COL_END < 1406, COL_END  # clear of the ENGAGEMENT box (its top at 1412.6)
print("column ends at", round(COL_END, 1))
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
