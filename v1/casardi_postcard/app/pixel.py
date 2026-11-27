"""
Tiny pixel-art raster canvas.

Sprites, equipment and animals use a `PixelCanvas`; revised NES backgrounds
are canonical native PNG paintings loaded separately. The canvas uses: an RGBA palette buffer + a coverage buffer so shapes can be
painted in layers with hard 1-pixel edges and hard pixel-centre rasterisation. No antialiasing is applied to sprites
or scenery.
"""
from __future__ import annotations

import math
from .palette import RGBA, TRANSPARENT


class PixelCanvas:
    __slots__ = ("w", "h", "buf", "sil")

    def __init__(self, w: int, h: int, fill: RGBA = TRANSPARENT):
        self.w = w
        self.h = h
        self.buf = [fill] * (w * h)
        # silhouette buffer: 0 = empty, 1 = filled interior, 2 = outline
        self.sil = bytearray(w * h)

    # -- basic ------------------------------------------------------------
    def inside(self, x: int, y: int) -> bool:
        return 0 <= x < self.w and 0 <= y < self.h

    def get(self, x: int, y: int) -> RGBA:
        if self.inside(x, y):
            return self.buf[y * self.w + x]
        return TRANSPARENT

    def set(self, x: int, y: int, c: RGBA):
        x = int(x)
        y = int(y)
        if self.inside(x, y):
            self.buf[y * self.w + x] = c

    def alpha(self, x: int, y: int) -> int:
        if self.inside(x, y):
            return self.buf[y * self.w + x][3]
        return 0

    # -- primitives -------------------------------------------------------
    def rect(self, x0, y0, x1, y1, c: RGBA):
        x0, x1 = sorted((int(x0), int(x1)))
        y0, y1 = sorted((int(y0), int(y1)))
        for y in range(max(0, y0), min(self.h - 1, y1) + 1):
            row = y * self.w
            for x in range(max(0, x0), min(self.w - 1, x1) + 1):
                self.buf[row + x] = c

    def hline(self, x0, x1, y, c, width=1):
        self.rect(x0, y, x1, y + width - 1, c)

    def vline(self, x, y0, y1, c, width=1):
        self.rect(x, y0, x + width - 1, y1, c)

    def ellipse(self, cx, cy, rx, ry, c: RGBA, ss: int = 4):
        """Solid pixel-centre ellipse. No antialiasing or sparse sampling."""
        if rx <= 0 or ry <= 0:
            return
        for y in range(max(0, int(math.floor(cy - ry))),
                       min(self.h - 1, int(math.ceil(cy + ry))) + 1):
            t = 1.0 - ((y + .5 - cy) / ry) ** 2
            if t <= 0:
                continue
            dx = rx * math.sqrt(t)
            x0 = max(0, int(math.ceil(cx - dx - .5)))
            x1 = min(self.w - 1, int(math.floor(cx + dx - .5)))
            if x0 <= x1:
                row = y * self.w
                self.buf[row + x0:row + x1 + 1] = [c] * (x1 - x0 + 1)

    def circle(self, cx, cy, r, c, ss=4):
        self.ellipse(cx, cy, r, r, c, ss)

    def poly(self, pts, c: RGBA, ss: int = 4):
        """Solid scanline fill with hard, square pixel edges.

        Intersect every edge with the pixel-centre scanline, then fill ALL
        pixels between consecutive intersections (not just sampled points).
        """
        if len(pts) < 3:
            return
        y0 = max(0, int(math.floor(min(p[1] for p in pts))))
        y1 = min(self.h - 1, int(math.ceil(max(p[1] for p in pts))))
        for y in range(y0, y1 + 1):
            fy = y + .5
            xs = []
            for (ax, ay), (bx, by) in zip(pts, list(pts[1:]) + [pts[0]]):
                if (ay <= fy < by) or (by <= fy < ay):
                    xs.append(ax + (fy - ay) * (bx - ax) / (by - ay))
            xs.sort()
            for xa, xb in zip(xs[::2], xs[1::2]):
                x0 = max(0, int(math.ceil(xa - .5)))
                x1 = min(self.w - 1, int(math.floor(xb - .5)))
                if x0 <= x1:
                    row = y * self.w
                    self.buf[row + x0:row + x1 + 1] = [c] * (x1 - x0 + 1)

    def line(self, x0, y0, x1, y1, c: RGBA, width: int = 1):
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        off = width // 2
        while True:
            if width <= 1:
                self.set(x0, y0, c)
            else:
                self.rect(x0 - off, y0 - off, x0 - off + width - 1, y0 - off + width - 1, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def thick_curve(self, pts, c: RGBA, width: int = 2):
        for i in range(len(pts) - 1):
            self.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, width)

    def flood_outline(self, color: RGBA, only_empty_neighbours: bool = True):
        """Outline every opaque pixel that touches a transparent pixel."""
        add = []
        w, h, buf = self.w, self.h, self.buf
        for y in range(h):
            for x in range(w):
                i = y * w + x
                if buf[i][3] == 0:
                    continue
                if (x == 0 or buf[i - 1][3] == 0 or x == w - 1 or buf[i + 1][3] == 0
                        or y == 0 or buf[i - w][3] == 0 or y == h - 1 or buf[i + w][3] == 0):
                    add.append(i)
        for i in add:
            buf[i] = color

    def outline_all(self, color: RGBA):
        """Draw a 1px border *around* the sprite (leaves interior intact)."""
        w, h, buf = self.w, self.h, self.buf
        add = []
        for y in range(h):
            for x in range(w):
                i = y * w + x
                if buf[i][3] != 0:
                    continue
                n = ((x > 0 and buf[i - 1][3]) or (x < w - 1 and buf[i + 1][3])
                     or (y > 0 and buf[i - w][3]) or (y < h - 1 and buf[i + w][3]))
                if n:
                    add.append(i)
        for i in add:
            buf[i] = color

    # -- compositing ------------------------------------------------------
    def blit(self, other: "PixelCanvas", ox: int, oy: int, tint=None, alpha=255,
             flip: bool = False):
        for y in range(other.h):
            ty = oy + y
            if ty < 0 or ty >= self.h:
                continue
            for x in range(other.w):
                sx = other.w - 1 - x if flip else x
                c = other.buf[y * other.w + sx]
                if c[3] == 0:
                    continue
                tx = ox + x
                if tx < 0 or tx >= self.w:
                    continue
                if tint is not None:
                    c = tint_pixel(c, tint)
                if alpha < 255:
                    c = (c[0], c[1], c[2], int(c[3] * alpha / 255))
                self.buf[ty * self.w + tx] = c

    def copy(self) -> "PixelCanvas":
        c = PixelCanvas(self.w, self.h)
        c.buf = list(self.buf)
        c.sil = bytearray(self.sil)
        return c

    def scale_nearest(self, factor: int) -> "PixelCanvas":
        out = PixelCanvas(self.w * factor, self.h * factor)
        for y in range(self.h):
            for x in range(self.w):
                c = self.buf[y * self.w + x]
                if c[3] == 0:
                    continue
                for dy in range(factor):
                    row = (y * factor + dy) * out.w
                    for dx in range(factor):
                        out.buf[row + x * factor + dx] = c
        return out

    def bounds(self):
        x0, y0, x1, y1 = self.w, self.h, -1, -1
        for y in range(self.h):
            for x in range(self.w):
                if self.buf[y * self.w + x][3]:
                    x0 = min(x0, x)
                    x1 = max(x1, x)
                    y0 = min(y0, y)
                    y1 = max(y1, y)
        if x1 < 0:
            return (0, 0, 0, 0)
        return (x0, y0, x1, y1)


def tint_pixel(c: RGBA, tint: RGBA) -> RGBA:
    """Multiply a pixel by a tint colour (keeps alpha)."""
    return (
        max(0, min(255, c[0] * tint[0] // 255)),
        max(0, min(255, c[1] * tint[1] // 255)),
        max(0, min(255, c[2] * tint[2] // 255)),
        c[3],
    )


def shadow_from(canvas: PixelCanvas, color=(20, 18, 26, 120), squash=0.30,
                dx=0, dy=0) -> PixelCanvas:
    """Build a soft-ish ground shadow canvas out of a sprite silhouette by
    squashing the opaque mask vertically."""
    sh = PixelCanvas(canvas.w, canvas.h)
    y0 = int(canvas.h * (1 - squash))
    for y in range(canvas.h):
        sy = int(y0 + (y - y0) * squash) if y >= y0 else y
        pass
    # Simple approach: copy mask into a squashed band under the sprite
    bx0, by0, bx1, by1 = canvas.bounds()
    if bx1 < bx0:
        return sh
    hgt = by1 - by0 + 1
    baseline = by1
    for y in range(by0, by1 + 1):
        for x in range(bx0, bx1 + 1):
            if canvas.get(x, y)[3]:
                ty = int(baseline - (baseline - y) * squash) + dy
                sh.set(x + dx, ty, color)
    return sh
