"""Compare original Python sprites with the generated JS byte for byte.
Requires Node.js only for maintainer QA, never for opening the HTML.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import time
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT))
from app.catalogue import CHOICES,COLORS,COLOR_FIELDS,normalise_character
from app.character import render
from scripts.lpc_bundle import bundle
from app.character import default_spec
from app.animals import ANIMALS,draw_animal

def main():
    start=time.perf_counter();jobs=[];counts={}
    def add(spec,group,animal=False):
        for mode in ('photo','nes'):
            jobs.append(dict(type='animal' if animal else 'character',spec=spec,mode=mode,group=group))
            counts[group]=counts.get(group,0)+1
    for field,values in CHOICES.items():
        for value in values:add(normalise_character({field:value}),'catalogue_geometry')
    for field,colors in COLOR_FIELDS.items():
        for value in dict.fromkeys(c[0] for c in colors):add(normalise_character({field:value}),'palette_options')
    rng=random.Random(202627)
    for _ in range(200):
        spec={k:rng.choice(v) for k,v in CHOICES.items()}
        spec.update({k:rng.choice(v)[0] for k,v in COLOR_FIELDS.items()})
        add(normalise_character(spec),'joint_random_profiles')
    for kind,info in ANIMALS.items():
        for variant in info['variants']:
            for pose in info['poses']:add(dict(animal=kind,variant=variant[0],pose=pose),'all_animal_variants_poses',True)
    for j in jobs:
        spec=j['spec'];c=render(spec,j['mode']) if j['type']=='character' else draw_animal(spec['animal'],spec['variant'],spec['pose'],j['mode'])
        j['sha256']=hashlib.sha256(bytes(v for p in c.buf for v in p)).hexdigest()
    lpc,_=bundle()
    packed=json.dumps(dict(palette=COLORS,lpc=lpc,defaults=default_spec(),jobs=jobs),ensure_ascii=False).encode()
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'jobs.json';p.write_bytes(packed)
        code="""
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const data=JSON.parse(fs.readFileSync(process.argv[1]));
const ctx={PORTABLE:{palette:data.palette,lpc:data.lpc,catalogue:{defaults:{character:data.defaults}}},console,atob:s=>Buffer.from(s,'base64').toString('binary')};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),ctx);let count=0;
for(const j of data.jobs){const s=j.spec,c=j.type==='character'?ctx.CasardiSprites.render(s,j.mode):ctx.CasardiSprites.draw_animal(s.animal,s.variant,s.pose,j.mode);const hash=crypto.createHash('sha256').update(Buffer.from(c.buf.flat())).digest('hex');if(hash!==j.sha256)throw new Error('Pixel mismatch at '+count+' '+j.group);count++;}
console.log(JSON.stringify({matched:count,node:process.version}));
"""
        run=subprocess.run(['node','-e',code,str(p),str(ROOT/'browser/sprites.js')],check=True,capture_output=True,text=True)
        result=json.loads(run.stdout)
    assert result['matched']==len(jobs)
    report=dict(date='2026-11-27',result='PASS',comparisons=len(jobs),mismatches=0,
        groups=counts,seconds=round(time.perf_counter()-start,2),node=result['node'],
        input_manifest_sha256=hashlib.sha256(packed).hexdigest(),
        scope='Exact raw RGBA equality for sprites, not a claim of pixel-identical Canvas/Pillow whole postcards.',
        source={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['app/character.py','app/cyber_layers.py','app/animals.py','browser/lpc.js','browser/pixels.js','browser/sprites.js','assets/characters/lpc/manifest.json']})
    (ROOT/'docs/test-results/browser-sprite-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
