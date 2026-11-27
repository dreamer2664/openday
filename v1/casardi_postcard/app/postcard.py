"""
Postcard composer.

One function, `compose(job, width, quality)` returns a PIL image of the card.
The photo composite is rendered at the requested width (3000 px for the
final PNG, 1200 px for the preview). NES artwork is composed on its native
600 x 400 pixel grid, then enlarged with nearest-neighbour. Neither mode
captures or enlarges a screenshot of the interface.

Photographic mode pipeline
--------------------------
    photograph  ->  crop / grade / vignette / grain
    sprite      ->  nearest-neighbour scale  ->  palette harmonisation
                    (ambient tint + shadow lift + light-side warm rim)
    contact shadow + projected shadow (sheared silhouette, gaussian blur)
    ambient occlusion strip where the sprite meets the ground
    foreground occluders cut from the photograph itself
    typography  ->  vector-crisp text with a discreet printed frame

Pixel-art (NES) mode
--------------------
    original 600x400 scene  ->  x5 nearest  ->  3000x2000
    sprite + companion on the same grid, hard shadows, no photo effects
    Press Start 2P typography
"""
from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

from .animals import draw_animal
from .character import GROUND, H as SPR_H, W as SPR_W, render as render_char
from .imgutil import to_pil
from .scenes import NES_SCENES, PHOTO_SCENES
from .nes_art import load_nes_art

CARD_W, CARD_H = 3000, 2000
PREVIEW_W = 1200

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(HERE, "assets", "photos")
FONTS = os.path.join(HERE, "assets", "fonts")

FONT_FILES = {
    "cinzel": "Cinzel.ttf",
    "garamond": "EBGaramond.ttf",
    "pixel": "PressStart2P-Regular.ttf",
}

TEXT = {
    "school": "LICEO ALFREDO CASARDI",
    "event": "OPEN DAY 2026/27",
    "city": "BARLETTA",
}


# ---------------------------------------------------------------------------
# resources
# ---------------------------------------------------------------------------
@lru_cache(maxsize=32)
def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = os.path.join(FONTS, FONT_FILES[name])
    font = ImageFont.truetype(path, size)
    return font


@lru_cache(maxsize=2)
def _photo_source(scene_id: str) -> Image.Image:
    path = os.path.join(PHOTOS, scene_id, "source.jpg")
    with Image.open(path) as source:
        return source.convert("RGB")


@lru_cache(maxsize=8)
def _nes_scene(scene_id: str) -> Image.Image:
    return load_nes_art(scene_id)


# ---------------------------------------------------------------------------
# photographic background
# ---------------------------------------------------------------------------
def _grade(img: Image.Image, cfg: dict) -> Image.Image:
    """Identical pixel operations in row tiles, bounding HD float-array RAM.

    A full 3000x2000 float RGB temporary is 72 MB; creating several at once
    needlessly inflated the kiosk worker high-water mark. Tiles preserve the
    original arithmetic/quantisation without changing the artwork.
    """
    src=np.asarray(img)
    out=np.empty_like(src)
    tint=np.array(cfg["ambient"]["tint"],dtype=np.float32)
    strength=cfg["ambient"]["strength"]*.5
    for y in range(0,img.height,128):
        arr=src[y:y+128].astype(np.float32)
        arr=127.5+(arr-127.5)*1.06
        lum=arr.mean(axis=2,keepdims=True)/255.0
        cast=lum*255.0+(tint[None,None,:]-128.0)*.55
        arr=arr*(1-strength)+cast*strength
        gray=arr.mean(axis=2,keepdims=True)
        arr=gray+(arr-gray)*.90
        out[y:y+128]=np.clip(arr,0,255).astype(np.uint8)
    return Image.fromarray(out)


def _vignette(img: Image.Image, amount: float) -> Image.Image:
    w,h=img.size
    src=np.asarray(img);out=np.empty_like(src)
    nx=(np.arange(w,dtype=np.float32)[None,:]-w/2)/(w/2)
    for y in range(0,h,128):
        ny=(np.arange(y,min(h,y+128),dtype=np.float32)[:,None]-h/2)/(h/2)
        r=np.sqrt(nx**2+ny**2)/1.414
        mask=np.clip(1.0-amount*(r**2.1)*1.6,0.0,1.0)[...,None]
        arr=src[y:y+128].astype(np.float32)*mask
        out[y:y+128]=np.clip(arr,0,255).astype(np.uint8)
    return Image.fromarray(out)


def _grain(img: Image.Image, amount: float, seed: int = 7) -> Image.Image:
    if amount<=0:return img
    rng=np.random.default_rng(seed)
    w,h=img.size
    src=np.asarray(img);out=np.empty_like(src)
    for y in range(0,h,128):
        rows=min(128,h-y)
        noise=rng.normal(0,255*amount,(rows,w,1)).astype(np.float32)
        arr=src[y:y+rows].astype(np.float32)+noise
        out[y:y+rows]=np.clip(arr,0,255).astype(np.uint8)
    return Image.fromarray(out)


def photo_background(scene_id: str, width: int) -> tuple[Image.Image, float]:
    """Crop + grade the source photograph for the card size.

    Returns (image, scale) where scale = width / CARD_W so callers can convert
    layout units to pixels.
    """
    cfg = PHOTO_SCENES[scene_id]
    src = _photo_source(scene_id)
    sw, sh = src.size
    cx0, cy0, cx1, cy1 = cfg["crop"]
    box = (int(sw * cx0), int(sh * cy0), int(sw * cx1), int(sh * cy1))
    crop = src.crop(box)
    # resize to cover the 3:2 card, centre-cropping the overflow
    target_ratio = CARD_W / CARD_H
    cw, ch = crop.size
    if cw / ch > target_ratio:
        new_w = int(ch * target_ratio)
        left = (cw - new_w) // 2
        crop = crop.crop((left, 0, left + new_w, ch))
    else:
        new_h = int(cw / target_ratio)
        top = int((ch - new_h) * cfg.get("crop_anchor_y", .5))
        crop = crop.crop((0, top, cw, top + new_h))
    height = int(round(width * CARD_H / CARD_W))
    img = crop.resize((width, height), Image.LANCZOS)
    img = _grade(img, cfg)
    img = _vignette(img, cfg["vignette"])
    img = _grain(img, cfg["grain"])
    return img, width / CARD_W


def nes_background(scene_id: str, width: int) -> Image.Image:
    scene = _nes_scene(scene_id)
    height = int(round(width * CARD_H / CARD_W))
    return scene.resize((width, height), Image.NEAREST)


# ---------------------------------------------------------------------------
# sprite preparation
# ---------------------------------------------------------------------------
def crop_sprite(canvas) -> Image.Image:
    """Tight crop with an alpha bbox, keeping the ground line."""
    img = to_pil(canvas)
    bbox = img.getbbox()
    if bbox is None:
        return img
    x0, y0, x1, y1 = bbox
    cropped = img.crop((max(0, x0 - 1), max(0, y0 - 1), min(img.width, x1 + 1), min(img.height, y1)))
    if canvas.w==64 and canvas.h==64:cropped.info["_anchor_x"]=32-max(0,x0-1)
    return cropped


def sprite_parts(canvas):
    """Return (rgba_array, ground_offset_from_top_in_sprite_units)."""
    img = crop_sprite(canvas)
    bbox = canvas.bounds()
    # ground offset: distance from the top of the cropped sprite to the soles
    top = max(0, bbox[1] - 1) if bbox[3] > bbox[1] else 0
    return img, top


def harmonise(sprite: Image.Image, ambient_rgb, strength=0.30, lift=0.12,
              warm_rgb=(255, 244, 224), warm_strength=0.10,
              desat: float = 1.0) -> Image.Image:
    """Palette harmonisation for the photographic mode.

    * ambient tint: pushes the sprite towards the light colour of the place
    * shadow lift: raises the darkest pixels so the sprite does not punch a
      black hole into the photograph
    * warm highlights: adds a touch of the scene's warm light to bright pixels
    """
    arr = np.asarray(sprite).astype(np.float32)
    rgb = arr[..., :3]
    alpha = arr[..., 3:4]
    amb = np.array(ambient_rgb, dtype=np.float32)
    warm = np.array(warm_rgb, dtype=np.float32)
    lum = rgb.mean(axis=2, keepdims=True) / 255.0
    # ambient tint
    rgb = rgb * (1 - strength) + rgb * (amb / max(1, float(amb.mean()))) * strength
    # shadow lift towards the ambient colour
    shadow_mask = np.clip(1.0 - lum * 1.6, 0.0, 1.0)
    rgb = rgb + (amb - rgb) * shadow_mask * lift
    # warm highlight
    hi = np.clip((lum - 0.55) * 1.8, 0.0, 1.0)
    rgb = rgb + (warm - rgb) * hi * warm_strength
    if desat < 1.0:
        g = rgb.mean(axis=2, keepdims=True)
        rgb = g + (rgb - g) * desat
    out = np.concatenate([np.clip(rgb, 0, 255), alpha], axis=2)
    result=Image.fromarray(out.astype(np.uint8));result.info.update(sprite.info)
    return result


def sprite_scale(height: float, reference: float = 48) -> int:
    """Integer nearest-neighbour scale keeps every pixel square and even."""
    return max(1, int(round(height / reference)))


def place_sprite(card: Image.Image, sprite: Image.Image, cx: float, ground_y: float,
                 height: float, flip=False, by_bbox=False):
    """Scale with nearest-neighbour and paste so the soles sit on ground_y."""
    scale = sprite_scale(height,sprite.height) if not by_bbox else max(
        1, int(round(height / max(1, sprite.height))))
    new_w = max(1, int(round(sprite.width * scale)))
    new_h = max(1, int(round(sprite.height * scale)))
    scaled = sprite.resize((new_w, new_h), Image.NEAREST)
    if flip:
        scaled = scaled.transpose(Image.FLIP_LEFT_RIGHT)
    anchor=sprite.info.get("_anchor_x",sprite.width/2)
    if flip:anchor=sprite.width-anchor
    x = int(round(cx - anchor*scale))
    y = int(round(ground_y - new_h))
    card.alpha_composite(scaled, (x, y))
    return (x, y, new_w, new_h)


# ---------------------------------------------------------------------------
# shadows (photographic mode)
# ---------------------------------------------------------------------------
def compose_shadow(card, sprite, pos, ground_y, cx, light):
    """A contact ellipse + an inverse-affine cast silhouette on the ground.

    The direction is the OPPOSITE of the incident light. Blur affects shadows
    only; the source sprite never goes through any resampling other than NN.
    """
    _, _, w, h = pos
    cx += (sprite.width/2-sprite.info.get("_anchor_x",sprite.width/2))*(w/sprite.width)
    a = sprite.getchannel("A").resize((max(1, int(w)), max(1, int(h))), Image.Resampling.NEAREST)
    foot = a.crop((0, max(0, a.height-int(h*.08)), a.width, a.height)).getbbox()
    foot_w = (foot[2]-foot[0]) if foot else w*.5
    foot_cx = cx - w/2 + ((foot[0]+foot[2])/2 if foot else w/2)
    unit = max(1., h/100.)
    contact = Image.new("RGBA",card.size)
    d=ImageDraw.Draw(contact)
    ew=max(8,foot_w*.95);eh=max(3,unit*1.15)
    d.ellipse((foot_cx-ew/2,ground_y-eh,foot_cx+ew/2,ground_y+eh),fill=(20,19,23,145))
    contact=contact.filter(ImageFilter.GaussianBlur(max(1,unit*.40)))
    card.alpha_composite(contact)
    dx = int(-light["dx"] * h * .26)
    depth = max(4, int(h * max(.018, light.get("dy", .2)*.15)))
    shift = min(0, dx)
    cast = a.transform((int(w)+abs(dx)+4,depth),Image.Transform.AFFINE,
                       (1,-dx/depth,shift,0,-h/depth,h-1),
                       resample=Image.Resampling.BILINEAR)
    fade=Image.linear_gradient("L").rotate(180).resize(cast.size)
    cast=ImageChops.multiply(cast,fade)
    cast=cast.point(lambda v:int(v*.35*light["strength"]))
    cast=cast.filter(ImageFilter.GaussianBlur(max(1,unit*.55)))
    shadow=Image.new("RGBA",cast.size,(23,21,26,0));shadow.putalpha(cast)
    card.alpha_composite(shadow,(int(cx-w/2+shift),int(ground_y-unit*.5)))


# ---------------------------------------------------------------------------
# foreground occlusion cut from the photograph
# ---------------------------------------------------------------------------
def apply_occluders(card, bg, kind, ground_y, cx, sprite_w):
    """Small blades sampled FROM the real foreground, only at the soles.
    Never paint a translucent band across an entire person's lower legs.
    """
    if kind != "grass":
        return
    rng=np.random.default_rng(19)
    unit=bg.width/CARD_W
    mask=Image.new("L",bg.size,0);d=ImageDraw.Draw(mask)
    for _ in range(36):
        x=int(cx+rng.uniform(-.46,.46)*sprite_w)
        y=int(ground_y+rng.uniform(-1,4)*unit)
        h=max(1,int(rng.uniform(4,11)*unit));w=max(1,int(rng.uniform(1,4)*unit))
        d.polygon([(x-w,y),(x+1,y-h),(x+w,y)],fill=220)
    fore=bg.convert("RGBA");fore.putalpha(mask);card.alpha_composite(fore)


# ---------------------------------------------------------------------------
# typography
# ---------------------------------------------------------------------------
def _spaced_text(draw, xy, text, font, fill, tracking=0, shadow=None, stroke=0):
    x, y = xy
    for ch in text:
        if shadow is not None:
            draw.text((x + shadow[0], y + shadow[1]), ch, font=font, fill=shadow[2])
        draw.text((x, y), ch, font=font, fill=fill, stroke_width=stroke,
                  stroke_fill=shadow[2] if shadow else fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def _spaced_width(draw, text, font, tracking):
    return sum(draw.textlength(c, font=font) for c in text) + tracking * max(0, len(text) - 1)


def draw_nes_signature(card: Image.Image, job: dict, zone: str):
    """Compact native-pixel nameplate; only the four permitted text fields."""
    draw=ImageDraw.Draw(card);draw.fontmode='1'
    rows=[(TEXT['school'],8,'#f5f0d8',12),(TEXT['event'],7,'#cbd7e4',11),(TEXT['city'],6,'#79dcc2',10)]
    name=(job.get('name') or '').strip()
    if name:rows.append((name,8,'#f1c675',12))
    fitted=[]
    for label,size,color,advance in rows:
        while size>6 and draw.textlength(label,font=_font('pixel',size))>202:size-=1
        fitted.append((label,_font('pixel',size),color,advance))
    w=int(max(draw.textlength(label,font=font) for label,font,_,_ in fitted))+18
    h=sum(r[3] for r in fitted)+12
    x=18 if zone!='top-right' else card.width-18-w;y=18
    draw.rectangle((x+4,y+4,x+w+3,y+h+3),fill='#090e1d')
    draw.rectangle((x+1,y,x+w-2,y+h-1),fill='#45516c')
    draw.rectangle((x,y+1,x+w-1,y+h-2),fill='#45516c')
    draw.rectangle((x+2,y+2,x+w-3,y+h-3),fill='#151b32')
    for xx,yy,sign in ((x+2,y+2,1),(x+w-8,y+2,1),(x+2,y+h-3,1),(x+w-8,y+h-3,1)):
        draw.rectangle((xx,yy,xx+5,yy),fill='#f1c675')
    yy=y+6
    for label,font,color,advance in fitted:
        draw.text((x+9,yy),label,font=font,fill=color);yy+=advance


def draw_texts(card: Image.Image, job: dict, scale: float, zone: str, mode: str):
    """Essential text only: school, event, city, optional name."""
    if mode == 'nes':
        draw_nes_signature(card,job,zone)
        return
    W, H = card.size
    px = lambda v: int(round(v * scale))
    ox, oy = card.size
    draw = ImageDraw.Draw(card)
    if mode == "nes":
        draw.fontmode = "1"

    if mode == "photo":
        f_school = _font("cinzel", px(74))
        f_event = _font("garamond", px(56))
        f_name = _font("garamond", px(66))
        ink = (252, 249, 242, 255)
        mute = (245, 238, 224, 250)
        accent = (206, 176, 108, 255)
        track_school = px(9)
        track_event = px(7)
        track_city = px(11)
        f_city = _font("cinzel", px(44))
        margin = px(150)
    else:
        f_school = _font("pixel", px(50))
        f_event = _font("pixel", px(34))
        f_city = _font("pixel", px(30))
        f_name = _font("pixel", px(38))
        ink = (250, 248, 240, 255)
        mute = (222, 226, 214, 255)
        accent = (240, 206, 120, 255)
        track_school = px(4)
        track_event = px(3)
        track_city = px(3)
        margin = px(110)

    if mode == "nes" and job.get("scene") in ("biblioteca","foro"):
        ink=(44,36,28,255);mute=(67,49,33,255);accent=(108,66,32,255)

    # measure the block
    w_school = _spaced_width(draw, TEXT["school"], f_school, track_school)
    w_event = _spaced_width(draw, TEXT["event"], f_event, track_event)
    w_city = _spaced_width(draw, TEXT["city"], f_city, track_city)
    name = (job.get("name") or "").strip()
    name_max = max(w_school, int(W * .42))
    while name and _spaced_width(draw, name, f_name, px(3)) > name_max and f_name.size > px(28):
        f_name = _font("garamond" if mode == "photo" else "pixel", f_name.size-1)
    w_name = _spaced_width(draw, name, f_name, px(3)) if name else 0
    block_w = max(w_school, w_event, w_city, w_name)
    line_gap = px(18)
    line_h = px(96) + line_gap * 2
    block_h = px(74) + px(56) + px(44) + line_gap * 3 + (px(80) if name else 0)

    if zone == "top-left":
        bx, by = margin, margin
    elif zone == "top-right":
        bx, by = W - margin - block_w, margin
    elif zone == "top-center":
        bx, by = (W-block_w)/2, margin
    elif zone == "right":
        bx, by = W - margin - block_w, int(H * 0.13)
    elif zone == "bottom-left":
        bx, by = margin, H - margin - block_h
    elif zone == "left":
        bx, by = margin, int(H * 0.14)
    else:
        bx, by = margin, margin

    # The lettering adapts to the underlying photograph instead of covering
    # half the sky with an artificial grey rectangle.
    text_shadow = (px(2), px(2), (18, 18, 22, 190))
    if mode == "nes" and job.get("scene") in ("biblioteca","foro"):
        text_shadow = (0,0,(44,36,28,255))
    if mode == "photo":
        probe = card.crop((int(bx), int(by), int(min(W,bx+block_w)), int(min(H,by+block_h)))).convert("L")
        lum = float(np.asarray(probe).mean())
        if lum > 143:
            ink=(29,39,45,255);mute=(41,49,53,255);accent=(111,79,30,255)
            text_shadow=(px(1),px(1),(250,246,234,130))
        else:
            if job.get("scene") == "foro":
                # The paving is detailed; lighter city type plus a feathered
                # local darkroom burn, rather than an opaque rectangle.
                accent=(244,224,181,255)
            # Broad radial falloff, no visible vertical edge.
            xx=np.arange(W,dtype=np.float32)[None,:]
            ccx=bx+block_w*.36;ccy=by+block_h*.42
            amount=70 if job.get("scene")=="foro" else 32
            alpha=np.empty((H,W),dtype=np.uint8)
            for row in range(0,H,128):
                yy=np.arange(row,min(H,row+128),dtype=np.float32)[:,None]
                rr=((xx-ccx)/max(1,block_w*.90))**2+((yy-ccy)/max(1,block_h*1.3))**2
                alpha[row:row+128]=np.uint8(np.clip(amount*np.exp(-rr*2),0,amount))
            scrim=Image.new("RGBA",card.size,(13,16,21,0));scrim.putalpha(Image.fromarray(alpha));card.alpha_composite(scrim)

    # school name with rules
    y = by
    rule_w = px(90)
    draw.line([bx, y + px(6), bx + rule_w, y + px(6)], fill=accent, width=max(1, px(3)))
    _spaced_text(draw, (bx, y), TEXT["school"], f_school, ink, track_school,
                 shadow=text_shadow, stroke=max(1,px(2)) if mode=="photo" else 0)
    y += px(74) + line_gap
    _spaced_text(draw, (bx, y), TEXT["event"], f_event, mute, track_event,
                 shadow=text_shadow, stroke=max(1,px(2)) if mode=="photo" else 0)
    y += px(56) + line_gap
    _spaced_text(draw, (bx, y), TEXT["city"], f_city, accent, track_city,
                 shadow=text_shadow, stroke=max(1,px(2)) if mode=="photo" else 0)
    if name:
        y += px(44) + line_gap
        if mode == "photo":
            _spaced_text(draw, (bx, y), name, f_name, ink, px(3), shadow=text_shadow, stroke=max(1,px(2)) if mode=="photo" else 0)
        else:
            _spaced_text(draw, (bx, y), name, f_name, ink, px(3), shadow=text_shadow, stroke=max(1,px(2)) if mode=="photo" else 0)


def draw_frame(card: Image.Image, scale: float, mode: str):
    """Discreet printed frame: double hairline + corner ticks."""
    W, H = card.size
    px = lambda v: int(round(v * scale))
    overlay = Image.new("RGBA", card.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    if mode == "photo":
        ink = (246, 240, 226, 110)
        ink2 = (246, 240, 226, 55)
        m1, m2 = px(54), px(70)
        w1, w2 = max(1, px(2)), max(1, px(1))
    else:
        ink = (16, 14, 20, 210)
        ink2 = (16, 14, 20, 120)
        m1, m2 = px(40), px(52)
        w1, w2 = max(2, px(6)), max(1, px(3))
    d.rectangle([m1, m1, W - m1, H - m1], outline=ink, width=w1)
    d.rectangle([m2, m2, W - m2, H - m2], outline=ink2, width=w2)
    # corner ticks
    t = px(90)
    for cx, cy, sx, sy in ((m1, m1, 1, 1), (W - m1, m1, -1, 1),
                           (m1, H - m1, 1, -1), (W - m1, H - m1, -1, -1)):
        d.line([cx, cy, cx + sx * t, cy], fill=ink, width=w1)
        d.line([cx, cy, cx, cy + sy * t], fill=ink, width=w1)
    card.alpha_composite(overlay)


# ---------------------------------------------------------------------------
# main entry point
# ---------------------------------------------------------------------------
# companion height as a fraction of the character height, per species
COMPANION_RATIO = {
    "gatto": 0.30, "cane": 0.40, "volpe": 0.36, "gufo": 0.34,
    "coniglio": 0.32, "corvo": 0.30, "tartaruga": 0.10, "drago": 0.34,
}


@lru_cache(maxsize=8)
def companion_reference_height(kind):
    from .animals import ANIMALS
    info=ANIMALS[kind]
    return max(crop_sprite(draw_animal(kind,info["variants"][0][0],pose)).height for pose in info["poses"])


def compose(job: dict, width: int = CARD_W, *, editor: bool = False) -> Image.Image:
    from . import layout_edit as edit
    c=edit.normalise(job.get("composition"))
    if editor or c["actor"] is not None or c["stickers"] or edit.has_custom_plaque(job):
        return _compose_optional(job,width,editor=editor)
    mode = job.get("mode", "photo")
    if mode == "nes":
        return _compose_nes(job, width)
    scene_id = job.get("scene", "casardi")
    if scene_id not in PHOTO_SCENES:
        scene_id = "casardi"
    height = int(round(width * CARD_H / CARD_W))
    scale = width / CARD_W

    if mode == "nes":
        bg = nes_background(scene_id, width)
        layout = NES_SCENES[scene_id]
        card = bg.convert("RGBA")
        scale = width / 600.0        # NES layouts live in the 600x400 scene space
    else:
        bg, scale = photo_background(scene_id, width)
        layout = PHOTO_SCENES[scene_id]
        card = bg.convert("RGBA")

    def S(v):
        return v * scale

    ground_full = layout["ground_y"]
    ground = S(ground_full)

    # --- character
    spec = dict(job.get("character") or {})
    sprite = crop_sprite(render_char(spec, style=mode))
    if mode == "photo":
        cfg = PHOTO_SCENES[scene_id]
        sprite = harmonise(sprite, cfg["ambient"]["tint"], cfg["ambient"]["strength"],
                           lift=0.035, warm_rgb=cfg["light"]["warm"],
                           warm_strength=0.10 + cfg["light"]["strength"] * 0.08,
                           desat=cfg.get("sprite_desat", 1.0))

    if mode == "nes":
        ch_layout = layout["char"]
        char_h = S(ch_layout["h"])
        char_x = S(ch_layout["x"])
    else:
        char_h = S(layout["char"]["h"])
        char_x = S(layout["char"]["x"])

    # shadow first (behind the sprite)
    if mode == "photo":
        cs = sprite_scale(char_h,sprite.height)
        compose_shadow(card, sprite, (0, 0, sprite.width * cs, sprite.height * cs),
                       ground, char_x, PHOTO_SCENES[scene_id]["light"])
    pos = place_sprite(card, sprite, char_x, ground, char_h)

    # --- companion
    comp = job.get("companion")
    if comp and comp.get("animal"):
        asprite = crop_sprite(draw_animal(comp["animal"], comp.get("variant", ""),
                                          comp.get("pose", ""), style=mode))
        if mode == "photo":
            cfg = PHOTO_SCENES[scene_id]
            asprite = harmonise(asprite, cfg["ambient"]["tint"], cfg["ambient"]["strength"],
                                lift=0.035, warm_rgb=cfg["light"]["warm"],
                                warm_strength=0.10 + cfg["light"]["strength"] * 0.08,
                                desat=cfg.get("sprite_desat", 1.0))
        ratio = COMPANION_RATIO.get(comp["animal"], 0.32)
        if mode == "nes":
            lay = layout["comp"]
            c_h, c_x, flip = char_h * ratio, S(lay["x"]), False
        else:
            lay = layout["companion"]
            c_h = pos[3] * ratio * asprite.height / companion_reference_height(comp["animal"])
            c_x = S(lay["x"])
            flip = bool(lay.get("flip"))
        if mode == "photo":
            asc = max(1, int(round(c_h / max(1, asprite.height))))
            compose_shadow(card, asprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if flip else asprite, (0, 0, asprite.width * asc, asprite.height * asc),
                           ground, c_x, PHOTO_SCENES[scene_id]["light"])
        place_sprite(card, asprite, c_x, ground, c_h, flip=flip, by_bbox=True)

    # --- foreground occlusion from the photograph itself
    if mode == "photo":
        for occ in PHOTO_SCENES[scene_id].get("occluders", []):
            apply_occluders(card, bg, occ, ground, char_x, char_h * 0.5)

    # --- typography + frame (always laid out in card units, 3000x2000)
    tscale = width / CARD_W
    draw_frame(card, tscale, mode)
    draw_texts(card, job, tscale, layout["text_zone"], mode)
    return card.convert("RGB")


def _compose_nes(job, width):
    scene_id=job.get("scene","casardi")
    if scene_id not in NES_SCENES: scene_id="casardi"
    lay=NES_SCENES[scene_id]
    card=_nes_scene(scene_id).convert("RGBA")
    char=crop_sprite(render_char(dict(job.get("character") or {}),style="nes"))
    char_scale=max(1,round(lay["char"]["h"]/char.height))
    actual_h=char.height*char_scale
    def put(sprite,cx,gy,h):
        sc=max(1,round(h/sprite.height));ww=sprite.width*sc
        sh=Image.new("RGBA",card.size)
        d=ImageDraw.Draw(sh)
        d.ellipse((int(cx-ww*.35),gy-1,int(cx+ww*.4),gy+3),fill=(21,26,27,90))
        card.alpha_composite(sh)
        return place_sprite(card,sprite,cx,gy,h,by_bbox=True)
    put(char,lay["char"]["x"],lay["ground_y"],actual_h)
    comp=job.get("companion")
    if comp and comp.get("animal"):
        spr=crop_sprite(draw_animal(comp["animal"],comp.get("variant",""),comp.get("pose",""),style="nes"))
        hh=actual_h*COMPANION_RATIO.get(comp["animal"],.32)*spr.height/companion_reference_height(comp["animal"])
        put(spr,lay["comp"]["x"],lay["ground_y"],hh)
    draw_frame(card,.2,"nes")
    draw_texts(card,job,.2,lay["text_zone"],"nes")
    return card.convert("RGB").resize((width,round(width*2/3)),Image.Resampling.NEAREST)


def compose_preview(job: dict) -> Image.Image:
    return compose(job, PREVIEW_W)


def compose_full(job: dict) -> Image.Image:
    return compose(job, CARD_W)


def _compose_optional(job,width,*,editor=False):
    """Same HD renderer, with validated independent composition and edit-only layers.
    The edit layers never enter an exported PNG, the QR store, or a visitor file.
    """
    from . import layout_edit as edit
    nes=job.get('mode')=='nes';sid=job.get('scene','casardi');native=600 if nes else width;k=native/600
    lay=(NES_SCENES if nes else PHOTO_SCENES)[sid]
    bg=_nes_scene(sid).convert('RGB') if nes else photo_background(sid,native)[0]
    card=bg.convert('RGBA');clean=card.copy() if editor else None;actors=Image.new('RGBA',card.size)
    person=crop_sprite(render_char(dict(job.get('character') or {}),style=job['mode']))
    comp=job.get('companion');animal=crop_sprite(draw_animal(comp['animal'],comp.get('variant',''),comp.get('pose',''),style=job['mode'])) if comp else None
    geo=edit.actor_geometry(job,edit.descriptor(person),edit.descriptor(animal) if animal else None,companion_reference_height(comp['animal']) if comp else 1)
    def put(im,g,flip=False):
        if not nes:
            cfg=PHOTO_SCENES[sid];im=harmonise(im,cfg['ambient']['tint'],cfg['ambient']['strength'],lift=.035,warm_rgb=cfg['light']['warm'],warm_strength=.10+cfg['light']['strength']*.08,desat=cfg.get('sprite_desat',1))
        if flip:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        w,h=round(g['w']*k),round(g['h']*k);cx,ground=g['cx']*k,g['ground']*k
        if nes:
            sh=Image.new('RGBA',card.size);d=ImageDraw.Draw(sh);d.ellipse((int(cx-w*.35),ground-1,int(cx+w*.4),ground+3),fill=(21,26,27,90));actors.alpha_composite(sh)
        else:compose_shadow(actors,im,(0,0,w,h),ground,cx,PHOTO_SCENES[sid]['light'])
        actors.alpha_composite(im.resize((max(1,w),max(1,h)),Image.Resampling.NEAREST),(round(g['x']*k),round(g['y']*k)))
    put(person,geo['character'])
    if animal:put(animal,geo['companion'],not nes and bool(lay['companion'].get('flip')))
    card.alpha_composite(actors)
    if not nes:
        for occ in lay.get('occluders',[]):
            g=geo['character'];apply_occluders(card,bg,occ,g['ground']*k,g['cx']*k,g['h']*k*.5)
            if animal:
                g=geo['companion'];apply_occluders(card,bg,occ,g['ground']*k,g['cx']*k,g['w']*k)
    plaque=None
    for image in ([card,clean] if editor else [card]):
        draw_frame(image,native/3000,job['mode'])
        if edit.has_custom_plaque(job):plaque=edit.draw_plaque(image,job,lay['text_zone'])
        else:draw_texts(image,job,native/3000,lay['text_zone'],job['mode'])
    payload=None
    if editor:
        bbox=actors.getbbox() or (0,0,1,1)
        payload=dict(clean=clean.convert('RGB'),ghost=actors.crop(bbox),meta=dict(**geo,ghost=dict(x=bbox[0]/k,y=bbox[1]/k,w=(bbox[2]-bbox[0])/k,h=(bbox[3]-bbox[1])/k),stickers=[edit.sticker_geometry(i) for i in edit.normalise(job.get('composition'))['stickers']],plaque=plaque))
    else:edit.draw_stickers(card,job)
    result=card.convert('RGB')
    if nes and width!=600:result=result.resize((width,round(width*2/3)),Image.Resampling.NEAREST)
    if payload:
        if nes and width!=600:payload['clean']=payload['clean'].resize(result.size,Image.Resampling.NEAREST)
        result.editor=payload
    return result
