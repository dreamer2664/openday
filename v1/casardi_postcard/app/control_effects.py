"""Appearance-level creator rules, not button-state or renderability checks.

A zero counts as no visible change: compare composited, native 64×64 RGBA
pixels, ignoring RGB stored under zero alpha. Occluded choices are retained in
the character spec, but the UI disables ineffective alternatives and offers an
explicit, explained action to uncover the relevant layers. No visitor is logged.
"""
from .catalogue import CHOICES, COLOR_FIELDS, normalise_character, ValidationError
from .character import render, COMPATIBILITY


def values_for(field):
    if field in CHOICES:
        return CHOICES[field]
    if field in COLOR_FIELDS:
        return list(dict.fromkeys(x[0] for x in COLOR_FIELDS[field]))
    raise ValidationError('Controllo del personaggio non valido.')


def apply_field(raw, field, value):
    if value not in values_for(field):
        raise ValidationError('Opzione del personaggio non valida.')
    s = normalise_character(raw)
    s[field] = value
    if field == 'held':
        s['pose'] = 'rilassata' if value == 'none' else 'libro'
    if field == 'pose':
        if value != 'libro':
            s['held'] = 'none'
        elif s['held'] == 'none':
            s['held'] = 'libro'
    if field == 'accessory':
        from .palette import FABRIC_COLORS, METAL_COLORS
        colors = METAL_COLORS if value == 'collana' else FABRIC_COLORS
        if s['accessory_color'] not in {x[0] for x in colors}:
            s['accessory_color'] = colors[0][0]
    return normalise_character(s)


def visible_diff(a, b):
    return sum(x != y and (x[3] != 0 or y[3] != 0) for x, y in zip(a.buf, b.buf))


def reveal_for(s, field):
    """Only applied by an explicit UI button; never silently strip an outfit."""
    changes = {}
    if field in ('eyes', 'eye_shape', 'brows', 'nose'):
        changes = dict(glasses='none', expression='neutra')
        if field == 'brows':
            changes.update(hair='rasati', hat='none')
        if field == 'nose':
            changes.update(beard='none')
    elif field == 'mouth':
        changes = dict(beard='none', expression='neutra')
        if s['accessory'] == 'sciarpa':
            changes['accessory'] = 'none'
    elif field in ('hair', 'hair_color'):
        changes = dict(hat='none')
        if field == 'hair_color' and s['hair'] == 'calvo':
            changes['hair'] = 'corti'
    elif field in ('bottom', 'bottom_color', 'belt_color'):
        changes = dict(top='cyber_jacket')
        if field == 'belt_color' and s['bottom'] in ('gonna', 'gonna_lunga'):
            changes['bottom'] = 'cargo'
    elif field in ('shoes', 'shoes_color'):
        changes = dict(top='cyber_jacket', bottom='chino')
    elif field == 'inner_color':
        changes = dict(top='cyber_jacket', held='none', pose='rilassata')
    return {k: v for k, v in changes.items() if s[k] != v}


def assess(raw, fields):
    s = normalise_character(raw)
    if not isinstance(fields, list) or len(fields) > 12 or not all(isinstance(f, str) for f in fields):
        raise ValidationError('Elenco dei controlli non valido.')
    base = render(s)
    result = {}
    for field in dict.fromkeys(fields):
        counts = {}
        for value in values_for(field):
            allowed = COMPATIBILITY.get(field, {}).get(value)
            counts[value] = None if allowed and s['build'] not in allowed else visible_diff(base, render(apply_field(s, field, value)))
        result[field] = dict(pixels=counts, reveal=reveal_for(s, field))
    return result
