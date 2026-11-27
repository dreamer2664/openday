#!/usr/bin/env python3
"""
Generatore Pixel Art Artigianale v2.0 + Colonna Sonora Chiptune 8-Bit Multi-Sezione
per "OPERAZIONE EIPASS — IL CASARDI IN 8 BIT".

Produce sprite pixel-art ombreggiati e dettagliati al singolo pixel:
  - assets/sprites/characters_sheet.png  (6 personaggi x 13 pose = 78 frame 32x36)
  - assets/sprites/portraits_sheet.png   (7 personaggi x 6 espressioni = 42 ritratti 64x64)
  - assets/sprites/tileset_casardi.png   (32 tile architettonici 16x16 con dithering e texture)
  - assets/sprites/enemies_props.png     (nemici animati, 2 mid-boss, Boss Sofista 48x56, oggetti Casardi)
  - assets/sprites/TAVOLA_PERSONAGGI.png (tavola di verifica 1x, 3x e silhouette)
  - assets/audio/*.wav                   (8 tracce chiptune multi-sezione + 16 SFX originali)
  - src/assets/embeddedSprites.js        (data-URI PNG per avvio istantaneo 100% offline)
"""

import base64
import math
import os
import struct
import wave
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES_DIR = os.path.join(ROOT, "assets", "sprites")
AUDIO_DIR = os.path.join(ROOT, "assets", "audio")
SRC_ASSETS_DIR = os.path.join(ROOT, "src", "assets")

os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(SRC_ASSETS_DIR, exist_ok=True)


def rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


OUT = rgba("#111019")
SKIN_HI = rgba("#ffe3cc")
SKIN = rgba("#f6c5a2")
SKIN_MID = rgba("#e0a17c")
SKIN_SH = rgba("#bd7b58")
WHITE = rgba("#faf8f5")
EYE_BLK = rgba("#161422")


def px(im, x, y, c):
    if c is not None and 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((int(x), int(y)), c)


def rect(im, x, y, w, h, c):
    for yy in range(int(y), int(y + h)):
        for xx in range(int(x), int(x + w)):
            px(im, xx, yy, c)


def outline_silhouette(im, ox, oy, w, h, outline_col=OUT):
    """Aggiunge un contorno esterno pixel-art pulito 1px attorno ai pixel opachi nel riquadro."""
    src = im.crop((ox, oy, ox + w, oy + h))
    pts = []
    for y in range(h):
        for x in range(w):
            if src.getpixel((x, y))[3] == 0:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and src.getpixel((nx, ny))[3] > 128:
                        pts.append((ox + x, oy + y))
                        break
    for x, y in pts:
        px(im, x, y, outline_col)


# ==============================================================================
# 1. PERSONAGGI 32x36 PIXEL ART CON CAPIGLIATURA MESSY CANONICA E DETTAGLI RICCHI
# ==============================================================================
# Pose (13):
#  0..3 = idle respirazione + palleggio/nota/compasso
#  4..7 = corsa dinamica 4 frame con rimbalzo ciocche
#  8    = salto in salita
#  9    = caduta
#  10   = abilità speciale / lancio
#  11   = vittoria esultanza
#  12   = danno / contraccolpo

CHAR_PALETTES = {
    "ranaldo": {
        # 45enne carismatico: capelli e barba sale-e-pepe (antracite + grigio acciaio + striature argento, MAI bianco da anziano!)
        "hair": (rgba("#2b3340"), rgba("#556378"), rgba("#9aa8bc")),
        "top": (rgba("#1b2c47"), rgba("#29436b"), rgba("#42669c")),
        "sub": rgba("#f8fafc"),
        "acc": rgba("#eab308"),
        "pants": (rgba("#182030"), rgba("#283347")),
        "shoes": rgba("#3b2316"),
    },
    "carlo": {
        # Fedele alla foto reale: capelli neri corti ai lati con frangia mossa, occhiali neri spessi e baffetti!
        "hair": (rgba("#0e0b0e"), rgba("#1e181e"), rgba("#352b35")),
        "top": (rgba("#c2410c"), rgba("#f46d1f"), rgba("#ff9c54")),
        "sub": rgba("#1d4ed8"),
        "acc": rgba("#f8fafc"),
        "pants": (rgba("#172554"), rgba("#1e3a8a")),
        "shoes": rgba("#f8fafc"),
    },
    "francesco": {
        # Pianista elegante: chioma mossa/ondulata con riga laterale, cuffie studio oro/nere al collo, cardigan smeraldo
        "hair": (rgba("#151019"), rgba("#2c2234"), rgba("#503f5e")),
        "top": (rgba("#0b4f47"), rgba("#137a6e"), rgba("#2eb09e")),
        "sub": rgba("#faf5e8"),
        "acc": rgba("#fbbf24"),
        "pants": (rgba("#1b1929"), rgba("#2c2842")),
        "shoes": rgba("#261915"),
    },
    "ruggero": {
        # Velocista & Ostacolista d'Atletica Leggera: capelli castano scuro messy + fascia atletica e completino da pista cremisi/bianco!
        "hair": (rgba("#17100e"), rgba("#2e1f1a"), rgba("#4f352b")),
        "top": (rgba("#991b1b"), rgba("#dc2626"), rgba("#f87171")),
        "sub": rgba("#ffffff"),
        "acc": rgba("#fbbf24"),
        "pants": (rgba("#0f172a"), rgba("#1e293b")),
        "shoes": rgba("#ef4444"),
    },
    "daniele": {
        # 5° Protagonista giocabile: ballerino latino-americano — camicia aperta corallo/magenta su canotta bianca,
        # pantaloni neri da ballo e scarpe da salsa lucide. Fascia ritmica magenta al polso (accento).
        "hair": (rgba("#231710"), rgba("#4a3021"), rgba("#7d563c")),
        "top": (rgba("#9d174d"), rgba("#db2777"), rgba("#f472b6")),
        "sub": rgba("#fff7fb"),
        "acc": rgba("#fbbf24"),
        "pants": (rgba("#111827"), rgba("#1f2937")),
        "shoes": rgba("#f9a8d4"),
    },
    "sofia": {
        "hair": (rgba("#3b1d16"), rgba("#693528"), rgba("#99513f")),
        "top": (rgba("#6d28d9"), rgba("#8b5cf6"), rgba("#b794f4")),
        "sub": rgba("#fef3c7"),
        "acc": rgba("#f59e0b"),
        "pants": (rgba("#1e293b"), rgba("#334155")),
        "shoes": rgba("#451a03"),
    },
    "mimmo": {
        "hair": (rgba("#475569"), rgba("#94a3b8"), rgba("#cbd5e1")),
        "top": (rgba("#1e3a5f"), rgba("#2b5282"), rgba("#4272ab")),
        "sub": rgba("#e2e8f0"),
        "acc": rgba("#fbbf24"),
        "pants": (rgba("#1e293b"), rgba("#334155")),
        "shoes": rgba("#1f2937"),
    },
}


def draw_canonical_messy_hair_32(im, hx, hy, hd, hm, hl, variant="carlo", bounce=0):
    """
    Disegna capigliature messy ben differenziate per silhouette e carattere:
      - carlo: capelli neri corti e puliti ai lati con frangia spettinata naturale sulla fronte (come in foto)
      - francesco: chioma artistica più lunga e ondulata con ciuffo laterale asimmetrico da pianista
      - ruggero: ciuffi atletici appuntiti protesi in avanti + fascia sportiva biancorossa sulla fronte
      - ranaldo: taglio moderno spettinato sale-e-pepe da 45enne con striature grigio-argento
    """
    by = hy + bounce

    if variant == "carlo":
        # Calotta nera compatta e ordinata ai lati, spettinata sopra e sulla fronte
        rect(im, hx + 10, by + 4, 12, 4, hm)
        rect(im, hx + 9, by + 6, 14, 4, hd)
        rect(im, hx + 9, by + 8, 2, 3, hd)
        rect(im, hx + 21, by + 8, 2, 3, hd)
        rect(im, hx + 12, by + 3, 4, 2, hm)
        rect(im, hx + 16, by + 2, 4, 2, hl)
        px(im, hx + 13, by + 4, hl)
        # Frangia nera mossa sopra le sopracciglia/occhiali
        rect(im, hx + 11, by + 9, 10, 1, hd)
        px(im, hx + 11, by + 10, hd)
        px(im, hx + 14, by + 10, hd)
        px(im, hx + 15, by + 10, hm)
        px(im, hx + 18, by + 10, hd)
        px(im, hx + 20, by + 10, hd)

    elif variant == "francesco":
        # Onde voluminose con riga laterale morbida e ciocche lunghe alle tempie
        rect(im, hx + 9, by + 3, 14, 5, hm)
        rect(im, hx + 7, by + 6, 18, 4, hm)
        rect(im, hx + 6, by + 8, 3, 6, hd)  # onda laterale lunga sx
        rect(im, hx + 22, by + 8, 3, 5, hd)  # onda laterale lunga dx
        rect(im, hx + 10, by + 2, 6, 2, hl)
        rect(im, hx + 17, by + 2, 5, 2, hm)
        rect(im, hx + 11, by + 4, 4, 2, hl)
        # Ciuffo ondulato obliquo sulla fronte
        rect(im, hx + 15, by + 9, 6, 2, hm)
        px(im, hx + 16, by + 11, hd)
        px(im, hx + 19, by + 11, hd)
        px(im, hx + 11, by + 10, hd)

    elif variant == "ruggero":
        # Ciuffi scattanti sparati in avanti/alto + fascia sportiva bianca/cremisi!
        rect(im, hx + 9, by + 4, 14, 4, hm)
        rect(im, hx + 8, by + 2, 4, 3, hd)
        rect(im, hx + 13, by + 1, 5, 3, hl)
        rect(im, hx + 19, by + 1, 5, 3, hm)
        px(im, hx + 24, by + 2, hl)
        px(im, hx + 25, by + 3, hm)
        # Fascia atletica bianca con filetto rosso + ciocche messy scure che ricadono davanti sulla fronte!
        rect(im, hx + 9, by + 7, 14, 2, WHITE)
        rect(im, hx + 9, by + 8, 14, 1, rgba("#dc2626"))
        px(im, hx + 11, by + 9, hd); px(im, hx + 11, by + 10, hd)
        px(im, hx + 15, by + 8, hd); px(im, hx + 15, by + 9, hm); px(im, hx + 16, by + 10, hd)
        px(im, hx + 19, by + 9, hd); px(im, hx + 20, by + 10, hd)

    elif variant == "ranaldo":
        # 45enne energico: taglio corto/medio spettinato antracite + grigio acciaio con ciocche argento!
        rect(im, hx + 9, by + 4, 14, 4, hm)
        rect(im, hx + 8, by + 6, 15, 4, hd)
        rect(im, hx + 8, by + 9, 2, 3, hm)  # tempie brizzolate
        rect(im, hx + 22, by + 9, 2, 3, hm)
        rect(im, hx + 11, by + 2, 4, 2, hm)
        rect(im, hx + 16, by + 1, 4, 3, hl)  # striatura argento sul ciuffo
        rect(im, hx + 20, by + 3, 3, 2, hm)
        px(im, hx + 12, by + 5, hl)
        px(im, hx + 18, by + 5, hl)
        # Ciocche spettinate sulla fronte
        px(im, hx + 11, by + 10, hd)
        px(im, hx + 15, by + 10, hl)
        px(im, hx + 16, by + 11, hm)
        px(im, hx + 19, by + 10, hd)

    elif variant == "daniele":
        # Taglio giovane castano naturale, ordinato con ciuffo morbido laterale verso destra (silhouette ben distinta!)
        rect(im, hx + 10, by + 3, 12, 5, hm)
        rect(im, hx + 9, by + 6, 14, 4, hd)
        rect(im, hx + 9, by + 8, 2, 3, hd)
        rect(im, hx + 21, by + 8, 2, 3, hm)
        rect(im, hx + 11, by + 2, 7, 2, hl)
        px(im, hx + 18, by + 3, hl)
        # Ciuffo naturale diagonale leggero
        rect(im, hx + 13, by + 9, 6, 1, hm)
        px(im, hx + 17, by + 10, hd)
        px(im, hx + 19, by + 10, hm)

    elif variant == "sofia":
        rect(im, hx + 10, by + 2, 12, 3, hl)
        rect(im, hx + 8, by + 5, 16, 5, hm)
        rect(im, hx + 6, by + 8, 4, 11, hd)
        rect(im, hx + 7, by + 9, 2, 9, hm)
        px(im, hx + 12, by + 10, hd)
        px(im, hx + 17, by + 10, hd)
    else:  # mimmo
        rect(im, hx + 9, by + 4, 14, 4, hm)
        rect(im, hx + 10, by + 3, 12, 2, hl)


def draw_char_32x36(im, ox, oy, cid, pose):
    pal = CHAR_PALETTES[cid]
    hd, hm, hl = pal["hair"]
    td, tm, tl = pal["top"]
    pd, pm = pal["pants"]

    bob = 0
    hair_bounce = 0
    if pose in (1, 3):
        bob = 1
    elif pose in (4, 6):
        bob = -1
        hair_bounce = -1
    elif pose == 8:  # jump up
        bob = -2
        hair_bounce = 1
    elif pose == 9:  # fall
        bob = -1
        hair_bounce = -1
    elif pose == 12:  # hurt
        bob = 1

    hy = oy + bob

    # --- TESTA SCOLPITA CON MENTO SMUSSATO E ORECCHIO ---
    rect(im, ox + 10, hy + 8, 12, 9, SKIN)
    rect(im, ox + 11, hy + 17, 10, 2, SKIN_MID)  # mento arrotondato
    rect(im, ox + 10, hy + 15, 12, 2, SKIN_MID)
    rect(im, ox + 11, hy + 9, 4, 2, SKIN_HI)
    rect(im, ox + 8, hy + 12, 2, 3, SKIN_MID)  # orecchio sx
    rect(im, ox + 13, hy + 18, 5, 2, SKIN_SH)  # collo

    # --- OCCHI ESPRESSIVI CON SCLERA BIANCA + PUPILLA ---
    if pose == 12:  # hurt > <
        px(im, ox + 12, hy + 12, EYE_BLK)
        px(im, ox + 13, hy + 13, EYE_BLK)
        px(im, ox + 12, hy + 14, EYE_BLK)
        px(im, ox + 19, hy + 12, EYE_BLK)
        px(im, ox + 18, hy + 13, EYE_BLK)
        px(im, ox + 19, hy + 14, EYE_BLK)
    else:
        blink = pose == 3
        if blink:
            rect(im, ox + 12, hy + 13, 3, 1, EYE_BLK)
            rect(im, ox + 18, hy + 13, 3, 1, EYE_BLK)
        else:
            rect(im, ox + 12, hy + 12, 3, 3, WHITE)
            rect(im, ox + 13, hy + 12, 2, 3, EYE_BLK)
            rect(im, ox + 18, hy + 12, 3, 3, WHITE)
            rect(im, ox + 19, hy + 12, 2, 3, EYE_BLK)

    # Bocca / Sorriso
    if pose in (10, 11):
        rect(im, ox + 15, hy + 16, 3, 1, WHITE)
    else:
        rect(im, ox + 15, hy + 16, 3, 1, SKIN_SH)

    # --- CAPIGLIATURA MESSY DIFFERENZIATA ---
    draw_canonical_messy_hair_32(im, ox, hy, hd, hm, hl, cid, hair_bounce)

    # --- TRATTI FACCIALI ICONICI SULLO SPRITE 32x36 ---
    if cid == "carlo":
        # OCCHIALI NERI RETTANGOLARI SPESSI + RIFLESSO LENTE + BAFFETTI (come nella foto reale!)
        g_blk = rgba("#09090d")
        rect(im, ox + 10, hy + 11, 12, 1, g_blk)  # montatura superiore spessa
        rect(im, ox + 10, hy + 14, 5, 1, g_blk)
        rect(im, ox + 17, hy + 14, 5, 1, g_blk)
        px(im, ox + 10, hy + 12, g_blk); px(im, ox + 10, hy + 13, g_blk)
        px(im, ox + 15, hy + 12, g_blk); px(im, ox + 16, hy + 12, g_blk)  # ponte centrale
        px(im, ox + 17, hy + 12, g_blk)
        px(im, ox + 21, hy + 12, g_blk); px(im, ox + 21, hy + 13, g_blk)
        if pose != 12:
            px(im, ox + 11, hy + 12, rgba("#bae6fd"))  # riflesso lente sx
            px(im, ox + 18, hy + 12, rgba("#bae6fd"))  # riflesso lente dx
        # Baffetti neri giovanili sopra il labbro (mento pulito!)
        rect(im, ox + 14, hy + 15, 5, 1, rgba("#1e181e"))
        rect(im, ox + 14, hy + 17, 5, 1, SKIN_MID)  # mento pulito senza barba!

    elif cid == "ranaldo":
        # PROF. RANALDO (45 ANNI): barba corta curata sale-e-pepe aderente alla mascella (non barba lunga da 70enne!)
        rect(im, ox + 14, hy + 15, 5, 1, hd)  # baffo corto curato
        rect(im, ox + 11, hy + 16, 2, 2, hm)  # profilo mascella sx brizzolato
        rect(im, ox + 20, hy + 16, 2, 2, hm)  # profilo mascella dx brizzolato
        rect(im, ox + 12, hy + 17, 9, 2, hd)  # barba corta scolpita sul mento
        rect(im, ox + 14, hy + 17, 5, 1, hm)
        px(im, ox + 16, hy + 17, hl)  # tocco argento sale-e-pepe

    # --- BUSTO E ABBIGLIAMENTO DISTINTIVO ---
    rect(im, ox + 9, hy + 19, 13, 9, tm)
    rect(im, ox + 9, hy + 19, 3, 8, tl)
    rect(im, ox + 19, hy + 20, 3, 8, td)

    if cid == "ranaldo":
        # Giacca sartoriale blu da 45enne dinamico, camicia bianca nitida e cravatta ocra slim
        rect(im, ox + 14, hy + 19, 4, 8, pal["sub"])
        rect(im, ox + 15, hy + 20, 2, 7, pal["acc"])
        px(im, ox + 13, hy + 20, td)
        px(im, ox + 18, hy + 20, td)
    elif cid == "carlo":
        # Canotta Basket #23 arancione vivo con bordi bianchi su t-shirt blu royal!
        rect(im, ox + 9, hy + 19, 2, 3, pal["sub"])
        rect(im, ox + 20, hy + 19, 2, 3, pal["sub"])
        rect(im, ox + 13, hy + 21, 5, 4, WHITE)
        rect(im, ox + 14, hy + 22, 3, 2, pal["sub"])
    elif cid == "francesco":
        # Cardigan smeraldo aperto su camicia avorio + CUFFIE DA STUDIO nere/oro al collo!
        rect(im, ox + 13, hy + 19, 5, 9, pal["sub"])
        rect(im, ox + 10, hy + 18, 3, 3, rgba("#1e293b"))  # padiglione cuffia sx
        rect(im, ox + 19, hy + 18, 3, 3, rgba("#1e293b"))  # padiglione cuffia dx
        px(im, ox + 11, hy + 19, pal["acc"])  # anello oro cuffia sx
        px(im, ox + 20, hy + 19, pal["acc"])  # anello oro cuffia dx
    elif cid == "ruggero":
        # Canotta da Atletica Leggera cremisi con spalline sportive e pettorale di gara bianco sul petto!
        rect(im, ox + 9, hy + 19, 2, 3, SKIN)  # spalle scoperte da canotta pista
        rect(im, ox + 20, hy + 19, 2, 3, SKIN)
        rect(im, ox + 12, hy + 21, 7, 5, WHITE)  # pettorale di gara bianco
        rect(im, ox + 13, hy + 22, 5, 1, rgba("#0f172a"))  # righe numero gara
        rect(im, ox + 14, hy + 24, 3, 1, rgba("#dc2626"))
    elif cid == "daniele":
        # Camicia da ballo corallo aperta sulla canotta bianca, fazzoletto oro e scarpe da salsa!
        rect(im, ox + 10, hy + 18, 11, 2, td)  # bordo cappuccio
        rect(im, ox + 13, hy + 19, 5, 9, pal["sub"])  # t-shirt bianca centrale
        rect(im, ox + 12, hy + 19, 1, 9, pal["acc"])  # profilo zip ciano sx
        rect(im, ox + 18, hy + 19, 1, 9, pal["acc"])  # profilo zip ciano dx
    elif cid == "sofia":
        rect(im, ox + 13, hy + 19, 5, 3, pal["acc"])

    # --- GAMBE E SCARPE DINAMICHE (13 pose fluide — pantaloncini e calzettoni per Ruggero!) ---
    if pose in (0, 1, 2, 3, 11):
        legs = [(ox + 10, oy + 28, 5), (ox + 17, oy + 28, 5)]
    elif pose == 4:
        legs = [(ox + 7, oy + 27, 5), (ox + 19, oy + 28, 5)]
    elif pose == 5:
        legs = [(ox + 11, oy + 28, 5), (ox + 15, oy + 27, 5)]
    elif pose == 6:
        legs = [(ox + 19, oy + 27, 5), (ox + 7, oy + 28, 5)]
    elif pose == 7:
        legs = [(ox + 15, oy + 27, 5), (ox + 11, oy + 28, 5)]
    elif pose == 8:  # jump up
        legs = [(ox + 9, oy + 26, 4), (ox + 18, oy + 25, 4)]
    elif pose == 9:  # fall
        legs = [(ox + 8, oy + 27, 5), (ox + 18, oy + 28, 4)]
    elif pose == 10:  # special
        legs = [(ox + 8, oy + 28, 5), (ox + 18, oy + 27, 5)]
    else:  # hurt
        legs = [(ox + 9, oy + 28, 5), (ox + 16, oy + 28, 5)]

    for lx, ly, lh in legs:
        if cid == "ruggero":
            # Pantaloncini leggeri da atletica + gamba da velocista + calzino corto bianco + scarpe chiodate rosse/oro!
            rect(im, lx, ly, 4, 2, pm)
            rect(im, lx, ly + 2, 4, max(1, lh - 3), SKIN_MID)
            if lh >= 4:
                rect(im, lx, ly + lh - 1, 4, 1, WHITE)
            rect(im, lx, ly + lh, 5, 2, pal["shoes"])
            px(im, lx + 1, ly + lh, WHITE)
            px(im, lx + 3, ly + lh + 1, rgba("#fde047"))
        elif cid == "carlo":
            # Pantaloncini basket blu + calza bianca + sneaker high-top bianco/arancio!
            rect(im, lx, ly, 4, 3, pm)
            rect(im, lx, ly + 3, 4, max(1, lh - 3), WHITE)
            rect(im, lx, ly + lh, 5, 2, pal["shoes"])
            px(im, lx + 1, ly + lh, rgba("#f46d1f"))
            px(im, lx + 3, ly + lh, rgba("#f46d1f"))
        else:
            rect(im, lx, ly, 4, lh, pm)
            rect(im, lx, ly, 1, lh, pd)
            rect(im, lx, ly + lh, 5, 2, pal["shoes"])

    # --- BRACCIA ---
    arm_c = pal["sub"] if cid == "carlo" else (SKIN if cid == "ruggero" else tm)
    if pose == 11:  # Victory!
        rect(im, ox + 6, hy + 14, 3, 7, arm_c)
        rect(im, ox + 6, hy + 12, 3, 2, SKIN)
        rect(im, ox + 22, hy + 13, 3, 8, arm_c)
        rect(im, ox + 22, hy + 11, 3, 2, SKIN)
    elif pose == 10:  # Special cast!
        rect(im, ox + 6, hy + 20, 3, 5, arm_c)
        rect(im, ox + 22, hy + 19, 6, 3, arm_c)
        rect(im, ox + 27, hy + 19, 2, 3, SKIN)
    else:
        sw = 2 if pose in (4, 5) else (-2 if pose in (6, 7) else 0)
        rect(im, ox + 6, hy + 20 + sw, 3, 6, arm_c)
        rect(im, ox + 6, hy + 25 + sw, 3, 2, SKIN)
        rect(im, ox + 22, hy + 20 - sw, 3, 6, arm_c)
        rect(im, ox + 22, hy + 25 - sw, 3, 2, SKIN)

    # Contorno esterno nitido attorno al personaggio!
    outline_silhouette(im, ox, oy, 32, 36, OUT)

    # --- OGGETTI CARATTERISTICI ANIMATI DELLE PASSIONI ---
    if cid == "carlo" and pose in (0, 1, 2, 3, 10, 11):
        # Palla da basket che rimbalza davvero nei 4 frame idle!
        by_map = {0: oy + 25, 1: oy + 28, 2: oy + 30, 3: oy + 27, 10: hy + 15, 11: hy + 6}
        bx = ox + 24 if pose != 11 else ox + 22
        by = by_map[pose]
        rect(im, bx, by, 6, 6, OUT)
        rect(im, bx + 1, by + 1, 4, 4, rgba("#f46d1f"))
        px(im, bx + 1, by + 1, rgba("#ffb37a"))
        px(im, bx + 3, by + 2, OUT)
        px(im, bx + 2, by + 3, OUT)

    elif cid == "ruggero" and pose in (0, 1, 2, 3, 4, 5, 6, 7, 10, 11):
        # Testimone da staffetta d'atletica oro/argento + scia aerodinamica in corsa/scatto!
        arm_c_rug = SKIN  # braccia atletiche scoperte con canotta
        if pose in (0, 1, 2, 3):
            by_bat = hy + 23 + (pose % 2)
            rect(im, ox + 23, by_bat, 6, 3, OUT)
            rect(im, ox + 24, by_bat + 1, 4, 1, rgba("#fde047"))
            px(im, ox + 26, by_bat + 1, WHITE)
        elif pose == 11:
            rect(im, ox + 23, hy + 8, 3, 7, OUT)
            rect(im, ox + 24, hy + 9, 1, 5, rgba("#fde047"))
        else:
            # Scia aerodinamica di velocità dietro le scarpe chiodate!
            rect(im, ox + 2, oy + 24, 4, 1, rgba("#f87171"))
            rect(im, ox + 1, oy + 28, 5, 1, rgba("#fde047"))

    elif cid == "francesco" and pose in (0, 1, 2, 3, 10, 11):
        # Note musicali fluttuanti ciano/oro!
        ny = hy + 14 - (pose % 4)
        nx = ox + 25
        nc = rgba("#38e2d8") if pose != 11 else rgba("#ffd147")
        rect(im, nx, ny + 3, 3, 3, nc)
        rect(im, nx + 2, ny - 2, 1, 6, nc)
        rect(im, nx + 3, ny - 2, 2, 2, nc)

    elif cid == "ranaldo" and pose in (0, 1, 2, 3, 10, 11):
        # Squadra/Compasso aureo luminoso!
        gx = ox + 24
        gy = hy + (21 if pose < 10 else 13)
        gold = rgba("#ffd147")
        for i in range(5):
            px(im, gx + i, gy + 4, gold)
            px(im, gx, gy + i, gold)
            if i < 4:
                px(im, gx + i, gy + i, rgba("#fef08a"))

    elif cid == "daniele" and pose in (0, 1, 2, 3, 10, 11):
        # Strumento diagnostico compatto di rete con impulso luminoso ciano!
        dx_p = ox + 24
        dy_p = hy + (20 if pose < 10 else 13) - (pose % 2)
        rect(im, dx_p, dy_p, 6, 7, OUT)
        rect(im, dx_p + 1, dy_p + 1, 4, 5, rgba("#0f172a"))
        rect(im, dx_p + 1, dy_p + 1, 4, 3, rgba("#22d3ee"))
        px(im, dx_p + 2, dy_p + 2, WHITE)
        if pose in (1, 3, 10, 11):
            px(im, dx_p + 3, dy_p - 2, rgba("#38bdf8"))
            px(im, dx_p + 5, dy_p - 1, rgba("#67e8f9"))


# ==============================================================================
# 2. RITRATTI 64x64 AD ALTA ESPRESSIVITÀ (7 PERSONAGGI x 6 ESPRESSIONI)
# ==============================================================================
def draw_portrait_64(im, ox, oy, cid, expr):
    """expr: 0=neutral, 1=happy, 2=surprised, 3=thinking, 4=determined, 5=wink"""
    themes = {
        "ranaldo": ("#152238", "#23385c", "#e5a92b"),
        "carlo": ("#19233c", "#28385e", "#f46d1f"),
        "francesco": ("#0d2a28", "#184743", "#38e2d8"),
        "ruggero": ("#2b121c", "#4a1e30", "#f45565"),
        "daniele": ("#2b0d1f", "#5c1636", "#f472b6"),
        "sofista": ("#171326", "#27203d", "#c084fc"),
        "sofia": ("#221438", "#3b2363", "#fbbf24"),
        "mimmo": ("#142436", "#213c59", "#60a5fa"),
    }
    bg1, bg2, brd = [rgba(c) for c in themes[cid]]
    rect(im, ox, oy, 64, 64, OUT)
    rect(im, ox + 1, oy + 1, 62, 62, brd)
    rect(im, ox + 3, oy + 3, 58, 58, bg1)
    for y in range(6, 58, 5):
        rect(im, ox + 4, oy + y, 56, 2, bg2)

    buf = Image.new("RGBA", (64, 64), (0, 0, 0, 0))

    if cid == "sofista":
        # Ritratto 64x64 Arconte Greco-Digitale: metà sinistra marmo pario scolpito, metà destra ologramma cyber 404-Ω!
        rect(buf, 11, 45, 42, 16, rgba("#4c1d95"))
        rect(buf, 15, 46, 34, 15, rgba("#6b21a8"))
        for d_s in range(14):
            rect(buf, 20 + d_s // 2, 46 + d_s, 8, 2, rgba("#be185d"))
            px(buf, 20 + d_s // 2, 46 + d_s, rgba("#fde047"))
        # Spallacci scolpiti marmo & oro
        rect(buf, 8, 42, 12, 6, rgba("#f1f5f9"))
        rect(buf, 44, 42, 12, 6, rgba("#f1f5f9"))
        rect(buf, 9, 46, 10, 2, rgba("#eab308"))
        rect(buf, 45, 46, 10, 2, rgba("#eab308"))
        # Volto diviso: sinistra statua filosofo greco in marmo con barba scolpita, destra teschio digitale ciano/magenta!
        rect(buf, 18, 13, 14, 27, rgba("#f1f5f9"))
        rect(buf, 20, 32, 12, 10, rgba("#cbd5e1"))  # barba marmorea classica sx
        rect(buf, 22, 34, 9, 7, rgba("#e2e8f0"))
        rect(buf, 32, 13, 14, 27, rgba("#1e1b4b"))  # nucleo cyber dx
        rect(buf, 32, 33, 12, 8, rgba("#a21caf"))
        # Corona d'alloro imperiale d'oro!
        for k in range(5):
            rect(buf, 13 + k * 2, 23 - k * 3, 4, 3, rgba("#fde047"))
            rect(buf, 47 - k * 2, 23 - k * 3, 4, 3, rgba("#fde047"))
        rect(buf, 29, 8, 6, 4, rgba("#22d3ee"))
        ey = 23 if expr != 2 else 21
        rect(buf, 22, ey, 6, 4, rgba("#0284c7"))  # occhio marmo azzurro
        rect(buf, 36, ey, 6, 4, rgba("#22d3ee"))  # occhio cyber luminoso
        px(buf, 23, ey + 1, WHITE); px(buf, 37, ey + 1, WHITE)
        if expr == 1:
            rect(buf, 26, 34, 12, 3, rgba("#22d3ee"))
        elif expr == 2:
            rect(buf, 29, 33, 6, 5, rgba("#f43f5e"))
        else:
            rect(buf, 26, 35, 12, 2, rgba("#fde047"))
        outline_silhouette(buf, 4, 4, 56, 57, OUT)
        im.alpha_composite(buf, (ox, oy))
        return

    pal = CHAR_PALETTES[cid]
    hd, hm, hl = pal["hair"]
    td, tm, tl = pal["top"]

    # Busto e abbigliamento dettagliato sul buffer trasparente
    rect(buf, 12, 46, 40, 15, tm)
    rect(buf, 12, 46, 8, 15, tl)
    rect(buf, 44, 46, 8, 15, td)
    rect(buf, 25, 46, 14, 15, pal["sub"])
    if cid == "ranaldo":
        # Revers giacca sartoriale + cravatta ocra slim
        rect(buf, 22, 46, 4, 15, td)
        rect(buf, 38, 46, 4, 15, td)
        rect(buf, 30, 47, 4, 14, pal["acc"])
    elif cid == "carlo":
        # Canotta #23 arancione su t-shirt blu royal
        rect(buf, 12, 46, 7, 8, pal["sub"])
        rect(buf, 45, 46, 7, 8, pal["sub"])
        rect(buf, 18, 46, 3, 15, WHITE)
        rect(buf, 43, 46, 3, 15, WHITE)
        rect(buf, 27, 51, 10, 8, WHITE)
        rect(buf, 29, 53, 6, 4, pal["sub"])
    elif cid == "francesco":
        # Cardigan smeraldo aperto + CUFFIE DA STUDIO nere con anelli d'oro al collo!
        rect(buf, 24, 46, 16, 15, pal["sub"])
        rect(buf, 17, 42, 7, 8, rgba("#1e293b"))
        rect(buf, 40, 42, 7, 8, rgba("#1e293b"))
        rect(buf, 19, 44, 3, 4, pal["acc"])
        rect(buf, 42, 44, 3, 4, pal["acc"])
    elif cid == "ruggero":
        # Canotta da Atletica Leggera cremisi con spalle scoperte e pettorale di gara bianco!
        rect(buf, 12, 46, 7, 15, SKIN)
        rect(buf, 45, 46, 7, 15, SKIN)
        rect(buf, 19, 46, 26, 15, tm)
        rect(buf, 19, 46, 2, 15, WHITE)
        rect(buf, 43, 46, 2, 15, WHITE)
        rect(buf, 24, 50, 16, 9, WHITE)
        rect(buf, 27, 52, 10, 2, rgba("#0f172a"))
        rect(buf, 29, 56, 6, 2, rgba("#dc2626"))
    elif cid == "daniele":
        # Ballerino latino-americano: camicia corallo/magenta aperta su canotta bianca,
        # colletto alzato, taschino con fazzoletto oro e colpi di luce rosa sulle spalle.
        rect(buf, 12, 46, 7, 15, SKIN)   # spalle scoperte (camicia aperta)
        rect(buf, 45, 46, 7, 15, SKIN)
        rect(buf, 19, 46, 26, 15, tm)    # camicia corallo
        rect(buf, 22, 46, 20, 3, td)     # colletto alzato
        rect(buf, 30, 49, 5, 12, pal["sub"])  # canotta bianca interna
        rect(buf, 19, 46, 2, 15, WHITE)
        rect(buf, 43, 46, 2, 15, WHITE)
        rect(buf, 24, 52, 5, 4, pal["acc"])  # fazzoletto oro
        rect(buf, 37, 55, 5, 4, td)
    elif cid == "sofia":
        rect(buf, 22, 46, 20, 4, pal["acc"])

    # Collo e Viso scolpito (giovanile e luminoso — 45 anni energici per Ranaldo!)
    rect(buf, 26, 40, 12, 7, SKIN_MID)
    rect(buf, 18, 16, 28, 23, SKIN)
    rect(buf, 21, 39, 22, 2, SKIN)
    rect(buf, 23, 41, 18, 1, SKIN_MID)
    rect(buf, 20, 18, 10, 4, SKIN_HI)
    rect(buf, 15, 25, 3, 7, SKIN_MID)
    rect(buf, 46, 25, 3, 7, SKIN_MID)

    # --- CAPIGLIATURE 64x64 SU MISURA PER OGNI PROTAGONISTA ---
    if cid == "carlo":
        # Fedele alla foto di Carlo: capelli neri corti e compatti ai lati, spettinati sopra con frangia naturale sulla fronte!
        rect(buf, 18, 8, 28, 9, hd)
        rect(buf, 21, 6, 22, 4, hm)
        rect(buf, 26, 5, 12, 3, hl)
        rect(buf, 16, 12, 3, 11, hd)  # lati corti e puliti!
        rect(buf, 45, 12, 3, 11, hd)
        # Ciocche nere asimmetriche corte sulla fronte sopra le sopracciglia folte
        for cx_f, ch_f in ((19, 4), (23, 3), (27, 5), (31, 4), (35, 5), (40, 4), (43, 3)):
            rect(buf, cx_f, 16, 3, ch_f, hd)
        rect(buf, 28, 15, 4, 3, hm)

    elif cid == "ranaldo":
        # Prof. Ranaldo 45enne: taglio moderno spettinato antracite + grigio acciaio con ciocche argento (NON bianco!)
        rect(buf, 17, 9, 30, 8, hd)
        rect(buf, 19, 7, 26, 5, hm)
        rect(buf, 22, 5, 8, 3, hm)
        rect(buf, 31, 4, 9, 4, hl)  # ciocca argento dinamica sul ciuffo
        rect(buf, 15, 13, 4, 11, hm)  # tempie brizzolate grigio acciaio
        rect(buf, 45, 13, 4, 11, hm)
        px(buf, 16, 18, hl); px(buf, 47, 18, hl)
        # Ciocche messy da 45enne sulla fronte
        rect(buf, 21, 17, 4, 4, hd)
        rect(buf, 28, 17, 5, 5, hm)
        rect(buf, 30, 17, 2, 4, hl)
        rect(buf, 38, 17, 4, 4, hd)

    elif cid == "francesco":
        # Pianista: chioma ondulata più lunga con riga laterale morbida e onde alle tempie
        rect(buf, 15, 8, 34, 9, hm)
        rect(buf, 18, 5, 14, 4, hl)
        rect(buf, 33, 6, 12, 4, hm)
        rect(buf, 12, 13, 6, 15, hd)  # onde lunghe fino alle orecchie!
        rect(buf, 46, 13, 6, 14, hd)
        rect(buf, 14, 15, 3, 10, hm)
        # Grande onda asimmetrica da sx verso dx sulla fronte
        rect(buf, 19, 16, 6, 4, hd)
        rect(buf, 31, 16, 12, 5, hm)
        rect(buf, 35, 17, 6, 6, hd)
        rect(buf, 33, 16, 4, 3, hl)

    elif cid == "ruggero":
        # Attaccante: ciuffi dinamici appuntiti + fascia atletica biancorossa!
        rect(buf, 16, 8, 32, 7, hm)
        rect(buf, 15, 5, 8, 4, hd)
        rect(buf, 24, 3, 10, 6, hl)
        rect(buf, 35, 4, 11, 5, hm)
        rect(buf, 44, 6, 6, 3, hl)
        rect(buf, 15, 14, 3, 10, hd)
        rect(buf, 46, 14, 3, 10, hd)
        # Fascia sportiva bianca con striscia rossa + ciocche messy scure che scendono sulla fronte!
        rect(buf, 17, 14, 30, 3, WHITE)
        rect(buf, 17, 16, 30, 1, rgba("#dc2626"))
        rect(buf, 21, 16, 4, 4, hd)
        rect(buf, 29, 15, 4, 5, hm)
        rect(buf, 31, 16, 2, 5, hd)
        rect(buf, 38, 16, 4, 4, hd)

    elif cid == "daniele":
        # Capelli castani naturali ben curati con riga laterale morbida verso destra
        rect(buf, 17, 8, 30, 9, hm)
        rect(buf, 20, 5, 16, 4, hl)
        rect(buf, 34, 6, 10, 4, hm)
        rect(buf, 15, 12, 4, 11, hd)
        rect(buf, 45, 12, 4, 11, hm)
        rect(buf, 20, 16, 6, 3, hd)
        rect(buf, 29, 16, 12, 4, hm)
        rect(buf, 36, 17, 6, 3, hd)

    elif cid == "sofia":
        rect(buf, 16, 9, 32, 9, hm)
        rect(buf, 19, 6, 26, 4, hl)
        rect(buf, 13, 14, 6, 28, hd)
        rect(buf, 45, 14, 6, 28, hd)
        rect(buf, 21, 17, 5, 4, hd)
        rect(buf, 33, 17, 6, 4, hm)
    else:  # mimmo
        rect(buf, 17, 9, 30, 8, hm)
        rect(buf, 20, 7, 24, 3, hl)
        rect(buf, 15, 14, 4, 10, hd)
        rect(buf, 45, 14, 4, 10, hd)

    # --- SOPRACCIGLIA ---
    by = 22 if expr != 2 else 20
    if cid == "carlo":
        # Sopracciglia nere folte e arcuate esattamente come nella foto di Carlo!
        eb = rgba("#0d0a0e")
        rect(buf, 19, by, 10, 2, eb)
        rect(buf, 21, by - 1, 6, 1, eb)
        rect(buf, 35, by, 10, 2, eb)
        rect(buf, 37, by - 1, 6, 1, eb)
    elif expr == 4:
        rect(buf, 21, by + 1, 7, 2, hd)
        px(buf, 28, by + 2, hd)
        px(buf, 35, by + 2, hd)
        rect(buf, 36, by + 1, 7, 2, hd)
    else:
        rect(buf, 21, by + 1, 7, 2, hd)
        rect(buf, 36, by + 1, 7, 2, hd)

    # --- OCCHI ---
    iris_c = rgba("#2b1810") if cid == "carlo" else EYE_BLK
    if expr == 5:
        rect(buf, 22, 28, 6, 2, EYE_BLK)
    else:
        rect(buf, 21, 26, 7, 5, WHITE)
        rect(buf, 23, 26, 4, 5, iris_c)
        rect(buf, 24, 27, 2, 3, EYE_BLK)
        px(buf, 23, 26, WHITE)
    rect(buf, 36, 26, 7, 5, WHITE)
    rect(buf, 38, 26, 4, 5, iris_c)
    rect(buf, 39, 27, 2, 3, EYE_BLK)
    px(buf, 38, 26, WHITE)

    # --- OCCHIALI NERI SPESSI WAYFARER DI CARLO (dalla foto reale!) & OCCHIALI D'ORO DI SOFIA ---
    if cid == "carlo":
        gf = rgba("#0a090d")
        # Barra superiore Wayfarer decisa 2px + bordi laterali/inferiori 1px nitidi così gli occhi respirano perfettamente!
        rect(buf, 16, 24, 15, 2, gf)
        rect(buf, 33, 24, 15, 2, gf)
        rect(buf, 30, 25, 4, 1, gf)  # ponte centrale sul naso
        rect(buf, 17, 26, 1, 6, gf)
        rect(buf, 30, 26, 1, 6, gf)
        rect(buf, 33, 26, 1, 6, gf)
        rect(buf, 46, 26, 1, 6, gf)
        rect(buf, 18, 32, 12, 1, gf)
        rect(buf, 34, 32, 12, 1, gf)
        # Riflesso realistico azzurro-bianco sul vetro!
        px(buf, 19, 26, rgba("#bae6fd")); px(buf, 20, 26, WHITE)
        px(buf, 35, 26, rgba("#bae6fd")); px(buf, 36, 26, WHITE)
    elif cid == "sofia":
        for gx in (20, 35):
            rect(buf, gx, 25, 9, 1, rgba("#fbbf24"))
            rect(buf, gx, 31, 9, 1, rgba("#fbbf24"))
            rect(buf, gx, 25, 1, 7, rgba("#fbbf24"))
            rect(buf, gx + 8, 25, 1, 7, rgba("#fbbf24"))
        rect(buf, 29, 27, 6, 1, rgba("#fbbf24"))

    # Naso scolpito
    rect(buf, 31, 29, 2, 4, SKIN_MID)
    if cid == "carlo":
        px(buf, 30, 32, SKIN_SH); px(buf, 33, 32, SKIN_SH)

    # --- BAFFETTI DI CARLO / BARBA CORTA CURATA 45ENNE DI RANALDO / BAFFI DI MIMMO ---
    if cid == "carlo":
        # Baffetti giovanili scuri sopra il labbro superiore + mento completamente pulito!
        m_dark = rgba("#1c1518")
        m_soft = rgba("#4a3738")
        rect(buf, 26, 34, 5, 2, m_dark)
        rect(buf, 33, 34, 5, 2, m_dark)
        px(buf, 31, 34, m_soft); px(buf, 32, 34, m_soft)  # filtro centrale naturale!
        px(buf, 24, 35, m_soft); px(buf, 25, 35, m_dark)
        px(buf, 38, 35, m_dark); px(buf, 39, 35, m_soft)
        # Labbra naturali sotto i baffetti
        if expr in (1, 5):
            rect(buf, 28, 37, 8, 2, WHITE)
            rect(buf, 28, 39, 8, 1, rgba("#c97a6d"))
        elif expr == 2:
            rect(buf, 30, 36, 4, 4, EYE_BLK)
        else:
            rect(buf, 28, 36, 8, 1, rgba("#8c4a42"))
            rect(buf, 29, 37, 6, 2, rgba("#d98b7c"))
    else:
        # Bocca standard per gli altri personaggi
        if expr in (1, 5):
            rect(buf, 27, 35, 10, 3, WHITE)
            px(buf, 26, 34, EYE_BLK)
            px(buf, 37, 34, EYE_BLK)
        elif expr == 2:
            rect(buf, 30, 34, 5, 5, EYE_BLK)
            rect(buf, 31, 35, 3, 3, rgba("#dc2626"))
        elif expr == 3:
            rect(buf, 28, 35, 7, 2, EYE_BLK)
            px(buf, 35, 34, EYE_BLK)
        else:
            rect(buf, 28, 35, 8, 2, EYE_BLK)

    if cid == "ranaldo":
        # PROF. RANALDO (45 ANNI): barba corta curata sale-e-pepe lungo la mascella + sorriso composto!
        b_d, b_m, b_l = rgba("#2b3340"), rgba("#556378"), rgba("#9aa8bc")
        if expr not in (1, 2, 5):
            rect(buf, 27, 35, 10, 2, SKIN)  # pulisci bocca standard troppo spessa
            rect(buf, 28, 36, 8, 1, rgba("#7c4339"))  # sorriso composto naturale da 45enne
        rect(buf, 26, 34, 12, 1, b_d)  # baffo corto curato
        px(buf, 25, 35, b_m); px(buf, 38, 35, b_m)
        rect(buf, 19, 34, 2, 5, b_m)   # barba corta mascella sx
        rect(buf, 43, 34, 2, 5, b_m)   # barba corta mascella dx
        rect(buf, 21, 38, 22, 3, b_d)  # linea mandibolare curata
        rect(buf, 25, 39, 14, 2, b_m)
        px(buf, 28, 39, b_l); px(buf, 35, 39, b_l)
    elif cid == "mimmo":
        rect(buf, 24, 33, 16, 3, rgba("#6b7688"))
        rect(buf, 26, 33, 12, 2, rgba("#c4cddb"))

    outline_silhouette(buf, 4, 3, 56, 58, OUT)
    im.alpha_composite(buf, (ox, oy))


# ==============================================================================
# 3. TILESET ARCHITETTONICO 16x16 & NEMICI / BOSS / OGGETTI DETTAGLIATI
# ==============================================================================
def build_tileset():
    """16 colonne x 2 righe di tile 16x16 texturizzati al pixel."""
    ts = Image.new("RGBA", (16 * 16, 16 * 2), (0, 0, 0, 0))

    # Tile 0: Travertino chiaro di Via d'Aragona con bordo superiore nitido 1px scuro per stacco perfetto!
    rect(ts, 0, 0, 16, 16, rgba("#d8d0c0"))
    rect(ts, 0, 0, 16, 1, rgba("#2b2623"))
    rect(ts, 0, 1, 16, 2, rgba("#f7f4ec"))
    rect(ts, 0, 14, 16, 2, rgba("#9e9585"))
    rect(ts, 0, 8, 16, 1, rgba("#b8b09f"))
    px(ts, 7, 2, rgba("#b8b09f")); px(ts, 7, 3, rgba("#b8b09f"))
    px(ts, 12, 9, rgba("#b8b09f")); px(ts, 12, 10, rgba("#b8b09f"))

    # Tile 1: Graniglia / Terrazzo Veneziano con battiscopa/soglia scura 1px superiore per stacco netto!
    ox = 16
    rect(ts, ox, 0, 16, 16, rgba("#9aa3b2"))
    rect(ts, ox, 0, 16, 1, rgba("#1e293b"))
    rect(ts, ox, 1, 16, 2, rgba("#e2e8f0"))
    rect(ts, ox, 14, 16, 2, rgba("#64748b"))
    for gx, gy, gc in [(2, 5, "#334155"), (6, 6, "#f8fafc"), (11, 5, "#475569"), (4, 10, "#f8fafc"), (9, 9, "#1e293b"), (13, 11, "#e2e8f0")]:
        px(ts, ox + gx, gy, rgba(gc))

    # Tile 2: Parquet / Campo Sportivo Cortile
    ox = 32
    rect(ts, ox, 0, 16, 16, rgba("#c26a27"))
    rect(ts, ox, 0, 16, 2, rgba("#f59e0b"))
    rect(ts, ox, 7, 16, 1, rgba("#92400e"))
    rect(ts, ox, 14, 16, 2, rgba("#78350f"))

    # Tile 3: Pavimento Graniglia Chiara Laboratorio Multimediale Casardi con battiscopa blu FESR (CAS-0062!)
    ox = 48
    rect(ts, ox, 0, 16, 16, rgba("#b7c0cc"))
    rect(ts, ox, 0, 16, 1, rgba("#1e3a8a"))
    rect(ts, ox, 1, 16, 2, rgba("#f1f5f9"))
    for gx, gy, gc in [(2, 5, "#475569"), (6, 6, "#ffffff"), (11, 5, "#64748b"), (4, 10, "#ffffff"), (9, 9, "#334155"), (13, 11, "#e2e8f0")]:
        px(ts, ox + gx, gy, rgba(gc))
    rect(ts, ox, 14, 16, 2, rgba("#7c8798"))

    # Tile 4: Legno Mogano Biblioteca 8.000 Volumi
    ox = 64
    rect(ts, ox, 0, 16, 16, rgba("#5c321e"))
    rect(ts, ox, 0, 16, 2, rgba("#9a5833"))
    rect(ts, ox, 5, 16, 1, rgba("#3e1f11"))
    rect(ts, ox, 14, 16, 2, rgba("#2e160c"))

    # Tile 5: Piattaforma One-Way Mensola Classica/ Balcone
    ox = 80
    rect(ts, ox, 0, 16, 7, OUT)
    rect(ts, ox + 1, 1, 14, 5, rgba("#64748b"))
    rect(ts, ox + 1, 1, 14, 2, rgba("#f1f5f9"))
    px(ts, ox + 3, 4, rgba("#334155")); px(ts, ox + 12, 4, rgba("#334155"))

    # Tile 6: Piattaforma One-Way Mensola Libreria Mogano & Oro
    ox = 96
    rect(ts, ox, 0, 16, 7, OUT)
    rect(ts, ox + 1, 1, 14, 5, rgba("#78350f"))
    rect(ts, ox + 1, 1, 14, 2, rgba("#fbbf24"))

    # Tile 7: Muro Incrinato Glitch (Ruggero)
    ox = 112
    rect(ts, ox, 0, 16, 16, OUT)
    rect(ts, ox + 1, 1, 14, 14, rgba("#b91c1c"))
    rect(ts, ox + 2, 2, 5, 5, rgba("#ef4444"))
    rect(ts, ox + 9, 8, 5, 5, rgba("#ef4444"))
    for i in range(12):
        px(ts, ox + 2 + i, 2 + (i * 9) // 12, rgba("#fde047"))
        px(ts, ox + 13 - i // 2, 3 + i, rgba("#111019"))

    # Tile 8: Ponte Sonoro SOLIDO (Francesco)
    ox = 128
    rect(ts, ox, 0, 16, 9, OUT)
    rect(ts, ox + 1, 1, 14, 7, rgba("#06b6d4"))
    rect(ts, ox + 2, 2, 12, 2, rgba("#cffafe"))
    rect(ts, ox + 6, 4, 4, 2, rgba("#fde047"))

    # Tile 9: Ponte Sonoro INATTIVO (tratteggiato)
    ox = 144
    for k in range(1, 15, 4):
        rect(ts, ox + k, 2, 2, 4, rgba("#38e2d8", 150))

    # Tile 10: Cancello Laser di Sicurezza
    ox = 160
    rect(ts, ox + 4, 0, 8, 16, rgba("#991b1b", 190))
    rect(ts, ox + 6, 0, 4, 16, rgba("#f87171"))
    rect(ts, ox + 7, 0, 2, 16, WHITE)

    # Tile 11: Spuntoni Glitch Olografici
    ox = 176
    for s in (0, 8):
        for y in range(10):
            w = (y * 6) // 10 + 1
            rect(ts, ox + s + 4 - w // 2, 6 + y, w, 1, rgba("#d946ef") if y > 3 else rgba("#67e8f9"))

    # Tile 12: Trampolino Ginnico Palestra
    ox = 192
    rect(ts, ox + 1, 5, 14, 4, OUT)
    rect(ts, ox + 2, 6, 12, 2, rgba("#facc15"))
    rect(ts, ox + 4, 9, 2, 6, rgba("#94a3b8"))
    rect(ts, ox + 10, 9, 2, 6, rgba("#94a3b8"))
    rect(ts, ox + 1, 14, 14, 2, rgba("#334155"))

    ts_path = os.path.join(SPRITES_DIR, "tileset_casardi.png")
    ts.save(ts_path)
    return ts_path


def build_enemies_and_boss_sheet():
    """
    Foglio 320 x 160 con nemici animati a 2 frame (32x32), oggetti dettagliati (32x32)
    e Boss Il Sofista Digitale 404-Ω + 2 Mid-Boss (48x56)!
    """
    im = Image.new("RGBA", (320, 160), (0, 0, 0, 0))

    # --- RIGA 0 (y=0..31): 10 slot 32x32 di Nemici Animati (2 frame ciascuno!) ---
    for f in range(2):
        # 0,1: SPAM-BOT (Robot monitor CRT con busta rossa "SPAM!")
        ox = f * 32
        by = 1 - f
        rect(im, ox + 7, 6 + by, 18, 15, rgba("#cbd5e1"))
        rect(im, ox + 9, 8 + by, 14, 10, rgba("#1e1b4b"))
        rect(im, ox + 11, 10 + by, 3, 4, rgba("#f43f5e"))
        rect(im, ox + 18, 10 + by, 3, 4, rgba("#f43f5e"))
        rect(im, ox + 12, 15 + by, 8, 2, rgba("#fde047"))
        # Busta spam rossa laterale
        rect(im, ox + 23, 12 - by, 7, 5, rgba("#ef4444"))
        px(im, ox + 26, 14 - by, WHITE)
        # Gambe robotiche
        rect(im, ox + 10 - f, 21, 4, 7, rgba("#64748b"))
        rect(im, ox + 18 + f, 21, 4, 7, rgba("#64748b"))
        outline_silhouette(im, ox, 0, 32, 32, OUT)

        # 2,3: PHISHING DRONE (Drone bi-elica viola con amo dorato!)
        ox = (2 + f) * 32
        rect(im, ox + 4 + f * 2, 4, 10, 2, rgba("#e2e8f0"))
        rect(im, ox + 18 - f * 2, 4, 10, 2, rgba("#e2e8f0"))
        rect(im, ox + 8, 7, 16, 11, rgba("#7c3aed"))
        rect(im, ox + 10, 9, 12, 6, rgba("#0f172a"))
        rect(im, ox + 12, 10, 3, 3, rgba("#38bdf8"))
        rect(im, ox + 17, 10, 3, 3, rgba("#38bdf8"))
        # Lenza e amo dorato!
        rect(im, ox + 15, 18, 2, 7, rgba("#94a3b8"))
        rect(im, ox + 15, 25, 5, 3, rgba("#fbbf24"))
        px(im, ox + 19, 23, rgba("#fbbf24"))
        outline_silhouette(im, ox, 0, 32, 32, OUT)

        # 4,5: RANSOM-CRAB (Granchio corazzato con Lucchetto d'acciaio!)
        ox = (4 + f) * 32
        rect(im, ox + 11, 4, 10, 7, rgba("#facc15"))
        rect(im, ox + 13, 6, 6, 5, (0, 0, 0, 0))
        rect(im, ox + 5, 11, 22, 12, rgba("#ea580c"))
        rect(im, ox + 7, 12, 18, 4, rgba("#fb923c"))
        rect(im, ox + 10, 15, 3, 4, EYE_BLK)
        rect(im, ox + 19, 15, 3, 4, EYE_BLK)
        # Chele e zampe
        rect(im, ox + 2, 13 + f, 4, 5, rgba("#dc2626"))
        rect(im, ox + 26, 13 - f, 4, 5, rgba("#dc2626"))
        rect(im, ox + 7 - f, 23, 4, 5, rgba("#9a3412"))
        rect(im, ox + 21 + f, 23, 4, 5, rgba("#9a3412"))
        outline_silhouette(im, ox, 0, 32, 32, OUT)

        # 6,7: POPUP-SLIME (Finestra di errore rimbalzante con barra blu e [X]!)
        ox = (6 + f) * 32
        sy = 8 + f * 2
        sh = 18 - f * 2
        rect(im, ox + 5, sy, 22, sh, rgba("#f1f5f9"))
        rect(im, ox + 5, sy, 22, 5, rgba("#2563eb"))
        rect(im, ox + 22, sy + 1, 4, 3, rgba("#ef4444"))  # [X]
        rect(im, ox + 10, sy + 9, 3, 4, EYE_BLK)
        rect(im, ox + 19, sy + 9, 3, 4, EYE_BLK)
        rect(im, ox + 13, sy + 14, 6, 2, rgba("#ef4444"))
        outline_silhouette(im, ox, 0, 32, 32, OUT)

        # 8,9: FAKENEWS-MEGAPHONE (Torretta megafono spara-bufale!)
        ox = (8 + f) * 32
        rect(im, ox + 12, 18, 8, 10, rgba("#475569"))
        rect(im, ox + 8, 26, 16, 3, rgba("#334155"))
        rect(im, ox + 6, 8, 14, 10, rgba("#db2777"))
        rect(im, ox + 2, 6 - f, 6, 14 + f * 2, rgba("#f472b6"))
        outline_silhouette(im, ox, 0, 32, 32, OUT)

    # --- RIGA 1 (y=32..63): Oggetti, Collezionabili e Interattivi 32x32 ---
    # 0: PAGINA DI PEGASO (Pergamena alata dorata del giornale d'istituto!)
    ox, oy = 0, 32
    rect(im, ox + 8, oy + 5, 14, 20, rgba("#fef3c7"))
    rect(im, ox + 10, oy + 8, 10, 3, rgba("#d97706"))
    for ry in (13, 16, 19):
        rect(im, ox + 10, oy + ry, 9, 1, rgba("#78350f"))
    # Ali dorate di Pegaso!
    rect(im, ox + 22, oy + 7, 6, 8, rgba("#fde047"))
    rect(im, ox + 24, oy + 5, 5, 5, WHITE)
    outline_silhouette(im, ox, oy, 32, 32, OUT)

    # 1: CUORE / ESPRESSO ENERGIA
    ox = 32
    rect(im, ox + 7, oy + 8, 7, 7, rgba("#ef4444"))
    rect(im, ox + 16, oy + 8, 7, 7, rgba("#ef4444"))
    rect(im, ox + 8, oy + 13, 14, 6, rgba("#ef4444"))
    rect(im, ox + 11, oy + 19, 8, 4, rgba("#dc2626"))
    rect(im, ox + 13, oy + 23, 4, 2, rgba("#b91c1c"))
    rect(im, ox + 9, oy + 9, 3, 3, rgba("#fecaca"))
    outline_silhouette(im, ox, oy, 32, 32, OUT)

    # 2: SCUDO BADGE EIPASS EUROPEO
    ox = 64
    rect(im, ox + 8, oy + 5, 16, 18, rgba("#0284c7"))
    rect(im, ox + 10, oy + 7, 12, 13, rgba("#38bdf8"))
    rect(im, ox + 13, oy + 10, 6, 6, rgba("#fde047"))
    outline_silhouette(im, ox, oy, 32, 32, OUT)

    # 3: TERMINALE EIPASS CRT ATTIVO
    ox = 96
    rect(im, ox + 5, oy + 4, 22, 17, rgba("#334155"))
    rect(im, ox + 7, oy + 6, 18, 12, rgba("#0ea5e9"))
    rect(im, ox + 9, oy + 8, 10, 2, rgba("#fef08a"))
    rect(im, ox + 9, oy + 12, 14, 2, WHITE)
    rect(im, ox + 9, oy + 21, 14, 9, rgba("#475569"))
    outline_silhouette(im, ox, oy, 32, 32, OUT)

    # 4: BUSTO CLASSICO MARMOREO (Omero / Saffo per Biblioteca e Aula Magna!)
    ox = 128
    rect(im, ox + 10, oy + 5, 12, 13, rgba("#f1f5f9"))
    rect(im, ox + 12, oy + 8, 8, 8, rgba("#e2e8f0"))
    rect(im, ox + 7, oy + 18, 18, 6, rgba("#e2e8f0"))
    rect(im, ox + 9, oy + 24, 14, 6, rgba("#cbd5e1"))
    outline_silhouette(im, ox, oy, 32, 32, OUT)

    # --- RIGA 2 (y=64..159): IL SOFISTA DIGITALE 404-Ω (2 pose) + BUFALA-BOT (2 pose) + RANSOM-KRAKEN (2 pose) ---
    for f in range(2):
        # 1) IL SOFISTA DIGITALE 404-Ω — Arconte Greco-Digitale Metà Marmo Classico / Metà Ologramma Cyber!
        bx = f * 52
        by = 66 + f
        # Mantello asimmetrico rastremato a V (niente cilindro piatto!) con bordo a greca d'oro
        for row_m in range(24):
            w_m = max(10, 30 - row_m // 2)
            mx_start = bx + 24 - w_m // 2
            rect(im, mx_start, by + 24 + row_m, w_m, 1, rgba("#3b0764" if row_m > 14 else "#581c87"))
            if 2 < row_m < 21:
                rect(im, mx_start + 3, by + 24 + row_m, max(4, w_m - 6), 1, rgba("#7e22ce"))
        # Stola diagonale cremisi/oro da retore antico + lembi fluttuanti inferiori
        for d_i in range(16):
            rect(im, bx + 15 + d_i // 2, by + 24 + d_i, 5, 2, rgba("#be185d"))
            px(im, bx + 15 + d_i // 2, by + 24 + d_i, rgba("#fde047"))
        # Frammenti energetici fluttuanti alla base invece di un piedistallo piatto
        for sx_sh, sy_sh in ((14, 49 - f), (22, 51 + f), (30, 49 - f)):
            rect(im, bx + sx_sh, by + sy_sh, 4, 4, rgba("#22d3ee" if sx_sh == 22 else "#fde047"))
        # Spallacci scolpiti marmo & oro ionici!
        rect(im, bx + 7, by + 21, 10, 6, rgba("#e2e8f0"))
        rect(im, bx + 31, by + 21, 10, 6, rgba("#e2e8f0"))
        rect(im, bx + 8, by + 25, 8, 2, rgba("#eab308"))
        rect(im, bx + 32, by + 25, 8, 2, rgba("#eab308"))
        # Mani fluttuanti articolate che lanciano sigilli Ω ciano/magenta!
        hy_l = by + 27 - f * 3
        hy_r = by + 25 + f * 3
        rect(im, bx + 2, hy_l, 6, 7, rgba("#f1f5f9"))
        rect(im, bx + 3, hy_l - 4, 4, 3, rgba("#22d3ee"))
        rect(im, bx + 40, hy_r, 6, 7, rgba("#e879f9"))
        rect(im, bx + 41, hy_r - 4, 4, 3, rgba("#fde047"))
        # Testa scolpita: metà sinistra busto marmoreo filosofo greco con barba, metà destra teschio cyber 404!
        rect(im, bx + 15, by + 6, 9, 16, rgba("#f1f5f9"))   # metà marmo pario
        rect(im, bx + 16, by + 17, 8, 6, rgba("#cbd5e1"))   # barba marmorea filosofica sx
        rect(im, bx + 24, by + 6, 9, 16, rgba("#1e1b4b"))   # metà cyber-ologramma dx
        rect(im, bx + 24, by + 17, 8, 5, rgba("#c026d3"))   # mascella glitch dx
        # Occhi asimmetrici + corona d'alloro dorata imperiale!
        rect(im, bx + 18, by + 12, 4, 3, rgba("#0284c7"))
        rect(im, bx + 26, by + 11, 5, 4, rgba("#22d3ee"))
        px(im, bx + 27, by + 12, WHITE)
        for k in range(4):
            rect(im, bx + 12 + k * 2, by + 12 - k * 2, 3, 2, rgba("#fde047"))
            rect(im, bx + 33 - k * 2, by + 12 - k * 2, 3, 2, rgba("#fde047"))
        rect(im, bx + 22, by + 3, 4, 3, rgba("#22d3ee"))
        outline_silhouette(im, bx, 65, 48, 60, OUT)

        # 2) MID-BOSS CAP.2: BUFALA-BOT 3000 (x = 104, 156; size 48x58)
        bx = 104 + f * 52
        by = 68 + f
        # Antenna radar fake-news
        rect(im, bx + 22, by + 2, 4, 8, rgba("#94a3b8"))
        rect(im, bx + 18 + f * 2, by + 1, 10, 3, rgba("#f43f5e"))
        # Doppi megafoni laterali rosa/oro!
        rect(im, bx + 2, by + 15 - f, 8, 14 + f * 2, rgba("#f472b6"))
        rect(im, bx + 40, by + 15 + f, 6, 14 - f * 2, rgba("#f472b6"))
        # Scocca corazzata TV-Tabloid
        rect(im, bx + 9, by + 10, 30, 28, rgba("#be123c"))
        rect(im, bx + 11, by + 12, 26, 4, rgba("#fb7185"))
        rect(im, bx + 12, by + 16, 24, 15, rgba("#0f172a"))
        # Occhi LED furiosi + bocca ticker
        rect(im, bx + 15, by + 19, 6, 5, rgba("#fde047"))
        rect(im, bx + 27, by + 19, 6, 5, rgba("#fde047"))
        rect(im, bx + 15, by + 27, 18, 2, rgba("#38bdf8"))
        # Cingoli corazzati
        rect(im, bx + 10, by + 38, 11, 11, rgba("#334155"))
        rect(im, bx + 27, by + 38, 11, 11, rgba("#334155"))
        rect(im, bx + 12 + f * 2, by + 42, 6, 4, rgba("#94a3b8"))
        rect(im, bx + 29 - f * 2, by + 42, 6, 4, rgba("#94a3b8"))
        outline_silhouette(im, bx, 65, 48, 60, OUT)

        # 3) MID-BOSS CAP.4: RANSOM-KRAKEN (x = 208, 260; size 48x58)
        bx = 208 + f * 52
        by = 68 - f
        # Arco di lucchetto d'oro gigante sulla testa!
        rect(im, bx + 15, by + 2, 18, 12, rgba("#facc15"))
        rect(im, bx + 19, by + 6, 10, 8, (0, 0, 0, 0))
        # Corpo corazzato arancio/cremisi con serratura digitale
        rect(im, bx + 9, by + 13, 30, 24, rgba("#c2410c"))
        rect(im, bx + 11, by + 15, 26, 6, rgba("#fb923c"))
        rect(im, bx + 13, by + 21, 22, 11, rgba("#1e1b4b"))
        rect(im, bx + 15, by + 23, 5, 5, rgba("#ef4444"))
        rect(im, bx + 28, by + 23, 5, 5, rgba("#ef4444"))
        rect(im, bx + 22, by + 24, 4, 6, rgba("#fde047"))  # Toppa chiave
        # 4 Tentacoli meccanici animati!
        for t_i, tx in enumerate((9, 17, 26, 34)):
            ty_off = (f * 3) if t_i % 2 == 0 else (3 - f * 3)
            rect(im, bx + tx, by + 37, 5, 11 + ty_off, rgba("#7c2d12"))
            rect(im, bx + tx + 1, by + 45 + ty_off, 4, 3, rgba("#38bdf8"))
        outline_silhouette(im, bx, 65, 48, 60, OUT)

    path = os.path.join(SPRITES_DIR, "enemies_props.png")
    im.save(path)
    return path


def build_all_sprites():
    chars = ["ranaldo", "carlo", "francesco", "ruggero", "daniele", "sofia", "mimmo"]
    csheet = Image.new("RGBA", (32 * 13, 36 * len(chars)), (0, 0, 0, 0))
    for r, cid in enumerate(chars):
        for p in range(13):
            draw_char_32x36(csheet, p * 32, r * 36, cid, p)
    c_path = os.path.join(SPRITES_DIR, "characters_sheet.png")
    csheet.save(c_path)

    p_chars = ["ranaldo", "carlo", "francesco", "ruggero", "daniele", "sofista", "sofia", "mimmo"]
    psheet = Image.new("RGBA", (64 * 6, 64 * len(p_chars)), (0, 0, 0, 0))
    for r, cid in enumerate(p_chars):
        for ex in range(6):
            draw_portrait_64(psheet, ex * 64, r * 64, cid, ex)
    p_path = os.path.join(SPRITES_DIR, "portraits_sheet.png")
    psheet.save(p_path)

    t_path = build_tileset()
    e_path = build_enemies_and_boss_sheet()

    # --- TAVOLA DI VERIFICA DEI 5 PROTAGONISTI GIOCABILI v3.0 ---
    tavola = Image.new("RGBA", (940, 405), rgba("#121726"))
    draw = ImageDraw.Draw(tavola)
    draw.rectangle([10, 10, 930, 395], outline=rgba("#f59e0b"), width=2)
    draw.text((24, 20), "TAVOLA 5 PROTAGONISTI v3.0 - OPERAZIONE EIPASS: IL CASARDI IN 8 BIT", fill=WHITE)
    draw.text((24, 38), "Carlo, Daniele, Francesco, Ruggero e Prof. Ranaldo - Sprite 32x36 (13 pose), Ritratti 64x64 e Silhouette", fill=rgba("#94a3b8"))

    info = [
        ("PROF. RANALDO (45a)", "Matematica | Sale-e-pepe"),
        ("CARLO (Protagonista)", "Basket #23 | Occhiali+Baffi"),
        ("FRANCESCO", "Pianoforte | Cuffie+Cardigan"),
        ("RUGGERO", "Atletica | Sprint & Ostacoli"),
        ("DANIELE (Nuovo!)", "Ballo Latino | Salsa & Bachata"),
    ]
    for i in range(5):
        cx = 22 + i * 182
        draw.rectangle([cx - 6, 62, cx + 168, 380], fill=rgba("#1e263d"), outline=rgba("#3b4970"))
        draw.text((cx + 2, 70), info[i][0], fill=rgba("#ffd147"))
        draw.text((cx + 2, 86), info[i][1], fill=rgba("#cbd5e1"))

        p_crop = psheet.crop((64, i * 64, 128, (i + 1) * 64)).resize((88, 88), Image.NEAREST)
        tavola.alpha_composite(p_crop, (cx + 2, 106))

        # Scala nativa 1x su fondale chiaro Casardi!
        draw.rectangle([cx + 100, 106, cx + 158, 168], fill=rgba("#ebd275"))
        s_crop = csheet.crop((0, i * 36, 32, (i + 1) * 36))
        tavola.alpha_composite(s_crop, (cx + 113, 120))
        draw.text((cx + 104, 174), "1x Nativa", fill=rgba("#94a3b8"))

        # Scala 3x Idle
        s_zoom = s_crop.resize((96, 108), Image.NEAREST)
        tavola.alpha_composite(s_zoom, (cx - 2, 212))

        # Silhouette nera pura su fondo chiaro
        draw.rectangle([cx + 96, 214, cx + 160, 326], fill=rgba("#e2e8f0"))
        sil = Image.new("RGBA", s_crop.size, (0, 0, 0, 0))
        for yy in range(s_crop.height):
            for xx in range(s_crop.width):
                if s_crop.getpixel((xx, yy))[3] > 0:
                    sil.putpixel((xx, yy), rgba("#0f172a"))
        tavola.alpha_composite(sil.resize((56, 63), Image.NEAREST), (cx + 100, 236))
        draw.text((cx + 100, 332), "Silhouette", fill=rgba("#94a3b8"))

    tavola.save(os.path.join(SPRITES_DIR, "TAVOLA_PERSONAGGI.png"))
    return c_path, p_path, t_path, e_path


# ==============================================================================
# 4. GENERAZIONE FILE AUDIO .WAV (COLONNA SONORA 8-BIT + 16 SFX)
# ==============================================================================
NOTE_FREQS = {
    "R": 0.0,
    "C2": 65.41, "D2": 73.42, "E2": 82.41, "F2": 87.31, "G2": 98.00, "A2": 110.00, "Bb2": 116.54, "B2": 123.47,
    "C3": 130.81, "D3": 146.83, "Eb3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "Ab3": 207.65, "A3": 220.00, "Bb3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "Eb4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "Ab4": 415.30, "A4": 440.00, "Bb4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "Eb5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "Bb5": 932.33, "B5": 987.77,
    "C6": 1046.50, "D6": 1174.66, "E6": 1318.51,
}


def pulse_wave(ph, duty=0.25):
    return 1.0 if (ph % 1.0) < duty else -1.0


def tri_wave(ph):
    p = ph % 1.0
    return 4.0 * p - 1.0 if p < 0.5 else 3.0 - 4.0 * p


def save_wav(path, samples, sr=22050):
    buf = bytearray()
    for s in samples:
        buf.extend(struct.pack("<h", int(max(-1.0, min(1.0, s)) * 30000)))
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(bytes(buf))


def render_loop(path, bpm, lead, harm, bass, drums, duty=0.25, sr=22050):
    step_s = int(round(((60.0 / bpm) / 4.0) * sr))
    n_steps = len(lead)
    out = [0.0] * (step_s * n_steps)

    def voice(seq, fn, vol, vibrato=False):
        i = 0
        ph = 0.0
        while i < n_steps:
            tok = seq[i]
            hold = 1
            while i + hold < n_steps and seq[i + hold] == "-":
                hold += 1
            f = NOTE_FREQS.get(tok, 0.0)
            s0, s1 = i * step_s, (i + hold) * step_s
            ln = s1 - s0
            if f > 0:
                for k in range(ln):
                    vib = 1.0 + (0.006 * math.sin(k * 0.035) if vibrato and k > step_s else 0.0)
                    env = min(1.0, k / 40.0) * min(1.0, (ln - k) / 100.0) * max(0.58, 1.0 - 0.28 * (k / max(1, ln)))
                    out[s0 + k] += fn(ph) * vol * env
                    ph += (f * vib) / sr
            i += hold

    voice(lead, lambda p: pulse_wave(p, duty), 0.28, vibrato=True)
    voice(harm, lambda p: pulse_wave(p, 0.5), 0.16, vibrato=False)
    voice(bass, tri_wave, 0.33, vibrato=False)

    lfsr = 0x4321
    for st in range(n_steps):
        d = drums[st % len(drums)]
        s0 = st * step_s
        if d == "K":
            for k in range(min(step_s, int(0.085 * sr))):
                t = k / sr
                f = 155.0 * math.exp(-t * 34.0) + 42.0
                out[s0 + k] += math.sin(2 * math.pi * f * t) * 0.30 * (1.0 - t / 0.085)
        elif d in ("S", "h"):
            dur = 0.075 if d == "S" else 0.025
            vol = 0.17 if d == "S" else 0.07
            for k in range(min(step_s, int(dur * sr))):
                lfsr = (lfsr >> 1) ^ (-(lfsr & 1) & 0xB400)
                out[s0 + k] += (1.0 if (lfsr & 1) else -1.0) * vol * (1.0 - k / (dur * sr))

    fade = 64
    for k in range(fade):
        w = k / fade
        out[k] = out[k] * w + out[-fade + k] * (1.0 - w)
    save_wav(path, out, sr)


def build_audio():
    # Colonna sonora completa v3.0 in 7 brani esportati in .WAV (con il motivo conduttore del Casardi C5-G4-A4-E5-D5-C5!)
    # 1. TEMA PRINCIPALE ("Viale dei Pini & Portale del Casardi" — 136 BPM, Sezioni A + B)
    main_l = [
        "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "D5", "-", "E5", "F5", "G5", "-", "E5", "-",
        "A5", "-", "G5", "E5", "F5", "-", "D5", "C5",  "D5", "-", "E5", "C5", "D5", "-", "G4", "-",
        "C5", "-", "G4", "A4", "E5", "-", "G5", "A5",  "F5", "-", "E5", "D5", "E5", "-", "C5", "-",
        "D5", "E5", "F5", "G5", "A5", "-", "G5", "F5",  "E5", "-", "D5", "-", "C5", "-", "-", "R",
        # Sezione B luminosa cantabile
        "E5", "-", "G5", "A5", "B5", "-", "G5", "E5",  "A5", "-", "G5", "F5", "E5", "-", "C5", "-",
        "D5", "-", "F5", "A5", "G5", "-", "F5", "E5",  "D5", "C5", "B4", "C5", "D5", "-", "G4", "-",
        "C5", "-", "G4", "A4", "E5", "-", "C6", "-",  "B5", "A5", "G5", "F5", "E5", "-", "C5", "-",
        "F5", "-", "E5", "D5", "G5", "-", "B4", "-",  "C5", "-", "G4", "C5", "C5", "-", "-", "R",
    ]
    main_h = [
        "E4", "-", "E4", "F4", "C5", "-", "B4", "A4",  "B4", "-", "C5", "D5", "E5", "-", "C5", "-",
        "C5", "-", "E5", "C5", "A4", "-", "A4", "G4",  "B4", "-", "C5", "A4", "B4", "-", "F4", "-",
        "E4", "-", "E4", "F4", "C5", "-", "E5", "E5",  "D5", "-", "C5", "B4", "C5", "-", "A4", "-",
        "B4", "C5", "D5", "E5", "F5", "-", "E5", "D5",  "C5", "-", "B4", "-", "E4", "-", "-", "R",
        "G4", "C5", "E5", "C5", "G4", "B4", "E5", "B4",  "F4", "A4", "C5", "A4", "G4", "C5", "E5", "G4",
        "F4", "A4", "D5", "C5", "B4", "-", "D5", "C5",  "B4", "A4", "G4", "A4", "B4", "-", "F4", "-",
        "E4", "-", "E4", "F4", "C5", "-", "E5", "-",  "D5", "C5", "B4", "A4", "G4", "-", "E4", "-",
        "A4", "-", "G4", "F4", "B4", "-", "F4", "-",  "E4", "-", "E4", "G4", "E4", "-", "-", "R",
    ]
    main_b = [
        "C3", "-", "C4", "-", "A2", "-", "A3", "-",  "G2", "-", "B2", "-", "C3", "-", "G2", "-",
        "F2", "-", "F3", "-", "D3", "-", "F3", "-",  "G2", "-", "D3", "-", "G2", "-", "B2", "-",
        "C3", "-", "C4", "-", "A2", "-", "C3", "-",  "D3", "-", "A2", "-", "A2", "-", "E3", "-",
        "F2", "-", "A2", "-", "D3", "-", "G2", "-",  "C3", "-", "G2", "-", "C3", "-", "G2", "-",
        "C3", "-", "G3", "-", "E2", "-", "B2", "-",  "F2", "-", "C3", "-", "C3", "-", "G2", "-",
        "D3", "-", "A2", "-", "E3", "-", "C3", "-",  "G2", "-", "D3", "-", "G2", "-", "B2", "-",
        "C3", "-", "E3", "-", "A2", "-", "E3", "-",  "F2", "-", "A2", "-", "C3", "-", "G2", "-",
        "D3", "-", "F3", "-", "G2", "-", "D3", "-",  "C3", "-", "G2", "C3", "C3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "01_tema_casardi_main.wav"), 136, main_l, main_h, main_b, "KhShKhShKhShKSSh", 0.25)
    render_loop(os.path.join(AUDIO_DIR, "theme_main.wav"), 136, main_l, main_h, main_b, "KhShKhShKhShKSSh", 0.25)

    # 2. TEMA ESPLORAZIONE SCOLASTICA ("Corridoi di Via d'Aragona" — 116 BPM)
    ex_l = [
        "E5", "-", "C5", "D5", "E5", "-", "G4", "-",  "A4", "-", "C5", "D5", "E5", "-", "C5", "-",
        "F5", "-", "E5", "D5", "C5", "-", "A4", "-",  "B4", "C5", "D5", "B4", "G4", "-", "-", "R",
        "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "A5", "-", "G5", "E5", "D5", "-", "C5", "-",
        "F5", "-", "E5", "D5", "E5", "-", "C5", "A4",  "D5", "-", "B4", "G4", "C5", "-", "-", "R",
    ]
    ex_h = [
        "G4", "C5", "E4", "G4", "G4", "C5", "E4", "G4",  "F4", "A4", "C4", "F4", "G4", "C5", "E4", "G4",
        "A4", "C5", "F4", "A4", "E4", "A4", "C4", "E4",  "D4", "G4", "B3", "D4", "B3", "D4", "G3", "B3",
        "E4", "G4", "C4", "F4", "G4", "C5", "F4", "E4",  "C5", "F4", "B4", "G4", "F#4", "A4", "D4", "F#4",
        "A4", "C5", "F4", "A4", "G4", "C5", "E4", "C4",  "F4", "A4", "D4", "B3", "E4", "G4", "C4", "R",
    ]
    ex_b = [
        "C3", "-", "-", "G2", "C3", "-", "E3", "-",  "F2", "-", "-", "A2", "C3", "-", "G2", "-",
        "D3", "-", "-", "F2", "A2", "-", "E2", "-",  "G2", "-", "-", "D3", "G2", "-", "B2", "-",
        "C3", "-", "-", "E2", "A2", "-", "G2", "-",  "F2", "-", "E2", "-", "D2", "-", "A2", "-",
        "D3", "-", "G2", "-", "C3", "-", "A2", "-",  "G2", "-", "G2", "-", "C3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "02_corridoi_explore.wav"), 116, ex_l, ex_h, ex_b, "K.h.S.h.K.h.S.h.", 0.5)

    # 3. TEMA LABORATORIO MULTIMEDIALE ("Diagnostica & 23 Postazioni" — 126 BPM)
    lb_l = [
        "C5", "G4", "A4", "C5", "E5", "-", "D5", "C5",  "G5", "-", "E5", "D5", "C5", "D5", "E5", "-",
        "F5", "-", "E5", "C5", "D5", "-", "C5", "A4",  "G4", "A4", "C5", "D5", "C5", "-", "-", "R",
        "E5", "G5", "A5", "G5", "E5", "-", "C5", "-",  "F5", "G5", "A5", "F5", "D5", "-", "G4", "-",
        "C5", "D5", "E5", "G5", "A5", "-", "G5", "E5",  "F5", "E5", "D5", "B4", "C5", "-", "-", "R",
    ]
    lb_h = [
        "E4", "C4", "F4", "E4", "G4", "C5", "B4", "G4",  "B4", "G4", "C5", "B4", "A4", "B4", "C5", "G4",
        "A4", "F4", "G4", "E4", "F4", "D4", "E4", "C4",  "D4", "F4", "E4", "G4", "E4", "G4", "C4", "R",
        "G4", "B4", "C5", "B4", "G4", "E4", "G4", "E4",  "A4", "B4", "C5", "A4", "F4", "D4", "B3", "D4",
        "E4", "F4", "G4", "B4", "C5", "F4", "B4", "G4",  "A4", "G4", "F4", "D4", "E4", "-", "-", "R",
    ]
    lb_b = [
        "C3", "C3", "R", "G2", "A2", "-", "E2", "-",  "E2", "-", "G2", "-", "A2", "-", "G2", "-",
        "F2", "-", "C3", "-", "D3", "-", "A2", "-",  "G2", "-", "D3", "-", "C3", "-", "G2", "-",
        "C3", "-", "E3", "-", "A2", "-", "G2", "-",  "F2", "-", "A2", "-", "G2", "-", "B2", "-",
        "C3", "-", "E3", "-", "F2", "-", "E2", "-",  "D3", "-", "G2", "-", "C3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "03_laboratorio_multimediale.wav"), 126, lb_l, lb_h, lb_b, "KhShKhSKKhShKSSh", 0.25)

    # 4. TEMA SPORTIVO CORTILE & PALESTRA ("Parabole in Cortile" — 144 BPM)
    sp_l = [
        "G5", "-", "E5", "G5", "A5", "-", "G5", "-",  "E5", "D5", "C5", "D5", "E5", "-", "C5", "-",
        "F5", "-", "D5", "F5", "G5", "-", "F5", "-",  "E5", "D5", "C5", "B4", "D5", "-", "G4", "-",
        "C5", "-", "G4", "A4", "E5", "-", "G5", "A5",  "C6", "-", "A5", "G5", "E5", "-", "C5", "-",
        "D5", "E5", "F5", "G5", "A5", "-", "B5", "-",  "C6", "-", "G5", "E5", "C5", "-", "-", "R",
    ]
    sp_h = [
        "C5", "G4", "C5", "E5", "C5", "A4", "C5", "E5",  "G4", "F4", "E4", "F4", "G4", "C5", "E4", "G4",
        "A4", "F4", "A4", "D5", "B4", "G4", "B4", "D5",  "G4", "F4", "E4", "D4", "B4", "G4", "D4", "B3",
        "E4", "G4", "E4", "F4", "C5", "G4", "C5", "E5",  "F5", "C5", "F5", "D5", "C5", "G4", "E4", "G4",
        "F4", "G4", "A4", "B4", "C5", "F4", "D5", "G4",  "E5", "-", "C5", "G4", "E4", "-", "-", "R",
    ]
    sp_b = [
        "C3", "C4", "G3", "C4", "F3", "F3", "C3", "E3",  "C3", "-", "A2", "-", "C3", "G3", "E3", "G2",
        "D3", "D4", "A3", "D3", "G2", "G3", "D3", "G2",  "C3", "-", "A2", "-", "G2", "D3", "B2", "G2",
        "C3", "G3", "E3", "F3", "A2", "E3", "C3", "A2",  "F2", "C3", "F3", "G2", "C3", "G3", "E3", "C3",
        "D3", "-", "F3", "-", "F3", "-", "G3", "-",  "C3", "-", "G2", "C3", "C3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "04_cortile_sportivo.wav"), 144, sp_l, sp_h, sp_b, "KhSKKhShKhSKKSSS", 0.25)
    render_loop(os.path.join(AUDIO_DIR, "theme_sports.wav"), 144, sp_l, sp_h, sp_b, "KhSKKhShKhSKKSSS", 0.25)

    # 5. TEMA BIBLIOTECA & REDAZIONE PEGASO ("Inchiostro e Contrappunto" — 110 BPM)
    lib_l = [
        "A4", "C5", "E5", "A5", "G5", "-", "E5", "-",  "F5", "E5", "D5", "C5", "B4", "-", "E4", "-",
        "C5", "-", "G4", "A4", "E5", "-", "D5", "C5",  "B4", "C5", "D5", "B4", "A4", "-", "-", "R",
        "C5", "E5", "G5", "C6", "B5", "A5", "G5", "F5",  "E5", "D5", "C5", "B4", "A4", "-", "C5", "-",
        "D5", "F5", "E5", "D5", "C5", "B4", "A4", "G#4", "A4", "-", "E4", "G#4", "A4", "-", "-", "R",
    ]
    lib_h = [
        "C4", "E4", "A4", "C5", "B4", "-", "G4", "-",  "A4", "G4", "F4", "E4", "G#4", "-", "B3", "-",
        "E4", "-", "E4", "F4", "G4", "-", "F4", "E4",  "D4", "E4", "F4", "D4", "C4", "-", "-", "R",
        "E4", "G4", "C5", "E5", "D5", "C5", "B4", "A4",  "G4", "F4", "E4", "D4", "C4", "-", "E4", "-",
        "F4", "A4", "G#4", "F4", "E4", "D4", "C4", "B3", "C4", "-", "B3", "E4", "C4", "-", "-", "R",
    ]
    lib_b = [
        "A2", "-", "C3", "-", "E3", "-", "C3", "-",  "D3", "-", "A2", "-", "E2", "-", "G#2", "-",
        "A2", "-", "E2", "-", "C3", "-", "G2", "-",  "G2", "-", "E2", "-", "A2", "-", "E2", "-",
        "C3", "-", "E3", "-", "G2", "-", "B2", "-",  "C3", "-", "G2", "-", "A2", "-", "G2", "-",
        "F2", "-", "B2", "-", "E2", "-", "E3", "-",  "A2", "-", "E2", "-", "A2", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "05_biblioteca_pegaso.wav"), 110, lib_l, lib_h, lib_b, "K...S.h.K.h.S...", 0.5)

    # 6. TEMA BOSS FINALE IN AULA MAGNA ("Il Sofista Digitale — Progressione 3 Fasi" — 150 BPM)
    bs_l = [
        "D5", "A4", "D5", "F5", "A5", "-", "G5", "F5",  "E5", "F5", "G5", "E5", "F5", "-", "D5", "-",
        "Bb4", "D5", "G5", "Bb5", "A5", "-", "G5", "F5",  "E5", "D5", "C#5", "E5", "A4", "-", "-", "R",
        "C5", "-", "G4", "A4", "F5", "-", "E5", "D5",  "G5", "A5", "Bb5", "G5", "A5", "-", "E5", "-",
        "F5", "G5", "A5", "D6", "C#6", "A5", "G5", "E5",  "D5", "-", "A4", "C#5", "D5", "-", "-", "R",
    ]
    bs_h = [
        "F4", "F4", "A4", "D5", "F5", "-", "E5", "D5",  "C#5", "D5", "E5", "C#5", "D5", "-", "A4", "-",
        "G4", "Bb4", "D5", "G5", "F5", "-", "E5", "D5",  "C#5", "B4", "A4", "G4", "F4", "-", "-", "R",
        "E4", "-", "E4", "F4", "D5", "-", "C5", "Bb4",  "D5", "F5", "G5", "D5", "C#5", "-", "A4", "-",
        "D5", "E5", "F5", "A5", "A5", "E5", "C#5", "A4",  "F4", "-", "E4", "A4", "F4", "-", "-", "R",
    ]
    bs_b = [
        "D2", "D3", "D2", "D3", "F2", "F3", "G2", "A2",  "A2", "E3", "A2", "G2", "D2", "A2", "F2", "D2",
        "G2", "G3", "G2", "G3", "F2", "F3", "D2", "D3",  "A2", "A2", "E2", "G2", "A2", "G2", "F2", "E2",
        "C3", "C3", "E2", "F2", "Bb2", "Bb2", "G2", "F2",  "G2", "D3", "G2", "Bb2", "A2", "E3", "A2", "G2",
        "D2", "F2", "A2", "D3", "A2", "E3", "A2", "C#3",  "D2", "-", "A2", "-", "D3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "06_aula_magna_boss_3fasi.wav"), 150, bs_l, bs_h, bs_b, "KhSKKhSKKhSKKSSS", 0.25)

    # 7. TEMA VITTORIA DI SQUADRA ("Open Day Salvo — Finale a 5 Voci" — 132 BPM)
    vic_l = [
        "C5", "-", "G4", "A4", "E5", "-", "G5", "-",  "A5", "-", "F5", "A5", "G5", "-", "E5", "-",
        "F5", "G5", "A5", "B5", "C6", "-", "G5", "E5",  "F5", "-", "D5", "G5", "C5", "-", "-", "R",
    ]
    vic_h = [
        "E4", "-", "E4", "F4", "C5", "-", "E5", "-",  "C5", "-", "A4", "C5", "B4", "-", "G4", "-",
        "A4", "B4", "C5", "D5", "E5", "-", "C5", "G4",  "A4", "-", "B4", "B4", "E4", "-", "-", "R",
    ]
    vic_b = [
        "C3", "-", "E3", "F3", "C3", "-", "E3", "-",  "F3", "-", "C3", "-", "C3", "-", "G2", "-",
        "F2", "-", "D3", "-", "C3", "-", "E3", "C3",  "D3", "-", "G2", "-", "C3", "-", "-", "R",
    ]
    render_loop(os.path.join(AUDIO_DIR, "07_vittoria_squadra.wav"), 132, vic_l, vic_h, vic_b, "KhShKhSSKhShKSSS", 0.25)


def export_embedded_js(c_path, p_path, t_path, e_path):
    def b64(p):
        with open(p, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode("ascii")

    js = f"""// Auto-generato da tools/generate_assets.py v2.0 — Pixel Art Originale ad Alta Definizione Incorporata
export const EMBEDDED_SPRITES = {{
  characters: "{b64(c_path)}",
  portraits: "{b64(p_path)}",
  tileset: "{b64(t_path)}",
  enemiesProps: "{b64(e_path)}"
}};
"""
    with open(os.path.join(SRC_ASSETS_DIR, "embeddedSprites.js"), "w", encoding="utf-8") as f:
        f.write(js)


if __name__ == "__main__":
    c_p, p_p, t_p, e_p = build_all_sprites()
    build_audio()
    export_embedded_js(c_p, p_p, t_p, e_p)
    print("Sprite v2.0 (32x36, 64x64, tileset, nemici/boss) e tracce audio generati!")
