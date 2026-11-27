"""Artist-drawn modular LPC characters + original Casardi sci-fi equipment.

No geometry from the rejected character base is used. Genuine upstream source
PNGs, cropped pose atlases, authors, license choices and SHA-256 are retained in
assets/characters/lpc. Rendering is independent MIT code; art is NOT all CC0.
The same indexed atlases/ramps and cyber_layers.py run in the standalone browser.
"""
from __future__ import annotations
from functools import lru_cache
import json
from pathlib import Path
from PIL import Image
from .pixel import PixelCanvas

ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/characters/lpc'
W,H,CX,GROUND=64,64,32,62
BUILDS={'snello':'female','medio':'male','minuto':'teen'}
FACES=['ovale','squadrato','affusolato','tondo']
FACE_PARTS={'ovale':'delicato','squadrato':'marcato','affusolato':'affilato','tondo':'pieno'}
HAIR_STYLES=['corti','caschetto','ricci','lunghi','coda','crocchia','trecce','ondulati','cresta','longhawk','cornrows','dreadlocks','afro','rasati','calvo']
TOPS=['cyber_jacket','field_suit','tech_vest','cappotto','trench','tshirt','camicia','felpa','maglione','giacca']
BOTTOMS=['cargo','jeans','chino','shorts','gonna','gonna_lunga']
SHOES=['tech_boots','sneakers','stivaletti','mocassini','sandali']
HATS=['none','cuffie','berretto','bandana','cappuccio','corona_alloro']
GLASSES=['none','tondi','sole','spessi','visore']
BEARDS=['none','baffi','barba','barba_lunga']
ACCESSORIES=['none','exopack','collana','sciarpa','zaino','tracolla']
HELD=['none','libro','tablet','pergamena','cetra','oloproiettore']
POSES=['rilassata','movimento','aperta','libro']
EXPRESSIONS=['neutra','sorriso','entusiasta','seria','curiosa','sorpresa']
EYE_SHAPES=['classici','mandorla','tondi']
BROWS=['naturali','folte','sottili']
NOSES=['piccolo','largo','aquilino']
MOUTHS=['sottili','piene']
TOP_BASE={'cyber_jacket':'giacca','field_suit':'felpa','tech_vest':'tshirt'}
POSE_INDEX={v:i for i,v in enumerate(POSES)}
COMPATIBILITY={'top':{'cappotto':['medio'],'trench':['medio']},'bottom':{'gonna_lunga':['snello','minuto']}}


def default_spec():
    return dict(build='snello',skin='chiara',face='ovale',eye_shape='classici',eyes='castani',brows='naturali',nose='piccolo',mouth='sottili',
                expression='neutra',hair='corti',hair_color='nero',beard='none',top='cyber_jacket',top_color='antracite',inner_color='ciano',
                bottom='cargo',bottom_color='jeans-scuro',belt_color='nero',shoes='tech_boots',shoes_color='nero',hat='none',hat_color='nero',
                glasses='none',accessory='none',accessory_color='argento',held='none',pose='rilassata')


def compatible(spec):
    """Never use a garment without an authored body variant behind the scenes."""
    s=dict(spec)
    for field,table in COMPATIBILITY.items():
        allowed=table.get(s[field])
        if allowed and s['build'] not in allowed:s[field]='cyber_jacket' if field=='top' else 'gonna'
    return s


@lru_cache(maxsize=1)
def manifest():return json.loads((ASSETS/'manifest.json').read_text())

@lru_cache(maxsize=1)
def palettes():
    return {m:json.loads((ASSETS/'palettes'/(m+'.json')).read_text()) for m in ('body','hair','cloth','eye','metal')}

SKIN_MAP=dict(porcellana='light',chiara='light',dorata='amber',ambra='taupe',olivastra='olive',bruna='brown',ebano='black')
HAIR_MAP=dict(nero='black',castano='dark_brown',nocciola='light_brown',biondo='blonde',ramato='ginger',rosso='redhead',cenere='gray',platino='platinum',viola='purple',verde='green',ciano='cyan',rosa='pink',blu_elettrico='blue')
CLOTH_MAP=dict(bianco='white',crema='tan',rosso='red',bordeaux='maroon',blu='blue',navy='navy',azzurro='sky',verde='green',oliva='forest',giallo='yellow',senape='orange',grigio='gray',antracite='charcoal',nero='black',rosa='pink',lilla='lavender',ciano='cyan',magenta='magenta',jeans='denim',**{'jeans-chiaro':'denim_light','jeans-scuro':'denim_dark'},beige='beige',cuoio='leather',cognac='brown',oro='yellow',argento='gray',bronzo='leather',rame='orange')
EYE_MAP=dict(castani='brown',neri='dark',verdi='green',azzurri='blue',grigi='gray',ambra='yellow')
CUSTOM={
 'body':{'porcelain':['#352830','#b56e61','#d69b80','#edb79a','#ffdec5','#fff3df']},
 'hair':{'cyan':['#081e2d','#123849','#226776','#3898a1','#69cdbf','#b7f3db']},
 'cloth':{'cyan':['#101e31','#1c3b50','#245d71','#35879a','#58b6bd','#a9e8dc'],
          'magenta':['#22182d','#482541','#713553','#aa4774','#da78aa','#efb5cd'],
          'denim':['#15243c','#253a57','#3b5476','#56789b','#80a2c0','#bfd2df'],
          'denim_light':['#293c55','#3e5878','#607ea2','#8aa5c4','#b2c6db','#dee7ef'],
          'denim_dark':['#101b2c','#1d2d43','#30455f','#475f7d','#6f8ba7','#a7bdce'],
          'beige':['#3d352f','#605244','#8a765a','#b5a180','#d5c6a7','#f1e6ce']},
 'eye':{'dark':['#10141f','#1d2638','#5c7383']}
}

def rgb(h):return tuple(int(h[i:i+2],16) for i in (1,3,5))

def target_palette(material,color):
    tables={'body':SKIN_MAP,'hair':HAIR_MAP,'cloth':CLOTH_MAP,'eye':EYE_MAP}
    name=tables.get(material,CLOTH_MAP).get(color,color)
    if material=='body' and color=='porcellana':name='porcelain'
    pal=CUSTOM.get(material,{}).get(name) or palettes()[material].get(name)
    if pal is None:pal=next(iter(palettes()[material].values()))
    return [(*rgb(x),255) for x in pal]


def colors_for(part,s):
    if part.startswith(('body','head/','face/','nose/')):return [('body',s['skin']),('eye',s['eyes'])]
    if part.startswith(('hair/','beard/','brows/')):return [('hair',s['hair_color'])]
    if part.startswith(('top/','coat/')):return [('cloth',s['top_color'])]
    if part.startswith('bottom/'):return [('cloth',s['bottom_color'])]
    if part.startswith('shoes/'):return [('cloth',s['shoes_color'])]
    if part.startswith('hat/'):return [('cloth',s['hat_color'])]
    if part.startswith('accessory/'):return [('cloth',s['accessory_color'])]
    return []

@lru_cache(maxsize=128)
def atlas(ident):
    with Image.open(ASSETS/'atlases'/(ident+'.png')) as im:return tuple(im.convert('RGBA').get_flattened_data())

@lru_cache(maxsize=1024)
def recolored(ident,pose,materials,source_variant):
    pixels=atlas(ident);m=manifest();pal=palettes();mapping=[]
    for material,col in materials:
        base=m['palettes'][material]['base']
        if material=='cloth' and source_variant in pal['cloth']:base=source_variant
        src=[rgb(x) for x in pal[material][base]];dst=target_palette(material,col)
        mapping.extend(zip(src,dst))
    trench_id=m['parts']['coat/trench']['frames']['male'][0]['id']
    if ident==trench_id:
        dst=target_palette('cloth',dict(materials).get('cloth','nero'))
        mapping.extend([(rgb(h),dst[i]) for h,i in [('#302732',0),('#5e5252',2),('#7e7068',3),('#867e7f',4)]])
    result=[]
    for y in range(64):
        for x in range(64):
            p=pixels[y*256+pose*64+x]
            if p[3]:
                for src,dst in mapping:
                    if all(abs(p[i]-src[i])<=1 for i in range(3)):
                        p=(*dst[:3],p[3]);break
            result.append(p)
    return result


def chosen_parts(s):
    frame=BUILDS[s['build']];head_frame='female' if s['face']=='ovale' else 'male'
    top=s['top'];top_part=('coat/' if top in ('cappotto','trench') else 'top/')+TOP_BASE.get(top,top)
    bottom='jeans' if s['bottom']=='cargo' else s['bottom']
    shoes='stivaletti' if s['shoes']=='tech_boots' else s['shoes']
    parts=[('body',frame),('head/'+FACE_PARTS[s['face']],frame),(top_part,frame),('bottom/'+bottom,frame),('shoes/'+shoes,frame)]
    expression='closed' if s.get('blink') else s['expression']
    parts.append(('face/'+expression,head_frame))
    if s['brows']!='naturali':parts.append(('brows/'+s['brows'],frame))
    # The small LPC head already includes a subtle nose. The other two are
    # separately drawn replacement pieces; no fake option count from colors.
    if s['nose']!='piccolo':parts.append(('nose/'+s['nose'],frame))
    if s['hair']!='calvo' and s['hat'] not in ('cappuccio','berretto'):parts.append(('hair/'+s['hair'],frame))
    if s['beard']!='none':parts.append(('beard/'+s['beard'],frame))
    if s['hat'] in ('bandana','cappuccio'):parts.append(('hat/'+s['hat'],frame))
    if s['glasses'] in ('tondi','sole','spessi'):parts.append(('glasses/'+s['glasses'],frame))
    if s['accessory']=='sciarpa':parts.append(('accessory/sciarpa',frame))
    return parts


def render(raw=None,style='photo'):
    s=compatible({**default_spec(),**(raw or {})})
    if s['held']!='none':s['pose']='libro'
    elif s['pose']=='libro':s['held']='libro'
    pose=POSE_INDEX[s['pose']]
    c=PixelCanvas(W,H)
    from .cyber_layers import paint_equipment,native_over
    paint_equipment(c,s,'back',pose)
    layers=[]
    for part,frame in chosen_parts(s):
        for layer in manifest()['parts'][part]['frames'][frame]:layers.append((layer['z'],part,layer))
    for z,part,layer in sorted(layers,key=lambda v:v[0]):
        pixels=recolored(layer['id'],pose,tuple(colors_for(part,s)),layer['source_variant'])
        for i,p in enumerate(pixels):
            if p[3]:c.buf[i]=p if p[3]==255 else native_over(p,c.buf[i])
    paint_equipment(c,s,'front',pose)
    # Outside silhouettes stay hard-edged even if an upstream shadow extends
    # beyond a different selected head. Original source PNGs stay unmodified.
    for i,p in enumerate(c.buf):
        if 0<p[3]<255:c.buf[i]=(*p[:3],255) if p[3]>=128 else (0,0,0,0)
    return c

LABELS={
 'build':{'snello':'Slanciata','medio':'Ampia','minuto':'Compatta'},
 'face':{'ovale':'Delicato','squadrato':'Marcato','affusolato':'Affilato','tondo':'Pieno'},
 'hair':{'corti':'Corti asimmetrici','caschetto':'Caschetto','ricci':'Ricci corti','lunghi':'Lunghi lisci','coda':'Coda alta','crocchia':'Crocchia','trecce':'Treccia','ondulati':'Ondulati','cresta':'Cresta corta','longhawk':'Cresta lunga','cornrows':'Treccine aderenti','dreadlocks':'Dreadlocks','afro':'Afro','rasati':'Rasati','calvo':'Senza capelli'},
 'top':{'cyber_jacket':'Giacca cyber','field_suit':'Tuta da esplorazione','tech_vest':'Gilet tecnico','cappotto':'Cappotto da pilota','trench':'Trench tecnico','tshirt':'T-shirt','camicia':'Camicia','felpa':'Maglia sportiva','maglione':'Maglione','giacca':'Cardigan'},
 'bottom':{'cargo':'Cargo tecnici','jeans':'Jeans risvoltati','chino':'Pantaloni','shorts':'Pantaloncini','gonna':'Gonna corta','gonna_lunga':'Gonna dritta'},
 'shoes':{'tech_boots':'Stivali tecnici','sneakers':'Sneakers','stivaletti':'Stivaletti','mocassini':'Scarpe basse','sandali':'Sandali'},
 'hat':{'none':'Nessuno','cuffie':'Cuffie tecniche','berretto':'Berretto','bandana':'Bandana','cappuccio':'Cappuccio','corona_alloro':'Corona d’alloro'},
 'glasses':{'none':'Nessuno','tondi':'Tondi','sole':'Da sole','spessi':'Montatura spessa','visore':'Visore HUD'},
 'accessory':{'none':'Nessuno','exopack':'Zaino a celle','collana':'Collana','sciarpa':'Sciarpa','zaino':'Zaino','tracolla':'Tracolla'},
 'held':{'none':'Niente','libro':'Libro aperto','tablet':'Tablet','pergamena':'Pergamena','cetra':'Cetra','oloproiettore':'Oloproiettore'},
 'pose':{'rilassata':'Rilassata','movimento':'In movimento','aperta':'Braccia aperte','libro':'Mani davanti'}
}

PRESETS=[
 dict(id='urbano',label='Urbano',character=dict(build='snello',hair='corti',hair_color='nero',top='cyber_jacket',top_color='antracite',inner_color='ciano',bottom='cargo',bottom_color='jeans-scuro',shoes='tech_boots',expression='neutra')),
 dict(id='esplorazione',label='Esplorazione',character=dict(build='minuto',hair='coda',hair_color='castano',top='field_suit',top_color='oliva',inner_color='senape',accessory='exopack',accessory_color='oliva',bottom='cargo',bottom_color='verde',shoes='tech_boots',skin='dorata',expression='curiosa')),
 dict(id='neon',label='Neon',character=dict(build='snello',hair='longhawk',hair_color='ciano',top='tech_vest',top_color='magenta',inner_color='magenta',glasses='visore',bottom='cargo',bottom_color='nero',shoes='tech_boots',skin='bruna',expression='neutra')),
 dict(id='pilota',label='Pilota',character=dict(build='medio',face='squadrato',hair='corti',hair_color='platino',top='cappotto',top_color='bordeaux',inner_color='senape',bottom='chino',bottom_color='nero',shoes='stivaletti',expression='seria')),
]


def character_credit(raw=None):
    s=compatible({**default_spec(),**(raw or {})})
    data=json.loads((ASSETS/'credits.json').read_text())
    return ('PERSONAGGIO MODULARE LPC\nFonte: '+manifest()['upstream']+'\nRevisione: '+manifest()['commit']+'\n'
            +'\n'.join(data[k] for k in dict.fromkeys(part for part,_ in chosen_parts(s)))
            +'\nModifiche: quattro pose frontali estratte, livelli modulari e palette armonizzate; equipaggiamento fantascientifico originale Casardi (CC0 1.0). Le licenze dei materiali originali restano valide. Nessun asset di Cyberpunk 2077 o ARK.\n')
