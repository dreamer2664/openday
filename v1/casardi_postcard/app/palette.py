"""
Palette system for the Casardi Open Day postcard studio.

The whole sprite / pixel-art artwork is painted with *ramps*: a base hue plus
four derived shades (deep shadow, shadow, light, lightest).  Every ramp is
generated from a single base colour so that recolouring a garment, a hair
style or an animal keeps the shading coherent.

Shade levels used across the code base::

    0 = deep shadow   (L2)
    1 = shadow        (L1)
    2 = base          (M )
    3 = light         (H1)
    4 = highlight     (H2)

Ramps are deterministic: the same base colour always produces the same ramp,
so sprites can be re-rendered on the fly without caching assets on disk.
"""
from __future__ import annotations

import colorsys
from functools import lru_cache

RGBA = tuple[int, int, int, int]


def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def _shift(rgb: tuple[int, int, int], h_delta=0.0, s_mult=1.0, v_mult=1.0,
           s_add=0.0, v_add=0.0) -> tuple[int, int, int]:
    h, s, v = colorsys.rgb_to_hsv(*[c / 255 for c in rgb])
    h = (h + h_delta) % 1.0
    s = _clamp(s * s_mult + s_add)
    v = _clamp(v * v_mult + v_add)
    return tuple(int(round(c * 255)) for c in colorsys.hsv_to_rgb(h, s, v))  # type: ignore[return-value]


def _mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


SHADOW_TINT = (58, 48, 74)      # cool violet-grey: shadow family
LIGHT_TINT = (255, 246, 226)    # warm parchment: highlight family


@lru_cache(maxsize=8192)
def ramp(base: str | tuple[int, int, int]) -> tuple[RGBA, RGBA, RGBA, RGBA, RGBA]:
    """Five coherent shades from a base colour.

    Instead of rotating the hue (which turns blues into greens) shadows are
    mixed towards a fixed cool violet and highlights towards a warm parchment,
    exactly the way pixel artists build a limited palette.
    """
    rgb = hex_to_rgb(base) if isinstance(base, str) else tuple(rgb3(base))
    base_dark = _mix(rgb, (0, 0, 0), 0.42)
    l2 = _mix(base_dark, SHADOW_TINT, 0.42)
    l1 = _mix(_mix(rgb, SHADOW_TINT, 0.30), (0, 0, 0), 0.10)
    m = rgb
    h1 = _mix(rgb, LIGHT_TINT, 0.30)
    h2 = _mix(rgb, LIGHT_TINT, 0.58)
    return tuple((r, g, b, 255) for r, g, b in (l2, l1, m, h1, h2))  # type: ignore[return-value]


def rgb3(c):
    return tuple(c[:3])


# ---------------------------------------------------------------------------
# Catalogue ------------------------------------------------------------------
# Every entry: id -> (label, hex).  These are the *real* user-facing options.
# ---------------------------------------------------------------------------

SKIN_TONES = [
    ("porcellana", "Porcellana", "#f4d9c4"),
    ("chiara", "Chiara", "#eec4a4"),
    ("dorata", "Dorata", "#dda87a"),
    ("ambra", "Ambra", "#c98c5a"),
    ("olivastra", "Olivastra", "#a86c42"),
    ("bruna", "Bruna", "#7f4c2c"),
    ("ebano", "Ebano", "#5a3320"),
]

HAIR_COLORS = [
    ("nero", "Nero corvino", "#1e1a22"),
    ("castano", "Castano", "#4a3021"),
    ("nocciola", "Nocciola", "#7a5230"),
    ("biondo", "Biondo", "#c9a15a"),
    ("ramato", "Ramato", "#a4522a"),
    ("rosso", "Rosso", "#8d2a20"),
    ("cenere", "Cenere", "#8a8a92"),
    ("platino", "Platino", "#d8d2c0"),
    ("viola", "Viola notte", "#4b2f66"),
    ("verde", "Verde bosco", "#2c4a33"),
    ("ciano", "Ciano", "#38a8b1"),
    ("rosa", "Rosa neon", "#d85aa0"),
    ("blu_elettrico", "Blu elettrico", "#287ada"),
]

FABRIC_COLORS = [
    ("bianco", "Bianco", "#eae6dc"),
    ("crema", "Crema", "#ddcbaa"),
    ("rosso", "Rosso", "#a52a25"),
    ("bordeaux", "Bordeaux", "#6d1f2b"),
    ("blu", "Blu", "#28457f"),
    ("navy", "Blu notte", "#1c2740"),
    ("azzurro", "Azzurro", "#6f9dc4"),
    ("verde", "Verde", "#3f6b45"),
    ("oliva", "Oliva", "#6b6b3a"),
    ("giallo", "Giallo", "#d4a72c"),
    ("senape", "Senape", "#b07d2a"),
    ("grigio", "Grigio", "#7b7f86"),
    ("antracite", "Antracite", "#33363d"),
    ("nero", "Nero", "#1b1b1f"),
    ("rosa", "Rosa", "#c4788f"),
    ("lilla", "Lilla", "#8b6fa8"),
    ("ciano", "Ciano tecnico", "#4bcabb"),
    ("magenta", "Magenta", "#ce4b9c"),
]

DENIM_COLORS = [
    ("jeans", "Jeans classico", "#3d5a86"),
    ("jeans-chiaro", "Jeans chiaro", "#6a87ad"),
    ("jeans-scuro", "Jeans scuro", "#26374f"),
    ("nero", "Nero", "#22222a"),
    ("grigio", "Grigio", "#585c63"),
    ("beige", "Beige", "#b9a888"),
    ("verde", "Verde militare", "#4a5340"),
    ("bordeaux", "Bordeaux", "#5c2733"),
]

LEATHER_COLORS = [
    ("nero", "Nero", "#232326"),
    ("cuoio", "Cuoio", "#6f4526"),
    ("cognac", "Cognac", "#8f5a2c"),
    ("bianco", "Bianco", "#ded9cf"),
    ("rosso", "Rosso", "#8a2b25"),
    ("blu", "Blu", "#26395e"),
]

METAL_COLORS = [
    ("oro", "Oro", "#c9a349"),
    ("argento", "Argento", "#b9bcc2"),
    ("bronzo", "Bronzo", "#9a6f42"),
    ("rame", "Rame", "#b06a45"),
]

EYE_COLORS = [
    ("castani", "Castani", "#5b3a22"),
    ("neri", "Neri", "#241c1a"),
    ("verdi", "Verdi", "#3d6b45"),
    ("azzurri", "Azzurri", "#4a7fa8"),
    ("grigi", "Grigi", "#6d757c"),
    ("ambra", "Ambra", "#9a6a25"),
]

# UI / scene helpers ---------------------------------------------------------

WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)
TRANSPARENT = (0, 0, 0, 0)


def lookup(table, key):
    for k, label, hexv in table:
        if k == key:
            return label, hexv
    if table:
        return table[0][1], table[0][2]
    raise KeyError(key)


def table_for_ui(table):
    """(id, label, hex) triples for the JSON API / colour swatches."""
    return [{"id": k, "label": lab, "hex": hx} for k, lab, hx in table]
