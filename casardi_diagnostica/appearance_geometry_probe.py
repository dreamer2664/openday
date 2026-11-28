"""Read-only geometry probe for the outfit-dependent hypothesis.
Not a physical Android/Arena gesture reproduction; never a bugfix assertion.
"""
from pathlib import Path
import hashlib,json,random,sys,time
SOURCE=Path('/home/user/.cache/casardi-v33-fix/source-final')
sys.path.insert(0,str(SOURCE))
from app.catalogue import CHOICES,normalise_character
from app.character import PRESETS,default_spec,render
from app.postcard import crop_sprite,companion_reference_height
from app.layout_edit import actor_geometry,descriptor
from app.animals import ANIMALS,draw_animal
from app.scenes import PHOTO_SCENES

def main():
 start=time.perf_counter();profiles={}
 def add(raw):
  c=normalise_character(raw);profiles[json.dumps(c,sort_keys=True)]=c
 for p in PRESETS:
  for pose in CHOICES['pose']:add({**p['character'],'pose':pose})
 for build in CHOICES['build']:
  for field,values in CHOICES.items():
   for value in values:add({**default_spec(),'build':build,field:value})
 rng=random.Random(202627)
 for _ in range(250):add({k:rng.choice(v) for k,v in CHOICES.items()})
 shapes={}
 for c in profiles.values():
  d=descriptor(crop_sprite(render(c)));shapes.setdefault(tuple(d.values()),d)
 companions=[(None,None,1)]
 for kind,a in ANIMALS.items():
  for variant in a['variants']:
   for pose in a['poses']:
    spec=dict(animal=kind,variant=variant[0],pose=pose);companions.append((spec,descriptor(crop_sprite(draw_animal(kind,variant[0],pose))),companion_reference_height(kind)))
 cases=0;locked=[];min_x=1e9;min_y=1e9
 for person in shapes.values():
  for mode in ('photo','nes'):
   for scene in PHOTO_SCENES:
    for scale in (65,100,135):
     for comp,animal,ref in companions:
      j=dict(mode=mode,scene=scene,companion=comp,composition=dict(actor=dict(x=300,y=320,scale=scale)))
      g=actor_geometry(j,person,animal,ref);sx=576-g['group']['w'];sy=376-g['group']['h'];min_x=min(min_x,sx);min_y=min(min_y,sy);cases+=1
      if sx<=0 or sy<=0:locked.append(dict(person=person,mode=mode,scene=scene,scale=scale,companion=comp,remaining_x=sx,remaining_y=sy))
 result=dict(result='NO ZERO-RANGE GEOMETRY FOUND' if not locked else 'POTENTIAL BOUNDS ISSUE',date='2026-11-27',hypothesis='Some outfit/pose could make the whole movable group too large, leaving no movement range.',normalised_profiles_rendered=len(profiles),unique_person_bounds=len(shapes),companion_variants_and_poses=len(companions)-1,geometry_cases=cases,smallest_remaining_horizontal_units=round(min_x,3),smallest_remaining_vertical_units=round(min_y,3),locked_cases=locked,seconds=round(time.perf_counter()-start,2),scope='Python sprite alpha bounds and canonical geometry, all 12 places/both styles/three sizes, sampled appearance profiles. Not exhaustive outfit combinations, real browser touch, the user original outfit, or physical Android/Arena.',production_source_modified=False,user_reported_bug='STILL OPEN; A1 working with a different outfit does not establish a fix or an outfit cause.')
 Path(__file__).with_name('appearance-geometry-probe.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
