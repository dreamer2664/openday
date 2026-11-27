"""Attribution travels with the PNG, not as extra lettering on its face."""
from functools import lru_cache
from pathlib import Path
import io
import json
from PIL.PngImagePlugin import PngInfo

ROOT=Path(__file__).resolve().parent.parent

@lru_cache(maxsize=1)
def photo_metadata():
    return json.loads((ROOT/'assets/photos/photo_metadata.json').read_text(encoding='utf-8'))

def credit_for(job):
    m=photo_metadata()[job['scene']]
    author=m['artist']
    if author=='Unknown authorUnknown author': author='Autore non identificato (archivio storico)'
    pixel=job['mode']=='nes'
    modifications=('Ricostruzione pixel art originale basata su riferimenti architettonici; aggiunta di sprite e testi.'
                   if pixel else 'Ridimensionamento, ritaglio, finitura cromatica, ombre; aggiunta di sprite e testi.')
    return dict(title=m['title'][5:],author=author,source=m['page'],original=m['url'],
                license='CC BY-SA 4.0',license_url='https://creativecommons.org/licenses/by-sa/4.0/',
                photo_license=m['lic'],photo_license_url=m['licurl'],changes=modifications,
                artwork=(__import__('app.character',fromlist=['character_credit']).character_credit(job.get('character')) if 'character' in job else ('Sfondo NES originale: adattamento CC BY-SA 4.0; nessun personaggio incluso in questo asset.' if pixel else 'Personaggi modulari Universal LPC: licenze per parte, non tutti CC0. Crediti completi in assets/characters/CREDITI_LPC.txt; il PNG esportato attribuisce le parti selezionate.'))+'\nCompanion originali Casardi: CC0 1.0. Nessun endorsement da parte dei fotografi o degli autori LPC.',
                mode='Ricostruzione pixel art' if pixel else 'Fotografia')

def credit_text(c):
    return (f"CARTOLINA OPEN DAY 2026/27 — LICEO ALFREDO CASARDI — BARLETTA\n\n"
            f"{c['mode']}: {c['title']}\nAutore della fotografia di riferimento: {c['author']}\n"
            f"Fonte: {c['source']}\nOriginale: {c['original']}\n"
            f"Licenza della fotografia di riferimento: {c['photo_license']}\n{c['photo_license_url']}\n"
            f"Licenza della composizione derivata: {c['license']}\n{c['license_url']}\n"
            f"Modifiche: {c['changes']}\n{c['artwork']}\n"
            "Le parti originali mantengono le loro licenze; nessun asset LPC viene dichiarato CC0.\n"
            "Font: Cinzel, EB Garamond, Press Start 2P — SIL Open Font License 1.1.\n"
            "Conserva questi crediti quando ridistribuisci il file.\n")

def png_bytes(image, job):
    c=credit_for(job)
    meta=PngInfo()
    meta.add_itxt('Title','LICEO ALFREDO CASARDI — OPEN DAY 2026/27 — BARLETTA')
    meta.add_itxt('Author',c['author'])
    meta.add_itxt('Source',c['source'])
    meta.add_itxt('Copyright',f"{c['license']} — {c['license_url']}")
    meta.add_itxt('Description',credit_text(c))
    meta.add_text('Software','Casardi Postcard Studio 3.0 · Pillow')
    buf=io.BytesIO()
    image.save(buf,'PNG',optimize=True,pnginfo=meta,dpi=(300,300))
    return buf.getvalue()
