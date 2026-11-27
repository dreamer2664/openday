"""Original hard-edged limb helpers for the animal companions; MIT code, CC0 art."""
import math

def capsule(c, x0, y0, x1, y1, w, col, dark=None, light=None, caps=True):
    """Rounded limb between two points with an optional shadow/lit edge."""
    dx, dy = x1 - x0, y1 - y0
    ln = max(1e-6, math.hypot(dx, dy))
    nx, ny = -dy / ln, dx / ln
    half = (w - 1) / 2.0
    steps = int(ln * 2) + 3
    cols = {}
    for i in range(steps + 1):
        t = i / steps
        px, py = x0 + dx * t, y0 + dy * t
        for j in range(w):
            off = -half + j
            cols[(round(px + nx * off), round(py + ny * off))] = col
    if caps:
        c.ellipse(x0, y0, half + 0.25, half + 0.25, col)
        c.ellipse(x1, y1, half + 0.25, half + 0.25, col)
    for (kx, ky), v in cols.items():
        c.set(kx, ky, v)
    if dark is not None:
        for i in range(steps + 1):
            t = i / steps
            px, py = x0 + dx * t, y0 + dy * t
            c.set(round(px + nx * half), round(py + ny * half), dark)
    if light is not None:
        for i in range(steps + 1):
            t = i / steps
            px, py = x0 + dx * t, y0 + dy * t
            c.set(round(px - nx * half), round(py - ny * half), light)


def hand(c, x, y, skin, r=2.3):
    c.ellipse(x, y, r, r * 1.1, skin[2])
    c.rect(x + 0.4, y + r * 0.5, x + r * 0.9, y + r * 1.0, skin[1])
    c.set(int(x - r * 0.6), int(y - r * 0.6), skin[3])


# ---------------------------------------------------------------------------
# legs, skirts, shoes
# ---------------------------------------------------------------------------