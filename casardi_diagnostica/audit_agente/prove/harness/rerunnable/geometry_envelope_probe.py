"""Conservative geometry envelope, not a sampled-outfit or touch simulation.

The character renderer always starts with mandatory body/head opaque pixels.
Subsequent artist layers use alpha-over, then opaque original equipment; none
can erase an already opaque pixel. Hence the final height is at least the
smallest mandatory body/head opaque height. All rendered pixels are clipped
inside the native 64x64 grid. A descriptor w=64,anchor=32 contains every valid
character's horizontal extents for a given final h and integer sprite scale.
Enumerating all integer heights in that envelope and all validated zooms thus
bounds every valid outfit's clamp range (not event delivery or appearance).
"""
from datetime import datetime as _audit_datetime, timezone as _audit_timezone
from pathlib import Path
import hashlib,json,sys,time
C=Path('/home/user/.cache/casardi-rootcause');R=C/'casardi_postcard';sys.path.insert(0,str(R))
from app import character as ch,layout_edit as edit,postcard as pc
from app.animals import ANIMALS,draw_animal
from app.scenes import PHOTO_SCENES
start=time.time();mandatory=[];m=ch.manifest()
for build,frame in ch.BUILDS.items():
 for face,part in ch.FACE_PARTS.items():
  layers=[*m['parts']['body']['frames'][frame],*m['parts']['head/'+part]['frames'][frame]]
  for pose in range(4):
   opaque=set()
   for layer in layers:
    px=ch.atlas(layer['id'])
    opaque.update((x,y) for y in range(64) for x in range(64) if px[y*256+pose*64+x][3]==255)
   assert opaque
   top=min(y for x,y in opaque);bottom=max(y for x,y in opaque)
   mandatory.append(dict(build=build,face=face,pose=pose,opaque_top=top,opaque_bottom=bottom,min_final_height=bottom-top+1))
min_h=min(t['min_final_height'] for t in mandatory)
companions=[None]
for kind,info in ANIMALS.items():
 reference=pc.companion_reference_height(kind)
 for variant,_,_ in info['variants']:
  for pose in info['poses']:
   spec=dict(animal=kind,variant=variant,pose=pose);desc=edit.descriptor(pc.crop_sprite(draw_animal(**dict(kind=kind,variant=variant,pose=pose))))
   assert desc['h']<=reference
   companions.append((spec,desc,reference))
cases=0;min_x=float('inf');min_y=float('inf');worst_x=None;worst_y=None
for scene in PHOTO_SCENES:
 for mode in ['photo','nes']:
  for zoom in range(65,136):
   for height in range(min_h,65):
    person=dict(w=64,h=height,anchor=32)
    for comp in companions:
     job=dict(scene=scene,mode=mode,composition=dict(actor=dict(x=300,y=350,scale=zoom)))
     if comp:job['companion']=comp[0]
     g=edit.actor_geometry(job,person,comp[1] if comp else None,comp[2] if comp else 1)
     dx=576-g['group']['w'];dy=376-g['group']['h'];cases+=1
     if dx<min_x:min_x=dx;worst_x=dict(scene=scene,mode=mode,zoom=zoom,height=height,companion=comp[0] if comp else None,group=g['group'])
     if dy<min_y:min_y=dy;worst_y=dict(scene=scene,mode=mode,zoom=zoom,height=height,companion=comp[0] if comp else None,group=g['group'])
     assert dx>0 and dy>0,(job,person,g)
report=dict(date=_audit_datetime.now(_audit_timezone.utc).date().isoformat(),result='PASS',scope='Conservative alpha/geometry envelope for every valid character appearance, all native heights allowed by mandatory opaque body/head, all 71 validated scales, all scenes/styles and 42 animal variants/poses plus none. Not a touch/browser/device proof.',assumptions=['Mandatory body/head remain opaque under alpha-over and equipment painting; manually checked renderer algorithm.','All character drawing is clipped to native 64x64; crop anchor is 32-crop_left.','Companion descriptors and reference heights enumerated for every allowed variant/pose.'],mandatory_body_head_cases=len(mandatory),minimum_opaque_height=min_h,character_heights=list(range(min_h,65)),validated_scales=71,companion_states=len(companions),geometry_cases=cases,minimum_horizontal_range=min_x,minimum_vertical_range=min_y,worst_horizontal=worst_x,worst_vertical=worst_y,mandatory_bounds=mandatory,seconds=round(time.time()-start,2),sources={p:hashlib.sha256((R/p).read_bytes()).hexdigest() for p in ['app/character.py','app/cyber_layers.py','app/layout_edit.py','app/animals.py','browser/lpc.js','browser/pixels.js','browser/composition.js','browser/render.js']})
C.joinpath('geometry-envelope-results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['mandatory_bounds','sources']},indent=2))
