"""Compact lossless indexed LPC pixels for the offline browser edition.

The unmodified source PNGs and full upstream JSON stay in assets/characters/lpc;
this converts selected pose pixels, NOT the generator's JavaScript.
"""
import base64
import json
from pathlib import Path
from PIL import Image
from app import character as ch

PRIORITY=['OGA-BY 3.0','CC0','CC0 1.0','CC-BY 4.0','CC-BY-SA 3.0','CC-BY-SA 4.0','CC-BY']
URLS={'OGA-BY 3.0':'https://static.opengameart.org/OGA-BY-3.0.txt','CC-BY-SA 3.0':'https://creativecommons.org/licenses/by-sa/3.0/','CC-BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/','CC0':'https://creativecommons.org/publicdomain/zero/1.0/','CC0 1.0':'https://creativecommons.org/publicdomain/zero/1.0/','CC-BY 4.0':'https://creativecommons.org/licenses/by/4.0/'}

def selected_license(record):
    return next(x for x in PRIORITY if x in record['licenses'])

def part_credit(key,part):
    lines=[key+' — '+part['name']]
    for record in part['credits']:
        lic=selected_license(record)
        lines.append('  '+', '.join(record['authors'])+' · '+lic+' · '+URLS.get(lic,''))
        if record.get('notes'):lines.append('  '+record['notes'])
        for url in record.get('urls',[]):lines.append('  '+url)
    return '\n'.join(lines)

def bundle():
    m=ch.manifest();parts={}
    for k,p in m['parts'].items():
        parts[k]=dict(name=p['name'],frames={f:[{key:l[key] for key in ('id','z','material','source_variant','fit')} for l in layers] for f,layers in p['frames'].items()},creditText=part_credit(k,p))
    (ch.ASSETS/'credits.json').write_text(json.dumps({k:p['creditText'] for k,p in parts.items()},ensure_ascii=False,indent=2)+'\n')
    atlases={}
    for ident,info in m['atlases'].items():
        with Image.open(ch.ASSETS/info['path']) as im:pixels=list(im.convert('RGBA').get_flattened_data())
        palette=list(dict.fromkeys(pixels));index={p:i for i,p in enumerate(palette)};assert len(palette)<=256
        runs=bytearray();previous=None;count=0
        for p in pixels:
            val=index[p]
            if val==previous and count<255:count+=1
            else:
                if previous is not None:runs.extend((count,previous))
                previous=val;count=1
        runs.extend((count,previous))
        atlases[ident]=dict(p=palette,r=base64.b64encode(runs).decode())
    out=dict(upstream=m['upstream'],commit=m['commit'],parts=parts,atlases=atlases,palettes=ch.palettes(),
             bases={k:v['base'] for k,v in m['palettes'].items()},custom=ch.CUSTOM,
             maps=dict(body=ch.SKIN_MAP,hair=ch.HAIR_MAP,cloth=ch.CLOTH_MAP,eye=ch.EYE_MAP),
             builds=ch.BUILDS,faceParts=ch.FACE_PARTS,poseIndex=ch.POSE_INDEX,topBase=ch.TOP_BASE,compatibility=ch.COMPATIBILITY,
             trenchId=m['parts']['coat/trench']['frames']['male'][0]['id'])
    text='PERSONAGGI MODULARI LPC — CREDITI COMPLETI DEL SOTTOINSIEME INCLUSO\n'+m['upstream']+'\nRevisione: '+m['commit']+'\n\n'
    text+='LPC non è tutto CC0. Per ciascun record con licenze alternative si sceglie quella riportata qui. I metadati originali e le altre opzioni sono conservati nel manifest. Non si incorpora il codice GPL del generatore.\n\n'
    text+='\n\n'.join(p['creditText'] for p in parts.values())+'\n\n'
    text+='Modifiche: estrazione di quattro pose frontali, atlanti compatti, rimappatura delle palette e composizione. Equipaggiamento fantascientifico originale Casardi: CC0 1.0. Codice originale: MIT. Nessun asset di videogiochi commerciali.\n'
    (ch.ROOT/'assets/characters/CREDITI_LPC.txt').write_text(text,encoding='utf-8')
    return out,text
