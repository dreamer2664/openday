"""
Scenes: the two interpretations of every location.

* `PHOTO_SCENES` — composition datasheet for the photographic mode: crop of the
  source photograph, support point, character/companion placement, light
  direction, ambient colour, occlusion layers and typography zone.
* `build_nes_scene()` — an original NES-inspired pixel-art reconstruction of the
  same place, painted at 600x400 and scaled with nearest-neighbour.

All geometry below is expressed in *postcard units*: the card is 3000x2000,
so x runs 0..3000 and y 0..2000; the ground line of the character is `ground_y`.
The pixel scenes use the same proportional anchors divided by 5.
"""
from __future__ import annotations

import math

from .palette import ramp
from .pixel import PixelCanvas

# ---------------------------------------------------------------------------
# layout datasheets
# ---------------------------------------------------------------------------
PHOTO_SCENES = {
    "casardi": {
        "label": 'Liceo Alfredo Casardi', "place": 'Barletta',
        "photo": "assets/photos/casardi/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1770, "char": {"x": 1390, "h": 1100},
        "companion": {"x": 1900, "flip": False},
        "light": {"dx": -1, "dy": 0.32, "strength": 0.5, "warm": (250, 242, 227)},
        "ambient": {"tint": (220, 222, 222), "strength": 0.14},
        "grain": 0.0, "vignette": 0.09,
        "sprite_desat": 0.24, "occluders": [],
        "text_zone": "top-left", "note": 'Fotografia d’archivio, 1936 (707 × 491). Facciata autentica; pavimentazione in primo piano. Personaggio a colori molto attenuati.',
    },
    "pantheon": {
        "label": 'Pantheon', "place": 'Roma',
        "photo": "assets/photos/pantheon/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1880, "char": {"x": 2180, "h": 1080},
        "companion": {"x": 1670, "flip": True},
        "light": {"dx": -0.15, "dy": 0.15, "strength": 0.26, "warm": (250, 242, 227)},
        "ambient": {"tint": (214, 205, 189), "strength": 0.17},
        "grain": 0.002, "vignette": 0.09,
        "sprite_desat": 0.86, "occluders": [],
        "text_zone": "top-left", "note": 'Interno con pavimento marmoreo: luce diffusa dall’alto, ombra corta, palette calda. Le persone della foto restano sullo sfondo.',
    },
    "foro": {
        "label": 'Foro Romano · Arco di Tito', "place": 'Roma',
        "photo": "assets/photos/foro/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1935, "char": {"x": 2350, "h": 500},
        "companion": {"x": 2590, "flip": True},
        "light": {"dx": -0.8, "dy": 0.2, "strength": 0.52, "warm": (250, 242, 227)},
        "ambient": {"tint": (224, 218, 202), "strength": 0.16},
        "grain": 0.002, "vignette": 0.09,
        "sprite_desat": 0.9, "occluders": [],
        "text_zone": "bottom-left", "note": 'Arco di Tito visto dalla Via Sacra. Appoggio sul selciato in primo piano, senza coprire il fornice; luce da sinistra.',
    },
    "epidauro": {
        "label": 'Teatro di Epidauro', "place": 'Epidauro, Grecia',
        "photo": "assets/photos/epidauro/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1810, "char": {"x": 2040, "h": 1100},
        "companion": {"x": 1530, "flip": True},
        "light": {"dx": -0.8, "dy": 0.18, "strength": 0.52, "warm": (250, 242, 227)},
        "ambient": {"tint": (220, 223, 207), "strength": 0.15},
        "grain": 0.002, "vignette": 0.09,
        "sprite_desat": 0.9, "occluders": [],
        "text_zone": "top-center", "note": 'Veduta dal piano dell’orchestra, non dall’alto della cavea. I piedi poggiano sulla ghiaia; vegetazione e gradinate restano visibili.',
    },
    "biblioteca": {
        "label": 'Biblioteca Malatestiana', "place": 'Cesena',
        "photo": "assets/photos/biblioteca/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1880, "char": {"x": 1660, "h": 1110},
        "companion": {"x": 1200, "flip": True},
        "light": {"dx": 0.2, "dy": 0.12, "strength": 0.22, "warm": (250, 242, 227)},
        "ambient": {"tint": (217, 201, 180), "strength": 0.2},
        "grain": 0.002, "vignette": 0.13,
        "sprite_desat": 0.82, "occluders": [],
        "text_zone": "top-left", "note": 'Aula del Nuti, corridoio centrale fra i plutei: luce laterale soffusa, riflesso caldo del cotto; soggetti nell’area libera.',
    },
    "paestum": {
        "label": 'Tempio di Hera II, Paestum', "place": 'Capaccio Paestum',
        "photo": "assets/photos/paestum/source.jpg",
        "crop": (0.0, 0.0, 1.0, 1.0), "crop_anchor_y": 1.0,
        "ground_y": 1880, "char": {"x": 1230, "h": 1000},
        "companion": {"x": 1690, "flip": False},
        "light": {"dx": -1, "dy": 0.2, "strength": 0.6, "warm": (250, 242, 227)},
        "ambient": {"tint": (230, 219, 194), "strength": 0.17},
        "grain": 0.002, "vignette": 0.09,
        "sprite_desat": 0.91, "occluders": ['grass'],
        "text_zone": "top-left", "note": 'Tempio di Hera II, detto di Nettuno: prato anteriore, sole da sinistra, ombra verso destra. Ciuffi d’erba davanti alle suole.',
    },
}

# Native pixel-scene coordinates. Typography and shadows use this same grid.
NES_SCENES = {
    "casardi": {"text_zone": "top-left", "ground_y": 354, "char": {"x": 272, "h": 176}, "comp": {"x": 378}},
    "pantheon": {"text_zone": "top-left", "ground_y": 372, "char": {"x": 424, "h": 176}, "comp": {"x": 326}},
    "foro": {"text_zone": "bottom-left", "ground_y": 376, "char": {"x": 462, "h": 174}, "comp": {"x": 362}},
    "epidauro": {"text_zone": "top-left", "ground_y": 366, "char": {"x": 414, "h": 174}, "comp": {"x": 310}},
    "biblioteca": {"text_zone": "top-left", "ground_y": 378, "char": {"x": 335, "h": 172}, "comp": {"x": 242}},
    "paestum": {"text_zone": "top-right", "ground_y": 370, "char": {"x": 242, "h": 174}, "comp": {"x": 344}},
}

NES_SPACE = 600

# ---------------------------------------------------------------------------
# shared pixel-art helpers (600x400 painting space)
# ---------------------------------------------------------------------------
def sky(c, top="#2f5f9e", bottom="#a8cbe4", y0=0, y1=250, bands=12):
    t = ramp(top); b = ramp(bottom)
    c.rect(0, 0, c.w - 1, c.h - 1, b[2])
    for i in range(bands):
        yy0 = y0 + int((y1 - y0) * i / bands)
        yy1 = y0 + int((y1 - y0) * (i + 1) / bands)
        col = tuple(int(t[2][k] + (b[2][k] - t[2][k]) * i / max(1, bands - 1)) for k in range(3)) + (255,)
        c.rect(0, yy0, c.w - 1, yy1, col)
        for y in range(yy0, min(yy1, yy0 + 2)):
            for x in range((y + yy0) % 2, c.w, 2):
                c.set(x, y, tuple(int(col[k] * 0.96) for k in range(3)) + (255,))


def cloud(c, x, y, w=40, h=10, col=(250, 248, 240, 255), shade=(214, 218, 218, 255)):
    c.ellipse(x, y, w * 0.40, h * 0.62, col)
    c.ellipse(x - w * 0.30, y + h * 0.16, w * 0.24, h * 0.46, col)
    c.ellipse(x + w * 0.32, y + h * 0.12, w * 0.22, h * 0.42, col)
    c.ellipse(x - w * 0.06, y + h * 0.30, w * 0.40, h * 0.26, shade)


def hill(c, x, y, w, h, base="#5c7f4a", shade="#3f5c38", light="#789a56"):
    c.poly([(x - w / 2, y + 1), (x - w * 0.18, y - h), (x + w * 0.16, y - h * 0.78),
            (x + w / 2, y + 1)], ramp(base)[2])
    c.poly([(x - w * 0.18, y - h), (x + w * 0.16, y - h * 0.78), (x + w / 2, y + 1),
            (x + w * 0.06, y + 1)], ramp(shade)[2])
    c.poly([(x - w * 0.33, y - h * 0.52), (x - w * 0.18, y - h), (x - w * 0.04, y - h * 0.46)],
           ramp(light)[2])


def cypress(c, x, y, h=70, w=10, col="#2f4a32"):
    r = ramp(col)
    c.poly([(x, y - h), (x + w / 2, y - h * 0.42), (x + w * 0.32, y), (x - w * 0.32, y),
            (x - w / 2, y - h * 0.42)], r[2])
    c.poly([(x + 1, y - h * 0.92), (x + w / 2, y - h * 0.42), (x + w * 0.32, y), (x + 1, y)], r[1])
    c.vline(int(x - w * 0.24), int(y - h * 0.7), int(y - h * 0.08), r[3])


def pine(c, x, y, h=60, r=34, trunk="#6b4b2f", leaves="#39603a"):
    t = ramp(trunk); l = ramp(leaves)
    c.rect(x - 1, int(y - h * 0.5), x + 1, y, t[2])
    c.ellipse(x, y - h * 0.66, r, r * 0.40, l[2])
    c.ellipse(x - r * 0.18, y - h * 0.72, r * 0.64, r * 0.24, l[3])
    c.ellipse(x + r * 0.34, y - h * 0.60, r * 0.42, r * 0.18, l[1])


def column(c, x, y_top, y_bot, w=14, label="doric", col="#d8cdb4", dark="#9d9078",
           light="#f0e8d2", flutes=True):
    r = ramp(col); d = ramp(dark); l = ramp(light)
    half = w / 2
    c.rect(x - half, y_top + 5, x + half, y_bot - 4, r[2])
    if flutes:
        for i in range(int(-half + 2), int(half), 3):
            c.vline(int(x + i), int(y_top + 7), int(y_bot - 6), d[2]
                    if (i // 3) % 2 == 0 else r[1])
        c.vline(int(x - half + 1), int(y_top + 7), int(y_bot - 6), l[2])
    else:
        c.vline(int(x + half - 1), int(y_top + 6), int(y_bot - 5), r[1])
    c.rect(x - half - 2, y_bot - 4, x + half + 2, y_bot, r[3])
    c.hline(int(x - half - 2), int(x + half + 2), y_bot - 1, r[1])
    if label == "doric":
        c.rect(x - half - 1, y_top + 2, x + half + 1, y_top + 5, r[3])
        c.rect(x - half - 3, y_top, x + half + 3, y_top + 2, r[2])
        c.hline(int(x - half - 3), int(x + half + 3), y_top, l[2])
    elif label == "ionic":
        c.rect(x - half - 1, y_top + 3, x + half + 1, y_top + 6, r[3])
        c.rect(x - half - 4, y_top + 1, x + half + 4, y_top + 3, r[2])
        for side in (-1, 1):
            c.ellipse(x + side * (half + 2), y_top + 2, 2.4, 2.0, r[1])
            c.set(int(x + side * (half + 2)), int(y_top + 2), r[3])
    else:
        c.rect(x - half - 1, y_top, x + half + 1, y_top + 3, r[3])


def entablature(c, x0, x1, y, h=16, col="#e6dcc4", dark="#b3a488", light="#f4ecd8"):
    r = ramp(col); d = ramp(dark); l = ramp(light)
    c.rect(x0, y, x1, y + h, r[2])
    c.rect(x0, y, x1, y + 1, l[2])
    c.rect(x0, y + h - 1, x1, y + h, d[2])
    for x in range(int(x0) + 2, int(x1) - 1, 4):
        c.rect(x, y + h - 5, x + 1, y + h - 2, l[2])
    c.rect(x0, y + 3, x1, y + 5, d[1])
    c.rect(x0, y + 6, x1, y + h - 5, r[2])


def pediment(c, cx, y_top, w=120, h=34, col="#e6dcc4", shadow="#b3a488"):
    r = ramp(col); s = ramp(shadow)
    c.poly([(cx - w / 2, y_top + h), (cx, y_top), (cx + w / 2, y_top + h)], r[2])
    c.poly([(cx, y_top), (cx + w / 2, y_top + h), (cx + w * 0.14, y_top + h)], s[2])
    # tympanum recess and cornice
    c.poly([(cx - w / 2 + 5, y_top + h - 5), (cx, y_top + 5), (cx + w / 2 - 5, y_top + h - 5)],
           s[1])
    c.line(cx - w / 2, y_top + h, cx, y_top, r[3], 2)
    c.line(cx, y_top, cx + w / 2, y_top + h, r[1], 2)
    c.rect(cx - w / 2 - 3, y_top + h, cx + w / 2 + 3, y_top + h + 4, r[2])
    c.hline(int(cx - w / 2) - 3, int(cx + w / 2) + 3, y_top + h, r[3])


def grass(c, y0, y1, col="#6f8f4a", dark="#4c6a36", light="#8fae5e", rows=7):
    r = ramp(col); d = ramp(dark); l = ramp(light)
    for i in range(rows):
        ya = y0 + int((y1 - y0) * i / rows)
        yb = y0 + int((y1 - y0) * (i + 1) / rows)
        c.rect(0, ya, c.w - 1, yb, tuple(int(r[2][k] + (d[2][k] - r[2][k]) * i / max(1, rows - 1))
                                         for k in range(3)) + (255,))
    for i in range(rows):
        y = y0 + int((y1 - y0) * i / rows) + 3
        step = 7 + i * 3
        for x in range((i * 3) % 5, c.w, step):
            c.set(x, y, l[2])
            c.set(x + 1, y - 1, l[2])
            c.set(x, y + 1, d[2])
    c.rect(0, y0, c.w - 1, y0, r[2])


def marble_floor(c, y0, y1, base="#cbb9a4", line="#9d8b7c", light="#e4d7c4"):
    r = ramp(base); ln = ramp(line)
    c.rect(0, y0, c.w - 1, y1, r[2])
    vx = c.w / 2
    for i in range(-9, 10):
        c.line(vx, y0, vx + i * (c.w / 4.0), y1, ln[1], 1)
    y = y0
    step = 3
    while y < y1:
        c.hline(0, c.w - 1, int(y), ln[2])
        y += step
        step *= 1.24
    for i in range(4):
        c.rect(0, y0 + i * 2, c.w - 1, y0 + i * 2, ramp(light)[2])


def vaulted_ceiling(c, x0, x1, y0, height, arches=6, col="#d9cbb2", dark="#9a8a74"):
    r = ramp(col); d = ramp(dark)
    c.rect(x0, y0, x1, y0 + height, r[2])
    span = (x1 - x0) / arches
    for i in range(arches):
        cx = x0 + span * (i + 0.5)
        w = span * 0.5
        c.ellipse(cx, y0 + height * 0.62, w, height * 0.62, d[2])
        c.ellipse(cx, y0 + height * 0.66, w * 0.88, height * 0.56, d[1])
        c.ellipse(cx, y0 + height * 0.70, w * 0.74, height * 0.46, r[1])
    c.rect(x0, y0 + height - 3, x1, y0 + height, d[2])


def wooden_desk(c, x, y, w=54, h=40, col="#8a5a33", dark="#5d3a20", light="#ab7a4c"):
    r = ramp(col); d = ramp(dark); l = ramp(light)
    c.rect(x - w / 2, y - h, x + w / 2, y - 2, r[2])
    c.rect(x - w / 2, y - h, x + w / 2, y - h + 2, l[2])
    c.rect(x - w / 2, y - 5, x + w / 2, y - 2, d[2])
    c.hline(int(x - w / 2), int(x + w / 2), int(y - h - 1), l[2])
    # sloped reading desk with a manuscript
    c.poly([(x - w * 0.34, y - h + 4), (x + w * 0.34, y - h + 4),
            (x + w * 0.30, y - h + 12), (x - w * 0.30, y - h + 12)], l[2])
    c.rect(x - 4, y - h + 6, x + 4, y - h + 10, ramp("#efe6cf")[2])
    # a book on the shelf
    for i in range(3):
        bx = x - w / 2 + 6 + i * 8
        c.rect(bx, y - h - 6, bx + 5, y - h - 1, ramp(["#7a3a2e", "#3a5a7a", "#5f6b3a"][i])[2])
        c.hline(int(bx), int(bx + 5), int(y - h - 5), ramp("#d8c9a0")[2])
    c.vline(int(x - w / 2 + 3), int(y - h + 6), int(y - 3), d[2])
    c.vline(int(x + w / 2 - 3), int(y - h + 6), int(y - 3), d[2])


def window_grid(c, x0, y0, x1, y1, cols, rows, frame="#efe9dc", glass="#5f7386",
                deep="#3e4f60", sill="#cdc3b0"):
    fr = ramp(frame); gl = ramp(glass); dp = ramp(deep); sl = ramp(sill)
    cw = (x1 - x0) / cols
    ch = (y1 - y0) / rows
    for i in range(cols):
        for j in range(rows):
            x = x0 + i * cw + cw * 0.20
            y = y0 + j * ch + ch * 0.16
            w = cw * 0.60
            h = ch * 0.64
            c.rect(x - 1, y - 1, x + w + 1, y + h + 1, fr[3])
            c.rect(x, y, x + w, y + h, gl[2])
            c.rect(x, y, x + w * 0.5, y + h * 0.45, gl[3])
            c.rect(x + w * 0.5, y + h * 0.5, x + w, y + h, dp[2])
            c.vline(int(x + w / 2), int(y), int(y + h), fr[2])
            c.hline(int(x), int(x + w), int(y + h / 2), fr[2])
            c.rect(x - 2, y + h + 2, x + w + 2, y + h + 3, sl[2])


def stairs(c, cx, y_top, y_bot, w_top, w_bot, steps=6, col="#d7cbb2", dark="#a3947c"):
    r = ramp(col); d = ramp(dark)
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        y0 = y_top + (y_bot - y_top) * t0
        y1 = y_top + (y_bot - y_top) * t1
        w0 = w_top + (w_bot - w_top) * t0
        w1 = w_top + (w_bot - w_top) * t1
        c.poly([(cx - w0 / 2, y0), (cx + w0 / 2, y0), (cx + w1 / 2, y1), (cx - w1 / 2, y1)], r[2])
        c.hline(int(cx - w1 / 2), int(cx + w1 / 2), int(y0), d[2])
        c.hline(int(cx - w1 / 2), int(cx + w1 / 2), int(y0) + 1, r[3])


def stone_block_wall(c, x0, y0, x1, y1, col="#cfc2a8", dark="#9a8c74", bw=22, bh=10):
    r = ramp(col); d = ramp(dark)
    c.rect(x0, y0, x1, y1, r[2])
    row = 0
    y = y0
    while y < y1:
        c.hline(int(x0), int(x1), int(y), d[2])
        off = (row % 2) * bw / 2
        x = x0 + off
        while x < x1:
            c.vline(int(x), int(y), int(min(y + bh, y1)), d[1])
            x += bw
        y += bh
        row += 1


def doric_temple(c, cx, ground, w=260, col_h=150, cols=8, col="#d9c9a8", dark="#a8916c",
                 light="#efe3c6", ped=True, steps=3):
    r = ramp(col); d = ramp(dark); l = ramp(light)
    span = w / cols
    colw = max(6, span * 0.54)
    y_top = ground - col_h
    # stylobate + steps
    for i in range(steps):
        wid = w + 26 - i * 8
        yy = ground - 4 * (i + 1)
        c.rect(cx - wid / 2, yy, cx + wid / 2, yy + 4, r[2] if i else d[2])
        c.hline(int(cx - wid / 2), int(cx + wid / 2), int(yy), r[3])
    base = ground - 4 * steps
    for i in range(cols):
        x = cx - w / 2 + span * (i + 0.5)
        column(c, x, y_top, base, w=colw, col=col, dark=dark, light=light)
        c.rect(x + colw / 2, y_top + 7, x + colw / 2 + 2, base - 5, d[2])
    entablature(c, cx - w / 2 - 5, cx + w / 2 + 5, y_top - 18, 18, col=col, dark=dark, light=light)
    if ped:
        pediment(c, cx, y_top - 66, w=w + 26, h=48, col=col, shadow=dark)


# ---------------------------------------------------------------------------
# the six NES scenes (600 x 400)
# ---------------------------------------------------------------------------
def _scene_casardi(c):
    # Original reconstruction from the archive view: offset stair tower at the
    # left, long two-storey elevation, flat cornice and the returning right wing.
    sky(c, "#416f9b", "#bed5dd", 0, 280)
    cloud(c, 526, 57, 36, 8)
    wall = ramp("#dfd6be"); shade = ramp("#b9b19f"); stone = ramp("#bbb4a2")
    # returning wing, in perspective
    c.poly([(500,105),(576,168),(576,304),(500,305)], shade[2])
    c.poly([(500,105),(576,168),(576,174),(500,114)], shade[0])
    for i in range(4):
        x=511+i*15
        top=135+i*13
        for y in (top, top+82-i*6):
            c.poly([(x,y),(x+7,y+5),(x+7,y+47-i*5),(x,y+44-i*5)], ramp("#536573")[2])
            c.line(x+3,y+4,x+3,y+42-i*5,wall[2])
    # central elevation, height increases towards the near corner
    c.poly([(156,175),(500,105),(500,305),(156,305)],wall[2])
    c.poly([(156,174),(500,104),(500,113),(156,183)],shade[2])
    c.line(156,174,500,104,wall[4],2)
    for i in range(6):
        x=179+i*50; top=197-i*10
        for j in range(2):
            yy=top+j*(58+i*3)
            ww=25; hh=39+i*3
            pts=[(x,yy),(x+ww,yy-5),(x+ww,yy+hh-5),(x,yy+hh)]
            c.poly([(a-2,b-2) for a,b in pts],wall[4])
            c.poly(pts,ramp("#687b87")[2])
            c.line(x+ww//2,yy-2,x+ww//2,yy+hh-3,wall[1])
            c.line(x,yy+hh*.5,x+ww,yy+hh*.5-5,wall[1])
            c.line(x,yy+hh+2,x+ww,yy+hh-3,shade[0],2)
    # left entrance wing and projecting stair tower — not a generic central door
    c.poly([(55,194),(148,180),(148,305),(55,305)],shade[2])
    for x in (69,97):
        c.rect(x,219,x+15,251,ramp("#677985")[2]);c.rect(x,264,x+15,292,ramp("#677985")[2])
    c.poly([(112,157),(153,166),(153,305),(112,305)],stone[2])
    c.poly([(100,168),(112,157),(112,305),(100,305)],stone[1])
    c.rect(128,182,143,304,ramp("#4b5b68")[2])
    for y in (194,228,262):
        c.hline(129,142,y,shade[2]);c.vline(135,y-10,y+12,shade[2])
    c.poly([(150,176),(173,180),(173,305),(150,305)],wall[1])
    c.rect(156,247,170,303,ramp("#3b4f5d")[2])
    c.hline(98,177,307,wall[4],2)
    c.rect(0,305,599,313,ramp("#63764e")[2])
    c.rect(0,314,599,399,ramp("#b9b1a0")[2])
    for y in (316,325,338,357,381):
        c.hline(0,599,y,ramp("#9a9281")[2])
    for x in range(-250,851,55):
        c.line(286,313,x,399,ramp("#aaa18e")[2])
    # small documented garden trees
    for x,h in ((187,30),(349,39),(472,45)):
        c.rect(x,307-h,x+1,307,ramp("#6b5941")[2])
        for a in range(0,360,45):
            t=math.radians(a);c.line(x,307-h,x+math.cos(t)*12,303-h+math.sin(t)*7,ramp("#4b6547")[2],2)
    cypress(c,224,309,38,6);cypress(c,403,310,40,6)


def _scene_pantheon(c):
    dome = ramp("#8a7358"); dome_d = ramp("#5f4c3c"); dome_l = ramp("#a98f6d")
    c.rect(0, 0, 599, 399, dome_d[2])
    cx, oy = 300, 128
    # dome shell: nested ellipses give the curvature of the coffered vault
    for i in range(14):
        f = 1 - i * 0.062
        c.ellipse(cx, oy + 208, 356 * f, 300 * f, dome[2] if i % 2 == 0 else dome_d[2])
    # coffer rings: trapezoids facing the oculus
    rings = [(0.34, 0.60, 10, 30), (0.62, 0.84, 14, 34), (0.86, 1.02, 18, 36)]
    for r0, r1, n, w in rings:
        for k in range(n):
            ang = math.radians(180 + (k + 0.5) * (180.0 / n))
            x0 = cx + math.cos(ang) * 356 * r0 * 0.98
            y0 = oy + 208 + math.sin(ang) * 300 * r0 * 0.98
            x1 = cx + math.cos(ang) * 356 * r1
            y1 = oy + 208 + math.sin(ang) * 300 * r1
            nx, ny = math.cos(ang + math.pi / 2), math.sin(ang + math.pi / 2)
            hw0, hw1 = w * r0 * 0.75, w * r1 * 0.85
            c.poly([(x0 - nx * hw0, y0 - ny * hw0), (x0 + nx * hw0, y0 + ny * hw0),
                    (x1 + nx * hw1, y1 + ny * hw1), (x1 - nx * hw1, y1 - ny * hw1)], dome_d[2])
            c.poly([(x0 - nx * hw0 + math.cos(ang) * 2, y0 - ny * hw0 + math.sin(ang) * 2),
                    (x0 + nx * hw0 + math.cos(ang) * 2, y0 + ny * hw0 + math.sin(ang) * 2),
                    (x1 + nx * hw1, y1 + ny * hw1), (x1 - nx * hw1, y1 - ny * hw1)], dome_d[1])
            c.line(x0 - nx * hw0, y0 - ny * hw0, x0 + nx * hw0, y0 + ny * hw0, dome_l[2], 1)
    # oculus
    c.ellipse(cx, oy, 74, 52, dome_l[2])
    c.ellipse(cx, oy, 66, 46, (255, 250, 236, 255))
    c.ellipse(cx, oy - 2, 54, 38, (255, 255, 252, 255))
    # light shaft down to the floor
    c.poly([(cx - 52, oy + 20), (cx + 52, oy + 20), (cx + 132, 344), (cx - 132, 344)],
           ramp("#ad9470")[2])
    c.poly([(cx - 52, oy + 20), (cx + 52, oy + 20), (cx + 84, 344), (cx - 84, 344)],
           ramp("#bca27e")[2])
    # wall + aedicula + columns
    c.rect(0, 250, 599, 344, ramp("#8b7560")[2])
    c.rect(0, 250, 599, 258, ramp("#a68d70")[2])
    c.rect(0, 336, 599, 344, ramp("#6f5c4a")[2])
    for x in (22, 92, 508, 578):
        column(c, x, 230, 336, w=20, label="ionic", col="#c9b291", dark="#8f7860", light="#e2cfae")
    c.rect(150, 232, 450, 262, ramp("#b8a184")[2])
    c.rect(150, 232, 450, 237, ramp("#cdb899")[2])
    c.rect(164, 244, 436, 336, ramp("#9d876c")[2])
    for x in (206, 394):
        c.rect(x - 32, 246, x + 32, 336, ramp("#6b5946")[2])
        c.rect(x - 25, 252, x + 25, 336, ramp("#4a3f31")[2])
        c.ellipse(x, 266, 8, 10, ramp("#ddd7c8")[2])
        c.poly([(x - 11, 336), (x - 6, 280), (x + 6, 280), (x + 11, 336)], ramp("#ddd7c8")[2])
        c.poly([(x + 1, 336), (x + 2, 280), (x + 11, 336)], ramp("#b7b1a4")[2])
        c.rect(x - 34, 244, x + 34, 248, ramp("#cdb899")[2])
    for x in (160, 440):
        column(c, x, 238, 336, w=13, label="ionic", col="#c9b291", dark="#8f7860",
               light="#e2cfae")
    c.rect(266, 300, 334, 336, ramp("#b09a7c")[2])
    c.rect(258, 294, 342, 302, ramp("#c9b294")[2])
    # floor
    marble_floor(c, 344, 399, base="#c9b7a4", line="#8e7d6c", light="#e6d8c6")
    for i in range(4):
        c.ellipse(cx, 348, 70 + i * 40, 4 + i * 2, ramp("#b09a82")[2])


def _scene_foro(c):
    sky(c,"#376ea1","#c4d9df",0,278)
    cloud(c,102,43,43,9)
    for x in (35,76,530,578):
        pine(c,x,301,h=116+(x%21),r=42,leaves="#3f6043")
    c.rect(0,285,599,399,ramp("#b0a48b")[2])
    marble_floor(c,314,399,base="#b3aa97",line="#8b8373",light="#d3c5ac")
    r=ramp("#d4c7ab"); sh=ramp("#a5987c"); hi=ramp("#eadfc8")
    # Travertine mass, one arch, coupled attached columns and attic.
    c.rect(228,108,470,315,r[2])
    c.poly([(470,108),(489,122),(489,308),(470,315)],sh[2])
    c.rect(225,93,473,111,r[3]);c.hline(225,473,94,hi[3],2)
    c.rect(232,66,467,95,r[2]);c.rect(226,62,474,67,hi[2])
    c.rect(253,74,445,89,sh[2]);c.rect(256,75,442,87,r[3])
    # Relief panel: a carved texture, not pseudo-Latin or invented lettering.
    for y in (78,82,85):
        for x in range(261,440,7):
            c.hline(x,x+3,y,sh[2])
    c.rect(221,113,477,123,hi[2]);c.hline(221,477,124,sh[0],2)
    # Tunnel cutout. Fill from opaque colours matching the far landscape.
    c.rect(305,210,395,315,ramp("#566b4e")[2])
    c.ellipse(350,210,45,60,ramp("#61795b")[2])
    c.rect(319,217,387,315,ramp("#a8aa88")[2])
    c.ellipse(350,211,37,51,ramp("#a8aa88")[2])
    c.poly([(319,298),(387,298),(401,315),(303,315)],ramp("#bbb09b")[2])
    # Recessed soffit edge and voussoirs.
    for a in range(181,361,2):
        t=math.radians(a)
        c.set(int(350+math.cos(t)*48),int(211+math.sin(t)*61),sh[0])
        c.set(int(350+math.cos(t)*55),int(211+math.sin(t)*67),hi[2])
    for a in range(190,360,16):
        t=math.radians(a)
        c.line(350+math.cos(t)*49,211+math.sin(t)*62,350+math.cos(t)*57,211+math.sin(t)*69,sh[2])
    for x in (250,288,410,450):
        column(c,x,132,299,w=10,label="ionic",col="#dbcfb4",dark="#a7987e",light="#f0e4cc")
    for x in (235,425):
        stone_block_wall(c,x,302,x+32,319,col="#b9ad95",dark="#938872",bw=22,bh=9)
    for x in (5,555):
        stone_block_wall(c,x,335,x+40,352,col="#b6a88d",dark="#8b7d66",bw=20,bh=8)


def _scene_epidauro(c):
    # View FROM the orchestra towards the real cavea. No invented intact skene.
    sky(c,"#5c88a5","#d3ded9",0,172)
    for x in range(-10,625,20):
        pine(c,x,186,h=52+(x%37),r=20,leaves="#496348")
    sand=ramp("#c5b69a");seat=ramp("#c2b99e");dark=ramp("#8c876f")
    c.rect(0,174,599,399,sand[2])
    cx=300
    # Perspective horizontal ellipses: twenty curved ranks, dense at the top.
    for y in range(156,282):
        f=(y-156)/126
        col=seat[2] if int((f**.62)*32)%2 else dark[2]
        sag=32*(1-f)
        for x in range(5,595):
            yy=int(y+sag*(1-((x-cx)/305)**2))
            if yy<290: c.set(x,yy,col)
    for i in range(22):
        f=(i/21)**1.6;y=162+f*117; sag=30*(1-f)
        pts=[(x,y+sag*(1-((x-cx)/305)**2)) for x in range(4,598,3)]
        c.thick_curve(pts,seat[3],1)
    # radial stair aisles widen towards the orchestra
    for xt in (14,89,166,238,300,362,434,511,586):
        xb=300+(xt-300)*1.36
        c.poly([(xt-1,164),(xt+1,164),(xb+4,286),(xb-4,286)],dark[1])
        c.line(xt,165,xb-2,286,seat[4])
    c.line(0,289,599,289,dark[2],2)
    # end wall / parodos, not a fictional temple
    for side in (0,1):
        x=4 if side==0 else 551
        stone_block_wall(c,x,244,x+43,298,col="#b5a789",dark="#8f8167",bw=22,bh=11)
        c.rect(x+12,261,x+30,296,ramp("#6a634e")[2])
        c.rect(x+9,256,x+33,261,seat[3])
    c.rect(0,300,599,399,sand[2])
    # fine packed-earth texture, controlled palette
    for y in range(308,398,7):
        for x in range((y*3)%17,600,19):
            c.set(x,y,sand[1]);c.set(x+4,y+3,sand[3])
    c.ellipse(299,326,16,4,sand[1]);c.ellipse(299,325,13,3,sand[3])


def _scene_biblioteca(c):
    # Aula del Nuti: three naves, pale stone columns, ribbed vaults and
    # two banks of wooden plutei flanking the empty central aisle.
    wall=ramp("#c7b28e"); vault=ramp("#e3d6ba"); stone=ramp("#ded3b9")
    c.rect(0,0,599,399,wall[2])
    c.ellipse(300,230,360,310,vault[2])
    c.poly([(0,112),(272,224),(272,277),(0,355)],wall[2])
    c.poly([(599,112),(328,224),(328,277),(599,355)],wall[1])
    c.rect(0,264,599,399,ramp("#995d43")[2])
    for y in (269,277,290,309,334,367,398):
        c.hline(0,599,y,ramp("#754a38")[2])
    for x in range(-240,860,46):
        c.line(300,244,x,399,ramp("#b47c58")[2])
    c.poly([(282,259),(318,259),(410,399),(190,399)],ramp("#ab7151")[2])
    c.rect(267,207,333,272,wall[2])
    c.rect(290,221,310,263,ramp("#685e4b")[2])
    c.rect(292,222,308,258,ramp("#f8eed6")[2]);c.vline(300,222,258,wall[0])
    # transverse vault arches and thin iron tie rods
    for f in (1,.76,.56,.40,.28):
        pts=[]
        for a in range(182,359,2):
            t=math.radians(a)
            pts.append((300+math.cos(t)*275*f,243+math.sin(t)*248*f))
        c.thick_curve(pts,wall[1],2)
        c.thick_curve([(x,y+2) for x,y in pts],vault[3],1)
        yy=243-94*f
        c.line(300-258*f,yy,300+258*f,yy,ramp("#5b584b")[2],1)
    # pale columns, far to near so the overlap is correct
    for f in (.22,.34,.50,.72,1.):
        for sign in (-1,1):
            x=300+sign*222*f;top=239-128*f;bot=270+107*f;ww=3+12*f
            column(c,x,top,bot,w=ww,label="plain",col="#ded3b9",dark="#ac9e82",light="#f0e6cb",flutes=False)
            # simple leaf cap on the near columns
            c.rect(x-ww*.8,top-4,x+ww*.8,top-1,stone[3])
    # side windows on the outer walls
    for sign in (-1,1):
        for f in (.31,.46,.65,.88):
            x=300+sign*330*f;y=241-71*f;ww=10*f;hh=30*f
            c.ellipse(x,y,ww,hh,ramp("#f2e8cf")[2]);c.rect(x-ww,y,x+ww,y+hh,ramp("#f2e8cf")[2])
            c.vline(x,y-hh,y+hh,wall[1])
    # lecterns: sloping reading surfaces, side cheeks, legs and books, not boxes
    wood=ramp("#986638");book=ramp("#d9ceb0")
    for f in (.22,.35,.51,.72,1.):
        y=265+120*f; w=102*f;h=51*f
        for sign in (-1,1):
            x=300+sign*(26+174*f)
            c.rect(x-w*.42,y-h*.56,x+w*.42,y-5*f,wood[1])
            c.rect(x-w*.50,y-h*.8,x-w*.39,y+2,wood[0])
            c.rect(x+w*.39,y-h*.8,x+w*.50,y+2,wood[0])
            c.poly([(x-w*.53,y-h*.75),(x+w*.53,y-h*.75),(x+w*.48,y-h*.45),(x-w*.48,y-h*.45)],wood[2])
            c.line(x-w*.53,y-h*.75,x+w*.53,y-h*.75,wood[3],max(1,int(2*f)))
            # three small, visibly bound volumes on the pluteus
            for j in (-1,0,1):
                xx=x+j*w*.20
                c.poly([(xx-w*.08,y-h*.68),(xx+w*.07,y-h*.68),(xx+w*.06,y-h*.48),(xx-w*.07,y-h*.48)],book[2])
                c.line(xx,y-h*.66,xx,y-h*.5,wood[0])
            c.hline(int(x-w*.42),int(x+w*.42),int(y-h*.16),wood[3])


def _scene_paestum(c):
    sky(c,"#4a84b2","#ccdee1",0,265)
    cloud(c,114,38,46,9)
    for x in range(0,620,20):
        c.ellipse(x,287,18,9,ramp("#657d48")[2])
    c.rect(0,287,599,399,ramp("#8c995c")[2])
    r=ramp("#d1bb8d");d=ramp("#94805c");hi=ramp("#eedcb3")
    # Long lateral cella and dark peristasis in perspective.
    c.poly([(55,211),(350,155),(350,310),(55,303)],d[1])
    c.poly([(80,231),(340,180),(340,304),(80,299)],d[2])
    # Returning long colonnade: twelve visible stocky Doric columns.
    for i in range(12):
        t=i/11;x=62+286*t;top=218-59*t;bot=302+7*t;ww=9+8*t
        column(c,x,top,bot,w=ww,col="#c7b084",dark="#907b58",light="#e6d2a8")
    # Front cella behind SIX columns, as in the real temple of Hera II.
    c.rect(350,165,558,309,d[1]);c.rect(390,183,520,305,ramp("#a79470")[2])
    c.rect(425,205,475,306,ramp("#6b6148")[2])
    for i in range(6):
        column(c,357+i*38,159,309,w=22,col="#d2bc8f",dark="#9c865e",light="#efddb3")
    # Continuous architraves over both colonnades (hard pixel polygons).
    c.poly([(45,198),(346,138),(348,160),(45,222)],r[2])
    c.line(45,198,346,138,hi[2],2);c.line(45,217,348,155,d[2],2)
    c.rect(339,139,566,160,r[2]);c.hline(339,566,139,hi[2],3)
    c.hline(339,566,157,d[2],3)
    # Pediment and surviving sloping roof — important identifying silhouette.
    c.poly([(45,198),(137,162),(452,83),(339,139)],r[1])
    c.line(45,198,452,83,hi[1],2)
    pediment(c,452,83,w=226,h=55,col="#d1bb8d",shadow="#9c865f")
    for i in range(1,8):
        x=58+i*36;c.line(x,193-i*7,x+84,158-i*9,d[2])
    for i in range(3):
        c.poly([(43-i*4,303+i*4),(564+i*4,310+i*4),(564+i*4,314+i*4),(43-i*4,307+i*4)],r[2] if i%2 else r[1])
        c.hline(342-i*3,568+i*3,310+i*4,hi[2])
    grass(c,326,399,col="#91a35c",dark="#72854a",light="#b1bc78",rows=6)
    c.poly([(0,384),(600,349),(600,355),(0,392)],ramp("#c9bb96")[2])
    for x in (32,574):
        c.rect(x,352,x+2,375,d[1])


_BUILDERS = {
    "casardi": _scene_casardi,
    "pantheon": _scene_pantheon,
    "foro": _scene_foro,
    "epidauro": _scene_epidauro,
    "biblioteca": _scene_biblioteca,
    "paestum": _scene_paestum,
}


def build_nes_scene(scene_id: str) -> PixelCanvas:
    c = PixelCanvas(600, 400)
    _BUILDERS[scene_id](c)
    return c


def nes_layout(scene_id: str) -> dict:
    return NES_SCENES[scene_id]


def photo_layout(scene_id: str) -> dict:
    return PHOTO_SCENES[scene_id]
