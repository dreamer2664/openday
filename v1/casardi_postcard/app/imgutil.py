"""Bridge between PixelCanvas and Pillow, plus shared drawing helpers."""
from __future__ import annotations
from PIL import Image
from .pixel import PixelCanvas

def to_pil(c: PixelCanvas, scale: int = 1, bg=None) -> Image.Image:
    img = Image.new("RGBA", (c.w, c.h))
    img.putdata(c.buf)
    if bg is not None:
        base = Image.new("RGBA", img.size, bg)
        base.alpha_composite(img)
        img = base
    if scale != 1:
        img = img.resize((c.w * scale, c.h * scale), Image.NEAREST)
    return img
