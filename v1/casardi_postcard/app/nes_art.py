"""Canonical revised native pixel paintings; no generation/network at runtime.

These twelve sources are AI-assisted architectural repaints, individually credited
and palette-finished. They replace, rather than recolour, the old schematic
procedural backgrounds. The PNG source itself is editable in a pixel editor.
"""
from functools import lru_cache
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/nes'

@lru_cache(maxsize=1)
def art_manifest():
    return json.loads((ASSETS/'manifest.json').read_text(encoding='utf-8'))

@lru_cache(maxsize=12)
def load_nes_art(scene_id):
    record=art_manifest()['scenes'][scene_id]
    path=ROOT/record['path']
    if hashlib.sha256(path.read_bytes()).hexdigest()!=record['sha256']:
        raise ValueError('Sfondo pixel modificato o incompleto: ripristina il file dal pacchetto verificato.')
    with Image.open(path) as source:
        if source.size!=(600,400):raise ValueError('Lo sfondo pixel deve essere nativo 600 × 400.')
        image=source.convert('RGBA')
    if image.getextrema()[3]!=(255,255):raise ValueError('Lo sfondo pixel deve essere completamente opaco.')
    return image
