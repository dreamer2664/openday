"""Curate licensed, artist-drawn LPC layers at a pinned upstream revision.

Downloads only explicit, verified layers, not the whole generator. Its GPL
JavaScript is NOT incorporated. Our renderer is independent. Upstream metadata,
credits, actual source URLs/hashes and unmodified source PNGs are retained.
End users never run this maintenance script and need no network at runtime.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor,as_completed
import hashlib
import io
import json
from pathlib import Path
import sys
import urllib.error
import urllib.request
import urllib.parse
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/characters/lpc'
CACHE=Path.home()/'.cache/casardi-research/lpc'
COMMIT='86a3719ee4a7e2e9fb27c7c152e29a741d3e930a'
REPO='https://raw.githubusercontent.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/'+COMMIT+'/'
FRAMES=['female','male','teen']
POSES=[('walk',0),('slash',4),('spellcast',5),('spellcast',2)]
LEGACY_ROWS={'spellcast':0,'thrust':4,'walk':8,'slash':12,'shoot':16,'hurt':20}
# Each entry is an actual artist-authored shape; palette variations are separate.
PARTS={
 'body':'body/body',
 'head/delicato':'head/heads/human/heads_human_female_small',
 'head/marcato':'head/heads/human/heads_human_male_small',
 'head/affilato':'head/heads/human/heads_human_male_gaunt',
 'head/pieno':'head/heads/human/heads_human_male_plump',
 'face/neutra':'head/faces/face_neutral','face/sorriso':'head/faces/face_happy',
 'face/entusiasta':'head/faces/face_happy2','face/seria':'head/faces/face_angry',
 'face/curiosa':'head/faces/face_look_l','face/sorpresa':'head/faces/face_shock',
 'face/closed':'head/faces/face_closed',
 'brows/folte':'head/eyebrows/eyebrows_thick','brows/sottili':'head/eyebrows/eyebrows_thin',
 'nose/piccolo':'head/nose/head_nose_button','nose/largo':'head/nose/head_nose_big',
 'nose/aquilino':'head/nose/head_nose_straight',
 'hair/corti':'hair/short/hair_parted_side_bangs2','hair/caschetto':'hair/bob/hair_bob',
 'hair/ricci':'hair/curly/hair_curly_short2','hair/lunghi':'hair/long/hair_long_straight',
 'hair/coda':'hair/braids/hair_high_ponytail','hair/crocchia':'hair/braids/hair_bangs_bun',
 'hair/trecce':'hair/braids/hair_braid2','hair/ondulati':'hair/long/hair_wavy',
 'hair/cresta':'hair/bald/hair_shorthawk','hair/longhawk':'hair/bald/hair_longhawk',
 'hair/cornrows':'hair/afro/hair_cornrows','hair/dreadlocks':'hair/afro/hair_dreadlocks_long',
 'hair/afro':'hair/afro/hair_natural','hair/rasati':'hair/bald/hair_buzzcut',
 'beard/baffi':'hair/mustaches/beards_mustache','beard/barba':'hair/beards/beards_trimmed',
 'beard/barba_lunga':'hair/beards/beards_beard',
 'top/tshirt':'torso/shirts/shortsleeve/torso_clothes_tshirt',
 'top/camicia':'torso/shirts/longsleeve/torso_clothes_longsleeve2_buttoned',
 'top/felpa':'torso/shirts/longsleeve/torso_clothes_longsleeve2',
 'top/maglione':'torso/shirts/longsleeve/torso_clothes_longsleeve',
 'top/giacca':'torso/shirts/longsleeve/torso_clothes_longsleeve2_cardigan',
 'coat/cappotto':'torso/jacket/torso_jacket_collared',
 'coat/trench':'torso/jacket/torso_jacket_trench',
 'bottom/jeans':'legs/pants/legs_cuffed','bottom/chino':'legs/pants/legs_pants',
 'bottom/shorts':'legs/pants/legs_pants2','bottom/gonna':'legs/skirts/legs_skirts_plain',
 'bottom/gonna_lunga':'legs/skirts/legs_skirt_straight',
 'shoes/sneakers':'feet/shoes/feet_shoes_revised','shoes/stivaletti':'feet/boots/feet_boots_revised',
 'shoes/mocassini':'feet/shoes/feet_shoes_basic','shoes/sandali':'feet/feet_sandals',
 'hat/cappuccio':'headwear/coverings/hoods/hat_hood_cloth',
 'hat/bandana':'headwear/coverings/bandana/hat_bandana',
 'glasses/tondi':'headwear/accessories/glasses/facial_glasses_round',
 'glasses/sole':'headwear/accessories/glasses/facial_glasses_shades',
 'glasses/spessi':'headwear/accessories/glasses/facial_glasses_nerd',
 'accessory/sciarpa':'headwear/neck/neck_scarf',
}

def digest(raw):return hashlib.sha256(raw).hexdigest()
def fetch(path,optional=False):
    cache=CACHE/path
    if cache.is_file():return cache.read_bytes()
    try:
        req=urllib.request.Request(REPO+urllib.parse.quote(path,safe='/'),headers={'User-Agent':'Casardi-OpenDay-asset-audit/2.0'})
        with urllib.request.urlopen(req,timeout=40) as r:raw=r.read()
        cache.parent.mkdir(parents=True,exist_ok=True);cache.write_bytes(raw);return raw
    except urllib.error.HTTPError as e:
        if optional and e.code==404:return None
        raise

def layer_source(prefix,anim,variant):
    if prefix.endswith('.png'):candidates=[(prefix,True)]
    else:
        candidates=[(prefix+anim+'.png',False),(prefix+anim+'/'+variant+'.png',False),
                    (prefix+variant+'.png',True),(prefix+variant+'/'+anim+'.png',False)]
    for p,universal in candidates:
        raw=fetch('spritesheets/'+p,optional=True)
        if raw is not None:return 'spritesheets/'+p,raw,universal
    raise ValueError('No explicit source image for '+prefix+' / '+anim+' / '+variant)

def build_part(key,path):
    definition_path='sheet_definitions/'+path+'.json';definition_raw=fetch(definition_path);d=json.loads(definition_raw)
    assert d.get('credits'),('No credits',key)
    for c in d['credits']:
        assert c.get('authors') and c.get('licenses'),('Incomplete credit',key)
        assert any(x in c['licenses'] for x in ('OGA-BY 3.0','CC-BY-SA 3.0','CC-BY-SA 4.0','CC0','CC0 1.0','CC-BY 4.0','CC-BY')),c
    recolors=d.get('recolors',{})
    material=recolors.get('material','body' if key.startswith(('body','head/','face/','nose/')) else 'cloth')
    variant=('white' if 'white' in d.get('variants',[]) or not d.get('variants') else 'gray' if 'gray' in d['variants'] else d['variants'][0]).replace(' ','_')
    result=dict(name=d['name'],definition=definition_path,credits=d['credits'],frames={},recolors=recolors)
    sources={};atlases={};definition={definition_path:definition_raw}
    for frame in FRAMES:
        result['frames'][frame]=[]
        for layer_key,layer in d.items():
            if not layer_key.startswith('layer_'):continue
            prefix=layer.get(frame)
            fit='native'
            if not prefix:
                # LPC v3 shares head/hand anchors. Explicit oversized coats and
                # accessories may use the male layer, never silently body bases.
                if key.startswith(('coat/','bottom/gonna_lunga')):
                    # Unsupported garments remain absent for this body. The
                    # catalogue disables them; never force a universal layer.
                    continue
                if key.startswith(('hat/','glasses/','beard/','accessory/')):
                    prefix=layer.get('male') or layer.get('female') or layer.get('teen');fit='oversized' if key.startswith('coat/') else 'shared anchors'
                else:raise ValueError('Part lacks body variant: '+key+' / '+frame)
            if not prefix:raise ValueError('No frame path: '+key+' / '+frame)
            # Expressions substitute head type, independent of body shape.
            face_head='female' if frame=='female' else 'male'
            prefix=prefix.replace('${head}',face_head)
            unique=prefix+'|'+variant
            ident=digest(unique.encode())[:16]
            atlas=Image.new('RGBA',(64*len(POSES),64),(0,0,0,0));actual=[]
            for i,(anim,col) in enumerate(POSES):
                p,raw,universal=layer_source(prefix,anim,variant)
                sources[p]=raw;im=Image.open(io.BytesIO(raw)).convert('RGBA')
                row=(LEGACY_ROWS[anim] if universal else 0)+2
                box=(col*64,row*64,col*64+64,row*64+64)
                assert box[2]<=im.width and box[3]<=im.height,(key,p,box,im.size)
                crop=im.crop(box)
                # Back-hair layers are legitimately invisible in front view.
                if '/bg/' not in p:assert crop.getbbox(),('Empty selected pose',key,p,i)
                atlas.alpha_composite(crop,(i*64,0));actual.append(dict(path=p,sha256=digest(raw),crop=list(box)))
            out=io.BytesIO();atlas.save(out,'PNG',optimize=True);atlases[ident]=out.getvalue()
            entry=dict(id=ident,z=layer['zPos'],material=material,source_variant=variant,fit=fit,sources=actual)
            result['frames'][frame].append(entry)
    return key,result,sources,atlases,definition

def main():
    for directory in ('sources','definitions','atlases','palettes'):(OUT/directory).mkdir(parents=True,exist_ok=True)
    manifest=dict(upstream='https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator',commit=COMMIT,
                  date='2026-11-27',poses=[dict(animation=a,front_row=2,column=b) for a,b in POSES],parts={},sources={},atlases={},definitions={},palettes={})
    errors=[]
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures={pool.submit(build_part,k,v):k for k,v in PARTS.items()}
        for f in as_completed(futures):
            key=futures[f]
            try:
                key,result,sources,atlases,definitions=f.result();manifest['parts'][key]=result
                for p,raw in sources.items():
                    dest=OUT/'sources'/p.removeprefix('spritesheets/');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
                    manifest['sources'][p]=dict(url=REPO+p,sha256=digest(raw),local='sources/'+p.removeprefix('spritesheets/'),bytes=len(raw))
                for ident,raw in atlases.items():
                    (OUT/'atlases'/(ident+'.png')).write_bytes(raw);manifest['atlases'][ident]=dict(path='atlases/'+ident+'.png',sha256=digest(raw),bytes=len(raw))
                for p,raw in definitions.items():
                    dest=OUT/'definitions'/p.removeprefix('sheet_definitions/');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
                    manifest['definitions'][p]=dict(url=REPO+p,sha256=digest(raw),local='definitions/'+p.removeprefix('sheet_definitions/'))
                print('PASS',key,flush=True)
            except Exception as e:errors.append((key,type(e).__name__,str(e)));print('EXCLUDED',key,repr(e),flush=True)
    for material in ('body','hair','cloth','eye','metal'):
        p='palette_definitions/'+material+'/'+material+'_ulpc.json';raw=fetch(p)
        (OUT/'palettes'/(material+'.json')).write_bytes(raw);manifest['palettes'][material]=dict(path='palettes/'+material+'.json',sha256=digest(raw),url=REPO+p)
        mp='palette_definitions/'+material+'/meta_'+material+'.json';meta=fetch(mp);(OUT/'palettes'/(material+'-meta.json')).write_bytes(meta);manifest['palettes'][material]['base']=json.loads(meta)['base']
    # Stable ordering makes builds and offline audits reproducible.
    manifest['parts']=dict(sorted(manifest['parts'].items()));manifest['exclusions']=errors
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print('Curated',len(manifest['parts']),'parts;',len(manifest['atlases']),'unique pose atlases;',len(manifest['sources']),'source PNGs. Exclusions:',errors)
    if errors:sys.exit(2)

if __name__=='__main__':main()
