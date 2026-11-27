"""Public catalogue, validation and normalisation. No request data is logged."""
from __future__ import annotations
import unicodedata
from . import character as ch
from .animals import ANIMALS
from .palette import (SKIN_TONES, HAIR_COLORS, FABRIC_COLORS, DENIM_COLORS,
                      LEATHER_COLORS, METAL_COLORS, EYE_COLORS, table_for_ui)
from .scenes import PHOTO_SCENES
from .nes_art import art_manifest

CHOICES = {
    'build': list(ch.BUILDS), 'face': ch.FACES, 'eye_shape': ch.EYE_SHAPES,
    'brows': ch.BROWS, 'nose': ch.NOSES, 'mouth': ch.MOUTHS,
    'hair': ch.HAIR_STYLES, 'beard': ch.BEARDS, 'expression': ch.EXPRESSIONS,
    'top': ch.TOPS, 'bottom': ch.BOTTOMS, 'shoes': ch.SHOES,
    'hat': ch.HATS, 'glasses': ch.GLASSES, 'accessory': ch.ACCESSORIES,
    'held': ch.HELD, 'pose': ch.POSES,
}
COLORS = dict(skin=SKIN_TONES, hair=HAIR_COLORS, fabric=FABRIC_COLORS,
              denim=DENIM_COLORS, leather=LEATHER_COLORS, metal=METAL_COLORS,
              eyes=EYE_COLORS)
COLOR_FIELDS = {
    'skin': SKIN_TONES, 'hair_color': HAIR_COLORS, 'eyes': EYE_COLORS,
    'top_color': FABRIC_COLORS, 'inner_color': FABRIC_COLORS,
    'bottom_color': DENIM_COLORS + FABRIC_COLORS,
    'belt_color': LEATHER_COLORS, 'shoes_color': LEATHER_COLORS,
    'hat_color': FABRIC_COLORS, 'accessory_color': FABRIC_COLORS + METAL_COLORS,
}

class ValidationError(ValueError):
    pass

def clean_name(value):
    if not isinstance(value, str):
        raise ValidationError('Il nome deve essere un testo, oppure può essere omesso.')
    value = unicodedata.normalize('NFC', value)
    value = ''.join(c for c in value if not unicodedata.category(c).startswith('C'))
    return ' '.join(value.split())[:28]

def normalise_character(raw=None, allow_blink=False):
    if raw is None: raw = {}
    if not isinstance(raw, dict):
        raise ValidationError('Personalizzazione del personaggio non valida.')
    spec = ch.default_spec()
    for field, choices in CHOICES.items():
        if field in raw:
            if not isinstance(raw[field], str) or raw[field] not in choices:
                raise ValidationError(f'Opzione non valida: {field}.')
            spec[field] = raw[field]
    for field, colors in COLOR_FIELDS.items():
        if field in raw:
            if not isinstance(raw[field], str) or raw[field] not in {c[0] for c in colors}:
                raise ValidationError(f'Colore non valido: {field}.')
            spec[field] = raw[field]
    spec = ch.compatible(spec)
    if spec['held'] != 'none':
        spec['pose'] = 'libro'
    elif spec['pose'] == 'libro':
        spec['held'] = 'libro'
    if allow_blink and raw.get('blink') is True:
        spec['blink'] = True
    return spec

def normalise_companion(raw=None):
    if raw is None: return None
    if not isinstance(raw, dict):
        raise ValidationError('Scelta del companion non valida.')
    kind = raw.get('animal')
    if kind is None or kind == '': return None
    if not isinstance(kind, str) or kind not in ANIMALS:
        raise ValidationError('Animale non valido.')
    a = ANIMALS[kind]
    variant = raw.get('variant',a['variants'][0][0])
    pose = raw.get('pose',a['poses'][0])
    if not isinstance(variant,str) or not isinstance(pose,str):
        raise ValidationError('Variante o posa del companion non valida.')
    variant=variant or a['variants'][0][0]
    pose=pose or a['poses'][0]
    if variant not in [v[0] for v in a['variants']] or pose not in a['poses']:
        raise ValidationError('Variante o posa del companion non valida.')
    return dict(animal=kind, variant=variant, pose=pose)

def normalise_job(raw):
    if not isinstance(raw, dict):
        raise ValidationError('La richiesta deve contenere un oggetto JSON.')
    mode = raw.get('mode', 'photo')
    scene = raw.get('scene', 'casardi')
    if not isinstance(mode,str) or not isinstance(scene,str) or mode not in ('photo', 'nes') or scene not in PHOTO_SCENES:
        raise ValidationError('Stile o ambientazione non validi.')
    return dict(mode=mode, scene=scene, name=clean_name(raw.get('name','') if raw.get('name','') is not None else ''),
                character=normalise_character(raw.get('character')),
                companion=normalise_companion(raw.get('companion')))

def public_catalogue(ttl, revision):
    scenes = []
    for sid, cfg in PHOTO_SCENES.items():
        nes_note = ('Interpretazione a colori dalla fotografia storica del 1936. ' if sid=='casardi' else '') + art_manifest()['scenes'][sid]['landmarks']
        scenes.append(dict(id=sid, label=cfg['label'], place=cfg['place'], note=cfg['note'], nes_note=nes_note,
                           thumbs={m: f'/thumbs/{sid}-{m}.{("png" if m=="nes" else "jpg")}?v={revision}'
                                   for m in ('photo','nes')}))
    animals = [dict(id=k, label=v['label'],
                    variants=[dict(id=a,label=b,hex=c) for a,b,c in v['variants']],
                    poses=v['poses']) for k,v in ANIMALS.items()]
    return dict(scenes=scenes, choices=CHOICES, labels=ch.LABELS, compatibility=ch.COMPATIBILITY, presets=ch.PRESETS,
                colors={k:table_for_ui(v) for k,v in COLORS.items()},
                animals=animals, defaults=dict(character=ch.default_spec()),
                ttl_seconds=ttl, asset_revision=revision)
