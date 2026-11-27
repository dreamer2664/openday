"""
Scenes: the two interpretations of every location.

* `PHOTO_SCENES` — composition datasheet for the photographic mode: crop of the
  source photograph, support point, character/companion placement, light
  direction, ambient colour, occlusion layers and typography zone.
* `build_nes_scene()` — loads the revised, AI-assisted architectural pixel
  illustration at 600x400. Canonical PNGs, provenance and palettes are local.
  The old schematic procedural drawings are no longer used or delivered.

All geometry below is expressed in *postcard units*: the card is 3000x2000,
so x runs 0..3000 and y 0..2000; the ground line of the character is `ground_y`.
The pixel scenes have separately calibrated anchors on their 600x400 grid;
they are not assumed to share the photographic perspective or subject scale.
"""
from __future__ import annotations

from .nes_art import load_nes_art
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
    'colosseo': {'label': 'Colosseo', 'place': 'Roma', 'photo': 'assets/photos/colosseo/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1920, 'char': {'x': 2320, 'h': 650}, 'companion': {'x': 2650, 'flip': True}, 'light': {'dx': -0.55, 'dy': 0.18, 'strength': 0.18, 'warm': (255, 215, 155)}, 'ambient': {'tint': (149, 171, 209), 'strength': 0.26}, 'sprite_desat': 0.82, 'text_zone': 'top-right', 'note': 'Anfiteatro Flavio al crepuscolo: arcate illuminate, piazzale anteriore. Luce artificiale calda e cielo blu; il personaggio resta sul percorso libero a destra.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
    'acropoli': {'label': 'Acropoli di Atene · Partenone', 'place': 'Atene, Grecia', 'photo': 'assets/photos/acropoli/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1900, 'char': {'x': 2440, 'h': 670}, 'companion': {'x': 2080, 'flip': False}, 'light': {'dx': -0.85, 'dy': 0.22, 'strength': 0.52, 'warm': (255, 239, 207)}, 'ambient': {'tint': (228, 220, 201), 'strength': 0.16}, 'sprite_desat': 0.9, 'text_zone': 'top-left', 'note': 'Fronte orientale del Partenone: gradini e frammenti marmorei. Appoggio sul percorso ghiaioso nell’angolo inferiore destro, esterno allo stilobate.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
    'pompei': {'label': 'Pompei · Foro', 'place': 'Pompei', 'photo': 'assets/photos/pompei/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1880, 'char': {'x': 2210, 'h': 880}, 'companion': {'x': 1740, 'flip': False}, 'light': {'dx': -0.85, 'dy': 0.25, 'strength': 0.5, 'warm': (255, 240, 209)}, 'ambient': {'tint': (223, 218, 201), 'strength': 0.16}, 'sprite_desat': 0.88, 'text_zone': 'top-right', 'note': 'Foro di Pompei, colonnato superstite e Vesuvio: personaggio sul selciato libero, non sull’area verde o sulle rovine. Sole dall’alto a sinistra.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
    'taormina': {'label': 'Teatro antico di Taormina', 'place': 'Taormina', 'photo': 'assets/photos/taormina/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1880, 'char': {'x': 2500, 'h': 680}, 'companion': {'x': 2150, 'flip': False}, 'light': {'dx': -0.8, 'dy': 0.2, 'strength': 0.5, 'warm': (255, 239, 208)}, 'ambient': {'tint': (228, 216, 197), 'strength': 0.16}, 'sprite_desat': 0.9, 'text_zone': 'top-left', 'note': 'Teatro visto dalla cavea superiore: appoggio sul percorso di visita a destra, non nel vuoto sopra l’orchestra. Colori caldi del laterizio e luce da sinistra.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
    'casteldelmonte': {'label': 'Castel del Monte', 'place': 'Andria', 'photo': 'assets/photos/casteldelmonte/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1870, 'char': {'x': 690, 'h': 920}, 'companion': {'x': 1140, 'flip': False}, 'light': {'dx': -0.5, 'dy': 0.16, 'strength': 0.25, 'warm': (247, 236, 211)}, 'ambient': {'tint': (214, 217, 199), 'strength': 0.18}, 'sprite_desat': 0.86, 'text_zone': 'top-left', 'note': 'Facciata del castello federiciano in luce coperta: sentiero d’accesso fra arbusti e prato; personaggio sul sentiero e companion sul prato basso accanto al percorso.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
    'castellobarletta': {'label': 'Castello di Barletta', 'place': 'Barletta', 'photo': 'assets/photos/castellobarletta/source.jpg', 'crop': (0.0, 0.0, 1.0, 1.0), 'crop_anchor_y': 1.0, 'ground_y': 1880, 'char': {'x': 2200, 'h': 1010}, 'companion': {'x': 1710, 'flip': False}, 'light': {'dx': -0.8, 'dy': 0.2, 'strength': 0.46, 'warm': (251, 240, 219)}, 'ambient': {'tint': (225, 222, 205), 'strength': 0.16}, 'sprite_desat': 0.88, 'text_zone': 'top-left', 'note': 'Fortezza e fossato asciutto: personaggio sul piazzale pavimentato anteriore, prima della siepe e del parapetto. La foto risale a ottobre 2008.', 'grain': 0.0015, 'vignette': 0.08, 'occluders': []},
}

# Native pixel-scene coordinates. Typography and shadows use this same grid.
NES_SCENES = {
    "casardi": {"text_zone": "top-left", "ground_y": 354, "char": {"x": 272, "h": 176}, "comp": {"x": 378}},
    "pantheon": {"text_zone": "top-left", "ground_y": 372, "char": {"x": 424, "h": 176}, "comp": {"x": 326}},
    "foro": {"text_zone": "top-left", "ground_y": 376, "char": {"x": 342, "h": 156}, "comp": {"x": 242}},
    "epidauro": {"text_zone": "top-left", "ground_y": 366, "char": {"x": 414, "h": 174}, "comp": {"x": 310}},
    "biblioteca": {"text_zone": "top-left", "ground_y": 378, "char": {"x": 335, "h": 172}, "comp": {"x": 242}},
    "paestum": {"text_zone": "top-left", "ground_y": 370, "char": {"x": 242, "h": 174}, "comp": {"x": 344}},
    'colosseo': {'text_zone': 'top-left', 'ground_y': 374, 'char': {'x': 430, 'h': 150}, 'comp': {'x': 328}},
    'acropoli': {'text_zone': 'top-left', 'ground_y': 372, 'char': {'x': 425, 'h': 158}, 'comp': {'x': 323}},
    'pompei': {'text_zone': 'top-left', 'ground_y': 374, 'char': {'x': 428, 'h': 158}, 'comp': {'x': 326}},
    'taormina': {'text_zone': 'top-left', 'ground_y': 374, 'char': {'x': 448, 'h': 152}, 'comp': {'x': 348}},
    'casteldelmonte': {'text_zone': 'top-left', 'ground_y': 374, 'char': {'x': 420, 'h': 160}, 'comp': {'x': 316}},
    'castellobarletta': {'text_zone': 'top-left', 'ground_y': 374, 'char': {'x': 426, 'h': 164}, 'comp': {'x': 322}},
}

NES_SPACE = 600

# Native source paintings; PixelCanvas adapter retained for existing callers.
def build_nes_scene(scene_id: str) -> PixelCanvas:
    image=load_nes_art(scene_id)
    c=PixelCanvas(600,400)
    c.buf=list(image.getdata())
    return c

def nes_layout(scene_id: str) -> dict:
    return NES_SCENES[scene_id]

def photo_layout(scene_id: str) -> dict:
    return PHOTO_SCENES[scene_id]
