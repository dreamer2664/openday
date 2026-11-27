"""Geometric layout audit (not an image-quality or depth-estimation proof).

12 body/pose profiles × 42 animal variant/pose pairs × 6 scenes × 2 styles.
Checks actual integer-scaled alpha bounds and bottom-row foot separation.
"""
from pathlib import Path
import itertools
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
import numpy as np
from app.character import BUILDS,POSES,render
from app.animals import ANIMALS,draw_animal
from app.catalogue import normalise_character
from app.postcard import crop_sprite,companion_reference_height,COMPANION_RATIO
from app.scenes import PHOTO_SCENES,NES_SCENES


def bbox(sprite,cx,ground,scale):
    w,h=sprite.width*scale,sprite.height*scale
    x=round(cx-sprite.info.get("_anchor_x",sprite.width/2)*scale);y=round(ground-h)
    return x,y,x+w,y+h

def feet(sprite,cx,scale,flip=False):
    a=np.asarray(sprite.getchannel('A'))
    if flip:a=a[:,::-1]
    xs=np.where(a[-2:].any(axis=0))[0]
    x=round(cx-sprite.info.get("_anchor_x",sprite.width/2)*scale)
    return x+int(xs.min())*scale,x+(int(xs.max())+1)*scale

if __name__=='__main__':
    chars=[(build,pose,crop_sprite(render(normalise_character(dict(build=build,pose=pose)))))
            for build,pose in itertools.product(BUILDS,POSES)]
    animals=[]
    for kind,info in ANIMALS.items():
        for variant,pose in itertools.product(info['variants'],info['poses']):
            animals.append((kind,variant[0],pose,crop_sprite(draw_animal(kind,variant[0],pose))))
    failures=[];foot_overlaps=[];count=0
    for mode,scenes in [('photo',PHOTO_SCENES),('nes',NES_SCENES)]:
        width,height,margin=(3000,2000,54) if mode=='photo' else (600,400,8)
        for sid,layout in scenes.items():
            for build,pose,char in chars:
                cs=max(1,round(layout['char']['h']/char.height))
                cx=layout['char']['x'];gy=layout['ground_y'];charbox=bbox(char,cx,gy,cs)
                for kind,variant,animal_pose,animal in animals:
                    scale=max(1,round(char.height*cs*COMPANION_RATIO[kind]/companion_reference_height(kind)))
                    companion=layout['companion'] if mode=='photo' else layout['comp']
                    animalbox=bbox(animal,companion['x'],gy,scale)
                    for role,box in [('character',charbox),('companion',animalbox)]:
                        if box[0]<margin or box[1]<margin or box[2]>width-margin or box[3]>height-margin:
                            failures.append(dict(mode=mode,scene=sid,build=build,pose=pose,animal=kind,animal_pose=animal_pose,role=role))
                    cfeet=feet(char,cx,cs);afeet=feet(animal,companion['x'],scale,companion.get('flip',False))
                    if max(cfeet[0],afeet[0])<min(cfeet[1],afeet[1]):
                        foot_overlaps.append(dict(mode=mode,scene=sid,build=build,pose=pose,animal=kind,animal_pose=animal_pose))
                    count+=1
    report=dict(date='2026-11-27',cases=count,outside_inner_frame=len(failures),foot_span_overlaps=len(foot_overlaps),
        failure_examples=failures[:10],foot_overlap_examples=foot_overlaps[:10],
        limitation='Geometry only; cloth/hair extremes are in the separate sprite audit. Does not infer floor perspective or real-photo obstacles.')
    Path('docs/test-results/layout-audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    assert not failures and not foot_overlaps,'Review composition bounds/foot collisions.'
