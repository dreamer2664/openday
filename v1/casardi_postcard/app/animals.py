"""
Animal companions — same pixel grammar as the characters (74x100 grid,
soles on y=97) so they can be placed beside the character with coherent
scale, lighting and ground shadow.

Each animal has: 2-3 real colour variants and 2 poses.  Every animal is drawn
in profile facing right; the composer mirrors it when the layout needs it.
"""
from __future__ import annotations

from .sprite_geometry import capsule

W,H=74,100
CX,GROUND=37,97
from .palette import ramp
from .pixel import PixelCanvas

ANIMALS = {
    "gatto": {
        "label": "Gatto",
        "variants": [("soriano", "Soriano", "#c98b4b"), ("nero", "Nero", "#2f2b33"),
                     ("bianco", "Bianco", "#e5dfd2"), ("grigio", "Grigio tigrato", "#8b8f96")],
        "poses": ["seduto", "in_piedi"],
    },
    "cane": {
        "label": "Cane",
        "variants": [("cucciolo", "Cucciolo caramello", "#b8793f"), ("nero", "Nero focato", "#3a3330"),
                     ("bianco", "Bianco", "#e2dbcc")],
        "poses": ["seduto", "in_piedi"],
    },
    "volpe": {
        "label": "Volpe",
        "variants": [("rossa", "Rossa", "#c05a2a"), ("argento", "Argentata", "#7c8290")],
        "poses": ["seduto", "accovacciato"],
    },
    "gufo": {
        "label": "Gufo",
        "variants": [("comune", "Comune", "#8a6a45"), ("neve", "Nevato", "#d9d3c4")],
        "poses": ["posato", "ali"],
    },
    "coniglio": {
        "label": "Coniglio",
        "variants": [("grigio", "Grigio", "#a8a29a"), ("bianco", "Bianco", "#e6e1d6"),
                     ("marrone", "Marrone", "#8b6a4c")],
        "poses": ["seduto", "in_piedi"],
    },
    "corvo": {
        "label": "Corvo",
        "variants": [("nero", "Nero", "#2b2b38"), ("blu", "Blu notte", "#2f3f5e")],
        "poses": ["posato", "ali"],
    },
    "tartaruga": {
        "label": "Tartaruga",
        "variants": [("verde", "Verde", "#5d7a3a"), ("marrone", "Terracotta", "#8a6a3a")],
        "poses": ["cammina", "ritirata"],
    },
    "drago": {
        "label": "Piccolo drago",
        "variants": [("smeraldo", "Smeraldo", "#3f7a52"), ("rubino", "Rubino", "#8a3a4a"),
                     ("ambra", "Ambra", "#b0823a")],
        "poses": ["seduto", "ali"],
    },
}


def _pal(variant_hex):
    return ramp(variant_hex)


def _eyes(c, x, y, scale=1.0, kind="round"):
    if kind == "round":
        c.rect(x - 1, y - 1, x + 1, y + 1, (250, 246, 240, 255))
        c.rect(x, y - 1, x + 1, y + 1, (32, 26, 32, 255))
        c.set(int(x + 1), int(y - 1), (255, 255, 255, 255))
    elif kind == "bird":
        c.rect(x - 1, y, x + 1, y + 1, (246, 238, 210, 255))
        c.set(int(x), int(y), (26, 22, 26, 255))
    elif kind == "lazy":
        c.hline(int(x - 1), int(x + 1), int(y), (40, 32, 36, 255))


def draw_animal(kind: str, variant: str = "", pose: str = "", style: str = "photo") -> PixelCanvas:
    c = PixelCanvas(W, H)
    info = ANIMALS.get(kind, ANIMALS["gatto"])
    variant = variant or info["variants"][0][0]
    hexv = info["variants"][0][2]
    for k, _lab, hx in info["variants"]:
        if k == variant:
            hexv = hx
    pose = pose or info["poses"][0]
    L2, L1, M, H1, H2 = _pal(hexv)
    dark = (44, 36, 40, 255) if style != "nes" else (16, 14, 20, 255)
    base = GROUND - 1

    if kind == "gatto":
        _cat(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "cane":
        _dog(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "volpe":
        _fox(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "gufo":
        _owl(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "coniglio":
        _rabbit(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "corvo":
        _crow(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "tartaruga":
        _turtle(c, pose, L2, L1, M, H1, H2, base)
    elif kind == "drago":
        _dragon(c, pose, L2, L1, M, H1, H2, base)

    # Real coat markings, not additional geometry claims: tabby stripes and
    # the tan points of the dark dog are painted only inside the fur mask.
    markings = PixelCanvas(W,H)
    if kind == "gatto" and variant in ("soriano","grigio"):
        x=CX-1
        if pose == "seduto":
            for xx,yy in ((x-8,base-13),(x-4,base-16),(x+1,base-20),(x+4,base-28)):
                markings.line(xx,yy,xx+2,yy+3,L1,1)
        else:
            for xx in (x-6,x-1,x+4): markings.line(xx,base-14,xx+1,base-8,L1,1)
    if kind == "cane" and variant == "nero":
        tan=ramp("#ac744b")
        if pose == "seduto":
            markings.rect(38,91,43,95,tan[2]);markings.rect(44,79,49,83,tan[2])
            markings.hline(41,43,76,tan[3])
        else:
            for xx in (27,31,36,39):markings.rect(xx,92,xx+1,96,tan[2])
            markings.rect(44,76,49,80,tan[2])
    fur={L2,L1,M,H1,H2}
    for i,paint in enumerate(markings.buf):
        if paint[3] and c.buf[i] in fur: c.buf[i]=paint
    c.outline_all(dark)
    if style == "nes":
        def q(v):
            v = min(255, max(0, int((v - 128) * 1.20 + 132)))
            return min(255, max(0, int(round(v / 42.5)) * 42 + 21))
        for i, px in enumerate(c.buf):
            if px[3]:
                c.buf[i] = (q(px[0]), q(px[1]), q(px[2]), px[3])
    return c


# ---------------------------------------------------------------------------
def _cat(c, pose, L2, L1, M, H1, H2, base):
    x = CX - 1
    pink = (208, 146, 148, 255)
    ruff = (236, 226, 212, 255)
    if pose == "seduto":
        # tail curling around the feet
        c.thick_curve([(x - 11, base - 2), (x - 2, base - 2), (x + 6, base - 4)], M, 2)
        c.thick_curve([(x - 11, base - 2), (x - 4, base - 2)], H1, 1)
        # hind haunch + body
        c.ellipse(x - 5, base - 8, 7.5, 7.0, M)
        c.ellipse(x - 6, base - 9, 5.0, 4.6, H1)
        c.ellipse(x + 2, base - 13, 6.5, 10.0, M)
        c.ellipse(x + 3, base - 13, 4.6, 8.4, H1)
        c.ellipse(x + 3, base - 9, 3.6, 5.4, ruff)          # chest ruff
        # front legs
        for dx in (1.0, 5.0):
            c.rect(x + dx, base - 11, x + dx + 1.6, base - 2, M)
            c.rect(x + dx, base - 11, x + dx + 0.6, base - 2, H1)
            c.ellipse(x + dx + 0.8, base - 2.2, 2.0, 1.5, M)  # paw
        # head
        hx, hy = x + 6.0, base - 25.0
        c.ellipse(hx, hy, 5.6, 4.9, M)
        c.ellipse(hx - 0.8, hy - 1.0, 4.0, 3.0, H1)
        c.poly([(hx - 5.0, hy - 2.6), (hx - 3.6, hy - 7.4), (hx - 1.0, hy - 3.6)], M)
        c.poly([(hx + 0.6, hy - 3.8), (hx + 3.6, hy - 7.2), (hx + 4.6, hy - 2.4)], M)
        c.poly([(hx - 4.0, hy - 3.6), (hx - 3.4, hy - 6.0), (hx - 1.8, hy - 4.0)], pink)
        c.poly([(hx + 1.4, hy - 4.2), (hx + 3.4, hy - 6.0), (hx + 3.8, hy - 3.4)], pink)
        # muzzle patch
        c.ellipse(hx + 2.4, hy + 1.6, 2.8, 2.0, ruff)
        _eyes(c, int(hx + 1.0), int(hy - 0.2))
        c.set(int(hx + 4), int(hy + 1), pink)
        c.set(int(hx + 4), int(hy + 2), (86, 62, 60, 255))
    else:  # in piedi
        c.ellipse(x, base - 9, 9.0, 4.8, M)                  # body
        c.ellipse(x - 1, base - 10, 7.0, 3.4, H1)
        c.ellipse(x + 4, base - 8, 4.0, 3.0, ruff)
        for dx in (-7, -3, 2, 6):
            c.rect(x + dx, base - 6, x + dx + 1.6, base - 1, M)
            c.rect(x + dx, base - 6, x + dx + 0.6, base - 1, H1)
            c.ellipse(x + dx + 0.8, base - 1.4, 1.8, 1.2, M)
        c.thick_curve([(x - 8, base - 11), (x - 13, base - 15), (x - 13, base - 19)], M, 2)
        c.thick_curve([(x - 13, base - 15), (x - 13, base - 19)], H1, 1)
        hx, hy = x + 8.0, base - 14.0
        c.ellipse(hx, hy, 4.8, 4.2, M)
        c.ellipse(hx - 0.8, hy - 0.8, 3.2, 2.6, H1)
        c.poly([(hx - 4.0, hy - 2.4), (hx - 2.6, hy - 6.6), (hx - 0.4, hy - 3.4)], M)
        c.poly([(hx + 0.8, hy - 3.4), (hx + 3.4, hy - 6.4), (hx + 4.2, hy - 2.2)], M)
        c.poly([(hx - 3.2, hy - 3.2), (hx - 2.6, hy - 5.4), (hx - 1.2, hy - 3.6)], pink)
        c.poly([(hx + 1.6, hy - 3.6), (hx + 3.2, hy - 5.4), (hx + 3.6, hy - 3.2)], pink)
        _eyes(c, int(hx + 0.8), int(hy - 0.4))
        c.set(int(hx + 4), int(hy + 1), pink)
        c.hline(int(hx + 1), int(hx + 4), int(hy + 2), (86, 62, 60, 255))


def _dog(c, pose, L2, L1, M, H1, H2, base):
    x = CX - 3
    if pose == "seduto":
        c.ellipse(x, base - 8, 9.0, 7.5, M)               # body + haunch
        c.ellipse(x - 2, base - 9, 7.0, 6.0, H1)
        c.rect(x + 5, base - 9, x + 9, base - 1, M)       # front legs
        c.rect(x + 7, base - 9, x + 9, base - 1, L1)
        c.ellipse(x + 6, base - 2, 3.2, 1.8, M)
        c.ellipse(x + 9, base - 2, 3.0, 1.7, M)
        c.thick_curve([(x - 7, base - 4), (x - 11, base - 9), (x - 10, base - 13)], M, 2)
        hx, hy = x + 7.5, base - 17.0
        c.ellipse(hx, hy, 6.0, 5.2, M)
        c.ellipse(hx - 1.0, hy - 1.2, 4.0, 3.2, H1)
        c.ellipse(hx + 4.4, hy + 1.4, 3.2, 2.6, M)        # muzzle
        c.ellipse(hx + 5.4, hy + 0.6, 2.2, 1.6, H1)
        # floppy ears
        c.ellipse(hx - 4.2, hy + 1.4, 2.6, 4.4, L1)
        c.ellipse(hx + 2.0, hy - 4.6, 2.2, 2.0, L1)
        _eyes(c, int(hx + 1.6), int(hy - 0.4))
        c.rect(hx + 6.4, hy + 1.6, hx + 8.4, hy + 2.6, (34, 30, 34, 255))   # nose
        c.set(int(hx + 7.4), int(hy + 1.4), (240, 236, 230, 255))
        c.hline(int(hx + 5), int(hx + 8), int(hy + 4), (140, 68, 68, 255))  # mouth
    else:
        c.ellipse(x, base - 11, 9.0, 4.6, M)
        c.ellipse(x - 1, base - 12, 7.4, 3.4, H1)
        for dx in (-6, -2, 3, 6):
            c.rect(x + dx, base - 8, x + dx + 1, base - 1, M)
            c.rect(x + dx - 0.6, base - 2, x + dx + 1.8, base - 1, L1)
        c.thick_curve([(x - 8, base - 13), (x - 12, base - 17), (x - 11, base - 20)], M, 2)
        hx, hy = x + 8.0, base - 16.0
        c.ellipse(hx, hy, 5.4, 4.6, M)
        c.ellipse(hx + 3.6, hy + 1.6, 3.0, 2.4, M)
        c.ellipse(hx - 4.0, hy + 1.0, 2.4, 4.0, L1)
        _eyes(c, int(hx + 1.4), int(hy - 0.6))
        c.rect(hx + 5.4, hy + 1.6, hx + 7.2, hy + 2.6, (34, 30, 34, 255))


def _fox(c, pose, L2, L1, M, H1, H2, base):
    cream = (238, 226, 206, 255)
    x = CX - 2
    if pose == "accovacciato":
        c.ellipse(x, base - 5, 10.0, 5.2, M)              # lying down
        c.ellipse(x - 1, base - 6, 8.0, 3.6, H1)
        c.ellipse(x + 6, base - 4, 4.0, 2.6, cream)
        c.thick_curve([(x - 9, base - 6), (x - 14, base - 8), (x - 15, base - 11)], M, 3)
        c.thick_curve([(x - 14, base - 8), (x - 15, base - 11)], cream, 2)
        hx, hy = x + 6.0, base - 9.0
        c.ellipse(hx, hy, 4.6, 4.0, M)
        c.poly([(hx - 3.6, hy - 2.4), (hx - 2.4, hy - 7.0), (hx - 0.2, hy - 3.2)], M)
        c.poly([(hx + 0.8, hy - 3.4), (hx + 3.4, hy - 6.6), (hx + 4.0, hy - 2.2)], M)
        c.ellipse(hx + 3.0, hy + 1.6, 3.0, 2.0, cream)
        _eyes(c, int(hx + 0.6), int(hy))
        c.rect(hx + 5.0, hy + 1.0, hx + 6.0, hy + 1.6, (34, 30, 34, 255))
    else:
        c.ellipse(x, base - 8, 8.0, 6.4, M)
        c.ellipse(x - 1, base - 9, 6.4, 5.0, H1)
        c.ellipse(x + 3, base - 6, 5.0, 4.4, cream)       # chest
        c.rect(x + 4, base - 6, x + 7, base - 1, M)
        c.ellipse(x + 5, base - 2, 2.6, 1.6, (44, 36, 40, 255))
        c.thick_curve([(x - 7, base - 10), (x - 12, base - 12), (x - 14, base - 16),
                       (x - 12, base - 18)], M, 3)
        c.thick_curve([(x - 12, base - 12), (x - 14, base - 16), (x - 12, base - 18)], cream, 2)
        hx, hy = x + 5.0, base - 15.0
        c.ellipse(hx, hy, 5.0, 4.2, M)
        c.poly([(hx - 4.0, hy - 2.6), (hx - 2.8, hy - 7.4), (hx - 0.4, hy - 3.4)], M)
        c.poly([(hx + 1.0, hy - 3.6), (hx + 3.8, hy - 7.0), (hx + 4.4, hy - 2.4)], M)
        c.poly([(hx - 3.2, hy - 3.4), (hx - 2.6, hy - 6.0), (hx - 1.4, hy - 3.8)], (206, 140, 132, 255))
        c.poly([(hx + 2.0, hy - 3.8), (hx + 3.4, hy - 5.8), (hx + 3.8, hy - 3.4)], (206, 140, 132, 255))
        c.ellipse(hx + 3.4, hy + 1.8, 3.2, 2.2, cream)
        _eyes(c, int(hx + 0.8), int(hy))
        c.rect(hx + 5.6, hy + 1.2, hx + 6.8, hy + 1.8, (34, 30, 34, 255))
        # dark socks
        c.rect(x + 4, base - 3, x + 7, base - 1, (56, 44, 48, 255))


def _owl(c, pose, L2, L1, M, H1, H2, base):
    x = CX
    belly = (232, 220, 198, 255)
    if pose == "ali":
        c.poly([(x - 9, base - 14), (x - 16, base - 6), (x - 8, base - 4)], L1)
        c.poly([(x + 9, base - 14), (x + 16, base - 6), (x + 8, base - 4)], L1)
    c.ellipse(x, base - 10, 9.0, 9.4, M)                 # body
    c.ellipse(x, base - 8, 6.4, 7.0, belly)
    for y in range(int(base - 14), int(base - 2), 2):
        for xx in range(int(x - 5), int(x + 6), 2):
            c.set(xx + (y % 2), y, L1)
    c.ellipse(x, base - 19, 8.0, 6.4, M)                 # head
    c.poly([(x - 7.4, base - 22), (x - 6.0, base - 27.4), (x - 3.2, base - 23)], M)
    c.poly([(x + 3.2, base - 23), (x + 6.0, base - 27.4), (x + 7.4, base - 22)], M)
    for side in (-1, 1):
        ex = x + side * 3.4
        c.ellipse(ex, base - 20, 3.2, 3.0, (248, 244, 232, 255))
        c.ellipse(ex, base - 20, 1.6, 1.6, (32, 26, 30, 255))
        c.set(int(ex + 0.4), int(base - 21), (255, 255, 255, 255))
        c.ellipse(ex, base - 20.2, 3.4, 3.2, (0, 0, 0, 0)) if False else None
    c.poly([(x - 1.4, base - 18), (x + 1.4, base - 18), (x, base - 15.4)], (218, 160, 62, 255))
    c.hline(int(x - 3), int(x + 3), int(base - 25), L1)
    for side in (-1, 1):
        c.poly([(x + side * 3, base - 1), (x + side * 6, base - 1), (x + side * 6.4, base - 2)], (218, 160, 62, 255))


def _rabbit(c, pose, L2, L1, M, H1, H2, base):
    x = CX - 1
    if pose == "in_piedi":
        c.ellipse(x, base - 8, 6.4, 7.4, M)
        c.ellipse(x - 0.6, base - 9, 4.8, 5.6, H1)
        c.ellipse(x - 4.4, base - 3, 3.6, 2.4, M)
        c.ellipse(x + 4.0, base - 3, 3.2, 2.2, M)
        c.ellipse(x + 4.6, base - 6, 2.6, 3.2, M)        # front paw raised
        hx, hy = x + 1.0, base - 16.0
        c.ellipse(hx, hy, 4.8, 4.4, M)
        for side in (-1, 1):
            c.ellipse(hx + side * 2.2, hy - 6.4, 1.7, 5.2, M)
            c.ellipse(hx + side * 2.2, hy - 6.4, 0.9, 3.8, (212, 158, 158, 255))
        _eyes(c, int(hx + 0.6), int(hy - 0.4))
        c.set(int(hx + 3.4), int(hy + 1.4), (212, 138, 140, 255))
        c.hline(int(hx + 2), int(hx + 4), int(hy + 2.4), (240, 236, 230, 255))
    else:
        c.ellipse(x, base - 6, 7.4, 5.6, M)
        c.ellipse(x - 0.8, base - 7, 5.6, 4.2, H1)
        c.ellipse(x - 5.0, base - 2, 3.0, 1.8, M)
        hx, hy = x + 5.0, base - 10.0
        c.ellipse(hx, hy, 4.4, 4.0, M)
        c.ellipse(hx + 2.6, hy + 1.2, 2.4, 1.8, H1)
        for side in (-1, 1):
            c.ellipse(hx + side * 1.8 - 0.4, hy - 5.8, 1.6, 4.6, M)
            c.ellipse(hx + side * 1.8 - 0.4, hy - 5.8, 0.8, 3.2, (212, 158, 158, 255))
        _eyes(c, int(hx + 1.0), int(hy - 0.6))
        c.set(int(hx + 3.6), int(hy + 1.2), (212, 138, 140, 255))
        c.ellipse(x - 7.4, base - 5, 2.2, 2.0, H1)        # tail


def _crow(c, pose, L2, L1, M, H1, H2, base):
    x = CX
    beak = (226, 176, 66, 255)
    if pose == "ali":
        c.poly([(x - 6, base - 14), (x - 18, base - 20), (x - 12, base - 6), (x - 4, base - 8)], L1)
        c.poly([(x + 4, base - 13), (x + 15, base - 18), (x + 10, base - 5)], H1)
    c.ellipse(x, base - 11, 5.6, 7.4, M)                 # body
    c.ellipse(x - 0.6, base - 12, 3.6, 5.2, H1)
    c.poly([(x - 5, base - 6), (x - 9, base - 1), (x - 1, base - 2)], L1)   # tail
    c.ellipse(x + 1, base - 19, 4.0, 3.8, M)             # head
    c.poly([(x + 4.2, base - 19.6), (x + 9.4, base - 18.2), (x + 4.2, base - 17)], beak)
    c.poly([(x + 4.2, base - 19.6), (x + 9.4, base - 18.2), (x + 4.2, base - 18.6)], (186, 138, 48, 255))
    _eyes(c, int(x + 2.6), int(base - 20), kind="bird")
    for side in (-1, 1):
        c.rect(x + side * 1.6 - 0.5, base - 2, x + side * 1.6 + 0.5, base - 1, beak)


def _turtle(c, pose, L2, L1, M, H1, H2, base):
    x = CX
    rim = ramp("#a88b52")
    skin = (156, 146, 104, 255)
    skin_l = (176, 166, 122, 255)
    if pose == "ritirata":
        c.ellipse(x, base - 7, 11.5, 6.8, M)
        c.ellipse(x, base - 8, 9.6, 5.2, H1)
        for i in range(-2, 3):
            c.ellipse(x + i * 3.6, base - 8, 1.8, 1.5, L1)
            c.ellipse(x + i * 3.6, base - 8.4, 1.0, 0.8, M)
        c.hline(int(x - 10), int(x + 10), int(base - 3), rim[1])
        c.ellipse(x, base - 7, 6.0, 2.6, L2)
        return
    # legs first, then shell, then head on top
    for side in (-1, 1):
        c.ellipse(x + side * 8.4, base - 3, 3.6, 2.8, skin)
        c.rect(x + side * 8.4 - 1, base - 3, x + side * 8.4 + 1, base - 1, skin)
    c.ellipse(x - 13.4, base - 3, 2.6, 2.0, skin)          # tail
    c.ellipse(x, base - 7, 10.0, 6.2, rim[2])              # shell rim
    c.ellipse(x, base - 8, 8.6, 5.0, M)                    # shell dome
    c.ellipse(x - 1, base - 9, 6.6, 3.4, H1)
    for i in range(-2, 3):
        c.ellipse(x + i * 3.2, base - 8.6, 1.9, 1.6, L1)
        c.ellipse(x + i * 3.2, base - 9.0, 1.0, 0.8, M)
    # head + neck
    c.rect(x + 8, base - 7, x + 11, base - 4, skin)
    c.ellipse(x + 12.6, base - 8, 3.6, 2.9, skin_l)
    c.ellipse(x + 11.6, base - 9, 2.4, 1.8, skin)
    _eyes(c, int(x + 13.6), int(base - 8.6), kind="lazy")
    c.set(int(x + 15.4), int(base - 7.4), (100, 92, 68, 255))
    c.hline(int(x + 10), int(x + 14), int(base - 5.4), (132, 122, 88, 255))


def _dragon(c, pose, L2, L1, M, H1, H2, base):
    x = CX - 2
    wing = ramp("#c2a06a")
    belly = (234, 216, 172, 255)
    horn = (224, 214, 186, 255)
    # tail
    c.thick_curve([(x - 5, base - 5), (x - 11, base - 7), (x - 15, base - 10), (x - 16, base - 13)], M, 3)
    c.poly([(x - 19, base - 15), (x - 14, base - 13), (x - 16, base - 10)], (206, 130, 96, 255))
    if pose == "ali":
        c.poly([(x - 2, base - 15), (x - 9, base - 26), (x - 14, base - 20),
                (x - 12, base - 11), (x - 4, base - 10)], wing[2])
        c.poly([(x - 3, base - 15), (x - 8, base - 23), (x - 10, base - 15)], wing[3])
        c.thick_curve([(x - 2, base - 15), (x - 12, base - 11)], wing[1], 1)
    # body (sitting, chest up)
    c.ellipse(x, base - 8, 7.6, 7.0, M)
    c.ellipse(x + 1.6, base - 7.6, 5.0, 5.2, belly)
    c.ellipse(x - 3.4, base - 5, 4.4, 4.2, L1)
    # feet
    for dx in (-3.6, 2.6):
        c.ellipse(x + dx, base - 2.2, 3.4, 2.2, M)
        c.rect(x + dx - 2, base - 2, x + dx + 2, base - 1, (146, 122, 84, 255))
        for i in range(3):
            c.set(int(x + dx - 2 + i * 2), int(base - 1), horn)
    # front legs
    c.rect(x + 4, base - 8, x + 6, base - 3, M)
    c.rect(x + 5, base - 8, x + 6, base - 3, L1)
    # neck + head
    c.rect(x + 3, base - 15, x + 7, base - 9, M)
    hx, hy = x + 6.0, base - 17.0
    c.ellipse(hx, hy, 5.0, 4.4, M)
    c.ellipse(hx + 0.6, hy - 0.6, 3.2, 2.8, H1)
    c.poly([(hx + 3.2, hy - 0.4), (hx + 8.2, hy + 1.2), (hx + 8.4, hy + 3.4),
            (hx + 3.6, hy + 2.6)], M)                     # snout
    c.poly([(hx + 5.0, hy + 1.6), (hx + 8.2, hy + 2.4), (hx + 5.2, hy + 3.0)], belly)
    # horns
    c.poly([(hx - 2.4, hy - 3.4), (hx - 3.6, hy - 8.0), (hx + 0.4, hy - 4.2)], horn)
    c.poly([(hx + 2.8, hy - 3.6), (hx + 4.0, hy - 7.6), (hx + 5.0, hy - 3.0)], horn)
    _eyes(c, int(hx + 2.4), int(hy - 0.6))
    c.set(int(hx + 7.6), int(hy + 1.6), (58, 46, 48, 255))
    # back spikes
    for i in range(3):
        c.poly([(x - 3.4 + i * 3.0, base - 14.6), (x - 2.0 + i * 3.0, base - 18.0),
                (x - 0.6 + i * 3.0, base - 14.2)], horn)
    # cheek frill
    c.poly([(hx - 3.0, hy + 1.0), (hx - 6.0, hy + 3.0), (hx - 2.4, hy + 3.4)], (206, 130, 96, 255))


def default_animal(kind="gatto"):
    info = ANIMALS[kind]
    return {"animal": kind, "variant": info["variants"][0][0], "pose": info["poses"][0]}
