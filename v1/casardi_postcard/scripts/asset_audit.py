"""Bounded revised-LPC compatibility audit, provenance hashes and review sheets.

Renderability/alpha/bounds checks do not prove artistic quality or every joint
combination. Visual sheets are genuine rendered pixels, enlarged by NN only.
"""
from pathlib import Path
import hashlib
import itertools
import json
import sys
import time
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app import character as ch
from app.animals import ANIMALS,draw_animal
from app.catalogue import normalise_character
from app.imgutil import to_pil

OUT=ROOT/'docs/qa'

def main():
 OUT.mkdir(exist_ok=True);started=time.perf_counter();counts={};touch=[]
 def check(spec,mode):
  c=ch.render(normalise_character(spec),mode);assert {p[3] for p in c.buf}<={0,255};a,b,x,y=c.bounds();assert x>a and y>b
  if a<=0 or b<=0 or x>=c.w-1 or y>=c.h-1:touch.append(dict(spec=spec,style=mode,bounds=[a,b,x,y]))
  return c
 for mode in ('photo','nes'):
  groups={
   'clothes_build_pose':(dict(build=a,top=b,bottom=c,pose=d) for a,b,c,d in itertools.product(ch.BUILDS,ch.TOPS,ch.BOTTOMS,ch.POSES)),
   'hair_hat_pose':(dict(hair=a,hat=b,pose=c) for a,b,c in itertools.product(ch.HAIR_STYLES,ch.HATS,ch.POSES)),
   'face_traits_expression':(dict(face=a,expression=b,eye_shape=c,brows=d,nose=e,mouth=f,hair='calvo') for a,b,c,d,e,f in itertools.product(ch.FACES,ch.EXPRESSIONS,ch.EYE_SHAPES,ch.BROWS,ch.NOSES,ch.MOUTHS)),
   'accessory_held_pose':(dict(top=a,accessory=b,held=c,pose=d,build='medio') for a,b,c,d in itertools.product(ch.TOPS,ch.ACCESSORIES,ch.HELD,ch.POSES)),
  }
  for group,cases in groups.items():
   n=0
   for spec in cases:check(spec,mode);n+=1
   counts[mode+'_'+group]=n
 n=0
 for mode in ('photo','nes'):
  for kind,a in ANIMALS.items():
   for variant,pose in itertools.product(a['variants'],a['poses']):
    c=draw_animal(kind,variant[0],pose,mode);assert {p[3] for p in c.buf}<={0,255};x,y,xx,yy=c.bounds();assert x>0 and y>0 and xx<73 and yy<99;n+=1
 counts['animal_variant_pose_style']=n
 m=ch.manifest()
 for group in ('sources','definitions'):
  for name,info in m[group].items():
   raw=(ch.ASSETS/info['local']).read_bytes();assert hashlib.sha256(raw).hexdigest()==info['sha256'],name
   if group=='sources':
    with Image.open(ch.ASSETS/info['local']) as im:im.verify()
 for ident,info in m['atlases'].items():
  assert hashlib.sha256((ch.ASSETS/info['path']).read_bytes()).hexdigest()==info['sha256']
 for part in m['parts'].values():
  assert part['credits'] and all(c['authors'] and c['licenses'] for c in part['credits'])
 profiles=[{**ch.default_spec(),**p['character']} for p in ch.PRESETS]
 for i in range(32):
  spec={**ch.default_spec(),**dict(build=list(ch.BUILDS)[i%3],top=ch.TOPS[i%10],bottom=ch.BOTTOMS[i%6],pose=ch.POSES[i%4],hair=ch.HAIR_STYLES[i%15],hat=ch.HATS[(i//4)%6],expression=ch.EXPRESSIONS[i%6],skin=['chiara','bruna','ebano','ambra','olivastra','dorata','porcellana'][i%7],top_color=['antracite','bordeaux','bianco','oliva','navy','magenta'][i%6],inner_color=['ciano','senape','magenta'][i%3],hair_color=['nero','ramato','ciano','platino','castano','viola'][i%6])};profiles.append(normalise_character(spec))
 sheet=Image.new('RGB',(6*256,6*286+100),'#eae6da');d=ImageDraw.Draw(sheet)
 for i,s in enumerate(profiles):
  x=i%6*256;y=i//6*286;im=to_pil(ch.render(s));big=im.resize((256,256),Image.Resampling.NEAREST);sheet.paste(big,(x,y),big);d.text((x+8,y+257),str(i+1)+' · '+s['top']+' / '+s['pose'],fill='#243844')
 # Native 1× silhouettes as a separate strip, not an upscaled claim.
 for i,s in enumerate(profiles[:20]):
  im=to_pil(ch.render(s));sheet.paste(im,(i*72,6*286+20),im)
 sheet.save(OUT/'01_personaggi.png',optimize=True)
 faces=Image.new('RGB',(6*224,4*224),'#eae6da');d=ImageDraw.Draw(faces)
 for row,face in enumerate(ch.FACES):
  for col,expr in enumerate(ch.EXPRESSIONS):
   s={**ch.default_spec(),'face':face,'expression':expr,'hair':'calvo','skin':'ambra'};im=to_pil(ch.render(s)).crop((17,8,48,36)).resize((217,196),Image.Resampling.NEAREST);faces.paste(im,(col*224,row*224),im);d.text((col*224+4,row*224+198),face+' / '+expr,fill='#243844')
 faces.save(OUT/'02_espressioni.png',optimize=True)
 animals=Image.new('RGB',(7*220,6*214),'#eae6da');d=ImageDraw.Draw(animals);i=0
 for kind,a in ANIMALS.items():
  for variant,pose in itertools.product(a['variants'],a['poses']):
   im=to_pil(draw_animal(kind,variant[0],pose));im=im.crop(im.getbbox());sc=max(1,min(200//im.width,173//im.height));im=im.resize((im.width*sc,im.height*sc),Image.Resampling.NEAREST);x=i%7*220;y=i//7*214;animals.paste(im,(x+(220-im.width)//2,y+178-im.height),im);d.text((x+5,y+182),kind+' / '+variant[0],fill='#243844');d.text((x+5,y+197),pose,fill='#243844');i+=1
 animals.save(OUT/'03_companion.png',optimize=True)
 layers=[]
 for top,held in itertools.product(ch.TOPS,ch.HELD[1:]):layers.append(normalise_character(dict(top=top,held=held,build='medio',pose='libro',inner_color='ciano')))
 for i,hair in enumerate(ch.HAIR_STYLES):layers.append(normalise_character(dict(hair=hair,hat=ch.HATS[i%6],glasses=['visore','tondi','none'][i%3],accessory=ch.ACCESSORIES[i%6],beard=ch.BEARDS[i%4],pose=ch.POSES[i%4],hair_color='ramato')))
 rows=(len(layers)+7)//8;overlap=Image.new('RGB',(8*224,rows*244),'#eae6da');d=ImageDraw.Draw(overlap)
 for i,s in enumerate(layers):
  im=to_pil(ch.render(s)).resize((224,224),Image.Resampling.NEAREST);x=i%8*224;y=i//8*244;overlap.paste(im,(x,y),im);d.text((x+4,y+224),s['top']+' / '+s['held'],fill='#243844')
 overlap.save(OUT/'04_sovrapposizioni.png',optimize=True)
 report=dict(result='PASS' if not touch else 'FAIL',date='2026-11-27',upstream_commit=m['commit'],cases=counts,total=sum(counts.values()),boundary_touches=len(touch),boundary_examples=touch[:8],
             licensed_parts=len(m['parts']),source_pngs_sha256_verified=len(m['sources']),definitions_sha256_verified=len(m['definitions']),pose_atlases_sha256_verified=len(m['atlases']),
             seconds=round(time.perf_counter()-started,2),limitation='Renderability, alpha, canvas bounds and recorded hashes only. Incompatible options are normalized/disabled, not claimed as native fits. Visual review covers the delivered sheets, not every Cartesian combination.')
 (ROOT/'docs/test-results/asset-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2));assert not touch,'Sprite touches outer edge'

if __name__=='__main__':main()
