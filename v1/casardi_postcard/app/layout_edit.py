"""Validated optional composition in display-independent 600×400 authoring units.
No free text, remote asset URLs, files, visitor persistence or network operations.
"""
from __future__ import annotations
from functools import lru_cache
from pathlib import Path
import json,math
ROOT=Path(__file__).resolve().parent.parent
THEMES=('originale','notte','avorio','pergamena')
TRACKS={'none':'','classico':'LICEO CLASSICO','scienze_umane':'SCIENZE UMANE','musicale':'LICEO MUSICALE'}
POSITIONS=('scene','top-left','top-right','bottom-left','bottom-right')
RATIOS=dict(gatto=.30,cane=.40,volpe=.36,gufo=.34,coniglio=.32,corvo=.30,tartaruga=.10,drago=.34)
@lru_cache(maxsize=1)
def sticker_manifest():return json.loads((ROOT/'assets/stickers/manifest.json').read_text())
def default_composition():return dict(actor=None,plaque=dict(theme='originale',ornament='none',position='scene',track='none'),stickers=[])
def integer(value,low,high,label):
    if isinstance(value,bool) or not isinstance(value,int) or not low<=value<=high:raise ValueError(f'{label}: valore intero fuori intervallo.')
    return value
def normalise(raw=None):
    if raw is None:return default_composition()
    if not isinstance(raw,dict):raise ValueError('Composizione non valida.')
    c=default_composition();actor=raw.get('actor');p=raw.get('plaque',{});stickers=raw.get('stickers',[])
    if actor is not None:
        if not isinstance(actor,dict):raise ValueError('Posizione del personaggio non valida.')
        c['actor']=dict(x=integer(actor.get('x'),0,600,'Posizione orizzontale'),y=integer(actor.get('y'),0,400,'Piano dei piedi'),scale=integer(actor.get('scale',100),65,135,'Dimensione del personaggio'))
    if not isinstance(p,dict):raise ValueError('Targhetta non valida.')
    for field,allowed in [('theme',THEMES),('track',tuple(TRACKS)),('position',POSITIONS),('ornament',('none',*sticker_manifest()['stickers']))]:
        value=p.get(field,c['plaque'][field])
        if not isinstance(value,str) or value not in allowed:raise ValueError('Opzione della targhetta non valida.')
        c['plaque'][field]=value
    if not isinstance(stickers,list) or len(stickers)>6:raise ValueError('Puoi aggiungere al massimo sei sticker.')
    for item in stickers:
        if not isinstance(item,dict) or not isinstance(item.get('id'),str) or item['id'] not in sticker_manifest()['stickers']:raise ValueError('Sticker non valido.')
        rotation=integer(item.get('rotation',0),-30,30,'Rotazione')
        if item['id']=='logo_casardi' and rotation:raise ValueError('Il logo ufficiale mantiene l’orientamento originale.')
        c['stickers'].append(dict(id=item['id'],x=integer(item.get('x',500),0,600,'Posizione dello sticker'),y=integer(item.get('y',75),0,400,'Posizione dello sticker'),size=integer(item.get('size',80),36,132,'Dimensione dello sticker'),rotation=rotation))
    return c
def clamp(v,lo,hi):return max(lo,min(hi,v))
def descriptor(im):return dict(w=im.width,h=im.height,anchor=im.info.get('_anchor_x',im.width/2))
def actor_geometry(job,person,companion=None,reference=1):
    from .scenes import PHOTO_SCENES,NES_SCENES
    nes=job.get('mode')=='nes';lay=(NES_SCENES if nes else PHOTO_SCENES)[job.get('scene','casardi')];u=1 if nes else .2
    c=normalise(job.get('composition'));a=c['actor'];base_x=lay['char']['x']*u;base_y=lay['ground_y']*u
    base_scale=max(1,round(lay['char']['h']/person['h']))*u
    zoom=(a or {}).get('scale',100)/100
    sc=max(1,round(base_scale*zoom/u))*u
    x=(a or {}).get('x',base_x);y=(a or {}).get('y',base_y)
    left=-person['anchor']*sc;right=(person['w']-person['anchor'])*sc;top=-person['h']*sc
    comp=None
    if companion and job.get('companion'):
        offset=((lay['comp']['x'] if nes else lay['companion']['x'])*u-base_x)*sc/base_scale
        asc=max(1,round(person['h']*sc*RATIOS[job['companion']['animal']]/reference/u))*u
        comp=dict(offset=offset,scale=asc,w=companion['w']*asc,h=companion['h']*asc)
        left=min(left,offset-comp['w']/2);right=max(right,offset+comp['w']/2);top=min(top,-comp['h'])
    # Both the character and companion remain inside the printed frame.
    if a is not None:x=clamp(x,12-left,588-right);y=clamp(y,12-top,388)
    if nes:x=round(x);y=round(y)
    char=dict(x=x-person['anchor']*sc,y=y-person['h']*sc,w=person['w']*sc,h=person['h']*sc,scale=sc,cx=x,ground=y)
    if comp:comp.update(cx=x+comp['offset'],ground=y,x=x+comp['offset']-comp['w']/2,y=y-comp['h'])
    return dict(actor=dict(x=x,y=y,scale=(a or {}).get('scale',100)),character=char,companion=comp,group=dict(x=x+left,y=y+top,w=right-left,h=-top),recommended=dict(x=base_x,y=base_y),manual=a is not None)
def sticker_geometry(item):
    record=sticker_manifest()['stickers'][item['id']];w,h=record['size'];ratio=item['size']/max(w,h);w*=ratio;h*=ratio
    angle=math.radians(item['rotation']);rw=abs(w*math.cos(angle))+abs(h*math.sin(angle));rh=abs(w*math.sin(angle))+abs(h*math.cos(angle))
    x=clamp(item['x'],10+rw/2,590-rw/2);y=clamp(item['y'],10+rh/2,390-rh/2)
    return dict(id=item['id'],cx=x,cy=y,w=w,h=h,x=x-rw/2,y=y-rh/2,box_w=rw,box_h=rh,rotation=item['rotation'],size=item['size'])
def public_stickers():
    return [dict(id=sid,label=r['label'],size=r['size'],rotation=r['rotation'],thumb='/stickers/'+sid+'.png',license=r['license']) for sid,r in sticker_manifest()['stickers'].items()]
def has_custom_plaque(job):
    p=normalise(job.get('composition'))['plaque'];return p!=default_composition()['plaque']
def credits(job):
    c=normalise(job.get('composition'));ids={s['id'] for s in c['stickers']}
    if c['plaque']['ornament']!='none':ids.add(c['plaque']['ornament'])
    if not ids:return ''
    lines=['DECORAZIONI FACOLTATIVE']
    for sid in sorted(ids):
        r=sticker_manifest()['stickers'][sid]
        lines.append(r['label']+': '+r['license']+' — '+r['license_url'])
        if sid=='logo_casardi':lines.extend([r['attribution'],r['source_pdf'],r['legal_notice']])
        else:lines.append('Sticker originale assistito da IA e rifinito su griglia 96×96, non logo istituzionale. Nessuna esclusiva sugli elementi automatici.')
    return '\n'+'\n'.join(lines)+'\n'

@lru_cache(maxsize=16)
def sticker_image(sid,mode='photo'):
    from PIL import Image
    with Image.open(ROOT/sticker_manifest()['stickers'][sid]['paths'][mode]) as im:return im.convert('RGBA')
def draw_stickers(card,job):
    from PIL import Image
    k=card.width/600
    for item in normalise(job.get('composition'))['stickers']:
        g=sticker_geometry(item);im=sticker_image(item['id'],job.get('mode','photo'))
        im=im.resize((max(1,round(g['w']*k)),max(1,round(g['h']*k))),Image.Resampling.LANCZOS if item['id']=='logo_casardi' and job.get('mode')!='nes' else Image.Resampling.NEAREST)
        if item['rotation']:im=im.rotate(-item['rotation'],resample=Image.Resampling.NEAREST,expand=True)
        card.alpha_composite(im,(round(g['cx']*k-im.width/2),round(g['cy']*k-im.height/2)))
def draw_plaque(card,job,zone):
    from PIL import ImageDraw,Image
    from .postcard import _font
    p=normalise(job.get('composition'))['plaque'];nes=job.get('mode')=='nes';k=card.width/600;d=ImageDraw.Draw(card)
    if nes:d.fontmode='1'
    theme=p['theme'] if p['theme']!='originale' else ('notte' if nes else 'avorio')
    colors={'notte':dict(bg='#151b32',ink='#f5efd9',accent='#f1c675',edge='#65718d'),'avorio':dict(bg='#faf6e8',ink='#202d42',accent='#916b2f',edge='#b8aa83'),'pergamena':dict(bg='#ecdbb3',ink='#342d29',accent='#6e5030',edge='#b29763')}[theme]
    rows=[dict(t='LICEO ALFREDO CASARDI',s=8 if nes else 14.2,f='pixel' if nes else 'cinzel',a=12 if nes else 20),dict(t='OPEN DAY 2026/27',s=7 if nes else 10.4,f='pixel' if nes else 'garamond',a=11 if nes else 16),dict(t='BARLETTA',s=6 if nes else 9,f='pixel' if nes else 'cinzel',a=10 if nes else 15)]
    if p['track']!='none':rows.append(dict(t=TRACKS[p['track']],s=6 if nes else 8.6,f='pixel' if nes else 'cinzel',a=10 if nes else 14))
    if job.get('name'):rows.append(dict(t=job['name'],s=8 if nes else 12,f='pixel' if nes else 'garamond',a=12 if nes else 18))
    for row in rows:
        while row['s']>(6 if nes else 8) and d.textlength(row['t'],font=_font(row['f'],max(1,round(row['s']*k))))/k>232:row['s']-=1 if nes else .2
        row['font']=_font(row['f'],max(1,round(row['s']*k)))
    ornament=p['ornament']!='none';tw=math.ceil(max(d.textlength(row['t'],font=row['font'])/k for row in rows));w=tw+20+(56 if ornament else 0);h=max(sum(row['a'] for row in rows)+16,76 if ornament else 0)
    pos=p['position'] if p['position']!='scene' else ('top-right' if 'right' in zone else 'bottom-left' if zone=='bottom-left' else 'top-left');x=580-w if 'right' in pos else 20;y=380-h if 'bottom' in pos else 20
    def rect(x0,y0,x1,y1,color):d.rectangle((round(x0*k),round(y0*k),round(x1*k)-1,round(y1*k)-1),fill=color)
    rect(x+3,y+3,x+w+3,y+h+3,'#090e1d');rect(x,y,x+w,y+h,colors['edge']);rect(x+2,y+2,x+w-2,y+h-2,colors['bg'])
    for xx in (x+5,x+w-17):
        for yy in (y+5,y+h-6):rect(xx,yy,xx+12,yy+1,colors['accent'])
    if ornament:
        im=sticker_image(p['ornament'],job.get('mode','photo'));factor=min(44/im.width,(h-16)/im.height)*k;im=im.resize((max(1,round(im.width*factor)),max(1,round(im.height*factor))),Image.Resampling.LANCZOS if p['ornament']=='logo_casardi' and not nes else Image.Resampling.NEAREST)
        card.alpha_composite(im,(round((x+9+22)*k-im.width/2),round((y+h/2)*k-im.height/2)))
    yy=y+8
    for row in rows:d.text((round((x+10+(56 if ornament else 0))*k),round(yy*k)),row['t'],font=row['font'],anchor='lt',fill=colors['accent'] if row['t']=='BARLETTA' else colors['ink']);yy+=row['a']
    return dict(x=x,y=y,w=w,h=h)
